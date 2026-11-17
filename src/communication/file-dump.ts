import { printConsole } from "../skyrimPlatform";
import { logDiag } from "../diag";
import { CONFIG } from "../config";

/**
 * Atomic JSON dump for SkyrimFileConnector.
 *
 * Node `fs` is proven in the SP runtime (skymp5-client profilingService).
 * Webpack must treat `fs` as an external (commonjs) so it is not polyfilled.
 *
 * Paths resolve against Skyrim's process CWD. Set CONFIG.modContextPath to an
 * absolute path that matches the app's SKYRIM_CONTEXT_FILE_PATH.
 */

type FsModule = {
  writeFileSync: (path: string, data: string) => void;
  renameSync: (from: string, to: string) => void;
  mkdirSync: (path: string, opts: { recursive: boolean }) => void;
};

let fsModule: FsModule | null | undefined;
let fsFailureLogged = false;
let fsSuccessLogged = false;

function logFsFailure(msg: string): void {
  if (fsFailureLogged) return;
  fsFailureLogged = true;
  logDiag(`[SkyGuide] fs UNAVAILABLE — state.json disabled: ${msg}`);
}

function loadFs(): FsModule | null {
  if (fsModule !== undefined) return fsModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fsModule = require("fs") as FsModule;
    // SP's host fs is a PARTIAL Node shim — dump what it actually exposes.
    logDiag(`[SkyGuide] fs keys: ${Object.keys(fsModule as unknown as Record<string, unknown>).join(",")}`);
    logDiag(
      `[SkyGuide] fs methods: writeFileSync=${typeof (fsModule as unknown as Record<string, unknown>).writeFileSync} writeFile=${typeof (fsModule as unknown as Record<string, unknown>).writeFile} readFileSync=${typeof (fsModule as unknown as Record<string, unknown>).readFileSync}`,
    );
  } catch (err) {
    fsModule = null;
    logFsFailure(String(err));
  }
  return fsModule;
}

function parentDir(filePath: string): string | null {
  const idx = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  if (idx <= 0) return null;
  return filePath.slice(0, idx);
}

export function dumpModContext(payload: unknown): boolean {
  if (!CONFIG.modContextDumpEnabled) return false;

  const fsAny = loadFs() as unknown as Record<string, unknown> | null;
  if (!fsAny) return false;

  const target = CONFIG.modContextPath;

  try {
    const data = JSON.stringify(payload);
    // SP's fs shim: prefer atomic write+rename, fall back to whatever
    // write primitive exists (sync or callback-style).
    if (typeof fsAny.writeFileSync === "function") {
      const tmp = `${target}.tmp`;
      try {
        const dir = parentDir(target);
        if (dir) {
          try {
            (fsAny.mkdirSync as FsModule["mkdirSync"])?.(dir, { recursive: true });
          } catch {
            // Directory may already exist.
          }
        }
        (fsAny.writeFileSync as FsModule["writeFileSync"])(tmp, data);
        if (typeof fsAny.renameSync === "function") {
          (fsAny.renameSync as FsModule["renameSync"])(tmp, target);
        }
      } catch {
        // Direct write fallback (atomicity is best-effort).
        (fsAny.writeFileSync as FsModule["writeFileSync"])(target, data);
      }
    } else if (typeof fsAny.writeFile === "function") {
      // Callback-style Node writeFile — the SP event loop drains callbacks
      // between frames (same mechanism as HttpClient callbacks).
      (fsAny.writeFile as (p: string, d: string, cb: (err: unknown) => void) => void)(
        target,
        data,
        (err) => {
          if (err) logFsFailure(String(err));
          else if (!fsSuccessLogged) {
            fsSuccessLogged = true;
            logDiag(`[SkyGuide] state.json written (async): ${target}`);
          }
        },
      );
    } else {
      if (!fsFailureLogged) {
        logFsFailure("no usable write primitive on fs module");
      }
      return false;
    }
    if (!fsSuccessLogged) {
      fsSuccessLogged = true;
      logDiag(`[SkyGuide] state.json written: ${target}`);
    }
    return true;
  } catch (err) {
    logFsFailure(String(err));
    return false;
  }
}
