<template>
  <div class="default-layout">
    <Sidebar :title="appTitle" class="default-layout__sidebar" />
    <div class="default-layout__main">
      <HeaderBar />
      <div class="default-layout__content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import HeaderBar from '@/components/layout/HeaderBar.vue'

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || '管理系统')
</script>

<style scoped lang="scss">
.default-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;

  &__sidebar {
    flex-shrink: 0;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #f0f2f5;
  }

  &__content {
    flex: 1;
    padding: 20px;
    overflow: auto;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
