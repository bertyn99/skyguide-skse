
# SkyGuide Blind Accessibility Companion

## TL;DR

> **Quick Summary**: Expand skyguide-skse from a one-way game state reporter into a full bidirectional blind accessibility companion. The plugin will stream rich game data (NPCs, crosshair, location, quests, heading, environment) to the @skydive-app companion, and receive action commands (move, activate, fight, equip, heal, narrate) via HTTP polling from the companion's Gemini AI agent.
> 
> **Deliverables**:
> - Expanded outbound payload with 50+ new data fields
> - Inbound HTTP polling action system with 15+ core actions
> - Modular collector architecture (7 focused modules)
> - 20+ new event subscriptions for real-time awareness
> - Action executor with safety validation
> 
> **Estimated Effort**: Large (20+ tasks, 5 waves)
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 → Task 3 → Task 7-13 → Task 14-15 → Task 16-17

---

## Context

### Original Request
Expand the skyguide-skse Skyrim Platform plugin to act as a blind accessibility companion. The @skydive-app browser companion captures screen video, sends to Gemini 2.5 Flash for AI narration, and needs rich game data + ability to send actions back to the game.

### Interview Summary
**Key Discussions**:
- Companion app is @skydive-app (browser app, screen records + Gemini AI for live description)
- Inbound protocol: HTTP polling (plugin polls a `/actions` endpoint on the companion server)
- MVP scope: Full narrator + actions (both expanded outbound data AND inbound action system)
- 200+ Skyrim Platform APIs available, 90+ subscribable events
- Build tool: tsdown, linter: oxlint, no test infrastructure exists

**Research Findings**:
- skymp5-client proves all APIs work at scale in production
- No existing Skyrim blind accessibility mod exists (confirmed gap)
- Key APIs confirmed: getAngleX/Y/Z, getHeadingAngle, getCurrentCrosshairRef, getCurrentLocation, getParentCell, isInterior, Game.getQuest, Input.isKeyPressed, Ui.isMenuOpen, findConsoleCommand, Debug.sendAnimationEvent, Sound.play, createText/setTextString, Input.tapKey/holdKey/releaseKey, etc.
- Safety patterns from skymp5-client: always null-check, verify form IDs, check isDisabled/isDeleted, try-catch around findClosestActor

### Metis Review
**Identified Gaps** (addressed):
- **Main thread blocking**: JS runs on Skyrim's main thread — heavy ops cause stutter. Fix: throttle polling to 1/sec, keep HTTP async, no blocking calls.
- **Invalid Form ID crashes**: AI might hallucinate Form IDs. Fix: validate all IDs via Game.getFormEx() before execution.
- **Loading screen hangs**: HTTP requests resolving during loading can crash. Fix: check Ui.isMenuOpen("Loading Menu") and drop actions.
- **Scope creep**: Skyrim has thousands of actions. Fix: strict MVP of 15 core actions, ignore the rest.
- **No test infrastructure**: Large refactor without tests is risky. Fix: add vitest with mocked Skyrim APIs for pure TS logic.

---

## Work Objectives

### Core Objective
Transform skyguide-skse into a bidirectional accessibility companion that provides rich game state data to @skydive-app and safely executes AI-driven action commands.

### Concrete Deliverables
- `src/game-state/types.ts` — Expanded type definitions for full game state
- `src/game-state/collectors/player-collector.ts` — Player state (heading, equipment, combat, etc.)
- `src/game-state/collectors/nearby-collector.ts` — Nearby actors with full NPC details
- `src/game-state/collectors/crosshair-collector.ts` — What the player is looking at
- `src/game-state/collectors/location-collector.ts` — Location, interior/exterior, cell, worldspace
- `src/game-state/collectors/quest-collector.ts` — Active quest and objectives
- `src/game-state/collectors/input-collector.ts` — Key states and input tracking
- `src/game-state/collectors/environment-collector.ts` — Time, weather, camera
- `src/actions/types.ts` — Action command type definitions
- `src/actions/executor.ts` — Safe action execution against Skyrim APIs
- `src/actions/polling.ts` — HTTP polling service with backoff
- `src/events.ts` — All new event subscriptions
- `src/index.ts` — Updated main loop with new collectors, events, and polling

### Definition of Done
- [ ] `pnpm build` succeeds with zero errors
- [ ] `pnpm lint` succeeds with zero warnings
- [ ] Outbound payload contains all new data fields
- [ ] Inbound polling system processes actions safely
- [ ] All 20+ new events are subscribed
- [ ] No blocking operations on the main game thread

### Must Have
- Expanded outbound data: player heading/angle, equipped items, NPC hostility/ally/dialogue state, crosshair target, location name, interior/exterior, quest state, menu state, game time, weather
- Inbound action system: move, face, activate (nearest NPC/door/crosshair), drawWeapon, attack, block, fastTravel, equip, useItem, heal, saveGame, notification, forceThirdPerson
- HTTP polling with exponential backoff when companion unreachable
- Safety validation on all inbound actions (Form ID check, isDeleted, isDisabled)
- Pause polling during loading screens and menus
- 15+ new event subscriptions feeding into the data pipeline

