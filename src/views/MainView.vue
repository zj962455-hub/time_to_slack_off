<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useConfigStore } from "../stores/config";
import Countdown from "../components/Countdown.vue";
import Tab from "../components/Tab.vue";
import SettingsView from "./SettingsView.vue";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

const config = useConfigStore();
const showSettings = ref(false);

async function resizeWidget(mode: "small" | "large") {
  try {
    await invoke("set_widget_size", { mode });
  } catch (e) {
    console.warn("resizeWidget failed:", e);
  }
}

async function openSettings() {
  showSettings.value = true;
  await resizeWidget("large");
}

async function closeSettings() {
  showSettings.value = false;
  await resizeWidget("small");
}

onMounted(async () => {
  await config.load();

  // 监听菜单栏 → "打开设置"
  await listen("open-settings", () => {
    openSettings();
  });
});

const visibleTabs = computed(() => config.enabledTabs());

// widget 模式：显示前 3 个 tab
const widgetTabs = computed(() => visibleTabs.value.slice(0, 3));
</script>

<template>
  <div class="widget" data-tauri-drag-region>
    <!-- Widget 模式：紧凑 -->
    <div v-if="!showSettings" class="widget-body" data-tauri-drag-region>
      <div class="row top-row" data-tauri-drag-region="false">
        <Countdown
          v-if="config.loaded && config.offTime"
          :off-time="config.offTime"
        />
        <div v-else class="loading">加载中…</div>

        <button
          class="settings-btn"
          @click="openSettings"
          title="设置"
          data-tauri-drag-region="false"
        >
          ⚙
        </button>
      </div>

      <div
        v-if="config.loaded && widgetTabs.length > 0"
        class="tabs-strip"
        data-tauri-drag-region="false"
      >
        <Tab v-for="tab in widgetTabs" :key="tab.id" :tab="tab" />
      </div>
    </div>

    <!-- 设置模式：全屏 overlay -->
    <div v-else class="settings-mode">
      <SettingsView @close="closeSettings" />
    </div>
  </div>
</template>

<style scoped>
.widget {
  width: 100vw;
  height: 100vh;
  background: transparent;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  -webkit-app-region: drag;
  overflow: hidden;
}

/* Widget 模式 */
.widget-body {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(30, 30, 35, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 10px 40px rgba(0, 0, 0, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.3);
  -webkit-app-region: no-drag;
}

@media (prefers-color-scheme: light) {
  .widget-body {
    background: rgba(245, 245, 247, 0.95);
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.5) inset,
      0 10px 40px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
  min-height: 32px;
}

.settings-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.2s;
  -webkit-app-region: no-drag;
  padding: 4px 6px;
  flex-shrink: 0;
}
.settings-btn:hover {
  opacity: 1;
}

.loading {
  opacity: 0.5;
  font-size: 12px;
}

.tabs-strip {
  display: flex;
  flex-direction: row;
  gap: 4px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 设置模式：完全占据 widget */
.settings-mode {
  width: 100%;
  height: 100%;
  background: rgba(30, 30, 35, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 10px 40px rgba(0, 0, 0, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

@media (prefers-color-scheme: light) {
  .settings-mode {
    background: rgba(250, 250, 252, 0.98);
    border-color: rgba(0, 0, 0, 0.1);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.5) inset,
      0 10px 40px rgba(0, 0, 0, 0.18),
      0 2px 8px rgba(0, 0, 0, 0.1);
  }
}
</style>