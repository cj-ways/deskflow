import type { CSSProperties } from 'react'
import type { Position } from '@shared/types'

interface Props {
  value: Position
  onChange: (p: Position) => void
}

const GRID: Position[] = [
  'top-left',    'top-center',    'top-right',
  'middle-left', 'center',        'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

const SPECIALS: Array<[Position, string]> = [
  ['left-half',  'Left ½'],
  ['right-half', 'Right ½'],
  ['full',       'Full'],
]

// Mini window indicator inside each 40×40px "screen" cell.
// Shows a half-size block positioned to match where the window would appear.
const INDICATOR: Record<string, CSSProperties> = {
  'top-left':     { top: 2,     left: 2,     width: '44%', height: '44%' },
  'top-center':   { top: 2,     left: '28%', width: '44%', height: '44%' },
  'top-right':    { top: 2,     right: 2,    width: '44%', height: '44%' },
  'middle-left':  { top: '28%', left: 2,     width: '44%', height: '44%' },
  'center':       { top: '28%', left: '28%', width: '44%', height: '44%' },
  'middle-right': { top: '28%', right: 2,    width: '44%', height: '44%' },
  'bottom-left':  { bottom: 2,  left: 2,     width: '44%', height: '44%' },
  'bottom-center':{ bottom: 2,  left: '28%', width: '44%', height: '44%' },
  'bottom-right': { bottom: 2,  right: 2,    width: '44%', height: '44%' },
}

export default function PositionPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2 w-fit">
      {/* 3×3 grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {GRID.map((pos) => {
          const active = value === pos
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(pos)}
              aria-pressed={active}
              aria-label={pos}
              title={pos}
              className={`relative w-10 h-10 rounded border transition-colors ${
                active
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-400'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300'
              }`}
            >
              <span
                className={`absolute rounded-sm transition-colors ${
                  active ? 'bg-indigo-500' : 'bg-gray-400'
                }`}
                style={INDICATOR[pos]}
              />
            </button>
          )
        })}
      </div>

      {/* Special presets */}
      <div className="flex gap-1.5">
        {SPECIALS.map(([pos, label]) => {
          const active = value === pos
          return (
            <button
              key={pos}
              type="button"
              onClick={() => onChange(pos)}
              aria-pressed={active}
              className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                active
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
