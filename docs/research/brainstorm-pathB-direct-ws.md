# Path B — "Companion page connects directly to the app's WS engine" (skymp5-front-style thin bridge)

> Brainstorm/analysis agent report — Path B deep dive. No code changes.
> Sibling of the Path A analysis. Grounded in local sources only; every load-bearing
> claim carries a file:line citation, or an explicit **ESTIMATE** / **UNVERIFIED** tag.
> Date: 2026-11-13.

---

## 0. Grounding facts verified in-tree (read once, cited everywhere)

These were re-verified for this report; they constrain every sub-variant.

### 0.1 The app's WS engine (`skydive-app`)

- **The WS route is `/_ws`, not `/ws`.** Nitro file route `server/routes/_ws.ts` mounts at
  `/_ws`; the existing dashboard client connects to `` `${protocol}//${host}/_ws` ``
  (`skydive-app/src/stores/session.ts:428-462`, literal `/_ws` at line 434). Any Path B
  page must use `/_ws` (or the app adds an alias). The brief's "/ws" does not exist today.
- **Binary framing** (`skydive-app/server/routes/_ws.ts:13-40`):
  - type `1` = clip: `[0]=1 | [1..4] uint32LE durationMs | payload` (lines 21-27);
  - type `2` = audio: `[0]=2 | [1]=mimeId | payload`, mime table
    `["audio/webm;codecs=opus","audio/webm","audio/ogg"]` (lines 15, 30-37).
  Client-side builders are the exact mirror (`skydive-app/src/utils/ws-binary.ts:16-39`).
- **JSON commands** (`_ws.ts:47-116`): `start`, `stop`, `clip` (base64), `setInterval`,
  `setPrompt`, `setTtsEngine`, `setPipeline`, `setGateEngine`, `setSttEngine`,
  `question`, `audio_chunk` (base64). Unknown/invalid → `{type:"error"}` back
  (lines 117-134).
- **The engine is a broadcast bus, and clips are client-driven.** `registerClient(peer)`
  adds the peer to a `Set` and immediately replays `status` + the **last `gameState`**
  (`skydive-app/server/utils/engine.ts:518-534`). It does **not** replay the last
  description, audio queue, or actions — a page reload loses narration state by design.
  Server-side comment confirms the architectural dependency: "screenshots are
  browser-side now, so the server cannot trigger a description on its own"
  (`engine.ts:766-770`). **A Path B page that connects but never sends clips produces
  zero narration** — someone must feed the vision stream.
- **Broadcast message types** (all JSON, audio is base64): `status` (`engine.ts:444,453,515`),
  `description` (171-179), `actions` (181-184), `audio` (207-220), `log` (104-112),
  `gameState` (730-735), `voice_question` (685-689, 713-717), `voice_status` (683, 698).
- **Actions go nowhere today.** The engine only *broadcasts* `{type:"actions"}`
  (`engine.ts:181-184`). No app code calls `connector.sendAction` (grep across
  `skydive-app/server`: only the stub at `server/utils/evals.ts:225` returning
  `{success:false}`); the dashboard client's `handleMessage` has **no `actions` case**
  (`session.ts:472-539`); `SkyrimFileConnector.sendAction` is a hardcoded
  `{success:false}` (`skyrim-file-connector.ts:25-28`); `SkyrimApiConnector` is TODO
  stubs (`skyrim-api-connector.ts:11-19`). And **`GET /api/actions` does not exist**
  in the app (`server/api/` contains only `config.get.ts`, `engines/`, `evals/`,
  `game-state.post.ts`, `situations/`, `test.ts`) — so the plugin's action polling
  (`src/actions/polling.ts:29` GETting `CONFIG.pollingEndpoint = "/api/actions"`,
  `src/config.ts:14`) is a 404 loop with exponential backoff **today**. Action
  execution is an unimplemented seam end-to-end regardless of path.
- **Game state ingestion is HTTP POST-only today.**
  `POST /api/game-state` validates `protocolVersion===1` + `priority/source/data/timestamp`
  and calls `updateGameState` (`server/api/game-state.post.ts:5-31`), which broadcasts,
  runs reflex rules, and arms the urgency bypass on high/critical payloads
  (`engine.ts:727-779`). **Reflex + urgency only fire on the POST path** — nothing in
  the app watches a file or a WS message for game state (verified: `SkyrimFileConnector`
  is only constructed as the default connector at `engine.ts:90`; `setConnector`
  (`engine.ts:132-135`) is exported but never called by any route).
- **The file connector is pull-per-gate-run.** `SkyrimFileConnector.getContext()`
  re-reads `SKYRIM_CONTEXT_FILE_PATH ?? "./src/assets/state.json"` on every call
  (`skyrim-file-connector.ts:9-23`); it is pulled by `modContextText()` per gated clip
  (`engine.ts:138-148`) and passed to the fused `describeVideo` (`engine.ts:229-234`).
  There is no watcher, no mtime check, no TTL.

### 0.2 The plugin today (`skyguide-skse/src`)

- State loop: `on("update")` gated to `CONFIG.tickInterval = 500` ms → `collectFullState`
  → `evaluatePriority`/`shouldSend` arbitration → `serializeState` → HTTP POST
  (`src/index.ts:53-88, 161-177`; `src/config.ts:8-10`). Rate limit 5 POSTs/sec
  (`src/communication/http-client.ts:5`), failure cooldown 3 fails → 10 s
  (`http-client.ts:21-22, 68-75`). Payload = player + combatState + ≤10 enemies +
  animation + eventType (`src/game-state/serializer.ts:43-61`; `maxEnemies: 10` at
  `src/config.ts:11`) — **ESTIMATE 1.5-4 KB JSON per send**.
- Event collectors: 28 SP events tracked (`src/events.ts:187-398`), combat/hit triggers
  (`src/index.ts:179-205`), attack-anim hook (`src/index.ts:125-152`), `~skyguide`
  console status command repurposing `GetAVInfo` (`src/index.ts:25-51`).
- Action execution exists plugin-side (`src/actions/executor.ts`, 301 lines:
  move/face/activate/keys/save/camera) — currently fed only by the dead `/api/actions`
  poll (`src/actions/polling.ts`).
