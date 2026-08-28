<script setup lang="ts">
import { computed } from "vue";
import type { TabConfig } from "../types/tab";
import WeekendTab from "../tabs/WeekendTab.vue";
import PaydayTab from "../tabs/PaydayTab.vue";
import HolidayTab from "../tabs/HolidayTab.vue";

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
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
}

.tab-wrapper:last-child {
  border-bottom: none;
}

.tab-header {
  font-size: 11px;
  opacity: 0.5;
  letter-spacing: 1px;
  margin-bottom: 4px;
  text-transform: uppercase;
}
</style>