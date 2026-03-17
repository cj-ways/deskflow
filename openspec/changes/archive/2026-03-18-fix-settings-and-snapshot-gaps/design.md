## Context

DeskFlow v1.0.0 has 4 settings/features where the UI persists values to `settings.json` but the underlying system integration was never wired up. The Snapshot Review page also lacks editing capability. All necessary infrastructure already exists — types, IPC channels, persistence, UI components — so these are targeted wiring fixes, not new features.

Current state:
- `Settings.theme` is saved but `nativeTheme.themeSource` is never set
- `Settings.startWithWindows` is saved but `app.setLoginItemSettings()` is never called
- `Settings.minimizeToTray` is saved but the close handler always hides regardless
- `SnapshotReview.tsx` renders detected entries read-only with no edit/delete controls

## Goals / Non-Goals

**Goals:**
- Make all 3 settings toggles actually control the behavior they describe
- Enable users to edit and delete detected app entries on the Snapshot Review page before saving
- Zero new dependencies — use existing Electron APIs and existing UI components

**Non-Goals:**
- Dark mode styling for every component (just wire nativeTheme + Tailwind dark: prefix — full dark mode polish is a separate effort)
- Editing desktop names or reordering desktops in snapshot review (keep it simple — users can do that after saving via the profile editor)
- Terminal auto-detect (no standard install location for Windows Terminal)

## Decisions

### 1. Apply settings side-effects in SettingsManager.save(), not in IPC handler

**Decision**: Add an `applySideEffects(settings)` function called from `SettingsManager.save()` that handles `setLoginItemSettings()` and `nativeTheme.themeSource`.

**Rationale**: Settings are saved from multiple places (IPC handler, first-launch defaults). Putting side effects in the save path ensures they always apply. Also applies on startup via `SettingsManager.get()` for theme.

**Alternative considered**: Applying in the IPC handler only — rejected because it misses startup and CLI paths.

### 2. Close handler reads settings synchronously via a cached value

**Decision**: Cache `minimizeToTray` in a module-level variable in `index.ts`, updated whenever settings are saved. The close handler reads this variable instead of doing an async settings read.

**Rationale**: The `close` event handler is synchronous (`e.preventDefault()` must be called synchronously). Reading from disk in the handler would require making it async, which doesn't work with Electron's close event model.

**Alternative considered**: Always reading from `SettingsManager.get()` — rejected because async in a synchronous event handler is unreliable.

### 3. Theme via nativeTheme.themeSource + Tailwind dark: variant

**Decision**: Set `nativeTheme.themeSource` in the main process (controls window chrome, system dialogs). Expose the effective theme to the renderer via IPC or nativeTheme events, and toggle a `dark` class on `<html>` for Tailwind's `dark:` variant.

**Rationale**: nativeTheme handles OS-level integration (title bar, dialogs). Tailwind `dark:` handles CSS. Together they cover the full UI.

### 4. Snapshot editing reuses existing AppEntryModal

**Decision**: Add Edit and Delete buttons to each app row in `SnapshotReview.tsx`. Edit opens the existing `AppEntryModal` in edit mode. Delete removes the entry from the draft state.

**Rationale**: `AppEntryModal` already handles all 4 app types with validation. No point building a separate editing UI.

## Risks / Trade-offs

- **[Risk] Dark mode polish** → Mitigation: This change wires up the infrastructure (nativeTheme + dark class toggle). Individual component styling with `dark:` variants is minimal for now — full polish is a follow-up.
- **[Risk] Cached minimizeToTray could be stale** → Mitigation: The cache is updated on every settings save, and the setting rarely changes. The close handler only needs a boolean, not the full settings object.
- **[Risk] setLoginItemSettings behavior varies across installed vs portable** → Mitigation: Only call it when `app.isPackaged` is true, since login items don't make sense in dev mode.
