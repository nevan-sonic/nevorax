import React, { useState, useEffect } from "react";
import { EconomyServices } from "../../services/apiService";
import { Zap, Activity, CheckCircle2 } from "lucide-react";
import { ActiveWorkflows } from "./ActiveWorkflows";
import { EconomicTicker } from "./EconomicTicker";
import { BridgeConsole } from "./BridgeConsole";
import { DevTerminal } from "./DevTerminal";
import { ExecutionMap } from "./ExecutionMap";
import { JudgeTour } from "./JudgeTour";
import "./Dashboard.css";

export function Dashboard() {
  const [taskInput, setTaskInput] = useState("");
  const [budget, setBudget] = useState(10.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalUsdtTransacted: "0",
    activeAgents: 0,
    avgReputation: "0.0",
  });
  const [pulsingStats, setPulsingStats] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [latestTaskTime, setLatestTaskTime] = useState(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("nevorax_tour_seen");
    if (!hasSeenTour) setShowTour(true);
  }, []);

  const [savings, setSavings] = useState("0.00");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dash, treasury] = await Promise.all([
          EconomyServices.getDashboardData(),
          EconomyServices.getTreasuryData(),
        ]);
        if (dash.stats) {
          setStats(dash.stats);
          setPulsingStats(true);
          setTimeout(() => setPulsingStats(false), 800);
        }
        if (treasury)
          setSavings((Number(treasury.negotiationSavings) / 1e6).toFixed(2));
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };
    const fetchTasks = async () => {
      try {
        const [active, completed] = await Promise.all([
          EconomyServices.getActiveTasks(),
          EconomyServices.getCompletedTasks(),
        ]);
        const allTasks = [
          ...(Array.isArray(active) ? active : []),
          ...(Array.isArray(completed) ? completed.slice(0, 10) : []),
        ].sort((a, b) => (b.enqueuedAt || 0) - (a.enqueuedAt || 0));
        setTasks(allTasks);
      } catch (err) {
        console.error("Tasks fetch error:", err);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchStats();
    fetchTasks();
    const interval = setInterval(() => {
      fetchStats();
      fetchTasks();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunTask = async (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setIsSubmitting(true);
    setError("");
    try {
      await EconomyServices.enqueueTask(taskInput, budget);
      setLatestTaskTime(Date.now());
      setTaskInput("");
    } catch (err) {
      setError(err.message || "Failed to start orchestration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container">
      {showTour && (
        <JudgeTour
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem("nevorax_tour_seen", "true");
          }}
        />
      )}

      <div id="ticker">
        <EconomicTicker />
      </div>

      <header className="dashboard-header flex-col gap-8">
        <div className="hero-stats-bar">
          <div className={`stat-card ${pulsingStats ? "pulse-stat" : ""}`}>
            <span className="stat-label">TOTAL TASKS</span>
            <span className="stat-value text-gradient">{stats.totalTasks}</span>
          </div>
          <div className={`stat-card ${pulsingStats ? "pulse-stat" : ""}`}>
            <span className="stat-label">SYSTEM SAVINGS</span>
            <span className="stat-value text-savings">
              {savings}
            </span>
          </div>
          <div className={`stat-card ${pulsingStats ? "pulse-stat" : ""}`}>
            <span className="stat-label">USDT VOLUME</span>
            <span className="stat-value text-gradient">
              {(Number(stats.totalUsdtTransacted) / 1e6).toFixed(2)}
            </span>
          </div>
          <div className={`stat-card ${pulsingStats ? "pulse-stat" : ""}`}>
            <span className="stat-label">ACTIVE AGENTS</span>
            <span className="stat-value text-gradient">
              {stats.activeAgents}
            </span>
          </div>
          <div className={`stat-card ${pulsingStats ? "pulse-stat" : ""}`}>
            <span className="stat-label">AVG REPUTATION</span>
            <span className="stat-value text-gradient">
              {stats.avgReputation}
            </span>
          </div>
        </div>

        <header className="hero-header">
          <h1 className="text-gradient animate-float">Agent-to-Agent Marketplace</h1>
          <p className="header-desc">
            Next-generation autonomous settlement and intelligence orchestration powered by <strong>v4.2 Engine</strong>. 
            Deploying multi-chain execution strategies across <strong>Sepolia</strong> and <strong>Hoodi</strong> protocols with Wether WDK.
          </p>
        </header>

        <form
          onSubmit={handleRunTask}
          className="task-input-wrapper glass-panel-v3 mx-auto"
        >
          <input
            className="input-transparent"
            type="text"
            placeholder="e.g. Decompose a multi-chain yield strategy and execute via WDK..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            disabled={isSubmitting}
          />
          <div className="budget-control-inline flex-row align-center gap-2 px-4 shadow-inner-soft">
            <span className="mono text-dim" style={{ fontSize: "0.55rem" }}>
              SETTLEMENT_CAP:
            </span>
            <input
              type="number"
              className="budget-input-mini mono"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              disabled={isSubmitting}
              min="0.1"
              step="0.1"
            />
            <span className="mono text-dim" style={{ fontSize: "0.55rem" }}>
              USDT
            </span>
          </div>
          <button
            type="submit"
            className="btn btn-primary-v4"
            disabled={isSubmitting || !taskInput.trim()}
          >
            {isSubmitting ? (
              <span className="pulsing-dot"></span>
            ) : (
              <Zap size={18} />
            )}
            <span className="mono">{isSubmitting ? "SYNCING..." : "INITIATE_TASK"}</span>
          </button>
        </form>

        <div className="task-templates flex-row gap-3 justify-center mt-6">
          <span className="mono text-dim label-mini">QUICK_TEMPLATES:</span>
          {[
            {
              label: "WDK Settlement",
              icon: "⛓️",
              text: "Analyze 24h yield delta between Sepolia and Hoodi; execute a 5 USDT liquidity rebalance via the WDK Multi-Chain Settlement Rail.",
            },
            {
              label: "Market Intelligence",
              icon: "📊",
              text: "Aggregate institutional sentiment for ETH/USDT and execute a cross-chain execution plan based on 4h volume delta.",
            },
            {
              label: "Identity Audit",
              icon: "🛡️",
              text: "Verify agent identity derivations across Sepolia and Hoodi; ensure all WDK-managed wallets are compliant and funded.",
            },
            {
              label: "Multi-Agent Decomp",
              icon: "🎯",
              text: "Decompose a complex risk-analysis task for BTC and trigger a competitive bidding round among verified marketplace agents.",
            },
          ].map((tmp, i) => (
            <button
              key={i}
              className="template-chip-v3 glass-panel mono"
              onClick={() => setTaskInput(tmp.text)}
              type="button"
            >
              <span className="chip-icon">{tmp.icon}</span>
              <span className="chip-label">{tmp.label}</span>
            </button>
          ))}
        </div>
        {error && (
          <div className="error-text mono text-center mt-3">{error}</div>
        )}
      </header>

      <div className="dashboard-main-grid">
        {/* Left Column: Command & Analytics */}
        <aside className="command-sidebar flex-col gap-6">
          <div className="sidebar-group flex-col gap-4">
            <BridgeConsole latestTaskTime={latestTaskTime} />
          </div>
        </aside>

        {/* Center Column: Execution Feed */}
        <section className="execution-feed-center flex-col gap-6">
          <div className="network-topology-bar glass-panel p-4" id="workflows">
            <div className="flex-row justify-between align-center mb-4">
              <div className="flex-row gap-2 align-center">
                <Activity size={14} className="text-accent" />
                <span
                  className="mono"
                  style={{ fontSize: "0.65rem", fontWeight: "800" }}
                >
                  LIVE_NETWORK_TOPOLOGY
                </span>
              </div>
              <div
                className="flex-row gap-5 mono"
                style={{ fontSize: "0.55rem", opacity: 0.8 }}
              >
                <div className="flex-row gap-2 align-center">
                  <div className="status-dot green"></div>
                  <span>AGENTS ACTIVE</span>
                </div>
                <div className="flex-row gap-2 align-center">
                  <div className="status-dot purple"></div>
                  <span>SETTLING</span>
                </div>
              </div>
            </div>
            <ExecutionMap
              task={
                tasks.find(
                  (t) => t.status === "RUNNING" || t.status === "STARTING",
                ) || tasks[0]
              }
            />
          </div>

          <div className="flex-col gap-3">
            <div className="section-title flex-row justify-between align-center">
              <h3>Active Workflows</h3>
              <span className="badge mono">LIVE</span>
            </div>
            <div className="workflow-scroller">
              <ActiveWorkflows tasks={tasks} loading={loadingTasks} />
            </div>
          </div>
        </section>

        {/* Right Column: Engineering Trace */}
        <aside className="trace-sidebar flex-col gap-6">
          <div className="sidebar-group flex-col gap-3">
            <div className="section-title flex-row justify-between align-center">
              <h3>System Trace</h3>
              <span className="badge-outline mono">DEBUG</span>
            </div>
            <div id="terminal">
              <DevTerminal latestTaskTime={latestTaskTime} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
