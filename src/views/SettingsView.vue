<script setup lang="ts">
import { ref, watch } from "vue";
import { useConfigStore } from "../stores/config";

const emit = defineEmits<{ close: [] }>();
const config = useConfigStore();

const offTime = ref(config.offTime);

// 同步初始值（config.load() 完成后才用真实值）
watch(
  () => config.offTime,
  (val) => {
    offTime.value = val;
  }
);

// 用户调整时保存
watch(offTime, async (val) => {
  if (val !== config.offTime) {
    await config.setOffTime(val);
  }
});
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="panel">
      <h2>设置</h2>

      <div class="field">
        <label for="off-time">下班时间</label>
        <input id="off-time" type="time" v-model="offTime" />
      </div>

      <div class="hint">修改后自动保存</div>

      <button class="close-btn" @click="emit('close')">完成</button>
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
  padding: 24px 28px;
  border-radius: 12px;
  min-width: 320px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

h2 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 6px;
}

input[type="time"] {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 15px;
  background: var(--color-bg);
  color: var(--color-text);
}

input[type="time"]:focus {
  outline: none;
  border-color: var(--color-primary);
}

.hint {
  font-size: 12px;
  opacity: 0.5;
  margin-bottom: 16px;
}

.close-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  width: 100%;
}
</style>