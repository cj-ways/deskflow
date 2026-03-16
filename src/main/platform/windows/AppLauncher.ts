/**
 * AppLauncher — one static method per app type.
 *
 * F4: launchIde
 * F5: launchBrowser   (added next phase)
 * F6: launchTerminal  (added next phase)
 * F7: launchApp       (added next phase)
 */

import { spawn } from 'child_process'
import log from '../../logger'
import { findWindowByPid } from './WindowPositioner'
import { runPS } from './utils/powershell'
import type { IdeEntry, LaunchResult } from '@shared/types'

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
