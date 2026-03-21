import crypto from "crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EconomyEventBus } from "../../events/economyEventBus.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LEDGER_PATH = path.join(__dirname, "../../../data/economic_ledger.json");

/**
 * Economic Ledger
 * Maintains a global history of all economic events in the NevoraX ecosystem.
 */
class EconomicLedger {
  constructor() {
    this.maxEvents = 500;
    this.events = this.loadLedger();
  }

  loadLedger() {
    try {
      if (fs.existsSync(LEDGER_PATH)) {
        const data = fs.readFileSync(LEDGER_PATH, "utf8");
        return JSON.parse(data).slice(-this.maxEvents);
      }
    } catch (err) {
      console.error("[Ledger] Load Error:", err.message);
    }
    return [];
  }

  saveLedger() {
    try {
      fs.writeFileSync(
        LEDGER_PATH,
        JSON.stringify(this.events, null, 2),
        "utf8",
      );
    } catch (err) {
      console.error("[Ledger] Save Error:", err.message);
    }
  }

  /**
   * Record an economic event.
   */
  recordEvent(eventData) {
    const event = {
      eventId: crypto.randomUUID(),
      timestamp: Date.now(),
      type: eventData.type,
      fromAgent: eventData.fromAgent || null,
      toAgent: eventData.toAgent || null,
      service: eventData.service || null,
      amount: eventData.amount ? eventData.amount.toString() : null,
      subTxHash: eventData.subTxHash || null,
      metadata: eventData.metadata || {},
    };

    this.events.push(event);

    // Maintain size
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    this.saveLedger();
    console.log(
      `[Ledger] ${event.type}: ${event.fromAgent || "System"} -> ${event.toAgent || ""} (${event.amount || ""})`,
    );

    // Persistence

    // Also broadcast to the internal event bus for real-time UI/hooks
    EconomyEventBus.emit({
      type: "LEDGER_UPDATE",
      event,
    });

    return event;
  }

  /**
   * Get events for a specific agent (Case-Insensitive).
   */
  getLedgerByAgent(agentId, limit = 100) {
    if (!agentId) return [];
    const searchId = agentId.toLowerCase();

    return this.events
      .filter(
        (e) =>
          (e.fromAgent && e.fromAgent.toLowerCase() === searchId) ||
          (e.toAgent && e.toAgent.toLowerCase() === searchId),
      )
      .slice(-limit)
      .reverse();
  }

  /**
   * Get the latest events.
   */
  getLedger(limit = 100) {
    return this.events.slice(-limit).reverse();
  }

  getHistory() {
    return this.events || [];
  }

  /**
   * Clear ledger.
   */
  clear() {
    this.events = [];
    this.saveLedger();
  }
}

export const economicLedger = new EconomicLedger();
export const getLedgerByAgent = (agentId, limit) =>
  economicLedger.getLedgerByAgent(agentId, limit);
