/**
 * Typed IPC wrappers for the renderer process.
 *
 * All components import from here — never call window.api directly.
 * Grouping by domain keeps imports clean and makes the API surface obvious.
 */

import { IPC } from '@shared/ipc-channels'
import type { Profile, ProfileDraft, Settings, UpdateState } from '@shared/types'
import type { LaunchProgressEvent, FileFilter } from '@shared/types'

// ─── Profiles ────────────────────────────────────────────────────────────────

const profiles = {
  getAll: () => window.api.invoke(IPC.PROFILES_GET_ALL),
  getById: (id: string) => window.api.invoke(IPC.PROFILES_GET_BY_ID, id),
  save: (profile: Profile) => window.api.invoke(IPC.PROFILES_SAVE, profile),
  delete: (id: string) => window.api.invoke(IPC.PROFILES_DELETE, id),
  duplicate: (id: string) => window.api.invoke(IPC.PROFILES_DUPLICATE, id),
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────

const dialog = {
  openFolder: () => window.api.invoke(IPC.DIALOG_OPEN_FOLDER),
  openFile: (filters?: FileFilter[]) => window.api.invoke(IPC.DIALOG_OPEN_FILE, { filters }),
}

// ─── Launch ───────────────────────────────────────────────────────────────────

const launch = {
  start: (profileId: string) => window.api.invoke(IPC.LAUNCH_START, profileId),
  cancel: () => window.api.invoke(IPC.LAUNCH_CANCEL),
  onProgress: (listener: (event: LaunchProgressEvent) => void) =>
    window.api.on(IPC.LAUNCH_PROGRESS, listener),
  offProgress: (listener: (event: LaunchProgressEvent) => void) =>
    window.api.off(IPC.LAUNCH_PROGRESS, listener),
}

// ─── Snapshot ────────────────────────────────────────────────────────────────

const snapshot = {
  capture: (): Promise<import('@shared/ipc-channels').IpcChannelMap['snapshot:capture']['res']> =>
    window.api.invoke(IPC.SNAPSHOT_CAPTURE),
  onReady: (listener: (draft: ProfileDraft) => void) =>
    window.api.on(IPC.SNAPSHOT_READY, listener),
  offReady: (listener: (draft: ProfileDraft) => void) =>
    window.api.off(IPC.SNAPSHOT_READY, listener),
}

// ─── Settings ────────────────────────────────────────────────────────────────

const settings = {
  get: () => window.api.invoke(IPC.SETTINGS_GET),
  save: (patch: Partial<Settings>) => window.api.invoke(IPC.SETTINGS_SAVE, patch),
  detectIdePath: () => window.api.invoke(IPC.SETTINGS_DETECT_IDE_PATH),
  detectBrowserPath: () => window.api.invoke(IPC.SETTINGS_DETECT_BROWSER_PATH),
}

// ─── Theme ──────────────────────────────────────────────────────────────────

const theme = {
  isDark: () => window.api.invoke(IPC.THEME_GET_DARK),
  onChanged: (listener: (isDark: boolean) => void) =>
    window.api.on(IPC.THEME_CHANGED, listener),
  offChanged: (listener: (isDark: boolean) => void) =>
    window.api.off(IPC.THEME_CHANGED, listener),
}

// ─── Updater ────────────────────────────────────────────────────────────────

const updater = {
  check: () => window.api.invoke(IPC.UPDATER_CHECK),
  install: () => window.api.invoke(IPC.UPDATER_INSTALL),
  onStatus: (listener: (state: UpdateState) => void) =>
    window.api.on(IPC.UPDATER_STATUS, listener),
  offStatus: (listener: (state: UpdateState) => void) =>
    window.api.off(IPC.UPDATER_STATUS, listener),
}

// ─── Unified export ───────────────────────────────────────────────────────────

export const ipc = { profiles, dialog, launch, snapshot, settings, theme, updater }

// Re-export types components commonly need
export type { Profile, ProfileDraft, Settings, LaunchProgressEvent, FileFilter, UpdateState }
