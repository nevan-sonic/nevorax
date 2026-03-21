import { WalletBridge } from "../../wallets/wallet-bridge/WalletBridge.js";
import { emitEvent } from "../../events/economyEventBus.js";

let treasuryState = {
  balance: 1000000000n, // 1000 USDT in units (1e6)
  allocated: new Map(), // taskId -> BigInt
  spent: 0n,
  revenue: 0n,
  expenses: 0n,
};

/**
 * Reconcile treasury balance with on-chain OrchestratorAgent wallet (USDT).
 */
export async function reconcileTreasuryWithBlockchain() {
  try {
    const state = await WalletBridge.getFinancialState("OrchestratorAgent");
    treasuryState.balance = BigInt(state.balanceUnits);

    emitEvent({
      type: "TREASURY_RECONCILED",
      message: `Treasury reconciled with blockchain. Balance: ${state.formatted}`,
      balance: treasuryState.balance.toString(),
    });

    return treasuryState.balance;
  } catch (error) {
    console.error(
      "[NevoraX][Treasury] Blockchain reconciliation failed:",
      error.message,
    );
    return treasuryState.balance;
  }
}

export function allocateBudget(taskId, amount) {
  const amt = BigInt(amount || "0");

  if (treasuryState.balance < amt) {
    throw new Error(
      `Treasury insufficient funds: ${treasuryState.balance} < ${amt}`,
    );
  }

  treasuryState.balance -= amt;
  const currentAlloc = treasuryState.allocated.get(taskId) || 0n;
  treasuryState.allocated.set(taskId, currentAlloc + amt);

  emitEvent({
    type: "BUDGET_ALLOCATED",
    taskId,
    amount: amt.toString(),
    remaining: treasuryState.balance.toString(),
  });

  return amt;
}

export function releaseBudget(taskId) {
  return treasuryState.allocated.get(taskId) || 0n;
}

export function refundBudget(taskId) {
  const amount = treasuryState.allocated.get(taskId) || 0n;
  if (amount > 0n) {
    treasuryState.balance += amount;
    treasuryState.allocated.delete(taskId);

    emitEvent({
      type: "BUDGET_REFUNDED",
      taskId,
      amount: amount.toString(),
    });
  }
  return amount;
}

export function recordRevenue(amount) {
  const amt = BigInt(amount || "0");
  treasuryState.balance += amt;
  treasuryState.revenue += amt;
}

export function recordPayment(amount) {
  const amt = BigInt(amount || "0");
  treasuryState.spent += amt;
  treasuryState.expenses += amt;
}

/**
 * Evaluate economic viability.
 */
export function evaluateEconomicViability({ cost, reward }) {
  const c = BigInt(cost || "0");
  const r = reward != null ? BigInt(reward) : treasuryState.balance;

  if (c > r) {
    return {
      viable: false,
      reason: `Cost ${c} exceeds available reward/balance ${r}`,
    };
  }

  if (treasuryState.balance < c) {
    return {
      viable: false,
      reason: `Insufficient treasury balance: ${treasuryState.balance} < ${c}`,
    };
  }

  return { viable: true };
}

export function getTreasuryState() {
  const profit = treasuryState.revenue - treasuryState.expenses;

  // Convert BigInt to string for JSON compatibility
  return {
    balance: treasuryState.balance.toString(),
    spent: treasuryState.spent.toString(),
    revenue: treasuryState.revenue.toString(),
    expenses: treasuryState.expenses.toString(),
    profit: profit.toString(),
    allocatedCount: treasuryState.allocated.size,
  };
}
