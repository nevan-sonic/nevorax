import express from "express";
import { eventBus, subscribe } from "../events/eventBus.js";

const router = express.Router();

router.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.write(": connected\n\n");

  const listener = (event) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (err) {
      eventBus.removeListener("event", listener);
    }
  };

  eventBus.on("event", listener);

  req.on("close", () => {
    eventBus.removeListener("event", listener);
  });
});

router.get("/events/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  res.write(": connected\n\n");
  subscribe(res);

  req.on("close", () => {
    const idx = res.app?.locals?.sseClients?.indexOf(res);
    if (idx !== undefined && idx !== -1)
      res.app.locals.sseClients?.splice(idx, 1);
  });
});

export default router;
