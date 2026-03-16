import log from '../logger'
import { getPlatform } from '../platform'
import type {
  Profile,
  Settings,
  AppEntry,
  LaunchResult,
  AppLaunchResult,
  LaunchReport,
  LaunchProgressEvent,
} from '@shared/types'

type ProgressCallback = (event: LaunchProgressEvent) => void

/**
 * Orchestrates a full profile launch — creates virtual desktops, launches
 * each app, positions windows, and moves them to the correct desktop.
 *
 * One app failing does not stop the rest. The engine emits progress events
 * so the UI can show real-time feedback. Supports mid-launch cancellation.
 */
export class LaunchEngine {
  private cancelled = false

  cancel(): void {
    this.cancelled = true
    log.info('[LaunchEngine] cancel requested')
  }

  async launch(
    profile: Profile,
    settings: Settings,
    onProgress: ProgressCallback,
  ): Promise<LaunchReport> {
    this.cancelled = false
    const platform = getPlatform()
    const results: AppLaunchResult[] = []

    // Count total apps for progress tracking
    const totalApps = profile.desktops.reduce((sum, d) => sum + d.apps.length, 0)
    let completed = 0

    log.info(`[LaunchEngine] launching profile="${profile.name}" desktops=${profile.desktops.length} apps=${totalApps}`)

    // ─── Ensure enough virtual desktops exist ────────────────────────────
    const maxDesktopIndex = Math.max(...profile.desktops.map((d) => d.index), 0)
    try {
      const currentCount = await platform.getDesktopCount()
      const needed = maxDesktopIndex + 1 - currentCount

      for (let i = 0; i < needed; i++) {
        if (this.cancelled) break

        onProgress({
          type: 'desktop-creating',
          desktopIndex: currentCount + i,
          message: `Creating virtual desktop ${currentCount + i + 1}`,
          progress: { completed, total: totalApps },
        })

        await platform.createDesktop()

        onProgress({
          type: 'desktop-created',
          desktopIndex: currentCount + i,
          message: `Created virtual desktop ${currentCount + i + 1}`,
          progress: { completed, total: totalApps },
        })
      }
    } catch (e) {
      log.error('[LaunchEngine] failed to ensure desktops', e)
      // Continue anyway — apps on desktop 0 will still work
    }

    if (this.cancelled) {
      return this.cancelledReport(results, onProgress, completed, totalApps)
    }

    // ─── Launch apps per desktop ─────────────────────────────────────────
    for (const desktop of profile.desktops) {
      if (this.cancelled) break

      for (const app of desktop.apps) {
        if (this.cancelled) break

        onProgress({
          type: 'app-launching',
          appId: app.id,
          desktopIndex: desktop.index,
          message: `Launching ${this.appLabel(app)}`,
          progress: { completed, total: totalApps },
        })

        try {
          const result = await this.launchSingleApp(app, settings, platform)

          if (result.success && result.hwnd) {
            // Position the window
            try {
              await platform.positionWindow(result.hwnd, app.position)
            } catch (e) {
              log.warn(`[LaunchEngine] positionWindow failed for ${app.id}`, e)
            }

            // Move to correct virtual desktop (skip desktop 0 — it's the current one)
            if (desktop.index > 0) {
              try {
                await platform.moveWindowToDesktop(result.hwnd, desktop.index)
              } catch (e) {
                log.warn(`[LaunchEngine] moveWindowToDesktop failed for ${app.id}`, e)
              }
            }

            results.push({ appId: app.id, ok: true })
            completed++

            onProgress({
              type: 'app-done',
              appId: app.id,
              desktopIndex: desktop.index,
              message: `Launched ${this.appLabel(app)}`,
              progress: { completed, total: totalApps },
            })
          } else {
            const error = result.error ?? 'Unknown launch failure'
            results.push({ appId: app.id, ok: false, error })
            completed++

            onProgress({
              type: 'app-failed',
              appId: app.id,
              desktopIndex: desktop.index,
              message: `Failed to launch ${this.appLabel(app)}`,
              error,
              progress: { completed, total: totalApps },
            })
          }
        } catch (e) {
          const error = String(e)
          log.error(`[LaunchEngine] unexpected error launching ${app.id}`, e)
          results.push({ appId: app.id, ok: false, error })
          completed++

          onProgress({
            type: 'app-failed',
            appId: app.id,
            desktopIndex: desktop.index,
            message: `Failed to launch ${this.appLabel(app)}`,
            error,
            progress: { completed, total: totalApps },
          })
        }

        // Apply per-app delay + global delay
        if (!this.cancelled) {
          const totalDelay = app.delayMs + settings.globalLaunchDelayMs
          if (totalDelay > 0) {
            await this.delay(totalDelay)
          }
        }
      }
    }

    if (this.cancelled) {
      return this.cancelledReport(results, onProgress, completed, totalApps)
    }

    // ─── Switch back to desktop 0 ────────────────────────────────────────
    try {
      await platform.switchToDesktop(0)
    } catch (e) {
      log.warn('[LaunchEngine] failed to switch back to desktop 0', e)
    }

    const allOk = results.every((r) => r.ok)
    log.info(`[LaunchEngine] complete success=${allOk} results=${results.length}`)

    onProgress({
      type: 'complete',
      message: allOk ? 'All apps launched successfully' : 'Launch completed with errors',
      progress: { completed, total: totalApps },
    })

    return { success: allOk, cancelled: false, results }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async launchSingleApp(
    app: AppEntry,
    settings: Settings,
    platform: ReturnType<typeof getPlatform>,
  ): Promise<LaunchResult> {
    switch (app.type) {
      case 'ide':
        return platform.launchIde(app, settings.idePath)
      case 'browser':
        return platform.launchBrowser(app, settings.browserPath)
      case 'terminal':
        return platform.launchTerminal(app, settings.terminalPath)
      case 'app':
        return platform.launchApp(app)
    }
  }

  private appLabel(app: AppEntry): string {
    switch (app.type) {
      case 'ide':
        return `IDE → ${app.folder}`
      case 'browser':
        return app.mode === 'local' ? `Browser → localhost:${app.port}` : `Browser → ${app.url}`
      case 'terminal':
        return app.mode === 'command' ? `Terminal → ${app.command}` : `Terminal → ${app.scriptPath}`
      case 'app':
        return `App → ${app.path}`
    }
  }

  private cancelledReport(
    results: AppLaunchResult[],
    onProgress: ProgressCallback,
    completed: number,
    total: number,
  ): LaunchReport {
    log.info(`[LaunchEngine] cancelled after ${results.length} apps`)
    onProgress({
      type: 'cancelled',
      message: 'Launch cancelled',
      progress: { completed, total },
    })
    return { success: false, cancelled: true, results }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms))
  }
}
