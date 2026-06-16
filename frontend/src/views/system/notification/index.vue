<template>
  <div class="page-container notification-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">消息通知</span>
          <div class="header-actions">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="unread-badge">
              <span class="unread-text">未读 {{ unreadCount }} 条</span>
            </el-badge>
            <el-button type="primary" plain :icon="Check" @click="handleMarkAllRead">全部标为已读</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="notification-tabs" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all">
          <div class="notification-list">
            <div
              v-for="item in dataList"
              :key="item.id"
              class="notification-item"
              :class="{ unread: item.status === NotificationStatus.UNREAD }"
              @click="handleViewDetail(item)"
            >
              <div class="notification-icon" :class="'type-' + item.type">
                <el-icon :size="20">
                  <component :is="getTypeIcon(item.type)" />
                </el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ item.title }}</span>
                  <span class="notification-time">{{ formatDateTime(item.createTime) }}</span>
                </div>
                <div class="notification-body">{{ item.content }}</div>
                <div class="notification-footer">
                  <span class="sender">发送人：{{ item.senderName || '系统' }}</span>
                  <div class="actions">
                    <el-button
                      v-if="item.status === NotificationStatus.UNREAD"
                      link
                      type="primary"
                      size="small"
                      @click.stop="handleMarkAsRead(item)"
                    >
                      标为已读
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDelete(item)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <HtEmpty v-if="!loading && dataList.length === 0" description="暂无消息" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="系统通知" name="system">
          <div class="notification-list">
            <div
              v-for="item in filteredList('system')"
              :key="item.id"
              class="notification-item"
              :class="{ unread: item.status === NotificationStatus.UNREAD }"
              @click="handleViewDetail(item)"
            >
              <div class="notification-icon type-system">
                <el-icon :size="20"><Bell /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ item.title }}</span>
                  <span class="notification-time">{{ formatDateTime(item.createTime) }}</span>
                </div>
                <div class="notification-body">{{ item.content }}</div>
                <div class="notification-footer">
                  <span class="sender">发送人：{{ item.senderName || '系统' }}</span>
                  <div class="actions">
                    <el-button
                      v-if="item.status === NotificationStatus.UNREAD"
                      link
                      type="primary"
                      size="small"
                      @click.stop="handleMarkAsRead(item)"
                    >
                      标为已读
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDelete(item)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <HtEmpty v-if="!loading && filteredList('system').length === 0" description="暂无系统通知" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="审核通知" name="audit">
          <div class="notification-list">
            <div
              v-for="item in filteredList('audit')"
              :key="item.id"
              class="notification-item"
              :class="{ unread: item.status === NotificationStatus.UNREAD }"
              @click="handleViewDetail(item)"
            >
              <div class="notification-icon type-audit">
                <el-icon :size="20"><CircleCheck /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ item.title }}</span>
                  <span class="notification-time">{{ formatDateTime(item.createTime) }}</span>
                </div>
                <div class="notification-body">{{ item.content }}</div>
                <div class="notification-footer">
                  <span class="sender">发送人：{{ item.senderName || '系统' }}</span>
                  <div class="actions">
                    <el-button
                      v-if="item.status === NotificationStatus.UNREAD"
                      link
                      type="primary"
                      size="small"
                      @click.stop="handleMarkAsRead(item)"
                    >
                      标为已读
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDelete(item)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <HtEmpty v-if="!loading && filteredList('audit').length === 0" description="暂无审核通知" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="订单通知" name="order">
          <div class="notification-list">
            <div
              v-for="item in filteredList('order')"
              :key="item.id"
              class="notification-item"
              :class="{ unread: item.status === NotificationStatus.UNREAD }"
              @click="handleViewDetail(item)"
            >
              <div class="notification-icon type-order">
                <el-icon :size="20"><List /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ item.title }}</span>
                  <span class="notification-time">{{ formatDateTime(item.createTime) }}</span>
                </div>
                <div class="notification-body">{{ item.content }}</div>
                <div class="notification-footer">
                  <span class="sender">发送人：{{ item.senderName || '系统' }}</span>
                  <div class="actions">
                    <el-button
                      v-if="item.status === NotificationStatus.UNREAD"
                      link
                      type="primary"
                      size="small"
                      @click.stop="handleMarkAsRead(item)"
                    >
                      标为已读
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDelete(item)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <HtEmpty v-if="!loading && filteredList('order').length === 0" description="暂无订单通知" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="活动通知" name="activity">
          <div class="notification-list">
            <div
              v-for="item in filteredList('activity')"
              :key="item.id"
              class="notification-item"
              :class="{ unread: item.status === NotificationStatus.UNREAD }"
              @click="handleViewDetail(item)"
            >
              <div class="notification-icon type-activity">
                <el-icon :size="20"><Present /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ item.title }}</span>
                  <span class="notification-time">{{ formatDateTime(item.createTime) }}</span>
                </div>
                <div class="notification-body">{{ item.content }}</div>
                <div class="notification-footer">
                  <span class="sender">发送人：{{ item.senderName || '系统' }}</span>
                  <div class="actions">
                    <el-button
                      v-if="item.status === NotificationStatus.UNREAD"
                      link
                      type="primary"
                      size="small"
                      @click.stop="handleMarkAsRead(item)"
                    >
                      标为已读
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDelete(item)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <HtEmpty v-if="!loading && filteredList('activity').length === 0" description="暂无活动通知" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="风险通知" name="risk">
          <div class="notification-list">
            <div
              v-for="item in filteredList('risk')"
              :key="item.id"
              class="notification-item"
              :class="{ unread: item.status === NotificationStatus.UNREAD }"
              @click="handleViewDetail(item)"
            >
              <div class="notification-icon type-risk">
                <el-icon :size="20"><Warning /></el-icon>
              </div>
              <div class="notification-content">
                <div class="notification-header">
                  <span class="notification-title">{{ item.title }}</span>
                  <span class="notification-time">{{ formatDateTime(item.createTime) }}</span>
                </div>
                <div class="notification-body">{{ item.content }}</div>
                <div class="notification-footer">
                  <span class="sender">发送人：{{ item.senderName || '系统' }}</span>
                  <div class="actions">
                    <el-button
                      v-if="item.status === NotificationStatus.UNREAD"
                      link
                      type="primary"
                      size="small"
                      @click.stop="handleMarkAsRead(item)"
                    >
                      标为已读
                    </el-button>
                    <el-button link type="danger" size="small" @click.stop="handleDelete(item)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
            <HtEmpty v-if="!loading && filteredList('risk').length === 0" description="暂无风险通知" />
          </div>
        </el-tab-pane>
      </el-tabs>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="消息详情" width="560px" destroy-on-close>
      <div v-if="currentNotification" class="notification-detail">
        <div class="detail-header">
          <div class="detail-icon" :class="'type-' + currentNotification.type">
            <el-icon :size="24">
              <component :is="getTypeIcon(currentNotification.type)" />
            </el-icon>
          </div>
          <div class="detail-info">
            <div class="detail-title">{{ currentNotification.title }}</div>
            <div class="detail-meta">
              <span>{{ formatDateTime(currentNotification.createTime) }}</span>
              <el-tag
                v-if="currentNotification.status === NotificationStatus.UNREAD"
                type="warning"
                size="small"
                effect="dark"
              >
                未读
              </el-tag>
              <el-tag v-else type="success" size="small" effect="light">
                已读
              </el-tag>
            </div>
          </div>
        </div>
        <div class="detail-content">
          <p>{{ currentNotification.content }}</p>
        </div>
        <div class="detail-footer">
          <span>发送人：{{ currentNotification.senderName || '系统' }}</span>
          <span v-if="currentNotification.readTime">
            阅读时间：{{ formatDateTime(currentNotification.readTime) }}
          </span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Bell,
  CircleCheck,
  List,
  Present,
  Warning,
  Check
} from '@element-plus/icons-vue'
import { formatDateTime } from '@hooks/useFormat'
import {
  getNotificationList,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotification
} from '@/api/notification'
import { NotificationType, NotificationStatus } from '@enums/business'
import type { Notification } from '@/types/business'
import HtEmpty from '@components/HtEmpty/index.vue'

