import { Game } from "skyrimPlatform";
import { CONFIG, PLAYER_FORM_ID } from "../../config";
import type { NearbyNpcState } from "../types";

function getPlayerPosition(): { x: number; y: number; z: number } | null {
  const player = Game.getPlayer();
  if (!player) return null;

  return {
    x: player.getPositionX(),
    y: player.getPositionY(),
    z: player.getPositionZ(),
  };
}

function calculateDistance(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function collectNearbyNpcs(): NearbyNpcState[] {
  const player = Game.getPlayer();
  if (!player) return [];

  const playerPos = getPlayerPosition();
  if (!playerPos) return [];

  const scanOffsets = [
    { x: 0, y: 0 },
    { x: CONFIG.enemyScanRadius, y: 0 },
    { x: -CONFIG.enemyScanRadius, y: 0 },
    { x: 0, y: CONFIG.enemyScanRadius },
    { x: 0, y: -CONFIG.enemyScanRadius },
    { x: CONFIG.enemyScanRadius * 0.707, y: CONFIG.enemyScanRadius * 0.707 },
    { x: -CONFIG.enemyScanRadius * 0.707, y: CONFIG.enemyScanRadius * 0.707 },
    { x: CONFIG.enemyScanRadius * 0.707, y: -CONFIG.enemyScanRadius * 0.707 },
    { x: -CONFIG.enemyScanRadius * 0.707, y: -CONFIG.enemyScanRadius * 0.707 },
  ];

  const seenFormIds = new Set<number>();
  const nearbyNpcs: NearbyNpcState[] = [];

  for (const offset of scanOffsets) {
    if (nearbyNpcs.length >= CONFIG.maxEnemies) break;

    const scanX = playerPos.x + offset.x;
    const scanY = playerPos.y + offset.y;
    const scanZ = playerPos.z;
    const actor = Game.findClosestActor(scanX, scanY, scanZ, CONFIG.enemyScanRadius);

    if (!actor) continue;

    const formId = actor.getFormID();
    if (formId === PLAYER_FORM_ID) continue;
    if (seenFormIds.has(formId)) continue;
    seenFormIds.add(formId);

    const actorPos = {
      x: actor.getPositionX(),
      y: actor.getPositionY(),
      z: actor.getPositionZ(),
    };

    const distance = calculateDistance(
      playerPos.x,
      playerPos.y,
      playerPos.z,
      actorPos.x,
      actorPos.y,
      actorPos.z,
    );

    const baseObj = actor.getBaseObject();
    const name = baseObj?.getName() || "Unknown";
    const health = actor.getActorValue("health");

    let level = 0;
    try {
      level = actor.getLevel();
    } catch {
      level = 0;
    }

    let race: string | null = null;
    try {
      race = actor.getRace()?.getName() ?? null;
    } catch {
      race = null;
    }

    let isHostile = false;
    try {
      isHostile = actor.isHostileToActor(player);
    } catch {
      isHostile = false;
    }

    let isAlly = false;
    try {
      isAlly = actor.isPlayerTeammate();
    } catch {
      isAlly = false;
    }

    let isGuard = false;
    try {
      isGuard = actor.isGuard();
    } catch {
      isGuard = false;
    }

    const isMerchant = false;

    let isInDialogue = false;
    try {
      isInDialogue = actor.isInDialogueWithPlayer();
    } catch {
      isInDialogue = false;
    }

    let hasLOS = false;
    try {
      hasLOS = actor.hasLOS(player);
    } catch {
      hasLOS = false;
    }

    let isDetected = false;
    try {
      isDetected = actor.isDetectedBy(player);
    } catch {
      isDetected = false;
    }

    let relationshipRank = 0;
    try {
      relationshipRank = actor.getRelationshipRank(player);
    } catch {
      relationshipRank = 0;
    }

    let isDead = false;
    try {
      isDead = actor.isDead();
    } catch {
      isDead = false;
    }

    nearbyNpcs.push({
      formId,
      name,
      distance,
      health,
      level,
      race,
      isHostile,
      isAlly,
      isGuard,
      isMerchant,
      isInDialogue,
      isDetected,
      hasLOS,
      relationshipRank,
      isDead,
    });
  }

  return nearbyNpcs;
}
