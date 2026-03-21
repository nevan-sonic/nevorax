import { askLLM } from "../llm/groqClient.js";

export async function planTaskWithOpenClaw(taskDescription) {
  const prompt = `
You are an OpenClaw-style autonomous agent planner.

Available agents:

DataAgent → fetches crypto market data
SentimentAgent → analyzes market sentiment

Task:
${taskDescription}

Return JSON only:

{
  "agents": ["DataAgent","SentimentAgent"]
}
`.trim();

  const response = await askLLM(prompt);

  try {
    const cleaned = response.replace(/`json/g, "").replace(/`/g, "").trim();

    const jsonMatch = cleaned.match(/{[\s\S]*}/);

    if (!jsonMatch) {
      throw new Error("No JSON object found in OpenClaw response");
    }

    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    console.warn("OpenClaw planner parse failed, using fallback", e);

    return {
      agents: ["DataAgent", "SentimentAgent"],
    };
  }
}
