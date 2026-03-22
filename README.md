# 🪐 NevoraX: The Autonomous Agent Economy
### **Hackathon Galáctica: WDK Edition 1 — [THE_INSTITUTIONAL_FLAGSHIP]**

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

## 🌉 3. Multichain Agency: The Hoodi Bridge

NevoraX is natively multichain. We maintain a persistent economic presence across **Ethereum Sepolia** and **Hoodi** using a hybrid WDK Bridge architecture.

### **The Bridge Sequence (Sepolia -> Hoodi)**
1.  **Phase 1: Source Lock**: The `BridgeEngine` executes a real `WalletAccountEvm.transfer()` of Sepolia USDt (`0xd077a4a0...`) to the Lock Recipient.
2.  **Phase 2: Propagation**: The `OpenClaw` compliance layer cross-references the transaction hash and propagates the value signal across the A2A bus.
3.  **Phase 3: Destination Release**: The `WalletAccountEvm.sendTransaction()` is triggered on the **Hoodi** network (ChainID: 151) using the same HD-derived agent identity, settling the work in native assets.

### **Multichain RPC Configuration**
- **Sepolia**: `process.env.EVM_RPC`
- **Hoodi**: `process.env.HOODI_RPC`
- **Concurrency**: Native `AccountLock` mutexes prevent nonce collisions across chains for the same HD index.

---

## 🧠 4. Final Boss Technical Nuances

### **A. Robust Cryptographic Resilience**
NevoraX implements a **Deterministic HMAC-SHA256 Signing Fallback** in the `WalletBridge`. If the WDK seed is unavailable in memory (Security Isolation), agents produce a deterministic proof of agreement.

### **B. BigInt Financial Rigour**
Every economic calculation (Revenue, Profit, Margin) is handled via **Native BigInt** to ensure zero floating-point drift during institutional settlements.

### **C. "Burn-After-Reading" Seed Disposal**
The `WdkSecretManager` executes a **Memory Disposal Cycle**:
1. Seed is encrypted into an AES-256 Vault.
2. Raw seed strings are `disposed()` immediately.
3. The LLM Reasoning layer is physically air-gapped from the signing logic.

---

## 🤖 5. Peer Personality Matrix

Agents exhibit distinct fiscal behaviors in the negotiation phase:

| Persona | Cost Bias | Logic | Best For |
| :--- | :--- | :--- | :--- |
| **SHREWD** | 1.05x | High reputation focus; multi-source institutional audit. | Critical Infrastructure |
| **RATIONAL** | 1.00x | Pure market parity; optimizes for median pricing. | Data Extraction |
| **AGGRESSIVE** | 0.90x | Speed over cost; tolerates higher market drift. | High-Volume Search |

---

## 🔏 6. The Wallet Registry (19-Agent Verified Inventory)

| Agent ID | Index | Chain | Wallet Address (EVM) |
| :--- | :--- | :--- | :--- |
| **OrchestratorAgent** | 0 | Sepolia | `0x29995e02E77117974C734efe47E7BA9CEe51Bf12` |
| **Risk_Auditor_1** | 13 | **Hoodi** | `0xC92720D540B70E42B80B8AEa403708E6b6248454` |
| **Safety_Enforcer_1** | 17 | Sepolia | `0x9E42a701F75A4a050d5D058Fa3d7C583B89BE69B` |

*(Note: Every agent in the registry has a shadow identity on Hoodi derived from the same seed)*

---

## 🚦 Setup & License
1.  **Deps**: `npm install`
2.  **Env**: Set `WDK_SEED_PHRASE`, `GROQ_API_KEY`, `EVM_RPC`, `HOODI_RPC`.
3.  **Run**: `npm run dev:all`

Built for **Hackathon Galáctica 2026**. Licensed under **Apache 2.0**.
