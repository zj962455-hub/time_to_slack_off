<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfigStore } from "../stores/config";
import { ADDABLE_TABS, type TabConfig, type TabType, type SalaryDayConfig } from "../types/tab";
import type { SalaryType } from "../types/salary";

// Tab 类型中文标签映射
const TAB_TYPE_LABELS: Record<TabType, string> = {
  weekend: "距离周末",
  "salary-day": "距离发薪",
  holiday: "距离最近节假日",
  hourly: "今日已获得时薪",
  "custom-holiday": "自定义假期",
  "custom-date": "纪念日",
};

const emit = defineEmits<{ close: [] }>();
const config = useConfigStore();

// ===== 下班时间 =====
const offTime = ref(config.offTime);
watch(() => config.offTime, (val) => { offTime.value = val; });
watch(offTime, async (val) => {
  if (val !== config.offTime) await config.setOffTime(val);
});

// ===== 工作日 =====
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
  if (idx >= 0) config.workdays.splice(idx, 1);
  else config.workdays.push(d);
  await config.setOffTime(config.offTime);
}

// ===== Tab 操作 =====
async function addNewTab(type: TabType) {
  await config.addTab({
    type,
    label: TAB_TYPE_LABELS[type],
    enabled: true,
    config: type === "salary-day" ? { day: 15 } : {},
  } as Omit<TabConfig, "id" | "order">);
  showAddTab.value = false;
}

async function removeTab(id: string) { await config.removeTab(id); }
async function toggleTab(id: string) { await config.toggleTab(id); }
async function renameTab(id: string, label: string) { await config.updateTab(id, { label }); }

async function moveTab(id: string, dir: "up" | "down") {
  const sorted = [...config.tabs].sort((a, b) => a.order - b.order);
  const idx = sorted.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const target = dir === "up" ? idx - 1 : idx + 1;
  if (target < 0 || target >= sorted.length) return;
  const tmp = sorted[idx].order;
  sorted[idx].order = sorted[target].order;
  sorted[target].order = tmp;
  await config.setOffTime(config.offTime);
}

// ===== 拖拽排序 =====
const draggedTabId = ref<string | null>(null);
const dragOverTabId = ref<string | null>(null);

function onDragStart(e: DragEvent, id: string) {
  draggedTabId.value = id;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }
}

function onDragOver(e: DragEvent, id: string) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  dragOverTabId.value = id;
}

function onDragLeave() {
  // 由 drop /  handle  覆盖
}

async function onDrop(e: DragEvent, targetId: string) {
  e.preventDefault();
  dragOverTabId.value = null;
  const fromId = draggedTabId.value ?? e.dataTransfer?.getData("text/plain");
  draggedTabId.value = null;
  if (!fromId || fromId === targetId) return;

  const sorted = [...config.tabs].sort((a, b) => a.order - b.order);
  const fromIdx = sorted.findIndex((t) => t.id === fromId);
  const toIdx = sorted.findIndex((t) => t.id === targetId);
  if (fromIdx < 0 || toIdx < 0) return;

  // 把 fromIdx 移动到 toIdx 位置
  const [moved] = sorted.splice(fromIdx, 1);
  sorted.splice(toIdx, 0, moved);

  // 重排 order
  sorted.forEach((tab, idx) => {
    tab.order = idx + 1;
  });

  await config.setOffTime(config.offTime); // 复用 persist
}

function onDragEnd() {
  draggedTabId.value = null;
  dragOverTabId.value = null;
}

async function setPayday(id: string, day: number) {
  await config.updateTab(id, { config: { day } as SalaryDayConfig });
}

const showAddTab = ref(false);

// ===== Override =====
const newOverride = ref({ date: "", type: "holiday" as "holiday" | "workday", reason: "" });
async function addOverrideItem() {
  if (!newOverride.value.date) return;
  await config.addOverride({
    date: newOverride.value.date,
    type: newOverride.value.type,
    reason: newOverride.value.reason || undefined,
  });
  newOverride.value = { date: "", type: "holiday", reason: "" };
}
async function removeOverrideItem(date: string) { await config.removeOverride(date); }

