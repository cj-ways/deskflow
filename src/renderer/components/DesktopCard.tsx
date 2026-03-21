import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Desktop, AppEntry } from '@shared/types'
import AppEntryRow from './AppEntryRow'
import AppEntryModal from './AppEntryModal'

interface Props {
  desktop: Desktop
  onChange: (d: Desktop) => void
  onDelete: () => void
}

export default function DesktopCard({ desktop, onChange, onDelete }: Props) {
  const [editingApp, setEditingApp] = useState<AppEntry | null>(null)
  const [addingApp, setAddingApp] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = desktop.apps.findIndex((a) => a.id === active.id)
    const newIndex = desktop.apps.findIndex((a) => a.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    onChange({ ...desktop, apps: arrayMove(desktop.apps, oldIndex, newIndex) })
  }

  const handleSaveApp = (app: AppEntry) => {
    if (editingApp) {
      onChange({ ...desktop, apps: desktop.apps.map((a) => (a.id === app.id ? app : a)) })
      setEditingApp(null)
    } else {
      onChange({ ...desktop, apps: [...desktop.apps, app] })
      setAddingApp(false)
    }
  }

  const handleDeleteApp = (id: string) => {
    onChange({ ...desktop, apps: desktop.apps.filter((a) => a.id !== id) })
  }

  const handleDeleteDesktop = () => {
    if (desktop.apps.length > 0) {
      setConfirmDelete(true)
    } else {
      onDelete()
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-400 shrink-0">
          Desktop {desktop.index + 1}
        </span>
        <input
          type="text"
          value={desktop.name}
          onChange={(e) => onChange({ ...desktop, name: e.target.value })}
          placeholder="Unnamed desktop"
          className="flex-1 px-2 py-0.5 text-sm font-medium text-gray-800 dark:text-gray-200 bg-transparent border border-transparent rounded hover:border-gray-300 dark:hover:border-gray-600 focus:border-indigo-400 focus:outline-none focus:bg-white dark:focus:bg-gray-700 transition-colors"
        />
        <div className="shrink-0 flex items-center gap-1">
          {confirmDelete ? (
            <>
              <span className="text-xs text-red-600">Delete desktop?</span>
              <button
                type="button"
                onClick={onDelete}
                className="px-2 py-0.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 rounded transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDeleteDesktop}
              className="px-2 py-0.5 text-xs text-gray-400 hover:text-red-600 transition-colors"
              aria-label="Delete desktop"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* App rows */}
      {desktop.apps.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={desktop.apps.map((a) => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-1.5">
              {desktop.apps.map((app) => (
                <AppEntryRow
                  key={app.id}
                  entry={app}
                  onEdit={() => setEditingApp(app)}
                  onDelete={() => handleDeleteApp(app.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {desktop.apps.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-3">
          No apps — click Add App to get started
        </p>
      )}

      {/* Add app button */}
      <button
        type="button"
        onClick={() => setAddingApp(true)}
        className="self-start px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-300 hover:border-indigo-400 rounded-md transition-colors"
      >
        + Add App
      </button>

      {/* Add modal */}
      {addingApp && (
        <AppEntryModal onSave={handleSaveApp} onClose={() => setAddingApp(false)} />
      )}

      {/* Edit modal */}
      {editingApp && (
        <AppEntryModal
          initial={editingApp}
          onSave={handleSaveApp}
          onClose={() => setEditingApp(null)}
        />
      )}
    </div>
  )
}