- The plugin never touches the `browser` API today (no `browser.` references in `src/`).

### 0.3 SP browser/transport capabilities (vendored sources)

- **No WebSocket/TCP/HTTP-server in SP JS** — verified absent from typings and platform
  source (`docs/research/skyrim-platform-capabilities.md` §1.2, §7.1; typings
  `node_modules/@skyrim-platform/skyrim-platform/index.d.ts:58-86` show only
  `mpClientPlugin` + `browser` + `win32`).
- **Two browser backends, ini-selected** (`[Browser] BackendName` in
  `SkyrimPlatform.ini`): `off | auto | tilted | nirnlab`; **`auto` (the default) falls
  back to Tilted** (`skymp/skyrim-platform/src/platform_se/skyrim_platform/BrowserApi.cpp:15-35`,
  auto→Tilted at 20-23). Quirk: the `kOff` case is missing a `break` and falls through
  to Tilted registration (`BrowserApi.cpp:60-88`) — "off" is not trustworthy.
- **`browser.getToken()` is dead in this build.** Typings v2.9.0 still declare it
  (`index.d.ts:77`), but the vendored `BrowserApi.cpp` registers only
  `getBackend/setVisible/isVisible/setFocused/isFocused/loadUrl/executeJavaScript`
  (`BrowserApi.cpp:88-121` Tilted, `123-175` NirnLab) — no `getToken` anywhere in
  `BrowserApi.cpp` / `BrowserApiNirnLab.cpp` / `BrowserApiTilted.cpp` (grep verified).
  The plan doc already flagged the upstream removal (`docs/plans/skyguide-interface-bridge.md:30-31`).
  **Treat the page channel as unauthenticated; localhost-only.**
- **NirnLab backend hardcodes CEF remote debugging port 9000**
  (`BrowserApiNirnLab.cpp:13-18`: `settings.remoteDebuggingPort = 9000`), default page
  `file:///Data/Platform/UI/index.html` (line 171), and marshals
  `window.skyrimPlatform.sendMessage` back onto the game thread as the `browserMessage`
  event (`BrowserApiNirnLab.cpp:143-164`, `executeInGameThread = true` at line 161).
  Its `loadUrl`/`executeJavaScript` are **queued until the browser exists**
  (`jsExecQueue`, `BrowserApiNirnLab.cpp:88-91, 117-126`) — calls before browser init
  are not lost. Tilted's `ExecuteJavaScript` is fire-and-forget into `MyChromiumApp`
  (`BrowserApiTilted.cpp:88-93`) — **calls before page load are silently dropped**
  (ESTIMATE from code shape; no queue).
- **Focus = vanilla cursor.** `browser.setFocused(true)` opens Skyrim's `CursorMenu`
  (`BrowserApiTilted.cpp:44-75`); input redirection and menu juggling are documented
  gotchas (`skymp/docs/skyrim_platform/browser.md:17-21`; capabilities doc §6).
- **URLs load only after the user moves the mouse, except the default URL; MO2 breaks
  local `file://` URLs** (`browser.md:23-24`). `http://localhost:3000` as `loadUrl`
  target is explicitly supported by docs (`browser.md:29-30`).
- **Page→plugin bridge**: `window.skyrimPlatform.sendMessage(...)` → `browserMessage`
  event (`browser.md:42-59`, ping-pong example 61-71).
- **skymp5-front precedent** (`skymp/skymp5-front/src/index.js`): polyfills
  `window.skyrimPlatform` when absent (13-20) — i.e. the same bundle runs in a normal
  browser for dev; plays audio via `new Audio(...).play()` (37-39); sends a
  `'front-loaded'` handshake message on boot (41-43).
- **The SP runtime is a real embedded Node instance.** `JsEngine.cpp` constructs a
  `NodeInstance` + `CreateEnvironment` and its own bootstrap does
  `require('node:process')` + `nodeProcess.dlopen(...)`
  (`skymp/skyrim-platform/src/platform_se/skyrim_platform/JsEngine.cpp:112-165`,
  specifically 121-144 and 152-165), ticked per game frame
  (`JsEngine.cpp:104-110`). Node stdlib `fs` is proven in production plugin code
  (`skymp/skymp5-client/src/services/services/profilingService.ts:4` —
  `import * as fs from "fs"`); `net`/`ws`/`child_process` remain **UNVERIFIED**
  (capabilities doc §2). skymp5-client's webpack uses `target: "node"`
  (`skymp/skymp5-client/webpack.config.js:64`); **skyguide's own webpack sets no
  `target`** (`skyguide-skse/webpack.config.js:105-120`) — it would fail to even build
  a `require("node:net")` plugin without adding it.
- **`Debug.takeScreenshot(param1: string)` exists in the typings**
  (`index.d.ts:2427`, Papyrus `Debug` native) — a potential in-game vision source that
  bypasses the browser entirely (writes a screenshot file; exact path/format **ESTIMATE:
  game-root BMP per Papyrus docs, unverified**).

---

## 1. Topology & responsibility ownership

### B1 — "page-thin": page is the full client; plugin is a rare-event peer

```
┌────────────────────────── Skyrim process ──────────────────────────┐
│  skyguide plugin JS (game thread)        CEF overlay page           │
│  ┌────────────────────────┐  rare msgs ┌──────────────────────────┐ │
│  │ collectors (unchanged) │───────────►│ FULL CLIENT:              │ │
│  │ executor               │ executeJS  │  owns ws://…/_ws          │ │
│  │  ▲                     │ (menu-open,│  decodes audio frames     │ │
│  │  └─ browserMessage ◄───┤  loading…) │  renders narration UI     │ │
│  │     (action intents,   │            │  sends start/stop/        │ │
│  │      heartbeat)        │            │  question/audio_chunk     │ │
│  └────────────────────────┘            └────────────┬─────────────┘ │
└─────────────────────────────────────────────────────┼───────────────┘
                                                      │ WebSocket (binary+JSON)
                                        ┌─────────────▼──────────────┐
                                        │ skydive-app Nitro  /_ws     │
                                        │ engine · gate · STT · TTS   │
                                        └────────────────────────────┘
   (state still reaches the engine over HTTP POST /api/game-state — unchanged)
```

