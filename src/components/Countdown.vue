<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";

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
 * 判断当前时间是否在上班时间段内（默认 09:00 - 18:00）
 * 仅在这个时间段内显示倒计时；其他时间显示"已下班"
 */
const isWorkPeriod = computed(() => {
  const start = config.salary?.startTime || "09:00";
  const [sh, sm] = start.split(":").map(Number);
  const [oh, om] = props.offTime.split(":").map(Number);

  const nowMin = now.value.hour() * 60 + now.value.minute();
  const startMin = sh * 60 + sm;
  const offMin = oh * 60 + om;

  return nowMin >= startMin && nowMin < offMin;
});

const remaining = computed(() => {
  const [h, m] = props.offTime.split(":").map(Number);
  const off = now.value.hour(h).minute(m).second(0).millisecond(0);
  const diff = off.diff(now.value, "second");
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});

const workStartLabel = computed(() => config.salary?.startTime || "09:00");
</script>

<template>
  <div class="countdown">
    <div class="label">
      <template v-if="isWorkPeriod">距离下班还有</template>
      <template v-else>今日已下班</template>
    </div>
    <div class="time" :class="{ off: !isWorkPeriod }">
      <template v-if="isWorkPeriod">{{ remaining }}</template>
      <template v-else>— : — : —</template>
    </div>
    <div class="hint">{{ workStartLabel }} – {{ offTime }}</div>
  </div>
</template>

<style scoped>
.countdown {
  text-align: center;
  user-select: none;
}

.label {
  font-size: 11px;
  opacity: 0.6;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

.time {
  font-size: 36px;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  letter-spacing: 2px;
  color: var(--color-primary);
  font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
  line-height: 1;
}

.time.off {
  color: var(--color-text-muted);
  opacity: 0.5;
}

.hint {
  font-size: 10px;
  opacity: 0.4;
  margin-top: 4px;
  letter-spacing: 1px;
}
</style>