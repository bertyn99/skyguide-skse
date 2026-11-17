import {
  Game,
  Quest,
  storage,
  on,
  printConsole,
  type ModEvent,
  type PapyrusObject,
} from "../skyrimPlatform";
import type { Quest as QuestType } from "@skyrim-platform/skyrim-platform";
import { logDiag } from "../diag";
import { CONFIG } from "../config";
import { getWorldObjects } from "../game-state/collectors/world-scanner";
import type { NavigationStatus } from "../game-state/types";
import {
  AUTOWALK_ACK_EVENT,
  AUTOWALK_ARRIVED_EVENT,
  AUTOWALK_CANCEL_EVENT,
  AUTOWALK_CMD_EVENT,
  AUTOWALK_READY_EVENT,
  canTransition,
  encodeAutowalkCommand,
  type AutowalkCommand,
} from "./navigation-core";

/**
 * Autowalk bridge (W6) — the JS half of the two-runtime handshake. The ESP
 * (CK-built, see esp/README.md) owns the quest, the Travel package and
 * Papyrus execution; JS decides WHERE and watches for cancellation.
 *
 * Contract (see navigation-core.ts + plan W6):
 *  - JS → ESP: `questRef.sendModEvent(CmdEvent, jsonStrArg, 0)` where the
 *    JSON carries {f: hexFormId, d: stopDistance} (numArg is float32).
 *  - ESP → JS: Ack / Arrived / (CancelEcho) mod events.
 *  - Cleanup of `SetPlayerAIDriven(false)` on: deathStart, loadGame,
 *    fastTravelEnd, dialogue menu, WASD cancel, hard timeout, and HOT
 *    RELOAD — the engine flag survives JS reloads, tracked in `sp.storage`.
 *  - 2s ack timeout (HTTP-timeout state-machine pattern): a missing/broken
 *    ESP fails the command instead of hanging the status on "walking".
 */

const AI_DRIVEN_STORAGE_KEY = "skyguide.aiDrivenByUs";

interface AutowalkState {
  status: NavigationStatus;
  drivingByUs: boolean;
  pendingAckDeadline: number;
  /** Set by the ESP's Ready announce — the quest form itself (W6 handshake). */
  espQuest: QuestType | null;
}

let state: AutowalkState = {
  status: "idle",
  drivingByUs: false,
  pendingAckDeadline: 0,
  espQuest: null,
};

let initialized = false;

