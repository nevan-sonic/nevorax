import { emitEvent } from "../../events/economyEventBus.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { ReputationEngine } from "../../economy/reputation-engine/reputationEngine.js";
import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";
import { config } from "../../utils/config/config.js";
import { extractJSON } from "../../utils/jsonUtils.js";

/**
 * Generate a bid for a marketplace job based on agent identity.
 */
export function generateBid(job, agentId) {
  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  console.log(`[${agentId}] (${mode}) Generating bid for job: ${job.jobId}`);

  const bidPrice = PricingStrategyEngine.calculateBid(agentId, job.serviceType);
  const estimatedCost = config.economy.baseOperatingCost || 1000000n;

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

import { askLLM } from "../../llm/groqClient.js";

export async function runStrategyAgentTask(
  taskId,
  context,
  rewardWei,
  agentId = "StrategyAgent",
) {
  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  if (!AgentProfitEngine.hasOperatingCapital(agentId)) {
    console.log(`[${agentId}] Rejected job: Insufficient operating capital`);
    throw new Error(`${agentId}: Insufficient operating capital`);
  }

  console.log(`[${agentId}] (${mode}) Developing strategy for ${taskId}`);

  const analysis = context?.trend_analysis || {};
  const marketData = context?.market_data || {};

  const prompt = `
You are the NevoraX Strategy Consultant (Mode: ${mode}).
Your objective is to define a high-performance tactical maneuver for the current economic state.

[INTELLIGENCE CONTEXT]
Market Trend: ${analysis?.trend ?? "neutral"} (Probability: ${analysis?.probability ?? 0.5})
Current Price: ${marketData?.price ?? "unknown"} USD
Risk Factors: ${JSON.stringify(context?.risk_assessment || "Standard Risk")}
Goal: ${context.goal}

[INSTRUCTIONS]
1. RECOMMENDATION: BUY, SELL, HOLD, ACCUMULATE, or HEDGE.
2. TACTIC: Define a specific maneuver (e.g., "Enter at market, take profit at ${Number(marketData?.price) * 1.05} USD, exit at ${Number(marketData?.price) * 0.97} USD").
3. ALLOCATION: Based on the risk_assessment score, suggest a capital allocation percentage (0 - 100%).

Return ONLY valid JSON:
{
  "recommendation": "buy" | "sell" | "hold" | "accumulate" | "hedge",
  "urgency": "low" | "medium" | "high",
  "strategyDetails": "A sophisticated, data-driven strategy justification weaving together trend and risk signals.",
  "riskLevel": 1-10
}
`.trim();

  emitEvent({
    type: "AGENT_STARTED",
    agent: agentId,
    taskId,
  });

  const llmResponse = await askLLM(prompt);
  let parsed;
  try {
    parsed = extractJSON(llmResponse?.trim() || "");
  } catch (error) {
    console.warn(
      `[${agentId}] LLM Parse Error, activating Safe Mode:`,
      error.message,
    );
    parsed = {
      recommendation: "hold",
      urgency: "medium",
      strategyDetails:
        "Market intelligence system currently experiencing high load. Applying systemic hedge strategy based on risk-neutral parameters.",
      riskLevel: 5,
    };
  }

  const result = {
    ...parsed,
    timestamp: Date.now(),
  };

  console.log(`[${agentId}] Strategy developed:`, result.recommendation);

  emitEvent({
    type: "AGENT_FINISHED",
    agent: agentId,
    taskId,
  });

  return result;
}
