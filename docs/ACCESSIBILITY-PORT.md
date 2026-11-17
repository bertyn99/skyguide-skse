# What to port from Skyrim Access

Analysis of the reference accessibility mod, and which of its features we can
actually own in a Skyrim Platform (TypeScript) plugin.

Companion doc: `docs/ACCESSIBILITY.md` (what to install for players).

---

## 1. Where the code is

| Repo | Status |
| --- | --- |
| **https://gitlab.com/SkyrimAccessibilityProject/SkyrimAccessMod** | **Canonical.** ~580 commits, 53 tags, `main` + `dev`. v1.9.3 (Oct 2026). |
| `github.com/DioKyrie-Git/SkyrimAccessibility` | Deleted (404). Legacy Papyrus/C++ accessibility mod. |
| `github.com/DioKyrie-Git/SkyrimTTS` | Deleted (404). Legacy UI screen-reader mod. |
| `github.com/Ali-Bueno/SkyrimAccessibility` | Stale third-party fork of the legacy mod. |

Layout of the canonical repo:

```
src/            161 C++ files (plugin.cpp, menu_*.cpp, scanner_*.cpp, ...)
lib/prism/      speech backend (NVDA / Windows voice)
SkyrimData/     ESP + Papyrus sources + .wav + translations
Docs/UserDocs   the player manual (useful as behavioural spec)
CHANGELOG.md    76 KB — the best description of every feature and its rationale
CLAUDE.md       the architecture/speech rules (worth reading in full)
```

`CHANGELOG.md` + the file-header comments are unusually good documentation:
every module explains *why* the current design was chosen and which
alternatives failed in game. That is worth more to us than the code itself.

## 2. License reality check — read before copying anything

| Part | License |
| --- | --- |
| SKSE plugin (`src/`) | **GPL-3.0** |
| `accessibility.esp` + `Data/Scripts/` | custom, **non-commercial only**, no re-licensing, modifications for personal use |
| `Data/Sounds/` | **CC0 1.0** |

Our two repos have **no license file**, i.e. all rights reserved. Translating
their C++ file-by-file into our TypeScript would make our plugin a derivative
work of GPL-3.0 code and force GPL-3.0 on it.

So: **treat their repo as a specification, not as a source.** Everything below
is behaviour/algorithm/constant-level porting, re-implemented against the
Skyrim Platform API. The one thing we can copy outright is the **CC0 sounds**,
and even then only if we ship them.

The one place we should interoperate rather than copy is the **mod-event
contract** (`SkyrimNVDA_AutoWalkArrived`), which is an interface name, and
requires Skyrim Access to be installed anyway.

## 3. Architecture difference (why some things cannot be ported)

| | Skyrim Access | SkyGuide plugin |
| --- | --- | --- |
| Language | C++ / CommonLibSSE-NG | TypeScript / Skyrim Platform |
| Access | full `RE::` engine + vtable hooks + Havok | Papyrus API surface exposed by SP |
| Speech | Prism → NVDA/JAWS/ZAPI in-process | the app (TTS providers) out-of-process |
| Menus | GFx reads + per-menu polling | only `Ui.isMenuOpen` / `Ui.getString` |
| Distribution | ESP + DLL + Papyrus + assets | single `.js` file |

Consequence: their **menu narration** (the largest part of the mod: ~40
`menu_*.cpp` files) is not portable and not worth porting — we already decided
Skyrim Access owns that channel. Their **world-facing** features mostly are
portable, because they sit on Papyrus-level APIs that SP also exposes.

## 4. Portable / not portable, by module

