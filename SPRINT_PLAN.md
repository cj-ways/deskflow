# DeskFlow — Sprint Plan (Atomic Phases)

> **Status legend:** `[ ]` not started · `[→]` in progress · `[DONE]` complete
>
> Each phase is a single concern touching ≤4 files. Small scope = easy to audit, easy to catch mistakes early.
> After every phase: re-read this file, audit what was built, re-evaluate upcoming phases. See `CLAUDE.md`.

---

## Group A — Project Foundation

### A1 · Project scaffold `[DONE]`
Built: electron-vite + React 19 + TypeScript strict + Tailwind CSS v4 scaffold. Single tsconfig.json with strict mode and @shared/@main/@renderer path aliases. All three electron-vite bundles (main 0.85kB, preload placeholder, renderer 529kB) compile cleanly. tsc --noEmit and ESLint both pass with zero issues.

**Goal:** Create the electron-vite + React + TypeScript project with correct config files.

Files created:
- `package.json` (electron, react, typescript, tailwind, electron-vite, electron-builder, electron-log, zod)
- `electron.vite.config.ts`
- `tsconfig.json` (strict: true, path aliases)
- `.eslintrc.cjs`
- `.prettierrc`
- `.gitignore`
- `src/main/index.ts` (empty Electron entry — just creates a BrowserWindow and loads renderer)
- `src/preload/index.ts` (empty placeholder — filled in A5)
- `src/renderer/main.tsx` (React entry — just renders `<h1>DeskFlow</h1>`)
- `src/renderer/index.html`
- `src/renderer/styles.css` (@import "tailwindcss" for Tailwind v4)

Verify:
- [ ] `npm run dev` opens Electron window showing "DeskFlow" — requires manual run
- [x] No TypeScript errors (`tsc --noEmit`) — PASSES
- [x] ESLint passes — PASSES

---

### A2 · Shared types `[DONE]`
Built: full type tree in types.ts (Position×12, AppEntry discriminated union with IdeEntry/BrowserEntry/TerminalEntry/GenericAppEntry, Profile/Desktop, Settings, WindowInfo, LaunchResult/LaunchReport/LaunchProgressEvent, IpcDataResponse/IpcVoidResponse, FileFilter, PositionPresetFn). IPC const object with 14 channels + typed IpcChannelMap/IpcEventMap. Constants with all path fragments, defaults, POSITION_VALUES array, position pixel-math formula documented. tsc and ESLint clean.

**Goal:** Define all domain types in one place so main and renderer share the same contracts.

Files created:
- `src/shared/types.ts` — `Profile`, `Desktop`, `AppEntry`, `AppEntryType`, `Position`, `Settings`, `WindowInfo`, `LaunchResult`
- `src/shared/ipc-channels.ts` — every IPC channel name as a const + its request/response payload types
- `src/shared/constants.ts` — `APP_NAME`, `APPDATA_PROFILES_DIR`, `APPDATA_SETTINGS_FILE`, `APPDATA_LOGS_DIR`, position preset pixel-math formula (as a function signature, not yet implemented)

Verify:
- [x] `tsc --noEmit` passes — all types resolve cleanly
- [x] No `any` types

---

### A3 · electron-builder installer config `[DONE]`
Built: electron-builder.yml with NSIS x64 target, sign:null + verifyUpdateCodeSignature:false to skip winCodeSign download (no cert for unsigned open-source build). Placeholder 256×256 indigo icon generated via PowerShell. react/react-dom moved to devDependencies (bundled by Vite, not needed at runtime). cross-env added; build script bakes in CSC_IDENTITY_AUTO_DISCOVERY=false. Verified clean after fresh npm install: produces DeskFlow Setup 0.1.0.exe (82 MB).

**Goal:** `npm run build` produces a working NSIS `.exe` installer.

Files created/modified:
- `electron-builder.yml` — appId, productName, NSIS target, icon, PATH registration for CLI
- `resources/icon.ico` — placeholder icon (any valid .ico)
- `package.json` — add `build` script

Verify:
- [x] `npm run build` completes without error
- [x] Installer file appears in `/dist` — DeskFlow Setup 0.1.0.exe (82 MB)
- [ ] Running installer completes without error — manual test required
- [ ] DeskFlow appears in Start Menu — manual test required

---

### A4 · Logging setup `[DONE]`
Built: src/main/logger.ts configures electron-log v5 (electron-log/main subpath), resolvePathFn builds path from app.getPath('appData') + constants, file level info, console level debug, 10 MB rotation, timestamp format. log.initialize() enables renderer IPC bridge. index.ts imports logger first and logs 'app ready'. tsc and ESLint clean.

**Goal:** `electron-log` configured and writing to file from first launch.

Files created/modified:
- `src/main/logger.ts` — configure electron-log: file path `%APPDATA%\DeskFlow\logs\main.log`, log level, format
- `src/main/index.ts` — import logger, log `app ready` on startup

Verify:
- [ ] After `npm run dev`, log file exists at `%APPDATA%\DeskFlow\logs\main.log` — requires manual run
- [ ] Log contains `[info] app ready` entry — requires manual run

---

### A5 · Preload + contextBridge `[DONE]`
Built: preload/index.ts exposes window.api via contextBridge with invoke<C>/on<C>/off<C> typed against IpcChannelMap/IpcEventMap — no explicit any, listener registry for clean removal. renderer/env.d.ts declares global Window.api interface. renderer/ipc/client.ts groups all IPC calls by domain (ipc.profiles.*, ipc.dialog.*, ipc.launch.*, ipc.snapshot.*, ipc.settings.*) — components import from here, never touch window.api directly. tsc and ESLint clean.

**Goal:** Secure IPC bridge between main and renderer — renderer never touches Node directly.

Files created:
- `src/preload/index.ts` — exposes `window.api` via `contextBridge.exposeInMainWorld`; typed API surface using channel names from `ipc-channels.ts`
- `src/renderer/env.d.ts` — global `interface Window { api: ElectronApi }` declaration
- `src/renderer/ipc/client.ts` — typed wrapper functions that call `window.api.invoke(channel, payload)` — components never call `window.api` directly

Verify:
- [ ] `window.api` is defined in renderer DevTools console — requires manual run
- [ ] Calling `window.api.invoke('unknown-channel')` returns an error, not a crash — requires manual run
- [x] `nodeIntegration: false`, `contextIsolation: true` confirmed in BrowserWindow config

---

## Group B — Profile Storage

