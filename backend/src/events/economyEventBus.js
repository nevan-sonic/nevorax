/**
 * Economy Event Bus
 * Tracks and broadcasts economic events in the NevoraX ecosystem.
 */

import crypto from "crypto";

const events = [];
const listeners = [];
const MAX_HISTORY = 100;

export const EconomyEventBus = {
  /**
   * Emit an economic event.
   * @param {{ type: string, message: string, agent?: string }} eventData
   */
  emit(eventData) {
    const event = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...eventData,
      agent: eventData.agent || "System",
    };

    events.push(event);
    if (events.length > MAX_HISTORY) {
      events.shift();
    }

    console.log(
      `[EconomyEvent][${event.agent}] ${event.type}: ${event.message}`,
    );

    // Notify listeners
    listeners.forEach((callback) => callback(event));
  },

  /**
   * Subscribe to economic events.
   */
  subscribe(callback) {
    listeners.push(callback);
    return () => {
      const idx = listeners.indexOf(callback);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  },

  /**
   * Get recent event history.
   */
  getEvents() {
    return [...events];
  },
};

export const emitEvent = (eventData) => EconomyEventBus.emit(eventData);