// ===== Salary =====
async function setSalaryType(t: SalaryType) { await config.updateSalary({ type: t }); }
async function setSalaryAmount(v: number) { await config.updateSalary({ amount: v }); }
async function setSalaryOvertime(v: number) { await config.updateSalary({ overtimeDays: Math.max(0, v) }); }
async function setSalaryLeave(v: number) { await config.updateSalary({ leaveDays: Math.max(0, v) }); }
async function setSalaryStartTime(v: string) { await config.updateSalary({ startTime: v }); }

// 本月预计工作天数（实时计算）
import { calcLegalWorkdays } from "../utils/workdays";
import dayjs from "dayjs";
const now = dayjs();
const legalWorkdays = calcLegalWorkdays(now.year(), now.month() + 1, config.workdays);
const overtimeDays = config.salary.overtimeDays;
const leaveDays = config.salary.leaveDays;
const actualWorkdays = Math.max(0, legalWorkdays + overtimeDays - leaveDays);

// 把 YYYY-MM-DD 格式化成 MM-DD（每年循环时显示）
function formatMonthDay(iso: string): string {
  if (iso.length === 10 && iso[4] === "-") return iso.substring(5);
  return iso;
}

// ===== Custom Holidays =====
const newCustomHoliday = ref({ name: "", date: "", recurring: true });
async function addCustomHolidayItem() {
  if (!newCustomHoliday.value.name || !newCustomHoliday.value.date) return;
  await config.addCustomHoliday({ ...newCustomHoliday.value });
  newCustomHoliday.value = { name: "", date: "", recurring: true };
}
async function removeCustomHolidayItem(idx: number) { await config.removeCustomHoliday(idx); }

