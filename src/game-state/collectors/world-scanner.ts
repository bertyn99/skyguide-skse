import { Actor, Game, Ui, on, printConsole, type CellFullyLoadedEvent, type PapyrusObject } from "../../skyrimPlatform";
import { CONFIG, PLAYER_FORM_ID } from "../../config";
import {
  type CandidateInput,
  type Position3,
  type ScannedObjectCore,
  finalizeCandidates,
  isScanCacheStale,
  distanceUnits,
} from "../../world/scanner-core";
import { isContainerLooted } from "../../world/loot-tracker";

/**
 * Game-facing half of the object scanner (the pure half lives in
 * world/scanner-core.ts). Sweep design, ported from Skyrim Access and
 * hardened per plan review:
 *  - allowlisted FormTypes only (never `getNumRefs(0)` — "0 = all types" is
 *    not a documented SP behavior);
 *  - isDisabled/isDeleted probed before anything else (the hidden autowalk
 *    XMarker must never become a beacon);
 *  - a per-pass Papyrus probe budget: a full sweep is spread over several
 *    `update` ticks so an exterior cell can never hitch the game thread;
 *  - cache invalidated after ~100 units of movement (their RESCAN_DISTANCE)
 *    or a cell change;
 *  - coverage = parent cell + up to 3 recent `cellFullyLoaded` cells
 *    (a single parent cell cannot see across an exterior cell border).
 */

// Cell order is not distance order (see actions/executor.ts) — probe, then sort.
interface CellLike {
  getNumRefs?: (filter: number) => number;
  getNthRef?: (n: number, filter: number) => unknown;
  getFormID?: () => number;
}

interface RefLike {
  getFormID?: () => number;
  isDisabled?: () => boolean;
  isDeleted?: () => boolean;
  getPositionX?: () => number;
  getPositionY?: () => number;
  getPositionZ?: () => number;
  getBaseObject?: () => { getName?: () => string } | null;
  isLocked?: () => boolean;
  getLockLevel?: () => number;
  is3DLoaded?: () => boolean;
  getNumItems?: () => number;
  getOpenState?: () => number;
  isHarvested?: () => boolean;
}

// Mirrors world/scanner-core.ts FORM_TYPE (runtime numbers).
const ALLOWED_TYPES = [24, 28, 29, 39, 40, 62] as const;

interface RecentCell {
  formId: number;
  cell: CellLike;
}

interface SweepState {
  active: boolean;
  cellIndex: number;
  typeIndex: number;
  refIndex: number;
  refCount: number;
  countKnown: boolean;
  candidates: CandidateInput[];
}

let initialized = false;
let recentCells: RecentCell[] = [];
let cache: { objects: ScannedObjectCore[]; pos: Position3; cellIds: number[] } | null = null;
let sweep: SweepState = {
  active: false,
  cellIndex: 0,
  typeIndex: 0,
  refIndex: 0,
  refCount: 0,
  countKnown: false,
  candidates: [],
};

