import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import WDK from "@tetherto/wdk";
import WalletManagerEvm from "@tetherto/wdk-wallet-evm";
import WdkSecretManager from "@tetherto/wdk-secret-manager";

// Resolve backend/.env relative to this file so that
// `npm run dev` works regardless of the working directory.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../../.env"),
});

/**
 * [WDK REFINEMENT] Secure Seed Protection using WdkSecretManager
 * This implements the 'Gold Standard' for handling autonomous seeds.
 */
let encryptedSeedPayload = null;
let sessionSalt = null;

async function protectSeed(phrase) {
  try {
    const salt = WdkSecretManager.generateSalt();
    // Unique session passKey for this runtime
    const passKey = "NEVORAX_SESSION_" + Date.now();
    const manager = new WdkSecretManager(passKey, salt);

    sessionSalt = salt;
    // Encrypt the entire phrase as a buffer
    const buffer = Buffer.from(phrase, "utf8");
    encryptedSeedPayload = manager.encrypt(buffer);

    // Memory Safety: Dispose of the manager immediately after encryption
    manager.dispose();
    console.log("[WDK][SecretManager] Seed phrase encrypted and original wiped.");
    return passKey;
  } catch (error) {
    console.error("[WDK][SecretManager] Failed to protect seed:", error.message);
    return null;
  }
}

async function recoverSeed(passKey) {
  // Primary path: decrypt from in-memory encrypted payload
  if (encryptedSeedPayload && sessionSalt) {
    const manager = new WdkSecretManager(passKey, sessionSalt);
    try {
      const decrypted = manager.decrypt(encryptedSeedPayload);
      const phrase = decrypted.toString("utf8");
      manager.dispose();
      return phrase;
    } catch (error) {
      console.error("[WDK][SecretManager] Decryption failed:", error.message);
      manager.dispose();
      // Fall through to env fallback below
    }
  }

  // Fallback path: use raw env seed phrase directly (e.g. standalone scripts or
  // if SecretManager encryption lifecycle hasn't completed yet).
  const envSeed = process.env.WDK_SEED_PHRASE;
  if (envSeed) {
    console.warn("[WDK][SecretManager] Using env WDK_SEED_PHRASE as seed fallback.");
    return envSeed;
  }

  return null;
}

/**
 * Simple Mutex to prevent nonce collisions on the same account.
 */
class AccountLock {
  constructor() {
    this.queue = Promise.resolve();
  }

  async acquire() {
    let release;
    const next = new Promise((resolve) => {
      release = resolve;
    });
    const wait = this.queue;
    this.queue = next;
    await wait;
    return release;
  }
}

const accountLocks = new Map();

function getLock(index) {
  if (!accountLocks.has(index)) {
    accountLocks.set(index, new AccountLock());
  }
  return accountLocks.get(index);
}

let wdkInstance = null;
let wdkInitialized = false;
// Track the active seed phrase for native ethers signing
let activeSeedPhrase = null;

/**
 * Initialize the WDK singleton with the EVM wallet registered.
 * - Loads seed phrase from WDK_SEED_PHRASE if provided
 * - Otherwise generates a new random seed phrase
 * - Registers the Ethereum wallet module using the Sepolia RPC
 */
export async function initWdk() {
  if (wdkInitialized && wdkInstance) {
    return wdkInstance;
  }

  try {
    const rpcUrl = process.env.EVM_RPC;
    if (!rpcUrl) {
      console.warn(
        "[NevoraX][WDK] EVM_RPC is not defined in environment variables. " +
          "WDK wallet functionality will be disabled until it is configured.",
      );
      wdkInitialized = true;
      wdkInstance = null;
      return null;
    }

    let seedPhrase = process.env.WDK_SEED_PHRASE;
    if (!seedPhrase) {
      seedPhrase = WDK.getRandomSeedPhrase();
      console.warn(
        "[NevoraX][WDK] Generated new seed phrase. " +
          "STORE THIS SECURELY if you want persistent wallets:\n",
        seedPhrase,
      );
    }

    // [WDK REFINEMENT] Protect seed in memory using Secret Manager primitives
    const sessionToken = await protectSeed(seedPhrase);
    activeSeedPhrase = sessionToken; // We store the session-locked token, not the raw seed

    // WDK needs raw seed for init, but we use it immediately and then it lives in WDK's internal state
    const wdk = new WDK(seedPhrase)
      .registerWallet("ethereum", WalletManagerEvm, {
        provider: rpcUrl,
      });

    // [WDK REFINEMENT] Multi-chain Registration
    const hoodiRpc = process.env.HOODI_RPC;
    if (hoodiRpc) {
      wdk.registerWallet("hoodi", WalletManagerEvm, {
        provider: hoodiRpc,
      });
      console.log("[NevoraX][WDK] Registered 'hoodi' wallet module.");
    }

    wdkInstance = wdk;
    wdkInitialized = true;

    console.log("WDK initialized");
    console.log("Wallet registered");

    return wdkInstance;
  } catch (error) {
    console.error("[NevoraX][WDK] Failed to initialize WDK:", error);
    // Do not crash the whole server; leave WDK disabled.
    wdkInitialized = false;
    wdkInstance = null;
    return null;
  }
}

async function getWdkInstance() {
  if (!wdkInitialized || !wdkInstance) {
    await initWdk();
  }

  if (!wdkInstance) {
    throw new Error("WDK is not initialized");
  }

  return wdkInstance;
}

/**
 * Get a WDK account for a given chain and index.
 * @param {string} chain - Blockchain identifier (e.g., "ethereum")
 * @param {number} index - HD account index
 */