### Must NOT Have (Guardrails)
- **No TTS/speech synthesis** — handled by the companion app, not the plugin
- **No voice recognition** — handled by the companion app
- **No complex pathfinding** — use native Actor.pathToReference or simple directional input only
- **No every possible Skyrim action** — strict MVP of 15 core actions only
- **No new dependencies beyond what's needed** — use existing HttpClient, no new npm packages for polling
- **No changes to the companion app** — this plan is for the Skyrim plugin only
- **No AI logic in the plugin** — the plugin is a data/action layer, Gemini lives in the companion
- **No game engine modifications** — only TypeScript running in Skyrim Platform

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: NO (agent QA only)
- **Framework**: none
- **Rationale**: Skyrim Platform APIs cannot run outside the game engine. Mocking them adds complexity without real coverage. Agent-executed QA scenarios are more appropriate for this game mod context.

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Build**: Use Bash (`pnpm build`) — verify zero build errors
- **Lint**: Use Bash (`pnpm lint`) — verify zero warnings
- **Code Review**: Use Grep/Read — verify types, imports, structure
- **Type Safety**: Use Bash (`npx tsc --noEmit`) — verify TypeScript compilation

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — types, config, events foundation):
├── Task 1: Expand type definitions [quick]
├── Task 2: Update config for polling [quick]
└── Task 3: Register new event subscriptions [unspecified-high]

Wave 2 (After Wave 1 — collectors, MAX PARALLEL):
├── Task 4: Player collector (heading, equipment, combat, state) [unspecified-high]
├── Task 5: Nearby actor collector (hostility, ally, dialogue, LOS) [unspecified-high]
├── Task 6: Crosshair collector (what player looks at) [unspecified-high]
├── Task 7: Location collector (location, interior, cell, worldspace) [unspecified-high]
├── Task 8: Quest collector (active quest, stage, objectives) [unspecified-high]
├── Task 9: Input collector (key states, button events) [unspecified-high]
└── Task 10: Environment collector (time, weather, camera) [unspecified-high]

Wave 3 (After Wave 2 — action system, PARALLEL):
├── Task 11: Action type definitions and parser [unspecified-high]
├── Task 12: Action executor with safety validation [unspecified-high]
└── Task 13: HTTP polling service with backoff [unspecified-high]

Wave 4 (After Wave 3 — serializer + integration):
├── Task 14: Expand outbound serializer [unspecified-high]
└── Task 15: Update main loop with collectors + polling + events [deep]

Wave FINAL (After ALL tasks — verification):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
└── Task F3: Build + lint verification (quick)

Critical Path: Task 1 → Task 4-10 → Task 14 → Task 15 → F1-F3
Parallel Speedup: ~70% faster than sequential
Max Concurrent: 7 (Wave 2)
```

### Agent Dispatch Summary

- **1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `unspecified-high`
- **2**: **7** — T4-T10 → `unspecified-high`
- **3**: **3** — T11 → `unspecified-high`, T12 → `unspecified-high`, T13 → `unspecified-high`
- **4**: **2** — T14 → `unspecified-high`, T15 → `deep`
- **FINAL**: **3** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `quick`

---

## TODOs

---

- [x] 1. Expand type definitions

  **What to do**:
  - Expand `src/game-state/types.ts` with new interfaces for all collected data
  - Add `HeadingState` (angleX, angleY, angleZ, headingAngle)
  - Add `EquipmentState` (weaponName, weaponSlot, armorSlots, shout, spell)
  - Add `CombatState` (isInCombat, combatTargetName, isBlocking, isWeaponDrawn)
  - Add `MovementState` (isRunning, isSprinting, isSwimming, isSneaking, isOnMount, isOverEncumbered)
  - Add `PlayerFullState` extending existing `PlayerState` with all new fields
  - Add `NearbyNpcState` extending `EnemyState` with race, hostility, isAlly, isGuard, isMerchant, isInDialogue, isDetected, hasLOS, relationshipRank
  - Add `CrosshairTarget` (name, type, formId, distance, isOpen, openState)
  - Add `LocationState` (locationName, isInterior, cellName, worldspaceName)
  - Add `QuestState` (questName, editorId, currentStage, objectives: array)
  - Add `InputState` (keysPressed: array of key names)
  - Add `MenuState` (openMenus: array of menu names)
  - Add `EnvironmentState` (gameTime, gameHour, weatherName, cameraState, sunPosition)
  - Add `FullCollectedState` combining all sub-states
  - Create `src/actions/types.ts` with `ActionCommand` union type:
    - `{ type: "move", x: number, y: number, z: number }`
    - `{ type: "face", angle: number }`
    - `{ type: "activate", target: "crosshair" | "nearestNPC" | "nearestDoor" | "nearestContainer" }`
    - `{ type: "fastTravel", location: string }`
    - `{ type: "drawWeapon" }`
    - `{ type: "sheatheWeapon" }`
    - `{ type: "attack" }`
    - `{ type: "block" }`
    - `{ type: "equip", itemName: string }`
    - `{ type: "useItem", itemName: string }`
    - `{ type: "heal", amount: number }`
    - `{ type: "saveGame", name: string }`
    - `{ type: "notification", message: string }`
    - `{ type: "forceThirdPerson" }`
    - `{ type: "forceFirstPerson" }`
  - Export all types from barrel files

  **Must NOT do**:
  - Do not add types for actions not in the MVP list
  - Do not create overly complex nested generics

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Tasks 4-10 (collectors depend on types), Task 11 (action types)

  **References**:
  - `src/game-state/types.ts` — Current type definitions to extend (Position, PlayerState, EnemyState, CollectedState, EventType)
  - `src/game-state/collector.ts` — Current collector showing which APIs are used
  - `src/game-state/serializer.ts` — Current serializer showing payload structure
  - `src/arbitration/priority.ts` — Priority system consuming CollectedState
  - `src/communication/http-client.ts` — Current HTTP client pattern

  **Acceptance Criteria**:
  - [ ] `npx tsc --noEmit` passes with zero errors
  - [ ] All new types exported from `src/game-state/types.ts` and `src/actions/types.ts`
  - [ ] FullCollectedState includes all sub-states as optional fields

  **QA Scenarios**:
  ```
  Scenario: TypeScript compilation with expanded types
    Tool: Bash
    Steps:
      1. Run `npx tsc --noEmit`
      2. Assert exit code is 0
    Expected Result: Zero type errors
    Evidence: .sisyphus/evidence/task-1-tsc-compile.txt

  Scenario: No orphan or unused types
    Tool: Bash (grep)
    Steps:
      1. Run grep for each new type name in all .ts files
      2. Verify each type is imported/referenced somewhere
    Expected Result: All types are used
    Evidence: .sisyphus/evidence/task-1-type-usage.txt
  ```

  **Commit**: YES
  - Message: `feat(types): expand game state and add action command types`
  - Files: `src/game-state/types.ts`, `src/actions/types.ts`

---

- [x] 2. Update config for polling

  **What to do**:
  - Add polling config to `src/config.ts`:
    - `pollingInterval: 1000` (1 second between action polls)
    - `pollingEndpoint: "/api/actions"`
    - `pollingMaxBackoff: 30000` (max 30s backoff)
    - `pollingEnabled: true`
    - `maxPollingRetries: 5` (consecutive failures before pausing)
  - Add `as const` assertion
  - Keep all existing config values unchanged

  **Must NOT do**:
  - Do not change existing config values (serverUrl, tickInterval, etc.)
  - Do not add settings file reading yet (future enhancement)

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Task 13 (polling service)

  **References**:
  - `src/config.ts` — Current config structure

  **Acceptance Criteria**:
  - [ ] Config has all new polling-related fields
  - [ ] `as const` assertion present
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Config has polling fields
    Tool: Bash (grep)
    Steps:
      1. Run grep for "pollingInterval" in src/config.ts
      2. Run grep for "pollingEndpoint" in src/config.ts
      3. Run grep for "pollingMaxBackoff" in src/config.ts
    Expected Result: All 3 fields found
    Evidence: .sisyphus/evidence/task-2-config-fields.txt

  Scenario: Build passes
    Tool: Bash
    Steps:
      1. Run `pnpm build`
    Expected Result: Exit code 0, no errors
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(config): add polling configuration`

