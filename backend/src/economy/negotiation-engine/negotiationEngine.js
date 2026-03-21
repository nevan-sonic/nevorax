/**
 * Negotiation Engine
 * Settles on a fair price between a bid and a requester's budget.
 */

import { economicLedger } from "../../ledger/economic-ledger/economicLedger.js";
import { emitEvent } from "../../events/economyEventBus.js";

export const NegotiationEngine = {
  /**
   * Algorithmic Negotiation Logic
   * finalPrice = function(bidPrice, budget, reputation)
   */
  negotiatePrice(initialBid, requesterBudgetWei) {
    if (!initialBid) {
      console.warn(
        "[NegotiationEngine] Missing initialBid, using budget fallback.",
      );
      return String(requesterBudgetWei || "0");
    }
    const agentId = initialBid.agentId || "Unknown";
    const bidPrice = initialBid.price || "0";
    const reputation = initialBid.reputation ?? 0.5;

    const budget = BigInt(requesterBudgetWei || "0");
    const bid = BigInt(bidPrice || "0");

    emitEvent({
      type: "NEGOTIATION_STARTED",
      message: `Negotiation started with ${agentId} (Bid: ${bid}, Budget: ${budget}, Rep: ${reputation})`,
      agent: "NegotiationEngine",
    });

    // Algorithmic Bargaining:
    // If bid <= budget, we still try to negotiate a "fair" price based on reputation.
    // If reputation is high (1.0), provider has more leverage -> price closer to bid.
    // If reputation is low (0.0), provider has no leverage -> price closer to budget (if bid > budget)
    // or further reduced (if bid <= budget).

    // leverage = reputation (0 to 1)
    const leverage = reputation || 0.5;

    let finalPrice;

    if (bid > budget) {
      // Settle between budget and bid.
      // Higher leverage moves it towards the bid.
      const diff = bid - budget;
      // Use 1000 for 0.1% precision
      const leverageFactor = BigInt(Math.floor(leverage * 1000));
      finalPrice = budget + (diff * leverageFactor) / 1000n;
    } else {
      // Even if under budget, requester wants a good deal.
      // We apply a "social bargaining discount" ranging from 1% to 5% based on reputation.
      // High reputation (1.0) -> ~1% discount
      // Low reputation (0.0) -> ~5% discount
      const maxDiscountPercent = 5;
      const minDiscountPercent = 1;

      const discountPercent = BigInt(
        Math.floor(
          maxDiscountPercent -
            leverage * (maxDiscountPercent - minDiscountPercent),
        ),
      );
      const furtherDiscount = (bid * discountPercent) / 100n;

      // Ensure at least a tiny discount (1 units) if the bid is > 0
      finalPrice =
        bid - (furtherDiscount > 0n ? furtherDiscount : bid > 0n ? 1n : 0n);
    }

    economicLedger.recordEvent({
      type: "NEGOTIATION_COMPLETED",
      fromAgent: "NegotiationEngine",
      toAgent: agentId,
      amount: finalPrice.toString(),
      metadata: { leverage, initialBid: bid.toString() },
    });

    return String(finalPrice);
  },
};
