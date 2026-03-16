import { autoUpdater } from 'electron-updater'
import { app, BrowserWindow } from 'electron'
import log from '../logger'
import { IPC } from '@shared/ipc-channels'
import type { UpdateState, UpdateInfo, UpdateProgress } from '@shared/types'

// Route electron-updater internal logs through our electron-log setup
autoUpdater.logger = log

// Don't download until we've confirmed an update exists
autoUpdater.autoDownload = false

// If the user ignores the prompt, still install on next quit
autoUpdater.autoInstallOnAppQuit = true

let state: UpdateState = {
  status: 'idle',
  info: null,
  progress: null,
  error: null,
}

function broadcast(patch: Partial<UpdateState>): void {
  state = { ...state, ...patch }
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(IPC.UPDATER_STATUS, state)
  }
}

export const AutoUpdater = {
  init(): void {
    // No update checks during development — there's no app-update.yml
    if (!app.isPackaged) {
      log.info('Updater: skipping — app is not packaged')
      return
    }

    autoUpdater.on('checking-for-update', () => {
      log.info('Updater: checking for update')
      broadcast({ status: 'checking', error: null })
    })

    autoUpdater.on('update-available', (info) => {
      log.info('Updater: update available', info.version)
      const updateInfo: UpdateInfo = {
        version: info.version,
        releaseDate: info.releaseDate ?? '',
        releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : null,
      }
      broadcast({ status: 'available', info: updateInfo })

      // Start downloading in the background
      autoUpdater.downloadUpdate().catch((err: unknown) => {
        log.error('Updater: download failed', err)
        broadcast({
          status: 'error',
          error: err instanceof Error ? err.message : String(err),
        })
      })
    })

    autoUpdater.on('update-not-available', () => {
      log.info('Updater: no update available')
      broadcast({ status: 'not-available' })
    })

    autoUpdater.on('download-progress', (prog) => {
      const progress: UpdateProgress = {
        percent: prog.percent,
        bytesPerSecond: prog.bytesPerSecond,
        transferred: prog.transferred,
        total: prog.total,
      }
      broadcast({ status: 'downloading', progress })
    })

    autoUpdater.on('update-downloaded', (info) => {
      log.info('Updater: update downloaded', info.version)
      broadcast({ status: 'downloaded' })
    })

    autoUpdater.on('error', (err) => {
      log.error('Updater: error', err)
      broadcast({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    })

    // Delayed check on startup — don't compete with app initialization
    setTimeout(() => {
      AutoUpdater.check()
    }, 10_000)
  },

  async check(): Promise<void> {
    if (!app.isPackaged) return
    try {
      await autoUpdater.checkForUpdates()
    } catch (err) {
      log.error('Updater: check failed', err)
      broadcast({
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  },

  install(): void {
    autoUpdater.quitAndInstall(false, true)
  },

  getState(): UpdateState {
    return state
  },
}
