<template>
  <FinDialog
    :model-value="visible"
    :title="dialogTitle"
    width="560px"
    :hide-footer="true"
    :close-on-click-modal="false"
    :close-on-press-escape="!isProcessing"
    @update:visible="handleUpdateVisible"
  >
    <div v-if="progress" class="batch-progress-dialog">
      <div class="progress-header">
        <div class="operation-icon" :class="iconClass">
          <el-icon :size="32">
            <component :is="operationIcon" />
          </el-icon>
        </div>
        <div class="operation-info">
          <div class="operation-title">{{ progress.operationTypeLabel || '批量操作' }}</div>
          <div class="operation-subtitle">
            <span v-if="isProcessing">正在处理中，请稍候...</span>
            <span v-else-if="isSuccess">全部处理完成</span>
            <span v-else-if="isFailed">处理失败</span>
            <span v-else>部分处理完成</span>
          </div>
        </div>
        <div class="progress-percent" :class="statusClass">
          {{ progress.percent }}%
        </div>
      </div>

      <div class="progress-bar-wrapper">
        <el-progress
          :percentage="progress.percent"
          :status="progressStatus"
          :stroke-width="10"
          :show-text="false"
          :duration="300"
        />
      </div>

      <div class="progress-stats">
        <div class="stat-box total">
          <div class="stat-label">总数量</div>
          <div class="stat-value">{{ progress.total }}</div>
        </div>
        <div class="stat-box success">
          <div class="stat-label">成功</div>
          <div class="stat-value">{{ progress.successCount }}</div>
        </div>
        <div class="stat-box failed" :class="{ highlight: progress.failedCount > 0 }">
          <div class="stat-label">失败</div>
          <div class="stat-value">{{ progress.failedCount }}</div>
        </div>
        <div class="stat-box processing">
          <div class="stat-label">进度</div>
          <div class="stat-value">{{ progress.current }}/{{ progress.total }}</div>
        </div>
      </div>

      <div v-if="isProcessing" class="processing-detail">
        <div class="detail-title">
          <el-icon class="loading-spin"><Loading /></el-icon>
          正在处理
        </div>
        <div class="detail-content">
          已完成 {{ progress.current }} / {{ progress.total }} 条规则
        </div>
      </div>

      <transition name="fade-expand">
        <div v-if="!isProcessing && progress.failedCount > 0" class="failed-list">
          <div class="failed-header" @click="toggleFailedList">
            <el-icon>
              <component :is="failedListExpanded ? 'ArrowUp' : 'ArrowDown'" />
            </el-icon>
            <span>失败详情（{{ progress.failedItems.length }}条）</span>
          </div>
          <div v-show="failedListExpanded" class="failed-items">
            <div
              v-for="(item, idx) in progress.failedItems"
              :key="idx"
              class="failed-item"
            >
              <span class="item-index">{{ idx + 1 }}.</span>
              <span class="item-name">{{ item.ruleName }}</span>
              <span class="item-reason">{{ item.reason }}</span>
            </div>
          </div>
        </div>
      </transition>

      <div v-if="!isProcessing" class="time-info">
        <div class="time-item">
          <el-icon><Clock /></el-icon>
          <span class="time-label">开始时间：</span>
          <span>{{ formatDateTime(progress.startTime) }}</span>
        </div>
        <div v-if="progress.endTime" class="time-item">
          <el-icon><CircleCheckFilled /></el-icon>
          <span class="time-label">结束时间：</span>
          <span>{{ formatDateTime(progress.endTime) }}</span>
        </div>
        <div v-if="progress.endTime" class="time-item">
          <el-icon><Timer /></el-icon>
          <span class="time-label">耗时：</span>
          <span>{{ calculateDuration() }}</span>
        </div>
      </div>

      <div class="dialog-actions">
        <el-button
          v-if="isProcessing"
          type="primary"
          disabled
        >
          <el-icon class="loading-spin"><Loading /></el-icon>
          处理中...
        </el-button>
        <template v-else>
          <el-button @click="handleClose">
            关闭
          </el-button>
          <el-button
            v-if="progress.failedCount > 0"
            type="warning"
            @click="$emit('retry')"
          >
            <el-icon><RefreshRight /></el-icon>
            重试失败项
          </el-button>
          <el-button
            type="primary"
            :type="isSuccess ? 'success' : 'warning'"
            @click="$emit('complete')"
          >
            {{ isSuccess ? '完成' : '知道了' }}
          </el-button>
        </template>
      </div>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { formatDateTime } from '@/utils/format'
import {
  Loading,
  Clock,
  Timer,
  CircleCheckFilled,
  RefreshRight,
  ArrowDown,
  ArrowUp,
  CircleCheck,
  CircleClose,
  Warning,
} from '@element-plus/icons-vue'
import { BatchOperationType } from '@/enums'
import type { IBatchOperationProgress } from '@/types/api'

interface IProps {
  visible: boolean
  progress: IBatchOperationProgress | null
}

