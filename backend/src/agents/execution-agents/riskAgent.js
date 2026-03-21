import { emitEvent } from "../../events/economyEventBus.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { askLLM } from "../../llm/groqClient.js";
import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";
import { ReputationEngine } from "../../economy/reputation-engine/reputationEngine.js";
import { config } from "../../utils/config/config.js";
import { extractJSON } from "../../utils/jsonUtils.js";

/**
 * RiskAgent
 * Analyzes market risks and provides safety assessments.
 */

export function generateBid(job, agentId) {
  if (job.serviceType !== "risk_assessment") return null;

  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  console.log(`[${agentId}] (${mode}) Generating bid for job: ${job.jobId}`);

  let bidPrice = PricingStrategyEngine.calculateBid(agentId, job.serviceType);

  const estimatedCost = config.economy.baseOperatingCost || 500000n; // low compute
  if (!AgentProfitEngine.isProfitable(agentId, bidPrice, estimatedCost)) {
    return null;
  }

  const reputation = ReputationEngine.getReputation(agentId).reputationScore;
  return {
    agentId,
    price: bidPrice.toString(),
    reputation,
    metadata: agent.metadata,
  };
}

export async function runRiskAgentTask(
  taskId,
  context,
  rewardWei,
  agentId = "RiskAgent",
) {
  try {
    if (!AgentProfitEngine.hasOperatingCapital(agentId)) {
      throw new Error(`${agentId}: Insufficient operating capital`);
    }

    emitEvent({ type: "AGENT_STARTED", agent: agentId, taskId });

    const marketData = context?.market_data || {};
    const sentiment = context?.sentiment_analysis || {};

    const isConceptual = marketData.type === "CONCEPTUAL_SEARCH";

    const prompt = isConceptual
      ? `
You are the NevoraX Senior Security Auditor.
Perform a high-fidelity risk and security audit for the following conceptual goal:
Goal: ${context.goal}

[INSTRUCTIONS - INSTITUTIONAL AUDIT MANDATE]
1. SECURITY SUMMARY: Provide a multi-paragraph (300+ words) technical risk audit. Use headers like ### STRUCTURAL VULNERABILITIES, ### ECONOMIC ATTACK VECTORS, and ### SYSTEMIC MITIGATION.
2. VULNERABILITY ANALYSIS: Identify core structural, economic, or technical risks related to this specific concept.
3. MITIGATION STRATEGY: Propose a high-level strategic roadmap for risk reduction.
4. RISK SCORE: Estimate a technical risk index (0-100).

Return ONLY valid JSON:
{
  "riskLevel": "n/a",
  "score": 0-100,
  "warnings": ["Technical Vulnerability A", "Economic Factor B", "Regulatory Risk C"],
  "mitigation": "Comprehensive strategic advice for protocol-level risk reduction",
  "summary": "An exhaustive, technical security audit of the conceptual research objective. Be precise and multi-faceted."
}
`
      : `
You are the NevoraX Risk Compliance Officer (Mode: ${agentId}).
Your objective is to provide a vulnerability assessment of the target market.

[INTELLIGENCE FEED]
Price: ${marketData?.price ?? "unknown"} USD
Sentiment: ${sentiment?.sentiment ?? "neutral"}
Goal: ${context.goal}

[INSTRUCTIONS]
1. RISK LEVEL: LOW, MODERATE, HIGH, or CRITICAL.
2. MITIGATION: Suggest a specific tactical maneuver.

Return ONLY valid JSON:
{
  "riskLevel": "Low" | "Moderate" | "High" | "Critical",
  "score": 0-100,
  "warnings": ["warning 1"],
  "mitigation": "Tactical advice",
  "summary": "A concise risk summary."
}
`;

    const llmResponse = await askLLM(prompt);
    let result;
    try {
      result = extractJSON(llmResponse?.trim() || "");
    } catch (e) {
      console.warn(
        `[${agentId}] LLM Parse Error, activating Safe Mode:`,
        e.message,
      );
      result = {
        riskLevel: isConceptual ? "n/a" : "Moderate",
        score: 50,
        warnings: ["Risk analysis engine returned malformed data"],
        summary:
          "Primary risk assessment currently under high load. Systemic fallback active.",
      };
    }

    console.log(`[${agentId}] Risk Assessment Completed`);

    emitEvent({ type: "AGENT_FINISHED", agent: agentId, taskId });

    return { ...result, timestamp: Date.now() };
  } catch (err) {
    console.error(`[${agentId}] CRITICAL FAILURE:`, err.message);
    throw err;
  }
}
