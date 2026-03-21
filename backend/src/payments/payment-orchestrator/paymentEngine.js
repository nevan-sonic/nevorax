import crypto from "crypto";
import { WalletBridge } from "../../wallets/wallet-bridge/WalletBridge.js";
import { AgentProfitEngine } from "../../economy/pricing-engine/financeEngine.js";
import { economicLedger } from "../../ledger/economic-ledger/economicLedger.js";

/**
 * Agent Payment Engine
 * Executes and records explicit agent-to-agent payments for service agreements.
 */
class AgentPaymentEngine {
  constructor() {
    this.payments = new Map(); // taskId -> payment[]
  }

  /**
   * Execute a payment between two agents for a specific service.
   */
  async executePayment(params) {
    const {
      taskId,
      fromAgent,
      toAgent,
      service,
      amount,
      network = "Sepolia",
    } = params;

    console.log(
      `[PaymentEngine] Starting payment: ${fromAgent} -> ${toAgent} (${amount} WEI) for ${service}`,
    );

    try {
      // 1. Get recipient address (EXECUTION)
      const toAddress = await WalletBridge.getIdentity(toAgent);

      // 2. Execute WDK transaction (USDT) (EXECUTION)
      const paymentData = await WalletBridge.executeSettlement(
        fromAgent,
        toAddress,
        amount,
        service,
      );
      const subTxHash = paymentData.txHash;

      // 3. Update Agent Finance (Internal tracking)
      AgentProfitEngine.recordRevenue(toAgent, amount);
      AgentProfitEngine.recordExpense(fromAgent, amount);

      // 4. Create Payment Record
      const paymentRecord = {
        paymentId: crypto.randomUUID(),
        taskId,
        fromAgent,
        toAgent,
        service,
        amount: amount.toString(),
        currency: "USDT",
        subTxHash,
        network,
        status: "CONFIRMED",
        timestamp: Date.now(),
      };

      // 5. Store in local task history
      if (!this.payments.has(taskId)) {
        this.payments.set(taskId, []);
      }
      this.payments.get(taskId).push(paymentRecord);

      // 6. Record in Global Ledger
      economicLedger.recordEvent({
        type: "AGENT_PAYMENT",
        fromAgent,
        toAgent,
        service,
        amount: amount.toString(),
        subTxHash,
        metadata: { taskId, status: "CONFIRMED" },
      });

      // 7. Emit AGENT_EARNED for provider
      economicLedger.recordEvent({
        type: "AGENT_EARNED",
        fromAgent: "System",
        toAgent: toAgent,
        service,
        amount: amount.toString(),
        metadata: { taskId, source: fromAgent },
      });

      console.log(`[PaymentEngine] Success: ${subTxHash}`);
      return paymentRecord;
    } catch (error) {
      console.error(`[PaymentEngine] Payment Failure: ${error.message}`);

      economicLedger.recordEvent({
        type: "PAYMENT_FAILED",
        fromAgent,
        toAgent,
        service,
        metadata: { taskId, error: error.message },
      });

      throw error;
    }
  }

  /**
   * Get all payments for a specific task.
   */
  getTaskPayments(taskId) {
    return this.payments.get(taskId) || [];
  }

  /**
   * Calculate summary for a task's payments.
   */
  getPaymentSummary(taskId) {
    const payments = this.getTaskPayments(taskId);
    const totalValue = payments.reduce((acc, p) => acc + BigInt(p.amount), 0n);

    return {
      totalPayments: payments.length,
      totalValueTransferred: (Number(totalValue) / 1e6).toFixed(2) + " USDT",
    };
  }
}

export const agentPaymentEngine = new AgentPaymentEngine();
