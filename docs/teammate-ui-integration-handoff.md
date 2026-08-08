# MonsterDeleter UI 集成交接

本文面向接手 MonsterDeleter 界面与动画的 UI agent，只描述 MonsterDeleter 侧的现状、边界和验收方式。宿主如何组织项目、采用何种技术栈，不在本文假设范围内。

## 当前状态与提交基线

- 当前实现：Electron + TypeScript。
- 当前动画与素材基线：`4003c5f`（`feat: replace monster with Teammate sprite animations`）。
- TypeScript 迁移基线：`5134f79`（`refactor: complete TypeScript migration`）。
- portable 删除链路修复：`96534cd`（`fix: restore portable deletion workflow`）。
- 本文编写时，主进程负责启动参数、目标保存、一次性删除授权和回收站调用；renderer 只负责界面与演出。

## 当前体验流程

一次完整演出按以下顺序执行：

1. 用户点击屏幕，选择一个**视觉落点**。
2. 角色播放走路动画并移动到落点附近。
3. 角色播放指向动画。
4. 显示当前二选一确认：`是的` / `嘿嘿嘿，就是这个`。目标产品口径需把第二项统一为“嘿嘿嘿，就是它”；UI 接手时不能改变两枚按钮都只用于继续同一条确认流程的行为。
5. 角色播放踢击动画；零基索引 5（第 6 格，代码条件为 `frameIndex === 5`）触发爆炸，同时在 target 模式请求删除。
6. 角色播放登场动画。
7. 角色播放飞离动画并移出屏幕。
8. 等待爆炸和删除结果；失败时显示提示，然后关闭 overlay。

## target 模式与 spectacle 模式

`LaunchSession` 只有两种形态：

```ts
type LaunchSession =
  | { mode: 'target'; targetPath: string }
  | { mode: 'spectacle' }
```

- **target 模式**：由启动参数 `--target "<path>"` 进入。`targetPath` 在应用启动时由主进程解析并保存在本次会话中；踢击动画到达零基索引 5（第 6 格）时才会请求把该目标移入回收站。
- **spectacle 模式**：显式传入 `--spectacle`，或没有有效的 `--target` 参数时进入。它只播放演出，禁止删除。

点击屏幕选择的落点只影响角色位置、爆炸位置和视觉演出，**不是删除目标选择器**。renderer 不会、也不能用点击位置生成文件路径；真正目标始终是主进程启动时收到并保存的 `--target` 路径。

## 本仓库 Electron IPC 与 renderer API

以下是 MonsterDeleter 仓库当前 Electron 实现的接口，不是对其他宿主技术栈的要求。允许使用的 IPC channel 定义在 `src/shared/api.ts`：

| Channel | 方向 | 用途 |
| --- | --- | --- |
| `monster:get-session` | renderer invoke → main | 读取本次启动会话。 |
| `monster:trash-target` | renderer invoke → main | 请求主进程 claim 并回收本次启动目标。renderer 不传路径。 |
| `monster:close-overlay` | renderer send → main | 关闭 overlay。 |

preload 通过 `contextBridge` 暴露唯一白名单对象 `window.monsterApi`：

```ts
interface MonsterApi {
  getSession(): Promise<LaunchSession>
  trashTarget(): Promise<TrashResult>
  closeOverlay(): void
}

type TrashResult =
  | { ok: true }
  | { ok: false; error: string }
```

- `getSession()`：初始化界面时读取 target/spectacle 状态；target 模式的路径只用于表达主进程已持有目标，不应把它变成 renderer 可编辑的删除参数。
- `trashTarget()`：在踢击命中时调用；无参数，返回成功或可显示给用户的错误信息。
- `closeOverlay()`：动画完成、错误提示结束或用户主动退出时关闭窗口；它是单向通知，没有 Promise 返回值。

## 必须保持的安全边界

安全边界分为本仓库实现约束和跨宿主等价语义，二者不要混用。

