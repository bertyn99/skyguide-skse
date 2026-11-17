import { getOpenMenus } from "../../events";
import type { MenuState } from "../types";

/**
 * Menu collector — the open-menu set is maintained by events.ts
 * (menuOpen/menuClose); this only snapshots it. Gameplay-blocking vs
 * cosmetic menus is decided app/plugin-side by game-state/menu-state.ts.
 */
export function collectMenuState(): MenuState {
  return { openMenus: Array.from(getOpenMenus()) };
}
