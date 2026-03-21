import React, { useEffect, useState } from "react";
import { EconomyServices } from "../../services/apiService";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Box,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  TrendingUp,
  Clock,
  ArrowRight,
  Lock,
  RefreshCw,
} from "lucide-react";
import { ExecutionMap } from "./ExecutionMap";
import "./Workflows.css";
import "./OpenClaw.css";
import { AnimatePresence } from "framer-motion";

// --- SUB-COMPONENT FOR REACTIVE BRIDGE RESULTS ---
const ExecutionResultItem = ({ task }) => {
  const bridgeRes = task.result?.results?.bridge_execution;
  const execRes = task.result?.results?.execution;
  const [liveBridgeHash, setLiveBridgeHash] = useState(null);

  useEffect(() => {
    if (bridgeRes && !bridgeRes.destTxHash && !liveBridgeHash) {
      const interval = setInterval(async () => {
        try {
          const resp = await fetch('http://localhost:4000/api/economy/bridge/history');
          const history = await resp.json();
          const match = history.find(t => t.txHash === bridgeRes.txHash);
          if (match && match.destTxHash) {
            setLiveBridgeHash(match.destTxHash);
            clearInterval(interval);
          }
        } catch (e) {}
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [bridgeRes, liveBridgeHash]);

  if (!bridgeRes && !execRes) return null;

  const isFailed = (bridgeRes?.status || execRes?.status) === "FAILED";
  const txHash = bridgeRes?.txHash || execRes?.txHash;
  const destTxHash = liveBridgeHash || bridgeRes?.destTxHash;
  const explorer = bridgeRes?.sourceExplorer || (txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : null);
  const fromChain = bridgeRes ? "Sepolia" : "Sepolia";
  const toChain = bridgeRes?.toChain || "Hoodi";

  return (
    <div className={`primary-action-box ${isFailed ? "failed" : ""}`} style={{ marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="primary-action-title">
              {bridgeRes ? "WDK CROSS-CHAIN BRIDGE" : "ON-CHAIN TRANSFER"}
            </span>
            <span className="primary-action-status-badge" style={{
              background: isFailed ? "#ef4444" : "rgba(16,185,129,0.15)",
              color: isFailed ? "#fff" : "#10b981",
              border: `1px solid ${isFailed ? "#ef4444" : "#10b981"}`,
            }}>
              {isFailed ? "✗ FAILED" : "✓ SETTLED"}
            </span>
          </div>
          {bridgeRes && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", opacity: 0.6, fontSize: "0.68rem" }}>
              <span className="mono">{fromChain}</span>
              <span style={{ color: "var(--accent-primary)" }}>→</span>
              <span className="mono">{toChain}</span>
              <span style={{ marginLeft: "0.4rem", color: "#14f195", fontWeight: "600" }}>via WDK Multi-Chain</span>
            </div>
          )}
        </div>
        <div className="primary-action-icon-container" style={{ flexShrink: 0 }}>
          {isFailed ? <AlertCircle size={20} style={{ color: "#ef4444" }} /> : <CheckCircle2 size={20} style={{ color: "#10b981" }} />}
        </div>
      </div>

      {isFailed && (
        <div style={{ fontSize: "0.72rem", color: "#ef4444", fontFamily: "monospace", marginBottom: "0.6rem", wordBreak: "break-word" }}>
          {bridgeRes?.error || execRes?.error}
        </div>
      )}

      {txHash && (
        <a href={explorer} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
           style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0.4rem 0.7rem", textDecoration: "none", fontSize: "0.7rem", fontFamily: "monospace", color: "var(--accent-primary)", marginBottom: "0.4rem", marginRight: "0.5rem", transition: "all 0.2s ease" }}>
          ⛓ {txHash.substring(0, 10)}...{txHash.slice(-6)}
          <span style={{ opacity: 0.4, fontSize: "0.55rem", marginLeft: "0.3rem" }}>(SEPOLIA)</span>
        </a>
      )}

      {bridgeRes && (
        destTxHash ? (
          <a href={`https://hoodi.etherscan.io/tx/${destTxHash}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
             style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(20, 241, 149, 0.08)", border: "1px solid rgba(20, 241, 149, 0.3)", borderRadius: "6px", padding: "0.4rem 0.7rem", textDecoration: "none", fontSize: "0.7rem", fontFamily: "monospace", color: "#14f195", marginBottom: "0.4rem" }}>
            ⚡ {destTxHash.substring(0, 10)}...{destTxHash.slice(-6)}
            <span style={{ opacity: 0.8, fontSize: "0.55rem", marginLeft: "0.3rem" }}>(HOODI)</span>
          </a>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", padding: "0.4rem 0.7rem", fontSize: "0.65rem", fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
            📡 SYNCING HOODI...
          </div>
        )
      )}
    </div>
  );
};

export function ActiveWorkflows({ tasks = [], loading = false }) {
  if (loading && tasks.length === 0) {
    return (
      <div className="placeholder-card glass-panel flex-col">
        <Loader2 className="spin text-dim" size={32} />
        <p className="text-muted">Loading network state...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="placeholder-card glass-panel flex-col">
        <Activity size={32} style={{ color: "var(--text-dim)" }} />
        <p className="text-muted">
          No active workflows. Orchestrate a new task to begin.
        </p>
      </div>
    );
  }

  return (
    <div className="workflows-list flex-col gap-4">
      {tasks.map((task) => (
        <WorkflowCard key={task.taskId} task={task} isAutoCollapsed={false} />
      ))}
    </div>
  );
}

function OpenClawEnvelope({ task }) {
  if (!task.openClaw) return null;

  const trace = task.openClaw.securityTrace || {};
  const auditTrail = [
    {
      label: "Payload Integrity",
      status: trace.payload_integrity || "PENDING",
    },
    { label: "Compliance Seal", status: trace.compliance_seal || "PENDING" },
    { label: "Budget Guardrail", status: trace.budget_guardrail || "PENDING" },
    { label: "WDK Proof", status: trace.wdk_proof || "PENDING" },
  ];

  return (
    <div className="openclaw-envelope-v3 mt-3">
      <div className="corner-decor top-left"></div>
      <div className="corner-decor top-right"></div>

      <div className="envelope-content">
        <div className="flex-row justify-between align-center mb-3">
          <div className="flex-row gap-2 align-center">
            <div className="pulse-dot"></div>
            <span
              className="mono"
              style={{
                fontSize: "0.7rem",
                fontWeight: "900",
                letterSpacing: "0.05rem",
                color: "#fff",
              }}
            >
              OPENCLAW MISSION CONTROL
            </span>
          </div>
          <div className="compliance-tag-v3">
            <ShieldCheck size={10} />
            <span>V2026.1 COMPLIANT</span>
          </div>
        </div>

        <div className="mission-core-grid">
          <div className="core-box">
            <span className="core-label">MISSION_ID</span>
            <span className="core-value text-accent">
              #{task.openClaw?.mission_id?.slice(0, 8) || "Scanning"}
            </span>
          </div>
          <div className="core-box">
            <span className="core-label">MISSION_DIRECTIVE</span>
            <span
              className="core-value"
              style={{ fontSize: "0.7rem", lineHeight: "1.3" }}
            >
              {task.openClaw?.objective || "Analyzing..."}
            </span>
          </div>
          <div className="core-box">
            <span className="core-label">ENVIRONMENT</span>
            <span
              className="core-value"
              style={{ color: "var(--accent-purple)" }}
            >
              {task.openClaw?.execution_environment || "SEPOLIA_HOODI_WDK"}
            </span>
          </div>
        </div>

        <div className="security-audit-trail mt-4">
          <span
            className="mono mb-2 block"
            style={{
              fontSize: "0.5rem",
              opacity: 0.35,
              letterSpacing: "0.08em",
            }}
          >
            // SECURITY_ENFORCEMENT_TRACE
          </span>
          <div className="audit-grid">
            {auditTrail.map((check, idx) => (
              <div key={idx} className="audit-step">
                <div
                  style={{
                    color:
                      check.status === "FAILED" || check.status === "BYPASSED"
                        ? "#ef4444"
                        : "#14f195",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {check.status === "PENDING" ? (
                    <Loader2 size={10} className="spin" />
                  ) : (
                    <CheckCircle2 size={10} />
                  )}
                </div>
                <div className="flex-col">
                  <span className="audit-label">{check.label}</span>
                  <span
                    className="audit-status"
                    style={{
                      color:
                        check.status === "FAILED" || check.status === "BYPASSED"
                          ? "#ef4444"
                          : "#14f195",
                    }}
                  >
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex-row justify-between align-center mt-4 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <div className="flex-row gap-2 align-center">
            <div className="enforcer-avatar"></div>
            <span
              className="mono"
              style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.4)" }}
            >
              WDK SAFETY ENFORCER ACTIVE
            </span>
          </div>
          <span className="mono" style={{ fontSize: "0.45rem", opacity: 0.2 }}>
            SIG_AUTH_0xBE...59DYV
          </span>
        </div>
      </div>
    </div>
  );
}

export function WorkflowCard({ task, isAutoCollapsed = false }) {
  const isRunning = task?.status === "RUNNING" || task?.status === "STARTING";
  const isCompleted = task?.status === "COMPLETED";
  const isFailed = task?.status === "FAILED";

  // Storage key based on taskId
  const storageKey = `nevorax_task_expanded_${task?.taskId}`;

  const [isExpanded, setIsExpanded] = useState(() => {
    // Determine initial state
    if (isRunning) return true; // Running tasks always start expanded
    const savedState = localStorage.getItem(storageKey);
    if (savedState !== null) {
      return savedState === "true"; // Use saved state for completed/failed
    }
    return !isAutoCollapsed; // Fallback
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem(storageKey, isExpanded.toString());
  }, [isExpanded, storageKey]);

  // Force expand when running starts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isRunning) setIsExpanded(true);
  }, [isRunning]);

  if (!task) return null;

  let cardClass = `workflow-card glass-panel ${!isExpanded ? "minimized" : ""}`;
  if (isRunning) cardClass += " pulse-border";

  let statusClass = "badge-status";
  if (isRunning) statusClass += " running";
  else if (isCompleted) statusClass += " completed";
  else if (isFailed) statusClass += " failed";

  const getStepIcon = (step) => {
    switch (step) {
      case "PLANNING":
        return "🧠";
      case "BIDDING":
        return "💰";
      case "SELECTION":
        return "🎯";
      case "NEGOTIATING":
      case "NEGOTIATED":
        return "🤝";
      case "EXECUTING":
        return "⚙️";
      case "PAYING":
        return "🔗";
      default:
        return "⚡";
    }
  };

  return (
    <div className={cardClass}>
      <div className="wf-header flex-row justify-between">
        <div className="flex-row gap-2">
          {isRunning && (
            <PlayCircle
              size={18}
              style={{ color: "var(--status-progress)" }}
              className="spin-slow"
            />
          )}
          {isCompleted && (
            <CheckCircle2 size={18} style={{ color: "var(--status-done)" }} />
          )}
          {isFailed && <AlertCircle size={18} style={{ color: "#ef4444" }} />}
          <span className="mono" style={{ fontSize: "0.8rem" }}>
            {task.taskId}
          </span>
          {!isExpanded && (
            <span
              className="mono"
              style={{
                fontSize: "0.6rem",
                background: "rgba(255,255,255,0.05)",
                padding: "2px 6px",
                borderRadius: "3px",
                marginLeft: "4px",
                color: "var(--text-dim)",
              }}
            >
              MINIMIZED VIEW
            </span>
          )}
        </div>
        <div className="flex-row gap-3 align-center">
          {!isExpanded && (
            <span
              className="mono"
              style={{
                fontSize: "0.6rem",
                color: "var(--accent-primary)",
                opacity: 0.6,
              }}
            >
              IDLE_BUFFER
            </span>
          )}
          <span className={statusClass}>{task.status}</span>
          <button
            className="minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? "Minimize Task" : "Expand Task"}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="wf-body-instant">
          <h4 className="wf-goal">"{task.goal}"</h4>

          {/* Live Step Log Feed */}
          {(isRunning || (isCompleted && task.stepLog)) && (
            <div className="wf-step-log">
              {Array.isArray(task.stepLog) &&
                task.stepLog.map((step, idx) => (
                  <div
                    key={`${task.taskId}-step-${idx}`}
                    className={`wf-step-item ${step.currentStep === "BIDDING" ? "bidding-active" : ""} ${step.details?.includes("Data Discovery") ? "data-discovery-active" : ""}`}
                    title={step.details}
                  >
                    <div className="step-icon">
                      {getStepIcon(step.currentStep)}
                    </div>
                    <div className="step-content">
                      <div className="flex-row gap-2 align-center justify-between w-full">
                        <div className="flex-col">
                          <span className="step-details">
                            {step.details?.includes("Bid submitted") ? (
                              <div className="bidding-details flex-row align-center gap-2">
                                <span className="bid-badge">BID</span>
                                <span className="mono text-accent">
                                  {step.details?.match(
                                    /Bid submitted: ([\w_]+)/,
                                  )?.[1] || "Agent"}
                                </span>
                                <span className="text-dim">offered</span>
                                <span className="mono text-bright">
                                  {
                                    step.details?.match(
                                      /offers ([\d.]+) USDT/,
                                    )?.[1]
                                  }{" "}
                                  USDT
                                </span>
                                <span
                                  className="mono text-accent"
                                  style={{
                                    fontSize: "0.65rem",
                                    marginLeft: "0.4rem",
                                    fontWeight: "800",
                                  }}
                                >
                                  {" "}
                                  (Rep:{" "}
                                  {step.details?.match(
                                    /\(Rep: ([\d.]+%|---)\)/,
                                  )?.[1] || "0.00%"}
                                  )
                                </span>
                              </div>
                            ) : (
                              step.details
                            )}
                          </span>
                          {step.details?.includes("Data Discovery") && (
                            <span className="live-source-tag">
                              SOURCE:{" "}
                              {step.details?.match(/'([^']+)'/)?.[1] ||
                                "Real-Time"}
                            </span>
                          )}
                        </div>
                        <span className="step-time">
                          {new Date(step.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {isRunning && (
                <div
                  className="flex-row gap-2 align-center p-2 mt-1"
                  style={{ opacity: 0.4 }}
                >
                  <Loader2 size={10} className="spin" />
                  <span className="mono" style={{ fontSize: "0.6rem" }}>
                    Processing autonomous decision...
                  </span>
                </div>
              )}
            </div>
          )}

          {isCompleted && task.result && task.result.result && (
            <>
              <div
                style={{
                  height: "5rem",
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                  marginTop: "2rem",
                }}
              ></div>
              <div className="wf-result pt-10">
                <div className="flex-row align-center gap-2 mb-6">
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "var(--status-done)",
                      boxShadow: "0 0 15px var(--status-done)",
                    }}
                  ></div>
                  <span
                    className="mono"
                    style={{
                      fontSize: "0.85rem",
                      letterSpacing: "0.15em",
                      fontWeight: "800",
                      color: "#fff",
                    }}
                  >
                    EXECUTION COMPLETE
                  </span>
                </div>

                {task.result?.result?.summary &&
                  task.result.result.summary !== "Analysis completed." &&
                  task.result.result.summary !== "n/a" && (
                    <div className="result-grid mb-6">
                      {task.result?.result?.sentiment &&
                        task.result.result.sentiment.toLowerCase() !==
                          "n/a" && (
                          <div className="result-chip">
                            <span
                              style={{
                                fontSize: "0.55rem",
                                color: "rgba(255,255,255,0.4)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              SENTIMENT
                            </span>
                            <span
                              className={`mono sentiment-${task.result.result.sentiment}`}
                              style={{ fontSize: "0.9rem", fontWeight: "700" }}
                            >
                              {task.result.result.sentiment.toLowerCase() ===
                              "bullish"
                                ? "🚀"
                                : task.result.result.sentiment.toLowerCase() ===
                                    "bearish"
                                  ? "📉"
                                  : "⚖️"}{" "}
                              {task.result.result.sentiment.toUpperCase()}
                            </span>
                          </div>
                        )}
                      {task.result?.result?.recommendation &&
                        task.result.result.recommendation.toLowerCase() !==
                          "ignore" &&
                        task.result.result.recommendation.toLowerCase() !==
                          "n/a" && (
                          <div className="result-chip">
                            <span
                              style={{
                                fontSize: "0.55rem",
                                color: "rgba(255,255,255,0.4)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              STRATEGY
                            </span>
                            <span
                              className={`mono action-${task.result.result.recommendation.toLowerCase()}`}
                              style={{ fontSize: "0.9rem", fontWeight: "800" }}
                            >
                              {task.result.result.recommendation.toUpperCase()}
                            </span>
                          </div>
                        )}
                      {task.result?.result?.confidence &&
                        task.result.result.confidence
                          .toString()
                          .toLowerCase() !== "n/a" && (
                          <div className="result-chip">
                            <span
                              style={{
                                fontSize: "0.55rem",
                                color: "rgba(255,255,255,0.4)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              PROBABILITY
                            </span>
                            <span
                              className="mono"
                              style={{
                                fontSize: "0.9rem",
                                fontWeight: "700",
                                color: "#fff",
                              }}
                            >
                              {(
                                Number(task.result.result.confidence) * 100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                {(task.result?.results?.execution?.txHash ||
                  task.result?.results?.execution?.status === "FAILED" ||
                  task.result?.results?.bridge_execution?.txHash ||
                  task.result?.results?.bridge_execution?.status ===
                    "FAILED") && (
                  <ExecutionResultItem task={task} />
                )}

                {task.result?.result?.summary && (
                  <div className="result-summary-box">
                    <div
                      className="flex-row justify-between align-end"
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        paddingBottom: "0.4rem",
                        marginBottom: "0.8rem",
                      }}
                    >
                      <span
                        className="mono"
                        style={{
                          fontSize: "0.55rem",
                          color: "var(--text-dim)",
                          opacity: 0.8,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          letterSpacing: "0.1em",
                        }}
                      >
                        <span
                          style={{
                            width: "1px",
                            height: "10px",
                            background: "var(--accent-green)",
                            opacity: 0.6,
                          }}
                        ></span>
                        CORE INTELLIGENCE ORCHESTRATION
                      </span>
                      <span
                        className="mono"
                        style={{ fontSize: "0.5rem", opacity: 0.25 }}
                      >
                        V.01.24.PRM
                      </span>
                    </div>

                    {task.result?.result?.safetyAudit &&
                      Array.isArray(task.result.result.safetyAudit) && (
                        <div className="safety-grid">
                          {task.result.result.safetyAudit.map((token, tid) => (
                            <div key={tid} className="safety-badge">
                              <span className="safety-icon"></span>
                              {token.replace(/_/g, " ")}
                            </div>
                          ))}
                        </div>
                      )}

                    <div className="result-summary">
                      {task.result.result.summary.split("\n").map((line, i) => (
                        <p
                          key={i}
                          style={{
                            marginBottom: line.startsWith("*")
                              ? "0.25rem"
                              : "0.75rem",
                          }}
                        >
                          {line.startsWith("#") ? (
                            <span
                              style={{
                                color: "var(--text-primary)",
                                fontWeight: "700",
                                fontSize: "0.95rem",
                              }}
                            >
                              {line.replace(/#/g, "").trim()}
                            </span>
                          ) : line.startsWith("*") ? (
                            <span style={{ color: "var(--text-muted)" }}>
                              • {line.replace(/\*/g, "").trim()}
                            </span>
                          ) : (
                            line
                          )}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {(task.payments || (task.result && task.result.payments)) && (
                  <div className="tx-proof">
                    <div className="flex-row justify-between align-center mb-6">
                      <span
                        className="mono"
                        style={{
                          fontSize: "0.7rem",
                          color: "rgba(255,255,255,0.4)",
                          letterSpacing: "0.15rem",
                          fontWeight: "700",
                        }}
                      >
                        NETWORK_SETTLEMENTS // WDK
                      </span>
                      <div className="flex-row align-center gap-1">
                        <div
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: "#14f195",
                            boxShadow: "0 0 8px #14f195",
                          }}
                        ></div>
                        <span
                          className="mono"
                          style={{ fontSize: "0.6rem", color: "#14f195" }}
                        >
                          VALIDATED
                        </span>
                      </div>
                    </div>

                    <div className="wf-payments flex-col gap-2">
                      {(task.payments || task.result?.payments || []).map(
                        (p, i) =>
                          p.subTxHash && (
                            <div key={i} className="tx-table-row">
                              <span className="tx-service-tag">
                                {p.service}
                              </span>
                              <a
                                href={`https://sepolia.etherscan.io/tx/${p.subTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tx-hash-link"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {p.subTxHash.substring(0, 18)}...
                                {p.subTxHash.slice(-8)}
                              </a>
                              <span className="tx-amount">
                                {p.amount && !isNaN(p.amount)
                                  ? (Number(p.amount) / 1e6).toFixed(2)
                                  : "0.00"}{" "}
                                <span
                                  style={{ fontSize: "0.6rem", opacity: 0.5 }}
                                >
                                  USDT
                                </span>
                              </span>
                            </div>
                          ),
                      )}
                    </div>

                    <div
                      className="economic-cycle-report mt-4 pt-4"
                      style={{ borderTop: "1px dashed rgba(255,255,255,0.1)" }}
                    >
                      <div className="flex-row justify-between items-center mb-2">
                        <span
                          className="mono"
                          style={{
                            fontSize: "0.6rem",
                            color: "var(--accent-primary)",
                          }}
                        >
                          // ECONOMIC_CYCLE_SYNC
                        </span>
                        <div className="live-pill">CONNECTED</div>
                      </div>
                      <div className="cycle-data-grid">
                        <div className="cycle-point">
                          <span className="label">AGENTS_INVOLVED</span>
                          <div className="flex-column gap-1 mt-1">
                            {Array.from(
                              new Set(
                                (
                                  task.payments ||
                                  task.result?.payments ||
                                  []
                                ).map((p) => p.toAgent),
                              ),
                            ).map((agent, aid) => (
                              <span
                                key={aid}
                                className="value"
                                style={{
                                  fontSize: "0.65rem",
                                  display: "block",
                                }}
                              >
                                {agent}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="cycle-point">
                          <span className="label">REPUTATION_SWEEP</span>
                          <div className="flex-column gap-1 mt-1">
                            {(task.payments || task.result?.payments || []).map(
                              (p, prid) => (
                                <span
                                  key={prid}
                                  className="value"
                                  style={{
                                    color:
                                      Number(p.reputationDelta) >= 0
                                        ? "#14f195"
                                        : "#ef4444",
                                    fontSize: "0.6rem",
                                    display: "flex",
                                    alignItems: "center",
                                    whiteSpace: "nowrap",
                                    width: "100%",
                                    marginBottom: "0.2rem",
                                  }}
                                >
                                  <span style={{ minWidth: "45px" }}>
                                    {Number(p.reputationDelta) >= 0 ? "+" : ""}
                                    {p.reputationDelta} LP
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.5rem",
                                      opacity: 0.4,
                                      marginLeft: "0.5rem",
                                      textAlign: "right",
                                      flex: 1,
                                    }}
                                  >
                                    // {p.reputationReason}
                                  </span>
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="cycle-point">
                          <span className="label">MISSION_PROFIT</span>
                          <span
                            className="value"
                            style={{ fontSize: "1rem", marginTop: "0.4rem" }}
                          >
                            {(
                              Number(
                                (
                                  task.payments ||
                                  task.result?.payments ||
                                  []
                                ).reduce(
                                  (acc, p) => acc + (Number(p.amount) || 0),
                                  0,
                                ),
                              ) / 1e6
                            ).toFixed(2)}{" "}
                            <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>
                              USDT
                            </span>
                          </span>
                        </div>
                      </div>
                      <p className="cycle-note mono">
                        This reputation update has been persisted to the global
                        agent ecosystem and will influence future orchestration
                        priorities.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <OpenClawEnvelope task={task} />
        </div>
      )}

      {isExpanded && isFailed && (
        <div
          className="wf-error"
          style={{
            marginTop: "1rem",
            fontSize: "0.875rem",
            fontFamily: "var(--font-mono)",
            color: "#ef4444",
            background: "rgba(239,68,68,0.05)",
            padding: "0.75rem",
            borderRadius: "var(--radius-sm)",
            borderLeft: "2px solid #ef4444",
          }}
        >
          {task.error || "Execution terminated unexpectedly."}
        </div>
      )}
    </div>
  );
}
