import { Game } from "skyrimPlatform";
import type { LocationState } from "../types";

export function collectLocationState(): LocationState {
  const defaults: LocationState = {
    locationName: null,
    isInterior: false,
    cellName: null,
    worldspaceName: null
  };

  try {
    const player = Game.getPlayer();
    if (!player) {
      return defaults;
    }

    return {
      locationName: player.getCurrentLocation()?.getName() ?? null,
      isInterior: player.getParentCell()?.isInterior() ?? false,
      cellName: player.getParentCell()?.getName() ?? null,
      worldspaceName: player.getWorldSpace()?.getName() ?? null
    };
  } catch {
    return defaults;
  }
}
