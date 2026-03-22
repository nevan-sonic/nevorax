import { extractJSON } from "../../../utils/jsonUtils.js";
import { askLLM } from "../../../llm/groqClient.js";

/**
 * Synthesis Brain
 * Synthesizes all data and reasoning from the orchestrated workflow into a final response.
 */
export async function synthesizeFinalResult(
  goal,
  results,
  agreements,
  model = null,
) {
  const prompt = `
You are the NevoraX Senior Intelligence Orchestrator. 
Your objective is to synthesize raw data into a premium intelligence report with 100% DATA VERACITY.

User Objective: "${goal}"

[CONTEXT: RAW AGENT INTELLIGENCE]
${Object.entries(results)
  .map(
    ([service, data]) =>
      `### ${service.toUpperCase()}\nPayload: ${JSON.stringify(data)}`,
  )
  .join("\n\n")}

[INSTRUCTIONS - GROUNDING]
1. CONTEXT AWARENESS: Check if the sub-agent data (### DATA_AGENT) specifies a "type": "CONCEPTUAL_SEARCH". 
   - If YES: Focus the report EXCLUSIVELY on technical protocol research and discovery. You MUST produce a multi-section, high-fidelity report (500+ words) using the technical data from all agents. Do NOT use placeholder text or brief summaries. Return "sentiment", "trend", "recommendation", "urgency", and "confidence" as "n/a".
   - If NO: Citation of exact price, volume, and assets is MANDATORY. Provide a sophisticated, multi-paragraph market analysis (300+ words) including volatility outlook and institutional source citations (Binance/Coinbase/etc).
2. DYNAMIC FIELD RELEVANCE: Only provide "sentiment", "trend", "recommendation", "urgency", and "confidence" if they are directly relevant to the user goal. For example, if the goal is purely research, "recommendation" should be "n/a". If the goal doesn't mention market outlook, "trend" should be "n/a". Use "n/a" liberally to reduce irrelevant UI clutter.
3. NO HALLUCINATION: Do NOT mention market technicals (RSI, MA) unless explicitly provided in the agent payloads.
4. DATA INTEGRATION: Combine the Analysis and Risk audits into a single, authoritative technical paper.
5. FORMATTING: Use professional Markdown with headers (###). Avoid trading-centric headers for pure research tasks.
6. TRANSACTION EVIDENCE: ONLY if there is a "BRIDGE_EXECUTION" or "EXECUTION" payload containing a valid "txHash", you MUST include a section titled "### ⛓️ TRANSACTION SETTLED" at the VERY BOTTOM of your report. 
   - PROHIBITION: Do NOT narrate the full transaction hash (0x...) inside your analytical paragraphs. 
   - STYLE MANDATE: The transaction hash link MUST be on its own separate line to prevent layout cutting. 
   - DATA MAPPING: You MUST replace the bracketed placeholders below with the ACTUAL data found in the payloads (e.g., replace [Amount] with "50", [Chain] with "Hoodi", etc.). If no data exists for a field, omit that specific line.
   - FORMAT:
     ### ⛓️ TRANSACTION SETTLED
     Confirmed WDK bridge of **[Amount] USDT** to **[Chain]**.
     **Source Hash**:
     [ShortHash](ExplorerURL)

7. SAFETY AUDIT (CRITICAL): Provide a "safetyAudit" array of 4-5 verification tokens that describe the security of this task.
   - Choose from: DATA_VERACITY, WDK_ESCROW_ENFORCED, ONCHAIN_YIELD_AUDITED, PROTOCOL_COMPLIANCE_VERIFIED, CROSSCHAIN_GATEWAY_SECURED.
   - Only include tokens that are FACTUALLY true based on the provided context (e.g., only include CROSSCHAIN_GATEWAY_SECURED if it's a bridge task).
   - **PROHIBITION**: Do NOT mention the names of these safety tokens (e.g., "DATA_VERACITY") inside the "summary" text. The summary should be pure institutional analysis.

[STRICT NEGATIVE CONSTRAINTS]
- DO NOT list the audit tokens (e.g., DATA_VERACITY, WDK_ESCROW_ENFORCED) in the summary text. They are displayed as UI badges separately.
- DO NOT use phrases like "The safety audit includes..." or "Verification tokens are...".
- DO NOT mention RSI, Moving Averages, or technical indicators unless they are explicitly in the agent payloads.

Return ONLY valid JSON:
{
  "summary": "MANDATORY: 500+ words for research, 300+ for market. If yield data is present in results (### DATA_AGENT), you MUST cite the specific provider (e.g., Aave V3, Compound III) and the APY. For sentiment/market tasks, cite institutional sources like Binance, Coinbase, or Whale Watcher telemetry. Use professional, dense analytical language.",
  "sentiment": "Must be BULLISH, BEARISH, or n/a",
  "trend": "Detailed trend status or n/a",
  "urgency": "high, medium, low, or n/a",
  "recommendation": "Must be 'settled' if a transaction succeeded, otherwise buy, sell, hold, research, or n/a",
  "confidence": "n/a or numerical 0.0 - 1.0",
  "safetyAudit": ["TOKEN1", "TOKEN2", "TOKEN3", "TOKEN4"]
}
`.trim();

  try {
    const response = await askLLM(prompt, 5, model);
    if (!response)
      throw new Error("SynthesisBrain: LLM returned empty response.");

    const synthesized = extractJSON(response);
    if (!synthesized)
      throw new Error(
        "SynthesisBrain: Failed to extract JSON from LLM output.",
      );

    return synthesized;
  } catch (error) {
    console.warn(
      "[SynthesisBrain] LLM synthesis failed, using robust systemic fallback:",
      error.message,
    );

    // Build a systemic summary from all component findings
    let fallbackSummary =
      "### Systemic Intelligence Report (Fallback Mode)\n\n";
    fallbackSummary +=
      "The synthesis intelligence is currently unavailable due to high API load. Below is the raw data consolidated from specialized agents:\n\n";

    Object.entries(results).forEach(([service, data]) => {
      if (service === "report_generation") return;
      fallbackSummary += `- **${service.toUpperCase()}**: ${JSON.stringify(data).substring(0, 500)}...\n`;
    });

    if (results.report_generation?.content) {
      fallbackSummary = results.report_generation.content;
    }

    return {
      summary: fallbackSummary,
      sentiment: results.sentiment_analysis?.sentiment || "neutral",
      trend: results.trend_analysis?.trend || "neutral",
      recommendation: results.strategy_generation?.recommendation || "hold",
      confidence: results.sentiment_analysis?.confidence || 0.5,
    };
  }
}
