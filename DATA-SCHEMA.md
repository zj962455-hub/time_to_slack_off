# DATA-SCHEMA · 数据结构

## 1. 用户配置 (`config.json`)

存于 tauri-plugin-store，全局单文件。

```ts
interface AppConfig {
  // 下班时间（24h 制）
  offTime: string  // "18:00"
  
  // 工作日设置（默认周一到周五）
  workdays: number[]  // [1, 2, 3, 4, 5]  // 0=周日
  
  // Tab 配置（最多 5 个）
  tabs: TabConfig[]
  
  // 节假日 override（特殊工种覆盖）
  holidayOverrides: HolidayOverride[]
  
  // 时薪设置
  salary: SalaryConfig
  
  // UI 偏好
  ui: {
    theme: 'light' | 'dark' | 'auto'
    fontSize: 'small' | 'medium' | 'large'
  }
}

interface TabConfig {
  id: string           // uuid
  type: TabType        // tab 类型
  label: string        // 显示名称（可自定义）
  enabled: boolean     // 是否启用
  order: number        // 排序
  config?: any         // tab 专属配置
}

type TabType = 
  | 'weekend'         // 距离周末
  | 'salary-day'      // 距离发薪日
  | 'holiday'         // 距离最近节假日
  | 'hourly'          // 时薪
  | 'custom-holiday'  // 自定义节假日
  | 'custom-date'     // 自定义计划日

interface SalaryConfig {
  type: 'monthly' | 'daily' | 'hourly'
  amount: number        // 金额（元）
  workdaysPerMonth?: number  // 每月工作天数（默认 21.75）
  workHoursPerDay?: number   // 每天工作小时（默认 8）
}

interface HolidayOverride {
  date: string          // "2026-02-14"
  type: 'holiday' | 'workday'  // 强制设为节假日 / 工作日
  reason?: string       // 原因（特殊工种备注）
}
```

## 2. 内置节假日数据 (`holidays-{year}.json`)

打包进 app，每年一个文件。

```ts
interface HolidayYear {
  year: number
  // 法定节假日
  holidays: Holiday[]
  // 调休补班日
  workdays: WorkdayMakeup[]
}

interface Holiday {
  name: string          // "春节"
  start: string         // "2026-02-17" (YYYY-MM-DD)
  end: string           // "2026-02-23"
  type?: 'national'     // 国家级
}

interface WorkdayMakeup {
  date: string          // "2026-02-14"
  reason: string        // "春节调休上班"
}
```

## 3. 示例完整 config.json

```json
{
  "offTime": "18:00",
  "workdays": [1, 2, 3, 4, 5],
  "tabs": [
    {
      "id": "t-001",
      "type": "weekend",
      "label": "距离周末",
      "enabled": true,
      "order": 1
    },
    {
      "id": "t-002",
      "type": "salary-day",
      "label": "距离发薪",
      "enabled": true,
      "order": 2,
      "config": { "day": 15 }
    },
    {
      "id": "t-003",
      "type": "holiday",
      "label": "距离最近节假日",
      "enabled": true,
      "order": 3
    },
    {
      "id": "t-004",
      "type": "hourly",
      "label": "今日时薪",
      "enabled": false,
      "order": 4,
      "config": { "monthly": 20000, "workdaysPerMonth": 21.75 }
    },
    {
      "id": "t-005",
      "type": "custom-date",
      "label": "老大的生日",
      "enabled": false,
      "order": 5,
      "config": { "date": "10-15", "recurring": true }
    }
  ],
  "holidayOverrides": [],
  "salary": {
    "type": "monthly",
    "amount": 20000,
    "workdaysPerMonth": 21.75,
    "workHoursPerDay": 8
  },
  "ui": {
    "theme": "auto",
    "fontSize": "medium"
  }
}
```

## 4. 时薪计算公式

```ts
function calculateHourlyRate(
  now: Date,
  config: SalaryConfig,
  isHoliday: boolean,
  isWeekend: boolean,
  isMakeupWorkday: boolean
): number {
  const { type, amount, workdaysPerMonth = 21.75, workHoursPerDay = 8 } = config
  
  // 基础时薪
  let hourlyBase = 0
  if (type === 'monthly') {
    hourlyBase = amount / workdaysPerMonth / workHoursPerDay
  } else if (type === 'daily') {
    hourlyBase = amount / workHoursPerDay
  } else {
    hourlyBase = amount
  }
  
  // 倍数
  let multiplier = 1
  if (isHoliday) multiplier = 3
  else if (isWeekend && !isMakeupWorkday) multiplier = 2
  
  return hourlyBase * multiplier
}
```

## 5. 文件存储位置

**Tauri 应用：**
- macOS: `~/Library/Application Support/fish-clock/config.json`
- Windows: `%APPDATA%/fish-clock/config.json`

**Web (PWA)：**
- `localStorage['time-to-slack-off-config']`
