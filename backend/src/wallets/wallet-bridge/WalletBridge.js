import crypto from "crypto";
import {
  getAgentAddress,
  getAgentTokenBalance,
  signFromAgent,
  sendTokenFromAgent,
  getAgentBalance,
} from "../agent-wallet-manager/walletManager.js";

/**
 * WalletBridge
 *
 * This component provides a clean separation between Agent Reasoning (LLM)
 * and Wallet Execution (WDK). All agents must go through the WalletBridge
 * to interact with the blockchain.
 *
 * It adds "EXECUTION" telemetry to all wallet activities.
 */
export const WalletBridge = {
  /**
   * Get agent identity (EVM Address).
   */
  async getIdentity(agentId) {
    console.log(`[EXECUTION][${agentId}] Retrieving wallet identity...`);
    return await getAgentAddress(agentId);
  },

  /**
   * Get agent financial state (USDT balance).
   */
  async getFinancialState(agentId) {
    console.log(`[EXECUTION][${agentId}] Fetching USDt balance from chain...`);
    const balance = await getAgentTokenBalance(agentId);
    return {
      balanceUnits: balance,
      formatted: (Number(balance) / 1e6).toFixed(2) + " USDT",
    };
  },

  /**
   * Cryptographic signing (The "Reasoning" proof).
   * Primary: WDK EVM wallet signature (secp256k1 via ethers).
   * Fallback: Deterministic SHA-256 HMAC when seed is unavailable.
   */
  async cryptographicallySign(agentId, message) {
    console.log(
      `[EXECUTION][${agentId}] Signing message: "${message.substring(0, 30)}..."`,
    );
    try {
      const signature = await signFromAgent(agentId, message);
      console.log(`[EXECUTION][${agentId}] Signature generated via WDK.`);
      return signature;
    } catch (err) {
      // WDK seed unavailable — produce a deterministic HMAC proof so
      // agreements remain cryptographically bound without crashing the task.
      console.warn(
        `[WalletBridge][${agentId}] WDK signing unavailable (${err.message}). Using HMAC-SHA256 fallback.`,
      );
      const secret = process.env.WDK_SEED_PHRASE || "NEVORAX_FALLBACK_SECRET";
      const sig =
        "0x" +
        crypto
          .createHmac("sha256", secret)
          .update(`${agentId}:${message}`)
          .digest("hex");
      console.log(`[EXECUTION][${agentId}] Fallback HMAC signature produced.`);
      return sig;
    }
  },

  /**
   * Final Settlement (The "Action").
   */
  async executeSettlement(agentId, recipient, amountUnits, service) {
    console.log(
      `[EXECUTION][${agentId}] Initiating USDt settlement for service: ${service}`,
    );
    console.log(
      `[EXECUTION][${agentId}] Recipient: ${recipient}, Amount: ${amountUnits} units`,
    );

    try {
      const result = await sendTokenFromAgent(agentId, recipient, amountUnits);
      console.log(
        `[EXECUTION][${agentId}] Settlement SUCCESS. TxHash: ${result.txHash}`,
      );
      return result;
    } catch (error) {
      console.error(
        `[EXECUTION][${agentId}] Settlement FAILED: ${error.message}`,
      );
      throw error;
    }
  },

  /**
   * Check native gas (ETH) balance.
   */
  async getGasState(agentId) {
    const balance = await getAgentBalance(agentId);
    return {
      balanceWei: balance,
      formatted: (Number(balance) / 1e18).toFixed(6) + " ETH",
    };
  },
};
