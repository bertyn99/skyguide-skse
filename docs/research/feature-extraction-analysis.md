# Feature-extraction analysis: what to borrow from the updated skymp repo

Deep-dive of `skymp/` at commit `2849e676` (was `41417ef3`, +83 commits, ~April–Nov 2026) for the
skyguide-skse plugin. Companion to `docs/research/skyrim-platform-capabilities.md` (the capabilities
baseline — this doc does not repeat it, it catalogs **extractable code and patterns**).

All API names verified against the vendored codegen sources:
- `skymp/skyrim-platform/src/platform_se/codegen/convert-files/Definitions.txt` (3478-line sibling
  `skyrimPlatform.ts` holds the game-class methods; Definitions.txt holds globals/events/enums).
- The vendored package is still `@skymp/skyrim-platform` **2.9.0** (`skymp/skyrim-platform/package.json`),
  so the delta vs. our installed 2.9.0 typings is exactly the 83-commit diff analyzed below.

---

## 1. Executive summary — top extraction targets (ranked by value/effort for skyguide)

| # | Target | Skyguide feature it feeds | Difficulty |
|---|--------|---------------------------|------------|
| 1 | Game-loop timers (TimersService) | Replace raw `setTimeout` in `src/actions/polling.ts` & `executor.ts` | copy-pattern (~120 lines) |
| 2 | Texts overlay patterns: pooled text lines + hot-reload-safe cleanup + **world-anchored labels** | Narration log / "screen reader" HUD tier-2; world labels for nearby actors | adapt |
| 3 | BrowserService focus/visibility/bad-menus state machine | In-game companion UI ("Skyrim interface") lifecycle | copy-pattern (~110 lines) |
| 4 | CEF audio proof + front boot handshake (`front-loaded`, `new Audio().play()`) | TTS/clip playback in-game — the app's binary audio frames | zero-extraction (verified fact) + small pattern |
| 5 | SpSnippetService generic Papyrus runner | A generic `papyrus` action kind (class.function(args) by name) instead of hardcoding every stub | adapt |
| 6 | HTTP-with-timeout/retry state machine (settingsService.getTargetPeerImpl) | Hardening `src/communication/http-client.ts` (timeout on GET, jittered retry) | copy-pattern |
| 7 | Activate-triggered UI open: `activate` event → `browser.setFocused(true)` + `CustomEvent` dispatch | Opening the companion UI from game interaction (e.g. a hotkey or an in-world activator) | copy-pattern (~15 lines) |
| 8 | Combat awareness: `hit` event payload + attack/animation hooks + weapon timings | Combat narration for blind players (who swung what, power/sneak/block) | adapt |
| 9 | Game QoL switches: `bAlwaysActive:General`, `fAutoVanityModeDelay`, `Game.setInChargen`, `startDeferredKill` | Companion usability while alt-tabbed; camera sanity | copy-pattern (few lines) |
| 10 | Nickel-and-dime SP globals we never wired: `encodeUtf8/decodeUtf8`, `getFileInfo`, `setPrintConsolePrefixesEnabled`, `getJsMemoryUsage`, `getPlatformVersion`, `blockPapyrusEvents` | Diagnostics, binary framing, console hygiene | drop-in |
| 11 | ClientListener/controller architecture + `logError`/`logTrace` | Structural refactor of skyguide into services (optional, later) | adapt |
| 12 | Locale-file i18n pattern (`Data/Platform/Distribution/locale`) | Localized narration/labels without shipping strings in code | copy-pattern (~20 lines) |

---

## 2. Per-target details

### 2.1 TimersService — setTimeout/setInterval that run on the game loop

**What it is.** skymp5-client deliberately does *not* trust the bare global `setTimeout` for in-game
timing (though the runtime does provide one — `profilingService.ts:48` uses it inside an async
function). It reimplements timers whose callbacks fire from `update` (in-game) or `tick` (main menu)
frames, and **switches between the two automatically**:
`Main menu open` → subscribe `tick`; `preLoadGame` → unsubscribe and subscribe `update`
(`skymp/skymp5-client/src/services/services/timersService.ts:81-103,149-165`).

**Why skyguide cares.** Our polling chain (`src/actions/polling.ts`) and timed key releases
(`src/actions/executor.ts`) use raw `setTimeout`. Two known failure modes in SP:
`update` doesn't fire in the main menu (so a `setTimeout`-scheduled game API call can run where
Papyrus throws), and vanilla `setTimeout` timing is not tied to frames (fires can pile up behind
loading screens / paused game). TimersService is the battle-tested answer, including the
"promises don't work in the main menu" caveat at `settingsService.ts:60`.

