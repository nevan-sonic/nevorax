import { AgentProfitEngine } from "./financeEngine.js";
import { getAllAgents } from "../../marketplace/agent-registry/agentRegistry.js";

let metrics = {
  totalTransactionsByAgreement: 0,
  totalRevenue: 0n,
  totalExpenses: 0n,
  totalValueSettled: 0n,
  activeAgents: 0,
};

export const EconomyMetricsEngine = {
  /**
   * Update and return global metrics.
   */
  updateMetrics() {
    const finances = AgentProfitEngine.getAllFinances();
    const agents = getAllAgents();

    metrics.totalRevenue = finances.reduce(
      (sum, f) => sum + BigInt(f.revenue),
      0n,
    );
    metrics.totalExpenses = finances.reduce(
      (sum, f) => sum + BigInt(f.expenses),
      0n,
    );
    metrics.totalValueSettled = metrics.totalRevenue;
    metrics.activeAgents = agents.filter(
      (a) => a.status === "ACTIVE" || a.status === "IDLE",
    ).length;

    return {
      totalTransactionsByAgreement: metrics.totalTransactionsByAgreement,
      totalRevenue: metrics.totalRevenue.toString(),
      totalExpenses: metrics.totalExpenses.toString(),
      totalValueSettled: metrics.totalValueSettled.toString(),
      activeAgents: metrics.activeAgents,
    };
  },

  /**
   * Record a completed agreement in metrics.
   */
  recordAgreementCompletion() {
    metrics.totalTransactionsByAgreement += 1;
    this.updateMetrics();
  },

  /**
   * Get current metrics.
   */
  getMetrics() {
    return this.updateMetrics();
  },
};
