import { Game, Actor } from "skyrimPlatform";
import type { PlayerState, EnemyState, CollectedState } from "./types";
import { CONFIG, PLAYER_FORM_ID } from "../config";

function getPlayerPosition(): { x: number; y: number; z: number } | null {
  const player = Game.getPlayer();
  if (!player) return null;
  return {
    x: player.getPositionX(),
    y: player.getPositionY(),
    z: player.getPositionZ()
  };
}

function calculateDistance(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function collectPlayerState(): PlayerState | null {
  const player = Game.getPlayer();
  if (!player) return null;

  const pos = getPlayerPosition();
  if (!pos) return null;

  return {
    health: player.getActorValue("health"),
    maxHealth: player.getBaseActorValue("health"),
    magicka: player.getActorValue("magicka"),
    stamina: player.getActorValue("stamina"),
    level: player.getLevel(),
    position: pos,
    isSneaking: player.isSneaking(),
    isDead: player.isDead()
  };
}

function collectEnemies(): EnemyState[] {
  const player = Game.getPlayer();
  if (!player) return [];

  const playerPos = getPlayerPosition();
  if (!playerPos) return [];

  const seenFormIds = new Set<number>();
  const enemies: EnemyState[] = [];

  // Multi-scan: center + 8 offset positions to find multiple actors
  // Game.findClosestActor() only returns ONE actor, so we scan multiple positions
  const scanOffsets = [
    { x: 0, y: 0 },
    { x: CONFIG.enemyScanRadius, y: 0 },
    { x: -CONFIG.enemyScanRadius, y: 0 },
    { x: 0, y: CONFIG.enemyScanRadius },
    { x: 0, y: -CONFIG.enemyScanRadius },
    { x: CONFIG.enemyScanRadius * 0.707, y: CONFIG.enemyScanRadius * 0.707 },
    { x: -CONFIG.enemyScanRadius * 0.707, y: CONFIG.enemyScanRadius * 0.707 },
    { x: CONFIG.enemyScanRadius * 0.707, y: -CONFIG.enemyScanRadius * 0.707 },
    { x: -CONFIG.enemyScanRadius * 0.707, y: -CONFIG.enemyScanRadius * 0.707 }
  ];

  for (const offset of scanOffsets) {
    if (enemies.length >= CONFIG.maxEnemies) break;

    const scanX = playerPos.x + offset.x;
    const scanY = playerPos.y + offset.y;
    const scanZ = playerPos.z;

    const actor = Game.findClosestActor(scanX, scanY, scanZ, CONFIG.enemyScanRadius);
    if (!actor) continue;

    // Skip player
    if (actor.getFormID() === PLAYER_FORM_ID) continue;

    // Skip dead actors
    if (actor.isDead()) continue;

    // Deduplicate by formId
    const formId = actor.getFormID();
    if (seenFormIds.has(formId)) continue;
    seenFormIds.add(formId);

    const actorPos = {
      x: actor.getPositionX(),
      y: actor.getPositionY(),
      z: actor.getPositionZ()
    };

    const distance = calculateDistance(
      playerPos.x,
      playerPos.y,
      playerPos.z,
      actorPos.x,
      actorPos.y,
      actorPos.z
    );

    const baseObj = actor.getBaseObject();
    const name = baseObj ? baseObj.getName() || "Unknown" : "Unknown";

    enemies.push({
      formId,
      name,
      distance,
      health: actor.getActorValue("health"),
      level: actor.getLevel(),
      animation: ""
    });
  }

  return enemies;
}

export function collectPlayerStateExport(): PlayerState | null {
  return collectPlayerState();
}

export function collectEnemiesExport(): EnemyState[] {
  return collectEnemies();
}

export function collectFullState(
  playerAnimation: string = "",
  eventType: string = "tick"
): CollectedState | null {
  const player = collectPlayerState();
  if (!player) return null;

  const combatState = Game.getPlayer()?.getCombatState() ?? 0;
  const enemies = collectEnemies();

  return {
    player,
    combatState,
    enemies,
    playerAnimation,
    eventType
  };
}
