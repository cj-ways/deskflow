import { useState } from 'react'
import type { Profile } from '@shared/types'

interface Props {
  profile: Profile
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
  onLaunch: () => void
}

function formatLastLaunched(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`
  if (s < 31536000) return `${Math.floor(s / 2592000)}mo ago`
  return `${Math.floor(s / 31536000)}y ago`
}

export default function ProfileCard({ profile, onEdit, onDuplicate, onDelete, onLaunch }: Props) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const desktopCount = profile.desktops.length
  const appCount = profile.desktops.reduce((sum, d) => sum + d.apps.length, 0)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
      {/* Name + counts */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{profile.name}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {desktopCount} {desktopCount === 1 ? 'desktop' : 'desktops'} &middot;{' '}
          {appCount} {appCount === 1 ? 'app' : 'apps'}
        </p>
      </div>

      {/* Last launched */}
      <p className="text-xs text-gray-400">
        {profile.lastLaunchedAt
          ? `Last launched ${formatLastLaunched(profile.lastLaunchedAt)}`
          : 'Never launched'}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        {confirmingDelete ? (
          <>
            <span className="text-sm text-red-600 font-medium mr-auto">Delete?</span>
            <button
              onClick={() => {
                onDelete()
                setConfirmingDelete(false)
              }}
              className="px-2.5 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-2.5 py-1 text-xs font-medium rounded text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="px-2.5 py-1 text-xs font-medium rounded text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDuplicate}
              className="px-2.5 py-1 text-xs font-medium rounded text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="px-2.5 py-1 text-xs font-medium rounded text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onLaunch}
              className="ml-auto px-3 py-1 text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Launch
            </button>
          </>
        )}
      </div>
    </div>
  )
}