### B1 · ProfileManager service `[DONE]`
Built: profile.schema.ts defines flat z.union of all 6 app entry variants (ide, browser-local, browser-website, terminal-command, terminal-script, app) + desktopSchema + profileSchema. ProfileManager.ts implements getAll/getById/save/delete/duplicate using fs/promises; ensureDir() auto-creates profiles directory; getAll() uses safeParse to skip corrupted files with a warning; save() uses parse() (throws on invalid); duplicate() uses structuredClone + randomUUID. tsc and ESLint clean.

**Goal:** Service that reads/writes profiles as JSON files in `%APPDATA%\DeskFlow\profiles\`.

Files created:
- `src/main/services/ProfileManager.ts`
  - `getAll(): Promise<Profile[]>`
  - `getById(id: string): Promise<Profile | null>`
  - `save(profile: Profile): Promise<void>` — validate with zod before writing
  - `delete(id: string): Promise<void>`
  - `duplicate(id: string): Promise<Profile>`
- `src/main/services/profile.schema.ts` — zod schema matching `Profile` type

Verify:
- [ ] Unit test (or manual Node script): create → read → update → delete cycle works — requires manual run
- [ ] Corrupted JSON file in profiles dir → `getAll()` skips it and logs warning, does not throw — requires manual run
- [ ] Profile directory auto-created if it doesn't exist — requires manual run

---

### B2 · Profile IPC handlers `[DONE]`
Built: profiles.ipc.ts registers all 5 profile handlers (getAll/getById/save/delete/duplicate) via ipcMain.handle; every handler is try/catch with typed IpcDataResponse/IpcVoidResponse returns; string id params narrowed from unknown before use; save passes through ProfileManager.save which runs zod validation. index.ts calls registerProfileHandlers() before createWindow(). tsc and ESLint clean.

**Goal:** Wire ProfileManager to IPC so the renderer can call it.

Files created:
- `src/main/ipc/profiles.ipc.ts` — registers handlers for all profile channels defined in `ipc-channels.ts`
  - every handler returns `{ success: boolean, data?: T, error?: string }`
  - every handler wrapped in try/catch
- `src/main/index.ts` — import and call `registerProfileHandlers()`

Verify:
- [ ] From renderer DevTools: `await window.api.invoke('profiles:getAll')` returns `{ success: true, data: [] }` — requires manual run
- [ ] Create a profile via IPC → file appears in `%APPDATA%\DeskFlow\profiles\` — requires manual run
- [ ] Delete via IPC → file removed — requires manual run

---

## Group C — Main Window + Tray

### C1 · Main window behaviour `[DONE]`
Built: requestSingleInstanceLock() at module level — second instance quits, first shows/focuses via second-instance event. setAppUserModelId(APP_BUNDLE_ID). close handler intercepts and hides unless isQuitting=true. Exported getMainWindow() and quitApp() helpers — quitApp() sets isQuitting before calling app.quit() so the close interceptor lets it through (required for tray quit in C2). tsc and ESLint clean.

**Goal:** Window lifecycle — show, hide, single-instance lock, close-to-tray.

Files modified:
- `src/main/index.ts`
  - `app.requestSingleInstanceLock()` — second launch focuses existing window
  - `app.setAppUserModelId('com.deskflow.app')`
  - `win.on('close', e => { e.preventDefault(); win.hide() })` — close hides, doesn't quit
  - Export `getMainWindow()` and `quitApp()` helpers

Verify:
- [ ] Launch app twice — second instance does not open a new window, first is focused — requires manual run
- [ ] Clicking window X hides it (taskbar entry disappears) — requires manual run
- [ ] App process is still running after hiding — requires manual run

---

### C2 · System tray `[DONE]`
Built: tray.ts creates Tray with icon (dev: ../../resources/icon.ico, packaged: process.resourcesPath/icon.ico), builds context menu with disabled profile name items + Open DeskFlow + Quit; left-click shows/focuses window via BrowserWindow.getAllWindows()[0]; quit uses app.exit(0) to bypass the close interceptor without needing a flag or circular import. initTray(profiles) called from index.ts after ProfileManager.getAll() on app ready. updateTrayMenu() exported and called from profiles.ipc.ts after save/delete/duplicate to keep menu live. icon.ico added to extraResources in electron-builder.yml. tsc and ESLint clean.

**Goal:** Tray icon with context menu. Tray is the only way to quit.

Files created:
- `src/main/tray.ts`
  - Icon from `resources/icon.ico`
  - Menu: `[profile names disabled]` · `Open DeskFlow` · `Quit`
  - Single-click tray icon → show/focus main window
  - `updateTrayMenu(profiles: Profile[])` — called when profiles change to refresh the list

Files modified:
- `src/main/index.ts` — load profiles then init tray on app ready
- `src/main/ipc/profiles.ipc.ts` — call updateTrayMenu after save/delete/duplicate
- `electron-builder.yml` — add icon.ico to extraResources

Verify:
- [ ] Tray icon appears in system tray — requires manual run
- [ ] Right-click → "Open DeskFlow" shows the window — requires manual run
- [ ] Right-click → "Quit" exits the process completely — requires manual run
- [ ] Profile names appear in tray menu (using test data) — requires manual run

---

## Group D — Profile List UI

### D1 · App shell + routing `[DONE]`
Built: installed react-router-dom. App.tsx uses HashRouter (works with both dev http:// and packaged file://). Nested routes: Layout (/) wraps ProfileList (index), ProfileEditor (/profile/:id), Settings (/settings); wildcard redirects to /. Layout.tsx: w-52 gray-900 sidebar with NavLink active styling (indigo-600), Outlet for content. Three placeholder pages. main.tsx updated to render <App />. tsc and ESLint clean.

**Goal:** React app with a router and empty page placeholders.

Files created:
- `src/renderer/App.tsx` — React Router setup with routes: `/` (ProfileList), `/profile/:id` (ProfileEditor), `/settings` (Settings)
- `src/renderer/components/Layout.tsx` — sidebar nav (Profiles · Settings) + main content area
- `src/renderer/pages/ProfileList.tsx` — empty placeholder
- `src/renderer/pages/ProfileEditor.tsx` — empty placeholder
- `src/renderer/pages/Settings.tsx` — empty placeholder

Verify:
- [ ] Navigating to each route shows correct placeholder — requires manual run
- [ ] Layout renders sidebar and content area — requires manual run
- [ ] No console errors — requires manual run

---

### D2 · ProfileCard component `[DONE]`
Built: ProfileCard renders name, singular/plural desktop+app counts, relative last-launched time (formatLastLaunched helper: s/m/h/d/mo/y ago) or "Never launched". Four action buttons: Edit (indigo), Duplicate (gray), Delete (red, triggers inline confirm), Launch (disabled, gray, cursor-not-allowed). Inline delete confirm: "Delete? Yes / Cancel" replaces button row. tsc and ESLint clean.

**Goal:** Visual card for a single profile — name, desktop/app count, last launched, action buttons.

Files created:
- `src/renderer/components/ProfileCard.tsx`
  - Props: `profile: Profile`, `onEdit()`, `onDuplicate()`, `onDelete()`, `onLaunch()`
  - Shows: name, `N desktops · M apps`, last launched time (or "Never launched")
  - Buttons: Edit · Duplicate · Delete · Launch (Launch disabled/greyed for now)
  - Delete shows inline confirm ("Delete?" with Yes/Cancel) — no separate modal

Verify:
- [ ] Renders correctly with a mock profile — requires manual run
- [ ] All 4 buttons visible — requires manual run
- [ ] Delete confirm shows/hides correctly — requires manual run
- [ ] Launch button is visually disabled — requires manual run

---

### D3 · Profile list page wired `[DONE]`
Built: ProfileList.tsx loads profiles via ipc.profiles.getAll() on mount (useCallback + useEffect). null state = loading spinner text. Error banner on IPC failure. Empty state with centered message + "New Profile" button. Profile grid (1/2/3 cols responsive). onEdit → navigate(/profile/:id), onDelete/onDuplicate → IPC call then reload list. tsc and ESLint clean.

**Goal:** ProfileList page loads real profiles from IPC and renders ProfileCards.

Files modified:
- `src/renderer/pages/ProfileList.tsx`

Verify:
- [ ] Page loads and shows existing profiles from disk — requires manual run
- [ ] Empty state shown when no profiles exist — requires manual run
- [ ] Delete a profile → card disappears from list — requires manual run
- [ ] Duplicate a profile → new card appears — requires manual run

---

## Group E — Profile Editor UI

### E1 · PositionPicker component `[DONE]`
Built: 3×3 grid of 40×40px buttons each containing an absolutely-positioned mini "window" indicator (CSSProperties map, no Tailwind dynamic classes). Selected: indigo-50 border + indigo-500 indicator. Hover: indigo-50 border preview. Three special-preset buttons below (Left ½, Right ½, Full) with same active/hover styles. All 12 positions covered. tsc and ESLint clean.

**Goal:** Standalone component for selecting a window position preset.

Files created:
- `src/renderer/components/PositionPicker.tsx`

Verify:
- [ ] Clicking each cell calls onChange with correct Position value — requires manual run
- [ ] Selected cell is visually highlighted — requires manual run
- [ ] All 12 presets selectable — requires manual run

---

### E2 · IDE app entry form `[DONE]`
Built: dialog.ipc.ts registers openFolder + openFile handlers via dialog.showOpenDialog; uses BrowserWindow.getAllWindows()[0] with null-safe fallback to avoid circular import with index.ts; registered in index.ts alongside profile handlers. IdeForm.tsx: folder path input + Browse button (calls ipc.dialog.openFolder), PositionPicker, delay input, settings fetch for idePath display (graceful catch if H1 not yet registered). FormErrors = Record<string,string> exported from IdeForm. tsc and ESLint clean.

**Goal:** Form for configuring an IDE-type app entry.

Files created:
- `src/renderer/components/forms/IdeForm.tsx`
- `src/main/ipc/dialog.ipc.ts`

Files modified:
- `src/main/index.ts` — register dialog handlers

Verify:
- [ ] Browse button opens folder picker — requires manual run
- [ ] Selected path populates input — requires manual run
- [ ] Empty path shows validation error — requires manual run

---

### E3 · Browser app entry form `[DONE]`
Built: BrowserForm.tsx with segmented mode toggle (Local project / Website). switchMode() rebuilds the full discriminated union object preserving id/position/delayMs. Local: port input (1–65535) + live preview "Opens: http://localhost:{port}". Website: url input + isValidUrl() inline warning (try/catch new URL). Explicit setPosition/setDelay helpers to avoid union spread issues with tsc. PositionPicker + delay shared between modes. tsc and ESLint clean.

**Goal:** Form for browser-type app entries (local port or full URL).

Files created:
- `src/renderer/components/forms/BrowserForm.tsx`

Verify:
- [ ] Toggle switches between local/website modes — requires manual run
- [ ] Port 5173 → preview shows `http://localhost:5173` — requires manual run
- [ ] Invalid URL shows warning — requires manual run

