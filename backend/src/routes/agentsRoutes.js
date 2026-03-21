import express from "express";
import {
  getAllAgents,
  registerAgent,
  getAgentsByService,
} from "../marketplace/agent-registry/agentRegistry.js";
import { getLedgerByAgent } from "../ledger/economic-ledger/economicLedger.js";
import { getAgentFinance } from "../economy/pricing-engine/financeEngine.js";
import MarketplaceService from "../services/marketplaceService.js";

const router = express.Router();

router.get("/agents", (req, res) => {
  const agents = getAllAgents().map((agent) => {
    const rawFinance = getAgentFinance(agent.agentId);
    const finance = rawFinance
      ? {
          ...rawFinance,
          revenue: rawFinance.revenue.toString(),
          expenses: rawFinance.expenses.toString(),
          profit: rawFinance.profit.toString(),
          capital: rawFinance.capital.toString(),
        }
      : null;

    // Merge persisted stats from store
    const stored = MarketplaceService.getAgentById(agent.agentId);

    return {
      ...agent,
      totalEarned: stored?.totalEarned ?? agent.totalEarned ?? 0,
      tasksCompleted: stored?.tasksCompleted ?? agent.tasksCompleted ?? 0,
      reputation: stored?.reputation ?? agent.reputationScore * 100 ?? 90,
      reputationScore: stored?.reputationScore ?? agent.reputationScore ?? 0.9,
      finance,
    };
  });

  res.json(agents);
});

router.post("/agents/register", (req, res) => {
  const agent = registerAgent(req.body);
  res.json({ success: true, agent });
});

router.get("/agents/service/:serviceType", (req, res) => {
  const agents = getAgentsByService(req.params.serviceType);
  res.json(agents);
});

router.get("/agents/:agentId/history", (req, res) => {
  const { agentId } = req.params;

  // 1. PRIMARY: Get real settled tasks from persistent store (has actual tx hashes + amounts)
  const stored = MarketplaceService.getAgentById(agentId);
  const storeHistory = (stored?.taskHistory || [])
    .map((h) => ({
      eventId: `settle_${h.taskId}_${h.timestamp}`,
      type: "PAYMENT_SETTLED",
      fromAgent: "OrchestratorAgent",
      toAgent: agentId,
      service: h.service,
      amount: String(Math.round(h.amount * 1e6)),
      subTxHash: h.subTxHash || null,
      txHash: h.txHash || null,
      reputationDelta: h.reputationDelta,
      taskId: h.taskId,
      timestamp: h.timestamp,
    }))
    .reverse();

  // 2. SECONDARY: Get meaningful ledger events (negotiations only — these show decision-making)
  const meaningfulTypes = ["NEGOTIATION_FINALIZED"];
  const ledgerEvents = getLedgerByAgent(agentId, 50)
    .filter((e) => meaningfulTypes.includes(e.type))
    .map((e) => ({ ...e }));

  // 3. Merge, deduplicate by eventId, sort newest first, cap at 30
  const allEvents = [...storeHistory, ...ledgerEvents];
  const seen = new Set();
  const merged = allEvents
    .filter((e) => {
      if (seen.has(e.eventId)) return false;
      seen.add(e.eventId);
      return true;
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 30);

  res.json(merged);
});

// Get a single agent's wallet address for the Registry Proof button
router.get("/agents/:agentId/wallet", async (req, res) => {
  try {
    const { getAgentAddress } =
      await import("../wallets/agent-wallet-manager/walletManager.js");
    const address = await getAgentAddress(req.params.agentId);
    res.json({ agentId: req.params.agentId, walletAddress: address });
  } catch (err) {
    res.json({
      agentId: req.params.agentId,
      walletAddress: null,
      error: err.message,
    });
  }
});

/**
 * GET /api/agents/multichain-wallets
 * Returns HD-derived wallet addresses for core agents across all supported chains.
 * Demonstrates NevoraX's multi-chain wallet architecture — same seed, different chains.
 */
router.get("/agents/multichain-wallets", async (req, res) => {
  try {
    const { ethers } = await import("ethers");
    const seed = process.env.WDK_SEED_PHRASE;
    if (!seed) {
      return res.status(503).json({ error: "WDK_SEED_PHRASE not configured." });
    }

    const CHAINS = [
      { id: "sepolia",          name: "Ethereum Sepolia",   chainId: 11155111, rpc: "https://rpc.sepolia.org",                  live: true  },
      { id: "polygon_mumbai",   name: "Polygon Mumbai",     chainId: 80001,    rpc: "https://rpc-mumbai.maticvigil.com",         live: false },
      { id: "arbitrum_sepolia", name: "Arbitrum Sepolia",   chainId: 421614,   rpc: "https://sepolia-rollup.arbitrum.io/rpc",    live: false },
      { id: "optimism_sepolia", name: "Optimism Sepolia",   chainId: 11155420, rpc: "https://sepolia.optimism.io",               live: false },
      { id: "base_sepolia",     name: "Base Sepolia",       chainId: 84532,    rpc: "https://sepolia.base.org",                  live: false },
    ];

    // Core agents to expose (first 5 by index for brevity)
    const CORE_AGENTS = [
      { name: "OrchestratorAgent", index: 0 },
      { name: "Market_Data_1",     index: 1 },
      { name: "Trade_Executor_1",  index: 2 },
      { name: "Risk_Auditor_1",    index: 3 },
      { name: "Strategy_Planner_1",index: 4 },
    ];

    // Derive addresses — same BIP-44 path works across all EVM chains
    const wallets = CORE_AGENTS.map(({ name, index }) => {
      const path     = `m/44'/60'/0'/0/${index}`;
      const hdWallet = ethers.HDNodeWallet.fromPhrase(seed, "", path);
      const address  = hdWallet.address;

      const chains = CHAINS.map((chain) => ({
        ...chain,
        address,
        explorerUrl: chain.live
          ? `https://sepolia.etherscan.io/address/${address}`
          : null,
      }));

      return { agentId: name, hdIndex: index, chains };
    });

    res.json({
      derivationStandard: "BIP-44 m/44'/60'/0'/0/{index}",
      note: "All EVM chains share the same derived address per agent. 'live' indicates active on-chain settlement.",
      wallets,
    });
  } catch (err) {
    console.error("[MultiChainWallets] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
