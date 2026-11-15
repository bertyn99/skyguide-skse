import {
  Debug,
  DxScanCode,
  FormType,
  Game,
  Input,
  Ui,
  printConsole,
} from "../skyrimPlatform";
import { CONFIG, PLAYER_FORM_ID } from "../config";
import type { ActionCommand } from "./types";
import { setGameTimeout } from "../timers";

type FormLike = {
  isDeleted?: () => boolean;
  isDisabled?: () => boolean;
};

type PositionLike = {
  getPositionX: () => number;
  getPositionY: () => number;
  getPositionZ: () => number;
};

type ActivatableRef = {
  activate: (activator: unknown) => void;
  getFormID?: () => number;
  getFormId?: () => number;
};

function logDebug(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[actions/executor] ${message}`);
  }
}

function isValidForm(form: unknown): boolean {
  if (form === null || form === undefined || typeof form !== "object") {
    return false;
  }

  const candidate = form as FormLike;
  const deleted = typeof candidate.isDeleted === "function" ? candidate.isDeleted() : false;
  const disabled = typeof candidate.isDisabled === "function" ? candidate.isDisabled() : false;
  return !deleted && !disabled;
}

function getReferenceFormId(ref: unknown): number | null {
  if (ref === null || ref === undefined || typeof ref !== "object") {
    return null;
  }

  const candidate = ref as ActivatableRef;

  if (typeof candidate.getFormID === "function") {
    const id = candidate.getFormID();
    return typeof id === "number" ? id : null;
  }

  if (typeof candidate.getFormId === "function") {
    const id = candidate.getFormId();
    return typeof id === "number" ? id : null;
  }

  return null;
}

function isValidReference(ref: unknown): ref is ActivatableRef {
  if (ref === null || ref === undefined || typeof ref !== "object") {
    return false;
  }

  const candidate = ref as ActivatableRef;
  if (typeof candidate.activate !== "function") {
    return false;
  }

  const formId = getReferenceFormId(ref);
  if (formId === null) {
    return false;
  }

  const form = Game.getFormEx(formId);
  return isValidForm(form);
}

function getPlayerPosition(player: PositionLike): { x: number; y: number; z: number } {
  return {
    x: player.getPositionX(),
    y: player.getPositionY(),
    z: player.getPositionZ(),
  };
}

function isActionBlockedByUi(): boolean {
  if (Ui.isMenuOpen("Loading Menu")) {
    logDebug("Action blocked: Loading Menu is open");
    return true;
  }

  if (Ui.isMenuOpen("MessageBoxMenu")) {
    logDebug("Action blocked: MessageBoxMenu is open");
    return true;
  }

  return false;
}

/**
 * Nearest loaded reference of a given form type in the player's cell, found by
 * cell enumeration (Cell.getNumRefs/getNthRef — verified APIs; the old
 * `Game.findClosestReference` call here was NOT a real API). Cell order is not
 * distance-ordered, so we scan and pick the closest valid one.
 */
function getClosestReferenceOfType(
  player: { getParentCell: () => unknown },
  formType: number,
  playerFormId: number,
): unknown | null {
  const cell = player.getParentCell() as
    | { getNumRefs?: (filter: number) => number; getNthRef?: (n: number, filter: number) => unknown }
    | null;
  if (!cell || typeof cell.getNumRefs !== "function" || typeof cell.getNthRef !== "function") {
    return null;
  }

  let count = 0;
  try {
    count = cell.getNumRefs(formType) ?? 0;
  } catch {
    return null;
  }

  let best: unknown = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  let origin: { x: number; y: number; z: number } | null = null;

  for (let i = 0; i < count; i++) {
    const ref = cell.getNthRef(i, formType);
    if (!ref || !isValidReference(ref)) continue;

    const formId = getReferenceFormId(ref);
    if (formId === null || formId === playerFormId) continue;

    if (!origin) {
      origin = getPlayerPosition(player as unknown as PositionLike);
    }
    if (!origin) return null;

    const candidate = ref as unknown as PositionLike;
    const dx = candidate.getPositionX() - origin.x;
    const dy = candidate.getPositionY() - origin.y;
    const dz = candidate.getPositionZ() - origin.z;
    const distance = dx * dx + dy * dy + dz * dz;

    if (distance < bestDistance) {
      bestDistance = distance;
      best = ref;
    }
  }

  return best;
}

function executeSafely(actionType: ActionCommand["type"], operation: () => void): boolean {
  try {
    operation();
    logDebug(`Executed action: ${actionType}`);
    return true;
  } catch (error) {
    logDebug(`Action failed: ${actionType} (${String(error)})`);
    return false;
  }
}

function releaseBlockAfterDelay(delayMs: number): void {
  // Game-loop timer: runs on `update`, so it self-suspends during loading
  // screens instead of releasing into a loading frame like a Node timer could.
  setGameTimeout(() => {
    // @ts-ignore
    Input.releaseKey(DxScanCode.LeftShift);
  }, delayMs);
}

export function executeAction(action: ActionCommand): boolean {
  const player = Game.getPlayer();
  if (!player) {
    logDebug("Action blocked: player is null");
    return false;
  }

  const playerForm = Game.getFormEx(PLAYER_FORM_ID);
  if (!isValidForm(playerForm)) {
    logDebug("Action blocked: player form invalid/deleted/disabled");
    return false;
  }

  if (isActionBlockedByUi()) {
    return false;
  }

  switch (action.type) {
    case "move": {
      return executeSafely(action.type, () => {
        player.setPosition(action.x, action.y, action.z);
      });
    }

    case "face": {
      return executeSafely(action.type, () => {
        player.setAngle(0, 0, action.angle);
      });
    }

    case "activate": {
      const { x, y, z } = getPlayerPosition(player);

      if (action.target === "crosshair") {
        const crosshairRef = Game.getCurrentCrosshairRef();
        if (!isValidReference(crosshairRef)) {
          logDebug("Activate blocked: invalid crosshair reference");
          return false;
        }

        return executeSafely(action.type, () => {
          crosshairRef.activate(player);
        });
      }

      if (action.target === "nearestNPC") {
        const nearestNpc = Game.findClosestActor(x, y, z, 2000);
        if (!isValidReference(nearestNpc)) {
          logDebug("Activate blocked: no valid nearest NPC");
          return false;
        }

        return executeSafely(action.type, () => {
          nearestNpc.activate(player);
        });
      }

      if (action.target === "nearestDoor") {
        const nearestDoor = getClosestReferenceOfType(player, FormType.Door, PLAYER_FORM_ID);
        if (!isValidReference(nearestDoor)) {
          logDebug("Activate blocked: no valid nearest door");
          return false;
        }

        return executeSafely(action.type, () => {
          (nearestDoor as ActivatableRef).activate(player);
        });
      }

      const nearestContainer = getClosestReferenceOfType(player, FormType.Container, PLAYER_FORM_ID);
      if (!isValidReference(nearestContainer)) {
        logDebug("Activate blocked: no valid nearest container");
        return false;
      }

      return executeSafely(action.type, () => {
        nearestContainer.activate(player);
      });
    }

    case "fastTravel": {
      Debug.notification("Fast travel not supported via API");
      logDebug(`Fast travel blocked for location: ${action.location}`);
      return false;
    }

    case "drawWeapon": {
      return executeSafely(action.type, () => {
        player.drawWeapon();
      });
    }

    case "sheatheWeapon": {
      return executeSafely(action.type, () => {
        player.sheatheWeapon();
      });
    }

    case "attack": {
      return executeSafely(action.type, () => {
        // @ts-ignore
        Input.tapKey(57 as DxScanCode);
      });
    }

    case "block": {
      return executeSafely(action.type, () => {
        // @ts-ignore
        Input.holdKey(42 as DxScanCode);
        releaseBlockAfterDelay(500);
      });
    }

    case "equip": {
      return executeSafely(action.type, () => {
        Debug.notification(`Equip: ${action.itemName}`);
      });
    }

    case "useItem": {
      return executeSafely(action.type, () => {
        Debug.notification(`Use item: ${action.itemName}`);
      });
    }

    case "heal": {
      return executeSafely(action.type, () => {
        player.restoreActorValue("health", action.amount);
      });
    }

    case "saveGame": {
      return executeSafely(action.type, () => {
        Game.saveGame(action.name);
      });
    }

    case "notification": {
      return executeSafely(action.type, () => {
        Debug.notification(action.message);
      });
    }

    case "forceThirdPerson": {
      return executeSafely(action.type, () => {
        Game.forceThirdPerson();
      });
    }

    case "forceFirstPerson": {
      return executeSafely(action.type, () => {
        Game.forceFirstPerson();
      });
    }
  }
}
