import { describe, expect, it } from "vitest";
import { buildModContext } from "../src/game-state/mod-context";
import type { FullCollectedState } from "../src/game-state/types";
import type { ScannedObjectCore } from "../src/world/scanner-core";
import fixture from "./fixtures/dump-v2.json";

/**
 * The dump contract in executable form: the same `fixtures/dump-v2.json`
 * shape is asserted by skydive-app's parser tests. Keep both files identical
 * when the contract changes (see skydive-app/docs/adr/0003-state-channels.md).
 */

const OBJECTS: ScannedObjectCore[] = [
  { formId: 0xff003, name: "Bandit", category: "npc", distance: 156.5, bearingDeg: 315, relativeDeg: 45, lockLevel: 0, dz: 70, flags: ["corpse"] },
  { formId: 0xff001, name: "Coffre", category: "container", distance: 560, bearingDeg: 10, relativeDeg: 45, lockLevel: 25, dz: 0, flags: ["locked"] },
  { formId: 0xff002, name: "Porte", category: "door", distance: 980, bearingDeg: 90, relativeDeg: -90, lockLevel: 0, dz: 0, flags: [] },
  { formId: 0xff004, name: "Souche", category: "flora", distance: 1260, bearingDeg: 270, relativeDeg: 180, lockLevel: 0, dz: -20, flags: ["harvested"] },
];

const SNAPSHOT: FullCollectedState = {
  player: {
    heading: { angleX: 0, angleY: 0, angleZ: 10 },
    equipment: { weaponName: null, weaponSlot: 0, armorSlots: {}, shoutName: null, spellName: null },
    combat: { isInCombat: false, combatTargetName: null, isBlocking: false, isWeaponDrawn: true },
    movement: {
      isRunning: true,
      isSprinting: false,
      isSwimming: false,
      isSneaking: false,
      isOnMount: false,
      isOverEncumbered: false,
      sitState: 0,
      sleepState: 0,
    },
    goldAmount: 250,
    carryWeight: 300,
    inventoryWeight: 95,
    magickaPercentage: 0.4,
    staminaPercentage: 0.85,
  },
  nearbyNpcs: [],
  worldObjects: OBJECTS,
  crosshairTarget: null,
  location: { locationName: "Whiterun", isInterior: false, cellName: "WhiterunExterior01", worldspaceName: "Tamriel" },
  quest: { questName: "Bleak Falls Barrow", editorId: "MQ02", currentStage: 10, objectives: [] },
  input: null,
  menu: null,
  environment: null,
  effects: ["Guérison mineure"],
  inventoryItems: [],
  eventType: "tick",
};

const PROTOCOL = {
  player: { health: 80, maxHealth: 100, magicka: 50, stamina: 90, isSneaking: false, isDead: false },
  combatState: 0,
};

describe("buildModContext dump contract (v2)", () => {
  const dump = buildModContext(SNAPSHOT, PROTOCOL, { skyrimAccessInstalled: false });

  it("stamps the dump with a version and an epoch timestamp", () => {
    expect(dump.int["dump.version"]).toBe(2);
    expect(typeof dump.float["dump.timestamp"]).toBe("number");
    expect(dump.float["dump.timestamp"]).toBeGreaterThan(1_700_000_000_000);
  });

  it("emits world.objects.* parallel arrays in lock-step", () => {
    expect(dump.int["world.objects.count"]).toBe(4);
    const lengths = [
      dump.stringList["world.objects.name"]!.length,
      dump.stringList["world.objects.category"]!.length,
      dump.stringList["world.objects.flags"]!.length,
      dump.stringList["world.objects.compass"]!.length,
      dump.floatList["world.objects.distance_m"]!.length,
      dump.floatList["world.objects.distance_u"]!.length,
      dump.floatList["world.objects.form_id"]!.length,
      dump.floatList["world.objects.bearing_deg"]!.length,
      dump.floatList["world.objects.lock_level"]!.length,
      dump.floatList["world.objects.dz"]!.length,
    ];
    expect(new Set(lengths).size).toBe(1);
    expect(lengths[0]).toBe(4);
  });

  it("matches the shared fixture key set exactly", () => {
    // `dump.timestamp` is volatile by design and stays out of the fixture —
    // its presence is asserted above.
    const actualKeys = {
      float: Object.keys(dump.float).filter((k) => k !== "dump.timestamp").sort(),
      int: Object.keys(dump.int).sort(),
      floatList: Object.keys(dump.floatList).sort(),
      stringList: Object.keys(dump.stringList).sort(),
    };
    const fixtureKeys = {
      float: Object.keys(fixture.float).sort(),
      int: Object.keys(fixture.int).sort(),
      floatList: Object.keys(fixture.floatList).sort(),
      stringList: Object.keys(fixture.stringList).sort(),
    };
    expect(actualKeys).toEqual(fixtureKeys);
  });

  it("converts units to meters (70u = 1m) and renders the compass", () => {
    const nameIndex = dump.stringList["world.objects.name"]!.indexOf("Coffre");
    expect(nameIndex).toBe(1); // snapshot order preserved (no re-sort in the builder)
    expect(dump.floatList["world.objects.distance_u"]![nameIndex]).toBe(560);
    expect(dump.floatList["world.objects.distance_m"]![nameIndex]).toBeCloseTo(8, 5);
    expect(dump.stringList["world.objects.compass"]![nameIndex]).toBe("Nord");
    expect(dump.stringList["world.objects.flags"]![nameIndex]).toBe("locked");
  });

  it("keeps the legacy npcs.* channels untouched", () => {
    expect(dump.int["npcs.count"]).toBe(0);
    expect(dump.floatList["npcs.distance_m"]).toEqual([]);
  });

  it("omits inventory.* when the bag is empty (absent = feature off)", () => {
    expect(dump.int["inventory.size"]).toBeUndefined();
    expect(dump.stringList["inventory.name"]).toBeUndefined();
  });

  it("emits inventory.* parallel arrays when the menu dump has rows", () => {
    const withBag = buildModContext(
      {
        ...SNAPSHOT,
        inventoryItems: [
          { name: "Iron Sword", count: 1, formId: 0x12eb7 },
          { name: "Potion", count: 4, formId: 0x3eadd },
        ],
      },
      PROTOCOL,
      { skyrimAccessInstalled: false },
    );
    expect(withBag.int["inventory.size"]).toBe(2);
    expect(withBag.stringList["inventory.name"]).toEqual(["Iron Sword", "Potion"]);
    expect(withBag.floatList["inventory.count"]).toEqual([1, 4]);
    expect(withBag.floatList["inventory.form_id"]?.length).toBe(2);
  });
});