Who owns what:

| Responsibility | B1 owner |
|---|---|
| Game-state collection & POST | Plugin (unchanged `src/index.ts:53-88` loop) |
| WS lifecycle, reconnect | **Page** (mirror `session.ts:442-447` 2 s retry) |
| Binary frame decode/encode | **Page** (clip frames if it captures; audio frames for mic) |
| Narration / voice-status / subtitle UI | **Page** (full companion UI) |
| TTS audio output | **Page** (WebAudio, `session.ts:173-211` pattern) |
| Action execution | **Plugin** (`executor.ts`), triggered via `browserMessage` |
| Menu/loading-screen suppression of UI | **Plugin** pushes minimal events; page also self-hides via WS gaps |
| Reconnect of plugin HTTP | Plugin (`http-client.ts:68-75` cooldown) |

Traffic on the plugin↔page seam: `browserMessage` intents (rare), heartbeat (page→plugin,
**ESTIMATE 1/2-1/s**), and plugin→page pushes only for loading-screen / menu-open /
cell-change class events (**ESTIMATE < 1 msg/s, < 1 KB**). Everything else rides the WS.

### B2 — "page-only": plugin and page never talk

Two flavors, because the app has two existing state seams:

**B2a — HTTP (plugin keeps POSTing as today):**

```
┌────────────── Skyrim process ──────────────┐
│ plugin ── HTTP POST /api/game-state ─────► │──► skydive-app engine
│ CEF page ────── ws://localhost:3000/_ws ──────────────►  │
│   (no plugin↔page link at all)             │   broadcasts gameState/
└────────────────────────────────────────────┘   description/audio → page
```

