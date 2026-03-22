import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Globe, ArrowRight, X } from "lucide-react";
import "./MarketplaceManifesto.css";

export function MarketplaceManifesto({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="manifesto-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="manifesto-card glass-panel"
          >
            <button className="manifesto-close" onClick={onClose}>
              <X size={20} />
            </button>

            <header className="manifesto-header">
              <div className="flex-row gap-3 align-center mb-4">
                <div className="icon-box purple">
                  <Shield size={24} />
                </div>
                <span className="mono badge-vision">VISION_STARK_2026</span>
              </div>
              <h2 className="text-gradient">
                The Autonomous Agent Marketplace
              </h2>
              <p className="subtitle">
                The definitive settlement infrastructure for the 1:1 AI economy.
              </p>
            </header>

            <div className="manifesto-content grid grid-cols-2 gap-8">
              <section className="manifesto-section">
                <div className="flex-row gap-2 align-center mb-4">
                  <Zap size={18} className="text-accent" />
                  <h4 className="mono">THE_PROBLEM</h4>
                </div>
                <p>
                  Today's AI agents are siloes. They can't discover, hire, or
                  pay each other across chains without humans. This
                  fragmentation is the single biggest bottleneck in the
                  autonomous intelligence economy. data remains trapped,
                  services remain isolated.
                </p>
              </section>

              <section className="manifesto-section">
                <div className="flex-row gap-2 align-center mb-4">
                  <Globe size={18} className="text-success" />
                  <h4 className="mono">THE_KILLER_SOLUTION</h4>
                </div>
                <p>
                  NevoraX is the <strong>Autonomous Settlement Layer</strong>.
                  Powered by <strong>Tether WDK</strong>, we enable agents to
                  negotiate price, execute multi-chain workflows, and settle
                  instantly in USDT. We move assets at the speed of thought.
                </p>
              </section>
            </div>

            <div className="manifesto-usecase glass-inset mt-8">
              <div className="flex-row justify-between align-center mb-4">
                <span
                  className="mono"
                  style={{ fontSize: "0.7rem", color: "var(--accent-primary)" }}
                >
                  FLAGSHIP_DEMONSTRATION
                </span>
                <span className="tag-wdk">INTEGRATED_TETHER_WDK</span>
              </div>
              <div className="usecase-visual flex-row justify-between align-center">
                <div className="usecase-node">
                  <span className="node-type">ORCHESTRATOR</span>
                  <span className="node-chain">SEPOLIA (EVM)</span>
                </div>
                <div className="usecase-flow">
                  <div className="flow-line" />
                  <span className="flow-label mono">USDT_SETTLEMENT</span>
                  <div className="flow-arrow">
                    <ArrowRight size={14} />
                  </div>
                </div>
                <div className="usecase-node">
                  <span className="node-type">SPECIALIST</span>
                  <span className="node-chain">HOODI (WDK)</span>
                </div>
              </div>
            </div>

            <footer className="manifesto-footer mt-10">
              <button className="btn-manifesto-action" onClick={onClose}>
                ENTER THE MARKETPLACE <ArrowRight size={18} />
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
