import express from "express";
import { getDeliverables } from "../assets/deliverableStore.js";

const router = express.Router();

router.get("/deliverables", (req, res) => {
  res.json(getDeliverables());
});

export default router;
