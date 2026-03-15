import { useEffect, useState } from 'react'
import { ipc } from '@renderer/ipc/client'
import PositionPicker from '../PositionPicker'
import type { IdeEntry } from '@shared/types'

export type FormErrors = Record<string, string>

interface Props {
  value: IdeEntry
  onChange: (v: IdeEntry) => void
  errors: FormErrors
}

export default function IdeForm({ value, onChange, errors }: Props) {
  const [idePath, setIdePath] = useState<string>('')

  useEffect(() => {
    ipc.settings.get()
      .then((res) => { if (res.success) setIdePath(res.data.idePath) })
      .catch(() => undefined) // settings handler not yet registered until Phase H1
  }, [])

  const handleBrowse = async () => {
    const res = await ipc.dialog.openFolder()
    if (res.success && res.data) {
      onChange({ ...value, folder: res.data })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Folder path */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Project folder</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.folder}
            onChange={(e) => onChange({ ...value, folder: e.target.value })}
            placeholder="C:\Users\you\projects\my-app"
            className={`flex-1 px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.folder ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={handleBrowse}
            className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Browse
          </button>
        </div>
        {errors.folder && <p className="text-xs text-red-600">{errors.folder}</p>}
        <p className="text-xs text-gray-500">
          {idePath ? `Opens with: ${idePath}` : 'IDE path not configured — set it in Settings'}
        </p>
      </div>

      {/* Window position */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Window position</label>
        <PositionPicker
          value={value.position}
          onChange={(p) => onChange({ ...value, position: p })}
        />
      </div>

      {/* Launch delay */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Launch delay (ms)</label>
        <input
          type="number"
          min={0}
          step={100}
          value={value.delayMs}
          onChange={(e) => onChange({ ...value, delayMs: Math.max(0, Number(e.target.value)) })}
          className="w-32 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500">Extra wait before launching the next app</p>
      </div>
    </div>
  )
}
