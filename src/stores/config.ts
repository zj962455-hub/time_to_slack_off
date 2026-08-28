import { defineStore } from "pinia";
import { ref } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";
import { DEFAULT_TABS, type TabConfig } from "../types/tab";
import type { HolidayOverride } from "../utils/holiday";

// 配置文件位于 ~/.local/share/time-to-slack-off/config.json（Tauri 默认）
// 在 web 环境下 LazyStore 会回退到 localStorage
const store = new LazyStore("config.json");

interface SavedConfig {
  offTime: string
  workdays: number[]
  tabs: TabConfig[]
  holidayOverrides: HolidayOverride[]
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
}

export const useConfigStore = defineStore("config", () => {
  const offTime = ref(DEFAULT_CONFIG.offTime)
  const workdays = ref<number[]>([...DEFAULT_CONFIG.workdays])
  const tabs = ref<TabConfig[]>(buildDefaultTabs())
  const holidayOverrides = ref<HolidayOverride[]>([])
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
    loaded,
    load,
    setOffTime,
    addTab,
    updateTab,
    removeTab,
    toggleTab,
    addOverride,
    removeOverride,
    enabledTabs,
  }
})