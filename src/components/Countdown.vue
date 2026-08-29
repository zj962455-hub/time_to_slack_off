<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";
import { isWorkday as checkIsWorkday } from "../utils/holiday";
import { formatCountdown, secondsUntilNextWorkdayStart } from "../utils/time";

const props = defineProps<{
  offTime: string;
}>();

const config = useConfigStore();
const now = ref(dayjs());
let timer: number | null = null;

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = dayjs();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

/**
 * 今天是否需要上班（考虑调休 + 假期覆盖 + 用户自定义工作日）
 */
const isWorkday = computed(() => {
  return checkIsWorkday(now.value, config.workdays, config.holidayOverrides);
});

/**
 * 当前是否在上班时间段内（仅工作日有效）
 */
const isWorkPeriod = computed(() => {
  if (!isWorkday.value) return false;
  const start = config.salary?.startTime || "09:00";
  const [sh, sm] = start.split(":").map(Number);
  const [oh, om] = props.offTime.split(":").map(Number);

  const nowMin = now.value.hour() * 60 + now.value.minute();
  const startMin = sh * 60 + sm;
  const offMin = oh * 60 + om;

  return nowMin >= startMin && nowMin < offMin;
});

/**
 * 距离下班的秒数（仅工作日上班期间有效）
 */
const remainingSeconds = computed(() => {
  if (!isWorkPeriod.value) return 0;
  const [h, m] = props.offTime.split(":").map(Number);
  const off = now.value.hour(h).minute(m).second(0).millisecond(0);
  return Math.max(0, off.diff(now.value, "second"));
});

/**
 * 距离「下一次上班时间」的秒数（休息日 / 下班后有效）
 */
const nextStartSeconds = computed(() => {
  return secondsUntilNextWorkdayStart(
    config.salary?.startTime || "09:00",
    config.workdays,
    config.holidayOverrides,
    now.value
  );
});

/**
 * 周几趣味文案（按 dayjs 的 day() 取：0=周日）
 */
const WEEKDAY_QUOTES: Record<number, string> = {
  0: "周日周日，大限将至",
  1: "周一周一，奄奄一息",
  2: "周二周二，命剩一半儿",
  3: "周三周三，熬过难关",
  4: "周四周四，逐渐放肆",
  5: "周五周五，敲锣打鼓",
  6: "周六周六，大鱼大肉",
};
const quote = computed(() => WEEKDAY_QUOTES[now.value.day()] ?? "");

/**
 * 顶部 label（统一语义：距离下班 / 距离上班）
 */
const label = computed(() => (isWorkPeriod.value ? "距离下班" : "距离上班"));

/**
 * 显示的倒计时数字
 */
const display = computed(() =>
  isWorkPeriod.value
    ? formatCountdown(remainingSeconds.value)
    : formatCountdown(nextStartSeconds.value)
);
</script>

<template>
  <div class="countdown-wrapper">
    <div class="countdown">
      <span class="label">{{ label }}</span>
      <span class="time">{{ display }}</span>
    </div>
    <div class="quote">{{ quote }}</div>
  </div>
</template>

<style scoped>
.countdown-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.countdown {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
  user-select: none;
  white-space: nowrap;
  min-width: 0;
}

.label {
  font-size: var(--text-xs);
  font-weight: 400;
  color: var(--color-text); /* 跟随主题：浅色模式近黑，深色模式近白，与 widget 背景反色 */
  letter-spacing: 0.3px;
  white-space: nowrap;
}

.time {
  font-size: var(--text-2xl);
  font-weight: 300;
  font-feature-settings: "tnum";
  letter-spacing: 0.5px;
  color: var(--color-primary);
  font-family: var(--font-mono);
  line-height: 1;
  white-space: nowrap;
}

.quote {
  font-size: 10px;
  color: var(--color-text);
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  letter-spacing: 0.3px;
  margin-top: 1px;
  max-width: 100%;
}
</style>