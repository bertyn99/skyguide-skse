# Path A — "Plugin ↔ page bridge via browserMessage" — deep analysis

Brainstorm/analysis of ONE candidate architecture for connecting the Skyrim Platform (SP)
TypeScript plugin to the companion web app (Nuxt/Nitro at `localhost:3000`, WebSocket
engine, binary clip/audio frames).

**Path A in one line:** the SP plugin loads a companion page in the in-game CEF browser
(`browser.loadUrl("http://localhost:3000/companion")`); the page owns the real WebSocket
to the app; plugin→page traffic is `browser.executeJavaScript("...")` string injection,
page→plugin traffic is `window.skyrimPlatform.sendMessage(...)` arriving as the
`browserMessage` event. Game state flows plugin → page → WS; actions/TTS flow
WS → page → plugin / in-page `<audio>` playback.

All claims below are **verified against local sources** with `file:line` citations unless
marked **ESTIMATE** (reasoned but not measured) or **UNVERIFIED** (could not be confirmed
from local sources). Prior research: `docs/research/skyrim-platform-capabilities.md` (§2
runtime, §6 browser tier) — consistent with everything found here, and extended with the
C++-level mechanics it did not cover.

Three factual corrections to the Path A premise discovered during grounding (all verified):

1. **The WS endpoint is `/_ws`, not `/ws`.** The route file
   `skydive-app/server/routes/_ws.ts` is mounted by Nitro at `/_ws`; the existing client
   connects to `ws://<host>/_ws` (`skydive-app/src/stores/session.ts:433-437`). Minor, but
   the page must use the right URL.
2. **No `/companion` page exists in the app yet** (the app is a Vite+Vue SPA
   `skydive-app/src/App.vue` + Nitro server; no pages directory). Path A requires adding
   this route/page.
3. **The current action-polling loop is dangling.** The plugin polls
   `GET /api/actions` (`src/actions/polling.ts:14,29`), but `skydive-app/server/api/`
   contains no `actions` route (only `game-state.post.ts`, `config.get.ts`, `situations/`,
   `evals/`, `engines/`). Actions currently reach nobody over HTTP — relevant when
   comparing Path A against "keep the status quo".

---

## 1. How the bridge actually works at engine level

### 1.1 Backend selection: "Tilted" is the default, NirnLab is opt-in

`browser.*` calls are dispatched by a backend selected once from
`Data/SKSE/Plugins/SkyrimPlatform.ini` `[Browser] BackendName`:

- `"auto"` (default) → **Tilted (legacy)** — log line "Auto mode not implemented yet,
  falling back to Tilted UI (legacy)" (`skymp/skyrim-platform/src/platform_se/skyrim_platform/BrowserApi.cpp:15-27`).
- `"nirnlab"` → NirnLab UI Platform; `"off"` → stubbed no-op browser (`BrowserApi.cpp:17-19, 60-87`).

Everything below describes the **default Tilted** path unless stated; NirnLab differences
are called out where they matter (they matter: marshaling is different).

### 1.2 Plugin → page: `browser.executeJavaScript` injection mechanics

Chain (Tilted), all verified:

1. Plugin JS calls `browser.executeJavaScript(src)`.
2. Napi binding `BrowserApiTilted::ExecuteJavaScript` extracts the string
   (`BrowserApiTilted.cpp:88-93`) and calls `MyChromiumApp::ExecuteJavaScript`.
3. `MyChromiumApp::ExecuteJavaScript` (`skymp/.../tilted/ui/MyChromiumApp.cpp:272-278`):
   ```cpp
   if (m_pGameClient && m_pGameClient->IsReady()) {
     m_pGameClient->GetBrowser()->GetMainFrame()->ExecuteJavaScript(src, "my mind", 0);
   }
   ```
   - This is **stock CEF `CefFrame::ExecuteJavaScript`**: the game thread only posts the
     string to the CEF UI thread; **parse/compile/eval happens in the render process**
     (`SkyrimPlatformCEF.exe`), never on the game thread.
   - **Silent drop before the page is ready.** `IsReady()` is
     `m_pBrowser && m_pLoadHandler->IsReady()` (`tilted/ui/OverlayClient.cpp:123-126`);
     `m_ready` is set in `OnLoadEnd` (`tilted/ui/MyLoadHandler.h:16,22`). There is **no
     queue** on the Tilted path: anything injected before the first `OnLoadEnd` — or during
     a re-`loadUrl` navigation — is **lost with no error anywhere**. (NirnLab differs: it
     queues into `jsExecQueue` and flushes when the browser object appears,
     `BrowserApiNirnLab.cpp:75-91,117-126` — but that queue only bridges the
     "browser not yet created" phase, not page reloads.)
   - **No size limit** is enforced anywhere in the chain (Napi string → std::string → CEF
     IPC). Practical limits are CEF's internal IPC buffer sizes, not SP — treat payloads up
     to a few hundred KB as fine, MBs as risky (**ESTIMATE**, standard CEF behavior).
   - **No escaping is done by the engine.** `src` is *source code*, not data. A JSON
     payload must be embedded as
     `browser.executeJavaScript("window.onState(" + JSON.stringify(payload) + ")")`,
     i.e. **serialize-then-embed-inside-another-source-string**. The typings explicitly
     warn about escaping for the sibling `consoleMessage` path
     (`node_modules/@skyrim-platform/skyrim-platform/index.d.ts:260-263`). If you build
     the wrapper string by hand instead of `JSON.stringify`-twice, `'`/`"`/`\`/newline in
     any game string (actor names, quest names, item names — player-visible data) breaks
     the injection or, worse, injects arbitrary JS.
4. CEF browser process settings that shape cost/behavior (verified,
   `MyChromiumApp.cpp:86-97,123-129,144-156`):
   `no_sandbox = true`, `multi_threaded_message_loop = true`,
   `windowless_rendering_enabled = true`, `windowless_frame_rate = 60`,
   **`remote_debugging_port = 9000` in both debug and release builds**,
   subprocess = `SkyrimPlatformCEF.exe` (`browser_subprocess_path`,
   `MyChromiumApp.cpp:123-124`; the separate process is confirmed by
   `main.cpp:446-447` which closes `SkyrimPlatformCEF.exe.hidden` on detach).
5. **`loadUrl` does not navigate immediately.** `LoadUrl` only stores the URL and a
   `urlChanged` flag (`MyChromiumApp.cpp:280-291`); the actual `LoadURL` executes inside
   `InjectMouseMove`, throttled to once per second (`MyChromiumApp.cpp:224-242`), which is
   driven by mouse input events and by `OnUpdate` only when the cursor menu is closed
   (`main.cpp:389-399`). This is the mechanism behind the documented "loads URLs only
   after the user moves the mouse" caveat (`skymp/docs/skyrim_platform/browser.md:23`).
   First load of the default `file:///Data/Platform/UI/index.html` happens at browser
   creation (`MyChromiumApp.cpp:151-153`) and does not wait for mouse movement.

