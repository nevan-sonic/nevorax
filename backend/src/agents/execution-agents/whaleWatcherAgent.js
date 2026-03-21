import axios from "axios";
import { emitEvent } from "../../events/economyEventBus.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";
import { ReputationEngine } from "../../economy/reputation-engine/reputationEngine.js";
import { config } from "../../utils/config/config.js";

/**
 * WhaleWatcherAgent
 * Specialized DataAgent for tracking large-scale on-chain movements.
 */

export function generateBid(job, agentId) {
  // WhaleWatcher can handle market_data or specialized whale_tracking
  if (!["market_data", "whale_tracking"].includes(job.serviceType)) return null;

  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  console.log(`[${agentId}] (${mode}) Generating bid for job: ${job.jobId}`);

  let bidPrice = PricingStrategyEngine.calculateBid(agentId, job.serviceType);

  const estimatedCost = config.economy.baseOperatingCost || 200000n;
  if (!AgentProfitEngine.isProfitable(agentId, bidPrice, estimatedCost)) {
    return null;
  }

  const reputation = ReputationEngine.getReputation(agentId).reputationScore;
  return {
    agentId,
    price: bidPrice,
    reputation,
    metadata: agent.metadata,
  };
}

export async function runWhaleWatcherTask(
  taskId,
  context,
  rewardWei,
  agentId = "WhaleWatcherAgent",
) {
  try {
    if (!AgentProfitEngine.hasOperatingCapital(agentId)) {
      throw new Error(`${agentId}: Insufficient operating capital`);
    }

    emitEvent({ type: "AGENT_STARTED", agent: agentId, taskId });

    const marketData = context?.market_data || {};
    const symbol = marketData?.symbol || "BTC";

    // 1. Fetch Real High-Volume Data from Binance
    let volumeAlerts = [];
    try {
      const bResp = await axios.get(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`,
      );
      const bData = bResp.data;

      emitEvent({
        type: "DATA_SOURCE_ACTIVE",
        agent: agentId,
        taskId,
        message: `Scanning real-time institutional volume on Binance for ${symbol}...`,
        metadata: {
          source: "Binance_24h_Scanner",
          metrics: ["volume", "price_change"],
        },
      });

      if (Number(bData.quoteVolume) > 100000000) {
        // > 100M USDT is "Whale Territory"
        volumeAlerts.push({
          exchange: "Binance",
          volume24h: `${Number(bData.quoteVolume).toLocaleString()} USDT`,
          change: `${bData.priceChangePercent}%`,
          intensity:
            Number(bData.quoteVolume) > 500000000 ? "CRITICAL" : "HIGH",
        });
      }
    } catch (e) {
      console.warn(`[WhaleWatcher] Binance scan failed: ${e.message}`);
    }

    const result = {
      status: volumeAlerts.length > 0 ? "HIGH_VOLUME_ALERT" : "STABLE_FLOW",
      alerts: volumeAlerts,
      indicators: {
        institutionalPressure: volumeAlerts.some(
          (a) => a.intensity === "CRITICAL",
        )
          ? "EXTREME"
          : "MODERATE",
      },
      summary:
        volumeAlerts.length > 0
          ? `Detected ${volumeAlerts[0].intensity} volume spike on Binance: ${volumeAlerts[0].volume24h} traded in 24h.`
          : `Normal liquidity levels for ${symbol}. No anomalous whale spikes detected in current scanning cycle.`,
      timestamp: Date.now(),
    };

    console.log(`[${agentId}] Whale Watch completed: ${result.netFlow}`);

    emitEvent({ type: "AGENT_FINISHED", agent: agentId, taskId });

    return result;
  } catch (err) {
    console.error(`[${agentId}] CRITICAL FAILURE:`, err.message);
    throw err;
  }
}
