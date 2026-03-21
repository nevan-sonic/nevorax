import express from "express";
import { getAllTasks } from "../ledger/economic-ledger/store/taskStore.js";

const router = express.Router();

router.get("/agreements", (req, res) => {
  const tasks = getAllTasks();

  const agreements = tasks.map((t) => ({
    taskId: t.taskId,
    agreement: t.agreement,
    agents: t.agents,
    txHash: t.txHash,
    subTaskTxHash: t.subTaskTxHash,
  }));

  res.json(agreements);
});

export default router;
