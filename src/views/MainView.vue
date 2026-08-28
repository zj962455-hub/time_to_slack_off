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

    <Countdown v-if="config.loaded && config.offTime" :off-time="config.offTime" />

    <div v-else class="loading">加载中…</div>

    <div v-if="config.loaded && visibleTabs.length > 0" class="tabs-container">
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
  padding: 60px 0 20px 0;
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

.loading {
  opacity: 0.5;
  font-size: 14px;
  text-align: center;
  margin-top: 40vh;
}

.tabs-container {
  margin-top: 24px;
  flex: 1;
}
</style>