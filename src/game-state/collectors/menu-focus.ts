import { Game, Ui, printConsole } from "../../skyrimPlatform";
import { logDiag } from "../../diag";
import { CONFIG } from "../../config";
import { isSkyrimAccessInstalled } from "../skyrim-access";
import { getOpenMenus } from "../../events";
import {
  CATEGORY_PATHS_SKYUI,
  CATEGORY_PATHS_VANILLA,
  COUNT_PATHS_SKYUI,
  COUNT_PATHS_VANILLA,
  INDEX_PATHS_SKYUI,
  INDEX_PATHS_VANILLA,
  ITEM_PATHS_SKYUI,
  ITEM_PATHS_VANILLA,
  diffMenuFocus,
  findNarratableMenu,
  firstNonEmpty,
  type MenuFocusSnapshot,
  type MenuFocusState,
} from "../menu-focus-core";

/**
 * GFx focus reader for the ItemMenu family. Polls Ui.getString/getInt,
 * diffs against the last snapshot, and stages at most one speech event
 * for the next protocol send. Silent when Skyrim Access owns menus.
 */

let skyui: boolean | null = null;
let focusProbeLogged = false;
let prev: MenuFocusSnapshot | null = null;
let pending: MenuFocusState | null = null;
let inFlight: MenuFocusState | null = null;
let lastPollAt = 0;
const cachedPath: Record<string, string> = {};

function detectSkyUi(): boolean {
  if (skyui !== null) return skyui;
  try {
    skyui =
      (Game.isPluginInstalled("SkyUI_SE.esp") ?? false) ||
      (Game.isPluginInstalled("SkyUI.esp") ?? false);
  } catch {
    skyui = false;
  }
  if (CONFIG.debugMode) {
    printConsole(`[SkyGuide] SkyUI detected: ${skyui}`);
  }
  return skyui;
}

function readString(menu: string, path: string): string {
  try {
    return Ui.getString(menu, path) ?? "";
  } catch {
    return "";
  }
}

function readInt(menu: string, path: string): number {
  try {
    const value = Ui.getInt(menu, path);
    return typeof value === "number" && isFinite(value) ? value : NaN;
  } catch {
    return NaN;
  }
}

function probeString(menu: string, kind: string, paths: string[]): string {
  const cacheKey = `${menu}:${kind}`;
  const cached = cachedPath[cacheKey];
  if (cached) {
    const hit = firstNonEmpty([readString(menu, cached)]);
    if (hit) return hit;
  }
  const values: string[] = [];
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const value = readString(menu, path);
    values.push(value);
    if (firstNonEmpty([value])) {
      cachedPath[cacheKey] = path;
      break;
    }
  }
  return firstNonEmpty(values);
}

function probeInt(menu: string, kind: string, paths: string[]): number {
  const cacheKey = `${menu}:${kind}`;
  const cached = cachedPath[cacheKey];
  if (cached) {
    const hit = readInt(menu, cached);
    if (!isNaN(hit) && hit > 0) return Math.floor(hit);
  }
  let sawZero = false;
  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const value = readInt(menu, path);
    if (isNaN(value) || value < 0) continue;
    if (value > 0) {
      cachedPath[cacheKey] = path;
      return Math.floor(value);
    }
    sawZero = true;
  }
  // 0 is a valid index AND the Papyrus default for a missing path — do not
  // cache it or later SkyUI/vanilla paths never run.
  return sawZero ? 0 : -1;
}