### 修改本 MonsterDeleter 仓库 renderer/UI 时

- 保留现有 Electron IPC/preload 白名单；renderer 不能向主进程传任意路径，`trashTarget()` 必须保持无路径参数。
- 目标路径继续由主进程从启动参数获取并持有，不能迁移到 DOM、URL 参数、localStorage 或 renderer 状态作为授权来源。
- 每次应用启动只允许对启动目标 claim/delete 一次。`DeletionSession.claimTarget()` 第一次 claim 后即锁定，后续请求返回 `already-used`。
- 删除实现只调用 Electron `shell.trashItem()`，目标进入 Windows 回收站。
- `shell.trashItem()` 失败时只返回错误并提示用户，不能改用永久删除、命令行删除或其他兜底删除方式。
- spectacle 模式必须拒绝 claim，任何 UI 路径都不能在表演模式触发删除。
- preload 继续使用 `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true` 的窄接口桥接方式。
- packaged portable 的资源管理器注册命令继续优先使用稳定的 `PORTABLE_EXECUTABLE_FILE`，不能写入临时 `process.execPath`。

### 嵌入非 Electron 或技术栈未知的宿主时

- 只要求保留等价安全语义，不要求宿主实现 Electron IPC、preload、`shell.trashItem()` 或 `PORTABLE_EXECUTABLE_FILE`。
- 可信宿主持有并授权目标路径；UI/renderer adapter 不提供、拼接或覆盖任意删除路径。
- 每次启动或每个明确授权的演出会话只能消费一次删除授权，失败后也不能由 UI 绕过该限制重试其他路径。
- 删除操作只能进入宿主操作系统的回收站或等价可恢复区域，不能永久删除。
- 回收站操作失败时只返回错误，绝不切换为永久删除、命令行强删或其他不可恢复兜底。
- 表演模式与删除能力彻底隔离，任何 UI 分支都不能在表演模式获得删除授权。

## 关键文件地图

| 文件 | 职责 / 接手时关注点 |
| --- | --- |
| `src/main/index.ts` | Electron 启动、窗口生命周期、IPC handler、`shell.trashItem()` 调用、Esc 的主进程兜底关闭。 |
| `src/main/launch.ts` | 解析 `--target` / `--spectacle`，定义 `LaunchSession`。 |
| `src/main/deletion-session.ts` | 一次性 claim、spectacle 隔离、删除结果封装。 |
| `src/main/context-menu.ts` | Windows Explorer 右键菜单命令和 portable 可执行路径选择。 |
| `src/main/window-options.ts` | 透明置顶 overlay 与安全的 `webPreferences`。 |
| `src/preload/index.ts` | 把白名单 IPC 封装为 `window.monsterApi`。 |
| `src/shared/api.ts` | IPC channel、`MonsterApi` 类型契约。 |
| `src/renderer/main.ts` | 完整体验状态流、点击落点、音频、动画编排、踢击零基索引 5（第 6 格）触发删除、错误提示和关闭。 |
| `src/renderer/monster-animations.ts` | 五套角色精灵表文件名、网格和指向帧子集。 |
| `src/renderer/sprite-player.ts` | 图片预加载、Canvas 绘制、帧播放、翻转、定位及回调。可作为复用播放器边界。 |
| `src/renderer/sprite-sheet.ts` | 精灵表帧切分、帧索引过滤和等比缩放。 |
| `src/renderer/style.css` | overlay、准星、气泡、按钮、状态提示、鼠标与 reduced-motion 样式。 |
| `src/renderer/index.html` | renderer DOM、CSP、可访问性标签和现有文案。 |
| `tests/` | Vitest 回归测试：启动参数、删除会话、右键菜单、窗口选项、动画配置、移动、样式与精灵表。 |

现有测试文件：

