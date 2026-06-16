<template>
  <div class="ccb-header">
    <div class="ccb-header-left">
      <el-icon class="ccb-toggle-btn" :size="20" @click="toggleSidebar">
        <Fold v-if="aStore.sidebar.opened" />
        <Expand v-else />
      </el-icon>
      <Breadcrumb />
    </div>
    <div class="ccb-header-right">
      <el-dropdown trigger="click" @command="handleDropdownCommand">
        <div class="ccb-user-info">
          <el-avatar :size="32" :src="uStore.userInfo?.avatar">
            {{ uStore.userInfo?.realName?.charAt(0) }}
          </el-avatar>
          <span class="ccb-username">{{ uStore.userInfo?.realName }}</span>
          <el-icon><CaretBottom /></el-icon>
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
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Fold, Expand, User, Setting, SwitchButton, CaretBottom } from '@element-plus/icons-vue'
import { appStore, userStore } from '@store'
import Breadcrumb from './Breadcrumb.vue'

const router = useRouter()
const aStore = appStore()
const uStore = userStore()

const toggleSidebar = (): void => {
  aStore.toggleSidebar()
}

const handleDropdownCommand = async (command: string): Promise<void> => {
  switch (command) {
    case 'profile':
      router.push('/system/user/profile')
      break
    case 'settings':
      router.push('/system/settings')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await uStore.logout()
        router.push('/login')
      } catch {
      }
      break
  }
}
</script>

<style lang="scss" scoped>
.ccb-header {
  height: 60px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 10;

  .ccb-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .ccb-toggle-btn {
    cursor: pointer;
    color: #595959;
    transition: color 0.3s;

    &:hover {
      color: #004098;
    }
  }

  .ccb-header-right {
    display: flex;
    align-items: center;
  }

  .ccb-user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 0 8px;
    border-radius: 4px;
    transition: background-color 0.3s;

    &:hover {
      background-color: #f5f5f5;
    }

    .ccb-username {
      font-size: 14px;
      color: #262626;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
