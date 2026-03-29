import { Game } from "../../skyrimPlatform";
import type { Quest } from "../../skyrimPlatform";
import type { QuestState } from "../types";

export function collectQuestState(): QuestState | null {
  try {
    const quest = (Game as unknown as { getQuest: (editorId: string) => Quest | null }).getQuest("MQ101");
    if (!quest) {
      return null;
    }

    const objectives: QuestState["objectives"] = [];

    for (let i = 0; i <= 10; i += 1) {
      const displayed = quest.isObjectiveDisplayed(i);
      if (!displayed) {
        continue;
      }

      objectives.push({
        index: i,
        displayed,
        completed: quest.isObjectiveCompleted(i)
      });
    }

    const questWithEditorId = quest as Quest & { getEditorId?: () => string | null };

    return {
      questName: quest.getName() ?? null,
      editorId: typeof questWithEditorId.getEditorId === "function" ? questWithEditorId.getEditorId() ?? null : null,
      currentStage: quest.getCurrentStageID(),
      objectives
    };
  } catch {
    return null;
  }
}
