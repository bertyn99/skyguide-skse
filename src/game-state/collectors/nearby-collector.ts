import { Actor, FormType, Game } from "../../skyrimPlatform";
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

/**
 * Enumerate loaded actors in the player's cell via Cell.getNumRefs/getNthRef
 * (verified APIs — replaces the old 9-offset findClosestActor scan, which
 * approximated "all nearby actors" by re-searching from offsets).
 * `FormType.Character` (= 62) filters to live actor references.
 */
export function collectNearbyNpcs(): NearbyNpcState[] {
  const player = Game.getPlayer();
  if (!player) return [];

  const playerPos = getPlayerPosition();
  if (!playerPos) return [];

  const cell = player.getParentCell();
  if (!cell) return [];

  let refCount = 0;
  try {
    refCount = cell.getNumRefs(FormType.Character) ?? 0;
  } catch {
    return [];
  }

  const nearbyNpcs: NearbyNpcState[] = [];

  for (let i = 0; i < refCount; i++) {
    if (nearbyNpcs.length >= CONFIG.maxEnemies) break;

    let actorRef: Awaited<ReturnType<typeof cell.getNthRef>> | null = null;
    try {
      actorRef = cell.getNthRef(i, FormType.Character);
    } catch {
      continue;
    }
    if (!actorRef) continue;

    // getNthRef yields ObjectReference; the detail probes below are Actor
    // methods (isHostileToActor, isGuard, ...) — cast via the verified
    // Actor.from helper (ObjectReference extends PapyrusObject).
    const actor = Actor.from(actorRef);
    if (!actor) continue;

    const formId = actor.getFormID();
    if (formId === PLAYER_FORM_ID) continue;

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

    let headingAngle = 0;
    try {
      headingAngle = player.getHeadingAngle(actor);
    } catch {
      headingAngle = 0;
    }

    nearbyNpcs.push({
      formId,
      name,
      distance,
      headingAngle,
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
