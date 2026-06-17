<template>
  <el-container class="layout-container">
    <el-aside :width="sidebarWidth" class="layout-aside">
      <div class="logo-wrapper">
        <el-icon class="logo-icon"><ShoppingCart /></el-icon>
        <span v-if="!appStore.sidebarCollapsed" class="logo-text">电商管理后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        background-color="#001529"
        text-color="#bfcbd9"
        active-text-color="#ffffff"
        router
        unique-opened
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu
            v-if="route.children && route.children.length > 0"
            :index="`/${route.path}`"
          >
            <template #title>
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon as string" />
              </el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children.filter((c: any) => c.meta?.title && !c.meta?.hidden)"
              :key="child.path"
              :index="`/${route.path}/${child.path}`"
            >
              <el-icon v-if="child.meta?.icon">
                <component :is="child.meta.icon as string" />
              </el-icon>
              <template #title>{{ child.meta?.title }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item
            v-else
            :index="`/${route.path}`"
          >
            <el-icon v-if="route.meta?.icon">
              <component :is="route.meta.icon as string" />
            </el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="toggle-btn" @click="appStore.toggleSidebar">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
              {{ item.meta?.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tooltip content="全屏" placement="bottom">
            <el-icon class="header-icon"><FullScreen /></el-icon>
          </el-tooltip>
          <el-tooltip content="通知" placement="bottom">
            <el-badge :value="5" :max="99" class="header-badge">
              <el-icon class="header-icon"><Bell /></el-icon>
            </el-badge>
          </el-tooltip>
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
              <span class="username">{{ userStore.userInfo?.nickname || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
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
import { useRoute, useRouter, type RouteRecordRaw } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const sidebarWidth = computed(() =>
  appStore.sidebarCollapsed ? '64px' : '220px'
)

const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === '/')
  return (layoutRoute?.children || []).filter(
    (r) => !r.meta?.hidden && r.meta?.title && r.meta?.icon
  ) as (RouteRecordRaw & { path: string })[]
})

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  return route.matched.filter((r) => r.meta?.title)
})

const handleCommand = async (command: string) => {
  switch (command) {
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await userStore.logout()
        ElMessage.success('已退出登录')
        router.push('/login')
      } catch {
      }
      break
    case 'profile':
      router.push('/system')
      break
    case 'settings':
      router.push('/system')
      break
  }
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.layout-container {
  height: 100vh;
}

.layout-aside {
  background-color: $sidebar-bg;
  transition: width 0.3s;
  overflow: hidden;

  .logo-wrapper {
    display: flex;
    align-items: center;
    height: $header-height;
    padding: 0 $spacing-base;
    background-color: darken($sidebar-bg, 5%);

    .logo-icon {
      font-size: 24px;
      color: $primary-color;
      flex-shrink: 0;
    }

    .logo-text {
      margin-left: $spacing-sm;
      font-size: $font-size-md;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  .el-menu {
    border-right: none;
  }
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: $header-height;
  padding: 0 $spacing-base;
  background: #fff;
  border-bottom: 1px solid $border-color-lighter;
  box-shadow: $shadow-light;

  .header-left {
    display: flex;
    align-items: center;
    gap: $spacing-base;

    .toggle-btn {
      font-size: 20px;
      cursor: pointer;
      color: $text-regular;
      transition: color 0.3s;

      &:hover {
        color: $primary-color;
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: $spacing-lg;

    .header-icon {
      font-size: 18px;
      cursor: pointer;
      color: $text-regular;
      transition: color 0.3s;

      &:hover {
        color: $primary-color;
      }
    }

    .header-badge {
      :deep(.el-badge__content) {
        top: 4px;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
      cursor: pointer;
      padding: $spacing-xs $spacing-sm;
      border-radius: $radius-base;
      transition: background 0.3s;

      &:hover {
        background: $bg-color;
      }

      .username {
        font-size: $font-size-sm;
        color: $text-regular;
      }

      .el-icon {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }
}

.layout-main {
  padding: $spacing-base;
  background-color: $bg-color;
  overflow-y: auto;
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
