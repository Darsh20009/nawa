export const logger = {
  info: (...args: unknown[]) => console.log("[db]", ...args),
  warn: (...args: unknown[]) => console.warn("[db]", ...args),
  error: (...args: unknown[]) => console.error("[db]", ...args),
};
