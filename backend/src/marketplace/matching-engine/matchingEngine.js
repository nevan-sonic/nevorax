import crypto from "crypto";
import { economicLedger } from "../../ledger/economic-ledger/economicLedger.js";

const PRICE_WEIGHT = 0.6;
const REPUTATION_WEIGHT = 0.4;

// Stochastic Market Constants
// Stochastic Market Constants
let MARKET_DEMAND_FACTOR = 1.0 + (Math.random() * 0.4 - 0.2); // Global shift ±20%

/**
 * Service Marketplace
 * Class-based system for job posting and bidding.
 */
export class ServiceMarketplace {
  constructor() {
    this.jobs = new Map();
  }

  /**
   * Post a new job to the marketplace.
   */
  postJob(serviceType, requesterAgent, maxBudget) {
    const jobId = crypto.randomUUID();

    // Shift global demand slightly for every job to simulate real-time volatility
    MARKET_DEMAND_FACTOR = 0.85 + Math.random() * 0.45; // Range 0.85x to 1.3x

    const job = {
      jobId,
      serviceType,
      requesterAgent,
      maxBudget: BigInt(maxBudget || "10000000"), // Default 10 USDT if not provided
      status: "OPEN",
      bids: [],
      createdAt: Date.now(),
    };
    this.jobs.set(jobId, job);

    economicLedger.recordEvent({
      type: "JOB_POSTED",
      fromAgent: requesterAgent,
      service: serviceType,
      amount: job.maxBudget.toString(),
      metadata: { jobId, demandVol: MARKET_DEMAND_FACTOR.toFixed(2) },
    });

    return job;
  }

  /**
   * Submit a bid for an open job.
   */
  submitBid(jobId, agentId, price, reputation, metadata = {}) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "OPEN") return null;

    if (!agentId || price == null) {
      console.warn(
        `[Marketplace] Invalid bid attempt from ${agentId}: price missing.`,
      );
      return null;
    }

    const baseBidPrice = BigInt(price || "0");

    // MATHEMATICALLY REALISTIC VARIANCE (High Variance)
    // Individual agent bidding strategies
    const stratRoll = Math.random();
    let stratMultiplier = 1.0;
    let stratName = "BALANCED";

    if (stratRoll > 0.6) {
      stratMultiplier = 0.65; // AGGRESSIVE (Discount to win, tight margin)
      stratName = "AGGRESSIVE_DISCOUNT";
    } else if (stratRoll < 0.4) {
      stratMultiplier = 1.45; // HIGH_MARGIN (Premium price)
      stratName = "PREMIUM_MARGIN";
    }

    const individualNoise = 0.8 + Math.random() * 0.4; // Personal ±20% noise
    const finalScaledPrice = BigInt(
      Math.floor(
        Number(baseBidPrice) *
          MARKET_DEMAND_FACTOR *
          stratMultiplier *
          individualNoise,
      ),
    );

    // Strict Budget Enforcement: Reject if over user cap
    if (finalScaledPrice > job.maxBudget) {
      console.log(
        `[Marketplace] Bid from ${agentId} rejected: over budget (${finalScaledPrice} vs cap ${job.maxBudget})`,
      );
      return null;
    }

    const bid = {
      agentId,
      price: finalScaledPrice,
      reputation: reputation ?? 0.5,
      metadata: { ...metadata, biddingStrategy: stratName },
      timestamp: Date.now(),
    };

    job.bids.push(bid);

    economicLedger.recordEvent({
      type: "BID_SUBMITTED",
      fromAgent: agentId,
      service: job.serviceType,
      amount: finalScaledPrice.toString(),
      metadata: {
        jobId,
        reputation: bid.reputation,
        mode: metadata.mode,
        strategy: stratName,
        volatility: MARKET_DEMAND_FACTOR.toFixed(2),
      },
    });

    return bid;
  }

  /**
   * Select the best bid based on value score and input-fit context.
   */
  selectBestBid(jobId, selectionCriteria = {}) {
    const job = this.jobs.get(jobId);
    if (!job || !job.bids || job.bids.length === 0) return null;

    job.status = "BIDDING";

    // Final defensive filter
    const validBids = job.bids.filter((b) => b && b.price != null && b.agentId);
    if (validBids.length === 0) return null;

    try {
      const allPrices = validBids.map((b) => Number(b.price || 0));
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);

      const scoredBids = validBids.map((bid) => {
        // A. Price Score (Lower is better)
        let normalizedPrice = 0.5;
        if (maxPrice !== minPrice) {
          normalizedPrice =
            (Number(bid.price || 0) - minPrice) / (maxPrice - minPrice);
        }

        // B. Reputation Score (Higher is better)
        const rep = bid.reputation ?? 0.5;

        // C. Input-Fit Score (Logical preference)
        // If criteria prioritize speed, prefer agents with 'QUICK' or 'FAST' metadata
        // If criteria prioritize quality, prefer agents with 'HIGH_RES' or 'DEEP' metadata
        let fitScore = 1.0;
        const agent = bid.metadata || {}; // Assume metadata passed from registry

        if (selectionCriteria.priority === "SPEED") {
          if (agent.mode === "QUICK" || agent.mode === "FAST")
            fitScore = 0.2; // Lower score is better for sorting
          else if (agent.mode === "HIGH_RES" || agent.mode === "DEEP")
            fitScore = 0.8;
        } else if (selectionCriteria.priority === "QUALITY") {
          if (agent.mode === "HIGH_RES" || agent.mode === "DEEP")
            fitScore = 0.2;
          else if (agent.mode === "QUICK" || agent.mode === "FAST")
            fitScore = 0.8;
        }

        const score =
          PRICE_WEIGHT * normalizedPrice +
          REPUTATION_WEIGHT * (1 - rep) +
          0.2 * fitScore;

        return { ...bid, valueScore: score };
      });

      scoredBids.sort((a, b) => (a.valueScore || 0) - (b.valueScore || 0));
      const bestBid = scoredBids[0];

      if (!bestBid) return null;

      job.selectedAgent = bestBid.agentId;
      job.status = "SELECTED";

      economicLedger.recordEvent({
        type: "PROVIDER_SELECTED",
        fromAgent: "Marketplace",
        toAgent: bestBid.agentId,
        service: job.serviceType,
        amount: bestBid.price.toString(),
        metadata: {
          jobId,
          valueScore: bestBid.valueScore,
          criteria: selectionCriteria.priority,
        },
      });

      return bestBid;
    } catch (err) {
      console.error("[Marketplace] Scoring failure:", err.message);
      return validBids[0]; // Emergency fallback
    }
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  getBids(jobId) {
    const job = this.jobs.get(jobId);
    return job ? job.bids : [];
  }

  updateSessionVolatility() {
    MARKET_DEMAND_FACTOR = 1.0 + (Math.random() * 0.4 - 0.2);
    console.log(
      `[Marketplace] Market Volatility Shift: ${MARKET_DEMAND_FACTOR > 1 ? "High Demand" : "Surplus Supply"} (${MARKET_DEMAND_FACTOR.toFixed(2)}x)`,
    );
  }
}

export const marketplace = new ServiceMarketplace();