const activeTab = ref('all')
const loading = ref(false)
const dataList = ref<Notification[]>([])
const total = ref(0)
const unreadCount = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  type: ''
})

const detailVisible = ref(false)
const currentNotification = ref<Notification | null>(null)

const getTypeIcon = (type: string) => {
  const iconMap: Record<string, unknown> = {
    [NotificationType.SYSTEM]: Bell,
    [NotificationType.AUDIT]: CircleCheck,
    [NotificationType.ORDER]: List,
    [NotificationType.ACTIVITY]: Present,
    [NotificationType.RISK]: Warning
  }
  return iconMap[type] || Bell
}

const filteredList = (type: string) => {
  if (type === 'all') return dataList.value
  return dataList.value.filter((item) => item.type === type)
}

const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: queryParams.page,
      pageSize: queryParams.pageSize
    }
    if (queryParams.type) {
      Object.assign(params, { type: queryParams.type })
    }
    const res = await getNotificationList(params)
    dataList.value = res.list
    total.value = res.total
  } catch (error) {
    console.error('获取通知列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchUnreadCount = async () => {
  try {
    const res = await getUnreadNotificationCount()
    unreadCount.value = res.count || 0
  } catch (error) {
    console.error('获取未读数量失败:', error)
  }
}

const handleTabChange = (tab: string) => {
  queryParams.type = tab === 'all' ? '' : tab
  queryParams.page = 1
  fetchData()
}

const handleViewDetail = async (item: Notification) => {
  if (item.status === NotificationStatus.UNREAD) {
    try {
      await markNotificationAsRead(item.id)
      item.status = NotificationStatus.READ
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
  currentNotification.value = item
  detailVisible.value = true
}

const handleMarkAsRead = async (item: Notification) => {
  try {
    await markNotificationAsRead(item.id)
    item.status = NotificationStatus.READ
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    ElMessage.success('已标记为已读')
  } catch (error) {
    console.error(error)
  }
}

const handleMarkAllRead = async () => {
  if (unreadCount.value === 0) {
    ElMessage.info('没有未读消息')
    return
  }
  try {
    await ElMessageBox.confirm('确定将所有消息标记为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await markAllNotificationsAsRead()
    dataList.value.forEach((item) => {
      item.status = NotificationStatus.READ
    })
    unreadCount.value = 0
    ElMessage.success('已全部标记为已读')
  } catch {
    // cancelled
  }
}

const handleDelete = async (item: Notification) => {
  try {
    await ElMessageBox.confirm('确定删除这条消息吗？', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteNotification(item.id)
    if (item.status === NotificationStatus.UNREAD) {
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    ElMessage.success('删除成功')
    fetchData()
  } catch {
    // cancelled
  }
}

const handleSizeChange = () => {
  queryParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

onMounted(() => {
  fetchData()
  fetchUnreadCount()
})
</script>

<style lang="scss" scoped>
.notification-page {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .unread-badge {
    .unread-text {
      font-size: 13px;
      color: $text-secondary;
    }
  }

  .notification-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .notification-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .notification-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background-color: $bg-body;
    border-radius: $border-radius;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;

    &:hover {
      border-color: $color-primary-light;
      background-color: $color-primary-lighter;
    }

    &.unread {
      background-color: #f0f9eb;
      border-color: #e1f3d8;

      .notification-title {
        font-weight: 600;
      }
    }
  }

  .notification-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: #fff;

    &.type-system {
      background-color: #409eff;
    }

    &.type-audit {
      background-color: #67c23a;
    }

    &.type-order {
      background-color: #e6a23c;
    }

    &.type-activity {
      background-color: #f56c6c;
    }

    &.type-risk {
      background-color: #909399;
    }
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .notification-title {
    font-size: 14px;
    color: $text-primary;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .notification-time {
    font-size: 12px;
    color: $text-secondary;
    flex-shrink: 0;
  }

  .notification-body {
    font-size: 13px;
    color: $text-regular;
    line-height: 1.6;
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .notification-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .sender {
    font-size: 12px;
    color: $text-secondary;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid $border-color-lighter;
  }

  .notification-detail {
    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid $border-color-lighter;
      margin-bottom: 16px;
    }

    .detail-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      flex-shrink: 0;

      &.type-system {
        background-color: #409eff;
      }

      &.type-audit {
        background-color: #67c23a;
      }

      &.type-order {
        background-color: #e6a23c;
      }

      &.type-activity {
        background-color: #f56c6c;
      }

      &.type-risk {
        background-color: #909399;
      }
    }

    .detail-info {
      flex: 1;
    }

    .detail-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 4px;
    }

    .detail-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: $text-secondary;
    }

    .detail-content {
      padding: 16px 0;
      line-height: 1.8;
      color: $text-regular;
      font-size: 14px;
    }

    .detail-footer {
      padding-top: 16px;
      border-top: 1px solid $border-color-lighter;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: $text-secondary;
    }
  }
}
</style>