**Difficulty:** copy-pattern. Strip the `eval(handler)` string branch (we never need it) and the
`storage`-persisted process-method key if you always init after `update` exists.

**Key snippet** (`timersService.ts:31-41,105-122` — condensed):
```ts
setTimeout(handler: Function, timeout?: number): number {
  const timer = { handler, delayMs: timeout ?? 0, passedMs: 0 };
  // ... reuse free slot or push; id = index + 1
}
private processTimers(): void {
  const dt = Date.now() - this.lastCallTime; this.lastCallTime = Date.now();
  for (let i = 0; i < this.timersArr.length; ++i) {
    const timer = this.timersArr[i];
    if (timer) { timer.passedMs += dt;
      if (timer.passedMs >= timer.delayMs) { this.timersArr[i] = null; timer.handler(); } } }
}
```
registered as: `this.controller.on(ProcessMethodType.tick | 'update', () => this.processTimers())`.

**Risks/gotchas**
- `timersService.ts:120` uses `eval` for string handlers — do not port that.
- If you keep the tick/update switch, you must `sp.unsubscribe(handle)` before re-subscribing
  (they leak the old handle check at lines 151-153, 160-162).
- `FIXME(GM-1008)` at line 97 — a known dead `if` in `setProcessMethod`; ignore.

---

### 2.2 Texts overlay patterns — narration log, HUD status, world labels

**What it is.** Three proven idioms around `createText`/`setText*`/`destroyText` (names verified in
`Definitions.txt:1540-1585`):

a) **Pooled text lines as a scrolling log** — `AnimQueueCollection`
(`skymp5-client/src/services/services/animDebugService.ts:63-105`): pre-create N text ids stacked
with a fixed `yPosDelta`, `push()` shifts every line's content/color down one slot via
`setTextString`/`setTextColor`. This *is* a screen-reader ticker for narration history.

b) **Hot-reload-safe cleanup via `storage`** — both `NetInfoService`
(`netInfoService.ts:13-22,128-162`) and `AnimDebugService` (`animDebugService.ts:14-22`) store the
object holding their text ids in `sp.storage[Name]` and destroy old texts on constructor re-entry
(hot reload wipes handlers but **not** `storage`). Without this, every plugin reload leaks texts.

c) **World-anchored labels on actors** — `FormView.update` nickname block
(`skymp5-client/src/view/formView.ts:547-586`): compute head node world position
(`NetImmerse.getNodeWorldPositionX/Y/Z`, `skyrimPlatform.ts:2986-2988`), project with
`worldPointToScreenPoint` (returns **normalized 0..1** coords; index `[2] <= 0` means *behind
camera* — `formView.ts:503-510,573`), convert with `getScreenResolution()`
(`Utility.getINIInt("iSize W:Display")`, `formView.ts:25-32`), create/`setTextPos`/`destroyText`
per-actor, gated by `getDistance(refr) <= 1000 && playerActor.hasLOS(refr)` (line 552-553).

**The delta win.** The 83-commit update added
`setTextRefrScreenOffset/getTextRefrScreenOffset` (`Definitions.txt` +1565/+1580; C++:
`skyrim-platform/src/platform_se/skyrim_platform/TextApi.cpp:208-235,459-461`) on top of the
already-present `setTextRefr`/`setTextRefrNode`/`setTextRefrOffset` family. New release doc:
`skymp/docs/release/dev/sp-text-refr.md` — texts attached to a form re-project **every engine
frame in C++**, with documented semantics: empty node name ⇒ object `GetPosition()` works even
without loaded 3D; node-not-found ⇒ position not updated that frame; texts behind camera not moved;
`setTextRefr(id, 0)` detaches and restores last `setTextPos`.

**Why skyguide cares.** For blind players, world labels ("Bandit, 12 m, ahead-left") are a core
narration primitive. Two implementation tiers:
- **Zero-JS-per-frame tier (new):** `createText` once + `setTextRefr(id, formId)` +
  `setTextRefrNode(id, "NPC Head [Head]")` + `setTextRefrScreenOffset(id, [0, 32])` — the C++
  layer tracks the label; our per-tick code only toggles `setTextString`/color/visibility. Note the
  screen offset is applied *after* projection (`TextApi.cpp:459-461`:
  `text.x = round(outX*w) + screenOffset[0]`), so a `[0, +Y]` offset floats the label above heads
  — but be aware +Y here is in **pixels** (screen space), matching the doc's "(x, y) screen offset".
