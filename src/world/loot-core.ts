/**
 * Pure loot-tracker logic — NO skyrimPlatform imports (vitest-testable).
 * Ported from Skyrim Access's loot_tracker behavior (§5.3): a cross-session
 * "already searched" memory keyed by container REF formId, with a respawn
 * assumption and per-ref clearing.
 *
 * Unit decision: `Utility.getCurrentGameTime()` returns game DAYS (the
 * environment collector already derives `gameHour = gameTime*24 % 24`), so
 * the ported "720 in-game hours (30 days)" expiry becomes 30 DAYS. Probe
 * item §4 confirms this in game before tuning.
 */

export const LOOT_EXPIRY_DAYS = 30;

/** Ref formId (decimal string) → gameDays when the container was searched. */
export type LootStore = Record<string, number>;

export function lootKey(formId: number): string {
  return String(formId);
}

export function markLooted(store: LootStore, formId: number, gameDays: number): void {
  store[lootKey(formId)] = gameDays;
}

/** True while the respawn assumption holds (searched < expiryDays ago). */
export function isLooted(
  store: LootStore,
  formId: number,
  gameDays: number,
  expiryDays: number = LOOT_EXPIRY_DAYS,
): boolean {
  const at = store[lootKey(formId)];
  if (at === undefined) return false;
  return gameDays - at < expiryDays;
}

/** The container respawned now (TESResetEvent) — forget its searched state. */
export function clearLooted(store: LootStore, formId: number): boolean {
  const key = lootKey(formId);
  if (store[key] === undefined) return false;
  delete store[key];
  return true;
}

/** Drop expired entries; returns how many were removed. */
export function pruneLooted(
  store: LootStore,
  gameDays: number,
  expiryDays: number = LOOT_EXPIRY_DAYS,
): number {
  let pruned = 0;
  for (const key of Object.keys(store)) {
    if (gameDays - store[key]! >= expiryDays) {
      delete store[key];
      pruned++;
    }
  }
  return pruned;
}

export function serializeLoot(store: LootStore): string {
  return JSON.stringify(store);
}

/** Tolerant parse — a corrupt sidecar must never crash the plugin. */
export function parseLoot(json: string): LootStore {
  try {
    const raw = JSON.parse(json) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const store: LootStore = {};
    for (const [key, value] of Object.entries(raw)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        store[key] = value;
      }
    }
    return store;
  } catch {
    return {};
  }
}