| Their module | What it needs | Verdict for us |
| --- | --- | --- |
| `scanner_*.cpp` | cell ref enumeration, FormType, names, positions | **Portable** — we already do `Cell.getNumRefs/getNthRef` in `nearby-collector.ts` |
| `ambient_radar.cpp` | 3D sound descriptors bound to refs | **Portable** with our own descriptors, or reusing theirs when installed |
| `scanner_speech.cpp` | distance/direction phrasing | **Portable** — pure math + strings |
| `loot_tracker.cpp` | container/corpse "already searched" memory | **Portable** — `containerChanged`/menu events + our state dump |
| `blocked_stop.cpp` | movement input + position delta | **Portable** — `Input.isKeyPressed` + positions |
| `camera_rotate.cpp` | heading/pitch setters | **Mostly portable** (`setAngle` is async) |
| `menu_hud.cpp` (vitals, active effects) | `H` / `Shift+H` announcements | **Portable** — we already dump vitals; add active effects |
| `autowalk.cpp` + `SkyrimAccess_AutoWalk.psc` | Travel package through a quest alias | **Not portable without an ESP** (see §5.7) |
| `wall_sound.cpp` | 16 Havok raycasts per tick + looping NiNode emitters | **Not portable** in SP (no physics raycast) |
| `scanner_aim.cpp`, `scanner_bow_aim.cpp`, `scanner_lockon.cpp` | `AimAtPosition`, ballistic solve, engine aim | **Not portable** (needs direct actor aiming) |
| `menu_*.cpp` (40 files) | GFx reads, vtable hooks | Not worth it — Skyrim Access owns it |
| `Marketplace/`, `menu_creations.cpp` | native memory patching | Out of scope |

## 5. The seven things they do better, and how we'd port them

### 5.1 Object scanner — our biggest gap

**Theirs.** One sweep of the loaded cell(s) builds a list of `ScannedObject`
(name, FormID, position, distance, `zDiff`, category, flags), sorted by
distance, kept until the player moves **100 units** (`RESCAN_DISTANCE`). Ten
categories — All, NPCs, Doors, Containers, Items, Activators, Corpses,
Companions, Quests, Locations — with per-category sub-filters (containers:
empty/non-empty; doors: locked/cell doors; corpses: looted/unlooted;
activators: crafting/other). Announcements read like:

```
Iron Sword, 34 meters, above, 3 of 12
Chest, locked, empty, northwest
Corpse Bandit, looted, 12 meters
```

Keys: Numpad5 scan, PgUp/PgDn object, Shift+PgUp/PgDn category, End
sub-category, Home repeat, G remote-activate, Alt+Home teleport, Shift+F follow.

**Ours.** We only know NPCs (`collectNearbyNpcs`) and the crosshair target.
The companion can be told about a door or a chest only if the player points at
it — which is exactly what a blind player cannot do.

**Port.** Generalise `nearby-collector.ts` into a `world/scanner.ts`:

```ts
cell.getNumRefs(0)                       // 0 = every form type
cell.getNthRef(i, 0) → ObjectReference
ref.getBaseObject() → Form
form.getType() → FormType (Activator, Door, Container, Weapon, ...)
ref.getDisplayName() ?? base.getName()
ref.isDisabled() | ref.isDeleted()       // skip
ref.isLocked() / ref.getLockLevel()
ref.getNumItems()                        // containers: empty?
```

Sweep on demand (`scan` action) and cache for 100 units of movement, exactly
like theirs. Emit the list into the mod-context dump (`world.objects.*`
parallel arrays, matching the existing `npcs.*` shape) so the app can answer
"where is the nearest chest" without a round trip.

Effort: ~1 day. Risk: low. Value: very high — it is the difference between
"the app describes NPCs" and "the app describes the world".

### 5.2 Object state flags — cheap, high perceived intelligence

**Theirs.** `locked`, `empty`, `looted`, `read`, `harvested`, `Corpse` prefix,
"to <destination>" for doors, destructible label + remaining %, `above`/`below`
beyond **256 units**.

**Ours.** `npcs.name` + distance only.

**Port.** All of these are one-liners on the reference/base form; the only
non-trivial one is `looted` (see 5.3) and `read` (`Book` has no `IsRead` in SP,
so track it from the `open`/book menu event instead).

Effort: ~3 h. Value: high — "empty" and "locked" change whether the player
walks there at all.

### 5.3 Loot tracker — cross-session memory

**Theirs.** On `ContainerMenu` open, store `formID → gameHours`. Clear on
`TESResetEvent`; fall back to "assume respawned after 720 in-game hours (30
days)". Persistent/player-owned containers are never expired. Persisted in the
SKSE cosave.

**Ours.** Nothing. The app re-reports the same chest every time.

