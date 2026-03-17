# Contributing to DeskFlow

Thanks for your interest in contributing! DeskFlow is an open-source Windows desktop session manager built with Electron, React, and TypeScript.

## Development Setup

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Windows 10/11** (required for platform-specific features like virtual desktops)
- **VS Code** (recommended)

### Getting Started

```bash
git clone https://github.com/your-username/deskflow.git
cd deskflow
npm install
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start in development mode with hot reload |
| `npm run build` | Build and package the NSIS installer to `/dist` |
| `npm run lint` | Run ESLint across all source files |
| `npm run typecheck` | Run TypeScript type checking (`tsc --noEmit`) |

## Project Structure

```
src/
  main/           # Electron main process
    ipc/          # IPC handlers (one file per domain)
    services/     # Business logic (ProfileManager, LaunchEngine, etc.)
    platform/     # OS abstraction layer
      windows/    # Windows-specific implementations
    cli/          # CLI argument parsing and handlers
  renderer/       # React UI
    components/   # Reusable components
    pages/        # Route-level components
    ipc/          # Typed IPC client wrappers
    hooks/        # Custom React hooks
  shared/         # Shared types, constants, IPC channel definitions
  preload/        # Electron preload script (contextBridge)
resources/        # Static assets (icons, DLLs)
build/            # Installer assets (NSIS scripts, bitmaps)
```

## Branch Conventions

- `main` — stable, release-ready code
- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — tooling, CI, docs, dependencies

## Making Changes

1. **Fork** the repository and create your branch from `main`
2. **Read the relevant source files** before making changes
3. **Follow existing patterns** — check nearby code for conventions
4. **Run checks** before committing:
   ```bash
   npm run lint
   npm run typecheck
   ```
5. **Commit** with a clear, concise message describing what changed and why
6. **Open a pull request** against `main`

## Code Standards

- **TypeScript strict mode** — no `any` types; use `unknown` and narrow
- **Functional React components** only — no class components
- **IPC calls** go through `src/renderer/ipc/client.ts` — never call `window.api` directly in components
- **Platform code** lives in `src/main/platform/windows/` — services use the `IPlatform` interface
- **Error handling** — all async operations wrapped in try/catch; user-facing errors shown in UI
- **Logging** — use `electron-log` (`log.info()`, `log.warn()`, `log.error()`)

## Pull Request Process

1. Fill out the PR template
2. Ensure `npm run lint` and `npm run typecheck` pass
3. Describe what you changed and why
4. Include screenshots for UI changes
5. A maintainer will review and provide feedback

## Platform Contributions

DeskFlow uses a platform abstraction layer (`src/main/platform/IPlatform.ts`). All Windows-specific code lives in `src/main/platform/windows/`. Contributions for Mac (`platform/mac/`) or Linux (`platform/linux/`) implementations are especially welcome.

## Reporting Issues

- Use the **Bug Report** template for bugs
- Use the **Feature Request** template for new ideas
- Search existing issues before opening a new one

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
