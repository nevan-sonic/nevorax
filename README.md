# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — [THE_ULTIMATE_SUBMISSION]**

[![WDK Verified](https://img.shields.io/badge/Tether_WDK-Verified-blue?style=for-the-badge&logo=tether)](https://github.com/tetherto/wdk)
[![OpenClaw Compliant](https://img.shields.io/badge/OpenClaw-Compliant-success?style=for-the-badge)](https://openclaw.io)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-yellow?style=for-the-badge)](https://opensource.org/licenses/Apache-2.0)

NevoraX is a **live economic infrastructure** where AI agents collaborate, compete, and settle value using **Tether USDt**. This project represents an "Institutional Standard" implementation, exposing every layer of reasoning, institutional data acquisition, and cryptographic settlement for a "Final Boss" hackathon submission.

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

## 🧠 3. The Neural Core: Synthesis & Negotiation

### **A. Synthesis Reasoning Loop**
Every user goal enters the **Synthesis Brain**, which executes a 4-step deconstruction cycle:
1.  **Decompose**: Breaking the goal into unit-tasks (Market Data, Risk audit, etc.).
2.  **GROUND**: Constraining agents to institutional sources (Bitfinex, DeFi Llama).
3.  **Execute**: Orchestrating agent-to-agent hiring via OpenClaw signals.
4.  **Validate**: Scoring the 300-500 word report for data veracity and transaction evidence.

### **B. The Matching Equation**
Our `MatchingEngine` uses a weighted value-score to select providers, preventing reputation monopolies:
$Score = (0.6 \times NormalizedPrice) + (0.4 \times (1 - Reputation)) + (0.2 \times FitScore)$.
- **Price Weight (0.6)**: Optimizes for capital efficiency.
- **Reputation Weight (0.4)**: Incentivizes long-term credit history.
- **Fit Score (0.2)**: Prioritizes `SPEED` vs `QUALITY` metadata.

---

## 🌉 4. Deep Dive: The Hoodi Settlement Engine

NevoraX is natively multichain, maintaining a persistent presence across **Ethereum Sepolia** and **Hoodi**.
- **Universal HD-Identity**: Every agent uses a consistent BIP-44 path (`m/44'/60'/0'/0/[INDEX]`), allowing a single seed to authorize value across all registered RPCs.
- **The Bridge Lifecycle**: 
    1. **Lock (Source)**: USDt locked on Sepolia.
    2. **Propagate**: Signal emitted across OpenClaw.
    3. **Release (Destination)**: Native settlement signed on Hoodi via the WDK `sendTransaction` module.

---

## 🛡️ 5. Final Boss Technical Nuances

- **AES-256 Vaulting & Disposal**: Seeds are encrypted into a secure vault and raw strings are `disposed()` immediately. The LLM has zero persistent access to keys.
- **HMAC-SHA256 Signing Fallback**: A deterministic fallback ensures cryptographic accountability even if WDK memory is restricted.
- **BigInt Financial Precision**: Zero-floating-point drift across all micro-unit (MNT) settlements.

---

## 🤖 6. Peer Personality Matrix

| Persona | Cost Bias | Logic | Best For |
| :--- | :--- | :--- | :--- |
| **SHREWD** | 1.05x | High reputation focus; multi-source institutional audit. | Critical Infrastructure |
| **RATIONAL** | 1.00x | Pure market parity; optimizes for median pricing. | Data Extraction |
| **AGGRESSIVE** | 0.90x | Speed over cost; tolerates higher market drift. | High-Volume Search |

---

## 🔏 7. The Wallet Registry (19-Agent Verified Inventory)

| Agent ID | Index | Chain | Wallet Address (EVM) |
| :--- | :--- | :--- | :--- |
| **OrchestratorAgent** | 0 | Sepolia | `0x29995e02E77117974C734efe47E7BA9CEe51Bf12` |
| **Safety_Enforcer_1** | 17 | Sepolia | `0x9E42a701F75A4a050d5D058Fa3d7C583B89BE69B` |

---

## 🚦 Setup & License
1.  **Deps**: `npm install`
2.  **Env**: Set `WDK_SEED_PHRASE`, `GROQ_API_KEY`, `EVM_RPC`, `HOODI_RPC`.
3.  **Run**: `npm run dev:all`

Built for **Hackathon Galáctica 2026**. Licensed under **Apache 2.0**.
