<script setup lang="ts">
import { computed } from "vue";
import type { TabConfig } from "../types/tab";
import WeekendTab from "../tabs/WeekendTab.vue";
import PaydayTab from "../tabs/PaydayTab.vue";
import HolidayTab from "../tabs/HolidayTab.vue";
import HourlyTab from "../tabs/HourlyTab.vue";
import CustomHolidayTab from "../tabs/CustomHolidayTab.vue";
import CustomDateTab from "../tabs/CustomDateTab.vue";

const props = defineProps<{
  tab: TabConfig
}>();

const component = computed(() => {
  switch (props.tab.type) {
    case "weekend":
      return WeekendTab
    case "salary-day":
      return PaydayTab
    case "holiday":
      return HolidayTab
    case "hourly":
      return HourlyTab
    case "custom-holiday":
      return CustomHolidayTab
    case "custom-date":
      return CustomDateTab
    default:
      return null
  }
});
</script>

<template>
  <div class="tab-wrapper">
    <div class="tab-header">{{ tab.label }}</div>
    <component :is="component" v-if="component" :config="tab.config" />
  </div>
</template>

<style scoped>
.tab-wrapper {
  padding: var(--space-1) var(--space-1);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius);
  text-align: center;
  background: var(--color-bg-elevated);
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  transition:
    border-color var(--duration) var(--ease),
    transform var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);
}

.tab-wrapper:hover {
  border-color: var(--color-primary-soft);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.tab-header {
  font-size: 10px;
  color: #000; /* 跟随老大要求：tab header 静态文字黑色 */
  opacity: 0.75;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* 横向并排时紧凑所有子 tab 内容（字号由 widget .tabs-strip 控制）*/
.tab-wrapper :deep(.tab-content) {
  padding: 0;
}
.tab-wrapper :deep(.big-number) {
  line-height: 1;
}
.tab-wrapper :deep(.unit) {
  margin-top: 1px;
}
.tab-wrapper :deep(.label) {
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.tab-wrapper :deep(.earned-row) {
  margin-bottom: 1px;
}
.tab-wrapper :deep(.earned-label) {
  margin-bottom: 2px;
}
.tab-wrapper :deep(.progress-text) {
  margin-top: 2px;
}
.tab-wrapper :deep(.meta),
.tab-wrapper :deep(.meta-light) {
  line-height: 1.2;
  text-overflow: ellipsis;
  overflow: hidden;
}
.tab-wrapper :deep(.multiplier) {
  margin-top: 2px;
}
.tab-wrapper :deep(.hint) {
  margin-top: 1px;
}
</style>