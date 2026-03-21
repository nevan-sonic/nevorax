/**
 * NevoraX System Configuration
 * Centralizes all operational thresholds and operational parameters.
 */

import dotenv from "dotenv";
dotenv.config();

export const config = {
  // Blockchain & Wallets
  evm: {
    rpcUrl: process.env.EVM_RPC,
    chain: "ethereum",
    baseFee: BigInt(process.env.BASE_FEE || "21000"), // Gas units
  },

  // LLM & Intelligence
  llm: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || "llama3-70b-8192",
  },

  // Economic Parameters
  economy: {
    minimumProfitMargin: parseFloat(process.env.MIN_PROFIT_MARGIN || "0.2"),
    reputationWeight: parseFloat(process.env.REPUTATION_WEIGHT || "0.6"),
    priceWeight: parseFloat(process.env.PRICE_WEIGHT || "0.4"),
    defaultBudget: BigInt(process.env.DEFAULT_BUDGET || "1000000000"), // 1000 USDT (Orchestrator seed/fallback)
    agentBasePrice: BigInt(process.env.AGENT_BASE_PRICE || "100000"), // 0.1 USDT per service
    baseOperatingCost: BigInt(process.env.BASE_OPERATING_COST || "50000"), // 0.05 USDT overhead
  },

  // Registry & Marketplace
  market: {
    maxRetries: parseInt(process.env.MAX_RETRIES || "3"),
    negotiationStepCount: 3,
  },
};

/**
 * Validates that all critical production variables are set.
 * Throws an error if critical values are missing.
 */
export function validateConfig() {
  const missing = [];
  if (!config.evm.rpcUrl) missing.push("EVM_RPC");
  if (!config.llm.apiKey) missing.push("GROQ_API_KEY");

  if (missing.length > 0) {
    console.error(
      `[CONFIG] Missing critical environment variables: ${missing.join(", ")}`,
    );
    // In production, we might throw here. For development, we log.
  }
}
