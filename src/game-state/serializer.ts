import type { CollectedState, EventType, NavigationState } from "./types";
import type { UiState } from "./menu-state";
import type { MenuFocusState } from "./menu-focus-core";

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
  /** Protocol-v1 additive extensions — absent on old plugins. */
  headingAngleZ?: number;
  isStuck?: boolean;
  stuckRelDeg?: number;
  navigation?: NavigationState;
  ui?: UiState;
  menu?: MenuFocusState;
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
 * The extra `data` fields (headingAngleZ, isStuck, navigation, ui) are
 * protocol-v1 ADDITIVE extensions — `game-state.post.ts` validates only the
 * envelope, and the app tolerates absent fields (old plugins keep working;
 * JSON.stringify drops undefined).
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
      eventType: normalizeEventType(state.eventType),
      headingAngleZ: state.headingAngleZ,
      isStuck: state.isStuck ?? false,
      stuckRelDeg: state.stuckRelDeg,
      navigation: state.navigation ?? { status: "idle" },
      ui: state.ui ?? { menuOpen: false, consoleOpen: false },
      menu: state.menu,
    },
    timestamp: Date.now()
  };
  return JSON.stringify(payload);
}