function readSnapshot(menu: string): MenuFocusSnapshot {
  const isSkyUi = detectSkyUi();
  const itemPaths = isSkyUi ? ITEM_PATHS_SKYUI : ITEM_PATHS_VANILLA;
  const indexPaths = isSkyUi ? INDEX_PATHS_SKYUI : INDEX_PATHS_VANILLA;
  const countPaths = isSkyUi ? COUNT_PATHS_SKYUI : COUNT_PATHS_VANILLA;
  const categoryPaths = isSkyUi ? CATEGORY_PATHS_SKYUI : CATEGORY_PATHS_VANILLA;
  // SkyUI paths first, vanilla as fallback even in skyui mode (UI mods move trees).
  const item = probeString(menu, "item", itemPaths.concat(ITEM_PATHS_VANILLA));
  const category = probeString(menu, "category", categoryPaths.concat(CATEGORY_PATHS_VANILLA));
  const index = probeInt(menu, "index", indexPaths.concat(INDEX_PATHS_VANILLA));
  const count = probeInt(menu, "count", countPaths.concat(COUNT_PATHS_VANILLA));
  // First probe of each session — proves the GFx channel works (or not).
  if (!focusProbeLogged) {
    focusProbeLogged = true;
    logDiag(
      `[menu-focus] probe: menu=${menu} skyui=${isSkyUi} item="${item}" category="${category}" index=${index} count=${count}`,
    );
    // Full candidate dump once: which GFx paths answer at all?
    const raw: string[] = [];
    for (const p of itemPaths.concat(ITEM_PATHS_VANILLA)) {
      const v = readString(menu, p);
      if (v !== "") raw.push(`${p}="${v}"`);
    }
    logDiag(`[menu-focus] non-empty item paths: ${raw.length ? raw.join(" | ") : "NONE"}`);
  }
  return {
    name: menu,
    skyui: isSkyUi,
    category,
    item,
    index,
    count,
  };
}

function snapshotOf(event: MenuFocusState): MenuFocusSnapshot | null {
  if (event.event === "close") return null;
  return {
    name: event.name,
    skyui: event.skyui,
    category: event.category,
    item: event.item,
    index: event.index,
    count: event.count,
  };
}

function stageEvent(next: MenuFocusSnapshot | null): boolean {
  const delta = diffMenuFocus(prev, next);
  if (!delta) return false;
  const closedName = prev?.name;
  const base: MenuFocusSnapshot = next ?? {
    name: closedName ?? "",
    skyui: detectSkyUi(),
    category: "",
    item: "",
    index: -1,
    count: -1,
  };
  pending = {
    ...base,
    event: delta.event,
    firstRead: delta.firstRead,
    announceCategory: delta.announceCategory,
  };
  return true;
}

/** Cheap GFx poll. Returns true when a speech event is waiting to POST. */
export function pumpMenuFocus(now: number): boolean {
  if (!CONFIG.menuNarrationEnabled) return pending !== null;
  if (isSkyrimAccessInstalled()) {
    if (pending === null && inFlight === null && prev !== null) {
      stageEvent(null);
    }
    return pending !== null;
  }
  // Hold the staged event until the POST acks — do not poll/restage or a
  // failed send (or a 100ms retry) drops "Inventaire ouvert." forever.
  if (pending !== null || inFlight !== null) return pending !== null;
  if (now - lastPollAt < CONFIG.menuFocusInterval) {
    return false;
  }
  lastPollAt = now;

  const menu = findNarratableMenu(getOpenMenus());
  if (!menu) {
    return stageEvent(null);
  }
  return stageEvent(readSnapshot(menu));
}

export function hasPendingMenuFocus(): boolean {
  return pending !== null;
}

/** Read the staged event without consuming it (dump + payload). */
export function peekMenuFocus(): MenuFocusState | undefined {
  return pending ?? undefined;
}

/**
 * Take the event for an imminent POST. `commitMenuFocusSend` must follow:
 * success advances `prev`, failure restages so the next poll retries.
 */
export function beginMenuFocusSend(): MenuFocusState | undefined {
  if (!pending) return undefined;
  inFlight = pending;
  pending = null;
  return inFlight;
}

export function commitMenuFocusSend(ok: boolean): void {
  if (!inFlight) return;
  if (ok) {
    prev = snapshotOf(inFlight);
  } else if (pending === null) {
    pending = inFlight;
  }
  inFlight = null;
}

/** Test / hot-reload seam. */
export function resetMenuFocus(): void {
  skyui = null;
  prev = null;
  pending = null;
  inFlight = null;
  lastPollAt = 0;
  const keys = Object.keys(cachedPath);
  for (let i = 0; i < keys.length; i++) {
    delete cachedPath[keys[i]];
  }
}
