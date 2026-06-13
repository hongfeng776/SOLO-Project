<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <el-icon v-if="isCollapse" :size="28"><Briefcase /></el-icon>
        <span v-else class="logo-text">职擎招聘管理平台</span>
      </div>
      <el-scrollbar class="menu-scrollbar">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :collapse-transition="false"
          router
          background-color="#001529"
          text-color="rgba(255,255,255,0.65)"
          active-text-color="#409EFF"
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <el-menu-item :index="resolvePath(route.path)" v-if="!route.children || route.children.length === 0">
              <el-icon v-if="route.meta?.icon">
                <component :is="route.meta.icon" />
              </el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
            <el-sub-menu :index="resolvePath(route.path)" v-else>
              <template #title>
                <el-icon v-if="route.meta?.icon">
                  <component :is="route.meta.icon" />
                </el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              <el-menu-item
                v-for="child in route.children.filter((c) => !c.meta?.hidden)"
                :key="child.path"
                :index="resolvePath(route.path + '/' + child.path)"
              >
                <template #title>{{ child.meta?.title }}</template>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-scrollbar>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" :size="20" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path">
              {{ item.meta?.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.avatar">
                {{ userStore.nickname?.charAt(0) }}
              </el-avatar>
              <span class="username">{{ userStore.nickname }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon> 个人中心
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon> 退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/stores'
import { useConfirm } from '@/components/useConfirm'
import type { RouteRecordRaw } from '@/router/types'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()
const { confirm, success, error } = useConfirm()

const isCollapse = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)

const menuRoutes = computed<RouteRecordRaw[]>(() => {
  return router.options.routes
    .find((r) => r.path === '/')
    ?.children?.filter((r: RouteRecordRaw) => !r.meta?.hidden) as RouteRecordRaw[]
})

const breadcrumbList = computed(() => {
  return route.matched.filter((r) => r.meta && r.meta.title)
})

function toggleCollapse() {
  appStore.toggleSidebar()
}

function resolvePath(path: string) {
  if (path.startsWith('/')) return path
  return '/' + path
}

async function handleCommand(command: string) {
  if (command === 'logout') {
    const ok = await confirm('确定要退出登录吗？', '退出确认')
    if (ok) {
      try {
        userStore.logout()
        success('退出成功')
        router.push('/login')
      } catch (e) {
        error('退出失败')
      }
    }
  } else if (command === 'profile') {
    success('个人中心功能开发中...')
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.layout-aside {
  background: #001529;
  transition: width 0.28s;
  overflow: hidden;
  flex-shrink: 0;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #002140;
  overflow: hidden;

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    white-space: nowrap;
  }

  .el-icon {
    color: #409eff;
  }
}

.menu-scrollbar {
  height: calc(100vh - 60px);
}

:deep(.el-menu) {
  border-right: none;
}

.layout-header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    .collapse-btn {
      cursor: pointer;
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }
  }

  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      padding: 0 8px;
      height: 60px;

      &:hover {
        background: #f5f7fa;
      }

      .username {
        color: #303133;
        font-size: 14px;
      }
    }
  }
}

.layout-main {
  background: #f0f2f5;
  padding: 20px;
  overflow: auto;
}
</style>
