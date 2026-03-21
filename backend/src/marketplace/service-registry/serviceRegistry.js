/**
 * Service registry mapping high-level services to primary provider agents.
 * Additional providers can still bid via the marketplace/biddingEngine.
 */
export const serviceRegistry = {
  market_data: "DataAgent",
  sentiment_analysis: "SentimentAgent",
  trend_analysis: "AnalysisAgent",
  strategy_generation: "StrategyAgent",
  report_generation: "ReportAgent",
};

export function getServiceProvider(service) {
  const agentId = serviceRegistry[service];
  if (!agentId) return null;
  const agent = getAgent(agentId);
  return { agent: agentId, config: agent || null };
}

export function listServices() {
  return Object.keys(serviceRegistry).map((key) => ({
    service: key,
    agent: serviceRegistry[key],
  }));
}
