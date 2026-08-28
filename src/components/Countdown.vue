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
 * 判断当前时间是否在上班时间段内
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
</script>

<template>
  <div class="countdown">
    <span class="label">
      <template v-if="isWorkPeriod">距离下班</template>
      <template v-else>已下班</template>
    </span>
    <span class="time" :class="{ off: !isWorkPeriod }">
      <template v-if="isWorkPeriod">{{ remaining }}</template>
      <template v-else>— : — : —</template>
    </span>
  </div>
</template>

<style scoped>
.countdown {
  display: flex;
  align-items: baseline;
  gap: 8px;
  user-select: none;
  white-space: nowrap;
  min-width: 0;
}

.label {
  font-size: 11px;
  opacity: 0.6;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.time {
  font-size: 28px;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
  color: var(--color-primary);
  font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
  line-height: 1;
  white-space: nowrap;
}

.time.off {
  color: var(--color-text-muted);
  opacity: 0.5;
}
</style>