function debugLog(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[autowalk] ${message}`);
  }
}

function transition(to: NavigationStatus): void {
  if (!canTransition(state.status, to)) {
    debugLog(`illegal transition ${state.status} → ${to} — ignored`);
    return;
  }
  state.status = to;
}

function setPlayerAiDriven(driven: boolean): void {
  try {
    Game.setPlayerAIDriven(driven);
  } catch (err) {
    debugLog(`setPlayerAIDriven(${String(driven)}) failed: ${String(err)}`);
  }
}

function clearDrivingByUs(): void {
  if (!state.drivingByUs) return;
  state.drivingByUs = false;
  try {
    delete storage[AI_DRIVEN_STORAGE_KEY];
  } catch {
    // storage unavailable (should not happen in-game)
  }
}

export function cancelAutowalk(reason: NavigationStatus, announce = true): void {
  if (state.status !== "walking") return;
  if (announce && state.espQuest) {
    try {
      state.espQuest.sendModEvent(AUTOWALK_CANCEL_EVENT, "", 0);
    } catch {
      // ESP may be gone — local cleanup still applies.
    }
  }
  setPlayerAiDriven(false);
  clearDrivingByUs();
  transition(reason);
  state.pendingAckDeadline = 0;
  debugLog(`cancelled/failed → ${reason}`);
}

/** Called every collection pass — WASD cancel watch + ack timeout. */
export function autowalkInputTick(keysPressed: string[], excluded: boolean): void {
  if (state.status !== "walking") return;
  if (state.pendingAckDeadline !== 0 && Date.now() > state.pendingAckDeadline) {
    // ESP never acked — fail the command, restore player control.
    cancelAutowalk("failed", false);
    return;
  }
  if (excluded) return; // dialogue/menu handled by their own cancel hooks
  const movementKey = keysPressed.some(
    (key) => key === "W" || key === "A" || key === "S" || key === "D",
  );
  if (movementKey) {
    debugLog("movement key during autowalk — cancelling");
    cancelAutowalk("cancelled");
  }
}

/** `{type:"autowalkTo", formId, stopDistance}` executor entry point. */
export function requestAutowalk(command: AutowalkCommand): boolean {
  if (!CONFIG.autowalkEnabled) {
    debugLog("autowalk disabled (CONFIG)");
    return false;
  }
  // Same hallucination guard as activate{formId}: only scanner-seen targets.
  const inCache = getWorldObjects().some((object) => object.formId === command.formId);
  if (!inCache) {
    debugLog(`autowalk blocked: formId ${command.formId} not in scanner cache`);
    return false;
  }
  if (!state.espQuest) {
    // SkyGuide.esp absent, or installed-but-not-yet-Ready (OnInit not seen).
    transition("failed");
    debugLog("autowalk blocked: ESP quest not Ready (no SkyGuide_AutoWalkReady yet)");
    return false;
  }
  try {
    state.espQuest.sendModEvent(AUTOWALK_CMD_EVENT, encodeAutowalkCommand(command), 0);
  } catch (err) {
    transition("failed");
    debugLog(`sendModEvent failed: ${String(err)}`);
    return false;
  }
  transition("walking");
  state.drivingByUs = true;
  try {
    storage[AI_DRIVEN_STORAGE_KEY] = true;
  } catch {
    // storage unavailable — hot-reload guard degrades to best-effort
  }
  state.pendingAckDeadline = Date.now() + CONFIG.autowalkAckTimeoutMs;
  debugLog(`autowalk request sent (formId ${command.formId}, stop ${command.stopDistance})`);
  return true;
}

export function getNavigationStatus(): NavigationStatus {
  return state.status;
}

export function initAutowalk(): void {
  if (initialized) return;
  initialized = true;

  // Hot-reload guard: the engine AI-driven flag survives JS reloads. If a
  // previous VM instance was driving, restore player control now.
  try {
    if (storage[AI_DRIVEN_STORAGE_KEY] === true) {
      setPlayerAiDriven(false);
      delete storage[AI_DRIVEN_STORAGE_KEY];
      debugLog("hot-reload recovery: AI-driven flag cleared");
    }
  } catch {
    // storage unavailable (non-game context)
  }

  on("modEvent", (event: ModEvent) => {
    if (event.eventName === AUTOWALK_READY_EVENT) {
      // ESP announce: `sender` is the quest form itself (Papyrus SendModEvent
      // called on the quest). Store the reference — no form-ID hardcoding.
      state.espQuest = event.sender
        ? (Quest.from(event.sender as PapyrusObject) as QuestType | null)
        : null;
      // Always printed: this is the once-per-session ESP wiring proof.
      logDiag(`[autowalk] ESP ready — quest stored (${state.espQuest ? "ok" : "sender cast failed"})`);
      return;
    }
    if (event.eventName === AUTOWALK_ACK_EVENT && state.status === "walking") {
      state.pendingAckDeadline = 0;
      debugLog("ESP ack received");
      return;
    }
    if (event.eventName === AUTOWALK_ARRIVED_EVENT && state.status === "walking") {
      state.pendingAckDeadline = 0;
      state.drivingByUs = false;
      try {
        delete storage[AI_DRIVEN_STORAGE_KEY];
      } catch {
        // best-effort
      }
      transition("arrived");
      debugLog("arrived");
      return;
    }
  });

  on("deathStart", () => cancelAutowalk("failed", false));
  on("loadGame", () => {
    if (state.drivingByUs) cancelAutowalk("failed", false);
    else if (state.status !== "idle") transition("idle");
  });
  on("fastTravelEnd", () => cancelAutowalk("failed", false));
}

/** Test seam. */
export function resetAutowalkForTest(): void {
  state = { status: "idle", drivingByUs: false, pendingAckDeadline: 0, espQuest: null };
  initialized = false;
}