**Port.** We already receive `containerChanged` and `menuOpen`. Keep a map in
the plugin and also write it to `state.json` so the app keeps it across game
sessions (we have no cosave). `Utility.getCurrentGameTime()` gives the clock for
the 30-day rule.

Effort: ~4 h. Value: medium-high.

### 5.4 Speech arbitration — they solved a problem we have not hit yet

**Theirs** (documented in `CLAUDE.md`, enforced by a review agent):

- `Speak()` = cancel + say → **navigation** ("Iron Sword, 34 meters").
- `SpeakQueue()` = append → **secondary** info (description, effects).
- `firstRead` pattern: the first item after a menu opens must be queued, or it
  cuts the "Inventory open" announcement.
- Flood protection: one read in flight (`std::atomic_bool pendingRead`), so a
  held key never stacks announcements.
- Suspension: no speech while a managed menu is open, while the console is
  open, and stealth announcements pause during crafting.
- No logging inside an 80 ms polling loop.

**Ours (landed).** Fast-lane `ui.menuOpen` / `ui.consoleOpen`, app
`speech-arbiter.ts` (`cancel` / `queue` / `menu`), and ItemMenu dictation
via `Ui.getString` ([MENU-FOCUS.md](MENU-FOCUS.md)). Console drops every
channel. `queue` is silent while a gameplay menu is open. When Access is
installed we do not stage `data.menu`.

Remaining: journal/map/lockpick still need Access (not portable).

### 5.5 Stuck detection — we have the field, hardcoded to 0

**Theirs.** 3-state machine driven by the wall-sound tick (~150 ms): movement
input held, position delta below threshold, ~0.5 s of confirmation; then it
*neutralises the input events* so the running-in-place animation stops. Never
fires while jumping, swimming, mounted, in a menu, or during autowalk.

**Ours.** `mod-context.ts` writes `"player.is_stuck": 0`.

**Port.** We cannot suppress the input (that needs the ProcessEvent hook), but
we can detect and report:

```
Input.isKeyPressed(DxScanCode.W | A | S | D)
  && |pos - lastPos| < ~8 units over ~1.2 s
  && !isInMenuMode() && !isSwimming && !isDead
```

Then the app can say "you are against something; turn left". That alone fixes
the most common blind-navigation failure.

Effort: ~3 h. Value: high.

### 5.6 Tuning constants worth stealing outright

Numbers are facts, not copyrightable, and these were arrived at by in-game
testing:

| Constant | Value | Meaning |
| --- | --- | --- |
| `RESCAN_DISTANCE` | 100 units | re-sweep the cell after moving this far |
| radar radius | 1500 units (~21 m) | ambient cue range |
| radar cadence | 2500 ms | one sweep every 2.5 s |
| radar objects/cycle | 8 | nearest first, one cue per frame |
| units per metre | 70 | we already use this in `mod-context.ts` |
| `above`/`below` | ±256 units | altitude threshold |
| cardinal sectors | 8 × 45°, offset 22.5° | `atan2(dx, dy)` from +Y = north |
| looted expiry | 720 in-game hours | 30-day respawn assumption |
| blocked-stop confirm | ~0.5 s | before declaring stuck |
| distance phrasing | round to nearest m; cm under 0.5 m | avoids "0 meters" |

Note their direction is **absolute** (compass), not "left of you" — cheaper to
compute and it composes with the player's own heading we already dump.

### 5.7 Autowalk — the one feature worth an ESP

**Theirs.** The C++ side never moves the player. It dispatches to a Papyrus
quest (`SkyrimAccess_AutoWalkQuest`, FormID 0x800) with a `Travel` package on a
`Traveler` alias and a `DstMarker` alias, then `Game.SetPlayerAIDriven(true)`.
The engine pathfinds, including through doors and across worldspaces. Arrival
is signalled by the mod event `SkyrimNVDA_AutoWalkArrived`, not polled.
Stop distance 100 units (+20 in the script); follow mode re-engages beyond 250
units; any movement key cancels.

**Ours.** `move` is a teleport (`setPosition`), `face` sets the angle. There is
no pathfinding.

**Port options, in order of preference:**

