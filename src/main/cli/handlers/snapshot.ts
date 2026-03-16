/**
 * CLI handler: deskflow snapshot <profile-name>
 * Captures current desktop snapshot, saves as named profile, exits.
 */

import { randomUUID } from 'crypto'
import { getWindows } from '../../platform/windows/SnapshotDetector'
import { buildDraft } from '../../services/SnapshotService'
import { ProfileManager } from '../../services/ProfileManager'
import log from '../../logger'
import type { Profile } from '@shared/types'

function write(msg: string): void {
  process.stdout.write(msg + '\n')
}

function writeErr(msg: string): void {
  process.stderr.write(msg + '\n')
}

export async function handleCliSnapshot(name: string): Promise<number> {
  log.info(`[CLI] snapshot command: "${name}"`)

  try {
    write('Capturing current desktop...')

    const windows = await getWindows()
    write(`  Found ${windows.length} window(s)`)

    const draft = await buildDraft(windows)
    const totalApps = draft.desktops.reduce((sum, d) => sum + d.apps.length, 0)
    write(`  ${totalApps} app(s) across ${draft.desktops.length} desktop(s)`)

    // Convert draft to a full profile
    const profile: Profile = {
      id: randomUUID(),
      name,
      createdAt: draft.createdAt,
      desktops: draft.desktops,
    }

    await ProfileManager.save(profile)
    write(`Saved profile "${name}" (${profile.id})`)

    // Print summary
    for (const desktop of profile.desktops) {
      write(`  Desktop ${desktop.index + 1}: ${desktop.apps.length} app(s)`)
      for (const app of desktop.apps) {
        switch (app.type) {
          case 'ide':
            write(`    - IDE: ${app.folder || '(no folder)'}`)
            break
          case 'browser':
            write(`    - Browser: ${app.mode === 'local' ? `localhost:${app.port}` : app.url || '(no url)'}`)
            break
          case 'terminal':
            write(`    - Terminal: ${app.mode === 'command' ? app.command || '(no command)' : app.scriptPath}`)
            break
          case 'app':
            write(`    - App: ${app.path}`)
            break
        }
      }
    }

    return 0
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    log.error('[CLI] snapshot error', e)
    writeErr(`Snapshot failed: ${msg}`)
    return 1
  }
}
