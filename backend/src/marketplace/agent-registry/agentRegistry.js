import MarketplaceService from "../../services/marketplaceService.js";

const agents = new Map();

/**
 * Register a new agent.
 */
export function registerAgent(agentData) {
  const {
    agentId,
    services,
    walletAddress,
    reputationScore,
    status,
    index,
    chain,
    executionEndpoint,
  } = agentData;

  // Don't overwrite existing persisted agents with default data
  if (agents.has(agentId)) {
    return agents.get(agentId);
  }

  const agent = {
    agentId,
    services: services || [],
    walletAddress: walletAddress || "",
    reputationScore: reputationScore ?? 0.5,
    status: status || "ACTIVE",
    index, // HD Index for wallet
    chain: chain || "Sepolia",
    executionEndpoint: executionEndpoint || null,
    createdAt: Date.now(),
  };
  agents.set(agentId, agent);
  console.log(`[AgentRegistry] Registered agent: ${agentId}`);
  return agent;
}

// Auto-register core agents and variants
export const CORE_AGENT_IDS = [
  "OrchestratorAgent",
  "Market_Data_1",
  "Market_Data_2",
  "Sentiment_Analyst_1",
  "Sentiment_Analyst_2",
  "Trend_Analyst_1",
  "Trend_Analyst_2",
  "Trade_Executor_1",
  "Trade_Executor_2",
  "Strategy_Planner_1",
  "Strategy_Planner_2",
  "Report_Writer_1",
  "Report_Writer_2",
  "Risk_Auditor_1",
  "Risk_Auditor_2",
  "Whale_Tracker_1",
  "Whale_Tracker_2",
  "Safety_Enforcer_1",
  "Safety_Enforcer_2",
];