1. **Ship a tiny ESP of our own** with a quest + `Travel` package + script,
   driven from JS via `sendModEvent`/`on("modEvent")` (both exist in SP; the
   event carries `{eventName, strArg, numArg}`, so the target FormID and stop
   distance can be passed in `numArg`/`strArg`). This is the honest port and it
   also gives us the mod-event channel for everything else.
2. **Reuse Skyrim Access's quest when it is installed** — we would still need
   to call `OnWalkToTarget`, which needs `DispatchMethodCall`; SP cannot call
   Papyrus functions. Not viable.
3. **Do nothing, keep teleport** — acceptable as an accessibility crutch (their
   mod also offers a teleport fallback), but it breaks immersion and can drop
   the player through geometry.

Effort: option 1 is ~2 days (ESP authoring + VMAD + script + JS bridge) and is
the largest single lift here. Value: highest of all — "walk to the quest
marker" is the core loop for a blind player.

### 5.8 Things we already do, that they do not

Worth stating so we do not over-port:

- **Out-of-process TTS** with multiple providers — they are limited to
  Prism/NVDA and the Windows voice.
- **Two-way protocol**: we can *command* the game (`activate`, `equip`,
  `fastTravel`, `heal`), they only announce. Their remote-activate is the same
  idea, but ours is driven by an LLM that can decide.
- **A screen-reader-independent consumer**: `state.json` is readable by any
  tool, not just in-game speech.
- **Quest/mod context dump** in a stable schema for an external agent.

## 6. Proposed order of work

**Sprint A — perception (highest value per hour)**

1. `world/scanner.ts`: cell sweep, 10 categories, 100-unit cache — ~1 day.
2. Object flags: locked/empty/read/harvested/corpse/door destination — ~3 h.
3. Extend the dump: `world.objects.*` parallel arrays + `ui.menu_open` /
   `ui.console_open` — ~3 h.
4. `player.is_stuck` for real — ~3 h.

**Sprint B — conversation quality**

5. `speech` hints in the dump (cancel/queue/silence) + app-side arbitration —
   ~2 h plugin, ~half day app.
6. Loot tracker with the 30-day expiry, persisted through the dump — ~4 h.
7. Active effects + on-demand vitals (`getVitals` action) — ~3 h.

**Sprint C — audio-only navigation**

8. Ambient radar: per-type cues, 1500 units / 2500 ms / 8 per sweep. Needs
   descriptors: either ship our own mono 3D `SoundDescriptor` forms (ESP) or
   reuse `SkyrimAccess.esp`'s (detect with
   `Game.getFormFromFile(0x13A6BD, "SkyrimAccess.esp")`) — ~1–2 days.
9. Autowalk via our own ESP + mod events — ~2 days.
10. Camera rotation on arrow keys (`Input.isKeyPressed` + `setAngle`) — ~4 h,
    but only if we do not collide with Skyrim Access's own arrow-key camera.

## 7. Explicit non-goals

- Re-implementing the **full** 40-module GFx menu suite (journal, map,
  lockpick, HUD, translations): Skyrim Access does that. We only dictate
  the ItemMenu family when Access is absent (`Ui.getString` probe tables).
- Wall hum: needs Havok raycasts, which Skyrim Platform does not expose.
- Bow auto-aim / enemy lock-on: needs direct actor aiming; also a balance
  decision we should not take silently for the player.
- Creations/Bethesda.net/marketplace narration.
- Copying GPL-3.0 C++ into our TypeScript.

## 8. Interop notes

- **Mod events** work in both directions: `on("modEvent")` / `sendModEvent`.
  This is our channel to any Papyrus we ship, and to Skyrim Access's
  `SkyrimNVDA_AutoWalkArrived`.
- **Key conflicts**: their scanner owns Numpad5, PgUp/PgDn, Home/End, G, O,
  Shift+F, X, L, F, Alt+End. Any hotkey we invent should come from the app
  (`state.json`-driven) or be rebindable, never hardcoded into that set.
- **Their ESP is detectable**: `Game.getFormFromFile(<localID>, "SkyrimAccess.esp")`
  returning non-null means we can safely delegate HUD/menu talk and reuse their
  radar descriptors.
- **Their sounds are CC0**, so if we build the radar before shipping our own
  ESP, borrowing the `.wav` files is legitimate.
