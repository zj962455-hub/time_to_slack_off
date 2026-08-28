import { defineStore } from "pinia";
import { ref } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";

// 配置文件位于 ~/.local/share/time-to-slack-off/config.json（Tauri 默认）
// 在 web 环境下 LazyStore 会回退到 localStorage
const store = new LazyStore("config.json");

interface SavedConfig {
  offTime: string;
  workdays: number[];
}

const DEFAULT_CONFIG: SavedConfig = {
  offTime: "18:00",
  workdays: [1, 2, 3, 4, 5],
};

export const useConfigStore = defineStore("config", () => {
  const offTime = ref(DEFAULT_CONFIG.offTime);
  const workdays = ref<number[]>([...DEFAULT_CONFIG.workdays]);
  const loaded = ref(false);

  async function load() {
    try {
      const saved = await store.get<SavedConfig>("config");
      if (saved?.offTime) {
        offTime.value = saved.offTime;
      }
      if (saved?.workdays) {
        workdays.value = [...saved.workdays];
      }
    } catch (e) {
      console.warn("[config] load failed, use defaults", e);
    } finally {
      loaded.value = true;
    }
  }

  async function persist() {
    try {
      await store.set("config", {
        offTime: offTime.value,
        workdays: workdays.value,
      });
      await store.save();
    } catch (e) {
      console.error("[config] save failed", e);
    }
  }

  async function setOffTime(time: string) {
    offTime.value = time;
    await persist();
  }

  return {
    offTime,
    workdays,
    loaded,
    load,
    setOffTime,
  };
});