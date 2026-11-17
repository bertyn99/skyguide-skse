/**
 * Pure menu-focus logic — NO skyrimPlatform imports.
 *
 * Behavioural port of Skyrim Access's inventory/magic/container reader
 * (poll + snapshot diff + firstRead), reimplemented against SKSE-style
 * Ui.getString paths. GFx path strings are public Scaleform facts, not
 * copied from their GPL sources.
 */

export const NARRATABLE_MENUS = [
  "InventoryMenu",
  "MagicMenu",
  "ContainerMenu",
  "BarterMenu",
  "GiftMenu",
] as const;

export type NarratableMenu = (typeof NARRATABLE_MENUS)[number];

export type MenuFocusEvent =
  | "open"
  | "focus"
  | "close"
  // Item-action narration (collectors/item-events.ts): pseudo events that
  // ride the same pipeline; the app formats them as action feedback.
  | "equip"
  | "unequip"
  | "use";

export interface MenuFocusSnapshot {
  name: string;
  skyui: boolean;
  category: string;
  item: string;
  /** 0-based selected index, or -1 when unknown. */
  index: number;
  /** List length, or -1 when unknown. */
  count: number;
}

export interface MenuFocusState extends MenuFocusSnapshot {
  event: MenuFocusEvent;
  /** First item after open — app must queue, not cut the "menu open" line. */
  firstRead: boolean;
  /** Category just changed; app should speak it before the item. */
  announceCategory: boolean;
}

/** SkyUI ItemMenu family (inventory / magic / container / barter / gift). */
export const ITEM_PATHS_SKYUI = [
  "_root.Menu_mc.inventoryLists.itemList.selectedEntry.text",
  "_root.Menu_mc.inventoryLists.itemList.selectedName",
];

export const ITEM_PATHS_VANILLA = [
  // Verified against Skyrim Access (GPL) src/menu_*.cpp — the vanilla
  // InventoryMenu hierarchy uses InventoryLists_mc/ItemsList (capital
  // letters), unlike the lowercase SkyUI layout.
  "_root.Menu_mc.InventoryLists_mc.ItemsList.selectedEntry.text",
  "_root.Menu_mc.ItemCardFadeHolder_mc.ItemCard_mc.itemInfo.text",
  "_root.Menu_mc.itemCard.itemInfo.text",
  "_root.Menu_mc.itemCard.itemName",
];

export const INDEX_PATHS_SKYUI = [
  "_root.Menu_mc.inventoryLists.itemList.selectedIndex",
];

export const INDEX_PATHS_VANILLA = [
  "_root.Menu_mc.InventoryLists_mc.ItemsList.selectedIndex",
  "_root.Menu_mc.InventoryLists_mc.CategoriesList.selectedIndex",
  "_root.Menu_mc.InventoryLists_mc.CategoriesList.dividerIndex",
];

export const COUNT_PATHS_SKYUI = [
  "_root.Menu_mc.inventoryLists.itemList.itemCount",
];

export const COUNT_PATHS_VANILLA = [
  "_root.Menu_mc.InventoryLists_mc.ItemsList.selectedEntry.count",
];

export const CATEGORY_PATHS_SKYUI = [
  "_root.Menu_mc.inventoryLists.categoryList.selectedEntry.text",
  "_root.Menu_mc.inventoryLists.categoryList.selectedName",
];

export const CATEGORY_PATHS_VANILLA = [
  "_root.Menu_mc.InventoryLists_mc.CategoriesList.centeredEntry.text",
];

export function isNarratableMenu(name: string): boolean {
  for (let i = 0; i < NARRATABLE_MENUS.length; i++) {
    if (NARRATABLE_MENUS[i] === name) return true;
  }
  return false;
}

/**
 * Highest-priority narratable menu currently open. Inventory wins over
 * container when both exist (they should not).
 */
export function findNarratableMenu(openMenus: Iterable<string>): string | null {
  const open = new Set<string>();
  const listed = Array.from(openMenus);
  for (let i = 0; i < listed.length; i++) {
    open.add(listed[i]);
  }
  for (let i = 0; i < NARRATABLE_MENUS.length; i++) {
    const name = NARRATABLE_MENUS[i];
    if (open.has(name)) return name;
  }
  return null;
}

/** Strip Scaleform $keys and underscores so "$weapon_one_hand" speaks. */
export function cleanUiText(raw: string): string {
  let text = raw.trim();
  if (text.charAt(0) === "$") {
    text = text.slice(1);
  }
  text = text.split("_").join(" ");
  return text.trim();
}

export function firstNonEmpty(values: Array<string | null | undefined>): string {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (typeof value !== "string") continue;
    const cleaned = cleanUiText(value);
    if (!cleaned) continue;
    const lower = cleaned.toLowerCase();
    if (lower === "undefined" || lower === "null") continue;
    return cleaned;
  }
  return "";
}

export function focusSignature(snapshot: MenuFocusSnapshot | null): string {
  if (!snapshot) return "";
  // Index/count fill in a tick later than the name; they must not re-speak.
  return `${snapshot.name}|${snapshot.category}|${snapshot.item}`;
}

/**
 * Diff two snapshots into a speech event. Empty-item flickers while the
 * menu stays open are ignored (Scaleform briefly blanks on tab change).
 */
export function diffMenuFocus(
  prev: MenuFocusSnapshot | null,
  next: MenuFocusSnapshot | null,
): Pick<MenuFocusState, "event" | "firstRead" | "announceCategory"> | null {
  const prevName = prev?.name ?? null;
  const nextName = next?.name ?? null;

  if (!prevName && nextName) {
    return { event: "open", firstRead: false, announceCategory: !!next?.category };
  }
  if (prevName && !nextName) {
    return { event: "close", firstRead: false, announceCategory: false };
  }
  if (!next || !nextName) return null;

  if (prevName !== nextName) {
    return { event: "open", firstRead: false, announceCategory: !!next.category };
  }

  if (focusSignature(prev) === focusSignature(next)) return null;

  if (!next.item) return null;

  const firstRead = !prev?.item;
  const announceCategory = (prev?.category ?? "") !== next.category && !!next.category;
  return { event: "focus", firstRead, announceCategory };
}
