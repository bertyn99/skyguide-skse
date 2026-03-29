import { getOpenMenus } from "../events";
import { collectCrosshairTarget } from "./collectors/crosshair-collector";
import { collectEnvironmentState } from "./collectors/environment-collector";
import { collectInputState } from "./collectors/input-collector";
import { collectLocationState } from "./collectors/location-collector";
import { collectNearbyNpcs } from "./collectors/nearby-collector";
import { collectPlayerFullState } from "./collectors/player-collector";
import { collectQuestState } from "./collectors/quest-collector";
import type { CollectedState, EventType, FullCollectedState, MenuState } from "./types";

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

type FullGameStatePayload = Omit<GameStatePayload, "data"> & {
  data: FullCollectedState;
};

export function serializeFullState(
  eventType: EventType = "tick",
  priority: PriorityLevel = "medium"
): string | null {
  let player: FullCollectedState["player"] = null;
  let nearbyNpcs: FullCollectedState["nearbyNpcs"] = [];
  let crosshairTarget: FullCollectedState["crosshairTarget"] = null;
  let location: FullCollectedState["location"] = null;
  let quest: FullCollectedState["quest"] = null;
  let input: FullCollectedState["input"] = null;
  let environment: FullCollectedState["environment"] = null;
  let menu: MenuState | null = null;

  try {
    player = collectPlayerFullState();
  } catch {
    player = null;
  }

  try {
    nearbyNpcs = collectNearbyNpcs();
  } catch {
    nearbyNpcs = [];
  }

  try {
    crosshairTarget = collectCrosshairTarget();
  } catch {
    crosshairTarget = null;
  }

  try {
    location = collectLocationState();
  } catch {
    location = null;
  }

  try {
    quest = collectQuestState();
  } catch {
    quest = null;
  }

  try {
    input = collectInputState();
  } catch {
    input = null;
  }

  try {
    environment = collectEnvironmentState();
  } catch {
    environment = null;
  }

  try {
    menu = {
      openMenus: Array.from(getOpenMenus())
    };
  } catch {
    menu = null;
  }

  const fullState: FullCollectedState = {
    player,
    nearbyNpcs,
    crosshairTarget,
    location,
    quest,
    input,
    menu,
    environment,
    eventType
  };

  const payload: FullGameStatePayload = {
    protocolVersion: 1,
    priority,
    source: "skyguide",
    data: fullState,
    timestamp: Date.now()
  };

  try {
    return JSON.stringify(payload);
  } catch {
    return null;
  }
}
