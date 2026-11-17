import { describe, expect, it } from "vitest";
import {
  FORM_TYPE,
  SCAN_DEFAULTS,
  assembleFlags,
  absoluteBearingDeg,
  classifyCategory,
  distanceUnits,
  finalizeCandidates,
  isScanCacheStale,
  isOpenState,
  relativeBearingDeg,
  type CandidateInput,
  type Position3,
} from "../src/world/scanner-core";
import { computeUiFlags } from "../src/game-state/menu-state";

const ORIGIN: Position3 = { x: 0, y: 0, z: 0 };

function candidate(overrides: Partial<CandidateInput> = {}): CandidateInput {
  return {
    formId: 0xff001,
    name: "Coffre",
    formType: FORM_TYPE.container,
    x: 700,
    y: 0,
    z: 0,
    isLocked: false,
    lockLevel: 0,
    numItems: null,
    openState: null,
    isDead: false,
    isHarvested: false,
    isLooted: false,
    ...overrides,
  };
}

describe("classifyCategory", () => {
  it("maps the allowlisted FormType values (from the installed typings, not the crosshair table)", () => {
    expect(classifyCategory(62)).toBe("npc");
    expect(classifyCategory(29)).toBe("door");
    expect(classifyCategory(28)).toBe("container");
    expect(classifyCategory(24)).toBe("activator");
    expect(classifyCategory(39)).toBe("flora");
    expect(classifyCategory(40)).toBe("furniture");
    expect(classifyCategory(26)).toBe("other"); // Armor — NOT "flora"
    expect(classifyCategory(27)).toBe("other"); // Book — NOT "key"
  });
});

describe("assembleFlags", () => {
  it("flags locked containers with the lock level kept apart", () => {
    const flags = assembleFlags({ formType: FORM_TYPE.container, isLocked: true, numItems: 3, openState: null, isDead: false, isHarvested: false, isLooted: false });
    expect(flags).toEqual(["locked"]);
  });

  it("flags a 3D-loaded empty container as empty", () => {
    const flags = assembleFlags({ formType: FORM_TYPE.container, isLocked: false, numItems: 0, openState: null, isDead: false, isHarvested: false, isLooted: false });
    expect(flags).toEqual(["empty"]);
  });

  it("flags a searched container as looted — even when empty", () => {
    expect(assembleFlags({ formType: FORM_TYPE.container, isLocked: false, numItems: 0, openState: null, isDead: false, isHarvested: false, isLooted: true })).toEqual(["empty", "looted"]);
    expect(assembleFlags({ formType: FORM_TYPE.container, isLocked: false, numItems: 2, openState: null, isDead: false, isHarvested: false, isLooted: true })).toEqual(["looted"]);
  });

  it("does not flag an empty door as empty", () => {
    const flags = assembleFlags({ formType: FORM_TYPE.door, isLocked: false, numItems: 0, openState: null, isDead: false, isHarvested: false, isLooted: false });
    expect(flags).toEqual([]);
  });

  it("flags corpses, open doors and harvested flora", () => {
    expect(assembleFlags({ formType: FORM_TYPE.character, isLocked: false, numItems: null, openState: null, isDead: true, isHarvested: false, isLooted: false })).toEqual(["corpse"]);
    expect(assembleFlags({ formType: FORM_TYPE.door, isLocked: false, numItems: null, openState: 2, isDead: false, isHarvested: false, isLooted: false })).toEqual(["open"]);
    expect(assembleFlags({ formType: FORM_TYPE.flora, isLocked: false, numItems: null, openState: null, isDead: false, isHarvested: true, isLooted: false })).toEqual(["harvested"]);
    expect(isOpenState(3)).toBe(false);
    expect(isOpenState(0)).toBe(false);
  });
});

describe("bearings", () => {
  it("absolute bearing: 0 north, 90 east, 180 south, 270 west (finalize normalizes to 0..360)", () => {
    expect(absoluteBearingDeg(0, 1)).toBeCloseTo(0);
    expect(absoluteBearingDeg(1, 0)).toBeCloseTo(90);
    expect(absoluteBearingDeg(0, -1)).toBeCloseTo(180);
    const west = (absoluteBearingDeg(-1, 0) % 360 + 360) % 360;
    expect(west).toBeCloseTo(270);
  });

  it("relative bearing wraps to -180..180", () => {
    expect(relativeBearingDeg(10, 0)).toBe(10);
    expect(relativeBearingDeg(0, 350)).toBe(10);
    expect(relativeBearingDeg(0, 10)).toBe(-10);
    expect(Math.abs(relativeBearingDeg(180, 0))).toBe(180); // ±180 edge
    expect(Math.abs(relativeBearingDeg(270, 90))).toBe(180);
  });
});

