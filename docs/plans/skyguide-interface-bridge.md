# Plan: In-game companion interface + WebSocket bridge (skyguide-skse)

> Status: draft — v2 (2026-11-13)
> Builds on: `docs/research/skyrim-platform-capabilities.md` (§3 options table),
> `docs/research/feature-extraction-analysis.md` (targets 2, 3, 4, 5), and the two
> brainstorm reports `brainstorm-pathA-bridge.md` / `brainstorm-pathB-direct-ws.md`
> (their conclusions converge; the Phase-3 shape below reflects the merged design).

---

## Goal

Bring the skydive-app's newest feature — the **in-game Skyrim interface** for the AI
companion (narration display, voice status, TTS playback, action feedback) — into
skyguide-skse, and connect the plugin to the app's **WebSocket engine**
(`/ws`, binary clip/audio frames), which does not exist anywhere in the plugin today.

## Core constraint (verified)

Skyrim Platform JS has **no WebSocket, no TCP, no HTTP server** (`HttpClient` is
get/post only). But the **CEF browser overlay** (`browser` API) is a full Chromium
runtime and **can hold a real WebSocket** — this is the "websocket version" that
exists in skymp. The plugin bridges page ↔ game via:

- page → plugin: `window.skyrimPlatform.sendMessage(...)` → `on("browserMessage")`
- plugin → page: `browser.executeJavaScript("...")`

Production precedent: skymp5-front (`skymp5-front/src/index.js:41-46`,
`skymp5-client/src/services/services/browserService.ts`).
Audio playback in-page (`new Audio(...).play()`) ships in skymp5-front today.

⚠️ `browser.getToken()` was removed upstream (2849e676) — the page channel is
unauthenticated. The companion page must never be exposed beyond localhost.

## Architecture (target)

```
┌────────────────────── Skyrim process ──────────────────────┐
│  skyguide plugin JS                 CEF browser overlay     │
│  ┌──────────────────────┐   msg    ┌─────────────────────┐ │
│  │ collectors → state    │ ───────► │ companion page       │ │
│  │ executor ◄─ intents   │ ◄─────── │ (loaded from app)    │ │
│  └──────────────────────┘ bridge   └────────┬────────────┘ │
└─────────────────────────────────────────────┼──────────────┘
                                              │ WebSocket (real)
                                   ┌──────────▼───────────┐
                                   │ skydive-app  /ws      │
                                   │ engine + STT/TTS/Gemini│
                                   └──────────────────────┘
```

The page can be:
- **Option A (recommended):** a dedicated `/companion` page served by skydive-app,
  designed in-game (compact, readable, voice-status-first).
- **Option B:** reuse the app's operator dashboard (too heavy for in-game overlay; only for dev).

Fallback tier (no browser): sprite-text narration ticker via the Texts API
(`createText` + the new `setTextRefrScreenOffset`) — usable even if CEF misbehaves.

---

## Phase 0 — Quick wins in the existing plugin (no architecture change)

- [x] **TimersService pattern** (`skymp5-client/src/services/services/timersService.ts`):
  replace raw `setTimeout` in `src/actions/polling.ts` / `executor.ts` with
  game-loop timers that survive main-menu/loading screens. → `src/timers.ts` (2026-11-13)
- [x] **HTTP hardening** (`settingsService.ts:48-174` pattern): timeout-reject +
  jittered retry + cached-fallback wrapper in `src/communication/http-client.ts`
  (protects the 3-slot HttpClient pool from starvation). → timeout wrapper landed;
  jittered retry deferred to when the retry policy is finalized
- [x] **QoL switches** in `init()`: `Utility.setINIBool("bAlwaysActive:General", true)`
  (game keeps running while alt-tabbed — accessibility), vanity-camera delay.
- [x] **Delta fixes**: `EquippedItemType.Spell` → `SpellOrScroll` (no usage found — n/a);
  confirm nothing references `browser.getToken` (clean); add `getPlatformVersion` boot log.
- [x] **Cell enumeration upgrade**: replace the 9-offset `findClosestActor` scan in
  `nearby-collector.ts` with `Cell.getNumRefs(FormType.Character)` + `getNthRef` + `Actor.from`.
- [x] **Verified-API fix**: `Game.findClosestReference` in `executor.ts` does not
  exist → cell-enumeration `getClosestReferenceOfType` for doors/containers.
- [x] **Dead `/api/actions` poll loop**: `pollingEnabled: false` (endpoint verified
  absent in the app); poll code kept + switched to game timers for future use.
- [x] **Companion bridge scaffold** (`src/bridge.ts`): `companion-ready` handshake,
  heartbeat watchdog, safe double-JSON.stringify injection, `browserMessage` →
  `parseAction` → `executeAction` dispatch with action-id dedup, bad-menu overlay
  visibility, spike-result logging. `bridgeEnabled: false` until the app page exists.
- [x] **CEF media spike** (`spike/cef-media-spike/`): one-page in-game probe
  (audio autoplay, mic, capture presence, app WS reachability, Chromium floor).
