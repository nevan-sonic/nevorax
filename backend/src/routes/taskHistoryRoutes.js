import express from "express";
import {
  getAllTasks,
  getTaskById,
} from "../ledger/economic-ledger/store/taskStore.js";

const router = express.Router();

router.get("/tasks", (req, res) => {
  res.json(getAllTasks());
});

router.get("/tasks/:taskId", (req, res) => {
  const task = getTaskById(req.params.taskId);

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.json(task);
});

export default router;
