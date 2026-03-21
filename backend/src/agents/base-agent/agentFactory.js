/**
 * Agent Factory
 * Dynamically spawns new agents when demand exceeds supply.
 */

import { registerAgent } from "../../marketplace/agent-registry/agentRegistry.js";

import { emitEvent } from "../../events/economyEventBus.js";

let spawnedCounter = 1;

/**
 * Spawn a new agent for a specific service.
 */
export async function spawnAgent(service, agentType) {
  const agentId = `${agentType}_v${spawnedCounter++}`;

  console.log(
    `[AgentFactory] Spawning new agent: ${agentId} for service: ${service}`,
  );

  // In this HD wallet system, we use the next available index.
  // Actually, we need to handle the index in agentWalletRegistry.
  // For now, we'll let AgentRegistry handle the metadata.

  // We'll generate a placeholder address or resolve it if the registry supports it.
  // The system prompt says "create WDK wallet", which in our case means
  // ensuring the HD index is tracked.

  const agentData = {
    agentId,
    agentType,
    services: [service],
    reputation: 0.5, // Initial reputation
    balance: 0,
    status: "active",
  };

  const registeredAgent = registerAgent(agentData);

  emitEvent({
    type: "AGENT_SPAWNED",
    agent: agentId,
    service,
    agentType,
  });

  return registeredAgent;
}
