import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ipc } from '@renderer/ipc/client'
import { useErrorToast } from '../components/ErrorToast'
import ProfileCard from '../components/ProfileCard'
import LaunchProgressModal from '../components/LaunchProgressModal'
import type { Profile } from '@shared/types'

export default function ProfileList() {
  const navigate = useNavigate()
  const { showError } = useErrorToast()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [launchingProfile, setLaunchingProfile] = useState<Profile | null>(null)
  const [snapshotting, setSnapshotting] = useState(false)

  const loadProfiles = useCallback(async () => {
    setError(null)
    try {
      const res = await ipc.profiles.getAll()
      if (res.success) {
        setProfiles(res.data)
      } else {
        setError(res.error)
      }
    } catch (e) {
      const msg = `Failed to load profiles: ${String(e)}`
      setError(msg)
      showError(msg)
    }
  }, [showError])

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  const handleDelete = async (id: string) => {
    try {
      const res = await ipc.profiles.delete(id)
      if (res.success) {
        await loadProfiles()
      } else {
        setError(res.error)
        showError(res.error)
      }
    } catch (e) {
      const msg = `Failed to delete profile: ${String(e)}`
      setError(msg)
      showError(msg)
    }
  }

  const handleSnapshot = async () => {
    setSnapshotting(true)
    setError(null)
    try {
      const res = await ipc.snapshot.capture()
      if (res.success) {
        navigate('/snapshot', { state: res.data })
      } else {
        setError(res.error)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setSnapshotting(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await ipc.profiles.duplicate(id)
      if (res.success) {
        await loadProfiles()
      } else {
        setError(res.error)
        showError(res.error)
      }
    } catch (e) {
      const msg = `Failed to duplicate profile: ${String(e)}`
      setError(msg)
      showError(msg)
    }
  }

  if (profiles === null) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profiles</h1>
        <div className="flex gap-2">
          <button
            onClick={handleSnapshot}
            disabled={snapshotting}
            className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {snapshotting ? 'Scanning...' : 'Snapshot'}
          </button>
          <button
            onClick={() => navigate('/profile/new')}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            + New Profile
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 text-sm mb-4">No profiles yet. Create your first one.</p>
          <button
            onClick={() => navigate('/profile/new')}
            className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
          >
            + New Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onEdit={() => navigate(`/profile/${profile.id}`)}
              onDuplicate={() => handleDuplicate(profile.id)}
              onDelete={() => handleDelete(profile.id)}
              onLaunch={() => setLaunchingProfile(profile)}
            />
          ))}
        </div>
      )}

      {/* Launch progress modal */}
      {launchingProfile && (
        <LaunchProgressModal
          profileId={launchingProfile.id}
          profileName={launchingProfile.name}
          onClose={() => {
            setLaunchingProfile(null)
            loadProfiles()
          }}
        />
      )}
    </div>
  )
}