CORE_AGENT_IDS.forEach((id, idx) => {
  const services = {
    OrchestratorAgent: ["orchestration"],
    Market_Data_1: ["market_data"],
    Market_Data_2: ["market_data"],
    Sentiment_Analyst_1: ["sentiment_analysis"],
    Sentiment_Analyst_2: ["sentiment_analysis"],
    Trend_Analyst_1: ["trend_analysis"],
    Trend_Analyst_2: ["trend_analysis"],
    Trade_Executor_1: ["execution"],
    Trade_Executor_2: ["execution"],
    Strategy_Planner_1: ["strategy_generation"],
    Strategy_Planner_2: ["strategy_generation"],
    Report_Writer_1: ["report_generation"],
    Report_Writer_2: ["report_generation"],
    Risk_Auditor_1: ["risk_assessment"],
    Risk_Auditor_2: ["risk_assessment"],
    Whale_Tracker_1: ["market_data", "whale_tracking"],
    Whale_Tracker_2: ["market_data", "whale_tracking"],
    Safety_Enforcer_1: ["safety_enforcement"],
    Safety_Enforcer_2: ["safety_enforcement"],
  }[id];

  const variants = {
    Market_Data_1: {
      mode: "HIGH_RES",
      costMultiplier: 1.5,
      reputationScore: 0.98,
    },
    Market_Data_2: {
      mode: "QUICK",
      costMultiplier: 0.7,
      reputationScore: 0.85,
    },
    Sentiment_Analyst_1: {
      mode: "NUANCE",
      costMultiplier: 1.3,
      reputationScore: 0.96,
    },
    Sentiment_Analyst_2: {
      mode: "BATCH",
      costMultiplier: 0.8,
      reputationScore: 0.88,
    },
    Trend_Analyst_1: {
      mode: "DEEP",
      costMultiplier: 1.4,
      reputationScore: 0.97,
    },
    Trend_Analyst_2: {
      mode: "FAST",
      costMultiplier: 0.75,
      reputationScore: 0.82,
    },
    Trade_Executor_1: {
      mode: "ON_CHAIN",
      costMultiplier: 1.2,
      reputationScore: 0.99,
    },
    Trade_Executor_2: {
      mode: "LITE",
      costMultiplier: 0.4,
      reputationScore: 0.9,
    },
    Risk_Auditor_1: {
      mode: "DEEP_RISK",
      costMultiplier: 2.0,
      reputationScore: 0.95,
    },
    Risk_Auditor_2: {
      mode: "QUICK_SCAN",
      costMultiplier: 0.8,
      reputationScore: 0.82,
    },
    Whale_Tracker_1: {
      mode: "WHALE_SCAN",
      costMultiplier: 1.8,
      reputationScore: 0.96,
    },
    Whale_Tracker_2: {
      mode: "STANDARD_WATCH",
      costMultiplier: 1.0,
      reputationScore: 0.88,
    },
    Strategy_Planner_1: {
      mode: "AGGRESSIVE",
      costMultiplier: 1.3,
      reputationScore: 0.93,
    },
    Strategy_Planner_2: {
      mode: "SAFE_HAVEN",
      costMultiplier: 1.1,
      reputationScore: 0.97,
    },
    Report_Writer_1: {
      mode: "THOROUGH",
      costMultiplier: 1.4,
      reputationScore: 0.96,
    },
    Report_Writer_2: {
      mode: "BRIEF",
      costMultiplier: 0.8,
      reputationScore: 0.85,
    },
    Safety_Enforcer_1: {
      mode: "STRICT",
      costMultiplier: 1.5,
      reputationScore: 0.99,
    },
    Safety_Enforcer_2: {
      mode: "LENIENT",
      costMultiplier: 0.8,
      reputationScore: 0.85,
    },
  };

  const variantData = variants[id] || {};
  const chain =
    id.includes("Whale_Tracker") || id === "Risk_Auditor_1"
      ? "Hoodi"
      : "Sepolia";

  // OpenClaw Capability Enrichment
  const capabilities = {
    orchestration: {
      type: "ORCHESTRATOR",
      skills: ["task_planning", "unit_management", "safety_audit"],
      tools: ["WDK_Wallet", "Bridge_Engine"],
    },
    market_data: {
      type: "ANALYST",
      skills: ["price_feed", "volatility_index"],
      tools: ["Chainlink_Adapter", "WDK_USDT_Settler"],
    },
    sentiment_analysis: {
      type: "RESEARCHER",
      skills: ["social_scanning", "alpha_detection"],
      tools: ["Twitter_API_Bridge", "Groq_Reasoning"],
    },
    trend_analysis: {
      type: "ARCHITECT",
      skills: ["technical_charting", "predictive_modeling"],
      tools: ["Ethers_Trace", "Market_Demand_Engine"],
    },
    execution: {
      type: "OPERATOR",
      skills: ["on_chain_tx", "sandbox_simulation"],
      tools: ["WDK_Protocol_Bridge", "Gas_Optimizer"],
    },
    strategy_generation: {
      type: "STORYTELLER",
      skills: ["portfolio_allocation", "risk_mitigation"],
      tools: ["Treasury_Manager", "Simulation_Engine"],
    },
    report_generation: {
      type: "WRITER",
      skills: ["markdown_synthesis", "executive_summary"],
      tools: ["Groq_Report_Gen"],
    },
    risk_assessment: {
      type: "AUDITOR",
      skills: ["exploit_detection", "protocol_health"],
      tools: ["Safety_Enforcer", "Vulnerability_Scanner"],
    },
    whale_tracking: {
      type: "WATCHER",
      skills: ["large_tx_detection", "wallet_clustering"],
      tools: ["WDK_Whale_Watch", "DexScreener_Adapter"],
    },
    safety_enforcement: {
      type: "GOVERNOR",
      skills: ["tx_auditing", "spending_limit_control"],
      tools: ["Safety_Enforcer_Core", "Compliance_Engine"],
    },
  }[services[0]] || { type: "GENERIC", skills: [], tools: [] };

  // Only register if not already in persistent storage
  if (!agents.has(id)) {
    const baselineReputation =
      variantData.reputationScore || 0.75 + Math.random() * 0.2;
    const drift = Math.random() * 0.1 - 0.05;
    const driftedReputation = Math.max(
      0.1,
      Math.min(1.0, baselineReputation + drift),
    );

    registerAgent({
      agentId: id,
      services,
      index: idx,
      reputationScore: driftedReputation,
      chain,
      metadata: {
        mode: variantData.mode || "STANDARD",
        costMultiplier: variantData.costMultiplier || 1.0,
        openclaw: {
          unit_type: capabilities.type,
          onboarded: true,
          capabilities: {
            skills: capabilities.skills,
            tools: capabilities.tools,
          },
        },
      },
    });
  }
});

