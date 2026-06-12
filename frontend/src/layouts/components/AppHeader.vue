<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore, useUserStore } from '@/store';
import { useRoute } from 'vue-router';
import { ElMessageBox, ElMessage } from 'element-plus';
import { useBreakpoints } from '@/hooks/useBreakpoints';

const appStore = useAppStore();
const userStore = useUserStore();
const vueRouter = useRouter();
const route = useRoute();
const { isMobile } = useBreakpoints();

const dropdownRef = ref();

const collapsed = computed(() => appStore.sidebarCollapsed);
const userInfo = computed(() => userStore.userInfo);
const nickname = computed(() => userStore.nickname || '未登录');
const avatarText = computed(() => (nickname.value ? nickname.value.slice(0, 1).toUpperCase() : 'U'));

const breadcrumbList = computed(() => {
  const list = route.matched
    .filter((r) => r.meta?.title && r.path !== '/')
    .map((r) => ({
      name: r.meta?.title as string,
      path: r.path,
    }));
  return list;
});

const toggleSidebar = () => appStore.toggleSidebar();

const handleCommand = async (cmd: string) => {
  if (cmd === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
        confirmButtonText: '确定退出',
        cancelButtonText: '取消',
        type: 'warning',
      });
      userStore.logout();
      ElMessage.success('已退出登录');
      vueRouter.push('/login');
    } catch {
      /* cancel */
    }
  } else if (cmd === 'profile') {
    ElMessage.info('个人中心开发中');
  }
};

const reload = () => window.location.reload();
const goHome = () => vueRouter.push('/dashboard');
const toggleFullscreen = () => document.documentElement.requestFullscreen?.().catch(() => {});
</script>

<template>
  <header class="layout-header">
    <div class="header-left">
      <el-button class="collapse-btn" text @click="toggleSidebar" :title="collapsed ? '展开菜单' : '收起菜单'">
        <el-icon :size="20">
          <component :is="collapsed ? 'Expand' : 'Fold'" />
        </el-icon>
      </el-button>
      <el-breadcrumb v-if="breadcrumbList.length" class="breadcrumb" separator="/">
        <el-breadcrumb-item v-for="(item, idx) in breadcrumbList" :key="item.path">
          <span
            v-if="idx < breadcrumbList.length - 1"
            class="breadcrumb-link"
            @click="goHome"
          >{{ item.name }}</span>
          <span v-else class="breadcrumb-current">{{ item.name }}</span>
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-tooltip content="刷新" placement="bottom">
        <el-button text @click="reload" class="header-btn">
          <el-icon :size="18"><Refresh /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip content="全屏" placement="bottom">
        <el-button text class="header-btn" @click="toggleFullscreen">
          <el-icon :size="18"><FullScreen /></el-icon>
        </el-button>
      </el-tooltip>
      <el-tooltip :content="appStore.theme === 'dark' ? '切换亮色' : '切换暗色'" placement="bottom">
        <el-button text class="header-btn" @click="appStore.toggleTheme">
          <el-icon :size="18">
            <component :is="appStore.theme === 'dark' ? 'Sunny' : 'Moon'" />
          </el-icon>
        </el-button>
      </el-tooltip>
      <el-dropdown trigger="click" ref="dropdownRef" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" class="user-avatar" shape="square">{{ avatarText }}</el-avatar>
          <span v-if="!isMobile" class="user-name text-ellipsis">{{ nickname }}</span>
          <el-icon class="caret"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon> 个人中心
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon> 退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.layout-header {
  height: $header-height;
  background: #ffffff;
  border-bottom: 1px solid $color-border-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-md;
  box-shadow: $shadow-xs;
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex: 1;
  min-width: 0;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: $radius-md;
  color: $color-text-regular;
  &:hover {
    background: $bg-color-hover;
    color: $color-primary;
  }
}

.breadcrumb {
  font-size: $font-size-sm;
  .breadcrumb-link {
    cursor: pointer;
    color: $color-text-secondary;
    &:hover {
      color: $color-primary;
    }
  }
  .breadcrumb-current {
    color: $color-text-primary;
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-left: $spacing-md;
}

.header-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: $radius-md;
  color: $color-text-regular;
  &:hover {
    background: $bg-color-hover;
    color: $color-primary;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  padding: $spacing-xs $spacing-sm;
  border-radius: $radius-md;
  cursor: pointer;
  max-width: 200px;
  transition: background $duration-fast;
  &:hover {
    background: $bg-color-hover;
  }
}

.user-avatar {
  background: linear-gradient(135deg, $color-primary, $color-primary-light);
  color: #fff;
  font-weight: 600;
  border-radius: $radius-md !important;
  font-size: $font-size-sm;
}

.user-name {
  font-size: $font-size-sm;
  color: $color-text-primary;
  max-width: 120px;
}

.caret {
  color: $color-text-secondary;
  font-size: 12px;
}
</style>
