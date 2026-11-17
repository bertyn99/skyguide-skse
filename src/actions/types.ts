export type ActivateTarget =
  | "crosshair"
  | "nearestNPC"
  | "nearestDoor"
  | "nearestContainer";

export type ActionCommand =
  | { type: "move"; x: number; y: number; z: number }
  | { type: "face"; angle: number }
  /** Legacy shape — resolved in-game from the player's surroundings. */
  | { type: "activate"; target: ActivateTarget }
  /** W4: LLM-driven targeting against the scanner cache (validated in the executor). */
  | { type: "activate"; formId: number }
  | { type: "fastTravel"; location: string }
  | { type: "drawWeapon" }
  | { type: "sheatheWeapon" }
  | { type: "attack" }
  | { type: "block" }
  | { type: "equip"; itemName: string }
  | { type: "useItem"; itemName: string }
  | { type: "heal"; amount: number }
  | { type: "saveGame"; name: string }
  | { type: "notification"; message: string }
  | { type: "scan" }
  /** W6 — ESP-driven navmesh walk (fails cleanly without SkyGuide.esp). */
  | { type: "autowalkTo"; formId: number; stopDistance?: number }
  | { type: "autowalkCancel" }
  | { type: "forceThirdPerson" }
  | { type: "forceFirstPerson" };
