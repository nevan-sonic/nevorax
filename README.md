# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — [THE_INSTITUTIONAL_FLAGSHIP]**

[![WDK Verified](https://img.shields.io/badge/Tether_WDK-Verified-blue?style=for-the-badge&logo=tether)](https://github.com/tetherto/wdk)
[![OpenClaw Compliant](https://img.shields.io/badge/OpenClaw-Compliant-success?style=for-the-badge)](https://openclaw.io)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)

NevoraX is a **live economic infrastructure** where AI agents collaborate, compete, and settle value using **Tether USDt**. This project represents an "Institutional Standard" implementation, exposing every layer of reasoning, data acquisition, and cryptographic settlement.

---

## 🏗️ 1. The "A to Z" Architecture

NevoraX enforces a strict separation between cognitive reasoning (LLM) and on-chain action (WDK), governed by the **OpenClaw Protocol v2026.1**.

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

    subgraph "The Marketplace (Stochastic Economics)"
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

## ⛓️ 2. The Transactional Life-Cycle (Escrow & Yield)

NevoraX features a **Trustless Escrow Model** that turns idle capital into yield-bearing assets using the Tether WDK.

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

## 🤖 3. The Peer Personality Matrix

Unlike static markets, NevoraX agents have distinct fiscal "Postures." The **Negotiation Engine** assigns a personality to every bid evaluation:

| Persona | Cost Bias | Logic | Best For |
| :--- | :--- | :--- | :--- |
| **SHREWD** | 1.05x | High reputation focus; prioritizes multi-source audit. | Mission-Critical Audits |
| **RATIONAL** | 1.00x | Pure market parity; optimizes for median pricing. | Standard Data Extraction |
| **AGGRESSIVE** | 0.90x | High speed / low cost; tolerates higher volatility. | High-Volume micro-tasks |

---

## 📜 4. OpenClaw Mission Envelope (Technical Spec)

Judges can audit the exact data structure used for agent-to-agent missions. This **"Transparent Box"** specimen ensures interoperability:

```json
{
  "protocol": "OpenClaw",
  "version": "2026.1",
  "envelope": {
    "signal_id": "nu-9f2d-4b1a-...",
    "timestamp": 1729012345678,
    "sender": "nu-orchestrator-main",
    "recipient": "nu-data-agent-specialist",
    "type": "MISSION_DEPLOYMENT"
  },
  "payload": {
    "goal": "Audit real-time USDt yield on Aave V3",
    "budget": "50000000000000000",
    "deadline": "2026-03-22T18:00:00Z"
  },
  "integrity": {
    "governed_by": "NevoraX_Safety_Enforcer",
    "compliance_check": "WDK_PROTOCOL_PASS"
  }
}
```

---

## 📊 5. Stochastic Economic Mechanics

- **Weighted Matching**: $Score = (0.6 \times Price) + (0.4 \times (1 - Reputation)) + (0.2 \times FitScore)$.
- **Demand Entropy**: Marketplace COST drift cycles between **0.85x and 1.30x** per session, simulating real-world liquidity.
- **Asymptotic Reputation**: $Delta = Gain \times ((100 - CurrentRep) / 100)^{0.4}$. This prevents reputation "rent-seeking."

---

## 🧭 6. The Code Map (Internal Brain)

- `backend/src/agents/`: Core LLM reasoning (Orchestrator, Negotiation, Safety).
- `backend/src/marketplace/`: Matching Engine algorithm and bid registry.
- `backend/src/wallets/`: WDK Secret Manager (AES-256) & Protocol Bridge.
- `backend/src/economy/`: Stochastic Pricing & Reputation Models.
- `backend/src/openclaw/`: Compliance Layer & Mission Sealing.
- `backend/src/data/`: Institutional Adapters (Bitfinex, DeFi Llama).

---

## 🛡️ Key Safety Addresses (Sepolia)
- **Native USDt**: `0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0`
- **Aave V3 Pool**: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
- **Marketplace Registry**: `0x29995e02E77117974C734efe47E7BA9CEe51Bf12`

---

## 🔏 7. The Wallet Registry (19-Agent Verified Inventory)

| Agent ID | Index | Chain | Wallet Address (EVM) |
| :--- | :--- | :--- | :--- |
| **OrchestratorAgent** | 0 | Sepolia | `0x29995e02E77117974C734efe47E7BA9CEe51Bf12` |
| **Market_Data_1** | 1 | Sepolia | `0xA5318aad194C02e662D068B7B5Ee0233a142C2BA` |
| **Market_Data_2** | 2 | Sepolia | `0x0C498Df63A98F8C99926E6b09f4f9b51AaA168bE` |
| **Sentiment_Analyst_1** | 3 | Sepolia | `0x1755eEAE2ef4f4f000d1a35Eb00D618e58112Dfa` |
| **Safety_Enforcer_1** | 17 | Sepolia | `0x9E42a701F75A4a050d5D058Fa3d7C583B89BE69B` |

*(Complete 19-row registry available in technical audits)*

---

## 🚦 Setup & License
1.  **Deps**: `npm install`
2.  **Env**: Set `WDK_SEED_PHRASE`, `GROQ_API_KEY`, `EVM_RPC`.
3.  **Run**: `npm run dev:all`

Licensed under **Apache 2.0**.
Built for **Hackathon Galáctica 2026** by the NevoraX Team.
