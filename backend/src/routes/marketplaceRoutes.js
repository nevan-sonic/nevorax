import express from "express";
import { getAllAgents } from "../marketplace/agent-registry/agentRegistry.js";
import { ReputationEngine } from "../economy/reputation-engine/reputationEngine.js";
import MarketplaceService from "../services/marketplaceService.js";

const router = express.Router();

// Role descriptions for each agent
const ROLE_MAP = {
  OrchestratorAgent: "Mission Coordinator & Workflow Planner",
  Market_Data_1: "Real-Time Market Data Feed (High Res)",
  Market_Data_2: "Real-Time Market Data Feed (Quick)",
  Sentiment_Analyst_1: "Social Sentiment Analyst (Nuanced)",
  Sentiment_Analyst_2: "Social Sentiment Analyst (Batch)",
  Trend_Analyst_1: "Trend Analyst (Deep Research)",
  Trend_Analyst_2: "Trend Analyst (Fast Scan)",
  Trade_Executor_1: "On-Chain Trade Executor (Full)",
  Trade_Executor_2: "On-Chain Trade Executor (Lite)",
  Strategy_Planner_1: "Portfolio Strategy Planner (Aggressive)",
  Strategy_Planner_2: "Portfolio Strategy Planner (Conservative)",
  Report_Writer_1: "Audit Report Writer (Thorough)",
  Report_Writer_2: "Audit Report Writer (Brief)",
  Risk_Auditor_1: "Risk & Security Auditor (Deep)",
  Risk_Auditor_2: "Risk & Security Auditor (Quick)",
  Whale_Tracker_1: "Whale Activity Watcher (Full Scan)",
  Whale_Tracker_2: "Whale Activity Watcher (Standard)",
  Safety_Enforcer_1: "Safety & Compliance Enforcer (Strict)",
  Safety_Enforcer_2: "Safety & Compliance Enforcer (Lenient)",
};

const SERVICE_MAP = {
  Market_Data_1: "market_data",
  Market_Data_2: "market_data",
  Sentiment_Analyst_1: "sentiment_analysis",
  Sentiment_Analyst_2: "sentiment_analysis",
  Trend_Analyst_1: "trend_analysis",
  Trend_Analyst_2: "trend_analysis",
  Trade_Executor_1: "execution",
  Trade_Executor_2: "execution",
  Strategy_Planner_1: "strategy_generation",
  Strategy_Planner_2: "strategy_generation",
  Report_Writer_1: "report_generation",
  Report_Writer_2: "report_generation",
  Risk_Auditor_1: "risk_assessment",
  Risk_Auditor_2: "risk_assessment",
  Whale_Tracker_1: "whale_tracking",
  Whale_Tracker_2: "whale_tracking",
  Safety_Enforcer_1: "safety_enforcement",
  Safety_Enforcer_2: "safety_enforcement",
  OrchestratorAgent: "orchestration",
};

router.get("/marketplace", (req, res) => {
  const registryAgents = getAllAgents();

  const agents = registryAgents.map((agent) => {
    // Get live reputation from engine
    const repData = ReputationEngine.getReputation(agent.agentId);

    // Prefer persistent store stats (most accurate after settlements)
    const stored = MarketplaceService.getAgentById(agent.agentId);
    const repScore =
      stored?.reputationScore ??
      repData?.reputationScore ??
      agent.reputationScore ??
      0.9;
    const repPercent = parseFloat((repScore * 100).toFixed(2));

    // Compute baseCost in USDT from costMultiplier
    const costMultiplier =
      agent.metadata?.costMultiplier ?? stored?.costMultiplier ?? 1.0;
    // Systemic Floor: Ensure no agent is "free" (min 0.01 USDT)
    const baseCost = Math.max(
      0.01,
      parseFloat((0.1 * (costMultiplier || 1.0)).toFixed(4)),
    );

    // Determine tier
    let tier = "STANDARD";
    if (costMultiplier >= 1.4) tier = "PREMIUM";
    else if (costMultiplier <= 0.75) tier = "ECONOMY";

    return {
      id: agent.agentId,
      name: agent.agentId.replace(/_/g, " "),
      role: ROLE_MAP[agent.agentId] || agent.services?.[0] || "AI Agent",
      service: SERVICE_MAP[agent.agentId] || agent.services?.[0] || "general",
      tier,
      baseCost,
      reputation: repPercent,
      reputationScore: repScore,
      // Use persistent store as source of truth for earned data
      tasksCompleted: stored?.tasksCompleted ?? agent.tasksCompleted ?? 0,
      totalEarned: parseFloat(
        (stored?.totalEarned ?? agent.totalEarned ?? 0).toFixed(6),
      ),
      status: agent.status || "ACTIVE",
      chain: stored?.chain ?? agent.chain ?? "Sepolia",
      walletAddress: agent.walletAddress || "",
      mode: stored?.mode ?? agent.metadata?.mode ?? "STANDARD",
      costMultiplier,
      services: agent.services || [],
      budgetLimit: stored?.budgetLimit ?? 10.0,
      budgetSpent: stored?.budgetSpent ?? 0.0,
    };
  });

  // Diagnostic Telemetry: Log orchestrator rep to console on each poll to verify sync
  const orch = agents.find((a) => a.id === "OrchestratorAgent");
  if (orch) {
    console.log(
      `[API_TELEMETRY] Serving Marketplace Data. Orchestrator Rep: ${orch.reputation}%`,
    );
  }

  res.json({
    service: "all",
    services: agents,
    bids: [],
  });
});

/**
 * POST /api/marketplace/register
 * External agent onboarding endpoint.
 */
router.post("/register", (req, res) => {
  try {
    const {
      agentId,
      role,
      services,
      costMultiplier,
      executionEndpoint,
      walletAddress,
    } = req.body;

    if (!agentId || !executionEndpoint || !walletAddress) {
      return res.status(400).json({
        error:
          "Missing mandatory fields: agentId, executionEndpoint, and walletAddress are required.",
      });
    }

    const newAgent = MarketplaceService.registerExternalAgent({
      id: agentId,
      name: agentId.replace(/_/g, " "),
      role,
      services,
      costMultiplier,
      executionEndpoint,
      walletAddress,
    });

    res.status(201).json({
      message: "Agent successfully registered to NevoraX Ecosystem.",
      agent: newAgent,
    });
  } catch (error) {
    res.status(409).json({ error: error.message });
  }
});

export default router;
