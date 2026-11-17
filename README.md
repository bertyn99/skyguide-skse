<p align="center">
  <img src="docs/branding/hero.jpg" alt="The Elder Scrolls V — SKYGUIDE" width="100%">
</p>

# SkyGuide SKSE

TypeScript [Skyrim Platform](https://www.nexusmods.com/skyrimspecialedition/mods/54909) plugin — the game-side half of **SkyGuide** (companion app: [skydive-app](https://github.com/bertyn99/skydive-app)).

It:

- **POSTs** protocol-v1 game state to `http://localhost:3000/api/game-state` (reflex rules, dashboard, **menu focus**).
- **Polls** `GET /api/actions?since=<id>` for executable commands from the companion outbox (`{ type, params, id }`).
- **Dumps** live mod context to `Data/Platform/SkyGuide/state.json` so Gate + Composer can read it through the file connector.
- **Reads ItemMenu focus** (inventory / magic / container / barter / gift) via `Ui.getString` and stages `data.menu` for the app to speak. No TTS in the plugin. Off when Skyrim Access is installed — see [docs/MENU-FOCUS.md](docs/MENU-FOCUS.md).

Hot-reload is built in: save the plugin, Alt-Tab back to Skyrim, and it reloads without restarting the game.

---

## Prerequisites

| What | Why |
|---|---|
| **Skyrim Special Edition** (Steam 1.6.1170 or 1.6.640) | Game. Skyrim Platform does **not** support the deprecated 1.5.97 branch for bug reports. |
| **SKSE64** | Skyrim Platform is an SKSE plugin. Without SKSE, nothing loads. |
| **Skyrim Platform** ([Nexus #54909](https://www.nexusmods.com/skyrimspecialedition/mods/54909)) | JS/TS plugin runner this mod targets (`@skyrim-platform/skyrim-platform` 2.9.0). |
| **Address Library for SKSE Plugins** | Required by almost every modern SKSE plugin, including Skyrim Platform. |
| **SSE Engine Fixes** ([Nexus #17230](https://www.nexusmods.com/skyrimspecialedition/mods/17230)) | Strongly recommended. Without it, the Chromium process (`SkyrimPlatformCEF.exe`) can hang after you quit. |
| **Node.js 20+** | To compile this plugin. |
| A **mod manager** (MO2 or Vortex) | For SKSE / Skyrim Platform / Address Library. |

Official docs this install follows:

- SKSE: <https://skse.silverlock.org/>
- Skyrim Platform README: <https://github.com/skyrim-multiplayer/skymp/blob/main/skyrim-platform/README.md>
- Plugin-author docs: <https://github.com/skyrim-multiplayer/skymp/blob/main/docs/docs_skyrim_platform.md>
- First-plugin walkthrough (hot reload, `skyrim.json`, `PluginsDev`): bundled as `Data/Platform/plugin-example` in the Nexus archive.

---

## 1. Install SKSE

Skyrim Platform cannot start without SKSE. The game must be launched through the SKSE loader, not the vanilla `SkyrimSE.exe`.

1. Check your game version (Steam → Skyrim SE → Properties → Installed Files → Browse, then look at `SkyrimSE.exe` properties, or the title-screen version string).
2. Download the matching **Current SE build** from <https://skse.silverlock.org/>.
3. Extract the archive into the Skyrim Special Edition folder (the one that contains `SkyrimSE.exe`). You should now have `skse64_loader.exe` next to it, plus `Data/Scripts` and `skse64_*.dll`.
4. **Always launch with `skse64_loader.exe`.**
   - Steam: add `skse64_loader.exe` as a non-Steam shortcut, or set a launch option through your mod manager.
   - Mod Organizer 2: add SKSE as an executable and run that (this is the usual setup).
   - Vortex: enable the SKSE tool and use **Start SKSE**.

If SKSE is installed, opening the in-game console (`~`) after a load shows an SKSE version line.

---

## 2. Install Skyrim Platform

1. Install **Address Library for SKSE Plugins** (Nexus) with your mod manager.
2. Install **Skyrim Platform** from [Nexus #54909](https://www.nexusmods.com/skyrimspecialedition/mods/54909) with the same manager.
3. Install **SSE Engine Fixes** (recommended).
4. Launch the game **via SKSE**. On the main menu, open `~`. You should see:

   ```
   Hello SE
   ```

   That line is Skyrim Platform confirming it loaded. If it is missing, SKSE or Skyrim Platform is not actually in the load path (common with MO2 if the mods are disabled, or if you launched vanilla `SkyrimSE.exe`).

Skyrim Platform loads `.js` files from (see `Data/SKSE/Plugins/SkyrimPlatform.ini`):

```
Data/Platform/Plugins
Data/Platform/PluginsDev
```

`PluginsDev` is the development drop folder (this repo's webpack deploy target). `Plugins` is for distributed/release copies. Changing either folder **hot-reloads every plugin** without restarting Skyrim.

---

## 3. Build and run this plugin

### Configure the Skyrim path

Edit `skyrim.json` (or set the `SKYRIMPATH` env var) so it points at **your** game folder:

```json
{
  "skyrimFolder": "C:/Program Files (x86)/Steam/steamapps/common/Skyrim Special Edition"
}
```

Use forward slashes. Under WSL, a Windows path still works; webpack maps it.

### Install and compile

```bash
npm install
```

One-shot compile + copy into `Data/Platform/PluginsDev`:

```bash
npm run webpack:deploy
```

Watch mode (recompile and copy on every save — this is the loop you want while the game is running):

```bash
npm run webpack:deploy:watch
```

(`npm run dev` is the same watch command plus an `npm i`.)

Webpack writes `build/skyguide-plugin.js` (the name comes from `"name"` in `package.json`) and copies it to:

```
[Skyrim folder]/Data/Platform/PluginsDev/skyguide-plugin.js
```

Do **not** copy the TypeScript sources or `dist/` leftovers. Only the bundled `build/skyguide-plugin.js` is loadable.

### In-game check

1. Start the companion app (`skydive-app`) on `http://localhost:3000`.
2. Launch Skyrim via SKSE, load a save (or `coc riverwood` from the main-menu console).
3. Open `~`. You should see:

   ```
   SkyGuide plugin loaded!
   ```

4. Type `skyguide` and press Enter. Status dump includes connection, polling, companion bridge, and the mod-context dump path.

The plugin hijacks the unused `GetAVInfo` console command and renames it `skyguide` for the session.

### Point the companion at the dump file

Gate + Composer do **not** read `POST /api/game-state`. They read the file dump. Set this in the companion app `.env` (already set to the `skyrim.json` game folder on this machine):

```bash
SKYRIM_CONTEXT_FILE_PATH="<Skyrim folder>/Data/Platform/SkyGuide/state.json"
```

Restart `pnpm dev` after changing it. Nitro should log `[skyrim-file] mod context: …state.json`.

Step-by-step load / dump / POST / actions / playtest checks: [docs/VALIDATION.md](docs/VALIDATION.md).
Menu dictation (who speaks, coexistence with Skyrim Access): [docs/MENU-FOCUS.md](docs/MENU-FOCUS.md).

---

## How it talks to the companion

```
Skyrim (this plugin)                         skydive-app (localhost:3000)
─────────────────────                        ────────────────────────────
POST /api/game-state     ── protocol v1 ──►  reflex + dashboard + menu TTS
GET  /api/actions?since=  ◄── {type,params,id} ──  composer / question outbox
fs  state.json           ── parseSkyrimState ►  Gate + Composer (+ inventory.* )
```

Action polling is on by default (`CONFIG.pollingEnabled`). The parser accepts both the outbox wrapper `{ type, params, id }` and a flat `{ type, ... }`. Unknown types are ignored.

The in-game CEF companion page (`CONFIG.bridgeEnabled`) is **off** until `/companion` exists in the app. Leave it false unless you are working on that overlay.

---

## Distribute

```bash
npm run zip
```

That packs `Platform/Plugins/<name>.js` into a zip you can drop on Nexus. End users still need SKSE + Skyrim Platform installed; they put the `.js` in `Data/Platform/Plugins` (not `PluginsDev`).

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| No `Hello SE` on the main menu | Skyrim Platform / SKSE not loaded. You launched `SkyrimSE.exe` instead of `skse64_loader.exe`, or the mods are disabled in MO2. |
| `Hello SE` but no `SkyGuide plugin loaded!` | The `.js` is not in `Plugins` / `PluginsDev`, or webpack failed. Check the watch terminal. |
| Plugin loads, companion never sees state | Companion not on `:3000`, or `SKYRIM_CONTEXT_FILE_PATH` still points at `./src/assets/state.json`. |
| Chromium process survives after quit | Install SSE Engine Fixes. |
| `skyguide` is not a console command | The hijack of `GetAVInfo` failed (logged). Try after a save is loaded, not on the main menu. |
| Actions never run | Parser whitelist missed the type, or the outbox `params` object was empty. Enable `CONFIG.debugMode`. |

More: [Skyrim Platform docs](https://github.com/skyrim-multiplayer/skymp/blob/main/docs/docs_skyrim_platform.md) · [Discord](https://discord.gg/P8yg7YKY2e)
