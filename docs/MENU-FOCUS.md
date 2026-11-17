# Menu focus (ItemMenu dictation)

SkyGuide can read the **focused row** in Skyrim’s ItemMenu family and have
the companion **speak it**. The plugin never runs TTS or STT.

## Split

| Piece | Owner |
| --- | --- |
| Scaleform focus (`Ui.getString` / `Ui.getInt`) | this plugin, ~100 ms poll |
| French line (“Inventaire ouvert. Iron Sword, 3 sur 12.”) | skydive-app `formatMenuSpeech` |
| TTS / STT engines | skydive-app voice seam + Electron player |
| Journal, map, lockpick, HUD, 40-menu GFx reader | **not us** — Skyrim Access + NVDA |

If `SkyrimAccess.esp` is installed, this plugin **does not** stage menu
events. Their Prism/NVDA reader owns that channel.

## Menus

Inventory, Magic, Container, Barter, Gift (same SkyUI/vanilla ItemMenu
tree). Paths are a probe table: SkyUI first, vanilla fallback.

## Fast lane (`POST /api/game-state`)

Additive `data.menu` on protocol v1 (absent = old plugin, feature off):

```json
{
  "name": "InventoryMenu",
  "event": "open",
  "skyui": true,
  "category": "Weapons",
  "item": "Iron Sword",
  "index": 2,
  "count": 12,
  "firstRead": false,
  "announceCategory": true
}
```

`event` is only set when the focus **diff** fired (`open` / `focus` /
`close`). The POST is held until the HTTP send succeeds so a dropped
packet does not lose “Inventaire ouvert.”

The app speech arbiter has a **`menu` channel**: allowed while
`ui.menuOpen`; `firstRead` queues behind the open line; later rows
stop-and-speak. Console still drops everything. A reflex on the same
tick wins the speaker; the menu line is deferred until `audio_done`.

## Context lane (`state.json`)

While a narratable menu is open, the dump may include additive
`inventory.name` / `inventory.count` / `inventory.form_id` /
`inventory.size` (capped, throttled). Absent arrays = feature off —
the dump-v2 fixture key set is unchanged.

## Files

- `src/game-state/menu-focus-core.ts` — pure diff + path tables
- `src/game-state/collectors/menu-focus.ts` — GFx poll, Access/SkyUI detect
- `src/game-state/collectors/inventory-collector.ts` — bag dump
- App: `server/utils/menu-speech.ts`, `speech-arbiter.ts`, `engine.ts`
