import { Game, printConsole } from "../skyrimPlatform";
import { CONFIG } from "../config";

/**
 * Skyrim Access coexistence detection (W2 / docs/ACCESSIBILITY.md §4).
 *
 * Standalone-first means SkyGuide works when Skyrim Access is ABSENT — not
 * that it should speak over it when present. Their object scanner and
 * ambient radar own those channels (Nexus 181131); when their ESP is
 * installed, the app suppresses our object/radar announcements and keeps
 * tactical reflex only.
 *
 * `Game.isPluginInstalled` is the robust probe (no form-id guesswork);
 * `getFormFromFile(0x13A6BD, "SkyrimAccess.esp")` stays as the documented
 * fallback. Detection is cached — plugin load order cannot change mid-session.
 */

const SKYRIM_ACCESS_ESP = "SkyrimAccess.esp";

let detected: boolean | null = null;

function probePluginInstalled(): boolean | null {
  try {
    return Game.isPluginInstalled(SKYRIM_ACCESS_ESP) ?? false;
  } catch {
    return null;
  }
}

function probeFormFromFile(): boolean {
  try {
    return Game.getFormFromFile(0x13a6bd, SKYRIM_ACCESS_ESP) !== null;
  } catch {
    return false;
  }
}

/** Cached detection: true = defer world-object/radar narration to them. */
export function isSkyrimAccessInstalled(): boolean {
  if (detected !== null) return detected;
  detected = probePluginInstalled() ?? probeFormFromFile();
  if (CONFIG.debugMode) {
    printConsole(`[SkyGuide] SkyrimAccess.esp detected: ${detected}`);
  }
  return detected;
}

/** Test seam. */
export function resetSkyrimAccessDetection(): void {
  detected = null;
}
