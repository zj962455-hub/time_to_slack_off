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
  opacity: 0.5;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

/* 横向并排时紧凑所有子 tab 内容 */
.tab-wrapper :deep(.tab-content) {
  padding: 0;
}
.tab-wrapper :deep(.big-number) {
  font-size: 20px;
  line-height: 1;
}
.tab-wrapper :deep(.unit) {
  font-size: 9px;
  margin-top: 2px;
}
.tab-wrapper :deep(.label) {
  font-size: 9px;
  margin-top: 3px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}
.tab-wrapper :deep(.currency) {
  font-size: 12px;
}
.tab-wrapper :deep(.earned-row) {
  margin-bottom: 1px;
}
.tab-wrapper :deep(.earned-label) {
  font-size: 9px;
  margin-bottom: 4px;
}
.tab-wrapper :deep(.progress-bar) {
  height: 2px;
  max-width: 100%;
  margin: 3px 4px;
}
.tab-wrapper :deep(.progress-text) {
  font-size: 9px;
  margin-top: 3px;
}
.tab-wrapper :deep(.meta),
.tab-wrapper :deep(.meta-light) {
  font-size: 9px;
  margin-top: 2px;
  line-height: 1.3;
  text-overflow: ellipsis;
  overflow: hidden;
}
.tab-wrapper :deep(.multiplier) {
  font-size: 9px;
  margin-top: 3px;
}
.tab-wrapper :deep(.empty) {
  font-size: 10px;
}
.tab-wrapper :deep(.hint) {
  font-size: 9px;
  margin-top: 2px;
}
</style>