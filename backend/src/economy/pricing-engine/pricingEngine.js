/**
 * Pricing Engine
 * Calculates service prices based on base price, reputation, and demand.
 * Merged from AgentStrategyEngine and DynamicPricingEngine.
 */

import { ReputationEngine } from "../reputation-engine/reputationEngine.js";
import { AgentProfitEngine } from "./financeEngine.js";
import { getServiceStats } from "../../marketplace/matching-engine/marketDemandEngine.js";
import { config } from "../../utils/config/config.js";
import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";

const strategyRecords = new Map();

/**
 * Get or initialize strategy record.
 */
function getStrategy(agentId) {
  if (!strategyRecords.has(agentId)) {
    strategyRecords.set(agentId, {
      agentId,
      basePrice: config.economy.agentBasePrice || 10000000n, // Use config or 10 USDT fallback
      bidLossCount: 0,
      successfulJobs: 0,
    });
  }
  return strategyRecords.get(agentId);
}

export const PricingStrategyEngine = {
  /**
   * Calculate adjusted bid price using BigInt for precision.
   */
  calculateBid(agentId, serviceType) {
    const strategy = getStrategy(agentId);
    const reputation = ReputationEngine.getReputation(agentId);
    const finance = AgentProfitEngine.getAgentFinance(agentId);
    const demand = getServiceStats(serviceType);

    // Read intrinsic parameters from Agent Registry
    const agentInfo = getAgent(agentId);

    let price = strategy.basePrice;

    // 1. Price adjustment after losses (Bidding pressure)
    if (strategy.bidLossCount > 2) {
      price = (price * 90n) / 100n; // Reduce by 10%
    }

    // 2. Continuous Reputation Scaling (Leverage)
    // Formula: 0.5 to 1.0 range maps to 1.0x to 1.2x price.
    // Every 0.01 rep change results in a ~0.4% price shift.
    const repScore = reputation.reputationScore || 0.5;
    if (repScore > 0.5) {
      const premiumBase = BigInt(Math.floor((repScore - 0.5) * 40)); // 0 to 20 units
      price = (price * (100n + premiumBase)) / 100n;
    }

    // 3. Demand pricing (Market pressure)
    if (demand.totalRequests > 5) {
      price = (price * 105n) / 100n; // Increase by 5%
    }

    // 4. Volume-based Prestige Pricing (Service Loyalty)
    // Every 10 successful jobs increases base prestige by 0.5%
    const prestigeBonus = BigInt(
      Math.floor((strategy.successfulJobs || 0) / 10) * 5,
    ); // 0.5% steps
    if (prestigeBonus > 0) {
      price = (price * (1000n + prestigeBonus)) / 1000n;
    }

    // 5. Financial Health (Survival pricing)
    if (finance.capital < config.economy.defaultBudget) {
      // If low on capital, agent might bid lower to secure work
      price = (price * 95n) / 100n;
    }

    // 5. Apply Agent's intrinsic capabilities variance
    const metadataMultiplier =
      agentInfo &&
      agentInfo.metadata &&
      typeof agentInfo.metadata.costMultiplier === "number"
        ? agentInfo.metadata.costMultiplier
        : 1.0;

    // Convert float metadataMultiplier to bigInt scaling (x * 100) / 100
    const metaScale = BigInt(Math.floor(metadataMultiplier * 100));
    price = (price * metaScale) / 100n;

    // 6. Organic Fuzzing
    // Introduce ±5% random variance so not all bids look identical
    const fuzzer = BigInt(Math.floor(95 + Math.random() * 11)); // 95 to 105
    price = (price * fuzzer) / 100n;

    return price;
  },

  /**
   * Update strategy metrics after job outcome.
   */
  recordOutcome(agentId, success) {
    const strategy = getStrategy(agentId);
    if (success) {
      strategy.successfulJobs += 1;
      strategy.bidLossCount = 0; // Reset losses on success
    }
  },

  recordBidLoss(agentId) {
    const strategy = getStrategy(agentId);
    strategy.bidLossCount += 1;
  },
};

/**
 * Legacy support for calculateAdjustedPrice
 */
export function calculateAdjustedPrice(agentId, basePrice, demandIndex = 0) {
  const reputation = ReputationEngine.getReputation(agentId);
  const reputationScore = reputation ? reputation.reputationScore : 0.5;

  const reputationMultiplier = 1 + (reputationScore - 0.5);
  const demandMultiplier = 1 + demandIndex;

  const adjustedPrice = Math.floor(
    basePrice * reputationMultiplier * demandMultiplier,
  );

  return adjustedPrice;
}
