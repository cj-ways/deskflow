import log from '../logger'
import { resolvePreset, getWorkArea } from '../platform/windows/WindowPositioner'
import { POSITION_VALUES } from '@shared/constants'
import type {
  WindowInfo,
  ProfileDraft,
  Desktop,
  AppEntry,
  Position,
} from '@shared/types'

// ─── App type detection ──────────────────────────────────────────────────────

interface DetectedType {
  type: AppEntry['type']
  /** Extra metadata extracted from heuristic (e.g. folder for IDE) */
  folder?: string
  url?: string
}

/**
 * Heuristic: look at the exe name to determine what kind of app this is.
 */
function detectAppType(win: WindowInfo): DetectedType {
  const exe = win.exePath.toLowerCase()
  const name = exe.split(/[/\\]/).pop() ?? ''

  // VS Code
  if (name === 'code.exe' || name === 'code - insiders.exe' || name === 'code.cmd') {
    // Try to extract folder from title: "folder - Visual Studio Code"
    const match = win.title.match(/^(.+?)\s*[-—]\s*Visual Studio Code/)
    const folder = match ? match[1].trim() : ''
    return { type: 'ide', folder }
  }

  // Browsers
  if (
    name === 'chrome.exe' ||
    name === 'msedge.exe' ||
    name === 'firefox.exe' ||
    name === 'brave.exe' ||
    name === 'vivaldi.exe' ||
    name === 'opera.exe'
  ) {
    return { type: 'browser' }
  }

  // Windows Terminal
  if (name === 'windowsterminal.exe' || name === 'wt.exe') {
    return { type: 'terminal' }
  }

  // cmd / powershell
  if (name === 'cmd.exe' || name === 'powershell.exe' || name === 'pwsh.exe') {
    return { type: 'terminal' }
  }

  return { type: 'app' }
}

// ─── Position matching ───────────────────────────────────────────────────────

/**
 * Find the Position preset whose resolved rect is closest to the window's
 * actual bounds. Uses Manhattan distance on center points + size difference.
 */
function nearestPreset(
  bounds: WindowInfo['bounds'],
  workArea: { x: number; y: number; width: number; height: number },
): Position {
  const bCx = bounds.x + bounds.width / 2
  const bCy = bounds.y + bounds.height / 2

  let best: Position = 'full'
  let bestDist = Infinity

  for (const pos of POSITION_VALUES) {
    const rect = resolvePreset(pos, workArea)
    const rCx = rect.x + rect.width / 2
    const rCy = rect.y + rect.height / 2

    // Manhattan distance on centers + size delta (weighted less)
    const dist =
      Math.abs(bCx - rCx) +
      Math.abs(bCy - rCy) +
      Math.abs(bounds.width - rect.width) * 0.5 +
      Math.abs(bounds.height - rect.height) * 0.5

    if (dist < bestDist) {
      bestDist = dist
      best = pos
    }
  }

  return best
}

// ─── Build draft ─────────────────────────────────────────────────────────────

/**
 * Transforms raw WindowInfo list into a draft Profile.
 *
 * Groups windows by desktopIndex → each group = one Desktop.
 * Per window: heuristic type detection + nearest Position preset.
 */
export async function buildDraft(windows: WindowInfo[]): Promise<ProfileDraft> {
  log.info(`[SnapshotService] building draft from ${windows.length} windows`)

  const workArea = await getWorkArea()

  // Group by desktop index
  const byDesktop = new Map<number, WindowInfo[]>()
  for (const win of windows) {
    const group = byDesktop.get(win.desktopIndex) ?? []
    group.push(win)
    byDesktop.set(win.desktopIndex, group)
  }

  // Sort desktop indices
  const sortedIndices = [...byDesktop.keys()].sort((a, b) => a - b)

  const desktops: Desktop[] = sortedIndices.map((deskIdx, i) => {
    const wins = byDesktop.get(deskIdx)!
    const apps: AppEntry[] = wins.map((win) => {
      const detected = detectAppType(win)
      const position = nearestPreset(win.bounds, workArea)
      const id = crypto.randomUUID()

      switch (detected.type) {
        case 'ide':
          return {
            id,
            type: 'ide' as const,
            folder: detected.folder ?? '',
            position,
            delayMs: 0,
          }

        case 'browser':
          return {
            id,
            type: 'browser' as const,
            mode: 'website' as const,
            url: '',
            position,
            delayMs: 0,
          }

        case 'terminal':
          return {
            id,
            type: 'terminal' as const,
            mode: 'command' as const,
            workingDir: win.workingDir,
            command: '',
            position,
            delayMs: 0,
          }

        case 'app':
          return {
            id,
            type: 'app' as const,
            path: win.exePath,
            args: [],
            position,
            delayMs: 0,
          }
      }
    })

    return {
      index: i,
      name: `Desktop ${i + 1}`,
      apps,
    }
  })

  log.info(`[SnapshotService] draft: ${desktops.length} desktops, ${desktops.reduce((s, d) => s + d.apps.length, 0)} apps`)

  return {
    id: '',
    name: '',
    createdAt: new Date().toISOString(),
    desktops,
  }
}
