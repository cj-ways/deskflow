import { Tray, Menu, Notification, nativeImage, app, BrowserWindow } from 'electron'
import { join } from 'path'
import log from './logger'
import { LaunchEngine } from './services/LaunchEngine'
import { ProfileManager } from './services/ProfileManager'
import { SettingsManager } from './services/SettingsManager'
import { getWindows } from './platform/windows/SnapshotDetector'
import { buildDraft } from './services/SnapshotService'
import { IPC } from '@shared/ipc-channels'
import type { Profile } from '@shared/types'
import type { MenuItemConstructorOptions } from 'electron'

let tray: Tray | null = null

function getIconPath(): string {
  // Packaged: icon is copied to resourcesPath via extraResources in electron-builder.yml
  // Dev: resolve relative to compiled out/main/ directory
  return app.isPackaged
    ? join(process.resourcesPath, 'icon.ico')
    : join(__dirname, '../../resources/icon.ico')
}

function focusMainWindow(): void {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) {
    if (win.isMinimized()) win.restore()
    win.show()
    win.focus()
  }
}

async function launchFromTray(profile: Profile): Promise<void> {
  log.info(`[Tray] launching profile="${profile.name}"`)
  const engine = new LaunchEngine()
  const settings = await SettingsManager.get()

  try {
    const report = await engine.launch(profile, settings, (event) => {
      // Also forward progress to renderer windows if open
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send('launch:progress', event)
      }
    })

    if (report.success) {
      profile.lastLaunchedAt = new Date().toISOString()
      await ProfileManager.save(profile)

      new Notification({
        title: 'DeskFlow',
        body: `"${profile.name}" launched successfully`,
      }).show()
    } else if (report.cancelled) {
      new Notification({
        title: 'DeskFlow',
        body: `"${profile.name}" launch was cancelled`,
      }).show()
    } else {
      const failed = report.results.filter((r) => !r.ok).length
      new Notification({
        title: 'DeskFlow',
        body: `"${profile.name}" launched with ${failed} error(s)`,
      }).show()
    }
  } catch (e) {
    log.error(`[Tray] launch error for "${profile.name}"`, e)
    new Notification({
      title: 'DeskFlow',
      body: `Failed to launch "${profile.name}": ${e instanceof Error ? e.message : String(e)}`,
    }).show()
  }
}

async function snapshotFromTray(): Promise<void> {
  log.info('[Tray] snapshot triggered')
  try {
    const windows = await getWindows()
    const draft = await buildDraft(windows)

    // Show main window and send snapshot data
    focusMainWindow()

    // Small delay to ensure window is ready to receive events
    setTimeout(() => {
      for (const win of BrowserWindow.getAllWindows()) {
        win.webContents.send(IPC.SNAPSHOT_READY, draft)
      }
    }, 300)

    new Notification({
      title: 'DeskFlow',
      body: `Captured ${draft.desktops.reduce((s, d) => s + d.apps.length, 0)} apps across ${draft.desktops.length} desktop(s)`,
    }).show()
  } catch (e) {
    log.error('[Tray] snapshot error', e)
    new Notification({
      title: 'DeskFlow',
      body: `Snapshot failed: ${e instanceof Error ? e.message : String(e)}`,
    }).show()
  }
}

function buildMenu(profiles: Profile[]): Menu {
  const profileItems: MenuItemConstructorOptions[] =
    profiles.length > 0
      ? profiles.map((p) => ({
          label: p.name,
          click: () => launchFromTray(p),
        }))
      : [{ label: 'No profiles yet', enabled: false }]

  return Menu.buildFromTemplate([
    ...profileItems,
    { type: 'separator' },
    {
      label: 'Snapshot current desktop...',
      click: () => snapshotFromTray(),
    },
    { type: 'separator' },
    {
      label: 'Open DeskFlow',
      click: focusMainWindow,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      // app.exit bypasses the close-intercept handler — no isQuitting flag needed
      click: () => app.exit(0),
    },
  ])
}

export function initTray(profiles: Profile[] = []): void {
  const icon = nativeImage.createFromPath(getIconPath())
  tray = new Tray(icon)
  tray.setToolTip('DeskFlow')
  tray.setContextMenu(buildMenu(profiles))

  // Left-click → show/focus main window (right-click shows context menu automatically)
  tray.on('click', focusMainWindow)

  log.info('System tray initialized')
}

export function updateTrayMenu(profiles: Profile[]): void {
  if (tray) {
    tray.setContextMenu(buildMenu(profiles))
  }
}
