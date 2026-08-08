# 大将怪兽摧毁 · MonsterDeleter

一个 Windows 桌面互动程序：从资源管理器右键菜单召唤大将怪兽，用完整动画把选中的文件或文件夹安全移入回收站。

项目现已使用 Electron + TypeScript 实现，不再依赖 Python、PyQt 或 PyInstaller。

## 功能

- 文件和文件夹右键菜单：`召唤大将怪兽摧毁`
- 桌面及目录背景菜单：`召唤大将怪兽（表演模式）`
- 透明、无边框、置顶且不进入任务栏的全屏互动层
- 自动定位到鼠标所在显示器
- Esc 随时退出
- Canvas 精灵动画、背景音乐、语音和爆炸音效预加载
- 使用 Electron `shell.trashItem()` 移入回收站，不做永久删除
- Renderer 无法指定任意路径；每个启动目标只允许删除一次

## 环境要求

- Windows 10 或 Windows 11
- Node.js 22.12 或更高版本
- npm 11 或兼容版本

## 本地开发

```powershell
npm install
npm run dev
```

无参数开发启动默认为表演模式，不会删除文件。

使用生产构建测试指定目标：

```powershell
npm run build
npx electron . --target "C:\path\to\old-file.txt"
```

明确启动表演模式：

```powershell
npx electron . --spectacle
```

程序启动时会在当前用户注册以下资源管理器菜单，无需管理员权限：

- `HKCU\Software\Classes\*\shell\SummonMonster`
- `HKCU\Software\Classes\Directory\shell\SummonMonster`
- `HKCU\Software\Classes\Directory\Background\shell\SummonMonster`

Windows 11 上，这类经典菜单可能位于“显示更多选项”中。

## 测试与构建

```powershell
npm test
npm run typecheck
npm run build
npm run package:win
```

Windows 便携版输出到 `release/`。

## 动画素材格式

小怪兽使用透明 PNG 精灵表，不是 MP4 视频。

- 网格：5 列 × 3 行
- 总帧数：15 帧
- 播放顺序：从左到右、从上到下
- 默认速度：8 FPS
- 普通精灵表：1125 × 1200 px
- 普通单帧：225 × 400 px

对应文件：

- `assets/走路动效_spritesheet_transparent.png`
- `assets/指着文件_spritesheet_transparent.png`
- `assets/踹文件动效_spritesheet_transparent.png`
- `assets/雷欧登场_spritesheet_transparent.png`
- `assets/出场飞行动效_spritesheet_transparent.png`

爆炸精灵表同样是 5 × 3，但总尺寸为 7200 × 5760 px，单帧为 1440 × 1920 px。

`assets/音频/爆炸.MP4` 只作为音效媒体，不包含界面使用的视频画面。

## 项目结构

```text
MonsterDeleter/
├─ assets/                 图片和音频素材
├─ src/
│  ├─ main/                Electron 主进程、注册表、回收站删除
│  ├─ preload/             安全 IPC 桥
│  ├─ renderer/            Canvas 动画和互动界面
│  └─ shared/              主进程与 Renderer 共用类型
├─ tests/                  Vitest 单元与回归测试
├─ electron.vite.config.ts
├─ package.json
└─ tsconfig.json
```

## 安全说明

- 桌面背景入口永远使用表演模式，不携带 `%1` 或目录路径。
- 文件和文件夹只会进入 Windows 回收站。
- 删除失败时不会改用永久删除。
- 精灵动画最终点击位置仅控制视觉演出；实际回收站目标始终是资源管理器启动时传入并由主进程保存的路径。
