import express from "express";
import { EconomyMetricsEngine } from "../economy/pricing-engine/economyEngine.js";
import {
  economicLedger,
  getLedgerByAgent,
} from "../ledger/economic-ledger/economicLedger.js";
import { TreasuryEngine } from "../economy/treasury-engine/TreasuryEngine.js";
import { BridgeEngine } from "../wallets/bridge-engine/BridgeEngine.js";

const router = express.Router();

router.get("/economy/ledger", (req, res) => {
  res.json(economicLedger.getLedger(100));
});

router.delete("/economy/ledger", (req, res) => {
  economicLedger.clear();
  res.json({ success: true, message: "Ledger cleared" });
});

router.get("/economy/ledger/:agentId", (req, res) => {
  res.json(getLedgerByAgent(req.params.agentId));
});

router.get("/economy/treasury", (req, res) => {
  const stats = TreasuryEngine.getStats();
  // Ensure we don't include raw BigInts in the spread, as they crash res.json
  const { balance, totalEarnings, totalExpenses, negotiationSavings, ...rest } =
    stats;
  res.json({
    ...rest,
    balance: balance.toString(),
    totalEarnings: totalEarnings.toString(),
    totalExpenses: totalExpenses.toString(),
    negotiationSavings: negotiationSavings.toString(),
  });
});

router.post("/economy/bridge", async (req, res) => {
  const { amount, fromChain, toChain } = req.body;
  try {
    const result = await BridgeEngine.bridgeAssets(amount, fromChain, toChain);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/economy/bridge/history", (req, res) => {
  res.json(BridgeEngine.getTransferHistory());
});

router.get("/economy/bridge/logs", (req, res) => {
  res.json(BridgeEngine.logs || []);
});

router.get("/economy", (req, res) => {
  res.json(EconomyMetricsEngine.getMetrics());
});

router.get("/economy/metrics", (req, res) => {
  res.json(EconomyMetricsEngine.getMetrics());
});

export default router;
