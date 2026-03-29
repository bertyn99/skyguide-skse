import { Debug, DxScanCode, Game, Input, Ui, printConsole } from "../skyrimPlatform";
import { CONFIG, PLAYER_FORM_ID } from "../config";
import type { ActionCommand } from "./types";

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

function getClosestReference(
  x: number,
  y: number,
  z: number,
  radius: number,
): unknown | null {
  const gameWithClosestReference = Game as unknown as {
    findClosestReference?: (
      sx: number,
      sy: number,
      sz: number,
      sr: number,
    ) => unknown;
  };

  return gameWithClosestReference.findClosestReference?.(x, y, z, radius) ?? null;
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
  const runtimeTimers = globalThis as unknown as {
    setTimeout?: (callback: () => void, timeout: number) => unknown;
  };

  if (typeof runtimeTimers.setTimeout === "function") {
    runtimeTimers.setTimeout(() => {
      // @ts-ignore
      Input.releaseKey(DxScanCode.LeftShift);
    }, delayMs);
    return;
  }

  // @ts-ignore
  Input.releaseKey(DxScanCode.LeftShift); 
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
        const nearestDoor = getClosestReference(x, y, z, 2000);
        if (!isValidReference(nearestDoor)) {
          logDebug("Activate blocked: no valid nearest door");
          return false;
        }

        return executeSafely(action.type, () => {
          nearestDoor.activate(player);
        });
      }

      const nearestContainer = getClosestReference(x, y, z, 2000);
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
