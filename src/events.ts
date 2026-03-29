import {
  on,
  printConsole,
  type ActivateEvent,
  type BookReadEvent,
  type CellFullyLoadedEvent,
  type ContainerChangedEvent,
  type CrosshairRefChangedEvent,
  type DeathEvent,
  type EnterBleedoutEvent,
  type EquipEvent,
  type FastTravelEnd,
  type FurnitureEvent,
  type ItemHarvestedEvent,
  type LevelIncreaseEvent,
  type LocationChangedEvent,
  type LocationDiscoveryEvent,
  type LockChangedEvent,
  type MenuCloseEvent,
  type MenuOpenEvent,
  type OpenCloseEvent,
  type QuestStageEvent,
  type QuestStartStopEvent,
  type SkillIncreaseEvent,
  type SleepStartEvent,
  type SleepStopEvent
} from "./skyrimPlatform";
import { CONFIG } from "./config";

type EventName =
  | "crosshairRefChanged"
  | "locationChanged"
  | "locationDiscovery"
  | "cellFullyLoaded"
  | "menuOpen"
  | "menuClose"
  | "furnitureEnter"
  | "furnitureExit"
  | "open"
  | "close"
  | "questStage"
  | "questStart"
  | "questStop"
  | "deathStart"
  | "deathEnd"
  | "containerChanged"
  | "equip"
  | "unequip"
  | "levelIncrease"
  | "skillIncrease"
  | "enterBleedout"
  | "fastTravelEnd"
  | "sleepStart"
  | "sleepStop"
  | "activate"
  | "lockChanged"
  | "bookRead"
  | "itemHarvested";

export type EventHandlers = Partial<Record<EventName, (...args: unknown[]) => void>>;

type ContainerChangedState = {
  oldContainer?: number;
  newContainer?: number;
  item?: number;
  count?: number;
};

type EquipChangeState = {
  action: "equip" | "unequip";
  actor?: number;
  baseObject?: number;
  extraData?: unknown;
};

type LevelUpState = {
  level?: number;
  skillId?: number;
  isSkillIncrease: boolean;
};

type QuestUpdateState = {
  event: "questStage" | "questStart" | "questStop";
  questId?: number;
  stage?: number;
};

type FastTravelEndState = {
  travelTimeGameHours?: number;
};

type BookReadState = {
  bookFormId?: number;
  title?: string;
};

type ItemHarvestedState = {
  itemFormId?: number;
  ingredientName?: string;
};

type LockChangedState = {
  lockedObject?: number;
};

let isRegistered = false;
let lastCrosshairRef: number | undefined;
const openMenus = new Set<string>();
let lastLocation: string | undefined;
let lastActivatedRef: number | undefined;
let playerDead = false;
let lastContainerChanged: ContainerChangedState | undefined;
let lastEquipChange: EquipChangeState | undefined;
let lastLevelUp: LevelUpState | undefined;
let lastQuestUpdate: QuestUpdateState | undefined;
let lastFastTravelEnd: FastTravelEndState | undefined;
let lastBookRead: BookReadState | undefined;
let lastItemHarvested: ItemHarvestedState | undefined;
let lastLockChanged: LockChangedState | undefined;

function debugLog(message: string): void {
  if (CONFIG.debugMode) {
    printConsole(`[SkyGuide] ${message}`);
  }
}

function runHandler(handlers: EventHandlers | undefined, eventName: EventName, args: unknown[]): void {
  handlers?.[eventName]?.(...args);
}

export function getLastCrosshairRef(): number | undefined {
  return lastCrosshairRef;
}

export function getOpenMenus(): Set<string> {
  const snapshot = new Set<string>();
  openMenus.forEach((menuName: string) => {
    snapshot.add(menuName);
  });
  return snapshot;
}

export function getLastLocation(): string | undefined {
  return lastLocation;
}

export function getLastActivatedRef(): number | undefined {
  return lastActivatedRef;
}

export function isPlayerDead(): boolean {
  return playerDead;
}

export function getLastContainerChanged(): ContainerChangedState | undefined {
  return lastContainerChanged;
}

export function getLastEquipChange(): EquipChangeState | undefined {
  return lastEquipChange;
}

export function getLastLevelUp(): LevelUpState | undefined {
  return lastLevelUp;
}

