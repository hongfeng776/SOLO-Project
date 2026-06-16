<template>
  <div class="ccb-container">
    <div class="ccb-main-wrapper">
      <Sidebar />
      <div class="ccb-content-wrapper">
        <Navbar />
        <TagsView />
        <main class="ccb-main-content">
          <router-view v-slot="{ Component, route }">
            <transition name="fade-transform" mode="out-in">
              <keep-alive :include="cachedViews">
                <component :is="Component" :key="route.fullPath" />
              </keep-alive>
            </transition>
          </router-view>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
import Navbar from './components/Navbar.vue'
import TagsView from './components/TagsView.vue'
import { tagsViewStore } from '@store'

const tStore = tagsViewStore()
const cachedViews = computed<string[]>(() => tStore.cachedViews)
</script>

<style lang="scss" scoped>
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
