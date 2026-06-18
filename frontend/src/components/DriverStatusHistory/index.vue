<template>
  <div class="driver-status-history">
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else-if="logs.length === 0" class="empty-container">
      <el-empty description="暂无状态变更记录" />
    </div>

    <el-timeline v-else>
      <el-timeline-item
        v-for="log in logs"
        :key="log.id"
        :timestamp="formatDate(log.createTime)"
        :color="getStatusOperationColor(log.operationType)"
      >
        <div class="log-card" :class="{ 'abnormal': log.isAbnormal === 1 }">
          <div class="log-header">
            <div class="operation-tag" :style="{ backgroundColor: getStatusOperationColor(log.operationType) }">
              {{ getStatusOperationName(log.operationType) }}
            </div>
            <div v-if="log.isAbnormal === 1" class="abnormal-tag">
              <el-icon><Warning /></el-icon>
              异常操作
            </div>
          </div>

          <div v-if="log.oldStatus !== undefined && log.newStatus !== undefined" class="status-change">
            <el-tag :type="getDriverStatusType(log.oldStatus)" size="small" effect="light">
              {{ getDriverStatusName(log.oldStatus) }}
            </el-tag>
            <el-icon class="arrow"><Right /></el-icon>
            <el-tag :type="getDriverStatusType(log.newStatus)" size="small" effect="dark">
              {{ getDriverStatusName(log.newStatus) }}
            </el-tag>
          </div>

          <div v-if="log.oldRiskLevel !== undefined && log.newRiskLevel !== undefined && log.oldRiskLevel !== log.newRiskLevel" class="risk-change">
            <span class="label">风险等级：</span>
            <el-tag :type="getRiskLevelType(log.oldRiskLevel)" size="small">
              {{ getRiskLevelName(log.oldRiskLevel) }}
            </el-tag>
            <el-icon class="arrow"><Right /></el-icon>
            <el-tag :type="getRiskLevelType(log.newRiskLevel)" size="small" effect="dark">
              {{ getRiskLevelName(log.newRiskLevel) }}
            </el-tag>
          </div>

          <div v-if="log.changeReason" class="reason">
            <span class="label">变更原因：</span>
            <span>{{ log.changeReason }}</span>
          </div>

          <div v-if="log.abnormalReason && log.isAbnormal === 1" class="abnormal-reason">
            <el-icon><Warning /></el-icon>
            <span>{{ log.abnormalReason }}</span>
          </div>

          <div v-if="log.permissionChanges" class="permission-changes">
            <div class="perm-title">
              <el-icon><Lock /></el-icon>
              权限变更
            </div>
            <div class="perm-grid">
              <div v-if="log.permissionChanges.canAcceptOrder" class="perm-item">
                <span class="perm-label">接单</span>
                <span :class="log.permissionChanges.canAcceptOrder.new === 1 ? 'on' : 'off'">
                  {{ log.permissionChanges.canAcceptOrder.new === 1 ? '开启' : '关闭' }}
                </span>
              </div>
              <div v-if="log.permissionChanges.canWithdraw" class="perm-item">
                <span class="perm-label">提现</span>
                <span :class="log.permissionChanges.canWithdraw.new === 1 ? 'on' : 'off'">
                  {{ log.permissionChanges.canWithdraw.new === 1 ? '开启' : '关闭' }}
                </span>
              </div>
              <div v-if="log.permissionChanges.canGoOnline" class="perm-item">
                <span class="perm-label">上线</span>
                <span :class="log.permissionChanges.canGoOnline.new === 1 ? 'on' : 'off'">
                  {{ log.permissionChanges.canGoOnline.new === 1 ? '开启' : '关闭' }}
                </span>
              </div>
              <div v-if="log.permissionChanges.trafficWeight" class="perm-item">
                <span class="perm-label">流量</span>
                <span class="weight">{{ log.permissionChanges.trafficWeight.new }}x</span>
              </div>
            </div>
          </div>

          <div v-if="log.expireTime" class="expire-info">
            <el-icon><Clock /></el-icon>
            <span>失效时间：{{ formatDate(log.expireTime) }}</span>
          </div>

          <div class="operator-info">
            <el-icon><User /></el-icon>
            <span>{{ log.operatorName || '系统' }}</span>
            <span v-if="log.operatorRole" class="role">({{ log.operatorRole }})</span>
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  Loading,
  Right,
  Warning,
  Lock,
  Clock,
  User
} from '@element-plus/icons-vue'
import { getStatusLogsApi } from '@/api/driver'
import {
  DriverStatusMap,
  DriverStatusTypeMap,
  AccountRiskLevelMap,
  AccountRiskLevelTypeMap,
  StatusOperationTypeMap,
  StatusOperationTypeColorMap
} from '@/enums/driver'
import { formatDate } from '@/utils/format'
import type { DriverStatusLog } from '@/types/driver'

