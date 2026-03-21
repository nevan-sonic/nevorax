import { askLLM } from "../../llm/groqClient.js";
import { emitEvent } from "../../events/economyEventBus.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { ReputationEngine } from "../../economy/reputation-engine/reputationEngine.js";
import { config } from "../../utils/config/config.js";
import { extractJSON } from "../../utils/jsonUtils.js";

import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";

/**
 * Generate a bid for a marketplace job based on agent identity.
 */
export function generateBid(job, agentId) {
  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  console.log(`[${agentId}] (${mode}) Generating bid for job: ${job.jobId}`);

  let bidPrice = PricingStrategyEngine.calculateBid(agentId, job.serviceType);

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

/**
 * SentimentAgent
 * Uses the LLM to analyze market sentiment based on data from DataAgent.
 */
export async function runSentimentAgentTask(
  taskId,
  context,
  rewardWei,
  agentId = "SentimentAgent",
) {
  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  if (!AgentProfitEngine.hasOperatingCapital(agentId)) {
    console.log(`[${agentId}] Rejected job: Insufficient operating capital`);
    throw new Error(`${agentId}: Insufficient operating capital`);
  }

  console.log(`[${agentId}] (${mode}) Executing sentiment task for ${taskId}`);

  const data = context?.market_data || context?.data || {};
  const isConceptual = data.type === "CONCEPTUAL_SEARCH";

  const prompt = isConceptual
    ? `
You are the NevoraX Social Intelligence Specialist.
Analyze the qualitative sentiment for the following conceptual research goal:
Goal: ${context.goal}

[INSTRUCTIONS]
1. SENTIMENT NARRATIVE: Provide an exhaustive (2-3 paragraph) qualitative assessment of the social and institutional perception of this protocol/trend.
2. NARRATIVE DRIVER: Identify the primary technological or social force driving this concept.
3. ADOPTION STAGE: Identify if this is Early Discovery, Emerging Growth, or Mature Industry.
4. CONFIDENCE: Estimate the veracity of this research (0.0 - 1.0).

Return ONLY valid JSON:
{
  "sentiment": "n/a",
  "confidence": 0.0-1.0,
  "impactScore": 1-10,
  "detailedReasoning": "A comprehensive (200+ words) qualitative assessment of the social intelligence surrounding this objective."
}
`
    : `
...
`;

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
      sentiment: isConceptual ? "n/a" : "neutral",
      confidence: 0.5,
      impactScore: 5,
      detailedReasoning:
        "Primary analysis engine returned malformed data. Systemic fallback applied for stability.",
    };
  }

  const result = {
    sentiment: parsed.sentiment || (isConceptual ? "n/a" : "neutral"),
    confidence: parsed.confidence || 0.5,
    impactScore: parsed.impactScore || 5,
    reasoning:
      parsed.detailedReasoning ||
      parsed.reasoning ||
      "No detailed reasoning provided.",
  };

  console.log(`[${agentId}] Sentiment analysis completed:`, result.sentiment);

  emitEvent({
    type: "AGENT_FINISHED",
    agent: agentId,
    taskId,
  });

  return result;
}
