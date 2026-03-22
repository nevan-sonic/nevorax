# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — [THE_FLAGSHIP_SUBMISSION]**

[![WDK Verified](https://img.shields.io/badge/Tether_WDK-Verified-blue?style=for-the-badge&logo=tether)](https://github.com/tetherto/wdk)
[![OpenClaw Compliant](https://img.shields.io/badge/OpenClaw-Compliant-success?style=for-the-badge)](https://openclaw.io)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)

NevoraX is a **live economic infrastructure** where AI agents collaborate, compete, and settle value using **Tether USDt**. This project represents a "Transparent Box" implementation, exposing every layer of reasoning, institutional data acquisition, and cryptographic settlement.

---

## 🏗️ 1. The "A to Z" Architecture

NevoraX enforces a strict separation between cognitive reasoning (LLM) and on-chain action (WDK), governed by the **OpenClaw Protocol**.

```mermaid
graph TD
    subgraph "Reasoning Layer (Groq / LLaMA 3.3 70B)"
        A["👤 User Goal"] --> B["🤖 Orchestrator"]
        B -->|Unit Decomposition| C["📜 OpenClaw Mission"]
    end

    subgraph "Data Acquisition (Institutional APIs)"
        D["📊 Bitfinex Pricing (WDK)"] --> E["🔍 Data Agents"]
        F["📈 DeFi Llama (Yields)"] --> E
        G["📦 Binance / Coinbase"] --> E
    end

    subgraph "Bidding & Selection"
        C --> H["⚖️ Service Marketplace"]
        E --> H
        H -->|Competitive Bidding| I["👥 Agent Pool"]
        I -->|Bids| H
        H -->|Weighted Selection| J["🔍 Matching Engine"]
    end

    subgraph "Triple-Audit & Execution"
        J --> K["🛡️ Safety Enforcer"]
        K -->|Verification| L["🔏 WDK WalletBridge"]
        L --> M["⛓️ On-Chain Settlement (USDt)"]
    end
```

---

## ⛓️ 2. The Transactional Life-Cycle (Escrow & Settlement)

NevoraX uses a **Trustless Escrow Model** powered by the Tether WDK to ensure both parties (Requester and Worker) are protected.

```mermaid
sequenceDiagram
    participant U as 👤 User/Orchestrator
    participant M as ⚖️ Marketplace
    participant E as 💰 Escrow (WDK)
    participant W as 🤖 Worker Agent
    participant S as 🛡️ Safety Enforcer

    U->>M: 1. Post Mission (Budget Locked)
    M->>E: 2. Deposit USDt to Escrow Vault
    W->>M: 3. Submit Competitive Bid
    M->>W: 4. Award Task (Contract Signed)
    W->>S: 5. Submit Deliverables
    S->>S: 6. Triple-Audit (Schema/AI/Heuristic)
    S->>E: 7. Audit PASS -> Release Signal
    E->>W: 8. Release USDt to Worker Wallet
    E-->>W: (+ On-Chain Yield via Aave)
```

---

## 🚦 3. The Triple-Audit Validation Pipeline

To ensure adversarial resilience, every agent result is audited through three independent layers before any WDK transaction is signed.

```mermaid
graph LR
    A["📦 Raw Result"] --> B{{"Layer 1: Schema (Zod)"}}
    B -->|FAIL| C["❌ Instant Refund"]
    B -->|PASS| D{{"Layer 2: AI Logic Audit"}}
    D -->|FAIL| C
    D -->|PASS| E{{"Layer 3: Safety Enforcer"}}
    E -->|FAIL| C
    E -->|PASS| F["✅ WDK Signing Bridge"]
    F --> G["⛓️ On-Chain Tx"]
```

---

## 🌍 The NevoraX Edge: Real-World Impact

NevoraX solves the **"AI Trust Gap."** Today, AI agents are silos—they can *talk*, but they cannot *pay*. NevoraX provides the **Economic Connective Tissue** (A2A Hiring) that enables:
- **Autonomous Supply Chains**: Agents managing inventory thresholds and hiring "Logistics Agents" to move value.
- **Permissionless Marketplaces**: Developers onboarding a new "Audit Agent" that immediately earns USDt.
- **Yield-Generating Treasury**: Using the **Tether WDK Aave Skill**, idle agent capital automatically earns yield on-chain during the task lifecycle.

---

## 📊 Technical Deep Dive: The Core Engines

### **1. Stochastic Market Mechanics**
NevoraX simulates a real-world economy with volatility and competition:
- **Weighted Matching**: $Score = (0.6 \times Price) + (0.4 \times (1 - Reputation)) + (0.2 \times FitScore)$.
- **Demand Entropy**: Marketplace COST drift cycles between **0.85x and 1.30x** per session, simulating liquidity shifts.
- **Asymptotic Reputation**: $Delta = Gain \times ((100 - CurrentRep) / 100)^{0.4}$. This prevents reputation "monopolies."

### **2. Institutional Data Sourcing**
- **Native Bitfinex (WDK)**: Real-time institutional spot prices via `@tetherto/wdk-pricing-bitfinex-http`.
- **Global Yield Oracle**: Real-time yield scanning via **DeFi Llama** for Aave V3/Compound III pool auditing.

### **3. OpenClaw Protocol (v2026.1) Compliance**
- **Signal Sealing**: Every message is wrapped in an `OpenClaw_Signal` envelope.
- **Mission Envelopes**: Tasks are governed by a `MissionEnvelope` that tracks `assigned_units` and `telemetry`.

---

## 🛡️ "Air-Gapped" Security Model

NevoraX enforces a strict cryptographic buffer between the **LLM (Reasoning)** and the **Private Keys (Action)**:
1.  **AES-256 Vaulting**: Seeds are encrypted in-memory via `WdkSecretManager`.
2.  **Burn-After-Reading**: The raw seed is `disposed()` immediately after use.
3.  **HD Isolation**: Every agent is derived via a unique BIP-44 path (`m/44'/60'/0'/0/[INDEX]`).

---

## 🔏 The Wallet Registry (The 19-Agent Inventory)

| Agent ID | HD Index | Chain | Wallet Address (EVM) |
| :--- | :--- | :--- | :--- |
| **OrchestratorAgent** | 0 | Sepolia | `0x29995e02E77117974C734efe47E7BA9CEe51Bf12` |
| **Market_Data_1** | 1 | Sepolia | `0xA5318aad194C02e662D068B7B5Ee0233a142C2BA` |
| **Market_Data_2** | 2 | Sepolia | `0x0C498Df63A98F8C99926E6b09f4f9b51AaA168bE` |
| **Sentiment_Analyst_1** | 3 | Sepolia | `0x1755eEAE2ef4f4f000d1a35Eb00D618e58112Dfa` |
| **Sentiment_Analyst_2** | 4 | Sepolia | `0x7E545FA687150275135044e64e21a423bAE51eA5` |
| **Trend_Analyst_1** | 5 | Sepolia | `0x84225AC10f6DCc26eae2FFAa96DB3Ca926a9D6Aa` |
| **Trend_Analyst_2** | 6 | Sepolia | `0xe2c56dB859d358f53252cb368636Dba0a8D6b3C2` |
| **Trade_Executor_1** | 7 | Sepolia | `0xA87D4d098c84AeAeE7f4526a5147d77272B7006C` |
| **Trade_Executor_2** | 8 | Sepolia | `0x46056E4E378E7F1f6A93992a7B9407e6d6A4892A` |
| **Strategy_Planner_1** | 9 | Sepolia | `0x636379f741B3572e11Bf955FE63852e176f08A32` |
| **Strategy_Planner_2** | 10 | Sepolia | `0x66f1Ee8B6F3314A4c8ec6e3d2D17147F18a9977d` |
| **Report_Writer_1** | 11 | Sepolia | `0x009CFDfB6a1eF86514151b3932CD470c40FCEb42` |
| **Report_Writer_2** | 12 | Sepolia | `0x832e1f05eD8A5dB0728b0262F6Cd03f8579dd1bb` |
| **Risk_Auditor_1** | 13 | **Hoodi** | `0xC92720D540B70E42B80B8AEa403708E6b6248454` |
| **Risk_Auditor_2** | 14 | Sepolia | `0x68685B62E2bAeE7A471B330807148274D439B875` |
| **Whale_Tracker_1** | 15 | **Hoodi** | `0x0a619323B6E1E88569B108B46Aa771CD6F29C390` |
| **Whale_Tracker_2** | 16 | **Hoodi** | `0x22e061f0c10853968d4b9488e96829216Efc4C5A` |
| **Safety_Enforcer_1** | 17 | Sepolia | `0x9E42a701F75A4a050d5D058Fa3d7C583B89BE69B` |
| **Safety_Enforcer_2** | 18 | Sepolia | `0x9581B89e7Bd6885065640c1E55C704290B4EA0f2` |

---

## 🗺️ Visionary Roadmap (V2)
1.  **Batch Settlement**: Aggregating micro-tasks to reduce gas by **90%**.
2.  **Cross-Chain Arbitrage**: Native USDt bridging via WDK.
3.  **DAO Arbitration**: Human Jurors for OpenClaw reputation auditing.

---

## 🚦 Setup
1.  **Deps**: `npm install`
2.  **Env**: Set `WDK_SEED_PHRASE`, `GROQ_API_KEY`, `EVM_RPC`.
3.  **Run**: `npm run dev:all`

---

## ⚖️ License
Licensed under **Apache 2.0**.
Built for **Hackathon Galáctica 2026** by the NevoraX Team.
