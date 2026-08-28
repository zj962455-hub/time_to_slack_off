<script setup lang="ts">
import MainView from "./views/MainView.vue";
</script>

<template>
  <MainView />
</template>

<style>
:root {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--color-text);
  font-feature-settings: "tnum"; /* 等宽数字 */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  background: transparent;
  overflow: hidden;
}

body {
  background: transparent !important;
  -webkit-user-select: none;
  user-select: none;
}
</style>