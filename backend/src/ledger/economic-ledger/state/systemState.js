import { getAllTasks } from "../store/taskStore.js";
import { getTreasuryState } from "../../../agents/treasury-agent/treasuryAgent.js";
import { getAllAgents } from "../../../marketplace/agent-registry/agentRegistry.js";
import { PricingStrategyEngine } from "../../../economy/pricing-engine/pricingEngine.js";

export function getSystemState() {
  const tasks = getAllTasks();
  const treasury = getTreasuryState();

  const agents = getAllAgents().map((agent) => {
    const service =
      agent.services && agent.services.length > 0
        ? agent.services[0]
        : "unknown";
    let basePrice = "0";
    try {
      basePrice = PricingStrategyEngine.calculateBid(
        agent.agentId,
        service,
      ).toString();
    } catch (e) {
      // Ignore
    }

    return {
      name: agent.agentId,
      service: service,
      basePrice: basePrice,
      reputation: agent.reputationScore,
    };
  });

  return {
    agents,
    treasury,
    tasks,
    timestamp: Date.now(),
  };
}