- [x] **Gate/Composer mod-context dump** (2026-11-15): plugin now writes
  `Data/Platform/SkyGuide/state.json` in the parallel-array shape
  `parseSkyrimState` expects (`player.health`, `npcs.name`, `npcs.clock`,
  `player.compass`, …). Nearby enemies come from cell enumeration (hostiles
  only) instead of the 9-offset scan. Point the app's `SKYRIM_CONTEXT_FILE_PATH`
  at that file so Gate/Composer see live mod context (they do **not** read
  `POST /api/game-state`).

## Phase 1 — Texts narration tier (no browser dependency)

- [ ] Pooled narration ticker (last N lines, auto-expire) — pattern:
  `animDebugService.ts:63-105`; hot-reload-safe cleanup via `storage`:
  `netInfoService.ts:13-22`.
- [ ] Status line (connection + voice state): `setTextString`/`setTextPos`.
- [ ] World-anchored labels for nearby actors: `setTextRefr` +
  **`setTextRefrScreenOffset` (new API)** — "Bandit, 15 m, left".
- [ ] Wire to incoming narration events (app → actions channel, action kind
  `narrate`/`subtitle`) so text tier and browser tier share one intake.

## Phase 2 — Browser lifecycle for the companion page

- [ ] Port BrowserService state machine (`browserService.ts`, ~110 lines):
  - hide during bad menus (Barter/Book/Container/…, Loading Menu),
  - `setFocused` toggle (Enter/Escape hotkeys; note: `setFocused(true)` auto-opens
    the vanilla Cursor Menu — `BrowserApiTilted.cpp:44-75`),
  - visibility after mouse-move caveat for `loadUrl` (documented in `browser.md`).
- [ ] `browser.loadUrl("http://localhost:3000/companion")` after first mouse move.
- [ ] `front-loaded` handshake: page calls `window.skyrimPlatform.sendMessage('front-loaded')`
  → plugin marks page ready before pushing state.
- [ ] `on("browserMessage")` dispatch table → route page intents into
  `src/actions/executor.ts` (same parse/validate path as HTTP actions).

## Phase 3 — WebSocket bridge (the new transport)

- [ ] **Page side**: companion page opens `ws://localhost:3000/_ws?client=skyrim`
  (endpoint is `/_ws` — Nitro mounts `server/routes/_ws.ts` there; corrected 2026-11-13).
  The page owns the WebSocket (real Chromium API) — plugin never touches WS.
  The engine already broadcasts `gameState` to all peers after each HTTP POST
  (`engine.ts` §727-779), so the page needs **no** plugin→page state push to stay fresh.
- [ ] **Plugin → page**: rare events only (loading-screen / menu-open / label
  updates) — per-tick state injection explicitly avoided (Path A/B brainstorm,
  converged design 2026-11-13).
- [ ] **Page → WS**: page forwards state to the app; receives back narration/TTS.
- [ ] **Audio**: TTS binary audio frames → page `WebAudio`/`<audio>` playback
  (proven in skymp5-front). Voice-status chip driven by WS events.
- [ ] **Actions**: app sends `sendAction(...)`-style commands → WS → page →
  `window.skyrimPlatform.sendMessage('action', {...})` → plugin executor.
  (Keep existing HTTP `/api/actions` polling as fallback until bridge is proven.)
  ⚠️ 2026-11-13 status: actions are dead code end-to-end today — no `/api/actions`
  route exists in the app, the engine only *broadcasts* `actions` and nothing
  consumes it, and both connectors' `sendAction` are stubs. Wiring this is the
  first real bridge deliverable; decide claim semantics (target the skyrim client
  vs broadcast+claim) to avoid double-execution.
- [ ] Escape all strings injected via `executeJavaScript` (doc'd escaping rules).

## Phase 4 — App-side connector alignment

- [ ] Register the skyrim WS client as a distinct client kind in the app engine.
- [ ] Implement `SkyrimWsConnector` (app): `getContext()` = latest buffered plugin
  state; `sendAction()` = forward to the skyrim WS client (falls back to file
  connector when the game isn't running).
- [ ] `SkyrimFileConnector` stays as offline/sim mode (plugin writes
  `state.json` via Node `fs` — optional, same-machine only).

## Phase 5 — Enrichment (after the bridge works)

- [ ] Rich `hit` payload (`isPowerAttack`/`isSneakAttack`/`isHitBlocked`) → combat
  narration for blind players.
- [ ] Generic `papyrus` action kind from SpSnippetService (allowlisted functions).
- [ ] `disablePlayerControls` sequencing during guided walks; UI-open flow from
  §2.7 of the extraction analysis.

---

## Non-goals (scope guard)

- No `mpClientPlugin` transport (requires multiplayer install; RakNet framing).
- No external bridge process (no spawn precedent in SP JS).
- No SWF/scaleform menus.
- No dashboard reuse as the in-game page (heavy; dev-only at most).

## Verification checklist per phase

- Phase 0: plugin builds (`npm run build`), in-game: poll + state send survive
  loading screen; console `skyguide` status reflects new timers.
- Phase 1: narration lines appear/disappear cleanly across hot reload.
- Phase 2: page loads in-game, hides during menus, focus toggles work.
- Phase 3: WS connects; round-trip: game state → app → TTS audio heard in-game;
  action from app executes in-game within ~1 s.
- Phase 4: app shows live game state from the WS connector; actions flow without
  the HTTP polling path enabled.
