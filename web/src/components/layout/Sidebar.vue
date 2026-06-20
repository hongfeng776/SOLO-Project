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
          <template v-if="hasVisibleChildren(route)">
            <el-sub-menu :index="resolvePath(route.path)">
              <template #title>
                <el-icon v-if="route.meta?.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              <el-menu-item
                v-for="child in getVisibleChildren(route)"
                :key="child.path"
                :index="resolveChildPath(route.path, child.path)"
              >
                <el-icon v-if="child.meta?.icon">
                  <component :is="child.meta.icon" />
                </el-icon>
                <template #title>{{ child.meta?.title }}</template>
              </el-menu-item>
            </el-sub-menu>
          </template>
          <el-menu-item v-else-if="!route.meta?.hidden" :index="resolvePath(route.path)">
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
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
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

function resolvePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

function resolveChildPath(parentPath: string, childPath: string): string {
  const parent = resolvePath(parentPath)
  if (childPath.startsWith('/')) return childPath
  return `${parent}/${childPath}`.replace(/\/+/g, '/')
}

function hasVisibleChildren(route: RouteRecordRaw): boolean {
  if (!route.children || route.children.length === 0) return false
  return route.children.some((c) => c.meta && !c.meta.hidden && !!c.component)
}

function getVisibleChildren(route: RouteRecordRaw): RouteRecordRaw[] {
  if (!route.children) return []
  return route.children.filter((c) => c.meta && !c.meta.hidden && !!c.component)
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
