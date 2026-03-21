import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// Lazy import to avoid circular deps — imported at call time
let _RepEngine = null;
async function getRepEngine() {
  if (!_RepEngine) {
    const mod =
      await import("../economy/reputation-engine/reputationEngine.js");
    _RepEngine = mod.ReputationEngine;
  }
  return _RepEngine;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STORE_PATH = path.join(__dirname, "../data/marketplaceStore.json");

// Registry variant metadata for seeding
const VARIANTS = {
  OrchestratorAgent: {
    mode: "ORCHESTRATOR",
    costMultiplier: 1.0,
    reputationScore: 0.97,
    chain: "Sepolia",
    services: ["orchestration"],
  },
  Market_Data_1: {
    mode: "HIGH_RES",
    costMultiplier: 1.5,
    reputationScore: 0.98,
    chain: "Sepolia",
    services: ["market_data"],
  },
  Market_Data_2: {
    mode: "QUICK",
    costMultiplier: 0.7,
    reputationScore: 0.85,
    chain: "Sepolia",
    services: ["market_data"],
  },
  Sentiment_Analyst_1: {
    mode: "NUANCE",
    costMultiplier: 1.3,
    reputationScore: 0.96,
    chain: "Sepolia",
    services: ["sentiment_analysis"],
  },
  Sentiment_Analyst_2: {
    mode: "BATCH",
    costMultiplier: 0.8,
    reputationScore: 0.88,
    chain: "Sepolia",
    services: ["sentiment_analysis"],
  },
  Trend_Analyst_1: {
    mode: "DEEP",
    costMultiplier: 1.4,
    reputationScore: 0.97,
    chain: "Sepolia",
    services: ["trend_analysis"],
  },
  Trend_Analyst_2: {
    mode: "FAST",
    costMultiplier: 0.75,
    reputationScore: 0.82,
    chain: "Sepolia",
    services: ["trend_analysis"],
  },
  Trade_Executor_1: {
    mode: "ON_CHAIN",
    costMultiplier: 1.2,
    reputationScore: 0.99,
    chain: "Sepolia",
    services: ["execution"],
  },
  Trade_Executor_2: {
    mode: "LITE",
    costMultiplier: 0.4,
    reputationScore: 0.9,
    chain: "Sepolia",
    services: ["execution"],
  },
  Strategy_Planner_1: {
    mode: "AGGRESSIVE",
    costMultiplier: 1.3,
    reputationScore: 0.93,
    chain: "Sepolia",
    services: ["strategy_generation"],
  },
  Strategy_Planner_2: {
    mode: "SAFE_HAVEN",
    costMultiplier: 1.1,
    reputationScore: 0.97,
    chain: "Sepolia",
    services: ["strategy_generation"],
  },
  Report_Writer_1: {
    mode: "THOROUGH",
    costMultiplier: 1.4,
    reputationScore: 0.96,
    chain: "Sepolia",
    services: ["report_generation"],
  },
  Report_Writer_2: {
    mode: "BRIEF",
    costMultiplier: 0.8,
    reputationScore: 0.85,
    chain: "Sepolia",
    services: ["report_generation"],
  },
  Risk_Auditor_1: {
    mode: "DEEP_RISK",
    costMultiplier: 2.0,
    reputationScore: 0.95,
    chain: "Polygon",
    services: ["risk_assessment"],
  },
  Risk_Auditor_2: {
    mode: "QUICK_SCAN",
    costMultiplier: 0.8,
    reputationScore: 0.82,
    chain: "Sepolia",
    services: ["risk_assessment"],
  },
  Whale_Tracker_1: {
    mode: "WHALE_SCAN",
    costMultiplier: 1.8,
    reputationScore: 0.96,
    chain: "Polygon",
    services: ["market_data", "whale_tracking"],
  },
  Whale_Tracker_2: {
    mode: "STANDARD_WATCH",
    costMultiplier: 1.0,
    reputationScore: 0.88,
    chain: "Polygon",
    services: ["market_data", "whale_tracking"],
  },
  Safety_Enforcer_1: {
    mode: "STRICT",
    costMultiplier: 1.5,
    reputationScore: 0.99,
    chain: "Sepolia",
    services: ["safety_enforcement"],
  },
  Safety_Enforcer_2: {
    mode: "LENIENT",
    costMultiplier: 0.8,
    reputationScore: 0.85,
    chain: "Sepolia",
    services: ["safety_enforcement"],
  },
};

class MarketplaceService {
  constructor() {
    this.agents = this.loadStore();
    this._repairCorruptedData();
    this._backfillBudgetFields();
    this._seedAgentsIfNeeded();
    this._initReputationEngine();
  }

  async _initReputationEngine() {
    try {
      const repEngine = await getRepEngine();
      this.agents.forEach(a => {
        repEngine.syncFromStore(a.id, a.reputationScore);
      });
      console.log(`[MarketplaceService] Synchronized ${this.agents.length} agent reputations to local memory map.`);
    } catch (e) {
      console.error("[MarketplaceService] Failed to init RepEngine:", e);
    }
  }

  _repairCorruptedData() {
    let changed = false;
    this.agents.forEach((agent) => {
      // Restore null or NaN reputations from VARIANTS
      const meta = VARIANTS[agent.id] || {
        reputationScore: 0.9,
        costMultiplier: 1.0,
      };

      if (
        agent.reputation === null ||
        isNaN(agent.reputation) ||
        agent.reputationScore === null ||
        isNaN(agent.reputationScore)
      ) {
        agent.reputation = parseFloat((meta.reputationScore * 100).toFixed(2));
        agent.reputationScore = meta.reputationScore;
        changed = true;
      }

      // Restore missing or zero costMultiplier
      if (
        !agent.costMultiplier ||
        isNaN(agent.costMultiplier) ||
        agent.costMultiplier <= 0
      ) {
        agent.costMultiplier = meta.costMultiplier || 1.0;
        changed = true;
        console.warn(
          `[MarketplaceService] Repaired costMultiplier for ${agent.id} -> ${agent.costMultiplier}`,
        );
      }
    });
    if (changed) this.saveStore();
  }

  _backfillBudgetFields() {
    let changed = false;
    this.agents.forEach((agent) => {
      // If budgetLimit is missing, set to 10.0
      if (agent.budgetLimit === undefined) {
        agent.budgetLimit = 10.0;
        changed = true;
      }
      // If budgetSpent is missing or exactly 0 but agent has earnings,
      // backfill from totalEarned to restore state for existing history
      if (
        agent.budgetSpent === undefined ||
        (agent.budgetSpent === 0 && (agent.totalEarned || 0) > 0)
      ) {
        agent.budgetSpent = parseFloat((agent.totalEarned || 0).toFixed(4));
        changed = true;
      }
    });
    if (changed) {
      console.log(
        `[MarketplaceService] Backfilled budget fields for ${this.agents.length} agents.`,
      );
      this.saveStore();
    }
  }

  loadStore() {
    try {
      if (fs.existsSync(STORE_PATH)) {
        const data = fs.readFileSync(STORE_PATH, "utf8");
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(
            `[MarketplaceService] Loaded ${parsed.length} agents from store.`,
          );
          return parsed;
        }
      }
    } catch (error) {
      console.error("[MarketplaceService] Load error:", error.message);
    }
    return [];
  }

  saveStore() {
    try {
      fs.writeFileSync(
        STORE_PATH,
        JSON.stringify(this.agents, null, 2),
        "utf8",
      );
    } catch (error) {
      console.error("[MarketplaceService] Save error:", error.message);
    }
  }

  /**
   * Seeds all 19 agents into the persistent store on first boot.
   * Agents that already exist are left untouched (preserving earned data).
   */
  _seedAgentsIfNeeded() {
    let changed = false;
    for (const [agentId, meta] of Object.entries(VARIANTS)) {
      const existing = this.agents.find((a) => a.id === agentId);
      if (!existing) {
        this.agents.push({
          id: agentId,
          name: agentId.replace(/_/g, " "),
          reputation: parseFloat((meta.reputationScore * 100).toFixed(2)),
          reputationScore: meta.reputationScore,
          costMultiplier: meta.costMultiplier,
          mode: meta.mode,
          chain: meta.chain,
          services: meta.services,
          totalEarned: 0,
          tasksCompleted: 0,
          budgetLimit: 10.0,
          budgetSpent: 0.0,
          taskHistory: [], // [{taskId, service, amount, txHash, timestamp, reputationDelta}]
          status: "ACTIVE",
          registeredAt: Date.now(),
        });
        changed = true;
      }
    }
    if (changed) {
      this.saveStore();
      console.log(
        `[MarketplaceService] Seeded ${Object.keys(VARIANTS).length} agents into persistent store.`,
      );
    }
  }

  getAllAgents() {
    this.agents = this.loadStore();
    return this.agents;
  }

  getAgentById(id) {
    return this.agents.find((a) => a.id === id);
  }

  /**
   * Updates an agent's persistent stats after a successful task settlement.
   * Auto-creates the agent record if missing (resilient).
   */
  settleAgentPayment(
    agentId,
    payout,
    nominalDelta = 0,
    taskRecord = {},
    performanceScore = 1.0,
  ) {
    this.agents = this.loadStore();

    let agent = this.agents.find((a) => a.id === agentId);

    // Auto-create if missing (resilience against cleared stores)
    if (!agent) {
      const meta = VARIANTS[agentId] || {
        mode: "STANDARD",
        costMultiplier: 1.0,
        reputationScore: 0.9,
        chain: "Sepolia",
        services: [],
      };
      agent = {
        id: agentId,
        name: agentId.replace(/_/g, " "),
        reputation: parseFloat((meta.reputationScore * 100).toFixed(2)),
        reputationScore: meta.reputationScore,
        costMultiplier: meta.costMultiplier,
        mode: meta.mode,
        chain: meta.chain,
        services: meta.services,
        totalEarned: 0,
        tasksCompleted: 0,
        budgetLimit: 10.0,
        budgetSpent: 0.0,
        taskHistory: [],
        status: "ACTIVE",
        registeredAt: Date.now(),
      };

      this.agents.push(agent);
      console.warn(
        `[MarketplaceService] Auto-created missing agent: ${agentId}`,
      );
    }

    // Ensure taskHistory array exists
    if (!Array.isArray(agent.taskHistory)) agent.taskHistory = [];

    // Update stats
    agent.totalEarned = parseFloat(
      ((agent.totalEarned || 0) + payout).toFixed(6),
    );
    agent.budgetSpent = parseFloat(
      ((agent.budgetSpent || 0) + payout).toFixed(4),
    );
    agent.tasksCompleted = (agent.tasksCompleted || 0) + 1;

    // DYNAMIC REPUTATION MODEL (Performance + Asymptotic Drift)
    const currentRep = agent.reputation || 90;
    let appliedDelta = 0;
    let reason = "Decay Drift";

    // Performance Jitter: Individual agents vary between 85% and 115% of the base performance
    const jitter = 0.85 + Math.random() * 0.3;

    if (performanceScore < 0.75) {
      // PERFORMANCE PENALTY: Significant hit for failure or low confidence
      const isLuckyBreak = Math.random() > 0.45; // ~55% chance of mixed positive outcome even in low confidence

      if (isLuckyBreak) {
        appliedDelta = 0.05 + Math.random() * 0.1;
        reason = "Resilient Contribution";
      } else {
        const basePenalty = (0.8 - performanceScore) * 5;
        appliedDelta = -Math.max(0.4, basePenalty * jitter);
        reason = "Low Confidence Penalty";
      }
    } else {
      // ASYMPTOTIC GAIN: Diminishing returns at high levels
      const saturation = (100 - currentRep) / 100;
      const efficiency = Math.pow(saturation, 0.4);
      const baseGain = (nominalDelta || 0.45) * efficiency;

      const decay = 0.008 + Math.random() * 0.012;
      const noise = Math.random() * 0.04 - 0.02; // More noise for variance

      // Scattered Outcome: 15% chance of a "Minor Hiccup" even in a success
      const isHiccup = Math.random() < 0.15;

      if (isHiccup) {
        appliedDelta = -(0.05 + Math.random() * 0.1);
        reason = "Minor Operational Glitch";
      } else {
        appliedDelta = baseGain * jitter - decay + noise;

        // Dynamic Reasoning based on value
        if (appliedDelta > 0.35 * jitter) reason = "Exceptional Precision";
        else if (appliedDelta > 0.15) reason = "Successful Contribution";
        else if (currentRep > 97) reason = "High-Rep Plateau";
        else reason = "Operational Latency";
      }
    }

    // Ensure we don't return NaN or null
    appliedDelta = parseFloat((appliedDelta || 0).toFixed(2));

    const oldRep = currentRep;
    agent.reputation = parseFloat(
      Math.min(99.9, Math.max(0, currentRep + appliedDelta)).toFixed(2),
    );
    agent.reputationScore = parseFloat((agent.reputation / 100).toFixed(4));

    const actualDeltaApplied = parseFloat(
      (agent.reputation - oldRep).toFixed(2),
    );

    // Append task to history (keep last 50)
    agent.taskHistory.push({
      taskId: taskRecord.taskId || `task_${Date.now()}`,
      service: taskRecord.service || "unknown",
      amount: payout,
      txHash: taskRecord.txHash || null,
      subTxHash: taskRecord.subTxHash || null,
      reputationDelta: actualDeltaApplied,
      timestamp: Date.now(),
    });

    if (agent.taskHistory.length > 50) {
      agent.taskHistory = agent.taskHistory.slice(-50);
    }

    this.saveStore();
    console.log(
      `✅ [MarketplaceSync] ${agentId}: ${oldRep.toFixed(2)}% -> ${agent.reputation.toFixed(2)}% (delta: ${actualDeltaApplied > 0 ? "+" : ""}${actualDeltaApplied} | score: ${performanceScore})`,
    );

    // Sync the live ReputationEngine so it sees the updated score immediately
    const finalRepScore = agent.reputationScore;
    getRepEngine()
      .then((RepEngine) => {
        RepEngine.syncFromStore(agentId, finalRepScore);
      })
      .catch(() => {});

    return {
      agent,
      reputationDelta: actualDeltaApplied,
      newReputation: agent.reputation,
      reason,
    };
  }

  /**
   * Register a third-party agent via API.
   * Persistent store will hold the metadata even after server restart.
   */
  registerExternalAgent(agentData) {
    const {
      id,
      name,
      role,
      services,
      costMultiplier,
      executionEndpoint,
      walletAddress,
    } = agentData;

    // Check if player already exists
    const existing = this.agents.find((a) => a.id === id);
    if (existing) {
      throw new Error(`Agent with ID ${id} already registered.`);
    }

    const newAgent = {
      id,
      name: name || id.replace(/_/g, " "),
      role: role || "External Provider",
      reputation: 80.0, // Default for new external agents
      reputationScore: 0.8,
      costMultiplier: Number(costMultiplier) || 1.0,
      executionEndpoint,
      walletAddress,
      isExternal: true,
      services: services || [],
      totalEarned: 0,
      tasksCompleted: 0,
      budgetLimit: 10.0,
      budgetSpent: 0.0,
      taskHistory: [],
      status: "ACTIVE",
      registeredAt: Date.now(),
    };

    this.agents.push(newAgent);
    this.saveStore();
    console.log(`[MarketplaceService] Registered external agent: ${id}`);
    return newAgent;
  }
}

export default new MarketplaceService();
