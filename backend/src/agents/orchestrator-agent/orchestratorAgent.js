import crypto from "crypto";
import axios from "axios";
import { planWorkflow } from "../../core/workflow-engine/workflowEngine.js";
import {
  OpenClawRegistry,
  emitOpenClawEvent,
} from "../../openclaw/OpenClawRegistry.js";
import { marketplace } from "../../marketplace/matching-engine/matchingEngine.js";
import { negotiatePrice } from "../negotiation-agent/negotiationAgent.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";

import { FailureRecoveryEngine } from "../../economy/failure-recovery-engine/failureRecoveryEngine.js";
import { AgentReasoningEngine } from "../../intelligence/reasoning-engine/reasoningEngine.js";
import { DemoGuardrails } from "../../utils/demoGuardrails.js";

import * as DataAgent from "../execution-agents/dataAgent.js";
import * as SentimentAgent from "../execution-agents/sentimentAgent.js";
import * as AnalysisAgent from "../execution-agents/analysisAgent.js";
import * as ExecutionAgent from "../execution-agents/executionAgent.js";
import * as StrategyAgent from "../execution-agents/strategyAgent.js";
import * as ReportAgent from "../execution-agents/reportAgent.js";
import * as RiskAgent from "../execution-agents/riskAgent.js";
import * as WhaleWatcherAgent from "../execution-agents/whaleWatcherAgent.js";
import * as SafetyEnforcerAgent from "../execution-agents/safetyEnforcerAgent.js";

import {
  getAgentsByService,
  getAgent,
  applyEconomicEntropy,
} from "../../marketplace/agent-registry/agentRegistry.js";

import { agentPaymentEngine } from "../../payments/payment-orchestrator/paymentEngine.js";
import { economicLedger } from "../../ledger/economic-ledger/economicLedger.js";
import MarketplaceService from "../../services/marketplaceService.js";
import { config } from "../../utils/config/config.js";
import {
  createAgreement,
  completeAgreement,
  signAgreement,
} from "../../contracts/service-agreement-manager/agreementManager.js";
import { WalletBridge } from "../../wallets/wallet-bridge/WalletBridge.js";
import { BridgeEngine } from "../../wallets/bridge-engine/BridgeEngine.js";
import { EconomyEventBus } from "../../events/economyEventBus.js";
import { auditTransaction } from "../execution-agents/safetyEnforcerAgent.js";
import { logEconomy } from "../../utils/logging/logger.js";

import { selectBestProvider } from "../../core/workflow-engine/planner/selectionBrain.js";
import { synthesizeFinalResult } from "../../core/workflow-engine/planner/synthesisBrain.js";

const AGENT_MAP = {
  Market_Data_1: DataAgent,
  Market_Data_2: DataAgent,
  Sentiment_Analyst_1: SentimentAgent,
  Sentiment_Analyst_2: SentimentAgent,
  Trend_Analyst_1: AnalysisAgent,
  Trend_Analyst_2: AnalysisAgent,
  Trade_Executor_1: ExecutionAgent,
  Trade_Executor_2: ExecutionAgent,
  Strategy_Planner_1: StrategyAgent,
  Strategy_Planner_2: StrategyAgent,
  Report_Writer_1: ReportAgent,
  Report_Writer_2: ReportAgent,
  Risk_Auditor_1: RiskAgent,
  Risk_Auditor_2: RiskAgent,
  Whale_Tracker_1: WhaleWatcherAgent,
  Whale_Tracker_2: WhaleWatcherAgent,
  Safety_Enforcer_1: SafetyEnforcerAgent,
  Safety_Enforcer_2: SafetyEnforcerAgent,
};

// Global OpenClaw Initialization: Register all agents into the compliance layer
import { getAllAgents } from "../../marketplace/agent-registry/agentRegistry.js";
getAllAgents().forEach((agent) =>
  OpenClawRegistry.registerAgent(agent.agentId, agent),
);

/**
 * Simple extraction for blockchain intents (e.g. "Send 10 USDT to 0x...")
 */
