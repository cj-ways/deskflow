import { BrowserWindow, ipcMain } from 'electron'
import log from '../logger'
import { IPC } from '@shared/ipc-channels'
import { ProfileManager } from '../services/ProfileManager'
import { SettingsManager } from '../services/SettingsManager'
import { LaunchEngine } from '../services/LaunchEngine'
import type { IpcVoidResponse } from '@shared/types'

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

let engine: LaunchEngine | null = null

export function registerLaunchHandlers(): void {
  ipcMain.handle(IPC.LAUNCH_START, async (_e, profileId: unknown): Promise<IpcVoidResponse> => {
    if (typeof profileId !== 'string') {
      return { success: false, error: 'profileId must be a string' }
    }

    try {
      const profile = await ProfileManager.getById(profileId)
      if (!profile) {
        return { success: false, error: `Profile not found: ${profileId}` }
      }

      const settings = await SettingsManager.get()

      // Cancel any in-progress launch
      if (engine) {
        engine.cancel()
      }
      engine = new LaunchEngine()

      // Run launch asynchronously — progress events pushed to all windows
      const currentEngine = engine
      void (async () => {
        try {
          const report = await currentEngine.launch(profile, settings, (event) => {
            for (const win of BrowserWindow.getAllWindows()) {
              win.webContents.send(IPC.LAUNCH_PROGRESS, event)
            }
          })

          // Update lastLaunchedAt on success
          if (report.success) {
            profile.lastLaunchedAt = new Date().toISOString()
            await ProfileManager.save(profile)
          }

          log.info(`[launch.ipc] launch complete success=${report.success} cancelled=${report.cancelled}`)
        } catch (err) {
          log.error('[launch.ipc] launch error', err)
        } finally {
          if (engine === currentEngine) {
            engine = null
          }
        }
      })()

      return { success: true }
    } catch (err) {
      log.error('[launch.ipc] launch:start error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.LAUNCH_CANCEL, async (): Promise<IpcVoidResponse> => {
    if (engine) {
      engine.cancel()
      engine = null
      return { success: true }
    }
    return { success: false, error: 'No launch in progress' }
  })

  log.info('Launch IPC handlers registered')
}
