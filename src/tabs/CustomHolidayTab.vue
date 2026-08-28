<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import dayjs from "dayjs";
import { useConfigStore } from "../stores/config";

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

interface NextHoliday {
  days: number
  name: string
  date: string
}

function computeNext(list: { name: string; date: string; recurring: boolean }[], from: dayjs.Dayjs): NextHoliday | null {
  const today = from.startOf("day");
  let best: NextHoliday | null = null;

  for (const item of list) {
    let target: dayjs.Dayjs | null = null;

    if (item.recurring) {
      const [m, d] = item.date.split("-").map(Number);
      target = today.month(m - 1).date(d);
      if (target.isBefore(today)) target = target.add(1, "year");
    } else {
      target = dayjs(item.date).startOf("day");
      if (target.isBefore(today)) continue;
    }

    const days = target.diff(today, "day");
    if (days < 0) continue;

    if (best === null || days < best.days) {
      best = { days, name: item.name, date: item.date };
    }
  }

  return best;
}

const next = computed(() => computeNext(config.customHolidays, now.value));
const days = computed(() => next.value?.days ?? null);
const name = computed(() => next.value?.name ?? "");
</script>

<template>
  <div class="tab-content">
    <template v-if="next">
      <div class="big-number">{{ days }}</div>
      <div class="unit">天</div>
      <div class="label">
        <template v-if="days === 0">🌴 今天放假：{{ name }}</template>
        <template v-else>下一个假期：{{ name }}</template>
      </div>
    </template>
    <template v-else>
      <div class="empty">暂无自定义假期</div>
      <div class="hint">设置 → 自定义假期</div>
    </template>
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