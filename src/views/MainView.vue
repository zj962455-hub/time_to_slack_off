<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { useConfigStore } from "../stores/config";
import Countdown from "../components/Countdown.vue";
import Tab from "../components/Tab.vue";
import SettingsView from "./SettingsView.vue";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const config = useConfigStore();
const showSettings = ref(false);
const isWindows = ref(/Windows/i.test(navigator.userAgent));

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

// Win / Linux: pointerdown + startDragging（macOS 用 native drag region）
async function handleDragStart(e: PointerEvent) {
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  // 向上查找 drag region（不在 no-drag 内）
  let el: HTMLElement | null = target;
  while (el && el !== document.body) {
    if (el.dataset.tauriDragRegion === "false") return;
    if (el.dataset.tauriDragRegion !== undefined) break;
    el = el.parentElement;
  }
  if (!el || el === document.body) return;

  e.preventDefault();
  try {
    await getCurrentWebviewWindow().startDragging();
  } catch (err) {
    console.warn("startDragging failed:", err);
  }
}

onMounted(async () => {
  await config.load();

  // 检测平台
  isWindows.value = /Windows/i.test(navigator.userAgent);

  // 非 macOS 用 API 拖动
  if (isWindows.value) {
    document.addEventListener("pointerdown", handleDragStart);
  }

  // 监听菜单栏 → "打开设置"
  await listen("open-settings", () => {
    openSettings();
  });
});

onUnmounted(() => {
  if (isWindows.value) {
    document.removeEventListener("pointerdown", handleDragStart);
  }
});

const visibleTabs = computed(() => config.enabledTabs());
const widgetTabs = computed(() => visibleTabs.value);
</script>

<template>
  <div class="widget" data-tauri-drag-region>
    <!-- Widget 模式：紧凑 -->
    <Transition name="fade-scale" appear>
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
            <span class="settings-icon">⚙</span>
          </button>
        </div>

        <div
          v-if="config.loaded && widgetTabs.length > 0"
          :class="['tabs-strip', `tabs-${Math.min(widgetTabs.length, 5)}`]"
          data-tauri-drag-region="false"
        >
          <Tab v-for="tab in widgetTabs" :key="tab.id" :tab="tab" />
        </div>
      </div>
    </Transition>

    <!-- 设置模式：全屏 overlay -->
    <Transition name="fade-scale">
      <div v-if="showSettings" class="settings-mode">
        <SettingsView @close="closeSettings" />
      </div>
    </Transition>
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
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: rgba(30, 30, 35, 0.88);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-radius: 16px;
  border: 0.5px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.08),
    0 12px 36px rgba(0, 0, 0, 0.32),
    0 4px 12px rgba(0, 0, 0, 0.18);
  -webkit-app-region: no-drag;
  transition: all var(--duration) var(--ease);
}

@media (prefers-color-scheme: light) {
  .widget-body {
    background: rgba(248, 248, 250, 0.92);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow:
      0 0 0 0.5px rgba(0, 0, 0, 0.04),
      0 12px 36px rgba(0, 0, 0, 0.14),
      0 4px 12px rgba(0, 0, 0, 0.08);
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
  font-size: var(--text-md);
  cursor: pointer;
  opacity: 0.5;
  transition:
    opacity var(--duration) var(--ease),
    transform var(--duration) var(--ease);
  -webkit-app-region: no-drag;
  padding: var(--space-1) var(--space-1);
  flex-shrink: 0;
}
.settings-btn:hover {
  opacity: 1;
}
.settings-icon {
  display: inline-block;
  transition: transform var(--duration) var(--ease);
}
.settings-btn:hover .settings-icon {
  transform: rotate(45deg);
}

/* Tab 字号自适应：tab 越多字号越小 */
.tabs-strip :deep(.big-number) {
  font-size: clamp(14px, 4vw, 24px) !important;
}
.tabs-strip :deep(.currency) {
  font-size: clamp(10px, 2vw, 14px) !important;
}
.tabs-strip :deep(.label),
.tabs-strip :deep(.unit) {
  font-size: clamp(8px, 1.5vw, 11px) !important;
}
.tabs-strip :deep(.earned-label),
.tabs-strip :deep(.progress-text),
.tabs-strip :deep(.meta),
.tabs-strip :deep(.hint) {
  font-size: clamp(8px, 1.2vw, 10px) !important;
}
.tabs-strip :deep(.empty) {
  font-size: clamp(9px, 1.5vw, 12px) !important;
}
.tabs-strip :deep(.progress-bar) {
  margin: 2px 4px !important;
  height: 2px !important;
}

/* 微动画：widget 启动 / 切换 fade-scale */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity var(--duration) var(--ease),
    transform var(--duration) var(--ease);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}

.loading {
  opacity: 0.5;
  font-size: 12px;
}

.tabs-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 2px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 设置模式：完全占据 widget */
.settings-mode {
  width: 100%;
  height: 100%;
  background: rgba(30, 30, 35, 0.96);
  backdrop-filter: saturate(180%) blur(24px);
  -webkit-backdrop-filter: saturate(180%) blur(24px);
  border-radius: 16px;
  border: 0.5px solid rgba(255, 255, 255, 0.18);
  box-shadow:
    0 0 0 0.5px rgba(0, 0, 0, 0.08),
    0 12px 36px rgba(0, 0, 0, 0.32),
    0 4px 12px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

@media (prefers-color-scheme: light) {
  .settings-mode {
    background: rgba(250, 250, 252, 0.98);
    border-color: rgba(0, 0, 0, 0.08);
    box-shadow:
      0 0 0 0.5px rgba(0, 0, 0, 0.04),
      0 12px 36px rgba(0, 0, 0, 0.14),
      0 4px 12px rgba(0, 0, 0, 0.08);
  }
}
</style>