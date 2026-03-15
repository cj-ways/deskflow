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

### A5 · Preload + contextBridge `[ ]`
**Goal:** Secure IPC bridge between main and renderer — renderer never touches Node directly.

Files created:
- `src/preload/index.ts` — exposes `window.api` via `contextBridge.exposeInMainWorld`; typed API surface using channel names from `ipc-channels.ts`
- `src/renderer/ipc/client.ts` — typed wrapper functions that call `window.api.invoke(channel, payload)` — components never call `window.api` directly

Verify:
- [ ] `window.api` is defined in renderer DevTools console
- [ ] Calling `window.api.invoke('unknown-channel')` returns an error, not a crash
- [ ] `nodeIntegration: false`, `contextIsolation: true` confirmed in BrowserWindow config

---

## Group B — Profile Storage

### B1 · ProfileManager service `[ ]`
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
- [ ] Unit test (or manual Node script): create → read → update → delete cycle works
- [ ] Corrupted JSON file in profiles dir → `getAll()` skips it and logs warning, does not throw
- [ ] Profile directory auto-created if it doesn't exist

---

### B2 · Profile IPC handlers `[ ]`
**Goal:** Wire ProfileManager to IPC so the renderer can call it.

Files created:
- `src/main/ipc/profiles.ipc.ts` — registers handlers for all profile channels defined in `ipc-channels.ts`
  - every handler returns `{ success: boolean, data?: T, error?: string }`
  - every handler wrapped in try/catch
- `src/main/index.ts` — import and call `registerProfileHandlers()`

