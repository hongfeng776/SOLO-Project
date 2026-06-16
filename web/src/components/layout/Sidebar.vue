<template>
  <div class="sidebar">
    <div class="sidebar__logo">
      <el-icon :size="24" color="#fff"><DataAnalysis /></el-icon>
      <span v-if="!collapsed">{{ title }}</span>
    </div>
    <el-scrollbar class="sidebar__scroll">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item v-if="!route.meta?.hidden" :index="resolvePath(route.path)">
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon" />
            </el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

defineProps<{
  title?: string
}>()

const appStore = useAppStore()
const route = useRoute()
const router = useRouter()

const collapsed = computed(() => appStore.sidebarCollapsed)

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === '/')
  return (layoutRoute?.children || []).filter((r) => r.meta && !r.meta.hidden)
})

function resolvePath(path: string) {
  return path.startsWith('/') ? path : `/${path}`
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 210px;
  height: 100%;
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;

  &.is-collapsed {
    width: 64px;
  }

  &__logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: #2b2f3a;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    overflow: hidden;
    white-space: nowrap;
  }

  &__scroll {
    height: calc(100vh - 60px);
  }

  :deep(.el-menu) {
    border-right: none;
  }
}
</style>
