import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ipc } from '@renderer/ipc/client'
import AppEntryModal from '../components/AppEntryModal'
import type { ProfileDraft, AppEntry, Desktop } from '@shared/types'

const TYPE_BADGE: Record<string, string> = {
  ide: 'bg-indigo-100 text-indigo-700',
  browser: 'bg-blue-100 text-blue-700',
  terminal: 'bg-green-100 text-green-700',
  app: 'bg-gray-100 text-gray-600',
}

const TYPE_LABEL: Record<string, string> = {
  ide: 'IDE',
  browser: 'Browser',
  terminal: 'Terminal',
  app: 'App',
}

function entrySummary(entry: AppEntry): string {
  switch (entry.type) {
    case 'ide':
      return entry.folder || '(no folder detected)'
    case 'browser':
      return entry.mode === 'local' ? `localhost:${entry.port}` : entry.url || '(no URL detected)'
    case 'terminal':
      return entry.mode === 'command'
        ? entry.command || '(no command detected)'
        : entry.scriptPath || '(no script detected)'
    case 'app':
      return entry.path || '(no path)'
  }
}

function positionLabel(p: string): string {
  return p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function SnapshotReview() {
  const location = useLocation()
  const navigate = useNavigate()

  const initialDraft = location.state as ProfileDraft | undefined

  // Task 4.1: mutable draft state initialized from location state
  const [draft, setDraft] = useState<ProfileDraft | undefined>(initialDraft)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState<{ desktopIndex: number; entry: AppEntry } | null>(null)

  if (!draft) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-gray-500 text-sm">No snapshot data. Trigger a snapshot from the system tray.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        >
          Back to Profiles
        </button>
      </div>
    )
  }

  // Task 4.5: recompute from current draft state
  const totalApps = draft.desktops.reduce((s, d) => s + d.apps.length, 0)

  // Task 4.4: delete an app entry from a desktop
  const handleDelete = (desktopIndex: number, appId: string) => {
    setDraft({
      ...draft,
      desktops: draft.desktops.map((d) =>
        d.index === desktopIndex
          ? { ...d, apps: d.apps.filter((a) => a.id !== appId) }
          : d,
      ),
    })
  }

  // Task 4.3: save edited entry back into draft
  const handleEditSave = (updated: AppEntry) => {
    if (!editingEntry) return
    const { desktopIndex } = editingEntry
    setDraft({
      ...draft,
      desktops: draft.desktops.map((d: Desktop) =>
        d.index === desktopIndex
          ? { ...d, apps: d.apps.map((a) => (a.id === updated.id ? updated : a)) }
          : d,
      ),
    })
    setEditingEntry(null)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Profile name is required')
      return
    }
    setSaving(true)
    setError(null)

    const profile = {
      ...draft,
      id: crypto.randomUUID(),
      name: name.trim(),
    }

    try {
      const res = await ipc.profiles.save(profile)
      if (res.success) {
        navigate('/')
      } else {
        setError(res.error)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0"
        >
          ← Cancel
        </button>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name this snapshot..."
          autoFocus
          className="flex-1 min-w-0 text-lg font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none px-1 py-0.5 transition-colors"
        />

        <span className="text-xs text-gray-400 shrink-0">
          {totalApps} app{totalApps !== 1 ? 's' : ''} detected
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {saving ? 'Saving...' : 'Save as Profile'}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md shrink-0">
          {error}
        </div>
      )}

      {/* Desktop list */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {draft.desktops.map((desktop) => (
          <div
            key={desktop.index}
            className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden"
          >
            {/* Desktop header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {desktop.name}
              </span>
              <span className="text-xs text-gray-400">
                {desktop.apps.length} app{desktop.apps.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* App rows */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {desktop.apps.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 px-4 py-2.5"
                >
                  {/* Type badge */}
                  <span
                    className={`shrink-0 px-1.5 py-0.5 text-xs font-medium rounded ${TYPE_BADGE[app.type]}`}
                  >
                    {TYPE_LABEL[app.type]}
                  </span>

                  {/* Summary */}
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate font-mono">
                    {entrySummary(app)}
                  </span>

                  {/* Position */}
                  <span className="shrink-0 text-xs text-gray-400">
                    {positionLabel(app.position)}
                  </span>

                  {/* Task 4.2: Edit and Delete buttons */}
                  <button
                    type="button"
                    onClick={() => setEditingEntry({ desktopIndex: desktop.index, entry: app })}
                    className="shrink-0 px-2 py-1 text-xs font-medium rounded text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(desktop.index, app.id)}
                    className="shrink-0 px-2 py-1 text-xs font-medium rounded text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}

              {desktop.apps.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-400">
                  No apps detected on this desktop
                </div>
              )}
            </div>
          </div>
        ))}

        {draft.desktops.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">
            No windows were detected. Make sure apps are open and visible.
          </p>
        )}
      </div>

      {/* Task 4.3: Edit modal */}
      {editingEntry && (
        <AppEntryModal
          initial={editingEntry.entry}
          onSave={handleEditSave}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  )
}