Verify:
- [ ] From renderer DevTools: `await window.api.invoke('profiles:getAll')` returns `{ success: true, data: [] }`
- [ ] Create a profile via IPC → file appears in `%APPDATA%\DeskFlow\profiles\`
- [ ] Delete via IPC → file removed

---

## Group C — Main Window + Tray

### C1 · Main window behaviour `[ ]`
**Goal:** Window lifecycle — show, hide, single-instance lock, close-to-tray.

Files modified:
- `src/main/index.ts`
  - `app.requestSingleInstanceLock()` — second launch focuses existing window
  - `app.setAppUserModelId('com.deskflow.app')`
  - `win.on('close', e => { e.preventDefault(); win.hide() })` — close hides, doesn't quit
  - Export `getMainWindow()` helper

Verify:
- [ ] Launch app twice — second instance does not open a new window, first is focused
- [ ] Clicking window X hides it (taskbar entry disappears)
- [ ] App process is still running after hiding

---

### C2 · System tray `[ ]`
**Goal:** Tray icon with context menu. Tray is the only way to quit.

Files created:
- `src/main/tray.ts`
  - Icon from `resources/icon.ico`
  - Menu: `[profile names disabled]` · `Open DeskFlow` · `Quit`
  - Single-click tray icon → show/focus main window
  - `updateMenu(profiles: Profile[])` — called when profiles change to refresh the list

Files modified:
- `src/main/index.ts` — init tray after app ready

Verify:
- [ ] Tray icon appears in system tray
- [ ] Right-click → "Open DeskFlow" shows the window
- [ ] Right-click → "Quit" exits the process completely
- [ ] Profile names appear in tray menu (using test data)

---

## Group D — Profile List UI

### D1 · App shell + routing `[ ]`
**Goal:** React app with a router and empty page placeholders.

Files created:
- `src/renderer/App.tsx` — React Router setup with routes: `/` (ProfileList), `/profile/:id` (ProfileEditor), `/settings` (Settings)
- `src/renderer/components/Layout.tsx` — sidebar nav (Profiles · Settings) + main content area
- `src/renderer/pages/ProfileList.tsx` — empty placeholder "Profile List"
- `src/renderer/pages/ProfileEditor.tsx` — empty placeholder "Profile Editor"
- `src/renderer/pages/Settings.tsx` — empty placeholder "Settings"

Verify:
- [ ] Navigating to each route shows correct placeholder
- [ ] Layout renders sidebar and content area
- [ ] No console errors

---

### D2 · ProfileCard component `[ ]`
**Goal:** Visual card for a single profile — name, desktop/app count, last launched, action buttons.

Files created:
- `src/renderer/components/ProfileCard.tsx`
  - Props: `profile: Profile`, `onEdit()`, `onDuplicate()`, `onDelete()`, `onLaunch()`
  - Shows: name, `N desktops · M apps`, last launched time (or "Never")
  - Buttons: Edit · Duplicate · Delete · Launch (Launch disabled/greyed for now)
  - Delete shows inline confirm ("Delete?" with Yes/No) — no separate modal

Verify:
- [ ] Renders correctly with a mock profile
- [ ] All 4 buttons visible
- [ ] Delete confirm shows/hides correctly
- [ ] Launch button is visually disabled

---

### D3 · Profile list page wired `[ ]`
**Goal:** ProfileList page loads real profiles from IPC and renders ProfileCards.

Files modified:
- `src/renderer/pages/ProfileList.tsx`
  - Calls `ipc.profiles.getAll()` on mount
  - Renders `ProfileCard` for each
  - Empty state: "No profiles yet. Create your first one." with a "+ New Profile" button
  - "+ New Profile" navigates to `/profile/new`
  - Edit/Duplicate/Delete wired to IPC calls

Verify:
- [ ] Page loads and shows existing profiles from disk
- [ ] Empty state shown when no profiles exist
- [ ] Delete a profile → card disappears from list
- [ ] Duplicate a profile → new card appears

---

## Group E — Profile Editor UI

### E1 · PositionPicker component `[ ]`
**Goal:** Standalone component for selecting a window position preset.

Files created:
- `src/renderer/components/PositionPicker.tsx`
  - Props: `value: Position`, `onChange(p: Position) => void`
  - Renders 3×3 grid (TL, TC, TR, ML, C, MR, BL, BC, BR) — each cell clickable
  - Below grid: `[Left ½]` `[Right ½]` `[Full screen]` buttons
  - Selected preset highlighted

Verify:
- [ ] Clicking each cell calls `onChange` with correct Position value
- [ ] Selected cell is visually highlighted
- [ ] All 10 presets selectable (9 grid + left-half + right-half + full = actually 12 total including the 3 buttons)

---

### E2 · IDE app entry form `[ ]`
**Goal:** Form for configuring an IDE-type app entry.

Files created:
- `src/renderer/components/forms/IdeForm.tsx`
  - Props: `value: IdeEntry`, `onChange(v: IdeEntry) => void`, `errors: FormErrors`
  - Fields: folder path (text input + Browse button using `window.api.invoke('dialog:openFolder')`)
  - Shows detected VS Code path below (read from settings, or "Not configured — set in Settings")

Files modified:
- `src/main/ipc/dialog.ipc.ts` (new) — `dialog:openFolder` and `dialog:openFile` handlers using `dialog.showOpenDialog`

Verify:
- [ ] Browse button opens folder picker
- [ ] Selected path populates input
- [ ] Empty path shows validation error

---

### E3 · Browser app entry form `[ ]`
**Goal:** Form for browser-type app entries (local port or full URL).

Files created:
- `src/renderer/components/forms/BrowserForm.tsx`
  - Mode toggle: "Local project" / "Website"
  - Local: port number input → preview shows `http://localhost:{port}`
  - Website: URL text input with basic URL validation
  - Both modes include `PositionPicker` + delay input

Verify:
- [ ] Toggle switches between local/website modes
- [ ] Port 5173 → preview shows `http://localhost:5173`
- [ ] Invalid URL shows error
- [ ] Non-numeric port shows error

---

### E4 · Terminal app entry form `[ ]`
**Goal:** Form for terminal-type entries (run command or execute script file).

Files created:
- `src/renderer/components/forms/TerminalForm.tsx`
  - Mode toggle: "Command" / "Script file"
  - Command mode: working dir (browse) + command text input
  - Script mode: file picker filtered to `.bat`, `.sh`, `.ps1`
  - Both include `PositionPicker` + delay input

Verify:
- [ ] Toggle switches between modes
- [ ] Browse works for both working dir and script file
- [ ] Empty command field shows validation error

---

