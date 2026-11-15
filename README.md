<p align="center">
  <img src="docs/branding/hero.jpg" alt="The Elder Scrolls V — SKYGUIDE" width="100%">
</p>

# SkyGuide SKSE

TypeScript Skyrim Platform plugin for game state extraction — the game-side
half of **SkyGuide** (companion app: [skydive-app](https://github.com/bertyn99/skydive-app)).

It POSTs structured game state to the companion server, polls it for
executable action commands (`/api/actions?since=<id>`), and dumps mod
context to disk so the server's AI pipeline (Gate + Composer) can read the
live game through the file connector.

## Prerequisites

- Skyrim Special Edition
- Skyrim Platform (Nexus #54909)
- Node.js 20+
- pnpm

## Install

```bash
pnpm install
```

## Build

```bash
pnpm build
```

## Dev

```bash
pnpm dev
```

Runs webpack in watch mode.

## Deploy

Copy `dist/skyguide.js` to `Data/Platform/Plugins/` in your Skyrim folder.
