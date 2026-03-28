# Draft: SkyGuide Blind Accessibility Companion

## Requirements (confirmed)
- Expand skyguide-skse plugin from one-way state reporter to bidirectional accessibility companion
- Companion acts as narrator/guide for blind players
- Reads game state, narrates surroundings, helps navigate and perform actions
- Uses Skyrim Platform APIs (exhaustively documented in research phase)

## Technical Decisions
- Build tool: tsdown (already migrated)
- Linter: oxlint (already configured)
- Outbound: HTTP POST to companion app (already works)
- Inbound: TBD (WebSocket vs HTTP polling)

## Research Findings
- 200+ Actor/ObjectReference/Game APIs available
- 90+ subscribable events (currently using 4)
- CEF browser available in-game via browser.loadUrl()
- Input simulation via Input.tapKey/holdKey/releaseKey
- Console commands accessible via findConsoleCommand
- Sound playback via Sound.from(form)?.play(actor)
- Text overlays via createText/setTextString
- Debug.notification and Debug.messageBox for on-screen messages
- No existing Skyrim blind accessibility mod exists (gap confirmed)

## Open Questions
- Companion app tech and platform
- Inbound communication method
- TTS responsibility (game vs companion)
- MVP scope vs full vision
- Priority ordering

## Scope Boundaries
- INCLUDE: Expanded data collection, inbound action system, narration support
- EXCLUDE: Actual TTS implementation (companion app concern), voice recognition