/**
 * Apply a global "Economic Shock" or session-wide entropy drift.
 */
export function applyEconomicEntropy() {
  console.log("[Marketplace] Applying Global Economic Entropy Drift...");
  agents.forEach((agent) => {
    const drift = Math.random() * 0.06 - 0.03; // ±3% shift
    agent.reputationScore = Math.max(
      0.1,
      Math.min(1.0, agent.reputationScore + drift),
    );
  });
}

/**
 * Get agent metadata, synced with persistent store.
 */
export function getAgent(agentId) {
  const agent = agents.get(agentId);
  const persistentAgent = MarketplaceService.getAgentById(agentId);

  if (agent && persistentAgent) {
    // Sync reputation and other dynamic stats
    return {
      ...agent,
      reputationScore: persistentAgent.reputation / 100, // Sync 0-100 to 0-1 scale
      totalEarned: persistentAgent.totalEarned,
      tasksCompleted: persistentAgent.tasksCompleted,
    };
  }
  return agent;
}

/**
 * List agents providing a specific service, synced with persistent store.
 */
export function getAgentsByService(serviceType) {
  const storeAgents = MarketplaceService.getAllAgents();

  return Array.from(agents.values())
    .filter((a) => a.services.includes(serviceType) && a.status === "ACTIVE")
    .map((agent) => {
      const p = storeAgents.find((sa) => sa.id === agent.agentId);
      if (p) {
        return {
          ...agent,
          reputationScore: p.reputation / 100,
          totalEarned: p.totalEarned,
          tasksCompleted: p.tasksCompleted,
        };
      }
      return agent;
    });
}

/**
 * Update agent reputation.
 */
export function updateAgentReputation(agentId, newScore) {
  const agent = agents.get(agentId);
  if (agent) {
    agent.reputationScore = newScore;
  }
}

/**
 * Update agent status.
 */
export function updateAgentStatus(agentId, status) {
  const agent = agents.get(agentId);
  if (agent) {
    agent.status = status;
  }
}

/**
 * Get all registered agents, synced with persistent store.
 */
export function getAllAgents() {
  const storeAgents = MarketplaceService.getAllAgents();

  // The persistent store (MarketplaceService) is the source of truth for all agents (internal + external)
  return storeAgents.map((p) => {
    const regAgent = agents.get(p.id);
    return {
      ...regAgent,
      agentId: p.id,
      name: p.name || regAgent?.name,
      services: p.services || regAgent?.services || [],
      reputation: p.reputation, // 0-100 scale for UI
      reputationScore: p.reputationScore || p.reputation / 100,
      totalEarned: p.totalEarned,
      tasksCompleted: p.tasksCompleted,
      status: p.status || "ACTIVE",
      isExternal: p.isExternal || false,
      executionEndpoint: p.executionEndpoint || regAgent?.executionEndpoint,
      budgetLimit: p.budgetLimit || 10.0,
      budgetSpent: p.budgetSpent || 0.0,
      costMultiplier:
        p.costMultiplier || regAgent?.metadata?.costMultiplier || 1.0,
    };
  });
}
