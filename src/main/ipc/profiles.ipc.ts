import { ipcMain } from 'electron'
import log from '../logger'
import { IPC } from '@shared/ipc-channels'
import { ProfileManager } from '../services/ProfileManager'
import { updateTrayMenu } from '../tray'
import type { Profile, IpcDataResponse, IpcVoidResponse } from '@shared/types'

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function registerProfileHandlers(): void {
  ipcMain.handle(IPC.PROFILES_GET_ALL, async (): Promise<IpcDataResponse<Profile[]>> => {
    try {
      const data = await ProfileManager.getAll()
      return { success: true, data }
    } catch (err) {
      log.error('profiles:getAll error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.PROFILES_GET_BY_ID, async (_e, id: unknown): Promise<IpcDataResponse<Profile | null>> => {
    if (typeof id !== 'string') return { success: false, error: 'id must be a string' }
    try {
      const data = await ProfileManager.getById(id)
      return { success: true, data }
    } catch (err) {
      log.error('profiles:getById error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.PROFILES_SAVE, async (_e, profile: unknown): Promise<IpcVoidResponse> => {
    try {
      await ProfileManager.save(profile as Profile)
      updateTrayMenu(await ProfileManager.getAll())
      return { success: true }
    } catch (err) {
      log.error('profiles:save error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.PROFILES_DELETE, async (_e, id: unknown): Promise<IpcVoidResponse> => {
    if (typeof id !== 'string') return { success: false, error: 'id must be a string' }
    try {
      await ProfileManager.delete(id)
      updateTrayMenu(await ProfileManager.getAll())
      return { success: true }
    } catch (err) {
      log.error('profiles:delete error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  ipcMain.handle(IPC.PROFILES_DUPLICATE, async (_e, id: unknown): Promise<IpcDataResponse<Profile>> => {
    if (typeof id !== 'string') return { success: false, error: 'id must be a string' }
    try {
      const data = await ProfileManager.duplicate(id)
      updateTrayMenu(await ProfileManager.getAll())
      return { success: true, data }
    } catch (err) {
      log.error('profiles:duplicate error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  log.info('Profile IPC handlers registered')
}
