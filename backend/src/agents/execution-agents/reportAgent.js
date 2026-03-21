import crypto from "crypto";
import { emitEvent } from "../../events/economyEventBus.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { ReputationEngine } from "../../economy/reputation-engine/reputationEngine.js";
import { askLLM } from "../../llm/groqClient.js";

import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";
import { config } from "../../utils/config/config.js";

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

/**
 * Synthesize final report using LLM.
 */
export async function runReportAgentTask(
  taskId,
  context,
  rewardWei,
  agentId = "ReportAgent",
) {
  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  if (!AgentProfitEngine.hasOperatingCapital(agentId)) {
    console.log(`[${agentId}] Rejected job: Insufficient operating capital`);
    throw new Error(`${agentId}: Insufficient operating capital`);
  }

  console.log(`[${agentId}] (${mode}) Synthesizing final report for ${taskId}`);

  const prompt = `
You are the NevoraX Chief Economic Analyst.
Synthesize the following agent outputs into a professional, cohesive market report:
Goal: ${context?.goal ?? "Market Analysis"}
Market Data: ${JSON.stringify(context?.market_data || {})}
Sentiment Analysis: ${JSON.stringify(context?.sentiment_analysis || {})}
Trend Analysis: ${JSON.stringify(context?.trend_analysis || {})}
Strategy Recommendation: ${JSON.stringify(context?.strategy_generation || {})}

Your report should be unique, insightful, and presented in clear Markdown.
`.trim();

  emitEvent({
    type: "AGENT_STARTED",
    agent: agentId,
    taskId,
  });

  let reportContent;
  try {
    reportContent = await askLLM(prompt);
    if (!reportContent)
      throw new Error("ReportAgent: LLM returned empty content.");
  } catch (error) {
    console.warn(
      `[${agentId}] LLM report generation failed, using systemic backup.`,
    );

    let findingsSummary = "";
    Object.entries(context || {}).forEach(([key, val]) => {
      if (key === "goal" || key === "taskId") return;
      findingsSummary += `- **${key.replace(/_/g, " ").toUpperCase()}**: ${typeof val === "object" ? JSON.stringify(val) : val}\n`;
    });

    reportContent = `
### Systemic Market Report (Data-Only Backup)
**Goal:** ${context?.goal || "Market Analysis"}

**Consolidated Agent Findings:**
${findingsSummary}

*Note: This report was generated using systemic heuristics because the primary analysis engine is currently under high load.*
`.trim();
  }

  const deliverable = {
    deliverableId: crypto.randomUUID(),
    type: "comprehensive_market_report",
    content: reportContent,
    producedBy: [
      "DataAgent",
      "SentimentAgent",
      "AnalysisAgent",
      "StrategyAgent",
      "ReportAgent",
    ],
    createdAt: Date.now(),
  };

  console.log(`[${agentId}] Final report synthesized.`);

  emitEvent({
    type: "AGENT_FINISHED",
    agent: agentId,
    taskId,
  });

  return deliverable;
}
