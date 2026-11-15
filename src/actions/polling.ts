import * as SkT from '@skyrim-platform/skyrim-platform'
import { CONFIG } from "../config";
import { parseAction } from "./parser";
import { executeAction } from "./executor";
import { clearGameTimeout, setGameTimeout } from "../timers";

const INITIAL_BACKOFF_MS: number = CONFIG.pollingInterval;
let pollingClient: SkT.HttpClient | null = null;
let backoffMs = INITIAL_BACKOFF_MS;
let consecutiveFailures = 0;
let pollingActive = false;
let pollTimerId: number | null = null;
/** Outbox cursor — highest action id we have pulled from the server. */
let lastSeenId = 0;

function logDebug(message: string): void {
  if (CONFIG.debugMode) {
    SkT.printConsole(`[SkyGuide] ${message}`);
  }
}

async function pollForActions(): Promise<void> {
  if (!pollingClient || !pollingActive) return;

  if (SkT.Ui.isMenuOpen("Loading Menu")) {
    logDebug("Loading screen open — skipping action poll");
    scheduleNextPoll();
    return;
  }

  // at-most-once delivery: the server only returns actions newer than the
  // highest id we have executed.
  const endpoint = `${CONFIG.pollingEndpoint}?since=${lastSeenId}`;

  try {
    const response = await pollingClient.get(endpoint);

    if (response.status === 200) {
      consecutiveFailures = 0;
      backoffMs = INITIAL_BACKOFF_MS;

      let parsed: unknown;
      try {
        parsed = JSON.parse(response.body) as unknown;
      } catch {
        logDebug("Failed to parse action response body as JSON");
        scheduleNextPoll();
        return;
      }

      const actions: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

      for (const raw of actions) {
        // Track the outbox cursor before executing — each entry carries a
        // monotonic id; unknown types still advance it.
        if (typeof raw === "object" && raw !== null) {
          const id = (raw as { id?: unknown }).id;
          if (typeof id === "number" && Number.isFinite(id) && id > lastSeenId) {
            lastSeenId = id;
          }
        }
        const action = parseAction(raw);
        if (action !== null) {
          executeAction(action);
        }
      }
    } else {
      handleFailure(`HTTP ${response.status}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    handleFailure(msg);
  }

  scheduleNextPoll();
}

function handleFailure(reason: string): void {
  consecutiveFailures++;
  logDebug(`Poll failed (${consecutiveFailures}/${CONFIG.maxPollingRetries}): ${reason}`);

  if (consecutiveFailures >= CONFIG.maxPollingRetries) {
    logDebug(`Max retries reached — pausing for ${CONFIG.pollingMaxBackoff}ms`);
    backoffMs = CONFIG.pollingMaxBackoff;
    consecutiveFailures = 0;
  } else {
    backoffMs = Math.min(backoffMs * 2, CONFIG.pollingMaxBackoff);
  }
}

function scheduleNextPoll(): void {
  if (!pollingActive) return;

  pollTimerId = setGameTimeout(() => {
    pollTimerId = null;
    pollForActions();
  }, backoffMs);
}

export function startPolling(): void {
  if (!CONFIG.pollingEnabled) {
    logDebug("Polling disabled by config");
    return;
  }

  if (pollingActive) {
    logDebug("Polling already active");
    return;
  }

  pollingClient = new SkT.HttpClient(CONFIG.serverUrl);
  pollingActive = true;
  backoffMs = INITIAL_BACKOFF_MS;
  consecutiveFailures = 0;

  logDebug("Starting action polling");
  SkT.once("update", () => {
    pollForActions();
  });
}

export function stopPolling(): void {
  pollingActive = false;

  if (pollTimerId !== null) {
    clearGameTimeout(pollTimerId);
    pollTimerId = null;
  }

  pollingClient = null;
  logDebug("Action polling stopped");
}
