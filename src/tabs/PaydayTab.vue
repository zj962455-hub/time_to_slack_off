<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { daysUntilPayday } from "../utils/holiday";

const props = defineProps<{
  config?: { day?: number }
}>();

const payDay = computed(() => props.config?.day ?? 15);
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

const days = computed(() => daysUntilPayday(payDay.value, now.value));

const label = computed(() => {
  if (days.value === 0) return "💰 今天是发薪日";
  return `每月 ${payDay.value} 号发薪`;
});
</script>

<template>
  <div class="tab-content">
    <div class="big-number">{{ days }}</div>
    <div class="unit">天</div>
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