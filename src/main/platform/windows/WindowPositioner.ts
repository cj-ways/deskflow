import log from '../../logger'
import { runPS } from './utils/powershell'
import type { Position } from '@shared/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// ─── Work area ───────────────────────────────────────────────────────────────

/**
 * Returns the primary monitor's work area (screen minus taskbar) in pixels.
 * Uses System.Windows.Forms.Screen — no P/Invoke needed.
 */
export async function getWorkArea(): Promise<Rect> {
  const { stdout } = await runPS(
    `Add-Type -AssemblyName System.Windows.Forms
$s = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
Write-Output "$($s.X) $($s.Y) $($s.Width) $($s.Height)"`,
  )
  const [x, y, width, height] = stdout.split(' ').map(Number)
  if ([x, y, width, height].some(isNaN) || width <= 0 || height <= 0) {
    throw new Error(`getWorkArea: unexpected output "${stdout}"`)
  }
  log.info(`[WP] workArea x=${x} y=${y} w=${width} h=${height}`)
  return { x, y, width, height }
}

// ─── Preset resolver ─────────────────────────────────────────────────────────

/**
 * Pure function: maps a Position preset to absolute pixel coordinates.
 *
 * Grid presets (top-left … bottom-right): each window occupies a half-screen
 * tile (50% × 50%) placed at the logical grid position. Center-row and
 * center-column tiles are shifted by W/4 or H/4 to stay centred.
 *
 * Special presets: left-half / right-half (50% × 100%), full (100% × 100%).
 */
export function resolvePreset(position: Position, workArea: Rect): Rect {
  const { x: wx, y: wy, width: W, height: H } = workArea
  const hw = Math.round(W / 2)
  const hh = Math.round(H / 2)
  const qw = Math.round(W / 4)
  const qh = Math.round(H / 4)

  switch (position) {
    case 'top-left':      return { x: wx,        y: wy,        width: hw, height: hh }
    case 'top-center':    return { x: wx + qw,    y: wy,        width: hw, height: hh }
    case 'top-right':     return { x: wx + hw,    y: wy,        width: hw, height: hh }
    case 'middle-left':   return { x: wx,         y: wy + qh,   width: hw, height: hh }
    case 'center':        return { x: wx + qw,    y: wy + qh,   width: hw, height: hh }
    case 'middle-right':  return { x: wx + hw,    y: wy + qh,   width: hw, height: hh }
    case 'bottom-left':   return { x: wx,         y: wy + hh,   width: hw, height: hh }
    case 'bottom-center': return { x: wx + qw,    y: wy + hh,   width: hw, height: hh }
    case 'bottom-right':  return { x: wx + hw,    y: wy + hh,   width: hw, height: hh }
    case 'left-half':     return { x: wx,         y: wy,        width: hw, height: H  }
    case 'right-half':    return { x: wx + hw,    y: wy,        width: hw, height: H  }
    case 'full':          return { x: wx,         y: wy,        width: W,  height: H  }
  }
}

// ─── Window finder ────────────────────────────────────────────────────────────

const FIND_WINDOW_C_SHARP = `
using System;
using System.Runtime.InteropServices;
public class WinEnum {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lp);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    public static long GetMainWindowByPid(int pid) {
        long found = 0;
        EnumWindows((hWnd, _) => {
            if (!IsWindowVisible(hWnd)) return true;
            uint wPid; GetWindowThreadProcessId(hWnd, out wPid);
            if ((int)wPid == pid) { found = hWnd.ToInt64(); return false; }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}`

/**
 * Polls every 250 ms until a visible window belonging to `pid` appears,
 * or until `timeoutMs` elapses.  Returns the HWND as a number, or null.
 */
export async function findWindowByPid(
  pid: number,
  timeoutMs: number,
): Promise<number | null> {
  log.info(`[WP] findWindowByPid pid=${pid} timeout=${timeoutMs}ms`)
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const { stdout } = await runPS(
      `Add-Type -TypeDefinition @"${FIND_WINDOW_C_SHARP}"@
Write-Output ([WinEnum]::GetMainWindowByPid(${pid}))`,
    )
    const hwnd = parseInt(stdout, 10)
    if (!isNaN(hwnd) && hwnd > 0) {
      log.info(`[WP] found hwnd=${hwnd} for pid=${pid}`)
      return hwnd
    }
    // Wait 250 ms before retrying (using a PS sleep to avoid tight-loop spawning)
    await new Promise<void>((r) => setTimeout(r, 250))
  }

  log.warn(`[WP] findWindowByPid timed out for pid=${pid}`)
  return null
}

// ─── Window positioner ────────────────────────────────────────────────────────

const SET_WINDOW_POS_C_SHARP = `
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(
        IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
}`

/**
 * Restores the window (un-minimises if needed), then moves and resizes it
 * to the pixel rectangle defined by `position` on the primary monitor.
 */
export async function positionWindow(hwnd: number, position: Position): Promise<void> {
  const workArea = await getWorkArea()
  const { x, y, width, height } = resolvePreset(position, workArea)
  log.info(`[WP] positionWindow hwnd=${hwnd} pos=${position} → ${x},${y} ${width}×${height}`)

  await runPS(
    `Add-Type -TypeDefinition @"${SET_WINDOW_POS_C_SHARP}"@
$hWnd = [IntPtr]::new(${hwnd})
[Win32]::ShowWindow($hWnd, 9) | Out-Null
[Win32]::SetWindowPos($hWnd, [IntPtr]::Zero, ${x}, ${y}, ${width}, ${height}, 0x0040) | Out-Null`,
  )
}
