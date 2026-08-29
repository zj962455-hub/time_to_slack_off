<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import dayjs from "dayjs";
import { daysUntilPayday } from "../utils/holiday";
import { useConfigStore } from "../stores/config";

// props.config.day 保留向后兼容（旧数据）；新数据从 store.salary.payDay 读
const props = defineProps<{
  config?: { day?: number }
}>();

const configStore = useConfigStore();
const bigNumber = ref("0");

function tick() {
  const payDay = configStore.salary.payDay ?? props.config?.day ?? 15;
  bigNumber.value = String(daysUntilPayday(payDay, dayjs()));
}

let timer: number | null = null;
onMounted(() => {
  tick();
  timer = window.setInterval(tick, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="tab-content">
    <div class="custom-header">距离发薪</div>
    <div class="big-number">{{ bigNumber }}</div>
    <div class="unit">天</div>
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
  color: var(--color-text);
  opacity: 0.75;
  margin-top: 4px;
}

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
</style>