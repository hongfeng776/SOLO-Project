<template>
  <div class="sidebar">
    <div class="logo">
      <img src="@/assets/logo.svg" alt="logo" v-if="appStore.sidebarOpened" />
      <span v-else>T</span>
      <h1 v-if="appStore.sidebarOpened">文旅电商后台</h1>
    </div>
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="!appStore.sidebarOpened"
        :unique-opened="true"
        router
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#ffffff"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu
            v-if="route.children && route.children.length > 0 && !route.meta?.hidden"
            :index="route.path"
          >
            <template #title>
              <el-icon><component :is="route.meta?.icon" /></el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="resolvePath(route.path, child.path)"
              v-if="!child.meta?.hidden && hasPermission(child)"
            >
              <el-icon><component :is="child.meta?.icon" /></el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else-if="!route.meta?.hidden && hasPermission(route)"
            :index="resolvePath('/', route.path)"
          >
            <el-icon><component :is="route.meta?.icon" /></el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { routes } from '@/router'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import {
  HomeFilled,
  Setting,
  User,
  UserFilled,
  Goods,
  Promotion,
  OfficeBuilding,
  Van,
  Tickets,
  List,
  Shop
} from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const menuRoutes = computed(() => {
  return routes.filter((r) => r.path !== '/login' && !r.meta?.hidden)
})

const resolvePath = (parent, child) => {
  if (child.startsWith('/')) return child
  return `${parent}/${child}`.replace(/\/+/g, '/')
}

const hasPermission = (route) => {
  if (route.meta?.roles) {
    return userStore.roles.some((role) => route.meta.roles.includes(role))
  }
  return true
}
</script>

<style lang="scss" scoped>
.sidebar {
  height: 100%;
  background-color: #001529;
  overflow: hidden;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background-color: #002140;
    color: #fff;
    font-weight: 600;
    font-size: 18px;

    img {
      width: 32px;
      height: 32px;
    }

    span {
      font-size: 24px;
      font-weight: bold;
    }

    h1 {
      margin: 0;
      font-size: 18px;
      color: #fff;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-sub-menu__title),
  :deep(.el-menu-item) {
    height: 50px;
    line-height: 50px;
  }

  :deep(.el-menu-item:hover),
  :deep(.el-sub-menu__title:hover) {
    background-color: #1890ff20 !important;
  }

  :deep(.el-menu-item.is-active) {
    background-color: #1890ff !important;
  }

  .scrollbar-wrapper {
    overflow-x: hidden !important;
  }
}
</style>
