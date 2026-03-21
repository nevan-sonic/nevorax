import { emitEvent } from "../../events/economyEventBus.js";
import { AgentProfitEngine } from "../pricing-engine/financeEngine.js";

/**
 * SubscriptionEngine
 * Logic for agent-to-agent recurring service contracts.
 */

const subscriptions = new Map();

export const SubscriptionEngine = {
  /**
   * Create a recurring subscription between agents.
   */
  createSubscription(
    subscriberId,
    providerId,
    service,
    ratePerCycle,
    intervalMs,
  ) {
    const subId = `sub_${subscriberId}_${providerId}_${Date.now()}`;
    const sub = {
      subId,
      subscriberId,
      providerId,
      service,
      ratePerCycle: BigInt(ratePerCycle),
      intervalMs,
      lastPayment: Date.now(),
      status: "ACTIVE",
      totalCycles: 0,
    };
    subscriptions.set(subId, sub);

    emitEvent({
      type: "SUBSCRIPTION_CREATED",
      subId,
      subscriberId,
      providerId,
      metadata: { service, rate: ratePerCycle.toString() },
    });

    console.log(
      `[SubscriptionEngine] Created subscription ${subId}: ${subscriberId} -> ${providerId} (${service})`,
    );
    return sub;
  },

  /**
   * Process all active subscription payments (Simulated Tick).
   */
  async processCycle() {
    console.log("[SubscriptionEngine] Processing recurring agent payments...");
    const now = Date.now();
    let totalSettled = 0n;

    for (const sub of subscriptions.values()) {
      if (sub.status !== "ACTIVE") continue;

      if (now - sub.lastPayment >= sub.intervalMs) {
        try {
          // Verify capital
          const hasFunds = await AgentProfitEngine.hasOperatingCapital(
            sub.subscriberId,
          );
          if (!hasFunds) {
            console.warn(
              `[SubscriptionEngine] Sub ${sub.subId} failed: Insufficient funds for ${sub.subscriberId}`,
            );
            sub.status = "PAUSED_NO_FUNDS";
            continue;
          }

          // Execute simple internal finance transfer
          AgentProfitEngine.recordExpense(sub.subscriberId, sub.ratePerCycle);
          AgentProfitEngine.recordRevenue(sub.providerId, sub.ratePerCycle);

          sub.lastPayment = now;
          sub.totalCycles += 1;
          totalSettled += sub.ratePerCycle;

          emitEvent({
            type: "SUBSCRIPTION_RENEWED",
            subId: sub.subId,
            subscriberId: sub.subscriberId,
            providerId: sub.providerId,
            amount: sub.ratePerCycle.toString(),
          });
        } catch (err) {
          console.error(
            `[SubscriptionEngine] Error processing sub ${sub.subId}:`,
            err.message,
          );
        }
      }
    }
    return totalSettled;
  },

  getSubscriptionsForAgent(agentId) {
    return Array.from(subscriptions.values()).filter(
      (s) => s.subscriberId === agentId || s.providerId === agentId,
    );
  },
};
