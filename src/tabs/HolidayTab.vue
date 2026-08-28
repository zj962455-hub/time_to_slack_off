<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";
import { daysUntilNextHoliday } from "../utils/holiday";

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

const result = computed(() => daysUntilNextHoliday(now.value, config.holidayOverrides));

const days = computed(() => result.value?.days ?? null);
const name = computed(() => result.value?.name ?? "暂无");

const label = computed(() => {
  if (days.value === null) return "暂无节假日";
  if (days.value === 0) return "🎉 今天就是！摸鱼中";
  return `下一个：${name.value}`;
});
</script>

<template>
  <div class="tab-content">
    <div class="big-number">{{ days ?? "—" }}</div>
    <div class="unit">{{ days !== null ? "天" : "" }}</div>
    <div class="label">{{ label }}</div>
  </div>
</template>

<style scoped>
.tab-content {
  text-align: center;
  padding: 8px 0;
}

.big-number {
  font-size: 36px;
  font-weight: 300;
  color: var(--color-secondary);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.unit {
  font-size: 12px;
  opacity: 0.6;
  margin-top: 4px;
}

.label {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
}
</style>