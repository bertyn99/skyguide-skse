export type EventType = "tick" | "hit" | "combatState" | `combatState_${number}`;

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface PlayerState {
  health: number;
  maxHealth: number;
  magicka: number;
  stamina: number;
  level: number;
  position: Position;
  isSneaking: boolean;
  isDead: boolean;
}

export interface EnemyState {
  formId: number;
  name: string;
  distance: number;
  health: number;
  level: number;
}

export interface CollectedState {
  player: PlayerState;
  combatState: number;
  enemies: EnemyState[];
  playerAnimation: string;
  eventType: EventType;
}
