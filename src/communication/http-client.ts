import { HttpClient } from "skyrimPlatform";
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

  constructor(baseUrl: string) {
    this.client = new HttpClient(baseUrl);
  }

  async sendGameState(payload: string): Promise<boolean> {
    resetRateLimit();

    if (sendCount >= MAX_SENDS_PER_SEC) {
      if (CONFIG.debugMode) {
        console.log("Rate limit exceeded");
      }
      return false;
    }

    try {
      const response = await this.client.post("/api/game-state", {
        body: payload,
        contentType: "application/json"
      });

      sendCount++;

      if (response.status >= 200 && response.status < 300) {
        this.failureCount = 0;
        return true;
      } else {
        this.failureCount++;
        return false;
      }
    } catch {
      this.failureCount++;
      return false;
    }
  }

  isConnected(): boolean {
    return this.failureCount < this.maxFailures;
  }
}

export const httpClient = new SkyGuideHttpClient(CONFIG.serverUrl);

export async function sendGameState(payload: string): Promise<boolean> {
  return httpClient.sendGameState(payload);
}

export function isConnected(): boolean {
  return httpClient.isConnected();
}
