import Groq from "groq-sdk";
import { config } from "../utils/config/config.js";

// Lazy import to avoid circular deps — ledger may not be initialized at module load
let _ledger = null;
async function getLedger() {
  if (!_ledger) {
    const mod = await import("../ledger/economic-ledger/economicLedger.js");
    _ledger = mod.economicLedger;
  }
  return _ledger;
}

let groqClient = null;

function getGroqClient() {
  const apiKey = config.llm.apiKey;
  if (!apiKey) {
    console.warn(
      "[NevoraX][LLM] config.llm.apiKey is not set; LLM features are disabled and deterministic fallbacks will be used.",
    );
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

export async function askLLM(prompt, retries = 4, modelOverride = null) {
  const client = getGroqClient();
  if (!client) return "";

  const primaryModel =
    modelOverride || config.llm.model || "llama-3.1-8b-instant";

  const isHighTier = primaryModel.includes("70b");
  const cascadeQueue = isHighTier
    ? [
        primaryModel,
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "llama-3.1-8b-instant",
      ]
    : [primaryModel, "llama3-8b-8192", "gemma2-9b-it", "mixtral-8x7b-32768"];

  let lastError;
  for (let i = 0; i < retries; i++) {
    for (const model of cascadeQueue) {
      try {
        const completion = await client.chat.completions.create({
          model: model,
          messages: [
            {
              role: "system",
              content:
                "Strict JSON output only. Follow instructions precisely.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        });
  
        return completion.choices[0]?.message?.content || "";
      } catch (error) {
        lastError = error;
        if (
          error.status === 429 ||
          error.status === 503 ||
          error.status === 400
        ) {
          console.warn(
            `[Groq] Limit on ${model} (${error.status}). Instantly cascading...`,
          );
          continue;
        }
        console.error(`[Groq] Fatal format error on ${model}:`, error.message);
        break;
      }
    }

    if (
      lastError &&
      (lastError.status === 429 ||
        lastError.status === 503 ||
        lastError.status === 400)
    ) {
      const delay = Math.pow(2, i) * 1000;
      console.warn(
        `[Groq] Entire cascade exhausted. Sleeping ${delay}ms before next pass (${i + 1}/${retries})...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    } else {
      break;
    }
  }

  console.error(
    `[Groq] All ${retries} cascade passes failed. Returning empty string.`,
  );
  return "";
}