---

### E4 · Terminal app entry form `[DONE]`
Built: TerminalForm.tsx with Command / Script file mode toggle. Command mode: workingDir input + Browse (openFolder) + command input (monospace font). Script mode: scriptPath input + Browse (openFile filtered to bat/ps1/sh). switchMode() rebuilds discriminated union preserving shared fields. setPosition/setDelay helpers for type-safe union updates. tsc and ESLint clean.

**Goal:** Form for terminal-type entries (run command or execute script file).

Files created:
- `src/renderer/components/forms/TerminalForm.tsx`

Verify:
- [ ] Toggle switches between modes — requires manual run
- [ ] Browse works for both working dir and script file — requires manual run
- [ ] Empty command field shows validation error — requires manual run

---

### E5 · Generic app entry form `[DONE]`
Built: AppForm.tsx — exe path input + Browse (openFile filtered to exe/com/bat/cmd), non-.exe amber warning (soft, not error), args text input (space-joined display, split on whitespace on change), PositionPicker, delay. tsc and ESLint clean.

**Goal:** Form for any `.exe` app entry.

Files created:
- `src/renderer/components/forms/AppForm.tsx`

Verify:
- [ ] Browse opens file picker filtered to .exe — requires manual run
- [ ] Non-.exe path shows warning — requires manual run
- [ ] Args field accepts any text — requires manual run

---

### E6 · App entry modal `[DONE]`
Built: AppEntryModal.tsx — 2-step flow: type tile grid (2×2) → form. defaultEntry() builds a clean default AppEntry per type. validate() runs field-level checks without zod (renderer-side UX only; main-side zod is the real gate). isEditing prop skips step 1. Back button resets to type selection and clears errors. onChange wrappers `(v) => setEntry(v)` satisfy narrowed form prop types. Click-outside backdrop closes modal. tsc and ESLint clean.

**Goal:** Modal that combines type selection + the correct form.

Files created:
- `src/renderer/components/AppEntryModal.tsx`

Verify:
- [ ] All 4 type tiles navigate to correct form — requires manual run
- [ ] Back button returns to type selection — requires manual run
- [ ] Saving with invalid data shows field errors, does not close — requires manual run
- [ ] Saving valid entry calls onSave with correct typed object — requires manual run

