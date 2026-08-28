/**
 * Tab 类型定义
 */

export type TabType =
  | "weekend" // 距离周末
  | "salary-day" // 距离发薪日
  | "holiday" // 距离最近节假日
  | "hourly" // 时薪（v2 扩展）
  | "custom-holiday" // 自定义节假日（v2 扩展）
  | "custom-date" // 自定义计划日（v2 扩展）

export interface TabConfig {
  id: string
  type: TabType
  label: string
  enabled: boolean
  order: number
  config?: TabTypeConfig
}

// 各类型的专属配置（type → config 形状）
export type TabTypeConfig =
  | WeekendConfig
  | SalaryDayConfig
  | HolidayConfig
  | HourlyConfig
  | CustomHolidayConfig
  | CustomDateConfig
  | Record<string, never>

export interface WeekendConfig {
  // 默认无配置，使用 store.workdays
}

export interface SalaryDayConfig {
  day: number // 每月发薪日（1-31）
}

export interface HolidayConfig {
  // 默认无配置，使用内置 JSON
}

export interface HourlyConfig {
  // 时薪无需额外配置，从 store.salary 读
}

export interface CustomHolidayConfig {
  // 自定义假期无需额外配置，从 store.customHolidays 读
}

export interface CustomDateConfig {
  // 自定义日期无需额外配置，从 store.customDates 读
}

// 默认 3 个 tab 的初始配置
export const DEFAULT_TABS: Omit<TabConfig, "id">[] = [
  {
    type: "weekend",
    label: "距离周末",
    enabled: true,
    order: 1,
  },
  {
    type: "salary-day",
    label: "距离发薪",
    enabled: true,
    order: 2,
    config: { day: 15 },
  },
  {
    type: "holiday",
    label: "距离最近节假日",
    enabled: true,
    order: 3,
  },
]

// 用户可添加的 tab 类型
export const ADDABLE_TABS: TabType[] = [
  "weekend",
  "salary-day",
  "holiday",
  "hourly",
  "custom-holiday",
  "custom-date",
]