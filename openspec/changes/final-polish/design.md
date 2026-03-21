## Context

K3 wired the full dark mode pipeline (nativeTheme + IPC + Tailwind @variant dark), but only added `dark:` classes to 5 high-level components (Layout, ProfileCard, ProfileEditor top bar, ProfileList header, Settings header, SnapshotReview). The remaining ~12 components — modals, forms, cards, toasts — still render with white backgrounds and light borders in dark mode. The README still references `node-window-manager` from the original spec, but the actual implementation uses PowerShell Win32 P/Invoke exclusively. One unused npm dependency remains.

## Goals / Non-Goals

**Goals:**
- Every renderer component is legible and consistent in dark mode
- README accurately describes the technology stack as built
- No unused production dependencies in package.json

**Non-Goals:**
- Pixel-perfect dark mode design (just consistent `dark:bg-gray-*` / `dark:text-gray-*` / `dark:border-gray-*`)
- Rewriting README content beyond the inaccurate references
- Auditing devDependencies

## Decisions

### 1. Dark mode class pattern

**Decision**: Use consistent Tailwind color palette for dark mode across all components:
- Backgrounds: `dark:bg-gray-800` for cards/modals, `dark:bg-gray-900` for page backgrounds, `dark:bg-gray-700` for hover states
- Text: `dark:text-gray-100` for primary, `dark:text-gray-300` for secondary, `dark:text-gray-400` for muted
- Borders: `dark:border-gray-700` for all borders
- Inputs: `dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`

**Rationale**: Matches the palette already established in K3 (Layout.tsx, ProfileCard.tsx). Consistency over creativity.

### 2. README edits are surgical

**Decision**: Only replace `node-window-manager` references with `PowerShell Win32 P/Invoke`. Don't rewrite surrounding text.

**Rationale**: Minimizes diff and risk of introducing new inaccuracies.

## Risks / Trade-offs

- **[Risk] Dark classes may look wrong in some combinations** → Mitigation: Using the same palette as K3's established components. Manual visual check recommended.
- **[Risk] Removing @cj-ways/orgclone might break something we didn't find** → Mitigation: Zero grep hits in source. If build breaks, re-add it.
