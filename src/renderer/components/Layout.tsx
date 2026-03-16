import { useEffect, useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ipc } from '@renderer/ipc/client'
import UpdateBanner from './UpdateBanner'
import type { ProfileDraft } from '@shared/types'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 mx-2 rounded-md text-sm font-medium transition-colors ${
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
  }`

export default function Layout() {
  const navigate = useNavigate()

  const handleSnapshotReady = useCallback(
    (draft: ProfileDraft) => {
      navigate('/snapshot', { state: draft })
    },
    [navigate],
  )

  useEffect(() => {
    ipc.snapshot.onReady(handleSnapshotReady)
    return () => ipc.snapshot.offReady(handleSnapshotReady)
  }, [handleSnapshotReady])

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs/textareas
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.ctrlKey && e.key === ',') {
        e.preventDefault()
        navigate('/settings')
      } else if (e.ctrlKey && e.key === 'n' && !isInput) {
        e.preventDefault()
        navigate('/profile/new')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <nav className="w-52 shrink-0 bg-gray-900 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-800">
          <span className="text-white font-bold text-base tracking-wide">DeskFlow</span>
        </div>

        <div className="flex-1 py-3 flex flex-col gap-1">
          <NavLink to="/" end className={navLinkClass}>
            Profiles
          </NavLink>
          <NavLink to="/settings" className={navLinkClass}>
            Settings
          </NavLink>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <UpdateBanner />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
