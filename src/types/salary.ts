/**
 * 时薪配置
 */

export type SalaryType = "monthly" | "daily" | "hourly"

export interface SalaryConfig {
  type: SalaryType
  amount: number           // 金额（元）
  startTime: string        // 上班时间 HH:MM（默认 09:00）
  overtimeDays: number     // 本月加班天数（默认 0）
  leaveDays: number        // 本月请假天数（默认 0）
  payDay: number           // 每月发薪日（1-31，默认 15）
}

export const DEFAULT_SALARY: SalaryConfig = {
  type: "monthly",
  amount: 0,
  startTime: "09:00",
  overtimeDays: 0,
  leaveDays: 0,
  payDay: 15,
}

/**
 * 从 startTime + offTime 计算工作小时数
 */
export function calcWorkHoursPerDay(startTime: string, offTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number)
  const [oh, om] = offTime.split(":").map(Number)
  let mins = (oh * 60 + om) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60
  return mins / 60
}

/**
 * 计算基础时薪（元/小时）
 * 需要传入：
 * - offTime：下班时间（从 store.offTime）
 * - actualWorkdays：本月实际工作天数（自动算）
 */
export function baseHourlyRate(
  salary: SalaryConfig,
  offTime: string = "18:00",
  actualWorkdays: number = 21.75
): number {
  const workHours = calcWorkHoursPerDay(salary.startTime, offTime)
  if (workHours <= 0 || actualWorkdays <= 0) return 0
  if (salary.type === "hourly") return salary.amount
  if (salary.type === "daily") return salary.amount / workHours
  // monthly
  return salary.amount / actualWorkdays / workHours
}