- **Log tier:** copy the AnimQueueCollection pool for a narration history strip, and the
  `NetInfoTexts` two-column status layout (`netInfoService.ts:128-150`) for
  "SkyGuide: connected / listening / muted" status lines.

**Difficulty:** adapt (extract the pool class + storage-cleanup idiom; labels are a few calls).

**Risks/gotchas**
- Text visibility follows `browser.setVisible` (`texts.md`; clientListener.ts:12 declares
  `setTextsVisibility('inheritBrowser'|'off'|'on')` — `inheritBrowser` is the default semantic).
  If the companion UI hides the browser (bad menus), sprite texts vanish too — or set `on` to
  decouple them from the browser.
- ASCII-only spritefonts (`texts.md`) — localize via the browser tier instead, or ship a `.spritefont`.
- Pooled ids are 1-based and live per plugin instance; keep ids in `storage` (idiom b).

---

### 2.3 BrowserService — visibility/focus/bad-menus state machine

**What it is.** `skymp5-client/src/services/services/browserService.ts` (110 lines) is the whole
lifecycle of the CEF overlay:
- boot: `setVisible(false)` in ctor, `setVisible(true)` on first `update` (lines 16, 54-56);
- **F2 toggles visibility, F6 toggles focus, Enter focuses, Escape unfocuses** (lines 26-52);
- focus/unfocus are mirrored into the page as `CustomEvent`s so the React app can react
  (lines 9-10: `window.dispatchEvent(new CustomEvent('skymp5-client:browserFocused', {}))`);
- `browserMessage` `{ "front-loaded" }` is the page→plugin boot handshake that emits
  `browserWindowLoaded` (lines 58-64) — services wait on it before `executeJavaScript` pushes;
- **bad-menus set**: while Barter/Book/Container/Crafting/Gift/Inventory/Journal/Lockpicking/
  Loading/Map/RaceSex/Stats/Tween/Console/Main is open, the browser is hidden; a `Set` counts
  nesting and re-shows when empty; special-case `Menu.HUD` open ⇒ visible, close ⇒ hidden
  (lines 66-89, 93-109).
- keyboard polling is itself driven by a `queryKeyCodeBindings` emitter fed by
  `KeyboardEventsService`, which only fires when `Input.getNumKeysPressed()` **changed**
  (`keyboardEventsService.ts:12-27`) — a cheap change-detection pattern.

**Why skyguide cares.** The planned in-game companion UI will fight the same vanilla-UI conflicts.
This is the exact, tested rule set, including the non-obvious ones: hide while `Menu.Loading`
(our loading guard) and while the main menu is up; re-show on HUD menu open.

**Difficulty:** copy-pattern. Swap F1/F2/F6 for SkyGuide keys (configurable via `settings`), keep
the bad-menus list verbatim.

**C++ semantics you must know** (undocumented in `browser.md`):
- `setFocused(true)` **auto-opens the vanilla Cursor Menu** (mouse cursor) and remembers it opened
  it; `setFocused(false)` closes it again
  (`skyrim-platform/src/platform_se/skyrim_platform/BrowserApiTilted.cpp:44-75`,
  `thread_local g_cursorIsOpenByFocus`). So focusing the browser shows a cursor — fine for a
  dialog UI, but expect `menuOpen('Cursor Menu')` events; don't treat that as a "bad menu".
- NirnLab backend (`BackendName = nirnlab`, `docs/skyrim_platform/ini_settings.md` delta) exists
  with **remote debugging port 9000** hardcoded (`BrowserApiNirnLab.cpp:15`) — useful to devtools
  our UI; `auto` currently falls back to tilted (`BrowserApi.cpp:13-18`).
- NirnLab queues `executeJavaScript` until the browser exists (`BrowserApiNirnLab.cpp:88-126`);
  tilted does not — call it only after `front-loaded` to be backend-safe.

**Key snippet** (browserService.ts:66-85, condensed):
```ts
onMenuOpen(e: MenuOpenEvent) {
  if (this.isBadMenu(e.name)) { this.sp.browser.setVisible(false); this.badMenusOpen.add(e.name); }
  else if (e.name === Menu.HUD) { this.sp.browser.setVisible(true); }
}
onMenuClose(e: MenuCloseEvent) {
  if (this.badMenusOpen.delete(e.name) && this.badMenusOpen.size === 0) setVisible(true);
  if (e.name === Menu.HUD) setVisible(false);
}
```

---

### 2.4 CEF audio proof + front handshake (TTS/clip playback unblocked)

