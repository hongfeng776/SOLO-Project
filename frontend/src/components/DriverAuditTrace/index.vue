<template>
  <div class="driver-audit-trace">
    <div class="trace-header">
      <h3>操作记录溯源</h3>
      <el-button type="primary" :loading="loading" @click="loadLogs">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" size="24"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <div v-else-if="logs.length === 0" class="empty-container">
      <el-empty description="暂无操作记录" />
    </div>

    <div v-else class="timeline-container">
      <el-timeline>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="formatDate(log.createTime)"
          :type="getTimelineType(log.operationType)"
          :icon="getTimelineIcon(log.operationType)"
          placement="top"
        >
          <el-card class="log-card" shadow="hover">
            <div class="log-header">
              <el-tag
                :type="getTagType(log.operationType)"
                size="small"
                effect="dark"
              >
                {{ log.operationTypeName }}
              </el-tag>
              <span v-if="log.operatorName" class="operator">
                操作人：{{ log.operatorName }}
              </span>
            </div>
            <div class="log-body">
              <div v-if="log.oldStatus !== undefined && log.newStatus !== undefined" class="status-transition">
                <span class="status-label">状态变更：</span>
                <el-tag size="small" :type="getStatusTagType(log.oldStatus)">
                  {{ getStatusName(log.oldStatus) }}
                </el-tag>
                <el-icon class="arrow-icon"><Right /></el-icon>
                <el-tag size="small" :type="getStatusTagType(log.newStatus)">
                  {{ getStatusName(log.newStatus) }}
                </el-tag>
              </div>
              <p v-if="log.remark" class="log-remark">
                <el-icon><ChatDotRound /></el-icon>
                {{ log.remark }}
              </p>
              <div v-if="log.qualificationCheck" class="qualification-check">
                <el-button
                  type="primary"
                  link
                  size="small"
                  @click="toggleCheckDetail(log)"
                >
                  <el-icon><Document /></el-icon>
                  查看资质校验详情
                </el-button>
                <el-table
                  v-if="expandedLogId === log.id"
                  :data="parseCheckData(log.qualificationCheck)"
                  size="small"
                  style="margin-top: 10px"
                >
                  <el-table-column prop="name" label="校验项" width="120" />
                  <el-table-column label="结果" width="80">
                    <template #default="{ row }">
                      <el-icon :class="row.passed ? 'text-success' : 'text-danger'">
                        <CircleCheck v-if="row.passed" />
                        <CircleClose v-else />
                      </el-icon>
                    </template>
                  </el-table-column>
                  <el-table-column prop="message" label="说明" />
                </el-table>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  Loading,
  Right,
  ChatDotRound,
  Document,
  CircleCheck,
  CircleClose,
  Upload,
  Edit,
  Check,
  Close,
  View,
  Bell,
  Clock
} from '@element-plus/icons-vue'
import { getAuditLogsApi } from '@/api/driver'
import { OperationType, DriverAuditStatusMap, DriverAuditStatusColorMap } from '@/enums/driver'
import { formatDate } from '@/utils/format'
import type { DriverAuditLog } from '@/types/driver'

interface Props {
  driverId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const logs = ref<DriverAuditLog[]>([])
const expandedLogId = ref<number | null>(null)

const loadLogs = async () => {
  loading.value = true
  try {
    const res = await getAuditLogsApi(props.driverId)
    logs.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '加载记录失败')
  } finally {
    loading.value = false
  }
}

const getTimelineType = (operationType: number) => {
  const typeMap: Record<number, string> = {
    [OperationType.SUBMIT]: 'primary',
    [OperationType.MODIFY]: 'warning',
    [OperationType.APPROVE]: 'success',
    [OperationType.REJECT]: 'danger',
    [OperationType.REVIEW]: 'warning',
    [OperationType.URGENT]: 'primary',
    [OperationType.REMIND]: 'info',
    [OperationType.EXPIRED]: 'danger'
  }
  return typeMap[operationType] || 'primary'
}

const getTimelineIcon = (operationType: number) => {
  const iconMap: Record<number, any> = {
    [OperationType.SUBMIT]: Upload,
    [OperationType.MODIFY]: Edit,
    [OperationType.APPROVE]: Check,
    [OperationType.REJECT]: Close,
    [OperationType.REVIEW]: View,
    [OperationType.URGENT]: Clock,
    [OperationType.REMIND]: Bell,
    [OperationType.EXPIRED]: Clock
  }
  return iconMap[operationType] || Upload
}

const getTagType = (operationType: number) => {
  const typeMap: Record<number, string> = {
    [OperationType.SUBMIT]: '',
    [OperationType.MODIFY]: 'warning',
    [OperationType.APPROVE]: 'success',
    [OperationType.REJECT]: 'danger',
    [OperationType.REVIEW]: 'warning',
    [OperationType.URGENT]: 'primary',
    [OperationType.REMIND]: 'info',
    [OperationType.EXPIRED]: 'danger'
  }
  return typeMap[operationType] || ''
}

const getStatusName = (status: number) => DriverAuditStatusMap[status] || '未知'

const getStatusTagType = (status: number) => {
  const color = DriverAuditStatusColorMap[status]
  if (color === '#67c23a') return 'success'
  if (color === '#f56c6c') return 'danger'
  if (color === '#e6a23c') return 'warning'
  return 'info'
}

const parseCheckData = (check: any) => {
  if (!check) return []
  if (Array.isArray(check)) return check
  try {
    return JSON.parse(check)
  } catch {
    return []
  }
}

const toggleCheckDetail = (log: DriverAuditLog) => {
  expandedLogId.value = expandedLogId.value === log.id ? null : log.id
}

onMounted(() => {
  loadLogs()
})
</script>

<style lang="scss" scoped>
.driver-audit-trace {
  .trace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
    }
  }

  .loading-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #909399;

    p {
      margin-top: 12px;
    }
  }

  .timeline-container {
    .log-card {
      margin-bottom: 16px;

      :deep(.el-card__body) {
        padding: 16px;
      }

      .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .operator {
          font-size: 12px;
          color: #909399;
        }
      }

      .log-body {
        .status-transition {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          .status-label {
            font-size: 13px;
            color: #606266;
          }

          .arrow-icon {
            color: #909399;
            font-size: 16px;
          }
        }

        .log-remark {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          margin: 0 0 12px 0;
          font-size: 13px;
          color: #606266;
          line-height: 1.5;

          .el-icon {
            margin-top: 2px;
            color: #909399;
          }
        }

        .qualification-check {
          padding-top: 12px;
          border-top: 1px solid #ebeef5;

          .text-success {
            color: #67c23a;
          }

          .text-danger {
            color: #f56c6c;
          }
        }
      }
    }
  }
}
</style>
