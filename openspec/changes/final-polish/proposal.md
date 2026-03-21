## Why

Post-v1.0.0 audit found 3 remaining rough edges: dark mode was wired in K3 but only ~5 of ~17 renderer components have `dark:` classes (modals, forms, cards render as white boxes in dark mode), the README still references `node-window-manager` which was never used (replaced by PowerShell P/Invoke), and an unused `@cj-ways/orgclone` dependency inflates the install. These are the last items before the codebase matches what it advertises.

## What Changes

- **Dark mode completion**: Add `dark:` Tailwind classes to all remaining renderer components — AppEntryModal, AppEntryRow, DesktopCard, ErrorToast, LaunchProgressModal, PositionPicker, UpdateBanner, and all 4 form components (IdeForm, BrowserForm, TerminalForm, AppForm). Also Settings page section borders/labels/inputs.
- **README correction**: Replace 5 `node-window-manager` references with accurate PowerShell Win32 P/Invoke description. Update architecture diagram and tech stack table.
- **Remove unused dependency**: Remove `@cj-ways/orgclone` from package.json.

## Capabilities

### New Capabilities
- `dark-mode-completion`: Add dark: classes to all remaining renderer components for full dark mode coverage
- `readme-accuracy`: Update README to reflect actual implementation (PowerShell, not node-window-manager)
- `dependency-cleanup`: Remove unused @cj-ways/orgclone package

### Modified Capabilities

## Impact

- **Renderer components** (12 files): CSS class additions only — no logic changes
- **README.md**: Text updates to architecture diagram, tech stack table, and Windows integrations table
- **package.json + package-lock.json**: Remove one unused dependency
- **Zero risk**: No behavioral changes, only visual (dark mode) and documentation fixes
