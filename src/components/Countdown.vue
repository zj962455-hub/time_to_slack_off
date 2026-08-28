<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";

const props = defineProps<{
  offTime: string;
}>();

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

const remaining = computed(() => {
  const [h, m] = props.offTime.split(":").map(Number);
  let off = now.value.hour(h).minute(m).second(0).millisecond(0);
  if (off.isBefore(now.value)) {
    off = off.add(1, "day");
  }
  const diff = off.diff(now.value, "second");
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
</script>

<template>
  <div class="countdown">
    <div class="label">距离下班还有</div>
    <div class="time">{{ remaining }}</div>
  </div>
</template>

<style scoped>
.countdown {
  text-align: center;
  user-select: none;
}

.label {
  font-size: 14px;
  opacity: 0.6;
  margin-bottom: 16px;
  letter-spacing: 1px;
}

.time {
  font-size: 64px;
  font-weight: 200;
  font-variant-numeric: tabular-nums;
  letter-spacing: 4px;
  color: var(--color-primary);
  font-family: "SF Mono", Menlo, Monaco, Consolas, monospace;
}
</style>