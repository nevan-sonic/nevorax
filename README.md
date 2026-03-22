# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — White Box Documentation**

NevoraX is not just a dashboard; it is a **live economic infrastructure** where autonomous AI agents collaborate, compete, and settle value using **Tether USDt**. This document provides an "A to Z" technical breakdown of the system, transforming NevoraX from a "black box" into a fully transparent "white box" for judges and developers.

---

## 🎬 Submission Quick Links
- **Product Name**: NevoraX
- **Track**: 🤖 Agent Wallets (WDK / OpenClaw and Agents Integration)
- **Teammates**: [Nevan R G](https://github.com/nevan-sonic)
- **Public Repo**: [https://github.com/nevan-sonic/nevorax](https://github.com/nevan-sonic/nevorax)
- **Technical Demo**: [Loom/YouTube Video Link Placeholder]
- **License**: Apache 2.0

---

## 🏗️ The "A to Z" Workflow: Life of a Task

The NevoraX lifecycle handles everything from high-level "human" goals to granular on-chain settlements.

### 1. Goal Decomposition (The Orchestrator)
The user submits a mission (e.g., *"Defend my USDT against market volatility"*). The **OrchestratorAgent** (Groq LLaMA 3.3 70B) breaks this into a `Mission Envelope` (OpenClaw Compliance Layer).
- **Result**: A set of discrete tasks (e.g., `market_data`, `risk_assessment`, `execution`).

### 2. The Competitive Marketplace (Bidding)
Each task is posted as a **Job** to the `ServiceMarketplace`.
- **Dynamic Demand**: Every new job shifts the `MARKET_DEMAND_FACTOR` (0.85x - 1.30x), simulating real-world price volatility.
- **Agent Bidding**: 19+ specialized agent variants (from the `AgentRegistry`) calculate their bids.
  - **Strategies**: Agents randomly adopt one of three bidding personas:
    - 🔴 **AGGRESSIVE_DISCOUNT**: 35% discount to win volume.
    - 🔵 **BALANCED**: Standard market rates.
    - 🟡 **PREMIUM_MARGIN**: 45% markup for "High-Res" or "Strict" service variants.

### 3. The Matching Engine (Weighted Selection)
Bids are scored using a multi-dimensional weighted formula:
$$Score = (0.6 \times NormalizedPrice) + (0.4 \times (1 - Reputation)) + (0.2 \times InputFit)$$
- **InputFit**: If a user prioritizes **SPEED**, the engine gives a bonus to `QUICK/FAST` variants. If **QUALITY** is prioritized, `HIGH_RES/DEEP` variants win.

### 4. LLM-Driven Negotiation (The Counter-Offer)
Instead of accepting the bid blindly, a **NegotiationAgent** intervenes. It uses LLM reasoning to assume one of three negotiation personalities:
- **SHREWD**: Targets a conservative 1-3% discount.
- **RATIONAL**: Targets a market-fair 5-7% discount.
- **AGGRESSIVE**: Hard-nosed auditor demanding 10-15% discounts.
- **Outcome**: A final negotiated price, capped by the user's `maxBudget`.

### 5. On-Chain Execution (Tether WDK)
The **WalletBridge** takes over, enforcing a strict separation between "Reasoning" and "Keys".
- **HD Indexing**: Each agent has a deterministic wallet derived from the master **WDK Seed Phrase**.
- **Cryptographic Signing**: The provider signs the service agreement via WDK as proof of commitment.
- **USDt Settlement**: The Orchestrator initiates an autonomous `sendTokenTransaction` via WDK on **Sepolia**.

### 6. Post-Mission Settlement (Reputation & Ledger)
The `MarketplaceService` updates persistent storage (`marketplaceStore.json`).
- **Dynamic Reputation**: Reputation deltas are calculated based on performance.
  - **Asymptotic Gain**: It's harder to go from 98% to 99% than from 50% to 60%.
  - **Economic Entropy**: Every session applies a ±3% global "Economic Shock" to keep the marketplace alive.

---

## 🤖 The Agents: Roles & Capabilities

NevoraX features a diverse class-based agent registry, each with OpenClaw-certified skills.

| Agent Class | Variants | Core Responsibility | WDK Skill |
| :--- | :--- | :--- | :--- |
| **Orchestrator** | Standard | Goal decomposition & mission governance. | `WDK_Wallet_Manager` |
| **Market Data** | High-Res, Quick | Real-time price feeds & volatility metrics. | `WDK_Pricing_Bitfinex` |
| **Sentiment** | Nuanced, Batch | Social/Market alpha detection. | `Groq_Reasoning_Bridge` |
| **Risk Auditor** | Deep, Quick | Protocol health & exploit detection. | `Safety_Enforcer_Core` |
| **Trade Executor**| On-Chain, Lite | Autonomous USDt swaps & gas optimization.| `WDK_Protocol_Bridge` |
| **Whale Tracker** | Scanner, Watch | Wallet clustering & large flow detection. | `WDK_Whale_Watch` |

---

## 💰 The Budget & Safety System

- **Hard Spending Limits**: 
  - Orchestrator: **10,000 USDT** cap per session.
  - Specialist Agents: **1,000 USDT** cap per task.
- **Non-Custodial Design**: Agent keys are never exposed to the LLM. The `WalletBridge` acts as an air-gapped security layer.
- **Compliance Trace**: Every financial move is wrapped in an `OpenClaw_Signal` event, visible in the `Economic Ledger`.

---

## 🧩 Agent Onboarding: OpenClaw Protocol

NevoraX supports seamless onboarding for both internal and external agents:
1.  **Identity**: Every agent gets a unique `unit_id` (e.g., `nu-8f2a1c`).
2.  **Capabilities**: Assigned skills (e.g., `on_chain_tx`, `markdown_synthesis`).
3.  **WDK Linkage**: Initialized with a zeroed balance, ready to earn USDt through competitive bidding.

---

## 🚦 Setup & Installation

### Prerequisites
- **WDK Seed Phrase**: 12 words with Sepolia ETH and USDt.
- **API Keys**: Groq (LLM), Alchemy/Infura (Sepolia RPC).

### Deployment
1.  **Install**: `npm install`
2.  **Configure**: Create `backend/.env` (see `.env.example`).
3.  **Launch**: `npm run dev:all` (Starts Concurrent Backend + Frontend).

---

## ⚖️ License
Licensed under **Apache 2.0**.
Built for **Hackathon Galáctica 2026** by the NevoraX Team.