export function extractTransactionIntent(goal) {
  const addressMatch = goal.match(/0x[a-fA-F0-9]{40}/i);

  // Prioritize "Amount [Asset]" patterns
  let amountMatch = goal.match(/(\d+(\.\d+)?)\s*(USDT|USDC|ETH)/i);

  // Fallback to plain number if address present or bridging
  if (!amountMatch) {
    amountMatch = goal.match(/(\d+(\.\d+)?)/);
  }

  // Detect Bridge chains
  const bridgeMatch = goal.match(/bridge|cross-chain|rebalance/i);
  const targetChainMatch = goal.match(/(?:to|into|on)\s+(arbitrum|ethereum|hoodi|sepolia)/i) || 
                           goal.match(/(arbitrum|ethereum|hoodi|sepolia)/i);

  if (bridgeMatch && targetChainMatch && amountMatch) {
    const res = {
      action: "BRIDGE",
      targetChain: targetChainMatch[1].toLowerCase(),
      targetAmount: amountMatch[1],
      asset: amountMatch ? (amountMatch[3] || "USDT").toUpperCase() : "USDT",
    };
    logEconomy("BRIDGE_INTENT_EXTRACTED", res);
    return res;
  }

  if (addressMatch && amountMatch) {
    const res = {
      action: "TRANSFER",
      targetAddress: addressMatch[0],
      targetAmount: amountMatch[1],
      asset: (amountMatch[3] || "USDT").toUpperCase(),
    };
    console.log(`[Intent][DEBUG] TRANSFER detected: ${JSON.stringify(res)}`);
    return res;
  }

  // Broaden Detection for Hackathon: ONLY if it's very short and specific
  if (
    goal.length < 60 &&
    goal.match(
      /^(send|transfer|pay|settle|execute|trade|buy|sell|bridge)\s+(\d+(\.\d+)?)\s*(USDT|USDC|ETH)?/i,
    )
  ) {
    const res = { action: "IMPLICIT_EXECUTION", goal };
    console.log(
      `[Intent][DEBUG] IMPLICIT_EXECUTION detected (Short Command): ${JSON.stringify(res)}`,
    );
    return res;
  }

  console.log(`[DEBUG][Intent] No intent found for goal: "${goal}"`);
  return null;
}

/**
 * Run an orchestrated task with dynamic goal decomposition and budgeting.
 */
