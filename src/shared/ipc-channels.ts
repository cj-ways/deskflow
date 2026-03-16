/**
 * IPC channel definitions for the contextBridge boundary.
 *
 * Usage pattern:
 *   - Main process: ipcMain.handle(IPC.PROFILES_GET_ALL, handler)
 *   - Renderer (via preload bridge): window.api.invoke(IPC.PROFILES_GET_ALL)
 *   - All channel strings live here — never hardcoded elsewhere
 */

import type {
  Profile,
  ProfileDraft,
  Settings,
  LaunchProgressEvent,
  UpdateState,
  IpcDataResponse,
  IpcVoidResponse,
  FileFilter,
} from './types'

// ─── Channel name constants ───────────────────────────────────────────────────

export const IPC = {
  // Profile CRUD
  PROFILES_GET_ALL: 'profiles:getAll',
  PROFILES_GET_BY_ID: 'profiles:getById',
  PROFILES_SAVE: 'profiles:save',
  PROFILES_DELETE: 'profiles:delete',
  PROFILES_DUPLICATE: 'profiles:duplicate',

  // Native file/folder dialogs
  DIALOG_OPEN_FOLDER: 'dialog:openFolder',
  DIALOG_OPEN_FILE: 'dialog:openFile',

  // Launch engine (invoke)
  LAUNCH_START: 'launch:start',
  LAUNCH_CANCEL: 'launch:cancel',

  // Launch progress (push event: main → renderer via webContents.send)
  LAUNCH_PROGRESS: 'launch:progress',

  // Snapshot
  SNAPSHOT_CAPTURE: 'snapshot:capture',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SAVE: 'settings:save',
  SETTINGS_DETECT_IDE_PATH: 'settings:detectIdePath',
  SETTINGS_DETECT_BROWSER_PATH: 'settings:detectBrowserPath',

  // Auto-updater
  UPDATER_CHECK: 'updater:check',
  UPDATER_INSTALL: 'updater:install',
  UPDATER_STATUS: 'updater:status', // push event: main → renderer
} as const

/** Union of all valid IPC channel strings */
export type IpcChannel = (typeof IPC)[keyof typeof IPC]

// ─── Per-channel payload types ────────────────────────────────────────────────
// Used by the preload bridge (A5) to type-check invoke() calls and handlers.
// req = what the renderer sends, res = what the main process returns.

export interface IpcChannelMap {
  [IPC.PROFILES_GET_ALL]: {
    req: void
    res: IpcDataResponse<Profile[]>
  }
  [IPC.PROFILES_GET_BY_ID]: {
    req: string // profile id
    res: IpcDataResponse<Profile | null>
  }
  [IPC.PROFILES_SAVE]: {
    req: Profile
    res: IpcVoidResponse
  }
  [IPC.PROFILES_DELETE]: {
    req: string // profile id
    res: IpcVoidResponse
  }
  [IPC.PROFILES_DUPLICATE]: {
    req: string // profile id
    res: IpcDataResponse<Profile>
  }
  [IPC.DIALOG_OPEN_FOLDER]: {
    req: void
    res: IpcDataResponse<string | null> // null = user cancelled
  }
  [IPC.DIALOG_OPEN_FILE]: {
    req: { filters?: FileFilter[] }
    res: IpcDataResponse<string | null> // null = user cancelled
  }
  [IPC.LAUNCH_START]: {
    req: string // profile id
    res: IpcVoidResponse
  }
  [IPC.LAUNCH_CANCEL]: {
    req: void
    res: IpcVoidResponse
  }
  [IPC.SNAPSHOT_CAPTURE]: {
    req: void
    res: IpcDataResponse<ProfileDraft>
  }
  [IPC.SETTINGS_GET]: {
    req: void
    res: IpcDataResponse<Settings>
  }
  [IPC.SETTINGS_SAVE]: {
    req: Partial<Settings>
    res: IpcDataResponse<Settings>
  }
  [IPC.SETTINGS_DETECT_IDE_PATH]: {
    req: void
    res: IpcDataResponse<string | null>
  }
  [IPC.SETTINGS_DETECT_BROWSER_PATH]: {
    req: void
    res: IpcDataResponse<string | null>
  }
  [IPC.UPDATER_CHECK]: {
    req: void
    res: IpcVoidResponse
  }
  [IPC.UPDATER_INSTALL]: {
    req: void
    res: IpcVoidResponse
  }
}

// ─── Push event map (main → renderer) ────────────────────────────────────────
// These channels are NOT invoke/handle pairs — the main process pushes them
// via win.webContents.send(). The renderer listens with ipcRenderer.on().

export interface IpcEventMap {
  [IPC.LAUNCH_PROGRESS]: LaunchProgressEvent
  [IPC.UPDATER_STATUS]: UpdateState
}
