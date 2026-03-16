import { app } from 'electron'
import { join } from 'path'
import log from '../../logger'
import { runPS } from './utils/powershell'
import type { WindowInfo } from '@shared/types'

function getDllPath(): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'VirtualDesktopAccessor.dll')
  }
  return join(app.getAppPath(), 'resources', 'VirtualDesktopAccessor.dll')
}

/**
 * Enumerates all user-visible windows with process metadata and virtual
 * desktop index. Filters out system windows, DeskFlow itself, taskbar, etc.
 *
 * The entire enumeration runs in a single PowerShell invocation for
 * performance — one PS spawn instead of N per window.
 *
 * Output format: one JSON line per window, parsed in TypeScript.
 */
export async function getWindows(): Promise<WindowInfo[]> {
  const dll = getDllPath()
  const ownPid = process.pid

  // Single PS script that:
  // 1. Loads Win32 APIs + VDA DLL via Add-Type
  // 2. EnumWindows to find visible, non-zero-title windows
  // 3. For each: gets pid, exe path, working dir, desktop index, bounds
  // 4. Outputs JSON lines
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

public class SnapWin32 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lp);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int maxCount);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
    [DllImport("dwmapi.dll")] public static extern int DwmGetWindowAttribute(
        IntPtr hWnd, int dwAttribute, out int pvAttribute, int cbAttribute);

    [DllImport(@"${dll}")] public static extern int GetWindowDesktopNumber(IntPtr hWnd);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT { public int Left, Top, Right, Bottom; }

    public struct WinInfo {
        public long hwnd;
        public int pid;
        public string title;
        public int desktopIndex;
        public int x, y, w, h;
    }

    public static List<WinInfo> Enumerate(int excludePid) {
        var results = new List<WinInfo>();
        EnumWindows((hWnd, _) => {
            if (!IsWindowVisible(hWnd)) return true;
            int len = GetWindowTextLength(hWnd);
            if (len == 0) return true;

            // Skip cloaked windows (UWP apps hidden by the shell)
            int cloaked = 0;
            DwmGetWindowAttribute(hWnd, 14, out cloaked, sizeof(int));
            if (cloaked != 0) return true;

            uint wPid;
            GetWindowThreadProcessId(hWnd, out wPid);
            if ((int)wPid == excludePid) return true;

            var sb = new StringBuilder(len + 1);
            GetWindowText(hWnd, sb, sb.Capacity);
            string title = sb.ToString();

            RECT rect;
            GetWindowRect(hWnd, out rect);

            int deskIdx = -1;
            try { deskIdx = GetWindowDesktopNumber(hWnd); } catch {}

            results.Add(new WinInfo {
                hwnd = hWnd.ToInt64(),
                pid = (int)wPid,
                title = title,
                desktopIndex = deskIdx < 0 ? 0 : deskIdx,
                x = rect.Left,
                y = rect.Top,
                w = rect.Right - rect.Left,
                h = rect.Bottom - rect.Top
            });
            return true;
        }, IntPtr.Zero);
        return results;
    }
}
"@

$wins = [SnapWin32]::Enumerate(${ownPid})
foreach ($w in $wins) {
    $exePath = ""
    $workDir = ""
    try {
        $proc = Get-Process -Id $w.pid -ErrorAction SilentlyContinue
        if ($proc -and $proc.MainModule) {
            $exePath = $proc.MainModule.FileName
            $workDir = [System.IO.Path]::GetDirectoryName($exePath)
        }
    } catch {}

    # Skip windows with no exe path (system processes we can't inspect)
    if (-not $exePath) { continue }

    # Skip common system/shell windows
    $exeName = [System.IO.Path]::GetFileNameWithoutExtension($exePath).ToLower()
    if ($exeName -in @("explorer", "shellexperiencehost", "searchhost", "startmenuexperiencehost", "textinputhost", "applicationframehost")) { continue }

    # Skip windows with zero or negative size
    if ($w.w -le 0 -or $w.h -le 0) { continue }

    $obj = @{
        hwnd = $w.hwnd
        pid = $w.pid
        title = $w.title
        exePath = $exePath
        workingDir = $workDir
        desktopIndex = $w.desktopIndex
        x = $w.x
        y = $w.y
        width = $w.w
        height = $w.h
    }
    Write-Output (ConvertTo-Json $obj -Compress)
}
`

  log.info('[SnapshotDetector] enumerating windows')

  try {
    const { stdout } = await runPS(script, 30_000)

    const windows: WindowInfo[] = []
    for (const line of stdout.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const obj = JSON.parse(trimmed) as {
          hwnd: number
          pid: number
          title: string
          exePath: string
          workingDir: string
          desktopIndex: number
          x: number
          y: number
          width: number
          height: number
        }
        windows.push({
          hwnd: obj.hwnd,
          pid: obj.pid,
          title: obj.title,
          exePath: obj.exePath,
          workingDir: obj.workingDir,
          desktopIndex: obj.desktopIndex,
          bounds: {
            x: obj.x,
            y: obj.y,
            width: obj.width,
            height: obj.height,
          },
        })
      } catch {
        log.warn(`[SnapshotDetector] skipping unparseable line: ${trimmed.slice(0, 100)}`)
      }
    }

    log.info(`[SnapshotDetector] found ${windows.length} windows`)
    return windows
  } catch (e) {
    log.error('[SnapshotDetector] enumeration failed', e)
    throw e
  }
}
