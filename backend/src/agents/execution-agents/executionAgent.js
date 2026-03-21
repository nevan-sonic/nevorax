import {
  getAgentAddress,
  sendTokenFromAgent,
} from "../../wallets/agent-wallet-manager/walletManager.js";

import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { PricingStrategyEngine } from "../../economy/pricing-engine/pricingEngine.js";
import { getAgent } from "../../marketplace/agent-registry/agentRegistry.js";
import { ReputationEngine } from "../../economy/reputation-engine/reputationEngine.js";
import { config } from "../../utils/config/config.js";

/**
 * Generate a bid for a marketplace job based on agent identity.
 */
export function generateBid(job, agentId) {
  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  console.log(`[${agentId}] (${mode}) Generating bid for job: ${job.jobId}`);

  let bidPrice = PricingStrategyEngine.calculateBid(agentId, job.serviceType);

  const estimatedCost = config.economy.baseOperatingCost || 500000n; // nominal gas/compute

  if (!AgentProfitEngine.isProfitable(agentId, bidPrice, estimatedCost)) {
    return null;
  }

  const reputation = ReputationEngine.getReputation(agentId).reputationScore;
  return {
    agentId,
    price: bidPrice,
    reputation,
    metadata: agent.metadata,
  };
}

/**
 * ExecutionAgent Task
 */
export async function runExecutionAgentTask(
  taskId,
  context,
  rewardWei,
  agentId = "ExecutionAgent_OnChain",
) {
  const agent = getAgent(agentId);
  const mode = agent?.metadata?.mode || "STANDARD";

  console.log(
    `[${agentId}] (${mode}) Executing on-chain dispatch for ${taskId}`,
  );

  // Live Execution Flow
  const targetAddress = context.targetAddress;
  const amountUSDT = context.targetAmount; // expected in units (e.g., "10")

  console.log(`[DEBUG][ExecutionAgent] Context keys: ${Object.keys(context)}`);
  console.log(
    `[DEBUG][ExecutionAgent] targetAddress: ${targetAddress}, targetAmount: ${amountUSDT}`,
  );

  if (targetAddress && amountUSDT) {
    try {
      console.log(
        `[${agentId}] Initiating live transfer: ${amountUSDT} USDT to ${targetAddress}`,
      );

      // Convert to atoms (6 decimals for USDT)
      const atoms = BigInt(Math.floor(Number(amountUSDT) * 1_000_000));

      const result = await sendTokenFromAgent(agentId, targetAddress, atoms);

      return {
        status: "SUCCESS",
        mode: "ON_CHAIN",
        txHash: result.txHash,
        details: `Confirmed settlement of ${amountUSDT} USDT to target ${targetAddress}. Blockchain record broadcast successfully.`,
        action: "TRANSFER",
        amount: amountUSDT,
        destination: targetAddress,
      };
    } catch (error) {
      console.error(`[${agentId}] Transfer failed:`, error.message);

      let helpfulError = error.message;
      if (
        error.message.includes("insufficient funds") ||
        error.message.includes("gas required exceeds allowance")
      ) {
        const address = await getAgentAddress(agentId);
        helpfulError = `Insufficient Sepolia ETH for gas. Please fund the agent wallet: ${address}`;
      }

      return {
        status: "FAILED",
        mode: "ON_CHAIN",
        error: helpfulError,
        details: helpfulError,
      };
    }
  }

  return {
    status: "SUCCESS",
    mode: "ON_CHAIN",
    details:
      "On-chain provider ready. Process authorization required for specific capital dispatch.",
  };
}

/**
 * Traditional Payment Logic
 */
export async function executeTaskPayment() {
  // ... (keep original logic if needed, but the marketplace flow uses runTask)
}
