import { describe, expect, it } from "vitest";
import {
  type StuckSample,
  evaluateStuck,
  nearestObstacleRelBearing,
  pushStuckSample,
  STUCK_DEFAULTS,
} from "../src/world/stuck-core";
import type { ScannedObjectCore } from "../src/world/scanner-core";

const ORIGIN = { x: 0, y: 0, z: 0 };

function sample(overrides: Partial<StuckSample> = {}): StuckSample {
  return {
    tMs: 0,
    pos: ORIGIN,
    keysHeld: true,
    excluded: false,
    ...overrides,
  };
}

describe("evaluateStuck (their blocked_stop machine, detect-and-report)", () => {
  it("is stuck: keys held, <8u over the window, 0.5s confirmed", () => {
    const history = [
      sample({ tMs: 0, pos: ORIGIN }),
      sample({ tMs: 500, pos: { x: 3, y: 0, z: 0 } }),
      sample({ tMs: 1000, pos: { x: 5, y: 0, z: 0 } }),
    ];
    const result = evaluateStuck(history, 1000);
    expect(result.stuck).toBe(true);
    expect(result.confirmMs).toBeGreaterThanOrEqual(STUCK_DEFAULTS.confirmMs);
  });

  it("is not stuck when the player actually moved (≥8u)", () => {
    const history = [
      sample({ tMs: 0, pos: ORIGIN }),
      sample({ tMs: 1000, pos: { x: 40, y: 0, z: 0 } }),
    ];
    expect(evaluateStuck(history, 1000).stuck).toBe(false);
  });

  it("is not stuck without held movement keys", () => {
    const history = [
      sample({ tMs: 0 }),
      sample({ tMs: 1000, keysHeld: false, pos: ORIGIN }),
    ];
    expect(evaluateStuck(history, 1000).stuck).toBe(false);
  });

  it("is not stuck below the ~0.5s confirmation (their spec)", () => {
    const history = [
      sample({ tMs: 0, pos: ORIGIN }),
      sample({ tMs: 300, pos: ORIGIN }),
    ];
    const result = evaluateStuck(history, 300);
    expect(result.stuck).toBe(false);
    expect(result.confirmMs).toBeLessThan(STUCK_DEFAULTS.confirmMs);
  });

  it("an excluded tick (menu blip, swim) resets the confirmation", () => {
    const history = [
      sample({ tMs: 0, pos: ORIGIN }),
      sample({ tMs: 500, excluded: true, pos: ORIGIN }),
      sample({ tMs: 1000, pos: ORIGIN }),
    ];
    expect(evaluateStuck(history, 1000).stuck).toBe(false);
  });

  it("empty history is never stuck", () => {
    expect(evaluateStuck([], 1000).stuck).toBe(false);
  });

  it("pushStuckSample prunes old samples", () => {
    const history = [
      sample({ tMs: 0 }),
      sample({ tMs: 1000 }),
      sample({ tMs: 2000 }),
    ];
    const next = pushStuckSample(history, sample({ tMs: 3000 }), 3000);
    expect(next.every((entry) => entry.tMs >= 3000 - STUCK_DEFAULTS.windowMs * 4)).toBe(true);
  });
});

describe("nearestObstacleRelBearing (drives the reflex's turn direction)", () => {
  const objects: ScannedObjectCore[] = [
    { formId: 1, name: "Mur", category: "activator", distance: 120, bearingDeg: 0, relativeDeg: -45, lockLevel: 0, dz: 0, flags: [] },
    { formId: 2, name: "Loin", category: "activator", distance: 900, bearingDeg: 0, relativeDeg: 90, lockLevel: 0, dz: 0, flags: [] },
  ];

  it("returns the nearest in-range object's relative bearing (negative = left)", () => {
    expect(nearestObstacleRelBearing(objects, 500)).toBe(-45);
  });

  it("returns undefined when nothing is in range", () => {
    expect(nearestObstacleRelBearing([objects[1]!], 500)).toBeUndefined();
    expect(nearestObstacleRelBearing([], 500)).toBeUndefined();
  });
});
