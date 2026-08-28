<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useConfigStore } from "../stores/config";
import Countdown from "../components/Countdown.vue";
import Tab from "../components/Tab.vue";
import SettingsView from "./SettingsView.vue";
import { listen } from "@tauri-apps/api/event";

const config = useConfigStore();
const showSettings = ref(false);

onMounted(async () => {
  await config.load();

  // 监听菜单栏 → "打开设置"
  await listen("open-settings", () => {
    showSettings.value = true;
  });
});

const visibleTabs = computed(() => config.enabledTabs());

// widget 风格：最多显示前 3 个 tab
const widgetTabs = computed(() => visibleTabs.value.slice(0, 3));
</script>

<template>
  <div class="widget" data-tauri-drag-region>
    <div class="widget-body" data-tauri-drag-region>
      <!-- 头部：倒计时 + 设置按钮 -->
      <div class="widget-header" data-tauri-drag-region="false">
        <Countdown
          v-if="config.loaded && config.offTime"
          :off-time="config.offTime"
          class="countdown-compact"
        />
        <div v-else class="loading">加载中…</div>

        <button
          class="settings-btn"
          @click="showSettings = true"
          title="设置"
          data-tauri-drag-region="false"
        >
          ⚙
        </button>
      </div>

      <!-- Tab 状态行（最多 3 个）-->
      <div
        v-if="config.loaded && widgetTabs.length > 0"
        class="tabs-strip"
        data-tauri-drag-region="false"
      >
        <Tab v-for="tab in widgetTabs" :key="tab.id" :tab="tab" />
      </div>
    </div>

    <SettingsView v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.widget {
  width: 100vw;
  height: 100vh;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
  -webkit-app-region: drag;
}

.widget-body {
  width: 100%;
  height: 100%;
  background: rgba(30, 30, 35, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.1) inset,
    0 10px 40px rgba(0, 0, 0, 0.45),
    0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 1;
  min-height: 0;
}

.countdown-compact {
  flex: 1;
  min-width: 0;
}

.countdown-compact :deep(.time) {
  font-size: 32px !important;
  letter-spacing: 1px !important;
}

.countdown-compact :deep(.label),
.countdown-compact :deep(.hint) {
  font-size: 10px !important;
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
  text-align: center;
}

.tabs-strip {
  display: flex;
  flex-direction: row;
  gap: 4px;
  margin-top: 6px;
  justify-content: space-around;
}
</style>