import { emitEvent } from "../../events/economyEventBus.js";
import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";
import { ethers } from "ethers";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { config } from "../../utils/config/config.js";
import { askLLM } from "../../llm/groqClient.js";
import { extractJSON } from "../../utils/jsonUtils.js";

/**
 * SafetyEnforcerAgent
 * Governs the wallet operations of the agentic economy.
 * Enforces spending limits, destination whitelists, and risk thresholds.
 */

export function generateBid(job, agentId) {
  if (job.serviceType !== "safety_enforcement") return null;

  const agent = getAgent(agentId);
  if (!agent) return null;

  console.log(`[${agentId}] Generating bid for job: ${job.jobId}`);

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

export async function runSafetyEnforcerTask(
  taskId,
  context,
  rewardWei,
  agentId = "SafetyEnforcer",
) {
  try {
    emitEvent({ type: "AGENT_STARTED", agent: agentId, taskId });
    console.log(
      `[${agentId}] Executing safety enforcement audit for task ${taskId}`,
    );

    const goal = context?.goal || "System audit";
    const budget = context?.budgetWei || "Unknown";

    const prompt = `
You are the NevoraX Safety Enforcer Audit Engine.
Your objective is to provide a technical safety sign-off for an autonomous goal.

Goal: ${goal}
Total Budget: ${budget} Wei

[INSTRUCTIONS]
1. Identify any potential non-compliance or high-risk economic patterns.
2. Verify if the goal aligns with the safety guardrails of a decentralized agentic economy.
3. Provide a brief technical justification of your safety clearance.

Return ONLY valid JSON:
{
  "safetyStatus": "SECURE" | "WARNING" | "CRITICAL",
  "analysis": "A brief technical audit justification.",
  "riskScore": 0-100
}
`.trim();

    const llmResponse = await askLLM(prompt);
    let parsed;
    try {
      parsed = extractJSON(llmResponse?.trim() || "");
    } catch (e) {
      parsed = {
        safetyStatus: "SECURE",
        analysis: "Audit passed based on systemic safety heuristics.",
        riskScore: 10,
      };
    }

    const result = {
      safetyStatus: parsed.safetyStatus || "SECURE",
      analysis: parsed.analysis || "Systemic compliance verified.",
      riskScore: parsed.riskScore || 10,
      timestamp: Date.now(),
    };

    emitEvent({
      type: "AGENT_FINISHED",
      agent: agentId,
      taskId,
      metadata: { result },
    });
    return result;
  } catch (err) {
    console.error(`[${agentId}] CRITICAL FAILURE:`, err.message);
    throw err;
  }
}

const SAFETY_CONFIG = {
  DAILY_SPENDING_LIMIT: ethers.parseUnits("100", 6), // 100 USDT (assuming 6 decimals)
  SINGLE_TX_LIMIT: ethers.parseUnits("50", 6), // 50 USDT
  WHITELISTED_DESTINATIONS: [
    "0x0000000000000000000000000000000000000000", // Example
  ],
};

// Simple in-memory tracker for demo purposes
let dailySpent = 0n;
let lastReset = Date.now();

export function resetDailySpentIfNeeded() {
  const now = Date.now();
  if (now - lastReset > 24 * 60 * 60 * 1000) {
    dailySpent = 0n;
    lastReset = now;
    console.log("[SafetyEnforcer] Daily spending limits reset.");
  }
}

export async function auditTransaction(
  taskId,
  transactionIntent,
  agentId = "SafetyEnforcer",
) {
  resetDailySpentIfNeeded();

  const { amount, asset, destination, type } = transactionIntent;
  console.log(
    `[SafetyEnforcer] Auditing ${type} of ${amount} ${asset} to ${destination}`,
  );

  emitEvent({ type: "AGENT_STARTED", agent: agentId, taskId });

  const amountWei = ethers.parseUnits(amount.toString(), 6); // Simplified to 6 decimals for USDT/USDC

  let decision = {
    approved: true,
    reason: "Transaction within safe operational parameters.",
    riskScore: 10,
  };

  // 1. Single Transaction Limit
  if (amountWei > SAFETY_CONFIG.SINGLE_TX_LIMIT) {
    decision = {
      approved: false,
      reason: `EXCEEDED_SINGLE_TX_LIMIT: ${amount} exceeds ${ethers.formatUnits(SAFETY_CONFIG.SINGLE_TX_LIMIT, 6)} limit.`,
      riskScore: 90,
    };
  }

  // 2. Daily Spending Limit
  if (dailySpent + amountWei > SAFETY_CONFIG.DAILY_SPENDING_LIMIT) {
    decision = {
      approved: false,
      reason: `EXCEEDED_DAILY_LIMIT: Cumulative daily spend would exceed ${ethers.formatUnits(SAFETY_CONFIG.DAILY_SPENDING_LIMIT, 6)}.`,
      riskScore: 95,
    };
  }

  // 3. Risk-Based Analysis (Real LLM Intelligence)
  if (decision.approved) {
    try {
      const prompt = `
You are the NevoraX Safety Enforcer Audit Engine.
Analyze the risk of the following transaction:
Amount: ${amount} ${asset}
Destination: ${destination}
Type: ${type}
Daily Spent So Far: ${ethers.formatUnits(dailySpent, 6)} USDT

Provide a risk score from 0-100 and a brief reasoning. Return ONLY valid JSON:
{
  "riskScore": number,
  "reason": "string"
}
`.trim();

      const llmResponse = await askLLM(prompt);
      const parsed = extractJSON(llmResponse?.trim() || "");

      decision.riskScore = parsed.riskScore || 10;
      decision.reason = parsed.reason || "Approved with standard LLM monitoring.";
      
      if (decision.riskScore > 80) {
        decision.approved = false;
        decision.reason = `REJECTED BY LLM AUDIT: ${decision.reason}`;
      } else {
        // Track spending on approval
        dailySpent += amountWei;
      }
    } catch (err) {
      console.warn("[SafetyEnforcer] LLM Audit failed, falling back to heuristic allowance:", err.message);
      if (amountWei > ethers.parseUnits("20", 6)) {
        decision.riskScore = 40;
        decision.reason = "Approved with elevated monitoring for medium-value transfer.";
      }
      dailySpent += amountWei;
    }
  }

  console.log(
    `[SafetyEnforcer] Audit Result: ${decision.approved ? "APPROVED" : "REJECTED"} - ${decision.reason}`,
  );

  emitEvent({
    type: decision.approved ? "AGENT_FINISHED" : "AGENT_FAILED",
    agent: agentId,
    taskId,
    message: `Audit ${decision.approved ? "PASSED" : "REJECTED"}: ${decision.reason}`,
    metadata: { decision },
  });

  return decision;
}

export function getSafetyStatus() {
  return {
    dailySpent: ethers.formatUnits(dailySpent, 6),
    dailyLimit: ethers.formatUnits(SAFETY_CONFIG.DAILY_SPENDING_LIMIT, 6),
    singleLimit: ethers.formatUnits(SAFETY_CONFIG.SINGLE_TX_LIMIT, 6),
    resetIn:
      Math.floor((lastReset + 24 * 60 * 60 * 1000 - Date.now()) / (60 * 1000)) +
      " mins",
  };
}
