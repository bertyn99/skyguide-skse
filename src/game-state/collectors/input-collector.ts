import { DxScanCode, Input } from "../../skyrimPlatform";
import type { InputState } from "../types";

const MOVE_FORWARD = 17 as DxScanCode;
const MOVE_LEFT = 30 as DxScanCode;
const MOVE_BACKWARD = 31 as DxScanCode;
const MOVE_RIGHT = 32 as DxScanCode;
const SPRINT = 42 as DxScanCode;
const CROUCH = 29 as DxScanCode;
const JUMP_OR_ACTIVATE = 57 as DxScanCode;

export function collectInputState(): InputState {
  try {
    const keysPressed: string[] = [];

    if (Input.isKeyPressed(MOVE_FORWARD)) keysPressed.push("W");
    if (Input.isKeyPressed(MOVE_LEFT)) keysPressed.push("A");
    if (Input.isKeyPressed(MOVE_BACKWARD)) keysPressed.push("S");
    if (Input.isKeyPressed(MOVE_RIGHT)) keysPressed.push("D");
    if (Input.isKeyPressed(SPRINT)) keysPressed.push("Shift");
    if (Input.isKeyPressed(CROUCH)) keysPressed.push("Ctrl");
    if (Input.isKeyPressed(JUMP_OR_ACTIVATE)) keysPressed.push("Space");

    return { keysPressed };
  } catch {
    return { keysPressed: [] };
  }
}
