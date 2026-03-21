import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const JOBS_FILE = path.join(DATA_DIR, "jobs.json");

let jobs = [];

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(JOBS_FILE, JSON.stringify({ jobs }, null, 2), "utf8");
  } catch (err) {
    console.error("[NevoraX][JobStore] Persist failed:", err);
  }
}

function load() {
  try {
    if (fs.existsSync(JOBS_FILE)) {
      const raw = fs.readFileSync(JOBS_FILE, "utf8");
      const data = JSON.parse(raw);
      jobs = Array.isArray(data.jobs) ? data.jobs : [];
    }
  } catch (err) {
    console.warn("[NevoraX][JobStore] Load failed, using empty store:", err);
  }
}

load();

export function createJob({ description, budget }) {
  const job = {
    id: crypto.randomUUID(),
    description,
    budget: typeof budget === "number" ? budget : Number(budget) || 0,
    status: "pending",
    timeline: [],
    deliverables: [],
    createdAt: Date.now(),
  };

  jobs.push(job);
  persist();
  return job;
}

export function getJobs() {
  return jobs;
}

export function getJob(id) {
  return jobs.find((j) => j.id === id) || null;
}

export function updateJobStatus(id, status, extra = {}) {
  const job = getJob(id);
  if (!job) return null;
  job.status = status;
  Object.assign(job, extra);
  persist();
  return job;
}

export function appendJobTimeline(id, stage, detail = {}) {
  const job = getJob(id);
  if (!job) return null;
  job.timeline.push({
    stage,
    detail,
    timestamp: Date.now(),
  });
  persist();
  return job;
}
