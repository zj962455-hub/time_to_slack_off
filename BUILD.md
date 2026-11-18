---
# 摸鱼时钟 · 开发 / 更新 / 打包指南

> 适用：**Windows** 与 **macOS** 双系统
> 仓库：`https://github.com/zj962455-hub/time_to_slack_off.git`
> 本文所有命令都在**项目根目录**（和 `package.json` 同级）执行

---

## 一、先搞清楚两件事

### 1.1 `git pull` ≠ 已安装的 App 会自动更新

节假日数据、倒计时逻辑这些前端内容是**编译期内嵌**进 App 二进制的，不是运行时读文件：

~~~
data/holidays-2027.json
  → src/utils/holiday.ts 里 import
  → Vite 打包成 dist/assets/index-*.js
  → Tauri 把整个 dist 嵌进 App 二进制
~~~

所以 `git pull` 之后，**已经装好的 App 里仍然是旧数据**。要让这台机器上的 App 用上新数据，必须**在这台机器上重新构建一次**（见第五节）。

### 1.2 开发模式和已安装的 App 共用同一份配置

两者的 `identifier` 都是 `com.zj.time2slackoff`，读写同一个文件：

| 系统 | 配置路径 |
|---|---|
| macOS | `~/Library/Application Support/com.zj.time2slackoff/config.json` |
| Windows | `%APPDATA%\com.zj.time2slackoff\config.json` |

> 开发模式里改的设置会**立刻影响已安装的 App**（同一份文件）。调试时留意这点。

---

## 二、环境准备

### 2.1 通用依赖（两个系统都要）

| 依赖 | 版本要求 | 说明 |
|---|---|---|
| Node.js | 20+ | 实测 26.13.0 可用 |
| pnpm | 9+ | 实测 11.24.0；`pnpm-lock.yaml` 的 `lockfileVersion: '9.0'`，pnpm 8 装不了 |
| Rust | stable | 实测 1.98.0；装法见 <https://rustup.rs> |

**Tauri CLI 不用单独装。** `@tauri-apps/cli` 已在 `devDependencies` 里（实测 2.11.4），`pnpm install` 之后 `pnpm tauri` 直接可用。

> 只有你习惯用 `cargo tauri build` 这种调用方式时，才需要额外 `cargo install tauri-cli --version "^2.0.0"`。**不要两个都装**，容易版本打架。

### 2.2 macOS 额外需要

1. **Xcode Command Line Tools**
   ~~~
   xcode-select --install
   xcode-select -p      # 应输出类似 /Library/Developer/CommandLineTools
   ~~~

### 2.3 Windows 额外需要

