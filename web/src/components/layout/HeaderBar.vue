<template>
  <div class="header-bar">
    <div class="header-bar__left">
      <el-icon class="collapse-btn" :size="20" @click="toggleSidebar">
        <Fold v-if="!collapsed" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
          {{ item.meta?.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="header-bar__right">
      <el-tooltip content="刷新">
        <el-icon :size="18" class="action-icon" @click="refresh">
          <Refresh />
        </el-icon>
      </el-tooltip>
      <el-tooltip content="全屏">
        <el-icon :size="18" class="action-icon" @click="toggleFullscreen">
          <FullScreen />
        </el-icon>
      </el-tooltip>
      <el-dropdown trigger="click" @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="avatar">
            {{ nickname?.charAt(0) }}
          </el-avatar>
          <span class="username">{{ nickname }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>个人中心
            </el-dropdown-item>
            <el-dropdown-item command="settings">
              <el-icon><Setting /></el-icon>账号设置
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const collapsed = computed(() => appStore.sidebarCollapsed)
const avatar = computed(() => userStore.userInfo?.avatar || '')
const nickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '用户')

const breadcrumbs = computed(() => {
  return route.matched.filter((r) => r.meta && r.meta.title)
})

function toggleSidebar() {
  appStore.toggleSidebar()
}

function refresh() {
  window.location.reload()
}

function toggleFullscreen() {
  const doc = document as any
  const isFullscreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement
  if (!isFullscreen) {
    const el = document.documentElement as any
    const request = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen
    request?.call(el)
  } else {
    const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen
    exit?.call(doc)
  }
}

async function handleCommand(command: string) {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中')
      break
    case 'settings':
      ElMessage.info('账号设置功能开发中')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
        await userStore.logout()
        ElMessage.success('退出登录成功')
        router.push('/login')
      } catch (error) {
        if (error !== 'cancel') {
          console.error(error)
        }
      }
      break
  }
}
</script>

<style scoped lang="scss">
.header-bar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  &__left {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .collapse-btn {
    cursor: pointer;
    color: #606266;
    transition: color 0.3s;

    &:hover {
      color: #409eff;
    }
  }

  .action-icon {
    cursor: pointer;
    color: #606266;
    transition: color 0.3s;

    &:hover {
      color: #409eff;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background-color 0.3s;

    &:hover {
      background-color: #f5f7fa;
    }

    .username {
      font-size: 14px;
      color: #303133;
    }
  }
}
</style>
