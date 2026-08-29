<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";
import { daysUntilWeekend } from "../utils/holiday";

const config = useConfigStore();

const bigNumber = ref("0");

function tick() {
  bigNumber.value = String(daysUntilWeekend(config.workdays, dayjs()));
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
    <div class="custom-header">距离周末</div>
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