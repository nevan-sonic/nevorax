import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const EconomyServices = {
  // Tasks
  enqueueTask: async (taskGoal, maxBudget = 10.0) => {
    const response = await api.post(
      `/task/run?task=${encodeURIComponent(taskGoal)}&budget=${maxBudget}`,
    );
    return response.data;
  },
  getActiveTasks: async () => {
    const response = await api.get("/tasks/active");
    return response.data;
  },
  getCompletedTasks: async () => {
    const response = await api.get("/tasks/completed");
    return response.data;
  },
  async getTreasuryData() {
    const res = await api.get("/economy/treasury");
    return res.data;
  },
  async bridgeAssets(amount, fromChain, toChain) {
    const res = await api.post("/economy/bridge", {
      amount,
      fromChain,
      toChain,
    });
    return res.data;
  },
  async getBridgeHistory() {
    const res = await api.get("/economy/bridge/history");
    return res.data;
  },
  async getBridgeLogs() {
    const res = await api.get("/economy/bridge/logs");
    return res.data;
  },

  // Ledger
  getLedger: async () => {
    const response = await api.get("/economy/ledger");
    return response.data;
  },
  clearLedger: async () => {
    const response = await api.delete("/economy/ledger");
    return response.data;
  },
  getLedgerEvents: async () => {
    const response = await api.get("/economy/events");
    return response.data;
  },
  getAgentLedger: async (agentId) => {
    const response = await api.get(`/economy/ledger/${agentId}`);
    return response.data;
  },

  // Agents & Marketplace
  getAgents: async () => {
    const response = await api.get(`/agents?t=${Date.now()}`);
    return response.data;
  },
  getAgentTokenBalance: async (agentId) => {
    const response = await api.get(`/wallet/token-balance/${agentId}`);
    return response.data;
  },
  getMarketplace: async () => {
    const response = await api.get(`/marketplace?t=${Date.now()}`);
    return response.data;
  },
  getTreasury: async () => {
    const response = await api.get("/treasury");
    return response.data;
  },
  getDashboardData: async () => {
    const response = await api.get("/dashboard");
    return response.data;
  },
  registerAgent: async (agentData) => {
    const response = await api.post("/agents/register", agentData);
    return response.data;
  },

  // High-Fidelity Telemetry
  getSettlements: async () => {
    const response = await api.get("/economy/settlements");
    return response.data;
  },
  getAgentHistory: async (agentId) => {
    const response = await api.get(
      `/agents/${agentId}/history?t=${Date.now()}`,
    );
    return response.data;
  },
  getAgentWalletAddress: async (agentId) => {
    const response = await api.get(`/agents/${agentId}/wallet`);
    return response.data;
  },
  getMultiChainWallets: async () => {
    const response = await api.get("/agents/multichain-wallets");
    return response.data;
  },
};
