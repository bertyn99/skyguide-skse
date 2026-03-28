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

export interface HeadingState {
  angleX: number;
  angleY: number;
  angleZ: number;
  headingAngle: number;
}

export interface EquipmentState {
  weaponName: string | null;
  weaponSlot: number;
  armorSlots: Record<string, string | null>;
  shoutName: string | null;
  spellName: string | null;
}

export interface CombatState {
  isInCombat: boolean;
  combatTargetName: string | null;
  isBlocking: boolean;
  isWeaponDrawn: boolean;
}

export interface MovementState {
  isRunning: boolean;
  isSprinting: boolean;
  isSwimming: boolean;
  isSneaking: boolean;
  isOnMount: boolean;
  isOverEncumbered: boolean;
  sitState: number;
  sleepState: number;
}

export interface PlayerFullState {
  heading: HeadingState;
  equipment: EquipmentState;
  combat: CombatState;
  movement: MovementState;
  goldAmount: number;
  carryWeight: number;
  inventoryWeight: number;
  magickaPercentage: number;
  staminaPercentage: number;
}

export interface NearbyNpcState {
  formId: number;
  name: string;
  distance: number;
  health: number;
  level: number;
  race: string | null;
  isHostile: boolean;
  isAlly: boolean;
  isGuard: boolean;
  isMerchant: boolean;
  isInDialogue: boolean;
  isDetected: boolean;
  hasLOS: boolean;
  relationshipRank: number;
  isDead: boolean;
}

export interface CrosshairTarget {
  name: string | null;
  type: string | null;
  formId: number;
  distance: number;
  isOpen: number | null;
}

export interface LocationState {
  locationName: string | null;
  isInterior: boolean;
  cellName: string | null;
  worldspaceName: string | null;
}

export interface QuestObjective {
  index: number;
  displayed: boolean;
  completed: boolean;
}

export interface QuestState {
  questName: string | null;
  editorId: string | null;
  currentStage: number;
  objectives: QuestObjective[];
}

export interface InputState {
  keysPressed: string[];
}

export interface MenuState {
  openMenus: string[];
}

export interface EnvironmentState {
  gameTime: number;
  gameHour: number;
  weatherName: string | null;
  cameraState: number;
  sunPositionX: number | null;
  sunPositionY: number | null;
  sunPositionZ: number | null;
}

export interface FullCollectedState {
  player: PlayerFullState | null;
  nearbyNpcs: NearbyNpcState[];
  crosshairTarget: CrosshairTarget | null;
  location: LocationState | null;
  quest: QuestState | null;
  input: InputState | null;
  menu: MenuState | null;
  environment: EnvironmentState | null;
  eventType: EventType;
}
