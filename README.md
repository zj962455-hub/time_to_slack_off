# ⏰ time-to-slack-off · 摸鱼时钟

> 打工人桌面摸鱼小组件 · Win / Mac 双端

## 📦 v1.0.0 已发布 (2026-08-30)

## 项目结构

```
time-to-slack-off/
├── README.md # 本文件
├── TASKS.md # 任务拆解 + 进度
├── DATA-SCHEMA.md # 数据结构设计
├── src/ # 前端 (Vue 3)
│ ├── views/
│ │ ├── Main.vue # 主界面
│ │ └── Settings.vue # 设置界面
│ ├── components/
│ │ ├── Countdown.vue # 倒计时组件
│ │ └── Tab.vue # 单个 tab
│ ├── stores/
│ │ └── config.ts # 用户配置
│ ├── utils/
│ │ ├── holiday.ts # 节假日计算
│ │ └── time.ts # 时间工具
│ └── styles/
│ └── variables.css # CSS 变量
├── src-tauri/ # Tauri / Rust 后端
│ └── tauri.conf.json
├── data/
│ └── holidays-2026.json # 内置节假日数据
└── package.json
```
