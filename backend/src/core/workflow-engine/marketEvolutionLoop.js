/**
 * Market Evolution Loop
 * Periodic loop that analyzes market demand and evolves the agent ecosystem.
 */

import { getAllDemandStats } from "./marketDemandEngine.js";
import {
  listAgentsByService,
  getAllAgents,
  removeAgent,
} from "../../marketplace/agent-registry/agentRegistry.js";
import { spawnAgent } from "../../agents/base-agent/agentFactory.js";
import { emitEvent } from "../../events/economyEventBus.js";
import { getAgentFinance } from "../../economy/pricing-engine/financeEngine.js";

const SPAWN_THRESHOLD = 5; // failures

const RETIRE_THRESHOLD_TASKS = 10;

/**
 * Run one iteration of the market evolution loop.
 */
export async function runMarketEvolution() {
  console.log("=== Running Market Evolution Loop ===");

  const demandStats = getAllDemandStats();

  // 1. Spawning Logic
  for (const stats of demandStats) {
    const providers = listAgentsByService(stats.service);
    if (
      stats.failedRequests > SPAWN_THRESHOLD ||
      (providers.length < 2 && stats.totalRequests > 10)
    ) {
      console.log(
        `[Evolution] High demand detected for ${stats.service}. Spawning new provider.`,
      );

      // Map service to agent type (simplification)
      let agentType = "DataAgent";
      if (stats.service === "sentiment_analysis") agentType = "SentimentAgent";
      if (stats.service === "trend_analysis") agentType = "AnalysisAgent";

      await spawnAgent(stats.service, agentType);
    }
  }

  // 2. Retirement Logic
  const allAgents = getAllAgents();
  for (const agent of allAgents) {
    if (agent.status === "inactive" || agent.agentId === "OrchestratorAgent")
      continue;

    const finance = getAgentFinance(agent.agentId);
    if (finance.totalJobs > RETIRE_THRESHOLD_TASKS) {
      if (finance.profitMargin < 0.05) {
        console.log(
          `[Evolution] Agent ${agent.agentId} performing poorly (Margin: ${finance.profitMargin.toFixed(3)}). Retiring.`,
        );
        removeAgent(agent.agentId);
      }
    }
  }

  emitEvent({
    type: "MARKET_EVOLVED",
    message: "Market evolution cycle completed.",
    timestamp: Date.now(),
  });
}

/**
 * Start the periodic evolution loop.
 */
export function startMarketEvolutionLoop(intervalMs = 300000) {
  setInterval(runMarketEvolution, intervalMs);
  console.log(
    `[Evolution] Market evolution loop started (Interval: ${intervalMs}ms)`,
  );
}
