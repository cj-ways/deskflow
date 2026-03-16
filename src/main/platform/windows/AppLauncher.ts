/**
 * AppLauncher — one static method per app type.
 *
 * F4: launchIde
 * F5: launchBrowser
 * F6: launchTerminal
 * F7: launchApp
 */

import { spawn } from 'child_process'
import log from '../../logger'
import { findWindowByPid } from './WindowPositioner'
import { runPS } from './utils/powershell'
import type { IdeEntry, BrowserEntry, TerminalEntry, GenericAppEntry, LaunchResult } from '@shared/types'

// How long to wait for an app window to appear after spawning
const WINDOW_WAIT_MS = 20_000

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Returns the set of PIDs currently running under `processName`
 * (matches Get-Process -Name, no extension needed).
 */
async function getRunningPids(processName: string): Promise<Set<number>> {
  try {
    const { stdout } = await runPS(
      `$p = Get-Process -Name '${processName}' -ErrorAction SilentlyContinue
if ($p) { Write-Output (($p.Id) -join ' ') }`,
    )
    const pids = stdout
      .split(/\s+/)
      .filter(Boolean)
      .map(Number)
      .filter((n) => !isNaN(n) && n > 0)
    return new Set(pids)
  } catch {
    return new Set()
  }
}

/**
 * Polls every 500 ms until a process named `processName` appears whose PID
 * is NOT in `knownPids`.  Returns the new PID, or null on timeout.
 */
async function pollForNewPid(
  processName: string,
  knownPids: Set<number>,
  timeoutMs: number,
): Promise<number | null> {
  const knownArr = [...knownPids]
  // Build a PowerShell array literal like @(1234,5678) or @()
  const knownLiteral = knownArr.length > 0 ? `@(${knownArr.join(',')})` : '@()'
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      const { stdout } = await runPS(
        `$known = ${knownLiteral}
$all   = (Get-Process -Name '${processName}' -ErrorAction SilentlyContinue).Id
$new   = $all | Where-Object { $known -notcontains $_ }
if ($new) { Write-Output ($new | Select-Object -First 1) }`,
      )
      const pid = parseInt(stdout, 10)
      if (!isNaN(pid) && pid > 0) return pid
    } catch {
      // PS failure is non-fatal during polling — keep trying
    }
    await delay(500)
  }
  return null
}

// ─── IDE launcher ─────────────────────────────────────────────────────────────

/**
 * Launches VS Code to `entry.folder`.
 *
 * Handles both direct Code.exe paths and the common code.cmd wrapper:
 *   - Direct .exe → track the spawned PID directly with findWindowByPid
 *   - .cmd / .bat wrapper → the wrapper exits immediately; poll for a new
 *     Code.exe process instead
 *
 * Always passes --new-window to ensure a fresh window regardless of whether
 * VS Code is already running.
 */
export async function launchIde(entry: IdeEntry, vscodePath: string): Promise<LaunchResult> {
  log.info(`[AppLauncher] launchIde folder="${entry.folder}" ide="${vscodePath}"`)

  try {
    const isWrapper = /\.(cmd|bat)$/i.test(vscodePath)

    // Snapshot existing Code.exe PIDs so we can spot the new one
    const knownPids = await getRunningPids('Code')
    log.info(`[AppLauncher] existing Code.exe PIDs: [${[...knownPids].join(', ')}]`)

    // Spawn VS Code — use shell:true for .cmd/.bat wrappers
    const child = spawn(vscodePath, ['--new-window', entry.folder], {
      detached: true,
      shell: isWrapper,
      stdio: 'ignore',
    })
    child.unref()
    log.info(`[AppLauncher] spawned pid=${child.pid ?? '?'} shell=${isWrapper}`)

    // For direct .exe launches, findWindowByPid works immediately
    if (!isWrapper && child.pid) {
      const hwnd = await findWindowByPid(child.pid, WINDOW_WAIT_MS)
      if (hwnd !== null) {
        log.info(`[AppLauncher] launchIde success hwnd=${hwnd} pid=${child.pid}`)
        return { success: true, hwnd, pid: child.pid }
      }
    }

    // .cmd wrapper (or direct .exe that spawned a child process):
    // poll for a brand-new Code.exe PID
    const newPid = await pollForNewPid('Code', knownPids, WINDOW_WAIT_MS)
    if (newPid === null) {
      return {
        success: false,
        error: `VS Code did not open a window within ${WINDOW_WAIT_MS / 1000}s`,
      }
    }

    const hwnd = await findWindowByPid(newPid, 8_000)
    if (hwnd === null) {
      return {
        success: false,
        error: `VS Code started (pid=${newPid}) but window did not appear`,
      }
    }

    log.info(`[AppLauncher] launchIde success hwnd=${hwnd} pid=${newPid}`)
    return { success: true, hwnd, pid: newPid }
  } catch (e) {
    log.error('[AppLauncher] launchIde error', e)
    return { success: false, error: String(e) }
  }
}

