import { printConsole } from "../skyrimPlatform";
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

function loadFs(): FsModule | null {
  if (fsModule !== undefined) return fsModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fsModule = require("fs") as FsModule;
  } catch (err) {
    fsModule = null;
    if (CONFIG.debugMode) {
      printConsole(`[SkyGuide] Node fs unavailable: ${String(err)}`);
    }
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

  const fs = loadFs();
  if (!fs) return false;

  const target = CONFIG.modContextPath;
  const tmp = `${target}.tmp`;

  try {
    const dir = parentDir(target);
    if (dir) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Directory may already exist.
      }
    }
    fs.writeFileSync(tmp, JSON.stringify(payload));
    fs.renameSync(tmp, target);
    return true;
  } catch (err) {
    if (CONFIG.debugMode) {
      printConsole(`[SkyGuide] mod-context dump failed: ${String(err)}`);
    }
    return false;
  }
}
