<template>
  <div class="app-wrapper" :class="{ 'sidebar-collapsed': !appStore.sidebarOpened }">
    <Sidebar class="sidebar-container" />
    <div class="main-container">
      <Header />
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
import Header from './Header.vue'
import { useAppStore } from '@/store/modules/app'

const appStore = useAppStore()
</script>

<style lang="scss" scoped>
.app-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  display: flex;
  transition: all 0.28s;

  &.sidebar-collapsed {
    .main-container {
      margin-left: 64px;
    }
  }
}

.sidebar-container {
  width: 210px;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
  transition: width 0.28s;
  overflow: hidden;
}

.sidebar-collapsed .sidebar-container {
  width: 64px;
}

.main-container {
  min-height: 100vh;
  margin-left: 210px;
  transition: margin-left 0.28s;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  padding: 20px;
  background-color: #f0f2f5;
  min-height: calc(100vh - 60px);
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
