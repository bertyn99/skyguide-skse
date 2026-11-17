import type { FullCollectedState, NearbyNpcState } from "./types";

/**
 * Parallel-array dump matching skydive-app `parseSkyrimState`
 * (`server/utils/skyrim-state-parser.ts`). The Gate/Composer read this via
 * SkyrimFileConnector — they do NOT see the HTTP protocol-v1 payload.
 *
 * Distance conversion: 70 Skyrim units ≈ 1 meter (community convention).
 *
 * Dump schema version 2 (ADR: skydive-app/docs/adr/0003-state-channels.md):
 *  - `dump.timestamp` (float, ms epoch) — the app drops context older than
 *    ~10s so a quit game cannot whisper stale state into Gemini forever;
 *  - `world.objects.*` parallel arrays from the world scanner (always push
 *    every array in lock-step — lengths must never desync).
 */

const UNITS_PER_METER = 70;
const OBSTACLE_FRONT_UNITS = 150;
const DUMP_VERSION = 2;

export interface ModContextDump {
  float: Record<string, number>;
  int: Record<string, number>;
  string: Record<string, string>;
  floatList: Record<string, number[]>;
  stringList: Record<string, string[]>;
}

function compassFromAngleZ(angleZ: number): string {
  const dirs = [
    "Nord",
    "Nord-Est",
    "Est",
    "Sud-Est",
    "Sud",
    "Sud-Ouest",
    "Ouest",
    "Nord-Ouest",
  ];
  const normalized = ((angleZ % 360) + 360) % 360;
  return dirs[Math.round(normalized / 45) % 8];
}

function clockFromHeadingAngle(headingAngle: number): string {
  const normalized = ((headingAngle % 360) + 360) % 360;
  const hour = Math.round(normalized / 30) % 12;
  return `${hour === 0 ? 12 : hour}h`;
}

function flag(value: boolean | undefined | null): number {
  return value ? 1 : 0;
}

export function buildModContext(
  snapshot: FullCollectedState,
  protocol: {
    player: { health: number; maxHealth: number; magicka: number; stamina: number; isSneaking: boolean; isDead: boolean };
    combatState: number;
  },
  options?: {
    /** Coexistence flag from game-state/skyrim-access.ts (game-only probe). */
    skyrimAccessInstalled?: boolean;
  },
): ModContextDump {
  const floats: Record<string, number> = {
    "player.health": protocol.player.health,
    "player.health_max": protocol.player.maxHealth,
    "player.magicka": protocol.player.magicka,
    "player.stamina": protocol.player.stamina,
  };

  const ints: Record<string, number> = {
    "player.is_in_interior": flag(snapshot.location?.isInterior),
    "player.in_combat": flag(protocol.combatState > 0 || snapshot.player?.combat.isInCombat),
    "player.in_dialogue": flag(snapshot.nearbyNpcs.some((n) => n.isInDialogue)),
    "player.is_running": flag(snapshot.player?.movement.isRunning),
    "player.is_sneaking": flag(protocol.player.isSneaking || snapshot.player?.movement.isSneaking),
    "player.is_swimming": flag(snapshot.player?.movement.isSwimming),
    "player.is_weapon_drawn": flag(snapshot.player?.combat.isWeaponDrawn),
    "player.is_stuck": 0,
    "player.obstacle_front": flag(
      snapshot.crosshairTarget !== null &&
        snapshot.crosshairTarget.distance <= OBSTACLE_FRONT_UNITS &&
        snapshot.crosshairTarget.type !== "NPC",
    ),
  };

  const strings: Record<string, string> = {};
  const locationName = snapshot.location?.locationName || snapshot.location?.cellName;
  if (locationName) strings["player.location"] = locationName;
  if (snapshot.player) {
    strings["player.compass"] = compassFromAngleZ(snapshot.player.heading.angleZ);
  }
  if (snapshot.quest?.questName) strings["quest_active"] = snapshot.quest.questName;

  // Coexistence flag (W2): when their ESP is present, the app suppresses
  // object/radar narration (they own those channels) but keeps tactical
  // reflex — see docs/ACCESSIBILITY.md §4 and ADR 0003. Injected by the
  // caller (game probe) so this builder stays pure for tests.
  ints["skyrim_access.installed"] = flag(options?.skyrimAccessInstalled ?? false);

  const living = snapshot.nearbyNpcs
    .filter((npc) => !npc.isDead)
    .slice()
    .sort((a, b) => a.distance - b.distance);

  const hostiles = living.filter((npc) => npc.isHostile);
  ints["enemies.count"] = hostiles.length;
  ints["npcs.count"] = living.length;

  // World scanner output (v2). Atomic pushes: every world.objects.* array
  // is written from the same objects list so parallel-array lengths stay
  // in lock-step. (count lives in the ints map below.)
  const objects = snapshot.worldObjects ?? [];
  const objectNames: string[] = [];
  const objectCategories: string[] = [];
  const objectFlags: string[] = [];
  const objectCompass: string[] = [];
  const objectDistanceM: number[] = [];
  const objectDistanceU: number[] = [];
  const objectId: number[] = [];
  const objectBearing: number[] = [];
  const objectLockLevel: number[] = [];
  const objectDz: number[] = [];
  for (const object of objects) {
    objectNames.push(object.name);
    objectCategories.push(object.category);
    objectFlags.push(object.flags.join("|"));
    objectCompass.push(compassFromAngleZ(object.bearingDeg));
    objectDistanceM.push(object.distance / UNITS_PER_METER);
    objectDistanceU.push(object.distance);
    objectId.push(object.formId);
    objectBearing.push(object.bearingDeg);
    objectLockLevel.push(object.lockLevel);
    objectDz.push(object.dz);
  }

  const inventory = snapshot.inventoryItems ?? [];
  const floatList: Record<string, number[]> = {
    "npcs.distance_m": living.map((npc) => npc.distance / UNITS_PER_METER),
    "world.objects.distance_m": objectDistanceM,
    "world.objects.distance_u": objectDistanceU,
    "world.objects.form_id": objectId,
    "world.objects.bearing_deg": objectBearing,
    "world.objects.lock_level": objectLockLevel,
    "world.objects.dz": objectDz,
  };
  const stringList: Record<string, string[]> = {
    "npcs.name": living.map((npc) => npc.name),
    "npcs.clock": living.map((npc: NearbyNpcState) => clockFromHeadingAngle(npc.headingAngle)),
    "world.objects.name": objectNames,
    "world.objects.category": objectCategories,
    "world.objects.flags": objectFlags,
    "world.objects.compass": objectCompass,
    // Active player effects (W4) — sorted, deduped by the tracker.
    "effects.active": snapshot.effects ?? [],
  };
  if (inventory.length > 0) {
    ints["inventory.size"] = inventory.length;
    floatList["inventory.count"] = inventory.map((row) => row.count);
    floatList["inventory.form_id"] = inventory.map((row) => row.formId);
    stringList["inventory.name"] = inventory.map((row) => row.name);
  }

  return {
    float: {
      ...floats,
      "dump.timestamp": Date.now(),
    },
    int: {
      ...ints,
      "dump.version": DUMP_VERSION,
      "world.objects.count": objects.length,
    },
    string: strings,
    floatList,
    stringList,
  };
}
