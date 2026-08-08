# Electron + TypeScript Port Design

## Goal

Convert MonsterDeleter from a PyQt/Python runtime into a standalone Windows Electron + TypeScript application while preserving the existing monster animation, audio, targeting overlay, recycle-bin deletion, and Explorer context-menu experience.

The pull requests are reference material only. PR #1 is excluded. PR #2 supplies the Esc/focus requirement, PR #7 supplies performance goals, and PR #9 supplies safe folder/background registration and multi-display behavior.

## Scope

- Keep all current image and audio assets.
- Remove Python from the application runtime and development workflow.
- Support files, folders, and desktop-background spectacle mode from Explorer.
- Use the display containing the mouse cursor.
- Allow Esc to close the overlay.
- Move targets to the Windows recycle bin, never permanently delete them.
- Build and package with Electron tooling.
- Work only on the local `codex/ts-electron-port` branch.

## Architecture

### Main process

The Electron main process owns all privileged operations:

- Parse explicit `--target <path>` and `--spectacle` launch arguments.
- Register per-user Explorer commands under `HKCU\\Software\\Classes` by invoking `reg.exe` with argument arrays.
- Select the display nearest `screen.getCursorScreenPoint()` and create a frameless transparent window using that display's bounds.
- Keep the window focusable, always on top, and absent from the taskbar.
- Validate the startup target and call `shell.trashItem()` exactly once when the renderer requests deletion.
- Close the current application instance when the animation completes or the user cancels.

The renderer never receives an API that can delete an arbitrary path. It receives only `getSession()`, `trashTarget()`, and `closeOverlay()`.

### Preload bridge

The preload script exposes a small typed API through `contextBridge`. `contextIsolation` remains enabled and `nodeIntegration` remains disabled.

### Renderer

The renderer uses ordinary HTML/CSS plus Canvas:

- A full-window background image fades in to 35% opacity.
- A custom crosshair cursor and instruction text collect the target point.
- A reusable sprite-sheet player draws the existing 5 x 3 sheets on Canvas.
- The sequence remains walk -> point -> confirmation -> kick/explosion -> Leo -> fly away.
- Images are loaded once and reused. The 7200 x 5760 explosion sheet is decoded once by the browser rather than repeatedly during paint events.
- Audio elements use `preload="auto"` and `load()` without playing or advancing them, avoiding PR #7's clipped-audio regression.

## Explorer integration

Three per-user entries are registered:

- Files: `--target "%1"`
- Folders: `--target "%1"`
- Directory/Desktop background: `--spectacle`

The background entry uses the label `召唤大将怪兽（表演模式）` so it does not promise deletion when no target is supplied. Development commands include the project path after `electron.exe`; packaged commands call the application executable directly.

## Deletion and error handling

The renderer asks the main process to trash the session target at the explosion frame. The main process rejects spectacle sessions, duplicate calls, missing targets, and paths that changed away from the startup target. `shell.trashItem()` is awaited.

If deletion fails, the animation may finish but the overlay displays a concise failure message before closing. The application never falls back to permanent deletion.

Registry registration failure is logged but does not prevent manual launch. Missing media produces a visible error and a safe close path.

## Testing

Vitest covers the logic that does not require a real Windows desktop:

- Launch-argument parsing.
- Development and packaged context-menu command generation.
- Safe background spectacle registration.
- Single-use deletion-session authorization.
- Sprite-sheet frame rectangles and selected-frame sequences.

Verification also includes TypeScript checking, production build, Electron package generation, and a Windows GUI smoke launch. Real Explorer registration and recycle-bin behavior are verified with a temporary file during the smoke test when practical.

## Non-goals

- No new visual redesign or settings UI.
- No Windows 11 `IExplorerCommand` shell extension; entries may appear under “Show more options”.
- No permanent deletion.
- No Python sidecar or Python asset-processing workflow.
- No remote push or upstream PR action.

