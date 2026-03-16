import { useState, useEffect, useRef, useCallback } from 'react'
import { ipc } from '@renderer/ipc/client'
import type { LaunchProgressEvent } from '@shared/types'

interface Props {
  profileId: string
  profileName: string
  onClose: () => void
}

interface AppStatus {
  appId: string
  label: string
  state: 'pending' | 'launching' | 'done' | 'failed'
  error?: string
}

export default function LaunchProgressModal({ profileId, profileName, onClose }: Props) {
  const [appStatuses, setAppStatuses] = useState<AppStatus[]>([])
  const [message, setMessage] = useState('Starting launch...')
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)
  const [finished, setFinished] = useState(false)
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleProgress = useCallback((event: LaunchProgressEvent) => {
    setCompleted(event.progress.completed)
    setTotal(event.progress.total)
    setMessage(event.message)

    switch (event.type) {
      case 'app-launching':
        if (event.appId) {
          setAppStatuses((prev) => {
            const exists = prev.some((s) => s.appId === event.appId)
            if (exists) {
              return prev.map((s) =>
                s.appId === event.appId ? { ...s, state: 'launching' as const } : s,
              )
            }
            return [
              ...prev,
              { appId: event.appId!, label: event.message, state: 'launching' as const },
            ]
          })
        }
        break

      case 'app-done':
        if (event.appId) {
          setAppStatuses((prev) =>
            prev.map((s) =>
              s.appId === event.appId ? { ...s, state: 'done' as const } : s,
            ),
          )
        }
        break

      case 'app-failed':
        if (event.appId) {
          setAppStatuses((prev) =>
            prev.map((s) =>
              s.appId === event.appId
                ? { ...s, state: 'failed' as const, error: event.error }
                : s,
            ),
          )
        }
        break

      case 'complete':
      case 'cancelled':
        setFinished(true)
        break
    }
  }, [])

  useEffect(() => {
    // Start the launch — check for immediate IPC errors
    ipc.launch.start(profileId).then((res) => {
      if (!res.success) {
        setMessage(`Failed to start launch: ${res.error}`)
        setFinished(true)
      }
    }).catch((e) => {
      setMessage(`Failed to start launch: ${String(e)}`)
      setFinished(true)
    })
    ipc.launch.onProgress(handleProgress)

    return () => {
      ipc.launch.offProgress(handleProgress)
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current)
    }
  }, [profileId, handleProgress])

  // Auto-close 2s after completion if all apps succeeded
  useEffect(() => {
    if (finished) {
      const allOk = appStatuses.every((s) => s.state === 'done')
      if (allOk) {
        autoCloseTimer.current = setTimeout(onClose, 2000)
      }
    }
  }, [finished, appStatuses, onClose])

  const handleCancel = () => {
    ipc.launch.cancel()
  }

  // Escape key — cancel if in-progress, close if finished
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (finished) {
          onClose()
        } else {
          handleCancel()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [finished, onClose])

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Launching {profileName}
          </h2>
          <p className="text-sm text-gray-500 mt-1">{message}</p>
        </div>

        {/* Progress bar */}
        <div className="px-6 pb-3">
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">
            {completed} / {total}
          </p>
        </div>

        {/* App list */}
        <div className="px-6 pb-3 max-h-60 overflow-y-auto">
          {appStatuses.map((app) => (
            <div
              key={app.appId}
              className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0"
            >
              {/* Status indicator */}
              <span className="shrink-0 mt-0.5">
                {app.state === 'launching' && (
                  <span className="inline-block w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                )}
                {app.state === 'done' && (
                  <span className="text-green-500 text-sm font-bold">&#10003;</span>
                )}
                {app.state === 'failed' && (
                  <span className="text-red-500 text-sm font-bold">&#10007;</span>
                )}
                {app.state === 'pending' && (
                  <span className="inline-block w-4 h-4 rounded-full bg-gray-200" />
                )}
              </span>

              {/* Label + error */}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 truncate">{app.label}</p>
                {app.error && (
                  <p className="text-xs text-red-500 mt-0.5 break-words">{app.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          {!finished ? (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
