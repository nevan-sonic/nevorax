import { EventEmitter } from "events";

export const eventBus = new EventEmitter();

const sseClients = [];

export function subscribe(res) {
  sseClients.push(res);
  res.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
}

export function getSSEClients() {
  return sseClients;
}

export function emitEvent(type, payload) {
  const event = {
    type,
    payload,
    timestamp: Date.now(),
  };

  console.log("[NevoraX Event]", event);

  eventBus.emit("event", event);

  sseClients.forEach((res) => {
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    } catch (err) {
      console.warn("[NevoraX Event] SSE write failed:", err);
    }
  });
}