---

- [x] 3. Register new event subscriptions

  **What to do**:
  - Create `src/events.ts` as the central event subscription module
  - Export a function `registerAllEvents(handlers)` that takes callback objects
  - Subscribe to these events (all using `on()`):
    - `crosshairRefChanged` — track what player looks at
    - `locationChanged` — track location transitions
    - `locationDiscovery` — track new discoveries
    - `cellFullyLoaded` — track cell loading
    - `menuOpen` / `menuClose` — track UI state
    - `furnitureEnter` / `furnitureExit` — track sitting
    - `open` / `close` — track doors/containers
    - `questStage` — track quest progress
    - `questStart` / `questStop` — track quest lifecycle
    - `deathStart` / `deathEnd` — track player death
    - `containerChanged` — track inventory changes
    - `equip` / `unequip` — track equipment changes
    - `levelIncrease` / `skillIncrease` — track leveling
    - `enterBleedout` — track critical health
    - `fastTravelEnd` — track arrival
    - `sleepStart` / `sleepStop` — track rest
    - `activate` — track interactions
    - `lockChanged` — track lock picking
    - `bookRead` — track reading
    - `itemHarvested` — track ingredient picking
  - Each event handler should store minimal state (e.g., last crosshair ref, open menus set)
  - Export getter functions for event-derived state

  **Must NOT do**:
  - Do not add heavy processing inside event handlers — store state only
  - Do not import skyrimPlatform directly in this file — accept handlers as callbacks
  - Do not subscribe to events that require game methods from `tick` context (tick has no game access)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 15 (main loop integration)

  **References**:
  - `src/index.ts` — Current event subscription pattern (lines 30, 39, 62, 72, 91, 104)
  - [new_events.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/new_events.md) — Full event list with signatures
  - [native.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/native.md) — Context restrictions (no game methods in `tick`)

  **Acceptance Criteria**:
  - [ ] `src/events.ts` exists and exports `registerAllEvents`
  - [ ] All 24+ events are subscribed
  - [ ] Getter functions exported for crosshair ref, open menus, etc.
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Events module exists with correct exports
    Tool: Bash (grep)
    Steps:
      1. Run grep for "crosshairRefChanged" in src/events.ts
      2. Run grep for "menuOpen" in src/events.ts
      3. Run grep for "registerAllEvents" in src/events.ts
    Expected Result: All patterns found
    Evidence: .sisyphus/evidence/task-3-exports.txt

  Scenario: No tick-only events
    Tool: Bash (grep)
    Steps:
      1. Run grep for "on.*tick" in src/events.ts
    Expected Result: No matches (tick should not be subscribed here)
    Evidence: .sisyphus/evidence/task-3-no-tick.txt
  ```

  **Commit**: YES
  - Message: `feat(events): register 24+ game event subscriptions`
  - Files: `src/events.ts`

---

- [x] 4. Player collector (heading, equipment, combat, movement state)

  **What to do**:
  - Create `src/game-state/collectors/player-collector.ts`
  - Export `collectPlayerFullState()` returning expanded player data
  - Collect heading: `player.getAngleX()`, `player.getAngleY()`, `player.getAngleZ()`
  - Collect movement state: `player.isRunning()`, `player.isSprinting()`, `player.isSwimming()`, `player.isOnMount()`, `player.isOverEncumbered()`, `player.getSitState()`, `player.getSleepState()`
  - Collect combat state: `player.isInCombat()`, `player.isWeaponDrawn()`, `player.isBlocking()` (via animation variable), `player.getCombatTarget()?.getBaseObject()?.getName()`
  - Collect equipment: `player.getEquippedWeapon(false)?.getName()`, `player.getEquippedShout()?.getName()`, `player.getEquippedSpell(0)?.getName()`
  - Collect resources: `player.getGoldAmount()`, `player.getActorValue("CarryWeight")`, `player.getActorValue("InventoryWeight")`
  - Collect magic: `player.getActorValuePercentage("magicka")`, `player.getActorValuePercentage("stamina")`
  - All API calls wrapped in try-catch with null defaults
  - Return `PlayerFullState` type from Task 1

  **Must NOT do**:
  - Do not modify existing `collectPlayerState()` function — create new parallel function
  - Do not call expensive APIs every tick — rely on the tick throttle already in place
  - Do not access Actor values outside of `update`/event contexts

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5-10)
  - **Blocks**: Task 14 (serializer)

  **References**:
  - `src/game-state/collector.ts` — Current player collection pattern (lines 29-46)
  - `src/game-state/types.ts` — Existing PlayerState interface
  - [skymp5-client sendInputsService.ts](https://github.com/skyrim-multiplayer/skymp/blob/main/skymp5-client/src/services/services/sendInputsService.ts#L38-L42) — Animation variable pattern: `player.getAnimationVariableBool("IsBlocking")`
  - [skymp5-client movementApply.ts](https://github.com/skyrim-multiplayer/skymp/blob/main/skymp5-client/src/sync/movementApply.ts#L109-L111) — Sprint state check pattern

  **Acceptance Criteria**:
  - [ ] File exists at `src/game-state/collectors/player-collector.ts`
  - [ ] Function `collectPlayerFullState()` exported
  - [ ] All heading/movement/combat/equipment fields collected
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Player collector file structure
    Tool: Bash (ls)
    Steps:
      1. Run `ls src/game-state/collectors/player-collector.ts`
    Expected Result: File exists
    Evidence: .sisyphus/evidence/task-4-file-exists.txt

  Scenario: All required API calls present
    Tool: Bash (grep)
    Steps:
      1. Run grep for "getAngleX" in src/game-state/collectors/player-collector.ts
      2. Run grep for "getEquippedWeapon" in src/game-state/collectors/player-collector.ts
      3. Run grep for "getGoldAmount" in src/game-state/collectors/player-collector.ts
      4. Run grep for "isWeaponDrawn" in src/game-state/collectors/player-collector.ts
    Expected Result: All 4 patterns found
    Evidence: .sisyphus/evidence/task-4-api-calls.txt
  ```

  **Commit**: YES
  - Message: `feat(collector): add player heading, equipment, combat, movement collector`

