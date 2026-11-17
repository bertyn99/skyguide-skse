// @env node
// NOTE: For production, consider reading from Skyrim Platform settings:
//   import { settings } from "skyrimPlatform";
//   const debugMode = settings["skyguide"]?.["debugMode"] === "true";
export const PLAYER_FORM_ID = 0x14;

export const CONFIG = {
  serverUrl: "http://localhost:3000",
  tickInterval: 500,
  enemyScanRadius: 5000,
  maxEnemies: 10,
  debugMode: true,
  // HTTP action polling: GET /api/actions?since=<lastId> — the server keeps
  // an in-memory outbox of pipeline actions (composer suggestions, question
  // answers), pruned after 15s. Each action carries a monotonic id; we send
  // ?since= for at-most-once delivery. Enabled 2026-11-15 alongside the
  // server-side endpoint.
  pollingInterval: 1000,
  pollingEndpoint: "/api/actions",
  pollingMaxBackoff: 30000,
  pollingEnabled: true,
  maxPollingRetries: 5,
  // Companion browser bridge (see src/bridge.ts). The page is served by the
  // companion app; `bridgeEnabled` only controls whether we load the URL —
  // the browserMessage handler is registered regardless (spike page support).
  bridgeEnabled: false,
  companionUrl: "http://localhost:3000/companion",
  // Parallel-array dump for the app's SkyrimFileConnector / parseSkyrimState
  // (Gate + Composer mod context). Path is relative to Skyrim's CWD unless
  // absolute — set SKYRIM_CONTEXT_FILE_PATH on the app to the same file.
  modContextDumpEnabled: true,
  modContextPath: "Data/Platform/SkyGuide/state.json",
  // World object scanner (docs/ACCESSIBILITY-PORT.md §5.1). Sweep is
  // budgeted across update ticks; cache dies after ~100 units of movement
  // or a cell change (their RESCAN_DISTANCE).
  scannerEnabled: true,
  scanRescanDistance: 100,
  scanMaxOutput: 64,
  scanProbeBudget: 96,
  scanMaxCells: 4,
  scanRadiusUnits: 2500,
  // Autowalk bridge (W6). The ESP announces itself via SkyGuide_AutoWalkReady
  // (sender = quest) at OnInit and after every save load — no form-ID
  // hardcoding. Until the Ready announce arrives autowalkTo fails cleanly.
  autowalkEnabled: true,
  autowalkAckTimeoutMs: 2000,
  autowalkStopDistance: 100,
  // Menu-focus narration (ItemMenu family via Ui.getString). Disabled
  // automatically when Skyrim Access is installed. 100ms matches their poll.
  menuNarrationEnabled: true,
  menuFocusInterval: 100,
  inventoryDumpMax: 48,
} as const;
