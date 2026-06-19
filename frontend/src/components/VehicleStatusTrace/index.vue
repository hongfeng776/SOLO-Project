<template>
  <div class="vehicle-status-trace" v-loading="loading">
    <!-- Stats cards -->
    <div class="stats-cards">
      <div class="stat-card primary">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">状态变更总数</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><el-icon><Warning /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.anomalyCount }}</div>
          <div class="stat-label">异常拦截次数</div>
        </div>
      </div>
      <div class="stat-card success">
        <div class="stat-icon"><el-icon><SetUp /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.autoCount }}</div>
          <div class="stat-label">自动判定次数</div>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon"><el-icon><Bell /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.alertCount }}</div>
          <div class="stat-label">运维告警次数</div>
        </div>
      </div>
    </div>

    <!-- Filter section -->
    <div class="filter-section">
      <el-select v-model="filterForm.changeType" placeholder="变更类型" clearable style="width: 160px">
        <el-option v-for="(label, value) in StatusChangeTypeMap" :key="value" :label="label" :value="Number(value)" />
      </el-select>
      <el-select v-model="filterForm.triggerType" placeholder="触发类型" clearable style="width: 140px">
        <el-option v-for="(label, value) in TriggerTypeMap" :key="value" :label="label" :value="Number(value)" />
      </el-select>
      <el-select v-model="filterForm.alertLevel" placeholder="告警等级" clearable style="width: 140px">
        <el-option label="严重" :value="3" />
        <el-option label="警告" :value="2" />
        <el-option label="提示" :value="1" />
      </el-select>
      <el-select v-model="filterForm.isAnomaly" placeholder="是否异常" clearable style="width: 120px">
        <el-option label="异常" :value="1" />
        <el-option label="正常" :value="0" />
      </el-select>
      <el-button type="primary" @click="loadLogs">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
    </div>

    <!-- Timeline -->
    <div class="trace-timeline">
      <el-timeline>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="formatDate(log.createTime)"
          :type="getTimelineType(log)"
          :hollow="log.isAnomaly !== 1"
          placement="top"
        >
          <div class="timeline-card" :class="{ 'is-anomaly': log.isAnomaly === 1, 'is-alert': log.alertLevel >= 2 }">
            <div class="card-header">
              <div class="header-left">
                <el-tag :type="getChangeTypeTagType(log.changeType)" size="small">
                  {{ StatusChangeTypeMap[log.changeType as keyof typeof StatusChangeTypeMap] }}
                </el-tag>
                <span class="trigger-tag" v-if="log.triggerType">
                  {{ TriggerTypeMap[log.triggerType as keyof typeof TriggerTypeMap] }}
                </span>
              </div>
              <div class="header-right">
                <el-tag v-if="log.isAnomaly === 1" type="danger" size="small" effect="dark">
                  <el-icon><Warning /></el-icon>
                  异常
                </el-tag>
                <el-tag v-if="log.alertLevel >= 2" :type="log.alertLevel === 3 ? 'danger' : 'warning'" size="small">
                  {{ log.alertLevel === 3 ? '严重告警' : '告警' }}
                </el-tag>
              </div>
            </div>

            <div class="status-change" v-if="log.oldOperationStatus !== null || log.newOperationStatus !== null">
              <span class="status-old">{{ OperationStatusMap[log.oldOperationStatus as keyof typeof OperationStatusMap] || '-' }}</span>
              <el-icon class="arrow-icon"><Right /></el-icon>
              <span class="status-new">{{ OperationStatusMap[log.newOperationStatus as keyof typeof OperationStatusMap] || '-' }}</span>
            </div>

            <div class="change-reason" v-if="log.triggerReason">
              <span class="label">变更原因：</span>
              <span>{{ log.triggerReason }}</span>
            </div>

            <div class="alert-message" v-if="log.alertMessage">
              <el-alert :title="log.alertMessage" :type="log.alertLevel >= 2 ? 'error' : 'warning'" :closable="false" show-icon />
            </div>

            <div class="anomaly-info" v-if="log.isAnomaly === 1 && log.anomalyType">
              <span class="label">异常类型：</span>
              <el-tag type="danger" size="small">{{ getAnomalyLabel(log.anomalyType) }}</el-tag>
            </div>

            <div class="check-results" v-if="log.validationResults || log.maintenanceCheck || log.documentCheck || log.violationCheck">
              <el-collapse>
                <el-collapse-item title="校验详情">
                  <div class="check-item" v-if="log.maintenanceCheck">
                    <span class="check-label">检修记录校验：</span>
                    <span>{{ JSON.stringify(log.maintenanceCheck) }}</span>
                  </div>
                  <div class="check-item" v-if="log.documentCheck">
                    <span class="check-label">证件时效校验：</span>
                    <span>{{ JSON.stringify(log.documentCheck) }}</span>
                  </div>
                  <div class="check-item" v-if="log.violationCheck">
                    <span class="check-label">违规状态校验：</span>
                    <span>{{ JSON.stringify(log.violationCheck) }}</span>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div class="operator-info">
              <span class="label">操作人：</span>
              <span>{{ log.operatorName || '系统自动' }}</span>
              <span v-if="log.operatorRole" class="ml-8">({{ log.operatorRole }})</span>
            </div>

            <div class="capacity-impact" v-if="log.capacityImpact">
              <span class="label">运力影响：</span>
              <span :class="log.capacityImpact.delta > 0 ? 'text-success' : 'text-danger'">
                {{ log.capacityImpact.delta > 0 ? '+' : '' }}{{ log.capacityImpact.delta }}
              </span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadLogs"
        @size-change="loadLogs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Warning, SetUp, Bell, Right } from '@element-plus/icons-vue'