### E5 · Generic app entry form `[ ]`
**Goal:** Form for any `.exe` app entry.

Files created:
- `src/renderer/components/forms/AppForm.tsx`
  - Exe path input + Browse (filtered to `.exe`)
  - Optional args input
  - `PositionPicker` + delay input

Verify:
- [ ] Browse opens file picker filtered to .exe
- [ ] Non-.exe path shows warning (not hard error — some apps have unusual extensions)
- [ ] Args field accepts any text

---

### E6 · App entry modal `[ ]`
**Goal:** Modal that combines type selection + the correct form.

Files created:
- `src/renderer/components/AppEntryModal.tsx`
  - Step 1: 4 type tiles (IDE / Browser / Terminal / App)
  - Step 2: Renders the matching form (IdeForm, BrowserForm, TerminalForm, AppForm)
  - Step 2 includes `PositionPicker` and delay input at bottom of every form
  - "Back" returns to type selection
  - "Add" / "Save" validates with zod, calls `onSave(entry)`, closes modal
  - "Cancel" closes without saving

Verify:
- [ ] All 4 type tiles navigate to correct form
- [ ] Back button returns to type selection
- [ ] Saving with invalid data shows field errors, does not close
- [ ] Saving valid entry calls onSave with correct typed object

---

### E7 · DesktopCard component `[ ]`
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

### E8 · Profile editor page wired `[ ]`
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

### F1 · PowerShell utility `[ ]`
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

### F2 · VirtualDesktopManager `[ ]`
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

### F3 · WindowPositioner `[ ]`
**Goal:** Find a window by PID/title and move/resize it to a position preset.

Files created:
- `src/main/platform/windows/WindowPositioner.ts`
  - `getWorkArea(): Promise<{ x, y, width, height }>` — screen minus taskbar
  - `resolvePreset(position: Position, workArea): { x, y, width, height }` — pure function
  - `positionWindow(hwnd: number, position: Position): Promise<void>`
  - `findWindowByPid(pid: number, timeoutMs: number): Promise<number | null>` — polls until window appears or timeout
  - Uses `node-window-manager`

Verify:
- [ ] Open Notepad manually, get its hwnd, call `positionWindow(hwnd, 'top-left')` → window moves to top-left quarter
- [ ] `resolvePreset('full', workArea)` returns full screen dimensions
- [ ] `findWindowByPid(pid, 5000)` finds a just-launched process window within timeout

---

### F4 · AppLauncher — IDE `[ ]`
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

### F5 · AppLauncher — Browser `[ ]`
**Goal:** Launch Chrome/Edge to a URL or local port.

Files modified:
- `src/main/platform/windows/AppLauncher.ts`
  - `launchBrowser(entry: BrowserEntry, browserPath: string): Promise<LaunchResult>`
  - Resolves URL from entry (local: `http://localhost:{port}`, website: entry.url)
  - Spawns `chrome --new-window <url>`
  - Waits for browser window

Verify:
- [ ] `launchBrowser` with port 3000 opens Chrome to `http://localhost:3000`
- [ ] `launchBrowser` with a website URL opens that URL
- [ ] Missing Chrome path → `{ success: false, error: 'Browser not found...' }`

---

### F6 · AppLauncher — Terminal `[ ]`
**Goal:** Launch Windows Terminal with a command or execute a script file.

Files modified:
- `src/main/platform/windows/AppLauncher.ts`
  - `launchTerminal(entry: TerminalEntry): Promise<LaunchResult>`
  - Command mode: `wt -d <workingDir> cmd /k <command>`
  - Script mode: `cmd /c <scriptPath>`
  - Waits for terminal window

Verify:
- [ ] Command mode: Windows Terminal opens and runs the command
- [ ] Script mode: `.bat` file executes
- [ ] Invalid script path → `{ success: false, error: '...' }`

---

### F7 · AppLauncher — Generic App `[ ]`
**Goal:** Launch any `.exe` with optional args.

Files modified:
- `src/main/platform/windows/AppLauncher.ts`
  - `launchApp(entry: AppEntry): Promise<LaunchResult>`
  - Spawns `path args...`
  - Waits for window

