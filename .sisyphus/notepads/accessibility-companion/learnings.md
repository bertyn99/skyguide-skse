# Learnings

## 2026-03-28 Initial Analysis
- Build tool: tsdown (rolldown-based), NOT webpack (README outdated)
- Linter: oxlint (NOT eslint)
- Config already has polling fields (Task 2 pre-done)
- Skyrim Platform API imported from "skyrimPlatform" 
- HttpClient available from skyrimPlatform, already used in http-client.ts
- Existing pattern: `Game.getPlayer()` null-check, try-catch wrappers
- PLAYER_FORM_ID = 0x14 (player's form ID in Skyrim)
- tsconfig: strict mode, noUnusedLocals, noUnusedParameters
- `on("tick")` has NO game access (context restriction) — only `on("update")` and events have game access
- Multi-scan pattern for findClosestActor: 9 offset positions to find multiple actors

## 2026-03-28 Event Module Implementation
- Centralized Skyrim event subscriptions should use typed event objects from `@skyrim-platform/skyrim-platform` instead of ad-hoc primitive callback params.
- `Set` usage in strict TS with ES5 target requires `"lib": ["es2015"]` in `tsconfig.json` to avoid type-level missing global collection errors.
