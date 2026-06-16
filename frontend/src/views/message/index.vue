<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { MESSAGE_TYPE, MESSAGE_PRIORITY, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getMessageListApi,
  markMessageReadApi,
  markAllMessageReadApi,
  deleteMessageApi,
  getUnreadCountApi,
} from '@/api/message'
import type { MessageItem, UnreadCountResult } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<MessageItem[]>([])
const total = ref(0)

const activeType = ref<number | null>(null)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  messageType: null as number | null,
})

const unreadCount = ref<UnreadCountResult | null>(null)

const loadUnreadCount = async () => {
  try {
    unreadCount.value = await getUnreadCountApi()
  } catch {
    unreadCount.value = null
  }
}

const totalUnread = computed(() => unreadCount.value?.total || 0)

const typeTabs = computed(() => {
  const tabs = [
    { value: null, label: '全部', count: totalUnread.value },
    { value: 1, label: '系统通知', count: 0 },
    { value: 2, label: '审核通知', count: 0 },
    { value: 3, label: '版权预警', count: 0 },
    { value: 4, label: '活动通知', count: 0 },
    { value: 5, label: '评论回复', count: 0 },
    { value: 6, label: '会员通知', count: 0 },
  ]
  if (unreadCount.value) {
    unreadCount.value.byType.forEach((item) => {
      const tab = tabs.find((t) => t.value === item.messageType)
      if (tab) tab.count = item.count
    })
  }
  return tabs
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await getMessageListApi({ ...queryParams })
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleTypeChange = (type: number | null) => {
  activeType.value = type
  queryParams.messageType = type
  queryParams.page = 1
  loadData()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const handleMarkRead = async (row: MessageItem) => {
  if (row.isRead) return
  await markMessageReadApi(row.id)
  row.isRead = 1
  loadUnreadCount()
}

const handleMarkAllRead = async () => {
  await ElMessageBox.confirm('确定要将所有消息标记为已读吗？', '提示', { type: 'info' })
  loading.value = true
  try {
    await markAllMessageReadApi()
    ElMessage.success('已全部标记为已读')
    loadData()
    loadUnreadCount()
  } finally {
    loading.value = false
  }
}

const handleDeleteRead = async () => {
  const readItems = listData.value.filter((r) => r.isRead === 1)
  if (readItems.length === 0) {
    ElMessage.info('没有已读消息可删除')
    return
  }
  await ElMessageBox.confirm('确定要删除所有已读消息吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    for (const item of readItems) {
      await deleteMessageApi(item.id)
    }
    ElMessage.success('删除成功')
    loadData()
    loadUnreadCount()
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: MessageItem) => {
  await ElMessageBox.confirm('确定要删除该消息吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteMessageApi(row.id)
    ElMessage.success('删除成功')
    loadData()
    loadUnreadCount()
  } finally {
    loading.value = false
  }
}

const detailVisible = ref(false)
const currentMessage = ref<MessageItem | null>(null)

const openDetail = async (row: MessageItem) => {
  currentMessage.value = row
  detailVisible.value = true
  if (!row.isRead) {
    await markMessageReadApi(row.id)
    row.isRead = 1
    loadUnreadCount()
  }
}

const priorityTagType = (priority: number): string => {
  if (priority === 2) return 'danger'
  if (priority === 1) return 'warning'
  return 'info'
}

onMounted(() => {
  loadData()
  loadUnreadCount()
})
</script>

<template>
  <div class="message-page">
    <div class="message-layout">
      <div class="type-sidebar">
        <div class="sidebar-header">
          <span>消息类型</span>
          <el-badge v-if="totalUnread > 0" :value="totalUnread" :max="99" />
        </div>
        <div
          v-for="tab in typeTabs"
          :key="String(tab.value)"
          class="type-item"
          :class="{ active: activeType === tab.value }"
          @click="handleTypeChange(tab.value)"
        >
          <span class="type-label">{{ tab.label }}</span>
          <el-badge v-if="tab.count > 0" :value="tab.count" :max="99" />
        </div>
      </div>

      <div class="message-main">
        <div class="batch-bar">
          <el-button type="primary" :icon="Check" @click="handleMarkAllRead">全部标记已读</el-button>
          <el-button type="danger" :icon="Delete" @click="handleDeleteRead">删除已读</el-button>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
        </div>

        <div v-loading="loading" class="message-list">
          <div
            v-for="item in listData"
            :key="item.id"
            class="message-item"
            :class="{ unread: item.isRead === 0 }"
            @click="openDetail(item)"
          >
            <div class="message-body">
              <div class="message-header">
                <span class="message-title">
                  <el-tag
                    v-if="item.isRead === 0"
                    type="danger"
                    size="small"
                    class="unread-dot"
                  >未读</el-tag>
                  {{ item.title }}
                </span>
                <el-tag
                  v-if="item.priority > 0"
                  :type="priorityTagType(item.priority)"
                  size="small"
                >
                  {{ getEnumLabel(MESSAGE_PRIORITY, item.priority) }}
                </el-tag>
              </div>
              <div class="message-summary">{{ item.content }}</div>
              <div class="message-meta">
                <el-tag size="small" type="info">
                  {{ getEnumLabel(MESSAGE_TYPE, item.messageType) }}
                </el-tag>
                <span class="message-time">{{ formatDate(item.createdAt) }}</span>
              </div>
            </div>
            <div class="message-actions" @click.stop>
              <el-button
                v-if="item.isRead === 0"
                type="primary"
                link
                size="small"
                @click="handleMarkRead(item)"
              >
                标记已读
              </el-button>
              <el-button type="danger" link size="small" @click="handleDelete(item)">删除</el-button>
            </div>
          </div>

          <el-empty v-if="!loading && listData.length === 0" description="暂无消息" />

          <div v-if="total > 0" class="pagination-wrap">
            <el-pagination
              :current-page="queryParams.page"
              :page-size="queryParams.pageSize"
              :total="total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              background
              @current-change="handlePageChange"
              @size-change="handleSizeChange"
            />
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="detailVisible"
      title="消息详情"
      width="600px"
      destroy-on-close
    >
      <template v-if="currentMessage">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="消息类型" :span="1">
            <el-tag size="small" type="info">
              {{ getEnumLabel(MESSAGE_TYPE, currentMessage.messageType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级" :span="1">
            <el-tag :type="priorityTagType(currentMessage.priority)" size="small">
              {{ getEnumLabel(MESSAGE_PRIORITY, currentMessage.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发送时间" :span="2">
            {{ formatDate(currentMessage.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="消息内容" :span="2">
            <div class="detail-content">{{ currentMessage.content }}</div>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentMessage.linkUrl" class="detail-link">
          <el-button type="primary" link @click="window.open(currentMessage.linkUrl, '_blank')">
            查看详情 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.message-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-layout {
  display: flex;
  gap: 16px;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-height: 600px;
}

.type-sidebar {
  width: 200px;
  border-right: 1px solid #ebeef5;
  padding: 0;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
}

.type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #606266;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: rgba(64, 158, 255, 0.08);
    color: #409eff;
    font-weight: 500;
  }
}

.message-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.message-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background: #f5f7fa;
  }

  &.unread {
    background: #fafcff;

    .message-title {
      font-weight: 600;
    }
  }
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.message-title {
  font-size: 14px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}

.unread-dot {
  flex-shrink: 0;
}

.message-summary {
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-time {
  font-size: 12px;
  color: #c0c4cc;
}

.message-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 12px;
}

.pagination-wrap {
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
}

.detail-content {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-link {
  margin-top: 16px;
  text-align: center;
}
</style>