Verify:
- [ ] Launches `notepad.exe` successfully
- [ ] Passes args correctly
- [ ] Nonexistent path → `{ success: false, error: '...' }`

---

### F8 · IPlatform interface `[ ]`
**Goal:** Define the OS abstraction interface and wire the Windows implementations to it.

Files created:
- `src/main/platform/IPlatform.ts` — interface with all methods from VirtualDesktopManager, AppLauncher, WindowPositioner
- `src/main/platform/windows/index.ts` — `WindowsPlatform` class implementing `IPlatform`
- `src/main/platform/index.ts` — exports `getPlatform(): IPlatform` (returns WindowsPlatform on win32)

Verify:
- [ ] `getPlatform()` returns an object satisfying `IPlatform`
- [ ] All methods callable through the interface
- [ ] `tsc --noEmit` passes with no interface mismatches

---

### F9 · LaunchEngine `[ ]`
**Goal:** Orchestrate a full profile launch — desktops, apps in order, progress events.

Files created:
- `src/main/services/LaunchEngine.ts`
  - `launch(profile: Profile, onProgress: (e: LaunchProgressEvent) => void): Promise<LaunchReport>`
  - `cancel()` — sets abort flag, stops remaining launches
  - Steps per app: emit progress → launch → find window → position window → move to desktop → wait delayMs
  - One app failing does not stop the rest — logged and included in report
  - Returns `LaunchReport`: `{ success, results: Array<{ appId, ok, error? }> }`

Verify:
- [ ] Launch a profile with 2 desktops and 3 apps — all open in correct desktops and positions
- [ ] One app with an invalid path → that app fails, others still launch
- [ ] `cancel()` mid-launch → already-launched apps stay open, rest stops

---

### F10 · Launch IPC + progress events `[ ]`
**Goal:** Wire LaunchEngine to IPC so renderer can trigger launch and receive progress.

Files created:
- `src/main/ipc/launch.ipc.ts`
  - `launch:start` handler — starts LaunchEngine, sends progress via `win.webContents.send('launch:progress', event)`
  - `launch:cancel` handler — calls `engine.cancel()`

Files modified:
- `src/renderer/ipc/client.ts` — add `launch.start(profileId)`, `launch.cancel()`, `launch.onProgress(cb)`

Verify:
- [ ] Calling `launch:start` from renderer DevTools triggers a real launch
- [ ] Progress events arrive in renderer (visible in console)
- [ ] `launch:cancel` stops the launch

---

### F11 · Launch progress modal `[ ]`
**Goal:** UI that shows real-time launch progress.

Files created:
- `src/renderer/components/LaunchProgressModal.tsx`
  - Shows profile name + animated progress bar
  - Lists each app: spinner (launching) / checkmark (done) / X (failed)
  - Failed items show error string inline
  - "Cancel" button
  - Auto-closes 2s after full completion

Files modified:
- `src/renderer/pages/ProfileList.tsx` — Launch button triggers modal
- `src/renderer/pages/ProfileEditor.tsx` — "Save + Launch" triggers modal

Verify:
- [ ] Launch from ProfileList → modal appears, updates in real time
- [ ] Failed app shown with X and error message
- [ ] Cancel mid-launch → modal closes, remaining apps don't open
- [ ] Success → modal auto-closes after 2s

---

### F12 · Enable tray launch `[ ]`
**Goal:** Tray menu profile items now actually launch profiles.

Files modified:
- `src/main/tray.ts`
  - Profile menu items call `LaunchEngine.launch(profile)`
  - Show a native OS notification on launch complete/failed

Verify:
- [ ] Right-click tray → profile name → profile launches
- [ ] OS notification appears on completion

---

## Group G — Snapshot Mode

### G1 · SnapshotDetector `[ ]`
**Goal:** Enumerate all user-visible windows with process metadata and virtual desktop index.

Files created:
- `src/main/platform/windows/SnapshotDetector.ts`
  - `getWindows(): Promise<WindowInfo[]>`
  - For each visible, non-system window: hwnd, pid, title, exePath, workingDir, desktopIndex, bounds
  - Filters out: system windows, DeskFlow itself, taskbar, tray
  - One unreadable window → logged + skipped, rest continue

