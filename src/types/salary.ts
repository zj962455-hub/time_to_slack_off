/**
 * 时薪配置
 */

export type SalaryType = "monthly" | "daily" | "hourly"

export interface SalaryConfig {
  type: SalaryType
  amount: number           // 金额（元）
  workdaysPerMonth: number // 每月工作天数（默认 21.75）
  workHoursPerDay: number  // 每天工作小时（默认 8）
}

export const DEFAULT_SALARY: SalaryConfig = {
  type: "monthly",
  amount: 0,
  workdaysPerMonth: 21.75,
  workHoursPerDay: 8,
}

/**
 * 计算基础时薪（元/小时）
 */
export function baseHourlyRate(salary: SalaryConfig): number {
  if (salary.type === "hourly") return salary.amount
  if (salary.type === "daily") return salary.amount / salary.workHoursPerDay
  // monthly
  return salary.amount / salary.workdaysPerMonth / salary.workHoursPerDay
}