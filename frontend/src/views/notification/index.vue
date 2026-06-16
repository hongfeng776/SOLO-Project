<template>
  <div class="notification-page">
    <div class="filter-card card-wrapper">
      <div class="filter-header">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="类型">
            <el-select v-model="filterForm.type" placeholder="全部" clearable style="width: 140px">
              <el-option
                v-for="item in notificationTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.isRead" placeholder="全部" clearable style="width: 120px">
              <el-option label="未读" :value="false" />
              <el-option label="已读" :value="true" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
            <el-button :icon="Refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" :disabled="unreadCount === 0" @click="handleMarkAllRead">
          全部已读
        </el-button>
      </div>
    </div>

    <div class="notification-list">
      <div
        v-for="item in notificationData"
        :key="item.id"
        :class="['notification-item', 'card-wrapper', { unread: !item.isRead }]"
        @click="handleReadItem(item)"
      >
        <div class="item-header">
          <span :class="['type-tag', item.type]">{{ getTypeLabel(item.type) }}</span>
          <span class="item-time">{{ formatDate(item.createdAt) }}</span>
          <span v-if="!item.isRead" class="unread-dot"></span>
        </div>
        <div class="item-title">{{ item.title }}</div>
        <div class="item-content">{{ item.content }}</div>
      </div>

      <EmptyState v-if="!loading && notificationData.length === 0" description="暂无通知消息" />

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { EmptyState } from '@/components/business'
import { NotificationTypeLabel } from '@/constants'
import { getNotificationList, getUnreadCount, markAsRead, markAllAsRead } from '@/api/notification'
import type { Notification } from '@/types'

const loading = ref(false)
const notificationData = ref<Notification[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const unreadCount = ref(0)

const filterForm = reactive({
  type: '',
  isRead: undefined as boolean | undefined
})

const notificationTypeOptions = Object.entries(NotificationTypeLabel).map(([value, label]) => ({ value, label }))
const notificationTypeLabel = NotificationTypeLabel as Record<string, string>

const getTypeLabel = (type: string) => {
  return notificationTypeLabel[type] || type
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getNotificationList({
      page: page.value,
      pageSize: pageSize.value,
      type: filterForm.type || undefined,
      isRead: filterForm.isRead
    })
    notificationData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取通知列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data.count
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.type = ''
  filterForm.isRead = undefined
  page.value = 1
  fetchList()
}

const handleReadItem = async (item: Notification) => {
  if (item.isRead) return
  try {
    await markAsRead(item.id)
    item.isRead = true
    unreadCount.value = Math.max(0, unreadCount.value - 1)
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

const handleMarkAllRead = async () => {
  try {
    await markAllAsRead()
    ElMessage.success('全部标记已读')
    unreadCount.value = 0
    fetchList()
  } catch (error) {
    console.error('标记全部已读失败:', error)
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchList()
  fetchUnreadCount()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.notification-page {
  .filter-card {
    margin-bottom: 16px;

    .filter-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
  }

  .notification-list {
    .notification-item {
      margin-bottom: 12px;
      cursor: pointer;
      transition: all $transition-duration;

      &:hover {
        box-shadow: $shadow-medium;
      }

      &.unread {
        border-left: 3px solid $primary-color;
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .type-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: $border-radius;
          font-size: $font-size-extra-small;
          line-height: 1.5;

          &.system {
            color: $primary-color;
            background: rgba($primary-color, 0.1);
          }

          &.audit {
            color: $success-color;
            background: rgba($success-color, 0.1);
          }

          &.violation {
            color: $danger-color;
            background: rgba($danger-color, 0.1);
          }

          &.appeal {
            color: $warning-color;
            background: rgba($warning-color, 0.1);
          }

          &.member {
            color: #9b59b6;
            background: rgba(#9b59b6, 0.1);
          }

          &.resource {
            color: $info-color;
            background: rgba($info-color, 0.1);
          }
        }

        .item-time {
          font-size: $font-size-extra-small;
          color: $text-secondary;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: $danger-color;
          margin-left: auto;
        }
      }

      .item-title {
        font-size: $font-size-base;
        font-weight: 500;
        color: $text-primary;
        margin-bottom: 4px;
      }

      .item-content {
        font-size: $font-size-small;
        color: $text-regular;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
