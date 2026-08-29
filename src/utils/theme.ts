/**
 * 主题检测 + 解析
 *
 * 自动模式：根据当前日期推荐合适的主题
 * 手动模式：用户设置的主题直接使用
 */
import dayjs from "dayjs";
import type { ThemeId } from "../styles/themes";

/**
 * 自动检测：根据当前日期推荐主题
 *
 * 阳历节日（按 mm-dd 范围匹配）：
 * - 元旦：12.27 - 1.3
 * - 情人节：2.13 - 2.15
 * - 清明：4.4 - 4.6（接近阳历日期）
 * - 端午：6.18 - 6.22（简化阳历近似）
 * - 中秋：9.15 - 9.25（简化阳历近似）
 * - 国庆：10.1 - 10.7
 * - 圣诞：12.20 - 12.26
 *
 * 春节：用阳历近似（农历转换需要额外库，先用近似区间 1.21 - 2.19）
 * 元宵：紧跟春节 1.22 - 2.25
 */
export function autoDetectTheme(now: dayjs.Dayjs = dayjs()): ThemeId {
  const m = now.month() + 1; // 1-12
  const d = now.date();
  const md = m * 100 + d; // MMDD 数字便于比较

  // 元旦（含跨年缓冲）
  if (md >= 1227 || md <= 103) return "new-year";

  // 春节近似（1.21 - 2.19）
  if (md >= 121 && md <= 219) return "spring";

  // 元宵（紧跟春节，2.5 - 2.25）
  if (md >= 205 && md <= 225) return "lantern";

  // 情人节
  if (md >= 213 && md <= 215) return "valentine";

  // 清明（4.4 - 4.6）
  if (md >= 404 && md <= 406) return "qingming";

  // 端午近似（5.30 - 6.5）
  if (md >= 530 && md <= 605) return "dragon";

  // 中秋近似（9.15 - 9.25）
  if (md >= 915 && md <= 925) return "mid-autumn";

  // 国庆（10.1 - 10.7）
  if (md >= 1001 && md <= 1007) return "national";

  // 圣诞（12.20 - 12.26）
  if (md >= 1220 && md <= 1226) return "christmas";

  return "default";
}

/**
 * 解析用户设置：auto 时返回检测结果，否则返回用户选择
 */
export function resolveTheme(setting: ThemeId | "auto", now: dayjs.Dayjs = dayjs()): ThemeId {
  if (setting === "auto") {
    return autoDetectTheme(now);
  }
  return setting;
}
