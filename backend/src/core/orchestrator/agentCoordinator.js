import { createAgreement } from "../../contracts/service-agreement-manager/agreementManager.js";
import { recordAgentExpense } from "../../economy/pricing-engine/financeEngine.js";
import { logEconomy } from "../../utils/logging/logger.js";

/**
 * AgentCoordinator
 * Allows one agent to request services from another agent by
 * creating a dedicated sub-task contract.
 */
export async function requestAgentService({ requester, serviceAgent, taskId }) {
  logEconomy("SERVICE_REQUESTED", {
    requester,
    serviceAgent,
    taskId
  });

  const subTaskId = `${taskId}_${serviceAgent}`;

  logEconomy("SUBTASK_CREATED", {
    subTaskId,
    requester,
    serviceAgent,
  });

  const price = "500000000000000"; // 0.0005 ETH

  const contract = await createAgreement({
    taskId: subTaskId,
    providerAgent: serviceAgent,
    service: "unknown", // Coordination service
    price,
  });

  recordAgentExpense(requester, price);

  return {
    subTaskId,
    contract,
  };
}