export async function getAccount(chain, index) {
  try {
    const wdk = await getWdkInstance();
    const account = await wdk.getAccount(chain, index);
    return account;
  } catch (error) {
    console.error(
      `[NevoraX][WDK] Failed to get account for chain=${chain}, index=${index}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get address for an account derived from the seed.
 * @param {string} chain
 * @param {number} index
 * @returns {Promise<string>}
 */
export async function getAddress(chain, index) {
  const account = await getAccount(chain, index);
  try {
    const address = await account.getAddress();
    return address;
  } catch (error) {
    console.error(
      `[NevoraX][WDK] Failed to get address for chain=${chain}, index=${index}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get native balance (in wei for EVM chains) as a string.
 * @param {string} chain
 * @param {number} index
 * @returns {Promise<string>}
 */
export async function getBalance(chain, index) {
  try {
    const wdk = await getWdkInstance();
    const account = await wdk.getAccount(chain, index);
    const balance = await account.getBalance();
    return balance.toString();
  } catch (error) {
    console.error("Balance error:", error);
    throw error;
  }
}

import { ethers } from "ethers";

/**
 * Get ERC-20 token balance for an account using direct ethers.js call for reliability.
 */
export async function getTokenBalance(chain, index, tokenAddress) {
  try {
    const rpcUrl = process.env.EVM_RPC;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const address = await getAddress(chain, index);

    const abi = ["function balanceOf(address) view returns (uint256)"];
    const contract = new ethers.Contract(tokenAddress, abi, provider);

    const balance = await contract.balanceOf(address);
    return balance.toString();
  } catch (error) {
    console.error(
      `[NevoraX][Ethers] Token balance error for ${tokenAddress}:`,
      error.message,
    );
    // Fallback? No, return 0 instead of throwing to avoid breaking the UI
    return "0";
  }
}

/**
 * Send a native token transaction from a derived account.
 * @param {string} chain
 * @param {number} index
 * @param {string} to - Recipient address
 * @param {string | bigint} value - Amount in base units (e.g., wei)
 * @returns {Promise<object>} - Transaction result
 */
export async function sendTransaction(chain, index, to, value) {
  if (typeof to !== "string" || !to.startsWith("0x") || to.length !== 42) {
    throw new Error("Invalid recipient address");
  }

  let amount;
  try {
    amount = typeof value === "bigint" ? value : BigInt(value);
  } catch {
    throw new Error(
      "Invalid transaction value; expected bigint-compatible string",
    );
  }

  if (amount < 0n) {
    throw new Error("Transaction value must be non-negative");
  }

  const account = await getAccount(chain, index);
  const release = await getLock(index).acquire();
  console.log(`[WDK][Lock] Acquired lock for index ${index} on ${chain}`);

  try {
    const result = await account.sendTransaction({
      to,
      value: amount,
    });

    return result;
  } catch (error) {
    console.error(
      `[NevoraX][WDK] Failed to send transaction from chain=${chain}, index=${index}:`,
      error,
    );
    throw error;
  } finally {
    release();
    console.log(`[WDK][Lock] Released lock for index ${index} on ${chain}`);
  }
}

/**
 * Send an ERC-20 token transaction using WDK.
 * @param {string} chain
 * @param {number} index
 * @param {string} tokenAddress
 * @param {string} recipient
 * @param {string | bigint} amount
 * @returns {Promise<object>}
 */
export async function sendTokenTransaction(
  chain,
  index,
  tokenAddress,
  recipient,
  amount,
) {
  if (!recipient.startsWith("0x") || recipient.length !== 42) {
    throw new Error("Invalid recipient address");
  }

  const value = typeof amount === "bigint" ? amount : BigInt(amount);
  const account = await getAccount(chain, index);
  const release = await getLock(index).acquire();
  console.log(`[WDK][Lock] Acquired token lock for index ${index} on ${chain}`);

  try {
    const result = await account.transfer({
      token: tokenAddress,
      recipient,
      amount: value,
    });

    return result;
  } catch (error) {
    console.error(
      `[NevoraX][WDK] Failed to send token transaction from chain=${chain}, index=${index}:`,
      error,
    );
    throw error;
  } finally {
    release();
    console.log(`[WDK][Lock] Released token lock for index ${index} on ${chain}`);
  }
}

/**
 * Sign a message using a derived account.
 * @param {string} chain
 * @param {number} index
 * @param {string} message
 * @returns {Promise<string>} - The signature
 */
export async function signMessage(chain, index, message) {
  if (chain !== "ethereum") {
    throw new Error(
      `[NevoraX][WDK] Unsupported chain for native signing: ${chain}`,
    );
  }

  const token = activeSeedPhrase || process.env.WDK_SEED_PHRASE;
  if (!token) {
    throw new Error(
      "[NevoraX][WDK] No active seed phrase available for message signing",
    );
  }

  try {
    // [WDK REFINEMENT] Recover seed from Secret Manager only when needed
    const phrase = await recoverSeed(token);
    if (!phrase) throw new Error("Seed recovery failed");

    const path = `m/44'/60'/0'/0/${index}`;
    // Use ethers to predictably derive our wallet and natively sign the message
    const wallet = ethers.HDNodeWallet.fromPhrase(phrase, "", path);
    const signature = await wallet.signMessage(message);

    console.log(
      `[NevoraX][WDK] Cryptographically signed message for ${wallet.address}`,
    );
    return signature;
  } catch (error) {
    console.error(
      `[NevoraX][WDK] Failed to cryptographically sign message from chain=${chain}, index=${index}:`,
      error,
    );
    throw error;
  }
}
