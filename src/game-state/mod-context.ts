import type { FullCollectedState, NearbyNpcState } from "./types";

/**
 * Parallel-array dump matching skydive-app `parseSkyrimState`
 * (`server/utils/skyrim-state-parser.ts`). The Gate/Composer read this via
 * SkyrimFileConnector — they do NOT see the HTTP protocol-v1 payload.
 *
 * Distance conversion: 70 Skyrim units ≈ 1 meter (community convention).
 */

const UNITS_PER_METER = 70;
const OBSTACLE_FRONT_UNITS = 150;

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

  const living = snapshot.nearbyNpcs
    .filter((npc) => !npc.isDead)
    .slice()
    .sort((a, b) => a.distance - b.distance);

  const hostiles = living.filter((npc) => npc.isHostile);
  ints["enemies.count"] = hostiles.length;
  ints["npcs.count"] = living.length;

  return {
    float: floats,
    int: ints,
    string: strings,
    floatList: {
      "npcs.distance_m": living.map((npc) => npc.distance / UNITS_PER_METER),
    },
    stringList: {
      "npcs.name": living.map((npc) => npc.name),
      "npcs.clock": living.map((npc: NearbyNpcState) => clockFromHeadingAngle(npc.headingAngle)),
    },
  };
}
