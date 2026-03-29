import { Game, Utility, Weather } from "../../skyrimPlatform";
import type { EnvironmentState } from "../types";

export function collectEnvironmentState(): EnvironmentState {
  let gameTime = 0;
  try {
    gameTime = Utility.getCurrentGameTime();
  } catch {
    gameTime = 0;
  }

  let gameHour = 0;
  try {
    gameHour = ((gameTime * 24) % 24 + 24) % 24;
  } catch {
    gameHour = 0;
  }

  let cameraState = 0;
  try {
    cameraState = Game.getCameraState();
  } catch {
    cameraState = 0;
  }

  let weatherName: string | null = null;
  try {
    weatherName = Weather.getCurrentWeather()?.getName() ?? null;
  } catch {
    weatherName = null;
  }

  let sunPositionX: number | null = null;
  try {
    sunPositionX = Game.getSunPositionX();
  } catch {
    sunPositionX = null;
  }

  let sunPositionY: number | null = null;
  try {
    sunPositionY = Game.getSunPositionY();
  } catch {
    sunPositionY = null;
  }

  let sunPositionZ: number | null = null;
  try {
    sunPositionZ = Game.getSunPositionZ();
  } catch {
    sunPositionZ = null;
  }

  return {
    gameTime,
    gameHour,
    weatherName,
    cameraState,
    sunPositionX,
    sunPositionY,
    sunPositionZ
  };
}
