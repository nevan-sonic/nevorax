import express from "express";
import { EconomyEventBus } from "../events/economyEventBus.js";

const router = express.Router();

router.get("/economy/events", (req, res) => {
  res.json(EconomyEventBus.getEvents());
});

export default router;
