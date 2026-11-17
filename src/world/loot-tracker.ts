import {
  Game,
  Utility,
  on,
  printConsole,
  type ContainerChangedEvent,
  type MenuCloseEvent,
  type MenuOpenEvent,
  type ResetEvent,
} from "../skyrimPlatform";
import { CONFIG, PLAYER_FORM_ID } from "../config";
import { getLastActivatedRef } from "../events";
import {
  clearLooted,
  isLooted,
  markLooted,
  parseLoot,
  pruneLooted,
  serializeLoot,
  type LootStore,
} from "./loot-core";

/**
 * Game-facing loot tracker (W3, plan D8). Attribution per the review fix:
 *  - PRIMARY: `containerChanged` with `newContainer === player` → the
 *    `oldContainer` was just searched (`menuOpen` carries NO target ref —
 *    it cannot identify the chest; skymp5-client containersService idiom).
 *  - SECONDARY (best effort): snapshot the last activated ref at
 *    ContainerMenu open and mark it at close — catches opened-but-empty
 *    containers, where no transfer ever fires.
 *  - `reset` (TESResetEvent) clears the entry: the container respawned.
 *  - `loadGame` prunes expired entries (the JS VM survives save/load, the
 *    file matters across game restarts).
 *
 * Persistence: `Data/Platform/SkyGuide/loot.json` sidecar, atomic write
 * (file-dump.ts pattern) — `sp.storage` dies on game restart, the sidecar
 * does not.
 */

const LOOT_PATH = "Data/Platform/SkyGuide/loot.json";

type FsModule = {
  readFileSync?: (path: string, encoding: string) => string;
  writeFileSync: (path: string, data: string) => void;
  renameSync: (from: string, to: string) => void;
  mkdirSync: (path: string, opts: { recursive: boolean }) => void;
};

let fsModule: FsModule | null | undefined;

function loadFs(): FsModule | null {
  if (fsModule !== undefined) return fsModule;
  try {
    fsModule = require("fs") as FsModule;
  } catch {
    fsModule = null;
  }
  return fsModule;
}

let store: LootStore = {};
let menuHint: number | undefined;
let initialized = false;

function debugLog(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[loot-tracker] ${message}`);
  }
}

function nowDays(): number {
  try {
    return Utility.getCurrentGameTime() ?? 0;
  } catch {
    return 0;
  }
}

function persist(): void {
  const fs = loadFs();
  if (!fs) return;
  const tmp = `${LOOT_PATH}.tmp`;
  try {
    const idx = Math.max(LOOT_PATH.lastIndexOf("/"), LOOT_PATH.lastIndexOf("\\"));
    if (idx > 0) {
      try {
        fs.mkdirSync(LOOT_PATH.slice(0, idx), { recursive: true });
      } catch {
        // Directory may already exist.
      }
    }
    fs.writeFileSync(tmp, serializeLoot(store));
    fs.renameSync(tmp, LOOT_PATH);
  } catch (err) {
    debugLog(`persist failed: ${String(err)}`);
  }
}

function restore(): void {
  const fs = loadFs();
  if (!fs || typeof fs.readFileSync !== "function") return;
  try {
    store = parseLoot(fs.readFileSync(LOOT_PATH, "utf-8"));
    debugLog(`restored ${Object.keys(store).length} looted entries`);
  } catch {
    store = {};
  }
}

export function initLootTracker(): void {
  if (initialized) return;
  initialized = true;

  restore();

  on("containerChanged", (event: ContainerChangedEvent) => {
    try {
      const newId = event.newContainer?.getFormID() ?? 0;
      const oldId = event.oldContainer?.getFormID() ?? 0;
      if (newId === PLAYER_FORM_ID && oldId && oldId !== PLAYER_FORM_ID) {
        markLooted(store, oldId, nowDays());
        debugLog(`container ${oldId} looted via transfer`);
        persist();
      }
    } catch {
      // Bad refs must never break the event pipeline.
    }
  });

  on("menuOpen", (event: MenuOpenEvent) => {
    if (event.name === "ContainerMenu") {
      menuHint = getLastActivatedRef();
    }
  });

  on("menuClose", (event: MenuCloseEvent) => {
    if (event.name === "ContainerMenu") {
      if (menuHint !== undefined) {
        markLooted(store, menuHint, nowDays());
        debugLog(`container ${menuHint} looted via menu close`);
        persist();
      }
      menuHint = undefined;
    }
  });

  on("reset", (event: ResetEvent) => {
    try {
      const formId = event.object?.getFormID() ?? 0;
      if (formId && clearLooted(store, formId)) {
        debugLog(`container ${formId} respawned — entry cleared`);
        persist();
      }
    } catch {
      // Ignore bad refs.
    }
  });

  on("loadGame", () => {
    const pruned = pruneLooted(store, nowDays());
    if (pruned > 0) {
      debugLog(`loadGame: pruned ${pruned} expired entries`);
    }
    persist();
  });
}

/** Scanner hook: pure map lookup, no Papyrus cost. */
export function isContainerLooted(formId: number): boolean {
  return isLooted(store, formId, nowDays());
}

/** Test seam. */
export function resetLootTrackerForTest(): void {
  store = {};
  menuHint = undefined;
  initialized = false;
}
