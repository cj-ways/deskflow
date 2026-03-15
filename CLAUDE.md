# DeskFlow — Claude Agent Instructions

## Autonomy
Operate with full autonomy within this project. No approval needed before running commands,
editing files, installing packages, or performing any actions. Make decisions independently.
Only ask for clarification when the task is genuinely ambiguous, not for permission to act.

---

## Phase Workflow — MANDATORY

Every phase follows this exact loop. Do not skip any step.

### Before Starting a Phase

1. **Read `SPRINT_PLAN.md` in full** — understand the entire plan, not just the current phase
2. **Read all existing source files** relevant to the phase you are about to start
3. **Write a detailed implementation plan** as a fenced block in your first response:
   - Exact files to create or modify (with paths)
   - Exact functions/classes to implement, with signatures
   - Order of operations (what gets built first and why)
   - Libraries to install and why each is needed
   - How this phase connects to the next one
4. Only then begin implementation

### After Completing a Phase

1. **Re-read `SPRINT_PLAN.md` in full**
2. **Audit what was just implemented:**
   - Does it match the phase spec exactly?
   - Are there bugs, missing error handling, or incomplete features?
   - Are types correct and consistent with `src/shared/types.ts`?
   - Does it follow the project's established patterns?
   - Fix any issues found before marking the phase done
3. **Re-evaluate all upcoming phases:**
   - Are they still correctly structured given what was actually built?
   - Did any implementation decision change the architecture assumed in later phases?
   - Are library choices still correct, or did something better emerge?
   - Are there new risks or blockers that need addressing?
4. **Update `SPRINT_PLAN.md`** if any phase needs to change — update in place, note the reason
5. Mark the phase as `[DONE]` in `SPRINT_PLAN.md` with a one-line summary of what was built

---

## Code Standards

### TypeScript
- Strict mode always (`"strict": true` in tsconfig)
- No `any` — use `unknown` and narrow, or define proper types
- All IPC channels defined in `src/shared/ipc-channels.ts` with typed payloads
- Shared types between main and renderer in `src/shared/types.ts`

### Error Handling
- All async operations wrapped in try/catch with typed errors
- User-facing errors shown in UI — never silent failures
- `electron-log` for structured logging: `log.info()`, `log.warn()`, `log.error()`
- Platform operations (window management, process spawning) must have timeout + fallback

### React
- Functional components only, no class components
- State management: React state + Context for global state (no Redux unless clearly needed)
- All IPC calls go through `src/renderer/ipc/` wrapper functions — never call `ipcRenderer` directly in components

### File Structure — do not deviate
```
src/
  main/
    index.ts              # Electron entry, app lifecycle
    tray.ts               # System tray setup
    ipc/                  # IPC handlers (one file per domain)
    services/
      ProfileManager.ts   # Profile CRUD
      LaunchEngine.ts     # Orchestrates launches
    platform/
      index.ts            # Platform interface (IPlatform)
      windows/            # Windows implementations
  renderer/
    main.tsx              # React entry
    components/           # Reusable components
    pages/                # Route-level components
    ipc/                  # Typed IPC wrappers
    hooks/                # Custom React hooks
  shared/
    types.ts              # All shared types
    ipc-channels.ts       # IPC channel name constants + payload types
    constants.ts          # App-wide constants
resources/
  VirtualDesktopAccessor.dll
  icon.ico
```

### Production Readiness Checklist (every phase)
- [ ] No TypeScript errors (`tsc --noEmit` passes)
- [ ] ESLint passes with no warnings
- [ ] All user-facing error states handled and shown in UI
- [ ] electron-log used for all significant operations
- [ ] No hardcoded paths — use `app.getPath()` and constants
- [ ] Installer builds successfully (`npm run build`)
- [ ] Manual test checklist from SPRINT_PLAN.md completed

---

## Key Technical Decisions (do not revisit without good reason)

| Decision | Choice | Reason |
|----------|--------|--------|
| Bundler | electron-vite | Handles main + renderer + preload in one config |
| Styling | Tailwind CSS 4 | Fast, consistent, no CSS files |
| IPC pattern | contextBridge + typed channels | Secure, type-safe renderer/main boundary |
| Virtual desktop | VirtualDesktopAccessor.dll via PowerShell | Proven, works Win10/11 |
| Window management | node-window-manager | npm package, no native compilation needed |
| Profile storage | JSON in %APPDATA%\DeskFlow\profiles\ | Human-readable, portable |
| Validation | zod | Runtime schema validation for profiles |
| Logging | electron-log | File + console, works in packaged app |

---

## Platform Abstraction Rule

All Windows-specific code lives exclusively in `src/main/platform/windows/`.
The `src/main/platform/index.ts` file exports an `IPlatform` interface.
`LaunchEngine` and other services call `IPlatform` — never Windows code directly.
This enables a future Mac/Linux port without touching service logic.
