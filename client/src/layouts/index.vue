<template>
  <el-container class="layout-container">
    <el-aside :width="sidebarWidth" class="layout-aside">
      <div class="logo">
        <img src="/vite.svg" alt="logo" class="logo-img" />
        <span v-show="!appStore.sidebar.collapsed" class="logo-text">
          {{ appTitle }}
        </span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebar.collapsed"
        background-color="#1A2332"
        text-color="#C0CCDA"
        active-text-color="#409EFF"
        router
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-menu-item :index="`/${route.path}`">
            <el-icon><component :is="route.meta.icon" /></el-icon>
            <template #title>{{ route.meta.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar()">
            <Fold v-if="!appStore.sidebar.collapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :icon="UserFilled" />
              <span class="username">{{ userStore.userInfo?.username || '用户' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@stores/app'
import { useUserStore } from '@stores/user'
import {
  Fold,
  Expand,
  UserFilled,
  User,
  SwitchButton,
  ArrowDown,
  DataLine,
  TrendCharts,
  Goods,
  User as UserIcon,
  Wallet,
  Tickets,
  Setting
} from '@element-plus/icons-vue'
import type { RouteRecordRaw } from 'vue-router'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const appTitle = import.meta.env.VITE_APP_TITLE || '智投金融资产管理系统'

const iconMap: Record<string, any> = {
  '工作台': DataLine,
  '行情管理': TrendCharts,
  '产品管理': Goods,
  '客户资产': UserIcon,
  '资金流水': Wallet,
  '合规审计': Tickets,
  '用户管理': UserIcon,
  '角色管理': User,
  '权限管理': Setting
}

const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find(r => r.path === '/')
  if (!layoutRoute || !layoutRoute.children) return []
  return layoutRoute.children
    .filter(child => child.meta && child.meta.title)
    .map(child => ({
      ...child,
      meta: {
        ...child.meta,
        icon: iconMap[child.meta.title as string] || DataAnalysis
      }
    })) as RouteRecordRaw[]
})

const sidebarWidth = computed(() => {
  return appStore.sidebar.collapsed ? '64px' : '220px'
})

const activeMenu = computed(() => {
  return route.path
})

const breadcrumbs = computed(() => {
  return route.matched.filter(r => r.meta && r.meta.title)
})

const handleCommand = (command: string) => {
  if (command === 'logout') {
    userStore.logout()
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: $fin-sidebar-bg;
  transition: width 0.3s;
  overflow: hidden;

  .logo {
    height: $fin-header-height;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-img {
      width: 32px;
      height: 32px;
    }

    .logo-text {
      margin-left: 12px;
      color: #fff;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .sidebar-menu {
    border-right: none;
  }
}

.layout-header {
  background-color: $fin-header-bg;
  border-bottom: 1px solid $fin-border;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: $fin-header-height;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: $fin-text-regular;
      transition: color 0.3s;

      &:hover {
        color: $fin-primary;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      transition: background-color 0.3s;

      &:hover {
        background-color: $fin-bg;
      }

      .username {
        font-size: 14px;
        color: $fin-text-primary;
      }
    }
  }
}

.layout-main {
  background-color: $fin-bg;
  padding: 24px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
