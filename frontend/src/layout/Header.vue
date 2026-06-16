<template>
  <div class="header-container">
    <div class="header-left">
      <div class="collapse-btn" @click="toggleSidebar">
        <el-icon :size="20">
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" icon="UserFilled" />
          <span class="user-name">{{ userStore.userInfo?.realName || userStore.userInfo?.username }}</span>
          <el-icon><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { useAppStore } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const userStore = useUserStore();

const collapsed = computed(() => appStore.sidebarCollapsed);
const currentTitle = computed(() => route.meta.title || '');

const toggleSidebar = () => {
  appStore.toggleSidebar();
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      break;
    case 'password':
      break;
    case 'logout':
      handleLogout();
      break;
  }
};

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      userStore.resetUser();
      router.push('/login');
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
.header-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 $spacing-lg;
}

.header-left {
  display: flex;
  align-items: center;
  gap: $spacing-lg;
}

.collapse-btn {
  cursor: pointer;
  color: $text-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: $border-radius;
  transition: background-color $transition-fast;

  &:hover {
    background-color: $bg-light;
  }
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  cursor: pointer;
  padding: $spacing-xs $spacing-sm;
  border-radius: $border-radius;
  transition: background-color $transition-fast;

  &:hover {
    background-color: $bg-light;
  }

  .user-name {
    font-size: $font-size-sm;
    color: $text-primary;
  }
}
</style>
