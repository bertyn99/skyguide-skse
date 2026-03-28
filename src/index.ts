import { once, on, printConsole, Debug, hooks, findConsoleCommand } from "skyrimPlatform";
import { registerAllEvents } from "./events";
import { startPolling } from "./actions/polling";
import { shouldSend } from "./arbitration/priority";
import { serializeFullState, type PriorityLevel } from "./game-state/serializer";
import type { CollectedState, EventType } from "./game-state/types";
import { sendGameState, isConnected } from "./communication/http-client";
import { CONFIG, PLAYER_FORM_ID } from "./config";

let lastTickTime = 0;
let playerAnimation = "";
let eventsRegistered = false;
let pollingStarted = false;
let lastCombatState = 0;

const COLLECTORS_COUNT = 8;

function buildArbitrationState(eventType: EventType, animation: string): CollectedState {
  return {
    player: {
      health: 1,
      maxHealth: 1,
      magicka: 0,
      stamina: 0,
      level: 1,
      position: { x: 0, y: 0, z: 0 },
      isSneaking: false,
      isDead: false
    },
    combatState: 0,
    enemies: [],
    playerAnimation: animation,
    eventType
  };
}

function processAndSend(eventType: EventType, priority: PriorityLevel, animation = ""): void {
  const arbitrationState = buildArbitrationState(eventType, animation);
  if (!shouldSend(priority, arbitrationState)) {
    return;
  }

  const payload = serializeFullState(eventType);
  if (!payload) {
    if (CONFIG.debugMode) {
      printConsole("[SkyGuide] Failed to serialize full state payload");
    }
    return;
  }

  sendGameState(payload).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (CONFIG.debugMode) {
      printConsole(`[SkyGuide] Failed to send game state: ${msg}`);
    }
  });

  if (CONFIG.debugMode) {
    printConsole(`Sent state: ${priority} priority (${eventType})`);
  }
}

once("update", () => {
  printConsole("SkyGuide plugin loaded!");
  Debug.notification("SkyGuide is active");

  registerAllEvents();
  eventsRegistered = true;
  startPolling();
  pollingStarted = CONFIG.pollingEnabled;

  if (CONFIG.debugMode) {
    printConsole(`Server: ${CONFIG.serverUrl}`);
    printConsole(`Tick interval: ${CONFIG.tickInterval}ms`);
  }

  hooks.sendAnimationEvent.add(
    {
      enter(ctx) {
        const validAttacks = [
          "attackleft",
          "attackright",
          "attackkick",
          "attack3",
          "attackthrow"
        ];

        const eventLower = ctx.animEventName.toLowerCase();
        if (validAttacks.some(attack => eventLower.includes(attack))) {
          playerAnimation = ctx.animEventName;
        }
      },
      leave() {
      }
    },
    PLAYER_FORM_ID,
    PLAYER_FORM_ID + 1,
    "*Attack*"
  );
});

const skyguideCommand = findConsoleCommand("skyguide");
if (skyguideCommand) {
  skyguideCommand.execute = () => {
    printConsole("SkyGuide Status:");
    printConsole(`  Connected: ${isConnected()}`);
    printConsole(`  Polling status: ${pollingStarted ? "active" : "inactive"}`);
    printConsole(`  Events registered: ${eventsRegistered ? "yes (28)" : "no"}`);
    printConsole(`  Collectors count: ${COLLECTORS_COUNT}`);
    printConsole(`  Server: ${CONFIG.serverUrl}`);
    printConsole(`  Tick interval: ${CONFIG.tickInterval}ms`);
    printConsole(`  Debug mode: ${CONFIG.debugMode}`);
    return true;
  };
}

on("tick", () => {
  if (!isConnected()) {
    return;
  }

  const now = Date.now();
  if (now - lastTickTime < CONFIG.tickInterval) {
    return;
  }

  lastTickTime = now;

  const animation = playerAnimation;
  playerAnimation = "";

  processAndSend("tick", "low", animation);
});

on("combatState", event => {
  const actor = event.actor.getFormID();
  if (actor !== PLAYER_FORM_ID) return;

  if (!isConnected()) return;

  const newState = event.isCombat ? 1 : event.isSearching ? 2 : 0;
  const oldState = lastCombatState;
  lastCombatState = newState;

  processAndSend(`combatState_${newState}`, "high");

  if (CONFIG.debugMode) {
    printConsole(`Combat state changed: ${oldState} -> ${newState}`);
  }
});

on("hit", event => {
  const target = event.target.getFormID();
  const source = event.aggressor.getFormID();
  const sourceBaseForm = event.source?.getFormID();
  if (target !== PLAYER_FORM_ID && source !== PLAYER_FORM_ID) return;

  if (!isConnected()) return;

  processAndSend("hit", "high");

  if (CONFIG.debugMode) {
    printConsole(`Hit event: target=${target}, source=${source}, sourceForm=${String(sourceBaseForm)}`);
  }
});