function debugLog(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[world-scanner] ${message}`);
  }
}

export function initWorldScanner(): void {
  if (initialized) return;
  initialized = true;
  on("cellFullyLoaded", (event: CellFullyLoadedEvent) => {
    try {
      const cell = event.cell as unknown as CellLike;
      const formId = typeof cell.getFormID === "function" ? cell.getFormID() : 0;
      if (!formId) return;
      recentCells = [
        { formId, cell },
        ...recentCells.filter((entry) => entry.formId !== formId),
      ].slice(0, Math.max(1, CONFIG.scanMaxCells - 1));
    } catch {
      // A dead cell reference must never break the event pipeline.
    }
  });
}

function safeNumRefs(cell: CellLike, formType: number): number {
  try {
    return typeof cell.getNumRefs === "function" ? (cell.getNumRefs(formType) ?? 0) : 0;
  } catch {
    return 0;
  }
}

function safeNthRef(cell: CellLike, index: number, formType: number): unknown {
  try {
    return typeof cell.getNthRef === "function" ? cell.getNthRef(index, formType) : null;
  } catch {
    return null;
  }
}

function currentCellIds(cells: CellLike[]): number[] {
  const ids: number[] = [];
  for (const cell of cells) {
    try {
      ids.push(typeof cell.getFormID === "function" ? (cell.getFormID() ?? 0) : 0);
    } catch {
      ids.push(0);
    }
  }
  return ids;
}

function currentCellList(player: { getParentCell?: () => unknown }): CellLike[] {
  const cells: CellLike[] = [];
  try {
    if (typeof player.getParentCell === "function") {
      const parent = player.getParentCell() as CellLike | null;
      if (parent) cells.push(parent);
    }
  } catch {
    // No parent cell (main menu edge) — sweep the recent list only.
  }
  const parentId = cells.length > 0 ? currentCellIds([cells[0]!])[0] ?? 0 : 0;
  for (const entry of recentCells) {
    if (cells.length >= CONFIG.scanMaxCells) break;
    if (entry.formId === parentId) continue;
    cells.push(entry.cell);
  }
  return cells;
}

function getPlayerPos(player: unknown): Position3 | null {
  const p = player as { getPositionX?: () => number; getPositionY?: () => number; getPositionZ?: () => number } | null;
  if (
    !p ||
    typeof p.getPositionX !== "function" ||
    typeof p.getPositionY !== "function" ||
    typeof p.getPositionZ !== "function"
  ) {
    return null;
  }
  try {
    return { x: p.getPositionX(), y: p.getPositionY(), z: p.getPositionZ() };
  } catch {
    return null;
  }
}

/**
 * Probe one reference into `out`. Returns the Papyrus-probe cost so the sweep
 * budget stays honest (checked between objects — worst-case overshoot is one
 * object's worth of probes, ~12).
 */
function probeCandidate(ref: unknown, formType: number, playerPos: Position3, out: CandidateInput[]): number {
  let cost = 0;
  const refLike = ref as RefLike;
  if (!refLike || typeof refLike.getFormID !== "function") return cost;

  let formId = 0;
  try {
    formId = refLike.getFormID() ?? 0;
    cost++;
  } catch {
    return cost;
  }
  if (!formId || formId === PLAYER_FORM_ID) return cost;

  let disabled = false;
  let deleted = false;
  try {
    disabled = typeof refLike.isDisabled === "function" ? (refLike.isDisabled() ?? false) : false;
    cost++;
  } catch {
    cost++;
  }
  try {
    deleted = typeof refLike.isDeleted === "function" ? (refLike.isDeleted() ?? false) : false;
    cost++;
  } catch {
    cost++;
  }
  if (disabled || deleted) return cost;

  let x = 0;
  let y = 0;
  let z = 0;
  try {
    if (
      typeof refLike.getPositionX !== "function" ||
      typeof refLike.getPositionY !== "function" ||
      typeof refLike.getPositionZ !== "function"
    ) {
      return cost;
    }
    x = refLike.getPositionX();
    y = refLike.getPositionY();
    z = refLike.getPositionZ();
    cost += 3;
  } catch {
    return cost;
  }

  const dx = x - playerPos.x;
  const dy = y - playerPos.y;
  const dzFlat = 0; // radius gate is 2D — altitude must not hide a nearby door
  if (distanceUnits(dx, dy, dzFlat) > CONFIG.scanRadiusUnits) return cost;

  let name = "";
  try {
    const base = typeof refLike.getBaseObject === "function" ? refLike.getBaseObject() : null;
    if (base && typeof base.getName === "function") name = base.getName() ?? "";
    cost += 2;
  } catch {
    cost += 2;
  }
  if (!name) return cost;

  let isLocked = false;
  let lockLevel = 0;
  let numItems: number | null = null;
  let openState: number | null = null;
  let isDead = false;
  let isHarvested = false;
  // Pure map lookup (loot-tracker) — no Papyrus probes, cost stays 0.
  const isLooted = formType === 28 ? isContainerLooted(formId) : false;

  if (formType === 24 || formType === 28 || formType === 29) {
    try {
      isLocked = typeof refLike.isLocked === "function" ? (refLike.isLocked() ?? false) : false;
      cost++;
    } catch {
      cost++;
    }
    if (isLocked) {
      try {
        lockLevel = typeof refLike.getLockLevel === "function" ? (refLike.getLockLevel() ?? 0) : 0;
        cost++;
      } catch {
        cost++;
      }
    }
  }
  if (formType === 28) {
    let loaded = false;
    try {
      loaded = typeof refLike.is3DLoaded === "function" ? (refLike.is3DLoaded() ?? false) : false;
      cost++;
    } catch {
      cost++;
    }
    if (loaded) {
      try {
        numItems = typeof refLike.getNumItems === "function" ? (refLike.getNumItems() ?? 0) : null;
        cost++;
      } catch {
        cost++;
      }
    }
  }
  if (formType === 29) {
    try {
      openState = typeof refLike.getOpenState === "function" ? (refLike.getOpenState() ?? 0) : null;
      cost++;
    } catch {
      cost++;
    }
  }
  if (formType === 39) {
    try {
      isHarvested = typeof refLike.isHarvested === "function" ? (refLike.isHarvested() ?? false) : false;
      cost++;
    } catch {
      cost++;
    }
  }
  if (formType === 62) {
    try {
      const actor = Actor.from(ref as PapyrusObject);
      isDead = actor ? (actor.isDead() ?? false) : false;
      cost++;
    } catch {
      cost++;
    }
  }

  out.push({ formId, name, formType, x, y, z, isLocked, lockLevel, numItems, openState, isDead, isHarvested, isLooted });
  return cost;
}

function finishSweep(player: unknown, playerPos: Position3): void {
  let facing = 0;
  try {
    facing = (player as { getAngleZ?: () => number }).getAngleZ?.() ?? 0;
  } catch {
    facing = 0;
  }
  const objects = finalizeCandidates(sweep.candidates, playerPos, facing, CONFIG.scanMaxOutput);
  const cells = currentCellList(player as { getParentCell?: () => unknown });
  cache = { objects, pos: playerPos, cellIds: currentCellIds(cells) };
  sweep = { active: false, cellIndex: 0, typeIndex: 0, refIndex: 0, refCount: 0, countKnown: false, candidates: [] };
  debugLog(`sweep done: ${objects.length} objects cached`);
}

/**
 * One budgeted sweep pass. Call once per update tick (500ms throttle in
 * index.ts). Cheap early-out when the cache is fresh: no Papyrus calls.
 */
export function pumpWorldScanner(): void {
  if (!CONFIG.scannerEnabled) return;
  const player = Game.getPlayer();
  if (!player) return;

  let inLoading = false;
  try {
    inLoading = Ui.isMenuOpen("Loading Menu");
  } catch {
    inLoading = false;
  }
  if (inLoading) return;

  const playerPos = getPlayerPos(player);
  if (!playerPos) return;

  const cells = currentCellList(player);
  const cellIds = currentCellIds(cells);
  if (cache && !isScanCacheStale(cache, { pos: playerPos, cellIds }, CONFIG.scanRescanDistance)) {
    return;
  }

  if (!sweep.active) {
    sweep = { active: true, cellIndex: 0, typeIndex: 0, refIndex: 0, refCount: 0, countKnown: false, candidates: [] };
    debugLog("sweep started");
  }

  let budget = CONFIG.scanProbeBudget;
  while (budget > 0 && sweep.active) {
    const cell = cells[sweep.cellIndex];
    if (!cell) {
      finishSweep(player, playerPos);
      break;
    }
    const formType = ALLOWED_TYPES[sweep.typeIndex] ?? 0;
    if (!formType) {
      // Defensive: bad index — abort this sweep instead of spinning.
      sweep = { active: false, cellIndex: 0, typeIndex: 0, refIndex: 0, refCount: 0, countKnown: false, candidates: [] };
      break;
    }

    if (!sweep.countKnown) {
      sweep.refCount = safeNumRefs(cell, formType);
      sweep.countKnown = true;
      budget--;
      continue;
    }

    if (sweep.refIndex >= sweep.refCount) {
      sweep.typeIndex++;
      sweep.refIndex = 0;
      sweep.refCount = 0;
      sweep.countKnown = false;
      if (sweep.typeIndex >= ALLOWED_TYPES.length) {
        sweep.typeIndex = 0;
        sweep.cellIndex++;
      }
      continue;
    }

    const ref = safeNthRef(cell, sweep.refIndex, formType);
    sweep.refIndex++;
    budget--;
    if (ref) {
      budget -= probeCandidate(ref, formType, playerPos, sweep.candidates);
    }
  }
}

/** Cached, distance-sorted, capped objects. Empty until the first sweep lands. */
export function getWorldObjects(): ScannedObjectCore[] {
  return cache?.objects ?? [];
}

/** `{type:"scan"}` action — drop the cache so the next pump re-sweeps now. */
export function invalidateWorldScan(): void {
  cache = null;
  debugLog("cache invalidated (scan action)");
}
