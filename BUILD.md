# 更新到最新版本（另一台机器上已装过 App 的情况）

## ⚠️ 先理解一件事：pull 源码 ≠ 已装的 App 会更新

节假日数据是**编译期内嵌**进二进制的，不是运行时读文件：

```
data/holidays-2027.json
  → src/utils/holiday.ts 里 import
  → Vite 打包成 dist/assets/index-*.js
  → Tauri 把 dist 整个嵌进 App 二进制
```

所以在某台机器上 `git pull` 之后，**已经装好的 App 里还是旧数据**（旧年份的旧放假安排）。
要让那台机器上的 App 用上 2027 年数据，必须**在那台机器上重新构建一次**。

## 前置环境

| 依赖 | 版本 | 说明 |
|---|---|---|
| Node.js | 20+ | 含 pnpm |
| pnpm | 9+ | `pnpm-lock.yaml` 的 lockfileVersion 是 9.0，pnpm 8 装不了 |
| Rust | stable | `rustup.rs` |
| Tauri CLI | — | **不用单独装**，已在 `devDependencies` 里（`@tauri-apps/cli`），`pnpm tauri` 直接可用 |

**Windows 额外需要**（公司电脑一般是 Windows）：

1. [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/) —— 勾选「使用 C++ 的桌面开发」
2. MSVC v143 生成工具
3. Windows 11 SDK（Windows 10 SDK 也行）
4. WebView2 Runtime —— Win 11 自带；Win 10 要[单独下载](https://developer.microsoft.com/microsoft-edge/webview2/)

## 场景 A · 首次在这台机器上拉源码

```bash
# 仓库是公开的，HTTPS 直接 clone，不用配 SSH key
git clone https://github.com/zj962455-hub/time_to_slack_off.git
cd time_to_slack_off

pnpm install          # 装前端依赖
pnpm tauri build      # 完整构建（自动先跑 pnpm build）
```

Windows 上产物：

```
src-tauri/target/release/bundle/msi/Time To Slack Off_0.1.0_x64_en-US.msi
src-tauri/target/release/bundle/nsis/Time To Slack Off_0.1.0_x64-setup.exe
```

装 MSI 即可（会覆盖旧版本；配置存在用户目录，不会丢）。

## 场景 B · 这台机器已经拉过源码，只是要更新

```bash
cd time_to_slack_off
git pull
pnpm install          # 依赖没变时这一步是 no-op
pnpm tauri build
```

## 场景 C · 只想跑起来看看，不打包安装

```bash
git pull
pnpm install
pnpm tauri dev        # 开发模式，热更新
```

## macOS 产物

```bash
pnpm tauri build --bundles app,dmg
```

```
src-tauri/target/release/bundle/macos/Time To Slack Off.app
src-tauri/target/release/bundle/macos/*.dmg
```

装 DMG：打开 → 拖到 Applications。
**升级时直接覆盖 `/Applications/Time To Slack Off.app` 即可**，配置存在用户目录不受影响。

## 怎么确认更新真的生效了

1. 设置界面里看节假日列表，是否出现 2027 年的条目
2. 「距离最近节假日」tab：2026-12-30 打开应显示「元旦 · 还有 2 天」
3. 2027-01-31 是周日但**要上班**（春节调休）—— 该日时薪倍数应为 1x 而不是 2x

## 构建时长

- 首次 release 编译：**~12 分钟**（350+ crate 全量）
- 之后增量：**~1-3 分钟**（只改前端数据时 Rust 侧几乎不用重编）
- Vite 前端 build：**~0.4 秒**

## 只想改数据、懒得重编？

不行 —— 见上面「pull 源码 ≠ 已装的 App 会更新」。
数据改动也必须重新构建，因为数据是编译期内嵌的。

---

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