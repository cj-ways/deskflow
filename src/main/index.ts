import log from './logger'
import { app, BrowserWindow, Menu, nativeImage } from 'electron'
import { join } from 'path'
import { registerProfileHandlers } from './ipc/profiles.ipc'
import { registerDialogHandlers } from './ipc/dialog.ipc'
import { registerLaunchHandlers } from './ipc/launch.ipc'
import { registerSnapshotHandlers } from './ipc/snapshot.ipc'
import { registerSettingsHandlers } from './ipc/settings.ipc'
import { registerUpdaterHandlers } from './ipc/updater.ipc'
import { AutoUpdater } from './services/AutoUpdater'
import { initTray } from './tray'
import { ProfileManager } from './services/ProfileManager'
import { APP_BUNDLE_ID } from '@shared/constants'

let mainWindow: BrowserWindow | null = null

function getIconPath(): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'icon.ico')
    : join(__dirname, '../../resources/icon.ico')
}

// Set to true before calling app.quit() so the close handler lets it through
let isQuitting = false

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function quitApp(): void {
  isQuitting = true
  app.quit()
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    icon: nativeImage.createFromPath(getIconPath()),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Hide on close instead of quitting — tray (C2) is the only way to quit
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── Single-instance lock ─────────────────────────────────────────────────────
// Must be called before app.whenReady(). Returns false if another instance owns
// the lock — in that case the second instance quits immediately.

if (!app.requestSingleInstanceLock()) {
  log.info('Second instance detected — deferring to existing instance')
  app.quit()
} else {
  app.setAppUserModelId(APP_BUNDLE_ID)

  // Second launch attempt while the app is already running → show + focus
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    log.info('app ready')
    Menu.setApplicationMenu(null)
    registerProfileHandlers()
    registerDialogHandlers()
    registerLaunchHandlers()
    registerSnapshotHandlers()
    registerSettingsHandlers()
    registerUpdaterHandlers()
    const profiles = await ProfileManager.getAll()
    initTray(profiles)
    createWindow()
    AutoUpdater.init()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  app.on('window-all-closed', () => {
    // On Windows/Linux: only reached when isQuitting=true because normal close is
    // intercepted and hides the window. On macOS: standard behaviour.
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
}
