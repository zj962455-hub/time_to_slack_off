import { defineStore } from "pinia";
import { ref } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";
import { DEFAULT_TABS, type TabConfig } from "../types/tab";
import type { HolidayOverride } from "../utils/holiday";
import { DEFAULT_SALARY, type SalaryConfig } from "../types/salary";

// 配置文件位于 ~/.local/share/time-to-slack-off/config.json（Tauri 默认）
// 在 web 环境下 LazyStore 会回退到 localStorage
const store = new LazyStore("config.json");

export interface CustomHoliday {
  name: string
  date: string      // YYYY-MM-DD（一次性）或 MM-DD（循环）
  recurring: boolean
}

export interface CustomDate {
  name: string
  date: string      // YYYY-MM-DD（一次性）或 MM-DD（循环）
  recurring: boolean
}

interface SavedConfig {
  offTime: string
  workdays: number[]
  tabs: TabConfig[]
  holidayOverrides: HolidayOverride[]
  salary: SalaryConfig
  customHolidays: CustomHoliday[]
  customDates: CustomDate[]
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function buildDefaultTabs(): TabConfig[] {
  return DEFAULT_TABS.map((t, i) => ({
    ...t,
    id: genId(),
    order: t.order ?? i + 1,
  }))
}

const DEFAULT_CONFIG: SavedConfig = {
  offTime: "18:00",
  workdays: [1, 2, 3, 4, 5],
  tabs: buildDefaultTabs(),
  holidayOverrides: [],
  salary: { ...DEFAULT_SALARY },
  customHolidays: [],
  customDates: [],
}

export const useConfigStore = defineStore("config", () => {
  const offTime = ref(DEFAULT_CONFIG.offTime)
  const workdays = ref<number[]>([...DEFAULT_CONFIG.workdays])
  const tabs = ref<TabConfig[]>(buildDefaultTabs())
  const holidayOverrides = ref<HolidayOverride[]>([])
  const salary = ref<SalaryConfig>({ ...DEFAULT_SALARY })
  const customHolidays = ref<CustomHoliday[]>([])
  const customDates = ref<CustomDate[]>([])
  const loaded = ref(false)

  async function load() {
    try {
      const saved = await store.get<SavedConfig>("config")
      if (saved) {
        if (saved.offTime) offTime.value = saved.offTime
        if (saved.workdays) workdays.value = [...saved.workdays]
        if (saved.tabs && Array.isArray(saved.tabs) && saved.tabs.length > 0) {
          tabs.value = saved.tabs
        }
        if (saved.holidayOverrides) holidayOverrides.value = saved.holidayOverrides
        if (saved.salary) salary.value = { ...DEFAULT_SALARY, ...saved.salary }
        if (saved.customHolidays) customHolidays.value = saved.customHolidays
        if (saved.customDates) customDates.value = saved.customDates
      }
    } catch (e) {
      console.warn("[config] load failed, use defaults", e)
    } finally {
      loaded.value = true
    }
  }

  async function persist() {
    try {
      await store.set("config", {
        offTime: offTime.value,
        workdays: workdays.value,
        tabs: tabs.value,
        holidayOverrides: holidayOverrides.value,
        salary: salary.value,
        customHolidays: customHolidays.value,
        customDates: customDates.value,
      })
      await store.save()
    } catch (e) {
      console.error("[config] save failed", e)
    }
  }

  async function setOffTime(time: string) {
    offTime.value = time
    await persist()
  }

  // ===== Salary 操作 =====

  async function updateSalary(patch: Partial<SalaryConfig>) {
    salary.value = { ...salary.value, ...patch }
    await persist()
  }

  // ===== Custom Holiday 操作 =====

  async function addCustomHoliday(item: CustomHoliday) {
    customHolidays.value.push(item)
    await persist()
  }

  async function removeCustomHoliday(index: number) {
    customHolidays.value.splice(index, 1)
    await persist()
  }

  // ===== Custom Date 操作 =====

  async function addCustomDate(item: CustomDate) {
    customDates.value.push(item)
    await persist()
  }

  async function removeCustomDate(index: number) {
    customDates.value.splice(index, 1)
    await persist()
  }

  // ===== Tab 操作 =====

  async function addTab(tab: Omit<TabConfig, "id" | "order">) {
    const newTab: TabConfig = {
      ...tab,
      id: genId(),
      order: tabs.value.length + 1,
    }
    tabs.value.push(newTab)
    await persist()
  }

  async function updateTab(id: string, patch: Partial<TabConfig>) {
    const idx = tabs.value.findIndex((t) => t.id === id)
    if (idx >= 0) {
      tabs.value[idx] = { ...tabs.value[idx], ...patch }
      await persist()
    }
  }

  async function removeTab(id: string) {
    tabs.value = tabs.value.filter((t) => t.id !== id)
    await persist()
  }

  async function toggleTab(id: string) {
    const tab = tabs.value.find((t) => t.id === id)
    if (tab) {
      tab.enabled = !tab.enabled
      await persist()
    }
  }

  // ===== Holiday Override 操作 =====

  async function addOverride(override: HolidayOverride) {
    holidayOverrides.value.push(override)
    await persist()
  }

  async function removeOverride(date: string) {
    holidayOverrides.value = holidayOverrides.value.filter((o) => o.date !== date)
    await persist()
  }

  // ===== 便捷 getter =====

  const enabledTabs = () =>
    tabs.value.filter((t) => t.enabled).sort((a, b) => a.order - b.order)

  return {
    offTime,
    workdays,
    tabs,
    holidayOverrides,
    salary,
    customHolidays,
    customDates,
    loaded,
    load,
    setOffTime,
    updateSalary,
    addCustomHoliday,
    removeCustomHoliday,
    addCustomDate,
    removeCustomDate,
    addTab,
    updateTab,
    removeTab,
    toggleTab,
    addOverride,
    removeOverride,
    enabledTabs,
  }
})