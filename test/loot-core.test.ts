import { describe, expect, it } from "vitest";
import {
  LOOT_EXPIRY_DAYS,
  clearLooted,
  isLooted,
  lootKey,
  markLooted,
  parseLoot,
  pruneLooted,
  serializeLoot,
} from "../src/world/loot-core";

describe("loot-core (Skyrim Access loot_tracker behavior, days-based)", () => {
  it("expiry is 30 game DAYS (getCurrentGameTime is days — environment collector confirms)", () => {
    expect(LOOT_EXPIRY_DAYS).toBe(30);
  });

  it("marks and queries searched containers", () => {
    const store = {};
    markLooted(store, 0xff001, 100);
    expect(isLooted(store, 0xff001, 100)).toBe(true);
    expect(isLooted(store, 0xff002, 100)).toBe(false);
  });

  it("expires after 30 days (searched day 100, now day 130 = respawned)", () => {
    const store = {};
    markLooted(store, 0xff001, 100);
    expect(isLooted(store, 0xff001, 129)).toBe(true); // boundary: still assumed looted
    expect(isLooted(store, 0xff001, 130)).toBe(false); // 30 days elapsed
    expect(isLooted(store, 0xff001, 160)).toBe(false);
  });

  it("clearLooted forgets a respawned container (TESResetEvent)", () => {
    const store = {};
    markLooted(store, 0xff001, 100);
    expect(clearLooted(store, 0xff001)).toBe(true);
    expect(isLooted(store, 0xff001, 100)).toBe(false);
    expect(clearLooted(store, 0xff001)).toBe(false);
  });

  it("prunes only expired entries and reports the count", () => {
    const store = {};
    markLooted(store, 1, 100); // expired at day 130
    markLooted(store, 2, 115); // still valid at day 135 (20 days old)
    expect(pruneLooted(store, 135)).toBe(1);
    expect(Object.keys(store)).toEqual([lootKey(2)]);
  });

  it("serialize/parse round-trips and tolerates corruption", () => {
    const store = { "16777217": 100.5, "16777218": 0 };
    const parsed = parseLoot(serializeLoot(store));
    expect(parsed).toEqual(store);

    expect(parseLoot("not json")).toEqual({});
    expect(parseLoot("[]")).toEqual({});
    expect(parseLoot(JSON.stringify({ a: "not-a-number", b: 5, c: null }))).toEqual({ b: 5 });
  });
});
