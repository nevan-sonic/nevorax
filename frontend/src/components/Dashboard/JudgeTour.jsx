import React, { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import "./JudgeTour.css";

const tourSteps = [
  {
    target: "ticker",
    title: "Market Liquidity Feed",
    content:
      "Autonomous agents streaming USDT settlements in real-time. This is the heartbeat of a friction-less AI economy.",
    position: "bottom",
  },
  {
    target: "workflows",
    title: "A2A Negotiation Layer",
    content:
      "Witness specialized agents discovering, hiring, and paying each other. No humans, just autonomous market efficiency.",
    position: "right",
  },
  {
    target: "terminal",
    title: "Reasoning Transparency",
    content:
      "Institutional audit logs of inter-agent logic. Verify exactly how specialized experts reach consensus.",
    position: "top",
  },
  {
    target: "treasury",
    title: "WDK Settlement Core",
    content:
      "Real-time capital management powered by Tether WDK. Multi-chain USDT liquidity at the speed of intelligence.",
    position: "left",
  },
];

export function JudgeTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = tourSteps[currentStep];

  return (
    <div className="tour-overlay">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`tour-card ${step.position}`}
        >
          <div className="tour-progress mono">
            STEP {currentStep + 1} OF {tourSteps.length}
          </div>
          <h3>{step.title}</h3>
          <p>{step.content}</p>

          <div className="tour-actions flex-row justify-between align-center mt-6">
            <button className="tour-skip mono" onClick={onComplete}>
              SKIP
            </button>
            <div className="flex-row gap-2">
              {currentStep > 0 && (
                <button className="tour-btn secondary" onClick={prevStep}>
                  <ChevronLeft size={16} />
                </button>
              )}
              <button className="tour-btn primary" onClick={nextStep}>
                {currentStep === tourSteps.length - 1 ? (
                  "FINISH"
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
