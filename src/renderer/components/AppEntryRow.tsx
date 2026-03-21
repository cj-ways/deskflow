import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { AppEntry } from '@shared/types'

interface Props {
  entry: AppEntry
  onEdit: () => void
  onDelete: () => void
}

const TYPE_BADGE: Record<string, string> = {
  ide:      'bg-indigo-100 text-indigo-700',
  browser:  'bg-blue-100 text-blue-700',
  terminal: 'bg-green-100 text-green-700',
  app:      'bg-gray-100 text-gray-600',
}

const TYPE_LABEL: Record<string, string> = {
  ide: 'IDE', browser: 'Browser', terminal: 'Terminal', app: 'App',
}

function entrySummary(entry: AppEntry): string {
  switch (entry.type) {
    case 'ide':      return entry.folder      || 'No folder set'
    case 'browser':  return entry.mode === 'local' ? `http://localhost:${entry.port}` : entry.url || 'No URL set'
    case 'terminal': return entry.mode === 'command' ? entry.command || 'No command' : entry.scriptPath || 'No script set'
    case 'app':      return entry.path        || 'No path set'
  }
}

function positionLabel(p: string): string {
  return p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AppEntryRow({ entry, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab text-gray-300 hover:text-gray-500 shrink-0 touch-none"
        {...listeners}
        {...attributes}
        aria-label="Drag to reorder"
      >
        <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
          <circle cx="3" cy="3"  r="1.5" /><circle cx="9" cy="3"  r="1.5" />
          <circle cx="3" cy="8"  r="1.5" /><circle cx="9" cy="8"  r="1.5" />
          <circle cx="3" cy="13" r="1.5" /><circle cx="9" cy="13" r="1.5" />
        </svg>
      </button>

      {/* Type badge */}
      <span className={`shrink-0 px-1.5 py-0.5 text-xs font-medium rounded ${TYPE_BADGE[entry.type]}`}>
        {TYPE_LABEL[entry.type]}
      </span>

      {/* Summary */}
      <span className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate font-mono">
        {entrySummary(entry)}
      </span>

      {/* Position badge */}
      <span className="shrink-0 text-xs text-gray-400 hidden sm:block">
        {positionLabel(entry.position)}
      </span>

      {/* Delay */}
      {entry.delayMs > 0 && (
        <span className="shrink-0 text-xs text-gray-400">+{entry.delayMs}ms</span>
      )}

      {/* Actions */}
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  )
}
