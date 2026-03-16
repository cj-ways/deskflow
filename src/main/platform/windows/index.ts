import type { IPlatform } from '../IPlatform'
import type {
  IdeEntry,
  BrowserEntry,
  TerminalEntry,
  GenericAppEntry,
  LaunchResult,
  Position,
} from '@shared/types'
import { VirtualDesktopManager } from './VirtualDesktopManager'
import { launchIde, launchBrowser, launchTerminal, launchApp } from './AppLauncher'
import { findWindowByPid, positionWindow } from './WindowPositioner'

/**
 * Windows implementation of the platform interface.
 * Delegates to the existing module-level functions and objects.
 */
export class WindowsPlatform implements IPlatform {
  // ─── Virtual Desktops ────────────────────────────────────────────────────
  getDesktopCount(): Promise<number> {
    return VirtualDesktopManager.getDesktopCount()
  }
  createDesktop(): Promise<number> {
    return VirtualDesktopManager.createDesktop()
  }
  switchToDesktop(index: number): Promise<void> {
    return VirtualDesktopManager.switchToDesktop(index)
  }
  moveWindowToDesktop(hwnd: number, index: number): Promise<void> {
    return VirtualDesktopManager.moveWindowToDesktop(hwnd, index)
  }

  // ─── App Launching ───────────────────────────────────────────────────────
  launchIde(entry: IdeEntry, idePath: string): Promise<LaunchResult> {
    return launchIde(entry, idePath)
  }
  launchBrowser(entry: BrowserEntry, browserPath: string): Promise<LaunchResult> {
    return launchBrowser(entry, browserPath)
  }
  launchTerminal(entry: TerminalEntry, terminalPath: string): Promise<LaunchResult> {
    return launchTerminal(entry, terminalPath)
  }
  launchApp(entry: GenericAppEntry): Promise<LaunchResult> {
    return launchApp(entry)
  }

  // ─── Window Management ───────────────────────────────────────────────────
  findWindowByPid(pid: number, timeoutMs: number): Promise<number | null> {
    return findWindowByPid(pid, timeoutMs)
  }
  positionWindow(hwnd: number, position: Position): Promise<void> {
    return positionWindow(hwnd, position)
  }
}
