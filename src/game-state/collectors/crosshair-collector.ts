import { Game } from "../../skyrimPlatform";
import { PLAYER_FORM_ID } from "../../config";
import { CrosshairTarget } from "../types";

const FORM_TYPE_NAMES: Record<number, string> = {
  24: "Activator",
  26: "Flora",
  27: "Key",
  28: "Container",
  29: "Door",
  40: "Furniture",
  41: "Ingredient",
  42: "Apparatus",
  62: "NPC",
};

function mapFormType(typeId: number | null | undefined): string | null {
  if (typeId == null) {
    return null;
  }

  return FORM_TYPE_NAMES[typeId] ?? `FormType_${typeId}`;
}

export function collectCrosshairTarget(): CrosshairTarget | null {
  try {
    const ref = Game.getCurrentCrosshairRef();

    if (ref == null) {
      return null;
    }

    const formId = ref.getFormID();
    const baseObject = ref.getBaseObject();
    const typeId = baseObject?.getType();
    const type = mapFormType(typeId);

    let isOpen: number | null = null;

    if (typeId === 29) {
      try {
        isOpen = ref.getOpenState();
      } catch {
        isOpen = null;
      }
    }

    const name = ref.getDisplayName() ?? baseObject?.getName() ?? null;
    const distance = Game.getPlayer()?.getDistance(ref) ?? 0;

    if (formId === PLAYER_FORM_ID) {
      return null;
    }

    return {
      name,
      type,
      formId,
      distance,
      isOpen,
    };
  } catch {
    return null;
  }
}
