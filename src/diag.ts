import { printConsole, writeLogs } from "./skyrimPlatform";

/**
 * Dual-channel diagnostics: in-game console + skyrim-platform.log file.
 * The file survives after the session ends, so post-mortem analysis does not
 * depend on the user copying console text. Use for startup/fs/ESP-wiring
 * proofs — not for per-tick chatter.
 */
export function logDiag(...args: unknown[]): void {
  const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  printConsole(line);
  try {
    writeLogs("skyguide-plugin", line);
  } catch {
    // Log file may be unavailable in some SP versions — console still works.
  }
}