- `tests/context-menu.test.ts`
- `tests/deletion-session.test.ts`
- `tests/launch.test.ts`
- `tests/monster-animations.test.ts`
- `tests/motion.test.ts`
- `tests/renderer-style.test.ts`
- `tests/sprite-sheet.test.ts`
- `tests/window-options.test.ts`

## 动画资产规格

所有视觉动画都是透明 PNG spritesheet，不是 MP4。默认按从左到右、从上到下播放，当前默认速度为 8 FPS。

| 动作 | 文件 | 网格 | 总帧 / 播放帧 | 最新尺寸 |
| --- | --- | --- | --- | --- |
| 走路 | `assets/走路动效_spritesheet_transparent.png` | 5 × 3 | 15 帧 | 1190 × 1322 px |
| 指向 | `assets/指着文件_spritesheet_transparent.png` | 5 × 3 | 表内 15 帧；只播放索引 `[11, 12, 13, 14]` | 1122 × 1402 px |
| 踢击 | `assets/踹文件动效_spritesheet_transparent.png` | 5 × 3 | 15 帧；零基索引 5（第 6 格）触发爆炸与删除请求 | 1122 × 1402 px |
| 登场 | `assets/雷欧登场_spritesheet_transparent.png` | 5 × 3 | 15 帧 | 1122 × 1402 px |
| 飞离 | `assets/出场飞行动效_spritesheet_transparent.png` | 4 × 4 | 16 帧 | 1254 × 1254 px |
| 爆炸 | `assets/爆炸_spritesheet_transparent.png` | 5 × 3 | 15 帧 | 7200 × 5760 px |

`assets/音频/爆炸.MP4` 只作为音效媒体加载，不是界面动画画面。

## portable 与右键菜单注意事项

本节只适用于 MonsterDeleter 仓库当前的 Electron/Windows portable 实现，不是跨宿主接口要求。

electron-builder 的 portable 应用会从临时运行目录启动；这个临时 `process.execPath` 不能作为持久命令写入注册表，否则下次启动时路径可能已失效。

`PORTABLE_EXECUTABLE_FILE` 指向用户实际启动的稳定便携 EXE。`src/main/context-menu.ts` 已在 packaged 且该变量存在时优先使用它生成菜单命令和图标路径；不要把这里改回只使用 `process.execPath`。

当前资源管理器入口：

- 文件：`--target "%1"`
- 文件夹：`--target "%1"`
- 目录背景：`--spectacle`，不携带 `%1`

## UI 可改范围与不可破坏项

UI agent 可以调整：

- renderer DOM、CSS、布局、视觉层级和演出节奏；
- 除验收清单明确规定的产品文案外，可调整其他提示与辅助文案；
- 准星、气泡、按钮、状态提示、音频触发和响应式适配；
- renderer 内的动画编排，以及可复用的 `SpritePlayer` / spritesheet 工具；
- 在不改变安全契约的前提下，把 UI 与动画封装为更清晰的 renderer adapter。

不可破坏：

- 按适用场景遵守上方两层安全边界：修改本仓库时保留 Electron 实现，嵌入其他宿主时保留等价安全语义；
- 目标产品第二按钮文案必须为“嘿嘿嘿，就是它”。当前 `src/renderer/index.html` 仍是“嘿嘿嘿，就是这个”，集成时需要统一；
- Esc 随时关闭；
- 二选一阶段系统鼠标必须可见，按钮必须保留 `pointer` 光标并可点击/聚焦；
- 踢击零基索引 5（第 6 格，现有条件为 `frameIndex === 5`）触发爆炸与 target 模式删除请求的时序语义。

## 建议的嵌入接口边界

把整个 UI/动画层视为一个 renderer adapter。下面是 TypeScript 形式的逻辑契约示意；非 Electron 宿主只需提供等价的 session/trash/close 语义，不必采用相同名称、运行时或传输机制：

```ts
interface MonsterOverlayHost {
  getSession(): Promise<LaunchSession>
  trashTarget(): Promise<TrashResult>
  closeOverlay(): void
}
```

