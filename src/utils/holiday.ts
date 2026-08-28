/**
 * 节假日工具函数
 *
 * 数据源：
 * - data/holidays-{year}.json（国务院办公厅公告）
 * - 用户层 holidayOverrides（在 config store 里）
 */

import dayjs from "dayjs";
import holidays2025 from "../../data/holidays-2025.json";
import holidays2026 from "../../data/holidays-2026.json";

// ===== 类型定义 =====

export interface Holiday {
  name: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  days: number;
  note?: string;
}

export interface WorkdayMakeup {
  date: string; // YYYY-MM-DD
  reason: string;
}

export interface HolidayYear {
  year: number;
  source?: string;
  url?: string;
  holidays: Holiday[];
  workdays: WorkdayMakeup[];
}

export interface HolidayOverride {
  date: string;
  type: "holiday" | "workday"; // 强制设为节假日 / 工作日
  reason?: string;
}

// ===== 内置数据加载 =====

const BUILTIN: Record<number, HolidayYear> = {
  2025: holidays2025 as HolidayYear,
  2026: holidays2026 as HolidayYear,
};

/**
 * 获取某年的内置节假日数据
 * @returns HolidayYear | null（如果没有该年数据）
 */
export function getYearData(year: number): HolidayYear | null {
  return BUILTIN[year] || null;
}

/**
 * 列出已内置数据的年份
 */
export function availableYears(): number[] {
  return Object.keys(BUILTIN).map(Number).sort();
}

// ===== 核心判断函数 =====

/**
 * 判断指定日期是否为法定节假日
 */
export function isHoliday(date: dayjs.Dayjs, overrides: HolidayOverride[] = []): boolean {
  const ds = date.format("YYYY-MM-DD");

  // override 优先
  const override = overrides.find((o) => o.date === ds);
  if (override) {
    return override.type === "holiday";
  }

  const yearData = BUILTIN[date.year()];
  if (!yearData) return false;

  return yearData.holidays.some((h) => ds >= h.start && ds <= h.end);
}

/**
 * 判断指定日期是否为调休补班日
 */
export function isMakeupWorkday(date: dayjs.Dayjs): boolean {
  const yearData = BUILTIN[date.year()];
  if (!yearData) return false;

  const ds = date.format("YYYY-MM-DD");
  return yearData.workdays.some((w) => w.date === ds);
}

/**
 * 判断指定日期是否为工作日
 *
 * 规则：
 * - 法定节假日 → false
 * - 调休补班日 → true
 * - 周一~周五 → true
 * - 周六周日 → false
 * - override 优先
 */
export function isWorkday(
  date: dayjs.Dayjs,
  workdays: number[] = [1, 2, 3, 4, 5],
  overrides: HolidayOverride[] = []
): boolean {
  const ds = date.format("YYYY-MM-DD");

  // override 优先
  const override = overrides.find((o) => o.date === ds);
  if (override) {
    return override.type === "workday";
  }

  // 调休补班日 → 工作日
  if (isMakeupWorkday(date)) return true;

  // 法定节假日 → 非工作日
  if (isHoliday(date, [])) return false;

  // 普通周末/工作日
  const day = date.day(); // 0=Sun, 6=Sat
  return workdays.includes(day);
}

/**
 * 判断是否为周末（不考虑调休）
 */
export function isWeekend(date: dayjs.Dayjs): boolean {
  const day = date.day();
  return day === 0 || day === 6;
}

// ===== 距离计算 =====

/**
 * 距下一个法定节假日还有几天
 *
 * 包含两种语义：
 * - 今天就是节假日 → 返回 0（"现在就是！摸鱼中"）
 * - 下一个节假日距离今天还有 N 天
 */
export function daysUntilNextHoliday(
  from: dayjs.Dayjs = dayjs(),
  overrides: HolidayOverride[] = []
): { days: number; name: string } | null {
  const today = from.startOf("day");

  // 今天就是节假日
  if (isHoliday(from, overrides)) {
    const info = getHolidayInfo(from);
    if (info) return { days: 0, name: info.name };
  }

  // 搜索接下来 60 天（足够覆盖跨年长假期）
  for (let i = 1; i <= 60; i++) {
    const d = today.add(i, "day");
    const ds = d.format("YYYY-MM-DD");
    const yearData = BUILTIN[d.year()];
    if (!yearData) continue;

    // override 标记为节假日的也算
    if (overrides.some((o) => o.date === ds && o.type === "holiday")) {
      const override = overrides.find((o) => o.date === ds);
      return { days: i, name: override?.reason || "自定义假期" };
    }

    // 内置节假日（取首个匹配日）
    const holiday = yearData.holidays.find((h) => h.start === ds);
    if (holiday) {
      return { days: i, name: holiday.name };
    }
  }

  return null;
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
    // 已过本月发薪日 → 下个月
    return now.add(1, "month").startOf("month").add(payDay - 1, "day").diff(now.startOf("day"), "day");
  }
}

/**
 * 距周末还有几天
 * @param workdays 工作日数组（默认 [1,2,3,4,5]）
 * @returns 0 表示今天就是周末
 */
export function daysUntilWeekend(
  workdays: number[] = [1, 2, 3, 4, 5],
  now: dayjs.Dayjs = dayjs()
): number {
  // 今天就是非工作日 → 0
  const todayDow = now.day();
  if (!workdays.includes(todayDow)) return 0;

  for (let i = 1; i <= 7; i++) {
    const d = now.add(i, "day");
    if (!workdays.includes(d.day())) {
      return i;
    }
  }
  return 7;
}

// ===== 信息查询 =====

/**
 * 获取指定日期的放假信息
 */
export function getHolidayInfo(date: dayjs.Dayjs): Holiday | null {
  const yearData = BUILTIN[date.year()];
  if (!yearData) return null;
  const ds = date.format("YYYY-MM-DD");
  return yearData.holidays.find((h) => ds >= h.start && ds <= h.end) || null;
}

/**
 * 获取指定日期的调休信息
 */
export function getMakeupInfo(date: dayjs.Dayjs): WorkdayMakeup | null {
  const yearData = BUILTIN[date.year()];
  if (!yearData) return null;
  const ds = date.format("YYYY-MM-DD");
  return yearData.workdays.find((w) => w.date === ds) || null;
}

/**
 * 列出指定年份的所有节假日
 */
export function listHolidays(year: number): Holiday[] {
  return BUILTIN[year]?.holidays || [];
}

/**
 * 列出指定年份的所有调休
 */
export function listWorkdays(year: number): WorkdayMakeup[] {
  return BUILTIN[year]?.workdays || [];
}

// ===== 时薪倍数（仅供计算参考） =====

/**
 * 计算指定日期的时薪倍数
 *
 * 规则：
 * - 法定节假日 → 3x
 * - 周末（非调休）→ 2x
 * - 调休工作日 → 1x
 * - 普通工作日 → 1x
 */
export function salaryMultiplier(date: dayjs.Dayjs, overrides: HolidayOverride[] = []): number {
  const ds = date.format("YYYY-MM-DD");
  const override = overrides.find((o) => o.date === ds);

  if (override) {
    return override.type === "holiday" ? 3 : 1;
  }

  if (isHoliday(date, [])) return 3;
  if (isMakeupWorkday(date)) return 1;

  const day = date.day();
  if (day === 0 || day === 6) return 2;

  return 1;
}