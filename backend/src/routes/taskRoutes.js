import express from "express";
import { parseGoal } from "../core/workflow-engine/goalParser.js";
import { taskScheduler } from "../core/task-engine/taskScheduler.js";

const router = express.Router();

function parseTaskInput(data) {
  const raw =
    typeof data?.task === "string" && data.task.trim().length > 0
      ? data.task.trim()
      : "Generate ETH market report";

  const { task, budgetWei: parsedWei, budgetUnit } = parseGoal(raw);

  // Use provided budget if available, otherwise fallback to parsed or default
  const budgetUsdt = data.budget ? parseFloat(data.budget) : 10.0;
  const budgetWei = data.budget ? (budgetUsdt * 1e6).toString() : parsedWei;

  return {
    goal: raw,
    task,
    budgetWei,
    budgetUnit,
    metadata: {
      budgetUsdt,
      parsedBudget: budgetWei,
      budgetUnit,
      rawTask: raw,
    },
  };
}

console.log("Task routes loaded");

router.get("/task/run", async (req, res) => {
  try {
    const parsed = parseTaskInput({
      task: req.query.task,
      budget: req.query.budget,
    });
    const taskEntry = await taskScheduler.enqueueTask(
      parsed.goal || parsed.task,
      parsed,
    );
    res.json({
      message: "Task enqueued",
      taskId: taskEntry.taskId,
      status: taskEntry.status,
    });
  } catch (error) {
    console.error("[NevoraX][API] Failed to enqueue task:", error);
    res.status(500).json({ error: error.message || "Failed to enqueue task" });
  }
});

router.post("/task/run", async (req, res) => {
  try {
    const taskInput = req.body?.task || req.query?.task;
    const budgetInput = req.body?.budget || req.query?.budget;
    const parsed = parseTaskInput({
      task: taskInput,
      budget: budgetInput,
    });
    const taskEntry = await taskScheduler.enqueueTask(
      parsed.goal || parsed.task,
      parsed,
    );
    res.json({
      message: "Task enqueued",
      taskId: taskEntry.taskId,
      status: taskEntry.status,
    });
  } catch (error) {
    console.error("[NevoraX][API] Failed to enqueue task:", error);
    res.status(500).json({ error: error.message || "Failed to enqueue task" });
  }
});

router.post("/tasks/batch", async (req, res) => {
  try {
    const { tasks } = req.body;
    const results = await taskScheduler.runBatch(tasks);
    res.json({ message: `Enqueued ${results.length} tasks`, tasks: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/tasks/active", (req, res) => {
  res.json(taskScheduler.getActiveTasks());
});

router.get("/tasks/completed", (req, res) => {
  res.json(taskScheduler.getCompletedTasks());
});

export default router;
