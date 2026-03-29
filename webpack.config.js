const fs = require('fs');
const path = require('path');
const packageInfo = require('./package.json')
const WebpackShellPluginNext = require('webpack-shell-plugin-next');

// Configure webpack output file folder and file name
const outputFolder = path.resolve(__dirname, './build')
const outputFilename = `${packageInfo.name}.js`
const isWindows = process.platform === 'win32'
const isWsl = process.platform === 'linux' && (Boolean(process.env.WSL_DISTRO_NAME) || Boolean(process.env.WSL_INTEROP))

function toWslPath(maybeWindowsPath) {
    if (typeof maybeWindowsPath !== 'string') return undefined
    const match = maybeWindowsPath.match(/^([a-zA-Z]):[\\/](.*)$/)
    if (!match) return maybeWindowsPath
    const drive = match[1].toLowerCase()
    const rest = match[2].replace(/\\/g, '/')
    return `/mnt/${drive}/${rest}`
}

function pickExistingPath(...candidates) {
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && fs.existsSync(candidate)) return candidate
    }
    return undefined
}

function readSkyrimConfig() {
    const skyrimConfigPath = path.resolve(__dirname, 'skyrim.json')
    if (!fs.existsSync(skyrimConfigPath)) return undefined

    try {
        return JSON.parse(fs.readFileSync(skyrimConfigPath, 'utf8'))
    } catch {
        // Allow simple comments in local config files.
        const withNoLineComments = fs
            .readFileSync(skyrimConfigPath, 'utf8')
            .replace(/^\s*\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
        return JSON.parse(withNoLineComments)
    }
}

// Configure entry point of application.
// This should be a .ts file, e.g. not dist/index.js
const entryPoint = './src/index.ts'

// When webpack is build normally, it will simply output a file to the configured output folder and filename.
// If you run webpack with the DEPLOY_PLUGIN environment variable configured to true, then it will
// additionally 'deploy' the plugin to the configured Skyrim directory (via skyrim.json or SKYRIMPATH)
// If no existing folder path is found to the Skyrim folder, an error is displayed and the webpack is canceled. 
let plugins = []
if (process.env['DEPLOY_PLUGIN']?.includes('true')) {
    // Get the path to the Skyrim folder from skyrim.json and the SKYRIMPATH environment variable, if configured.
    const skyrimConfig = readSkyrimConfig()
    const skyrimPathFromConfig = skyrimConfig && skyrimConfig.skyrimFolder
    const skyrimPathFromEnvironment = process.env['SKYRIMPATH']
    const skyrimPathFromConfigWsl = isWsl ? toWslPath(skyrimPathFromConfig) : undefined
    const skyrimPathFromEnvironmentWsl = isWsl ? toWslPath(skyrimPathFromEnvironment) : undefined

    // If the path set in skyrim.json exists on the file system, use it.
    // Otherwise, if the path set in the SKYRIMPATH environment variable exists on the file system, us it.
    const skyrimFolder = pickExistingPath(
        skyrimPathFromConfig,
        skyrimPathFromConfigWsl,
        skyrimPathFromEnvironment,
        skyrimPathFromEnvironmentWsl
    )
    if (! skyrimFolder) {
        console.error('Please set valid path to your Skyrim folder in skyrim.json (or SKYRIMPATH environment variable)') 
        process.exit(1)
    }

    const outputFile = path.join(outputFolder, outputFilename)
    const skyrimPlatformPluginsDirectory = path.resolve(skyrimFolder, 'Data', 'Platform', 'PluginsDev')
    fs.mkdirSync(skyrimPlatformPluginsDirectory, { recursive: true })
    const pluginDestinationPath = path.join(skyrimPlatformPluginsDirectory, outputFilename)
    let copyCommand = `xcopy "${outputFile}" "${skyrimPlatformPluginsDirectory}" /I /Y && echo "Copied ${outputFilename} to ${pluginDestinationPath}"`
    if (isWsl) {
        // In WSL, direct cp can fail on protected Windows folders; fallback to PowerShell copy.
        const outputFilePwsh = `$(wslpath -w "${outputFile}")`
        const skyrimPluginsDirPwsh = `$(wslpath -w "${skyrimPlatformPluginsDirectory}")`
        copyCommand = `cp "${outputFile}" "${skyrimPlatformPluginsDirectory}" && echo "Copied ${outputFilename} to ${pluginDestinationPath}" || powershell.exe -NoProfile -Command "Copy-Item -Path '${outputFilePwsh}' -Destination '${skyrimPluginsDirPwsh}' -Force; Write-Output 'Copied ${outputFilename} to ${pluginDestinationPath}'"`
    } else if (!isWindows) {
        copyCommand = `cp "${outputFile}" "${skyrimPlatformPluginsDirectory}" && echo "Copied ${outputFilename} to ${pluginDestinationPath}"`
    }
    plugins.push(new WebpackShellPluginNext({ onAfterDone: { scripts: [copyCommand] } }))

// When `npm run zip` is run, the project is compiled, webpack is run, and a zip file named `[project name]-[project version].zip`
// is created in the project folder. The .zip file can be distributed via mod managers, e.g. on sites on NexusMods
} else if (process.env['ZIP_PLUGIN']?.includes('true')) {
    const outputFile = path.join(outputFolder, outputFilename)
    const zipFile = `${packageInfo.name}-${packageInfo.version}.zip`
    const localPlatformFolder = path.join('.', 'Platform')
    const localPluginsFolder = path.join(localPlatformFolder, 'Plugins')
    const localPluginFiles = path.join(localPluginsFolder, '*.js')
    fs.rmdirSync(localPluginsFolder, { recursive: true, force: true })
    fs.mkdirSync(localPluginsFolder, { recursive: true })
    let zipCommand = `xcopy "${outputFile}" "${localPluginsFolder}" && npm run zip:cli -- "${zipFile}" "${localPluginFiles}" && RMDIR /S /Q "${localPluginsFolder}"`
    if (!isWindows)
        zipCommand = `cp "${outputFile}" "${localPluginsFolder}" && npm run zip:cli -- "${zipFile}" "${localPluginFiles}" && rm -rf "${localPlatformFolder}"`
    plugins.push(new WebpackShellPluginNext({ onBuildEnd: { scripts: [zipCommand] } }))
}

module.exports = {
    plugins,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: { main: entryPoint, },
    output: { path: outputFolder, filename: outputFilename },
    resolve: { extensions: ['.ts', '.tsx', '.js', '.jsx'] },
    externals: {
        // Do not bundle skyrim platform. Instead require('skyrimPlatform') at runtime
        '@skyrim-platform/skyrim-platform': ['skyrimPlatform'], // <--- support import 'skyrimPlatform'
        'skyrimPlatform': ['skyrimPlatform']
    },
    module: {
        rules: [{ test: /\.tsx?$/, loader: 'ts-loader', options: { configFile: 'tsconfig.json' }}]
    }
};