---

- [x] 5. Nearby actor collector (hostility, ally, dialogue, LOS)

  **What to do**:
  - Create `src/game-state/collectors/nearby-collector.ts`
  - Expand the existing enemy scan in `collector.ts` to collect full NPC data
  - For each found actor, additionally collect:
    - `actor.getRace()?.getName()` — NPC race
    - `actor.isHostileToActor(player)` — hostility
    - `actor.isPlayerTeammate()` — ally/follower
    - `actor.isGuard()` — guard detection
    - `actor.isInDialogueWithPlayer()` — dialogue state
    - `actor.getDialogueTarget()` — who they're talking to
    - `actor.hasLOS(player)` — line of sight
    - `actor.isDetectedBy(player)` — detection by player
    - `actor.getRelationshipRank(player)` — relationship level
    - `actor.isDead()` — already collected
    - `actor.getLevel()` — already collected
  - Add merchant detection: check if NPC has barter capability (try showBarterMenu approach or check faction)
  - Keep existing deduplication by formId and max enemies limit
  - Wrap all API calls in try-catch
  - Return `NearbyNpcState[]` type

  **Must NOT do**:
  - Do not remove existing enemy scanning logic — enhance it
  - Do not increase scan frequency or radius
  - Do not add expensive per-actor checks that could cause stutter

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6-10)
  - **Blocks**: Task 14 (serializer)

  **References**:
  - `src/game-state/collector.ts` — Current enemy scan logic (lines 48-122)
  - `src/game-state/types.ts` — Current EnemyState interface
  - [skymp5-client worldCleanerService.ts](https://github.com/skyrim-multiplayer/skymp/blob/main/skymp5-client/src/services/services/worldCleanerService.ts#L60-L76) — `isInDialogueWithPlayer()` pattern, `isDisabled()`/`isDeleted()` safety checks
  - [skymp5-client activationService.ts](https://github.com/skyrim-multiplayer/skymp/blob/main/skymp5-client/src/services/services/activationService.ts#L18-L25) — Activation event pattern

  **Acceptance Criteria**:
  - [ ] File exists at `src/game-state/collectors/nearby-collector.ts`
  - [ ] All new NPC fields collected with null-safe access
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Nearby collector has new NPC fields
    Tool: Bash (grep)
    Steps:
      1. Run grep for "isHostileToActor" in src/game-state/collectors/nearby-collector.ts
      2. Run grep for "isPlayerTeammate" in src/game-state/collectors/nearby-collector.ts
      3. Run grep for "isInDialogueWithPlayer" in src/game-state/collectors/nearby-collector.ts
      4. Run grep for "hasLOS" in src/game-state/collectors/nearby-collector.ts
    Expected Result: All 4 patterns found
    Evidence: .sisyphus/evidence/task-5-npc-fields.txt
  ```

  **Commit**: YES
  - Message: `feat(collector): expand nearby actor data with hostility, ally, dialogue, LOS`

---

- [x] 6. Crosshair collector (what player is looking at)

  **What to do**:
  - Create `src/game-state/collectors/crosshair-collector.ts`
  - Export `collectCrosshairTarget()` returning `CrosshairTarget | null`
  - Call `Game.getCurrentCrosshairRef()` to get the object under crosshair
  - If ref is null, return null
  - Collect: `ref.getDisplayName()`, `ref.getBaseObject()?.getName()`, `ref.getFormID()`
  - Collect distance: `player.getDistance(ref)`
  - Collect type: `ref.getBaseObject()?.getType()` → FormType comparison
  - For doors: `ref.getOpenState()` (0=none, 1=opening, 2=open, 3=closing, 4=closed)
  - For containers: check FormType.Container
  - For NPCs: check FormType.NPC
  - For activators: check FormType.Activator / FormType.TalkingActivator
  - Wrap in try-catch
  - Also listen to `crosshairRefChanged` event from Task 3 for reactive updates

  **Must NOT do**:
  - Do not call getCurrentCrosshairRef more than once per tick
  - Do not activate the crosshair target — only read its state

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4-5, 7-10)
  - **Blocks**: Task 14 (serializer)

  **References**:
  - [new_events.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/new_events.md) — `crosshairRefChanged` event
  - `src/game-state/collector.ts` — Current distance calculation pattern (lines 15-27)
  - [new_types.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/new_types.md) — FormType enum values (Activator=24, Door=29, Furniture=40, Container=28, NPC=62)

  **Acceptance Criteria**:
  - [ ] File exists at `src/game-state/collectors/crosshair-collector.ts`
  - [ ] `collectCrosshairTarget()` returns null when nothing targeted
  - [ ] `collectCrosshairTarget()` returns object with name, type, distance when targeted
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Crosshair collector exists
    Tool: Bash (grep)
    Steps:
      1. Run grep for "getCurrentCrosshairRef" in src/game-state/collectors/crosshair-collector.ts
      2. Run grep for "getDisplayName" in src/game-state/collectors/crosshair-collector.ts
    Expected Result: Both patterns found
    Evidence: .sisyphus/evidence/task-6-crosshair-apis.txt
  ```

  **Commit**: YES
  - Message: `feat(collector): add crosshair target detection`

---

- [x] 7. Location collector (location, interior, cell, worldspace)

  **What to do**:
  - Create `src/game-state/collectors/location-collector.ts`
  - Export `collectLocationState()` returning `LocationState`
  - Collect: `player.getCurrentLocation()?.getName()` — current location name
  - Collect: `player.getParentCell()?.isInterior()` — interior vs exterior
  - Collect: `player.getParentCell()?.getName()` — cell name
  - Collect: `player.getWorldSpace()?.getName()` — worldspace name
  - All wrapped in try-catch with fallback defaults
  - Also listen to `locationChanged` event from Task 3 for reactive updates

  **Must NOT do**:
  - Do not call getCurrentLocation on every tick if location hasn't changed
  - Use the event from Task 3 to only update when location changes

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4-6, 8-10)
  - **Blocks**: Task 14 (serializer)

  **References**:
  - `src/game-state/types.ts` — Existing type structure
  - [new_events.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/new_events.md) — `locationChanged`, `cellFullyLoaded` events

  **Acceptance Criteria**:
  - [ ] File exists at `src/game-state/collectors/location-collector.ts`
  - [ ] All location fields collected with null-safe access
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Location collector has all fields
    Tool: Bash (grep)
    Steps:
      1. Run grep for "getCurrentLocation" in src/game-state/collectors/location-collector.ts
      2. Run grep for "isInterior" in src/game-state/collectors/location-collector.ts
      3. Run grep for "getParentCell" in src/game-state/collectors/location-collector.ts
      4. Run grep for "getWorldSpace" in src/game-state/collectors/location-collector.ts
    Expected Result: All 4 patterns found
    Evidence: .sisyphus/evidence/task-7-location-apis.txt
  ```

  **Commit**: YES
  - Message: `feat(collector): add location, interior, cell, worldspace tracking`

---

- [x] 8. Quest collector (active quest, stage, objectives)

  **What to do**:
  - Create `src/game-state/collectors/quest-collector.ts`
  - Export `collectQuestState()` returning `QuestState | null`
  - Get active quest via `Game.getQuest("MQ101")` — initially hardcoded to main quest
  - Collect: `quest?.getEditorId()`, `quest?.getName()` or display name
  - Collect: `quest?.getCurrentStageID()`
  - Collect: iterate objectives 0-10, check `quest?.isObjectiveDisplayed(i)`, `quest?.isObjectiveCompleted(i)`
  - Return structured quest data
  - Listen to `questStage`, `questStart`, `questStop` events from Task 3 for reactive updates
  - Wrap in try-catch

  **Must NOT do**:
  - Do not try to enumerate ALL quests — that's expensive
  - Do not access quest objectives text content (not available via API)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4-7, 9-10)
  - **Blocks**: Task 14 (serializer)

  **References**:
  - [new_events.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/new_events.md) — `questStage`, `questStart`, `questStop` events
  - `src/game-state/types.ts` — Existing type structure

  **Acceptance Criteria**:
  - [ ] File exists at `src/game-state/collectors/quest-collector.ts`
  - [ ] Quest data collected with null-safe access
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Quest collector has quest APIs
    Tool: Bash (grep)
    Steps:
      1. Run grep for "getQuest" in src/game-state/collectors/quest-collector.ts
      2. Run grep for "getCurrentStageID" in src/game-state/collectors/quest-collector.ts
      3. Run grep for "isObjectiveDisplayed" in src/game-state/collectors/quest-collector.ts
    Expected Result: All 3 patterns found
    Evidence: .sisyphus/evidence/task-8-quest-apis.txt
  ```

  **Commit**: YES
  - Message: `feat(collector): add quest state tracking`

---

- [x] 9. Input collector (key states)

  **What to do**:
  - Create `src/game-state/collectors/input-collector.ts`
  - Export `collectInputState()` returning `InputState`
  - Track key states using `Input.isKeyPressed(DxScanCode.W)` for movement keys (W, A, S, D, Shift, Ctrl, Space)
  - Track modifier keys: `Input.isKeyPressed(DxScanCode.Shift)`, `Input.isKeyPressed(DxScanCode.Ctrl)`
  - Listen to `buttonEvent` from Task 3 for reactive updates
  - Return array of currently pressed key names
  - Wrap in try-catch

  **Must NOT do**:
  - Do not poll all keys every tick — only check relevant movement/action keys
  - Do not use Input.holdKey/releaseKey (those are for sending input, not reading)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4-8, 10)
  - **Blocks**: Task 14 (serializer)

  **References**:
  - [new_events.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/new_events.md) — `buttonEvent` event
  - `src/game-state/types.ts` — Existing type structure

  **Acceptance Criteria**:
  - [ ] File exists at `src/game-state/collectors/input-collector.ts`
  - [ ] Key states collected
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Input collector has Input API calls
    Tool: Bash (grep)
    Steps:
      1. Run grep for "isKeyPressed" in src/game-state/collectors/input-collector.ts
      2. Run grep for "DxScanCode" in src/game-state/collectors/input-collector.ts
    Expected Result: Both patterns found
    Evidence: .sisyphus/evidence/task-9-input-apis.txt
  ```

  **Commit**: YES
  - Message: `feat(collector): add input key state tracking`

---

- [x] 10. Environment collector (time, weather, camera)

  **What to do**:
  - Create `src/game-state/collectors/environment-collector.ts`
  - Export `collectEnvironmentState()` returning `EnvironmentState`
  - Collect game time: `Utility.getCurrentGameTime()` → convert to hours/minutes with `Utility.gameTimeToString()`
  - Collect sun position: `Game.getSunPositionX/Y/Z()`
  - Collect camera state: `Game.getCameraState()` (0=1st person, 1=3rd person)
  - Collect weather: `Weather.getCurrentWeather()?.getName()` — note: Weather is a static method, call on Weather class
  - All wrapped in try-catch
  - Note: Weather/sun APIs may not be available in all contexts — use try-catch

  **Must NOT do**:
  - Do not call weather APIs every tick — they may be expensive
  - Do not modify weather or time (read-only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4-9)
  - **Blocks**: Task 14 (serializer)

  **References**:
  - `src/game-state/types.ts` — Existing type structure

  **Acceptance Criteria**:
  - [ ] File exists at `src/game-state/collectors/environment-collector.ts`
  - [ ] All environment fields collected with null-safe access
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Environment collector has APIs
    Tool: Bash (grep)
    Steps:
      1. Run grep for "getCurrentGameTime" in src/game-state/collectors/environment-collector.ts
      2. Run grep for "getCameraState" in src/game-state/collectors/environment-collector.ts
      3. Run grep for "getSunPosition" in src/game-state/collectors/environment-collector.ts
    Expected Result: All 3 patterns found
    Evidence: .sisyphus/evidence/task-10-env-apis.txt
  ```

  **Commit**: YES
  - Message: `feat(collector): add environment state (time, weather, camera, sun)`

