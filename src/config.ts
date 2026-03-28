// @env node
// NOTE: For production, consider reading from Skyrim Platform settings:
//   import { settings } from "skyrimPlatform";
//   const debugMode = settings["skyguide"]?.["debugMode"] === "true";
export const PLAYER_FORM_ID = 0x14;

export const CONFIG = {
  serverUrl: "http://localhost:3000",
  tickInterval: 500,
  enemyScanRadius: 5000,
  maxEnemies: 10,
  debugMode: false,
} as const;
