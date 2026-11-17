/**
 * Pure inventory-dump helpers — NO skyrimPlatform imports.
 *
 * Parallel-array rows for the context-lane dump so Composer/STT can name
 * items without reading Scaleform. Cap is a game-thread budget, not a
 * gameplay limit.
 */

export const INVENTORY_DUMP_MAX = 48;

export interface InventoryDumpRow {
  name: string;
  count: number;
  formId: number;
}

export function finalizeInventoryRows(
  rows: InventoryDumpRow[],
  max: number = INVENTORY_DUMP_MAX,
): InventoryDumpRow[] {
  const out: InventoryDumpRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.name) continue;
    if (row.count <= 0) continue;
    out.push(row);
    if (out.length >= max) break;
  }
  return out;
}