describe("cache invalidation (their RESCAN_DISTANCE)", () => {
  const cells = [60, 61];
  const cache = { pos: { x: 0, y: 0, z: 0 }, cellIds: cells };

  it("is fresh when the player barely moved in the same cells", () => {
    expect(isScanCacheStale(cache, { pos: { x: 99, y: 0, z: 0 }, cellIds: cells }, 100)).toBe(false);
  });

  it("goes stale at >= the rescan distance", () => {
    expect(isScanCacheStale(cache, { pos: { x: 100, y: 0, z: 0 }, cellIds: cells }, 100)).toBe(true);
  });

  it("goes stale on any cell-set change (same total count, different ids)", () => {
    expect(isScanCacheStale(cache, { pos: { x: 0, y: 0, z: 0 }, cellIds: [60, 62] }, 100)).toBe(true);
    expect(isScanCacheStale(cache, { pos: { x: 0, y: 0, z: 0 }, cellIds: [60] }, 100)).toBe(true);
  });
});

describe("finalizeCandidates", () => {
  it("sorts nearest-first, caps output, and derives distance/bearing/dz", () => {
    const far = candidate({ formId: 0xff002, name: "Porte", formType: FORM_TYPE.door, x: 0, y: 2000, z: 0, openState: 3, isLocked: true, lockLevel: 25 });
    const near = candidate({ formId: 0xff003, name: "Bandit", formType: FORM_TYPE.character, x: 140, y: 0, z: 70, isDead: true });
    const objects = finalizeCandidates([far, near], ORIGIN, 0, 8);
    expect(objects).toHaveLength(2);
    expect(objects[0]!.name).toBe("Bandit");
    expect(objects[0]!.distance).toBeCloseTo(distanceUnits(140, 0, 70));
    expect(objects[0]!.bearingDeg).toBeCloseTo(90);
    expect(objects[0]!.flags).toEqual(["corpse"]);
    expect(objects[1]!.bearingDeg).toBeCloseTo(0);
    expect(objects[1]!.flags).toEqual(["locked"]); // openState 3 = closed → no "open" flag
    expect(objects[1]!.lockLevel).toBe(25);
  });

  it("caps to maxOutput after sorting", () => {
    const many = Array.from({ length: 10 }, (_, i) => candidate({ formId: 0x100 + i, x: (i + 1) * 100, y: 0, z: 0 }));
    expect(finalizeCandidates(many, ORIGIN, 0, 3)).toHaveLength(3);
    expect(finalizeCandidates(many, ORIGIN, 0, 3)[2]!.formId).toBe(0x102); // third-nearest
  });

  it("respects the sweep radius default", () => {
    // 5000u away — beyond SCAN_DEFAULTS.radiusUnits, the glue never collects it,
    // but finalize itself must still be safe (no radius filter here).
    const objects = finalizeCandidates([candidate({ x: 0, y: 5000, z: 0 })], ORIGIN, 0);
    expect(objects).toHaveLength(1);
    expect(SCAN_DEFAULTS.radiusUnits).toBeGreaterThan(1500); // radar needs headroom
  });
});

describe("computeUiFlags (denylist — HUD never counts)", () => {
  it("ignores always-on HUD menus", () => {
    const ui = computeUiFlags(["HUD Menu", "Fader Menu", "Cursor Menu", "Mist Menu"]);
    expect(ui).toEqual({ menuOpen: false, consoleOpen: false });
  });

  it("flags gameplay-blocking menus and the console", () => {
    expect(computeUiFlags(["InventoryMenu"])).toEqual({ menuOpen: true, consoleOpen: false });
    expect(computeUiFlags(["HUD Menu", "Console"])).toEqual({ menuOpen: true, consoleOpen: true });
    expect(computeUiFlags(["Loading Menu"])).toEqual({ menuOpen: true, consoleOpen: false });
  });
});
