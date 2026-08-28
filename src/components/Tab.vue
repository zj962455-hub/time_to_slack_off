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
  padding: 6px 12px;
  border-bottom: 1px solid var(--color-border);
}

.tab-wrapper:last-child {
  border-bottom: none;
}

.tab-header {
  font-size: 10px;
  opacity: 0.5;
  letter-spacing: 1px;
  margin-bottom: 2px;
  text-transform: uppercase;
}

/* 紧凑所有子 tab 内容 */
.tab-wrapper :deep(.tab-content) {
  padding: 2px 0;
}
.tab-wrapper :deep(.big-number) {
  font-size: 22px;
  line-height: 1;
}
.tab-wrapper :deep(.unit) {
  font-size: 10px;
  margin-top: 2px;
}
.tab-wrapper :deep(.label) {
  font-size: 10px;
  margin-top: 4px;
}
.tab-wrapper :deep(.currency) {
  font-size: 14px;
}
.tab-wrapper :deep(.earned-row) {
  margin-bottom: 2px;
}
.tab-wrapper :deep(.earned-label) {
  font-size: 10px;
  margin-bottom: 4px;
}
.tab-wrapper :deep(.progress-bar) {
  height: 3px;
  max-width: 240px;
  margin: 4px auto;
}
.tab-wrapper :deep(.progress-text) {
  font-size: 11px;
  margin-top: 4px;
}
.tab-wrapper :deep(.meta),
.tab-wrapper :deep(.meta-light) {
  font-size: 10px;
  margin-top: 3px;
}
.tab-wrapper :deep(.multiplier) {
  font-size: 10px;
  margin-top: 4px;
}
.tab-wrapper :deep(.empty) {
  font-size: 12px;
}
.tab-wrapper :deep(.hint) {
  font-size: 10px;
  margin-top: 2px;
}
</style>