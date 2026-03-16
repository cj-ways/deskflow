// ─── Position Presets ────────────────────────────────────────────────────────
// All 12 selectable positions in the UI position picker (3×3 grid + 3 special)

export type Position =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'left-half'
  | 'right-half'
  | 'full'

// ─── App Entry Types ─────────────────────────────────────────────────────────

export type AppEntryType = 'ide' | 'browser' | 'terminal' | 'app'

// IDE — opens a code editor to a project folder
export interface IdeEntry {
  id: string
  type: 'ide'
  folder: string
  position: Position
  delayMs: number
}

// Browser — opens to a local dev port or a full URL
export type BrowserEntry =
  | {
      id: string
      type: 'browser'
      mode: 'local'
      port: number
      position: Position
      delayMs: number
    }
  | {
      id: string
      type: 'browser'
      mode: 'website'
      url: string
      position: Position
      delayMs: number
    }

// Terminal — runs a shell command or executes a script file
export type TerminalEntry =
  | {
      id: string
      type: 'terminal'
      mode: 'command'
      workingDir: string
      command: string
      position: Position
      delayMs: number
    }
  | {
      id: string
      type: 'terminal'
      mode: 'script'
      scriptPath: string
      position: Position
      delayMs: number
    }

// Generic app — any .exe with optional args
export interface GenericAppEntry {
  id: string
  type: 'app'
  path: string
  args: string[]
  position: Position
  delayMs: number
}

// Union of all app entry variants — used in Desktop.apps and throughout the UI
export type AppEntry = IdeEntry | BrowserEntry | TerminalEntry | GenericAppEntry

// ─── Profile & Desktop ───────────────────────────────────────────────────────

export interface Desktop {
  index: number
  name: string
  apps: AppEntry[]
}

export interface Profile {
  id: string
  name: string
  createdAt: string // ISO 8601 date string
  lastLaunchedAt?: string // ISO 8601, undefined = never launched
  desktops: Desktop[]
}

// A profile captured from the current screen state — id/name filled in by the user
export type ProfileDraft = Omit<Profile, 'id' | 'name'> & {
  id: string // empty string until saved
  name: string // empty string until user names it
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface Settings {
  idePath: string // e.g. path to code.cmd or code.exe
  browserPath: string // e.g. path to chrome.exe
  terminalPath: string // defaults to 'wt' (Windows Terminal)
  startWithWindows: boolean
  minimizeToTray: boolean
  globalLaunchDelayMs: number // extra delay injected between each app launch
  theme: 'system' | 'light' | 'dark'
}

// ─── Snapshot ────────────────────────────────────────────────────────────────

export interface WindowInfo {
  hwnd: number
  pid: number
  title: string
  exePath: string
  workingDir: string
  desktopIndex: number
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
}

// ─── Launch ──────────────────────────────────────────────────────────────────

// Result of spawning a single process (returned by AppLauncher methods)
export interface LaunchResult {
  success: boolean
  hwnd?: number
  pid?: number
  error?: string
}

// Per-app result entry inside a LaunchReport
export interface AppLaunchResult {
  appId: string
  ok: boolean
  error?: string
}

// Full report returned by LaunchEngine after a profile launch completes/cancels
export interface LaunchReport {
  success: boolean
  cancelled: boolean
  results: AppLaunchResult[]
}

export type LaunchProgressEventType =
  | 'desktop-creating'
  | 'desktop-created'
  | 'app-launching'
  | 'app-done'
  | 'app-failed'
  | 'complete'
  | 'cancelled'

export interface LaunchProgressEvent {
  type: LaunchProgressEventType
  appId?: string
  desktopIndex?: number
  message: string
  error?: string
  progress: {
    completed: number
    total: number
  }
}

// ─── IPC Response Wrappers ───────────────────────────────────────────────────
// All IPC handlers return one of these two shapes.

/** Handler returns a data payload on success. */
export type IpcDataResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/** Handler only signals success or failure (no data payload). */
export type IpcVoidResponse = { success: true } | { success: false; error: string }

// ─── Shared Utility Types ────────────────────────────────────────────────────

/** Electron-style file filter for dialog pickers — redefined here to avoid
 *  importing from 'electron' in shared/renderer code. */
export interface FileFilter {
  name: string
  extensions: string[] // without dots, e.g. ['exe', 'bat', 'ps1']
}

/**
 * Type signature for the position preset resolver.
 * Implementation lives in src/main/platform/windows/WindowPositioner.ts
 *
 * Work area: screen dimensions minus the taskbar (retrieved via System.Windows.Forms P/Invoke).
 * Returns absolute pixel coordinates to pass to Win32 SetWindowPos.
 */
export type PositionPresetFn = (
  position: Position,
  workArea: { x: number; y: number; width: number; height: number },
) => { x: number; y: number; width: number; height: number }

// ─── Auto-Updater ────────────────────────────────────────────────────────────

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  version: string
  releaseDate: string
  releaseNotes: string | null
}

export interface UpdateProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export interface UpdateState {
  status: UpdateStatus
  info: UpdateInfo | null
  progress: UpdateProgress | null
  error: string | null
}
