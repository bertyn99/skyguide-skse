import { Game } from "skyrimPlatform";
import type {
  PlayerFullState,
  HeadingState,
  EquipmentState,
  CombatState,
  MovementState,
} from "../types";

function safeNumber(value: number | undefined | null, fallback = 0): number {
  return value ?? fallback;
}

function safeString(
  value: string | undefined | null,
): string | null {
  return value ?? null;
}

function collectHeading(): HeadingState {
  const player = Game.getPlayer();
  if (!player) {
    return { angleX: 0, angleY: 0, angleZ: 0, headingAngle: 0 };
  }

  return {
    angleX: safeNumber(player.getAngleX()),
    angleY: safeNumber(player.getAngleY()),
    angleZ: safeNumber(player.getAngleZ()),
    headingAngle: safeNumber(player.getHeadingAngle()),
  };
}

function collectMovement(): MovementState {
  const player = Game.getPlayer();
  if (!player) {
    return {
      isRunning: false,
      isSprinting: false,
      isSwimming: false,
      isSneaking: false,
      isOnMount: false,
      isOverEncumbered: false,
      sitState: 0,
      sleepState: 0,
    };
  }

  return {
    isRunning: player.isRunning(),
    isSprinting: player.isSprinting(),
    isSwimming: player.isSwimming(),
    isSneaking: player.isSneaking(),
    isOnMount: player.isOnMount(),
    isOverEncumbered: player.isOverEncumbered(),
    sitState: safeNumber(player.getSitState()),
    sleepState: safeNumber(player.getSleepState()),
  };
}

function collectCombat(): CombatState {
  const player = Game.getPlayer();
  if (!player) {
    return {
      isInCombat: false,
      combatTargetName: null,
      isBlocking: false,
      isWeaponDrawn: false,
    };
  }

  let combatTargetName: string | null = null;
  try {
    const target = player.getCombatTarget();
    if (target) {
      const base = target.getBaseObject();
      combatTargetName = safeString(base?.getName());
    }
  } catch {
    combatTargetName = null;
  }

  let isBlocking = false;
  try {
    isBlocking = player.getAnimationVariableBool("IsBlocking");
  } catch {
    isBlocking = false;
  }

  return {
    isInCombat: player.isInCombat(),
    combatTargetName,
    isBlocking,
    isWeaponDrawn: player.isWeaponDrawn(),
  };
}

function collectEquipment(): EquipmentState {
  const player = Game.getPlayer();
  if (!player) {
    return {
      weaponName: null,
      weaponSlot: 0,
      armorSlots: {},
      shoutName: null,
      spellName: null,
    };
  }

  let weaponName: string | null = null;
  try {
    const weapon = player.getEquippedWeapon(false);
    weaponName = safeString(weapon?.getName());
  } catch {
    weaponName = null;
  }

  let shoutName: string | null = null;
  try {
    const shout = player.getEquippedShout();
    shoutName = safeString(shout?.getName());
  } catch {
    shoutName = null;
  }

  let spellName: string | null = null;
  try {
    const spell = player.getEquippedSpell(0);
    spellName = safeString(spell?.getName());
  } catch {
    spellName = null;
  }

  return {
    weaponName,
    weaponSlot: 0,
    armorSlots: {},
    shoutName,
    spellName,
  };
}

export function collectPlayerFullState(): PlayerFullState | null {
  const player = Game.getPlayer();
  if (!player) return null;

  return {
    heading: collectHeading(),
    movement: collectMovement(),
    combat: collectCombat(),
    equipment: collectEquipment(),
    goldAmount: safeNumber(player.getGoldAmount()),
    carryWeight: safeNumber(player.getActorValue("CarryWeight")),
    inventoryWeight: safeNumber(player.getActorValue("InventoryWeight")),
    magickaPercentage: safeNumber(player.getActorValuePercentage("magicka")),
    staminaPercentage: safeNumber(player.getActorValuePercentage("stamina")),
  };
}