**B2b — File (plugin dumps state.json, engine's SkyrimFileConnector reads it):**

```
┌────────────── Skyrim process ──────────────┐
│ plugin ── Node fs ──► state.json (disk)    │
│ CEF page ────── ws://localhost:3000/_ws ──────────────► skydive-app
└────────────────────────────────────────────┘   engine reads state.json
                                                 per gate run (pull!)
```

Who owns what:

| Responsibility | B2a (HTTP) | B2b (file) |
|---|---|---|
| State transport | Plugin HTTP POST (current code, unchanged) | Plugin `fs.writeFileSync` (**new plugin code**); engine pull via `SkyrimFileConnector` |
| Reflex + urgency bypass | **Works** (`engine.ts:727-779` on POST) | **Broken as-is** — `updateGameState` never runs; nothing broadcasts `gameState` to the page; nothing watches the file |
| UI/audio/WS | Page (same as B1) | Page (same as B1) |
| Action execution | **Nobody** — engine broadcasts `{type:"actions"}` and the page ignores it (no plugin link; also no `/api/actions` server today) | Same, worse: `sendAction` is a stub (`skyrim-file-connector.ts:25-28`) |
| World labels | Impossible (page never learns screen-space coords; plugin can't push) | Impossible |
| Offline/sim mode | No (needs app up) | **Yes** — file connector is the app's offline mode (`engine.ts:90` default) |

Note the asymmetry: B2a is "today plus an in-game page"; B2b is a genuinely different
ingestion path that today exists only as a pull for gate *context*, not as a state
pipeline — adopting it for real requires new app code (a watcher that parses
`state.json` and calls `updateGameState`, else reflex/urgency/dashboard mirroring die).

### B3 — "no-page": the plugin itself reaches the app's WS

SP JS has **no WebSocket API** (verified, §0.3). Candidate routes:

```
Route B3-1: node stdlib inside SP runtime
  plugin JS ── require("node:net") or npm "ws" ──► ws://localhost:3000/_ws
  (NodeInstance is real: JsEngine.cpp:112-165; 'fs' proven; 'net'/'ws' UNVERIFIED)

Route B3-2: mpClientPlugin packet channel
  plugin ── mpClientPlugin.createClient/send/tick ──► custom server you write
  ("only if multiplayer is installed" — index.d.ts:58-69; RakNet-style JSON packets)

Route B3-3: NirnLab CDP control channel (port 9000) — but note direction
  skydive-app ── CDP ws://localhost:9000 ──► Runtime.evaluate ──► CEF page
  (this is app→page control WITHOUT plugin bridging; it is NOT plugin→app transport)
```

B3-3 subtlety: the debug port helps the *app* drive the *page* (an alternative to
`browser.executeJavaScript` that needs zero plugin bridge code — interesting for B2),
but it gives the plugin nothing, because the plugin still cannot speak WebSocket.
Also B3-3 only exists when `BackendName=nirnlab` is explicitly set — the default `auto`
backend is Tilted with no debug port (`BrowserApi.cpp:20-23` vs
`BrowserApiNirnLab.cpp:15`). CDP behavior in this embedded CEF (target discovery,
`Runtime.evaluate` stability) is **UNVERIFIED**.

Even if B3-1 works, **B3 cannot be the whole client**: the plugin has no audio output
API (only game-asset `Sound` forms — capabilities doc §7.2), so TTS audio still needs a
page or an external speaker. B3's realistic ceiling is *an auxiliary direct channel*
(state in, maybe `Debug.takeScreenshot` frames out — see §3.4).

---

## 2. PROS per sub-variant

### B1 — page-thin

1. **Game thread stays clean.** The plugin's only new work is a `browserMessage`
   handler (rare JSON) and a handful of `executeJavaScript` pushes. No per-tick
   injection: compare Path A, which would push serialized state into the page every
   500 ms tick. SP's own docs warn per-frame JS is expensive (capabilities §1.1);
   B1 adds near-zero game-thread cost beyond the existing collectors.
2. **Plugin bundle stays small.** No WS protocol code, no frame builders, no audio
   decode in the plugin — the binary framing already exists app-side
   (`ws-binary.ts:16-39`) and the page reuses it verbatim.
3. **App UI evolves independently.** The page is served by the app
   (`browser.loadUrl("http://localhost:3000/...")` is doc-supported,
   `browser.md:29-30`); app deploys change the in-game UI with **zero plugin
   rebuilds**. The plugin↔page contract shrinks to "rare intents + rare events" —
   a much stabler seam than Path A's full state mirroring.
4. **Restart the plugin without dropping the WS.** SP hot reload removes plugin event
   handlers but the CEF page and its WebSocket persist (capabilities §2 hot-reload
   notes; the page is platform-level, not plugin-level). Narration/voice keep flowing
   through the page while the plugin reloads — only action execution pauses. The
   inverse also holds: page reload doesn't touch the plugin's HTTP state loop.
5. **Audio latency path is short.** TTS arrives as one base64 blob on the existing WS
   (`engine.ts:207-220`) and plays via WebAudio exactly like the dashboard does today
   (`session.ts:173-211`). No plugin hop, no executeJavaScript marshaling of audio.
   Precedent for CEF `<audio>` exists in skymp5-front (`index.js:37-39`) — though
   CEF-audio-as-such is still UNVERIFIED (capabilities §1.7; spike queued in
   `docs/research/feature-extraction-analysis.md` §2.4).
6. **One client codebase, two surfaces.** The page can be the same Nuxt view family
   as the dashboard (Pinia store `session.ts` already encapsulates WS+audio+state);
   the skymp5-front polyfill trick (`index.js:13-20`) makes the same bundle run in a
   normal browser for dev.
7. **Works with the file-connector offline mode for free.** If the game is off but the
   app runs (sim mode, `engine.ts:90`), the page still connects and renders whatever
   the engine broadcasts — B1 degrades to a dashboard, not a black rectangle.

### B2 — page-only

All B1 pros apply (1, 2, 3, 5, 7), plus:

1. **B2a is the cheapest possible in-game UI**: zero plugin changes for state (the
   POST loop stays, `index.ts:53-88`), zero bridge code. The page is a pure WS
   listener. Ship an in-game narration HUD in a day **ESTIMATE**.
2. **Total decoupling.** Page and plugin share no timing, no contract, no lifecycle.
   The page can be killed, reloaded, or served by a different app version freely.
3. **B2b survives app-less development** (state.json + engine pull), matching the
   app's existing offline/demo seam (`SKYRIM_CONTEXT_FILE_PATH`,
   `skyrim-file-connector.ts:9-10`) and the hackathon reality of restarting the
   Nitro server often (no HTTP connection to lose).
4. **No focus/input contention for core function.** Narration needs no cursor; the
   page can run unfocused (visible-only) indefinitely — the nastiest CEF problem
   (focus juggling, `BrowserApiTilted.cpp:44-75`) is sidestepped for anything
   read-only.

### B3 — no-page

1. **Removes the CEF dependency for transport entirely** — no page lifecycle, no
   autoplay policy, no load-after-mouse-move caveat (`browser.md:23`), no focus
   contention. If `node:net` works (UNVERIFIED), the plugin talks to the app with
   real push semantics for the first time (today: 500 ms HTTP ticks + 5/s limiter,
   `http-client.ts:5`).
2. **Lowest-latency state channel conceivable**: game-thread event → WS frame in the
   same tick, vs HTTP POST round trip. **ESTIMATE** end-to-end state latency drops
   from ~25-100 ms (HTTP local RTT + queueing) to ~1-5 ms (loopback TCP write) —
   pointless for narration, meaningful for reflex-style loops.
3. **mpClientPlugin (B3-2) is a proven wire format** in production
   (`skymp5-client/.../networkingService.ts`, capabilities §3 option D) — but the
   cost is a custom server speaking skymp packet framing *and* requiring the
   multiplayer client piece on the user's machine (`index.d.ts:60`).
4. **B3-3 (CDP 9000) costs the plugin nothing**: if NirnLab is the backend, the app
   gains a WebSocket control channel into the page (`BrowserApiNirnLab.cpp:15`)
   without any plugin bridge code — a cheap way to realize B2 *with* action
   execution (app → CDP `Runtime.evaluate` → `window.skyrimPlatform.sendMessage` →
   plugin). UNVERIFIED in practice.

---

## 3. CONS & technical limits

### 3.1 CEF/Chromium version & capability limits (all sub-variants with a page)

- **Old/embedded CEF quirks.** Neither vendored backend pins a visible Chromium
  version (no `CEF_VERSION` found in `skyrim-platform/src` — grep verified). Tilted is
  explicitly "legacy" (`BrowserApi.cpp:22`). Anything modern the dashboard leans on —
  **WebCodecs** (mediabunny's `VideoEncoder` path for VP8 clips,
  `skydive-app/src/utils/capture.ts:22-31`), **MediaRecorder opus**
  (`voice.ts:37-39`), structuredClone, etc. — is **UNVERIFIED** in this CEF. Age
  **ESTIMATE**: Tilted CEF is commonly Chromium ~8x era in skymp builds; treat as
  "assume nothing newer than ES2020 + basic WebAudio" until probed.
- **Clip capture inside CEF is the weakest link.** The dashboard captures vision via
  `navigator.mediaDevices.getDisplayMedia` (`capture.ts:9-14`). An embedded CEF has
  no screen-picker UI and typically no permission delegate for display capture —
  **UNVERIFIED but likely fails or hangs**. If the in-game page cannot capture, the
  engine gets no clips from it (and the engine cannot self-trigger —
  `engine.ts:766-770`). Realistic fallbacks:
  1. keep capture in an **external** browser page (operator mode) — but then
     "in-game autonomy" is partly fictional;
  2. plugin-side `Debug.takeScreenshot` (`index.d.ts:2427`) + `fs` + a **new app
     endpoint or the file connector** feeding `processClip` server-side — bypasses
     the WS clip path entirely (plugin HTTP body is string-only, so it'd be base64:
     **ESTIMATE +33% size**, ~200-800 KB/clip at 640px VP8-equivalent BMP→jpeg —
     cost unmeasured);
  3. B3-1 (`node:net` + `ws`, UNVERIFIED) streaming screenshots as binary clip
     frames — the only route where the plugin *itself* feeds `/_ws` clip frames.
- **Mic capture (voice questions) in CEF**: `getUserMedia({audio:true})`
  (`voice.ts:122`) needs a permission delegate; embedded CEF usually auto-denies or
  has none — **UNVERIFIED**. If blocked, voice questions must come from the external
  page or a plugin push-to-talk → `question` command relay.
- **Autoplay/muted-audio policy.** The dashboard explicitly unlocks a persistent
  AudioContext inside a user gesture (`session.ts:71-88` comment, `348-355`) before
  `startCapture`. In-game, the "gesture" must be a real CEF mouse event after
  `setFocused(true)`. Whether SP's synthetic/redirected input counts as a user
  activation in CEF is **UNVERIFIED**. Mitigations: unlock on first focus click;
  `<audio muted autoplay>` then unmute; or prime with a zero-length buffer. skymp5-front's
  `new Audio().play()` (`index.js:37-39`) suggests playback works after load, but the
  trigger there may be a click — not proof. This is exactly spike
  `feature-extraction-analysis.md` §2.4.
- **Mixed content**: not an issue for `http://localhost:3000` + `ws://localhost:3000`
  (ws from http is same-scheme-family; Chromium exempts localhost). It becomes one
  only if the app is ever served over https — then `ws://` (non-`wss://`) would be
  blocked. Note and move on.
- **`loadUrl` only after mouse move** (`browser.md:23`) and **MO2 breaks `file://`
  URLs** (`browser.md:24`): the page must be an `http://localhost` URL (good — that's
  the plan), and the first-load needs a mouse-move nudge; NirnLab queues early
  `executeJavaScript` (`BrowserApiNirnLab.cpp:117-126`) while Tilted drops it
  (`BrowserApiTilted.cpp:88-93`) — **handshake (`front-loaded` pattern,
  `skymp5-front/src/index.js:41-43`) is mandatory before pushing anything into the
  page on Tilted.**
- **Token/auth is gone** (`getToken` absent from source, §0.3) — the page can be
  driven by *any* local process able to reach CEF… and conversely the page channel is
  spoofable by any local web page via `window.skyrimPlatform`? No — that object exists
  only inside the CEF page context — but the app's `/_ws` is unauthenticated on
  localhost, so any local page could join the bus. Acceptable for a hackathon;
  documented risk.

### 3.2 Page lifecycle & state loss (B1, B2)

- **Page reload = state loss.** `registerClient` replays only `status` + last
  `gameState` (`engine.ts:518-534`): no description history, no audio queue, no
  actions replay. A reload mid-combat drops the current narration and any queued TTS.
  Mitigation: page persists last description in `sessionStorage`; or engine adds a
  `snapshot` replay message (small app change).
- **Plugin hot reload silently breaks the bridge (B1).** Handlers are removed on
  reload (capabilities §2); the page keeps sending `sendMessage` into a void until the
  plugin re-registers. Mitigation: heartbeat + `front-loaded` re-handshake; plugin
  re-inits `browserMessage` in `once("update")` init (pattern already in
  `index.ts:157-159`).
- **Page crash mid-combat**: CEF renderer crash ⇒ blank overlay until
  re-`loadUrl`-equivalent; the plugin has no page-liveness signal other than missing
  heartbeats. Mitigation: sprite-text narration tier (plan doc Phase 1,
  `docs/plans/skyguide-interface-bridge.md:77-86`) as the always-on fallback.

### 3.3 Freshness & fidelity (B2 especially)

- **B2b file freshness = gate cadence, not tick cadence.** The connector is read only
  when a gated clip runs (`engine.ts:138-148`) — with `intervalMs` clamped 1000-10000
  (`engine.ts:468`, default 6000 at line 72) the *context* can be seconds stale; and
  **nothing pushes it into `updateGameState`**, so reflex rules, urgency arming
  (`engine.ts:743-777`) and the `gameState` broadcast (730-735) — the very things the
  in-game page would render — never fire in B2b without new app code (a watcher).
  B2b is not "free offline mode"; it's "offline context for the gate only" as built.
- **B2a freshness = today's HTTP cadence**: 500 ms tick gate + arbitration suppression
  (`index.ts:66-71`) + 5 sends/sec cap (`http-client.ts:5`). Good enough for narration
  companionship; too slow for twitchy world labels.
- **Action fidelity is zero in B2** — no path from engine actions to the executor:
  no `/api/actions` endpoint (§0.1), `sendAction` stubs everywhere, and no page→plugin
  link by definition. B2 is narration-only unless paired with B3-3 (CDP) or a new
  command-file seam.
- **Cursor/focus**: any interactive page surface (buttons, engine pickers) requires
  `setFocused(true)` ⇒ vanilla CursorMenu opens (`BrowserApiTilted.cpp:44-75`) and
  mouse/keyboard leave the game. B1/B2 should design the default surface as
  non-interactive (auto-hiding captions/status), with focus as an explicit modal mode.

### 3.4 B3-specific limits

- **`node:net`/`ws` availability UNVERIFIED** despite the strong signal that the
  runtime is a genuine NodeInstance (`JsEngine.cpp:112-165`). Nobody in the vendored
  tree imports anything beyond `fs` (grep verified: `fs` only in
  `sweetCameraEnforcementService.ts:8`, `profilingService.ts:4`, `authService.ts:2`).
  Also, skyguide's webpack lacks `target:"node"`
  (`webpack.config.js:105-120` vs `skymp5-client/webpack.config.js:64`) — the *build*
  rejects node builtins before the runtime ever sees them.
  **Cheap in-game test (30 min)**:
  1. add `target: "node"` to `skyguide-skse/webpack.config.js` (mp5-client precedent);
  2. plugin: `try { const net = require("node:net"); printConsole("net=" + typeof net.connect); } catch (e) { printConsole("net FAIL: " + e); }` — same for `node:http`;
  3. if `net` resolves: `const s = net.connect(3000, "localhost")`, write a raw WS
     handshake (or bundle `ws` with `bufferutil`/`utf-8-validate` excluded) and watch
     `engine.ts:520` log "Client connected" in the app console;
  4. read results via `printConsole`/`~skyguide` (extend `index.ts:36-47`).
  Caveat even if it works: the Node loop is pumped per game frame
  (`JsEngine.cpp:104-110`), so socket events arrive at frame granularity
  (~16 ms @60 fps — fine), and a blocking/ spinning socket handler stutters the game.
- **No audio out from plugin JS** (§7.2 of capabilities) — B3 can never render TTS;
  a page or external client is still required. "No-page" is really "page for audio only".
- **B3-2 (mpClientPlugin)**: requires "multiplayer installed on user's machine"
  (`index.d.ts:60`) — a hard distribution dependency — plus a server implementing the
  skymp packet framing (**ESTIMATE 500-1500 lines, protocol details not analyzed
  here**). The plan doc explicitly rules it out (`docs/plans/skyguide-interface-bridge.md:136`).
- **B3-3 (CDP 9000)**: only with `BackendName=nirnlab` explicitly set in
  `SkyrimPlatform.ini` (default auto→Tilted, `BrowserApi.cpp:20-23`); port hardcoded
  9000 (`BrowserApiNirnLab.cpp:15`) — collides with any other dev debug port;
  CDP surface in an embedded/offscreen CEF is **UNVERIFIED** (target discovery may
  behave oddly without a real browser window). Zero-cost to *try* (a Node ws client +
  `Runtime.evaluate`) but not a foundation.
- **B3 reconnect storms live on the game thread**: a naive retry loop in plugin JS
  costs frames; needs the timersService-style game-loop timers (capabilities §2,
  mp5-client `timersService.ts`) rather than `setTimeout` chains.

### 3.5 MO2 / path quirks (B2b especially)

- `file://` URLs break under MO2 (`browser.md:24`) — use the http URL only.
- `state.json` location: the app resolves `SKYRIM_CONTEXT_FILE_PATH` relative to the
  **Nitro process CWD** by default (`skyrim-file-connector.ts:9-10` —
  `"./src/assets/state.json"`), while the plugin's `fs` writes resolve against
  **Skyrim's process CWD** (proven quirk class: mp5-client cpuprofile writes,
  capabilities §3 option B). Under MO2, "the game dir" is a virtualized overlay —
  both sides must agree on one **absolute** real filesystem path (env var on the app,
  explicit config in the plugin). Unt handled today: **no plugin code writes state.json
  at all** (grep verified) — B2b needs that written, atomic-rename style, with a
  timestamp TTL the connector currently lacks (`skyrim-file-connector.ts:13-23` parses
  whatever exists, no staleness check → stale-state risk after game quit).