**Verified facts (from the updated checkout):**
- The in-game front plays sounds with plain HTML5 audio in production:
  `window.playSound = (name) => { (new Audio(require('./sound/' + name).default)).play(); }`
  (`skymp/skymp5-front/src/index.js:44-46`), wired to chat dice/UI events; assets are mp3/wav in
  `skymp5-front/src/sound/`. **CEF audio output therefore works** — the UNVERIFIED caveat in the
  capabilities doc §6/§7 can be retired (still worth an in-game smoke test with TTS sample rate).
- The page→plugin handshake is `window.skyrimPlatform?.sendMessage('front-loaded')` after boot
  (`skymp5-front/src/index.js:41-43`), received in BrowserService as `browserMessage`
  (`browserService.ts:58-64`). Our companion page should copy this before we `executeJavaScript`
  anything into it.
- `window.skyrimPlatform` may be **absent** when the page loads (plain browser) — the front
  guards it (`index.js:13-16: if (!window.skyrimPlatform) { window.skyrimPlatform = {}; }`). Our
  page must be loadable outside the game for development.
- Dev hot-reload into the game: `browser.loadUrl("localhost:1234")` against the vite/webpack dev
  server (`frontHotReloadService.ts:37-42`) — direct precedent for pointing the in-game browser at
  `skydive-app`'s dev URL. Production front is built by CMake into
  `dist/client/Data/Platform/UI` (`skymp5-front/CMakeLists.txt:16,36-45`), which the platform loads
  by default from `file:///Data/Platform/UI/index.html`
  (`skyrim-platform/src/tilted/ui/MyChromiumApp.cpp:152,239`).
- Front tech: React + Redux + react-draggable/resizable, draggable/resizable chat with
  `MAX_LINES = 10`, history of 20, font-size setting, contenteditable input
  (`skymp5-front/src/constructorComponents/chat/index.js:18-27`) — a usable template for a
  narration panel; the widgets system (`src/utils/Widgets.js`, `window.skyrimPlatform.widgets.set`)
  is how plugin JS swaps whole UI blocks via `executeJavaScript('window.skyrimPlatform.widgets.set([]);')`
  (`authService.ts:160`).

**Why skyguide cares.** The app's WebSocket engine + binary clip/audio frames can live entirely in
this page; the plugin only shuttles JSON state in and action intents out.

**Difficulty:** zero-extraction for the fact; small pattern for handshake + dev-server flow.

---

### 2.5 SpSnippetService — generic "call any Papyrus function by name" runner

**What it is.** `skymp5-client/src/services/services/spSnippetService.ts` executes a network-supplied
`{ class, function, selfId, arguments[] }` against the SP API surface, then reports the result:
- runs inside `once('update')` (`spSnippetService.ts:22`) — the "Papyrus only in events" rule;
- class resolution is case-insensitive over the whole SP namespace with `Class.from(form)` casting
  (lines 149-201): `const cl = this.spAny[class] ?? matchingKey; return await cl.from(self)[fn](...args)`;
- arguments can be form references `{ formId, type }` rehydrated via `Game.getFormEx` + class cast
  (`deserializeArg`, lines 149-169);
- result must be a primitive (number/string/boolean/null) or it is rejected (lines 30-40) —
  same serialization constraint our `serializer.ts` already respects;
- special-cases `showracemenu` with a 1 s delay and per-function overrides (lines 89-102).

**Why skyguide cares.** This is a ready-made architecture for the app's `sendAction` seam: one
generic `papyrus` action kind would make the executor's hard-coded stubs (equip/spell/etc.)
growable server-side without plugin releases, while keeping a primitive-only result contract and
`update`-context discipline. Combine with the research-doc §5 verified method list as an allowlist
(skymp gates the *source* of snippets with signed JS — we gate by allowlist instead).

**Difficulty:** adapt (drop networking, keep resolution/casting/`update` discipline; add an
allowlist check).

**Key snippet** (`spSnippetService.ts:171-201`, condensed):
```ts
private async runMethod(snippet) {
  const self = this.sp.Game.getFormEx(remoteIdToLocalId(snippet.selfId));
  const cl = resolveCaseInsensitive(this.spAny, snippet.class);   // e.g. "actor"
  const selfCasted = cl.from(self);                                // Actor.from(...)
  return await selfCasted[snippet.function](...snippet.arguments.map(a => this.deserializeArg(a)));
}
```

---

### 2.6 HTTP with timeout + jittered retry (settingsService)

