<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";
import { isWorkday as checkIsWorkday } from "../utils/holiday";

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
 * 判断当前时间是否在上班时间段内（仅当 isWorkday 时才有可能为 true）
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

const remaining = computed(() => {
  if (!isWorkPeriod.value) return "";
  const [h, m] = props.offTime.split(":").map(Number);
  const off = now.value.hour(h).minute(m).second(0).millisecond(0);
  const diff = off.diff(now.value, "second");
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
</script>

<template>
  <div class="countdown">
    <span class="label">
      <template v-if="!isWorkday">休息日</template>
      <template v-else-if="isWorkPeriod">距离下班</template>
      <template v-else>已下班</template>
    </span>
    <span class="time" :class="{ off: !isWorkPeriod || !isWorkday }">
      <template v-if="!isWorkday">—</template>
      <template v-else-if="isWorkPeriod">{{ remaining }}</template>
      <template v-else>— : — : —</template>
    </span>
  </div>
</template>

<style scoped>
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
  color: var(--color-text-muted);
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

.time.off {
  color: var(--color-text-subtle);
}
</style>