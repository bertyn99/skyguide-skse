# Plan: skyguide-skse (Skyrim Platform Plugin)

> TypeScript Skyrim Platform plugin that extracts game state from Skyrim SE and sends it to skydive-app via HTTP POST.

---

## Context

- **Parent project**: SkyGuide (global plan at `../.sisyphus/plans/skyguide-project.md`)
- **Mod framework**: Skyrim Platform (Nexus Mods #54909)
- **Communication**: HTTP POST to skydive-app at `localhost:3000/api/game-state`

---

## Prerequisites

1. Install Skyrim Platform from Nexus Mods: https://www.nexusmods.com/skyrimspecialedition/mods/54909
2. Install Node.js 20+
3. Have Skyrim SE installed

---

## Repository Structure

```
skyguide-skse/
├── package.json
├── tsconfig.json
├── webpack.config.js
├── skyrim.json
├── .gitignore
├── README.md
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── game-state/
│   │   ├── types.ts
│   │   ├── collector.ts
│   │   └── serializer.ts
│   ├── arbitration/
│   │   └── priority.ts
│   └── communication/
│       └── http-client.ts
└── dist/
    └── skyguide.js
```

---

## Tasks

### Phase 0: Project Scaffolding

**Task 0.1: Initialize repository**
- Create `package.json`:
  ```json
  {
    "name": "skyguide-skse",
    "version": "1.0.0",
    "scripts": {
      "dev": "webpack --watch --mode development",
      "build": "webpack --mode production"
    },
    "dependencies": {
      "@skyrim-platform/skyrim-platform": "*"
    },
    "devDependencies": {
      "typescript": "^5.0.0",
      "webpack": "^5.0.0",
      "webpack-cli": "^5.0.0",
      "ts-loader": "^9.0.0"
    }
  }
  ```
- Create `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "ES2020",
      "moduleResolution": "bundler",
      "strict": true,
      "esModuleInterop": true,
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src/**/*"]
  }
  ```
- Create `webpack.config.js`:
  ```javascript
  const path = require("path");
  
  module.exports = {
    entry: "./src/index.ts",
    module: {
      rules: [{ test: /\.ts$/, use: "ts-loader" }]
    },
    resolve: { extensions: [".ts", ".js"] },
    output: {
      filename: "skyguide.js",
      path: path.resolve(__dirname, "dist")
    },
    target: "node"
  };
  ```
- Create `skyrim.json`:
  ```json
  { "skyrimFolder": "C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition" }
  ```
- Create `.gitignore`: `node_modules/`, `dist/`, `.skyrim.json`
- Create `README.md` with build/install instructions
- **QA**: `pnpm install` succeeds, `pnpm build` produces `dist/skyguide.js`

**Task 0.2: Create hello-world plugin**
- Create `src/index.ts`:
  ```typescript
  import { once, printConsole, Debug } from "skyrimPlatform";
  
  once("update", () => {
    printConsole("SkyGuide plugin loaded!");
    Debug.notification("SkyGuide is active");
  });
  ```
- Create `src/config.ts`:
  ```typescript
  export const CONFIG = {
    serverUrl: "http://localhost:3000",
    tickInterval: 500,
    enemyScanRadius: 5000,
    maxEnemies: 10,
    debugMode: false
  };
  ```
- Copy `dist/skyguide.js` to Skyrim's `Data/Platform/Plugins/`
- **QA**: Skyrim starts, console (`~`) shows "SkyGuide plugin loaded!", notification appears

---

### Phase 1: Game State Extraction

**Task 1.1: Create game state types and collector**
- Create `src/game-state/types.ts`:
  ```typescript
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
    animation: string;
  }
  
  export interface CollectedState {
    player: PlayerState;
    combatState: number;
    enemies: EnemyState[];
    playerAnimation: string;
    eventType: string;
  }
  ```
- Create `src/game-state/collector.ts`:
  ```typescript
  import { Game, Actor, ObjectReference } from "skyrimPlatform";
  import type { PlayerState, EnemyState, CollectedState, Position } from "./types";
  import { CONFIG } from "../config";
  
  export function collectPlayerState(): PlayerState | null {
    const player = Game.getPlayer();
    if (!player) return null;
    
    return {
      health: player.getActorValue("health"),
      maxHealth: player.getBaseActorValue("health"),
      magicka: player.getActorValue("magicka"),
      stamina: player.getActorValue("stamina"),
      level: player.getLevel(),
      position: {
        x: player.getPositionX(),
        y: player.getPositionY(),
        z: player.getPositionZ()
      },
      isSneaking: player.isSneaking(),
      isDead: player.isDead()
    };
  }
  
  export function collectEnemies(center: Position, radius: number): EnemyState[] {
    const enemies: EnemyState[] = [];
    const player = Game.getPlayer();
    if (!player) return enemies;
    
    // Skyrim Platform doesn't have a built-in "find all actors in radius"
    // We use findClosestActor in a loop or process lists
    // For MVP, we scan using findClosestActor at different offsets
    // A better approach would be hooking into ProcessLists
    
    // Simple approach: find closest actor, then scan around
    const closest = Game.findClosestActor(center.x, center.y, center.z, radius);
    if (closest && closest.getFormID() !== player.getFormID()) {
      const baseObj = closest.getBaseObject();
      enemies.push({
        formId: closest.getFormID(),
        name: baseObj?.getName() || "Unknown",
        distance: calculateDistance(center, {
          x: closest.getPositionX(),
          y: closest.getPositionY(),
          z: closest.getPositionZ()
        }),
        health: closest.getActorValue("health"),
        level: closest.getLevel(),
        animation: "Unknown"
      });
    }
    
    return enemies.slice(0, CONFIG.maxEnemies);
  }
  
  function calculateDistance(a: Position, b: Position): number {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2) +
      Math.pow(a.z - b.z, 2)
    );
  }
  
  export function collectFullState(eventType: string): CollectedState | null {
    const player = collectPlayerState();
    if (!player) return null;
    
    return {
      player,
      combatState: Game.getPlayer()?.getCombatState() || 0,
      enemies: collectEnemies(player.position, CONFIG.enemyScanRadius),
      playerAnimation: "Idle",
      eventType
    };
  }
  ```
- **QA**: Run in Skyrim, verify collector returns valid player state with health/position

**Task 1.2: Create JSON serializer**
- Create `src/game-state/serializer.ts`:
  ```typescript
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
  ```
- **QA**: Serialize a test state, verify JSON matches protocol spec

**Task 1.3: Set up event-driven collection**
- Modify `src/index.ts`:
  ```typescript
  import { on, once, printConsole, Debug, hooks } from "skyrimPlatform";
  import { collectFullState } from "./game-state/collector";
  import { serializeState, PriorityLevel } from "./game-state/serializer";
  import { sendGameState } from "./communication/http-client";
  import { evaluatePriority, shouldSend } from "./arbitration/priority";
  import { CONFIG } from "./config";
  
  let lastTickTime = 0;
  let lastState: CollectedState | null = null;
  let lastPriority: PriorityLevel = "low";
  let lastSendTime = 0;
  let currentAnimation = "Idle";
  
  once("update", () => {
    printConsole("SkyGuide plugin loaded!");
    Debug.notification("SkyGuide is active");
  });
  
  on("tick", () => {
    const now = Date.now();
    if (now - lastTickTime < CONFIG.tickInterval) return;
    lastTickTime = now;
    
    const state = collectFullState("tick");
    if (!state) return;
    
    state.playerAnimation = currentAnimation;
    const priority = evaluatePriority(state, lastState);
    
    if (shouldSend(priority, lastSendTime, lastPriority)) {
      const json = serializeState(state, priority);
      sendGameState(json);
      lastSendTime = now;
      lastPriority = priority;
    }
    
    lastState = state;
  });
  
  on("combatState", (e) => {
    printConsole(`Combat state: ${e.isCombat}`);
    const state = collectFullState("combatState");
    if (state) {
      const json = serializeState(state, "high");
      sendGameState(json);
    }
  });
  
  on("hit", (e) => {
    printConsole(`Hit received`);
    const state = collectFullState("hit");
    if (state) {
      const json = serializeState(state, "high");
      sendGameState(json);
    }
  });
  
  hooks.sendAnimationEvent.add({
    enter(ctx) {
      if (ctx.selfId === 0x14) { // Player
        currentAnimation = ctx.animEventName;
        printConsole(`Animation: ${ctx.animEventName}`);
        
        if (ctx.animEventName.includes("Attack")) {
          const state = collectFullState("animation");
          if (state) {
            const json = serializeState(state, "high");
            sendGameState(json);
          }
        }
      }
    }
  }, 0x14, 0x14, "*");
  ```
- **QA**: Enter combat → instant state collection. Idle → throttled every 500ms.

---

### Phase 2: HTTP Communication

**Task 2.1: Create HTTP client wrapper**
- Create `src/communication/http-client.ts`:
  ```typescript
  import { HttpClient, printConsole } from "skyrimPlatform";
  import { CONFIG } from "../config";
  
  const client = new HttpClient(CONFIG.serverUrl);
  let lastSendTime = 0;
  let failureCount = 0;
  
  export function sendGameState(json: string): boolean {
    const now = Date.now();
    if (now - lastSendTime < 200) return false; // Rate limit
    lastSendTime = now;
    
    client.post("/api/game-state", {
      body: json,
      contentType: "application/json"
    }).then((response) => {
      if (response.status === 200) {
        failureCount = 0;
        printConsole(`Game state sent successfully`);
      } else {
        printConsole(`Game state failed: ${response.status}`);
        failureCount++;
      }
    }).catch((error) => {
      printConsole(`HTTP error: ${error}`);
      failureCount++;
    });
    
    return failureCount < 3;
  }
  
  export function isConnected(): boolean {
    return failureCount < 3;
  }
  ```
- **QA**: Start skydive-app, verify POST arrives. Stop skydive-app, verify no crash.

---

### Phase 3: Arbitration System

**Task 3.1: Implement priority evaluator**
- Create `src/arbitration/priority.ts`:
  ```typescript
  import type { CollectedState } from "../game-state/types";
  import type { PriorityLevel } from "../game-state/serializer";
  
  export function evaluatePriority(
    state: CollectedState,
    lastState: CollectedState | null
  ): PriorityLevel {
    const { player, combatState, enemies, playerAnimation } = state;
    
    // CRITICAL: low health or death
    if (player.health < player.maxHealth * 0.25 || player.isDead) {
      return "critical";
    }
    if (playerAnimation.includes("KillMove")) {
      return "critical";
    }
    
    // HIGH: in combat with close enemy or attacking
    if (combatState === 1) {
      const closeEnemy = enemies.find(e => e.distance < 1500);
      if (closeEnemy) return "high";
    }
    if (playerAnimation.includes("Attack")) {
      return "high";
    }
    
    // MEDIUM: combat state change or event
    if (state.eventType === "combatState" || state.eventType === "deathStart") {
      return "medium";
    }
    
    // SUPPRESSED: no change
    if (lastState && isStateUnchanged(state, lastState)) {
      return "suppressed";
    }
    
    // LOW: default
    return "low";
  }
  
  function isStateUnchanged(a: CollectedState, b: CollectedState): boolean {
    const healthDelta = Math.abs(a.player.health - b.player.health);
    const posDelta = Math.sqrt(
      Math.pow(a.player.position.x - b.player.position.x, 2) +
      Math.pow(a.player.position.y - b.player.position.y, 2)
    );
    return healthDelta < 1 && posDelta < 10 && a.enemies.length === b.enemies.length;
  }
  
  export function shouldSend(
    priority: PriorityLevel,
    lastSendTime: number,
    lastPriority: PriorityLevel
  ): boolean {
    const elapsed = Date.now() - lastSendTime;
    
    switch (priority) {
      case "critical": return true;
      case "high": return elapsed > 200;
      case "medium": return elapsed > 1000;
      case "low": return elapsed > 5000;
      case "suppressed": return false;
    }
  }
  ```
- **QA**: Test priority evaluation with various states.

---

### Phase 4: Polish & Distribution

**Task 4.2: Add debug logging and console commands**
- Modify `src/config.ts`:
  ```typescript
  export const CONFIG = {
    serverUrl: "http://localhost:3000",
    tickInterval: 500,
    enemyScanRadius: 5000,
    maxEnemies: 10,
    debugMode: true // Enable verbose logging
  };
  ```
- Add console commands in `src/index.ts`:
  ```typescript
  import { findConsoleCommand } from "skyrimPlatform";
  
  findConsoleCommand("skyguide")?.add({ execute: () => {
    printConsole("SkyGuide Status:");
    printConsole(`  Connected: ${isConnected()}`);
    printConsole(`  Last priority: ${lastPriority}`);
    printConsole(`  Last send: ${Date.now() - lastSendTime}ms ago`);
  }});
  ```
- **QA**: Type `skyguide` in Skyrim console → shows status.

**Task 4.5: Create distribution package**
- Create release structure:
  ```
  dist/SkyGuide/
  ├── Data/
  │   └── Platform/
  │       └── Plugins/
  │           ├── skyguide.js
  │           └── skyguide-settings.txt
  └── README.md
  ```
- **QA**: Fresh Skyrim + Skyrim Platform + SkyGuide → works.

---

## Files Summary

| File | Description |
|------|-------------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `webpack.config.js` | Build configuration |
| `skyrim.json` | Skyrim path config |
| `src/index.ts` | Entry point: event handlers |
| `src/config.ts` | Settings |
| `src/game-state/types.ts` | TypeScript interfaces |
| `src/game-state/collector.ts` | Game state collection |
| `src/game-state/serializer.ts` | JSON serialization |
| `src/arbitration/priority.ts` | Priority evaluator |
| `src/communication/http-client.ts` | HTTP client wrapper |
| `dist/skyguide.js` | Built plugin |
