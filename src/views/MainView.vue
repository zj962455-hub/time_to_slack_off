<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useConfigStore } from "../stores/config";
import Countdown from "../components/Countdown.vue";
import SettingsView from "./SettingsView.vue";

const config = useConfigStore();
const showSettings = ref(false);

onMounted(async () => {
  await config.load();
});
</script>

<template>
  <div class="main">
    <button class="settings-btn" @click="showSettings = true" title="设置">⚙</button>

    <Countdown v-if="config.loaded && config.offTime" :off-time="config.offTime" />

    <div v-else class="loading">加载中…</div>

    <SettingsView v-if="showSettings" @close="showSettings = false" />
  </div>
</template>

<style scoped>
.main {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
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
}
</style>