<script setup lang="ts">
import MainView from "./views/MainView.vue";
</script>

<template>
  <MainView />
</template>

<style>
:root {
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 16px;
  line-height: 1.5;
  color: var(--color-text);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  background: transparent;
  overflow: hidden;
}

body {
  background: transparent !important;
}
</style>