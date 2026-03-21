const reputationStore = new Map();

/**
 * Get or initialize reputation record.
 */
function getRep(agentId, initialStatus = 0.9) {
  if (!reputationStore.has(agentId)) {
    reputationStore.set(agentId, {
      agentId,
      completionRate: 1.0,
      responseSpeed: initialStatus,
      accuracyScore: initialStatus,
      reputationScore: initialStatus,
      completedCount: 0,
      totalCount: 0,
    });
  }
  return reputationStore.get(agentId);
}

export const ReputationEngine = {
  /**
   * Update reputation after an agreement completion or failure.
   */
  recordPerformance(agentId, { success, accuracy, speed }) {
    const r = getRep(agentId);

    r.totalCount += 1;
    if (success) r.completedCount += 1;

    r.completionRate = r.completedCount / r.totalCount;

    // Moving averages for accuracy and speed
    if (accuracy != null) {
      r.accuracyScore = 0.8 * r.accuracyScore + 0.2 * accuracy;
    }
    if (speed != null) {
      r.responseSpeed = 0.8 * r.responseSpeed + 0.2 * speed;
    }

    // Formula: (completionRate * 0.5) + (accuracyScore * 0.3) + (responseSpeed * 0.2)
    r.reputationScore =
      r.completionRate * 0.5 + r.accuracyScore * 0.3 + r.responseSpeed * 0.2;

    console.log(
      `[ReputationBoard][${agentId}] Internal Track Score: ${r.reputationScore.toFixed(3)}`,
    );

    return r;
  },

  /**
   * Get reputation for an agent.
   */
  getReputation(agentId) {
    return getRep(agentId);
  },

  /**
   * Force-sync the in-memory reputation from an externally-persisted value.
   * Called by MarketplaceService after each settlement to keep this engine current.
   */
  syncFromStore(agentId, freshScore) {
    if (!reputationStore.has(agentId)) {
      getRep(agentId); // initialize first
    }
    const r = reputationStore.get(agentId);
    r.reputationScore = freshScore;
    r.accuracyScore = freshScore;
    r.responseSpeed = freshScore;
  },

  /**
   * Get all reputation records.
   */
  getAllReputations() {
    return Array.from(reputationStore.values());
  },
};
export const getAgentReputation = (agentId) =>
  ReputationEngine.getReputation(agentId);
export const getReputationScore = (agentId) =>
  ReputationEngine.getReputation(agentId).reputationScore;
