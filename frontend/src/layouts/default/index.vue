<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore, useUserStore } from '@/stores'
import QySidebar from './Sidebar.vue'
import QyHeader from './Header.vue'
import QyBreadcrumb from './Breadcrumb.vue'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

const sidebarWidth = computed(() => `${appStore.sidebarWidth}px`)

const showSidebar = computed(() => {
  return !route.meta.hideSidebar
})

const handleResize = () => {
  const isMobile = window.innerWidth < 768
  appStore.setDevice(isMobile ? 'mobile' : 'desktop')
  if (isMobile) {
    appStore.setSidebarCollapsed(true)
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="layout-container" :class="{ 'is-collapsed': appStore.sidebarCollapsed }">
    <transition name="sidebar-transition">
      <qy-sidebar v-if="showSidebar" class="layout-sidebar" />
    </transition>

    <div class="layout-main" :style="{ marginLeft: showSidebar ? sidebarWidth : '0' }">
      <qy-header />
      <qy-breadcrumb />
      <div class="layout-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <div class="layout-footer">
        <span>© 2024 奇影内容运营管理平台 · Powered by Vue3 + Node.js</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-container {
  width: 100%;
  height: 100%;
  background: $bg-page;
}

.layout-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 1001;
  overflow: hidden;
  background: $sidebar-bg;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.layout-main {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.layout-content {
  flex: 1;
  padding: $content-padding;
  overflow: auto;
}

.layout-footer {
  height: $footer-height;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $font-xs;
  color: $text-placeholder;
  background: $bg-white;
  border-top: 1px solid $border-lighter;
}

.sidebar-transition-enter-active,
.sidebar-transition-leave-active {
  transition: all 0.3s ease;
}

.sidebar-transition-enter-from,
.sidebar-transition-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.is-collapsed {
  .layout-sidebar {
    width: 64px !important;
  }
}
</style>
