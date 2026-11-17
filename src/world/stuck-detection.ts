import type { Position3, ScannedObjectCore } from "../world/scanner-core";
import {
  type StuckSample,
  evaluateStuck,
  nearestObstacleRelBearing,
  pushStuckSample,
  STUCK_DEFAULTS,
} from "../world/stuck-core";

/**
 * Game-facing stuck detection (W3). Pure window math lives in
 * stuck-core.ts; this glue is called once per collection pass with data the
 * collectors already gathered (player position, WASD from the input
 * collector, scanner cache) — zero extra Papyrus probes.
 *
 * `excluded` resets the confirmation window: menus/loading (denylist),
 * death, swimming, mounted, seated, dialogue, autowalk.
 */

let history: StuckSample[] = [];

export interface StuckEvaluationResult {
  stuck: boolean;
  /** Player-relative bearing of the nearest obstacle (undefined = unknown). */
  bearingRelDeg?: number;
}

export function evaluateStuckNow(input: {
  pos: Position3;
  /** WASD tokens from the input collector (["W","A",…]). */
  keysPressed: string[];
  gameMs: number;
  excluded: boolean;
  worldObjects: ScannedObjectCore[];
}): StuckEvaluationResult {
  const keysHeld = input.keysPressed.some(
    (key) => key === "W" || key === "A" || key === "S" || key === "D",
  );

  history = pushStuckSample(
    history,
    {
      tMs: input.gameMs,
      pos: input.pos,
      keysHeld,
      excluded: input.excluded,
    },
    input.gameMs,
  );

  const evaluation = evaluateStuck(history, input.gameMs);
  const bearing = evaluation.stuck
    ? nearestObstacleRelBearing(input.worldObjects, STUCK_DEFAULTS.obstacleRangeUnits)
    : undefined;

  return { stuck: evaluation.stuck, bearingRelDeg: bearing };
}

/** Test seam. */
export function resetStuckDetectionForTest(): void {
  history = [];
}
