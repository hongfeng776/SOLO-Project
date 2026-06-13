<template>
  <div class="sidebar">
    <div class="logo-container" :class="{ collapsed: isCollapse }">
      <el-icon class="logo-icon"><DataLine /></el-icon>
      <span v-if="!isCollapse" class="logo-text">红境</span>
    </div>
    <el-scrollbar class="menu-scrollbar">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#001529"
        text-color="#b8c7ce"
        active-text-color="#fff"
        router
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu
            v-if="!route.meta?.hidden && route.children && route.children.length > 0"
            :index="route.path"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="getIconComponent(route.meta.icon as string)" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children.filter(c => !c.meta?.hidden)"
              :key="child.path"
              :index="resolveChildPath(route.path, child.path)"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="getIconComponent(child.meta.icon as string)" />
              </el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else-if="!route.meta?.hidden && (!route.children || route.children.length === 0)"
            :index="resolvePath(route.path)"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="getIconComponent(route.meta.icon as string)" />
            </el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue'
import { useRoute } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import {
  DataLine,
  HomeFilled,
  Setting,
  User,
  UserFilled
} from '@element-plus/icons-vue'
import { constantRoutes } from '@/router'

const iconMap: Record<string, Component> = {
  DataLine,
  HomeFilled,
  Setting,
  User,
  UserFilled
}

interface Props {
  isCollapse: boolean
}

defineProps<Props>()
const route = useRoute()

const menuRoutes = computed(() => {
  const layoutRoute = constantRoutes.find((r) => r.path === '/')
  return (layoutRoute?.children || []).filter((r) => !r.meta?.hidden) as RouteRecordRaw[]
})

const activeMenu = computed(() => route.path)

function resolvePath(path: string) {
  if (path.startsWith('/')) return path
  return `/${path}`
}

function resolveChildPath(parentPath: string, childPath: string) {
  if (childPath.startsWith('/')) return childPath
  if (parentPath.endsWith('/')) return parentPath + childPath
  return `${parentPath}/${childPath}`
}

function getIconComponent(iconName: string | undefined): Component | null {
  if (!iconName) return null
  return iconMap[iconName] || null
}
</script>

<style scoped lang="scss">
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background-color: #002140;
  padding: 0 16px;
  overflow: hidden;

  &.collapsed {
    padding: 0;
  }

  .logo-icon {
    font-size: 28px;
    color: #fff;
  }

  .logo-text {
    font-size: 18px;
    font-weight: bold;
    color: #fff;
    white-space: nowrap;
  }
}

.menu-scrollbar {
  flex: 1;
  overflow: hidden;
}

:deep(.el-menu) {
  border-right: none;

  .el-sub-menu__title,
  .el-menu-item {
    min-width: 64px;
    height: 50px;
    line-height: 50px;

    &:hover {
      background-color: #1f2d3d !important;
    }
  }

  .el-menu-item.is-active {
    background-color: #1890ff !important;
  }

  .el-sub-menu {
    .el-menu {
      background-color: #000c17 !important;
    }

    .el-menu-item {
      padding-left: 50px !important;
    }
  }

  .el-icon {
    margin-right: 8px;
    font-size: 18px;
  }
}
</style>