### 1.3 Page → plugin: `window.skyrimPlatform.sendMessage` → `browserMessage`

Chain (Tilted), all verified:

1. **Render process**: on every V8 context creation, SP creates a global object named
   `skyrimPlatform` (`tilted/ui_process/OverlayRenderProcessHandler.cpp:11-25`) and adds
   `sendMessage` as a native function (`tilted/ui_process/ProcessHandler.cpp:8-18`).
   Note `OnContextReleased` deliberately leaks the object because cleanup caused
   "SkyimPlatformCEF.exe eats ~30% of CPU / the render stops / access violation"
   (`OverlayRenderProcessHandler.cpp:27-40`) — a firsthand developer comment on CEF
   instability in this exact integration, useful as an anecdotal cost/fragility data point.
2. **Serialization in the page** (`tilted/ui_process/OverlayV8Handler.cpp:26-48,50-104`):
   each argument is recursively converted V8 → `CefValue`. Supported: **bool, int, double,
   null, string, array, object**. Verified behaviors:
   - **Circular structures are detected** and abort the whole message — `aException` is
     set and the message is *not sent* (`OverlayV8Handler.cpp:42-47,60-64`); the exception
     surfaces to page JS via the V8 handler contract.
   - **Undefined, functions, `Date`, `Map`/`Set`, `ArrayBuffer`/typed arrays are NOT
     supported**: they fall into the `IsObject()` branch (`OverlayV8Handler.cpp:87-101`)
     and serialize as an empty or near-empty dictionary — **silent data loss**.
   - **There is no binary channel.** `ConvertValue` never emits `VTYPE_BINARY`, and the
     game-side converter maps `VTYPE_BINARY` → `undefined`
     (`main.cpp:537-539`). Page→plugin binary is impossible on this path — binary
     clip/audio frames must terminate in the page (or the app), never in plugin JS.
3. **IPC hop**: the serialized list is sent as a `"ui-event"` process message to the
   browser process (`OverlayV8Handler.cpp:30,46`).
4. **Browser process**: `OverlayClient::OnProcessMessageReceived`
   (`tilted/ui/OverlayClient.cpp:105-121`) forwards to `ProcessMessageListenerImpl`
   (`main.cpp:462-498`), which **copies** the arg list and calls
   `SkyrimPlatform::GetSingleton()->AddTickTask([...])` — i.e. the message is
   **marshaled onto the game thread** via the tick-task queue
   (`SkyrimPlatform.cpp:429-432` → `Viet::TaskQueue<Napi::Env> tickTasks`,
   `SkyrimPlatform.cpp:372`).
5. **Game thread delivery**: tick tasks are drained in `JsTick`
   (`SkyrimPlatform.cpp:411-427`), which runs every frame from the Papyrus-VM update hook
   (`main.cpp:72-87`) — and from the menu-safe `TickHandler.h:29` path with
   `gameFunctionsAvailable = false` when in the main menu. Inside the task, each `CefValue`
   is recursively converted to a Napi value (`main.cpp:500-542` — note again
   `VTYPE_BINARY → undefined`), packed into
   `{ arguments: [...] }`, and dispatched via
   `EventsApi::SendEvent("browserMessage", {event})` (`main.cpp:494-496`).
   - **Latency**: delivery happens on the *next* frame's task drain after the IPC arrives
     — one frame + scheduling, i.e. **≤ ~16.7 ms at 60 fps** (**ESTIMATE** derived from the
     verified per-frame drain; not measured).
   - **Handler safety**: handler exceptions are caught, logged via spdlog and the in-game
     console (`EventsApi.cpp:57-70`); they do not crash the game, but per
     `features.md` (via prior research §2) "performance is not guaranteed with unhandled
     exceptions".
   - **Threading model**: `browserMessage` handlers run on the game thread between
     frames, identical to `update` handlers — so `executeAction`'s guards
     (`src/actions/executor.ts:146-161`: null player, invalid form, Loading/MessageBox
     menus) remain exactly as valid as they are for the current HTTP-poll path.
