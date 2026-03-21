import { emitEvent } from "../../events/economyEventBus.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { askLLM } from "../../llm/groqClient.js";
import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";
import { config } from "../../utils/config/config.js";
import { extractJSON } from "../../utils/jsonUtils.js";

export function generateBid(job, agentId) {
  if (job.serviceType !== "trend_analysis") return null;

  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  console.log(`[${agentId}] (${mode}) Generating bid for job: ${job.jobId}`);

  let bidPrice = PricingStrategyEngine.calculateBid(agentId, job.serviceType);

  const estimatedCost = config.economy.baseOperatingCost || 1000000n;
  if (!AgentProfitEngine.isProfitable(agentId, bidPrice, estimatedCost)) {
    return null;
  }

  return {
    agentId,
    price: bidPrice.toString(),
    reputation: agent.reputationScore,
    metadata: agent.metadata,
  };
}

export async function runAnalysisAgentTask(
  taskId,
  context,
  rewardWei,
  agentId = "AnalysisAgent",
) {
  try {
    const agent = getAgent(agentId);
    const mode = agent?.metadata?.mode || "STANDARD";

    if (!AgentProfitEngine.hasOperatingCapital(agentId)) {
      console.log(`[${agentId}] Rejected job: Insufficient operating capital`);
      throw new Error(`${agentId}: Insufficient operating capital`);
    }

    console.log(
      `[${agentId}] (${mode}) Executing trend analysis for ${taskId}`,
    );

    const marketData = context?.market_data || {};
    const sentiment = context?.sentiment_analysis || {};
    const isConceptual = marketData.type === "CONCEPTUAL_SEARCH";

    const prompt = isConceptual
      ? `
You are the NevoraX Senior Protocol Analyst.
Perform an exhaustive technical trend and development audit for the following conceptual goal:
Goal: ${context.goal}

[INSTRUCTIONS - HIGH FIDELITY MANDATE]
1. RESEARCH SUMMARY: Provide a multi-paragraph (300+ words) technical analysis of this protocol/trend in premium markdown. Use headers like ### TECHNICAL ARCHITECTURE, ### ECOSYSTEM DISRUPTION, and ### ADOPTION TRAJECTORY.
2. TECHNOLOGICAL DRIVERS: Identify the core technical innovations or shifts enabling this concept.
3. PROTOCOL ANALYSIS: Compare this concept to existing established protocols.
4. PROBABILITY: Estimate the likelihood of this trend gaining significant institutional traction (0.0 - 1.0).

Return ONLY valid JSON:
{
  "trend": "n/a",
  "probability": 0.0-1.0,
  "keyFactors": ["Strategic Driver 1", "Ecosystem Factor 2", "Technical Innovation 3"],
  "summary": "An exhaustive, multi-section research summary of the conceptual growth trend. Be authoritative, technical, and detailed."
}
`
      : `
You are the NevoraX Market Analyst (Mode: ${mode}).
Your objective is to identify high-probability trend structures in the target market.

[MARKET SIGNALS]
Price: ${marketData?.price ?? "unknown"} USD
Sentiment: ${sentiment?.sentiment ?? "neutral"}
Goal: ${context.goal}

[INSTRUCTIONS]
1. TREND: Classify as BULLISH, BEARISH, STAGNANT, or VOLATILE.
2. TECHNICALS: Identify immediate momentum and trend exhaustion signals.
3. PROBABILITY: Estimate the probability (0.0 - 1.0) of this trend continuing.

Return ONLY valid JSON:
{
  "trend": "bullish" | "bearish" | "stagnant" | "volatile",
  "probability": 0.0-1.0,
  "keyFactors": ["factor 1", "factor 2"],
  "summary": "A technical snippet justifying the market trend."
}
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
        trend: isConceptual ? "n/a" : "stagnant",
        probability: 0.5,
        keyFactors: ["Analysis engine returned malformed data"],
        summary:
          "Primary trend analysis is currently unavailable. Systemic neutral fallback applied.",
      };
    }

    const result = {
      ...parsed,
      timestamp: Date.now(),
    };

    console.log(`[${agentId}] Analysis completed:`, result.trend);

    emitEvent({
      type: "AGENT_FINISHED",
      agent: agentId,
      taskId,
    });

    return result;
  } catch (err) {
    console.error(`[AnalysisAgent] CRITICAL FAILURE:`, err);
    throw err;
  }
}
