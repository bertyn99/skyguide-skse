import { describe, expect, it } from "vitest";
import { parseAction } from "../src/actions/parser";

/**
 * Parser whitelist contract — pure module, no game imports. The outbox
 * ships `{type, params}` (composer output); legacy flat shapes also parse.
 */
describe("parseAction — activate targeting (W4)", () => {
  it("parses a hex string formId from the outbox params shape", () => {
    const action = parseAction({ type: "activate", params: { formId: "0xFF001" } });
    expect(action).toEqual({ type: "activate", formId: 0xff001 });
  });

  it("parses decimal strings and bare numbers", () => {
    expect(parseAction({ type: "activate", params: { formId: "16777217" } })).toEqual({
      type: "activate",
      formId: 16777217,
    });
    expect(parseAction({ type: "activate", formId: 42 })).toEqual({
      type: "activate",
      formId: 42,
    });
  });

  it("keeps the legacy target union working", () => {
    expect(parseAction({ type: "activate", params: { target: "nearestDoor" } })).toEqual({
      type: "activate",
      target: "nearestDoor",
    });
  });

  it("rejects garbage formIds and unknown targets", () => {
    expect(parseAction({ type: "activate", params: { formId: "0xZZZ" } })).toBeNull();
    expect(parseAction({ type: "activate", params: { formId: -5 } })).toBeNull();
    expect(parseAction({ type: "activate", params: { formId: 0 } })).toBeNull();
    expect(
      parseAction({ type: "activate", params: { target: "everything", formId: "nope" } }),
    ).toBeNull();
  });
});

describe("parseAction — whitelist contract", () => {
  it("parses the scan action (W1)", () => {
    expect(parseAction({ type: "scan", params: {} })).toEqual({ type: "scan" });
    expect(parseAction({ type: "scan" })).toEqual({ type: "scan" });
  });

  it("rejects unknown action types silently", () => {
    expect(parseAction({ type: "formatDisk", params: {} })).toBeNull();
    expect(parseAction("not an object")).toBeNull();
    expect(parseAction(null)).toBeNull();
  });

  it("validates move coordinates strictly", () => {
    expect(parseAction({ type: "move", params: { x: 1, y: 2, z: 3 } })).toEqual({
      type: "move",
      x: 1,
      y: 2,
      z: 3,
    });
    expect(parseAction({ type: "move", params: { x: 1, y: "2", z: 3 } })).toBeNull();
  });
});
