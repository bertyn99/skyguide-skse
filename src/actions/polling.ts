import { HttpClient, printConsole, Ui, once } from "../skyrimPlatform";
import { CONFIG } from "../config";
import { parseAction } from "./parser";
import { executeAction } from "./executor";

const INITIAL_BACKOFF_MS = 1000;
let pollingClient: typeof HttpClient | null = null;
let backoffMs = INITIAL_BACKOFF_MS;
let consecutiveFailures = 0;
let pollingActive = false;
let pollTimerId: number | null = null;

function logDebug(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[SkyGuide] ${message}`);
  }
}

async function pollForActions(): Promise<void> {
  if (!pollingClient || !pollingActive) return;

  if (Ui.isMenuOpen("Loading Menu")) {
    logDebug("Loading screen open — skipping action poll");
    scheduleNextPoll();
    return;
  }

  try {
    const response = await pollingClient.get(CONFIG.pollingEndpoint);

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

  pollTimerId = setTimeout(() => {
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

  pollingClient = new HttpClient(CONFIG.serverUrl);
  pollingActive = true;
  backoffMs = INITIAL_BACKOFF_MS;
  consecutiveFailures = 0;

  logDebug("Starting action polling");
  once("update", () => {
    pollForActions();
  });
}

export function stopPolling(): void {
  pollingActive = false;

  if (pollTimerId !== null) {
    clearTimeout(pollTimerId);
    pollTimerId = null;
  }

  pollingClient = null;
  logDebug("Action polling stopped");
}