// ===== Custom Dates =====
const newCustomDate = ref({ name: "", date: "", recurring: false });
async function addCustomDateItem() {
  if (!newCustomDate.value.name || !newCustomDate.value.date) return;
  await config.addCustomDate({ ...newCustomDate.value });
  newCustomDate.value = { name: "", date: "", recurring: false };
}
async function removeCustomDateItem(idx: number) { await config.removeCustomDate(idx); }
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
        <h3>时薪配置</h3>
        <p class="hint">显示今日已工作时长对应的累计收入</p>
        <div class="salary-type">
          <button :class="{ active: config.salary.type === 'monthly' }" @click="setSalaryType('monthly')">月薪</button>
          <button :class="{ active: config.salary.type === 'daily' }" @click="setSalaryType('daily')">日薪</button>
          <button :class="{ active: config.salary.type === 'hourly' }" @click="setSalaryType('hourly')">时薪</button>
        </div>
        <div class="salary-amount">
          <span class="currency">¥</span>
          <input
            type="number"
            min="0"
            step="100"
            :value="config.salary.amount"
            @change="(e) => setSalaryAmount(Number((e.target as HTMLInputElement).value))"
          />
        </div>
        <div class="salary-time">
          <label>上班时间
            <input
              type="time"
              :value="config.salary.startTime"
              @change="(e) => setSalaryStartTime((e.target as HTMLInputElement).value)"
            />
          </label>
          <label>下班时间
            <input
              type="time"
              :value="config.offTime"
              @change="(e) => config.setOffTime((e.target as HTMLInputElement).value)"
            />
          </label>
        </div>
        <details v-if="config.salary.type !== 'hourly'" class="salary-extra">
          <summary>高级设置（加班 / 请假）</summary>
          <div class="extra-grid">
            <label>加班天数 <input type="number" min="0" step="1" :value="config.salary.overtimeDays" @change="(e) => setSalaryOvertime(Number((e.target as HTMLInputElement).value))" /></label>
            <label>请假天数 <input type="number" min="0" step="1" :value="config.salary.leaveDays" @change="(e) => setSalaryLeave(Number((e.target as HTMLInputElement).value))" /></label>
          </div>
        </details>
        <div v-if="config.salary.type !== 'hourly'" class="salary-preview">
          本月预计工作天数：<strong>{{ actualWorkdays }}</strong> 天
          （法定 {{ legalWorkdays }} + 加班 {{ overtimeDays }} − 请假 {{ leaveDays }}）
        </div>
      </section>

      <section class="block">
        <h3>Tab 列表（{{ config.tabs.length }}/5）</h3>
        <div class="tabs-list">
          <div
            v-for="tab in [...config.tabs].sort((a, b) => a.order - b.order)"
            :key="tab.id"
            class="tab-row"
            :class="{ dragging: draggedTabId === tab.id, dragOver: dragOverTabId === tab.id }"
            draggable="true"
            @dragstart="(e) => onDragStart(e, tab.id)"
            @dragover="(e) => onDragOver(e, tab.id)"
            @dragleave="onDragLeave"
            @drop="(e) => onDrop(e, tab.id)"
            @dragend="onDragEnd"
          >
            <span class="drag-handle" title="拖拽排序">⋮⋮</span>
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
              <label>发薪日：<input type="number" min="1" max="31" :value="(tab.config as SalaryDayConfig)?.day ?? 15" @change="(e) => setPayday(tab.id, Number((e.target as HTMLInputElement).value))" />号</label>
            </div>
          </div>
        </div>

        <div class="add-tab">
          <button v-if="!showAddTab" @click="showAddTab = true" :disabled="config.tabs.length >= 5">
            + 添加 Tab
          </button>
          <div v-else class="add-tab-picker">
            <span>选择类型：</span>
            <button v-for="t in ADDABLE_TABS" :key="t" @click="addNewTab(t)">
              {{ TAB_TYPE_LABELS[t] }}
            </button>
            <button @click="showAddTab = false">取消</button>
          </div>
        </div>
      </section>

      <section class="block">
        <h3>特殊工种覆盖 ({{ config.holidayOverrides.length }})</h3>
        <p class="hint">把某些日期强制设为假期或工作日</p>

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

      <section class="block">
        <h3>自定义假期 ({{ config.customHolidays.length }})</h3>
        <p class="hint">公司额外假期、个人休假（如"张三生日"、"公司周年庆"）</p>

        <div v-if="config.customHolidays.length > 0" class="custom-list">
          <div v-for="(item, idx) in config.customHolidays" :key="idx" class="custom-row">
            <span class="custom-name">{{ item.name }}</span>
            <span class="custom-date">{{ item.recurring ? formatMonthDay(item.date) : item.date }}</span>
            <span class="custom-tag">{{ item.recurring ? "每年" : "一次性" }}</span>
            <button class="danger" @click="removeCustomHolidayItem(idx)" title="删除">×</button>
          </div>
        </div>

        <div class="add-custom">
          <input type="text" v-model="newCustomHoliday.name" placeholder="名称（如 张三生日）" />
          <input type="date" v-model="newCustomHoliday.date" />
          <label class="checkbox-label" title="勾选则每年该日期生效">
            <input type="checkbox" v-model="newCustomHoliday.recurring" />
            每年
          </label>
          <button @click="addCustomHolidayItem" :disabled="!newCustomHoliday.name || !newCustomHoliday.date">+ 添加</button>
        </div>
      </section>

      <section class="block">
        <h3>自定义日期 ({{ config.customDates.length }})</h3>
        <p class="hint">纪念日、deadline、项目节点</p>

        <div v-if="config.customDates.length > 0" class="custom-list">
          <div v-for="(item, idx) in config.customDates" :key="idx" class="custom-row">
            <span class="custom-name">{{ item.name }}</span>
            <span class="custom-date">{{ item.recurring ? formatMonthDay(item.date) : item.date }}</span>
            <span class="custom-tag">{{ item.recurring ? "每年" : "一次性" }}</span>
            <button class="danger" @click="removeCustomDateItem(idx)" title="删除">×</button>
          </div>
        </div>

        <div class="add-custom">
          <input type="text" v-model="newCustomDate.name" placeholder="名称（如 结婚纪念日）" />
          <input type="date" v-model="newCustomDate.date" />
          <label class="checkbox-label" title="勾选则每年该日期生效">
            <input type="checkbox" v-model="newCustomDate.recurring" />
            每年
          </label>
          <button @click="addCustomDateItem" :disabled="!newCustomDate.name || !newCustomDate.date">+ 添加</button>
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
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 1;
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
.close-x:hover { opacity: 1; }

