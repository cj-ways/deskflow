import { ipcMain, nativeTheme, BrowserWindow } from 'electron'
import log from '../logger'
import { IPC } from '@shared/ipc-channels'
import { SettingsManager } from '../services/SettingsManager'
import type { Settings, IpcDataResponse } from '@shared/types'

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IPC.SETTINGS_GET, async (): Promise<IpcDataResponse<Settings>> => {
    try {
      const data = await SettingsManager.get()
      return { success: true, data }
    } catch (err) {
      log.error('[settings.ipc] get error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.SETTINGS_SAVE, async (_e, patch: unknown): Promise<IpcDataResponse<Settings>> => {
    try {
      const data = await SettingsManager.save(patch as Partial<Settings>)
      return { success: true, data }
    } catch (err) {
      log.error('[settings.ipc] save error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.SETTINGS_DETECT_IDE_PATH, async (): Promise<IpcDataResponse<string | null>> => {
    try {
      const data = await SettingsManager.detectIdePath()
      return { success: true, data }
    } catch (err) {
      log.error('[settings.ipc] detectIdePath error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.SETTINGS_DETECT_BROWSER_PATH, async (): Promise<IpcDataResponse<string | null>> => {
    try {
      const data = await SettingsManager.detectBrowserPath()
      return { success: true, data }
    } catch (err) {
      log.error('[settings.ipc] detectBrowserPath error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  // ── Theme ──────────────────────────────────────────────────────────────────

  ipcMain.handle(IPC.THEME_GET_DARK, (): IpcDataResponse<boolean> => {
    return { success: true, data: nativeTheme.shouldUseDarkColors }
  })

  // Broadcast theme changes to all renderer windows
  nativeTheme.on('updated', () => {
    const isDark = nativeTheme.shouldUseDarkColors
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(IPC.THEME_CHANGED, isDark)
    }
  })

  log.info('Settings IPC handlers registered')
}
