import { app } from 'electron'
import { join, dirname } from 'path'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import log from '../logger'
import { APPDATA_DIR, APPDATA_SETTINGS_FILE, DEFAULT_TERMINAL_PATH, DEFAULT_LAUNCH_DELAY_MS, DEFAULT_THEME } from '@shared/constants'
import { settingsSchema } from './settings.schema'
import { runPS } from '../platform/windows/utils/powershell'
import type { Settings } from '@shared/types'

// ─── Path helpers ─────────────────────────────────────────────────────────────

function settingsPath(): string {
  return join(app.getPath('appData'), APPDATA_DIR, APPDATA_SETTINGS_FILE)
}

function defaultSettings(): Settings {
  return {
    idePath: '',
    browserPath: '',
    terminalPath: DEFAULT_TERMINAL_PATH,
    startWithWindows: false,
    minimizeToTray: true,
    globalLaunchDelayMs: DEFAULT_LAUNCH_DELAY_MS,
    theme: DEFAULT_THEME,
  }
}

// ─── SettingsManager ──────────────────────────────────────────────────────────

export const SettingsManager = {
  async get(): Promise<Settings> {
    const filePath = settingsPath()

    try {
      const raw = await readFile(filePath, 'utf-8')
      const result = settingsSchema.safeParse(JSON.parse(raw))
      if (result.success) {
        return result.data as Settings
      }
      log.warn('[SettingsManager] settings file invalid, using defaults', result.error.flatten())
    } catch {
      // File doesn't exist or can't be read — use defaults
    }

    const defaults = defaultSettings()
    await SettingsManager.save(defaults)
    return defaults
  },

  async save(patch: Partial<Settings>): Promise<Settings> {
    const current = await SettingsManager.get().catch(() => defaultSettings())
    const merged: Settings = { ...current, ...patch }

    const filePath = settingsPath()
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, JSON.stringify(merged, null, 2), 'utf-8')
    log.info('[SettingsManager] settings saved')
    return merged
  },

  /**
   * Detect VS Code installation path.
   * Checks: PATH (code.cmd), common install locations, registry.
   */
  async detectIdePath(): Promise<string | null> {
    log.info('[SettingsManager] detecting IDE path')

    // Check common paths
    const candidates = [
      join(process.env['LOCALAPPDATA'] ?? '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
      'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      join(process.env['LOCALAPPDATA'] ?? '', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
    ]

    for (const p of candidates) {
      if (p && existsSync(p)) {
        log.info(`[SettingsManager] found IDE at ${p}`)
        return p
      }
    }

    // Check if 'code' is in PATH
    try {
      const { stdout } = await runPS("(Get-Command code -ErrorAction SilentlyContinue).Source", 5000)
      const codePath = stdout.trim()
      if (codePath) {
        log.info(`[SettingsManager] found IDE in PATH: ${codePath}`)
        return codePath
      }
    } catch {
      // Not found in PATH
    }

    log.info('[SettingsManager] IDE not detected')
    return null
  },

  /**
   * Detect browser installation path.
   * Checks Chrome, then Edge, then Firefox at common locations.
   */
  async detectBrowserPath(): Promise<string | null> {
    log.info('[SettingsManager] detecting browser path')

    const candidates = [
      // Chrome
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      join(process.env['LOCALAPPDATA'] ?? '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
      // Edge
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      // Firefox
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
    ]

    for (const p of candidates) {
      if (p && existsSync(p)) {
        log.info(`[SettingsManager] found browser at ${p}`)
        return p
      }
    }

    log.info('[SettingsManager] browser not detected')
    return null
  },
}
