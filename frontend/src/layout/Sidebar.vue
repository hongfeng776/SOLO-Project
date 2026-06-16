<template>
  <div class="sidebar-container">
    <div class="sidebar-logo">
      <span class="logo-icon">
        <el-icon :size="24"><UserFilled /></el-icon>
      </span>
      <span v-show="!collapsed" class="logo-text">优才企招</span>
    </div>
    <el-menu
      :default-active="activeMenu"
      :collapse="collapsed"
      :collapse-transition="false"
      background-color="#1f2937"
      text-color="#d1d5db"
      active-text-color="#ffffff"
      class="sidebar-menu"
      router
    >
      <el-menu-item v-for="item in menuList" :key="item.path" :index="item.path">
        <el-icon><component :is="item.icon" /></el-icon>
        <template #title>{{ item.title }}</template>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useAppStore } from '@/store/modules/app';

const route = useRoute();
const appStore = useAppStore();

const collapsed = computed(() => appStore.sidebarCollapsed);
const activeMenu = computed(() => route.path);

const menuList = ref([
  { path: '/dashboard', title: '首页', icon: 'HomeFilled' },
  { path: '/company', title: '企业管理', icon: 'OfficeBuilding' },
  { path: '/job', title: '岗位管理', icon: 'Briefcase' },
  { path: '/resume', title: '简历管理', icon: 'Document' },
  { path: '/interview', title: '面试管理', icon: 'ChatDotRound' },
  { path: '/onboard', title: '入职管理', icon: 'UserFilled' },
  { path: '/system', title: '系统管理', icon: 'Setting' },
]);
</script>

<style lang="scss" scoped>
.sidebar-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-logo {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;

  .logo-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $primary-color;
    border-radius: $border-radius;
    color: #fff;
  }

  .logo-text {
    font-size: $font-size-lg;
    font-weight: 600;
    color: #fff;
  }
}

.sidebar-menu {
  flex: 1;
  border-right: none;

  :deep(.el-menu-item) {
    height: 48px;
    line-height: 48px;
    margin: 2px 8px;
    border-radius: $border-radius;

    &.is-active {
      background-color: $sidebar-active-bg;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}
</style>
