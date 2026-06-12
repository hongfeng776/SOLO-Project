<script setup lang="ts">
import { RouterView } from 'vue-router';
import { watch, provide } from 'vue';
import { useAppStore, useUserStore } from '@/store';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';

const appStore = useAppStore();
const userStore = useUserStore();

provide('appStore', appStore);
provide('userStore', userStore);

watch(
  () => appStore.theme,
  (val) => {
    document.documentElement.classList.toggle('dark', val === 'dark');
  },
  { immediate: true },
);

const handleResize = () => {
  appStore.setDevice(window.innerWidth < 768 ? 'mobile' : 'desktop');
  if (window.innerWidth < 768) {
    appStore.setSidebarCollapsed(true);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('resize', handleResize, { passive: true });
  handleResize();
}
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="app-root h-full w-full">
      <RouterView v-slot="{ Component, route }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </RouterView>
    </div>
  </el-config-provider>
</template>

<style lang="scss" scoped>
.app-root {
  background: $bg-color-page;
}
</style>
