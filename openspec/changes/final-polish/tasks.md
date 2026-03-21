## 1. Dark Mode — Modals

- [ ] 1.1 Add dark: classes to AppEntryModal.tsx (modal bg, header, footer, type tiles, borders, text)
- [ ] 1.2 Add dark: classes to LaunchProgressModal.tsx (modal bg, progress bar, status text, borders)

## 2. Dark Mode — Cards & Rows

- [ ] 2.1 Add dark: classes to DesktopCard.tsx (card bg, header, borders, inline name input, buttons)
- [ ] 2.2 Add dark: classes to AppEntryRow.tsx (row bg, text, badges, drag handle, buttons)
- [ ] 2.3 Add dark: classes to ErrorToast.tsx (toast bg, text, dismiss button)
- [ ] 2.4 Add dark: classes to UpdateBanner.tsx (banner bg, text, buttons)

## 3. Dark Mode — Forms & Pickers

- [ ] 3.1 Add dark: classes to PositionPicker.tsx (grid cells, selected state, preset buttons)
- [ ] 3.2 Add dark: classes to IdeForm.tsx (inputs, labels, browse button)
- [ ] 3.3 Add dark: classes to BrowserForm.tsx (inputs, labels, mode toggle, URL preview)
- [ ] 3.4 Add dark: classes to TerminalForm.tsx (inputs, labels, mode toggle)
- [ ] 3.5 Add dark: classes to AppForm.tsx (inputs, labels, warning text)

## 4. Dark Mode — Settings Page

- [ ] 4.1 Add dark: classes to Settings.tsx (section borders, all labels, descriptions, inputs, select, checkboxes, slider)

## 5. README Correction

- [ ] 5.1 Replace node-window-manager in architecture ASCII diagram with PowerShell Win32 P/Invoke
- [ ] 5.2 Update tech stack table row for window management
- [ ] 5.3 Update Windows integrations table rows for window resize/position and snapshot detection
- [ ] 5.4 Remove node-window-manager from development phases section if referenced

## 6. Dependency Cleanup

- [ ] 6.1 Remove @cj-ways/orgclone from package.json dependencies
- [ ] 6.2 Run npm install to update package-lock.json

## 7. Final Verification

- [ ] 7.1 `tsc --noEmit` passes
- [ ] 7.2 `npm run lint` passes
- [ ] 7.3 Manual: dark mode renders all components correctly
