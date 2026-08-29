# ⏰ time-to-slack-off · 摸鱼时钟

> 打工人桌面摸鱼小组件 · Win / Mac / Web 三端

## 📦 v1.0.0 已发布 (2026-08-30)

🟢 **状态: 已归档 · 冻结** · 后续有更新迭代时再启用 · git tag `v1.0.0`

**已完成**: P1 MVP → P2 节假日 → P3 6 种 tab → P4 Mac 打包 + 桌面 widget + 菜单栏常驻 → P5 Win native build → P6 节日主题(10 主题 + 自动检测 + 设置)

**分发**:
- 🍎 **Mac**: `src-tauri/target/release/bundle/dmg/Time To Slack Off_0.1.0_aarch64.dmg`(3.0 MB, aarch64)· 朋友安装: 双击 dmg → 拖到 Applications → 右键"打开"一次绕过 Gatekeeper 警告
- 🪟 **Windows**: `pnpm tauri build` 后 standalone exe(~6-8 MB)· 朋友安装: 双击 exe → SmartScreen 选"更多信息 → 仍要运行"

**重新启用**: 后续有更新迭代时,`cd projects/time-to-slack-off` 从 v1.0.0 拉新分支或继续 main 推进

## 产品定位

打工人摸鱼用的桌面小组件，主界面**倒计时显示距离下班还有多久**，下方可挂最多 5 个自定义 tab。

## 三端支持

- 🖥️ **Mac**：`.app` / `.dmg`（Tauri 打包，**桌面 widget 风格**）
- 🪟 **Windows**：`.exe` / `.msi`（Tauri 打包）
- 🌐 **Web**：PWA（可"添加到桌面"，体验接近原生）

## 技术栈

| 层 | 选型 | 理由 |
|---|---|---|
| 桌面壳 | **Tauri 2.x** | 轻量（5-10 MB）、启动快、跨平台 |
| 前端 | **Vue 3 + TS + Vite** | 老大熟（与题库项目同款） |
| 状态 | **Pinia** | 轻、官方推荐 |
| 持久化 | **tauri-plugin-store** | 配置文件存磁盘，卸载不丢 |
| 样式 | **手写 CSS + CSS Variables** | 逻辑简单，不上 UI 框架 |
| 时间 | **dayjs** | 轻量、moment.js 替代品 |

## 核心功能

### 主界面
- 倒计时显示：`距离下班还有 01:41:48`（HH:MM:SS，秒级刷新）
- 跨天自动重算
- 周五 18:00 后自动切到「距离周末」

### Tab 系统（最多 5 个）

**默认 3 个：**
- 📅 距离周末 X 天
- 💰 距离发薪日 X 天（每月固定日）
- 🎉 距离最近节假日 X 天（基于内置 JSON）

**可选扩展：**
- ⏰ 时薪 tab（日薪 / 月薪，自动算倍数）
- 🎯 自定义节假日 tab（个人假期 / 调休覆盖）
- 🎂 自定义计划日 tab（生日 / 纪念日 / deadline）

### 设置面板
- 下班时间（时分）
- Tab 增删改 + 排序
- 时薪配置（月薪 / 日薪 / 时薪）
- 节假日 override（特殊工种覆盖）

## 节假日数据

**双轨策略：**
- 内置当前年 + 后 2 年 JSON（**离线可用**）
- 每年 12 月国务院发通知后手动更新 + 发版本
- 进阶：在线增量更新（暂不做）

**支持用户层 override：** 特殊工种（医护 / 警察等）可自定义覆盖放假安排。

## 时薪计算逻辑

| 场景 | 倍数 |
|---|---|
| 工作日 | 1x |
| 周末加班 | 2x |
| 法定节假日 | 3x |
| 调休补班日 | 1x |

⚠️ **标注"仅供参考"**，不做工资条级别承诺。

## 项目结构

```
time-to-slack-off/
├── README.md              # 本文件
├── TASKS.md               # 任务拆解 + 进度
├── DATA-SCHEMA.md         # 数据结构设计
├── src/                   # 前端 (Vue 3)
│   ├── views/
│   │   ├── Main.vue       # 主界面
│   │   └── Settings.vue   # 设置界面
│   ├── components/
│   │   ├── Countdown.vue  # 倒计时组件
│   │   └── Tab.vue        # 单个 tab
│   ├── stores/
│   │   └── config.ts      # 用户配置
│   ├── utils/
│   │   ├── holiday.ts     # 节假日计算
│   │   └── time.ts        # 时间工具
│   └── styles/
│       └── variables.css  # CSS 变量
├── src-tauri/             # Tauri / Rust 后端
│   └── tauri.conf.json
├── data/
│   └── holidays-2026.json # 内置节假日数据
└── package.json
```

## 5 阶段计划

| 阶段 | 内容 | 估时 | 状态 |
|---|---|---|---|
| **P1 MVP** | 倒计时 + 设置下班时间 + Web 跑通 | 2-3 天 | ✅ |
| **P2 节假日** | 内置 JSON + 周末/调休 + 3 个默认 tab | 3-4 天 | ✅ |
| **P3 扩展 tab** | 时薪 / 自定义节假日 / 自定义计划日 + 排序 | 3-4 天 | ✅ |
| **P4 Mac 打包** | `.app` / `.dmg` / 菜单栏常驻 + dock 隐藏 | 2-3 天 | ✅ |
| **P5 Win 打包** | `.exe` / `.msi` / 系统托盘 | 2-3 天 | ✅ |
| **P6 节日主题** | 春节 / 圣诞 / 元旦等皮肤切换 | 1-2 天 | ✅ |

**最快 2 周跑通核心，完整版约 1 个月**（按"慢慢打磨"节奏可拉长）。

## 决策记录（v1.0.0 已拍板）

- ✅ 菜单栏常驻（Mac dock 隐藏 + 菜单栏小图标）
- ❌ PWA（暂不做，专注桌面）
- ✅ GitHub 公开（沉淀作品集 + 朋友可用）
- ✅ 节日主题皮肤（春节 / 圣诞 / 元旦等）

## 上下文

- 立项：2026-08-28
- **v1.0.0 归档**：2026-08-30（git tag `v1.0.0`，共 36 commits，HEAD = `070951b`）
- 状态：🟢 已归档 + 冻结，待更新迭代时再启用
- 决策：自用 + Tauri + 认真维护
- 主导：老大（产品方向 + 终审）
- 协作：萝卜特（技术方案 + 编码 + 维护）
- **代码实际目录**：`~/Desktop/dev/time_to_slack_off/`
- **workspace 软链**：`projects/time-to-slack-off/` → Desktop 目录（参考题库项目架构）