---

## 4. Resource cost estimates

Legend: **V** = verified from tree, **E** = ESTIMATE, **U** = UNVERIFIED (needs the §3.4 probe).

| Cost item | B1 | B2a | B2b | B3 |
|---|---|---|---|---|
| Game-thread CPU: state loop | unchanged (V: 500 ms gate, `index.ts:161-177`) | unchanged (V) | swap POST for `fs.writeFileSync` — E: ~equal or cheaper | if `net` works: WS client on game thread, E: ~equal to HTTP, event-bound |
| Game-thread CPU: page bridge | ~0 (rare `executeJavaScript`; E: <0.1% frame budget) | 0 (V: no link) | 0 (V: no link) | n/a (no page needed for transport; audio still needs one) |
| CEF CPU (render+JS) | full-client page: E: 2-8% of one core for text/UI + WebAudio; heavier if page also captures (E: +10-25% core for VP8@640/15fps — but capture in CEF is U) | same as B1 minus intents | same as B1 | 0 for transport; audio-only page still costs E: 1-3% |
| WS traffic | identical frames to today's dashboard (V: framing `_ws.ts:13-40`); one hop less than Path A (no Napi→CEF string marshaling per state) | identical | identical + disk writes (E: 3-8 KB × tick rate ≈ 6-16 KB/s to SSD) | new direct WS: E: same payload volume as HTTP POSTs, minus HTTP header overhead |
| RAM: CEF processes | E: 200-500 MB total (browser+gpu+renderer) for a modest page — same order for Path A; the delta vs Path A is page complexity, small | same | same | E: 0 (transport) — the whole point; audio page E: 150-300 MB |
| RAM: Nitro app | already running (E: 150-300 MB Node) — unchanged all variants | unchanged | unchanged | unchanged |
| Plugin bundle size | +E: <2 KB (a `browserMessage` dispatcher + a few pushes) | +0 (V) | +E: ~1-2 KB fs writer | +E: 30-80 KB minified `ws` lib, or ~2 KB raw `net` handshake — build blocked until `target:"node"` (V) |
| New app code | none required (page reuses `session.ts` patterns; a `/companion` route E: 100-300 lines UI) | none for state; page same as B1 | watcher calling `updateGameState` (E: 50-100 lines) or lose reflex/urgency (V) | B3-1: nothing (protocol already fits); B3-2: E: 500-1500 lines packet server; B3-3: E: 50-100 lines CDP client |
| New game-side distribution deps | none | none | none | B3-2: multiplayer client piece (V: `index.d.ts:60`); B3-1: none if raw `net` |

