import PositionPicker from '../PositionPicker'
import type { FormErrors } from './IdeForm'
import type { BrowserEntry, Position } from '@shared/types'

interface Props {
  value: BrowserEntry
  onChange: (v: BrowserEntry) => void
  errors: FormErrors
}

function isValidUrl(url: string): boolean {
  try { new URL(url); return true } catch { return false }
}

export default function BrowserForm({ value, onChange, errors }: Props) {
  const switchMode = (mode: 'local' | 'website') => {
    if (mode === value.mode) return
    if (mode === 'local') {
      onChange({ id: value.id, type: 'browser', mode: 'local', port: 3000, position: value.position, delayMs: value.delayMs })
    } else {
      onChange({ id: value.id, type: 'browser', mode: 'website', url: '', position: value.position, delayMs: value.delayMs })
    }
  }

  const setPosition = (position: Position) => {
    if (value.mode === 'local') {
      onChange({ ...value, position })
    } else {
      onChange({ ...value, position })
    }
  }

  const setDelay = (delayMs: number) => {
    if (value.mode === 'local') {
      onChange({ ...value, delayMs })
    } else {
      onChange({ ...value, delayMs })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Mode toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Mode</label>
        <div className="flex rounded-md border border-gray-300 bg-gray-50 p-0.5 w-fit">
          {(['local', 'website'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => switchMode(mode)}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                value.mode === mode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'local' ? 'Local project' : 'Website'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-specific fields */}
      {value.mode === 'local' ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Port</label>
          <input
            type="number"
            min={1}
            max={65535}
            value={value.port}
            onChange={(e) =>
              onChange({ ...value, port: Math.min(65535, Math.max(1, Number(e.target.value))) })
            }
            className={`w-32 px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.port ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.port && <p className="text-xs text-red-600">{errors.port}</p>}
          <p className="text-xs text-gray-500">
            Opens:{' '}
            <span className="font-mono">http://localhost:{value.port}</span>
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">URL</label>
          <input
            type="url"
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
            placeholder="https://example.com"
            className={`px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              errors.url ? 'border-red-400' : 'border-gray-300'
            }`}
          />
          {errors.url && <p className="text-xs text-red-600">{errors.url}</p>}
          {value.url && !isValidUrl(value.url) && !errors.url && (
            <p className="text-xs text-amber-600">Enter a valid URL including https://</p>
          )}
        </div>
      )}

      {/* Window position */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Window position</label>
        <PositionPicker value={value.position} onChange={setPosition} />
      </div>

      {/* Launch delay */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Launch delay (ms)</label>
        <input
          type="number"
          min={0}
          step={100}
          value={value.delayMs}
          onChange={(e) => setDelay(Math.max(0, Number(e.target.value)))}
          className="w-32 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500">Extra wait before launching the next app</p>
      </div>
    </div>
  )
}
