import { useState, useEffect } from 'react'
import { ipc } from '@renderer/ipc/client'
import type { UpdateState } from '@shared/types'
import { APP_VERSION } from '@shared/constants'

export default function Settings() {
  const [updateState, setUpdateState] = useState<UpdateState | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const handler = (s: UpdateState) => {
      setUpdateState(s)
      if (s.status !== 'checking') setChecking(false)
    }
    ipc.updater.onStatus(handler)
    return () => ipc.updater.offStatus(handler)
  }, [])

  const handleCheck = async () => {
    setChecking(true)
    await ipc.updater.check()
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>

      {/* About */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">DeskFlow v{APP_VERSION}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? 'Checking...' : 'Check for Updates'}
            </button>

            {updateState?.status === 'not-available' && (
              <span className="text-sm text-green-600">You&apos;re up to date.</span>
            )}
            {updateState?.status === 'available' && (
              <span className="text-sm text-indigo-600">
                v{updateState.info?.version} available — downloading...
              </span>
            )}
            {updateState?.status === 'downloading' && updateState.progress && (
              <span className="text-sm text-indigo-600">
                Downloading: {Math.round(updateState.progress.percent)}%
              </span>
            )}
            {updateState?.status === 'downloaded' && (
              <span className="text-sm text-indigo-600">
                v{updateState.info?.version} ready.{' '}
                <button
                  onClick={() => ipc.updater.install()}
                  className="underline font-medium hover:text-indigo-800"
                >
                  Restart &amp; Update
                </button>
              </span>
            )}
            {updateState?.status === 'error' && (
              <span className="text-sm text-red-600">{updateState.error}</span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