.block {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border);
}
.block:last-of-type { border-bottom: none; }

h3 {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.7;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.field { margin-bottom: 8px; }
.field label {
  display: block;
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 6px;
}

input[type="time"], input[type="text"], input[type="number"], input[type="date"], select {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 14px;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
}
input:focus, select:focus {
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
}
.weekday-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.salary-type {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.salary-type button {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 13px;
}
.salary-type button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.salary-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.salary-amount .currency {
  font-size: 16px;
  opacity: 0.7;
}
.salary-amount input {
  flex: 1;
  font-size: 16px;
}

.salary-time {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
.salary-time label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  opacity: 0.8;
}
.salary-time input {
  font-size: 14px;
}

.salary-preview {
  margin-top: 12px;
  padding: 8px 10px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 11px;
  opacity: 0.85;
}
.salary-preview strong {
  color: var(--color-primary);
  font-weight: 500;
}

.salary-extra {
  margin-top: 8px;
  font-size: 12px;
}
.salary-extra summary {
  cursor: pointer;
  opacity: 0.7;
  margin-bottom: 8px;
}
.extra-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.extra-grid label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  opacity: 0.8;
}
.extra-grid input {
  width: 60px;
  font-size: 12px;
}

.tabs-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.tab-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto auto auto;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  transition: all 0.15s;
  cursor: grab;
}
.tab-row.dragging {
  opacity: 0.4;
  cursor: grabbing;
}
.tab-row.dragOver {
  border-color: var(--color-primary);
  border-style: dashed;
}
.drag-handle {
  opacity: 0.3;
  cursor: grab;
  font-size: 12px;
  user-select: none;
  padding: 0 2px;
}
.tab-row.dragging .drag-handle {
  cursor: grabbing;
}
.tab-label { min-width: 80px; }
.tab-type {
  font-size: 11px;
  opacity: 0.5;
  font-family: monospace;
}
.tab-actions { display: flex; gap: 4px; }
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
.tab-actions button:hover { background: var(--color-border); }
.tab-actions button.danger:hover {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}
.tab-extra {
  grid-column: 2 / 7;
  font-size: 12px;
  opacity: 0.7;
  padding-top: 4px;
}
.add-tab { margin-top: 10px; }
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
}
button:hover:not(:disabled) { border-color: var(--color-primary); }
button:disabled { opacity: 0.4; cursor: not-allowed; }
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

.override-list { margin-bottom: 12px; }
.override-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 8px;
  padding: 4px 8px;
  align-items: center;
  font-size: 13px;
}
.override-date { font-family: monospace; }
.override-type {
  display: inline-block;
  width: 24px;
  text-align: center;
  padding: 2px 0;
  border-radius: 3px;
  font-size: 11px;
}
.override-type.holiday { background: var(--color-primary); color: white; }
.override-type.workday { background: var(--color-secondary); color: white; }

.add-override {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  gap: 6px;
  align-items: center;
}

.custom-list { margin-bottom: 12px; }
.custom-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
  padding: 4px 8px;
  align-items: center;
  font-size: 13px;
}
.custom-name { font-weight: 500; }
.custom-date { font-family: monospace; opacity: 0.7; }
.custom-tag {
  font-size: 11px;
  opacity: 0.6;
  padding: 2px 6px;
  background: var(--color-border);
  border-radius: 3px;
}

.add-custom {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 6px;
  align-items: center;
}
.checkbox-label {
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

footer {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  position: sticky;
  bottom: 0;
  background: var(--color-bg);
}
.close-btn {
  width: 100%;
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
</style>