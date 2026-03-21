/**
 * DemoGuardrails - Safety utilities for the NevoraX Agent Economy.
 * Provides timeouts and execution limits for autonomous agents.
 */

export const DemoGuardrails = {
  /**
   * Execute an async function with a fallback timeout.
   */
  async executeWithTimeout(asyncFn, timeoutMs = 60000) {
    let timeoutHandle;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new Error(
            `[Guardrails] EXECUTION_TIMEOUT: Task exceeded ${timeoutMs}ms limit.`,
          ),
        );
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([asyncFn(), timeoutPromise]);
      clearTimeout(timeoutHandle);
      return result;
    } catch (error) {
      clearTimeout(timeoutHandle);
      throw error;
    }
  },
};