// ─── Browser launcher ────────────────────────────────────────────────────────

/**
 * Resolves the process name from the browser executable path.
 * e.g. "C:\Program Files\Google\Chrome\Application\chrome.exe" → "chrome"
 */
function browserProcessName(browserPath: string): string {
  const match = browserPath.match(/([^/\\]+?)(?:\.exe)?$/i)
  return match ? match[1] : 'chrome'
}

/**
 * Launches a browser window to the given URL.
 *
 * Handles both local dev server (http://localhost:{port}) and website URLs.
 * Uses --new-window to force a fresh window instead of a new tab in an
 * existing browser instance.
 *
 * Because modern browsers (Chrome, Edge) are multi-process, the spawned
 * parent may exit immediately and delegate to an existing browser process.
 * We snapshot PIDs before launch and poll for a new one, same approach as
 * the code.cmd wrapper in launchIde.
 */
export async function launchBrowser(
  entry: BrowserEntry,
  browserPath: string,
): Promise<LaunchResult> {
  const url = entry.mode === 'local' ? `http://localhost:${entry.port}` : entry.url
  log.info(`[AppLauncher] launchBrowser url="${url}" browser="${browserPath}"`)

  try {
    const processName = browserProcessName(browserPath)
    const knownPids = await getRunningPids(processName)
    log.info(`[AppLauncher] existing ${processName} PIDs: [${[...knownPids].join(', ')}]`)

    const child = spawn(browserPath, ['--new-window', url], {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    log.info(`[AppLauncher] spawned pid=${child.pid ?? '?'}`)

    // Try direct PID first (works when no existing browser instance)
    if (child.pid) {
      const hwnd = await findWindowByPid(child.pid, WINDOW_WAIT_MS)
      if (hwnd !== null) {
        log.info(`[AppLauncher] launchBrowser success hwnd=${hwnd} pid=${child.pid}`)
        return { success: true, hwnd, pid: child.pid }
      }
    }

    // Browser likely delegated to existing process — poll for new PID
    const newPid = await pollForNewPid(processName, knownPids, WINDOW_WAIT_MS)
    if (newPid === null) {
      return {
        success: false,
        error: `Browser did not open a new window within ${WINDOW_WAIT_MS / 1000}s`,
      }
    }

    const hwnd = await findWindowByPid(newPid, 8_000)
    if (hwnd === null) {
      return {
        success: false,
        error: `Browser started (pid=${newPid}) but window did not appear`,
      }
    }

    log.info(`[AppLauncher] launchBrowser success hwnd=${hwnd} pid=${newPid}`)
    return { success: true, hwnd, pid: newPid }
  } catch (e) {
    log.error('[AppLauncher] launchBrowser error', e)
    return { success: false, error: String(e) }
  }
}

// ─── Terminal launcher ───────────────────────────────────────────────────────

/**
 * Resolves the process name for the terminal application.
 * Windows Terminal = "WindowsTerminal", cmd.exe = "cmd", powershell = "powershell".
 */
function terminalProcessName(terminalPath: string): string {
  // `wt` and `wt.exe` both map to WindowsTerminal
  if (/^wt(\.exe)?$/i.test(terminalPath) || /\\wt\.exe$/i.test(terminalPath)) {
    return 'WindowsTerminal'
  }
  const match = terminalPath.match(/([^/\\]+?)(?:\.exe)?$/i)
  return match ? match[1] : 'WindowsTerminal'
}

/**
 * Launches a terminal window.
 *
 * Command mode: opens Windows Terminal (or configured terminal) with a working
 * directory and runs the command interactively (cmd /k keeps window open).
 *
 * Script mode: executes the script file. .ps1 files are run via powershell,
 * .bat/.cmd files via cmd /c, other extensions via cmd /c.
 *
 * Windows Terminal spawns a separate process, so we use the PID-snapshot +
 * pollForNewPid approach.
 */
export async function launchTerminal(
  entry: TerminalEntry,
  terminalPath: string,
): Promise<LaunchResult> {
  log.info(
    `[AppLauncher] launchTerminal mode="${entry.mode}" terminal="${terminalPath}"`,
  )

  try {
    const processName = terminalProcessName(terminalPath)
    const knownPids = await getRunningPids(processName)
    log.info(`[AppLauncher] existing ${processName} PIDs: [${[...knownPids].join(', ')}]`)

    let args: string[]

    if (entry.mode === 'command') {
      // wt -d <dir> cmd /k <command>  — keeps the terminal open after command runs
      args = ['-d', entry.workingDir, 'cmd', '/k', entry.command]
      log.info(`[AppLauncher] command: wt -d "${entry.workingDir}" cmd /k ${entry.command}`)
    } else {
      // Script mode — determine how to execute based on extension
      const ext = entry.scriptPath.split('.').pop()?.toLowerCase() ?? ''
      if (ext === 'ps1') {
        args = [
          'powershell',
          '-ExecutionPolicy', 'Bypass',
          '-NoExit',
          '-File', entry.scriptPath,
        ]
      } else {
        // .bat, .cmd, or other — run via cmd /k to keep window open
        args = ['cmd', '/k', entry.scriptPath]
      }
      log.info(`[AppLauncher] script: wt ${args.join(' ')}`)
    }

    const child = spawn(terminalPath, args, {
      detached: true,
      shell: true,
      stdio: 'ignore',
    })
    child.unref()
    log.info(`[AppLauncher] spawned pid=${child.pid ?? '?'}`)

    // Try direct PID first
    if (child.pid) {
      const hwnd = await findWindowByPid(child.pid, WINDOW_WAIT_MS)
      if (hwnd !== null) {
        log.info(`[AppLauncher] launchTerminal success hwnd=${hwnd} pid=${child.pid}`)
        return { success: true, hwnd, pid: child.pid }
      }
    }

    // Windows Terminal delegates to a single instance — poll for new PID
    const newPid = await pollForNewPid(processName, knownPids, WINDOW_WAIT_MS)
    if (newPid === null) {
      return {
        success: false,
        error: `Terminal did not open a window within ${WINDOW_WAIT_MS / 1000}s`,
      }
    }

    const hwnd = await findWindowByPid(newPid, 8_000)
    if (hwnd === null) {
      return {
        success: false,
        error: `Terminal started (pid=${newPid}) but window did not appear`,
      }
    }

    log.info(`[AppLauncher] launchTerminal success hwnd=${hwnd} pid=${newPid}`)
    return { success: true, hwnd, pid: newPid }
  } catch (e) {
    log.error('[AppLauncher] launchTerminal error', e)
    return { success: false, error: String(e) }
  }
}

// ─── Generic app launcher ────────────────────────────────────────────────────

/**
 * Launches any executable with optional arguments.
 *
 * Simpler than the other launchers — most standalone apps create their own
 * process and window directly, so findWindowByPid on the spawned PID is
 * usually sufficient. Falls back to pollForNewPid for apps that delegate
 * to an existing instance (e.g. Spotify, Discord).
 */
export async function launchApp(entry: GenericAppEntry): Promise<LaunchResult> {
  log.info(`[AppLauncher] launchApp path="${entry.path}" args=[${entry.args.join(', ')}]`)

  try {
    // Extract process name for PID polling fallback
    const match = entry.path.match(/([^/\\]+?)(?:\.exe)?$/i)
    const processName = match ? match[1] : 'unknown'
    const knownPids = await getRunningPids(processName)
    log.info(`[AppLauncher] existing ${processName} PIDs: [${[...knownPids].join(', ')}]`)

    const child = spawn(entry.path, entry.args, {
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    log.info(`[AppLauncher] spawned pid=${child.pid ?? '?'}`)

    // Try direct PID first — works for most standalone apps
    if (child.pid) {
      const hwnd = await findWindowByPid(child.pid, WINDOW_WAIT_MS)
      if (hwnd !== null) {
        log.info(`[AppLauncher] launchApp success hwnd=${hwnd} pid=${child.pid}`)
        return { success: true, hwnd, pid: child.pid }
      }
    }

    // App may have delegated to an existing instance — poll for new PID
    const newPid = await pollForNewPid(processName, knownPids, WINDOW_WAIT_MS)
    if (newPid === null) {
      return {
        success: false,
        error: `App did not open a window within ${WINDOW_WAIT_MS / 1000}s`,
      }
    }

    const hwnd = await findWindowByPid(newPid, 8_000)
    if (hwnd === null) {
      return {
        success: false,
        error: `App started (pid=${newPid}) but window did not appear`,
      }
    }

    log.info(`[AppLauncher] launchApp success hwnd=${hwnd} pid=${newPid}`)
    return { success: true, hwnd, pid: newPid }
  } catch (e) {
    log.error('[AppLauncher] launchApp error', e)
    return { success: false, error: String(e) }
  }
}
