<template>
  <div class="header">
    <div class="header-left">
      <el-icon class="toggle-btn" @click="appStore.toggleSidebar()">
        <Fold v-if="appStore.sidebarOpened" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item
          v-for="item in breadcrumbList"
          :key="item.path"
          :to="{ path: item.path }"
        >
          {{ item.meta?.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-right">
      <el-tooltip content="全屏">
        <el-icon class="icon-btn" @click="toggleFullscreen">
          <FullScreen />
        </el-icon>
      </el-tooltip>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userStore.avatar">
            {{ userStore.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <span class="username">{{ userStore.username }}</span>
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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import {
  Fold,
  Expand,
  FullScreen,
  ArrowDown,
  User,
  SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const breadcrumbList = computed(() => {
  return route.matched.filter((item) => item.meta?.title)
})

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      await userStore.logout()
      ElMessage.success('退出登录成功')
      router.push('/login')
    } catch (e) {
      if (e !== 'cancel') {
        console.error(e)
      }
    }
  } else if (command === 'profile') {
    router.push('/profile')
  }
}
</script>

<style lang="scss" scoped>
.header {
  height: 60px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  position: relative;
  z-index: 100;

  &-left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 20px;
  }
}

.toggle-btn {
  font-size: 20px;
  cursor: pointer;
  color: #333;
  transition: color 0.3s;

  &:hover {
    color: #1890ff;
  }
}

.icon-btn {
  font-size: 18px;
  cursor: pointer;
  color: #333;
  transition: color 0.3s;

  &:hover {
    color: #1890ff;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 0 10px;
  height: 60px;

  &:hover {
    background-color: #f5f5f5;
  }

  .username {
    font-size: 14px;
    color: #333;
  }
}
</style>