import { getStatusLogsApi } from '@/api/vehicle'
import { OperationStatusMap, StatusChangeTypeMap, TriggerTypeMap } from '@/enums/vehicle'
import { formatDate } from '@/utils/format'
import type { Vehicle, VehicleStatusLog } from '@/types/vehicle'

const props = defineProps<{
  vehicleId: number
  vehicle: Vehicle | null
}>()

const loading = ref(false)
const logs = ref<VehicleStatusLog[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 20
})

const filterForm = reactive({
  changeType: undefined as number | undefined,
  triggerType: undefined as number | undefined,
  alertLevel: undefined as number | undefined,
  isAnomaly: undefined as number | undefined
})

const stats = computed(() => {
  let anomalyCount = 0
  let autoCount = 0
  let alertCount = 0
  logs.value.forEach(log => {
    if (log.isAnomaly === 1) anomalyCount++
    if (log.triggerType === 2 || log.triggerType === 3) autoCount++
    if (log.alertLevel >= 2) alertCount++
  })
  return {
    total: total.value,
    anomalyCount,
    autoCount,
    alertCount
  }
})

const getTimelineType = (log: VehicleStatusLog) => {
  if (log.isAnomaly === 1) return 'danger'
  if (log.alertLevel >= 2) return 'warning'
  if (log.changeType === 6) return 'danger'
  if (log.changeType === 7) return 'primary'
  return 'primary'
}

const getChangeTypeTagType = (changeType: number) => {
  const map: Record<number, string> = {
    1: '', 2: 'warning', 3: 'danger', 4: 'danger', 5: 'warning', 6: 'danger', 7: ''
  }
  return map[changeType] || ''
}

const getAnomalyLabel = (type: string) => {
  const map: Record<string, string> = {
    violation_online: '违规上线',
    sick_operation: '带病运营',
    status_fluctuation: '状态异常波动'
  }
  return map[type] || type
}

const loadLogs = async () => {
  if (!props.vehicleId) return
  loading.value = true
  try {
    const res = await getStatusLogsApi(props.vehicleId, {
      ...queryParams,
      ...filterForm
    })
    logs.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取状态日志失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  filterForm.changeType = undefined
  filterForm.triggerType = undefined
  filterForm.alertLevel = undefined
  filterForm.isAnomaly = undefined
  queryParams.page = 1
  loadLogs()
}

watch(() => props.vehicleId, (val) => {
  if (val) {
    queryParams.page = 1
    loadLogs()
  }
})

onMounted(() => {
  if (props.vehicleId) loadLogs()
})
</script>

<style lang="scss" scoped>
.vehicle-status-trace {
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background: #fff;
      border: 1px solid #ebeef5;

      &.primary { border-left: 4px solid #409eff; }
      &.warning { border-left: 4px solid #e6a23c; }
      &.success { border-left: 4px solid #67c23a; }
      &.danger { border-left: 4px solid #f56c6c; }

      .stat-icon {
        font-size: 28px;
        margin-right: 12px;

        &.primary { color: #409eff; }
        &.warning { color: #e6a23c; }
        &.success { color: #67c23a; }
        &.danger { color: #f56c6c; }
      }

      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #303133;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }

  .filter-section {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .trace-timeline {
    .timeline-card {
      background: #fafafa;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 12px 16px;

      &.is-anomaly {
        background: #fef0f0;
        border-color: #fab6b6;
      }

      &.is-alert {
        border-left: 3px solid #e6a23c;
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .trigger-tag {
          font-size: 12px;
          color: #909399;
        }
      }

      .status-change {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;

        .status-old { color: #909399; font-weight: 500; }
        .arrow-icon { color: #c0c4cc; }
        .status-new { color: #303133; font-weight: 600; }
      }

      .change-reason, .anomaly-info, .operator-info, .capacity-impact {
        font-size: 13px;
        margin-bottom: 4px;

        .label {
          color: #909399;
          margin-right: 4px;
        }
      }

      .alert-message {
        margin-bottom: 8px;
      }

      .check-results {
        margin-top: 8px;

        .check-item {
          font-size: 12px;
          margin-bottom: 4px;

          .check-label {
            color: #909399;
            font-weight: 500;
          }
        }
      }

      .text-success { color: #67c23a; }
      .text-danger { color: #f56c6c; }
      .ml-8 { margin-left: 8px; }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
