<template>
  <div class="layout-container">
    <el-container>
      <el-aside :width="sidebarWidth" class="sidebar">
        <Sidebar />
      </el-aside>
      <el-container>
        <el-header class="header">
          <Navbar />
        </el-header>
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/store/modules/app'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'

const appStore = useAppStore()

const sidebarWidth = computed(() => {
  return appStore.sidebarCollapsed ? '64px' : '220px'
})
</script>

<style lang="scss" scoped>
.layout-container {
  width: 100%;
  height: 100%;

  :deep(.el-container) {
    height: 100%;
  }

  .sidebar {
    background-color: #304156;
    transition: width 0.3s;
    overflow: hidden;
  }

  .header {
    height: 60px;
    background-color: #fff;
    border-bottom: 1px solid #e4e7ed;
    padding: 0;
  }

  .main-content {
    padding: 20px;
    background-color: #f5f7fa;
    overflow-x: hidden;
  }
}

.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
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
