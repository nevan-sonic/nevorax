/**
 * Failure Recovery Engine
 * Automatically recovers from task execution failures with retries and marketplace re-opening.
 */

import { emitEvent, EconomyEventBus } from "../../events/economyEventBus.js";

const MAX_RETRIES = 2;
const retryCounts = new Map();

export const FailureRecoveryEngine = {
  /**
   * Evaluate if a task can be retried.
   */
  canRetry(taskId) {
    const count = retryCounts.get(taskId) || 0;
    return count < MAX_RETRIES;
  },

  /**
   * Execute recovery flow: re-open marketplace and collect new bids.
   */
  async recoverTask(taskId) {
    const count = (retryCounts.get(taskId) || 0) + 1;
    retryCounts.set(taskId, count);

    EconomyEventBus.emit({
      type: "FAILURE_RECOVERY",
      message: `Recovery attempt ${count}/${MAX_RETRIES} for task ${taskId}. Re-opening marketplace.`,
      agent: "RecoveryEngine",
    });

    // Strategy: Re-open the job in marketplace or trigger a new bidding cycle.
    // In our simplified flow, orchestrator handles this by re-triggering
    // the marketplace selection part of the loop.

    return {
      retryCount: count,
      shouldReOpenMarket: true,
    };
  },

  resetRetries(taskId) {
    retryCounts.delete(taskId);
  },
};
