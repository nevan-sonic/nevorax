import express from "express";
import cors from "cors";

import walletRoutes from "./routes/walletRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import eventsRoute from "./routes/eventsRoute.js";
import taskHistoryRoutes from "./routes/taskHistoryRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import agentsRoutes from "./routes/agentsRoutes.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";
import treasuryRoutes from "./routes/treasuryRoutes.js";
import reputationRoutes from "./routes/reputationRoutes.js";
import agreementsRoutes from "./routes/agreementsRoutes.js";
import economyRoutes from "./routes/economyRoutes.js";
import economyEventsRoutes from "./routes/economyEventsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import deliverableRoutes from "./routes/deliverableRoutes.js";
import { initWdk } from "./wallets/transaction-manager/transactionManager.js";
import {
  AGENT_NAMES,
  getAgentAddress,
} from "./wallets/agent-wallet-manager/walletManager.js";

const app = express();

app.use(cors());
app.use(express.json());

// Global BigInt JSON Serializer Patch
BigInt.prototype.toJSON = function () {
  return this.toString();
};

app.use("/api", walletRoutes);
app.use("/api", taskRoutes);
app.use("/api", jobRoutes);
app.use("/api", eventsRoute);
app.use("/api", taskHistoryRoutes);
app.use("/api", systemRoutes);
app.use("/api", agentsRoutes);
app.use("/api", marketplaceRoutes);
app.use("/api", treasuryRoutes);
app.use("/api", reputationRoutes);
app.use("/api", agreementsRoutes);
app.use("/api", economyRoutes);
app.use("/api", economyEventsRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", deliverableRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "NevoraX",
    status: "running",
    message: "Agent economy backend online",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: Date.now(),
    version: "1.0.0",
  });
});

const PORT = 4000;

async function startServer() {
  try {
    await initWdk();

    console.log("NevoraX Vault: Agent Wallets Derived");

    // Pre-generate and log all agent addresses
    for (const agentName of AGENT_NAMES) {
      try {
        const address = await getAgentAddress(agentName);
        console.log(`[Vault] ${agentName.padEnd(20)} \u2192 ${address}`);
      } catch (error) {
        console.error(`[Vault][Error] Failed for ${agentName}:`, error.message);
      }
    }

    // Initialize Subscription Engine Loop (Recurring Agent Payments)
    import("./economy/subscription-engine/SubscriptionEngine.js").then(
      ({ SubscriptionEngine }) => {
        setInterval(() => SubscriptionEngine.processCycle(), 30000); // Process every 30s for demo
        console.log(
          "[SubscriptionEngine] Recurring settlement cycle initialized (30s cadence).",
        );
      },
    );

    app.listen(PORT, () => {
      console.log(`NevoraX server running on port ${PORT}`);
      console.log("NevoraX System APIs enabled:");
      console.log("/api/system/state");
      console.log("/api/agents");
      console.log("/api/marketplace");
      console.log("/api/treasury");
      console.log("/api/reputation");
      console.log("/api/agreements");
    });
  } catch (error) {
    console.error("[NevoraX][Startup] Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server with WDK initialization
startServer();
