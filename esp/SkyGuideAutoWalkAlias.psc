; Sits on the Traveler alias (player) so save loads reach the quest:
; ReferenceAlias.OnPlayerLoadGame is the reliable post-load hook (the quest's
; own OnInit does not re-run for a running quest, and mod-event registrations
; are wiped by the load).
ScriptName SkyGuideAutoWalkAlias Extends ReferenceAlias

Event OnPlayerLoadGame()
	Quest ownerQuest = GetOwningQuest()
	if ownerQuest != None
		SkyGuideAutoWalk questScript = ownerQuest as SkyGuideAutoWalk
		if questScript != None
			questScript.ReRegister()
		endIf
	endIf
EndEvent
