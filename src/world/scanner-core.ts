/**
 * Pure world-scanner logic — NO skyrimPlatform imports. Everything here must
 * stay runnable under plain Node (vitest) so the cache/flag/bearing math can
 * be regression-tested without the game.
 *
 * FormType numeric values are mirrored from the installed typings
 * (`@skyrim-platform/skyrim-platform/index.d.ts`, `export const enum FormType`):
 * Activator=24, Container=28, Door=29, Flora=39, Furniture=40, Character=62.
 * (Never copy the numeric table in crosshair-collector.ts — 26/27 are
 * Armor/Book there, which is wrong.)
 */

export const FORM_TYPE = {
  activator: 24,
  container: 28,
  door: 29,
  flora: 39,
  furniture: 40,
  character: 62,
} as const;

/** Tuning constants ported from Skyrim Access (docs/ACCESSIBILITY-PORT.md §5.6). */
export const SCAN_DEFAULTS = {
  /** Re-sweep after the player moved this far (their RESCAN_DISTANCE). */
  rescanDistanceUnits: 100,
  /** Maximum objects kept in the cache (sorted nearest-first). */
  maxOutput: 64,
  /** Papyrus probes allowed per update pass (hitch protection). */
  probeBudgetPerPass: 96,
  /** Parent cell + N recently cellFullyLoaded cells. */
  maxCells: 4,
  /** Sweep radius in world units. */
  radiusUnits: 2500,
} as const;

export type ScannedCategory =
  | "npc"
  | "door"
  | "container"
  | "activator"
  | "flora"
  | "furniture";

export interface ScannedObjectCore {
  formId: number;
  name: string;
  category: ScannedCategory | "other";
  /** 3D distance in world units. */
  distance: number;
  /** Absolute world bearing in degrees, 0 = +Y (north), clockwise. */
  bearingDeg: number;
  /** Bearing relative to the player's facing, -180..180. */
  relativeDeg: number;
  /** Lock level when locked, 0 otherwise. */
  lockLevel: number;
  /** Altitude delta (ref.z - player.z) in units — drives above/below. */
  dz: number;
  /** "locked" | "empty" | "corpse" | "open" | "harvested" */
  flags: string[];
}

export interface Position3 {
  x: number;
  y: number;
  z: number;
}

/** Raw per-ref probes collected by the game-facing sweep. */
export interface CandidateInput {
  formId: number;
  name: string;
  formType: number;
  x: number;
  y: number;
  z: number;
  isLocked: boolean;
  lockLevel: number;
  /** Container item count when the ref is a 3D-loaded container, else null. */
  numItems: number | null;
  /** Door getOpenState() value, else null. */
  openState: number | null;
  isDead: boolean;
  isHarvested: boolean;
  /** Loot-tracker verdict for containers ("already searched"). */
  isLooted: boolean;
}

export function classifyCategory(formType: number): ScannedCategory | "other" {
  switch (formType) {
    case FORM_TYPE.character:
      return "npc";
    case FORM_TYPE.door:
      return "door";
    case FORM_TYPE.container:
      return "container";
    case FORM_TYPE.activator:
      return "activator";
    case FORM_TYPE.flora:
      return "flora";
    case FORM_TYPE.furniture:
      return "furniture";
    default:
      return "other";
  }
}

/**
 * ObjectReference.getOpenState(): 1/2 = open or opening, 3/4 = closed or
 * closing, 0 = not an open/close ref (CK wiki semantics).
 */
export function isOpenState(openState: number | null): boolean {
  return openState === 1 || openState === 2;
}

export function assembleFlags(input: {
  formType: number;
  isLocked: boolean;
  numItems: number | null;
  openState: number | null;
  isDead: boolean;
  isHarvested: boolean;
  isLooted: boolean;
}): string[] {
  const flags: string[] = [];
  if (input.isLocked) flags.push("locked");
  if (
    input.formType === FORM_TYPE.container &&
    input.numItems !== null &&
    input.numItems === 0
  ) {
    flags.push("empty");
  }
  if (input.formType === FORM_TYPE.character && input.isDead) flags.push("corpse");
  if (input.formType === FORM_TYPE.door && isOpenState(input.openState)) flags.push("open");
  if (input.formType === FORM_TYPE.flora && input.isHarvested) flags.push("harvested");
  if (input.formType === FORM_TYPE.container && input.isLooted) flags.push("looted");
  return flags;
}

/** Absolute world bearing: 0 = north (+Y), 90 = east (+X), clockwise. */
export function absoluteBearingDeg(dx: number, dy: number): number {
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

export function relativeBearingDeg(absoluteDeg: number, playerFacingDeg: number): number {
  return ((absoluteDeg - playerFacingDeg + 540) % 360) - 180;
}

export function distanceUnits(dx: number, dy: number, dz: number): number {
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export interface CacheKey {
  pos: Position3;
  cellIds: number[];
}

/**
 * Cache invalidation, ported from their scanner: re-sweep after the player
 * moved RESCAN_DISTANCE units or changed cells.
 */
export function isScanCacheStale(
  cache: CacheKey,
  current: CacheKey,
  rescanDistanceUnits: number = SCAN_DEFAULTS.rescanDistanceUnits,
): boolean {
  if (cache.cellIds.length !== current.cellIds.length) return true;
  const a = [...cache.cellIds].sort((x, y) => x - y).join(",");
  const b = [...current.cellIds].sort((x, y) => x - y).join(",");
  if (a !== b) return true;
  const dx = current.pos.x - cache.pos.x;
  const dy = current.pos.y - cache.pos.y;
  const dz = current.pos.z - cache.pos.z;
  return distanceUnits(dx, dy, dz) >= rescanDistanceUnits;
}

/**
 * Sort nearest-first, cap the output, and derive distance/bearing/dz/flags
 * from the raw probes. This is the only place candidate math happens so the
 * sweep stays a dumb probe collector.
 */
export function finalizeCandidates(
  candidates: CandidateInput[],
  playerPos: Position3,
  playerFacingDeg: number,
  maxOutput: number = SCAN_DEFAULTS.maxOutput,
): ScannedObjectCore[] {
  const objects: ScannedObjectCore[] = [];
  for (const candidate of candidates) {
    const dx = candidate.x - playerPos.x;
    const dy = candidate.y - playerPos.y;
    const dz = candidate.z - playerPos.z;
    const distance = distanceUnits(dx, dy, dz);
    const bearing = ((absoluteBearingDeg(dx, dy) % 360) + 360) % 360;
    objects.push({
      formId: candidate.formId,
      name: candidate.name,
      category: classifyCategory(candidate.formType),
      distance,
      bearingDeg: Math.round(bearing * 10) / 10,
      relativeDeg: Math.round(relativeBearingDeg(bearing, playerFacingDeg) * 10) / 10,
      lockLevel: candidate.isLocked ? candidate.lockLevel : 0,
      dz: Math.round(dz * 10) / 10,
      flags: assembleFlags(candidate),
    });
  }
  objects.sort((a, b) => a.distance - b.distance);
  return objects.slice(0, Math.max(0, maxOutput));
}
