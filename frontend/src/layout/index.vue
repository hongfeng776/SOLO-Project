<template>
  <div class="layout-container">
    <el-container class="layout-wrapper">
      <el-aside :width="sidebarWidth" class="layout-sidebar">
        <Sidebar />
      </el-aside>
      <el-container class="layout-main">
        <el-header class="layout-header">
          <Header />
        </el-header>
        <el-main class="layout-content">
          <router-view v-slot="{ Component, route }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Sidebar from './Sidebar.vue';
import Header from './Header.vue';
import { useAppStore } from '@/store/modules/app';

const appStore = useAppStore();
const sidebarWidth = computed(() => appStore.sidebarWidth);
</script>

<style lang="scss" scoped>
.layout-container {
  width: 100%;
  height: 100%;
}

.layout-wrapper {
  height: 100%;
}

.layout-sidebar {
  background-color: $sidebar-bg;
  transition: width $transition-base;
  overflow: hidden;
}

.layout-main {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-header {
  height: $header-height;
  background: $bg-white;
  border-bottom: 1px solid $border-color;
  padding: 0;
  display: flex;
  align-items: center;
}

.layout-content {
  flex: 1;
  padding: $spacing-lg;
  overflow-y: auto;
  background-color: $bg-color;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-base;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