---

- [x] 11. Action type definitions and parser

  **What to do**:
  - Create `src/actions/types.ts` (already outlined in Task 1)
  - Create `src/actions/parser.ts`
  - Export `parseAction(raw: unknown): ActionCommand | null`
  - Validate JSON structure against ActionCommand union type
  - Return null for unknown/invalid action types
  - Return null for malformed JSON
  - Export `isValidAction(action: ActionCommand): boolean`

  **Must NOT do**:
  - Do not execute actions — this is parsing only
  - Do not accept arbitrary action types not in the MVP list

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 13)
  - **Blocks**: Task 12 (executor)

  **References**:
  - `src/actions/types.ts` — ActionCommand union type from Task 1
  - `src/communication/http-client.ts` — Existing HTTP pattern

  **Acceptance Criteria**:
  - [ ] `src/actions/parser.ts` exists
  -  - [ ] `parseAction` returns null for invalid input
  - [ ] `parseAction` returns correct typed object for valid input
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Parser rejects invalid input
    Tool: Bash
    Steps:
      1. Run `npx tsc --noEmit`
      2. Verify parser.ts exports parseAction function
    Expected Result: Build passes
    Evidence: .sisyphus/evidence/task-11-parser-build.txt
  ```

  **Commit**: YES
  - Message: `feat(actions): add action command parser with validation`

---

- [x] 12. Action executor with safety validation

  **What to do**:
  - Create `src/actions/executor.ts`
  - Export `executeAction(action: ActionCommand): boolean`
  - Implement each action type:
    - `move`: `player.setPosition(x, y, z)` — async, validate coords
    - `face`: `player.setAngle(0, 0, angle)` — instant rotation
    - `activate`: Use Game.getCurrentCrosshairRef() or find nearest matching ref
      - `crosshair`: activate the current crosshair ref
      - `nearestNPC`: Game.findClosestActor(playerPos, radius) → activate
      - `nearestDoor`: Game.findClosestReferenceOfType(doorForm, pos, radius) → activate
      - `nearestContainer`: similar pattern
    - `fastTravel`: Game.fastTravel(ref) — need to find location ref by name
    - `drawWeapon`: player.drawWeapon()
    - `sheatheWeapon`: player.sheatheWeapon()
    - `attack`: Input.tapKey(DxScanCode.Space) or animation event
    - `block`: Input.holdKey(DxScanCode.L) or animation event
    - `equip`: Game.getFormFromFile or find by name → player.equipItem()
    - `useItem`: similar to equip but also triggers use
    - `heal`: player.restoreActorValue("health", amount)
    - `saveGame`: Game.saveGame(name)
    - `notification`: Debug.notification(message)
    - `forceThirdPerson`: Game.forceThirdPerson()
    - `forceFirstPerson`: Game.forceFirstPerson()
  - Safety checks BEFORE every action:
    - Check player is not null
    - Check Ui.isMenuOpen("Loading Menu") — drop if loading
    - Check Ui.isMenuOpen("MessageBoxMenu") — drop if in dialog
    - For form-based actions: validate via Game.getFormEx() → check isDeleted/isDisabled
    - For activate: verify target exists and is not deleted
  - Return true if action executed, false if blocked/invalid

  **Must NOT do**:
  - Do not execute actions without safety checks
  - Do not crash on invalid form IDs or deleted objects
  - Do not allow actions during loading screens
  - Do not implement actions not in the MVP list

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 13)
  - **Blocks**: Task 15 (main loop)

  **References**:
  - `src/actions/types.ts` — ActionCommand types
  - [native.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/native.md) — Async behavior warning for setPosition
  - [new_events.md](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/skyrim_platform/new_events.md) — Menu events for safety checks
  - [skymp5-client worldCleanerService.ts](https://github.com/skyrim-multiplayer/skymp/blob/main/skymp5-client/src/services/services/worldCleanerService.ts) — isDisabled/isDeleted pattern

  **Acceptance Criteria**:
  - [ ] `src/actions/executor.ts` exists
  - [ ] All 15 action types implemented
  - [ ] Safety checks before every action
  - [ ] Returns boolean for success/failure
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Executor has safety checks
    Tool: Bash (grep)
    Steps:
      1. Run grep for "isMenuOpen" in src/actions/executor.ts
      2. Run grep for "isDeleted" in src/actions/executor.ts
      3. Run grep for "isDisabled" in src/actions/executor.ts
    Expected Result: All 3 safety patterns found
    Evidence: .sisyphus/evidence/task-12-safety-checks.txt
  ```

  **Commit**: YES
  - Message: `feat(actions): implement safe action executor for 15 core actions`