const props = withDefaults(defineProps<IProps>(), {
  progress: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  retry: []
  complete: []
}>()

const failedListExpanded = ref(false)

const dialogTitle = computed(() => {
  const type = props.progress?.operationType
  const map: Record<string, string> = {
    [BatchOperationType.ENABLE]: '批量启用进度',
    [BatchOperationType.DISABLE]: '批量禁用进度',
    [BatchOperationType.RESET]: '批量重置进度',
  }
  return map[type || ''] || '批量操作进度'
})

const operationIcon = computed(() => {
  const type = props.progress?.operationType
  const map: Record<string, any> = {
    [BatchOperationType.ENABLE]: CircleCheck,
    [BatchOperationType.DISABLE]: CircleClose,
    [BatchOperationType.RESET]: Warning,
  }
  return map[type || ''] || CircleCheck
})

const iconClass = computed(() => {
  const type = props.progress?.operationType
  const map: Record<string, string> = {
    [BatchOperationType.ENABLE]: 'icon-enable',
    [BatchOperationType.DISABLE]: 'icon-disable',
    [BatchOperationType.RESET]: 'icon-reset',
  }
  return map[type || ''] || 'icon-enable'
})

const isProcessing = computed(() => props.progress?.status === 'processing')
const isSuccess = computed(() => props.progress?.status === 'success' && props.progress.failedCount === 0)
const isFailed = computed(() => props.progress?.status === 'failed')

const progressStatus = computed(() => {
  if (props.progress?.status === 'success' && props.progress.failedCount === 0) return 'success'
  if (props.progress?.status === 'failed') return 'exception'
  if (props.progress?.status === 'success' && props.progress.failedCount > 0) return 'warning'
  return undefined
})

const statusClass = computed(() => {
  if (isSuccess.value) return 'status-success'
  if (isFailed.value) return 'status-failed'
  if (props.progress?.status === 'success') return 'status-warning'
  return 'status-processing'
})

function handleUpdateVisible(val: boolean) {
  if (isProcessing.value && !val) return
  emit('update:visible', val)
}

function handleClose() {
  emit('update:visible', false)
}

function toggleFailedList() {
  failedListExpanded.value = !failedListExpanded.value
}

function calculateDuration(): string {
  if (!props.progress?.startTime || !props.progress?.endTime) return '-'
  const start = new Date(props.progress.startTime).getTime()
  const end = new Date(props.progress.endTime).getTime()
  const diff = Math.floor((end - start) / 1000)
  if (diff < 60) return `${diff}秒`
  const mins = Math.floor(diff / 60)
  const secs = diff % 60
  if (mins < 60) return `${mins}分${secs}秒`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  return `${hours}小时${remMins}分${secs}秒`
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      failedListExpanded.value = false
    }
  },
)
</script>

<style lang="scss" scoped>
.batch-progress-dialog {
  padding: 8px 0;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0 20px;
}

.operation-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &.icon-enable {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.15) 0%, rgba(103, 194, 58, 0.08) 100%);
    color: #67c23a;
  }

  &.icon-disable {
    background: linear-gradient(135deg, rgba(144, 147, 153, 0.15) 0%, rgba(144, 147, 153, 0.08) 100%);
    color: #909399;
  }

  &.icon-reset {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.15) 0%, rgba(230, 162, 60, 0.08) 100%);
    color: #e6a23c;
  }
}

.operation-info {
  flex: 1;
}

.operation-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2d3d;
  margin-bottom: 4px;
}

.operation-subtitle {
  font-size: 13px;
  color: #8492a6;
}

.progress-percent {
  font-size: 36px;
  font-weight: 700;
  font-family: 'DIN', monospace;
  flex-shrink: 0;

  &.status-processing {
    color: #409eff;
  }

  &.status-success {
    color: #67c23a;
  }

  &.status-warning {
    color: #e6a23c;
  }

  &.status-failed {
    color: #f56c6c;
  }
}

.progress-bar-wrapper {
  margin-bottom: 20px;
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-box {
  padding: 12px 16px;
  border-radius: 8px;
  text-align: center;
  background: #f5f7fa;
  transition: all 0.3s ease;

  &.total {
    background: #ecf5ff;
  }

  &.success {
    background: #f0f9eb;
    .stat-value { color: #67c23a; }
  }

  &.failed {
    background: #fef0f0;
    .stat-value { color: #f56c6c; }

    &.highlight {
      box-shadow: 0 0 0 1px #f56c6c inset;
    }
  }

  &.processing {
    background: #fdf6ec;
    .stat-value { color: #e6a23c; }
  }
}

.stat-label {
  font-size: 12px;
  color: #8492a6;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1f2d3d;
}

.processing-detail {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.06) 0%, rgba(64, 158, 255, 0.02) 100%);
  border-radius: 8px;
  margin-bottom: 16px;
  border: 1px solid rgba(64, 158, 255, 0.15);
}

.detail-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #409eff;
  flex-shrink: 0;
}

.detail-content {
  font-size: 13px;
  color: #606266;
  flex: 1;
}

.loading-spin {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.fade-expand-enter-active,
.fade-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.fade-expand-enter-from,
.fade-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
}

.failed-list {
  margin-bottom: 16px;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  overflow: hidden;
}

.failed-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: #fef0f0;
  color: #f56c6c;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;

  &:hover {
    background: #fde2e2;
  }
}

.failed-items {
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 0;
}

.failed-item {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  line-height: 1.5;

  &:hover {
    background: #fff5f5;
  }
}

.item-index {
  color: #8492a6;
  flex-shrink: 0;
}

.item-name {
  color: #1f2d3d;
  font-weight: 500;
  flex-shrink: 0;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-reason {
  color: #f56c6c;
  flex: 1;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  background: #fafbfc;
  border-radius: 8px;
  margin-bottom: 20px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #606266;

  .el-icon {
    color: #8492a6;
  }
}

.time-label {
  color: #8492a6;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>
