<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, inject, watch } from "vue";
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

// 把动态节日名注入到 tab-header（替代默认的「距离最近节假日」）
const setHeader = inject<(text: string) => void>("setTabHeader");
function syncHeader() {
  if (!setHeader) return;
  setHeader(name.value ? `距离${name.value}` : "暂无节假日");
}
syncHeader();
watch(name, syncHeader);
</script>

<template>
  <div class="tab-content">
    <div class="big-number">{{ days ?? "—" }}</div>
    <div class="unit">{{ days !== null ? "天" : "" }}</div>
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
  color: #000;
  opacity: 0.75;
  margin-top: 4px;
}
</style>