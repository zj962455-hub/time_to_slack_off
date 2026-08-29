import dayjs from "dayjs";
import { isWorkday, type HolidayOverride } from "./holiday";

/**
 * 格式化倒计时秒数为 HH:MM:SS
 */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.max(0, seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 判断是否为周末
 */
export function isWeekend(date: dayjs.Dayjs): boolean {
  const day = date.day(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
}

/**
 * 距下一次「上班时间」还有多少秒
 *
 * 语义：
 * - 今天就是工作日，且 now < startTime → 今天的 startTime
 * - 其他情况 → 下一个工作日的 startTime
 * - 找不到（超过 14 天没有工作日） → 返回 0
 *
 * 用于：下班后 / 休息日 → 显示距离下次上班的倒计时
 */
export function secondsUntilNextWorkdayStart(
  startTime: string,
  workdays: number[],
  overrides: HolidayOverride[],
  now: dayjs.Dayjs = dayjs()
): number {
  const [sh, sm] = startTime.split(":").map(Number);

  // 今天就是工作日，且还没到 startTime → 用今天的 startTime
  if (isWorkday(now, workdays, overrides)) {
    const todayStart = now.hour(sh).minute(sm).second(0).millisecond(0);
    if (now.isBefore(todayStart)) {
      return todayStart.diff(now, "second");
    }
  }

  // 找下一个工作日（最多搜 14 天，覆盖国庆 + 年假）
  for (let i = 1; i <= 14; i++) {
    const d = now.add(i, "day");
    if (isWorkday(d, workdays, overrides)) {
      const nextStart = d.hour(sh).minute(sm).second(0).millisecond(0);
      return nextStart.diff(now, "second");
    }
  }

  return 0;
}

/**
 * 距发薪日还有几天
 * @param payDay 每月发薪日（1-31）
 */
export function daysUntilPayday(payDay: number, now: dayjs.Dayjs = dayjs()): number {
  const today = now.date();
  if (today < payDay) {
    return payDay - today;
  } else if (today === payDay) {
    return 0;
  } else {
    // 下个月
    return now.add(1, "month").date(payDay).diff(now.startOf("day"), "day");
  }
}

/**
 * 距周末还有几天
 * @param workdays 工作日数组（默认 [1,2,3,4,5]）
 */
export function daysUntilWeekend(workdays: number[] = [1, 2, 3, 4, 5], now: dayjs.Dayjs = dayjs()): number {
  for (let i = 0; i < 7; i++) {
    const day = now.add(i, "day");
    const isWorkday = workdays.includes(day.day());
    if (!isWorkday) {
      return i === 0 ? 0 : i;
    }
  }
  return 7;
}