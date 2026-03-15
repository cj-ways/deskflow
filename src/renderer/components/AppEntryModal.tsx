import { useState } from 'react'
import IdeForm from './forms/IdeForm'
import BrowserForm from './forms/BrowserForm'
import TerminalForm from './forms/TerminalForm'
import AppForm from './forms/AppForm'
import type { FormErrors } from './forms/IdeForm'
import type {
  AppEntry,
  AppEntryType,
  IdeEntry,
  BrowserEntry,
  TerminalEntry,
  GenericAppEntry,
  Position,
} from '@shared/types'

interface Props {
  initial?: AppEntry // provided when editing an existing entry
  onSave: (entry: AppEntry) => void
  onClose: () => void
}

const DEFAULT_POSITION: Position = 'center'
const DEFAULT_DELAY = 0

function defaultEntry(type: AppEntryType): AppEntry {
  const id = crypto.randomUUID()
  switch (type) {
    case 'ide':
      return { id, type: 'ide', folder: '', position: DEFAULT_POSITION, delayMs: DEFAULT_DELAY }
    case 'browser':
      return { id, type: 'browser', mode: 'local', port: 3000, position: DEFAULT_POSITION, delayMs: DEFAULT_DELAY }
    case 'terminal':
      return { id, type: 'terminal', mode: 'command', workingDir: '', command: '', position: DEFAULT_POSITION, delayMs: DEFAULT_DELAY }
    case 'app':
      return { id, type: 'app', path: '', args: [], position: DEFAULT_POSITION, delayMs: DEFAULT_DELAY }
  }
}

function validate(entry: AppEntry): FormErrors {
  const errors: FormErrors = {}
  if (entry.type === 'ide') {
    if (!entry.folder.trim()) errors.folder = 'Project folder is required'
  } else if (entry.type === 'browser') {
    if (entry.mode === 'local') {
      if (!Number.isInteger(entry.port) || entry.port < 1 || entry.port > 65535)
        errors.port = 'Port must be between 1 and 65535'
    } else {
      if (!entry.url.trim()) errors.url = 'URL is required'
      else { try { new URL(entry.url) } catch { errors.url = 'Enter a valid URL including https://' } }
    }
  } else if (entry.type === 'terminal') {
    if (entry.mode === 'command') {
      if (!entry.workingDir.trim()) errors.workingDir = 'Working directory is required'
      if (!entry.command.trim()) errors.command = 'Command is required'
    } else {
      if (!entry.scriptPath.trim()) errors.scriptPath = 'Script file is required'
    }
  } else {
    if (!entry.path.trim()) errors.path = 'Executable path is required'
  }
  return errors
}

const TYPE_TILES: Array<{ type: AppEntryType; label: string; description: string }> = [
  { type: 'ide',      label: 'IDE',      description: 'Code editor to a folder' },
  { type: 'browser',  label: 'Browser',  description: 'Chrome to a URL or port' },
  { type: 'terminal', label: 'Terminal', description: 'Run a command or script' },
  { type: 'app',      label: 'App',      description: 'Any .exe file' },
]

export default function AppEntryModal({ initial, onSave, onClose }: Props) {
  const isEditing = !!initial
  const [step, setStep] = useState<'type' | 'form'>(isEditing ? 'form' : 'type')
  const [entry, setEntry] = useState<AppEntry>(initial ?? defaultEntry('ide'))
  const [errors, setErrors] = useState<FormErrors>({})

  const selectType = (type: AppEntryType) => {
    setEntry(defaultEntry(type))
    setErrors({})
    setStep('form')
  }

  const handleSave = () => {
    const errs = validate(entry)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave(entry)
  }

  const typeLabel = TYPE_TILES.find((t) => t.type === entry.type)?.label ?? 'App'
  const title = step === 'type' ? 'Add App' : isEditing ? 'Edit App' : `Add ${typeLabel}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'type' ? (
            <div className="grid grid-cols-2 gap-3">
              {TYPE_TILES.map(({ type, label, description }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => selectType(type)}
                  className="flex flex-col items-start gap-1 p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-left"
                >
                  <span className="text-sm font-semibold text-gray-900">{label}</span>
                  <span className="text-xs text-gray-500">{description}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              {entry.type === 'ide' && (
                <IdeForm value={entry as IdeEntry} onChange={(v) => setEntry(v)} errors={errors} />
              )}
              {entry.type === 'browser' && (
                <BrowserForm value={entry as BrowserEntry} onChange={(v) => setEntry(v)} errors={errors} />
              )}
              {entry.type === 'terminal' && (
                <TerminalForm value={entry as TerminalEntry} onChange={(v) => setEntry(v)} errors={errors} />
              )}
              {entry.type === 'app' && (
                <AppForm value={entry as GenericAppEntry} onChange={(v) => setEntry(v)} errors={errors} />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <div>
            {step === 'form' && !isEditing && (
              <button
                type="button"
                onClick={() => { setStep('type'); setErrors({}) }}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            {step === 'form' && (
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                {isEditing ? 'Save' : 'Add'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
