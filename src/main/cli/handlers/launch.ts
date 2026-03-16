/**
 * CLI handler: deskflow launch <profile-name>
 * Loads profile by name, runs LaunchEngine headlessly, prints report, exits.
 */

import { ProfileManager } from '../../services/ProfileManager'
import { SettingsManager } from '../../services/SettingsManager'
import { LaunchEngine } from '../../services/LaunchEngine'
import log from '../../logger'

function write(msg: string): void {
  process.stdout.write(msg + '\n')
}

function writeErr(msg: string): void {
  process.stderr.write(msg + '\n')
}

export async function handleCliLaunch(name: string): Promise<number> {
  log.info(`[CLI] launch command: "${name}"`)

  try {
    // Find profile by name (case-insensitive)
    const profiles = await ProfileManager.getAll()
    const profile = profiles.find((p) => p.name.toLowerCase() === name.toLowerCase())

    if (!profile) {
      writeErr(`Profile not found: "${name}"`)
      if (profiles.length > 0) {
        writeErr('')
        writeErr('Available profiles:')
        for (const p of profiles) {
          writeErr(`  ${p.name}`)
        }
      }
      return 1
    }

    const settings = await SettingsManager.get()
    const engine = new LaunchEngine()

    write(`Launching "${profile.name}"...`)

    const report = await engine.launch(profile, settings, (event) => {
      // Print progress to stdout
      switch (event.type) {
        case 'desktop-creating':
        case 'desktop-created':
          write(`  ${event.message}`)
          break
        case 'app-launching':
          write(`  [${event.progress.completed + 1}/${event.progress.total}] ${event.message}`)
          break
        case 'app-done':
          write(`  [${event.progress.completed}/${event.progress.total}] ${event.message}`)
          break
        case 'app-failed':
          writeErr(`  [${event.progress.completed}/${event.progress.total}] ${event.message}: ${event.error ?? 'unknown error'}`)
          break
        case 'complete':
          write(`  ${event.message}`)
          break
        case 'cancelled':
          write(`  ${event.message}`)
          break
      }
    })

    // Update lastLaunchedAt on success
    if (report.success) {
      profile.lastLaunchedAt = new Date().toISOString()
      await ProfileManager.save(profile)
    }

    const failed = report.results.filter((r) => !r.ok).length
    if (report.success) {
      write(`Done — ${report.results.length} app(s) launched successfully.`)
      return 0
    } else if (report.cancelled) {
      write('Launch was cancelled.')
      return 1
    } else {
      writeErr(`Done with ${failed} error(s) out of ${report.results.length} app(s).`)
      return 1
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('[CLI] launch error', e)
    writeErr(`Launch failed: ${msg}`)
    return 1
  }
}
