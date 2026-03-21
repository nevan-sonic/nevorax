import express from "express";
import { getAgentReputation } from "../economy/reputation-engine/reputationEngine.js";
import { getAllAgents } from "../marketplace/agent-registry/agentRegistry.js";

const router = express.Router();

router.get("/reputation", (req, res) => {
  const reputation = getAllAgents().map((agent) => ({
    agent: agent.agentId,
    stats: getAgentReputation(agent.agentId),
  }));

  res.json(reputation);
});

export default router;