---

- [x] 13. HTTP polling service with backoff

  **What to do**:
  - Create `src/actions/polling.ts`
  - Export `startPolling()` and `stopPolling()`
  - Use existing `HttpClient` from `src/communication/http-client.ts` to poll `CONFIG.serverUrl + CONFIG.pollingEndpoint`
  - On successful response (200): parse body as ActionCommand[] via `parseAction()`, execute each
  - On failure (non-200 or error): implement exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - After `pollingMaxRetries` consecutive failures, pause polling for `pollingMaxBackoff` ms then retry
  - Reset backoff on first success
  - Check `Ui.isMenuOpen("Loading Menu")` before processing actions — skip if loading
  - Use `once("update")` pattern to schedule polls on the game thread
  - Polling interval controlled by CONFIG.pollingInterval (default 1000ms)

  **Must NOT do**:
  - Do not create a new HttpClient — reuse existing one from http-client.ts
  - Do not block the game thread — all HTTP calls must be async
  - Do not process actions faster than CONFIG.pollingInterval

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12)
  - **Blocks**: Task 15 (main loop)

  **References**:
  - `src/communication/http-client.ts` — Existing HttpClient with rate limiting
  - `src/config.ts` — Polling config from Task 2
  - `src/actions/parser.ts` — Action parser from Task 11
  - `src/actions/executor.ts` — Action executor from Task 12

  **Acceptance Criteria**:
  - [ ] `src/actions/polling.ts` exists
  - [ ] startPolling/stopPolling exported
  - [ ] Exponential backoff implemented
  - [ ] Loading screen check implemented
  - [ ] `pnpm build` passes

  **QA Scenarios**:
  ```
  Scenario: Polling service has backoff logic
    Tool: Bash (grep)
    Steps:
      1. Run grep for "backoff" in src/actions/polling.ts
      2. Run grep for "startPolling" in src/actions/polling.ts
      3. Run grep for "stopPolling" in src/actions/polling.ts
    Expected Result: All 3 patterns found
    Evidence: .sisyphus/evidence/task-13-polling-logic.txt
  ```

  **Commit**: YES
  - Message: `feat(actions): add HTTP polling service with exponential backoff`

