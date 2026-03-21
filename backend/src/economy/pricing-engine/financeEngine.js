import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../../utils/config/config.js";
import { getAgentTokenBalance } from "../../wallets/agent-wallet-manager/walletManager.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "../../../data/financeStore.json");

function loadFinances() {
  try {
    if (!fs.existsSync(STORE_PATH)) return new Map();
    const data = fs.readFileSync(STORE_PATH, "utf8");
    const json = JSON.parse(data);
    const map = new Map();
    for (const [key, val] of Object.entries(json)) {
      map.set(key, {
        ...val,
        revenue: BigInt(val.revenue || "0"),
        expenses: BigInt(val.expenses || "0"),
        profit: BigInt(val.profit || "0"),
        capital: BigInt(val.capital || "0"),
      });
    }
    return map;
  } catch (e) {
    console.error("[FinanceStore] Error loading store:", e.message);
    return new Map();
  }
}

function syncToDisk() {
  try {
    const obj = {};
    for (const [key, val] of finances.entries()) {
      obj[key] = {
        ...val,
        revenue: val.revenue.toString(),
        expenses: val.expenses.toString(),
        profit: val.profit.toString(),
        capital: val.capital.toString(),
      };
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.error("[FinanceStore] Error syncing to disk:", e.message);
  }
}

const finances = loadFinances();

/**
 * Get or initialize financial record for an agent with BigInt precision.
 */
function getFinance(agentId) {
  if (!finances.has(agentId)) {
    finances.set(agentId, {
      agentId,
      revenue: 0n,
      expenses: 0n,
      profit: 0n,
      capital: config.economy.defaultBudget || 1000000000n, // Initial seed (1000 USDT)
      profitMargin: 0.0,
      totalJobs: 0,
    });
    syncToDisk();
  }
  return finances.get(agentId);
}

export const AgentProfitEngine = {
  /**
   * Evaluate if a task is profitable using BigInt.
   */
  isProfitable(agentId, rewardWei, estimatedCostWei) {
    const reward = BigInt(rewardWei || "0");
    const cost = BigInt(estimatedCostWei || "0");
    const margin = config.economy.minimumProfitMargin || 0.2;

    if (cost === 0n) return true;

    const profit = reward - cost;
    if (profit < 0n) return false;

    const actualMargin = Number((profit * 100n) / reward) / 100;
    return actualMargin >= margin;
  },

  /**
   * Record revenue as BigInt.
   */
  recordRevenue(agentId, amount) {
    const f = getFinance(agentId);
    f.revenue += BigInt(amount || "0");
    f.capital += BigInt(amount || "0");
    f.totalJobs += 1;
    this.updateStats(agentId);
    syncToDisk();
  },

  /**
   * Record expense as BigInt.
   */
  recordExpense(agentId, amount) {
    const f = getFinance(agentId);
    f.expenses += BigInt(amount || "0");
    f.capital -= BigInt(amount || "0");
    this.updateStats(agentId);
    syncToDisk();
  },

  /**
   * Update profit and margin stats.
   */
  updateStats(agentId) {
    const f = getFinance(agentId);
    f.profit = f.revenue - f.expenses;
    f.profitMargin =
      f.revenue === 0n ? 0 : Number((f.profit * 1000n) / f.revenue) / 1000;
    return f;
  },

  async hasOperatingCapital(agentId) {
    try {
      const balance = await getAgentTokenBalance(agentId);
      return BigInt(balance) > 0n;
    } catch (e) {
      const f = getFinance(agentId);
      return f.capital > 0n;
    }
  },

  async getRealTimeCapital(agentId) {
    try {
      return await getAgentTokenBalance(agentId);
    } catch (e) {
      return getFinance(agentId).capital.toString();
    }
  },

  getAgentFinance(agentId) {
    return getFinance(agentId);
  },

  getAllFinances() {
    return Array.from(finances.values());
  },
};

export const recordAgentRevenue = (agentId, amount) =>
  AgentProfitEngine.recordRevenue(agentId, amount);
export const recordAgentExpense = (agentId, amount) =>
  AgentProfitEngine.recordExpense(agentId, amount);
export const getAgentFinance = (agentId) =>
  AgentProfitEngine.getAgentFinance(agentId);
export const hasOperatingCapital = (agentId) =>
  AgentProfitEngine.hasOperatingCapital(agentId);
export const getRealTimeCapital = (agentId) =>
  AgentProfitEngine.getRealTimeCapital(agentId);
export const getAgentTokenBalanceRealTime = (agentId) =>
  AgentProfitEngine.getRealTimeCapital(agentId);
