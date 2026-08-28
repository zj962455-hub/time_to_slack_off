/**
 * 工作日计算工具
 */

import dayjs from "dayjs";
import { isHoliday } from "./holiday";

/**
 * 计算指定年月的法定工作天数
 *
 * 算法：
 * - 遍历本月每天
 * - 是工作日（默认周一到周五）且不是法定节假日 → 计数 +1
 * - 不考虑调休补班（调休补班日视为工作日，会被工作日判定覆盖）
 *
 * 注意：返回的是本月"应该上班的天数"，不含加班天数 / 不减请假天数。
 *       实际工作天数 = 法定工作天数 + 加班天数 - 请假天数
 */
export function calcLegalWorkdays(
  year: number,
  month: number, // 1-12
  workdays: number[] = [1, 2, 3, 4, 5]
): number {
  const monthStr = String(month).padStart(2, "0");
  const start = dayjs(`${year}-${monthStr}-01`).startOf("month");
  const end = start.endOf("month");
  let count = 0;
  let day = start;
  while (day.isBefore(end) || day.isSame(end, "day")) {
    if (workdays.includes(day.day()) && !isHoliday(day)) {
      count++;
    }
    day = day.add(1, "day");
  }
  return count;
}

/**
 * 计算指定年月的实际工作天数
 * = 法定工作天数 + 加班天数 - 请假天数（最低 0）
 */
export function calcActualWorkdays(
  year: number,
  month: number,
  workdays: number[],
  overtimeDays: number = 0,
  leaveDays: number = 0
): number {
  const legal = calcLegalWorkdays(year, month, workdays);
  return Math.max(0, legal + overtimeDays - leaveDays);
}