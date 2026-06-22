<template>
  <div class="traffic-anomaly-monitor">
    <el-alert
      v-if="showAnomalyAlert"
      :title="alertTitle"
      type="error"
      show-icon
      closable
      :class="{ 'anomaly-shake': showAnomalyAlert }"
      style="margin-bottom: 16px;"
      @close="showAnomalyAlert = false"
    >
      <template #default>
        {{ alertMessage }}
      </template>
    </el-alert>

    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">今日检测</div>
            <div class="stat-value today-value">{{ stats.todayDetected || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">待处置</div>
            <div class="stat-value pending-value">{{ stats.pending || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">已拦截</div>
            <div class="stat-value intercepted-value">{{ stats.intercepted || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">高风险</div>
            <div class="stat-value high-risk-value">{{ stats.highRisk || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">自动拦截</div>
            <div class="stat-value auto-value">{{ stats.autoHandled || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-label">永久封禁</div>
            <div class="stat-value banned-value">{{ stats.permanentBanned || 0 }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <div class="filter-bar">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索用户名/内容标题/IP"
          clearable
          style="width: 240px; margin-right: 12px;"
          @keyup.enter="fetchData"
        />
        <el-select
          v-model="queryParams.anomalyType"
          placeholder="异常类型"
          clearable
          style="width: 160px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, type) in TRAFFIC_ANOMALY_TYPE_NAMES"
            :key="type"
            :label="name"
            :value="type"
          />
        </el-select>
        <el-select
          v-model="queryParams.riskLevel"
          placeholder="风险等级"
          clearable
          style="width: 140px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, level) in TRAFFIC_ANOMALY_RISK_LEVEL_NAMES"
            :key="level"
            :label="name"
            :value="Number(level)"
          />
        </el-select>
        <el-select
          v-model="queryParams.status"
          placeholder="处置状态"
          clearable
          style="width: 140px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, status) in TRAFFIC_ANOMALY_STATUS_NAMES"
            :key="status"
            :label="name"
            :value="Number(status)"
          />
        </el-select>
        <el-select
          v-model="queryParams.source"
          placeholder="来源"
          clearable
          style="width: 140px; margin-right: 12px;"
        >
          <el-option
            v-for="(name, src) in TRAFFIC_ANOMALY_SOURCE_NAMES"
            :key="src"
            :label="name"
            :value="src"
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

      <div v-if="permission?.canBatch && selectedIds.length > 0" class="batch-bar">
        <el-tag type="info" style="margin-right: 16px;">
          已选中 {{ selectedIds.length }} 条记录
        </el-tag>
        <el-button type="success" :icon="Delete" @click="handleBatch('clean_data')">
          批量清理数据
        </el-button>
        <el-button type="warning" :icon="CircleCheck" @click="handleBatch('release_control')">
          批量解除风控
        </el-button>
        <el-button type="danger" :icon="CircleClose" @click="handleBatch('permanent_ban')">
          批量封禁账号
        </el-button>
        <div v-if="batchLoading" class="batch-progress-wrapper">
          <el-progress
            :percentage="batchProgress"
            :stroke-width="8"
            :class="{ 'progress-animated': batchLoading }"
          />
        </div>
      </div>

      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column label="异常信息" min-width="200">
          <template #default="{ row }">
            <div :class="{ 'risk-glow': row.riskLevel >= 2, 'row-highlight': selectedIds.includes(row.id) }">
              <div class="anomaly-title">
                <el-tag
                  size="small"
                  :type="TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES[row.riskLevel]"
                  effect="light"
                  style="margin-right: 8px;"
                >
                  {{ TRAFFIC_ANOMALY_RISK_LEVEL_NAMES[row.riskLevel] }}
                </el-tag>
                <span class="type-name">
                  {{ TRAFFIC_ANOMALY_TYPE_NAMES[row.anomalyType] }}
                </span>
              </div>
              <div class="anomaly-sub" v-if="row.contentTitle">
                内容：{{ row.contentTitle }}
              </div>
              <div class="anomaly-sub">
                用户：{{ row.userName }}
                <el-tag size="small" type="info" style="margin-left: 8px;">
                  {{ TRAFFIC_ANOMALY_SOURCE_NAMES[row.source] }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="数据概览" width="220">
          <template #default="{ row }">
            <div class="data-grid">
              <div class="data-item">
                <span class="data-label">曝光量</span>
                <span class="data-value">{{ formatNumber(row.exposureCount || 0) }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">频次/小时</span>
                <span class="data-value" :class="{ 'danger-text': row.exposureFrequency && row.exposureFrequency > 1000 }">
                  {{ row.exposureFrequency || 0 }}
                </span>
              </div>
              <div class="data-item">
                <span class="data-label">独立IP</span>
                <span class="data-value">{{ row.uniqueIpCount || 0 }}</span>
              </div>
              <div class="data-item">
                <span class="data-label">独立设备</span>
                <span class="data-value">{{ row.uniqueDeviceCount || 0 }}</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="IP/位置" width="160">
          <template #default="{ row }">
            <div class="ip-info">
              <div class="ip-address">{{ row.ipAddress || '-' }}</div>
              <div class="ip-location" v-if="row.ipLocation">{{ row.ipLocation }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="置信度" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.confidence && row.confidence >= 0.8 ? 'danger' : row.confidence && row.confidence >= 0.5 ? 'warning' : 'info'"
            >
              {{ ((row.confidence || 0) * 100).toFixed(0) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处置状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="TRAFFIC_ANOMALY_STATUS_TAG_TYPES[row.status]"
              effect="light"
              :class="{ 'status-transition': transitionIds[row.id] }"
              :key="row.status"
            >
              {{ TRAFFIC_ANOMALY_STATUS_NAMES[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="detectTime" label="检测时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.detectTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="permission?.canHandle">
              <el-dropdown
                trigger="click"
                @command="(cmd: string) => handleSingle(row, cmd)"
                :disabled="row.status === 5"
              >
                <el-button size="small" type="primary">
                  处置
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="intercept_flow" :disabled="row.status === 1">
                      拦截流量
                    </el-dropdown-item>
                    <el-dropdown-item command="content_flow_limit" :disabled="row.status === 2">
                      内容限流
                    </el-dropdown-item>
                    <el-dropdown-item command="account_downgrade" :disabled="row.status === 3">
                      账号降权
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="permission?.canBan"
                      command="permanent_ban"
                      :disabled="row.status === 5"
                      divided
                    >
                      永久封禁
                    </el-dropdown-item>
                    <el-dropdown-item
                      v-if="permission?.canRelease"
                      command="release_control"
                      :disabled="row.status === 4"
                      divided
                    >
                      解除风控
                    </el-dropdown-item>
                    <el-dropdown-item command="clean_data">
                      清理异常数据
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button
                size="small"
                type="primary"
                link
                @click="handleViewDetail(row)"
              >详情</el-button>
              <el-button
                size="small"
                type="primary"
                link
                @click="handleViewImpact(row)"
              >溯源</el-button>
            </template>
            <template v-else>
              <el-button size="small" @click="handleViewDetail(row)">查看</el-button>
              <el-button size="small" type="primary" link @click="handleViewImpact(row)">溯源</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <HandleDialog
      v-model="handleDialogVisible"
      :id="currentAnomalyId"
      :handle-type="currentHandleType"
      @handle-success="handleHandleSuccess"
    />

    <AnomalyDetailDialog
      v-model="detailDialogVisible"
      :anomaly-id="currentAnomalyId"
    />

    <ImpactAnalysisDialog
      v-model="impactDialogVisible"
      :anomaly-id="currentAnomalyId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineAsyncComponent } from 'vue'
import { Search, Refresh, ArrowDown, Delete, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { formatDateTime, formatNumber } from '@hooks/index'
import {
  getTrafficAnomalyList,
  getTrafficAnomalyStats,
  batchHandleTrafficAnomalies
} from '@api/traffic-anomaly-control'
import {
  TRAFFIC_ANOMALY_TYPE_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_NAMES,
  TRAFFIC_ANOMALY_RISK_LEVEL_TAG_TYPES,
  TRAFFIC_ANOMALY_STATUS_NAMES,
  TRAFFIC_ANOMALY_STATUS_TAG_TYPES,
  TRAFFIC_ANOMALY_SOURCE_NAMES,
  TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES
} from '@/enums/business'
import type { TrafficAnomalyRecord, TrafficAnomalyPermission } from '@/types/business'

const HandleDialog = defineAsyncComponent(() => import('./components/HandleDialog.vue'))
const AnomalyDetailDialog = defineAsyncComponent(() => import('./components/AnomalyDetailDialog.vue'))
const ImpactAnalysisDialog = defineAsyncComponent(() => import('./components/ImpactAnalysisDialog.vue'))

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

const tableData = ref<TrafficAnomalyRecord[]>([])
const total = ref(0)
const loading = ref(false)
const stats = ref<Record<string, number>>({})
const selectedIds = ref<number[]>([])
const transitionIds = reactive<Record<number, boolean>>({})
const dateRange = ref<string[]>([])

const showAnomalyAlert = ref(false)
const alertTitle = ref('')
const alertMessage = ref('')

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  anomalyType: '' as string | undefined,
  riskLevel: undefined as number | undefined,
  status: undefined as number | undefined,
  source: '' as string | undefined,
  startTime: '' as string | undefined,
  endTime: '' as string | undefined
})

const handleDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const impactDialogVisible = ref(false)
const currentAnomaly = ref<TrafficAnomalyRecord | null>(null)
const currentAnomalyId = ref<number>(0)
const currentHandleType = ref('')

const batchLoading = ref(false)
const batchProgress = ref(0)

const fetchStats = async () => {
  try {
    const res = await getTrafficAnomalyStats()
    stats.value = {
      total: res.total,
      pending: res.pending,
      intercepted: res.intercepted,
      flowLimited: res.flowLimited,
      accountDowngraded: res.accountDowngraded,
      permanentBanned: res.permanentBanned,
      released: res.released,
      todayDetected: res.todayDetected,
      todayHandled: res.todayHandled,
      highRisk: res.highRisk,
      autoHandled: res.autoHandled
    }

    if (res.todayDetected && res.todayDetected > 0 && res.highRisk && res.highRisk > 0) {
      alertTitle.value = `今日检测到 ${res.todayDetected} 条异常流量`
      alertMessage.value = `其中高风险 ${res.highRisk} 条，系统已自动拦截 ${res.autoHandled} 条，请及时处理！`
      showAnomalyAlert.value = true
    }
  } catch (_err) {
    // ignore
  }
}

const fetchData = async () => {
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startTime = dateRange.value[0]
    queryParams.endTime = dateRange.value[1]
  } else {
    queryParams.startTime = undefined
    queryParams.endTime = undefined
  }

  const params: Record<string, unknown> = { ...queryParams }
  if (params.anomalyType === '') delete params.anomalyType
  if (params.source === '') delete params.source

  loading.value = true
  try {
    const res = await getTrafficAnomalyList(params as any)
    tableData.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryParams.keyword = ''
  queryParams.anomalyType = ''
  queryParams.riskLevel = undefined
  queryParams.status = undefined
  queryParams.source = ''
  dateRange.value = []
  fetchData()
}

const handleSelectionChange = (selection: TrafficAnomalyRecord[]) => {
  selectedIds.value = selection.map(item => item.id)
}

const handleSingle = async (row: TrafficAnomalyRecord, handleType: string) => {
  try {
    await ElMessageBox.confirm(
      `确定对 ${row.userName} 执行「${TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[handleType as keyof typeof TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES]}」操作吗？`,
      '操作确认',
      { type: 'warning' }
    )
  } catch (_err) {
    return
  }

  currentAnomaly.value = row
  currentAnomalyId.value = row.id
  currentHandleType.value = handleType
  handleDialogVisible.value = true
}

const handleBatch = async (handleType: string) => {
  const handleName = TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES[handleType as keyof typeof TRAFFIC_ANOMALY_HANDLE_TYPE_NAMES]
  try {
    await ElMessageBox.confirm(
      `确定对选中的 ${selectedIds.value.length} 条记录执行「${handleName}」操作吗？此操作将立即生效。`,
      '批量操作确认',
      { type: 'warning' }
    )
  } catch (_err) {
    return
  }

  batchLoading.value = true
  batchProgress.value = 0
  const progressInterval = setInterval(() => {
    if (batchProgress.value < 90) {
      batchProgress.value += 10
    }
  }, 200)

  try {
    const res = await batchHandleTrafficAnomalies({
      ids: selectedIds.value,
      handleType,
      reason: `批量${handleName}`
    })
    batchProgress.value = 100
    ElMessage.success(`批量操作完成：成功 ${res.success} 条，失败 ${res.failed} 条`)
    fetchData()
    selectedIds.value = []
  } catch (err) {
    const error = err instanceof Error ? err.message : '操作失败'
    ElMessage.error(error)
  } finally {
    clearInterval(progressInterval)
    setTimeout(() => {
      batchLoading.value = false
      batchProgress.value = 0
    }, 500)
  }
}

const handleViewDetail = (row: TrafficAnomalyRecord) => {
  currentAnomalyId.value = row.id
  detailDialogVisible.value = true
}

const handleViewImpact = (row: TrafficAnomalyRecord) => {
  currentAnomalyId.value = row.id
  impactDialogVisible.value = true
}

const handleRowDblclick = (row: TrafficAnomalyRecord) => {
  handleViewImpact(row)
}

const handleHandleSuccess = () => {
  fetchData()
  fetchStats()
}

onMounted(() => {
  computePermission()
  fetchStats()
  fetchData()
})
</script>

<style scoped lang="scss">
.traffic-anomaly-monitor {
  .stat-card {
    .stat-content {
      text-align: center;
    }
    .stat-label {
      color: #909399;
      font-size: 13px;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 600;
    }
    .today-value { color: #409eff; }
    .pending-value { color: #e6a23c; }
    .intercepted-value { color: #f56c6c; }
    .high-risk-value { color: #c45656; }
    .auto-value { color: #909399; }
    .banned-value { color: #c45656; }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 16px;
    gap: 8px;
  }

  .batch-bar {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(90deg, #ecf5ff 0%, #f0f9eb 100%);
    border-radius: 4px;
    margin-bottom: 16px;
    gap: 8px;

    .batch-progress-wrapper {
      margin-left: auto;
      width: 200px;
    }
  }

  .anomaly-shake {
    animation: shake 0.5s ease-in-out;
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }

  .risk-glow {
    animation: glow 1.5s ease-in-out infinite alternate;
  }

  @keyframes glow {
    from { box-shadow: 0 0 2px 1px rgba(245, 108, 108, 0.3); }
    to { box-shadow: 0 0 8px 3px rgba(245, 108, 108, 0.6); }
  }

  .row-highlight {
    background-color: rgba(64, 158, 255, 0.08) !important;
  }

  .anomaly-title {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    .type-name {
      font-weight: 500;
      color: #303133;
    }
  }
  .anomaly-sub {
    font-size: 12px;
    color: #909399;
    margin-top: 2px;
  }

  .data-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px 12px;
    .data-item {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
    }
    .data-label {
      color: #909399;
    }
    .data-value {
      color: #303133;
      font-weight: 500;
    }
    .danger-text {
      color: #f56c6c;
    }
  }

  .ip-info {
    .ip-address {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #303133;
    }
    .ip-location {
      font-size: 12px;
      color: #909399;
      margin-top: 2px;
    }
  }

  .status-transition {
    transition: all 0.3s ease;
    transform: scale(1.1);
  }

  .progress-animated {
    :deep(.el-progress-bar__inner) {
      background: linear-gradient(90deg, #409eff, #67c23a, #409eff);
      background-size: 200% 100%;
      animation: striped-flow 1s linear infinite;
    }
  }

  @keyframes striped-flow {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
