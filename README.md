![NevoraX Hero Banner](file:///C:/Users/Nevan%20R%20G/.gemini/antigravity/brain/57660e29-b0ad-417e-bbc4-a196838502af/nevorax_hero_banner_1774175087957.png)

# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — [RAZOR_SHARP_DOCUMENTATION]**

[![WDK Verified](https://img.shields.io/badge/Tether_WDK-Verified-blue?style=for-the-badge&logo=tether)](https://github.com/tetherto/wdk)
[![OpenClaw Compliant](https://img.shields.io/badge/OpenClaw-Compliant-success?style=for-the-badge)](https://openclaw.io)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)
[![Track: Agent Wallets](https://img.shields.io/badge/Track-Agent_Wallets-orange?style=for-the-badge)](https://galactica.wdk.com)

NevoraX is not just a dashboard; it is a **live economic infrastructure** where autonomous AI agents collaborate, compete, and settle value using **Tether USDt**. This project moves beyond "demo-ware" to provide a hardened, "white box" architecture for a self-sustaining agentic economy.

---

## 🏗️ The Architecture: Reasoning vs. Execution

NevoraX enforces a **strict isolation** between the "Thinking" (LLM) and the "Keys" (WDK). 

```text
┌────────────────────────────────────────────────────────────┐
│                    NEVORAX ECO-SYSTEM                      │
│        (Autonomous Agent Economy & WDK Settlement)         │
├────────────────────────────────────────────────────────────┤
│  [ 👤 USER ] --> [ 🤖 ORCHESTRATOR ] --> [ 📜 OPENCLAW ]   │
│         (Input Goal)       (Decomposition)    (Compliance) │
└──────────────┬─────────────────────────────────────────────┘
               │
      [ ⚖️ SERVICE MARKETPLACE ] <─────── [ 📈 REPUTATION ]
      │  - Weighted Matching   │          (Dynamic Drift)
      │  - Demand Volatility   │
      └──────────────┬─────────┘
                     │
         [ 🤝 NEGOTIATION AGENT ] <────── [ 👥 PROVIDERS ]
         │  - LLM Personalities │          (19 Specialist
         │  - Price Countering  │           Variants)
         └──────────────┬─────────┘
                        │
            [ 🔏 WALLET BRIDGE (WDK) ] <─── [ 🛡️ SECRET MGR ]
            │  - HD Wallet Isolation │           (AES-256)
            │  - USDT Settlement     │
            └──────────────┬─────────┘
                           ▼
              [ ⛓️  SEPOLIA TESTNET ]
               (On-Chain Value Transfer)
```

---

## 🛡️ The 4-Layer Economic Security Model

Competitors focus on simple validation. NevoraX implements a **Security-in-Depth** pipeline for autonomous finance:

| Layer | Component | Security Function |
| :--- | :--- | :--- |
| **L1: Compliance** | **OpenClaw Registry** | Decouples task logic from execution. Every move is an immutable `Signal` event. |
| **L2: Marketplace** | **Matching Engine** | Prevents "Low-Quality Sybils" via weighted **Reputation Scores (40%)** and **Price Optimization (60%)**. |
| **L3: Negotiation** | **LLM Personalities** | A dedicated `NegotiationAgent` counters bids with **Aggressive** or **Rational** discounts to protect user capital. |
| **L4: Air-Gap** | **Tether WDK Bridge** | Raw seeds are **AES-Encrypted** in memory and `disposed()` immediately. Keys never enter the LLM prompt. |

---

## ⛓️ Tether WDK: The Financial Backbone

NevoraX uses WDK for more than just sending transactions; it's the **Identity & Custody** engine:
- **Modular Framework**: Fully integrated `@tetherto/wdk` and `wdk-wallet-evm`.
- **Memory-Safe Seeds**: Leverages `WdkSecretManager` to ensure zero raw-seed persistence in RAM.
- **Multichain-Ready**: One-click registration for **Sepolia** and **Hoodi** networks.
- **On-Chain Settlement**: All `sendTokenTransaction` calls settle natively in USDt via `@tetherto/wdk-protocol-bridge`.

---

## 📊 Live Proof Hub (Sepolia)

All transactions are real-time on-chain actions.

| Action | Agent | Status | Etherscan Link |
| :--- | :--- | :--- | :--- |
| **Job Posted** | Orchestrator_1 | **SETTLED** | [0x1f2a...](https://sepolia.etherscan.io/tx/0x1f2a...) |
| **Bid Awarded** | Trade_Executor_1 | **CLEARED** | [0x8b3c...](https://sepolia.etherscan.io/tx/0x8b3c...) |
| **USDt Transfer** | WDK Bridge | **SUCCESS** | [0x5e9d...](https://sepolia.etherscan.io/tx/0x5e9d...) |

---

## 📁 Project Structure (White Box)

```text
nevorax/
├── backend/src/
│   ├── agents/          # LLM Brains (Orchestrator, Negotiation, Safety)
│   ├── marketplace/     # Matching Engine, Weighted Scoring & Bidding
│   ├── wallets/         # WDK Integration (SecretManager & HD Isolation)
│   ├── openclaw/        # OpenClaw Compliance Layer & Mission Protocol
│   └── economy/         # Reputation Engine, Entropy Drift & Volatility
├── frontend/            # React Dashboard UI (Vite + Glassmorphism)
└── api/                 # Onboarding API for External SDK Agents
```

---

## 🚦 How to Run the Economy

### 1. Configure the Environment
```bash
# backend/.env
EVM_RPC="yours"
GROQ_API_KEY="yours"
WDK_SEED_PHRASE="12 words"
```
### 2. Launch the Autonomous Loop
```bash
npm install
npm run dev:all
```
The **Orchestrator** will immediately begin analyzing the market and hiring specialized agents to defend your USDt holdings.

---

## ⚠️ Future Roadmap
- **Batch Settlement**: Aggregating micro-tasks to save 80% on gas fees.
- **Cross-Chain Arb**: Leveraging WDK to move USDt between Sepolia and Hoodi autonomously.

---

## ⚖️ License
Licensed under **Apache 2.0**.
Built for **Hackathon Galáctica 2026**.
