import { Game } from "../../skyrimPlatform";
import { CONFIG } from "../../config";
import {
  finalizeInventoryRows,
  type InventoryDumpRow,
} from "../inventory-core";
import { findNarratableMenu } from "../menu-focus-core";
import { getOpenMenus } from "../../events";

const INVENTORY_DUMP_INTERVAL_MS = 2000;

let lastDumpAt = 0;
let lastDump: InventoryDumpRow[] = [];

/**
 * Player inventory as parallel-array rows for the context dump.
 * Only runs while a narratable menu is open — getNthForm over a full bag
 * every world tick is too expensive on the game thread.
 */
export function collectInventoryDump(): InventoryDumpRow[] {
  if (!findNarratableMenu(getOpenMenus())) {
    lastDump = [];
    lastDumpAt = 0;
    return [];
  }

  const now = Date.now();
  if (lastDumpAt !== 0 && now - lastDumpAt < INVENTORY_DUMP_INTERVAL_MS) {
    return lastDump;
  }

  const player = Game.getPlayer();
  if (!player) return lastDump;

  let n = 0;
  try {
    n = player.getNumItems() ?? 0;
  } catch {
    return lastDump;
  }

  const rows: InventoryDumpRow[] = [];
  const limit = Math.min(n, CONFIG.inventoryDumpMax * 2);
  for (let i = 0; i < limit; i++) {
    try {
      const form = player.getNthForm(i);
      if (!form) continue;
      const name = form.getName() ?? "";
      const formId = form.getFormID();
      let count = 1;
      try {
        count = player.getItemCount(form) ?? 1;
      } catch {
        count = 1;
      }
      rows.push({ name, count, formId });
    } catch {
      // skip broken extra data
    }
    if (rows.length >= CONFIG.inventoryDumpMax) break;
  }
  lastDumpAt = now;
  lastDump = finalizeInventoryRows(rows, CONFIG.inventoryDumpMax);
  return lastDump;
}