**What it is.** Two battle-tested shapes for the exact HttpClient we use:
- **State-machine request with timeout and fallback** — `getTargetPeerImpl`
  (`skymp5-client/src/services/services/settingsService.ts:61-139`): callback-based (because
  "promises don't work in the main menu", line 60), `TimersService.setTimeout(…, 5000)` reject
  path (line 82-85), exactly-once resolution guard (`resolved` flag), and a cached-value fast
  path (`getTargetPeer`, lines 48-58).
- **Retry loop with jitter** — `getServerMods` (lines 141-167): 5 attempts, `Utility.wait(0.1 +
  Math.random())` between attempts, status/JSON error separation.
- URL normalization for trailing slash (lines 169-174) — we hit this against localhost:3000 too.

**Why skyguide cares.** `HttpClient` has no timeout option (capabilities doc §3); a hung GET in
`polling.ts` currently blocks a slot of the 3-thread pool forever. Wrapping GETs with the
timer-based reject + cached fallback is the pattern to steal.

**Difficulty:** copy-pattern.

---

### 2.7 Opening a full-screen companion UI from game interaction

**What it is.** `SweetTaffySkillMenuService`
(`skymp5-client/src/services/services/sweetTaffySkillMenuService.ts:19-32`): on an `activate`
event whose target is a known form, `browser.setFocused(true)` then
`browser.executeJavaScript("window.dispatchEvent(new CustomEvent('initSkillMenu'))")` — the React
page listens for the CustomEvent and mounts a Skyrim-styled full-screen menu
(`skymp5-front/src/features/skillsMenu`). Same trick for our "say 'SkyGuide' / press K to open
companion": plugin decides, page renders, and `browserService`'s focus strings
(`browserFocused`/`browserUnfocused` CustomEvents) let the page know when it gains/loses input.

Companion tricks for modal UI while focused (from `sweetCameraEnforcementService.ts`):
`Game.forceThirdPerson()` + `Game.disablePlayerControls(true, false, true, …)` while an
immersive anim/scene runs (lines 172-174, 449-452), re-enabling via `Utility.wait` chains
(lines 214-223) — the exact sequencing to freeze the game politely while the companion UI or a
scripted walk plays.

**Difficulty:** copy-pattern (~15 lines + page-side listener).

---

### 2.8 Combat awareness for narration

**What to take:**
- **`hit` event payload** (`hitService.ts:74-82`): `isBashAttack, isHitBlocked, isPowerAttack,
  isSneakAttack, projectile, source, target` — everything a narration sentence needs
  ("A bandit power-attacked you with an iron sword; you blocked it"). Note the delta: the
  event's `agressor` typo property was **removed**; only `aggressor` exists now
  (`skyrim-platform/src/platform_se/skyrim_platform/EventHandler.cpp:687` diff).
- **Magic-hit dedup**: magic projectiles double-fire; dedup on
  `aggressorId + Date.now() < 100 ms` (`hitService.ts:55-65`). Directly reusable.
- **Weapon context**: `player.getEquippedWeapon(isLeftHand)?.getWeaponType()` and
  `WeaponType` enum for per-weapon sentences; per-weapon *timing tables* with config fallback
  (`sweetTaffyPlayerCombatService.ts:241-340`) show the shape of a data-driven per-weapon map.
- **Animation hooks as combat telemetry**: `hooks.sendAnimationEvent` with wildcards like
  `'attackStart*', 'AttackStart*'`, `'blockStart'`, `'attackPowerStart*'` and cancelling via
  `ctx.animEventName = ""` inside `enter`
  (`sweetTaffyPlayerCombatService.ts:69-145`, `deathService.ts:31-75`). For narration we only
  need `leave`-side `animationSucceeded` checks — cheap, already-filtered by the engine.
- **Player state snapshot per frame** for context: `getActorValue("Stamina")`, `isSprinting()`
  (`sweetTaffyPlayerCombatService.ts:63-67`); casting detection via
  `getAnimationVariableBool("IsCastingRight|Left|Dual")` (`sendInputsService.ts:43-51`).
- **`getHeadingAngle(other)`** (`skyrimPlatform.ts:1804`) — *verified present*; gives bearing to a
  target without trigonometry on our side. Combined with `getDistance` and
  `ObjectReferenceEx.getDistanceNoZ` (`skymp5-client/src/extensions/objectReferenceEx.ts:24-36`,
  plain `Math.sqrt` — no hidden API), this covers "12 m, ahead-left" phrasing.

**Difficulty:** adapt (events + payload mapping; no new APIs).

