import { ipcMain } from 'electron'
import log from '../logger'
import { IPC } from '@shared/ipc-channels'
import { getWindows } from '../platform/windows/SnapshotDetector'
import { buildDraft } from '../services/SnapshotService'
import type { ProfileDraft, IpcDataResponse } from '@shared/types'

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function registerSnapshotHandlers(): void {
  ipcMain.handle(IPC.SNAPSHOT_CAPTURE, async (): Promise<IpcDataResponse<ProfileDraft>> => {
    try {
      log.info('[snapshot.ipc] capturing snapshot')
      const windows = await getWindows()
      const draft = await buildDraft(windows)
      log.info(`[snapshot.ipc] snapshot complete: ${draft.desktops.length} desktops, ${draft.desktops.reduce((s, d) => s + d.apps.length, 0)} apps`)
      return { success: true, data: draft }
    } catch (err) {
      log.error('[snapshot.ipc] snapshot:capture error', err)
      return { success: false, error: errMsg(err) }
    }
  })

  log.info('Snapshot IPC handlers registered')
}
