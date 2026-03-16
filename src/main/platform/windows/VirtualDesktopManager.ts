import { app } from 'electron'
import { join } from 'path'
import log from '../../logger'
import { runPS } from './utils/powershell'

// ─── DLL path ─────────────────────────────────────────────────────────────────

function getDllPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'VirtualDesktopAccessor.dll')
  }
  // In dev, electron-vite builds to out/main/ so app.getAppPath() is the project root
  return join(app.getAppPath(), 'resources', 'VirtualDesktopAccessor.dll')
}

// ─── Script builder ──────────────────────────────────────────────────────────
//
// Each PowerShell call spawns a fresh process, so we include Add-Type every time.
// The DLL path uses a C# verbatim string literal (@"...") so backslashes are safe.
// The "@ terminator of the PS here-string only triggers at the START of a line,
// so @"path" inside a line is unambiguous.

function vdaScript(body: string): string {
  const dll = getDllPath()
  return `Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class VDA {
    [DllImport(@"${dll}")]
    public static extern int GetDesktopCount();
    [DllImport(@"${dll}")]
    public static extern int CreateDesktop();
    [DllImport(@"${dll}")]
    public static extern int GoToDesktopNumber(int n);
    [DllImport(@"${dll}")]
    public static extern int MoveWindowToDesktopNumber(IntPtr hwnd, int n);
}
"@
${body}`
}

// ─── Manager ──────────────────────────────────────────────────────────────────

export const VirtualDesktopManager = {
  /**
   * Returns the current number of virtual desktops (1-based count).
   */
  async getDesktopCount(): Promise<number> {
    log.info('[VDM] getDesktopCount')
    const { stdout } = await runPS(vdaScript('[VDA]::GetDesktopCount()'))
    const n = parseInt(stdout, 10)
    if (!Number.isInteger(n) || n < 1) {
      throw new Error(`getDesktopCount: unexpected output "${stdout}"`)
    }
    log.info(`[VDM] desktop count = ${n}`)
    return n
  },

  /**
   * Creates a new virtual desktop and returns its 0-based index.
   */
  async createDesktop(): Promise<number> {
    log.info('[VDM] createDesktop')
    const { stdout } = await runPS(vdaScript('[VDA]::CreateDesktop()'))
    const n = parseInt(stdout, 10)
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`createDesktop: unexpected output "${stdout}"`)
    }
    log.info(`[VDM] created desktop at index ${n}`)
    return n
  },

  /**
   * Switches the visible desktop to the given 0-based index.
   */
  async switchToDesktop(index: number): Promise<void> {
    log.info(`[VDM] switchToDesktop ${index}`)
    await runPS(vdaScript(`[VDA]::GoToDesktopNumber(${index})`))
  },

  /**
   * Moves a window (by HWND) to the given 0-based desktop index.
   * The HWND is passed as IntPtr to correctly handle 64-bit handles.
   */
  async moveWindowToDesktop(hwnd: number, index: number): Promise<void> {
    log.info(`[VDM] moveWindowToDesktop hwnd=${hwnd} desktop=${index}`)
    await runPS(
      vdaScript(`[VDA]::MoveWindowToDesktopNumber([IntPtr]::new(${hwnd}), ${index})`),
    )
  },
}
