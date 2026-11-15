import { Game } from "../skyrimPlatform";
import type {
  PlayerState,
  EnemyState,
  CollectedState,
  EventType,
  FullCollectedState,
  NearbyNpcState,
} from "./types";
import { CONFIG } from "../config";
import { collectNearbyNpcs } from "./collectors/nearby-collector";
import { collectPlayerFullState } from "./collectors/player-collector";
import { collectLocationState } from "./collectors/location-collector";
import { collectQuestState } from "./collectors/quest-collector";
import { collectCrosshairTarget } from "./collectors/crosshair-collector";

function collectPlayerState(): PlayerState | null {
  const player = Game.getPlayer();
  if (!player) return null;

  return {
    health: player.getActorValue("health"),
    maxHealth: player.getBaseActorValue("health"),
    magicka: player.getActorValue("magicka"),
    stamina: player.getActorValue("stamina"),
    level: player.getLevel(),
    position: {
      x: player.getPositionX(),
      y: player.getPositionY(),
      z: player.getPositionZ(),
    },
    isSneaking: player.isSneaking(),
    isDead: player.isDead(),
  };
}

function enemiesFromNearby(npcs: NearbyNpcState[]): EnemyState[] {
  return npcs
    .filter((npc) => !npc.isDead && npc.isHostile)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, CONFIG.maxEnemies)
    .map((npc) => ({
      formId: npc.formId,
      name: npc.name,
      distance: npc.distance,
      health: npc.health,
      level: npc.level,
    }));
}

function safeCall<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export interface CollectionBundle {
  protocol: CollectedState;
  snapshot: FullCollectedState;
}

/**
 * One collection pass per send: protocol-v1 payload (reflex + dashboard) and
 * the rich snapshot (Gate/Composer mod-context dump) share the nearby-NPC scan.
 */
export function collectBundle(
  playerAnimation: string = "",
  eventType: EventType = "tick",
): CollectionBundle | null {
  const player = collectPlayerState();
  if (!player) return null;

  const nearbyNpcs = safeCall(collectNearbyNpcs) ?? [];
  const combatState = Game.getPlayer()?.getCombatState() ?? 0;

  return {
    protocol: {
      player,
      combatState,
      enemies: enemiesFromNearby(nearbyNpcs),
      playerAnimation,
      eventType,
    },
    snapshot: {
      player: safeCall(collectPlayerFullState),
      nearbyNpcs,
      crosshairTarget: safeCall(collectCrosshairTarget),
      location: safeCall(collectLocationState),
      quest: safeCall(collectQuestState),
      input: null,
      menu: null,
      environment: null,
      eventType,
    },
  };
}

export function collectFullState(
  playerAnimation: string = "",
  eventType: EventType = "tick",
): CollectedState | null {
  return collectBundle(playerAnimation, eventType)?.protocol ?? null;
}
