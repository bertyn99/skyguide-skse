import type { EventHandlers } from "../../events";
import type { MenuFocusState } from "../menu-focus-core";
import { logDiag } from "../../diag";
import { CONFIG } from "../../config";

/**
 * Item-action narration (equip / unequip / consume) — "Il devrait signaler
 * quand j'équipe ou utilise des items". Sits on the equip/unequip SP events
 * (player only) and stages them as pseudo menu-focus speech events so the
 * whole existing pipeline (protocol `menu` field, app formatting, TTS
 * cache, arbiter) is reused unchanged.
 *
 * Verb semantics: POTION/INGR form types are consumed on equip in Skyrim's
 * engine — narrated as "use". Everything else is equip/unequip.
 */

const PLAYER_FORM_ID = 0x14;
/** Skyrim form types narrated as consumption (46 POTION, 30 INGR). */
const CONSUMABLE_FORM_TYPES = new Set([46, 30]);
/** Same verb+item within this window is deduplicated (spam guard). */
const DEDUP_WINDOW_MS = 1500;

interface ItemEvent {
  verb: "equip" | "unequip" | "use";
  item: string;
}

const queue: ItemEvent[] = [];
let lastKey = "";
let lastAt = 0;

function isConsumable(baseObject: unknown): boolean {
  try {
    const formType = (baseObject as { getObjectType?: () => number }).getObjectType?.();
    return formType !== undefined && CONSUMABLE_FORM_TYPES.has(formType);
  } catch {
    return false;
  }
}

function itemName(baseObject: unknown): string {
  try {
    return (baseObject as { getName?: () => string }).getName?.() ?? "";
  } catch {
    return "";
  }
}

function pushEvent(verb: ItemEvent["verb"], item: string, now: number): void {
  const trimmed = item.trim();
  if (!trimmed) return;
  const key = `${verb}:${trimmed}`;
  if (key === lastKey && now - lastAt < DEDUP_WINDOW_MS) return;
  lastKey = key;
  lastAt = now;
  queue.push({ verb, item: trimmed });
  if (CONFIG.debugMode) {
    logDiag(`[item-events] staged ${key}`);
  }
}

function handleEquipEvent(event: unknown, now: number): void {
  const e = event as { actor?: { getFormId?: () => number }; baseObject?: unknown };
  if (!e.actor || e.actor.getFormId?.() !== PLAYER_FORM_ID) return;
  const item = itemName(e.baseObject);
  if (!item) return;
  pushEvent(isConsumable(e.baseObject) ? "use" : "equip", item, now);
}

function handleUnequipEvent(event: unknown, now: number): void {
  const e = event as { actor?: { getFormId?: () => number }; baseObject?: unknown };
  if (!e.actor || e.actor.getFormId?.() !== PLAYER_FORM_ID) return;
  const item = itemName(e.baseObject);
  if (!item) return;
  pushEvent("unequip", item, now);
}

/** Handlers to merge into `registerAllEvents({ ...itemEventHandlers() })`. */
export function itemEventHandlers(): EventHandlers {
  return {
    equip: (event: unknown) => handleEquipEvent(event, Date.now()),
    unequip: (event: unknown) => handleUnequipEvent(event, Date.now()),
  };
}

/** Any staged item event waiting to ride the next POST? */
export function hasPendingItemEvent(): boolean {
  return queue.length > 0;
}

/**
 * Take the oldest staged event as a pseudo menu-focus state (drains the
 * queue — one event per POST, fire-and-forget: no commit semantics, losing
 * one line under a failed POST is acceptable for action feedback).
 */
export function takeItemEvent(): MenuFocusState | null {
  const event = queue.shift();
  if (!event) return null;
  return {
    name: "",
    skyui: false,
    category: "",
    item: event.item,
    index: -1,
    count: -1,
    event: event.verb,
    firstRead: false,
    announceCategory: false,
  };
}

/** Test seam. */
export function resetItemEvents(): void {
  queue.length = 0;
  lastKey = "";
  lastAt = 0;
}