---

### E7 · DesktopCard component `[DONE]`
Built: DesktopCard.tsx — DndContext + SortableContext (verticalListSortingStrategy) wrap AppEntryRow list; PointerSensor with distance:5 activationConstraint. Inline desktop name input (transparent border, focus reveals). Delete button: immediate if no apps, inline confirm ("Delete desktop? Yes / Cancel") if apps exist. Add App opens AppEntryModal (no initial = add mode); clicking Edit on a row opens AppEntryModal with initial = edit mode. handleSaveApp maps vs appends based on editingApp state. Empty state hint shown when no apps. tsc and ESLint clean.

**Goal:** Component representing one virtual desktop slot in the profile editor.

Files created:
- `src/renderer/components/DesktopCard.tsx`
  - Props: `desktop: Desktop`, `onChange(d: Desktop) => void`, `onDelete() => void`
  - Editable desktop name (inline input)
  - List of `AppEntryRow` for each app
  - "Add App" button → opens `AppEntryModal`
  - Delete desktop button (with inline confirm if apps exist)
  - Drag-to-reorder apps using `@dnd-kit/sortable`
- `src/renderer/components/AppEntryRow.tsx`
  - Shows: type icon, name/path summary, position badge, delay
  - Edit and Delete buttons

Verify:
- [ ] Desktop name editable inline
- [ ] App rows render correctly for all 4 types
- [ ] "Add App" opens the modal
- [ ] Deleting an app removes it from list
- [ ] Drag handle visible, reordering works

---

### E8 · Profile editor page wired `[DONE]`
Built: ProfileEditor.tsx loads via ipc.profiles.getById(id) or creates blank for /profile/new. isDirty tracked via JSON.stringify vs originalRef. beforeunload listener warns on page refresh when dirty. useBlocker from react-router-dom blocks in-app navigation with window.confirm. Top bar: ← back, profile name input, "Unsaved changes" badge, Save + Save+Launch buttons. updateDesktop/deleteDesktop/addDesktop mutate local state; deleteDesktop reindexes remaining desktops. Save calls ipc.profiles.save → resets dirty → navigate(/). Validate requires non-empty name. Error banner for IPC failures. tsc and ESLint clean.

**Goal:** Full profile editor page — create new and edit existing profiles.

Files modified:
- `src/renderer/pages/ProfileEditor.tsx`
  - Loads profile from IPC if editing (`/profile/:id`), empty state if new (`/profile/new`)
  - Renders list of `DesktopCard` components
  - "+ Add Desktop" button appends a new empty desktop
  - Profile name input at top
  - "Save" → validates → calls `ipc.profiles.save()` → navigates to `/`
  - "Save + Launch" → save then trigger launch (launch is a no-op until Group F)
  - Unsaved changes: browser `beforeunload` warn + in-app nav guard

