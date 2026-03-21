/**
 * Robustly extracts JSON from an LLM response string.
 * Handles markdown blocks and leading/trailing conversational text.
 */
export function extractJSON(text) {
  if (!text) throw new Error("extractJSON: Input is empty or null.");

  try {
    // 1. Try direct parse first
    return JSON.parse(text.trim());
  } catch (e) {
    // 2. Try extracting content between first '{' and last '}'
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        console.warn(
          "[jsonUtils] Regex extraction failed to parse:",
          innerError.message,
        );
      }
    }

    // 3. Fallback: try stripping markdown blocks
    const stripped = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(stripped);
    } catch (finalError) {
      console.error(
        "[jsonUtils] All JSON extraction methods failed for text:",
        text,
      );
      throw new Error(
        `LLM output could not be parsed as JSON: ${finalError.message}`,
        { cause: finalError },
      );
    }
  }
}
