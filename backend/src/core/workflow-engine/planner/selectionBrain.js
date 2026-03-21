import { extractJSON } from "../../../utils/jsonUtils.js";
import { askLLM } from "../../../llm/groqClient.js";

/**
 * Selection Brain
 * Uses LLM to evaluate bids and select the best agent for a specific task.
 */
export async function selectBestProvider(
  goal,
  service,
  bids,
  priority = "QUALITY",
  maxBudget = "10.0",
) {
  if (!bids || bids.length === 0) return null;
  if (bids.length === 1)
    return { ...bids[0], reasoning: "Sole provider for this service." };

  const prompt = `
You are the NevoraX Selection Intelligence.
Your goal is to select the BEST agent for a specific service based on the user's overall objective and the competing bids.

User Goal: "${goal}"
Service Needed: "${service}"
Priority: ${priority}
Settlement Cap (HARD LIMIT): ${maxBudget} USDT

Competing Bids (All prices are in micro-units where 1,000,000 = 1 USDT):
${bids
  .map(
    (b, i) => `
[Agent ${i}]
ID: ${b.agentId}
Price: ${b.price} units (${(Number(b.price) / 1e6).toFixed(6)} USDT)
Reputation: ${(b.reputation * 100).toFixed(2)}%
Specialization: ${b.metadata?.mode || "General Performance"}
`,
  )
  .join("\n")}

Selection Rubric:
1. HARD ENFORCEMENT: Never select an agent whose price exceeds the Settlement Cap.
2. If Priority is "SPEED": Prioritize agents with "FAST" or "QUICK" specialized modes.
3. If Priority is "QUALITY": Prioritize agents with "HIGH_RES" or "DEEP" modes and highest reputation.
4. Balanced Logic: If no specialized modes exist, balance price and reputation.

Return ONLY valid JSON in the following format:
{
  "selectedAgentId": "agent_id_here",
  "reasoning": "A 1-sentence logical justification for why this agent is the most efficient choice within the budget."
}
`.trim();

  try {
    const response = await askLLM(prompt);
    const decision = extractJSON(response);

    if (!decision || !decision.selectedAgentId) {
      throw new Error("SelectionBrain: Extraction failed or ID missing.");
    }

    const selectedBid =
      bids.find((b) => b.agentId === decision.selectedAgentId) || bids[0];
    return {
      ...selectedBid,
      reasoning:
        decision.reasoning ||
        `Selected ${selectedBid.agentId} based on competitive value.`,
    };
  } catch (error) {
    console.warn(
      "[SelectionBrain] LLM selection failed, falling back to algorithmic choice.",
    );
    // Fallback: Choose highest reputation provider
    const best = bids.sort(
      (a, b) => (b.reputation || 0) - (a.reputation || 0),
    )[0];
    return {
      ...best,
      reasoning: `Selected ${best.agentId} automatically based on highest reputation (${(best.reputation * 100).toFixed(1)}%).`,
    };
  }
}
