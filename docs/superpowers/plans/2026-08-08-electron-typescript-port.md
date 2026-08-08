# Electron + TypeScript Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Python application with a buildable Electron + TypeScript implementation that preserves the current interaction and safely supports PR #2/#7/#9 behaviors.

**Architecture:** Electron's main process owns Windows registry, display selection, window creation, and recycle-bin deletion. A context-isolated preload exposes three narrow APIs, while a Canvas renderer owns animation and audio playback.

**Tech Stack:** Electron 43, Electron Vite 5, TypeScript 7, Vite 7, Vitest 4, electron-builder 26.

---

### Task 1: Scaffold the TypeScript test/build environment

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `electron.vite.config.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Add package metadata and scripts**

Define `dev`, `test`, `typecheck`, `build`, and `package:win` scripts. Set Electron's entry point to `out/main/index.js` and configure electron-builder to package `out/**`.

- [ ] **Step 2: Install exact dependencies**

Run: `npm install --save-dev electron@43.3.0 electron-vite@5.0.0 vite@latest typescript@7.0.2 vitest@4.1.10 @types/node@latest electron-builder@26.15.3`

Expected: `package-lock.json` is created and `npm audit` completes.

### Task 2: Implement and test launch/registry/session domain logic

**Files:**
- Create: `src/main/launch.ts`
- Create: `src/main/context-menu.ts`
- Create: `src/main/deletion-session.ts`
- Create: `tests/launch.test.ts`
- Create: `tests/context-menu.test.ts`
- Create: `tests/deletion-session.test.ts`

- [ ] **Step 1: Write failing launch tests**

Cover `--target`, `--spectacle`, missing target values, and unrelated Electron arguments.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/launch.test.ts`

Expected: FAIL because `src/main/launch.ts` does not exist.

- [ ] **Step 3: Implement minimal launch parsing and verify GREEN**

Return a discriminated union: `{ mode: 'target'; targetPath: string }` or `{ mode: 'spectacle' }`.

- [ ] **Step 4: Repeat RED/GREEN for context-menu commands**

Verify files and folders receive `--target "%1"`; backgrounds receive only `--spectacle`; development commands contain the application path.

- [ ] **Step 5: Repeat RED/GREEN for single-use deletion authorization**

Verify spectacle sessions cannot delete, target sessions authorize once, and subsequent attempts are rejected.

### Task 3: Implement and test sprite-sheet calculations

**Files:**
- Create: `src/renderer/sprite-sheet.ts`
- Create: `tests/sprite-sheet.test.ts`

- [ ] **Step 1: Write failing frame-rectangle tests**

For a 1125 x 1200, 5 x 3 sheet, assert frame 0 is `(0,0,225,400)` and frame 14 is `(900,800,225,400)`. Assert selected indices `[11,12,13,14]` remain ordered.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/sprite-sheet.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pure frame helpers and verify GREEN**

Keep browser-specific animation code separate from the tested geometry helpers.

### Task 4: Build the Electron main/preload runtime

**Files:**
- Create: `src/main/index.ts`
- Create: `src/preload/index.ts`
- Create: `src/shared/api.ts`

- [ ] **Step 1: Define the shared session and preload API types**

Expose `getSession()`, `trashTarget()`, and `closeOverlay()` only.

- [ ] **Step 2: Create the secure overlay window**

Use the cursor display bounds with `frame: false`, `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`, `focusable: true`, `contextIsolation: true`, and `nodeIntegration: false`.

- [ ] **Step 3: Wire registry registration and IPC**

Register per-user commands on Windows. Invoke `shell.trashItem()` through `DeletionSession` and return a typed result.

- [ ] **Step 4: Run tests and type checking**

Run: `npm test && npm run typecheck`

Expected: all tests pass and TypeScript reports no errors.

### Task 5: Recreate the renderer interaction

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/main.ts`
- Create: `src/renderer/style.css`
- Create: `src/renderer/sprite-player.ts`
- Create: `src/renderer/global.d.ts`

- [ ] **Step 1: Create the targeting overlay and confirmation controls**

Preserve the background, crosshair, instruction, speech bubble, and two confirmation buttons using the existing Chinese copy.

- [ ] **Step 2: Create image/audio preload helpers**

Load each asset once. Call `HTMLMediaElement.load()` without starting playback.

- [ ] **Step 3: Implement the animation sequence**

Preserve current phase timing and trigger `trashTarget()` at kick frame 5. Await the deletion result before final close and show an error message on failure.

- [ ] **Step 4: Support Esc cancellation**

Handle renderer keydown and Electron `before-input-event` as a fallback.

### Task 6: Remove Python runtime and document the new project

**Files:**
- Delete: `main.py`
- Delete: `register_menu.py`
- Delete: `requirements.txt`
- Delete: `scripts/*.py`
- Delete: legacy `tests/*.py`
- Modify: `README.md`

- [ ] **Step 1: Remove Python-only application and tooling files**

The upstream commit remains in local history for recovery.

- [ ] **Step 2: Rewrite README usage/build instructions**

Document `npm install`, `npm run dev`, `npm test`, `npm run build`, `npm run package:win`, context-menu behavior, and recycle-bin safety.

- [ ] **Step 3: Run full verification**

Run: `npm test`

Run: `npm run typecheck`

Run: `npm run build`

Run: `npm run package:win`

Expected: all commands exit 0 and a Windows artifact appears under `release/`.

- [ ] **Step 4: Inspect git diff and confirm no Python runtime remains**

Run: `git status --short` and `Get-ChildItem -Recurse -Filter *.py`.

Expected: only intentional TypeScript/config/docs changes; zero Python files.

