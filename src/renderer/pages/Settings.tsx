import { useState, useEffect, useCallback } from 'react'
import { ipc } from '@renderer/ipc/client'
import type { Settings as SettingsType, UpdateState } from '@shared/types'
import { APP_VERSION } from '@shared/constants'

const inputClass =
  'flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'

const btnSecondary =
  'px-3 py-2 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors'

const btnPrimary =
  'px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [detecting, setDetecting] = useState<'ide' | 'browser' | null>(null)

  // Updater state
  const [updateState, setUpdateState] = useState<UpdateState | null>(null)
  const [checking, setChecking] = useState(false)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ipc.settings.get()
      if (!res.success) {
        setError(res.error)
        return
      }
      setSettings(res.data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  useEffect(() => {
    const handler = (s: UpdateState) => {
      setUpdateState(s)
      if (s.status !== 'checking') setChecking(false)
    }
    ipc.updater.onStatus(handler)
    return () => ipc.updater.offStatus(handler)
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await ipc.settings.save(settings)
      if (!res.success) {
        setError(res.error)
        return
      }
      setSettings(res.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  const handleDetectIde = async () => {
    setDetecting('ide')
    try {
      const res = await ipc.settings.detectIdePath()
      if (res.success && res.data) {
        setSettings((s) => (s ? { ...s, idePath: res.data! } : s))
      } else if (res.success && !res.data) {
        setError('Could not auto-detect an IDE. Please browse manually.')
      } else if (!res.success) {
        setError(res.error)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setDetecting(null)
    }
  }

  const handleDetectBrowser = async () => {
    setDetecting('browser')
    try {
      const res = await ipc.settings.detectBrowserPath()
      if (res.success && res.data) {
        setSettings((s) => (s ? { ...s, browserPath: res.data! } : s))
      } else if (res.success && !res.data) {
        setError('Could not auto-detect a browser. Please browse manually.')
      } else if (!res.success) {
        setError(res.error)
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setDetecting(null)
    }
  }

  const handleBrowse = async (field: 'idePath' | 'browserPath' | 'terminalPath') => {
    try {
      const res = await ipc.dialog.openFile([
        { name: 'Executables', extensions: ['exe', 'cmd', 'bat'] },
      ])
      if (res.success && res.data) {
        setSettings((s) => (s ? { ...s, [field]: res.data } : s))
      }
    } catch (e) {
      setError(String(e))
    }
  }

  const handleCheck = async () => {
    setChecking(true)
    await ipc.updater.check()
  }

  const update = (patch: Partial<SettingsType>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        Loading...
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-red-600">
        {error ?? 'Failed to load settings'}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <div className="flex items-center gap-3">
          {success && <span className="text-sm text-green-600">Saved</span>}
          {error && <span className="text-sm text-red-600 max-w-xs truncate">{error}</span>}
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Application Paths */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Application Paths</h2>
        <div className="space-y-4">
          {/* IDE */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IDE (VS Code)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.idePath}
                onChange={(e) => update({ idePath: e.target.value })}
                placeholder="Path to code.exe or code.cmd"
                className={inputClass}
              />
              <button onClick={() => handleBrowse('idePath')} className={btnSecondary}>
                Browse
              </button>
              <button
                onClick={handleDetectIde}
                disabled={detecting === 'ide'}
                className={btnSecondary}
              >
                {detecting === 'ide' ? 'Detecting...' : 'Auto-detect'}
              </button>
            </div>
          </div>

          {/* Browser */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Browser</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.browserPath}
                onChange={(e) => update({ browserPath: e.target.value })}
                placeholder="Path to chrome.exe, msedge.exe, etc."
                className={inputClass}
              />
              <button onClick={() => handleBrowse('browserPath')} className={btnSecondary}>
                Browse
              </button>
              <button
                onClick={handleDetectBrowser}
                disabled={detecting === 'browser'}
                className={btnSecondary}
              >
                {detecting === 'browser' ? 'Detecting...' : 'Auto-detect'}
              </button>
            </div>
          </div>

          {/* Terminal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={settings.terminalPath}
                onChange={(e) => update({ terminalPath: e.target.value })}
                placeholder="Path to wt.exe, cmd.exe, etc."
                className={inputClass}
              />
              <button onClick={() => handleBrowse('terminalPath')} className={btnSecondary}>
                Browse
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Defaults to &quot;wt&quot; (Windows Terminal). Use full path if not in PATH.
            </p>
          </div>
        </div>
      </section>

      {/* Behavior */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Behavior</h2>
        <div className="space-y-4">
          {/* Start with Windows */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.startWithWindows}
              onChange={(e) => update({ startWithWindows: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Start with Windows</span>
              <p className="text-xs text-gray-500">Launch DeskFlow automatically when you sign in</p>
            </div>
          </label>

          {/* Minimize to tray */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.minimizeToTray}
              onChange={(e) => update({ minimizeToTray: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Minimize to tray</span>
              <p className="text-xs text-gray-500">
                Hide window to system tray instead of closing
              </p>
            </div>
          </label>

          {/* Global launch delay */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Launch delay between apps
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5000}
                step={100}
                value={settings.globalLaunchDelayMs}
                onChange={(e) => update({ globalLaunchDelayMs: Number(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-sm text-gray-600 w-16 text-right tabular-nums">
                {settings.globalLaunchDelayMs}ms
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Extra delay injected between each app launch. Increase if apps fail to start.
            </p>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Appearance</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => update({ theme: e.target.value as SettingsType['theme'] })}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">About</h2>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">DeskFlow v{APP_VERSION}</p>
          <div className="flex items-center gap-3">
            <button onClick={handleCheck} disabled={checking} className={btnPrimary}>
              {checking ? 'Checking...' : 'Check for Updates'}
            </button>

            {updateState?.status === 'not-available' && (
              <span className="text-sm text-green-600">You&apos;re up to date.</span>
            )}
            {updateState?.status === 'available' && (
              <span className="text-sm text-indigo-600">
                v{updateState.info?.version} available — downloading...
              </span>
            )}
            {updateState?.status === 'downloading' && updateState.progress && (
              <span className="text-sm text-indigo-600">
                Downloading: {Math.round(updateState.progress.percent)}%
              </span>
            )}
            {updateState?.status === 'downloaded' && (
              <span className="text-sm text-indigo-600">
                v{updateState.info?.version} ready.{' '}
                <button
                  onClick={() => ipc.updater.install()}
                  className="underline font-medium hover:text-indigo-800"
                >
                  Restart &amp; Update
                </button>
              </span>
            )}
            {updateState?.status === 'error' && (
              <span className="text-sm text-red-600">{updateState.error}</span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
