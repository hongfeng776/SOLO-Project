<template>
  <div class="traffic-anomaly-trace">
    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索操作人/原因/结果"
          clearable
          style="width: 240px; margin-right: 12px;"
          @keyup.enter="fetchData"
        />
        <el-select
          v-model="queryParams.handleType"
          placeholder="处置类型"
          clearable
          style="width: 160px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, type) in TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES"
            :key="type"
            :label="name"
            :value="type"
          />
        </el-select>
        <el-select
          v-model="queryParams.handleStatus"
          placeholder="处理状态"
          clearable
          style="width: 140px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, status) in TRAFFIC_ANOMALY_HANDLE_STATUS_NAMES"
            :key="status"
            :label="name"
            :value="Number(status)"
          />
        </el-select>
        <el-select
          v-model="queryParams.blockReason"
          placeholder="拦截原因"
          clearable
          style="width: 160px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, reason) in TRAFFIC_ANOMALY_BLOCK_REASON_NAMES"
            :key="reason"
            :label="name"
            :value="reason"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="margin-right: 12px;"
        />
        <el-button type="primary" :icon="Search" @click="fetchData">查询</el-button>
        <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
      </div>

      <div class="logs-table-wrapper">
        <el-table
          v-loading="loading"
          :data="tableData"
          border
          stripe
          @row-dblclick="handleRowDblclick"
          :row-class-name="rowClassName"
        >
          <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
          <el-table-column prop="id" label="日志ID" width="90" align="center" fixed="left" />
          <el-table-column label="关联异常" min-width="220" fixed="left">
            <template #default="{ row }">
              <div v-if="row.anomaly" class="anomaly-link">
                <el-tag
                  size="small"
                  :type="TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES[row.anomaly.riskLevel]"
                  style="margin-right: 6px;"
                >
                  {{ TRAFFIC_ANOMALY_RISK_LEVEL_NAMES[row.anomaly.riskLevel] }}
                </el-tag>
                <span class="anomaly-user">{{ row.anomaly.userName }}</span>
                <div class="anomaly-type">
                  {{ TRAFFIC_ANOMALY_TYPE_NAMES[row.anomaly.anomalyType] }}
                </div>
              </div>
              <div v-else class="no-link">-</div>
            </template>
          </el-table-column>
          <el-table-column label="处置类型" width="130">
            <template #default="{ row }">
              <el-tag
                size="small"
                :color="TRAFFIC_ANOMALY_HANDLE_TYPE_COLORS[row.handleType]"
                effect="light"
                style="color: #fff;"
              >
                {{ TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[row.handleType] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="row.handleStatus === 1 ? 'success' : row.handleStatus === 2 ? 'danger' : row.handleStatus === 3 ? 'warning' : 'info'"
              >
                {{ TRAFFIC_ANOMALY_HANDLE_STATUS_NAMES[row.handleStatus] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="变更前后" min-width="220">
            <template #default="{ row }">
              <div class="status-transition-row">
                <template v-if="row.oldStatus !== undefined && row.newStatus !== undefined">
                  <el-tag size="small" :type="TRAFFIC_ANOMALY_STATUS_TAG_TYPES[row.oldStatus]">
                    {{ TRAFFIC_ANOMALY_STATUS_NAMES[row.oldStatus] }}
                  </el-tag>
                  <el-icon class="arrow-icon"><Right /></el-icon>
                  <el-tag size="small" :type="TRAFFIC_ANOMALY_STATUS_TAG_TYPES[row.newStatus]">
                    {{ TRAFFIC_ANOMALY_STATUS_NAMES[row.newStatus] }}
                  </el-tag>
                </template>
                <template v-else>
                  <span class="no-transition">-</span>
                </template>
              </div>
              <div class="handle-reason" v-if="row.handleReason">
                原因：{{ row.handleReason }}
              </div>
              <div class="handle-result" v-if="row.handleResult">
                结果：{{ row.handleResult }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="拦截信息" min-width="200">
            <template #default="{ row }">
              <template v-if="row.blockReason">
                <el-tag
                  size="small"
                  type="danger"
                  effect="light"
                  style="margin-bottom: 4px;"
                >
                  {{ TRAFFIC_ANOMALY_BLOCK_REASON_NAMES[row.blockReason] }}
                </el-tag>
                <div v-if="row.blockDetail" class="block-detail">
                  <el-tooltip :content="formatBlockDetail(row.blockDetail)" placement="top">
                    <span class="detail-text">{{ formatBlockDetail(row.blockDetail) }}</span>
                  </el-tooltip>
                </div>
                <div class="score-row">
                  <span class="score-item" :class="{ 'low-score': row.authenticityScore && row.authenticityScore < 50 }">
                    真实: {{ (row.authenticityScore || 0).toFixed(0) }}
                  </span>
                  <span class="score-item" :class="{ 'low-score': row.complianceScore && row.complianceScore < 50 }">
                    合规: {{ (row.complianceScore || 0).toFixed(0) }}
                  </span>
                </div>
              </template>
              <template v-else>
                <span class="no-block">-</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column label="影响" width="160">
            <template #default="{ row }">
              <div class="impact-row">
                <div v-if="row.cleanedExposureCount">
                  清理曝光：{{ formatNumber(row.cleanedExposureCount) }}
                </div>
                <div v-if="row.handleCost">
                  耗时：{{ row.handleCost }} ms
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
          <el-table-column prop="createTime" label="操作时间" width="180" align="center" fixed="right">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <ImpactAnalysisDialog
      v-model="impactDialogVisible"
      :anomaly-id="currentAnomalyId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineAsyncComponent } from 'vue'
import { Search, Refresh, Right } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { getTrafficAnomalyHandleLogs } from '@api/traffic-anomaly-control'
import {
  TRAFFIC_ANOMALY_TYPE_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES,
  TRAFFIC_ANOMALY_STATUS_NAMES,
  TRAFFIC_ANOMALY_STATUS_TAG_TYPES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_COLORS,
  TRAFFIC_ANOMALY_HANDLE_STATUS_NAMES,
  TRAFFIC_ANOMALY_BLOCK_REASON_NAMES
} from '@/enums/business'
import { formatDateTime, formatNumber } from '@hooks/index'
import type { TrafficAnomalyHandleLog, TrafficAnomalyPermission } from '@/types/business'

const ImpactAnalysisDialog = defineAsyncComponent(() => import('../monitor/components/ImpactAnalysisDialog.vue'))

const userStore = useUserStore()

const permission = reactive<TrafficAnomalyPermission>({
  canView: false, canHandle: false, canBatch: false,
  canRelease: false, canBan: false, canViewTrace: false, canExportReport: false
})

const computePermission = () => {
  const has = (r: string) => userStore.hasRole(r)
  permission.canView = has('admin') || has('risk_admin') || has('senior_operator') || has('operator')
  permission.canHandle = has('admin') || has('risk_admin') || has('senior_operator')
  permission.canBatch = has('admin') || has('risk_admin')
  permission.canRelease = has('admin') || has('risk_admin')
  permission.canBan = has('admin') || has('risk_admin')
  permission.canViewTrace = has('admin') || has('risk_admin') || has('senior_operator') || has('operator')
  permission.canExportReport = has('admin') || has('risk_admin')
}

const tableData = ref<TrafficAnomalyHandleLog[]>([])
const total = ref(0)
const loading = ref(false)
const dateRange = ref<string[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  handleType: '',
  handleStatus: undefined as number | undefined,
  blockReason: '',
  startTime: '',
  endTime: ''
})

const impactDialogVisible = ref(false)
const currentAnomalyId = ref<number>(0)

const fetchData = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startTime = dateRange.value[0]
    queryParams.endTime = dateRange.value[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }

  const params: Record<string, unknown> = { ...queryParams }
  if (params.handleType === '') delete params.handleType
  if (params.blockReason === '') delete params.blockReason

  loading.value = true
  try {
    const res = await getTrafficAnomalyHandleLogs(params as any)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.handleType = ''
  queryParams.handleStatus = undefined
  queryParams.blockReason = ''
  dateRange.value = []
  fetchData()
}

const handleRowDblclick = (row: TrafficAnomalyHandleLog) => {
  if (row.anomalyId) {
    currentAnomalyId.value = row.anomalyId
    impactDialogVisible.value = true
  }
}

const rowClassName = ({ row }: { row: TrafficAnomalyHandleLog }) => {
  if (row.blockReason) {
    return 'blocked-row'
  }
  if (row.handleStatus === 1) {
    return 'success-row'
  }
  return ''
}

const formatBlockDetail = (detail: string) => {
  try {
    const obj = JSON.parse(detail)
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
      .join('; ')
  } catch (_e) {
    return detail
  }
}

onMounted(() => {
  computePermission()
  fetchData()
})
</script>

<style scoped lang="scss">
.traffic-anomaly-trace {
  .filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 16px;
    gap: 8px;
  }

  .logs-table-wrapper {
    height: calc(100vh - 340px);
    overflow: auto;

    :deep(.el-table__header-wrapper) {
      position: sticky;
      top: 0;
      z-index: 2;
    }

    :deep(.el-table__body-wrapper) {
      overflow: visible;
    }
  }

  :deep(.blocked-row) {
    background-color: rgba(245, 108, 108, 0.06) !important;
  }

  :deep(.success-row) {
    background-color: rgba(103, 194, 58, 0.04) !important;
  }

  .anomaly-link {
    .anomaly-user {
      font-weight: 500;
    }
    .anomaly-type {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }
  .no-link {
    color: #c0c4cc;
  }

  .status-transition-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    .arrow-icon {
      color: #909399;
      font-size: 12px;
    }
    .no-transition {
      color: #c0c4cc;
    }
  }

  .handle-reason, .handle-result {
    font-size: 12px;
    color: #606266;
    margin-top: 2px;
    line-height: 1.4;
  }

  .block-detail {
    font-size: 12px;
    .detail-text {
      color: #f56c6c;
    }
  }

  .score-row {
    margin-top: 4px;
    font-size: 12px;
    display: flex;
    gap: 12px;
    .score-item {
      color: #67c23a;
      &.low-score {
        color: #f56c6c;
      }
    }
  }

  .no-block {
    color: #c0c4cc;
  }

  .impact-row {
    font-size: 12px;
    color: #606266;
    line-height: 1.6;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
