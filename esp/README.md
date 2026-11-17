# SkyGuide.esp — W6 autowalk (hand-built, no Creation Kit)

The ESP **and** the compiled scripts are now built from this repo on the WSL
side — no Creation Kit, no Papyrus compiler on the machine.

## Artifacts (installed in the MO2 instance)

```
MO2-instance/mods/SkyGuide/
├─ SkyGuide.esp                    ← built by tools/build-esp.py (TES4+QUST+PACK)
└─ Scripts/
   ├─ SkyGuideAutoWalk.pex         ← compiled by Caprica from esp/*.psc
   └─ SkyGuideAutoWalkAlias.pex
```

## Rebuild steps

1. **ESP** — `python3 tools/build-esp.py <out.esp>`. Every binary structure was
   extracted as ground truth from the local `Skyrim.esm` (header format = the
   24-byte-record variant this 1.6.1170 install writes); the script parse-back
   validates the output.
2. **Papyrus** — Windows side (WSL-accessible at
   `C:\Users\berty\AppData\Local\Temp\caprica\`):
   - `Caprica.exe` (Orvid/Caprica v0.3.0) + `bsarch.exe` (from Pyro) — both
     already downloaded there.
   - The vanilla `Data/Scripts/Source` set is partial; compile-time stubs for
     the missing base classes (`ReferenceAlias`, `GlobalVariable`,
     `Projectile`, `Scene`, `Key`, `VoiceType`, `WorldSpace`,
     `LocationRefType`, `EncounterZone`, `ImpactDataSet`, `Topic`,
     `ImageSpaceModifier`, `WordOfPower`) live in that temp dir, with exact
     native signatures. Runtime uses the REAL vanilla pex from
     `Skyrim - Misc.bsa` (already extracted to `...\caprica\misc\scripts`).
   - Build command (`caprica\compile.bat`):
     ```
     Caprica.exe -g skyrim -i source -i ..\misc\scripts -f skyrim.flags -r
       -o output SkyGuideAutoWalk.psc SkyGuideAutoWalkAlias.psc
     ```
   - Ship the `.pex`, never the `.psc` (D9).

## ESP contents (form IDs 0x800/0x801)

| Record | Contents |
|---|---|
| QUST `SkyGuideAutoWalkQuest` | Start game enabled, VMAD: `SkyGuideAutoWalk` (prop `WalkTarget` → alias 1) + alias script `SkyGuideAutoWalkAlias` on alias 0 |
| alias 0 `Traveler` | PlayerRef, carries package 0x801 (ALPC), alias script for save-load re-register |
| alias 1 `WalkTarget` | Optional, no fill — `ForceRefTo`'d per walk, `Clear()`'d on arrival/cancel |
| PACK `SkyGuideTravelPackage` | Type 18 (Travel), PTDA type 4 (Ref Alias → alias 1), stop radius 100, empty procedure tree (default Travel behavior), QNAM → 0x800 |

## Contract (from the JS side — do not rename)

| Mod event | Direction | Payload |
|---|---|---|
| `SkyGuide_AutoWalkReady` | ESP → JS | empty — **sender = the quest form itself**; JS stores it (no form-ID hardcoding) |
| `SkyGuide_AutoWalkCmd` | JS → ESP | `strArg` = `{"f":"<hex formId>","d":<stop>}` |
| `SkyGuide_AutoWalkAck` | ESP → JS | empty — JS clears its 2s timeout |
| `SkyGuide_AutoWalkArrived` | ESP → JS | empty — JS flips `navigation.status` |
| `SkyGuide_AutoWalkCancelled` / `SkyGuide_AutoWalkFailed` | ESP → JS | short reason tag |

Names are deliberately unique (never share Skyrim Access's `SkyrimNVDA_*`).

## In-game verification (the §4 probe)

- With `CONFIG.debugMode`: at game launch the SP log should pair the ESP's
  Ready send with `[autowalk] ESP ready — quest stored (ok)`.
- **SendModEvent delivery**: Papyrus must receive the JS `sendModEvent`
  (mechanism verified in the skymp sources; this checks the ESP wiring).
- Run any `autowalkTo` action: request → ack → walking → arrival flips
  `navigation.status` and the app announces "Arrivé.".
- WASD cancels mid-walk; save + reload mid-walk restores player control
  (alias script's `OnPlayerLoadGame` + the JS load/hot-reload guards).

## Deliberate limitations

- One walk at a time (a second `autowalkTo` while walking is rejected by the
  transition table).
- Cross-worldspace walks depend on engine Travel behavior — best-effort.
- The hex parser in Papyrus is naive but total (returns 0 on deviation →
  `SkyGuide_AutoWalkFailed`; JS fails the action after 2s without an Ack).
- If the ESP's VMAD script fails to load (missing `.pex`), the quest still
  runs silently and the JS side fails autowalk cleanly ("not Ready").
