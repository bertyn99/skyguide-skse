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

/**
 * The server outbox wraps parameters as `{ type, params, id, source }`.
 * Flatten so both that shape and the legacy flat `{ type, amount, ... }` parse.
 */
function flattenOutboxShape(raw: Record<string, unknown>): Record<string, unknown> {
  const params = raw.params;
  if (!isRecord(params)) {
    return raw;
  }
  return { ...params, type: raw.type, id: raw.id };
}

const TYPE_ALIASES: Record<string, ActionType> = {
  open_door: "activate",
  openDoor: "activate",
  use_potion: "useItem",
  usePotion: "useItem",
  draw_weapon: "drawWeapon",
  sheathe_weapon: "sheatheWeapon",
};

export function parseAction(raw: unknown): ActionCommand | null {
  if (!isRecord(raw)) {
    return null;
  }

  const flat = flattenOutboxShape(raw);
  const rawType = flat.type;
  const aliased =
    typeof rawType === "string" && rawType in TYPE_ALIASES
      ? TYPE_ALIASES[rawType]
      : rawType;
  const actionType = aliased;

  // Alias open_door → activate nearestDoor when no target was given.
  if (
    actionType === "activate" &&
    !isActivateTarget(flat.target) &&
    (rawType === "open_door" || rawType === "openDoor")
  ) {
    flat.target = "nearestDoor";
  }
  if (
    (actionType === "useItem" || actionType === "equip") &&
    !isNonEmptyString(flat.itemName) &&
    isNonEmptyString(flat.name)
  ) {
    flat.itemName = flat.name;
  }

  if (typeof actionType !== "string" || !ACTION_TYPES.has(actionType as ActionType)) {
    return null;
  }

  switch (actionType) {
    case "move": {
      const { x, y, z } = flat;
      if (!isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(z)) {
        return null;
      }
      return { type: "move", x, y, z };
    }

    case "face": {
      const { angle } = flat;
      if (!isFiniteNumber(angle)) {
        return null;
      }
      return { type: "face", angle };
    }

    case "activate": {
      const { target } = flat;
      if (!isActivateTarget(target)) {
        return null;
      }
      return { type: "activate", target };
    }

    case "fastTravel": {
      const { location } = flat;
      if (!isNonEmptyString(location)) {
        return null;
      }
      return { type: "fastTravel", location };
    }

    case "equip":
    case "useItem": {
      const { itemName } = flat;
      if (!isNonEmptyString(itemName)) {
        return null;
      }
      return { type: actionType, itemName };
    }

    case "heal": {
      const { amount } = flat;
      if (!isFiniteNumber(amount) || amount <= 0) {
        return null;
      }
      return { type: "heal", amount };
    }

    case "saveGame": {
      const { name } = flat;
      if (!isNonEmptyString(name)) {
        return null;
      }
      return { type: "saveGame", name };
    }

    case "notification": {
      const { message } = flat;
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
