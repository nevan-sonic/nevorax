import React, { useEffect, useState, useRef } from "react";
import { EconomyServices } from "../../services/apiService";
import { Terminal, Copy, Trash2 } from "lucide-react";
import "./DevTerminal.css";

export function DevTerminal({ latestTaskTime }) {
  const [logs, setLogs] = useState([]);
  const terminalRef = useRef(null);
  const sessionStartTime = useRef(null);
  // eslint-disable-next-line react-hooks/purity
  if (!sessionStartTime.current) sessionStartTime.current = Date.now();

  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        const history = await EconomyServices.getLedger();
        if (Array.isArray(history)) {
          // Filter for negotiation/agreement events AND session-based timing
          const negLogs = history
            .filter(
              (e) =>
                [
                  "NEGOTIATION_LOG",
                  "AGREEMENT_CREATED",
                  "BID_SUBMITTED",
                  "NEGOTIATION_STARTED",
                    "TASK_CREATED",
                    "PAYMENT_SETTLED",
                  ].includes(e.type) && e.timestamp > sessionStartTime.current,
              )
              .map((e) => {
                // Create a stable ID based on event properties
                const stableId = `${e.timestamp}-${e.type}-${e.fromAgent || ""}-${e.toAgent || ""}`;
  
                let displayMsg = e.details || e.message;
                if (e.metadata && e.type === "BID_SUBMITTED") {
                  displayMsg = `${e.fromAgent} bids ${(Number(e.amount) / 1e6).toFixed(6)} USDT (Rep: ${(e.metadata.reputation * 100).toFixed(2)}%)`;
                } else if (e.metadata && e.type === "AGREEMENT_CREATED") {
                  displayMsg = `Contract: ${e.fromAgent} <-> ${e.toAgent} | Stake: ${(Number(e.amount) / 1e6).toFixed(6)} USDT`;
                } else if (e.type === "TASK_CREATED") {
                  displayMsg = `New task dispatched → OrchestratorAgent`;
                } else if (e.type === "PAYMENT_SETTLED") {
                  displayMsg = `Settlement: ${e.fromAgent} → ${e.toAgent}: ${(Number(e.amount) / 1e6).toFixed(6)} USDT`;
                }

              return {
                id: stableId,
                time: new Date(e.timestamp).toLocaleTimeString([], {
                  hour12: false,
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                }),
                type: e.type,
                msg:
                  displayMsg ||
                  `${e.fromAgent || "System"} -> ${e.toAgent || "Agent"}: ${e.type.replace(/_/g, " ")}`,
              };
            });

          setLogs((prev) => {
            const combined = [...prev, ...negLogs];
            const unique = Array.from(
              new Map(combined.map((item) => [item.id, item])).values(),
            );
            return unique
              .sort((a, b) => a.id.split("-")[0] - b.id.split("-")[0])
              .slice(-100);
          });
        }
      } catch (err) {
        console.error("Terminal fetch error:", err);
      }
    };

    fetchNegotiations();
    const interval = setInterval(fetchNegotiations, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (latestTaskTime) {
      setLogs([]);
      sessionStartTime.current = latestTaskTime;
    }
  }, [latestTaskTime]);

  const handleClear = async () => {
    try {
      await EconomyServices.clearLedger();
      setLogs([]);
      sessionStartTime.current = Date.now();
    } catch (err) {
      console.error("Failed to clear ledger:", err);
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="dev-terminal glass-panel">
      <div className="terminal-header flex-row justify-between">
        <div className="flex-row gap-2 align-center">
          <Terminal size={12} className="text-accent" />
          <span
            className="mono"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.05em",
              fontWeight: "700",
            }}
          >
            AGENT_SYSTEM_TRACE
          </span>
        </div>
        <div className="flex-row gap-2">
          <span
            className="badge-outline mono"
            style={{ fontSize: "0.5rem", padding: "1px 4px" }}
          >
            v2.4.1
          </span>
          <Trash2 size={12} className="terminal-action" onClick={handleClear} />
        </div>
      </div>

      <div className="terminal-body mono" ref={terminalRef}>
        {logs.length === 0 && (
          <div className="text-dim italic" style={{ fontSize: "0.65rem" }}>
            System idle. Awaiting agent activity...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="terminal-line">
            <div className="line-meta flex-row gap-2">
              <span className="line-time">{log.time}</span>
              <span className={`line-type ${log.type.toLowerCase()}`}>
                {log.type.replace(/_/g, " ")}
              </span>
            </div>
            <div className="line-msg">{log.msg}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
