import { extractJSON } from "../../../utils/jsonUtils.js";
import { askLLM } from "../../../llm/groqClient.js";
import { getAllAgents } from "../../../marketplace/agent-registry/agentRegistry.js";
import crypto from "crypto";

/**
 * Plan a task by decomposing the goal into required services using LLM.
 * @param {string} goal
 * @param {string} priority - "SPEED" or "QUALITY"
 * @returns {Promise<{taskId: string, services: string[], suggestedBudget: number}>}
 */
export async function planTask(goal, priority = "QUALITY") {
  const taskId = crypto.randomUUID();
  const agents = getAllAgents();

  // Get unique service types available in the ecosystem
  const registeredServices = [...new Set(agents.flatMap((a) => a.services))];
  const availableServices = [...registeredServices, "bridge_execution"];
  const lowerGoal = goal.toLowerCase();

  // Determine priority based on goal keywords
  if (lowerGoal.match(/fast|quick|speed|urgent|summary|simple|alert|brief/)) {
    priority = "SPEED";
  }

  const prompt = `
You are the NevoraX Strategy Architect. 
Your task is to decompose a user goal into a sequence of specialized sub-tasks (services) to achieve the objective.

User Goal: "${goal}"
Constraint: Priority is ${priority}

Available Services in Ecosystem:
${availableServices.map((s) => `- ${s}`).join("\n")}

Return ONLY valid JSON in the following format:
{
  "services": ["service_name_1", "service_name_2"],
  "estimatedComplexity": 0.8,
  "reasoning": "Brief explanation of why this sequence was chosen for this specific goal."
}

Rules:
1. Use ONLY services from the provided list.
2. The order of services should follow a logical execution pipeline.
3. Be EXTREMELY dynamic: Every different task input should result in a different, custom-tailored workflow. 
4. DEPTH MANDATE: 
   - If Priority is "SPEED": USE 1-2 STEPS (e.g., market_data -> report_generation).
   - If Priority is "QUALITY": USE 4-8 STEPS for maximum fidelity (e.g., data -> sentiment -> trend -> risk -> strategy -> execution -> report).
5. ACTION PRIORITY: If the goal specifies "execute", "run", "trade", "buy", "sell", "settle", or "execute a plan", you MUST include the "execution" service.
6. BRIDGE PRIORITY: If the goal mentions "rebalance", "bridge", "move liquidity", or "cross-chain rebalance", you MUST include the "bridge_execution" service in the sequence.
7. INNOVATION: Do not follow standard templates. Use logic to determine the most clever sequence of agents to solve the user's specific problem.

Do not include markdown or extra text.
`.trim();

  let plan;
  try {
    const llmResponse = await askLLM(prompt);
    plan = extractJSON(llmResponse);
    if (!plan) throw new Error("TaskPlanner: Extraction returned null.");
  } catch (error) {
    console.warn(
      "[TaskPlanner] LLM call or parsing failed, using robust decomposition fallback.",
    );

    // Generic Recovery: Use basic research steps if LLM fails
    const services = ["market_data", "report_generation"];

    plan = {
      services,
      estimatedComplexity: 0.4,
      reasoning:
        "LLM_PLANNER_RECOVERY_MODE: Primary reasoning engine unavailable. Defaulting to safe discovery-only services.",
    };
  }

  return {
    taskId,
    services: plan.services || ["market_data"],
    estimatedComplexity: plan.estimatedComplexity || 0.5,
    reasoning: plan.reasoning || "Standard analytical pipeline.",
  };
}
