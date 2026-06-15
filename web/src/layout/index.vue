<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

const collapse = ref(false)
const router = useRouter()
const route = useRoute()

const transitionName = ref('fade')
const previousPath = ref('')

watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    const from = (oldPath as string) || ''
    const to = newPath || ''
    if (from && from !== to) {
      previousPath.value = from
    }
    if (isVocabularyDetail(to) && isVocabularyList(previousPath.value)) {
      transitionName.value = 'slide-right'
    } else if (isVocabularyList(to) && isVocabularyDetail(previousPath.value)) {
      transitionName.value = 'slide-left'
    } else {
      transitionName.value = 'fade'
    }
  }
)

function isVocabularyList(path: string) {
  return path.startsWith('/biz/vocabulary') && !path.includes('/detail')
}

function isVocabularyDetail(path: string) {
  return path.startsWith('/biz/vocabulary/detail')
}

const sidebarWidth = computed(() => (collapse.value ? '64px' : '220px'))

const menuRoutes = computed(() => {
  return router.options.routes.filter((route: RouteRecordRaw) => {
    return !route.meta?.hidden && route.children && route.children.length > 0
  })
})

const activeMenu = computed(() => {
  if (route.path.startsWith('/biz/vocabulary')) {
    return '/biz/vocabulary'
  }
  return route.path
})

function handleCollapse() {
  collapse.value = !collapse.value
}
</script>

<template>
  <div class="layout-container">
    <Sidebar
      :collapse="collapse"
      :menu-routes="menuRoutes"
      :active-menu="activeMenu"
      :style="{ width: sidebarWidth }"
    />
    <div class="main-container" :style="{ marginLeft: sidebarWidth }">
      <Header :collapse="collapse" @collapse="handleCollapse" />
      <div class="content-wrapper">
        <router-view v-slot="{ Component }">
          <transition :name="transitionName" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.layout-container {
  height: 100%;
  width: 100%;
  position: relative;
}

.main-container {
  height: 100%;
  transition: margin-left $transition-duration;
  overflow: hidden;
}

.content-wrapper {
  height: calc(100% - #{$header-height});
  overflow-y: auto;
  background-color: $background-color;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity $transition-duration ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.35s ease, opacity 0.35s ease;
  position: absolute;
  width: 100%;
  height: 100%;
}

.slide-right-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-left-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style>
