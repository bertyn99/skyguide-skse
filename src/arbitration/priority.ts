import type { CollectedState } from "../game-state/types";
import type { PriorityLevel } from "../game-state/serializer";

let lastState: CollectedState | null = null;
const lastSendTimes: Record<PriorityLevel, number> = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
  suppressed: 0
};

const rateLimits: Record<PriorityLevel, number> = {
  critical: 200,
  high: 500,
  medium: 1000,
  low: 2000,
  suppressed: 5000
};

export function isStateUnchanged(newState: CollectedState): boolean {
  if (!lastState) return false;

  if (newState.eventType !== "tick") return false;

  if (newState.combatState !== lastState.combatState) return false;
  if (newState.enemies.length !== lastState.enemies.length) return false;

  const playerChanged =
    newState.player.health !== lastState.player.health ||
    newState.player.position.x !== lastState.player.position.x ||
    newState.player.position.y !== lastState.player.position.y ||
    newState.player.position.z !== lastState.player.position.z ||
    newState.player.isSneaking !== lastState.player.isSneaking;

  return !playerChanged;
}

export function evaluatePriority(state: CollectedState): PriorityLevel {
  if (state.player.isDead) {
    return "critical";
  }

  if (state.player.health < state.player.maxHealth * 0.25) {
    return "critical";
  }

  if (state.eventType === "hit") {
    return "high";
  }

  if (state.combatState === 1) {
    if (state.enemies.length > 0) {
      const closestEnemy = state.enemies.reduce((min, e) =>
        e.distance < min.distance ? e : min
      , state.enemies[0]);

      if (closestEnemy.distance < 500) {
        return "high";
      }
    }
    return "medium";
  }

  if (state.eventType !== "tick") {
    return "medium";
  }

  // Suppress if nothing interesting is happening
  if (lastState && isStateUnchanged(state)) {
    return "suppressed";
  }

  return "low";
}

export function shouldSend(priority: PriorityLevel, state: CollectedState): boolean {
  if (priority === "suppressed") {
    return false;
  }

  const now = Date.now();
  const lastSend = lastSendTimes[priority];
  const minInterval = rateLimits[priority];

  if (now - lastSend < minInterval) {
    return false;
  }

  // Only update state when we're actually going to send
  lastSendTimes[priority] = now;
  lastState = state;

  return true;
}
