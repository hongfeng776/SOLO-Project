<template>
  <div class="navbar">
    <div class="navbar-left">
      <el-icon class="toggle-btn" @click="toggleSidebar">
        <Fold v-if="!appStore.sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index">
          {{ item.meta?.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="navbar-right">
      <el-popover
        placement="bottom"
        :width="360"
        trigger="click"
        @show="loadNotifications"
      >
        <template #reference>
          <div class="notification-btn">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
              <el-icon size="20"><Bell /></el-icon>
            </el-badge>
          </div>
        </template>
        <div class="notification-panel">
          <div class="panel-header">
            <span class="title">消息通知</span>
            <el-button type="primary" link size="small" @click="handleMarkAllRead">
              全部已读
            </el-button>
          </div>
          <div class="panel-body">
            <div
              v-for="item in notifications"
              :key="item.id"
              class="notification-item"
              :class="{ unread: !item.isRead }"
              @click="handleNotificationClick(item)"
            >
              <div class="item-header">
                <el-tag
                  :type="getNotificationTagType(item.type)"
                  size="small"
                >
                  {{ NotificationTypeMap[item.type] || '通知' }}
                </el-tag>
                <span class="time">{{ formatDate(item.createTime, 'MM-DD HH:mm') }}</span>
              </div>
              <div class="item-title">{{ item.title }}</div>
              <div class="item-content">{{ item.content }}</div>
            </div>
            <el-empty v-if="notifications.length === 0" description="暂无消息" :image-size="60" />
          </div>
          <div class="panel-footer">
            <el-button type="primary" link @click="goToNotificationList">查看全部</el-button>
          </div>
        </div>
      </el-popover>

      <el-dropdown @command="handleCommand">
        <div class="user-info">
          <el-avatar :size="32" :src="userStore.userInfo?.avatar || ''">
            {{ userStore.userInfo?.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <span class="username">{{ userStore.userInfo?.nickname || '管理员' }}</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              个人中心
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              修改密码
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAppStore } from '@/store/modules/app'
import { useUserStore } from '@/store/modules/user'
import { getNotificationListApi, getUnreadCountApi, markAllReadApi, markReadApi } from '@/api/notification'
import { NotificationTypeMap } from '@/enums/notification'
import { formatDate } from '@/utils/format'

const appStore = useAppStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const unreadCount = ref(0)
const notifications = ref<any[]>([])
let pollingTimer: ReturnType<typeof setInterval> | null = null

const toggleSidebar = () => {
  appStore.toggleSidebar()
}

const breadcrumbs = computed(() => {
  return route.matched.filter((item) => item.meta && item.meta.title)
})

const getNotificationTagType = (type: number) => {
  const map: Record<number, string> = {
    1: 'info',
    2: 'primary',
    3: 'warning',
    4: 'danger'
  }
  return map[type] || 'info'
}

const loadUnreadCount = async () => {
  try {
    const res = await getUnreadCountApi()
    unreadCount.value = res.data || 0
  } catch (e) {
    // ignore
  }
}

const loadNotifications = async () => {
  try {
    const res = await getNotificationListApi({ page: 1, pageSize: 10 })
    notifications.value = res.data?.list || []
  } catch (e) {
    // ignore
  }
}

const handleNotificationClick = async (item: any) => {
  if (!item.isRead) {
    try {
      await markReadApi(item.id)
      item.isRead = 1
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (e) {
      // ignore
    }
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllReadApi()
    notifications.value.forEach((n) => { n.isRead = 1 })
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch (e) {
    // ignore
  }
}

const goToNotificationList = () => {
  // placeholder
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人中心功能开发中')
      break
    case 'password':
      ElMessage.info('修改密码功能开发中')
      break
    case 'logout':
      handleLogout()
      break
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    userStore.logout()
    router.push('/login')
    ElMessage.success('已退出登录')
  })
}

onMounted(() => {
  if (userStore.token && !userStore.userInfo) {
    userStore.getUserInfo().catch(() => {})
  }
  loadUnreadCount()
  pollingTimer = setInterval(loadUnreadCount, 60000)
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style lang="scss" scoped>
.navbar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .navbar-left {
    display: flex;
    align-items: center;
    gap: 20px;

    .toggle-btn {
      font-size: 20px;
      cursor: pointer;
      color: #606266;

      &:hover {
        color: #409eff;
      }
    }
  }

  .navbar-right {
    display: flex;
    align-items: center;
    gap: 15px;

    .notification-btn {
      cursor: pointer;
      padding: 5px 10px;
      display: flex;
      align-items: center;

      &:hover {
        color: #409eff;
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 0 10px;
      height: 60px;

      &:hover {
        background-color: #f5f7fa;
      }

      .username {
        font-size: 14px;
        color: #303133;
      }
    }
  }
}

.notification-panel {
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;

    .title {
      font-weight: 600;
      font-size: 15px;
    }
  }

  .panel-body {
    max-height: 360px;
    overflow-y: auto;

    .notification-item {
      padding: 10px 0;
      border-bottom: 1px solid #f2f6fc;
      cursor: pointer;

      &:hover {
        background: #f5f7fa;
      }

      &.unread {
        background: #ecf5ff;
      }

      .item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;

        .time {
          font-size: 11px;
          color: #c0c4cc;
        }
      }

      .item-title {
        font-size: 13px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 3px;
      }

      .item-content {
        font-size: 12px;
        color: #909399;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .panel-footer {
    text-align: center;
    padding-top: 10px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
