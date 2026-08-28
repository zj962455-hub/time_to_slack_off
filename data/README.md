# 节假日数据

> 摸鱼时钟内置的法定节假日数据，用于：
> - 判断工作日 / 法定节假日 / 调休
> - 计算距离最近节假日
> - 时薪倍数（1x / 2x / 3x）

## 文件结构

```
data/
├── README.md          # 本文件
├── holidays-2025.json
├── holidays-2026.json
└── holidays-2027.json
```

## JSON Schema

```ts
interface HolidayYear {
  year: number              // 年份
  source: string           // 数据来源（如"国务院办公厅 2024-11-12 通知"）
  holidays: Holiday[]      // 法定节假日列表
  workdays: WorkdayMakeup[] // 调休补班日
}

interface Holiday {
  name: string             // 节日名称（"春节"、"国庆节"等）
  start: string            // 起始日期 YYYY-MM-DD
  end: string              // 结束日期 YYYY-MM-DD（与 start 相同则为 1 天）
  days: number             // 放假天数（end - start + 1）
  note?: string            // 备注（如"含中秋节 10 月 6 日"）
}

interface WorkdayMakeup {
  date: string             // YYYY-MM-DD
  reason: string           // 调休原因（"春节调休上班"）
}
```

## 数据来源

**主源**：国务院办公厅公告（每年 11-12 月发布次年放假安排）
- 2025 年：[国务院办公厅关于 2025 年部分节假日安排的通知](https://www.gov.cn/)
- 2026 年：[国务院办公厅关于 2026 年部分节假日安排的通知](https://www.gov.cn/)
- 2027 年：待 2026-11 发布

**备用**：holiday.112800.xyz（在线 API，自动 fallback）

## 更新流程

1. **每年 12 月** 关注国务院办公厅通知
2. **手动更新** `data/holidays-<year>.json`
3. **验证** JSON 格式正确（`pnpm tauri dev` 启动后查看设置界面节假日 tab 是否正常）
4. **提交** git commit 写清楚数据源

## 特殊工种覆盖

应用内用户可以在设置界面添加 **holiday overrides**，把某些日期强制设为假期或工作日（不影响内置 JSON）。

## 已知边界

- ❌ 不含港澳台节假日
- ❌ 不含少数民族节日（藏历新年 / 古尔邦节等）
- ❌ 不含地方性节日
- ✅ 国务院公告的全国法定节假日 + 调休