import { on, printConsole } from "./skyrimPlatform";

/**
 * Game-loop timers (adapted from skymp5-client timersService.ts).
 *
 * The SP runtime exposes the Node `setTimeout` global, but those timers run on
 * the Node loop, which is pumped per game frame and can behave oddly in menus /
 * loading screens. Timers here are driven by `on("update")` instead, so they:
 *  - only run in-game (after a save is loaded) — same trade-off as mp5-client,
 *  - never fire during loading screens (update is suspended there),
 *  - are cleaned up automatically on plugin hot reload (handlers are removed).
 */

type TimerCallback = () => void;

interface GameTimer {
  id: number;
  callback: TimerCallback;
  remainingMs: number;
  intervalMs: number | null;
}

const timers = new Map<number, GameTimer>();
let nextTimerId = 1;
let lastFrameAt = 0;
let pumpInstalled = false;

function pump(): void {
  const now = Date.now();
  const elapsed = lastFrameAt === 0 ? 0 : now - lastFrameAt;
  lastFrameAt = now;

  if (timers.size === 0) return;

  for (const timer of Array.from(timers.values())) {
    timer.remainingMs -= elapsed;
    if (timer.remainingMs > 0) continue;

    if (timer.intervalMs !== null) {
      // Re-arm first so the callback can clear/replace itself safely.
      timer.remainingMs = timer.intervalMs;
      try {
        timer.callback();
      } catch (err) {
        // Never let one timer break the pump; update handlers run every frame.
        printConsole(`[SkyGuide] game-timer callback failed: ${String(err)}`);
      }
      continue;
    }

    timers.delete(timer.id);
    try {
      timer.callback();
    } catch (err) {
      printConsole(`[SkyGuide] game-timer callback failed: ${String(err)}`);
    }
  }
}

function installPump(): void {
  if (pumpInstalled) return;
  pumpInstalled = true;
  on("update", pump);
}

export function setGameTimeout(callback: TimerCallback, timeoutMs: number): number {
  installPump();
  const id = nextTimerId++;
  timers.set(id, {
    id,
    callback,
    remainingMs: Math.max(0, timeoutMs),
    intervalMs: null,
  });
  return id;
}

export function setGameInterval(callback: TimerCallback, intervalMs: number): number {
  installPump();
  const id = nextTimerId++;
  timers.set(id, {
    id,
    callback,
    remainingMs: Math.max(0, intervalMs),
    intervalMs: Math.max(0, intervalMs),
  });
  return id;
}

export function clearGameTimeout(id: number): void {
  timers.delete(id);
}

export function clearGameInterval(id: number): void {
  timers.delete(id);
}
