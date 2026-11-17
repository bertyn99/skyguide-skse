import type { ActionCommand, ActivateTarget } from "./types";

type ActionType = ActionCommand["type"];

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
  "scan",
  "autowalkTo",
  "autowalkCancel",
  "forceThirdPerson",
  "forceFirstPerson",
]);

const ACTIVATE_TARGETS = new Set<ActivateTarget>([
  "crosshair",
  "nearestNPC",
  "nearestDoor",
  "nearestContainer",
]);

function isActivateTarget(value: unknown): value is ActivateTarget {
  return typeof value === "string" && ACTIVATE_TARGETS.has(value as ActivateTarget);
}

/**
 * Accepts a decimal number, a decimal string, or an explicit hex string
 * ("0x14") — composer params are a free record and LLMs like to emit hex
 * form ids. Bare strings parse as DECIMAL (only the 0x prefix means hex).
 */
function parseFormId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^0x[0-9a-f]+$/i.test(trimmed)) {
      const parsed = Number.parseInt(trimmed.slice(2), 16);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    } else if (/^\d+$/.test(trimmed)) {
      const parsed = Number.parseInt(trimmed, 10);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  return null;
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
 * The companion outbox (`GET /api/actions`) wraps fields as
 * `{ type, params, id, source }`. Flatten so both that shape and a flat
 * `{ type, amount, ... }` parse.
 */
function flattenOutboxShape(raw: Record<string, unknown>): Record<string, unknown> {
  const params = raw.params;
  if (!isRecord(params)) {
    return raw;
  }
  return { ...params, type: raw.type, id: raw.id };
}

export function parseAction(raw: unknown): ActionCommand | null {
  if (!isRecord(raw)) {
    return null;
  }

  const flat = flattenOutboxShape(raw);
  const actionType = flat.type;

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
      // W4 formId targeting — validated against the scanner cache in the
      // executor (an LLM must not activate arbitrary forms).
      const formId = parseFormId(flat.formId);
      if (formId !== null) {
        return { type: "activate", formId };
      }
      const { target } = flat;
      if (!isActivateTarget(target)) {
        return null;
      }
      return { type: "activate", target };
    }

    case "autowalkTo": {
      // Reuses parseFormId (hex/decimal forms from the composer) and falls
      // back to the CONFIG stop distance when the LLM omits it.
      const formId = parseFormId(flat.formId);
      if (formId === null) {
        return null;
      }
      const rawDistance = flat.stopDistance;
      const stopDistance =
        typeof rawDistance === "number" && Number.isFinite(rawDistance) && rawDistance > 0
          ? rawDistance
          : 100;
      return { type: "autowalkTo", formId, stopDistance };
    }

    case "autowalkCancel": {
      return { type: "autowalkCancel" };
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
    case "scan":
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
