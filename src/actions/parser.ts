import type { ActionCommand } from "./types";

type ActionType = ActionCommand["type"];
type ActivateAction = Extract<ActionCommand, { type: "activate" }>;

const ACTION_TYPES = new Set<ActionType>([
  "move",
  "face",
  "activate",
  "fastTravel",
  "drawWeapon",
  "sheatheWeapon",
  "attack",
  "block",
  "equip",
  "useItem",
  "heal",
  "saveGame",
  "notification",
  "forceThirdPerson",
  "forceFirstPerson",
]);

const ACTIVATE_TARGETS = new Set<ActivateAction["target"]>([
  "crosshair",
  "nearestNPC",
  "nearestDoor",
  "nearestContainer",
]);

function isActivateTarget(value: unknown): value is ActivateAction["target"] {
  return typeof value === "string" && ACTIVATE_TARGETS.has(value as ActivateAction["target"]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function parseAction(raw: unknown): ActionCommand | null {
  if (!isRecord(raw)) {
    return null;
  }

  const actionType = raw.type;

  if (typeof actionType !== "string" || !ACTION_TYPES.has(actionType as ActionType)) {
    return null;
  }

  switch (actionType) {
    case "move": {
      const { x, y, z } = raw;
      if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
        return null;
      }
      return { type: "move", x, y, z };
    }

    case "face": {
      const { angle } = raw;
      if (!isFiniteNumber(angle)) {
        return null;
      }
      return { type: "face", angle };
    }

    case "activate": {
      const { target } = raw;
      if (!isActivateTarget(target)) {
        return null;
      }
      return { type: "activate", target };
    }

    case "fastTravel": {
      const { location } = raw;
      if (!isNonEmptyString(location)) {
        return null;
      }
      return { type: "fastTravel", location };
    }

    case "equip":
    case "useItem": {
      const { itemName } = raw;
      if (!isNonEmptyString(itemName)) {
        return null;
      }
      return { type: actionType, itemName };
    }

    case "heal": {
      const { amount } = raw;
      if (!isFiniteNumber(amount) || amount <= 0) {
        return null;
      }
      return { type: "heal", amount };
    }

    case "saveGame": {
      const { name } = raw;
      if (!isNonEmptyString(name)) {
        return null;
      }
      return { type: "saveGame", name };
    }

    case "notification": {
      const { message } = raw;
      if (!isNonEmptyString(message)) {
        return null;
      }
      return { type: "notification", message };
    }

    case "drawWeapon":
    case "sheatheWeapon":
    case "attack":
    case "block":
    case "forceThirdPerson":
    case "forceFirstPerson":
      return { type: actionType };
  }

  return null;
}

export function isValidAction(action: ActionCommand): boolean {
  void action;
  return true;
}