6. **NirnLab variant** (`BrowserApiNirnLab.cpp:143-164`): `sendMessage` is registered via
   the NirnLab UI API with `.executeInGameThread = true`; args arrive as `const char**`
   (plain strings) and each is parsed **on the game thread inside the tick task** with
   `NapiHelper::ParseJson` — which literally calls JS `JSON.parse`
   (`NapiHelper.h:255-262`). So on NirnLab, page→plugin args are JSON *strings*, and a
   malformed string throws inside the tick task. The execution-safety properties are
   otherwise the same.

### 1.4 Security posture of the channel (verified)

- **`browser.getToken()` / `window.spBrowserToken` no longer exist in the runtime.** The
  npm typings still declare `getToken()` (`index.d.ts:77`), but the vendored runtime
  registers only `setVisible/isVisible/setFocused/isFocused/loadUrl/executeJavaScript`
  (`BrowserApi.cpp:88-121`) and a grep of the whole vendored
  `skymp/skyrim-platform/src` for `getToken|spBrowserToken|Token` returns **nothing**. The
  documented token flow (`skymp/docs/skyrim_platform/browser.md:35-38`) is stale. The
  plugin↔page channel therefore carries **no authentication at all**.
- **The app's WS is unauthenticated**: `open(peer) → registerClient(peer)` with no token
  check (`skydive-app/server/routes/_ws.ts:42-45`;
  `skydive-app/server/utils/engine.ts:518-534`).
- **CEF remote debugging on port 9000 is always on** (`MyChromiumApp.cpp:92-97` — the
  release branch also sets it). Any local process can attach DevTools to the in-game
  browser and drive the page (and therefore `sendMessage` → action executor).
- Net: the composite channel "local web page → arbitrary action execution in-game" is
  open to anything that can either connect to `/_ws` or reach CEF DevTools on 9000.
  Acceptable for a hackathon on a trusted dev machine; a real local risk surface otherwise.

### 1.5 What the app side expects (verified)

- `_ws.ts` handles JSON commands (`start/stop/clip/setInterval/setPrompt/setTtsEngine/
  setPipeline/setGateEngine/setSttEngine/question/audio_chunk`) and **binary frames**:
  type 1 = clip (uint32 LE duration + payload), type 2 = audio (mime id + payload)
  (`_ws.ts:13-40,58-124`).
- Engine broadcasts to **all** connected peers: `status`, `log`, `description`,
  `actions`, `audio` (base64 buffer + mime + priority + text), `voice_status`,
  `voice_question`, `gameState` (`engine.ts:93-112,171-220,683-717,727-735`).
- `registerClient` replays `status` + the latest `gameState` to each new peer
  (`engine.ts:518-534`) — a reconnecting in-game page gets fresh state for free.
- TTS audio is already played in a browser page via `AudioContext` +
  `decodeAudioData` + queueing (`skydive-app/src/stores/session.ts:71-85,173-211`) —
  i.e., the exact playback code Path A needs page-side already exists in the app's
  dashboard, but it is unlocked **on a user gesture** (`session.ts:348-355,374-381`).
- The HTTP ingest `POST /api/game-state` exists and validates `protocolVersion: 1`
  (`server/api/game-state.post.ts:5-31`), matching the plugin's serializer
  (`src/game-state/serializer.ts:43-61`). The WS switch has **no game-state command** —
  if state should move to the WS under Path A, `_ws.ts`/`engine.ts` must be extended.

---

## 2. PROS — what this path is best at

1. **Real WebSocket in the loop, with zero new plugin-side transport code.** SP JS has no
   WebSocket/TCP (verified absent, prior research §3; unchanged). Path A gets the page —
   a normal Chromium context — to own the socket. Binary frames (clip/audio) work
   browser-side by construction (`_ws.ts:17-40` consumes them from a browser peer), and
   the app already speaks this protocol with a page.
