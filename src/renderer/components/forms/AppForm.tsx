import { ipc } from '@renderer/ipc/client'
import PositionPicker from '../PositionPicker'
import type { FormErrors } from './IdeForm'
import type { GenericAppEntry } from '@shared/types'

interface Props {
  value: GenericAppEntry
  onChange: (v: GenericAppEntry) => void
  errors: FormErrors
}

export default function AppForm({ value, onChange, errors }: Props) {
  const browseExe = async () => {
    const res = await ipc.dialog.openFile([
      { name: 'Executables', extensions: ['exe', 'com', 'bat', 'cmd'] },
    ])
    if (res.success && res.data) {
      onChange({ ...value, path: res.data })
    }
  }

  const showExtWarning =
    value.path.length > 0 &&
    !value.path.toLowerCase().endsWith('.exe') &&
    !errors.path

  return (
    <div className="flex flex-col gap-5">
      {/* Executable path */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Executable path</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={value.path}
            onChange={(e) => onChange({ ...value, path: e.target.value })}
            placeholder="C:\Program Files\MyApp\app.exe"
            className={`flex-1 px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.path ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          <button
            type="button"
            onClick={browseExe}
            className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Browse
          </button>
        </div>
        {errors.path && <p className="text-xs text-red-600">{errors.path}</p>}
        {showExtWarning && (
          <p className="text-xs text-amber-600">
            Doesn&apos;t end in .exe — make sure this is a valid executable
          </p>
        )}
      </div>

      {/* Arguments */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Arguments{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          value={value.args.join(' ')}
          onChange={(e) =>
            onChange({
              ...value,
              args: e.target.value.trim() ? e.target.value.trim().split(/\s+/) : [],
            })
          }
          placeholder="--flag value --other"
          className="px-3 py-2 text-sm font-mono rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500">Space-separated arguments passed to the executable</p>
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
