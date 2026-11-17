import { describe, expect, it } from "vitest";
import {
  AUTOWALK_ARRIVED_EVENT,
  AUTOWALK_CMD_EVENT,
  AUTOWALK_READY_EVENT,
  canTransition,
  decodeAutowalkCommand,
  encodeAutowalkCommand,
} from "../src/world/navigation-core";

describe("autowalk mod-event contract (W6)", () => {
  it("unique event names — never share Skyrim Access's (D5)", () => {
    expect(AUTOWALK_CMD_EVENT).toMatch(/^SkyGuide_AutoWalk/);
    expect(AUTOWALK_ARRIVED_EVENT).not.toContain("SkyrimNVDA");
    expect(AUTOWALK_CMD_EVENT).not.toBe("SkyrimNVDA_AutoWalkArrived");
  });

  it("Ready announce carries the quest via sender — no form-ID hardcoding (W6 handshake)", () => {
    expect(AUTOWALK_READY_EVENT).toBe("SkyGuide_AutoWalkReady");
  });

  it("encode/decode round-trips, including dynamic formIds ≥ 0xFF000000 that float32 would corrupt", () => {
    const ids = [0x14, 0xff001, 0xff1234, 0xff000001, 0x7654321];
    for (const formId of ids) {
      const decoded = decodeAutowalkCommand(encodeAutowalkCommand({ formId, stopDistance: 100 }));
      expect(decoded).toEqual({ formId, stopDistance: 100 });
    }
  });

  it("decodes hex formIds above float32 precision exactly", () => {
    // 0xFF000001 = 4278190081 — numArg float32 would round it; strArg JSON must not.
    const decoded = decodeAutowalkCommand('{"f":"ff000001","d":250}');
    expect(decoded?.formId).toBe(0xff000001);
    expect(decoded?.stopDistance).toBe(250);
  });

  it("defaults the stop distance and tolerates garbage", () => {
    expect(decodeAutowalkCommand('{"f":"14"}')).toEqual({ formId: 0x14, stopDistance: 100 });
    expect(decodeAutowalkCommand("not json")).toBeNull();
    expect(decodeAutowalkCommand('{"d":100}')).toBeNull();
    expect(decodeAutowalkCommand('{"f":"zzz"}')).toBeNull();
    expect(decodeAutowalkCommand("[]")).toBeNull();
  });

  it("enforces the status transition legality", () => {
    expect(canTransition("idle", "walking")).toBe(true);
    expect(canTransition("idle", "failed")).toBe(true);
    expect(canTransition("idle", "arrived")).toBe(false);
    expect(canTransition("walking", "arrived")).toBe(true);
    expect(canTransition("walking", "cancelled")).toBe(true);
    expect(canTransition("walking", "failed")).toBe(true);
    expect(canTransition("walking", "walking")).toBe(false);
    expect(canTransition("arrived", "walking")).toBe(false); // reset to idle first
    expect(canTransition("cancelled", "idle")).toBe(true);
    expect(canTransition("failed", "idle")).toBe(true);
  });
});
