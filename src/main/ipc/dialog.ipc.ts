import { ipcMain, dialog, BrowserWindow } from 'electron'
import log from '../logger'
import { IPC } from '@shared/ipc-channels'
import type { IpcDataResponse, FileFilter } from '@shared/types'

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function registerDialogHandlers(): void {
  ipcMain.handle(IPC.DIALOG_OPEN_FOLDER, async (): Promise<IpcDataResponse<string | null>> => {
    const win = BrowserWindow.getAllWindows()[0]
    try {
      const result = win
        ? await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
        : await dialog.showOpenDialog({ properties: ['openDirectory'] })
      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null }
      }
      return { success: true, data: result.filePaths[0] }
    } catch (err) {
      log.error('dialog:openFolder error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.DIALOG_OPEN_FILE, async (_e, payload: unknown): Promise<IpcDataResponse<string | null>> => {
    const win = BrowserWindow.getAllWindows()[0]
    const filters = (payload as { filters?: FileFilter[] } | undefined)?.filters ?? []
    try {
      const result = win
        ? await dialog.showOpenDialog(win, { properties: ['openFile'], filters })
        : await dialog.showOpenDialog({ properties: ['openFile'], filters })
      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null }
      }
      return { success: true, data: result.filePaths[0] }
    } catch (err) {
      log.error('dialog:openFile error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  log.info('Dialog IPC handlers registered')
}
