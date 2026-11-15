import {
  browser,
  BrowserMessageEvent,
  MenuCloseEvent,
  MenuOpenEvent,
  on,
  printConsole,
  Ui,
} from "./skyrimPlatform";
import { CONFIG } from "./config";
import { parseAction } from "./actions/parser";
import { executeAction } from "./actions/executor";
import { setGameInterval } from "./timers";

/**
 * Companion browser bridge (converged design from docs/research/
 * brainstorm-pathA-bridge.md and brainstorm-pathB-direct-ws.md):
 *
 *  - The in-game CEF page (loaded from the companion app) owns the WebSocket
 *    to the app — the plugin NEVER touches WebSockets (SP JS has none).
 *  - The plugin receives page intents via `browserMessage`
 *    (page calls `window.skyrimPlatform.sendMessage(...)`).
 *  - The plugin pushes only RARE events into the page via
 *    `browser.executeJavaScript` — never per-tick state (the engine already
 *    broadcasts gameState to WS peers; the page reads it from there).
 *  - `companion-ready` handshake + heartbeat: `executeJavaScript` injections
 *    are silently dropped before the page's first load-end (verified in
 *    BrowserApiTilted.cpp — no queue), so nothing is pushed until ready.
 */

/** Menus during which the overlay is hidden (browserService.ts bad-menu list). */
const BAD_MENUS = [
  "Loading Menu",
  "Main Menu",
  "Console",
  "TweenMenu",
  "RaceSex Menu",
  " crafting ", // matches Crafting/Smithing/Enchanting menus
];

const HEARTBEAT_TIMEOUT_MS = 15000;
const WATCHDOG_INTERVAL_MS = 5000;
const MAX_TRACKED_ACTION_IDS = 64;

type InjectedMessage =
  | { type: "hello"; bridgeVersion: number; gameReady: boolean }
  | { type: "game-event"; event: string }
  | { type: "action-result"; id?: string; ok: boolean };

let bridgeActive = false;
let companionReady = false;
let lastHeartbeatAt = 0;
let overlayVisible = false;
const recentActionIds: string[] = [];

