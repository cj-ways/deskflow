import type {
  IdeEntry,
  BrowserEntry,
  TerminalEntry,
  GenericAppEntry,
  LaunchResult,
  Position,
} from '@shared/types'

/**
 * OS abstraction interface for all platform-specific operations.
 *
 * Services (LaunchEngine, SnapshotService, etc.) depend on this interface,
 * never on Windows-specific code directly. This enables future Mac/Linux
 * ports by implementing a new class per platform.
 */
export interface IPlatform {
  // ─── Virtual Desktops ────────────────────────────────────────────────────
  getDesktopCount(): Promise<number>
  createDesktop(): Promise<number>
  switchToDesktop(index: number): Promise<void>
  moveWindowToDesktop(hwnd: number, index: number): Promise<void>

  // ─── App Launching ───────────────────────────────────────────────────────
  launchIde(entry: IdeEntry, idePath: string): Promise<LaunchResult>
  launchBrowser(entry: BrowserEntry, browserPath: string): Promise<LaunchResult>
  launchTerminal(entry: TerminalEntry, terminalPath: string): Promise<LaunchResult>
  launchApp(entry: GenericAppEntry): Promise<LaunchResult>

  // ─── Window Management ───────────────────────────────────────────────────
  findWindowByPid(pid: number, timeoutMs: number): Promise<number | null>
  positionWindow(hwnd: number, position: Position): Promise<void>
}
