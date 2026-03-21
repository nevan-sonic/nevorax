import { parseGoal } from "./goalParser.js";
import { planTask } from "./planner/taskPlanner.js";
import { getAgentsByService } from "../../marketplace/agent-registry/agentRegistry.js";

/**
 * Allocate budget per service dynamically.
 * @param {string[]} services
 * @param {string} totalBudgetWei
 * @param {number} complexity
 * @returns {{ [service: string]: string }}
 */
function allocateBudgetPerService(services, totalBudgetWei) {
  const total = BigInt(totalBudgetWei);
  const allocations = {};
  let remaining = total;

  // Simple dynamic rule: first service is usually most expensive (data fetching)
  // or middle services (analysis).
  // Complexity also scales the base cost.

  const n = services.length;
  if (n === 0) return {};

  const baseWeight = 1.0;
  const weights = services.map((_, i) => (i === 0 ? 1.5 : baseWeight));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  services.forEach((svc, i) => {
    const share =
      (total * BigInt(Math.floor(weights[i] * 100))) /
      BigInt(Math.floor(totalWeight * 100));
    const amt = share > remaining ? remaining : share;
    allocations[svc] = String(amt);
    remaining -= amt;
  });

  return allocations;
}

/**
 * Plan workflow from user goal.
 */
export async function planWorkflow(goal, manualBudgetWei = null) {
  const { task, budgetWei: parsedWei } = parseGoal(goal);

  // Determine priority based on goal keywords
  let priority = "QUALITY";
  if (
    goal.toLowerCase().match(/fast|quick|speed|urgent|summary|simple|alert/)
  ) {
    priority = "SPEED";
  }

  const taskPlan = await planTask(task, priority);

  const services = taskPlan.services;
  const finalBudgetWei = manualBudgetWei || parsedWei;

  const budgetAllocations = finalBudgetWei
    ? allocateBudgetPerService(
        services,
        finalBudgetWei,
        taskPlan.estimatedComplexity,
      )
    : null;

  // Build the workflow based on discovered services
  const workflow = services.map((service) => ({
    service,
    recommendedAgents: getAgentsByService(service).map((a) => a.agentId),
  }));

  return {
    taskId: taskPlan.taskId,
    task,
    services,
    budgetWei: finalBudgetWei,
    budgetAllocations,
    workflow,
    estimatedComplexity: taskPlan.estimatedComplexity,
  };
}
