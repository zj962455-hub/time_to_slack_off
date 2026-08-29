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
const name = computed(() => result.value?.name ?? null);

// HolidayTab 自己渲染 header（替代 Tab.vue 默认的「距离最近节假日」）
const headerText = computed(() => (name.value ? `距离${name.value}` : "暂无节假日"));
</script>

<template>
  <div class="tab-content">
    <div class="custom-header">{{ headerText }}</div>
    <div class="big-number">{{ days ?? "—" }}</div>
    <div class="unit">{{ days !== null ? "天" : "" }}</div>
  </div>
</template>

<style scoped>
.tab-content {
  text-align: center;
  padding: 8px 0;
}

/* 视觉与 Tab.vue 默认 .tab-header 完全一致,占据同一位置 */
.custom-header {
  font-size: 10px;
  color: var(--color-text);
  opacity: 0.75;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  height: 14px;
  line-height: 14px;
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
  color: var(--color-text);
  opacity: 0.75;
  margin-top: 4px;
}
</style>