Notes:
- Path A vs B on CPU is a wash at the CEF layer (same browser); the real delta is
  **per-tick `executeJavaScript` injection** (Path A: serialized state every 500 ms,
  E: 2-4 KB eval + Napi marshaling ≈ 0.1-0.5 ms/injection, negligible but nonzero;
  B1: ~0) vs **page autonomy** (B does its own fetching/decoding — still cheap).
- B2b trades network for disk: trivial bandwidth, but adds the stale-file failure
  mode (§5) and MO2 path negotiation.

---

## 5. Failure modes & mitigations

| Failure | B1 behavior | B2a | B2b | Mitigations |
|---|---|---|---|---|
| **App down (Nitro stopped)** | Page WS retries every 2 s (pattern `session.ts:442-447`); plugin HTTP enters 3-fail→10 s cooldown (V: `http-client.ts:68-75`); narration stops | Same; state POSTs fail silently into cooldown | Plugin keeps writing state.json (harmless); engine obviously gone | Page shows "reconnecting" chip; plugin cooldown already self-heals; consider exponential jitter to avoid thundering herd on app restart (page retry + plugin POST + poll all realign at once) |
| **WS reconnect storm (page reload loop)** | Each reload = new peer; `registerClient` logs + replays (`engine.ts:518-534`); broadcast fan-out to dead peers swallowed (`engine.ts:93-102` try/catch) — contained | same | same | Cap reconnect attempts; add client id; the engine's Set-cleanup on `close` (`_ws.ts:137-139`) is already correct |
| **Stale state.json** | n/a | n/a | **Real risk**: connector parses whatever file exists, no mtime/TTL (V: `skyrim-file-connector.ts:13-23`) → gate narrates a fight that ended when the game quit | Write atomic (tmp+rename); embed `timestamp` (payload already has one — V: `serializer.ts:58`) and have the connector/gate ignore entries older than N s (small app patch) |
| **Page crash / renderer death mid-combat** | Narration+audio dead; overlay blank; plugin unaware (no heartbeat = only signal) | Same; plugin state loop unaffected (V) | Same | Heartbeat page→plugin (B1) or page→engine; plugin falls back to sprite-text narration tier (plan Phase 1); `browser.setVisible(false)` on N missed beats to avoid black box |
| **Audio autoplay blocked** | AudioContext suspended (`session.ts:71-88` unlock pattern); TTS arrives and decodes but never plays | same | same | Unlock on first focus-gesture; test early (spike §2.4 of feature-extraction-analysis); fallback: route TTS to the external dashboard page; document "click overlay once" as day-1 UX |
| **CEF loads page late / after mouse move only** (V: `browser.md:23`) | Plugin pushes before load are dropped on Tilted (V: `BrowserApiTilted.cpp:88-93`, no queue); NirnLab queues them (V: `BrowserApiNirnLab.cpp:117-126`) | Page merely connects late | same | `front-loaded` handshake (V: `skymp5-front/src/index.js:41-43`) before any push; prefer/require NirnLab backend or re-push-on-ready |
| **Focus fight (user opens inventory while page focused)** | Input redirected to CEF; vanilla menus confused | same (only if page interactive) | same | Port browserService menu state machine (plan Phase 2; hide on bad menus, Escape unfocus) — mandatory for any interactive surface |
| **Plugin hot reload mid-session** | Page WS survives; `browserMessage` handler gone until re-init (V: hot reload semantics, capabilities §2) | Page unaffected; state loop restarts cleanly (`once("update")` init, V: `index.ts:157-159`) | fs writer restarts | Re-handshake on plugin init; keep bridge stateless (idempotent intents) |
| **B3-1 probe fails (`net` unresolved/blocked)** | n/a | n/a | n/a | Fall back to B1; the probe costs ~30 min (§3.4 protocol) |
| **B3-2 server mismatch / multiplayer absent** | n/a | n/a | n/a | Hard dep — don't ship; keep as experiment only (V: plan non-goals line 136) |
| **Port 9000 collision (B3-3)** | n/a | n/a | n/a | Detect and warn; only matters if NirnLab explicitly enabled (V: `BrowserApi.cpp:28-31`) |

