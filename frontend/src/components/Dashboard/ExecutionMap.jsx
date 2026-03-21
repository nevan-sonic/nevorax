import React from "react";
import { Cpu, Zap, DollarSign, Brain, Target } from "lucide-react";
import "./ExecutionMap.css";

export function ExecutionMap({ task }) {
  const steps = task?.stepLog || [];
  const activeStep =
    steps.length > 0 ? steps[steps.length - 1].currentStep : "START";

  const nodes = [
    { id: "PLANNING", label: "STRATEGY", icon: Brain, color: "#a855f7" },
    { id: "BIDDING", label: "MARKET", icon: Zap, color: "#ec4899" },
    { id: "EXECUTING", label: "EXECUTION", icon: Cpu, color: "#3b82f6" },
    { id: "PAYING", label: "SETTLEMENT", icon: DollarSign, color: "#22c55e" },
    { id: "FINALIZING", label: "SYNTHESIS", icon: Target, color: "#f59e0b" },
  ];

  const getStepStatus = (nodeId) => {
    const stepIdx = steps.findIndex((s) => s.currentStep === nodeId);
    if (stepIdx === -1) return "pending";
    if (activeStep === nodeId) return "active";
    return "completed";
  };

  return (
    <div className="execution-map glass-panel">
      <div className="map-nodes">
        {nodes.map((node, i) => {
          const status = getStepStatus(node.id);
          const Icon = node.icon;

          return (
            <React.Fragment key={node.id}>
              <div className={`map-node ${status}`}>
                <div
                  className="node-glow"
                  style={{ backgroundColor: node.color }}
                ></div>
                <div className="node-icon-wrapper">
                  <Icon size={16} />
                </div>
                <div className="node-label mono">{node.label}</div>
              </div>

              {i < nodes.length - 1 && (
                <div
                  className={`node-link ${status === "completed" ? "active" : ""}`}
                >
                  <div
                    className="link-progress"
                    style={{ backgroundColor: node.color }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
