<template>
  <el-container class="app-layout">
    <el-aside :width="appStore.isCollapsed ? '64px' : '220px'" class="sidebar-container">
      <Sidebar />
    </el-aside>
    <el-container class="main-container">
      <el-header class="header-container" height="60px">
        <Header />
      </el-header>
      <Tabs v-if="showTabs" />
      <el-main class="app-main">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <keep-alive>
              <component :is="Component" :key="route.path" />
            </keep-alive>
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@stores/modules/app'
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import Tabs from './Tabs.vue'

const appStore = useAppStore()
const showTabs = computed(() => true)
</script>

<style lang="scss" scoped>
.app-layout {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.sidebar-container {
  background-color: $bg-container;
  border-right: 1px solid $border-color-lighter;
  transition: width 0.3s ease;
  overflow: hidden;
}

.main-container {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-container {
  padding: 0;
  border-bottom: 1px solid $border-color-lighter;
  background-color: $bg-container;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  background-color: $bg-body;
  padding: 20px;
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s ease;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
