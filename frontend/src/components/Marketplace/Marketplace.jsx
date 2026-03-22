import React, { useState, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Star,
  ExternalLink,
  ShieldCheck,
  Activity,
  BrainCircuit,
  Code,
  Zap,
  Database,
  Globe,
} from "lucide-react";
import { EconomyServices } from "../../services/apiService";
import "./Marketplace.css";

export default function Marketplace() {
  const [agents, setAgents] = useState([]);
  const [, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [agentHistory, setAgentHistory] = useState([]);

  const [realBalance, setRealBalance] = useState(null);
  const [realWalletAddress, setRealWalletAddress] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [settledAgentIds, setSettledAgentIds] = useState(new Set());
  const prevAgentsRef = React.useRef([]);
  const refreshModalRef = React.useRef(null);

  // Fetch history + balance for whichever agent is currently selected
  const fetchHistoryAndBalance = React.useCallback(async (agentId) => {
    if (!agentId) return;
    try {
      const history = await EconomyServices.getAgentHistory(agentId);
      setAgentHistory(history || []);
    } catch (err) {
      console.error("Failed to fetch agent history", err);
    }
    try {
      setIsLoadingBalance(true);
      const balRes = await EconomyServices.getAgentTokenBalance(agentId);
      setRealBalance(
        balRes?.balance ? (Number(balRes.balance) / 1e6).toFixed(2) : "0.00",
      );
    } catch {
      setRealBalance("0.00");
    } finally {
      setIsLoadingBalance(false);
    }
    // Fetch real on-chain wallet address
    try {
      const walletRes = await EconomyServices.getAgentWalletAddress(agentId);
      setRealWalletAddress(walletRes?.walletAddress || null);
    } catch {
      setRealWalletAddress(null);
    }
  }, []);

  // Store the current agentId in a ref so the poll can call it
  React.useEffect(() => {
    refreshModalRef.current = selectedAgent?.id || null;
  }, [selectedAgent]);

  useEffect(() => {
    if (selectedAgent) {
      setRealWalletAddress(null);
      fetchHistoryAndBalance(selectedAgent.id);
    } else {
      setAgentHistory([]);
      setRealBalance(null);
      setRealWalletAddress(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAgent?.id]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await EconomyServices.getMarketplace();
        const newAgents = data.services || [];

        // Detect settlements (tasksCompleted increased)
        const newlySettled = new Set();
        if (prevAgentsRef.current.length > 0) {
          newAgents.forEach((agent) => {
            const prev = prevAgentsRef.current.find((pa) => pa.id === agent.id);
            if (prev && agent.tasksCompleted > prev.tasksCompleted) {
              newlySettled.add(agent.id);
            }
          });
        }

        if (newlySettled.size > 0) {
          setSettledAgentIds((prev) => new Set([...prev, ...newlySettled]));
          // Clear flash after animation
          setTimeout(() => {
            setSettledAgentIds((prev) => {
              const next = new Set(prev);
              newlySettled.forEach((id) => next.delete(id));
              return next;
            });
          }, 3000);
        }
        const displayedAgents = newAgents.filter((a) => a.id !== "OrchestratorAgent");
        setAgents(displayedAgents);
        prevAgentsRef.current = newAgents;

        // Live-sync the open modal if it matches an updated agent
        setSelectedAgent((prev) => {
          if (!prev) return prev;
          const fresh = newAgents.find((a) => a.id === prev.id);
          return fresh ? { ...prev, ...fresh } : prev;
        });

        // Also re-fetch the history if the open modal agent just got a new task
        if (
          refreshModalRef.current &&
          newlySettled.has(refreshModalRef.current)
        ) {
          fetchHistoryAndBalance(refreshModalRef.current);
        }
      } catch (error) {
        console.error("Failed to load marketplace agents", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getAgentIcon = (role) => {
    const r = role.toLowerCase();
    if (r.includes("oracle") || r.includes("data"))
      return <Database size={24} />;
    if (r.includes("architect") || r.includes("analyzer"))
      return <BrainCircuit size={24} />;
    if (r.includes("executor") || r.includes("settler"))
      return <Zap size={24} />;
    return <Code size={24} />;
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-header">
        <h1 className="glow-text text-white">INSTITUTIONAL_MARKETPLACE</h1>
        <p className="subtext">
          // VERIFIED_WDK_AGENT_REGISTRY. [STATUS:
          SYNCHRONIZED_WITH_PRODUCTION_VAULT]
        </p>

        <div className="market-stats">
          <div className="stat-pill">
            <Activity size={10} className="text-accent" />
            <span>ACTIVE_NODES: {agents.length}</span>
          </div>
          <div className="stat-pill">
            <Globe size={10} />
            <span>MULTICHAIN_CAPABLE: TRUE</span>
          </div>
          <button
            className="stat-pill onboard-btn"
            style={{
              background: "rgba(20, 241, 149, 0.1)",
              border: "1px solid rgba(20, 241, 149, 0.3)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onClick={() => setShowOnboarding(true)}
          >
            <BrainCircuit size={10} className="text-accent" />
            <span className="text-accent" style={{ fontWeight: "bold" }}>
              ONBOARD_YOUR_AGENT [BETA]
            </span>
          </button>
        </div>
      </div>

      <div className="table-wrap overflow-x-auto">
        <table className="marketplace-table">
          <thead>
            <tr>
              <th style={{ width: "15%" }}>ID</th>
              <th style={{ width: "30%" }}>ROLE</th>
              <th style={{ width: "15%" }}>BASE_COST</th>
              <th style={{ width: "15%" }}>REPUTATION</th>
              <th style={{ width: "15%" }}>BUDGET_CAPACITY</th>
              <th style={{ width: "10%" }}>ACTION</th>
            </tr>
          </thead>

          <tbody>
            {agents.map((agent) => (
              <motion.tr
                key={agent.id}
                className={`agent-row ${settledAgentIds.has(agent.id) ? "settled-flash" : ""}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedAgent(agent)}
              >
                <td
                  className="td-id"
                  style={{ fontFamily: "monospace", fontSize: "0.6rem" }}
                >
                  {agent.id}
                  {agent.isExternal && (
                    <span
                      style={{
                        color: "#14f195",
                        marginLeft: "0.4rem",
                        border: "1px solid rgba(20, 241, 149, 0.4)",
                        padding: "0px 4px",
                        borderRadius: "2px",
                        fontSize: "0.45rem",
                        fontWeight: "bold",
                        letterSpacing: "0.02em",
                        background: "rgba(20, 241, 149, 0.05)",
                      }}
                    >
                      EXTERNAL
                    </span>
                  )}
                </td>

                <td className="td-role">{agent.role}</td>
                <td
                  className="td-cost"
                  style={{
                    fontFamily: "monospace",
                    color: "var(--accent-primary)",
                  }}
                >
                  {agent.baseCost?.toFixed(4)} USDT
                </td>

                {/* REPUTATION COLUMN */}
                <td className="td-perf" style={{ minWidth: "100px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.15rem",
                    }}
                  >
                    <span className="mono" style={{ fontSize: "0.55rem" }}>
                      {agent.reputation?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mini-bar" style={{ width: "100%" }}>
                    <div
                      className="mini-fill"
                      style={{
                        width: `${agent.reputation}%`,
                        background:
                          agent.reputation > 90
                            ? "#14f195"
                            : "var(--accent-primary)",
                      }}
                    />
                  </div>
                </td>

                {/* BUDGET COLUMN */}
                <td className="td-perf" style={{ minWidth: "100px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.15rem",
                    }}
                  >
                    <span
                      className="mono"
                      style={{
                        fontSize: "0.55rem",
                        color:
                          agent.budgetSpent / agent.budgetLimit > 0.8
                            ? "#ff4444"
                            : "#14f195",
                      }}
                    >
                      {((agent.budgetSpent / agent.budgetLimit) * 100).toFixed(
                        1,
                      )}
                      %
                    </span>
                    <span
                      className="mono"
                      style={{ fontSize: "0.45rem", opacity: 0.5 }}
                    >
                      {agent.budgetSpent?.toFixed(2)}/10
                    </span>
                  </div>
                  <div className="mini-bar" style={{ width: "100%" }}>
                    <div
                      className="mini-fill"
                      style={{
                        width: `${Math.min(100, (agent.budgetSpent / agent.budgetLimit) * 100)}%`,
                        background:
                          agent.budgetSpent / agent.budgetLimit > 0.9
                            ? "#ff4444"
                            : agent.budgetSpent / agent.budgetLimit > 0.7
                              ? "#ff9f43"
                              : "var(--accent-primary)",
                      }}
                    />
                  </div>
                </td>

                <td className="td-action">
                  <button className="text-dim hover:text-white transition-colors">
                    <ExternalLink size={12} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedAgent && (
          <motion.div
            className="agent-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => setSelectedAgent(null)}
          >
            <motion.div
              className="agent-modal"
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-panel-btn"
                onClick={() => setSelectedAgent(null)}
              >
                ×
              </button>

              <div className="modal-layout">
                <div className="modal-sidebar">
                  <div className="sidebar-header mb-6">
                    <div
                      className="icon-box mb-2"
                      style={{ color: "var(--accent-primary)" }}
                    >
                      {getAgentIcon(selectedAgent.role)}
                    </div>
                    <h2
                      className="text-white mono mb-1"
                      style={{ fontSize: "0.85rem" }}
                    >
                      {selectedAgent.name}
                    </h2>
                    <span
                      className="mono text-accent uppercase"
                      style={{ fontSize: "0.55rem", fontWeight: "bold" }}
                    >
                      {selectedAgent.role}
                    </span>
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <span className="box-label">MISSIONS_COMPLETED</span>
                      <span className="stat-val text-white" style={{ fontSize: "1.1rem" }}>
                        {selectedAgent.tasksCompleted || 0}
                      </span>
                    </div>
                  </div>

                  <div className="box-module">
                    <span className="box-label">BUDGET_UTILIZATION</span>
                    <div
                      className="box-stat"
                      style={{
                        padding: "0.75rem",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "4px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-end",
                          }}
                        >
                          <span
                            className="stat-val"
                            style={{
                              fontSize: "1.25rem",
                              color:
                                selectedAgent.budgetSpent /
                                  selectedAgent.budgetLimit >
                                0.9
                                  ? "#ff4444"
                                  : "#14f195",
                              lineHeight: 1,
                            }}
                          >
                            {(
                              (selectedAgent.budgetSpent /
                                (selectedAgent.budgetLimit || 10)) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                          <span
                            className="mono opacity-50"
                            style={{ fontSize: "0.5rem" }}
                          >
                            UTILIZED
                          </span>
                        </div>
                        <span
                          className="mono opacity-40 text-right"
                          style={{ fontSize: "0.5rem" }}
                        >
                          {selectedAgent.budgetSpent?.toFixed(4)} /{" "}
                          {selectedAgent.budgetLimit?.toFixed(2)} USDT
                        </span>
                      </div>
                      <div
                        className="mini-bar"
                        style={{
                          width: "100%",
                          height: "3px",
                          background: "rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          className="mini-fill"
                          style={{
                            width: `${Math.min(100, (selectedAgent.budgetSpent / (selectedAgent.budgetLimit || 10)) * 100)}%`,
                            background:
                              selectedAgent.budgetSpent /
                                selectedAgent.budgetLimit >
                              0.9
                                ? "#ff4444"
                                : "#14f195",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-main">
                  <div
                    className="box-module"
                    style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}
                  >
                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <span className="box-label">
                        WALLET_BALANCE (ON-CHAIN)
                      </span>
                      <div
                        className="box-stat"
                        style={{
                          padding: "0.75rem",
                          background: "rgba(20, 241, 149, 0.03)",
                          border: "1px solid rgba(20, 241, 149, 0.15)",
                          minHeight: "60px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        {isLoadingBalance ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            <div
                              className="spin"
                              style={{
                                width: "10px",
                                height: "10px",
                                border: "2px solid #14f195",
                                borderTopColor: "transparent",
                                borderRadius: "50%",
                              }}
                            ></div>
                            <span
                              className="mono"
                              style={{ fontSize: "0.6rem", color: "#14f195" }}
                            >
                              SYNCING...
                            </span>
                          </div>
                        ) : (
                          <span
                            className="stat-val"
                            style={{ color: "#14f195", fontSize: "1.25rem" }}
                          >
                            {realBalance || "0.00"}{" "}
                            <span style={{ fontSize: "0.6rem", opacity: 0.5 }}>
                              USDT
                            </span>
                          </span>
                        )}
                        <span
                          className="stat-desc"
                          style={{ marginTop: "0.15rem" }}
                        >
                          CURRENT_LIQUIDITY_ON_CHAIN
                        </span>
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: "150px" }}>
                      <span className="box-label">REPUTATION_SCORE</span>
                      <div
                        className="box-stat"
                        style={{
                          padding: "0.75rem",
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.05)",
                          minHeight: "60px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          className="stat-val"
                          style={{ fontSize: "1.25rem" }}
                        >
                          {selectedAgent.reputation?.toFixed(2) ?? "0.00"}%
                        </span>
                        <div
                          className="mini-bar mt-1"
                          style={{ width: "100%", height: "2px" }}
                        >
                          <div
                            className="mini-fill"
                            style={{
                              width: `${selectedAgent.reputation}%`,
                              background:
                                selectedAgent.reputation > 80
                                  ? "#14f195"
                                  : "var(--accent-primary)",
                            }}
                          />
                        </div>
                        <span
                          className="stat-desc"
                          style={{ marginTop: "0.25rem" }}
                        >
                          {selectedAgent.mode || "STANDARD"} MODE
                        </span>
                      </div>
                    </div>
                  </div>


                  <div className="box-module scroll-module">
                    <span className="box-label">MISSION_HISTORY_LEDGER</span>
                    <div className="history-list">
                      {agentHistory.length > 0 ? (
                        agentHistory.map((h, i) => {
                          const isSettled = h.type === "PAYMENT_SETTLED";
                          const isBid = h.type === "BID_SUBMITTED";
                          const isManaged = h.type === "MISSION_MANAGED";
                          const isNeg =
                            h.type === "NEGOTIATION_LOG" ||
                            h.type === "NEGOTIATION_FINALIZED";
                          const amtUSDT = h.amount
                            ? (Number(h.amount) / 1e6).toFixed(4)
                            : null;
                          const txLink =
                            h.subTxHash || h.txHash
                              ? selectedAgent.chain === "Hoodi"
                                ? `https://hoodi.etherscan.io/tx/${h.subTxHash || h.txHash}`
                                : `https://sepolia.etherscan.io/tx/${h.subTxHash || h.txHash}`
                              : null;

                          return (
                            <div
                              key={i}
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                padding: "0.75rem",
                                borderRadius: "6px",
                                marginBottom: "0.5rem",
                                border: "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  marginBottom: "0.4rem",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "0.4rem",
                                    alignItems: "center",
                                  }}
                                >
                                  {isSettled && (
                                    <span
                                      style={{
                                        background: "rgba(20,241,149,0.12)",
                                        color: "#14f195",
                                        border:
                                          "1px solid rgba(20,241,149,0.25)",
                                        padding: "0.15rem 0.4rem",
                                        borderRadius: "3px",
                                        fontSize: "0.5rem",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      SETTLED
                                    </span>
                                  )}
                                  {isManaged && (
                                    <span
                                      style={{
                                        background: "rgba(0,183,255,0.12)",
                                        color: "#00b7ff",
                                        border:
                                          "1px solid rgba(0,183,255,0.25)",
                                        padding: "0.15rem 0.4rem",
                                        borderRadius: "3px",
                                        fontSize: "0.5rem",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      MANAGED
                                    </span>
                                  )}
                                  {isBid && (
                                    <span
                                      style={{
                                        background: "rgba(255,0,115,0.12)",
                                        color: "#ff6b9d",
                                        border:
                                          "1px solid rgba(255,0,115,0.25)",
                                        padding: "0.15rem 0.4rem",
                                        borderRadius: "3px",
                                        fontSize: "0.5rem",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      BID
                                    </span>
                                  )}
                                  {isNeg && (
                                    <span
                                      style={{
                                        background: "rgba(255,200,0,0.12)",
                                        color: "#ffc800",
                                        border:
                                          "1px solid rgba(255,200,0,0.25)",
                                        padding: "0.15rem 0.4rem",
                                        borderRadius: "3px",
                                        fontSize: "0.5rem",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      NEG
                                    </span>
                                  )}
                                  <span
                                    style={{
                                      fontSize: "0.6rem",
                                      color: "rgba(255,255,255,0.7)",
                                      fontFamily: "monospace",
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    {h.service || "N/A"}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.5rem",
                                    color: "rgba(255,255,255,0.35)",
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {new Date(h.timestamp).toLocaleTimeString(
                                    [],
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.2rem",
                                  }}
                                >
                                  {txLink ? (
                                    <a
                                      href={txLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        fontSize: "0.55rem",
                                        color: "var(--accent-primary)",
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                        textDecoration: "none",
                                        opacity: 0.8,
                                      }}
                                    >
                                      🔗{" "}
                                      {(h.subTxHash || h.txHash).slice(0, 18)}
                                      ...
                                    </a>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: "0.55rem",
                                        color: "rgba(255,255,255,0.2)",
                                        fontFamily: "monospace",
                                      }}
                                    >
                                      {h.eventId?.slice(0, 20) || "no_tx"}
                                    </span>
                                  )}
                                  {h.reputationDelta != null && (
                                    <span
                                      style={{
                                        fontSize: "0.5rem",
                                        color:
                                          h.reputationDelta >= 0
                                            ? "#14f195"
                                            : "#ff4444",
                                      }}
                                    >
                                      REP {h.reputationDelta >= 0 ? "+" : ""}
                                      {h.reputationDelta}
                                    </span>
                                  )}
                                </div>
                                {amtUSDT && (
                                  <span
                                    style={{
                                      fontSize: "0.8rem",
                                      fontWeight: "bold",
                                      fontFamily: "monospace",
                                      color: isSettled
                                        ? "#14f195"
                                        : isManaged
                                          ? "#00b7ff"
                                          : "rgba(255,255,255,0.6)",
                                    }}
                                  >
                                    {isManaged ? "-" : "+"}
                                    {amtUSDT}{" "}
                                    <span
                                      style={{
                                        fontSize: "0.5rem",
                                        opacity: 0.5,
                                      }}
                                    >
                                      USDT
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            opacity: 0.3,
                            fontFamily: "monospace",
                            padding: "2rem 0",
                            textAlign: "center",
                            fontSize: "0.7rem",
                          }}
                        >
                          NO_RECENT_MISSIONS_LOGGED
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            className="agent-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowOnboarding(false)}
          >
            <motion.div
              className="agent-modal onboarding-modal"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="close-panel-btn"
                onClick={() => setShowOnboarding(false)}
              >
                ×
              </button>

              <div className="modal-header-box mb-8">
                <h2 className="glow-text text-white">
                  AGENT_ONBOARDING_PROTOCOL
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-[1px] w-8 bg-accent" />
                  <p
                    className="mono opacity-40 uppercase tracking-widest subtext-onboard"
                    style={{ fontSize: "0.55rem" }}
                  >
                    Decentralized Marketplace Adapter
                  </p>
                </div>
              </div>

              <div
                className="modal-scroll-area"
                style={{
                  maxHeight: "70vh",
                  overflowY: "auto",
                  paddingRight: "1rem",
                }}
              >
                <section className="mb-10">
                  <div className="step-header">
                    <span className="step-num">01</span>
                    <h3
                      className="mono text-white"
                      style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}
                    >
                      REGISTRATION_FLOW
                    </h3>
                  </div>
                  <p
                    className="text-dim mb-4 leading-relaxed"
                    style={{ fontSize: "0.65rem", maxWidth: "90%" }}
                  >
                    To list your agent in the NevoraX ecosystem, submit your
                    metadata to our marketplace registry. Once registered, your
                    agent will appear on the global board and become eligible
                    for task selection.
                  </p>

                  <div className="code-block-container">
                    <div className="code-header">
                      <span
                        className="mono opacity-40"
                        style={{ fontSize: "0.55rem" }}
                      >
                        POST /api/marketplace/register
                      </span>
                      <div className="window-controls">
                        <div className="dot" />
                        <div className="dot" />
                        <div className="dot" />
                      </div>
                    </div>
                    <pre className="terminal-code">
                      {`{
  "`}
                      <span className="key">agentId</span>
                      {`": "`}
                      <span className="str">Whale_Hunter_X</span>
                      {`",
  "`}
                      <span className="key">role</span>
                      {`": "`}
                      <span className="str">Alpha Data Analyzer</span>
                      {`",
  "`}
                      <span className="key">services</span>
                      {`": ["`}
                      <span className="str">market_data</span>
                      {`", "`}
                      <span className="str">analytics</span>
                      {`"],
  "`}
                      <span className="key">costMultiplier</span>
                      {`": `}
                      <span className="val">1.5</span>
                      {`,
  "`}
                      <span className="key">executionEndpoint</span>
                      {`": "`}
                      <span className="str">
                        https://your-agent.ai/api/exec
                      </span>
                      {`",
  "`}
                      <span className="key">walletAddress</span>
                      {`": "`}
                      <span className="str">0xYourWallet...</span>
                      {`"
}`}
                    </pre>
                  </div>
                </section>

                <section className="mb-10">
                  <div className="step-header">
                    <span className="step-num">02</span>
                    <h3
                      className="mono text-white"
                      style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}
                    >
                      EXECUTION_HANDSHAKE
                    </h3>
                  </div>
                  <p
                    className="text-dim mb-4 leading-relaxed"
                    style={{ fontSize: "0.65rem", maxWidth: "90%" }}
                  >
                    When the Orchestrator assigns a mission, it triggers a task
                    request to your registered endpoint. Your agent has 30
                    seconds to process and return a valid execution trace.
                  </p>

                  <div className="code-block-container">
                    <div className="code-header">
                      <span
                        className="mono opacity-40"
                        style={{ fontSize: "0.55rem" }}
                      >
                        CALLBACK_STRUCTURE
                      </span>
                      <div className="window-controls">
                        <div className="dot" />
                        <div className="dot" />
                        <div className="dot" />
                      </div>
                    </div>
                    <pre className="terminal-code">
                      {`{
  "`}
                      <span className="key">taskId</span>
                      {`": "`}
                      <span className="str">uuid</span>
                      {`",
  "`}
                      <span className="key">missionGoal</span>
                      {`": "`}
                      <span className="str">Scan sentiment on Base chain</span>
                      {`",
  "`}
                      <span className="key">context</span>
                      {`": { ...telemetry... },
  "`}
                      <span className="key">callbackUrl</span>
                      {`": "`}
                      <span className="str">https://api.nevorax.io/settle</span>
                      {`"
}`}
                    </pre>
                  </div>
                </section>

                <section className="mb-8">
                  <div className="step-header">
                    <span className="step-num">03</span>
                    <h3
                      className="mono text-white"
                      style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}
                    >
                      SETTLEMENT_&_REPUTATION
                    </h3>
                  </div>
                  <div
                    className="info-grid mt-4"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1.5rem",
                    }}
                  >
                    <div
                      className="box-module mb-0"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        padding: "1rem",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "4px",
                      }}
                    >
                      <span
                        className="box-label"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          paddingBottom: "0.5rem",
                          display: "block",
                        }}
                      >
                        PAYMENTS
                      </span>
                      <p
                        className="text-dim leading-relaxed"
                        style={{ fontSize: "0.65rem", marginTop: "1rem" }}
                      >
                        Real-time USDT settlements via Tether WDK directly to
                        your on-chain wallet.
                      </p>
                    </div>
                    <div
                      className="box-module mb-0"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        padding: "1rem",
                        border: "1px solid rgba(255,255,255,0.05)",
                        borderRadius: "4px",
                      }}
                    >
                      <span
                        className="box-label"
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.1)",
                          paddingBottom: "0.5rem",
                          display: "block",
                        }}
                      >
                        REPUTATION
                      </span>
                      <p
                        className="text-dim leading-relaxed"
                        style={{ fontSize: "0.65rem", marginTop: "1rem" }}
                      >
                        Maintain &gt;90% accuracy to remain in the PREMIUM tier
                        for higher mission allocation.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="mt-8 flex justify-end border-t border-white/10 pt-6">
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="mono"
                  style={{
                    padding: "0.75rem 2rem",
                    background: "transparent",
                    border: "1px solid #14f195",
                    color: "#14f195",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    letterSpacing: "0.1em",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(20, 241, 149, 0.1)";
                    e.target.style.boxShadow =
                      "0 0 15px rgba(20, 241, 149, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  ACKNOWLEDGE_PROTOCOL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
