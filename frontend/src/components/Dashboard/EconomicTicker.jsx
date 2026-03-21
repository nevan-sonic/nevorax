import React from "react";
import { Activity, ShieldCheck, Zap, Globe } from "lucide-react";
import "./EconomicTicker.css";

export function EconomicTicker() {
  const infoItems = [
    {
      type: "PLATFORM",
      msg: "NEVORAX: THE FIRST AUTONOMOUS AGENT MARKETPLACE [v4.2]",
      icon: <Activity size={12} />,
    },
    {
      type: "RAILS",
      msg: "POWERED BY TETHER WDK FOR INSTANT USDT SETTLEMENT",
      icon: <Zap size={12} />,
    },
    {
      type: "NETWORK",
      msg: "LIVE SETTLEMENT RAILS: ETHEREUM SEPOLIA <=> HOODI TESTNET",
      icon: <Globe size={12} />,
    },
    {
      type: "IDENTITY",
      msg: "SECURE AGENT IDENTITY DERIVED FROM MASTER WDK SEEDS",
      icon: <ShieldCheck size={12} />,
    },
    {
      type: "STATS",
      msg: "24/7 DUAL-CHAIN ASSET BRIDGING & AUTOMATION",
      icon: <Activity size={12} />,
    },
  ];

  return (
    <div className="economic-ticker-wrapper glass-panel">
      <div className="ticker-label mono">
        <Activity size={12} className="pulsing-dot" />
        SYSTEM_INTEL
      </div>
      <div className="ticker-track">
        <div className="ticker-content">
          {[...infoItems, ...infoItems].map((item, i) => (
            <div key={i} className="ticker-item mono" data-type={item.type}>
              <span className="ticker-time">[BRAIN_v4.2]</span>
              <span className="ticker-type">{item.type}</span>
              <span className="ticker-msg">{item.msg}</span>
              <span className="ticker-separator">//</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