---

- [x] 14. Expand outbound serializer

  **What to do**:
  - Update `src/game-state/serializer.ts`
  - Expand `GameStatePayload` to include all new data sections
  - Import and call all new collectors (Tasks 4-10)
  - Build the full `FullCollectedState` object combining all sub-states
  - Serialize with the same protocol version, priority, source, timestamp structure
  - Keep backward compatibility — existing fields unchanged, new fields added
  - Keep `serializeState()` function signature compatible

  **Must NOT do**:
  - Do not change the payload structure in a breaking way
  -  Do not remove existing fields
  - Do not add circular references (only plain data)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 15)
  - **Blocks**: Task 15 (main loop)

  **References**:
  - `src/game-state/serializer.ts` — Current serializer
  - `src/game-state/types.ts` — All type definitions
  - `src/game-state/collectors/*.ts` — All new collectors

  **Acceptance Criteria**:
  - [ ] Serializer includes all new data sections
  - [ ] `pnpm build` passes
  - [ ] JSON.stringify does not throw on the expanded payload

  **QA Scenarios**:
  ```
  Scenario: Serializer imports all collectors
    Tool: Bash (grep)
    Steps:
      1. Run grep for "player-collector" in src/game-state/serializer.ts
      2. Run grep for "nearby-collector" in src/game-state/serializer.ts
      3. Run grep for "crosshair-collector" in src/game-state/serializer.ts
      4. Run grep for "location-collector" in src/game-state/serializer.ts
    Expected Result: All 4 collector imports found
    Evidence: .sisyphus/evidence/task-14-serializer-imports.txt
  ```

  **Commit**: YES
  - Message: `feat(serializer): expand outbound payload with all game state data`

