import express from "express";

import {
  getAgentAddress,
  getAgentBalance,
  getAgentTokenBalance,
  transferFromAgent,
  AGENT_NAMES,
} from "../wallets/agent-wallet-manager/walletManager.js";

const router = express.Router();

/**
 * GET /wallets
 * Returns all agent wallets with address, balance, txCount (0 if not available).
 */
router.get("/wallets", async (req, res) => {
  try {
    const wallets = await Promise.all(
      AGENT_NAMES.map(async (agent) => {
        try {
          const [walletAddress, balance] = await Promise.all([
            getAgentAddress(agent),
            getAgentBalance(agent),
          ]);
          return {
            agent,
            walletAddress,
            balance,
            txCount: 0,
          };
        } catch (err) {
          return {
            agent,
            walletAddress: null,
            balance: "0",
            txCount: 0,
            error: err?.message,
          };
        }
      }),
    );
    return res.json(wallets);
  } catch (error) {
    console.error("[NevoraX][API] Failed to get wallets:", error);
    return res.status(500).json({ error: "Failed to retrieve wallets" });
  }
});

function isUnknownAgentError(error) {
  return (
    typeof error?.message === "string" &&
    error.message.startsWith("Unknown agent name:")
  );
}

/**
 * GET /wallet/address/:agent
 * Returns the wallet address for the specified agent.
 */
router.get("/wallet/address/:agent", async (req, res) => {
  const { agent } = req.params;

  try {
    const address = await getAgentAddress(agent);
    return res.json({
      agent,
      address,
    });
  } catch (error) {
    if (isUnknownAgentError(error)) {
      return res.status(404).json({
        error: "Unknown agent",
        agent,
      });
    }

    console.error("[NevoraX][API] Failed to get agent address:", error);
    return res.status(500).json({
      error: "Failed to retrieve agent address",
    });
  }
});

/**
 * GET /wallet/balance/:agent
 * Returns the native token balance for the specified agent.
 */
router.get("/wallet/balance/:agent", async (req, res) => {
  const { agent } = req.params;

  try {
    const balance = await getAgentBalance(agent);
    return res.json({
      agent,
      balance,
    });
  } catch (error) {
    if (isUnknownAgentError(error)) {
      return res.status(404).json({
        error: "Unknown agent",
        agent,
      });
    }

    console.error(
      "[NevoraX][API] Failed to get agent balance, returning 0:",
      error,
    );
    return res.json({
      agent,
      balance: "0",
    });
  }
});

/**
 * GET /wallet/token-balance/:agent
 * Returns the USDT token balance for the specified agent.
 */
router.get("/wallet/token-balance/:agent", async (req, res) => {
  const { agent } = req.params;

  try {
    const balance = await getAgentTokenBalance(agent);
    return res.json({
      agent,
      balance: balance.toString(),
    });
  } catch (error) {
    if (isUnknownAgentError(error)) {
      return res.status(404).json({
        error: "Unknown agent",
        agent,
      });
    }

    console.error(
      "[NevoraX][API] Failed to get agent token balance, returning 0:",
      error,
    );
    return res.json({
      agent,
      balance: "0",
    });
  }
});

/**
 * POST /wallet/send
 * Body:
 * {
 *   "fromAgent": "OrchestratorAgent",
 *   "to": "0x...",
 *   "amount": "10000000000000000"
 * }
 */
router.post("/wallet/send", async (req, res) => {
  const { fromAgent, to, amount } = req.body || {};

  if (!fromAgent || !to || amount === undefined) {
    return res.status(400).json({
      error: "Missing required fields: fromAgent, to, amount",
    });
  }

  try {
    const result = await transferFromAgent(fromAgent, to, amount);

    return res.json({
      fromAgent,
      to,
      amount: amount.toString(),
      txHash: result?.hash,
      fee:
        typeof result?.fee === "bigint" ? result.fee.toString() : result?.fee,
    });
  } catch (error) {
    if (isUnknownAgentError(error)) {
      return res.status(404).json({
        error: "Unknown fromAgent",
        fromAgent,
      });
    }

    if (
      typeof error?.message === "string" &&
      (error.message.includes("Invalid recipient address") ||
        error.message.includes("Invalid transaction value") ||
        error.message.includes("non-negative"))
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    console.error("[NevoraX][API] Failed to send transaction:", error);
    return res.status(500).json({
      error: "Failed to send transaction",
    });
  }
});

export default router;
