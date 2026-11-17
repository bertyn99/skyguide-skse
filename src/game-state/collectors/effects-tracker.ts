import { CONFIG, PLAYER_FORM_ID } from "../../config";
import {
  on,
  printConsole,
  type ActiveEffectApplyRemoveEvent,
} from "../../skyrimPlatform";

/**
 * Active-effects tracker (W4). There is NO active-effect enumerator on the
 * Papyrus surface (`getNthActiveEffect` does not exist; `hasMagicEffect`
 * needs the effect in hand), so we track `effectStart`/`effectFinish` events
 * into a name set.
 *
 * Documented limitation (plan §W4): effects already active at save-load are
 * invisible until they re-fire — `loadGame` clears the set and the map
 * repopulates as effects change.
 */

const activeEffects = new Set<string>();
let initialized = false;

function debugLog(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[effects-tracker] ${message}`);
  }
}

function isPlayer(event: ActiveEffectApplyRemoveEvent): boolean {
  try {
    return (event.target?.getFormID() ?? 0) === PLAYER_FORM_ID;
  } catch {
    return false;
  }
}

function effectName(event: ActiveEffectApplyRemoveEvent): string {
  try {
    const name = event.effect?.getName?.() ?? "";
    return name.length > 0 ? name : "Effet inconnu";
  } catch {
    return "Effet inconnu";
  }
}

export function initEffectsTracker(): void {
  if (initialized) return;
  initialized = true;

  on("effectStart", (event: ActiveEffectApplyRemoveEvent) => {
    if (!isPlayer(event)) return;
    const name = effectName(event);
    activeEffects.add(name);
    debugLog(`effectStart: ${name}`);
  });

  on("effectFinish", (event: ActiveEffectApplyRemoveEvent) => {
    if (!isPlayer(event)) return;
    const name = effectName(event);
    activeEffects.delete(name);
    debugLog(`effectFinish: ${name}`);
  });

  on("loadGame", () => {
    // Effects active at load never fired in this VM session — start clean.
    activeEffects.clear();
    debugLog("loadGame — effect set cleared");
  });
}

/** Sorted snapshot for the dump (stringList). */
export function collectActiveEffects(): string[] {
  return Array.from(activeEffects).sort((a, b) => a.localeCompare(b, "fr"));
}

/** Test seam. */
export function resetEffectsTrackerForTest(): void {
  activeEffects.clear();
  initialized = false;
}
