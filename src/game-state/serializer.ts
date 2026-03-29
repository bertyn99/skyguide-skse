import type { CollectedState, EventType } from "./types";

export type PriorityLevel = "critical" | "high" | "medium" | "low" | "suppressed";

type SkydiveEventType =
  | "tick"
  | "combatState"
  | "deathStart"
  | "deathEnd"
  | "hit"
  | "animation";

type SkydiveEnemyState = CollectedState["enemies"][number] & {
  animation: string;
};

export interface SkydiveGameStateData {
  player: CollectedState["player"];
  combatState: number;
  enemies: SkydiveEnemyState[];
  playerAnimation: string;
  eventType: SkydiveEventType;
}

export interface GameStatePayload {
  protocolVersion: number;
  priority: PriorityLevel;
  source: string;
  data: SkydiveGameStateData;
  timestamp: number;
}

function normalizeEventType(eventType: EventType): SkydiveEventType {
  if (eventType === "hit") return "hit";
  if (eventType === "tick") return "tick";
  if (eventType.startsWith("combatState")) return "combatState";
  return "animation";
}

/**
 * Single outbound payload format: skydive-app protocol.
 */
export function serializeState(state: CollectedState, priority: PriorityLevel): string {
  const payload: GameStatePayload = {
    protocolVersion: 1,
    priority,
    source: "skyguide",
    data: {
      player: state.player,
      combatState: state.combatState,
      enemies: state.enemies.map(enemy => ({
        ...enemy,
        animation: ""
      })),
      playerAnimation: state.playerAnimation,
      eventType: normalizeEventType(state.eventType)
    },
    timestamp: Date.now()
  };
  return JSON.stringify(payload);
}
