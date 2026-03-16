/**
 * CLI argument parser for DeskFlow.
 *
 * When the app is launched with a recognized command (launch, list, snapshot,
 * open, --help, --version), it runs headlessly and exits. Otherwise, normal
 * GUI startup proceeds.
 */

import { app } from 'electron'
import { APP_NAME, APP_VERSION } from '@shared/constants'
import { ProfileManager } from '../services/ProfileManager'
import log from '../logger'

// ─── Types ───────────────────────────────────────────────────────────────────

export type CliResult =
  | { mode: 'gui' }
  | { mode: 'cli'; run: () => Promise<number> }

// ─── Help Text ───────────────────────────────────────────────────────────────

const HELP_TEXT = `
${APP_NAME} v${APP_VERSION}

Usage:
  deskflow                        Launch the GUI
  deskflow launch <name>          Launch a profile by name
  deskflow list                   List all saved profiles
  deskflow snapshot <name>        Snapshot current desktop and save as profile
  deskflow open                   Open the GUI (or focus if already running)
  deskflow --version, -v          Print version
  deskflow --help, -h             Print this help
`.trim()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function write(msg: string): void {
  process.stdout.write(msg + '\n')
}

function writeErr(msg: string): void {
  process.stderr.write(msg + '\n')
}

// ─── Command Handlers ────────────────────────────────────────────────────────

async function handleList(): Promise<number> {
  try {
    const profiles = await ProfileManager.getAll()
    if (profiles.length === 0) {
      write('No profiles saved yet.')
      return 0
    }
    for (const p of profiles) {
      const launched = p.lastLaunchedAt ? ` (last launched: ${p.lastLaunchedAt})` : ''
      write(`  ${p.name}${launched}`)
    }
    return 0
  } catch (e) {
    writeErr(`Error listing profiles: ${e instanceof Error ? e.message : String(e)}`)
    return 1
  }
}

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Parse process.argv and determine whether to run a CLI command or start the GUI.
 *
 * Electron adds its own args (e.g. the app path, --inspect flags). In packaged
 * mode argv is [exe, ...userArgs]. In dev mode it's [electron, mainScript, ...userArgs].
 * We skip leading args that start with '-' or look like file paths (contain / or \)
 * to find the first positional user argument.
 */
export function parseCli(): CliResult {
  // In packaged app: argv = [exePath, ...userArgs]
  // In dev: argv = [electronPath, scriptPath, ...userArgs]
  const raw = process.argv.slice(app.isPackaged ? 1 : 2)

  // Filter out Electron internal flags (--inspect, --remote-debugging-port, etc.)
  const args = raw.filter((a) => !a.startsWith('--inspect') && !a.startsWith('--remote-debugging'))

  if (args.length === 0) {
    return { mode: 'gui' }
  }

  const cmd = args[0]

  // ── Flags ──────────────────────────────────────────────────────────────────

  if (cmd === '--help' || cmd === '-h') {
    return {
      mode: 'cli',
      run: async () => {
        write(HELP_TEXT)
        return 0
      },
    }
  }

  if (cmd === '--version' || cmd === '-v') {
    return {
      mode: 'cli',
      run: async () => {
        write(`${APP_NAME} v${APP_VERSION}`)
        return 0
      },
    }
  }

  // ── Commands ───────────────────────────────────────────────────────────────

  if (cmd === 'list') {
    return { mode: 'cli', run: handleList }
  }

  if (cmd === 'launch') {
    const name = args[1]
    if (!name) {
      return {
        mode: 'cli',
        run: async () => {
          writeErr('Usage: deskflow launch <profile-name>')
          return 1
        },
      }
    }
    // Actual launch implementation in I2
    return {
      mode: 'cli',
      run: async () => {
        const { handleCliLaunch } = await import('./handlers/launch')
        return handleCliLaunch(name)
      },
    }
  }

  if (cmd === 'snapshot') {
    const name = args[1]
    if (!name) {
      return {
        mode: 'cli',
        run: async () => {
          writeErr('Usage: deskflow snapshot <profile-name>')
          return 1
        },
      }
    }
    // Actual snapshot implementation in I2
    return {
      mode: 'cli',
      run: async () => {
        const { handleCliSnapshot } = await import('./handlers/snapshot')
        return handleCliSnapshot(name)
      },
    }
  }

  if (cmd === 'open') {
    // 'open' means "start the GUI" — just fall through to normal startup
    return { mode: 'gui' }
  }

  // Unknown command
  log.warn(`[CLI] unknown command: ${cmd}`)
  return {
    mode: 'cli',
    run: async () => {
      writeErr(`Unknown command: ${cmd}`)
      write('')
      write(HELP_TEXT)
      return 1
    },
  }
}
