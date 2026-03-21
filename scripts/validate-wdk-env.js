/**
 * NevoraX Hackathon Readiness Validator
 *
 * This script ensures the environment is correctly configured for judges
 * to run the Tether WDK + OpenClaw demonstration out-of-the-box.
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { ethers } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../backend/.env") });

async function validate() {
  console.log("--- NEVORAX HACKATHON READINESS AUDIT ---");
  let score = 0;
  let total = 6;

  // 1. .env Check
  if (fs.existsSync(path.join(__dirname, "../backend/.env"))) {
    console.log("✅ [1/6] backend/.env file found.");
    score++;
  } else {
    console.error(
      "❌ [1/6] backend/.env file MISSING. Copy .env.example to .env first.",
    );
  }

  // 2. WDK Seed Check
  if (process.env.WDK_SEED_PHRASE) {
    console.log("✅ [2/6] WDK_SEED_PHRASE is configured.");
    score++;
  } else {
    console.error("❌ [2/6] WDK_SEED_PHRASE is missing from .env.");
  }

  // 3. EVM RPC Connection
  try {
    const provider = new ethers.JsonRpcProvider(process.env.EVM_RPC);
    const network = await provider.getNetwork();
    console.log(`✅ [3/6] EVM RPC connected. Chain ID: ${network.chainId}`);
    score++;

    // 4. Wallet Balance (Gas)
    const wallet = ethers.Wallet.fromPhrase(process.env.WDK_SEED_PHRASE);
    const balance = await provider.getBalance(wallet.address);
    if (balance > 0n) {
      console.log(
        `✅ [4/6] Wallet ${wallet.address} has gas: ${ethers.formatEther(balance)} ETH`,
      );
      score++;
    } else {
      console.warn(
        `⚠️ [4/6] Wallet ${wallet.address} has 0 Sepolia ETH. Bridging may fail.`,
      );
    }
  } catch (err) {
    console.error(`❌ [3/6] EVM RPC connection failed: ${err.message}`);
  }

  // 5. Groq API Check
  if (process.env.GROQ_API_KEY) {
    console.log("✅ [5/6] GROQ_API_KEY is configured.");
    score++;
  } else {
    console.error("❌ [5/6] GROQ_API_KEY is missing. AI reasoning will fail.");
  }

  // 6. OpenClaw Component Audit
  const registryPath = path.join(
    __dirname,
    "../backend/src/openclaw/OpenClawRegistry.js",
  );
  if (fs.existsSync(registryPath)) {
    console.log("✅ [6/6] OpenClaw Integration Layer detected.");
    score++;
  } else {
    console.error("❌ [6/6] OpenClaw Registry missing.");
  }

  console.log("\n--- RESULT ---");
  if (score === total) {
    console.log(
      "🚀 READY FOR SUBMISSION! The project is configured for a winning demo.",
    );
  } else {
    console.warn(
      `⚠️ ALIGNMENT GAP: ${score}/${total} passed. Fix the errors above before submitting.`,
    );
  }
}

validate();
