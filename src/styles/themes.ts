/**
 * 节日主题系统
 *
 * 主题通过 CSS Variables + widget-body 上的 class 切换。
 * 每个主题定义一组颜色，覆盖 :root 默认的 colors。
 *
 * 自动检测：utils/theme.ts 根据当前日期推荐 useThemeId
 * 手动覆盖：SettingsView 的主题选择（持久化到 config.theme）
 */

export type ThemeId =
  | "default"
  | "spring"     // 春节
  | "lantern"    // 元宵
  | "qingming"   // 清明
  | "dragon"     // 端午
  | "mid-autumn" // 中秋
  | "national"   // 国庆
  | "new-year"   // 元旦
  | "christmas"  // 圣诞
  | "valentine"; // 情人节

export interface ThemeColors {
  /** widget body 背景渐变 */
  bgGradient: string;
  /** 描边颜色 */
  border: string;
  /** 标题文字(距离周末/距离中秋节等) */
  label: string;
  /** 大数字(0/12/27 等) */
  bigNumber: string;
  /** 配色 2(用于 hourly tab 等) */
  secondary: string;
  /** 标签背景色 */
  tabBg: string;
  /** 装饰 emoji(可选,widget 角落) */
  emoji?: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  emoji: string;
  colors: ThemeColors;
}

export const THEMES: Record<ThemeId, Theme> = {
  default: {
    id: "default",
    name: "默认",
    emoji: "🐟",
    colors: {
      bgGradient: "rgba(30, 30, 35, 0.88)",
      border: "rgba(255, 255, 255, 0.18)",
      label: "var(--color-text)",
      bigNumber: "var(--color-secondary)",
      secondary: "var(--color-secondary)",
      tabBg: "rgba(40, 40, 45, 0.85)",
    },
  },

  spring: {
    id: "spring",
    name: "春节",
    emoji: "🧧",
    colors: {
      // 红金喜庆
      bgGradient:
        "linear-gradient(135deg, rgba(200, 16, 46, 0.92) 0%, rgba(139, 0, 0, 0.92) 100%)",
      border: "rgba(255, 215, 0, 0.45)",
      label: "#ffd700", // 金色
      bigNumber: "#ffd700",
      secondary: "#ff6b35", // 暖橙
      tabBg: "rgba(180, 30, 50, 0.6)",
      emoji: "🧧",
    },
  },

  lantern: {
    id: "lantern",
    name: "元宵",
    emoji: "🏮",
    colors: {
      // 红橙灯笼
      bgGradient:
        "linear-gradient(135deg, rgba(220, 50, 30, 0.92) 0%, rgba(255, 140, 0, 0.88) 100%)",
      border: "rgba(255, 220, 100, 0.5)",
      label: "#ffeb3b",
      bigNumber: "#fff59d",
      secondary: "#ff8a65",
      tabBg: "rgba(200, 80, 40, 0.6)",
      emoji: "🏮",
    },
  },

  qingming: {
    id: "qingming",
    name: "清明",
    emoji: "🌿",
    colors: {
      // 青绿素雅
      bgGradient:
        "linear-gradient(135deg, rgba(46, 125, 50, 0.85) 0%, rgba(102, 187, 106, 0.85) 100%)",
      border: "rgba(200, 230, 201, 0.4)",
      label: "#e8f5e9",
      bigNumber: "#a5d6a7",
      secondary: "#66bb6a",
      tabBg: "rgba(56, 142, 60, 0.5)",
      emoji: "🌿",
    },
  },

  dragon: {
    id: "dragon",
    name: "端午",
    emoji: "🐉",
    colors: {
      // 翠绿艾草
      bgGradient:
        "linear-gradient(135deg, rgba(0, 100, 60, 0.9) 0%, rgba(46, 125, 50, 0.9) 100%)",
      border: "rgba(255, 235, 59, 0.4)",
      label: "#fff9c4",
      bigNumber: "#ffeb3b",
      secondary: "#d4a017",
      tabBg: "rgba(20, 110, 70, 0.6)",
      emoji: "🐉",
    },
  },

  "mid-autumn": {
    id: "mid-autumn",
    name: "中秋",
    emoji: "🌕",
    colors: {
      // 暖月金
      bgGradient:
        "linear-gradient(135deg, rgba(255, 143, 0, 0.88) 0%, rgba(191, 54, 12, 0.92) 100%)",
      border: "rgba(255, 224, 130, 0.5)",
      label: "#fff3e0",
      bigNumber: "#ffe082",
      secondary: "#ffb74d",
      tabBg: "rgba(230, 110, 20, 0.55)",
      emoji: "🌕",
    },
  },

  national: {
    id: "national",
    name: "国庆",
    emoji: "🇨🇳",
    colors: {
      // 中国红
      bgGradient:
        "linear-gradient(135deg, rgba(222, 41, 16, 0.92) 0%, rgba(241, 169, 54, 0.85) 100%)",
      border: "rgba(255, 215, 0, 0.5)",
      label: "#ffeb3b",
      bigNumber: "#ffd54f",
      secondary: "#ff8a65",
      tabBg: "rgba(222, 41, 16, 0.6)",
      emoji: "🇨🇳",
    },
  },

  "new-year": {
    id: "new-year",
    name: "元旦",
    emoji: "🎊",
    colors: {
      // 蓝白冬日
      bgGradient:
        "linear-gradient(135deg, rgba(33, 87, 154, 0.9) 0%, rgba(165, 199, 234, 0.85) 100%)",
      border: "rgba(220, 235, 250, 0.5)",
      label: "#e3f2fd",
      bigNumber: "#bbdefb",
      secondary: "#64b5f6",
      tabBg: "rgba(33, 87, 154, 0.55)",
      emoji: "🎊",
    },
  },

  christmas: {
    id: "christmas",
    name: "圣诞",
    emoji: "🎄",
    colors: {
      // 红绿圣诞
      bgGradient:
        "linear-gradient(135deg, rgba(168, 28, 38, 0.92) 0%, rgba(13, 110, 58, 0.92) 100%)",
      border: "rgba(255, 235, 59, 0.5)",
      label: "#ffeb3b",
      bigNumber: "#ffeb3b",
      secondary: "#a5d6a7",
      tabBg: "rgba(168, 28, 38, 0.55)",
      emoji: "🎄",
    },
  },

  valentine: {
    id: "valentine",
    name: "情人节",
    emoji: "💝",
    colors: {
      // 粉红浪漫
      bgGradient:
        "linear-gradient(135deg, rgba(233, 30, 99, 0.9) 0%, rgba(255, 64, 129, 0.9) 100%)",
      border: "rgba(255, 205, 210, 0.5)",
      label: "#fff5f8",
      bigNumber: "#ffeb3b",
      secondary: "#f48fb1",
      tabBg: "rgba(233, 30, 99, 0.5)",
      emoji: "💝",
    },
  },
};

export const THEME_LIST: Theme[] = Object.values(THEMES);
