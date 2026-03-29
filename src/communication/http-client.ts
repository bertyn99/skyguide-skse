import { HttpClient, printConsole } from "../skyrimPlatform";
import { CONFIG } from "../config";

const MAX_SENDS_PER_SEC = 5;
let sendCount = 0;
let lastReset = Date.now();

function resetRateLimit(): void {
  const now = Date.now();
  if (now - lastReset >= 1000) {
    sendCount = 0;
    lastReset = now;
  }
}

class SkyGuideHttpClient {
  private client: HttpClient;
  private failureCount = 0;
  private maxFailures = 3;
  private lastFailureTime = 0;
  private cooldownMs = 10000;

  constructor(baseUrl: string) {
    this.client = new HttpClient(baseUrl);
  }

  sendGameState(payload: string): Promise<boolean> {
    resetRateLimit();

    if (sendCount >= MAX_SENDS_PER_SEC) {
      if (CONFIG.debugMode) {
        printConsole("Rate limit exceeded");
      }
      return false;
    }

    return this.client
      .post("/api/game-state", {
        body: payload,
        contentType: "application/json"
      })
      .then((response) => {
        sendCount++;

        if (response.status >= 200 && response.status < 300) {
          this.failureCount = 0;
          return true;
        } else {
          if (CONFIG.debugMode) {
            printConsole(`[SkyGuide] HTTP ${response.status}: request rejected by server`);
          }
          this.lastFailureTime = Date.now();
          this.failureCount++;
          return false;
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (CONFIG.debugMode) {
          printConsole(`[SkyGuide] HTTP POST /api/game-state failed: ${msg}`);
        }
        this.lastFailureTime = Date.now();
        this.failureCount++;
        return false;
      });
  }

  isConnected(): boolean {
    if (this.failureCount < this.maxFailures) return true;
    if (Date.now() - this.lastFailureTime > this.cooldownMs) {
      this.failureCount = this.maxFailures - 1;
      return true;
    }
    return false;
  }
}

export const httpClient = new SkyGuideHttpClient(CONFIG.serverUrl);

export function sendGameState(payload: string): Promise<boolean> {
  return httpClient.sendGameState(payload);
}

export function isConnected(): boolean {
  return httpClient.isConnected();
}