1. [Visual Studio Build Tools 2022](https://visualstudio.microsoft.com/downloads/) —— 勾选「**使用 C++ 的桌面开发**」
   - MSVC v143 生成工具
   - Windows 11 SDK（Windows 10 SDK 也可以）
2. **WebView2 Runtime** —— Windows 11 自带；Windows 10 需要[单独下载](https://developer.microsoft.com/microsoft-edge/webview2/)

---

## 三、首次安装

### 3.1 拉源码

~~~
# 仓库是公开的，HTTPS 直接 clone，不用配 SSH key
git clone https://github.com/zj962455-hub/time_to_slack_off.git
cd time_to_slack_off
~~~

### 3.2 装依赖

~~~
pnpm install
~~~

这一步会同时装前端依赖和 `@tauri-apps/cli`。

### 3.3 自检（第一次跑一次就够）

~~~
node -v && pnpm -v && rustc -V && pnpm tauri --version
~~~

四个版本号都能正常打印，说明工具链就位。

---

## 四、开发者模式跑起来

~~~
pnpm tauri dev
~~~

> 注意是 `pnpm tauri dev`，**不是** `pnpm dev`。后者只起纯前端浏览器页面，没有桌面窗口。

### 4.1 确认「真的起来了」

`pnpm tauri dev` 会同时做两件事：起 Vite dev server（端口 **1420**）+ 编译并运行 Rust 应用。应用窗口会自己弹出来（macOS 上是 320x140 的桌面小挂件）。

另开一个终端验证：

~~~
curl -I http://localhost:1420     # 应返回 HTTP/1.1 200 OK
~~~

### 4.2 热更新怎么用

改前端代码 → 保存 → **窗口自动刷新**，不用重启应用。

已实测生效的例子：

- 改 `src/utils/holiday.ts` → 控制台出现 `[vite] (client) hmr update`
- 改 `data/holidays-2027.json` → 同样触发 HMR

> **只改前端**（Vue / TS / 数据文件）：秒级热更新，不用重编译 Rust。
> **改了 `src-tauri/` 下的 Rust 代码**：需要等 Rust 重新编译完（几十秒到几分钟），Tauri 会自动重启应用。

### 4.3 开发模式的几个坑

| 现象 | 原因 | 处理 |
|---|---|---|
| 启动报 `Port 1420 is already in use` | 上一个 dev 没关干净 | 关闭旧进程，或 macOS 下 `lsof -ti:1420 \| xargs kill` |
| 只有浏览器页面，没有桌面窗口 | 跑成了 `pnpm dev` | 要跑 `pnpm tauri dev` |
| 改了设置，已安装的 App 也变了 | 两者共用同一份 config.json（见 1.2） | 属正常行为 |

### 4.4 退出

终端里 `Ctrl + C`。挂件的位置、显示内容等会存进 config.json，下次启动自动恢复。

---

## 五、打包

### 5.1 一条命令

~~~
pnpm tauri build
~~~

> `pnpm tauri build` 会先自动执行 `pnpm build`（= `vue-tsc --noEmit && vite build`），**类型检查不过会直接失败** —— 这是好事，别跳过。

### 5.2 macOS 产物

~~~
# 只出 .app，不出 DMG（最快，日常自用推荐）
pnpm tauri build --bundles app

# .app + DMG
pnpm tauri build --bundles app,dmg
~~~

产物位置：

~~~
src-tauri/target/release/bundle/macos/Time To Slack Off.app
src-tauri/target/release/bundle/dmg/Time To Slack Off_0.1.0_aarch64.dmg
~~~

**安装：**

- `.app`：直接拖进 `Applications` 文件夹
- `.dmg`：双击打开 → 把 App 拖到 Applications

升级时**直接覆盖** `/Applications/Time To Slack Off.app`，用户配置在用户目录，不受影响。

首次打开如果提示「无法打开，因为它来自身份不明的开发者」→ 右键点 App → 打开 → 确认。

### 5.3 Windows 产物

~~~
pnpm tauri build                # 默认出 msi + nsis
pnpm tauri build --bundles msi  # 只出 MSI
pnpm tauri build --bundles nsis # 只出 NSIS 安装器
~~~

产物位置：

~~~
src-tauri/target/release/bundle/msi/Time To Slack Off_0.1.0_x64_en-US.msi
src-tauri/target/release/bundle/nsis/Time To Slack Off_0.1.0_x64-setup.exe
~~~

装 MSI 即可（覆盖旧版本，配置不丢）。

> **状态说明**：Windows 打包流程**未在真实 Windows 机器上执行过**，上面是按 Tauri 标准工具链给出的命令与产物路径。首次在 Windows 上跑若有报错，把完整日志发回来再定。

### 5.4 验收：别只看「跑完了」

**退出码必须是真的 0，产物文件必须真的在**，这两件事分开确认：

~~~
pnpm tauri build --bundles app,dmg
echo "退出码: $?"                              # 必须是 0
ls -l src-tauri/target/release/bundle/dmg/     # 必须有最终的 .dmg
~~~

坑：写成 `pnpm tauri build | tail` 时，`$?` 拿到的是 `tail` 的退出码，**永远是 0**，会把失败伪装成成功。

### 5.5 macOS 在无图形界面环境（SSH / CI / 后台任务）打 DMG 会卡住 ⚠️

**已实测。** DMG 打包最后一步要调 AppleScript 让 Finder 排版（图标位置、窗口大小、背景图）。在没有图形交互的进程里，macOS 的自动化权限（TCC）弹不出授权框 → **osascript 永久挂起 → 打包卡死不动**。

判断是不是这个问题：

~~~
pgrep -f bundle_dmg.sh     # 有进程挂着就卡在这一步
~~~

三种解法，按推荐顺序（解法 3 已实测通过：退出码 0，DMG 生成，`hdiutil verify` 校验有效）：

1. **在带图形界面的终端里打包**（Terminal.app / iTerm）。第一次会弹「终端想控制 Finder」的授权框，点允许即可，之后不再弹。
2. **只要 `.app`，不打 DMG**：`pnpm tauri build --bundles app`（最省事，日常自用推荐）
3. **手动跑 `bundle_dmg.sh` 并加 `--skip-jenkins`**（跳过 Finder 排版，DMG 没有自定义图标位置，但能用）：

   ~~~
   cd src-tauri/target/release/bundle/dmg
   bash ./bundle_dmg.sh --skip-jenkins \
     --volname 'Time To Slack Off' --icon 'Time To Slack Off.app' 180 170 \
     --app-drop-link 480 170 --window-size 660 400 \
     --hide-extension 'Time To Slack Off.app' --volicon ./icon.icns \
     'Time To Slack Off_0.1.0_aarch64.dmg' '../macos/Time To Slack Off.app'
   ~~~

   > Tauri 每次构建都会重新解压并覆盖 `bundle_dmg.sh`，所以这条手动命令要在 `.app` 已经构建出来**之后**单独跑。
>
> 走解法 1（在图形终端里跑完整的 `pnpm tauri build --bundles app,dmg`）时，产物就是标准布局的 DMG，不需要再手动执行上面这条命令。

### 5.6 打完包做一次冒烟测试

macOS：

~~~
open "src-tauri/target/release/bundle/macos/Time To Slack Off.app"
pgrep -fl time-to-slack-off     # 应有进程在跑
~~~

确认不崩、界面正常，再退出。

---

## 六、版本更新后怎么弄

### 6.1 只想在自己机器上看效果 → 开发模式热更新

Windows / macOS **完全一样**：

~~~
cd time_to_slack_off
git pull
pnpm install        # 依赖没变时是 no-op
pnpm tauri dev      # 起开发者模式
~~~

之后改代码就是热更新，不用再打包。

### 6.2 要重新装到机器上 → 重新打包

~~~
git pull
pnpm install
pnpm tauri build            # 或按 5.2 / 5.3 指定 --bundles
~~~

- **macOS**：把新的 `.app`（或 `.dmg`）覆盖到 `/Applications`
- **Windows**：重新跑 MSI 安装包覆盖安装

### 6.3 怎么确认更新真的生效了

1. 设置界面里看节假日列表，**是否出现 2027 年的条目**
2. 「距离最近节假日」tab：2026-12-30 打开应显示「元旦 · 还有 2 天」
3. 2027-01-31 是周日但**要上班**（春节调休）—— 该日时薪倍数应为 **1x**，不是 2x

> 验证不通过，多半是「只 pull 了、没重新构建」——已安装的 App 里还是旧二进制。

---

## 七、构建时长（macOS 实测）

| 场景 | 耗时 |
|---|---|
| 首次 release 编译（350+ crate 全量） | ~12 分钟 |
| 增量 release 编译（只改 Rust） | ~1-3 分钟 |
| Vite 前端 build | ~0.4 秒 |
| 只改数据文件后的完整打包 | ~1-3 分钟（Rust 侧不用重编） |

---

## 八、清理

~~~
rm -rf src-tauri/target/release/bundle
rm -rf src-tauri/target/release/time-to-slack-off
~~~

构建卡死留下的残留：

~~~
rm -f src-tauri/target/release/bundle/dmg/rw.*.dmg
rm -f src-tauri/target/release/bundle/macos/rw.*.dmg
hdiutil detach "/Volumes/dmg.xxxx" -force     # 有残留挂载时
~~~

---

## 九、故障速查

| 症状 | 原因 | 处理 |
|---|---|---|
| `pnpm tauri: command not found` | 依赖没装 | `pnpm install` |
| pnpm 报 lockfile 不兼容 | pnpm 版本太老 | 升级到 pnpm 9+（lockfile 9.0） |
| Windows `link.exe not found` | 缺 VS Build Tools | 装 2022 +「使用 C++ 的桌面开发」 |
| Windows 打开白屏 | 缺 WebView2 Runtime | Win10 单独下载安装 |
| macOS `rustc not found` | 没装 Rust | <https://rustup.rs> |
| 端口 1420 被占 | 上个 dev 没关 | macOS: `lsof -ti:1420 \| xargs kill` |
| DMG 打包卡住不动 | 见 5.5（AppleScript 权限） | 见 5.5 三种解法 |
| 打包「成功」但没有产物 | 退出码被管道吃掉 | 见 5.4 |

---

## 附：窗口行为

应用启动后是一个 **320x140** 的无边框桌面挂件（macOS 与 Windows 一致）：

- 透明背景 + 圆角 + 阴影
- macOS 桌面层（`kCGDesktopIconWindowLevel`，在桌面图标之上、普通窗口之下）
- 所有桌面空间可见，不在 Mission Control 显示
- 不抢焦点（点击穿透到桌面图标）
- 拖动挂件移动位置，点 ⚙ 打开设置
- macOS 菜单栏图标常驻（右键：显示 / 隐藏 / 设置 / 退出）

Windows 上的拖动走前端 `getCurrentWebviewWindow().startDragging()`，macOS 用原生 drag region，代码自动判断平台，不用手改。
