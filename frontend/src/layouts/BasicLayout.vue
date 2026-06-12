<script setup lang="ts">
import { computed } from 'vue';
import SideBar from './components/SideBar.vue';
import AppHeader from './components/AppHeader.vue';
import { useAppStore } from '@/store';
import { RouterView } from 'vue-router';

const appStore = useAppStore();
const mainLoading = computed(() => appStore.mainLoading);
const loadingTip = computed(() => appStore.mainLoadingTip);
</script>

<template>
  <div class="basic-layout">
    <SideBar />
    <div class="layout-main">
      <AppHeader />
      <main class="layout-content">
        <div class="content-wrapper">
          <transition name="fade-slide" mode="out-in">
            <RouterView v-slot="{ Component, route }">
              <KeepAlive :include="['Dashboard']">
                <component :is="Component" :key="route.fullPath" />
              </KeepAlive>
            </RouterView>
          </transition>
        </div>
      </main>
    </div>
    <transition name="fade">
      <div v-if="mainLoading" class="main-loading-mask">
        <div class="loading-spinner"></div>
        <span class="loading-tip">{{ loadingTip }}</span>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.basic-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: $bg-color-page;
}

.layout-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.layout-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: $spacing-md;
  background: $bg-color-page;
}

.content-wrapper {
  min-height: 100%;
  max-width: 100%;
}

.main-loading-mask {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  z-index: $z-index-modal;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-md;
}
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e6f4ff;
  border-top-color: $color-primary;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-tip {
  font-size: $font-size-sm;
  color: $color-text-regular;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
