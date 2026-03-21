import express from "express";
import { getSystemState } from "../ledger/economic-ledger/state/systemState.js";
import { EconomicStressTester } from "../testing/economicStressTester.js";

const router = express.Router();

router.get("/system/state", (req, res) => {
  res.json(getSystemState());
});

router.post("/system/stress-test", async (req, res) => {
  try {
    const { count } = req.body;
    const report = await EconomicStressTester.runStressTest(count || 3);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
