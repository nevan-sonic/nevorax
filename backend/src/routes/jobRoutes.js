import express from "express";
import {
  createJob,
  getJobs,
  getJob,
  updateJobStatus,
  appendJobTimeline,
} from "../core/task-engine/jobs/jobStore.js";
import { runOrchestratedTask } from "../agents/orchestrator-agent/orchestratorAgent.js";

const router = express.Router();

router.post("/jobs", async (req, res) => {
  try {
    const { description, budget } = req.body || {};

    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "description is required" });
    }

    const job = createJob({ description, budget });
    appendJobTimeline(job.id, "JobCreated", { description, budget });
    updateJobStatus(job.id, "planning");

    appendJobTimeline(job.id, "OrchestrationStarted", {});

    try {
      const result = await runOrchestratedTask(description);

      appendJobTimeline(job.id, "OrchestrationCompleted", {
        txHash: result.txHash,
        subTaskTxHash: result.subTaskTxHash,
      });

      updateJobStatus(job.id, "completed", { result });

      return res.json({ job, result });
    } catch (error) {
      appendJobTimeline(job.id, "Failed", { error: String(error) });
      updateJobStatus(job.id, "failed", { error: String(error) });
      return res.status(500).json({ error: "Job execution failed" });
    }
  } catch (error) {
    console.error("[NevoraX][API] Failed to create job:", error);
    return res.status(500).json({ error: "Failed to create job" });
  }
});

router.get("/jobs", (req, res) => {
  res.json(getJobs());
});

router.get("/jobs/:id", (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }
  res.json(job);
});

export default router;