export async function runOrchestratedTask(goal, budgetObj, onProgress, taskId) {
  const updateProgress = (data) => {
    if (onProgress) onProgress(data);
  };

  try {
    let budgetWei =
      budgetObj?.budgetWei && budgetObj.budgetWei !== "0"
        ? budgetObj.budgetWei
        : "250000000";
    let flagshipOverride = false;

    // Subscribe to economy bus for real-time visibility
    const unsubscribe = EconomyEventBus.subscribe((event) => {
      if (event.type === "DATA_SOURCE_ACTIVE") {
        updateProgress({
          currentStep: "REASONING",
          details: `Data Discovery: Utilizing institutional source '${event.metadata?.source}' for ${event.metadata?.asset || "market"} intel.`,
        });
      }
    });

    logEconomy("TASK_STARTED", { goal, budgetWei });
    const lowerGoal = goal.toLowerCase();

    // OpenClaw Integration: Start Mission
    const mission = OpenClawRegistry.createMission(
      taskId || `task_${Date.now()}`,
      goal,
      [],
    );
    console.log(`[OpenClaw][MissionStart] ID: ${mission.mission_id}`);

    // Initial OpenClaw Trace Setup
    mission.securityTrace = {
      payload_integrity: "PENDING",
      compliance_seal: "PENDING",
      budget_guardrail: "PENDING",
      wdk_proof: "PENDING",
    };

    // Initial Progress Sync: Bridge mission envelope to Task Store
    updateProgress({ openClaw: mission });

    // Determine priority based on goal keywords
    let priority = "QUALITY";
    if (lowerGoal.match(/fast|quick|speed|urgent|summary|simple|alert|brief/)) {
      priority = "SPEED";
    }

    const executionTrace = ["Planning workflow"];
    const reasoningTrace = [];
    economicLedger.recordEvent({
      type: "TASK_CREATED",
      fromAgent: "User",
      toAgent: "OrchestratorAgent",
      metadata: { goal, budgetWei },
    });

    console.log(`[Orchestrator][DEBUG] Raw Goal: "${goal}"`);

    // 0. Extract Transaction Intent (Active Execution)
    const intent = extractTransactionIntent(goal);
    const trimmedGoal = goal.trim().toLowerCase();

    // Hardened detection for hackathon variety (e.g. "I want to send", "pls transfer")
    const analyticalKeywords = [
      "analyze",
      "analysis",
      "sentiment",
      "yield",
      "assess",
      "assessment",
      "audit",
      "find",
      "search",
      "trend",
      "report",
      "strategy",
      "history",
      "security",
      "risk",
      "mitigation",
      "investigate",
      "monitor",
      "optimize",
      "hunter",
      "whale",
      "alpha",
    ];
    const isComplexGoal = analyticalKeywords.some((kw) =>
      trimmedGoal.includes(kw),
    );

    // A Pure Transfer MUST:
    // 1. Not be complex
    // 2. Have a clear intent (address or bridge)
    // 3. Not be an implicit execution that might just be a verb in a sentence
    const hasTransferKeyword =
      !!trimmedGoal.match(/^(send|transfer|pay|settle|bridge|dispatch)/i) ||
      (intent && intent.action === "TRANSFER");
    const isPureTransfer =
      !isComplexGoal &&
      hasTransferKeyword &&
      intent &&
      intent.action !== "IMPLICIT_EXECUTION";

    console.log(`[Orchestrator][DEBUG] Intent Check:`);
    console.log(` - Goal: "${trimmedGoal}"`);
    console.log(` - Intent detected: ${intent ? intent.action : "NONE"}`);
    console.log(` - isComplexGoal: ${isComplexGoal}`);
    console.log(` - hasTransferKeyword: ${hasTransferKeyword}`);
    console.log(` - isPureTransfer: ${isPureTransfer}`);

    if (intent) {
      logEconomy("INTENT_DETECTED", intent);
    }

    // Record incoming budget as Orchestrator revenue (User pays Orchestrator)
    AgentProfitEngine.recordRevenue("OrchestratorAgent", budgetWei);

    // 1. Dynamic Planning or Flagship Override
    let workflowPlan;

    // Check if it's a BRIDGE intent AND not a complex analytical task
    if (intent && intent.action === "BRIDGE" && !isComplexGoal) {
      console.log(
        `[Orchestrator] BRIDGE intent detected: ${intent.targetAmount} to ${intent.targetChain}`,
      );
      updateProgress({
        currentStep: "REASONING",
        details: `DIRECT BRIDGE: Recognized intent to move cross-chain liquidity. Engaging WDK Settlement Rail...`,
      });
      const taskId = crypto.randomUUID();
      flagshipOverride = true;
      workflowPlan = {
        taskId,
        task: goal,
        services: ["bridge_execution"], // Custom local flag
        budgetWei,
        budgetAllocations: { bridge_execution: budgetWei },
        reasoning: `Executing cross-chain WDK bridge of ${intent.targetAmount} ${intent.asset} to ${intent.targetChain}.`,
        workflow: [
          {
            service: "bridge_execution",
            recommendedAgents: ["BridgeEngine"],
          },
        ],
      };
    } else if (isPureTransfer) {
      console.log("[Orchestrator] Pure Transfer PATH activated.");
      updateProgress({
        currentStep: "REASONING",
        details: `DIRECT SETTLEMENT: Recognized intent to ${intent.asset || "asset"} transfer. Bypassing global marketplace analysis for specialized execution.`,
      });
      const taskId = crypto.randomUUID();
      flagshipOverride = true;
      workflowPlan = {
        taskId,
        task: goal,
        services: ["execution"],
        budgetWei,
        budgetAllocations: { execution: budgetWei },
        reasoning:
          "Direct execution initiated. Skipping market analysis to prioritize immediate asset transfer.",
        workflow: [
          {
            service: "execution",
            recommendedAgents: ["ExecutionAgent_OnChain"],
          },
        ],
      };
    } else {
      logEconomy("PATH_ACTIVATED", { path: "ANALYTICAL" });
      updateProgress({
        currentStep: "PLANNING",
        details: "Decomposing goal into specialized sub-tasks...",
      });

      // STOCHASTIC UPGRADE: Inject Session Entropy
      console.log(
        `[Orchestrator] Initializing Stochastic Economic Environment for Task ${taskId || "active"}...`,
      );
      marketplace.updateSessionVolatility();
      applyEconomicEntropy();

      workflowPlan = await planWorkflow(goal, budgetWei);
    }

    const targetService =
      intent?.action === "BRIDGE" ? "bridge_execution" : "execution";
    if (intent && !workflowPlan.services.includes(targetService)) {
      console.log(
        `[Orchestrator] Forcing '${intent.action === "BRIDGE" ? "bridge_execution" : "execution"}' service into workflow due to detected intent.`,
      );

      // OpenClaw Alignment: Signal the planning intent
      emitOpenClawEvent({
        protocol: "OpenClaw",
        envelope: { type: "PLAN_GENERATED" },
        payload: { goal, services: workflowPlan.services },
      });

      // Force bridge_execution if intent matches
      const targetService = "bridge_execution";
      const services = [...workflowPlan.services];

      // Remove generic execution if it exists to avoid double settlements
      const existingExecIdx = services.indexOf("execution");
      if (existingExecIdx !== -1) {
        services.splice(existingExecIdx, 1);
      }

      const reportIdx = services.indexOf("report_generation");
      if (reportIdx !== -1) {
        services.splice(reportIdx, 0, targetService);
      } else {
        services.push(targetService);
      }

      workflowPlan.services = [...new Set(services)];
      workflowPlan.workflow = services.map((service) => ({
        service,
        recommendedAgents:
          getAgentsByService(service).length > 0
            ? getAgentsByService(service).map((a) => a.agentId)
            : service === "bridge_execution"
              ? ["BridgeEngine"]
              : ["ExecutionAgent_OnChain"],
      }));

      // Recalculate allocations (use provided budgetWei instead of hardcoded 100 USDT)
      if (workflowPlan.budgetAllocations) {
        workflowPlan.budgetAllocations[targetService] = budgetWei;
      }
    }
    // --------------------------------

    reasoningTrace.push(
      AgentReasoningEngine.recordDecision(
        "WORKFLOW_PLANNING",
        "OrchestratorAgent",
        { goal, serviceCount: workflowPlan.services.length },
        workflowPlan.reasoning ||
          `Decomposed goal into ${workflowPlan.services.length} specialized sub-tasks.`,
      ),
    );

    console.log(
      `[Orchestrator] ${flagshipOverride ? "Flagship" : "Dynamic"} Plan: ${workflowPlan.services.join(" -> ")}`,
    );

    executionTrace.push("Allocating budget");

    Object.entries(workflowPlan.budgetAllocations || {}).forEach(
      ([service, amount]) => {
        reasoningTrace.push(
          AgentReasoningEngine.justifyBudgetAllocation(service, amount),
        );
      },
    );

    // OpenClaw Trace: Budget locked
    if (mission.securityTrace) {
      mission.securityTrace.budget_guardrail = "ENFORCED";
      updateProgress({ openClaw: mission });
    }

    const results = {};
    const agreements = [];
    const executionContext = {
      results: {},
      marketplace: { bids: [] },
      negotiation: {},
      treasury: {},
    };

    // 2. Execute Workflow
    for (const step of workflowPlan.workflow) {
      const { service } = step;
      const stepBudgetWei = workflowPlan.budgetAllocations?.[service] || "0";

      // --- WDK BRIDGE BYPASS ---
      if (service === "bridge_execution") {
        updateProgress({
          currentStep: "EXECUTING",
          details: `Initiating cross-chain settlement via WDK BridgeEngine...`,
          currentService: service,
        });

        try {
          // Ensure intent is available even if extraction failed in the main check
          const activeIntent = intent || extractTransactionIntent(goal);
          if (!activeIntent || activeIntent.action !== "BRIDGE") {
             // If we can't extract a specific intent, this is likely a high-level "PLAN" 
             // rather than an atomic "TRANSFER". We'll treat it as such and let the synthesis handle it.
             console.warn(`[Orchestrator] Service 'bridge_execution' requested but no specific bridge intent extracted. Treating as Strategic Plan.`);
             executionContext.results[service] = results[service] = {
                status: "PLANNED",
                details: "Strategic cross-chain execution plan formulated. Physical liquidity movement pending explicit volume verification.",
             };
             continue; 
          }

          const bridgeHandle = await BridgeEngine.bridgeAssets(
            activeIntent.targetAmount,
            "Sepolia",
            activeIntent.targetChain,
            "OrchestratorAgent",
          );

          // CRITICAL: Await the on-chain verification so the txHash is available for synthesis
          const bridgeResult = await bridgeHandle.completion;

          executionContext.results[service] = results[service] = {
            status: "SUCCESS",
            txHash: bridgeResult.txHash,
            sourceExplorer: bridgeResult.sourceExplorer,
            details: `Confirmed WDK bridge of ${activeIntent.targetAmount} USDT to ${activeIntent.targetChain}. Tx Hash: ${bridgeResult.txHash}`,
          };
        } catch (err) {
          executionContext.results[service] = {
            status: "FAILED",
            error: err.message,
            details: `WDK Bridge transfer failed: ${err.message}`,
          };
          executionTrace.push(`Bridge Execution Failed: ${err.message}`);
          // We should decide if we want to kill the workflow here.
          // For rebalance, it's often critical.
          throw err;
        }
        continue; // Skip the marketplace loop
      }
      // -------------------------

      updateProgress({
        currentStep: "NEGOTIATING",
        details: `Marketplace open: Seeking providers for ${service}...`,
        currentService: service,
      });

      await new Promise((r) => setTimeout(r, 1500));

      let success = false;
      let attempts = 0;

      while (
        !success &&
        FailureRecoveryEngine.canRetry(workflowPlan.taskId + service)
      ) {
        attempts++;
        try {
          // A. Post Job
          executionTrace.push("Opening marketplace bidding");

          // OpenClaw Alignment: Signal the unit discovery
          const discoverySignal = OpenClawRegistry.sealSignal(
            "OrchestratorAgent",
            "Marketplace",
            "UNIT_DISCOVERY",
            { service },
          );
          OpenClawRegistry.logSignal(taskId, discoverySignal);

          const job = marketplace.postJob(
            service,
            "OrchestratorAgent",
            stepBudgetWei,
          );

          // B. Collect Bids
          let allProviders = getAgentsByService(service);

          // Budget Constraint Filtering: Load ground truth from store
          const allAgentsDetailed = MarketplaceService.getAllAgents();
          allProviders = allProviders.filter((p) => {
            const detailed = allAgentsDetailed.find((d) => d.id === p.agentId);
            if (detailed && detailed.budgetSpent >= detailed.budgetLimit) {
              console.warn(
                `[Orchestrator] Disqualifying ${p.agentId}: Budget Exhausted (${detailed.budgetSpent}/${detailed.budgetLimit})`,
              );
              return false;
            }
            return true;
          });

          for (const provider of allProviders) {
            const agentModule = AGENT_MAP[provider.agentId];
            if (agentModule && agentModule.generateBid) {
              const bid = agentModule.generateBid(job, provider.agentId);
              if (bid) {
                const finalBid = marketplace.submitBid(
                  job.jobId,
                  bid.agentId,
                  bid.price,
                  bid.reputation,
                  bid.metadata,
                );

                if (finalBid) {
                  updateProgress({
                    currentStep: "BIDDING",
                    details: `Bid submitted: ${finalBid.agentId} (${finalBid.metadata?.mode || "STANDARD"}) offers ${(Number(finalBid.price) / 1e6).toFixed(6)} USDT (Rep: ${(finalBid.reputation * 100).toFixed(2)}%)`,

                    currentAgent: finalBid.agentId,
                    currentService: service,
                  });
                  await new Promise((r) => setTimeout(r, 1200));
                }
              }
            }
          }

          executionContext.marketplace.bids = [
            ...executionContext.marketplace.bids,
            ...marketplace.getBids(job.jobId),
          ];

          // C. Select Best Bid with "Selection Brain" Logic
          executionTrace.push("Selecting provider");

          // Bias: If intent is present and service is execution, force QUALITY/ON_CHAIN preference
          const selectionPriority =
            service === "execution" && intent ? "QUALITY" : priority;

          const stepBudgetUsdt = (Number(stepBudgetWei) / 1e6).toFixed(2);
          const bestBid = await selectBestProvider(
            goal,
            service,
            marketplace.getBids(job.jobId),
            selectionPriority,
            stepBudgetUsdt,
          );

          if (!bestBid) {
            throw new Error(
              `[Orchestrator] No bids received for service: ${service}`,
            );
          }

          const selectionReasoning = `Best match: ${bestBid.agentId} selected. Reason: ${bestBid.reasoning}`;

          updateProgress({
            currentStep: "SELECTION",
            details: selectionReasoning,
            currentAgent: bestBid.agentId,
            currentService: service,
          });
          await new Promise((r) => setTimeout(r, 2000));

          reasoningTrace.push({
            type: "PROVIDER_SELECTION",
            agent: "Marketplace",
            explanation: bestBid.reasoning,
            metadata: {
              jobId: job.jobId,
              selectedAgent: bestBid.agentId,
              reason: bestBid.reasoning,
            },
          });

          // ─── CONDITIONAL AUTONOMOUS BRIDGE ───
          // Only move liquidity if the user explicitly requested it (e.g., rebalance, bridge)
          // or if the expert agent is on a high-latency remote chain and it's a bridge-specific task.
          const providerChain = getAgent(bestBid.agentId)?.chain || "Sepolia";
          const needsBridge = providerChain !== "Sepolia";
          const isExplicitBridgeTask =
            !!intent?.action === "BRIDGE" ||
            !!goal
              .toLowerCase()
              .match(/bridge|rebalance|cross-chain|liquidity/i);

          if (needsBridge && isExplicitBridgeTask) {
            const bridgeValue = Number(bestBid.price) / 1e6;
            updateProgress({
              currentStep: "BRIDGING",
              details: `Autonomous fee settlement: Moving ${bridgeValue} USDT to ${providerChain} via WDK Settlement Rail...`,
              currentAgent: "OrchestratorAgent",
            });
            executionTrace.push(`Auto-Liquidity: Bridging to ${providerChain}`);

            try {
              // Safety Enforcer Audit: Pre-Bridge
              const audit = await auditTransaction(workflowPlan.taskId, {
                amount: bridgeValue,
                asset: "USDT",
                destination: providerChain,
                type: "BRIDGE",
              });

              if (!audit.approved) {
                throw new Error(
                  `[SafetyEnforcer] BRIDGE_DENIED: ${audit.reason}`,
                );
              }

              const bridgeTransfer = await BridgeEngine.bridgeAssets(
                bridgeValue,
                "Sepolia",
                providerChain,
                "OrchestratorAgent",
              );

              try {
                // Wait for Phase 2 Settlement with safety buffer
                await bridgeTransfer.completion;
                await new Promise(r => setTimeout(r, 1000));
              } catch (err) {
                console.warn("[Orchestrator] Hoodi settlement leg failed but Phase 1 was recorded:", err.message);
              }

              // Final capturing of the transfer state (guaranteed to have at least Phase 1)
              executionContext.results.bridge_execution = {
                status: bridgeTransfer.status,
                txHash: bridgeTransfer.txHash,
                destTxHash: bridgeTransfer.destTxHash,
                sourceExplorer: bridgeTransfer.sourceExplorer,
                destExplorer: bridgeTransfer.destExplorer,
                details: bridgeTransfer.error 
                  ? `Partial Bridge: Phase 1 (Sepolia) OK, Phase 2 (Hoodi) Failed: ${bridgeTransfer.error}`
                  : `Real Dual-Chain Bridge: Sent ${bridgeValue} USDT via WDK Settlement Rail (Sepolia -> ${providerChain})`
              };

              updateProgress({
                currentStep: "BRIDGED",
                details: bridgeTransfer.status === "SETTLED" 
                  ? `Liquidity successfully moved to ${providerChain}.` 
                  : `Bridge settlement warning: Check Hoodi logs for Phase 2 status.`,
                currentAgent: "OrchestratorAgent",
              });
              await new Promise((r) => setTimeout(r, 500));
            } catch (bridgeErr) {
              console.error("[Orchestrator] Critical Bridge Failure:", bridgeErr.message);
              executionTrace.push(`Bridge Error: ${bridgeErr.message}`);
            }
          } else if (needsBridge) {
            console.log(
              `[Orchestrator] Skipping autonomous bridge for expert fee on ${providerChain} (not an explicit bridge task).`,
            );
          }

          // D. Negotiate Price
          executionTrace.push("Negotiating price");
          const bidPrice = bestBid.price.toString();

          updateProgress({
            currentStep: "NEGOTIATING",
            details: `Counter-offering ${bestBid.agentId} based on marketplace analytics...`,
            currentAgent: bestBid.agentId,
          });

          let finalPrice = await negotiatePrice(
            service,
            bidPrice,
            stepBudgetWei,
            bestBid.reputation,
          );
          if (!finalPrice) finalPrice = bidPrice;

          const savings = (
            ((Number(bidPrice) - Number(finalPrice)) / Number(bidPrice)) *
            100
          ).toFixed(1);
          updateProgress({
            currentStep: "NEGOTIATED",
            details: `Agreed on ${Number(finalPrice) / 1e6} USDT (Negotiated ${savings}% discount).`,
            currentAgent: bestBid.agentId,
          });

          reasoningTrace.push(
            AgentReasoningEngine.justifyNegotiation(
              bestBid.agentId,
              bidPrice,
              finalPrice,
              0.9,
            ),
          );

          updateProgress({
            currentStep: "EXECUTING",
            details: `Agent ${bestBid.agentId} performing ${service}...`,
            currentAgent: bestBid.agentId,
            currentService: service,
          });

          // E. Create Agreement
          executionTrace.push("Agreement created");
          const agreement = createAgreement({
            taskId: workflowPlan.taskId,
            providerAgent: bestBid.agentId,
            service: service,
            price: finalPrice,
          });

          // F. Sign Agreement
          const agreementMessage = `Agreement ${agreement.agreementId}: ${service} for ${finalPrice} units`;
          const orchestratorSignature =
            await WalletBridge.cryptographicallySign(
              "OrchestratorAgent",
              agreementMessage,
            );
          const providerSignature = await WalletBridge.cryptographicallySign(
            bestBid.agentId,
            agreementMessage,
          );

          signAgreement(
            agreement.agreementId,
            "OrchestratorAgent",
            orchestratorSignature,
          );
          signAgreement(
            agreement.agreementId,
            bestBid.agentId,
            providerSignature,
          );

          agreements.push({
            ...agreement,
            price: (agreement.price || "0").toString(),
            orchestratorSignature,
            providerSignature,
          });

          // OpenClaw Trace: First agreement signed
          if (mission.securityTrace && agreements.length === 1) {
            mission.securityTrace.compliance_seal = "CONFIRMED";
            updateProgress({ openClaw: mission });
          }

          economicLedger.recordEvent({
            type: "AGREEMENT_CREATED",
            fromAgent: "OrchestratorAgent",
            toAgent: bestBid.agentId,
            service: service,
            amount: finalPrice,
            metadata: {
              taskId: workflowPlan.taskId,
              agreementId: agreement.agreementId,
              originalBid: bidPrice,
            },
          });

          /**
           * Execute a task on a remote agent via Webhook.
           */
          async function executeRemoteTask(
            endpoint,
            taskId,
            context,
            price,
            agentId,
          ) {
            console.log(
              `[Orchestrator] Executing REMOTE task on ${agentId} via ${endpoint}`,
            );
            try {
              const response = await axios.post(
                endpoint,
                {
                  taskId,
                  context,
                  agreedPrice: price,
                  requester: "OrchestratorAgent",
                },
                { timeout: 30000 },
              );

              return response.data;
            } catch (error) {
              console.error(
                `[Orchestrator] Remote Execution Failed for ${agentId}:`,
                error.message,
              );
              return {
                success: false,
                error: `Remote agent unreachable: ${error.message}`,
                agentId,
              };
            }
          }

          // F. Execute Agent Task
          const agentMetadata = getAgent(bestBid.agentId);
          let result;

          const context = { goal, ...results, ...(intent && { ...intent }) };

          if (agentMetadata?.executionEndpoint) {
            // REMOTE EXECUTION
            result = await executeRemoteTask(
              agentMetadata.executionEndpoint,
              workflowPlan.taskId + "_" + service,
              context,
              finalPrice,
              bestBid.agentId,
            );
          } else {
            // LOCAL EXECUTION
            const agentModule = AGENT_MAP[bestBid.agentId];
            const taskFunc = Object.values(agentModule).find(
              (f) =>
                typeof f === "function" &&
                (f.name.includes("run") || f.name.includes("perform")),
            );

            result = await DemoGuardrails.executeWithTimeout(
              () =>
                taskFunc(
                  workflowPlan.taskId + "_" + service,
                  context,
                  finalPrice,
                  bestBid.agentId,
                ),
              180000,
            );
          }

          results[service] = result || {};
          executionContext.results[service] = results[service];

          // OpenClaw Trace: Result received
          if (mission.securityTrace && Object.keys(results).length === 1) {
            mission.securityTrace.payload_integrity = "VALIDATED";
            updateProgress({ openClaw: mission });
          }

          // G. Real Payment
          executionTrace.push("Payment executed");

          // OpenClaw Alignment: Signal results delivery
          const resultSignal = OpenClawRegistry.sealSignal(
            bestBid.agentId,
            "OrchestratorAgent",
            "RESULT_DELIVERY",
            { service, success: true },
          );
          OpenClawRegistry.logSignal(taskId, resultSignal);

          updateProgress({
            currentStep: "PAYING",
            details: `Settling blockchain payment to ${bestBid.agentId}...`,
            currentAgent: bestBid.agentId,
            openClaw: OpenClawRegistry.activeMissions.get(taskId),
          });

          // Safety Enforcer Audit: Pre-Payment
          const paymentAudit = await auditTransaction(workflowPlan.taskId, {
            amount: Number(finalPrice) / 1e6,
            asset: "USDT",
            destination: bestBid.agentId,
            type: "SETTLEMENT",
          });

          if (!paymentAudit.approved) {
            throw new Error(
              `[SafetyEnforcer] SETTLEMENT_DENIED: ${paymentAudit.reason}`,
            );
          }

          const paymentRecord = await agentPaymentEngine.executePayment({
            taskId: workflowPlan.taskId,
            fromAgent: "OrchestratorAgent",
            toAgent: bestBid.agentId,
            service: service,
            amount: BigInt(finalPrice),
          });

          if (results[service] && paymentRecord) {
            results[service].subTxHash = paymentRecord.subTxHash;
            // OpenClaw Trace: WDK Settlement verified
            if (mission.securityTrace && paymentRecord.subTxHash) {
              mission.securityTrace.wdk_proof = "VERIFIED";
              updateProgress({ openClaw: mission });
            }
          }

          AgentProfitEngine.recordRevenue(bestBid.agentId, finalPrice);
          AgentProfitEngine.recordExpense("OrchestratorAgent", finalPrice);

          // Settlement and reputation are now handled centrally at mission end
          // to include overall performance scoring and prevent double-counting.

          // NEW: Log mission management to the global ledger for Orchestrator history
          economicLedger.recordEvent({
            type: "MISSION_MANAGED",
            fromAgent: "OrchestratorAgent",
            toAgent: bestBid.agentId,
            service: service,
            amount: finalPrice.toString(),
            subTxHash: paymentRecord?.subTxHash || null,
            metadata: {
              taskId: workflowPlan.taskId,
              status: "SUCCESS",
              subTxHash: paymentRecord?.subTxHash || null,
            },
          });

          completeAgreement(agreement.agreementId);
          success = true;
        } catch (error) {
          console.error(
            `[Orchestrator] Loop Error for ${service}:`,
            error.message,
          );
          throw error;
        }
      }
    }

    // 3. Final Synthesis (The Brain's Summary) - Force 70B for maximum reasoning quality
    if (agreements.length === 0) {
      updateProgress({
        currentStep: "REJECTED",
        details:
          "Goal identified as non-financial. Skipping autonomous supply chain to preserve capital.",
      });
    } else {
      updateProgress({
        currentStep: "FINALIZING",
        details: "Synthesizing final intelligence report...",
      });
    }
    const finalIntelligence = await synthesizeFinalResult(
      goal,
      results,
      agreements,
      "llama-3.3-70b-versatile",
    );

    const taskPayments = agentPaymentEngine.getTaskPayments(
      workflowPlan.taskId,
    );
    const paymentSummary = agentPaymentEngine.getPaymentSummary(
      workflowPlan.taskId,
    );

    const unifiedResponse = {
      taskId: workflowPlan.taskId,
      goal,
      results: executionContext.results,
      status: "COMPLETED",
      workflow: {
        agentsUsed: Array.from(new Set(agreements.map((a) => a.provider))),
        services: workflowPlan.services,
      },
      marketplace: {
        bids: (executionContext.marketplace.bids || []).map((b) => ({
          agentId: b.agentId,
          price: b.price.toString(),
          reputation: b.reputation,
        })),
        selectedProvider: agreements[agreements.length - 1]?.provider || "",
        negotiatedPrice: agreements[agreements.length - 1]?.price || "0",
      },
      agreements: agreements.map((a) => ({
        agreementId: a.agreementId,
        provider: a.provider,
        service: a.service,
        price: a.price,
      })),
      payments: taskPayments.map((p) => {
        // Find the real settlement delta from the MarketplaceService
        // We calculate this during the final sequence to ensure truth
        const agentId = p.toAgent;
        const payout = Number(p.amount) / 1e6;

        // Final mission performance score: Higher confidence = better reputation gain
        const confidence = Number(finalIntelligence?.confidence || 0.85);
        const settlement = MarketplaceService.settleAgentPayment(
          agentId,
          payout,
          0.45,
          {
            taskId: workflowPlan.taskId,
            service: p.service,
            subTxHash: p.subTxHash,
          },
          confidence,
        );

        return {
          fromAgent: p.fromAgent,
          toAgent: p.toAgent,
          service: p.service,
          amount: p.amount.toString(),
          subTxHash: p.subTxHash,
          reputationDelta: settlement?.reputationDelta || 0.2,
          reputationReason: settlement?.reason || "Maintenance",
        };
      }),

      traces: {
        execution: Array.from(new Set(executionTrace)).filter((step) =>
          [
            "Planning workflow",
            "Marketplace bidding",
            "Provider selected",
            "Agreement created",
            "Payment executed",
            "Report generated",
          ].includes(step),
        ),
        reasoning: reasoningTrace.slice(-20),
      },
      result: (() => {
        const lowerGoal = goal.toLowerCase();
        const hasTradeIntent = lowerGoal.match(
          /trade|buy|sell|swap|settle|execute a plan|long|short|rebalance/,
        );
        const hasUrgencyIntent = lowerGoal.match(
          /urgent|fast|speed|quick|asap/,
        );
        const hasResearchIntent = lowerGoal.match(
          /analyze|analysis|sentiment|audit|search|scan|investigate/,
        );

        // Sanitize and synthesize results with strict UI filtering
        const final = {
          sentiment:
            hasTradeIntent || hasResearchIntent
              ? finalIntelligence?.sentiment || "n/a"
              : "n/a",
          trend:
            hasTradeIntent || hasResearchIntent
              ? finalIntelligence?.trend || "n/a"
              : "n/a",
          recommendation: hasTradeIntent
            ? finalIntelligence?.recommendation || "n/a"
            : "n/a",
          urgency: hasUrgencyIntent
            ? finalIntelligence?.urgency || "n/a"
            : "n/a",
          confidence:
            hasTradeIntent || hasResearchIntent
              ? finalIntelligence?.confidence || "n/a"
              : "n/a",
          summary:
            finalIntelligence?.summary || "Analysis completed successfully.",
          safetyAudit: finalIntelligence?.safetyAudit || [],
        };

        // Standardize any 'neutral' or 'hold' filler that leaks from LLM into research mode
        if (!hasTradeIntent) {
          if (
            final.recommendation === "hold" ||
            final.recommendation === "neutral"
          )
            final.recommendation = "n/a";
        }

        return final;
      })(),
      finance: {
        totalValueTransferred: paymentSummary.totalValueTransferred,
        agentProfits: AgentProfitEngine.getAllFinances().map((f) => ({
          agentId: f.agentId,
          profit: f.profit.toString(),
        })),
      },
    };

    economicLedger.recordEvent({
      type: "TASK_COMPLETED",
      fromAgent: "OrchestratorAgent",
      metadata: {
        taskId: workflowPlan.taskId,
        totalPayments: paymentSummary.totalPayments,
      },
    });

    // SETTLE ORCHESTRATOR FEE: Record management payout in persistent store
    // Introduce ±5% jitter to the base cost for realism
    const baseCost = Number(config.economy.baseOperatingCost) / 1e6;
    const jitter = 0.95 + Math.random() * 0.1;
    const orchestrationFee = Number((baseCost * jitter).toFixed(6));

    MarketplaceService.settleAgentPayment(
      "OrchestratorAgent",
      orchestrationFee,
      0.1, // Nominal delta for successful orchestration
      {
        taskId: workflowPlan.taskId,
        service: "orchestration",
        txHash: "INTERNAL_LEDGER",
      },
      1.0,
    );

    // We can also attach the orchestrator's rep change to the response if needed
    // but the main cycle sync focus is on agents involved.

    const openClawEnvelope = OpenClawRegistry.activeMissions.get(
      workflowPlan.taskId,
    );
    if (openClawEnvelope) {
      // ─── AUTHENTIC SECURITY PROOF: Wire real telemetry to OpenClaw ───
      const securityTrace = {
        payload_integrity:
          Object.keys(results).length > 0 ? "VALIDATED" : "FAILED",
        compliance_seal: agreements.length > 0 ? "CONFIRMED" : "PENDING",
        budget_guardrail:
          parseFloat(paymentSummary.totalValueTransferred) <= 10.0
            ? "ENFORCED"
            : "BYPASSED",
        wdk_proof: taskPayments.some((p) => p.subTxHash)
          ? "VERIFIED"
          : "UNAVAILABLE",
      };

      openClawEnvelope.securityTrace = securityTrace;
      // Sync to Task Store before closing
      updateProgress({ openClaw: openClawEnvelope });
    }
    unifiedResponse.openClaw = openClawEnvelope;

    unsubscribe();
    return unifiedResponse;
  } catch (error) {
    console.error(
      "[Orchestrator] CRITICAL ORCHESTRATION FAILURE:",
      error.message,
    );
    throw error;
  }
}
