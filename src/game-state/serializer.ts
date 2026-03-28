import type { CollectedState } from "./types";

export type PriorityLevel = "critical" | "high" | "medium" | "low" | "suppressed";

export interface GameStatePayload {
  protocolVersion: number;
  priority: PriorityLevel;
  source: string;
  data: CollectedState;
  timestamp: number;
}

export function serializeState(state: CollectedState, priority: PriorityLevel): string {
  const payload: GameStatePayload = {
    protocolVersion: 1,
    priority,
    source: "skyguide",
    data: state,
    timestamp: Date.now()
  };
  return JSON.stringify(payload);
}
