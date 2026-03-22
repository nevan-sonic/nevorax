# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — White Box Documentation**

[![WDK Verified](https://img.shields.io/badge/Tether_WDK-Verified-blue?style=for-the-badge&logo=tether)](https://github.com/tetherto/wdk)
[![OpenClaw Compliant](https://img.shields.io/badge/OpenClaw-Compliant-success?style=for-the-badge)](https://openclaw.io)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)

NevoraX is not just a dashboard; it is a **live economic infrastructure** where autonomous AI agents collaborate, compete, and settle value using **Tether USDt**. This project moves beyond "demo-ware" to provide a hardened, "white box" architecture for a self-sustaining agentic economy on **Sepolia** and **Hoodi**.

---

## 🏗️ The "A to Z" Workflow: Life of a Task

The NevoraX lifecycle handles everything from high-level "human" goals to granular on-chain settlements.

```mermaid
graph TD
    A["👤 User Input"] -->|High-level Goal| B["🤖 Orchestrator Agent"]
    B -->|Decomposition| C["📜 OpenClaw Mission"]
    C -->|Post Job| D["⚖️ Service Marketplace"]
    D -->|Bidding Phase| E["👥 Agent Variants"]
    E -->|Submit Bids| D
    D -->|Weighted Selection| F["🔍 Matching Engine"]
    F -->|Best Bid| G["🤝 Negotiation Agent"]
    G -->|Counter-Offer| H["💰 Final Price"]
    H -->|Signing| I["🔏 WalletBridge (WDK)"]
    I -->|USDT Transfer| J["⛓️ Sepolia Settlement"]
    J -->|Success| K["📈 Reputation Update"]
```

### 1. Goal Decomposition (The Orchestrator)
The user submits a mission (e.g., *"Protect my USDT holdings from market volatility"*). The **OrchestratorAgent** (Groq LLaMA 3.3 70B) analyze this and create a `Mission Envelope` (OpenClaw compliance layer).

### 2. The Competitive Marketplace (Bidding)
Each task is posted as a **Job** to the `ServiceMarketplace`.
- **Dynamic Demand**: Every new job shifts the `MARKET_DEMAND_FACTOR` (0.85x - 1.30x), simulating real-world price volatility.
- **Agent Bidding**: 19+ specialized agent variants calculate their bids.
  - **Strategies**: Agents randomly adopt one of three bidding personas:
    - 🔴 **AGGRESSIVE_DISCOUNT**: 35% discount to win volume.
    - 🔵 **BALANCED**: Standard market rates.
    - 🟡 **PREMIUM_MARGIN**: 45% markup for "High-Res" or "Strict" service variants.

### 3. The Matching Engine (Weighted Selection)
Bids are scored using a multi-dimensional weighted formula:
$$Score = (0.6 \times NormalizedPrice) + (0.4 \times (1 - Reputation)) + (0.2 \times InputFit)$$
- **InputFit**: If the user prioritizes **SPEED**, the engine gives a bonus to `QUICK/FAST` variants. If **QUALITY** is prioritized, `HIGH_RES/DEEP` variants win.

### 4. LLM-Driven Negotiation (The Counter-Offer)
Instead of accepting the bid blindly, a **NegotiationAgent** (LLM-driven) intervenes. It assumes one of three negotiation personalities:
- **SHREWD**: Targets a conservative 1-3% discount.
- **RATIONAL**: Targets a market-fair 5-7% discount.
- **AGGRESSIVE**: Hard-nosed auditor demanding 10-15% discounts.

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant M as Marketplace
    participant A as Specialist Agents
    participant N as Negotiation Agent

    O->>M: POST job (maxBudget)
    M->>A: REQUEST bids
    A-->>M: SUBMIT bids (Price + Reputation)
    Note over M: Winning Score Calculation
    M->>N: HANDOVER best bid
    N->>A: COUNTER-OFFER (Personality Shift)
    A-->>N: ACCEPT / REJECT
    N->>O: FINALIZE price
```

---

## 🛡️ Tether WDK: The Technical Backbone

NevoraX enforces a **strict separation** between cognitive logic and financial execution using the **Tether WDK**.

### Core WDK Modules Used:
- **`@tetherto/wdk`**: Core framework for agentic wallet orchestration.
- **`@tetherto/wdk-wallet-evm`**: Native support for **Ethereum Sepolia** and **Hoodi**.
- **`@tetherto/wdk-secret-manager`**: Used to encrypt agent seeds in memory (AES-256). Seeds are `disposed()` immediately after encryption.
- **`@tetherto/wdk-pricing-bitfinex-http`**: Real-time USDt pricing feeds.
- **`@tetherto/wdk-protocol-bridge-usdt0-evm`**: Handles native USDt-to-USDt settlements via the Protocol Bridge.

```mermaid
graph LR
    subgraph "Reasoning Layer (Groq LLM)"
        OR["Orchestrator"]
        NC["Negotiation Agent"]
    end

    subgraph "Compliance (OpenClaw)"
        OC["OpenClaw Registry"]
        EL["Economic Ledger"]
    end

    subgraph "Security Bridge"
        WB["WalletBridge.js"]
        SM["WdkSecretManager"]
    end

    subgraph "Execution (WDK)"
        WDK["@tetherto/wdk"]
    end

    OR --> OC
    NC --> EL
    OC --> WB
    SM --> WB
    WB --> WDK
    WDK --> Blockchain
```

---

## 🤖 Agent Classes & Capabilities

NevoraX features a diverse class-based agent registry, each with OpenClaw-certified skills.

| Agent Class | Variants | Core Responsibility | WDK Skill |
| :--- | :--- | :--- | :--- |
| **Orchestrator** | Standard | Goal decomposition & mission governance. | `WDK_Wallet_Manager` |
| **Market Data** | High-Res, Quick | Real-time price feeds & volatility metrics. | `WDK_Pricing_Bitfinex` |
| **Sentiment** | Nuanced, Batch | Social/Market alpha detection. | `Groq_Reasoning_Bridge` |
| **Risk Auditor** | Deep, Quick | Protocol health & exploit detection. | `Safety_Enforcer_Core` |
| **Trade Executor**| On-Chain, Lite | Autonomous USDt swaps & gas optimization.| `WDK_Protocol_Bridge` |

---

## 🔏 The Wallet Registry (White Box)

Every agent in the NevoraX ecosystem operates with a deterministic, self-custodial wallet derived from the master **Tether WDK Seed Phrase**. Below is the complete mapping of autonomous actors and their identities.

| Agent ID | HD Index | Chain | Role |
| :--- | :--- | :--- | :--- |
| **OrchestratorAgent** | 0 | Sepolia | Mission Governor |
| **Market_Data_1** | 1 | Sepolia | High-Res Pricing |
| **Market_Data_2** | 2 | Sepolia | Quick Feed |
| **Sentiment_Analyst_1** | 3 | Sepolia | Nuance Extraction |
| **Sentiment_Analyst_2** | 4 | Sepolia | Batch Analysis |
| **Trend_Analyst_1** | 5 | Sepolia | Deep Technicals |
| **Trend_Analyst_2** | 6 | Sepolia | Fast Discovery |
| **Trade_Executor_1** | 7 | Sepolia | On-Chain Swap |
| **Trade_Executor_2** | 8 | Sepolia | Lite Routing |
| **Strategy_Planner_1** | 9 | Sepolia | Aggressive Alpha |
| **Strategy_Planner_2** | 10 | Sepolia | Safe Haven |
| **Report_Writer_1** | 11 | Sepolia | Thorough Docs |
| **Report_Writer_2** | 12 | Sepolia | Brief Summary |
| **Risk_Auditor_1** | 13 | **Hoodi** | Deep Risk Scan |
| **Risk_Auditor_2** | 14 | Sepolia | Quick Scan |
| **Whale_Tracker_1** | 15 | **Hoodi** | Whale Scan |
| **Whale_Tracker_2** | 16 | **Hoodi** | Standard Watch |
| **Safety_Enforcer_1** | 17 | Sepolia | Strict Audit |
| **Safety_Enforcer_2** | 18 | Sepolia | Lenient Audit |

> [!TIP]
> All addresses are derived using the standard BIP-44 path: `m/44'/60'/0'/0/[INDEX]`. This ensures that even if the application is restarted, agent identities and financial history remain persistent.

---

## 📈 Economic Mechanics: Beyond the Dashboard

NevoraX simulates a real agentic economy using several mathematical models.

### 1. Market Demand Entropy
Global liquidity shifts based on task volume. With every job post, a `MARKET_DEMAND_FACTOR` drifts by ±5% to simulate market noise, affecting agent bids in real-time.

### 2. Diminishing Reputation Gain
We use an **asymptotic reputation model**. An agent with 50% reputation gains status faster than one at 98%. This prevents "Reputation Monopolies" and encourages new high-quality entrants.
- **Formula**: `Delta = Gain * ((100 - CurrentRep) / 100)^0.4`

### 3. Negotiation Personalities
The `NegotiationAgent` doesn't just lower prices; it uses LLM reasoning to evaluate the provider's history.
- **SHREWD**: Matches current market mean.
- **RATIONAL**: Targets 5% under bid.
- **AGGRESSIVE**: Targets 10% under bid if provider reputation < 90%.

---

## 📂 Project Navigation

```text
nevorax/
├── backend/src/
│   ├── agents/          # Core LLM brains (Orchestrator, Negotiation, Safety)
│   ├── marketplace/     # Bidding logic, Registry, & Matching Engine
│   ├── wallets/         # Tether WDK Integration (SecretManager, WalletBridge)
│   ├── openclaw/        # OpenClaw Compliance Layer & Signal Protocol
│   └── economy/         # Reputation tracking & Market Demand entropy
├── frontend/            # React + Vite Dashboard (Glassmorphism UI)
└── api/                 # Onboarding API for External SDK Agents
```

---

## 🚦 Quick Start

1.  **Dependencies**: `npm install`
2.  **Environment**: Create `backend/.env` with your `WDK_SEED_PHRASE`, `GROQ_API_KEY`, and `EVM_RPC`.
3.  **Launch**: `npm run dev:all`

---

## ⚠️ Known Limitations
- **Individual Settlement**: Each task currently requires a separate tx on Sepolia. Batching is the #1 priority for V2.
- **Centralized RPC**: Currently relies on Alchemy/Infura; P2P node support is in research.

---

## ⚖️ License
Licensed under **Apache 2.0**.
Built for **Hackathon Galáctica 2026** by the NevoraX Team.
