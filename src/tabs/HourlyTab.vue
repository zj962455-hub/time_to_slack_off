<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";
import { baseHourlyRate } from "../types/salary";
import { salaryMultiplier } from "../utils/holiday";

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

const baseRate = computed(() => baseHourlyRate(config.salary));
const multiplier = computed(() => salaryMultiplier(now.value, config.holidayOverrides));
const currentRate = computed(() => baseRate.value * multiplier.value);

const multiplierLabel = computed(() => {
  const m = multiplier.value;
  if (m === 3) return "🔴 法定节假日 3x";
  if (m === 2) return "🟡 周末 2x";
  return "🟢 工作日 1x";
});

const salaryTypeLabel = computed(() => {
  const t = config.salary.type;
  if (t === "monthly") return "月薪";
  if (t === "daily") return "日薪";
  return "时薪";
});

const isConfigured = computed(() => config.salary.amount > 0);
</script>

<template>
  <div class="tab-content">
    <template v-if="isConfigured">
      <div class="rate-row">
        <span class="currency">¥</span>
        <span class="big-number">{{ currentRate.toFixed(2) }}</span>
        <span class="unit">/小时</span>
      </div>
      <div class="multiplier">{{ multiplierLabel }}</div>
      <div class="meta">
        {{ salaryTypeLabel }} ¥{{ config.salary.amount }} · 基础 ¥{{ baseRate.toFixed(2) }}/h
      </div>
    </template>
    <template v-else>
      <div class="empty">未设置薪资</div>
      <div class="hint">设置 → 时薪配置</div>
    </template>
  </div>
</template>

<style scoped>
.tab-content {
  text-align: center;
  padding: 8px 0;
}

.rate-row {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  color: var(--color-primary);
}

.currency {
  font-size: 18px;
  opacity: 0.7;
  font-weight: 300;
}

.big-number {
  font-size: 36px;
  font-weight: 300;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.unit {
  font-size: 12px;
  opacity: 0.6;
  margin-left: 4px;
}

.multiplier {
  font-size: 12px;
  margin-top: 6px;
}

.meta {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 4px;
}

.empty {
  font-size: 14px;
  opacity: 0.5;
}

.hint {
  font-size: 11px;
  opacity: 0.4;
  margin-top: 4px;
}
</style>