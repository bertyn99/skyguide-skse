import { describe, expect, it } from "vitest";
import {
  cleanUiText,
  diffMenuFocus,
  findNarratableMenu,
  firstNonEmpty,
  isNarratableMenu,
  type MenuFocusSnapshot,
} from "../src/game-state/menu-focus-core";
import { finalizeInventoryRows } from "../src/game-state/inventory-core";

function snap(overrides: Partial<MenuFocusSnapshot> = {}): MenuFocusSnapshot {
  return {
    name: "InventoryMenu",
    skyui: true,
    category: "Weapons",
    item: "Iron Sword",
    index: 0,
    count: 12,
    ...overrides,
  };
}

describe("isNarratableMenu / findNarratableMenu", () => {
  it("accepts the ItemMenu family and ignores HUD chrome", () => {
    expect(isNarratableMenu("InventoryMenu")).toBe(true);
    expect(isNarratableMenu("HUD Menu")).toBe(false);
    expect(findNarratableMenu(["HUD Menu", "CursorMenu"])).toBeNull();
  });

  it("picks inventory over container when both are open", () => {
    expect(findNarratableMenu(["ContainerMenu", "InventoryMenu"])).toBe("InventoryMenu");
  });
});

describe("cleanUiText / firstNonEmpty", () => {
  it("strips Scaleform $keys and underscores", () => {
    expect(cleanUiText("$weapon_one_hand")).toBe("weapon one hand");
  });

  it("skips blanks and the stringified undefined Scaleform sometimes returns", () => {
    expect(firstNonEmpty(["", "undefined", "  Iron Sword  "])).toBe("Iron Sword");
    expect(firstNonEmpty([null, "null", ""])).toBe("");
  });
});

describe("diffMenuFocus", () => {
  it("emits open when a narratable menu appears", () => {
    expect(diffMenuFocus(null, snap())).toEqual({
      event: "open",
      firstRead: false,
      announceCategory: true,
    });
  });

  it("emits close when the menu disappears", () => {
    expect(diffMenuFocus(snap(), null)).toEqual({
      event: "close",
      firstRead: false,
      announceCategory: false,
    });
  });

  it("emits focus with firstRead when the first item populates after open", () => {
    const opened = snap({ item: "", index: -1, count: -1, category: "" });
    expect(diffMenuFocus(opened, snap())).toEqual({
      event: "focus",
      firstRead: true,
      announceCategory: true,
    });
  });

  it("emits focus without firstRead when the selected item changes", () => {
    expect(diffMenuFocus(snap(), snap({ item: "Steel Sword", index: 1 }))).toEqual({
      event: "focus",
      firstRead: false,
      announceCategory: false,
    });
  });

  it("announces the category when the tab changes", () => {
    expect(diffMenuFocus(snap(), snap({ category: "Apparel", item: "Hide Armor", index: 0 }))).toEqual({
      event: "focus",
      firstRead: false,
      announceCategory: true,
    });
  });

  it("ignores empty-item flickers while the menu stays open", () => {
    expect(diffMenuFocus(snap(), snap({ item: "", index: -1 }))).toBeNull();
  });

  it("stays silent when nothing changed", () => {
    expect(diffMenuFocus(snap(), snap())).toBeNull();
  });

  it("does not re-speak when only the selected index/count fills in", () => {
    expect(
      diffMenuFocus(
        snap({ index: -1, count: -1 }),
        snap({ index: 0, count: 12 }),
      ),
    ).toBeNull();
  });
});

describe("finalizeInventoryRows", () => {
  it("drops nameless and empty stacks, then caps", () => {
    const rows = finalizeInventoryRows(
      [
        { name: "", count: 1, formId: 1 },
        { name: "Gold", count: 0, formId: 2 },
        { name: "Iron Sword", count: 1, formId: 3 },
        { name: "Potion", count: 4, formId: 4 },
        { name: "Hide Armor", count: 1, formId: 5 },
      ],
      2,
    );
    expect(rows).toEqual([
      { name: "Iron Sword", count: 1, formId: 3 },
      { name: "Potion", count: 4, formId: 4 },
    ]);
  });
});
