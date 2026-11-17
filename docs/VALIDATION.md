# Validation checklist — plugin ↔ companion

Use this when changing either skyguide-skse or skydive-app. Each check is
independent: fail one, keep going, record the result.

Companion env (required for Gate/Composer):

```
SKYRIM_CONTEXT_FILE_PATH="<Skyrim folder>/Data/Platform/SkyGuide/state.json"
```

Restart `pnpm dev` after changing `.env`. On boot the Nitro log should show
`[skyrim-file] mod context: …SkyGuide/state.json`, not the unset warning.

---

## 0. Load (no companion needed)

| # | Check | Pass when |
|---|---|---|
| 0.1 | SKSE | Launch `skse64_loader.exe`. Console `~` shows an SKSE version line. |
| 0.2 | Skyrim Platform | Main menu `~` shows `Hello SE`. |
| 0.3 | This plugin | Load a save. Console shows `SkyGuide plugin loaded!`. |
| 0.4 | Status command | `skyguide` prints Connected / Polling / Mod-context dump path. |

If 0.2 fails, you launched vanilla `SkyrimSE.exe` or the SP mod is disabled in MO2.

---

## 1. Mod-context dump → Gate/Composer

This is the path Gate + Composer actually read.

| # | Check | Pass when |
|---|---|---|
| 1.1 | File appears | After ~1 s in-game, `Data/Platform/SkyGuide/state.json` exists. If it never appears, Node `fs` is unavailable in this SP build — dump is dead, POST/reflex can still work. |
| 1.2 | Shape | File has top-level `float`, `int`, `string`, `floatList`, `stringList`. `float["player.health"]` is a number. `stringList["npcs.name"]` is an array. |
| 1.3 | Live update | Move / enter combat. `player.health` or `int["player.in_combat"]` changes within 1 s (tick is 500 ms). |
| 1.4 | App reads it | Start capture on the dashboard. Engine logs should include a French `## ÉTAT DU JEU` block (or `### Joueur`), not `Mod context unavailable`. |

**Curl the dump from the app machine** (after 1.1):

```bash
# Windows Skyrim folder — adjust if needed
type "C:\Program Files (x86)\Steam\steamapps\common\Skyrim Special Edition\Data\Platform\SkyGuide\state.json"
```

---

## 2. POST /api/game-state → reflex + dashboard

| # | Check | Pass when |
|---|---|---|
| 2.1 | Dashboard live | Session **Mod context** panel leaves “Waiting for the SKSE plugin” within 2 s of being in-game. Health bar matches the dump. |
| 2.2 | HTTP 200 | `skyguide` shows `Connected: true`. With `CONFIG.debugMode = true`, console logs `Sent state: …`. |
| 2.3 | Reflex death | Console `player.kill` (or take lethal damage). Within ~1 s the companion speaks “Vous êtes à terre.” (engine log `reflex · death`). Engine must be **running**. |
| 2.4 | Reflex health | Drop below 25% health. Callout “Santé critique. Buvez une potion.” Cooldown 8 s — don’t expect spam. |
| 2.5 | Reflex melee | Enter combat with an enemy ≤ 250 units. “Ennemi au contact. Bloquez !” |

**Inject without the game** (app running, engine started from the dashboard):

```bash
curl -s -X POST http://localhost:3000/api/game-state \
  -H 'Content-Type: application/json' \
  -d '{
    "protocolVersion": 1,
    "priority": "critical",
    "source": "skyguide",
    "timestamp": 1,
    "data": {
      "player": {
        "health": 10, "maxHealth": 100, "magicka": 50, "stamina": 50,
        "level": 1, "position": { "x": 0, "y": 0, "z": 0 },
        "isSneaking": false, "isDead": false
      },
      "combatState": 1,
      "enemies": [{ "formId": 1, "name": "Bandit", "distance": 100, "health": 50, "level": 1, "animation": "" }],
      "playerAnimation": "",
      "eventType": "tick"
    }
  }'
```

Expect `"urgent": true` and a health-critical or melee reflex in the engine log.

---

## 3. GET /api/actions → executor

| # | Check | Pass when |
|---|---|---|
| 3.1 | Poll loop | `skyguide` shows polling **active**. App GET `/api/actions?since=0` returns `[]` (empty array, not 404). |
| 3.2 | Known type | Enqueue a `notification` (see below). In-game HUD toast appears within ~1 s + poll interval. `?since=` then skips it. |
| 3.3 | Unknown type | Enqueue `{ "type": "open_door", "params": {} }`. Plugin ignores it (whitelist). Cursor still advances (`id` consumed). **Known gap:** composer still emits `open_door` / `use_potion`; map those before relying on AI-driven doors/potions. |
| 3.4 | Params wrapper | `{ "type": "heal", "params": { "amount": 25 } }` heals. Flat `{ "type": "heal", "amount": 25 }` also heals. Missing `amount` is ignored. |

**Enqueue without waiting for the composer** — start a session so the engine is up, then from a Node REPL in the app, or hit whatever test helper you add. Until then, the fused/gated pipeline emitting `actions: [{ type: "notification", params: { message: "test" } }]` is the live path: ask a question that should suggest an action, watch `GET /api/actions?since=0` while the plugin is **not** running, then start the plugin and confirm it drains.

Quick poll while the plugin is off:

```bash
curl -s 'http://localhost:3000/api/actions?since=0'
```

---

## 4. End-to-end (future playtest)

Do this only after 0–3 pass.

1. Companion `pnpm dev` on `:3000` (env set). Log line `[skyrim-file] mod context: …state.json`.
2. Plugin watch deploy running.
3. SKSE → load save → `skyguide` healthy.
4. Dashboard or `pnpm dev:player`: **Start** the engine, screen/Skyrim capture on.
5. Walk into a fight. Expect: dashboard vitals live, Gate/Composer observations that mention real NPCs/location from the dump, reflex if health tanks, TTS on the player/dashboard.
6. Optional: F9 PTT, ask “où est la porte ?” — STT → question → observation. Actions only run if the type is on the plugin whitelist.
7. **Menu focus (Access off):** open inventory (`I`). Expect TTS “Inventaire ouvert.” then the focused item; arrowing the list interrupts with the next name. `~` console → SkyGuide stays silent. Re-enable Skyrim Access → SkyGuide must **not** speak the list.

---

## 5. When you change code later

| You touched | Re-run |
|---|---|
| Collectors / `mod-context.ts` / dump path | §1 |
| Menu focus (`menu-focus*.ts`, `inventory-collector.ts`) | §4 step 7 |
| `serializer.ts` / protocol / `priority.ts` / HTTP client | §2 |
| `parser.ts` / `executor.ts` / `polling.ts` / outbox | §3 |
| App Gate/Composer/reflex/engine | §2 + §1.4 + §4 |
| Skyrim Platform version / webpack externals (`fs`) | §0 + §1.1 |

Do **not** treat the CEF companion page (`CONFIG.bridgeEnabled`) as part of this loop. The Electron player owns `/_ws`, capture, and TTS. Leave the overlay off until someone owns that feature.

### Still unverified in-game (spike before building on them)

- Node `fs` in this SP build (§1.1).
- CEF audio autoplay / mic / `getDisplayMedia` (`spike/cef-media-spike/`).
- `node:net` inside SP (optional later WS push).
