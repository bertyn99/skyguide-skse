#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const projectRoot = process.cwd()
const bundlePath = path.join(projectRoot, 'dist', 'skyguide.js')

function fail(message) {
  console.error(`❌ ${message}`)
  process.exitCode = 1
}

function pass(message) {
  console.log(`✅ ${message}`)
}

function createRuntimeStub() {
  const registered = {
    on: [],
    once: [],
  }

  class HttpClient {
    constructor(baseUrl) {
      this.baseUrl = baseUrl
    }

    async get() {
      return { status: 200, body: '[]' }
    }

    async post() {
      return { status: 200, body: '' }
    }
  }

  const noOp = () => {}

  const skyrimPlatform = {
    printConsole: noOp,
    once(eventName, callback) {
      registered.once.push({ eventName, callback })
      return { remove: noOp }
    },
    on(eventName, callback) {
      registered.on.push({ eventName, callback })
      return { remove: noOp }
    },
    findConsoleCommand() {
      return { execute: null }
    },
    Debug: {
      notification: noOp,
      messageBox: noOp,
    },
    hooks: {
      sendAnimationEvent: {
        add: noOp,
      },
    },
    Ui: {
      isMenuOpen: () => false,
    },
    Input: {
      isKeyPressed: () => false,
      tapKey: noOp,
      holdKey: noOp,
      releaseKey: noOp,
    },
    Utility: {
      getCurrentGameTime: () => 0,
    },
    Weather: {
      getCurrentWeather: () => null,
    },
    HttpClient,
    DxScanCode: {
      W: 17,
      A: 30,
      S: 31,
      D: 32,
      LeftShift: 42,
      LeftControl: 29,
      Spacebar: 57,
    },
    Game: {
      getPlayer: () => null,
      getFormEx: () => null,
      getCurrentCrosshairRef: () => null,
      findClosestActor: () => null,
      getQuest: () => null,
      getCameraState: () => 0,
      getSunPositionX: () => 0,
      getSunPositionY: () => 0,
      getSunPositionZ: () => 0,
      saveGame: noOp,
      forceThirdPerson: noOp,
      forceFirstPerson: noOp,
    },
  }

  const runtimeGlobal = {
    skyrimPlatform,
    addNativeExports(name, target) {
      if (name === 'skyrimPlatform') {
        return Object.assign(target, skyrimPlatform)
      }
      return target
    },
  }

  return { skyrimPlatform, registered, runtimeGlobal }
}

function runInSkyrimLikeVm(code) {
  const { registered, runtimeGlobal } = createRuntimeStub()

  const sandbox = {
    ...runtimeGlobal,
    globalThis: null,
    console,
    setTimeout,
    clearTimeout,
  }
  sandbox.globalThis = sandbox

  vm.createContext(sandbox)
  const script = new vm.Script(code, { filename: 'skyguide.js' })
  script.runInContext(sandbox, { timeout: 1000 })

  return registered
}

if (!fs.existsSync(bundlePath)) {
  fail('dist/skyguide.js not found. Run "pnpm build" first.')
  process.exit()
}

const code = fs.readFileSync(bundlePath, 'utf8')

const forbiddenPatterns = [
  {
    label: 'Node require("skyrimPlatform") usage',
    regex: /require\(["']skyrimPlatform["']\)/,
    reason: 'Skyrim Platform runtime does not resolve Node modules.',
  },
  {
    label: 'Optional chaining (?.)',
    regex: /\?\./,
    reason: 'Older Skyrim Platform V8 builds may fail on optional chaining.',
  },
  {
    label: 'Nullish coalescing (??)',
    regex: /\?\?(?!=)/,
    reason: 'Older Skyrim Platform V8 builds may fail on nullish coalescing.',
  },
  {
    label: 'BigInt literal',
    regex: /\b\d+n\b/,
    reason: 'BigInt is not guaranteed in Skyrim Platform runtime.',
  },
]

const requiredPatterns = [
  {
    label: 'Global skyrimPlatform bridge present',
    regex: /runtime\.skyrimPlatform|globalThis\.skyrimPlatform/,
    reason: 'Bundle must resolve Skyrim API from runtime global object.',
  },
  {
    label: 'Plugin entry hooks registered',
    regex: /(?:^|\W)once\((['"])update\1\s*,|(?:^|\W)on\((['"])tick\2\s*,/,
    reason: 'Smoke check that plugin entry still initializes in runtime.',
  },
]

const skyrimPathValidationPatterns = [
  {
    label: 'DevApi-incompatible relative import traversal',
    regex: /from\s+['"][^'"]*\.\.[^'"]*\.\./,
    reason: 'Skyrim Platform path validation disallows parent traversal in runtime require paths.',
  },
]

for (const pattern of forbiddenPatterns) {
  if (pattern.regex.test(code)) {
    fail(`${pattern.label} detected. ${pattern.reason}`)
  } else {
    pass(`${pattern.label} not present`)
  }
}

for (const pattern of requiredPatterns) {
  if (!pattern.regex.test(code)) {
    fail(`${pattern.label} missing. ${pattern.reason}`)
  } else {
    pass(`${pattern.label}`)
  }
}

for (const pattern of skyrimPathValidationPatterns) {
  if (pattern.regex.test(code)) {
    fail(`${pattern.label} detected. ${pattern.reason}`)
  } else {
    pass(`${pattern.label} not present`)
  }
}

try {
  const registered = runInSkyrimLikeVm(code)
  pass('Bundle executes in Skyrim-like VM without load-time exceptions')

  const hasUpdate = registered.once.some((event) => event.eventName === 'update')
  const hasTick = registered.on.some((event) => event.eventName === 'tick')

  if (!hasUpdate) {
    fail('No once("update") handler registered during load-time execution')
  } else {
    pass('once("update") handler registered')
  }

  if (!hasTick) {
    fail('No on("tick") handler registered during load-time execution')
  } else {
    pass('on("tick") handler registered')
  }
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error)
  fail(`Bundle throws during Skyrim-like VM load: ${msg}`)
}

if (process.exitCode) {
  console.error('\nRuntime compatibility check failed.')
  process.exit(process.exitCode)
}

console.log('\n🎯 Skyrim runtime compatibility smoke test passed.')
