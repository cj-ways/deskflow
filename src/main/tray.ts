import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron'
import { join } from 'path'
import log from './logger'
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

function buildMenu(profiles: Profile[]): Menu {
  const profileItems: MenuItemConstructorOptions[] =
    profiles.length > 0
      ? profiles.map((p) => ({ label: p.name, enabled: false }))
      : [{ label: 'No profiles yet', enabled: false }]

  return Menu.buildFromTemplate([
    ...profileItems,
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
