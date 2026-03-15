import type { Position, PositionPresetFn } from './types'

// ─── App Identity ─────────────────────────────────────────────────────────────

export const APP_NAME = 'DeskFlow'
export const APP_BUNDLE_ID = 'com.deskflow.app'
export const APP_VERSION = '0.1.0'

// ─── AppData Path Fragments ───────────────────────────────────────────────────
// Full paths are constructed at runtime in the main process:
//   join(app.getPath('appData'), APPDATA_DIR, APPDATA_PROFILES_DIR)
//   join(app.getPath('appData'), APPDATA_DIR, APPDATA_SETTINGS_FILE)
//   join(app.getPath('appData'), APPDATA_DIR, APPDATA_LOGS_DIR, 'main.log')

export const APPDATA_DIR = 'DeskFlow'
export const APPDATA_PROFILES_DIR = 'profiles'
export const APPDATA_SETTINGS_FILE = 'settings.json'
export const APPDATA_LOGS_DIR = 'logs'
export const APPDATA_LOG_FILE = 'main.log'

// ─── Default Settings Values ──────────────────────────────────────────────────

export const DEFAULT_TERMINAL_PATH = 'wt' // Windows Terminal
export const DEFAULT_LAUNCH_DELAY_MS = 0
export const DEFAULT_THEME = 'system' as const

// ─── Position Presets ─────────────────────────────────────────────────────────

/** All valid Position values in display order (3×3 grid then special presets). */
export const POSITION_VALUES: Position[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'left-half',
  'right-half',
  'full',
]

/**
 * Resolves a Position preset to absolute pixel coordinates.
 *
 * W = work area width, H = work area height (screen minus taskbar).
 * All coordinates are relative to the top-left of the work area.
 *
 * ┌─────────────────────────────────────────┐
 * │  Preset          x       y      w     h │
 * │  ─────────────────────────────────────  │
 * │  top-left        0       0     W/2   H/2│
 * │  top-center      W/4     0     W/2   H/2│
 * │  top-right       W/2     0     W/2   H/2│
 * │  middle-left     0       H/4   W/2   H/2│
 * │  center          W/4     H/4   W/2   H/2│
 * │  middle-right    W/2     H/4   W/2   H/2│
 * │  bottom-left     0       H/2   W/2   H/2│
 * │  bottom-center   W/4     H/2   W/2   H/2│
 * │  bottom-right    W/2     H/2   W/2   H/2│
 * │  left-half       0       0     W/2   H  │
 * │  right-half      W/2     0     W/2   H  │
 * │  full            0       0     W     H  │
 * └─────────────────────────────────────────┘
 *
 * Implementation: src/main/platform/windows/WindowPositioner.ts
 */
export type { PositionPresetFn }
