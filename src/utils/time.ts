import dayjs from "dayjs";

/**
 * 格式化倒计时秒数为 HH:MM:SS
 */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * 计算从 now 到目标 HH:MM 的秒数
 * @returns >= 0：今天到下班时间，< 0：已下班（下次 24h 后）
 */
export function secondsUntil(target: string, now: dayjs.Dayjs = dayjs()): number {
  const [h, m] = target.split(":").map(Number);
  let off = now.hour(h).minute(m).second(0).millisecond(0);
  if (off.isBefore(now)) {
    off = off.add(1, "day");
  }
  return off.diff(now, "second");
}

/**
 * 判断是否为周末
 */
export function isWeekend(date: dayjs.Dayjs): boolean {
  const day = date.day(); // 0=Sun, 6=Sat
  return day === 0 || day === 6;
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