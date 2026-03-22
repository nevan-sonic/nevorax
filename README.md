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

## 🧠 3. Final Boss Technical Nuances

### **A. Robust Cryptographic Resilience**
NevoraX implements a **Deterministic HMAC-SHA256 Signing Fallback** in the `WalletBridge`. If the WDK seed is unavailable in memory (Security Isolation), agents produce a deterministic proof of agreement, ensuring the mission cycle never breaks while maintaining cryptographic accountability.

### **B. BigInt Financial Rigour**
Every economic calculation (Revenue, Profit, Margin) is handled via **Native BigInt**.
- **Yield Logic**: `actualMargin = Number((profit * 100n) / reward) / 100`.
- **Precision**: 6-decimal USDt units (MNT/micro-units) are maintained across the entire stack.

### **C. "Burn-After-Reading" Seed Disposal**
Security is not an afterthought. The `WdkSecretManager` executes a **Memory Disposal Cycle**:
1. Seed is fetched from `process.env`.
2. Seed is encrypted into an AES-256 Vault.
3. Raw seed strings are `disposed()` and garbage-collected immediately.
4. The LLM Reasoning layer has *zero* physical access to the signing keys.

---

## 🤖 4. Peer Personality Matrix

Agents exhibit distinct fiscal behaviors in the negotiation phase:

| Persona | Cost Bias | Logic | Best For |
| :--- | :--- | :--- | :--- |
| **SHREWD** | 1.05x | High reputation focus; multi-source institutional audit. | Critical Infrastructure |
| **RATIONAL** | 1.00x | Pure market parity; optimizes for median pricing. | Data Extraction |
| **AGGRESSIVE** | 0.90x | Speed over cost; tolerates higher market drift. | High-Volume Search |

---

## 📜 5. OpenClaw Mission Specimen (JSON)

Our missions are governed by the **OpenClaw v2026.1** standard, ensuring "Transparent Box" auditability:

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
    "goal": "Audit USDt yield on Aave V3",
    "budget": "50000000",
    "integrity": { "governed_by": "Safety_Enforcer" }
  }
}
```

---

## 🛡️ 6. Key Protocol Addresses (Sepolia)
- **Native USDt**: `0xd077a400968890eacc75cdc901f0356c943e4fdb`
- **Aave V3 Pool**: `0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951`
- **NevoraX Registry**: `0x29995e02E77117974C734efe47E7BA9CEe51Bf12`

---

## 🔏 7. The Wallet Registry (19-Agent Verified Inventory)

| Agent ID | Index | Chain | Wallet Address (EVM) |
| :--- | :--- | :--- | :--- |
| **OrchestratorAgent** | 0 | Sepolia | `0x29995e02E77117974C734efe47E7BA9CEe51Bf12` |
| **Safety_Enforcer_1** | 17 | Sepolia | `0x9E42a701F75A4a050d5D058Fa3d7C583B89BE69B` |

---

## 🚦 Setup & License
1.  **Deps**: `npm install`
2.  **Env**: Set `WDK_SEED_PHRASE`, `GROQ_API_KEY`, `EVM_RPC`.
3.  **Run**: `npm run dev:all`

Built for **Hackathon Galáctica 2026**. Licensed under **Apache 2.0**.
