<template>
  <div class="notification-center">
    <el-popover
      placement="bottom"
      :width="360"
      trigger="click"
      v-model:visible="popoverVisible"
    >
      <template #reference>
        <div class="notification-bell">
          <el-icon :size="18"><Bell /></el-icon>
          <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </div>
      </template>
      <div class="notification-panel">
        <div class="panel-header">
          <span class="panel-title">通知消息</span>
          <el-button type="primary" link size="small" @click="handleMarkAllRead">全部已读</el-button>
        </div>
        <el-scrollbar max-height="400px">
          <div
            v-for="item in notifications"
            :key="item.id"
            class="notification-item"
            :class="{ unread: !item.read }"
            @click="handleItemClick(item)"
          >
            <div class="item-type">
              <el-tag :type="getTypeTag(item.type)" size="small">{{ getTypeLabel(item.type) }}</el-tag>
            </div>
            <div class="item-content">
              <div class="item-text">{{ item.content }}</div>
              <div class="item-time">{{ item.time }}</div>
            </div>
            <div v-if="!item.read" class="item-dot"></div>
          </div>
          <el-empty v-if="!notifications.length" description="暂无通知" :image-size="60" />
        </el-scrollbar>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import { NotificationTypeEnum } from '@/utils/enums'
import { getUnreadCount, getNotificationList, markRead, markAllRead } from '@/api/notification'

const popoverVisible = ref(false)
const unreadCount = ref(0)

const notifications = ref([
  { id: 1, type: 'order', content: '订单ORD202401150001已支付成功', time: '5分钟前', read: false },
  { id: 2, type: 'merchant', content: '神州租车违规等级已更新为一般', time: '1小时前', read: false },
  { id: 3, type: 'approval', content: '商家审核已通过：希尔顿酒店旗舰店', time: '2小时前', read: false },
  { id: 4, type: 'system', content: '系统将于今晚22:00进行维护升级', time: '3小时前', read: true },
  { id: 5, type: 'order', content: '订单ORD202401140003退款申请已提交', time: '5小时前', read: true }
])

const getTypeLabel = (type) => {
  const item = Object.values(NotificationTypeEnum).find((e) => e.value === type)
  return item ? item.label : '通知'
}

const getTypeTag = (type) => {
  const map = { system: 'info', order: 'primary', merchant: 'warning', approval: 'success' }
  return map[type] || 'info'
}

const handleItemClick = (item) => {
  if (!item.read) {
    item.read = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  }
}

const handleMarkAllRead = () => {
  notifications.value.forEach((n) => { n.read = true })
  unreadCount.value = 0
  ElMessage.success('已全部标记为已读')
}

const fetchUnreadCount = () => {
  unreadCount.value = notifications.value.filter((n) => !n.read).length
}

onMounted(() => {
  fetchUnreadCount()
})
</script>

<style lang="scss" scoped>
.notification-bell {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: background-color 0.3s;
  color: #333;

  &:hover {
    background-color: #f5f5f5;
  }

  .notification-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 16px;
    height: 16px;
    line-height: 16px;
    padding: 0 4px;
    background-color: #ff4d4f;
    color: #fff;
    font-size: 10px;
    border-radius: 8px;
    text-align: center;
  }
}

.notification-panel {
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 8px;

    .panel-title {
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f5f7fa;
    }

    &.unread {
      .item-text { font-weight: 600; }
    }

    .item-type {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .item-content {
      flex: 1;
      min-width: 0;

      .item-text {
        font-size: 13px;
        color: #333;
        line-height: 1.5;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .item-time {
        font-size: 11px;
        color: #999;
        margin-top: 4px;
      }
    }

    .item-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #1890ff;
      flex-shrink: 0;
      margin-top: 6px;
    }
  }
}
</style>
