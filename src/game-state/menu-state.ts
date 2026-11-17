/**
 * Pure menu-state logic — NO skyrimPlatform imports.
 *
 * `ui.menuOpen` means "a gameplay-blocking menu is open" (inventory, map,
 * crafting…), NOT "any menu is open": the HUD/Fader/Cursor/Mist menus are
 * open for the entire play session and would mute SkyGuide forever if
 * counted. The denylist is skymp5-client's `browserService.badMenus` set
 * (services/services/browserService.ts) — the battle-tested list of menus
 * that hide a CEF overlay, i.e. exactly the menus where the game UI owns
 * the screen.
 */

export const GAME_MENUS = new Set<string>([
  "BarterMenu",
  "Book Menu",
  "ContainerMenu",
  "Crafting Menu",
  "GiftMenu",
  "InventoryMenu",
  "Journal Menu",
  "Lockpicking Menu",
  "Loading Menu",
  "MapMenu",
  "RaceSex Menu",
  "StatsMenu",
  "Tween Menu",
  "Console",
  "Main Menu",
  "Dialogue Menu",
  "MessageBoxMenu",
  "LevelUp Menu",
  "Sleep/Wait Menu",
  "FavoritesMenu",
  "Quantity Menu",
  "MagicMenu",
  "Training Menu",
]);

export interface UiState {
  /** A gameplay-blocking menu (denylist above) is open. */
  menuOpen: boolean;
  /** The console is open — screen readers own this channel. */
  consoleOpen: boolean;
}

export function computeUiFlags(openMenus: Iterable<string>): UiState {
  let menuOpen = false;
  let consoleOpen = false;
  // Array.from: the plugin compiles to ES5, where bare for-of over an
  // Iterable needs downlevelIteration.
  for (const menu of Array.from(openMenus)) {
    if (GAME_MENUS.has(menu)) {
      menuOpen = true;
      if (menu === "Console") consoleOpen = true;
    }
  }
  return { menuOpen, consoleOpen };
}
