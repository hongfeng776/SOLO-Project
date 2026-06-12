<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/store';
import { buildMenus } from '@/utils/menu';
import router from '@/router';
import type { MenuItem } from '@/utils/menu';

const appStore = useAppStore();
const route = useRoute();
const vueRouter = useRouter();

const menus = computed<MenuItem[]>(() => {
  const main = router.options.routes.find((r) => r.path === '/');
  if (!main?.children) return [];
  return buildMenus(main.children, '');
});

const collapsed = computed(() => appStore.sidebarCollapsed);
const activeMenu = computed(() => route.path);
const openKeys = computed<string[]>(() => {
  return route.matched.filter((r) => r.path !== '/' && r.path !== route.path).map((r) => r.path);
});

const handleSelect = (key: string) => {
  vueRouter.push(key);
};

const resolveIcon = (icon?: string) => {
  if (!icon) return undefined;
  const allIcons = (import.meta as any).globEager?.('@element-plus/icons-vue') ?? {};
  return (allIcons as any)[icon] || icon;
};
</script>

<template>
  <aside class="layout-sidebar" :class="{ collapsed }">
    <div class="sidebar-logo">
      <svg viewBox="0 0 64 64" class="logo-icon">
        <rect width="64" height="64" rx="12" fill="#1677ff" />
        <path d="M18 46V18h6l10 16V18h6v28h-6L24 30v16z" fill="#fff" />
      </svg>
      <transition name="fade">
        <span v-if="!collapsed" class="logo-text">标注系统</span>
      </transition>
    </div>
    <nav class="sidebar-nav">
      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        :default-openeds="openKeys"
        background-color="transparent"
        text-color="#4e5969"
        active-text-color="#1677ff"
        @select="handleSelect"
        unique-opened
        class="sidebar-menu"
      >
        <template v-for="menu in menus" :key="menu.path">
          <el-sub-menu v-if="menu.children && menu.children.length" :index="menu.path">
            <template #title>
              <el-icon v-if="menu.icon"><component :is="resolveIcon(menu.icon)" /></el-icon>
              <span>{{ menu.title }}</span>
            </template>
            <el-menu-item v-for="sub in menu.children" :key="sub.path" :index="sub.path">
              <el-icon v-if="sub.icon"><component :is="resolveIcon(sub.icon)" /></el-icon>
              <template #title>{{ sub.title }}</template>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-else :index="menu.path">
            <el-icon v-if="menu.icon"><component :is="resolveIcon(menu.icon)" /></el-icon>
            <template #title>{{ menu.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </nav>
    <div class="sidebar-footer">
      <transition name="fade">
        <span v-if="!collapsed" class="version">v1.0.0</span>
      </transition>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.layout-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid $color-border-light;
  display: flex;
  flex-direction: column;
  height: 100%;
  transition: width $duration-base $ease-in-out;
  overflow: hidden;
  box-shadow: -1px 0 0 0 rgba(0, 0, 0, 0.02) inset;

  &.collapsed {
    width: 64px;
    .sidebar-nav {
      padding: 4px 0;
    }
  }
}

.sidebar-logo {
  height: $header-height;
  min-height: $header-height;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 0 $spacing-md;
  border-bottom: 1px solid $color-border-light;
  background: linear-gradient(90deg, rgba(22, 119, 255, 0.02), transparent);
  overflow: hidden;

  .logo-icon {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
  }
  .logo-text {
    font-size: $font-size-lg;
    font-weight: 600;
    color: $color-text-primary;
    white-space: nowrap;
  }
}

.sidebar-nav {
  flex: 1;
  padding: $spacing-sm 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu {
  border: none !important;
}

.sidebar-footer {
  padding: $spacing-sm $spacing-md;
  border-top: 1px solid $color-border-light;
  text-align: center;
  .version {
    font-size: $font-size-xs;
    color: $color-text-placeholder;
  }
}
</style>
