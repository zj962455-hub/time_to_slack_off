<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useConfigStore } from "../stores/config";
import Countdown from "../components/Countdown.vue";
import Tab from "../components/Tab.vue";
import SettingsView from "./SettingsView.vue";

const config = useConfigStore();
const showSettings = ref(false);

onMounted(async () => {
  await config.load();
});

const visibleTabs = computed(() => config.enabledTabs());
</script>

<template>
  <div class="main">
    <button class="settings-btn" @click="showSettings = true" title="设置">⚙</button>

    <!-- 倒计时：固定在最顶部 -->
    <div class="countdown-zone">
      <Countdown v-if="config.loaded && config.offTime" :off-time="config.offTime" />
      <div v-else class="loading">加载中…</div>
    </div>

    <!-- Tabs：横向并排，居中，大小随数量自适应 -->
    <div
      v-if="config.loaded && visibleTabs.length > 0"
      class="tabs-row"
      :style="{ '--n': visibleTabs.length }"
    >
      <Tab v-for="tab in visibleTabs" :key="tab.id" :tab="tab" />
    </div>

    <SettingsView v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center; /* 居中 */
  padding: 40px 16px 16px;
  position: relative;
}

.settings-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.2s;
}
.settings-btn:hover {
  opacity: 1;
}

.countdown-zone {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-bottom: 16px;
}

.loading {
  opacity: 0.5;
  font-size: 14px;
  text-align: center;
}

.tabs-row {
  display: grid;
  /* 列数 = tab 数量；每列等宽，自适应 */
  grid-template-columns: repeat(var(--n), minmax(0, 1fr));
  gap: 6px;
  width: 100%;
  max-width: 480px;
  justify-items: stretch;
  align-items: stretch;
}
</style>