Verify:
- [ ] Call `getWindows()` with VS Code + Chrome open → both appear in results
- [ ] `exePath` and `workingDir` populated correctly
- [ ] `desktopIndex` matches which virtual desktop the window is on
- [ ] DeskFlow's own window not in results

---

### G2 · SnapshotService `[ ]`
**Goal:** Transform raw WindowInfo list into a draft Profile.

Files created:
- `src/main/services/SnapshotService.ts`
  - `buildDraft(windows: WindowInfo[]): ProfileDraft`
  - Groups windows by desktopIndex → each group = one Desktop
  - Per window: heuristic detection of type (VS Code → ide, Chrome → browser, wt → terminal, else → app)
  - Bounds → nearest Position preset (smallest Manhattan distance to preset center)
  - Returns `ProfileDraft` (same shape as `Profile` but with `id: ''` and `name: ''`)

Verify:
- [ ] VS Code window → detected as `ide` with correct folder
- [ ] Chrome window → detected as `browser`
- [ ] Unknown app → detected as `app` with exe path
- [ ] Window in top-left quarter → maps to `top-left` preset

---

### G3 · Snapshot IPC + tray trigger `[ ]`
**Goal:** Wire snapshot to IPC and tray menu.

Files created:
- `src/main/ipc/snapshot.ipc.ts`
  - `snapshot:capture` handler — calls `SnapshotDetector.getWindows()` → `SnapshotService.buildDraft()` → returns draft

Files modified:
- `src/main/tray.ts` — add "Snapshot current desktop..." menu item → calls snapshot IPC → opens main window
- `src/renderer/ipc/client.ts` — add `snapshot.capture()`

Verify:
- [ ] `snapshot:capture` IPC call returns a populated ProfileDraft
- [ ] Tray menu item triggers snapshot and opens main window

---

### G4 · Snapshot review page `[ ]`
**Goal:** UI to review and correct detected entries before saving as a profile.

Files created:
- `src/renderer/pages/SnapshotReview.tsx`
  - Receives `ProfileDraft` via navigation state
  - Lists detected desktops and apps
  - Each app row: editable type, name, position
  - Unknown/ambiguous entries highlighted in yellow
  - Name input at top
  - "Save as Profile" → `ipc.profiles.save()` → navigate to `/`
  - "Cancel" → back to ProfileList

Verify:
- [ ] All detected apps shown correctly
- [ ] Can change an entry's type from the review screen
- [ ] Saving navigates to profile list with new profile present
- [ ] Profile is launch-ready (launch it after saving)

---

## Group H — Settings

### H1 · Settings storage `[ ]`
**Goal:** Settings read/write service with auto-detection of VS Code and Chrome paths.

Files created:
- `src/main/services/SettingsManager.ts`
  - `get(): Promise<Settings>`
  - `save(s: Partial<Settings>): Promise<Settings>` — merges with defaults
  - `detectIdePath(): Promise<string | null>` — checks registry + common paths
  - `detectBrowserPath(): Promise<string | null>` — same
  - Stored in `%APPDATA%\DeskFlow\settings.json`
  - Zod schema validation on read — fall back to defaults if invalid
- `src/main/ipc/settings.ipc.ts` — `settings:get` and `settings:save` handlers

Verify:
- [ ] First launch → settings file created with defaults
- [ ] `detectIdePath()` finds VS Code if installed
- [ ] Save partial settings → merges, doesn't overwrite unrelated keys

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

## Backlog (v2+)

| Feature | Notes |
|---------|-------|
| Multi-monitor support | Assign apps to specific monitor |
| Import / Export profiles | `.deskflow` portable file |
| Global hotkeys | `globalShortcut` Electron API |
| App Groups | Reusable sets of apps |
| Auto-update | `electron-updater` |
| Mac / Linux port | Needs `platform/mac/` + `platform/linux/` |
| Profile Hub | Community-shared profiles |
| `winget install deskflow` | Submit to winget |

---

*Last updated: Phase 0 (planning). Each phase marked [DONE] by the implementing agent after verification.*
