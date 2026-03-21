/**
 * Goal Parser
 * Parses user goals to extract task description and budget constraints.
 */

const BUDGET_REGEX = /(\d+(?:\.\d+)?)\s*(eth|usdt|usd)\b/gi;

/** USDT uses 6 decimals */

/**
 * Parse a user goal string.
 * @param {string} goal
 * @returns {{ task: string, budgetWei: string | null, budgetUnit: string | null }}
 */
export function parseGoal(goal) {
  const task = (goal || "").trim();
  let budgetWei = null;
  let budgetUnit = null;

  const match = (task || "").match(BUDGET_REGEX);
  if (match) {
    const m = match[0];
    const valMatch = m.match(/(\d+(?:\.\d+)?)\s*(eth|usdt|usd)/i);
    if (valMatch) {
      const value = parseFloat(valMatch[1]);
      const unit = (valMatch[2] || "").toLowerCase();
      if (unit === "eth") {
        budgetWei = String(BigInt(Math.floor(value * 1e18)));
        budgetUnit = "ETH";
      } else if (unit === "usdt" || unit === "usd") {
        budgetWei = String(BigInt(Math.floor(value * 1000000)));
        budgetUnit = "USDT";
      }
    }
  }

  return { task, budgetWei, budgetUnit };
}
