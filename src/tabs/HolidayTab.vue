<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";
import { daysUntilNextHoliday } from "../utils/holiday";

const config = useConfigStore();

// 不用 computed—— Tauri macOS WKWebView 的 JavaScriptCore 引擎对 Vue 3 computed + reactive 在 dynamic component 边界下有边界问题
// 直接用 ref + setInterval tick 主动赋值，避免依赖 computed 的 lazy 求值链
const headerText = ref("暂无节假日");
const bigNumber = ref("—");
const unitText = ref("");

function tick() {
  const info = daysUntilNextHoliday(dayjs(), config.holidayOverrides);
  const days = info?.days ?? null;
  const name = info?.name ?? null;
  headerText.value = name ? `距离${name}` : "暂无节假日";
  bigNumber.value = days === null ? "—" : String(days);
  unitText.value = days === null ? "" : "天";
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
    <div class="custom-header">{{ headerText }}</div>
    <div class="big-number">{{ bigNumber }}</div>
    <div class="unit">{{ unitText }}</div>
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