---

### 2.9 Game QoL switches (few lines, high value)

From `skymp5-client/src/index.ts:62-66` and `enforceLimitationsService.ts`:
```ts
once("update", () => {
  Utility.setINIBool("bAlwaysActive:General", true);          // simulate in background / alt-tab
  Utility.setINIFloat("fAutoVanityModeDelay:Camera", 3600);   // no auto-vanity cam stealing view
});
this.sp.Game.setInChargen(true, true, false);                 // enforceLimitationsService.ts:17,21
```
For a blind player who will alt-tab constantly (screen reader, web app), `bAlwaysActive:General`
is arguably mandatory. `fAutoVanityModeDelay` (added in this delta, `skymp5-client/src/index.ts`
diff) stops the idle vanity camera from silently rotating the view. `Game.setInChargen` is
mp-specific — **skip** it; note `startDeferredKill()` on the player (`deathService.ts:22-25`) is
also mp-death-flow-specific.

---

### 2.10 Small SP globals worth wiring now (all verified in `Definitions.txt`)

| API | Line | Skyguide use |
|---|---|---|
| `encodeUtf8(text): ArrayBuffer` / `decodeUtf8(buf): string` | 16-17 | Canonical UTF-8 bytes for hashes/checksums of narration text; binary framing experiments |
| `getFileInfo(filename): {crc32, size}` | 1584 | Integrity/manifest reporting to the app (see safe-wrapper `loadOrderVerificationService.ts:133-146`) |
| `setPrintConsolePrefixesEnabled(bool)` | 7 | Clean console when diagnosing |
| `getJsMemoryUsage()` | 9 | Long-session leak monitoring (already known; still unwired) |
| `getPlatformVersion()` | 12 | Assert SP version ≥ our minimum at boot |
| `blockPapyrusEvents(bool)` | 14 | Freeze Papyrus scripts during scripted sequences (skymp uses it at `blockPapyrusEventsService.ts:11-19` — note it must be called once on `tick` *and* via `TESModPlatform.blockPapyrusEvents` on `update`) |
| `getAnimationVariablesFromActor(formId): ActorAnimationVariables` (+ `castSpellImmediate`, `applyAnimationVariablesToActor`, `setCollision`) | 1621-1627 | Bulk animation-variable extraction without 100 Papyrus calls; spell-casting replication if we ever drive NPCs |
| `sendIpcMessage` / `ipcMessage` | 15, 32-38 | Splitting skyguide into a heavy collector plugin + light executor plugin later |

---

### 2.11 ClientListener/controller architecture (optional structural refactor)

`skymp5-client` wires ~50 services through one `CombinedController` = SP `on/once` + an internal
`EventEmitter` + `lookupListener(Constructor)` for typed cross-service calls
(`skymp5-client/src/services/services/clientListener.ts:24-46`; registration list in
`skymp5-client/src/index.ts:70+`). Plus `logging.ts` `logError/logTrace` that print
`Error.stack` and the service class name (`skymp5-client/src/logging.ts:4-24`). If skyguide grows
 collectors + executor + UI + connector in one file set, this is the pattern that keeps it
 navigable — including the augmentation block pattern for not-yet-published typings
 (`clientListener.ts:11-22` is how they declare the brand-new `setTextRefrScreenOffset` before
 npm typings catch up — we can do the same against our 2.9.0 typings).

---

### 2.12 Locale-file i18n without code changes

