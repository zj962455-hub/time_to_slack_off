<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";
import { baseHourlyRate, calcWorkHoursPerDay } from "../types/salary";
import { calcActualWorkdays } from "../utils/workdays";

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

// 本月实际工作天数（自动算）= 法定 + 加班 - 请假
const actualWorkdays = computed(() =>
  calcActualWorkdays(
    now.value.year(),
    now.value.month() + 1,
    config.workdays,
    config.salary.overtimeDays,
    config.salary.leaveDays
  )
);

// 法定工作天数（用于显示）
const legalWorkdays = computed(() =>
  calcActualWorkdays(
    now.value.year(),
    now.value.month() + 1,
    config.workdays,
    0,
    0
  )
);

// 基础时薪（元/小时）—— 从月薪 + 自动工作天数 + 工作小时数算
const hourlyRate = computed(() =>
  baseHourlyRate(config.salary, config.offTime, actualWorkdays.value)
);

// 日工作小时数（自动从 startTime + offTime 算）
const workHoursPerDay = computed(() =>
  calcWorkHoursPerDay(config.salary.startTime, config.offTime)
);

// 已工作分钟数（今天从 startTime 到 now，cap 在下班时间点）
const workedMinutes = computed(() => {
  const [sh, sm] = config.salary.startTime.split(":").map(Number);
  const [oh, om] = config.offTime.split(":").map(Number);
  const start = now.value.hour(sh).minute(sm).second(0).millisecond(0);
  const off = now.value.hour(oh).minute(om).second(0).millisecond(0);

  if (now.value.isBefore(start)) return 0;

  // 过了下班时间点：capped 在完整工作时长
  if (now.value.isAfter(off) || now.value.isSame(off)) {
    return off.diff(start, "minute");
  }

  return now.value.diff(start, "minute");
});

// 已工作小时数（小数）
const workedHours = computed(() => workedMinutes.value / 60);

// 剩余分钟数
const remainingMinutes = computed(() => {
  const totalMin = workHoursPerDay.value * 60;
  return Math.max(0, totalMin - workedMinutes.value);
});

// 已获得收入（元）
const earned = computed(() => hourlyRate.value * workedHours.value);

// 今日预计总收入（保留供 meta 显示用）
// const expectedToday = computed(() => hourlyRate.value * workHoursPerDay.value);

// 进度（0-1）
const progress = computed(() => {
  if (workHoursPerDay.value <= 0) return 0;
  return Math.min(1, workedHours.value / workHoursPerDay.value);
});

const isConfigured = computed(() => config.salary.amount > 0 && workHoursPerDay.value > 0);

const salaryTypeLabel = computed(() => {
  const t = config.salary.type;
  if (t === "monthly") return "月薪";
  if (t === "daily") return "日薪";
  return "时薪";
});

// 格式化"X 小时 Y 分"
function formatHm(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} 分`;
  if (m <= 0) return `${h} 小时`;
  return `${h} 小时 ${m} 分`;
}
</script>

<template>
  <div class="tab-content">
    <template v-if="isConfigured">
      <!-- 主显示：已获得时薪 -->
      <div class="earned-row">
        <span class="currency">¥</span>
        <span class="big-number">{{ earned.toFixed(2) }}</span>
      </div>
      <div class="earned-label">已获得时薪</div>

      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress * 100 + '%' }" />
      </div>

      <!-- 进度文字 -->
      <div class="progress-text">
        已工作 <strong>{{ formatHm(workedMinutes) }}</strong> /
        剩余 {{ formatHm(remainingMinutes) }}
      </div>

      <!-- 详细 meta -->
      <div class="meta">
        ¥{{ hourlyRate.toFixed(2) }}/h ·
        {{ salaryTypeLabel }} ¥{{ config.salary.amount }} ·
        本月 {{ actualWorkdays }} 天 ({{ legalWorkdays }} 法定 + {{ config.salary.overtimeDays }} 加班 − {{ config.salary.leaveDays }} 请假)
      </div>
    </template>
    <template v-else>
      <div class="empty">未设置薪资</div>
      <div class="hint">设置 → 时薪配置</div>
    </template>
  </div>
</template>

<style scoped>
.tab-content {
  text-align: center;
  padding: 8px 0;
}

.earned-row {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  color: var(--color-primary);
  margin-bottom: 4px;
}

.currency {
  font-size: 18px;
  opacity: 0.7;
  font-weight: 300;
}

.big-number {
  font-size: 36px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.earned-label {
  font-size: 11px;
  opacity: 0.5;
  margin-bottom: 10px;
  letter-spacing: 1px;
}

.progress-bar {
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin: 8px auto;
  max-width: 280px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 6px;
}

.progress-text strong {
  font-weight: 500;
  color: var(--color-primary);
}

.meta {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 6px;
}

.meta-light {
  font-size: 11px;
  opacity: 0.4;
  margin-top: 2px;
}

.empty {
  font-size: 14px;
  opacity: 0.5;
}

.hint {
  font-size: 11px;
  opacity: 0.4;
  margin-top: 4px;
}
</style>