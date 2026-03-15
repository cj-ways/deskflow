import { ipc } from '@renderer/ipc/client'
import PositionPicker from '../PositionPicker'
import type { FormErrors } from './IdeForm'
import type { TerminalEntry, Position } from '@shared/types'

interface Props {
  value: TerminalEntry
  onChange: (v: TerminalEntry) => void
  errors: FormErrors
}

export default function TerminalForm({ value, onChange, errors }: Props) {
  const switchMode = (mode: 'command' | 'script') => {
    if (mode === value.mode) return
    if (mode === 'command') {
      onChange({ id: value.id, type: 'terminal', mode: 'command', workingDir: '', command: '', position: value.position, delayMs: value.delayMs })
    } else {
      onChange({ id: value.id, type: 'terminal', mode: 'script', scriptPath: '', position: value.position, delayMs: value.delayMs })
    }
  }

  const setPosition = (position: Position) => {
    if (value.mode === 'command') onChange({ ...value, position })
    else onChange({ ...value, position })
  }

  const setDelay = (delayMs: number) => {
    if (value.mode === 'command') onChange({ ...value, delayMs })
    else onChange({ ...value, delayMs })
  }

  const browseWorkingDir = async () => {
    const res = await ipc.dialog.openFolder()
    if (res.success && res.data && value.mode === 'command') {
      onChange({ ...value, workingDir: res.data })
    }
  }

  const browseScript = async () => {
    const res = await ipc.dialog.openFile([
      { name: 'Scripts', extensions: ['bat', 'ps1', 'sh'] },
    ])
    if (res.success && res.data && value.mode === 'script') {
      onChange({ ...value, scriptPath: res.data })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Mode toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">Mode</label>
        <div className="flex rounded-md border border-gray-300 bg-gray-50 p-0.5 w-fit">
          {(['command', 'script'] as const).map((mode) => (
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
              {mode === 'command' ? 'Command' : 'Script file'}
            </button>
          ))}
        </div>
      </div>

      {/* Mode-specific fields */}
      {value.mode === 'command' ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Working directory</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={value.workingDir}
                onChange={(e) => onChange({ ...value, workingDir: e.target.value })}
                placeholder="C:\Users\you\projects\my-app"
                className={`flex-1 px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.workingDir ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={browseWorkingDir}
                className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Browse
              </button>
            </div>
            {errors.workingDir && <p className="text-xs text-red-600">{errors.workingDir}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Command</label>
            <input
              type="text"
              value={value.command}
              onChange={(e) => onChange({ ...value, command: e.target.value })}
              placeholder="npm run dev"
              className={`px-3 py-2 text-sm font-mono rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.command ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.command && <p className="text-xs text-red-600">{errors.command}</p>}
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700">Script file</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={value.scriptPath}
              onChange={(e) => onChange({ ...value, scriptPath: e.target.value })}
              placeholder="C:\scripts\start.bat"
              className={`flex-1 px-3 py-2 text-sm rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.scriptPath ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={browseScript}
              className="px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse
            </button>
          </div>
          {errors.scriptPath && <p className="text-xs text-red-600">{errors.scriptPath}</p>}
          <p className="text-xs text-gray-500">Supports .bat, .ps1, .sh</p>
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