const props = defineProps<{
  driverId: number | null
}>()

const loading = ref(false)
const logs = ref<DriverStatusLog[]>([])

const getDriverStatusName = (status: number) => DriverStatusMap[status] || '未知'
const getDriverStatusType = (status: number) => DriverStatusTypeMap[status] || 'info'
const getRiskLevelName = (level: number) => AccountRiskLevelMap[level] || '未知'
const getRiskLevelType = (level: number) => AccountRiskLevelTypeMap[level] || 'info'
const getStatusOperationName = (type: number) => StatusOperationTypeMap[type] || '未知操作'
const getStatusOperationColor = (type: number) => StatusOperationTypeColorMap[type] || '#909399'

const loadLogs = async () => {
  if (!props.driverId) return
  loading.value = true
  try {
    const res = await getStatusLogsApi(props.driverId)
    logs.value = res.data
  } catch (error) {
    logs.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.driverId, () => {
  loadLogs()
}, { immediate: true })

onMounted(() => {
  if (props.driverId) {
    loadLogs()
  }
})
</script>

<style lang="scss" scoped>
.driver-status-history {
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 8px;
    color: #909399;
  }

  .empty-container {
    padding: 40px 0;
  }

  .log-card {
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 14px;
    margin-left: 8px;

    &.abnormal {
      border-color: #f56c6c;
      background: #fef0f0;
    }

    .log-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;

      .operation-tag {
        padding: 2px 10px;
        border-radius: 4px;
        color: #fff;
        font-size: 12px;
        font-weight: 500;
      }

      .abnormal-tag {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        background: #fef0f0;
        border: 1px solid #f56c6c;
        color: #f56c6c;
        font-size: 12px;
        border-radius: 4px;
      }
    }

    .status-change,
    .risk-change {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .label {
        color: #606266;
        font-size: 13px;
      }

      .arrow {
        color: #c0c4cc;
        font-size: 14px;
      }
    }

    .reason {
      font-size: 13px;
      color: #303133;
      margin-bottom: 8px;

      .label {
        color: #909399;
      }
    }

    .abnormal-reason {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 8px 10px;
      background: #fef0f0;
      border-radius: 4px;
      color: #f56c6c;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .permission-changes {
      background: #f5f7fa;
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 8px;

      .perm-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #606266;
        margin-bottom: 8px;
      }

      .perm-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px;

        .perm-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;

          .perm-label {
            color: #909399;
          }

          .on {
            color: #67c23a;
            font-weight: 500;
          }

          .off {
            color: #f56c6c;
            font-weight: 500;
          }

          .weight {
            color: #409eff;
            font-weight: 500;
          }
        }
      }
    }

    .expire-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #e6a23c;
      margin-bottom: 8px;
    }

    .operator-info {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #909399;
      padding-top: 8px;
      border-top: 1px solid #ebeef5;

      .role {
        color: #c0c4cc;
      }
    }
  }
}
</style>
