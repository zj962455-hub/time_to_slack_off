<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfigStore } from "../stores/config";
import type { TabConfig, TabType, SalaryDayConfig } from "../types/tab";
import type { HolidayOverride } from "../utils/holiday";

const emit = defineEmits<{ close: [] }>();
const config = useConfigStore();

const offTime = ref(config.offTime);
watch(
  () => config.offTime,
  (val) => {
    offTime.value = val;
  }
);
watch(offTime, async (val) => {
  if (val !== config.offTime) {
    await config.setOffTime(val);
  }
});

// 工作日
const workdaysOptions = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
  { value: 6, label: "周六" },
  { value: 0, label: "周日" },
];

async function toggleWorkday(d: number) {
  const idx = config.workdays.indexOf(d);
  if (idx >= 0) {
    config.workdays.splice(idx, 1);
  } else {
    config.workdays.push(d);
  }
  // 触发持久化
  await config.setOffTime(config.offTime); // 复用 persist
}

// ===== Tab 操作 =====

async function addNewTab(type: TabType) {
  const labels: Record<TabType, string> = {
    weekend: "距离周末",
    "salary-day": "距离发薪",
    holiday: "距离最近节假日",
    hourly: "今日时薪",
    "custom-holiday": "自定义假期",
    "custom-date": "纪念日",
  };
  const defaults: Partial<TabConfig> = {
    type,
    label: labels[type],
    enabled: true,
    config: type === "salary-day" ? { day: 15 } : {},
  };
  await config.addTab(defaults as Omit<TabConfig, "id" | "order">);
}

async function removeTab(id: string) {
  await config.removeTab(id);
}

async function toggleTab(id: string) {
  await config.toggleTab(id);
}

async function renameTab(id: string, label: string) {
  await config.updateTab(id, { label });
}

async function moveTab(id: string, dir: "up" | "down") {
  const tabs = [...config.tabs].sort((a, b) => a.order - b.order);
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= tabs.length) return;
  // 交换 order
  const tmp = tabs[idx].order;
  tabs[idx].order = tabs[target].order;
  tabs[target].order = tmp;
  await config.setOffTime(config.offTime); // 触发 persist（复用）
}

async function setPayday(id: string, day: number) {
  await config.updateTab(id, {
    config: { day } as SalaryDayConfig,
  });
}

// ===== Override 操作 =====

const newOverride = ref({
  date: "",
  type: "holiday" as "holiday" | "workday",
  reason: "",
});

async function addOverrideItem() {
  if (!newOverride.value.date) return;
  const item: HolidayOverride = {
    date: newOverride.value.date,
    type: newOverride.value.type,
    reason: newOverride.value.reason || undefined,
  };
  await config.addOverride(item);
  newOverride.value = { date: "", type: "holiday", reason: "" };
}

async function removeOverrideItem(date: string) {
  await config.removeOverride(date);
}

// ===== 可添加的 tab 类型（v1 仅显示已实现的 3 种）=====