export function getLastQuestUpdate(): QuestUpdateState | undefined {
  return lastQuestUpdate;
}

export function getLastFastTravelEnd(): FastTravelEndState | undefined {
  return lastFastTravelEnd;
}

export function getLastBookRead(): BookReadState | undefined {
  return lastBookRead;
}

export function getLastItemHarvested(): ItemHarvestedState | undefined {
  return lastItemHarvested;
}

export function getLastLockChanged(): LockChangedState | undefined {
  return lastLockChanged;
}

export function registerAllEvents(handlers?: EventHandlers): void {
  if (isRegistered) {
    debugLog("registerAllEvents called after initialization; skipping duplicate subscriptions");
    return;
  }

  isRegistered = true;

  on("crosshairRefChanged", (event: CrosshairRefChangedEvent) => {
    lastCrosshairRef = event.reference?.getFormID();
    runHandler(handlers, "crosshairRefChanged", [event]);
    debugLog(`crosshairRefChanged: ${String(lastCrosshairRef)}`);
  });

  on("locationChanged", (event: LocationChangedEvent) => {
    lastLocation = event.newLoc?.getName();
    runHandler(handlers, "locationChanged", [event]);
    debugLog(`locationChanged: ${lastLocation ?? "unknown"}`);
  });

  on("locationDiscovery", (event: LocationDiscoveryEvent) => {
    runHandler(handlers, "locationDiscovery", [event]);
    debugLog(`locationDiscovery: ${event.name}`);
  });

  on("cellFullyLoaded", (event: CellFullyLoadedEvent) => {
    runHandler(handlers, "cellFullyLoaded", [event]);
    debugLog(`cellFullyLoaded: ${event.cell.getName()}`);
  });

  on("menuOpen", (event: MenuOpenEvent) => {
    if (event.name) {
      openMenus.add(event.name);
    }

    runHandler(handlers, "menuOpen", [event]);
    debugLog(`menuOpen: ${event.name}`);
  });

  on("menuClose", (event: MenuCloseEvent) => {
    if (event.name) {
      openMenus.delete(event.name);
    }

    runHandler(handlers, "menuClose", [event]);
    debugLog(`menuClose: ${event.name}`);
  });

  on("furnitureEnter", (event: FurnitureEvent) => {
    runHandler(handlers, "furnitureEnter", [event]);
    debugLog(`furnitureEnter: ${String(event.target.getFormID())}`);
  });

  on("furnitureExit", (event: FurnitureEvent) => {
    runHandler(handlers, "furnitureExit", [event]);
    debugLog(`furnitureExit: ${String(event.target.getFormID())}`);
  });

  on("open", (event: OpenCloseEvent) => {
    runHandler(handlers, "open", [event]);
    debugLog(`open: ${String(event.target.getFormID())}`);
  });

  on("close", (event: OpenCloseEvent) => {
    runHandler(handlers, "close", [event]);
    debugLog(`close: ${String(event.target.getFormID())}`);
  });

  on("questStage", (event: QuestStageEvent) => {
    lastQuestUpdate = { event: "questStage", questId: event.quest.getFormID(), stage: event.stage };
    runHandler(handlers, "questStage", [event]);
    debugLog(`questStage: quest=${String(lastQuestUpdate.questId)} stage=${String(event.stage)}`);
  });

  on("questStart", (event: QuestStartStopEvent) => {
    lastQuestUpdate = { event: "questStart", questId: event.quest.getFormID() };
    runHandler(handlers, "questStart", [event]);
    debugLog(`questStart: quest=${String(lastQuestUpdate.questId)}`);
  });

  on("questStop", (event: QuestStartStopEvent) => {
    lastQuestUpdate = { event: "questStop", questId: event.quest.getFormID() };
    runHandler(handlers, "questStop", [event]);
    debugLog(`questStop: quest=${String(lastQuestUpdate.questId)}`);
  });

  on("deathStart", (event: DeathEvent) => {
    playerDead = true;
    runHandler(handlers, "deathStart", [event]);
    debugLog("deathStart");
  });

  on("deathEnd", (event: DeathEvent) => {
    playerDead = false;
    runHandler(handlers, "deathEnd", [event]);
    debugLog("deathEnd");
  });

  on("containerChanged", (event: ContainerChangedEvent) => {
    lastContainerChanged = {
      oldContainer: event.oldContainer?.getFormID(),
      newContainer: event.newContainer?.getFormID(),
      item: event.baseObj?.getFormID(),
      count: event.numItems
    };

    runHandler(handlers, "containerChanged", [event]);
    debugLog(
      `containerChanged: ${String(lastContainerChanged.oldContainer)} -> ${String(lastContainerChanged.newContainer)}, item=${String(lastContainerChanged.item)}, count=${String(event.numItems)}`
    );
  });

  on("equip", (event: EquipEvent) => {
    lastEquipChange = {
      action: "equip",
      actor: event.actor?.getFormID(),
      baseObject: event.baseObj?.getFormID(),
      extraData: event.uniqueId
    };

    runHandler(handlers, "equip", [event]);
    debugLog(`equip: actor=${String(lastEquipChange.actor)} item=${String(lastEquipChange.baseObject)}`);
  });

  on("unequip", (event: EquipEvent) => {
    lastEquipChange = {
      action: "unequip",
      actor: event.actor?.getFormID(),
      baseObject: event.baseObj?.getFormID(),
      extraData: event.uniqueId
    };

    runHandler(handlers, "unequip", [event]);
    debugLog(`unequip: actor=${String(lastEquipChange.actor)} item=${String(lastEquipChange.baseObject)}`);
  });

  on("levelIncrease", (event: LevelIncreaseEvent) => {
    lastLevelUp = {
      level: event.newLevel,
      isSkillIncrease: false
    };

    runHandler(handlers, "levelIncrease", [event]);
    debugLog(`levelIncrease: level=${String(event.newLevel)}`);
  });

  on("skillIncrease", (event: SkillIncreaseEvent) => {
    lastLevelUp = {
      skillId: event.actorValue,
      isSkillIncrease: true
    };

    runHandler(handlers, "skillIncrease", [event]);
    debugLog(`skillIncrease: skill=${String(event.actorValue)}`);
  });

  on("enterBleedout", (event: EnterBleedoutEvent) => {
    runHandler(handlers, "enterBleedout", [event]);
    debugLog(`enterBleedout: actor=${String(event.actor.getFormID())}`);
  });

  on("fastTravelEnd", (event: FastTravelEnd) => {
    lastFastTravelEnd = { travelTimeGameHours: event.travelTimeGameHours };
    runHandler(handlers, "fastTravelEnd", [event]);
    debugLog(`fastTravelEnd: travelHours=${String(event.travelTimeGameHours)}`);
  });

  on("sleepStart", (event: SleepStartEvent) => {
    runHandler(handlers, "sleepStart", [event]);
    debugLog(`sleepStart: desiredStopTime=${String(event.desiredStopTime)}`);
  });

  on("sleepStop", (event: SleepStopEvent) => {
    runHandler(handlers, "sleepStop", [event]);
    debugLog(`sleepStop: interrupted=${String(event.isInterrupted)}`);
  });

  on("activate", (event: ActivateEvent) => {
    lastActivatedRef = event.target?.getFormID();
    runHandler(handlers, "activate", [event]);
    debugLog(`activate: target=${String(lastActivatedRef)} caster=${String(event.caster?.getFormID())}`);
  });

  on("lockChanged", (event: LockChangedEvent) => {
    lastLockChanged = {
      lockedObject: event.lockedObject?.getFormID()
    };

    runHandler(handlers, "lockChanged", [event]);
    debugLog(`lockChanged: object=${String(lastLockChanged.lockedObject)}`);
  });

  on("bookRead", (event: BookReadEvent) => {
    lastBookRead = {
      bookFormId: event.book?.getFormID(),
      title: event.book?.getName()
    };

    runHandler(handlers, "bookRead", [event]);
    debugLog(`bookRead: ${lastBookRead.title ?? String(lastBookRead.bookFormId)}`);
  });

  on("itemHarvested", (event: ItemHarvestedEvent) => {
    lastItemHarvested = {
      itemFormId: event.produceItem?.getFormID(),
      ingredientName: event.produceItem?.getName()
    };

    runHandler(handlers, "itemHarvested", [event]);
    debugLog(`itemHarvested: ${lastItemHarvested.ingredientName ?? String(lastItemHarvested.itemFormId)}`);
  });
}
