export const providerExecutionMap = {
  CheapDataAgent: "DataAgent",
  FastDataAgent: "DataAgent",
  ReliableDataAgent: "DataAgent",
  DataAgent: "DataAgent",

  CheapSentimentAgent: "SentimentAgent",
  FastSentimentAgent: "SentimentAgent",
  SentimentAgent: "SentimentAgent",

  AnalysisAgent: "AnalysisAgent",
  StrategyAgent: "StrategyAgent",
  ReportAgent: "ReportAgent",
};

/**
 * Resolve the execution agent for a marketplace provider.
 * @param {string} provider - Marketplace provider name (e.g. CheapDataAgent)
 * @returns {string} - Execution agent name (e.g. DataAgent)
 */
export function resolveExecutionAgent(provider) {
  return providerExecutionMap[provider] || provider;
}
