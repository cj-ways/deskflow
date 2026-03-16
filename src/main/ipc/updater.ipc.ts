import { ipcMain } from 'electron'
import log from '../logger'
import { IPC } from '@shared/ipc-channels'
import { AutoUpdater } from '../services/AutoUpdater'
import type { IpcVoidResponse } from '@shared/types'

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function registerUpdaterHandlers(): void {
  ipcMain.handle(IPC.UPDATER_CHECK, async (): Promise<IpcVoidResponse> => {
    try {
      await AutoUpdater.check()
      return { success: true }
    } catch (err) {
      log.error('updater:check error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.UPDATER_INSTALL, async (): Promise<IpcVoidResponse> => {
    try {
      AutoUpdater.install()
      return { success: true }
    } catch (err) {
      log.error('updater:install error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  log.info('Updater IPC handlers registered')
}
