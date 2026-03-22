import React, { useState, useEffect } from "react";
import { EconomyServices } from "../../services/apiService";
import { ArrowLeftRight, Landmark, ShieldCheck, Zap } from "lucide-react";
import "./BridgeConsole.css";

export function BridgeConsole({ latestTaskTime }) {
  const [bridgeState, setBridgeState] = useState("IDLE");
  const [progress, setProgress] = useState(0);
  const [activeTransfer, setActiveTransfer] = useState(null);
  const [history, setHistory] = useState([]);
  const amount = "1.0";
  const stateRef = React.useRef(bridgeState);

  useEffect(() => {
    stateRef.current = bridgeState;
  }, [bridgeState]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch concurrently but handle individual failures to prevent loop crash
        const transfersResult = await EconomyServices.getBridgeHistory().catch(
          (e) => {
            console.error("[BridgePoll] History failed:", e.message);
            return null;
          },
        );

        if (!transfersResult) return;

        const sorted = [...transfersResult].sort(
          (a, b) => b.timestamp - a.timestamp,
        );
        setHistory(sorted.slice(0, 3));

        const latest = sorted[0];
        const isRunning =
          latest && !["SETTLED", "FAILED"].includes(latest.status);

        if (isRunning) {
          setActiveTransfer(latest);
          setBridgeState("RELAYING");

          const statusMap = {
            INITIATING: 15,
            ESTIMATING_FEES: 35,
            LOCKING_SOURCE: 55,
            PROPAGATING: 75,
            RELEASING_DESTINATION: 90,
          };
          setProgress(statusMap[latest.status] || 50);
        } else if (
          latest &&
          latest.status === "SETTLED" &&
          Date.now() - latest.timestamp < 10000
        ) {
          if (stateRef.current !== "SETTLED" && stateRef.current !== "IDLE") {
            setBridgeState("SETTLED");
            setProgress(100);
            setTimeout(() => {
              setBridgeState("IDLE");
              setProgress(0);
              setActiveTransfer(null);
            }, 8000);
          }
        } else if (
          latest &&
          latest.status === "FAILED" &&
          Date.now() - latest.timestamp < 15000
        ) {
          if (stateRef.current !== "IDLE" && stateRef.current !== "FAILED") {
            setBridgeState("FAILED");
            setProgress(100);
            setTimeout(() => {
              setBridgeState("IDLE");
              setProgress(0);
              setActiveTransfer(null);
            }, 5000);
          }
        } else if (
          stateRef.current !== "SEARCHING" &&
          stateRef.current !== "SETTLED" &&
          stateRef.current !== "FAILED"
        ) {
          // Idle state reset
          setBridgeState("IDLE");
          setProgress(0);
          setActiveTransfer(null);
        }
      } catch (err) {
        console.error("Bridge critical poll error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (latestTaskTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBridgeState("IDLE");
      setProgress(0);
      setActiveTransfer(null);
      stateRef.current = "IDLE";
    }
  }, [latestTaskTime]);
  const handleBridge = async () => {
    if (bridgeState !== "IDLE" && bridgeState !== "FAILED") return;

    console.log("[BridgeUI] Manual bridge trigger: SEARCHING");
    setBridgeState("SEARCHING");
    setProgress(10);

    try {
      await EconomyServices.bridgeAssets(
        parseFloat(amount),
        "Sepolia",
        "Hoodi",
      );
      console.log("[BridgeUI] Manual bridge API call returned success");
    } catch (err) {
      console.error("[BridgeUI] Manual bridge FAILED:", err.message);
      setBridgeState("IDLE");
    }
  };

  const getStatusText = () => {
    if (bridgeState === "SETTLED") return "SETTLEMENT_COMPLETE";
    if (activeTransfer) {
      if (activeTransfer.status === "FAILED") return "SETTLEMENT_FAILED";
      if (activeTransfer.status === "SETTLED") return "SETTLEMENT_COMPLETE";
      return activeTransfer.status;
    }
    switch (bridgeState) {
      case "SEARCHING":
        return "IDENTIFYING_ROUTES";
      case "RELAYING":
        return "WDK_CROSS_CHAIN_SYNC";
      case "SETTLED":
        return "SETTLEMENT_COMPLETE";
      case "FAILED":
        return "SETTLEMENT_FAILED";
      default:
        return "DUAL_CHAIN_SYSTEM_READY";
    }
  };

  return (
    <div className="bridge-console">
      <div className="bridge-header-v3">
        <div className="title-group">
          <div className="main-title-row">
            <ArrowLeftRight size={16} className="zap-glow" />
            <h3 className="mono">CROSS-CHAIN_SETTLEMENT</h3>
          </div>
          <div className="badge-row">
            <span className="demo-badge">WDK_TESTNET</span>
            <span
              className="demo-badge"
              style={{ background: "rgba(20, 241, 149, 0.1)", color: "#14f195", borderColor: "rgba(20, 241, 149, 0.3)" }}
              title="Real-time settlement using WDK Multi-Chain Wallet infrastructure."
            >
              REAL DUAL-CHAIN DEMO
            </span>
          </div>
        </div>
        <div className={`status-indicator-v3 ${bridgeState.toLowerCase()}`}>
          <div className="dot" />
          <span className="mono">{getStatusText()}</span>
        </div>
      </div>

      <div className={`path-container-v3 ${bridgeState !== "IDLE" ? "active" : ""}`}>
        <div className="node-group-v3">
          <div className="node-icon-v3">
            <Landmark size={20} />
          </div>
          <span className="node-label-v3">ORIGIN</span>
          <span className="node-val-v3">SEPOLIA</span>
        </div>
        
        <div className="relay-track-v3">
          <div
            className="relay-pulse-v3"
            style={{ width: `${progress}%` }}
          />
          {bridgeState === "RELAYING" && <div className="data-pulse-line" />}
        </div>
        
        <div className="node-group-v3">
          <div className="node-icon-v3">
            <ShieldCheck size={20} />
          </div>
          <span className="node-label-v3">TARGET</span>
          <span className="node-val-v3">HOODI</span>
        </div>
      </div>

      <div className="proof-info-box-v3">
        <div style={{ color: '#14f195' }}>ℹ</div>
        <div>
          <strong>Multi-chain Proof:</strong> This demo executes two <strong>real</strong> on-chain transactions across different Ethereum testnets using the Tether WDK for identity derivation and secure signing.
        </div>
      </div>

      {bridgeState !== "IDLE" && (
        <div className="active-bridge-section" style={{ marginTop: '0' }}>
          <div className="progress-v4" style={{ marginTop: '0', marginBottom: '1.5rem' }}>
            <div className="progress-label mono" style={{ textAlign: 'left', marginBottom: '0.5rem' }}>
              {bridgeState === "FAILED"
                ? "EXECUTION_REVERTED"
                : bridgeState === "SETTLED"
                  ? "SETTLEMENT_FINALIZED ✓"
                  : `PROPAGATION_STATUS: ${progress}%`}
            </div>
            <div
              className="relay-track-v3"
              style={{ margin: '0', height: '4px', background: 'rgba(255,255,255,0.03)' }}
            >
              <div
                className="relay-pulse-v3"
                style={{ 
                  width: `${progress}%`,
                  background: bridgeState === "FAILED" ? "#ef4444" : "linear-gradient(90deg, #a855f7, #14f195)"
                }}
              />
            </div>
          </div>
        </div>
      )}

      <button
        className={`btn-institutional-v3 ${bridgeState === "SETTLED" ? "btn-settled" : ""}`}
        onClick={handleBridge}
        disabled={bridgeState !== "IDLE" && bridgeState !== "FAILED"}
      >
        <Zap size={18} className={bridgeState === "IDLE" ? "zap-glow" : ""} />
        <span className="mono">
          {bridgeState === "IDLE"
            ? "INITIALIZE SETTLEMENT"
            : bridgeState === "FAILED"
              ? "RETRY SETTLEMENT"
              : bridgeState === "SETTLED"
                ? "MISSION_SETTLED ✓"
                : "PROCESSING_WDK_SYNC..."}
        </span>
      </button>

      <div className="ledger-section-v3">
        <div className="section-divider">
          <ShieldCheck size={12} className="zap-glow" style={{ opacity: 0.8 }} />
          <span className="mono">RECENT_TX_LEDGER</span>
        </div>

        <div className="ledger-list-v3">
          {history.length === 0 ? (
            <div className="ledger-empty mono">AWAITING_SETTLEMENTS...</div>
          ) : (
            history.map((tx, idx) => (
              <div
                key={tx.id || idx}
                className="ledger-card-v3"
              >
                <div className="ledger-item-row">
                  <div className={`status-dot-v3 ${tx.destTxHash ? 'active' : ''}`} />
                  <div className="ledger-path mono" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.65rem' }}>
                      {tx.txHash ? (
                        <a 
                          href={tx.sourceExplorer || `https://sepolia.etherscan.io/tx/${tx.txHash}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="bridge-link-v3"
                        >
                          SEPOLIA
                        </a>
                      ) : (
                        <span style={{ opacity: 0.3 }}>SEPOLIA</span>
                      )}
                      
                      <span className="arrow" style={{ opacity: 0.3 }}>→</span>
                      
                      {tx.destTxHash ? (
                        <a 
                          href={tx.destExplorer || `https://hoodi.etherscan.io/tx/${tx.destTxHash}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="bridge-link-v3"
                          style={{ color: '#14f195' }}
                        >
                          HOODI
                        </a>
                      ) : (
                        <span style={{ opacity: 0.3 }}>HOODI</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ledger-amount mono" style={{ fontSize: '0.55rem', opacity: 0.6, textAlign: 'right' }}>
                  {tx.destTxHash ? 'SETTLED' : 'PENDING'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .bridge-link-v3 {
          color: inherit;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: all 0.2s ease;
        }
        .bridge-link-v3:hover {
          color: var(--accent-primary) !important;
          border-bottom: 1px solid var(--accent-primary);
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