function logBridge(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[SkyGuide][bridge] ${message}`);
  }
}

/**
 * Serialize-then-embed-in-source. `executeJavaScript` takes SOURCE CODE, not
 * data (MyChromiumApp.cpp:272-278) — a raw JSON interpolation of game strings
 * (actor names are modder-controlled data) would break the injection or
 * execute arbitrary JS in the page. Hence the double `JSON.stringify`.
 * Injections before the page is loaded are silently dropped on the Tilted
 * backend — callers must only inject after `companionReady`.
 */
function injectMessage(message: InjectedMessage): boolean {
  if (!companionReady) {
    logBridge("inject skipped: page not ready yet");
    return false;
  }
  try {
    const payload = JSON.stringify(JSON.stringify(message));
    browser.executeJavaScript(`window.__skyguideReceive(${payload})`);
    return true;
  } catch (err) {
    logBridge(`inject failed: ${String(err)}`);
    return false;
  }
}

function rememberActionId(id: string | undefined): boolean {
  if (!id) return true; // untracked actions always run (HTTP parity)
  if (recentActionIds.includes(id)) {
    logBridge(`duplicate action id ignored: ${id}`);
    return false;
  }
  recentActionIds.push(id);
  if (recentActionIds.length > MAX_TRACKED_ACTION_IDS) {
    recentActionIds.shift();
  }
  return true;
}

function handleActionArgument(raw: unknown): void {
  // Page may send the action as an object or as a JSON string — accept both.
  let candidate = raw;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      logBridge("bridge action rejected: non-JSON string payload");
      injectMessage({ type: "action-result", ok: false });
      return;
    }
  }

  const action = parseAction(candidate);
  if (!action) {
    logBridge(`bridge action rejected: ${JSON.stringify(candidate)}`);
    injectMessage({ type: "action-result", ok: false });
    return;
  }

  const id = (candidate as { id?: unknown }).id;
  const actionId = typeof id === "string" ? id : undefined;
  if (!rememberActionId(actionId)) return;

  const ok = executeAction(action);
  injectMessage({ type: "action-result", id: actionId, ok });
  if (CONFIG.debugMode) {
    printConsole(`[SkyGuide][bridge] action ${action.type}: ${ok ? "ok" : "failed"}`);
  }
}

function isBadMenuOpen(): boolean {
  for (const menu of BAD_MENUS) {
    try {
      if (Ui.isMenuOpen(menu)) return true;
    } catch {
      // Menu name not recognized by this build — treat as open to stay hidden.
      return menu === "Loading Menu";
    }
  }
  return false;
}

function refreshOverlayVisibility(): void {
  if (!bridgeActive) return;
  const shouldShow = companionReady && !isBadMenuOpen();
  if (shouldShow === overlayVisible) return;
  try {
    browser.setVisible(shouldShow);
    overlayVisible = shouldShow;
    logBridge(`overlay ${shouldShow ? "visible" : "hidden"}`);
  } catch (err) {
    logBridge(`setVisible failed: ${String(err)}`);
  }
}

function handleBrowserMessage(event: BrowserMessageEvent): void {
  const args = event.arguments;
  const kind = args[0];

  switch (kind) {
    case "companion-ready": {
      companionReady = true;
      lastHeartbeatAt = Date.now();
      refreshOverlayVisibility();
      injectMessage({ type: "hello", bridgeVersion: 1, gameReady: true });
      logBridge("companion page ready");
      return;
    }
    case "heartbeat": {
      lastHeartbeatAt = Date.now();
      return;
    }
    case "action": {
      handleActionArgument(args[1]);
      return;
    }
    case "spike-result": {
      // CEF media spike reporting (see spike/cef-media-spike/).
      printConsole(
        `[SkyGuide][spike] ${String(args[1])} = ${String(args[2])}`,
      );
      return;
    }
    case "companion-log": {
      logBridge(`page: ${String(args[1])}`);
      return;
    }
    default:
      logBridge(`unknown page message: ${String(kind)}`);
  }
}

function onMenuOpen(_event: MenuOpenEvent): void {
  refreshOverlayVisibility();
}

function onMenuClose(_event: MenuCloseEvent): void {
  refreshOverlayVisibility();
}

export function initBridge(): void {
  if (bridgeActive) return;
  bridgeActive = true;

  // Page -> plugin channel. Works for ANY loaded page (spike page included) —
  // the handler is registered here even when bridge URL loading is disabled.
  on("browserMessage", handleBrowserMessage);

  if (CONFIG.bridgeEnabled && CONFIG.companionUrl) {
    try {
      browser.loadUrl(CONFIG.companionUrl);
      printConsole(`[SkyGuide] companion page: ${CONFIG.companionUrl}`);
      printConsole("[SkyGuide] note: the URL loads after the first mouse move (CEF behavior)");
    } catch (err) {
      printConsole(`[SkyGuide] browser.loadUrl failed: ${String(err)}`);
    }
  }

  // Hide the overlay during bad menus; re-show after.
  on("menuOpen", onMenuOpen);
  on("menuClose", onMenuClose);

  // Heartbeat watchdog: page must pulse; on staleness we drop to hidden and
  // stop injecting (avoids talking into a dead/crashed renderer).
  setGameInterval(() => {
    if (!companionReady) return;
    if (Date.now() - lastHeartbeatAt > HEARTBEAT_TIMEOUT_MS) {
      companionReady = false;
      refreshOverlayVisibility();
      logBridge("companion stale (no heartbeat) — bridge paused");
    }
  }, WATCHDOG_INTERVAL_MS);

  logBridge("bridge initialized");
}

export function isCompanionReady(): boolean {
  return companionReady;
}

export function heartbeatAgeMs(): number | null {
  if (!companionReady) return null;
  return Date.now() - lastHeartbeatAt;
}

export function isOverlayVisible(): boolean {
  return overlayVisible;
}

/** Manual escape hatch for dev interactivity (F6 also toggles focus in-game). */
export function setCompanionFocused(focused: boolean): void {
  try {
    browser.setFocused(focused);
  } catch (err) {
    logBridge(`setFocused failed: ${String(err)}`);
  }
}
