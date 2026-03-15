# DeskFlow

> **One click. Full context. Every time.**
>
> An open-source Windows desktop session manager. Define workspace profiles — apps, positions, terminals, browsers — and restore your entire environment instantly.

---

## The Problem

Every morning: open VS Code for project A, start the backend, open Chrome on the right side, move the terminal to the bottom, switch to a second virtual desktop, open VS Code for project B, start *that* backend, open *that* Chrome... Ten minutes before a line of code is written.

It's not hard. It's just wasteful, repeated every single day.

**DeskFlow eliminates it.**

---

## What DeskFlow Does

You build a **Workspace Profile** once — a named collection of virtual desktops, each with its own set of apps, positions, and startup commands.

Click **Launch**. DeskFlow creates your virtual desktops, opens every app, runs every command, and positions every window — in the right place, in the right order, automatically.

Or use **Snapshot** — set up your desktop manually, click Snapshot, and DeskFlow generates the profile for you.

---

## Who It's For

- **Developers** who switch between multiple active projects daily
- **Designers and PMs** who want to go from zero to full work context instantly
- **Anyone** who uses Windows virtual desktops and is tired of rebuilding them every morning
- **Teams** sharing a common project setup (export/import profiles as `.deskflow` files)

---

## Features

### v1 — Core (MVP)

