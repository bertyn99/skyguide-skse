# Skyrim Platform (SP) capabilities & limitations from TypeScript

Research for the skyguide-skse plugin (companion: skydive-app `SkyrimConnector` seam).
Every API name below was verified against the installed typings
(`node_modules/@skyrim-platform/skyrim-platform/index.d.ts`, v2.9.0) unless explicitly marked **UNVERIFIED**.
There is no existing `docs/` convention in this repo; this file creates `docs/research/`.

---

## 1. TL;DR — decision-relevant facts

1. **SP plugins run inside the Skyrim process on the game thread.** Plugin JS is embedded via a Node-API (Napi) engine (source: `skymp/skyrim-platform/src/platform_se/skyrim_platform/JsEngine.h` — includes `<napi.h>`); heavy per-frame work directly costs FPS. `update` fires once per frame (~60 Hz), and its doc warns "Executing code each single frame may be expensive" (source: `skymp/docs/skyrim_platform/new_events.md`). The skyguide pattern of `on("update")` + own time-gating (500 ms) is correct.
2. **HTTP = `HttpClient` with only `get` and `post`.** Backed by cpp-httplib + OpenSSL (HTTPS works, custom headers work, thread pool of 3, responses marshaled back onto the game thread). No timeout config, no redirect-following, no other verbs, **no WebSocket, no TCP, no HTTP-server capability anywhere in SP JS** (sources: `skymp/docs/skyrim_platform/http.md`; `index.d.ts` lines ~1527–1538; `skymp/skyrim-platform/src/platform_lib/HttpClient.cpp`, `HttpClient.h`).
3. **The only socket-like transport is `mpClientPlugin`** — `createClient(host, port)` + `send(json, reliable)` + `tick(handler)` — and it is only available "if multiplayer is installed on user's machine" (source: `index.d.ts` lines ~58–69). Not usable for a companion app unless we ship/require the skymp client piece.
4. **Realistic bidirectional options are: (a) HTTP polling both ways (current design — fine), (b) Node `fs` file exchange (the SP runtime exposes Node stdlib — skymp5-client does `import * as fs from "fs"` and `fs.writeFileSync` in `profilingService.ts`), (c) browser (CEF) overlay as a full web runtime with bidirectional messaging via `browser.executeJavaScript` ↔ `window.skyrimPlatform.sendMessage` (`browserMessage` event)**. There is **no precedent for spawning external bridge processes** from SP JS: `win32` only has `loadUrl` and `exitProcess` (source: `win32.md`, `index.d.ts` lines ~82–86); Node `child_process` is **UNVERIFIED** in SP's embedded runtime.
5. **Data collection is rich.** Per-tick you can get player position/angles, actor values, level, combat state, crosshair ref, location/cell/worldspace, weather, sun position, game time, key states, equipped items, quests. Cell-level enumeration exists: `Cell.getNumRefs(formTypeFilter)` + `Cell.getNthRef(n, formTypeFilter)` — the "enumerate all actors/NPCs in cell" capability the current 9-offset `findClosestActor` scan approximates (sources: `index.d.ts` lines ~2292–2308, ~2579–2596; current multi-scan in `src/game-state/collectors/nearby-collector.ts`).
6. **Action execution is powerful**: `setPosition`/`setAngle`/`translateTo` on the player, `Input.tapKey/holdKey/releaseKey`, `activate`, `equipItem`, `Spell.cast`, `Debug.sendAnimationEvent`, `Debug.notification/messageBox`, `Game.saveGame`, overridden console commands (`findConsoleCommand`). Note many natives are async (return `Promise`) and Papyrus calls throw unless inside a "new event" or hook (sources: `index.d.ts` lines ~1728, ~1861–1867, ~1897, ~2419; `papyrus.md`, `native.md`).
7. **In-game UI**: two tiers — (a) HTML/CSS/JS via the embedded CEF `browser` (`Data/Platform/UI/index.html`, `loadUrl`, `executeJavaScript`, `browserMessage` back-channel; skymp5-client's whole HUD is built this way); (b) lightweight 2D sprite texts (`createText`/`setTextString`/… with `worldPointToScreenPoint` for world-anchoring). Native toasts via `Debug.notification` / `Debug.messageBox`. **Arbitrary audio (TTS) has no native SP API** — only form-based `Sound.play` from game assets; TTS audio would have to go through the CEF browser (HTML `<audio>`) — **UNVERIFIED** that CEF audio output works.
8. **Persistence/config**: `settings` (JSON at `Data/Platform/Plugins/plugin-settings.txt`, hot-reloads), `storage` (in-memory, survives hot reload, not save-file persistent), `writeLogs`. There is **no `readJson`/`writeJson` in the installed 2.9.0 typings** — if the shim/docs elsewhere mention them, they are **UNVERIFIED**; use Node `fs` instead (proven by mp5-client). JContainers via Papyrus interop is the save-persistent option (source: `cookbook.md`).
9. **Errors don't crash the game**: unhandled exceptions and promise rejections are logged to the console; but "SkyrimPlatform performance is not guaranteed with unhandled exceptions" — wrap per-frame work like the plugin already does (source: `features.md`).
10. **Version match**: `package.json` pins `@skyrim-platform/skyrim-platform` 2.9.0 and the vendored `skymp/skyrim-platform` package.json is also 2.9.0 — docs and typings are consistent. Several useful APIs are already in the typings but unused by skyguide (e.g. `worldPointToScreenPoint`, `sendIpcMessage`, `getFileInfo`, `Cell.getNumRefs`, `Sound.play`, `browser`).

---

## 2. Runtime model

### Where JS runs
- SP embeds a JS engine into the Skyrim SE/AE process via Napi (Node-API). Evidence: `skymp/skyrim-platform/src/platform_se/skyrim_platform/JsEngine.h` includes `<napi.h>` and exposes `RunScript(Napi::Env, ...)`. Because the runtime is Node-API-based, **Node stdlib modules are importable** — proven in production code: `skymp/skymp5-client/src/services/services/profilingService.ts` does `import * as fs from "fs"` and `fs.writeFileSync('./profile....cpuprofile', ...)` (relative to Skyrim's working directory), and uses the global `setTimeout` inside a promise. (Node API names like `child_process`, `net`, `http` server, `ws` are **UNVERIFIED** — no usage anywhere in the vendored tree; test before relying.)
- Main thread semantics: HTTP callbacks and similar async results are queued back onto the JS context between game frames (`HttpClient::ExecuteQueuedCallbacks(Napi::Env)` in `platform_lib/HttpClient.cpp`), so your code always runs on the game loop, never on a background thread.

### Events: `update` vs `tick` vs once/on
- `update` — once per frame after a save is loaded; all game methods available. Doc warning: per-frame code may be expensive; prefer `once` for `update`/`tick` where possible (source: `new_events.md`).
- `tick` — once per frame immediately after game start, but **no access to game methods/objects** (throws) (source: `new_events.md`; `papyrus.md` warning).
- `on` subscribes forever; `once` fires one time; both return an `EventHandle { uid, eventName }`, and `unsubscribe(handle)` removes it (source: `new_events.md`; `index.d.ts` line ~528, `EventHandle` at ~462).
- Papyrus types are **only** usable inside "new events" (everything except `tick`), `sendPapyrusEvent` hook contexts, or hooks generally; calling them elsewhere throws (source: `papyrus.md`, `native.md`). This is why skyguide guards everything in try/catch and why `skyrimPlatform.ts` re-exports from a lazily-detected global.
- Many natives are asynchronous and return `Promise` (`setPosition`, `setAngle`, `moveTo`, `Utility.wait`, `Quest.start`, ...) — execution continues immediately unless you `await` (source: `native.md`). **After an `await`, captured `Form` references may be invalidated** — re-fetch with `Game.getFormEx(savedId)` (source: `native.md`, with example).
- **Main-menu caveat**: skymp5-client has an explicit comment "have to use callbacks here: promises don't work in the main menu" (`skymp5-client/src/services/services/settingsService.ts` lines ~60–61). Design the connector to degrade gracefully before a save is loaded (skyguide already does via `isConnected()` + `once("update")` init).

### Loading screens & lifecycle
- No built-in "loading screen" event; standard practice (used by both skyguide `src/actions/polling.ts` and `src/actions/executor.ts`) is `Ui.isMenuOpen("Loading Menu")` — the `Menu` const enum includes `Loading = 'Loading Menu'` (`index.d.ts` lines ~1101–1138).
- Lifecycle events exist: `skyrimLoaded`, `newGame`, `preLoadGame`, `loadGame`, `postLoadGame`, `saveGame`, `deleteGame` (`index.d.ts` lines ~530–546). `loadGame` doesn't fire on new game — the cookbook's init recipe combines `on("loadGame")` + `once("update")` + `storage` (source: `cookbook.md` "Plugin initialization").
- **Hot reload**: editing `Data/Platform/Plugins` reloads all plugins without restarting the game; on reload, event/hook handlers are removed, async ops interrupted, and everything resets **except `storage`** (source: `features.md`).
- Player form ID is `0x14` (constant, also `papyrus.md` guarantees `Game.getPlayer` never returns null once in-game).

### Error handling
- Unhandled JS exceptions are logged to the console with stack; raw promise rejections are logged too; the game does not crash. But "performance is not guaranteed with unhandled exceptions" (source: `features.md`).
- Hooks: `enter`/`leave` run inside the engine call; **script functions are not available inside hook handlers** (source: `events.md`) — e.g. inside `hooks.sendAnimationEvent.enter` you may read `ctx.animEventName`/`ctx.selfId` but must not call Papyrus. skyguide already respects this (only records the anim name in `src/index.ts`).

### Performance constraints
- Hooking is expensive — SP filters hooked events before they reach JS; always pass `minSelfId`/`maxSelfId`/`eventPattern` filters (max one wildcard) (source: `events.md` "Advanced Hooking"). skyguide already does this for attack animations.
- Throttle per-frame work (skyguide's 500 ms gate and 5 sends/sec limiter in `src/communication/http-client.ts` are the right shape). `HttpClient` has a thread pool of 3 — many concurrent in-flight requests can queue behind each other (`HttpClient::Impl` ctor: `pool(3)`).
- `getJsMemoryUsage()` exists for leak monitoring (`index.d.ts` line ~14).

---

## 3. Communication capabilities & realistic bidirectional options

### What exists
| API | Detail | Source |
|---|---|---|
| `HttpClient(url)` | ctor takes base URL (scheme+host+port, e.g. `https://host:443`) | `index.d.ts` ~1534–1538; `http.md` |
| `.get(path, {headers?}, cb?) → Promise<HttpResponse>` | path must start with `/` (enforced in C++) | `index.d.ts` ~1536; `HttpClient.cpp` |
| `.post(path, {body, contentType, headers?}, cb?) → Promise<HttpResponse>` | body is a `string` | `index.d.ts` ~1537 |
| `HttpResponse` | `{ body: string, status: number, error: string }`; empty body + non-zero `error` on failure | `index.d.ts` ~1527–1531; `http.md` |
| HTTPS | yes — `CPPHTTPLIB_OPENSSL_SUPPORT` | `HttpClient.cpp` |
| Redirects | **not followed** (no `set_follow_location` in the wrapper; httplib returns the 3xx as `status`) | `HttpClient.cpp` |
| Timeouts/rate limits | none configured or exposed by SP; you must implement your own (skyguide already does: 5 sends/sec, backoff) | `HttpClient.cpp/h`; `src/communication/http-client.ts` |
| Concurrency | thread pool of 3 → ≥3 simultaneous requests queue | `HttpClient.cpp` |

### What does NOT exist (verified absent from typings)
- **No WebSocket API.** Grep of `index.d.ts` and the whole vendored platform source for "WebSocket" returns nothing.
- **No TCP/raw socket API** in SP proper (the only raw network API is `mpClientPlugin`, below).
- **No HTTP server** capability from JS.
- **No process-spawning API** — `win32` is only `{ loadUrl(url), exitProcess() }` (`index.d.ts` ~82–86; `win32.md`). Node `child_process` is **UNVERIFIED** (runtime is Node-API based, so it *may* work; test in-game before designing around it).

### `mpClientPlugin` (the odd one out)
```ts
// index.d.ts lines ~58–69 — "Available only if multiplayer is installed on user's machine"
mpClientPlugin.createClient(host: string, port: number)
mpClientPlugin.send(jsonContent: string, reliable: boolean)
mpClientPlugin.tick(tickHandler: (packetType: PacketType, jsonContent: string, error: string) => void)
mpClientPlugin.isConnected()
```
This is how skymp5-client talks to a skymp game server (`skymp5-client/src/services/services/networkingService.ts` — `this.sp.mpClientPlugin.send(JSON.stringify(e.message), ...)` and `on("tick")` receive loop). It is a reliable/unreliable JSON packet channel, not a general WebSocket, and it requires the multiplayer client plugin present.

### Also relevant
- **`sendIpcMessage(targetSystemName, ArrayBuffer)` / `ipcMessage` event** — SP-to-SP inter-plugin messaging with binary payloads (`index.d.ts` lines ~20, ~32–38). Useful if the skyguide feature is ever split into two SP plugins, not for reaching the web app.
- **CEF browser back-channel** — see §6: full-duplex JSON messaging between plugin JS and a browser page (`browser.executeJavaScript` out, `browserMessage` event in). The browser page itself is a *normal web app* and can hold WebSockets/WebRTC/etc. This is the strongest "seam" candidate for the app's WebSocket engine — see below.

### Comparison of realistic bidirectional options

| Option | How it works | Latency | Complexity | Precedent / risk |
|---|---|---|---|---|
| **A. HTTP polling (current)** | Plugin POSTs state on `update` gate; GETs `/api/actions` on a `setTimeout` chain with backoff (`src/actions/polling.ts`) | 0.5–1 s+ per direction (config-gated) | Low — already implemented | Solid: skymp5-client uses `HttpClient` for master-server requests (`settingsService.ts`, `authService.ts`). Risks: `setTimeout` global — proven used in mp5-client (`profilingService.ts`); rate-limit/backoff must stay custom. |
| **B. Node `fs` file exchange** | App writes `Data/Platform/.../*.json` command file; plugin polls file mtime cheaply per tick; plugin writes state JSON back | ~tick-rate (100–500 ms), no network stack | Low-Med | Proven capability (mp5-client writes `.cpuprofile` via `fs.writeFileSync`); relative paths resolve against Skyrim's process CWD, not `Data/` — must resolve explicitly. Same-machine only; file-locking edge cases. |
| **C. CEF browser as the transport** | The in-game browser page (`browser.loadUrl` to `http://localhost:3000` — explicitly supported, `browser.md`) runs your web code with **real WebSocket**, receives game state pushed via `browser.executeJavaScript(JSON.stringify(...))`, and sends actions back via `window.skyrimPlatform.sendMessage(...)` → `on("browserMessage")`. | Frame-rate for game→browser pushes; instant for browser→plugin | Med — but reuses the app's UI directly | Strong precedent: skymp5-client's entire front-end (`skymp5-front`, Svelte) ships this way; `browserService.ts` manages visibility/focus and keybinding quirks. Risks: input capture fights vanilla UI (`browser.setFocused` toggles), visibility is hidden while "bad menus" are open, `loadUrl` to external URL only loads after mouse move per docs, token flow (`browser.getToken()` / `window.spBrowserToken`) needed if you secure the channel. |
| **D. `mpClientPlugin` packets** | Custom host:port server speaking the skymp packet framing | Low | High | Precedent exists (skymp5-client↔skymp5-server) but requires "multiplayer installed" and reimplementing server framing. Overkill for a companion app. |
| **E. External bridge process** | Separate exe listens WebSocket to app, exposes plain HTTP/local file to the plugin | Low | High (packaging, install, IPC) | **No SP precedent for spawning it from JS** (`win32` can't; `child_process` UNVERIFIED). Only worth it if C is rejected and sub-100 ms plugin-native latency is required. |

**Recommendation for the `SkyrimConnector` seam:** keep `sendAction()` on HTTP polling for day-1 compatibility (option A), and add option C as the "rich" transport: the planned in-game Skyrim interface UI *is* the browser page, it joins the app's WebSocket engine directly (binary clip/audio frames work fine in CEF), and it forwards accepted actions to plugin JS through `browserMessage`. This avoids needing WebSockets inside SP JS (impossible) while giving the app a single connector contract.

---

## 4. Game data collection surface (what the collectors can expand to)

All names verified in `index.d.ts` (v2.9.0). Papyrus calls only valid inside events/hooks.

**Player** (`Game.getPlayer(): Actor | null`, ~2696; Actor ~1873–2082)
- `getPositionX/Y/Z()`, `getAngleX/Y/Z()` (ObjectReference ~1752–1754, 1787–1789)
- `getActorValue(name)`, `getActorValueMax`, `getActorValuePercentage`, `getBaseActorValue` (~1913–1916); `ActorValue` const enum with all 160+ ids (~897–1062); `ActorValueInfo.getActorValueInfoByName` for skills (~2135–2159)
- `getLevel()` (~1940), `getCombatState()` (~1918), `isSneaking/isSprinting/isSwimming/isInCombat/isWeaponDrawn/isDead/getSitState/getSleepState/getFlyingState` (~1971–1998, 1949–1950, 1934)
- Equipment: `getEquippedObject(slot)`, `getEquippedItemType`, `getEquippedWeapon`, `getEquippedArmorInSlot`, `getEquippedShout`, `getWornForm(slotMask)` (~1923–1955)
- Spells/perks/factions: `getNthSpell`, `getSpellCount`, `hasPerk`, `getFactions(minRank,maxRank)`, `getRelationshipRank` (~1945–1965)
- Movement extras: `getAnimationVariableBool/Float/Int` (ObjectReference ~1755–1757) — e.g. mp5-client detects casting via `IsCastingRight/Left/Dual` (`sendInputsService.ts`).

**Nearby actors**
- `Game.findClosestActor(x,y,z,radius)`, `Game.findRandomActor(...)` (~2579, 2582) — what the current 9-offset scan in `src/game-state/collector.ts` / `nearby-collector.ts` uses.
- **True cell enumeration**: `player.getParentCell()` → `Cell.getNumRefs(formTypeFilter)` + `Cell.getNthRef(n, formTypeFilter)` (~2296–2297); use `FormType.NPC (62)` / `FormType.Character` as filter (`FormType` enum ~1255–1391; documented usage `cell.getNumRefs(FormType.NPC)` in `new_types.md`). This replaces the multi-scan hack with exact results — recommended upgrade.
- Per-actor detail: `getCombatTarget()`, `isHostileToActor`, `getActorValue('health')`, `getLevel`, `getBaseObject().getName()`, `getDistance(ref)` (~1919, 1983, 1869).

**Crosshair / targeting**
- `Game.getCurrentCrosshairRef(): ObjectReference | null` (~2589); also the `crosshairRefChanged` event (`index.d.ts` ~755, payload `CrosshairRefChangedEvent` ~392). `Game.getPlayerGrabbedRef()` (~2619), `Game.getCurrentConsoleRef()` (~2588), `Game.getDialogueTarget()` (~2590).
- Used by `src/game-state/collectors/crosshair-collector.ts` (already good: name/type/openState/distance).

**Location / world**
- `player.getCurrentLocation()`, `getParentCell()`, `getWorldSpace()` (~1761, 1785, 1797); `Cell.isInterior()/getName()`; `Location.getName()` — current `location-collector.ts` covers these.
- Events: `locationChanged`, `locationDiscovery` (payload includes `markerType`, `canTravelTo` — useful for a fast-travel UI) (~674, ~812; `LocationDiscoveryEvent` ~501–508).
- `Game.getSunPositionX/Y/Z()` (~2623–2625), `Weather.getCurrentWeather()/getSkyMode()/getCurrentWeatherTransition()` (~3382–3385) — current `environment-collector.ts`.
- Time: `Utility.getCurrentGameTime()`, `getCurrentRealTime()` (~3415, 3417).

**Quests**
- `Quest.getQuest(editorId)` static (~3068), plus `isActive/isCompleted/getCurrentStageID/isObjectiveCompleted/isObjectiveDisplayed` (~3049–3052). Events `questStart/questStop/questStage` push-driven instead of polling (~638–648). Note: `quest.getEditorId` used in `quest-collector.ts` is **UNVERIFIED** (guarded by a runtime `typeof` check there — keep it).

**Input / UI state**
- `Input.isKeyPressed(dxKeycode)` (~2779) — current `input-collector.ts`; plus `getNumKeysPressed()/getNthKeyPressed(n)` for full keyboard state (~2776–2777); `Input.getMappedKey(control, device)` to respect user rebinds (~2775).
- Push-driven `buttonEvent` (full `ButtonEvent` with `isPressed/isDown/isHeld/heldDuration`) (~779; ~419–430) is cheaper than polling keys.
- `Ui.isMenuOpen(name)` (~3302) with the `Menu` enum; `menuOpen/menuClose` events (~617–621).

**Inventory / containers**
- `getContainer(baseId) → InventoryEntry[]` and `getExtraContainerChanges(refrId)` SP globals (~134–140) — better than Papyrus loops.
- `containerChanged` event (~596) with old/new container + baseObj + count.

**Weather/events you aren't using yet** (all in typings, cheap wins for the state stream): `hit`, `combatState`, `deathStart/End`, `containerChanged`, `equip/unequip`, `spellCast`, `shoutAttack`, `itemHarvested`, `levelIncrease`, `skillIncrease`, `trackedStats`, `footstep`, `fastTravelEnd`, `sleepStart/Stop`, `waitStart/Stop`, `actorKill` (full list `index.d.ts` ~530–825; names documented in `new_events.md`).

**Serialization caveat**: Papyrus objects don't `JSON.stringify` (`JSON.stringify(Game.getPlayer())` → `{}`, `papyrus.md`); always extract primitives (formIds, strings, numbers) before serializing — the plugin's `serializer.ts` approach is correct.

---

## 5. Action execution surface (what `sendAction` can execute)

| Capability | API | Notes / safety |
|---|---|---|
| Move player | `player.setPosition(x,y,z)` → `Promise<void>`; `player.setAngle(x,y,z)` | Works on player; async native. Also `ObjectReference.translateTo(...)` for smooth movement, `TESModPlatform.moveRefrToPosition(refr, cell, world, ...)` for cross-cell teleport (~1861, ~1845, ~1867, ~3236). |
| Rotate/face | `setAngle`, `forceTargetAngle`, `forceMovementDirection` (Actor ~1904–1912) | |
| Smooth move | `translateTo(x,y,z,angles,speed,maxRot)` (ObjectReference ~1867), `stopTranslation()` | Good for scripted walks; `translationCompleted` event (~776) signals arrival. |
| Activate refs | `ref.activate(activator, abDefaultProcessingOnly)` (~1728) | Executor currently calls with 1 arg — fine, but pass `false` explicitly. Validate ref like `isValidReference` already does (`Game.getFormEx` round-trip). |
| Find targets | `Game.getCurrentCrosshairRef()`, `findClosestActor`, `findClosestReferenceOfType/FormList` | `Game.findClosestReference` used in `executor.ts` is **UNVERIFIED** — typings only have `findClosestReferenceOfType` / `findClosestReferenceOfAnyTypeInList` (~2580–2581); fix to the verified names. |
| Keys | `Input.tapKey(dx)`, `Input.holdKey(dx)`, `Input.releaseKey(dx)` (~2778–2781); keycodes via `DxScanCode` enum (~1140–1253) | No built-in timed hold — executor's `setTimeout` release is the right pattern. |
| Equipment | `player.equipItem(form, preventRemoval, silent)`, `equipItemById`, `equipItemEx`, `unequipItem*`, `equipSpell`, `equipShout` (~1897–1901, 2074–2078) | Enables the stubbed `equip`/`useItem` actions. |
| Spells | `Spell.cast(source, target)`, `Spell.remoteCast`, `Actor.addSpell` (~3102, 3120, 1877) | |
| Animation | `Debug.sendAnimationEvent(refr, animEventName)` (~2419) | Also the `hooks.sendAnimationEvent` channel for verifying playback (`leave` ctx has `animationSucceeded`). |
| Items/inventory | `ObjectReference.addItem/removeItem`, SP global `setInventory(formId, inventory)` with full Extra data (~1731, ~1838, ~1593); `TESModPlatform.addItemEx` (~3229) | |
| Combat/misc | `player.drawWeapon()/sheatheWeapon()`, `restoreActorValue`, `damageActorValue`, `kill`, `resurrect`, `startCombat/stopCombat`, `Game.shakeCamera` (~1894, 1896, 2021, 2000–2069, 2697) | |
| Save/load/teleport | `Game.saveGame(name)`, `Game.loadGame(name)`, `Game.fastTravel(ref)` (~2657, 2646, 2578) — so `fastTravel` action **can** be implemented once you have a target marker ref (current "not supported" note is conservative). SP global `loadGame(pos, angle, worldOrCell, ...)` also exists (~54) — used by mp5-client for seamless transitions. |
| Console commands | `findConsoleCommand(name)` → override `longName/shortName/numArgs/execute` (~827–833; `features.md`) | Game functions unavailable inside `execute`; register `once("update")` there (features.md example). skyguide's `~skyguide` status command is the canonical pattern. Note: overriding replaces the host command (`GetAVInfo`) for the session — pick a rarely-used host. |
| Camera | `Game.forceFirstPerson()/forceThirdPerson()`, `getCameraState()`, `cameraStateChanged` event (~2585–2587, 2752) | |
| Controls lock | `Game.disablePlayerControls(...)/enablePlayerControls(...)` 9 args (~2574–2576) | Useful while the companion UI is focused. |
| Menus | `Ui.openCustomMenu(swfPath, flags)` / `closeCustomMenu` (~3304, 3288) — Flash/SWF scaleform menus only; not the easy path for HTML UI (use CEF browser). |

**Blocking/safety patterns worth keeping** (already in `executor.ts` / `polling.ts`, backed by docs):
- null checks on `Game.getPlayer()` (`papyrus.md`: guaranteed non-null only in-game),
- `Game.getFormEx(id)` + `isDeleted()/isDisabled()` validation before acting on a ref (`papyrus.md` — `getFormEx` is the only lookup that works above 0x80000000),
- `Ui.isMenuOpen("Loading Menu")` guard before every action/poll,
- try/catch per action (unhandled exceptions are logged but "performance is not guaranteed" — `features.md`).

---

## 6. In-game UI possibilities (for the planned Skyrim interface)

### Tier 1: CEF browser (full HTML/CSS/JS) — the main path
- SP auto-loads `Data/Platform/UI/index.html`; you can `browser.loadUrl()` any file URL or **any http(s) URL at runtime** — docs explicitly show `browser.loadUrl("http://localhost:1234")` for a dev server (source: `browser.md`). That means the companion app's UI can literally be served by skydive-app and shown in-game.
- API (`index.d.ts` ~71–80): `setVisible/isVisible`, `setFocused/isFocused` (focus redirects mouse+keyboard to the browser), `loadUrl`, `getToken` (per-session token, appears in page as `window.spBrowserToken`), `executeJavaScript`.
- **Bidirectional**: page → plugin via `window.skyrimPlatform.sendMessage(...args)` (JSON-serializable) arriving as the `browserMessage` event (`BrowserMessageEvent.arguments`); plugin → page via `browser.executeJavaScript("...")`. Ping-pong example in `browser.md`. Escaping rules for injected strings documented for `consoleMessage` (`new_events.md`).
- Production scale: skymp5-client renders its whole multiplayer HUD this way (`browserService.ts`: `setVisible(false)` at boot, F2 toggles, hide while `Menu.Barter/Book/Container/...` open, focus/unfocus custom events).
- Gotchas: URLs (non-default) only load after the user moves the mouse (`browser.md`); MO2 caution for `file://` URLs; text must be escaped before injection; input focus must be toggled off when vanilla menus open or on Escape (see `browserService.ts` onMenuOpen/onMenuClose pattern).
- **Audio/video in-game**: the browser page can presumably play `<audio>`/`<video>` (WebAudio for TTS/clip playback) — **UNVERIFIED** for CEF audio routing; there is no other audio API from TS except game Sound forms (`Sound.play(ref)`, `setInstanceVolume`, `stopInstance` — `index.d.ts` ~3193–3200; `Debug.playBink` for bink videos ~2648). Verify CEF audio early if binary clip/audio frames are core to the new architecture.

### Tier 2: Sprite texts (lightweight, no browser)
- `createText(x,y,text,rgba,font?) → id` + full setters/getters (`setTextString`, `setTextPos`, `setTextColor`, `setTextSize`, `setTextRotation`, `setTextDepth`, ...), `destroyText`, `destroyAllTexts` (`index.d.ts` ~1540–1564; `texts.md`). Visibility follows `browser.setVisible` (`texts.md`).
- World-anchoring via the global `worldPointToScreenPoint(...number[][]) → number[][]` (screen coords −1..1) (`index.d.ts` ~56; `new_methods.md`). Caveat: ASCII-only fonts, custom `.spritefont` files needed for other glyphs (`texts.md`).
- Good for floating labels ("SkyGuide: follow me") without hosting a web page.

### Tier 3: Native toasts/dialogs
- `Debug.notification(msg)` (HUD toast), `Debug.messageBox(msg)` (modal), `Message.show(...)` for scripted message forms (`index.d.ts` ~2414–2415, ~2927). The `equip`/`useItem`/`notification` actions in `executor.ts` use these.

### Tier 4: SWF scaleform
- `Ui.openCustomMenu(swfPath, flags)` (~3304) — only if you already have SWF assets; not recommended.

---

## 7. Gaps & risks (NOT possible from TS — needs native/bridge work)

1. **No WebSocket/TCP/HTTP-server from plugin JS.** Anything the connector needs in that space must run in the app or the browser overlay. (Typings + vendored source verified.)
2. **No in-process audio streaming/TTS.** Only `Sound` forms (game assets), `SoundCategory` volume control, and possibly CEF playback (UNVERIFIED). Binary audio frames from the app must terminate in the browser page, not in plugin JS.
3. **No process spawning** via SP API (`win32` is 2 functions). Node `child_process` UNVERIFIED — if it works it's untested territory for end-user setups.
4. **No arbitrary HTTP client features**: no timeout control, no redirect following, no other verbs (PUT/DELETE), no binary response bodies (`HttpResponse.body` is `string`; C++ stores bytes — charset handling for binary content is risky). A connector needing binary over HTTP should use the browser/bridge instead.
5. **`tick` has no game access** — anything needing Papyrus must run in `update` or later events.
6. **Form lifetime across `await`** — stale `Actor`/`ObjectReference` refs after async waits; always re-resolve by form ID (`native.md`).
7. **`Game.findClosestReference`** (used in `src/actions/executor.ts`) is **UNVERIFIED**; the verified equivalents are `findClosestReferenceOfType` / `findClosestReferenceOfAnyTypeInList`. Similarly `quest.getEditorId` (in `quest-collector.ts`) is **UNVERIFIED** (runtime-guarded there).
8. **`readJson`/`writeJson` are not in the 2.9.0 typings** — if referenced anywhere (older SP docs/other mods), they are **UNVERIFIED** here. Use Node `fs` (proven) or `settings`.
9. **Save-file persistence** of plugin variables: SP variables do NOT persist in saves; need JContainers (via Papyrus interop) or manual `fs` snapshots + `loadGame` restore (source: `cookbook.md`).
10. **CEF quirks**: external URLs load only after mouse movement (per docs), focus/visibility must be managed around vanilla menus, and escaping is mandatory for `executeJavaScript`. Also plugin-hot-reload kills browser pages' state assumptions (reload removes handlers; `storage` survives).
11. **Concurrency of HttpClient = 3** — long-polling + state POSTs can starve each other; consider staggered scheduling (already partially handled by the 5 req/s limiter).

---

## 8. Source index

**Vendored official docs** (`skymp/docs/skyrim_platform/`):
- `events.md` — hooks (`sendAnimationEvent`, `sendPapyrusEvent`), hook cost & filtering, nested-hook ban.
- `new_events.md` — `on`/`once`/`unsubscribe`, `update` vs `tick`, full event list incl. `browserMessage`, `crosshairRefChanged`, input events.
- `new_methods.md` — `printConsole`, `writeLogs`, `settings`, `browser`, `worldPointToScreenPoint`, `callNative`, `storage`.
- `new_types.md` — `TESModPlatform`, enums (`DxScanCode`, `Menu`, `FormType`, `SlotMask`, `EquippedItemType`, `WeaponType`).
- `papyrus.md` — Papyrus types, `getFormEx` vs `getForm`, null-safety rules, casting, no JSON serialization of game objects.
- `native.md` — native calls incl. SKSE plugins (PapyrusUtil), async/Promise semantics, stale-form-after-await pattern.
- `http.md` — HttpClient get/post only, empty body on failure.
- `browser.md` — CEF overlay, loadUrl, focus, `executeJavaScript` ↔ `window.skyrimPlatform.sendMessage` / `browserMessage`, token.
- `texts.md` — Texts API, spritefonts, ASCII limitation.
- `win32.md` — `win32.loadUrl`, `win32.exitProcess`.
- `ini_settings.md` — `Data/SKSE/Plugins/SkyrimPlatform.ini` settings.
- `features.md` — hot reload, console command override, DumpFunctions, unhandled exception semantics.
- `cookbook.md` — persistence via JContainers, plugin-init recipe, SPID/effectStart pattern.

**Installed typings**: `node_modules/@skyrim-platform/skyrim-platform/index.d.ts` (v2.9.0, 3442 lines) — key line ranges:
- Globals/utilities: 10–24 (`printConsole`, `callNative`, `storage`, `settings`, `sendIpcMessage`), 52–58 (`loadGame`, `worldPointToScreenPoint`), 15–16 (`getPluginSourceCode`, `writePlugin`), 528 (`unsubscribe`), 827–833 (`findConsoleCommand`), 1527–1593 (`HttpResponse`, `HttpClient`, Texts, `getFileInfo`, `setInventory`).
- Transports: 58–69 (`mpClientPlugin`), 71–86 (`browser`, `win32`), 32–38 (`ipcMessage`).
- Hooks: 1477–1525.
- Game classes: `Form` 1596; `ObjectReference` 1726; `Actor` 1873; `ActorBase` 2085; `Cell` 2292 (getNumRefs/getNthRef 2296–2297); `Debug` 2403; `Game` 2565 (finds 2579–2584, crosshair 2589); `Input` 2772; `Sound` 3193; `TESModPlatform` 3227; `Ui` 3286; `Weather` 3371; `Utility` 3400.

**Plugin's own code** (`src/`): `index.ts` (event wiring, throttle, `~skyguide` console command), `skyrimPlatform.ts` (global-detected shim re-exporting real 2.9.0 typings — consistent with them), `communication/http-client.ts` (rate limit, failure cooldown), `actions/polling.ts` (GET polling + backoff + Loading Menu guard), `actions/executor.ts` (move/face/activate/keys/save/camera), `game-state/collector.ts` + `collectors/*.ts` (player, nearby multi-scan, crosshair, location, environment, input, quest), `config.ts`.

**Production usage**: `skymp/skymp5-client/src/services/services/` — `settingsService.ts` (HttpClient usage + "promises don't work in the main menu"), `networkingService.ts` (mpClientPlugin), `browserService.ts` (browser visibility/focus/menu management), `profilingService.ts` (Node `fs` + global `setTimeout` inside SP), `timersService.ts` (custom setTimeout/setInterval built on tick/update), `sendInputsService.ts` (per-frame input sync + animation variables). `skymp/skyrim-platform/src/platform_lib/HttpClient.{h,cpp}` (httplib+OpenSSL, pool of 3, callback marshaling); `skyrim-platform/src/platform_se/skyrim_platform/JsEngine.h` (Napi engine).
