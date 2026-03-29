import { once, on, printConsole, hooks, findConsoleCommand, Game } from "./skyrimPlatform";
import { registerAllEvents } from "./events";
import { startPolling } from "./actions/polling";
import { evaluatePriority, shouldSend, recordSentState } from "./arbitration/priority";
import { serializeFullState } from "./game-state/serializer";
import { collectFullState } from "./game-state/collector";
import type { EventType } from "./game-state/types";
import { sendGameState, isConnected } from "./communication/http-client";
import { CONFIG, PLAYER_FORM_ID } from "./config";

let lastTickTime = 0;
let playerAnimation = "";
let eventsRegistered = false;
let pollingStarted = false;
let lastCombatState = 0;
let lastMovementLogTime = 0;
let lastLoggedPosition: { x: number; y: number; z: number } | null = null;

const COLLECTORS_COUNT = 8;
const MOVEMENT_LOG_MIN_DISTANCE = 100;
const MOVEMENT_LOG_INTERVAL_MS = 1000;

/**
 * findConsoleCommand only resolves built-in SCRIPT_FUNCTION entries; it cannot invent new commands.
 * We repurpose an existing slot and rename it to "skyguide" (see skymp/docs/skyrim_platform/features.md).
 */
const HOST_CONSOLE_COMMAND_FOR_SKYGUIDE = "GetAVInfo";

function registerSkyguideConsoleCommand(): void {
  const host = findConsoleCommand(HOST_CONSOLE_COMMAND_FOR_SKYGUIDE);
  if (!host) {
    printConsole(
      `[SkyGuide] Console hook failed: no "${HOST_CONSOLE_COMMAND_FOR_SKYGUIDE}" command (unexpected).`
    );
    return;
  }
  host.longName = "skyguide";
  host.shortName = "";
  host.numArgs = 0;
  host.execute = () => {
    printConsole("SkyGuide Status:");
    printConsole(`  Connected: ${isConnected()}`);
    printConsole(`  Polling status: ${pollingStarted ? "active" : "inactive"}`);
    printConsole(`  Events registered: ${eventsRegistered ? "yes" : "no"}`);
    printConsole(`  Collectors count: ${COLLECTORS_COUNT}`);
    printConsole(`  Server: ${CONFIG.serverUrl}`);
    printConsole(`  Send interval: ${CONFIG.tickInterval}ms (on update)`);
    printConsole(`  Debug mode: ${CONFIG.debugMode}`);
    // Returning false avoids running the original host command implementation.
    return false;
  };
  if (CONFIG.debugMode) {
    printConsole(`[SkyGuide] Console: ~${HOST_CONSOLE_COMMAND_FOR_SKYGUIDE} is now ~skyguide`);
  }
}

function processAndSend(eventType: EventType, animation = ""): void {
  if (!isConnected()) {
    return;
  }

  const state = collectFullState(animation, eventType);
  if (!state) {
    if (CONFIG.debugMode) {
      printConsole("[SkyGuide] collectFullState returned null; skip send");
    }
    return;
  }

  const priority = evaluatePriority(state);
  if (!shouldSend(priority, state)) {
    return;
  }

  const payload = serializeFullState(eventType, priority);
  if (!payload) {
    if (CONFIG.debugMode) {
      printConsole("[SkyGuide] Failed to serialize full state payload");
    }
    return;
  }

  sendGameState(payload)
    .then((sent) => {
      if (sent) {
        recordSentState(state);
        if (CONFIG.debugMode) {
          printConsole(`Sent state: ${priority} priority (${eventType})`);
        }
      }
    })
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (CONFIG.debugMode) {
        printConsole(`[SkyGuide] Failed to send game state: ${msg}`);
      }
    });
}

function safeProcessAndSend(eventType: EventType, animation = ""): void {
  try {
    processAndSend(eventType, animation);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (CONFIG.debugMode) {
      printConsole(`[SkyGuide] processAndSend failed (${eventType}): ${msg}`);
    }
  }
}

function distance3D(
  from: { x: number; y: number; z: number },
  to: { x: number; y: number; z: number }
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function logPlayerWalking(now: number): void {
  const player = Game.getPlayer();
  if (!player || player.isDead()) {
    lastLoggedPosition = null;
    return;
  }

  const currentPosition = {
    x: player.getPositionX(),
    y: player.getPositionY(),
    z: player.getPositionZ()
  };

  if (!lastLoggedPosition) {
    lastLoggedPosition = currentPosition;
    return;
  }

  const walkedDistance = distance3D(lastLoggedPosition, currentPosition);
  if (walkedDistance < MOVEMENT_LOG_MIN_DISTANCE) {
    return;
  }

  if (now - lastMovementLogTime < MOVEMENT_LOG_INTERVAL_MS) {
    return;
  }

  const movementKind = player.isSprinting()
    ? "sprinting"
    : player.isRunning()
      ? "running"
      : "walking";

  printConsole(
    `[SkyGuide] Player ${movementKind}: x=${currentPosition.x.toFixed(0)} y=${currentPosition.y.toFixed(0)} z=${currentPosition.z.toFixed(0)} (moved ${walkedDistance.toFixed(0)})`
  );

  lastLoggedPosition = currentPosition;
  lastMovementLogTime = now;
}

let isLoaded = false;
function init() {
  if (isLoaded) return;

  printConsole("SkyGuide plugin loaded!");

  registerAllEvents();
  eventsRegistered = true;
  startPolling();
  pollingStarted = CONFIG.pollingEnabled;

  if (CONFIG.debugMode) {
    printConsole(`Server: ${CONFIG.serverUrl}`);
    printConsole(`Send interval: ${CONFIG.tickInterval}ms (on update)`);
  }

  // Register before hooks.sendAnimationEvent; if that throws (e.g. main menu state), we still get a ~ command.
  try {
    registerSkyguideConsoleCommand();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    printConsole(`[SkyGuide] Console command registration failed: ${msg}`);
  }

  try {
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
      PLAYER_FORM_ID,
      "Attack*"
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    printConsole(`[SkyGuide] sendAnimationEvent hook failed (non-fatal): ${msg}`);
  }

  isLoaded = true;
}

once("update", () => {
  init();
});

on("update", () => {
  const now = Date.now();
  logPlayerWalking(now);

  if (!isConnected()) {
    return;
  }

  if (now - lastTickTime < CONFIG.tickInterval) {
    return;
  }

  lastTickTime = now;

  const animation = playerAnimation;
  playerAnimation = "";

  safeProcessAndSend("tick", animation);
});

on("combatState", event => {
  const actor = event.actor.getFormID();
  if (actor !== PLAYER_FORM_ID) return;

  const newState = event.isCombat ? 1 : event.isSearching ? 2 : 0;
  const oldState = lastCombatState;
  lastCombatState = newState;

  safeProcessAndSend(`combatState_${newState}`);

  if (CONFIG.debugMode) {
    printConsole(`Combat state changed: ${oldState} -> ${newState}`);
  }
});

on("hit", event => {
  const target = event.target?.getFormID?.() ?? 0;
  const source = event.aggressor?.getFormID?.() ?? 0;
  const sourceBaseForm = event.source?.getFormID?.();
  if (target !== PLAYER_FORM_ID && source !== PLAYER_FORM_ID) return;

  safeProcessAndSend("hit");

  if (CONFIG.debugMode) {
    printConsole(`Hit event: target=${target}, source=${source}, sourceForm=${String(sourceBaseForm)}`);
  }
});
