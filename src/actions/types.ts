export type ActionCommand =
  | { type: "move"; x: number; y: number; z: number }
  | { type: "face"; angle: number }
  | {
      type: "activate";
      target: "crosshair" | "nearestNPC" | "nearestDoor" | "nearestContainer";
    }
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
  | { type: "forceThirdPerson" }
  | { type: "forceFirstPerson" };
