# CEF media spike — what works in the in-game browser?

One-page probe for the make-or-break unknowns flagged in
`docs/research/brainstorm-pathA-bridge.md` and `brainstorm-pathB-direct-ws.md`
(audio autoplay without a user gesture, mic capture, screen capture, app
WebSocket reachability, Chromium feature floor).

## Run it

1. Build the plugin (`npm run dev` or `npm run webpack:deploy`) so `skyguide-plugin.js`
   is in `Data/Platform/PluginsDev/`.
2. **Back up** your current `Data/Platform/UI/index.html` (if any), then copy
   this spike page over it:
   ```
   spike/cef-media-spike/index.html  →  [Skyrim]\Data\Platform\UI\index.html
   ```
   SP loads this page automatically at browser creation (no mouse-move needed —
   that caveat only applies to `browser.loadUrl` with a *new* URL).
3. Launch Skyrim, wait for `SkyGuide plugin loaded!` in the `~` console.
4. Open the `~` console and read the `[SkyGuide][spike] name = value` lines.
   (The page also reports via `window.skyrimPlatform.sendMessage → browserMessage`,
   so this validates the page→plugin channel end-to-end at the same time.)

## What to look for

| Probe | Green means | Red means |
|---|---|---|
| `handshake` | plugin `browserMessage` channel works | page→plugin bridge broken |
| `audio.autoplay.webaudio` | WebAudio plays **without any click** — TTS pipeline is viable in-game | need a gesture/focus workaround; TTS must stay on the desktop page |
| `audio.autoplay.element` | `<audio>` autoplay works | same as above |
| `mic.getUserMedia` | voice questions could be captured in-game | voice input stays on the desktop dashboard |
| `screen.getDisplayMedia` | (presence only — not invoked) | clip capture stays on the desktop page (expected) |
| `ws.app.connect` | the page can reach the app's `/_ws` engine directly (app must be running) | WS reachability issue in CEF |
| `es.*` | modern features available for the companion page | companion page must target an old Chromium |

`webm/opus recording`: needed if the page itself should encode mic audio for the
`audio_chunk` binary frames (`server/routes/_ws.ts` mime table).

## Notes

- `screen.getDisplayMedia` is deliberately **not invoked**: in a windowless CEF
  the screen-picker may hang the render process. If you want to test the call,
  add a button and click it — expect a picker that never shows.
- To test focus/interactivity: the SP browser has a hardcoded **F6** focus
  toggle (input goes to the page while focused).
- Restore your original `Data/Platform/UI/index.html` afterwards.
- Record the results in this file (or paste them in the session) so the
  Path A/B decision is grounded.

## Results

_(paste `[SkyGuide][spike]` console output here after running in-game)_