---

## 6. Suitability matrix — skyguide features × sub-variant

| Feature (who does what) | B1 page-thin | B2a page-only-http | B2b page-only-file | B3 no-page |
|---|---|---|---|---|
| **Narration display** — engine `description` broadcast (`engine.ts:171-179`) → UI | ✅ Page renders, fresh; plugin uninvolved | ✅ Same | ⚠️ Works only if a watcher feeds `updateGameState`; else the page shows whatever the last broadcast was (stale) | ❌ No UI in plugin; needs at least a sprite-text tier (plugin-side Texts API) — different feature then |
| **TTS audio** — `audio` broadcast (`engine.ts:207-220`) → speaker | ✅ Page WebAudio (autoplay caveat U) | ✅ same | ✅ same | ❌ Impossible in plugin JS (no audio API — capabilities §7.2). Audio alone forces a page back in |
| **Voice questions (STT)** — mic → binary audio frames (`voice.ts:71`, `_ws.ts:30-37`) → `voice_question` | ⚠️ Page can send IF CEF mic works (U); else external page or plugin push-to-talk → page relays `question` | ⚠️ same, minus the relay | ⚠️ same | ⚠️ If `net` works the plugin *could* ship binary frames — but it has no mic; needs plugin Input-based PTT + an OS mic the plugin can't access → effectively no |
| **Voice status chip** — `voice_status` broadcast (`engine.ts:683,698`) | ✅ Page | ✅ Page | ⚠️ Only if anything drives voice at all | ❌ No UI |
| **World labels** ("Bandit, 15 m, left") — needs `worldPointToScreenPoint` per frame (typings line 56) | ⚠️ Best-in-B: plugin computes screen coords, pushes *sparse label updates* via `executeJavaScript` (the one hot-ish push B1 allows); or plugin-only sprite texts | ❌ No plugin→page path; sprite-text fallback only | ❌ same | ✅ Actually strongest: plugin-owned Texts API labels with zero page involvement (but that's the Path-0 tier, not WS) |
| **Action execution** — engine `actions` broadcast (`engine.ts:181-184`) → plugin `executor.ts` | ✅ **The** reason to keep a thin bridge: page receives broadcast → `sendMessage('action', …)` → `browserMessage` → executor (needs ~20 lines plugin + app nothing) | ❌ Dead end (V: no `/api/actions`, no `sendAction` callers, stub connectors §0.1). Unless B3-3 CDP trick (U) | ❌ same; file connector's `sendAction` is a stub (V: `skyrim-file-connector.ts:25-28`) | ⚠️ B3-1 could *receive* WS commands directly (if U holds) and execute — the one thing B3 does better than B2 |
| **Game-state freshness to engine** (reflex `engine.ts:743-763`, urgency `769-777`) | ✅ HTTP POST path intact (V) | ✅ intact (V) | ❌ Broken without new watcher (V: `updateGameState` only on POST) | ✅ Best (push, E: ms-level) if `net` works |
| **Restart plugin w/o dropping narration** | ✅ WS lives in page | ✅ | ✅ | n/a (no narration channel anyway) |
| **Offline/sim mode** (app without game) | ✅ Page = mini dashboard | ✅ | ✅ (this is the connector's home turf, V: `engine.ts:90`) | n/a |

Degradation summary: **B1** loses only what CEF loses (mic/capture/autoplay, all U);
**B2a** additionally loses actions and world labels by construction; **B2b** further
loses reflex/urgency/freshness until new app code lands; **B3** loses all UI and audio
— it is a transport, not a client.

---

## 7. Verdict

### Strongest sub-variant: **B1 (page-thin)**

Rationale:
1. It is the only variant where every skyguide feature has an owner (matrix §6):
   the page owns WS/UI/audio, the plugin owns execution + screen-space truth, the
   engine owns cognition — each on its natural side of a seam that already exists
   (`SkyrimConnector` for state, `browserMessage` for intents).
2. It keeps the two verified transports doing what they're good at: HTTP POST for
   plugin→engine state (works today, V), WS for everything the page can do natively
   (binary frames, broadcasts — V), `sendMessage`/`executeJavaScript` for the rare,
   bursty intents/events (V, `browser.md:42-71`).
3. Failure isolation is the best of the four: plugin reload, page reload, and app
   restart are three independent, self-healing loops (§5).

**B2a** is the right *stepping stone* (ship the in-game narration HUD first, zero
plugin changes), **B2b** is only worth it as the offline/demo seam it already is —
do not make it the live pipeline without adding a watcher + TTL.
**B3** is a research spike, not an architecture: even its best case (node `net` works)
cannot output audio or UI, so it complements a page rather than replacing one; its
killer app would be *direct WS state push* (replacing HTTP POST) — worth the 30-minute
probe (§3.4) purely for the latency win on reflex loops, behind a feature flag.

### When Path B beats Path A

- **You want the game thread untouched and the plugin bundle tiny** — B1's bridge is
  ~rare-events-only vs Path A's per-tick state mirroring (§4).
- **You want app-side UI iteration without plugin rebuilds** — the page is just a URL
  (`browser.md:29-30`); Path A's page↔plugin contract is necessarily richer (it
  mirrors state continuously), so it churns more.
- **You want to reuse the dashboard's client stack verbatim** (Pinia store `session.ts`,
  `ws-binary.ts`) in-game — Path B's page *is* the dashboard's sibling; skymp5-front's
  polyfill pattern (`index.js:13-20`) even lets one bundle serve both contexts.
