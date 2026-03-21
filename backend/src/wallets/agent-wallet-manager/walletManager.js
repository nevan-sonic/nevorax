import {
  getAddress,
  getBalance,
  sendTransaction,
  signMessage as signMessageWdk,
  sendTokenTransaction,
  getTokenBalance,
} from "../transaction-manager/transactionManager.js";
import {
  getAgent,
  getAllAgents,
  CORE_AGENT_IDS,
} from "../../marketplace/agent-registry/agentRegistry.js";
import { USDT_CONFIG } from "../../config/usdtConfig.js";

export const AGENT_NAMES = CORE_AGENT_IDS;

const DEFAULT_CHAIN = "ethereum";

const SPENDING_LIMITS = {
  OrchestratorAgent: 10000000000000000000n, // 10 ETH
  DataAgent: 1000000000000000000n, // 1 ETH
  SentimentAgent: 1000000000000000000n,
  ExecutionAgent: 1000000000000000000n,
  AnalysisAgent: 1000000000000000000n,
  StrategyAgent: 1000000000000000000n,
  ReportAgent: 1000000000000000000n,
};

const USDT_SPENDING_LIMITS = {
  OrchestratorAgent: 10000n * 10n ** 6n, // 10k USDT
  DataAgent: 1000n * 10n ** 6n, // 1k USDT
  SentimentAgent: 1000n * 10n ** 6n,
  ExecutionAgent: 1000n * 10n ** 6n,
  AnalysisAgent: 1000n * 10n ** 6n,
  StrategyAgent: 1000n * 10n ** 6n,
  ReportAgent: 1000n * 10n ** 6n,
};

/**
 * Resolve the HD account index assigned to an agent.
 * @param {string} agentName
 * @returns {number}
 */
export function getAgentAccountIndex(agentName) {
  const agent = getAgent(agentName);
  if (agent && agent.index !== undefined) {
    return agent.index;
  }

  // Fallback or dynamic indexing for spawned agents
  const allAgents = getAllAgents();
  const agentIndexInRegistry = allAgents.findIndex(
    (a) => a.agentId === agentName,
  );

  if (agentIndexInRegistry === -1) {
    throw new Error(`Unknown agent: ${agentName}`);
  }

  // Use the position in the registry as the HD index for simplicity if not explicitly set
  return agentIndexInRegistry;
}

/**
 * Get the EVM address for an agent's wallet.
 * @param {string} agentName
 * @returns {Promise<string>}
 */
export async function getAgentAddress(agentName) {
  const index = getAgentAccountIndex(agentName);
  try {
    return await getAddress(DEFAULT_CHAIN, index);
  } catch (error) {
    console.error(
      `[NevoraX][WalletRegistry] Failed to get address for agent=${agentName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get the native balance (wei, as a string) for an agent's wallet.
 * @param {string} agentName
 * @returns {Promise<string>}
 */
export async function getAgentBalance(agentName) {
  const index = getAgentAccountIndex(agentName);
  try {
    return await getBalance(DEFAULT_CHAIN, index);
  } catch (error) {
    console.error(
      `[NevoraX][WalletRegistry] Failed to get balance for agent=${agentName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send a transaction from an agent's wallet.
 * @param {string} agentName
 * @param {string} toAddress
 * @param {string | bigint} amount - Amount in wei (string or bigint)
 * @returns {Promise<object>}
 */
export async function transferFromAgent(agentName, toAddress, amount) {
  const index = getAgentAccountIndex(agentName);
  const amountWei = BigInt(amount);

  const limit = SPENDING_LIMITS[agentName] || 500000000000000000n; // default 0.5 ETH
  if (amountWei > limit) {
    throw new Error(
      `[WalletManager] Spending limit exceeded for ${agentName}: ${amountWei} > ${limit}`,
    );
  }

  try {
    return await sendTransaction(DEFAULT_CHAIN, index, toAddress, amountWei);
  } catch (error) {
    console.error(
      `[NevoraX][WalletRegistry] Failed to transfer from agent=${agentName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Execute a native token payment from an agent's wallet.
 * @param {string} agentName
 * @param {string} toAddress
 * @param {string | bigint} amount - Amount in wei
 * @returns {Promise<{fromAgent: string, to: string, amount: string | bigint, txHash: string}>}
 */
export async function sendFromAgent(agentName, toAddress, amount) {
  const index = getAgentAccountIndex(agentName);
  const amountWei = BigInt(amount);

  const limit = SPENDING_LIMITS[agentName] || 500000000000000000n;
  if (amountWei > limit) {
    throw new Error(
      `[WalletManager] Spending limit exceeded for ${agentName}: ${amountWei} > ${limit}`,
    );
  }

  try {
    const result = await sendTransaction(
      DEFAULT_CHAIN,
      index,
      toAddress,
      amountWei,
    );

    const payload = {
      fromAgent: agentName,
      to: toAddress,
      amount,
      txHash: result?.hash,
    };

    console.log("Agent Payment Executed");
    console.log(`From: ${payload.fromAgent}`);
    console.log(`To: ${payload.to}`);
    console.log(`Amount: ${payload.amount}`);
    console.log(`TxHash: ${payload.txHash}`);

    return payload;
  } catch (error) {
    console.error(
      `[NevoraX][WalletRegistry] Failed to send payment from agent=${agentName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Get the token balance (USDT) for an agent's wallet.
 * @param {string} agentName
 * @returns {Promise<string>}
 */
export async function getAgentTokenBalance(agentName) {
  const index = getAgentAccountIndex(agentName);
  try {
    return await getTokenBalance(
      DEFAULT_CHAIN,
      index,
      USDT_CONFIG.SEPOLIA_ADDRESS,
    );
  } catch (error) {
    console.error(
      `[NevoraX][WalletRegistry] Failed to get token balance for ${agentName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Send tokens from an agent's wallet.
 */
export async function sendTokenFromAgent(agentName, toAddress, amountUnits) {
  const index = getAgentAccountIndex(agentName);
  const amount = BigInt(amountUnits);

  const limit = USDT_SPENDING_LIMITS[agentName] || 500n * 10n ** 6n;
  if (amount > limit) {
    throw new Error(
      `[WalletManager] Token spending limit exceeded for ${agentName}`,
    );
  }

  try {
    const result = await sendTokenTransaction(
      DEFAULT_CHAIN,
      index,
      USDT_CONFIG.SEPOLIA_ADDRESS,
      toAddress,
      amount,
    );

    return {
      fromAgent: agentName,
      to: toAddress,
      amount: amount.toString(),
      currency: "USDT",
      txHash: result?.hash,
    };
  } catch (error) {
    console.error(
      `[NevoraX][WalletRegistry] Token transfer failed for ${agentName}:`,
      error,
    );
    throw error;
  }
}

/**
 * Sign a message from an agent's wallet.
 * @param {string} agentName
 * @param {string} message
 * @returns {Promise<string>}
 */
export async function signFromAgent(agentName, message) {
  console.log(`[WalletManager] signFromAgent for ${agentName}`);
  const index = getAgentAccountIndex(agentName);
  try {
    return await signMessageWdk(DEFAULT_CHAIN, index, message);
  } catch (error) {
    console.error(
      `[NevoraX][WalletRegistry] Failed to sign from agent=${agentName}:`,
      error,
    );
    throw error;
  }
}
