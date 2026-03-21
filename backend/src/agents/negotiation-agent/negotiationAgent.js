/**
 * Negotiation Agent
 * Uses LLM reasoning to conduct autonomous price negotiations between agents.
 */

import { extractJSON } from "../../utils/jsonUtils.js";
import { askLLM } from "../../llm/groqClient.js";

import { NegotiationEngine } from "../../economy/negotiation-engine/negotiationEngine.js";
import { economicLedger } from "../../ledger/economic-ledger/economicLedger.js";

/**
 * Negotiate a fair price for a service.
 * @param {string} service - The service type being negotiated.
 * @param {string | bigint} bidPrice - The provider's initial bid.
 * @param {string | bigint} budget - The requester's maximum budget.
 * @param {number} reputation - The provider's reputation (0 to 1).
 * @returns {Promise<string>} The final negotiated price in WEI.
 */
export async function negotiatePrice(
  service,
  bidPrice,
  budget,
  reputation = 0.5,
) {
  const bid = BigInt(bidPrice);
  const maxBudget = BigInt(budget);

  console.log(
    `[NegotiationAgent] Starting LLM-driven negotiation for ${service}`,
  );
  console.log(
    `[NegotiationAgent] Bid: ${bid}, Budget: ${maxBudget}, Rep: ${reputation}`,
  );

  economicLedger.recordEvent({
    type: "NEGOTIATION_LOG",
    fromAgent: "Orchestrator",
    toAgent: "NegotiationAgent",
    details: `Initiating fiscal negotiation for ${service}. Countering bid of ${(Number(bid) / 1e6).toFixed(2)} USDT.`,
  });

  // 1. Get base algorithmic offer from NegotiationEngine
  const baseNegotiatedPrice = NegotiationEngine.negotiatePrice(
    { agentId: "Provider", price: bid, reputation },
    maxBudget,
  );

  // 2. Determine Negotiation Personality (The "Entropy" factor)
  const personalities = [
    {
      type: "SHREWD",
      instruction:
        "Aim for a subtle 1-3% discount to maintain long-term provider relations.",
      bias: 0.98,
    },
    {
      type: "RATIONAL",
      instruction:
        "Aim for a logical 5-7% discount based on session market volatility.",
      bias: 0.94,
    },
    {
      type: "AGGRESSIVE",
      instruction:
        "You are a hard-nosed auditor. Demand a 10-15% discount or threaten selection review.",
      bias: 0.88,
    },
  ];
  const personality =
    personalities[Math.floor(Math.random() * personalities.length)];

  // 3. Use LLM to refine the negotiation (Adding "Human-like" economic reasoning)
  const prompt = `
You are the NevoraX ${personality.type} Negotiation Intelligence.
Service: ${service}
Provider Bid: ${bid} Wei
Requester Budget: ${maxBudget} Wei
Provider Reputation: ${reputation}
Algorithmic Fair Price: ${baseNegotiatedPrice} Wei

Personality Context: ${personality.instruction}

Goal: Finalize a negotiated price.
Strategic Instructions: 
- Your current bias multiplier is ${personality.bias}.
- Provide a brief, professional justification in character as a ${personality.type} negotiator.

Return ONLY valid JSON:
{
  "finalPriceWei": "string (digits only)",
  "justification": "Tough but fair economic reasoning"
}
`.trim();

  try {
    const llmResponse = await askLLM(prompt);
    const parsed = extractJSON(llmResponse);

    if (!parsed || !parsed.finalPriceWei) {
      throw new Error("NegotiationAgent: Extraction failed or field missing.");
    }

    let finalPrice = BigInt(parsed.finalPriceWei);

    // Safety checks: Never exceed initial bid, never go below 50% of bid unless necessary for budget
    if (finalPrice > bid) finalPrice = bid;
    if (finalPrice > maxBudget) finalPrice = maxBudget;

    console.log(
      `[NegotiationAgent] Negotiated Price: ${finalPrice} (${parsed.justification})`,
    );

    economicLedger.recordEvent({
      type: "NEGOTIATION_LOG",
      fromAgent: "NegotiationAgent",
      toAgent: "Orchestrator",
      details: `${parsed.justification}. Final price: ${(Number(finalPrice) / 1e6).toFixed(2)} USDT.`,
    });

    economicLedger.recordEvent({
      type: "NEGOTIATION_FINALIZED",
      fromAgent: "NegotiationAgent",
      service,
      amount: finalPrice.toString(),
      metadata: {
        justification: parsed.justification,
        initialBid: bid.toString(),
        budget: maxBudget.toString(),
      },
    });

    return finalPrice.toString();
  } catch (error) {
    console.warn(
      "[NegotiationAgent] LLM negotiation failed, falling back to algorithmic price:",
      error.message,
    );
    let finalPrice = baseNegotiatedPrice;
    if (finalPrice > bid) finalPrice = bid;

    const justification = `Algorithmic counter-offer applied based on standard market rates and ${reputation} rep score.`;

    economicLedger.recordEvent({
      type: "NEGOTIATION_LOG",
      fromAgent: "NegotiationAgent",
      toAgent: "Orchestrator",
      details: `${justification} Final price: ${(Number(finalPrice) / 1e6).toFixed(4)} USDT.`,
    });

    economicLedger.recordEvent({
      type: "NEGOTIATION_FINALIZED",
      fromAgent: "NegotiationAgent",
      service,
      amount: finalPrice.toString(),
      metadata: {
        justification,
        initialBid: bid.toString(),
        budget: maxBudget.toString(),
      },
    });

    return finalPrice.toString();
  }
}