2. **Push instead of poll, both directions, with engine-verified latency.**
   - Actions: app broadcast → page → `sendMessage` → `browserMessage` on the next frame's
     tick drain (≤ ~1 frame + IPC, **ESTIMATE ≤ ~17-33 ms total** vs the current 1000 ms
     poll cadence in `src/actions/polling.ts`/`src/config.ts:13` — which today polls a
     route that doesn't even exist in the app, see correction 3 above).
   - State: still plugin-paced (500 ms gate, priority rate limits), but delivery to the
     app is a WS push from the page — no httplib thread pool of 3 to queue behind
     (pool(3) verified in `HttpClient.cpp` via prior research §3), no HTTP overhead per send.
3. **Event-driven game-side logic stays fully in plugin JS.** All collectors, hooks and
   guards (`src/index.ts:157-205`, `src/events.ts:187-398`, `src/game-state/collector.ts`)
   are untouched; Path A only replaces the *transport tail* (`sendGameState` in
   `src/communication/http-client.ts` and the poll loop in `src/actions/polling.ts`).
4. **Action execution safety is unchanged and game-thread-correct.** `browserMessage`
   handlers run on the game thread inside a tick task (§1.3), so the executor's
   null/`getFormEx`/menu guards (`src/actions/executor.ts:146-161`) work identically.
   Handler exceptions are contained by `EventsApi` (`EventsApi.cpp:57-70`). No new
   threading hazards versus the HTTP path.
5. **In-game UI for free — the UI *is* the transport.** Narration display, TTS playback,
   labels, voice status all render in the same page that owns the WS. skymp5 proves the
   pattern at production scale: the whole multiplayer HUD is a web app
   (`skymp/skymp5-front/src/index.js`) driven by
   `skymp/skymp5-client/src/services/services/browserService.ts`.
6. **TTS audio terminates in the page.** SP has no arbitrary audio API (prior research
   §7.2); the app already plays base64-decoded TTS through `AudioContext`
   (`session.ts:173-211`). In-game `<audio>`/WebAudio is the only candidate outlet, and
   Path A provides it (with autoplay caveats, §3.6).
7. **Offline resilience improves.** If the app is down: the page's WS client reconnects
   with backoff, the plugin keeps collecting, and the page can buffer latest state and
   flush on reconnect (`registerClient` replays state server-side anyway,
   `engine.ts:518-534`). Compare with the HTTP path's 5-failure cooldown / 10 s lockout
   (`src/communication/http-client.ts:68-75`) and poll backoff to 30 s
   (`src/actions/polling.ts:63-74`) — Path A centralizes reconnection in one place (the
   page) with standard web tooling.
8. **Handshake/lifecycle precedent exists.** skymp5's page sends
   `window.skyrimPlatform.sendMessage('front-loaded')` on boot
   (`skymp5-front/src/index.js:41-43`) and the client reacts
   (`browserService.ts:58-64`) — exactly the "page is ready, stop dropping injections"
   pattern Path A needs (§5.1).
9. **Dev experience.** The companion page is served by the same Nitro/Vite dev server as
   the dashboard (`browser.md:30` explicitly shows `loadUrl("http://localhost:1234")` for
   a dev server); page-side changes hot-reload without touching the game. CEF DevTools on
   port 9000 (`MyChromiumApp.cpp:96`) allow debugging the in-game page from a desktop
   browser.

---

## 3. CONS & technical limits

### 3.1 Message throughput & per-message cost

- **Plugin→page is "compile-and-run" per message.** Every `executeJavaScript` is a full
  JS *source* shipped across process boundary and parsed/compiled by the render process.
  At the plugin's cadence — 500 ms gate (`src/config.ts:9`), priority rate limits
  200/500/1000/2000 ms (`src/arbitration/priority.ts:13-19`) plus event-driven sends
  (`src/index.ts:179-205`) — that's **~1-8 injections/sec of ~0.5-4 KB JSON**
  (payload size **ESTIMATE** from `serializer.ts` shape: player + up to 10 enemies).
  This is *cheap*: a few KB of V8 parse is well under 1 ms of render-process time
  (**ESTIMATE**). Throughput is not the problem at skyguide's rates; the costs that
  matter are structural (§4).
- **Page→plugin pays two recursive tree materializations + one IPC hop per message**
  (V8→CefValue in `OverlayV8Handler.cpp:50-104`, CefValue→Napi in
  `main.cpp:500-542`), plus the copy in `main.cpp:484`. Fine for actions (rare, small);
  wrong for any high-frequency or binary stream — and **binary is impossible** (§1.3).
- **Batching asymmetry.** `sendMessage` carries *multiple args per IPC*
  (`browser.md:43-47`, `OverlayV8Handler.cpp:37-47`) — the page can batch many actions
  into one message cheaply. Plugin→page has no such aggregation primitive: one
  `executeJavaScript` per push, though you can pack a window of state into one payload
  yourself. At skyguide rates this is irrelevant; at 30-60 Hz telemetry it would start to
  matter (**ESTIMATE**).
- **The page is a mandatory serializing middleman for state.** State must be
  JSON-stringified in the plugin, embedded in JS source (§3.2), parsed in CEF, re-JSON
  `JSON.stringify`'d by the page's `ws.send` (strings only in the WS JSON-command path;
  binary frames exist only for clip/audio uploads, `_ws.ts:17-40`). Three
  serializations per state message vs one on the HTTP path (`game-state.post.ts` does
  zero reserialization). At 500 ms cadence: negligible; just don't pretend this is a
  high-bandwidth channel.

### 3.2 String escaping (the classic footgun, verified relevant)

`executeJavaScript` takes **source code** (`MyChromiumApp.cpp:275`). Any game-derived
string (enemy names `getName()`, quest titles, item names, narration text with quotes)
embedded naively breaks the injection — or executes attacker-influenced JS in the page
(an actor name containing `");steal();("` is enough; Skyrim NPC names are modder-controlled
data). The typings' own warning pattern for `consoleMessage`
(`index.d.ts:260-263`) applies a fortiori. Mandatory pattern:
`browser.executeJavaScript(\`window.__skyguidePush(${JSON.stringify(JSON.stringify(payload))})\`)`
— double-stringify, never interpolation of raw strings. Note `JSON.stringify` does **not**
escape `</script>`-style sequences inside script text (not relevant here since this isn't
HTML), and U+2028/U+2029 are legal in JSON but were illegal in JS string literals
pre-ES2019 — modern CEF (Chromium ≥ 80, **ESTIMATE** of the vendored CEF vintage) handles
them, but a sanitizing wrapper is still cheap insurance.

### 3.3 No binary channel page→plugin (hard limit)

Verified twice (§1.3): `ConvertValue` never produces `VTYPE_BINARY`; game-side maps it to
`undefined` (`main.cpp:537-539`). Anything binary — clip frames, audio chunks, screenshots
— must terminate in the page or never transit this bridge. Plugin JS also can't POST
binary bodies (`HttpResponse.body` is a string; prior research §7.4). Consequence: **clip
capture cannot be plugin-side under Path A** (nor under any other SP-only path). The
in-game CEF page also almost certainly cannot do `getDisplayMedia()` screen capture of the
game from inside a windowless CEF (**UNVERIFIED**, but no picker UI exists and skymp5
never does it) — clip capture stays on the desktop dashboard page, exactly as today
(`session.ts:348-372`).

### 3.4 Lifecycle & hot-reload gotchas

- **First-load drop window** (§1.2): injections before `OnLoadEnd` are silently dropped;
  `loadUrl("http://localhost:3000/companion")` additionally waits for a mouse move +
  up-to-1 s throttle (`MyChromiumApp.cpp:224-242`, `browser.md:23`). Without a
  ready-handshake you will lose the first seconds of state.
- **Plugin hot reload** removes all event handlers and resets everything except
  `storage` (prior research §2, `features.md`). The CEF page itself survives plugin
  reload (the browser belongs to the SP runtime, not the plugin — **inferred, UNVERIFIED**
  for the reload case specifically), but the new plugin instance has no memory of the
  page: it must re-arm the handshake and must not assume the page reloaded. Conversely,
  re-serving the page (dev-server HMR full reload) resets the page's WS + buffered state
  while the plugin keeps injecting — injections land in a fresh page that may lack your
  handlers until it finishes loading (silent drop again).
- **Main menu**: `browserMessage` is delivered in the main menu (tick-task path with
  `gameFunctionsAvailable=false`, `TickHandler.h:29`), but Papyrus calls throw there;
  also "promises don't work in the main menu" (mp5-client `settingsService.ts`, prior
  research §2). The executor's `Game.getPlayer()` guard
  (`src/actions/executor.ts:147-151`) becomes the load-bearing protection — keep it.
- **Loading screens**: no browser event; use `Ui.isMenuOpen("Loading Menu")` as today
  (`src/actions/polling.ts:22`, `src/actions/executor.ts:87`), plus skymp5's practice of
  hiding the overlay while "bad menus" are open (`browserService.ts:93-109`).

### 3.5 Focus stealing vs gameplay (verified mechanics)

`browser.setFocused(true)` flips the DInput `ChromeFocus` flag AND opens the game's
CursorMenu (`BrowserApiTilted.cpp:44-75`); while focused, keyboard/mouse are redirected to
CEF (`main.cpp:340-424`), and held keys auto-repeat after 0.5 s (`main.cpp:403-414`).
F6 is a **hardcoded** DInput toggle (`main.cpp:459`) independent of your plugin. If the
companion page is ever interactive in-game, focus management must follow skymp5's pattern
(toggle keys, Escape-to-unfocus, unfocus when bad menus open — `browserService.ts:33-51`).
A non-interactive (display-only) companion page can simply never call `setFocused` —
strongly recommended for skyguide's narration use case. Note the page can be *visible*
while unfocused: rendering (`DX11RenderHandler.cpp:60-67`) is independent of focus.

### 3.6 Unauthenticated channel & local exposure (verified, §1.4)

No token (`getToken` removed from runtime), no WS auth, DevTools on :9000 always on.
Any local process can (a) connect to `/_ws` and inject game state / trigger TTS, or
(b) attach to CEF DevTools and call `window.skyrimPlatform.sendMessage(...)` →
`executeAction` (move/activate/attack — `src/actions/types.ts:1-19`). The parser
(`src/actions/parser.ts`) validates shape but not intent. Local-only, hackathon-acceptable,
but it means the machine's browser (drive-by JS hitting `http://localhost:3000/_ws`)
is in your threat model. A same-origin check or shared-secret query param is cheap;
CEF :9000 cannot be closed without rebuilding SP.

### 3.7 Misc limits

- **Audio autoplay**: `AudioContext` unlock on user gesture is required in the dashboard
  (`session.ts:348-355`); the in-game page has no gesture. Whether SP's CEF passes
  autoplay-friendly flags is **UNVERIFIED** (no `autoplay_policy` found in
  `MyChromiumApp.cpp`). Must be validated in the first hour of a spike (prior research §6
  flags the same). Mitigation if blocked: route audio as `Sound` forms (impossible for
  TTS) or accept a focus-click to unlock.
- **CEF frame pacing** is fixed at 60 fps windowless (`MyChromiumApp.cpp:146`); the
  overlay surface is **full game resolution** (view rect tracks the swap chain,
  `DX11RenderHandler.cpp:197-203,240-279`) — there is no small-overlay mode without
  engine changes.
- **Dual delivery risk**: if the HTTP polling loop stays enabled while the WS path also
  delivers actions, actions can double-execute (two transports, no dedup). The app today
  has no `/api/actions` route at all (correction 3), so the poll loop is inert — but
  leaving dead polling enabled just burns an HTTP request per second against a 404.

---

## 4. Resource cost estimates

Legend: **[V]** = verified from source, **[E]** = ESTIMATE (reasoned), **[U]** = UNVERIFIED.

### CPU

| Item | Cost | Basis |
|---|---|---|
| Game-thread cost of one `executeJavaScript` | Napi string extract + `std::string` copy + CEF IPC post — microseconds, no parse/eval on game thread | [V] `BrowserApiTilted.cpp:88-93`, `MyChromiumApp.cpp:272-278` — parse happens in render process |
| Game-thread cost of one `browserMessage` | 1 frame of queueing + recursive CefValue→Napi conversion of the args tree + callback dispatch. For a ~200 B action: negligible (<0.1 ms) | [V] mechanics (`main.cpp:484-498`, `SkyrimPlatform.cpp:411-432`); magnitude [E] |
| Render-process cost per state injection (~1-4 KB) | V8 parse+compile+eval of the wrapper + `JSON.parse` in the handler: well under 1 ms | [E] standard V8 behavior; sizes from `serializer.ts` [V] |
| CEF render process (`SkyrimPlatformCEF.exe`), idle/static page | Near-zero paint (CEF paints only on invalidation in windowless mode at ≤60 fps) — small constant for compositor/message loops | [U] — CEF behavior is standard but not locally verifiable |
| CEF render process, animating overlay (narration fade, spinner) | Full-view repaints up to 60 Hz; each `OnPaint` does `Map(WRITE_DISCARD)` + `memcpy(w*h*4)` = **8.3 MB/frame @1080p** → up to ~500 MB/s memory traffic at 60 Hz, plus GPU texture upload + sprite blend per game frame | [V] mechanics `DX11RenderHandler.cpp:205-238`, size math [E]; frame rate [V] `MyChromiumApp.cpp:146`; actual Hz depends on page invalidation [U] |
| Anecdotal ceiling | "SkyimPlatformCEF.exe eats ~30% of CPU" — dev comment about a *broken* state (context-release bug), not steady state; treat as evidence CEF can spike, not as a baseline | [V] comment `OverlayRenderProcessHandler.cpp:34`, interpretation [E] |

**FPS impact**: game-thread marshaling work is tiny at skyguide rates (≤ a few hundred
µs/frame worst case [E]); the real FPS risk is the full-resolution texture blit when the
page animates while visible (§4 row 5) — a *static* narration page that only changes on
state pushes (~1-2 Hz) repaints rarely and should be near-free [E]. When
`setVisible(false)` the sprite draw is skipped (`DX11RenderHandler.cpp:60`), but CEF
compositing of an animating page continues [U/E] — hide or freeze the page (CSS
`animation-play-state`/RAF gating) when it shouldn't be seen.

### RAM

| Item | Cost | Basis |
|---|---|---|
| D3D11 dynamic texture | `width*height*4` = **8.3 MB @1920×1080** (+ srv) | [V] `DX11RenderHandler.cpp:281-297`; resolution = swap chain [V] |
| CEF processes (browser + render + gpu) for one page | **ESTIMATE 150-400 MB** committed total for a Chromium with one simple page; typical floor ~100-150 MB, grows with page weight (Vue app bundle, audio buffers) | [E] — general CEF knowledge; nothing in the vendored tree measures it [U]. The dashboard's decodeAudioData queue (`session.ts:173-211`) buffers whole audio clips page-side — budget ~0.2-1 MB per queued TTS clip [E] |
| Page JS heap (companion Vue app + WS buffers) | **ESTIMATE 20-80 MB** | [E] |
| Plugin-side delta vs HTTP path | ~0 (state string construction identical; drops httplib request objects) | [E] |

### Latency budget (action round-trip, Path A vs today)

| Hop | Path A | HTTP polling (current) |
|---|---|---|
| App decision → client delivery | WS push, ~0-5 ms [E] | poll interval 1000 ms [V] `config.ts:13` |
| Page → plugin | `sendMessage` IPC + next-frame tick drain ≈ **1 frame (≤16.7 ms @60 fps)** [E, mechanics V] | n/a |
| Total worst case (decision → executor) | **~20-40 ms** [E] | **up to ~1 s + backoff up to 30 s on failures** [V] `polling.ts:63-74` |
| State (plugin → engine) | serialize → inject → page → WS: ~1 frame + ~ms [E] | httplib POST + pool(3) queueing [V pool size] |

---

## 5. Failure modes & mitigations

1. **Page not loaded / blank / crashed before handshake → silent injection drops.**
   Verified mechanism (§1.2 `IsReady` gate, §3.4). Mitigations: (a) page sends
   `sendMessage('companion-ready')` on boot (skymp5 precedent
   `skymp5-front/src/index.js:41-43` + `browserService.ts:58-64`); (b) plugin buffers the
   latest state and (re)injects only after the handshake; (c) watchdog: if no
   `browserMessage` heartbeat for N seconds, re-issue `loadUrl` (and remember the
   mouse-move+1 s load quirk, §1.2.5); (d) render critical notifications via
   `Debug.notification` (`src/actions/executor.ts:283-287` already uses it) as a
   page-independent fallback.
2. **WS drop / reconnect storm (page side).** The engine tolerates churn (per-peer
   try/catch in broadcast, `engine.ts:93-102`; replay on register, `engine.ts:518-534`),
   but a tight reconnect loop hammers the app and logs spew. Mitigation: standard
   exponential backoff with jitter in the page; a `heartbeat` message type so the plugin
   can distinguish "app down" from "page dead".
3. **executeJavaScript injection errors.** A syntax error in the wrapper (escaping bug,
   §3.2) fails *silently* on the plugin side — there is no error channel for injections;
   the only visibility is the page's console (and SP's `consoleMessage` event, typings
   `index.d.ts:264-266`). Mitigations: double-`JSON.stringify` wrapper generated by one
   helper (never hand-built); page-side `window.onerror` → `sendMessage('js-error', …)`
   back-channel; monitor `consoleMessage` in debug builds.
