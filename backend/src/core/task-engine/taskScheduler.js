import { runOrchestratedTask } from "../../agents/orchestrator-agent/orchestratorAgent.js";
import { EconomyEventBus } from "../../events/economyEventBus.js";

/**
 * Task Scheduler
 * Manages concurrent execution of autonomous workflows.
 */
export class TaskScheduler {
  constructor() {
    this.activeTasks = new Map();
    this.completedTasks = [];
    this.queue = [];
    this.maxConcurrent = 5;
  }

  /**
   * Enqueue a new task for processing.
   */
  async enqueueTask(goal, budgetObj) {
    const taskId = `task_${Math.random().toString(36).substr(2, 9)}`;
    const taskEntry = {
      taskId,
      goal,
      budgetObj,
      status: "QUEUED",
      enqueuedAt: Date.now(),
    };

    this.queue.push(taskEntry);

    EconomyEventBus.emit({
      type: "TASK_ENQUEUED",
      message: `Task enqueued: ${goal}`,
      taskId,
    });

    this.processQueue();
    return taskEntry;
  }

  /**
   * Process the task queue based on concurrency limits.
   */
  async processQueue() {
    if (
      this.queue.length === 0 ||
      this.activeTasks.size >= this.maxConcurrent
    ) {
      return;
    }

    const taskEntry = this.queue.shift();
    taskEntry.status = "STARTING";

    this.runTask(taskEntry);
    this.processQueue(); // Check if we can run more
  }

  /**
   * Execute an individual task workflow.
   */
  async runTask(taskEntry) {
    this.activeTasks.set(taskEntry.taskId, taskEntry);
    taskEntry.status = "RUNNING";
    taskEntry.startedAt = Date.now();

    console.log(
      `[Scheduler] Starting task: ${taskEntry.taskId} (${taskEntry.goal})`,
    );

    try {
      const result = await runOrchestratedTask(
        taskEntry.goal,
        taskEntry.budgetObj,
        (updates) => {
          const current = this.activeTasks.get(taskEntry.taskId);
          if (current) {
            if (!current.stepLog) current.stepLog = [];

            if (updates.details) {
              const lastEntry = current.stepLog[current.stepLog.length - 1];
              if (!lastEntry || lastEntry.details !== updates.details) {
                current.stepLog.push({
                  ...updates,
                  timestamp: Date.now(),
                });
              }
            }
            Object.assign(current, updates);
          }
        },
        taskEntry.taskId,
      );

      taskEntry.status = "COMPLETED";
      taskEntry.result = result;
      taskEntry.completedAt = Date.now();

      this.completedTasks.unshift({ ...taskEntry });
      if (this.completedTasks.length > 50) this.completedTasks.pop();
    } catch (error) {
      console.error(
        `[Scheduler] Task failed: ${taskEntry.taskId}`,
        error.message,
      );
      taskEntry.status = "FAILED";
      taskEntry.error = error.message;
      this.completedTasks.unshift({ ...taskEntry });
      if (this.completedTasks.length > 50) this.completedTasks.pop();
    } finally {
      this.activeTasks.delete(taskEntry.taskId);
      this.processQueue();
    }
  }

  /**
   * Run a batch of tasks simultaneously.
   */
  async runBatch(tasks) {
    console.log(`[Scheduler] Running batch of ${tasks.length} tasks...`);
    return Promise.all(tasks.map((t) => this.enqueueTask(t.goal, t.budgetObj)));
  }

  getActiveTasks() {
    return Array.from(this.activeTasks.values());
  }

  getCompletedTasks() {
    return this.completedTasks;
  }
}

export const taskScheduler = new TaskScheduler();
