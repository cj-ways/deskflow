import { useState, useEffect } from 'react'
import { ipc } from '@renderer/ipc/client'
import type { UpdateState } from '@shared/types'

export default function UpdateBanner() {
  const [state, setState] = useState<UpdateState | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handler = (s: UpdateState) => setState(s)
    ipc.updater.onStatus(handler)
    return () => ipc.updater.offStatus(handler)
  }, [])

  if (!state || state.status !== 'downloaded' || dismissed) return null

  return (
    <div className="bg-indigo-600 text-white px-4 py-2 flex items-center justify-between text-sm shrink-0">
      <span>
        DeskFlow {state.info?.version ?? 'update'} is ready to install.
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => ipc.updater.install()}
          className="px-3 py-1 text-xs font-medium rounded bg-white text-indigo-700 hover:bg-indigo-50 transition-colors"
        >
          Restart &amp; Update
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-1 text-xs font-medium rounded text-indigo-200 hover:text-white transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  )
}