`authService.ts:40-77` and `sweetCameraEnforcementService.ts:45-52`: read
`./Data/Platform/Distribution/locale` (a plain text file, resolved against Skyrim's CWD), trim,
map to a `translations[lang]` record, and on browser pages push
`browser.executeJavaScript(\`window.setLanguage(${lang})\`)`. For SkyGuide's UI strings and
notification templates, this lets users (or the app) localize without recompiling. Failure path is
`catch { /* default to en */ }` — copy that too.

---

## 3. Newly-added SP APIs / behavior since March (the 83-commit delta)

Verified by `git diff 41417ef3..2849e676` over `skyrim-platform/`, `skymp5-client/`, `docs/`:

1. **`setTextRefrScreenOffset(textId, [x, y])` / `getTextRefrScreenOffset(textId)` added**
   (`Definitions.txt`; `TextApi.cpp:208-235,573-576,620-624`; `TextsCollection.cpp:99-107,162-166`;
   `TextToDraw.h:+29`). Projection now applies it *in screen pixels after rounding*
   (`TextApi.cpp:459-461`). Relevance: **high** — precise label placement for world labels and
   narration markers without per-frame JS.
2. **`browser.getToken()` removed** (commit `be606c9f`, "drop browser.getToken", Apr 2026; also
   `Definitions.txt:71-76`). The `window.spBrowserToken` injection and the "loadUrl waits for
   mouse move" token gating were deleted (`MyChromiumApp.cpp` diff). Our plugin never used it; the
   browserMessage channel is now plain and unauthenticated — fine for localhost, **don't expose
   the browser page on LAN** expecting the token to protect it.
3. **`EquippedItemType.Spell` alias removed; `SpellOrScroll = 9` is the only name**
   (`Definitions.txt:1423`; `ConstEnumApi.cpp` diff; usage example
   `skymp5-client/src/services/services/magicSyncService.ts:166-171` now compares `=== 9`).
   Our executor/collector must use `SpellOrScroll` (or raw `9` if pinned to old typings).
4. **`Debug.ChromiumEnabled` INI removed** (deprecated) — replaced by
   `[Browser] BackendName = auto|off|tilted|nirnlab` (`BrowserApi.cpp` diff;
   `docs/skyrim_platform/ini_settings.md` delta). Browser is always on now; ** NirnLab backend
   adds remote debugging port 9000** (`BrowserApiNirnLab.cpp:15`).
5. **Multifile plugins no longer load**: plugin enumeration now skips directories entirely
   (`SkyrimPlatform.cpp` diff ~line 314-347: `if (!it.is_directory()) paths.push_back(...)`) and
   the SystemJS polyfill `___systemPolyfill.js` is no longer injected into the engine. Skyguide
   must ship as a **single bundled file** in `Data/Platform/Plugins` (we already do — keep it).
6. **`hit` event `agressor` (typo) property removed** — only `aggressor` (`EventHandler.cpp:687`).
7. **Plugin-folder monitor hardening**: directory-change handle leak fixed
   (`FindCloseChangeNotification`, `DirectoryMonitor.cpp:11-16`) and missing-folder is now
   explicitly tolerated (`ERROR_FILE_NOT_FOUND || ERROR_PATH_NOT_FOUND`, lines 43-50) — matches
   the HEAD commit "load plugins when a plugin folder is missing (#2804)".
8. **Build tooling swapped**: `TSConverter.cpp` (249 lines) deleted in favor of
   `skyrim-platform/tools/ts_converter/index.js` (node script). No plugin-facing impact.
9. **No changes** to `cookbook.md`, `browser.md`, `texts.md`, `new_events.md` in this delta
   (`git diff --stat` shows only `ini_settings.md` and the new `sp-text-refr.md` under docs/) —
   the research doc's citations of those files remain valid.

**Also new in skymp5-client behavior worth copying:** the `fAutoVanityModeDelay:Camera` INI set
(§2.9) and the locale-file i18n (§2.12) both landed in this window.

---

## 4. Explicitly NOT worth extracting (scope-creep guard)

| Feature | Why not |
|---|---|
| `networkingService` / `mpClientPlugin` packet loop | Requires a skymp server + the multiplayer client plugin; our transport is the app (HTTP + browser). |
| `authService` (1400+ lines: Discord/GitHub OAuth, widget setters, session files) | Pure skymp.net infrastructure. The *locale* and *executeJavaScript-widget* idioms are extracted separately (§2.4, §2.12). |
| Server-JS signature verification (`serverJsVerificationService`, `// skymp:sig:y:GM` prefixes in `sweetTaffyEvalService.ts:57`) | Threat model is "untrusted game server"; ours is "our own app on localhost". If we ever eval code from the app (we shouldn't), the allowlist approach in §2.5 is enough. |
| Gamemode event-source / `gamemodeEventSourceService` remote scripting | Same as above; also couples client to server model semantics. |
| `loadGameService`, `worldCleanerService`, `ragdollService`, `disableFastTravel/SkillAdvance/Difficulty` | Multiplayer session semantics; SkyGuide is single-player companion. |
| `timeService` | Drives *fixed* GlobalVariable form IDs (0x35-0x3a) to force real-time clock — mp server-time feature, destructive to vanilla time. |
| `enforceLimitationsService` (`Game.setInChargen`) | Blocks vanilla level-ups/skill menus — anti-cheat, anti-feature for a companion. |
| `Ui.openCustomMenu` (SWF) tier-4 UI | No SWF assets; CEF is strictly better for our HTML UI. |
| Full `skymp5-front` React app as-is | Chat/RP-specific; take the chat *patterns* (§2.4) and build the companion panel in the app's own UI instead. |
| `sweetTaffy*` perk/skill menus, `craftService`, `dropItemService`, `playerBowShotService`, `magicSyncService` sync logic | mp gameplay sync, not companion infrastructure. |
| Porting TimersService's `eval`-string branch and `ProcessMethodType` storage dance | YAGNI; see §2.1 risks. |

---

## 5. Suggested extraction order (aligned with the app's SkyrimConnector + in-game interface plan)

1. **Quick wins in the existing plugin (day 1, no architecture change):**
   - TimersService (trimmed) → back `polling.ts` GETs and `executor.ts` key holds; add the
     settingsService-style timeout+fallback wrapper to `http-client.ts` (§2.1, §2.6).
   - QoL `once("update")` switch block: `bAlwaysActive`, `fAutoVanityModeDelay` (§2.9).
   - Fix `EquippedItemType` usage to `SpellOrScroll` if the collector reads equipped types; confirm
     no plugin code references `browser.getToken` (it doesn't — just keep the delta in mind).
2. **Texts tier (narration without the browser):** port the `storage`-safe text-pool idiom and build
   the narration ticker + status lines; prototype world labels with `setTextRefr` +
   `setTextRefrScreenOffset` (§2.2). This gives a usable companion display even before the app UI
   is embedded, and doubles as the fallback if CEF misbehaves.
3. **Browser lifecycle:** copy BrowserService's state machine (bad menus, focus strings,
   `front-loaded` handshake) and point `browser.loadUrl` at `localhost:3000` (dev) — the app's
   SkyrimConnector page then runs with real WebSockets and `<audio>` for TTS/clip frames (§2.3, §2.4).
   Wire `browserMessage` → action intents into `src/actions/executor.ts`.
4. **Action surface growth:** add the generic `papyrus` action kind adapted from SpSnippetService
   with an allowlist built from the capabilities doc §5 verified list; add the
   activate-hotkey UI-open flow (§2.7) and `disablePlayerControls` sequencing for guided walks.
5. **Combat/narration enrichment:** `hit` payload + attack/animation hooks + `getHeadingAngle`
   phrasing into the collectors (§2.8).
6. **Optional structural:** services/controller split + `logError/logTrace` (§2.11), locale file
   (§2.12), `getPlatformVersion` boot assert and `getJsMemoryUsage` watchdog (§2.10).

---

## 6. Source index (what to open, by topic)

- Timers: `skymp5-client/src/services/services/timersService.ts` (esp. 31-79, 105-147, 149-165).
- Browser lifecycle: `skymp5-client/src/services/services/browserService.ts` (all 110 lines);
  C++ focus semantics `skyrim-platform/src/platform_se/skyrim_platform/BrowserApiTilted.cpp:44-75`;
  NirnLab backend `BrowserApiNirnLab.cpp` (all); backend INI `docs/skyrim_platform/ini_settings.md`.
- Texts: `animDebugService.ts:63-105`; `netInfoService.ts:1-162`;
  `view/formView.ts:25-32,470-607`; `loadOrderVerificationService.ts:101-110`; C++
  `TextApi.cpp:205-235,427-470`; release doc `docs/release/dev/sp-text-refr.md`; enum surface
  `Definitions.txt:1540-1585`.
- Generic runner: `spSnippetService.ts` (all 211 lines); eval variant `sweetTaffyEvalService.ts:21-87`.
- HTTP patterns: `settingsService.ts:48-174`.
- Combat: `hitService.ts` (all); `sweetTaffyPlayerCombatService.ts:30-145,180-202,241-340`;
  `deathService.ts:31-75`; `objectReferenceEx.ts:24-36`; `getHeadingAngle`
  `convert-files/skyrimPlatform.ts:1804`.
- UI-open flow: `sweetTaffySkillMenuService.ts:19-32`; controls freeze
  `sweetCameraEnforcementService.ts:159-179,366-488`.
- Front: `skymp5-front/src/index.js` (all 46 lines); `src/utils/Widgets.js`;
  `src/constructorComponents/chat/index.js:1-60`; `frontHotReloadService.ts:37-42`;
  install path `skymp5-front/CMakeLists.txt:16,36-45`; default page
  `tilted/ui/MyChromiumApp.cpp:152,239`.
- Architecture/logging: `clientListener.ts` (all); `logging.ts` (all); registration
  `skymp5-client/src/index.ts:47-70`.
- Delta verification: `git diff 41417ef3..2849e676 -- skyrim-platform/ skymp5-client/ docs/`.
