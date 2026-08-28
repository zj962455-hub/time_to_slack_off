# 打包

## 窗口模式（macOS 桌面 widget 风格）

应用启动后是一个 **280x110** 的桌面 widget 风格窗口：
- 透明背景 + 圆角 + 阴影
- 桌面层（kCGDesktopIconWindowLevel，在桌面图标之上，正常窗口之下）
- 所有桌面空间可见，不在 Mission Control 显示
- 不抢焦点（点击穿透到桌面图标）
- 拖动 widget 移动位置，点击 ⚙ 打开设置
- 菜单栏图标常驻（右键菜单：显示/隐藏/设置/退出）

## 开发模式

```bash
pnpm tauri dev
```

启动 Vite dev server (端口 1420) + 编译运行 Rust 应用。

## 发布打包

```bash
pnpm tauri build
```

## 产物位置

- **二进制**: `src-tauri/target/release/time-to-slack-off` (10 MB)
- **App**: `src-tauri/target/release/bundle/macos/Time To Slack Off.app`
- **DMG**: `src-tauri/target/release/bundle/dmg/Time To Slack Off_0.1.0_aarch64.dmg` (3 MB)

## 安装

打开 `.dmg` 文件 → 拖拽 `Time To Slack Off.app` 到 Applications 文件夹。

首次打开时如果系统提示"无法打开，因为它来自身份不明的开发者"，右键点击 → 打开 → 确认。

## 仅打 Mac（跳过 Windows）

```bash
pnpm tauri build --bundles app,dmg
```

## 仅打 Windows（需要 Windows 环境）

```powershell
pnpm tauri build
```

或仅打 MSI / NSIS：

```powershell
pnpm tauri build --bundles msi
pnpm tauri build --bundles nsis
```

**Win 环境准备：**

1. 装 [Rust](https://rustup.rs) (stable)
2. 装 Node.js 20+ + pnpm
3. 装 Visual Studio Build Tools 2022，勾选：
   - "使用 C++ 的桌面开发"
   - MSVC v143 生成工具
   - Windows 11 SDK（或 Windows 10 SDK）
4. 装 WebView2 Runtime（Win 11 自带；Win 10 需要 [下载](https://developer.microsoft.com/microsoft-edge/webview2/)）
5. 装 Tauri CLI：

```powershell
cargo install tauri-cli --version "^2.0.0"
```

产物：
- `src-tauri/target/release/time-to-slack-off.exe`（单文件可执行）
- `src-tauri/target/release/bundle/msi/Time To Slack Off_0.1.0_x64_en-US.msi`（MSI 安装包）
- `src-tauri/target/release/bundle/nsis/Time To Slack Off_0.1.0_x64-setup.exe`（NSIS 安装器）

**Win 上的 widget 拖动：**

Win 透明窗口用前端 `getCurrentWebviewWindow().startDragging()` API（macOS 用 native drag region）。代码自动检测平台，无需手改。

## 清理

```bash
rm -rf src-tauri/target/release/bundle
rm -rf src-tauri/target/release/time-to-slack-off
```

## 构建时长

- 首次 release 编译：~12 分钟（含 350+ crate 全量编译）
- 增量 release 编译：~1-3 分钟（只改 Rust 代码时）
- Vite 前端 build：~0.4 秒