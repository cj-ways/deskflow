## 1. Start with Windows

- [x] 1.1 Add `applySideEffects(settings)` function in `src/main/services/SettingsManager.ts` that calls `app.setLoginItemSettings({ openAtLogin: settings.startWithWindows })` when `app.isPackaged` is true
- [x] 1.2 Call `applySideEffects()` at the end of `SettingsManager.save()` and after `SettingsManager.get()` on startup
- [ ] 1.3 Verify: toggle Start with Windows ON → save → check Task Manager Startup tab shows DeskFlow

## 2. Minimize to Tray

- [x] 2.1 Add a module-level `let cachedMinimizeToTray = true` variable in `src/main/index.ts`
- [x] 2.2 After loading settings on startup (`SettingsManager.get()`), set `cachedMinimizeToTray` from the loaded settings
- [x] 2.3 Export a `updateMinimizeToTray(value: boolean)` function from `index.ts` and call it from `SettingsManager.save()` (or from settings IPC handler after save)
- [x] 2.4 Modify the `mainWindow.on('close')` handler: if `cachedMinimizeToTray` is false and `!isQuitting`, call `quitApp()` instead of `mainWindow.hide()`
- [ ] 2.5 Verify: set minimizeToTray OFF → save → close window → app quits entirely. Set ON → close → app hides to tray.

## 3. Theme Application

- [ ] 3.1 In `applySideEffects()` (SettingsManager), set `nativeTheme.themeSource = settings.theme`
- [ ] 3.2 Add a new IPC channel `THEME_GET_DARK` in `ipc-channels.ts` that returns `nativeTheme.shouldUseDarkColors` boolean
- [ ] 3.3 Add a new IPC push event `THEME_CHANGED` in `ipc-channels.ts` that fires when dark mode changes
- [ ] 3.4 Register a `nativeTheme.on('updated')` listener in main process that sends `THEME_CHANGED` with `nativeTheme.shouldUseDarkColors` to all renderer windows
- [ ] 3.5 Add `ipc.theme.isDark()` and `ipc.theme.onChanged()` / `ipc.theme.offChanged()` wrappers in `src/renderer/ipc/client.ts`
- [ ] 3.6 In `Layout.tsx` (or `App.tsx`), query `ipc.theme.isDark()` on mount and listen for `THEME_CHANGED` — toggle `document.documentElement.classList.toggle('dark', isDark)`
- [ ] 3.7 Configure Tailwind v4 dark mode: add `@variant dark (&:where(.dark, .dark *));` to `styles.css`
- [ ] 3.8 Add basic `dark:` classes to key layout elements: sidebar (`dark:bg-gray-900`), main content (`dark:bg-gray-800 dark:text-gray-100`), cards (`dark:bg-gray-700 dark:border-gray-600`)
- [ ] 3.9 Verify: switch to Dark → UI background/text changes. Switch to System → follows OS. Switch to Light → always light.

## 4. Snapshot Editing

- [ ] 4.1 Add local state management to `SnapshotReview.tsx`: convert `draft` from read-only location state to `useState` initialized from location state
- [ ] 4.2 Add Edit and Delete buttons to each app row in the snapshot review
- [ ] 4.3 Wire Edit button to open `AppEntryModal` in edit mode (pass entry as `initial` prop) — on save, update the entry in the draft state
- [ ] 4.4 Wire Delete button to remove the entry from the draft desktop's apps array and update state
- [ ] 4.5 Update the "apps detected" counter in the header to recompute from current draft state
- [ ] 4.6 Verify: snapshot → edit an entry (change position) → save profile → launch → app opens in new position. Delete an entry → save → launch → deleted app is not opened.

## 5. Final Verification

- [ ] 5.1 `tsc --noEmit` passes with zero errors
- [ ] 5.2 `npm run lint` passes with zero warnings
- [ ] 5.3 Manual smoke test: all 4 fixes working end-to-end
