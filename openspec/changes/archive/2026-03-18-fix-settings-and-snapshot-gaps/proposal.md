## Why

Deep audit of v1.0.0 revealed 4 features where the UI and persistence layer work correctly, but the actual system integration is missing. Users can toggle "Start with Windows," change the theme, and adjust "Minimize to tray" — but none of these settings take effect. The Snapshot Review page shows detected windows but doesn't let users edit entries before saving, contrary to the original spec. These are the last gaps between what the product promises and what it delivers.

## What Changes

- **Start with Windows**: Wire the `startWithWindows` setting to `app.setLoginItemSettings()` so toggling it actually registers/unregisters DeskFlow as a Windows login item.
- **Minimize to Tray**: Make the close handler in `index.ts` read `minimizeToTray` from settings — when disabled, closing the window should quit the app instead of hiding to tray.
- **Theme Application**: Apply the `theme` setting via Electron's `nativeTheme.themeSource` and add Tailwind dark mode classes so the UI actually changes appearance.
- **Snapshot Editing**: Add edit/delete capabilities to the Snapshot Review page so users can correct detected entries before saving as a profile.

## Capabilities

### New Capabilities
- `start-with-windows`: Wire settings toggle to Electron's login item API
- `minimize-to-tray`: Make close behavior respect the minimize-to-tray setting
- `theme-application`: Apply saved theme preference to Electron nativeTheme + Tailwind dark mode
- `snapshot-editing`: Allow editing and deleting detected app entries on the Snapshot Review page

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Main process** (`src/main/index.ts`): Close handler needs to read settings; login item registration on settings save
- **Settings IPC** (`src/main/ipc/settings.ipc.ts`): Apply side effects (login item, nativeTheme) when saving
- **Renderer** (`src/renderer/pages/SnapshotReview.tsx`): Add edit/delete UI using existing AppEntryModal component
- **Renderer styles** (`src/renderer/styles.css`, `src/renderer/App.tsx`): Tailwind dark mode configuration
- **Dependencies**: None new — all functionality uses existing Electron APIs and existing UI components
