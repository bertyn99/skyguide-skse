import { once, on, printConsole, Debug, hooks, findConsoleCommand } from "skyrimPlatform";
import { collectFullState, collectPlayerStateExport, collectEnemiesExport } from "./game-state/collector";
import { serializeState } from "./game-state/serializer";
import { evaluatePriority, shouldSend } from "./arbitration/priority";
import { sendGameState, isConnected } from "./communication/http-client";
import { CONFIG, PLAYER_FORM_ID } from "./config";

let lastTickTime = 0;
let playerAnimation = "";

function processAndSend(state: ReturnType<typeof collectFullState>): void {
  if (!state) return;

  const priority = evaluatePriority(state);

  if (shouldSend(priority, state)) {
    const payload = serializeState(state, priority);
    sendGameState(payload).catch(() => {
      if (CONFIG.debugMode) {
        printConsole("Failed to send game state");
      }
    });

    if (CONFIG.debugMode) {
      printConsole(`Sent state: ${priority} priority`);
    }
  }
}

once("update", () => {
  printConsole("SkyGuide plugin loaded!");
  Debug.notification("SkyGuide is active");

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
      }
    },
    PLAYER_FORM_ID,
    PLAYER_FORM_ID + 1,
    "*Attack*"
  );
});

findConsoleCommand("skyguide")?.add({
  execute: () => {
    printConsole("SkyGuide Status:");
    printConsole(`  Connected: ${isConnected()}`);
    printConsole(`  Server: ${CONFIG.serverUrl}`);
    printConsole(`  Tick interval: ${CONFIG.tickInterval}ms`);
    printConsole(`  Debug mode: ${CONFIG.debugMode}`);
  }
});

on("tick", () => {
  if (!isConnected()) {
    return;
  }

  const now = Date.now();
  if (now - lastTickTime < CONFIG.tickInterval) {
    return;
  }

  lastTickTime = now;

  const state = collectFullState(playerAnimation, "tick");
  playerAnimation = "";

  processAndSend(state);
});

on("combatState", (actor: number, oldState: number, newState: number) => {
  if (actor !== PLAYER_FORM_ID) return;

  if (!isConnected()) return;

  const state = collectFullState("", `combatState_${newState}`);
  processAndSend(state);

  if (CONFIG.debugMode) {
    printConsole(`Combat state changed: ${oldState} -> ${newState}`);
  }
});

on("hit", (target: number, source: number, damage: number) => {
  if (target !== PLAYER_FORM_ID && source !== PLAYER_FORM_ID) return;

  if (!isConnected()) return;

  const state = collectFullState("", "hit");
  processAndSend(state);

  if (CONFIG.debugMode) {
    printConsole(`Hit event: target=${target}, source=${source}, damage=${damage}`);
  }
});
