import { DxScanCode, Input } from "../../skyrimPlatform";
import type { InputState } from "../types";
import * as SkT from '@skyrim-platform/skyrim-platform'

const MOVE_FORWARD = 17 as SkT.DxScanCode;
const MOVE_LEFT = 30 as SkT.DxScanCode;
const MOVE_BACKWARD = 31 as SkT.DxScanCode;
const MOVE_RIGHT = 32 as SkT.DxScanCode;
const SPRINT = 42 as SkT.DxScanCode;
const CROUCH = 29 as SkT.DxScanCode;
const JUMP_OR_ACTIVATE = 57 as SkT.DxScanCode;

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