- **You value surviving plugin hot reloads** without dropping the WS session (§5).
- Path A (plugin-mediated everything, thin page) wins instead when: the CEF turns out
  too old/limited (§3.1 probes fail), when world labels must be frame-fresh inside the
  page, or when you don't trust the page's lifecycle and want the plugin to own all
  truth. I.e., **probe CEF first; the probe results should pick A or B, not taste.**

### Top 3 risks with mitigations

1. **CEF media capabilities are unverified and Path B leans on them** (autoplay for
   TTS, `getUserMedia` for voice, `getDisplayMedia`/WebCodecs for clips — §3.1).
   *Mitigation:* run the §2.4 audio spike + mic/capture probes as the very first task
   (one in-game page, three feature detects); design the page so each capability
   degrades independently (narration without voice; external capture fallback;
   `Debug.takeScreenshot`+file/app-endpoint fallback for vision, `index.d.ts:2427`).
2. **The bridge's liveness/lifecycle assumptions** (load-after-mouse-move, Tilted
   dropping pre-load `executeJavaScript`, hot reload voiding `browserMessage`,
   renderer crashes — §3.2, §5).
   *Mitigation:* `front-loaded` handshake + heartbeat + plugin-side sprite-text
   narration tier (plan doc Phases 1-2) so the game never goes mute because a web view
   hiccuped.
3. **Actions are dead code end-to-end today** (no `/api/actions` server, no
   `sendAction` callers, dashboard ignores `actions` broadcasts — §0.1), so "the page
   will forward actions" is the least-proven link in B1 and nonexistent in B2.
   *Mitigation:* implement the B1 forwarder (`browserMessage` → `executor.ts`, reusing
   the existing `parseAction` validation in `src/actions/parser.ts`) together with a
   tiny app-side decision: either broadcast actions to all peers (current behavior,
   `engine.ts:181-184`) and let the game page claim them, or target the skyrim client
   kind explicitly — decide before wiring, to avoid double-execution when both the
   dashboard and the game page are connected.

---

## Appendix — verification ledger

Verified (file:line in text above): `/_ws` route & framing (`_ws.ts:13-40`;
`session.ts:428-462,434`); broadcast catalog & registerClient replay (`engine.ts`);
reflex/urgency POST-only (`engine.ts:727-779`); connector seams
(`skyrim-connector.ts`, `skyrim-file-connector.ts:9-28`, `skyrim-api-connector.ts:8-19`,
`engine.ts:90,132-148`); missing `/api/actions` (dir listing + grep); plugin loops
(`index.ts`, `config.ts`, `http-client.ts`, `polling.ts`, `serializer.ts`, `events.ts`);
browser API surface & backends (`BrowserApi.cpp:15-35,88-175`,
`BrowserApiTilted.cpp:44-93`, `BrowserApiNirnLab.cpp:13-18,117-126,143-171`,
`browser.md`); token absence (typings:77 vs source grep); skymp5-front patterns
(`index.js:13-20,37-43`); NodeInstance bootstrap (`JsEngine.cpp:104-165`); webpack
targets (`webpack.config.js:105-120`; `skymp5-client/webpack.config.js:64`);
`mpClientPlugin` gating (`index.d.ts:58-69`); `Debug.takeScreenshot`
(`index.d.ts:2427`); prior-research constraints
(`docs/research/skyrim-platform-capabilities.md` §1-§7).

ESTIMATE: payload sizes, CEF RAM/CPU shares, injection costs, B3-2 server effort,
stale-file risk magnitudes, latency deltas.

UNVERIFIED (each has a cheap probe): CEF audio playback & autoplay unlock; CEF
`getUserMedia`/`getDisplayMedia`/MediaRecorder/WebCodecs; `node:net`/`ws` inside SP;
CDP-on-9000 behavior in embedded CEF; NirnLab-vs-Tilted differences beyond those read
in source; `Debug.takeScreenshot` output path/format; Tilted silent-drop of pre-load
JS (inferred from code shape, not runtime-observed).
