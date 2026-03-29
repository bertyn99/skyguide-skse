import type * as SkyrimPlatformTypes from '@skyrim-platform/skyrim-platform'

const runtime = globalThis as { skyrimPlatform?: typeof SkyrimPlatformTypes }

if (!runtime.skyrimPlatform) {
  throw new Error('skyrimPlatform global is not available')
}

const skyrimPlatform = runtime.skyrimPlatform

export const {
  once,
  on,
  printConsole,
  Debug,
  hooks,
  findConsoleCommand,
  HttpClient,
  Ui,
  Game,
  Input,
  DxScanCode,
  Utility,
  Weather,
} = skyrimPlatform;

export type * from '@skyrim-platform/skyrim-platform'

export default skyrimPlatform
