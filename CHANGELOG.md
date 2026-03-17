# Changelog

All notable changes to DeskFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-17

### Added

- **Profile Manager** — create, edit, delete, and duplicate workspace profiles stored as JSON in `%APPDATA%\DeskFlow\profiles\`
- **Desktop Builder** — add multiple virtual desktops per profile, each with its own set of apps
- **App Entry Types** — IDE, Browser (local port or website), Terminal (command or script), and generic App (any .exe)
- **Position Presets** — snap windows to 12 positions: 3x3 grid, left/right half, and full screen
- **Launch Engine** — one-click profile launch: creates virtual desktops, opens apps, runs commands, positions windows with configurable delays
- **Launch Progress Modal** — real-time progress UI with per-app status, cancel support, and error display
- **Snapshot Mode** — detect running windows and auto-generate a profile from current desktop state
- **Snapshot Review** — review and edit detected entries before saving as a profile
- **System Tray** — tray icon with profile quick-launch, snapshot trigger, and quit
- **Settings** — configurable IDE, browser, and terminal paths with auto-detection; launch delay slider; theme selector (system/light/dark); start-with-Windows toggle
- **CLI** — `deskflow launch`, `deskflow list`, `deskflow snapshot`, `deskflow open`, `--help`, `--version`
- **Keyboard Shortcuts** — Ctrl+N (new profile), Ctrl+, (settings), Escape (close modals)
- **Error Handling** — toast notification system, inline error display, IPC error coverage
- **Auto-Updater** — in-app update checking and install via electron-updater
- **NSIS Installer** — branded wizard with custom welcome, summary, and finish pages; uninstaller with user data cleanup prompt
- **Platform Abstraction** — `IPlatform` interface enables future Mac/Linux ports without touching service logic