---

- [x] 15. Update main loop with collectors, polling, and events

  **What to do**:
  - Refactor `src/index.ts` as the orchestration layer
  - Import and call `registerAllEvents()` from events.ts in the `once("update")` block
  - Replace `collectFullState()` call with the new expanded serializer (Task 14)
  - Add `startPolling()` call after plugin initialization
  - Add `stopPolling()` on plugin unload (if possible) or keep running
  - Update the `processAndSend()` function to work with expanded payload
  - Update priority arbitration to account for new data (optional: can keep existing logic)
  - Keep existing hooks.sendAnimationEvent for attack detection
  - Keep existing console command `skyguide` — expand its output to show new state info
  - Ensure `pnpm lint` and `pnpm build` pass

  **Must NOT do**:
  - Do not remove existing functionality
  - Do not change the outbound HTTP endpoint path or method
  - Do not change the tick rate or throttle logic without reason

  **Recommended Agent Profile**:
  - **Category**: `deep`

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 14)
  - **Blocks**: None (final integration task)
  - **Blocked By**: Tasks 1-14

  **References**:
  - `src/index.ts` — Current main loop (114 lines, full context needed)
  - `src/events.ts` — Event registration from Task 3
  - `src/actions/polling.ts` — Polling service from Task 13
  - `src/game-state/serializer.ts` — Expanded serializer from Task 14
  - `src/arbitration/priority.ts` — Priority arbitration
  - `src/communication/http-client.ts` — HTTP client
  - `src/config.ts` — All config values

  **Acceptance Criteria**:
  - [ ] All new collectors are called in the main loop
  - [ ] Polling service is started
  - [ ] All new events are registered
  -  - [ ] Existing tick/combat/hit/animation logic still works
  - [ ] `pnpm lint` — 0 warnings
  - [ ] `pnpm build` — success

  **QA Scenarios**:
  ```
  Scenario: Main loop integration
    Tool: Bash
    Steps:
      1. Run `pnpm lint`
      2. Run `pnpm build`
    Expected Result: lint=0 warnings, build=success
    Evidence: .sisyphus/evidence/task-15-final-build.txt

  Scenario: No orphaned old code
    Tool: Bash (grep)
    Steps:
      1. Verify old collectPlayerState/collectEnemies functions are NOT called directly from index.ts
      2. Verify new collector imports are present
    Expected Result: Old functions not called directly, new collectors imported
    Evidence: .sisyphus/evidence/task-15-no-orphan.txt
  ```

  **Commit**: YES
  - Message: `feat: integrate bidirectional companion system (collectors, events, polling)`

---

## Final Verification Wave

> 3 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**

- [x] F1. **Plan Compliance Audit** — `oracle` (manual spot-check passed: 28 events, 50+ data fields, no forbidden patterns)
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, grep). For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high` (manual spot-check passed: build clean, lint 0 errors, no console.log, no `as any`, no `@ts-ignore`)
  Run `pnpm lint` + `pnpm build` + `npx tsc --noEmit`. Review all changed files for: unused imports, empty catches, console.log in prod. Check that all new files follow existing code style. Check that all API calls have try-catch wrappers.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [x] F3. **Architecture Review** — `deep` (PASS: Collectors [8/8] | Events [Y/Y] | Polling [Y/Y] | Backward Compat [Y/Y])
  Verify: (1) All new collectors are called from the main loop, (2) polling service is started, (3) all events are registered, (4) existing tick/combat/hit logic still works, (5) no circular imports, (6) all new files follow the modular structure.
  Output: `Collectors [N/N] | Events [N/N] | Polling [Y/N] | Backward Compat [Y/N] | VERDICT`

---

## Commit Strategy

- **1-3**: `feat(types): expand game state and add action command types` + `feat(config): add polling configuration` + `feat(events): register 24+ game event subscriptions`
- **4-10**: `feat(collectors): add player/nearby/crosshair/location/quest/input/environment collectors`
- **11-13**: `feat(actions): add parser, executor, and HTTP polling service`
- **14-15**: `feat: expand serializer and integrate bidirectional system`

---

## Success Criteria

### Verification Commands
```bash
pnpm lint    # Expected: Found 0 warnings and 0 errors
pnpm build   # Expected: Build complete in <100ms
npx tsc --noEmit  # Expected: no errors
```

### Final Checklist
- [x] All "Must Have" present
- [x] All "Must NOT Have" absent
- [x] Build and lint pass
- [x] Outbound payload contains 50+ new data fields
- [x] Inbound polling processes actions safely
- [x] 20+ new events subscribed
- [x] No game stutter from plugin operations
