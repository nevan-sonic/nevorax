import React, { useEffect, useState } from "react";
import { EconomyServices } from "../../services/apiService";
import {
  ShieldAlert,
  Zap,
  Banknote,
  Briefcase,
  RefreshCw,
  Activity,
} from "lucide-react";
import "./EconomicLedgerFeed.css";

function EventIcon({ type }) {
  if (type === "TASK_ENQUEUED" || type === "TASK_CREATED")
    return <Zap size={16} style={{ color: "var(--accent-primary)" }} />;
  if (
    type === "BID_SUBMITTED" ||
    type === "NEGOTIATION_STARTED" ||
    type === "NEGOTIATION_COMPLETED"
  )
    return <Briefcase size={16} style={{ color: "var(--status-progress)" }} />;
  if (type === "PAYMENT_EXECUTED" || type === "LEDGER_UPDATE")
    return <Banknote size={16} style={{ color: "var(--status-done)" }} />;
  if (type === "PROVIDER_SELECTED" || type === "AGREEMENT_CREATED")
    return <ShieldAlert size={16} style={{ color: "var(--accent-purple)" }} />;
  return <Activity size={16} style={{ color: "var(--text-muted)" }} />;
}

export function EconomicLedgerFeed() {
  const [events, setEvents] = useState([]);
  const [isLive, setIsLive] = useState(true);
  const [isCompact, setIsCompact] = useState(true);

  const fetchEvents = async () => {
    try {
      const data = await EconomyServices.getLedgerEvents();
      if (Array.isArray(data)) {
        const sorted = [...data]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);
        setEvents(sorted);
      }
    } catch (err) {
      console.error("Failed to sync ledger:", err);
    }
  };

  useEffect(() => {
    setTimeout(fetchEvents, 0);
    let interval;
    if (isLive) {
      interval = setInterval(fetchEvents, 2000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  return (
    <div className="ledger-feed glass-panel">
      <div className="feed-header flex-row justify-between align-center mb-4">
        <div className="flex-row gap-2 align-center">
          <Banknote size={14} className="text-dim" />
          <span
            className="mono"
            style={{ fontSize: "0.65rem", fontWeight: "600" }}
          >
            SYSTEM_LEDGER_STREAM
          </span>
          {isCompact && (
            <span
              className="mono"
              style={{
                fontSize: "0.55rem",
                background: "rgba(16,185,129,0.1)",
                color: "#10b981",
                padding: "1px 4px",
                borderRadius: "2px",
                marginLeft: "4px",
              }}
            >
              FOCUS ACTIVE
            </span>
          )}
        </div>
        <div className="flex-row gap-2">
          <button
            className={isCompact ? "btn-icon active" : "btn-icon"}
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? "Show Full Stream" : "Focus Latest Activities"}
            style={{ color: isCompact ? "var(--accent-primary)" : "inherit" }}
          >
            <Activity size={12} />
          </button>
          <button
            className={isLive ? "btn-icon active" : "btn-icon"}
            onClick={() => setIsLive(!isLive)}
            title="Toggle Live Stream"
          >
            <RefreshCw size={12} className={isLive ? "spin" : ""} />
          </button>
        </div>
      </div>

      <div className="ledger-table-container">
        {events.length === 0 ? (
          <div
            className="empty-state text-dim mono"
            style={{ fontSize: "0.65rem" }}
          >
            Awaiting activity...
          </div>
        ) : (
          <div className="ledger-rows flex-col gap-1">
            {(isCompact ? events.slice(0, 10) : events).map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="ledger-row mono flex-row gap-3"
              >
                <span className="row-time">
                  {new Date(evt.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className={`row-type ${evt.type.toLowerCase()}`}>
                  {evt.type.replace("_", " ")}
                </span>
                <span className="row-msg">
                  {evt.type === "BID_SUBMITTED" ? (
                    `${evt.fromAgent} bid ${(Number(evt.amount) / 1e6).toFixed(2)} USDT`
                  ) : evt.type === "PAYMENT_EXECUTED" ? (
                    <div className="flex-row gap-2 align-center">
                      <span>
                        Settle ${(Number(evt.amount) / 1e6).toFixed(2)} USDT
                      </span>
                      <span className="badge-mini openclaw">OPENCLAW</span>
                    </div>
                  ) : (
                    evt.message || "-"
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
