/**
 * Pure autowalk/navigation logic — NO skyrimPlatform imports.
 *
 * Mod-event contract (verified against the skymp sources, 2026-11-16 — see
 * plan W6 evidence): JS calls `questRef.sendModEvent(eventName, strArg,
 * numArg)`; the ESP script's `RegisterForModEvent` callback receives
 * `(string strArg, float numArg)`. numArg is packed float32 (~7 digits) so
 * the formId MUST travel in strArg — here: JSON. Names are UNIQUE (D5) —
 * sharing Skyrim Access's event names would trigger both mods' autowalk.
 */

export const AUTOWALK_CMD_EVENT = "SkyGuide_AutoWalkCmd";
export const AUTOWALK_ACK_EVENT = "SkyGuide_AutoWalkAck";
export const AUTOWALK_ARRIVED_EVENT = "SkyGuide_AutoWalkArrived";
export const AUTOWALK_CANCEL_EVENT = "SkyGuide_AutoWalkCancel";
/**
 * ESP announce: the quest script sends this at OnInit (game launch) and on
 * every save-load re-register. `event.sender` IS the quest form — the JS
 * side stores it and never needs the quest's form ID (any CK-built form id
 * works).
 */
export const AUTOWALK_READY_EVENT = "SkyGuide_AutoWalkReady";

export type NavigationStatus = "idle" | "walking" | "arrived" | "cancelled" | "failed";

export interface AutowalkCommand {
  formId: number;
  stopDistance: number;
}

/** JSON payload in strArg — formIds ≥ 0xFF000000 survive (float32 would not). */
export function encodeAutowalkCommand(command: AutowalkCommand): string {
  return JSON.stringify({ f: command.formId.toString(16), d: command.stopDistance });
}

/** Tolerant decode — a malformed payload must fail the action, not the VM. */
export function decodeAutowalkCommand(strArg: string): AutowalkCommand | null {
  try {
    const raw = JSON.parse(strArg) as unknown;
    if (!raw || typeof raw !== "object") return null;
    const record = raw as { f?: unknown; d?: unknown };
    if (typeof record.f !== "string") return null;
    const formId = Number.parseInt(record.f, 16);
    if (!Number.isFinite(formId) || formId <= 0) return null;
    const stopDistance =
      typeof record.d === "number" && Number.isFinite(record.d) && record.d > 0
        ? record.d
        : 100;
    return { formId, stopDistance };
  } catch {
    return null;
  }
}

/**
 * Status transitions (pure) — the glue owns timers/events, this owns the
 * legality of each hop. Any status may reset to "idle".
 */
export function canTransition(from: NavigationStatus, to: NavigationStatus): boolean {
  if (to === "idle") return true;
  switch (from) {
    case "idle":
      return to === "walking" || to === "failed";
    case "walking":
      return to === "arrived" || to === "cancelled" || to === "failed";
    default:
      // arrived/cancelled/failed are terminal until the next command resets.
      return false;
  }
}
