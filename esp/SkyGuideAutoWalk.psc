; SkyGuideAutoWalk.psc — the ESP side of the W6 autowalk handshake.
; Matched 1:1 to the hand-built SkyGuide.esp (tools/build-esp.py):
;   quest SkyGuideAutoWalkQuest (0x800), start-game-enabled
;   alias 0 "Traveler"   = PlayerRef, carries SkyGuideTravelPackage
;   alias 1 "WalkTarget" = optional, no fill — ForceRefTo'd per walk
;   package walks the Traveler to the WalkTarget alias (PTDA type 4),
;   stop radius 100 units (Float entry; same constant below).
;
; Contract (verified against the skymp sources; see plan W6 evidence):
;   JS:  questRef.sendModEvent("SkyGuide_AutoWalkCmd", <json>, 0)
;   Papyrus callback signature: (string strArg, float numArg) — NO
;   eventName/sender params. Unique event names — never share Skyrim
;   Access's.
;
; Quest is start-game-enabled: OnInit fires once at game launch and sends
; SkyGuide_AutoWalkReady (sender = this quest — JS needs no form ID). Save
; loads wipe mod-event registrations: the Traveler alias script calls
; ReRegister() via OnPlayerLoadGame.
;
; Payload JSON: {"f": "<hex formId>", "d": <stop distance>} — numArg is
; float32 and would corrupt dynamic formIds (>= 0xFF000000).

ScriptName SkyGuideAutoWalk Extends Quest

; Bound in the ESP's VMAD to alias 1. We ForceRefTo it per walk and Clear()
; on arrival/cancel — an unfilled optional alias keeps the package idle.
ReferenceAlias Property WalkTarget Auto

float Property StopDistance = 100.0 Auto

bool walking = false
ObjectReference targetRef = None

Event OnInit()
	ReRegister()
EndEvent

Function ReRegister()
	RegisterForModEvent("SkyGuide_AutoWalkCmd", "OnAutowalkCmd")
	RegisterForModEvent("SkyGuide_AutoWalkCancel", "OnAutowalkCancel")
	; SendModEvent on THIS quest: sender = our quest form. JS stores the
	; reference and answers with the Cmd event.
	SendModEvent("SkyGuide_AutoWalkReady", "", 0.0)
EndFunction

Event OnAutowalkCmd(string strArg, float numArg)
	ObjectReference target = ResolveTarget(strArg)
	if target == None
		SendModEvent("SkyGuide_AutoWalkFailed", "resolve", 0.0)
		return
	endIf
	targetRef = target
	WalkTarget.ForceRefTo(target)
	Game.SetPlayerAIDriven(true)
	walking = true
	ObjectReference playerRef = Game.GetPlayer()
	playerRef.EvaluatePackage()
	SendAckEvent()
	RegisterForSingleUpdate(0.25)
EndEvent

Event OnAutowalkCancel(string strArg, float numArg)
	StopWalk()
	SendModEvent("SkyGuide_AutoWalkCancelled", "", 0.0)
EndEvent

Event OnUpdate()
	if !walking
		return
	endIf
	ObjectReference playerRef = Game.GetPlayer()
	if targetRef == None
		StopWalk()
		SendModEvent("SkyGuide_AutoWalkFailed", "refs", 0.0)
		return
	endIf
	float dist = playerRef.GetDistance(targetRef)
	if dist <= StopDistance
		StopWalk()
		SendModEvent("SkyGuide_AutoWalkArrived", "", 0.0)
		return
	endIf
	RegisterForSingleUpdate(0.25)
EndEvent

; Safety net: save was (re)loaded mid-walk — drop control immediately.
; (Registrations are re-established by the alias script right after this.)
Event OnPlayerLoadGame()
	if walking
		StopWalk()
		SendModEvent("SkyGuide_AutoWalkFailed", "load", 0.0)
	endIf
EndEvent

Function StopWalk()
	walking = false
	targetRef = None
	WalkTarget.Clear()
	Game.SetPlayerAIDriven(false)
	ObjectReference playerRef = Game.GetPlayer()
	playerRef.EvaluatePackage()
	RegisterForSingleUpdate(0) ; cancel pending update
EndFunction

ObjectReference Function ResolveTarget(string strArg)
	int formId = ParseHexFormId(strArg)
	if formId <= 0
		return None
	endIf
	return Game.GetFormEx(formId) as ObjectReference
EndFunction

; {"f":"<hex>","d":<stop>} — string parsing only (Papyrus has no JSON).
int Function ParseHexFormId(string strArg)
	int fIndex = StringUtil.Find(strArg, "\"f\"")
	if fIndex < 0
		return 0
	endIf
	int quoteOpen = StringUtil.Find(strArg, "\"", fIndex + 3)
	if quoteOpen < 0
		return 0
	endIf
	int quoteClose = StringUtil.Find(strArg, "\"", quoteOpen + 1)
	if quoteClose < 0
		return 0
	endIf
	string hex = StringUtil.Substring(strArg, quoteOpen + 1, quoteClose - quoteOpen - 1)
	int value = 0
	int i = 0
	while i < StringUtil.GetLength(hex)
		string c = StringUtil.GetNthChar(hex, i)
		int digit = HexDigitValue(c)
		if digit < 0
			return 0
		endIf
		value = value * 16 + digit
		i += 1
	endWhile
	return value
EndFunction

int Function HexDigitValue(string c)
	if c == "0"
		return 0
	elseIf c == "1"
		return 1
	elseIf c == "2"
		return 2
	elseIf c == "3"
		return 3
	elseIf c == "4"
		return 4
	elseIf c == "5"
		return 5
	elseIf c == "6"
		return 6
	elseIf c == "7"
		return 7
	elseIf c == "8"
		return 8
	elseIf c == "9"
		return 9
	elseIf c == "a" || c == "A"
		return 10
	elseIf c == "b" || c == "B"
		return 11
	elseIf c == "c" || c == "C"
		return 12
	elseIf c == "d" || c == "D"
		return 13
	elseIf c == "e" || c == "E"
		return 14
	elseIf c == "f" || c == "F"
		return 15
	endIf
	return -1
EndFunction

Function SendAckEvent()
	SendModEvent("SkyGuide_AutoWalkAck", "", 0.0)
EndFunction
