<template>
  <div class="layout-container" :class="{ 'is-collapsed': appStore.sidebarCollapsed }">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <el-icon :size="28" color="#409eff"><Picture /></el-icon>
        <span v-show="!appStore.sidebarCollapsed" class="logo-text">影创智修</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :unique-opened="true"
        background-color="#001529"
        text-color="rgba(255,255,255,0.75)"
        active-text-color="#ffffff"
        router
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <el-sub-menu v-if="route.children && route.children.length > 0" :index="route.path">
            <template #title>
              <el-icon><component :is="route.meta?.icon" /></el-icon>
              <span>{{ route.meta?.title }}</span>
            </template>
            <el-menu-item
              v-for="child in route.children"
              :key="child.path"
              :index="resolvePath(route.path, child.path)"
            >
              <el-icon><component :is="child.meta?.icon" /></el-icon>
              <span>{{ child.meta?.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="route.path">
            <el-icon><component :is="route.meta?.icon" /></el-icon>
            <template #title>{{ route.meta?.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </aside>

    <div class="main-container">
      <header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar()">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbs"
              :key="index"
              :to="index === breadcrumbs.length - 1 ? undefined : item.path"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                {{ userStore.userInfo?.nickname?.charAt(0) || 'U' }}
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.nickname || userStore.userInfo?.username }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Fold,
  Expand,
  CaretBottom,
  User,
  Setting,
  SwitchButton,
  Picture
} from '@element-plus/icons-vue'
import { useUserStore, useAppStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const appStore = useAppStore()

const menuRoutes = computed(() => {
  const layoutRoute = route.matched.find(r => r.path === '/')
  if (!layoutRoute || !layoutRoute.children) return []

  return layoutRoute.children.filter((r: any) => {
    if (!r.meta?.title) return false
    if (r.meta?.roles && r.meta.roles.length > 0) {
      return r.meta.roles.includes(userStore.userRole)
    }
    return true
  })
})

const activeMenu = computed(() => {
  return route.path
})

const breadcrumbs = computed(() => {
  const crumbs: { title: string; path: string }[] = []

  route.matched.forEach((r) => {
    if (r.meta?.title && r.path !== '/') {
      crumbs.push({
        title: r.meta.title as string,
        path: r.path
      })
    }
  })

  return crumbs
})

const resolvePath = (parent: string, child: string) => {
  if (child.startsWith('/')) return child
  return parent === '/' ? `/${child}` : `${parent}/${child}`
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/settings')
      break
    case 'settings':
      router.push('/settings')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await userStore.logout()
          ElMessage.success('退出成功')
          router.push('/login')
        } catch (error) {
          console.error('退出失败:', error)
        }
      }).catch(() => {})
      break
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.layout-container {
  display: flex;
  width: 100%;
  height: 100%;

  .sidebar {
    width: $sidebar-width;
    height: 100%;
    background: #001529;
    transition: width $transition-duration;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;

    .sidebar-logo {
      height: $header-height;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);

      .logo-text {
        font-size: $font-size-large;
        font-weight: 600;
        color: #fff;
        white-space: nowrap;
      }
    }

    .sidebar-menu {
      flex: 1;
      border-right: none;
      overflow-y: auto;
      overflow-x: hidden;

      :deep(.el-menu-item),
      :deep(.el-sub-menu__title) {
        height: 50px;
        line-height: 50px;
      }

      :deep(.el-menu-item.is-active) {
        background: $primary-color;
      }

      :deep(.el-sub-menu .el-menu-item) {
        padding-left: 50px !important;
      }
    }
  }

  &.is-collapsed .sidebar {
    width: $sidebar-collapsed-width;
  }

  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .header {
      height: $header-height;
      background: $bg-color-ffffff;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 20px;
      flex-shrink: 0;

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .collapse-btn {
          font-size: 20px;
          color: $text-regular;
          cursor: pointer;
          transition: color $transition-duration;

          &:hover {
            color: $primary-color;
          }
        }
      }

      .header-right {
        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;

          .username {
            font-size: $font-size-base;
            color: $text-regular;
          }
        }
      }
    }

    .main-content {
      flex: 1;
      overflow: auto;
      background: $bg-color-page;
    }
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