| Feature | Description |
|---------|-------------|
| **Profile Manager** | Create, edit, delete, duplicate named workspace profiles |
| **Desktop Builder** | Add multiple virtual desktops per profile, each with its own apps |
| **App Entry Types** | IDE, Browser, Terminal, Script, App — each with type-specific settings |
| **Position Presets** | Snap windows to named positions: top-left, top-right, bottom-left, bottom-right, left half, right half, full screen |
| **Launch Profile** | One click: creates virtual desktops, opens apps, runs commands, positions windows |
| **Snapshot Mode** | Detect what's running on your screen and auto-generate a profile from it |
| **System Tray** | Lives silently in tray; right-click to launch any profile instantly |
| **CLI Mode** | `deskflow launch "profile-name"` from any terminal |
| **Startup Option** | Optionally start DeskFlow with Windows |
| **Profile Storage** | Profiles saved as human-readable JSON in `%APPDATA%\DeskFlow\profiles\` |
| **Windows Installer** | Standard `.exe` NSIS installer via electron-builder |

### v2 — Power Layer

| Feature | Description |
|---------|-------------|
| **Import / Export** | Share profiles as `.deskflow` files with teammates or across machines |
| **Multi-monitor support** | Assign apps to specific monitors |
| **App Groups** | Reusable groups of apps (e.g., "Backend + Frontend") attached to any profile |
| **Global Hotkeys** | Launch or switch profiles without touching the mouse |
| **Partial Launch** | Launch only selected desktops within a profile |
| **Conditional Launch** | Skip if already running, or close existing instance first |
| **Auto-update** | In-app updates via electron-updater |

### v3 — Ecosystem

| Feature | Description |
|---------|-------------|
| **Profile Hub** | Community-shared profiles (e.g., "Full-Stack Dev", "Design Sprint") |
| **Team Sync** | Sync profiles via a shared folder or Git repo |
| **Mac / Linux port** | Platform abstraction enables a port once Windows is solid |
| **`winget install deskflow`** | Windows Package Manager distribution |

---

## App Entry Types

When adding an app to a desktop, you choose a **type**. Each type has tailored settings — no raw config required.

### IDE
Opens your code editor to a project folder.
```
Type:    IDE
Folder:  C:\Users\user\Desktop\playtime\playtime-backend
Editor:  VS Code  (configured once in Settings)
```

### Browser
Opens Chrome (or configured browser) to a URL or local development port.
```
Type:    Browser
Mode:    Local project
Port:    5173          →  DeskFlow opens localhost:5173
```
or
```
Type:    Browser
Mode:    Website
URL:     https://notion.so
```

### Terminal
Runs a command, or executes an existing `.bat` / `.sh` / `.ps1` script.
```
Type:      Terminal
Mode:      Script file
Script:    C:\projects\georgian-leads\start.bat
```
or
```
Type:      Terminal
Mode:      Command
Dir:       C:\projects\playtime\playtime-backend
Command:   pnpm start
```

### App
Any `.exe` with optional arguments — for apps that don't fit the above (TeamViewer, Figma, Slack, etc).
```
Type:    App
Path:    C:\Program Files\TeamViewer\TeamViewer.exe
Args:    (empty)
```

---

## UI/UX

### Main Window — Profile List

```
┌─────────────────────────────────────────────────────────┐
│  DeskFlow                                    [─][□][×]  │
├──────────────┬──────────────────────────────────────────┤
│  Profiles    │                                          │
│  ──────────  │  ┌──────────────────────────────────┐   │
│  + New       │  │  Playtime                        │   │
│              │  │  3 desktops  ·  6 apps           │   │
│  ▶ Playtime  │  │  Last launched: today 9:14am     │   │
│    Georgian  │  │           [Snapshot]  [Launch ▶] │   │
│    eBay      │  └──────────────────────────────────┘   │
│    Personal  │                                          │
│              │  ┌──────────────────────────────────┐   │
│  ──────────  │  │  Georgian Leads                  │   │
│  ⚙ Settings  │  │  2 desktops  ·  4 apps           │   │
│              │  │           [Snapshot]  [Launch ▶] │   │
│              │  └──────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────┘
```

### Profile Editor — Desktop Builder

```
┌─────────────────────────────────────────────────────────┐
│  ← Back   Edit: Playtime                    [Save]      │
├─────────────────────────────────────────────────────────┤
│  Name: [Playtime                          ]             │
│                                                         │
│  Desktops                              [+ Add Desktop]  │
│                                                         │
│  ┌───────────────────┐  ┌───────────────────┐          │
│  │  Desktop 1        │  │  Desktop 2        │          │
│  │  "Dev"            │  │  "Tools"          │          │
│  │  ───────────────  │  │  ───────────────  │          │
│  │  💻 playtime-back │  │  🖥  TeamViewer   │          │
│  │     IDE · TL      │  │     App · Full    │          │
│  │  💻 playtime-port │  │                   │          │
│  │     IDE · TR      │  │  [+ Add App]      │          │
│  │  >_ pnpm start    │  │                   │          │
│  │     Terminal · BL │  └───────────────────┘          │
│  │  🌐 :3001         │                                  │
│  │     Browser · BR  │  [+ Add Desktop]                 │
│  │  [+ Add App]      │                                  │
│  └───────────────────┘                                  │
└─────────────────────────────────────────────────────────┘
```

### Add App — Type Selection

```
┌──────────────────────────────────────────┐
│  Add to Desktop 1                        │
│                                          │
│  What type of entry is this?             │
│                                          │
│  ┌──────┐  ┌─────────┐  ┌──────────┐    │
│  │  💻  │  │   🌐    │  │   >_     │    │
│  │ IDE  │  │ Browser │  │ Terminal │    │
│  └──────┘  └─────────┘  └──────────┘    │
│                                          │
│  ┌──────────────────────┐               │
│  │        App           │               │
│  │  (any .exe)          │               │
│  └──────────────────────┘               │
└──────────────────────────────────────────┘
```

### Add App — Browser Entry

```
┌──────────────────────────────────────────┐
│  🌐 Browser Entry                        │
│                                          │
│  Mode:  ○ Local project  ● Website       │
│                                          │
│  URL:   [https://notion.so          ]    │
│                                          │
│  Position:                               │
│  ┌────┬────┬────┐                        │
│  │ TL │ TC │ TR │  ← click to select    │
│  ├────┼────┼────┤     (TR highlighted)  │
│  │ ML │    │ MR │                        │
│  ├────┼────┼────┤                        │
│  │ BL │ BC │ BR │                        │
│  └────┴────┴────┘  [Left ½] [Right ½]   │
│                    [Full screen]         │
│                                          │
│            [Cancel]  [Add]               │
└──────────────────────────────────────────┘
```

### System Tray Menu

```
  DeskFlow
  ─────────────────
  Launch Profile ▶  Playtime
                    Georgian Leads
                    eBay Arbitrage
                    Personal
  ─────────────────
  Open DeskFlow...
  Settings
  ─────────────────
  Quit
```

### Launch Report (shown after launch)

```
┌──────────────────────────────────────────┐
│  Launching: Playtime          ████░░  4/6│
│                                          │
│  ✓  Desktop 1 created                   │
│  ✓  VS Code → playtime-backend           │
│  ✓  VS Code → playtime-portal            │
│  ⟳  Terminal: pnpm start...             │
│  ·  Browser: localhost:3001              │
│  ·  Desktop 2                           │
│                                          │
│                           [Cancel]       │
└──────────────────────────────────────────┘
```

---

## Data Model

Profiles live in `%APPDATA%\DeskFlow\profiles\` as `.json` files. Human-readable, version-control friendly.

```json
{
  "id": "playtime",
  "name": "Playtime",
  "createdAt": "2026-01-01T00:00:00Z",
  "desktops": [
    {
      "index": 0,
      "name": "Dev",
      "apps": [
        {
          "id": "vsc-backend",
          "type": "ide",
          "folder": "C:\\Users\\user\\Desktop\\playtime\\playtime-backend",
          "position": "top-left",
          "delayMs": 0
        },
        {
          "id": "vsc-portal",
          "type": "ide",
          "folder": "C:\\Users\\user\\Desktop\\playtime\\playtime-portal",
          "position": "top-right",
          "delayMs": 500
        },
        {
          "id": "term-backend",
          "type": "terminal",
          "mode": "command",
          "workingDir": "C:\\Users\\user\\Desktop\\playtime\\playtime-backend",
          "command": "pnpm start",
          "position": "bottom-left",
          "delayMs": 1000
        },
        {
          "id": "chrome-staff",
          "type": "browser",
          "mode": "local",
          "port": 3001,
          "position": "bottom-right",
          "delayMs": 5000
        }
      ]
    },
    {
      "index": 1,
      "name": "Tools",
      "apps": [
        {
          "id": "teamviewer",
          "type": "app",
          "path": "C:\\Program Files\\TeamViewer\\TeamViewer.exe",
          "args": [],
          "position": "full",
          "delayMs": 0
        }
      ]
    }
  ]
}
```

### Position Presets → Pixel Mapping

At launch time, presets are resolved against the actual screen work area (excluding taskbar):

| Preset | x | y | width | height |
|--------|---|---|-------|--------|
| `top-left` | 0 | 0 | W/2 | H/2 |
| `top-right` | W/2 | 0 | W/2 | H/2 |
| `bottom-left` | 0 | H/2 | W/2 | H/2 |
| `bottom-right` | W/2 | H/2 | W/2 | H/2 |
| `left-half` | 0 | 0 | W/2 | H |
| `right-half` | W/2 | 0 | W/2 | H |
| `full` | 0 | 0 | W | H |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Electron Renderer Process               │
│                  (React + TypeScript)                    │
│                                                          │
│   ProfileList → ProfileEditor → AppEntryForm             │
│   LaunchProgressModal → SnapshotReview                   │
│   SettingsPanel                                          │
└───────────────────────────┬──────────────────────────────┘
                            │  IPC (contextBridge)
┌───────────────────────────▼──────────────────────────────┐
│                   Electron Main Process                  │
│                   (Node.js + TypeScript)                 │
│                                                          │
│  ┌──────────────────┐  ┌────────────────────────────┐   │
│  │  ProfileManager  │  │       LaunchEngine         │   │
│  │  CRUD + storage  │  │  orchestrates launch seq.  │   │
│  │  %APPDATA% JSON  │  │  handles delays + retries  │   │
│  └──────────────────┘  └──────────────┬───────────┘    │
│                                        │                 │
│  ┌─────────────────────────────────────▼─────────────┐  │
│  │              platform/windows/                    │  │
│  │  VirtualDesktopManager   WindowPositioner         │  │
│  │  AppLauncher             SnapshotDetector         │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────┐  ┌──────────────────────────┐   │
│  │  SystemTray        │  │  CLI Handler             │   │
│  │  Electron Tray API │  │  argv parsing            │   │
│  └────────────────────┘  └──────────────────────────┘   │
└──────────────────────────────────────────────────────────┘

External dependencies:
  node-window-manager   → window resize/move/detect
  VirtualDesktopAccessor.dll  → virtual desktop management (via PowerShell)
  electron-builder      → NSIS .exe installer
  electron-updater      → auto-updates (v2)
```

The `platform/windows/` layer is the only OS-specific code — everything above it is platform-agnostic, enabling a future Mac/Linux port.

---

## Windows Integrations

| Need | Implementation |
|------|---------------|
| Create virtual desktops | PowerShell → `VirtualDesktopAccessor.dll` |
| Move windows to desktops | Same DLL via PowerShell child_process |
| Resize and position windows | `node-window-manager` npm package |
| Detect running windows (Snapshot) | `node-window-manager` getWindows() + process metadata |
| Launch any app | `child_process.spawn()` |
| Open URLs in browser | `child_process.spawn('chrome', ['--new-window', url])` |
| Run terminal commands | `wt` (Windows Terminal) CLI |
| Execute .bat/.sh scripts | `child_process.spawn()` |
| System tray | Electron built-in `Tray` + `Menu` API |
| Start with Windows | `app.setLoginItemSettings({ openAtLogin: true })` |

---

## CLI Usage

When installed, DeskFlow registers the `deskflow` command in PATH.

```bash
# Launch a profile by name
deskflow launch "Playtime"
deskflow launch "Georgian Leads"

# List available profiles
deskflow list

# Snapshot current screen into a new profile
deskflow snapshot "My New Profile"

# Open the DeskFlow UI
deskflow open
```

Useful for: terminal scripts, keyboard shortcut launchers, startup automation, or other tools calling into DeskFlow.

---

## Snapshot Mode

Snapshot lets you build a profile from reality instead of from scratch.

**Flow:**
1. Set up your desktop manually (open apps, arrange windows) the way you like it
2. Click **Snapshot** in DeskFlow (tray menu or UI)
3. DeskFlow scans all visible windows: what app, what position, which virtual desktop
4. Shows a **Snapshot Review** screen listing all detected entries
5. You name the profile, optionally edit any entry, then save

**Detection heuristics:**
- Groups windows by virtual desktop index
- Identifies app type by executable name (VS Code → IDE, Chrome → Browser, wt → Terminal)
- Reads working directory from process metadata to auto-fill IDE folder and terminal dir
- Records window position and maps it to the nearest preset

**Known limitation:** Two windows of the same app (e.g., two VS Code instances) are distinguished by working directory. If the working directory can't be read, user is asked to label them manually.

---

## Distribution

```
electron-builder (NSIS target)
  → DeskFlow-Setup-1.0.0.exe

Installer:
  ✓ Installs to C:\Program Files\DeskFlow\
  ✓ Adds Start Menu shortcut
  ✓ Optional Desktop shortcut
  ✓ Registers deskflow CLI in PATH
  ✓ Optional: start with Windows
  ✓ Includes uninstaller
```

**Release channels:**
- GitHub Releases (primary) — download `DeskFlow-Setup-x.x.x.exe`
- `winget install deskflow` (v2, once listed in winget repository)
- Microsoft Store MSIX (v3, optional)

**Code signing:**
- v1: unsigned (free, users may see SmartScreen warning — acceptable for open source)
- v2: EV certificate for clean installs (~$200-400/yr, or via GitHub's free code signing for open source via SignPath.io)

---

## Development Phases

### Phase 1 — Skeleton
- Electron + React + TypeScript + Tailwind project setup
- `electron-builder` configured, produces working `.exe`
- System tray with placeholder menu
- Profile CRUD: create/edit/delete stored as JSON in `%APPDATA%\DeskFlow\profiles\`
- Basic profile list UI

### Phase 2 — Launch Engine
- `platform/windows/VirtualDesktopManager` — create desktops via VirtualDesktopAccessor
- `platform/windows/AppLauncher` — spawn processes by type (IDE, Browser, Terminal, App)
- `platform/windows/WindowPositioner` — position windows via node-window-manager
- Sequential launch with configurable delays
- Launch progress modal

### Phase 3 — Profile Editor UI
- Desktop builder (visual desktop slots)
- App entry form with type-specific fields
- Position preset grid selector
- Profile editor fully functional

### Phase 4 — Snapshot Mode
- `platform/windows/SnapshotDetector` — enumerate windows with position + process metadata
- Snapshot Review screen — review and edit detected entries before saving
- CLI: `deskflow snapshot "Name"`

### Phase 5 — CLI + Polish
- Full CLI (`launch`, `list`, `snapshot`, `open`)
- Error handling + launch report (what succeeded / what failed)
- Settings panel (default editor, default browser, startup option)
- Keyboard navigation

### Phase 6 — Distribution
- GitHub repo setup (MIT license, README, issue templates)
- GitHub Actions: build + release workflow (auto-produce installer on tag)
- First public release: `v1.0.0`

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| UI | React 19 + TypeScript | AI (Claude) is most capable in TS/JS. Familiar stack for contributors. |
| Styling | Tailwind CSS 4 | Fast to build clean UI, no CSS overhead |
| Desktop wrapper | Electron | System tray, IPC, CLI registration, cross-platform potential |
| Packaging | electron-builder | NSIS installer, PATH registration, auto-update support |
| Window management | node-window-manager | npm package for window position/size/detection |
| Virtual desktops | VirtualDesktopAccessor.dll via PowerShell | Battle-tested community solution (same used by workmode.py) |
| Storage | JSON files in %APPDATA% | Human-readable, portable, no database needed |

---

## Contributing

DeskFlow is open source under the MIT license. Contributions welcome.

```
git clone https://github.com/[you]/deskflow
cd deskflow
npm install
npm run dev        # start in development mode
npm run build      # build installer to /dist
```

Platform-specific contributions (Mac, Linux) especially welcome once the `platform/windows/` layer is stable.

---

*DeskFlow — open source, built for developers, free forever.*
