/**
 * Market Demand Engine
 * Tracks demand signals for services in the ecosystem.
 */

const demandStats = new Map();

/**
 * Record a new service request.
 */
export function recordServiceRequest(service) {
  const stats = getServiceStats(service);
  stats.totalRequests += 1;
  stats.lastRequestAt = Date.now();
}

/**
 * Record a failure to find a provider.
 */
export function recordMatchFailure(service) {
  const stats = getServiceStats(service);
  stats.failedRequests += 1;
  console.log(
    `[MarketDemandEngine] Demand spike detected for: ${service} (Failures: ${stats.failedRequests})`,
  );
}

/**
 * Record average price for a service.
 */
export function recordServicePrice(service, price) {
  const stats = getServiceStats(service);
  const newPrice = BigInt(price || "0");
  // Simple moving average as BigInt
  stats.averagePrice = stats.averagePrice
    ? (BigInt(stats.averagePrice) + newPrice) / 2n
    : newPrice;
}

/**
 * Get demand stats for a service.
 */
export function getServiceStats(service) {
  if (!demandStats.has(service)) {
    demandStats.set(service, {
      service,
      totalRequests: 0,
      failedRequests: 0,
      averagePrice: 0,
      lastRequestAt: 0,
    });
  }
  return demandStats.get(service);
}

/**
 * Get all demand stats.
 */
export function getAllDemandStats() {
  return Array.from(demandStats.values());
}
