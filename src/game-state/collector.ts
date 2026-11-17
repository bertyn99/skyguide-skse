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
import { collectInputState } from "./collectors/input-collector";
import { collectMenuState } from "./collectors/menu-collector";
import { collectEnvironmentState } from "./collectors/environment-collector";
import { getWorldObjects } from "./collectors/world-scanner";
import { evaluateStuckNow } from "../world/stuck-detection";
import { autowalkInputTick, getNavigationStatus } from "../world/autowalk";
import { collectActiveEffects } from "./collectors/effects-tracker";
import { computeUiFlags } from "./menu-state";
import { getOpenMenus } from "../events";
import { peekMenuFocus } from "./collectors/menu-focus";
import { takeItemEvent } from "./collectors/item-events";
import { collectInventoryDump } from "./collectors/inventory-collector";

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
  const worldObjects = safeCall(getWorldObjects) ?? [];
  const combatState = Game.getPlayer()?.getCombatState() ?? 0;
  const playerFull = safeCall(collectPlayerFullState);
  const inputState = safeCall(collectInputState);
  const menuState = safeCall(collectMenuState);
  const uiFlags = computeUiFlags(getOpenMenus());
  const menuFocus = peekMenuFocus() ?? takeItemEvent() ?? undefined;
  const inventoryItems = safeCall(collectInventoryDump) ?? [];

  // Stuck detection (W3): consumes already-collected data — zero extra
  // Papyrus probes. `excluded` resets the confirmation window.
  const stuckEval = evaluateStuckNow({
    pos: player.position,
    keysPressed: inputState?.keysPressed ?? [],
    gameMs: Date.now(),
    excluded:
      uiFlags.menuOpen ||
      player.isDead ||
      (playerFull?.movement.isSwimming ?? false) ||
      (playerFull?.movement.isOnMount ?? false) ||
      ((playerFull?.movement.sitState ?? 0) > 0) ||
      nearbyNpcs.some((npc) => npc.isInDialogue),
    worldObjects,
  });

  // Autowalk WASD cancel watch (W6): any movement key during a walk cancels.
  autowalkInputTick(inputState?.keysPressed ?? [], uiFlags.menuOpen || player.isDead);

  return {
    protocol: {
      player,
      combatState,
      enemies: enemiesFromNearby(nearbyNpcs),
      playerAnimation,
      eventType,
      // Fast-lane extensions (protocol v1 additive).
      headingAngleZ: playerFull?.heading.angleZ,
      isStuck: stuckEval.stuck,
      stuckRelDeg: stuckEval.bearingRelDeg,
      navigation: { status: getNavigationStatus() },
      ui: uiFlags,
      menu: menuFocus,
    },
    snapshot: {
      player: playerFull,
      nearbyNpcs,
      worldObjects,
      crosshairTarget: safeCall(collectCrosshairTarget),
      location: safeCall(collectLocationState),
      quest: safeCall(collectQuestState),
      input: inputState,
      menu: menuState,
      environment: safeCall(collectEnvironmentState),
      effects: safeCall(collectActiveEffects) ?? [],
      inventoryItems,
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
