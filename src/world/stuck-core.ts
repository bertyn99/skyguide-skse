/**
 * Pure stuck-detection logic — NO skyrimPlatform imports.
 * Ported from Skyrim Access's blocked_stop state machine (§5.5): movement
 * input held + position delta below threshold over a confirmation window.
 * We cannot neutralise the input events (needs the ProcessEvent hook), so we
 * DETECT and REPORT — the app turns it into "Vous êtes bloqué. Tourne à…".
 *
 * Thresholds (§5.6): position delta < ~8 units; ~0.5 s confirmation. At our
 * 500 ms tick, a 1200 ms window holds ~3 samples — the 0.5 s confirm demands
 * at least 2. Movement keys come from the input collector (no extra Papyrus
 * polls); mapped-key probing (§4) is a later refinement.
 */

import type { Position3, ScannedObjectCore } from "./scanner-core";
import { distanceUnits } from "./scanner-core";

export const STUCK_DEFAULTS = {
  /** Position window: |pos − pos(windowMs ago)| decides "not moving". */
  windowMs: 1200,
  /** Below this delta over the window, the player is not making progress. */
  minMovementUnits: 8,
  /** Minimum window occupancy before declaring stuck (their ~0.5 s confirm). */
  confirmMs: 500,
  maxSamples: 16,
  /** Nearest scanner object within this range counts as the obstacle. */
  obstacleRangeUnits: 500,
} as const;

export interface StuckSample {
  tMs: number;
  pos: Position3;
  /** W/A/S/D held this tick (from the input collector). */
  keysHeld: boolean;
  /** Menu/loading/dead/swimming/mounted/seated/dialogue/autowalk — resets the window. */
  excluded: boolean;
}

/** Append + time-prune. Returns a new array (pure). */
export function pushStuckSample(
  history: StuckSample[],
  sample: StuckSample,
  nowMs: number,
  maxSamples: number = STUCK_DEFAULTS.maxSamples,
): StuckSample[] {
  const next = [...history, sample];
  const cutoff = nowMs - STUCK_DEFAULTS.windowMs * 4;
  return next.filter((entry) => entry.tMs >= cutoff).slice(-maxSamples);
}

export interface StuckEvaluation {
  stuck: boolean;
  /** Window span observed at confirmation (diagnostics/tests). */
  confirmMs: number;
}

export function evaluateStuck(
  history: StuckSample[],
  nowMs: number,
  config: {
    windowMs: number;
    minMovementUnits: number;
    confirmMs: number;
  } = STUCK_DEFAULTS,
): StuckEvaluation {
  const newest = history[history.length - 1];
  if (!newest) return { stuck: false, confirmMs: 0 };
  if (!newest.keysHeld || newest.excluded) return { stuck: false, confirmMs: 0 };

  // Reference sample: the oldest sample inside the window (or the oldest we
  // kept if the window is not yet full).
  let reference = history[0]!;
  for (const entry of history) {
    if (nowMs - entry.tMs <= config.windowMs) {
      reference = entry;
      break;
    }
  }

  const span = newest.tMs - reference.tMs;
  if (span < config.confirmMs) return { stuck: false, confirmMs: span };

  // Every sample in the window must show held keys and a non-excluded state —
  // one menu blip or swim tick resets the confirmation.
  for (const entry of history) {
    if (entry.tMs < reference.tMs) continue;
    if (!entry.keysHeld || entry.excluded) {
      return { stuck: false, confirmMs: span };
    }
  }

  const delta = distanceUnits(
    newest.pos.x - reference.pos.x,
    newest.pos.y - reference.pos.y,
    newest.pos.z - reference.pos.z,
  );
  return {
    stuck: delta < config.minMovementUnits,
    confirmMs: span,
  };
}

/**
 * Nearest scanner object within range becomes "the obstacle" — its
 * player-relative bearing drives the reflex's turn direction.
 * Returns undefined when the scanner sees nothing (state gap).
 */
export function nearestObstacleRelBearing(
  worldObjects: ScannedObjectCore[],
  rangeUnits: number = STUCK_DEFAULTS.obstacleRangeUnits,
): number | undefined {
  for (const object of worldObjects) {
    // The scanner cache is distance-sorted nearest-first.
    if (object.distance <= rangeUnits) return object.relativeDeg;
    break; // first entry is the nearest; if it's out of range, all are
  }
  return undefined;
}
