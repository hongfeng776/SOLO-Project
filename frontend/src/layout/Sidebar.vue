<template>
  <div class="sidebar">
    <div class="logo">
      <el-icon size="24" color="#fff"><Van /></el-icon>
      <span v-if="!appStore.sidebarCollapsed" class="logo-text">程行智联</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="appStore.sidebarCollapsed"
      :unique-opened="true"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      router
    >
      <template v-for="route in menuRoutes" :key="route.path">
        <el-sub-menu v-if="route.children && route.children.length > 1" :index="route.path">
          <template #title>
            <el-icon><component :is="route.meta?.icon" /></el-icon>
            <span>{{ route.meta?.title }}</span>
          </template>
          <el-menu-item
            v-for="child in route.children.filter(c => !c.meta?.hidden)"
            :key="child.path"
            :index="resolvePath(route.path, child.path)"
          >
            <el-icon><component :is="child.meta?.icon" /></el-icon>
            <template #title>{{ child.meta?.title }}</template>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item v-else-if="route.children && route.children.length === 1" :index="resolvePath(route.path, route.children[0].path)">
          <el-icon><component :is="route.meta?.icon" /></el-icon>
          <template #title>{{ route.meta?.title }}</template>
        </el-menu-item>
      </template>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/store/modules/app'
import router from '@/router'

const appStore = useAppStore()
const route = useRoute()

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => {
  return router.options.routes.filter(
    (r: any) => r.path !== '/login' && r.meta && !r.meta.hidden
  )
})

const resolvePath = (parent: string, child: string) => {
  if (child.startsWith('/')) return child
  return `${parent}/${child}`.replace(/\/+/g, '/')
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: #2b2f3a;
    border-bottom: 1px solid #1f2d3d;

    .logo-text {
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      white-space: nowrap;
    }
  }

  :deep(.el-menu) {
    border-right: none;
    flex: 1;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 50px;
    line-height: 50px;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: #263445 !important;
  }

  :deep(.el-menu-item.is-active) {
    background-color: #263445 !important;
  }
}
</style>
