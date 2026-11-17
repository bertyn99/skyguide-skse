# Accessibility mods for SkyGuide

SkyGuide speaks *tactical* information (where the enemy is, what is around you,
what to press) and, when Skyrim Access is **not** installed, the **focused
row** of the ItemMenu family (inventory, magic, container, barter, gift).
Journal, map, lockpicking, HUD and the rest of the Scaleform UI are still
outside what Skyrim Platform can read well — that gap is Skyrim Access + NVDA.

The mods below fill that remaining gap. They are ordered by impact for a blind
or low-vision player, with the assumption that SkyGuide keeps doing the
tactical callouts (and ItemMenu dictation if Access is absent).

> Compatibility baseline: Skyrim SE/AE 1.6.1170 with SKSE 2.2.8 — the exact
> stack this repo targets. Every mod listed is a regular mod (ESP/ESL/loose
> files) unless marked *SKSE plugin*.

---

## 1. Foundation — required

### Skyrim Access (Nexus 181131)

The single most important install. It is the merged successor of *Dio Kyrie's
Skyrim Accessibility* and provides one object scanner instead of two parallel
ones.

What it gives:

- **Menu narration** via [Prism](https://github.com/ethindp/prism): inventory,
  magic, journal, map, barter, lockpicking, container, crafting.
- **HUD + subtitle + stealth-state readout**, so sneak detection is audible.
- **Object scanner** — cycles nearby objects and announces name, distance and
  direction.
- **3D ambient sound radar** and **wall hum**: continuous spatialised cues for
  geometry around the player. This is what makes navigation possible without
  sight.
- **Autowalk, beacon, NPC follow** — set a target, the mod walks you there.
- **Scripted Helgen walkthrough** for the opening sequence, which is otherwise
  almost impossible to do blind.

Requirements:

- **SkyUI** (hard dependency, and it is the menu layer the narration reads).
- **Prism** (the accessibility provider; ships with the mod).
- A **screen reader** — NVDA is the reference setup; JAWS, ZoomText and the
  Windows SAPI voice are also supported. NVDA is free and works well here.
- SKSE 2.2.x and a game version it lists as supported (1.6.1170 is listed).

Install notes for this machine:

- Install through MO2 like a normal mod. It is an SKSE plugin, so Smart App
  Control must stay **off** — otherwise the DLL is blocked with error 4551,
  exactly like `SkyrimPlatformImpl.dll` was.
- Prism needs to reach the screen reader; run the game as the same user that
  runs NVDA, and do not launch Skyrim elevated.
- Enable `bAlwaysActive` (SkyGuide already sets it) so the game keeps running
  when the player tabs out to NVDA or to the companion app.

### SkyUI

Not optional: Skyrim Access narrates SkyUI's menus. Also improves every menu
for low-vision players (searchable inventory, sortable lists, bigger hit
targets).

---

## 2. UI plumbing — removes the remaining dead ends

These are small and each one removes a place where a keyboard/screen-reader
user gets stuck:

| Mod | Why it matters |
| --- | --- |
| **UIExtensions** | Some Skyrim Access panels and third-party menus need it; also required by many QoL mods. |
| **Better MessageBox Controls** | Makes the Yes/No dialogs keyboard-navigable with visible/audible focus. Directly relevant: the "missing plugins" dialog that blocked the save load. |
| **Stay At The System Page** | Skips the main-menu news/creations carousel; the player lands on a stable, predictable menu. |
| **Media Keys Fix** | Stops Skyrim from swallowing media keys, so the screen reader's own hotkeys keep working while the game has focus. |
| **Dylbills Papyrus Functions** | Utility library several accessibility and HUD mods depend on; install if a dependent mod asks. |

---

## 3. Audio clarity — makes SkyGuide's own cues usable

SkyGuide's tactical TTS is only as good as the player's ability to hear it over
the mix. These improve source separation without changing gameplay:

| Mod | Why it matters |
| --- | --- |
| **Audio Overhaul Skyrim SE** | Rebalances the whole mix: quieter ambient beds, clearer footsteps and combat tells. The single biggest quality-of-life gain for audio-only play. |
| **NPC Dialogue Audio Enhancer** | Normalises and clarifies NPC voice lines; important because dialogue is the main quest-delivery channel. |
| **Audible NPCDialogues** | Extends the range at which NPC chatter is audible — the "what is being said around me" channel. Also supplies `AudibleNPCDialogues.esp`, one of the plugins the broken save was missing. |
| **Sound Sight** (Nexus 193073) | Audio-first environmental cueing. Complementary to Skyrim Access's radar; test for overlap before enabling both. |
| **Silent UI** | Removes menu blips and clicks that mask the screen reader. |
| **Silent Heartbeat** | Removes the low-health heartbeat loop, which sits in the same band as speech. |
| **Motion Sensitive Fix SE** | Fixes high-frequency camera/head-bob artefacts that cause discomfort and mask spatial cues. |
| **Misophonia Sounds Replacer** | Optional: replaces trigger sounds (eating, drinking, some loops) that are genuinely painful for some players. |

---

## 4. Role split with SkyGuide — avoid double-speaking

Two narration systems on one audio channel is worse than one. Suggested split:

| Channel | Owner |
| --- | --- |
| Journal, map, lockpicking, HUD, full 40-menu GFx reader | **Skyrim Access** (when installed) |
| ItemMenu focus (inventory / magic / container / barter / gift) | **SkyGuide** if Access is absent; **Access** if `SkyrimAccess.esp` is loaded |
| Subtitles, stealth state, object scanner, ambient radar, wall hum | **Skyrim Access** |
| Enemy position/threat callouts, "what to press now", mission coaching, companion replies | **SkyGuide** |
| Quest text read aloud | SkyGuide (it is text the app already has) |

Practical consequences for our plugin:

- Detect Access (`isSkyrimAccessInstalled`) and **do not** stage `data.menu` when they own the channel — see [MENU-FOCUS.md](MENU-FOCUS.md).
- Do **not** add HUD narration to SkyGuide; it would duplicate Skyrim Access.
- Keep SkyGuide's world lines **short and interruptible**. The app speech arbiter drops the `queue` channel while `ui.menuOpen`; the `menu` channel is allowed; console drops everything.
- The object scan and the tactical callout should not fire at the same time.
  Skyrim Access's radar is continuous, so SkyGuide's spatial cues should be
  *events*, not a stream.

---

## 5. What is still missing (worth building)

- **Journal / map / lockpick narration** without Access — not portable in
  Skyrim Platform (needs GFx object walks). ItemMenu dictation is done;
  do not grow this into a 40-menu clone.
- **Focus target name in the dump.** Crosshair collector exists; a dedicated
  “what am I looking at” reflex is still thin compared to Access’s scanner.
- **Haptic/audio ack for commands.** When the app sends an action, the plugin
  applies it silently. A short cue would confirm the command landed.

---

## 6. Install order (this machine)

1. SkyUI (MO2, normal mod).
2. Prism + Skyrim Access (MO2). Confirm `Skyrim Access` DLL appears in
   `skse64.log` without error 4551.
3. UIExtensions, Better MessageBox Controls, Stay At The System Page,
   Media Keys Fix.
4. Audio Overhaul Skyrim SE, NPC Dialogue Audio Enhancer, Audible NPCDialogues.
5. Launch, load a save, then check the console for
   `SkyGuide plugin loaded!` and confirm Skyrim Access is narrating the
   inventory when you press `I`.
6. If two voices talk at once, adjust the role split above rather than
   disabling either mod.
