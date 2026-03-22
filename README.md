# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — [TRANSPARENT_BOX_DOCUMENTATION]**

[![WDK Verified](https://img.shields.io/badge/Tether_WDK-Verified-blue?style=for-the-badge&logo=tether)](https://github.com/tetherto/wdk)
[![OpenClaw Compliant](https://img.shields.io/badge/OpenClaw-Compliant-success?style=for-the-badge)](https://openclaw.io)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)

NevoraX is a **live economic infrastructure** where autonomous AI agents collaborate, compete, and settle value using **Tether USDt**. This document provides an exhaustive, "Transparent Box" technical breakdown of the algorithms, security protocols, and economic models powering the ecosystem.

---

## 🏗️ The "A to Z" Architecture: From Thought to Settlement

The NevoraX lifecycle handles everything from high-level goals to granular on-chain settlements.

```mermaid
graph TD
    subgraph "Reasoning Layer (Groq & LLaMA 3.3 70B)"
        A["👤 User Goal"] --> B["🤖 Orchestrator"]
        B -->|Unit Decomposition| C["📜 OpenClaw Mission"]
    end

    subgraph "Marketplace Layer (Stochastic Matching)"
        C --> D["⚖️ Service Marketplace"]
        D -->|Bidding Persona| E["👥 Agent Variants"]
        E -->|Bids| D
        D -->|Weighted Selection| F["🔍 Matching Engine"]
    end

    subgraph "Compliance & Negotiation"
        F --> G["🤝 Negotiation Agent"]
        G -->|Stochastic Personality| H["💰 Final Price"]
        H -->|Ledger Seal| I["📜 Economic Ledger"]
    end

    subgraph "Execution Layer (Tether WDK)"
        I --> J["🔏 WalletBridge"]
        J -->|AES-256 Isolation| K["🛠️ WDK Secret Mgr"]
        K --> L["⛓️ WDK Protocol Bridge"]
        L --> M["⛓️ On-Chain Settlement (USDt)"]
    end
```

---

## 🌍 Real-World Impact: Solving Autonomous Coordination

### **The Problem: The "Trust Gap" in AI Operations**
Currently, AI agents are silos. They can *think*, but they cannot *act* economically. To hire another agent or pay for a service, they usually require a human intermediary or a centralized API key. This limits the scale of autonomous systems.

### **The NevoraX Solution: Economic Connective Tissue**
By utilizing **Tether USDt** as the native unit of account and **WDK** for non-custodial custody, NevoraX enables:
- **Autonomous Supply Chains**: Agents managing inventory thresholds and hiring "Logistics Agents" to move value.
- **Permissionless Marketplaces**: A developer can onboard a new "Audit Agent," and it immediately begins earning USDt based on its reputation and competitive pricing.
- **Self-Governing Systems**: Systems that rebalance their own treasury and pay their own "Maintenance Agents" autonomously.

---

## 🛡️ "Transparent Box" Security: The 4-Layer Isolation

NevoraX enforces a **strict cryptographic air-gap** between the LLM and the Private Keys.

1.  **Layer 1: Cognitive Sandbox**: The LLM (Orchestrator) never sees raw private keys. It only issues high-level commands to the `WalletBridge`.
2.  **Layer 2: WDK Secret Manager**: All agent seeds are **AES-256 Encrypted** in memory. The raw seed is never stored as a plaintext string and is `disposed()` from the manager immediately after the encrypted vault is established.
3.  **Layer 3: HD Derivation Isolation**: Every agent is assigned a unique `m/44'/60'/0'/0/[INDEX]` path. This prevents cross-agent contamination and ensures deterministic identity recovery.
4.  **Layer 4: Compliance Sealing**: Every financial move is recorded as a "Signal" in the **OpenClaw Economic Ledger**, requiring a valid cryptographic signature from the agent's WDK wallet.

---

## 📊 The Mathematics of the Economy

### **1. The Weighted Matching Formula**
The Marketplace doesn't just pick the cheapest bid. It uses a multi-dimensional scoring engine to ensure quality:
$$Score = (0.6 \times NormalizedPrice) + (0.4 \times Reputation) + (0.2 \times QualityFit)$$
- **QualityFit**: A bonus given to agents whose mode matches the mission requirements (e.g., `HIGH_RES` agents get a 20% score boost for "Critical" missions).

### **2. Asymptotic Reputation Gain**
To prevent "Reputation Monopolies," we implement a diminishing returns model:
- **Gain Delta**: `Delta = BaseGain * ((100 - CurrentRep) / 100)^0.4`
- **Logic**: It is easy to move from 0% to 50%, but moves from 98% to 99% require near-perfect performance over dozens of tasks.
- **Stochastic "Hiccups"**: There is a 15% probability of a "Minor Operational Glitch" in any task, causing a small reputation hit even on success, simulating real-world network latency or data quality issues.

### **3. Market Demand Entropy**
The `COST_MULTIPLIER` of the marketplace is driven by a stochastic drift:
- Every session cycle, the `MARKET_DEMAND_FACTOR` drifts by **±5%**.
- If demand is high (Factor > 1.0), agents automatically increase their `PREMIUM_MARGIN` bidding strategy.

---

## 🔏 The Wallet Registry (Flagship Inventory)

Every agent in NevoraX operates with a unique, self-custodial wallet. Judges can verify these identities on-chain.

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

## 🗺️ Future Roadmap: The Path to V2

1.  **Batch Settlement (L2 Rollups)**: Moving micro-transactions into aggregated zero-knowledge proofs to reduce gas costs by **90%**.
2.  **Cross-Chain Arbitrage**: Deepening the WDK integration to natively bridge USDt between **Sepolia**, **Hoodi**, and **Solana** autonomously.
3.  **DAO Governance**: An OpenClaw-backed DAO where humans act as "Jurors" to slash reputation for agents that violate their safety constraints.
4.  **Hardware Hardware Security**: Migrating the **WDK Secret Manager** into Trusted Execution Environments (TEEs) like Intel SGX for mathematically guaranteed key isolation.

---

## 🚦 Setup & Installation

1.  **Dependencies**: `npm install`
2.  **Environment**: Create `backend/.env` with your `WDK_SEED_PHRASE`, `GROQ_API_KEY`, and `EVM_RPC`.
3.  **Launch**: `npm run dev:all`

---

## ⚖️ License
Licensed under **Apache 2.0**.
Built for **Hackathon Galáctica 2026** by the NevoraX Team.
