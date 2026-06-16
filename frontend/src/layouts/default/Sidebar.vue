<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

interface MenuItem {
  path: string
  title: string
  icon?: string
  children?: MenuItem[]
  roles?: string[]
}

const generateMenus = (): MenuItem[] => {
  const routes = router.options.routes.find((r) => r.path === '/')?.children || []
  return routes
    .filter((r) => !r.meta?.hidden && r.name && r.path)
    .filter((r) => {
      if (!r.meta?.roles) return true
      const roles = r.meta.roles as string[]
      if (roles.includes('*')) return true
      return userStore.hasRole(roles) || roles.some((p) => userStore.hasPermission([p]))
    })
    .map((r) => {
      const item: MenuItem = {
        path: r.path.startsWith('/') ? r.path : `/${r.path}`,
        title: r.meta?.title as string,
        icon: r.meta?.icon as string,
        roles: r.meta?.roles as string[],
      }
      if (r.children && r.children.length > 0) {
        const children = r.children
          .filter((c) => !c.meta?.hidden && c.name && c.path)
          .filter((c) => {
            if (!c.meta?.roles) return true
            const roles = c.meta.roles as string[]
            if (roles.includes('*')) return true
            return userStore.hasRole(roles) || roles.some((p) => userStore.hasPermission([p]))
          })
        if (children.length > 0) {
          item.children = children.map((c) => ({
            path: `${item.path}/${c.path}`,
            title: c.meta?.title as string,
            icon: c.meta?.icon as string,
            roles: c.meta?.roles as string[],
          }))
        }
      }
      return item
    })
}

const menuItems = computed(() => generateMenus())

const activeMenu = computed(() => {
  const path = route.path
  for (const item of menuItems.value) {
    if (path === item.path) return item.path
    if (item.children) {
      const found = item.children.find((c) => path === c.path || path.startsWith(c.path + '/'))
      if (found) return found.path
    }
  }
  return ''
})

const handleSelect = (index: string) => {
  router.push(index)
}

const iconComponent = (name: string) => {
  const icons = import('@element-plus/icons-vue') as any
  return icons[name] || null
}
</script>

<template>
  <div class="qy-sidebar">
    <div class="sidebar-logo">
      <el-icon :size="24" color="#409EFF"><VideoCamera /></el-icon>
      <span v-if="!appStore.sidebarCollapsed" class="logo-text">奇影运营平台</span>
    </div>
    <div class="sidebar-menu">
      <el-menu
        :default-active="activeMenu"
        :collapse="appStore.sidebarCollapsed"
        :collapse-transition="false"
        background-color="transparent"
        text-color="#BFCBD9"
        active-text-color="#409EFF"
        unique-opened
        router
        @select="handleSelect"
      >
        <template v-for="item in menuItems" :key="item.path">
          <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
            <template #title>
              <el-icon v-if="item.icon">
                <component :is="iconComponent(item.icon)" />
              </el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path"
              :index="child.path"
            >
              <el-icon v-if="child.icon">
                <component :is="iconComponent(child.icon)" />
              </el-icon>
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.icon">
              <component :is="iconComponent(item.icon)" />
            </el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.qy-sidebar {
  width: 220px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $sidebar-bg;
  transition: width 0.3s ease;
}

:deep(.is-collapsed) .qy-sidebar {
  width: 64px;
}

.sidebar-logo {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  .logo-text {
    font-size: $font-lg;
    font-weight: 600;
    color: $bg-white;
    white-space: nowrap;
    overflow: hidden;
  }
}

.sidebar-menu {
  flex: 1;
  overflow: auto;
  padding: 12px 0;

  :deep(.el-menu) {
    border-right: none;

    .el-menu-item,
    .el-sub-menu__title {
      height: 48px;
      line-height: 48px;
      border-radius: 4px;
      margin: 2px 8px;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .el-icon {
        margin-right: 8px;
        font-size: 18px;
      }
    }

    .el-menu-item.is-active {
      background: rgba(64, 158, 255, 0.15);
      color: $primary-color !important;

      &::before {
        content: '';
        position: absolute;
        left: -8px;
        top: 0;
        bottom: 0;
        width: 3px;
        background: $primary-color;
        border-radius: 0 2px 2px 0;
      }
    }

    .el-sub-menu .el-menu-item {
      background: transparent;
      min-width: auto;
      margin: 0;
      padding-left: 48px !important;
    }
  }
}

::-webkit-scrollbar {
  width: 4px;
}
</style>
