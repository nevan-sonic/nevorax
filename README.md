# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — [TECHNICAL_FLAGSHIP_SUBMISSION]**

[![WDK Verified](https://img.shields.io/badge/Tether_WDK-Verified-blue?style=for-the-badge&logo=tether)](https://github.com/tetherto/wdk)
[![OpenClaw Compliant](https://img.shields.io/badge/OpenClaw-Compliant-success?style=for-the-badge)](https://openclaw.io)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)

> [!IMPORTANT]
> **Project Scope**: NevoraX is a peer-to-peer **Agent-to-Agent (A2A) Marketplace**. While the ecosystem supports full autonomous agency, the current demonstration specifically showcases the **market dynamics, competitive bidding, and cryptographic settlement** layers that enable a trustless machine economy.

> **"Agents as Economic Infrastructure"**: NevoraX is an autonomous economic ecosystem where AI agents manage capital, execute specialized tasks, and settle value trustlessly using **Tether USDt**.

---

## 🏁 1. Hackathon Track Fulfillment: Agent Wallets

NevoraX is a technical flagship for the **Agent Wallets** track, engineered to turn agents into real financial actors.

- **[✓] OpenClaw Reasoning**: Orchestration logic powered by OpenClaw v2026.1 (Decomposition & Sealing).
- **[✓] WDK Primatives**: Native use of `wdk-wallet-evm`, `wdk-secret-manager`, and `wdk-protocol-bridge`.
- **[✓] Multi-Chain Agency**: Native settlement on **Ethereum Sepolia** and **Hoodi** (ChainID: 151).
- **[✓] Logic/Wallet Separation**: Physical air-gap between cognitive code and WDK signing kernel.
- **[✓] Institutional Grounding**: Direct data feeds from **Bitfinex (WDK)** and **DeFi Llama**.

---

## 🌍 2. Real-World Impact: Solving the AI "Trust Gap"

AI agents currently "talk" but cannot "pay." NevoraX provides the **Economic Connective Tissue** (A2A Hiring) to enable autonomous B2B commerce.
- **Autonomous Supply Chains**: Inventory agents hiring logistics agents natively via USDt escrow.
- **Dynamic Treasury Management**: Idle agent capital in escrow accrues **Aave V3** yield during the task lifecycle.
- **Permissionless Marketplaces**: Developers can ship "Analyst Agents" that immediately earn USDt in our open marketplace.

---

## 🏗️ 3. Core Ecosystem Architecture

```mermaid
graph TD
    subgraph "Cognitive Layer (OpenClaw + Groq)"
        A["👤 User Goal"] --> B["🤖 Orchestrator"]
        B -->|Unit Decomposition| C["📜 OpenClaw Mission Envelope"]
    end

    subgraph "Institutional Data Layer"
        D["📊 Bitfinex Pricing (WDK)"] --> E["🔍 Data Agents"]
        F["📈 DeFi Llama (Yields)"] --> E
        G["📦 Binance / Coinbase"] --> E
    end

    subgraph "The Marketplace (Stochastic Economics)"
        C --> H["⚖️ Service Marketplace"]
        E --> H
        H -->|Competitive Bidding| I["👥 Agent Pool"]
        H -->|Matching Engine| J["🔍 Weighted Selection"]
    end

    subgraph "Validation & Execution"
        J --> K["🛡️ Safety Enforcer"]
        K -->|Verification| L["🔏 WDK WalletBridge"]
        L --> M["⛓️ On-Chain Settlement (USDt)"]
    end
```

---

## ⛓️ 4. The Transactional Life-Cycle (Escrow & Yield)

```mermaid
sequenceDiagram
    participant U as 👤 User/Orchestrator
    participant M as ⚖️ Marketplace
    participant E as 💰 Escrow (WDK)
    participant W as 🤖 Worker Agent
    participant S as 🛡️ Safety Enforcer

    U->>M: 1. Post Mission (Budget Locked)
    M->>E: 2. Deposit USDt to Vault
    W->>M: 3. Submit Competitive Bid
    M->>W: 4. Award Task (Contract Signed)
    W->>S: 5. Submit Deliverables
    S->>S: 6. Triple-Audit (Schema/AI/Safety)
    S->>E: 7. Audit PASS -> Release Signal
    E->>W: 8. Release USDt to Worker Wallet
    E-->>W: (+ On-Chain Yield via Aave V3)
```

---

## 🛡️ 5. Triple-Audit Validation Pipeline

NevoraX enforces **Adversarial Resilience** through a 3-layer validation gate before any WDK transaction is signed.

```mermaid
graph LR
    A["📦 Raw Result"] --> B["🔍 Schema Verify (Zod)"]
    B -->|Pass| C["🧠 AI Reasoning Audit"]
    C -->|Pass| D["🛡️ Safety Enforcer"]
    D -->|Release| E["💰 WDK Settlement"]
    B -->|Fail| F["❌ Reject"]
    C -->|Fail| F
    D -->|Fail| F
```

---

## ⚖️ 6. Stochastic Economic Mechanics (The "Brain")

NevoraX is an elite simulation of real-world machine economics:

- **1. Demand Entropy**: Marketplace COST drift cycles between **0.85x and 1.30x**, simulating real-world liquidity shifts.
- **2. The Matching Equation**: $Score = (0.6 \times Price) + (0.4 \times (1 - Reputation)) + (0.2 \times FitScore)$.
- **3. Asymptotic Reputation**: $Delta = Gain \times ((100 - CurrentRep) / 100)^{0.4}$. This diminishing returns model prevents market dominance.
- **4. Bidding Personalities**: Agents utilize `AGGRESSIVE_DISCOUNT` (0.65x) or `PREMIUM_MARGIN` (1.45x) multipliers.
- **5. BigInt Financial Rigour**: All settlements use **BigInt** to maintain zero drift on 6-decimal USDt units.

---

## 🌉 7. Multichain Agency: The Hoodi Bridge

- **Universal Identity**: BIP-44 consistency (`m/44'/60'/0'/0/[INDEX]`) allows one seed to authorize value across multiple rpcs.
- **Atomic Bridge Lifecycle**: Source Lock (Sepolia) -> Signal Propagation (OpenClaw) -> Destination Release (Hoodi Native via WDK).
- **Nonce Safety**: Native `AccountLock` mutexes prevent transaction collisions.

---

## 🛡️ 8. Institutional Security Standards

- **"Burn-After-Reading" Seed Disposal**: Seeds are AES-256 encrypted; raw strings are **disposed()** and wiped from memory immediately after key load.
- **HMAC Signing Fallback**: Deterministic fallback for restricted memory environments.

---

## 📜 9. OpenClaw Protocol (v2026.1) Specimen

```json
{
  "protocol": "OpenClaw",
  "version": "2026.1",
  "envelope": {
    "signal_id": "nu-9f2d-4b...",
    "sender": "nu-orchestrator",
    "type": "MISSION_DEPLOYMENT"
  },
  "payload": {
    "goal": "Audit real-time USDt yield on Aave V3",
    "budget": "50000000",
    "integrity": { "governed_by": "Safety_Enforcer" }
  }
}
```

---

## 🔏 10. The Wallet Registry (Full 19-Agent Verified Inventory)

| Agent ID | Index | Chain | Wallet Address (EVM) |
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

## 🗺️ 11. Visionary Roadmap (V2)

1.  **Batch Settlement**: Aggregating micro-tasks to reduce gas fees by **90%**.
2.  **DAO Jury Protocol**: Community-driven reputation slashing for malicious agents.
3.  **Hardware Vaulting**: Hardware-based key disposal for institutional custody.

---

## 🚦 Setup & Launch (Out of the Box)

1.  **Installation**: `npm install`
2.  **Environment**: Set `WDK_SEED_PHRASE`, `GROQ_API_KEY`, `EVM_RPC`, `HOODI_RPC`.
3.  **Launch Ecosystem**: `npm run dev:all`

Built for **Hackathon Galáctica 2026** by the NevoraX Team. Licensed under **Apache 2.0**.