4. **Game-side handler exceptions.** Contained by `EventsApi` (`EventsApi.cpp:57-70`) but
   degrade performance if persistent. Mitigations: keep `executeAction`'s per-action
   try/catch (`src/actions/executor.ts:118-127`), validate with `parseAction` first
   (`src/actions/parser.ts:47-134` — it already rejects malformed shapes), rate-limit
   actions page-side (e.g. max N/sec per type).
5. **CEF crash / renderer hang.** The overlay process is separate
   (`main.cpp:446-447`); a render crash blanks the page (and historically the dev
   comments around `OnContextReleased` show fragility, `OverlayRenderProcessHandler.cpp:27-40`).
   Recovery is *game restart* in the worst case — SP has no `browser.restart()` API [V,
   absent from `BrowserApi.cpp` registration]. Mitigation: heartbeat + user-visible
   status; degrade to HTTP `/api/game-state` POST (which exists, `game-state.post.ts`)
   as a fallback transport — Path A can *layer* on the current HTTP state push rather
   than replace it, at the cost of dual code paths.
6. **Focus trap / input black hole.** If `setFocused(true)` is left on when a vanilla
   menu opens, keys go to CEF and the player is stuck (mechanics §3.5). Mitigation:
   never focus for display-only skyguide; if interactive, copy skymp5's menu-open
   unfocus + Escape handling (`browserService.ts:33-51,66-85`).