adapter 负责视觉落点、动画状态机、按钮、提示与结束时机；宿主负责可信启动目标、一次性授权、可恢复的系统回收站操作与窗口关闭。不要让 adapter 接收“要删除的路径”作为 `trashTarget()` 参数，也不要假定宿主使用 Electron、某个前端框架或特定目录结构。

## 已知行为与限制

- 双击便携 EXE、无参数开发启动或没有有效 `--target` 时，会进入 spectacle 表演模式。
- 在本仓库中，文件/文件夹路径必须由资源管理器右键菜单或显式 `--target` 传入；嵌入其他宿主时，目标必须来自可信的宿主侧选择/授权流程，不能来自 UI 演出落点。
- Windows 11 的经典资源管理器菜单可能位于“显示更多选项”中。
- 点击位置不是删除目标选择器，只是视觉演出的落点。
- 当前 overlay 取鼠标所在显示器的 bounds，并覆盖该显示器，不跨所有显示器。

## 验收清单

### 本仓库 Electron 实现验收

- [ ] renderer 只通过现有 preload 白名单调用无路径参数的 `trashTarget()`；主进程继续持有启动目标并执行一次性 claim。
- [ ] target 模式确认后目标只通过 Electron `shell.trashItem()` 进入回收站，不永久删除。
- [ ] 删除失败显示错误信息，且不会尝试任何永久删除兜底。
- [ ] 文件、文件夹、目录背景右键菜单分别进入正确模式；Windows 11 “显示更多选项”可找到经典菜单。
- [ ] portable 打包后注册表命令使用稳定的 `PORTABLE_EXECUTABLE_FILE` 路径，而不是临时运行路径。
- [ ] preload 仍启用 `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`。

### 跨宿主等价安全验收

仅在嵌入非 Electron 或技术栈未知的宿主时适用：

- [ ] 可信宿主持有目标，UI/adapter 不能传入或替换任意删除路径。
- [ ] 每个明确授权的演出会话只能消费一次删除授权。
- [ ] 删除只进入宿主系统回收站或等价可恢复区域；失败时绝不永久删除。
- [ ] 表演模式与删除授权隔离。
- [ ] 宿主无需采用 Electron IPC、preload、`shell.trashItem()` 或 `PORTABLE_EXECUTABLE_FILE`，但必须满足以上等价安全语义。

### UI 与动画产品验收

- [ ] target 模式能读取既定启动目标，spectacle 模式无论如何都不能删除。
- [ ] 未开始演出时显示自定义视觉准星；二选一阶段恢复系统鼠标。
- [ ] 交接完成后，第二按钮必须使用目标产品文案“嘿嘿嘿，就是它”；它与“是的”都能继续同一确认流程，按钮可点击、可聚焦且光标为 pointer。
- [ ] 走路、指向、踢击、登场按 5 × 3 切分；飞离按 4 × 4、16 帧切分；爆炸按 5 × 3 切分。
- [ ] 指向只播放 `[11, 12, 13, 14]`；踢击零基索引 5（第 6 格）只触发一次爆炸和一次删除请求。
- [ ] Esc 在选择阶段、动画阶段和确认阶段都能关闭 overlay。
- [ ] `npm test`、`npm run typecheck`、`npm run build` 通过。
- [ ] 完成 UI 改动后以截图或 GUI 重测确认布局、鼠标、按钮和完整动画时序。

## 本地验证与打包

```powershell
npm install
npm test
npm run typecheck
npm run build
npm run package:win
```

开发模式：

```powershell
npm run dev
```

生产构建指定目标：

```powershell
npm run build
npx electron . --target "C:\path\to\old-file.txt"
```

显式表演模式：

```powershell
npx electron . --spectacle
```

当前 package 元数据下，Windows portable EXE 输出为：

```text
release/MonsterDeleter 1.0.0.exe
```