Verify:
- [ ] Create new profile end-to-end: name, 2 desktops, 1 app each, save → appears in list
- [ ] Edit existing profile → changes persist after save
- [ ] Navigate away with unsaved changes → warning shown
- [ ] "Save + Launch" saves the profile (launch part does nothing yet — that's fine)

---

## Group F — Launch Engine

### F1 · PowerShell utility `[DONE]`
Built: src/main/platform/windows/utils/powershell.ts — runPS(script, timeoutMs=10000) spawns powershell.exe with -ExecutionPolicy Bypass -NonInteractive -NoProfile. Buffers stdout/stderr. Kills process and rejects on timeout. Rejects with exit code + stderr on non-zero exit. Rejects on spawn error. Logs truncated command (200 chars) and exit code via electron-log. tsc and ESLint clean.

**Goal:** Reusable function to execute PowerShell commands from Node.js with timeout and error handling.

Files created:
- `src/main/platform/windows/utils/powershell.ts`
  - `runPS(script: string, timeoutMs?: number): Promise<{ stdout: string; stderr: string }>`
  - Spawns `powershell.exe -ExecutionPolicy Bypass -Command <script>`
  - Rejects on non-zero exit code or timeout
  - Logs command (truncated) and exit code

Verify:
- [ ] `runPS('echo hello')` resolves with stdout `hello`
- [ ] `runPS('Start-Sleep 60', 500)` rejects with timeout error
- [ ] `runPS('throw "fail"')` rejects with stderr content

---

### F2 · VirtualDesktopManager `[DONE]`
Built: VirtualDesktopManager.ts — vdaScript() helper builds a PS here-string with Add-Type C# type definition using DllImport(@"full\path") verbatim string (backslash-safe). getDllPath() uses app.getAppPath()/resources/ in dev and process.resourcesPath/ when packaged. Four methods: getDesktopCount (returns int, validates >= 1), createDesktop (returns new 0-based index), switchToDesktop(index), moveWindowToDesktop(hwnd, index) uses [IntPtr]::new(hwnd) for 64-bit safety. electron-builder.yml DLL extraResource entry uncommented (to: VirtualDesktopAccessor.dll flat in resourcesPath). DLL must be downloaded from github.com/Ciantic/VirtualDesktopAccessor/releases and placed in resources/. tsc and ESLint clean.

**Goal:** Create, count, switch, and move windows between virtual desktops via VirtualDesktopAccessor.dll.

Files created:
- `resources/VirtualDesktopAccessor.dll` — bundled DLL
- `src/main/platform/windows/VirtualDesktopManager.ts`
  - `getDesktopCount(): Promise<number>`
  - `createDesktop(): Promise<number>` — returns new desktop index
  - `switchToDesktop(index: number): Promise<void>`
  - `moveWindowToDesktop(hwnd: number, index: number): Promise<void>`
  - All methods call PowerShell helper scripts that load the DLL
  - DLL path resolved via `app.getAppPath()` — works in dev and packaged

Verify:
- [ ] `getDesktopCount()` returns current desktop count (matches Task View)
- [ ] `createDesktop()` adds a desktop (visible in Task View)
- [ ] `switchToDesktop(1)` switches to desktop 2
- [ ] Run from both `npm run dev` and packaged installer — DLL path resolves correctly

---

### F3 · WindowPositioner `[DONE]`
Built: WindowPositioner.ts using PowerShell Win32 P/Invoke — node-window-manager dropped (requires Visual Studio Build Tools, not available; PowerShell approach is zero-dependency and consistent with VirtualDesktopManager). getWorkArea() uses System.Windows.Forms.Screen.PrimaryScreen.WorkingArea. resolvePreset() is a pure TS function: 9 grid positions each get 50%×50% tiles with quarter-offset centering for middle row/col; left-half/right-half = 50%×100%; full = 100%×100%. findWindowByPid() polls every 250ms in TypeScript loop, each iteration spawns PS script that EnumWindows + GetWindowThreadProcessId to find first visible window for the PID. positionWindow() calls getWorkArea + resolvePreset then PS SetWindowPos with ShowWindow(9) first to restore minimised windows. tsc and ESLint clean.

**Goal:** Find a window by PID/title and move/resize it to a position preset.

Files created:
- `src/main/platform/windows/WindowPositioner.ts`
  - `getWorkArea(): Promise<{ x, y, width, height }>` — screen minus taskbar via System.Windows.Forms
  - `resolvePreset(position: Position, workArea): { x, y, width, height }` — pure function
  - `positionWindow(hwnd: number, position: Position): Promise<void>` — Win32 SetWindowPos via PS
  - `findWindowByPid(pid: number, timeoutMs: number): Promise<number | null>` — polls EnumWindows via PS
  - Uses PowerShell Win32 P/Invoke (zero native dependencies)

Verify:
- [ ] Open Notepad manually, get its hwnd, call `positionWindow(hwnd, 'top-left')` → window moves to top-left quarter
- [ ] `resolvePreset('full', workArea)` returns full screen dimensions
- [ ] `findWindowByPid(pid, 5000)` finds a just-launched process window within timeout

---

### F4 · AppLauncher — IDE `[DONE]`
Built: AppLauncher.ts created. launchIde(entry, vscodePath) handles both direct Code.exe and code.cmd wrapper: snapshots existing Code.exe PIDs via getRunningPids() before spawn; for .exe uses findWindowByPid on spawned PID; for .cmd/.bat wrappers (which exit immediately) uses pollForNewPid() which PS-polls Get-Process Code every 500ms for a new PID not in the snapshot; once PID found, findWindowByPid gets HWND. Always passes --new-window to ensure fresh window. WINDOW_WAIT_MS=20s. delay()/getRunningPids()/pollForNewPid() are shared helpers reused by F5-F7. tsc and ESLint clean.

**Goal:** Launch VS Code to a folder and return the window handle.

Files created:
- `src/main/platform/windows/AppLauncher.ts` (start file — more methods added in F5/F6/F7)
  - `launchIde(entry: IdeEntry, vscodePath: string): Promise<LaunchResult>`
  - Spawns `code <folder>`
  - Waits for VS Code window to appear using `findWindowByPid`
  - Returns `{ success, hwnd, pid }`

Verify:
- [ ] Calling `launchIde` with a valid folder opens VS Code to that folder
- [ ] Returns correct hwnd
- [ ] Invalid folder path → returns `{ success: false, error: '...' }`

---

### F5 · AppLauncher — Browser `[DONE]`
Built: launchBrowser() handles both local (http://localhost:{port}) and website URLs. Extracts process name from browserPath dynamically (chrome, msedge, etc.) via browserProcessName(). Same PID-snapshot + pollForNewPid pattern as launchIde since browsers delegate to existing instances. Spawns with --new-window flag, tries direct PID first, falls back to poll. tsc clean.

**Goal:** Launch Chrome/Edge to a URL or local port.

Files modified:
- `src/main/platform/windows/AppLauncher.ts`
  - `launchBrowser(entry: BrowserEntry, browserPath: string): Promise<LaunchResult>`
  - `browserProcessName(browserPath: string): string` — helper to extract process name from exe path
  - Resolves URL from entry (local: `http://localhost:{port}`, website: entry.url)
  - Spawns `browser --new-window <url>`
  - Snapshots PIDs, tries direct PID, falls back to pollForNewPid

Verify:
- [ ] `launchBrowser` with port 3000 opens Chrome to `http://localhost:3000` — requires manual run
- [ ] `launchBrowser` with a website URL opens that URL — requires manual run
- [ ] Missing Chrome path → `{ success: false, error: '...' }` — requires manual run

---

### F6 · AppLauncher — Terminal `[DONE]`
Built: launchTerminal() handles command mode (wt -d workingDir cmd /k command) and script mode (.ps1 via powershell -NoExit -File, .bat/.cmd via cmd /k). terminalProcessName() maps wt/wt.exe to "WindowsTerminal" for PID polling. Uses shell:true for wt command dispatch. Same PID-snapshot + poll pattern. tsc clean.

**Goal:** Launch Windows Terminal with a command or execute a script file.

Files modified:
- `src/main/platform/windows/AppLauncher.ts`
  - `launchTerminal(entry: TerminalEntry, terminalPath: string): Promise<LaunchResult>`
  - `terminalProcessName(terminalPath: string): string` — maps wt → WindowsTerminal
  - Command mode: `wt -d <workingDir> cmd /k <command>`
  - Script mode: .ps1 → `wt powershell -ExecutionPolicy Bypass -NoExit -File <path>`, .bat/.cmd → `wt cmd /k <path>`
  - PID-snapshot + pollForNewPid (WT delegates to single instance)

Verify:
- [ ] Command mode: Windows Terminal opens and runs the command — requires manual run
- [ ] Script mode: `.bat` and `.ps1` files execute — requires manual run
- [ ] Invalid script path → `{ success: false, error: '...' }` — requires manual run

---

### F7 · AppLauncher — Generic App `[DONE]`
Built: launchApp() spawns any exe with args array. Extracts process name from path for PID polling fallback. Direct PID first, then pollForNewPid for apps that delegate to existing instances (Spotify, Discord, etc.). All four app type launchers (F4–F7) now complete. tsc clean.

**Goal:** Launch any `.exe` with optional args.

Files modified:
- `src/main/platform/windows/AppLauncher.ts`
  - `launchApp(entry: GenericAppEntry): Promise<LaunchResult>`
  - Spawns `path args...` detached
  - Direct PID → findWindowByPid, fallback → pollForNewPid

Verify:
- [ ] Launches `notepad.exe` successfully — requires manual run
- [ ] Passes args correctly — requires manual run
- [ ] Nonexistent path → `{ success: false, error: '...' }` — requires manual run

---

### F8 · IPlatform interface `[DONE]`
Built: IPlatform interface with 10 methods (4 virtual desktop, 4 app launch, 2 window management). WindowsPlatform class delegates to existing module functions. getPlatform() singleton factory with win32 guard. Re-exports IPlatform type from platform/index.ts for clean imports. tsc clean.

**Goal:** Define the OS abstraction interface and wire the Windows implementations to it.

Files created:
- `src/main/platform/IPlatform.ts` — interface with all methods from VirtualDesktopManager, AppLauncher, WindowPositioner
- `src/main/platform/windows/index.ts` — `WindowsPlatform` class implementing `IPlatform`
- `src/main/platform/index.ts` — exports `getPlatform(): IPlatform` singleton (returns WindowsPlatform on win32)

Verify:
- [x] `getPlatform()` returns an object satisfying `IPlatform` — WindowsPlatform implements all 10 methods
- [x] `tsc --noEmit` passes with no interface mismatches

---

### F9 · LaunchEngine `[DONE]`
Built: LaunchEngine class with launch(profile, settings, onProgress) and cancel(). Ensures enough virtual desktops exist before launching. Iterates desktops → apps: launch via IPlatform dispatch (switch on app.type), positionWindow, moveWindowToDesktop. Per-app delay + globalLaunchDelayMs respected. Switches back to desktop 0 after completion. One app failing doesn't stop the rest. 7 progress event types emitted. appLabel() helper for human-readable progress messages. tsc clean.

**Goal:** Orchestrate a full profile launch — desktops, apps in order, progress events.

Files created:
- `src/main/services/LaunchEngine.ts`
  - `launch(profile: Profile, settings: Settings, onProgress: ProgressCallback): Promise<LaunchReport>`
  - `cancel()` — sets abort flag, stops remaining launches
  - Steps: ensure desktops → per app: emit progress → launch via IPlatform → position → move to desktop → delay
  - One app failing does not stop the rest — logged and included in report
  - Returns `LaunchReport`: `{ success, cancelled, results: AppLaunchResult[] }`

Verify:
- [ ] Launch a profile with 2 desktops and 3 apps — all open in correct desktops and positions — requires manual run
- [ ] One app with an invalid path → that app fails, others still launch — requires manual run
- [ ] `cancel()` mid-launch → already-launched apps stay open, rest stops — requires manual run

---

### F10 · Launch IPC + progress events `[DONE]`
Built: launch.ipc.ts registers launch:start and launch:cancel handlers. launch:start loads profile by id, uses default settings (until H1 SettingsManager), runs LaunchEngine asynchronously, broadcasts progress events to all BrowserWindows via webContents.send. Updates lastLaunchedAt on success. Cancels any in-progress launch before starting new one. Renderer client.ts already had launch wrappers from A5. tsc clean.

**Goal:** Wire LaunchEngine to IPC so renderer can trigger launch and receive progress.

Files created:
- `src/main/ipc/launch.ipc.ts`
  - `launch:start` handler — loads profile, starts LaunchEngine async, sends progress via `webContents.send`
  - `launch:cancel` handler — calls `engine.cancel()`
  - Default settings fallback until SettingsManager (H1) exists

Files modified:
- `src/main/index.ts` — register launch handlers
- `src/renderer/ipc/client.ts` — launch wrappers already existed from A5

Verify:
- [ ] Calling `launch:start` from renderer DevTools triggers a real launch — requires manual run
- [ ] Progress events arrive in renderer (visible in console) — requires manual run
- [ ] `launch:cancel` stops the launch — requires manual run

---

### F11 · Launch progress modal `[DONE]`
Built: LaunchProgressModal component — subscribes to launch:progress events, tracks per-app status (pending/launching/done/failed) with animated spinner, checkmark, or X. Progress bar with completed/total counter. Cancel button during launch, Close button after. Auto-closes 2s after all-success completion. Wired into ProfileList (Launch button) and ProfileEditor (Save+Launch). tsc clean.

**Goal:** UI that shows real-time launch progress.

Files created:
- `src/renderer/components/LaunchProgressModal.tsx`
  - Shows profile name + animated progress bar
  - Lists each app: spinner (launching) / checkmark (done) / X (failed)
  - Failed items show error string inline
  - Cancel button during launch, Close button after
  - Auto-closes 2s after all-success completion

Files modified:
- `src/renderer/pages/ProfileList.tsx` — Launch button opens modal, reloads profiles on close
- `src/renderer/pages/ProfileEditor.tsx` — Save+Launch saves then opens modal, navigates home on close

Verify:
- [ ] Launch from ProfileList → modal appears, updates in real time — requires manual run
- [ ] Failed app shown with X and error message — requires manual run
- [ ] Cancel mid-launch → remaining apps don't launch — requires manual run
- [ ] Success → modal auto-closes after 2s — requires manual run

---

### F12 · Enable tray launch `[DONE]`
Built: Tray profile items now call launchFromTray() which creates a LaunchEngine, runs the profile, updates lastLaunchedAt on success, and shows a native OS Notification for success/cancelled/error outcomes. Also forwards progress events to open renderer windows. tsc clean.

**Goal:** Tray menu profile items now actually launch profiles.

Files modified:
- `src/main/tray.ts`
  - Profile menu items call `launchFromTray(profile)` on click
  - `launchFromTray()` runs LaunchEngine, shows Notification on complete/cancel/error
  - Updates lastLaunchedAt and forwards progress events to renderer

Verify:
- [ ] Right-click tray → profile name → profile launches — requires manual run
- [ ] OS notification appears on completion — requires manual run

---

## Group G — Snapshot Mode

### G1 · SnapshotDetector `[DONE]`
Built: Single PS invocation using C# Add-Type with EnumWindows, GetWindowText, GetWindowRect, DwmGetWindowAttribute (cloaked filter), and VDA GetWindowDesktopNumber. Excludes DeskFlow's own PID, cloaked UWP windows, zero-size windows, and common shell processes (explorer, SearchHost, etc.). Each window output as JSON line, parsed in TS. 30s timeout. tsc clean.

**Goal:** Enumerate all user-visible windows with process metadata and virtual desktop index.

Files created:
- `src/main/platform/windows/SnapshotDetector.ts`
  - `getWindows(): Promise<WindowInfo[]>`
  - Single PS script: C# P/Invoke EnumWindows + VDA DLL for desktop index
  - Filters: cloaked windows, zero-size, system/shell processes, own PID
  - JSON-line output parsed in TypeScript
  - Unparseable lines logged and skipped

Verify:
- [ ] Call `getWindows()` with VS Code + Chrome open → both appear in results — requires manual run
- [ ] `exePath` and `workingDir` populated correctly — requires manual run
- [ ] `desktopIndex` matches which virtual desktop the window is on — requires manual run
- [ ] DeskFlow's own window not in results — requires manual run

---

### G2 · SnapshotService `[DONE]`
Built: buildDraft() groups windows by desktopIndex, detects app type via exe name heuristic (Code.exe→ide with folder from title, chrome/msedge/firefox→browser, wt/cmd/powershell→terminal, else→app), maps bounds to nearest Position preset via Manhattan distance on centers + weighted size delta. Returns ProfileDraft with empty id/name. tsc clean.

**Goal:** Transform raw WindowInfo list into a draft Profile.

Files created:
- `src/main/services/SnapshotService.ts`
  - `buildDraft(windows: WindowInfo[]): Promise<ProfileDraft>`
  - `detectAppType(win)` — heuristic: exe name → ide/browser/terminal/app
  - `nearestPreset(bounds, workArea)` — Manhattan distance on center + size
  - Groups by desktopIndex, returns ProfileDraft

Verify:
- [ ] VS Code window → detected as `ide` with folder from title — requires manual run
- [ ] Chrome window → detected as `browser` — requires manual run
- [ ] Unknown app → detected as `app` with exe path — requires manual run
- [ ] Window in top-left quarter → maps to `top-left` preset — requires manual run

---

### G3 · Snapshot IPC + tray trigger `[DONE]`
Built: snapshot.ipc.ts registers snapshot:capture handler (getWindows → buildDraft → return draft). Tray "Snapshot current desktop..." item calls snapshotFromTray() which captures, shows main window, and pushes SNAPSHOT_READY event to renderer. Native notification on success/failure. Renderer client.ts has onReady/offReady listeners for tray-triggered snapshots. tsc clean.

**Goal:** Wire snapshot to IPC and tray menu.

Files created:
- `src/main/ipc/snapshot.ipc.ts`
  - `snapshot:capture` handler — getWindows() → buildDraft() → return ProfileDraft

Files modified:
- `src/shared/ipc-channels.ts` — added SNAPSHOT_READY push event channel
- `src/main/tray.ts` — "Snapshot current desktop..." menu item, snapshotFromTray(), Notification
- `src/main/index.ts` — register snapshot handlers
- `src/renderer/ipc/client.ts` — snapshot.onReady/offReady listeners

Verify:
- [ ] `snapshot:capture` IPC call returns a populated ProfileDraft — requires manual run
- [ ] Tray menu item triggers snapshot and opens main window — requires manual run

---

### G4 · Snapshot review page `[DONE]`
Built: SnapshotReview.tsx receives ProfileDraft via navigation state (from tray SNAPSHOT_READY event or UI Snapshot button). Shows desktops with app rows (type badge, summary, position). Name input at top, "Save as Profile" generates UUID and saves. Layout.tsx listens for SNAPSHOT_READY push event and navigates to /snapshot. ProfileList has "Snapshot" button that calls snapshot:capture directly. Route added to App.tsx. tsc clean.

**Goal:** UI to review and correct detected entries before saving as a profile.

Files created:
- `src/renderer/pages/SnapshotReview.tsx`
  - Receives `ProfileDraft` via navigation state
  - Lists detected desktops and apps with type badges and summaries
  - Name input at top
  - "Save as Profile" → generates id → `ipc.profiles.save()` → navigate to `/`
  - "Cancel" → back to ProfileList

Files modified:
- `src/renderer/App.tsx` — added /snapshot route
- `src/renderer/components/Layout.tsx` — listens for SNAPSHOT_READY, navigates to /snapshot
- `src/renderer/pages/ProfileList.tsx` — "Snapshot" button triggers capture from UI

Verify:
- [ ] All detected apps shown correctly — requires manual run
- [ ] Saving navigates to profile list with new profile present — requires manual run
- [ ] Tray snapshot opens review page automatically — requires manual run
- [ ] Profile is launch-ready after saving — requires manual run

---

## Group H — Settings

### H1 · Settings storage `[DONE]`
Built: SettingsManager with get/save (merge partial)/detectIdePath/detectBrowserPath. Zod schema validation, falls back to defaults on invalid. Auto-detect checks common install paths + PATH for VS Code, Chrome/Edge/Firefox for browser. settings.ipc.ts with 4 handlers. Replaced getDefaultSettings() in launch.ipc.ts and tray.ts with SettingsManager.get(). tsc clean.

**Goal:** Settings read/write service with auto-detection of VS Code and Chrome paths.

Files created:
- `src/main/services/SettingsManager.ts` — get, save (partial merge), detectIdePath, detectBrowserPath
- `src/main/services/settings.schema.ts` — zod schema for Settings
- `src/main/ipc/settings.ipc.ts` — settings:get, settings:save, settings:detectIdePath, settings:detectBrowserPath

Files modified:
- `src/main/index.ts` — register settings handlers
- `src/main/ipc/launch.ipc.ts` — replaced getDefaultSettings() with SettingsManager.get()
- `src/main/tray.ts` — replaced getDefaultSettings() with SettingsManager.get()

Verify:
- [ ] First launch → settings file created with defaults — requires manual run
- [ ] `detectIdePath()` finds VS Code if installed — requires manual run
- [ ] Save partial settings → merges, doesn't overwrite unrelated keys — requires manual run

---

### H2 · Settings UI `[ ]`
**Goal:** Settings page where users configure IDE, browser, terminal paths and app behavior.

Files modified:
- `src/renderer/pages/Settings.tsx`
  - IDE path (text + Browse + "Auto-detect" button)
  - Browser path (text + Browse + "Auto-detect")
  - Terminal path (text + Browse, defaults to `wt`)
  - Start with Windows toggle
  - Minimize to tray toggle
  - Global launch delay (ms) slider/input
  - Theme selector (system / light / dark)
  - "Save" button

Verify:
- [ ] Settings load current values on open
- [ ] Auto-detect finds VS Code and Chrome
- [ ] Save persists to `%APPDATA%\DeskFlow\settings.json`
- [ ] Changing theme applies immediately

---

## Group I — CLI

### I1 · CLI argument parser `[ ]`
**Goal:** Parse process.argv in Electron main and route to the right handler.

Files created:
- `src/main/cli/index.ts`
  - Parses `process.argv` for: `launch`, `list`, `snapshot`, `open`, `--version`, `--help`
  - If CLI command detected: run it headlessly (no window), exit when done
  - If no command: normal app startup

Verify:
- [ ] `deskflow --help` prints usage to stdout and exits 0
- [ ] `deskflow --version` prints version and exits 0
- [ ] `deskflow list` prints profile names and exits 0
- [ ] Running with no args → normal app starts

---

### I2 · CLI launch + snapshot commands `[ ]`
**Goal:** `deskflow launch` and `deskflow snapshot` work headlessly.

Files created:
- `src/main/cli/handlers/launch.ts` — load profile by name → LaunchEngine.launch() → print report → exit
- `src/main/cli/handlers/snapshot.ts` — capture snapshot → save with given name → print confirmation → exit

Verify:
- [ ] `deskflow launch "Profile Name"` launches profile, exits 0 on success
- [ ] `deskflow launch "Nonexistent"` prints error, exits 1
- [ ] `deskflow snapshot "My Setup"` saves snapshot, exits 0

---

## Group J — Polish + Distribution

### J1 · Error handling pass `[ ]`
**Goal:** Every failure surface in the UI shows a clear, actionable message.

Files created:
- `src/renderer/components/ErrorToast.tsx` — bottom-right toast, auto-dismiss 5s, manual dismiss

Files audited and updated (as needed):
- All IPC calls in renderer components — ensure error responses show ErrorToast
- LaunchProgressModal — confirm failed apps show useful error text
- ProfileEditor — save failures surface correctly

Verify:
- [ ] Trigger a launch with a bad exe path → error shown in progress modal
- [ ] IPC failure (simulate by killing main process handler) → toast appears in renderer
- [ ] Missing DLL → toast shows "VirtualDesktopAccessor.dll not found — reinstall DeskFlow"

---

### J2 · Keyboard navigation `[ ]`
**Goal:** Core flows navigable without a mouse.

Files modified (as needed):
- `src/renderer/pages/ProfileList.tsx` — `Ctrl+N` new profile, `Enter` launch, `Delete` delete
- `src/renderer/App.tsx` — `Ctrl+,` opens Settings, `Escape` closes modals / goes back
- All modals — focus trap, `Escape` closes

Verify:
- [ ] `Ctrl+N` from profile list opens new profile editor
- [ ] `Ctrl+,` opens settings from anywhere
- [ ] `Escape` closes any open modal
- [ ] Tab navigation works through all forms

---

### J3 · GitHub repo setup `[ ]`
**Goal:** Public GitHub repo ready for open-source contributions.

Files created:
- `LICENSE` — MIT
- `CONTRIBUTING.md` — dev setup, branch conventions, PR process
- `CHANGELOG.md` — Keep-a-changelog format, initial v1.0.0 entry
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`
- `.github/PULL_REQUEST_TEMPLATE.md`

Verify:
- [ ] Repo is public on GitHub
- [ ] README renders correctly on GitHub
- [ ] Issue templates appear when opening a new issue

---

### J4 · CI pipeline `[ ]`
**Goal:** Every PR runs lint + type-check automatically.

Files created:
- `.github/workflows/ci.yml`
  - Trigger: PR to main
  - Steps: checkout → setup Node → `npm ci` → `npm run lint` → `tsc --noEmit`

Verify:
- [ ] Open a test PR → workflow runs and passes
- [ ] Introduce a type error → workflow fails

---

### J5 · Release pipeline + v1.0.0 `[ ]`
**Goal:** Tagging `v1.0.0` auto-produces and publishes the Windows installer.

Files created:
- `.github/workflows/release.yml`
  - Trigger: push tag `v*.*.*`
  - Steps: checkout → setup Node → `npm ci` → `npm run build` → upload `.exe` as GitHub Release asset

Actions:
- Bump `package.json` version to `1.0.0`
- Push tag `v1.0.0`

Verify:
- [ ] Tag pushed → workflow runs
- [ ] GitHub Release created with `DeskFlow-Setup-1.0.0.exe` attached
- [ ] Installer downloaded from release page → installs cleanly on fresh Windows

---

## Out-of-Band — Installer Wizard + Auto-Updater `[DONE]`

Added custom NSIS installer wizard with branded pages, in-app auto-updater, and main window polish. Done outside the original phase sequence.

### OOB1 · Custom NSIS Installer `[DONE]`
Built: Custom NSIS macros in build/installer.nsh — branded welcome page (MUI2 defines), "Ready to Install" summary page (nsDialogs custom page), finish page with working "Launch DeskFlow" via StdUtils.ExecShellAsUser, branded uninstaller welcome with user data cleanup prompt. BMP assets generated via PowerShell System.Drawing (build/generate-installer-assets.ps1). MIT LICENSE added for installer license page.

Files created:
- `build/installer.nsh` — customHeader, customWelcomePage, customPageAfterChangeDir, customFinishPage, customUnWelcomePage, customUnInstall
- `build/generate-installer-assets.ps1` — generates installerSidebar.bmp (164x314) + installerHeader.bmp (150x57)
- `build/installerSidebar.bmp`, `build/installerHeader.bmp`
- `LICENSE` — MIT license

Files modified:
- `electron-builder.yml` — nsis.include, sidebar, header, license, publish config

### OOB2 · In-App Auto-Updater `[DONE]`
Built: electron-updater integration. AutoUpdater service wraps autoUpdater events, broadcasts UpdateState via webContents.send. UpdateBanner component shows "restart & update" bar when downloaded. Settings page has "Check for Updates" button with live status. Dev-safe (skips when !app.isPackaged).

Files created:
- `src/main/services/AutoUpdater.ts`
- `src/main/ipc/updater.ipc.ts`
- `src/renderer/components/UpdateBanner.tsx`

Files modified:
- `src/shared/types.ts` — UpdateStatus, UpdateInfo, UpdateProgress, UpdateState
- `src/shared/ipc-channels.ts` — UPDATER_CHECK, UPDATER_INSTALL, UPDATER_STATUS
- `src/renderer/ipc/client.ts` — updater domain
- `src/renderer/components/Layout.tsx` — UpdateBanner
- `src/renderer/pages/Settings.tsx` — About section + check for updates
- `package.json` — electron-updater dependency

### OOB3 · Main Window Polish `[DONE]`
Built: BrowserWindow now has correct app icon via nativeImage.createFromPath(getIconPath()). Default Electron menu bar removed via Menu.setApplicationMenu(null).

Files modified:
- `src/main/index.ts` — icon property, getIconPath(), Menu.setApplicationMenu(null)

---

## Backlog (v2+)

| Feature | Notes |
|---------|-------|
| Multi-monitor support | Assign apps to specific monitor |
| Import / Export profiles | `.deskflow` portable file |
| Global hotkeys | `globalShortcut` Electron API |
| App Groups | Reusable sets of apps |
| Mac / Linux port | Needs `platform/mac/` + `platform/linux/` |
| Profile Hub | Community-shared profiles |
| `winget install deskflow` | Submit to winget |

---

*Last updated: H1 complete. Settings storage + auto-detect done. Next: H2 (Settings UI page).*