7. **Hot reload desync** (§3.4): plugin reload loses handlers while page keeps WS;
   page reload loses WS while plugin keeps injecting. Mitigations: handshake includes a
   monotonic session id from `storage` (survives reload, prior research §2); page
   re-requests a full state snapshot on `companion-ready`.
8. **Dual-delivery of actions** if HTTP polling and WS-page both active (§3.7). The app
   currently has no `/api/actions` route [V], so today it's moot; if one is added later,
   add action ids and dedup in the plugin, or gate by config
   (`CONFIG.pollingEnabled`, `src/config.ts:16`).

---

## 6. Suitability matrix — skyguide features under Path A

| Feature | Page-side (CEF) | Plugin-side (SP JS) | Fit & notes |
|---|---|---|---|
| **Narration display** (description broadcasts) | ✅ renders text/CSS in overlay; receives `description` via WS (`engine.ts:171-179`) | — | **Excellent.** Static text = rare repaints (cheap, §4). Fallback: `Debug.notification`. |
| **TTS audio playback** | ✅ `AudioContext` + base64 decode — code already exists in the app (`session.ts:173-211`) | ❌ no audio API (prior research §7.2) | **Good, with one blocker:** autoplay/unlock in gesture-less CEF is **UNVERIFIED** — validate first (§3.7). Also caps clip queue RAM (§4). |
| **World labels / markers** | ✅ draw in overlay if given screen coords | ⚠️ must compute `worldPointToScreenPoint` per frame and inject at ≥10-20 Hz for stable anchoring | **Mixed.** Per-frame coordinate injection is the heaviest plausible use of this bridge (60 injections/s × small payload — mechanically fine [V mechanics], cost mostly render-process [E], but you'd be fighting the 500 ms mindset; alternatively use SP sprite texts, prior research §6 tier 2, which need no page round-trip). |
| **Action execution** | 🔄 receives `actions` broadcast (`engine.ts:181-184`), forwards via `sendMessage` | ✅ `browserMessage` handler → `parseAction` → `executeAction` (`src/actions/executor.ts`) — all guards remain valid (§1.3) | **Excellent.** Biggest latency win (§4 table). Keep executor untouched. |
| **Voice status UI** (wake/listening) | ✅ `voice_status`/`voice_question` broadcasts (`engine.ts:683-717`) | — | **Excellent.** Pure display. |
| **Mic capture (STT upload)** | ⚠️ desktop dashboard does it (`voice.ts`); in-game CEF `getUserMedia` mic — **UNVERIFIED** in SP's windowless CEF (and focus/permission UI issues) | ❌ no mic API | **Keep on the desktop page.** The engine accepts `audio_chunk` from any peer (`_ws.ts:106-116`). |
| **Clip (video) capture** | ⚠️ desktop only — `getDisplayMedia` in windowless CEF **UNVERIFIED/implausible** (§3.3) | ❌ no binary, no screen access | **Keep on the desktop page** (`session.ts:348-372`). Path A changes nothing here. |
| **Game-state telemetry** | 🔄 page forwards plugin-pushed JSON to WS (needs a new WS command — `_ws.ts` has none today, §1.5) | ✅ collectors + priority arbitration unchanged | **Good.** Either extend `_ws.ts` with a `game_state` command or keep `POST /api/game-state` (exists, protocol-matched). |

---

## 7. Verdict

**Choose Path A when:**
- the skyguide in-game experience should be **visible** (narration, labels, status) or
  **audible** (TTS) — the page is simultaneously the transport and the only viable
  audio/AV outlet in the SP world;
- you want **push-based actions** (~tens of ms decision→executor) without shipping any
  new native component — everything is already installed: the CEF browser ships with SP
  (`MyChromiumApp.cpp`), the app already speaks WS with pages, skymp5 proves the exact
  plugin↔page pattern in production (`browserService.ts` + `skymp5-front`);
- the machine model is "one gamer's PC, app on localhost" — Path A is inherently
  local-first and keeps working with the dashboard as a second WS peer.

**Avoid / de-scope Path A when:** you need plugin-bound binary or high-frequency
streams (impossible, §3.3), or you cannot afford the CEF process overhead (§4) — then a
thin local HTTP/file bridge (current `POST /api/game-state`, or the file connector the
app already has: `skydive-app/server/utils/skyrim-file-connector.ts`) is the lighter
primitive, accepting polling latency.

**Recommended shape if adopted:** layer it — keep `POST /api/game-state` for state
ingest (zero app changes, protocol already matched), and use the bridge primarily for
(app → page → plugin) action delivery and (plugin → page) display/audio, deleting the
dangling `/api/actions` poll loop (`src/actions/polling.ts`) or gating it off via
`CONFIG.pollingEnabled`.

**Top 3 risks & mitigations:**

1. **Silent injection drops + escaping bugs** (lifecycle §1.2, §3.2, §5.1-5.3).
   Mitigation: one generated double-`JSON.stringify` wrapper helper; explicit
   `companion-ready` handshake with buffered state (copy the skymp5 `front-loaded`
   pattern); heartbeat watchdog with `loadUrl` re-issue; page-side `onerror` back-channel.
2. **CEF audio autoplay blocked / audio routing broken in-game** (§3.6/§3.7 — flagged
   UNVERIFIED by this and prior research §6). Mitigation: **spike it first** — load a
   test page that plays a data-URI WAV in the in-game browser before committing the
   architecture; fallbacks: notification-only mode (`Debug.notification`), or TTS played
   by the *desktop* page while the in-game page shows text.
3. **Local attack surface without a token** (§1.4: no `getToken` in runtime, unauth `/_ws`,
   DevTools on :9000 always on). Mitigation: treat the channel as untrusted — keep
   `parseAction`'s whitelist (`src/actions/parser.ts:6-29`), add per-action rate limits
   and a max-magnitude clamp on `move` coordinates; add a shared-secret query param on
   `/_ws` and an `Origin` check for cheap defense-in-depth; document that :9000 exposure
   is inherent to the vendored SP build.

---

### Source index (primary citations)

- Plugin: `src/index.ts` (500 ms update gate :161-177; events :179-205), `src/config.ts`
  (:8-17), `src/communication/http-client.ts` (rate limit :5, cooldown :68-75),
  `src/actions/polling.ts` (:19-83 backoff), `src/actions/executor.ts` (:146-301 guards),
  `src/actions/parser.ts`, `src/game-state/{collector,serializer,types}.ts`,
  `src/arbitration/priority.ts` (:13-19 rate limits).
- SP runtime (vendored, v2.9.0 = npm typings version, verified in both package.json):
  `skymp/skyrim-platform/src/platform_se/skyrim_platform/BrowserApi.cpp` (backend
  selection :6-37; registrations :88-121 — **no getToken**),
  `BrowserApiTilted.cpp` (:44-75 focus/CursorMenu, :88-93),
  `BrowserApiNirnLab.cpp` (:75-91 jsExecQueue, :143-164 sendMessage→ParseJson),
  `SkyrimPlatform.cpp` (:372 task queues, :411-432 JsTick/AddTickTask),
  `main.cpp` (:72-87 per-frame JsTick, :389-415 input, :446-447 CEF subprocess,
  :462-498 browserMessage marshaling, :500-542 CefValue→Napi incl. binary→undefined),
  `tilted/ui/MyChromiumApp.cpp` (:86-97 CEF settings incl. :9000, :123-124 subprocess,
  :144-156 creation, :224-242 loadUrl-in-mouse-move, :272-278 ExecuteJavaScript),
  `tilted/ui/OverlayClient.cpp` (:105-121, :123-126 IsReady),
  `tilted/ui/DX11RenderHandler.cpp` (:60-67 visible-draw, :197-203 view rect,
  :205-238 OnPaint memcpy, :240-279 resolution sync),
  `tilted/ui_process/ProcessHandler.cpp` (:8-18 sendMessage registration),
  `tilted/ui_process/OverlayRenderProcessHandler.cpp` (:11-25 skyrimPlatform object,
  :27-40 30% CPU comment),
  `tilted/ui_process/OverlayV8Handler.cpp` (:26-48 dispatch, :50-104 serialization),
  `platform_se/skyrim_platform/EventsApi.cpp` (:30-71 send/exception containment),
  `NapiHelper.h` (:250-262 ParseJson), `MyLoadHandler.h` (:16-22 OnLoadEnd/IsReady).
- Docs: `skymp/docs/skyrim_platform/browser.md` (:23 mouse-move load caveat, :32-47
  executeJavaScript/sendMessage) — note :35-38 token section is stale vs runtime.
- Production precedent: `skymp/skymp5-client/src/services/services/browserService.ts`
  (:9-10 focus events, :26-52 key handling, :58-64 front-loaded handshake, :93-109 bad
  menus), `skymp/skymp5-front/src/index.js` (:13-16 skyrimPlatform guard, :41-43
  front-loaded).
- App: `skydive-app/server/routes/_ws.ts` (route=/_ws; :13-40 binary frames; :42-45 no
  auth), `skydive-app/server/utils/engine.ts` (:93-102 broadcast, :352-423 clip worker,
  :518-534 register/replay, :658-725 STT, :727-779 game state/urgency),
  `skydive-app/server/api/game-state.post.ts` (protocolVersion 1),
  `skydive-app/src/stores/session.ts` (:71-85, :173-211, :333-372, :428-437 WS/audio/capture).
- Prior research: `docs/research/skyrim-platform-capabilities.md` §2 (runtime), §3
  (transports), §6 (browser tier), §7 (gaps) — all consistent with this deeper pass.
