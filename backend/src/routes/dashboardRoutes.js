import express from "express";
import { AgentProfitEngine } from "../economy/pricing-engine/financeEngine.js";
import { getReputationScore } from "../economy/reputation-engine/reputationEngine.js";
import { getTreasuryState } from "../agents/treasury-agent/treasuryAgent.js";
import { getAllTasks } from "../ledger/economic-ledger/store/taskStore.js";
import { getAllAgents } from "../marketplace/agent-registry/agentRegistry.js";
import { PricingStrategyEngine } from "../economy/pricing-engine/pricingEngine.js";
import { getJobs } from "../core/task-engine/jobs/jobStore.js";

const router = express.Router();

router.get("/dashboard", async (req, res) => {
  const finances = await Promise.all(
    AgentProfitEngine.getAllFinances().map(async (f) => {
      const realTimeCapital = await AgentProfitEngine.getRealTimeCapital(
        f.agentId,
      );
      return {
        ...f,
        revenue: f.revenue.toString(),
        expenses: f.expenses.toString(),
        profit: f.profit.toString(),
        capital: realTimeCapital,
      };
    }),
  );
  const treasury = getTreasuryState();
  const tasks = getAllTasks();
  const jobs = getJobs();

  const agents = getAllAgents().map((agent) => {
    const service =
      agent.services && agent.services.length > 0
        ? agent.services[0]
        : "unknown";
    let basePrice = "0";
    try {
      basePrice = PricingStrategyEngine.calculateBid(
        agent.agentId,
        service,
      ).toString();
    } catch (e) {
      /* empty */
    }

    return {
      name: agent.agentId,
      service: service,
      basePrice: basePrice,
    };
  });

  const agreements = tasks
    .map((t) => t.agreement)
    .filter((a) => a && a.agreementId);

  const totalUsdtTransacted = finances.reduce(
    (acc, f) => acc + BigInt(f.expenses),
    0n,
  );

  // Add bridge volume and counts to dashboard stats
  let bridgeStats = { count: 0, volume: "0" };
  try {
    const { BridgeManager } = await import("../economy/bridge-engine/bridgeManager.js");
    bridgeStats = BridgeManager.getStats();
  } catch (e) {
    /* ignore */
  }

  const combinedTasks = tasks.length + (bridgeStats.count || 0);
  const combinedVolume = totalUsdtTransacted + BigInt(bridgeStats.volume || "0");

  const totalReputation = agents.reduce(
    (acc, a) => acc + getReputationScore(a.name),
    0,
  );
  const avgReputation =
    agents.length > 0 ? (totalReputation / agents.length).toFixed(1) : "0.0";

  res.json({
    stats: {
      totalTasks: combinedTasks,
      totalUsdtTransacted: combinedVolume.toString(),
      activeAgents: agents.length,
      avgReputation,
    },
    agents,
    treasury,
    jobs,
    tasks,
    agreements,
    economy: finances,
  });
});

// NEW: Global Settlement Telemetry for Real-Time UI Bridge
import { economicLedger } from "../ledger/economic-ledger/economicLedger.js";
router.get("/economy/settlements", (req, res) => {
  const events = economicLedger
    .getLedger(30)
    .filter((e) => e.type === "AGENT_PAYMENT");

  res.json(
    events.map((e) => ({
      ...e,
      amount: e.amount?.toString(),
      reputationDelta: e.reputationDelta?.toString(),
    })),
  );
});

export default router;