const addableTypes: TabType[] = ["weekend", "salary-day", "holiday"];
const showAddTab = ref(false);
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="panel">
      <header>
        <h2>设置</h2>
        <button class="close-x" @click="emit('close')" title="关闭">✕</button>
      </header>

      <section class="block">
        <div class="field">
          <label>下班时间</label>
          <input id="off-time" type="time" v-model="offTime" />
        </div>
      </section>

      <section class="block">
        <h3>工作日</h3>
        <div class="weekday-grid">
          <button
            v-for="opt in workdaysOptions"
            :key="opt.value"
            class="weekday-btn"
            :class="{ active: config.workdays.includes(opt.value) }"
            @click="toggleWorkday(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </section>

      <section class="block">
        <h3>Tab 列表（{{ config.tabs.length }}/5）</h3>
        <div class="tabs-list">
          <div v-for="tab in [...config.tabs].sort((a, b) => a.order - b.order)" :key="tab.id" class="tab-row">
            <input
              type="checkbox"
              :checked="tab.enabled"
              @change="toggleTab(tab.id)"
              :title="tab.enabled ? '已启用' : '已禁用'"
            />
            <input
              type="text"
              class="tab-label"
              :value="tab.label"
              @change="(e) => renameTab(tab.id, (e.target as HTMLInputElement).value)"
            />
            <span class="tab-type">{{ tab.type }}</span>
            <div class="tab-actions">
              <button @click="moveTab(tab.id, 'up')" title="上移">↑</button>
              <button @click="moveTab(tab.id, 'down')" title="下移">↓</button>
              <button class="danger" @click="removeTab(tab.id)" title="删除">×</button>
            </div>
            <div v-if="tab.type === 'salary-day'" class="tab-extra">
              <label>发薪日：
                <input
                  type="number"
                  min="1"
                  max="31"
                  :value="(tab.config as SalaryDayConfig)?.day ?? 15"
                  @change="(e) => setPayday(tab.id, Number((e.target as HTMLInputElement).value))"
                />
                号
              </label>
            </div>
          </div>
        </div>

        <div class="add-tab">
          <button v-if="!showAddTab" @click="showAddTab = true" :disabled="config.tabs.length >= 5">
            + 添加 Tab
          </button>
          <div v-else class="add-tab-picker">
            <span>选择类型：</span>
            <button v-for="t in addableTypes" :key="t" @click="addNewTab(t); showAddTab = false">
              {{ t }}
            </button>
            <button @click="showAddTab = false">取消</button>
          </div>
        </div>
      </section>

      <section class="block">
        <h3>特殊工种覆盖 ({{ config.holidayOverrides.length }})</h3>
        <p class="hint">把某些日期强制设为假期或工作日，覆盖国务院安排</p>

        <div v-if="config.holidayOverrides.length > 0" class="override-list">
          <div v-for="ov in config.holidayOverrides" :key="ov.date" class="override-row">
            <span class="override-date">{{ ov.date }}</span>
            <span class="override-type" :class="ov.type">{{ ov.type === "holiday" ? "假" : "班" }}</span>
            <span class="override-reason">{{ ov.reason || "—" }}</span>
            <button class="danger" @click="removeOverrideItem(ov.date)" title="删除">×</button>
          </div>
        </div>

        <div class="add-override">
          <input type="date" v-model="newOverride.date" />
          <select v-model="newOverride.type">
            <option value="holiday">假期</option>
            <option value="workday">工作日</option>
          </select>
          <input type="text" v-model="newOverride.reason" placeholder="原因" />
          <button @click="addOverrideItem" :disabled="!newOverride.date">添加</button>
        </div>
      </section>

      <footer>
        <button class="close-btn" @click="emit('close')">完成</button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}

.panel {
  background: var(--color-bg);
  padding: 0;
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 12px;
  border-bottom: 1px solid var(--color-border);
}

h2 {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
}

.close-x {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  opacity: 0.5;
  padding: 4px 8px;
}
.close-x:hover {
  opacity: 1;
}

.block {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
}

.block:last-of-type {
  border-bottom: none;
}

h3 {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.7;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.field {
  margin-bottom: 8px;
}

.field label {
  display: block;
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 6px;
}

input[type="time"],
input[type="text"],
input[type="number"],
input[type="date"],
select {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.weekday-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekday-btn {
  padding: 6px 0;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.weekday-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.tabs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tab-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto auto;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.tab-label {
  min-width: 80px;
}

.tab-type {
  font-size: 11px;
  opacity: 0.5;
  font-family: monospace;
}

.tab-actions {
  display: flex;
  gap: 4px;
}

.tab-actions button {
  width: 24px;
  height: 24px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.tab-actions button:hover {
  background: var(--color-border);
}

.tab-actions button.danger:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.tab-extra {
  grid-column: 2 / 6;
  font-size: 12px;
  opacity: 0.7;
  padding-top: 4px;
}

.add-tab {
  margin-top: 10px;
}

.add-tab-picker {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.add-tab-picker button {
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 12px;
}

button {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
  transition: all 0.15s;
}

button:hover:not(:disabled) {
  border-color: var(--color-primary);
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button.danger:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.hint {
  font-size: 12px;
  opacity: 0.5;
  margin-bottom: 8px;
}

.override-list {
  margin-bottom: 12px;
}

.override-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 8px;
  padding: 4px 8px;
  align-items: center;
  font-size: 13px;
}

.override-date {
  font-family: monospace;
}

.override-type {
  display: inline-block;
  width: 24px;
  text-align: center;
  padding: 2px 0;
  border-radius: 3px;
  font-size: 11px;
}

.override-type.holiday {
  background: var(--color-primary);
  color: white;
}

.override-type.workday {
  background: var(--color-secondary);
  color: white;
}

.add-override {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 6px;
  align-items: center;
}

footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
}

.close-btn {
  width: 100%;
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.close-btn:hover {
  opacity: 0.9;
}
</style>