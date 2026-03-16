import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useBlocker } from 'react-router-dom'
import { ipc } from '@renderer/ipc/client'
import type { Profile, Desktop } from '@shared/types'
import DesktopCard from '../components/DesktopCard'
import LaunchProgressModal from '../components/LaunchProgressModal'

function buildNewProfile(): Profile {
  return {
    id: crypto.randomUUID(),
    name: '',
    createdAt: new Date().toISOString(),
    desktops: [],
  }
}

function buildNewDesktop(index: number): Desktop {
  return { index, name: '', apps: [] }
}

export default function ProfileEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [launching, setLaunching] = useState(false)

  const originalRef = useRef<string>('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    if (isNew) {
      const p = buildNewProfile()
      setProfile(p)
      originalRef.current = JSON.stringify(p)
      setLoading(false)
      return
    }
    try {
      const res = await ipc.profiles.getById(id!)
      if (!res.success) {
        setError(res.error)
        return
      }
      if (!res.data) {
        setError('Profile not found')
        return
      }
      setProfile(res.data)
      originalRef.current = JSON.stringify(res.data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  // Track dirty state whenever profile changes
  useEffect(() => {
    if (!profile) return
    setIsDirty(JSON.stringify(profile) !== originalRef.current)
  }, [profile])

  // Warn on page refresh / window close
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Block in-app navigation when there are unsaved changes
  const blocker = useBlocker(isDirty)
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm('You have unsaved changes. Leave without saving?')
      if (confirmed) blocker.proceed()
      else blocker.reset()
    }
  }, [blocker])

  // ── Desktop mutations ────────────────────────────────────────────────────────

  const updateDesktop = (listIndex: number, updated: Desktop) => {
    if (!profile) return
    const desktops = profile.desktops.map((d, i) => (i === listIndex ? updated : d))
    setProfile({ ...profile, desktops })
  }

  const deleteDesktop = (listIndex: number) => {
    if (!profile) return
    const desktops = profile.desktops
      .filter((_, i) => i !== listIndex)
      .map((d, i) => ({ ...d, index: i }))
    setProfile({ ...profile, desktops })
  }

  const addDesktop = () => {
    if (!profile) return
    setProfile({
      ...profile,
      desktops: [...profile.desktops, buildNewDesktop(profile.desktops.length)],
    })
  }

  // ── Save ─────────────────────────────────────────────────────────────────────

  const validate = (): string | null => {
    if (!profile) return 'No profile loaded'
    if (!profile.name.trim()) return 'Profile name is required'
    return null
  }

  const handleSave = async (andLaunch = false) => {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await ipc.profiles.save(profile!)
      if (!res.success) {
        setError(res.error)
        return
      }
      originalRef.current = JSON.stringify(profile)
      setIsDirty(false)
      if (andLaunch) {
        setLaunching(true)
      } else {
        navigate('/')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Loading…
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-600">
        {error ?? 'Profile not found'}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 bg-white shrink-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-sm text-gray-500 hover:text-gray-800 transition-colors shrink-0"
        >
          ← Profiles
        </button>

        <input
          type="text"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          placeholder="Profile name…"
          className="flex-1 min-w-0 text-lg font-semibold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-indigo-400 focus:outline-none px-1 py-0.5 transition-colors"
        />

        {isDirty && (
          <span className="text-xs text-amber-600 shrink-0">Unsaved changes</span>
        )}

        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            Save + Launch
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-6 mt-4 px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md shrink-0">
          {error}
        </div>
      )}

      {/* Desktop list */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {profile.desktops.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-16">
            No desktops yet — click Add Desktop to begin
          </p>
        )}

        {profile.desktops.map((desktop, i) => (
          <DesktopCard
            key={desktop.index}
            desktop={desktop}
            onChange={(d) => updateDesktop(i, d)}
            onDelete={() => deleteDesktop(i)}
          />
        ))}

        <button
          type="button"
          onClick={addDesktop}
          className="self-start px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-300 hover:border-indigo-400 rounded-lg transition-colors"
        >
          + Add Desktop
        </button>
      </div>

      {/* Launch progress modal */}
      {launching && profile && (
        <LaunchProgressModal
          profileId={profile.id}
          profileName={profile.name}
          onClose={() => {
            setLaunching(false)
            navigate('/')
          }}
        />
      )}
    </div>
  )
}
