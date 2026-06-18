<template>
  <div class="driver-list-page">
    <div class="dashboard-section">
      <div class="dashboard-card normal-card">
        <div class="card-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.statusDistribution?.normal || 0 }}</div>
          <div class="card-label">正常账号</div>
        </div>
      </div>
      <div class="dashboard-card restricted-card">
        <div class="card-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.statusDistribution?.restricted || 0 }}</div>
          <div class="card-label">限制接单</div>
        </div>
      </div>
      <div class="dashboard-card temp-ban-card">
        <div class="card-icon">
          <el-icon><CloseBold /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.statusDistribution?.tempBan || 0 }}</div>
          <div class="card-label">临时封禁</div>
        </div>
      </div>
      <div class="dashboard-card permanent-ban-card">
        <div class="card-icon">
          <el-icon><Lock /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.statusDistribution?.permanentBan || 0 }}</div>
          <div class="card-label">永久封禁</div>
        </div>
      </div>
      <div class="dashboard-card risk-high-card">
        <div class="card-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.riskDistribution?.high || 0 }}</div>
          <div class="card-label">高风险司机</div>
        </div>
      </div>
      <div class="dashboard-card problem-card">
        <div class="card-icon">
          <el-icon><DataLine /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.problemDrivers?.lowScore || 0 }}</div>
          <div class="card-label">低评分司机</div>
        </div>
      </div>
      <div class="dashboard-card complaint-card">
        <div class="card-icon">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.problemDrivers?.highComplaint || 0 }}</div>
          <div class="card-label">高投诉司机</div>
        </div>
      </div>
      <div class="dashboard-card today-card">
        <div class="card-icon">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="card-info">
          <div class="card-value">{{ dashboard.todayChangeCount || 0 }}</div>
          <div class="card-label">今日状态变更</div>
        </div>
      </div>
    </div>

    <CommonTable
      ref="tableRef"
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :search-fields="searchFields"
      :show-selection="true"
      :row-class-name="getRowClassName"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <el-button
          type="warning"
          :disabled="selectedRows.length === 0"
          class="ripple-btn"
          @click="handleBatchTempBan"
        >
          <el-icon><WarningFilled /></el-icon>
          批量临时封禁
        </el-button>
        <el-button
          type="primary"
          :disabled="selectedRows.length === 0"
          class="ripple-btn"
          @click="handleBatchRemind"
        >
          <el-icon><Bell /></el-icon>
          批量整改提醒
        </el-button>
        <el-button
          type="success"
          :disabled="!canBatchRestore"
          class="ripple-btn"
          @click="handleBatchRestore"
        >
          <el-icon><CircleCheck /></el-icon>
          批量恢复正常
        </el-button>
      </template>

      <template #toolbar-right>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>

      <el-table-column label="司机信息" width="200">
        <template #default="{ row }">
          <div class="driver-info">
            <el-avatar
              :size="40"
              :src="row.avatar"
              :class="{ 'risk-border': row.accountRiskLevel === 3, 'medium-risk-border': row.accountRiskLevel === 2 }"
            >
              {{ row.name?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">
                {{ row.name }}
                <el-tag
                  v-if="row.abnormalStatusAlert === 1"
                  type="danger"
                  size="small"
                  effect="dark"
                  class="abnormal-tag"
                >
                  <el-icon><Warning /></el-icon>
                  异常
                </el-tag>
              </div>
              <div class="phone">{{ formatPhone(row.phone) }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="账号状态" width="140" align="center">
        <template #default="{ row }">
          <el-tooltip
            placement="right"
            :show-after="500"
            popper-class="status-history-popper"
          >
            <template #content>
              <div class="status-tooltip-content">
                <div class="tooltip-header">
                  <el-tag :type="DriverStatusTypeMap[row.status]" effect="dark">
                    {{ DriverStatusMap[row.status] }}
                  </el-tag>
                </div>
                <DriverStatusHistory v-if="hoverDriverId === row.id" :driver-id="row.id" />
              </div>
            </template>
            <span
              class="status-text"
              @mouseenter="handleStatusHover(row.id)"
              @mouseleave="hoverDriverId = null"
            >
              <el-tag :type="DriverStatusTypeMap[row.status]" effect="dark" size="small">
                {{ DriverStatusMap[row.status] }}
              </el-tag>
            </span>
          </el-tooltip>
          <div v-if="row.statusBanEndTime && row.status === 2" class="ban-time">
            至 {{ formatShortDate(row.statusBanEndTime) }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="风险等级" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="AccountRiskLevelTypeMap[row.accountRiskLevel]"
            size="small"
            effect="light"
          >
            <el-icon v-if="row.accountRiskLevel === 3"><Warning /></el-icon>
            {{ AccountRiskLevelMap[row.accountRiskLevel] }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="服务评分" width="120" align="center">
        <template #default="{ row }">
          <div class="score-display">
            <el-rate
              v-model="row.serviceScore"
              disabled
              size="small"
              :colors="['#f56c6c', '#e6a23c', '#67c23a']"
            />
            <span :class="getScoreClass(row.serviceScore)">{{ row.serviceScore?.toFixed(1) }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="违规统计" width="120" align="center">
        <template #default="{ row }">
          <div class="violation-display">
            <el-tag
              :type="row.violationCount >= 5 ? 'danger' : row.violationCount >= 3 ? 'warning' : 'success'"
              size="small"
              effect="light"
            >
              {{ row.violationCount || 0 }}次
            </el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="投诉率" width="100" align="center">
        <template #default="{ row }">
          <span
            class="complaint-rate"
            :class="{
              'text-danger': parseFloat(row.complaintRate) >= 5,
              'text-warning': parseFloat(row.complaintRate) >= 3 && parseFloat(row.complaintRate) < 5
            }"
          >
            {{ row.complaintRate || 0 }}%
          </span>
        </template>
      </el-table-column>

      <el-table-column label="流量权重" width="90" align="center">
        <template #default="{ row }">
          <el-tag type="primary" size="small" effect="plain">
            {{ row.trafficWeight || 1 }}x
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="权限状态" width="140" align="center">
        <template #default="{ row }">
          <div class="permission-display">
            <span
              class="perm-dot"
              :class="row.canAcceptOrder === 1 ? 'on' : 'off'"
              title="接单权限"
            ></span>
            <span
              class="perm-dot"
              :class="row.canWithdraw === 1 ? 'on' : 'off'"
              title="提现权限"
            ></span>
            <span
              class="perm-dot"
              :class="row.canGoOnline === 1 ? 'on' : 'off'"
              title="上线权限"
            ></span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="totalOrders" label="总订单" width="80" align="right" />

      <el-table-column prop="createTime" label="注册时间" width="160">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>

      <el-table-column label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            type="warning"
            link
            size="small"
            @click="handleChangeStatus(row)"
          >
            状态变更
          </el-button>
          <el-button
            type="info"
            link
            size="small"
            @click="handleViewHistory(row)"
          >
            变更履历
          </el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <DriverStatusDialog
      v-model="statusDialogVisible"
      :driver="currentDriver"
      @success="handleStatusSuccess"
    />

    <el-dialog v-model="historyDialogVisible" title="状态变更履历" width="600px">
      <DriverStatusHistory :driver-id="currentDriver?.id || null" />
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" :title="batchDialogTitle" width="500px">
      <div class="batch-dialog">
        <div class="batch-info">
          <el-alert type="info" :closable="false">
            已选择 <strong>{{ selectedRows.length }}</strong> 个司机
          </el-alert>
        </div>

        <div v-if="batchPreCheck" class="pre-check-info">
          <el-alert
            v-for="(msg, idx) in batchPreCheck.warningMessages"
            :key="idx"
            type="warning"
            :closable="false"
            style="margin-top: 8px"
          >
            {{ msg }}
          </el-alert>

          <div v-if="batchPreCheck.blockedDrivers.length > 0" class="blocked-list">
            <div class="blocked-title">以下账号将被跳过：</div>
            <el-tag
              v-for="item in batchPreCheck.blockedDrivers"
              :key="item.id"
              type="danger"
              size="small"
              effect="light"
              style="margin: 4px"
            >
              {{ item.name }} - {{ item.reason }}
            </el-tag>
          </div>
        </div>

        <div v-if="batchType === 'tempBan'" class="form-item">
          <label class="form-label">封禁结束时间 <span class="required">*</span></label>
          <el-date-picker
            v-model="batchBanEndTime"
            type="datetime"
            placeholder="请选择封禁结束时间"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </div>

        <div class="form-item">
          <label class="form-label">操作原因 <span class="required">*</span></label>
          <el-input
            v-model="batchReason"
            type="textarea"
            :rows="3"
            placeholder="请输入操作原因..."
            maxlength="500"
            show-word-limit
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="batchSubmitting"
          class="ripple-btn"
          @click="handleBatchSubmit"
        >
          <el-icon><Check /></el-icon>
          确认执行
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheck,
  WarningFilled,
  CloseBold,
  Lock,
  Warning,
  DataLine,
  ChatDotRound,
  Calendar,
  Refresh,
  Bell,
  Check
} from '@element-plus/icons-vue'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import DriverStatusDialog from '@/components/DriverStatusDialog/index.vue'
import DriverStatusHistory from '@/components/DriverStatusHistory/index.vue'
import {
  getDriverListApi,
  getStatusDashboardApi,
  batchTempBanApi,
  batchRemindRectificationApi,
  batchRestoreNormalApi,
  preCheckBatchOperationApi
} from '@/api/driver'
import {
  DriverStatusMap,
  DriverStatusColorMap,
  DriverStatusTypeMap,
  AccountRiskLevelMap,
  AccountRiskLevelColorMap,
  AccountRiskLevelTypeMap,
  DriverStatus
} from '@/enums/driver'
import { formatDate, formatPhone, formatIdCard } from '@/utils/format'
import type {
  Driver,
  StatusDashboard,
  BatchPreCheckResult
} from '@/types/driver'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<Driver[]>([])
const total = ref(0)
const selectedRows = ref<Driver[]>([])
const hoverDriverId = ref<number | null>(null)
const dashboard = ref<StatusDashboard>({
  statusDistribution: { normal: 0, restricted: 0, tempBan: 0, permanentBan: 0 },
  riskDistribution: { low: 0, medium: 0, high: 0 },
  problemDrivers: { lowScore: 0, highComplaint: 0, highViolation: 0 },
  todayChangeCount: 0,
  total: 0
})

const statusDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const currentDriver = ref<Driver | null>(null)

const batchDialogVisible = ref(false)
const batchType = ref<'tempBan' | 'remind' | 'restore'>('tempBan')
const batchReason = ref('')
const batchBanEndTime = ref('')
const batchSubmitting = ref(false)
const batchPreCheck = ref<BatchPreCheckResult | null>(null)

const batchDialogTitle = computed(() => {
  const titles: Record<string, string> = {
    tempBan: '批量临时封禁',
    remind: '批量整改提醒',
    restore: '批量恢复正常'
  }
  return titles[batchType.value]
})

const canBatchRestore = computed(() => {
  if (selectedRows.value.length === 0) return false
  const hasPermanentBan = selectedRows.value.some(r => r.status === DriverStatus.PERMANENT_BAN)
  return !hasPermanentBan
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  phone: '',
  status: undefined as number | undefined,
  auditStatus: undefined as number | undefined,
  accountRiskLevel: undefined as number | undefined,
  minServiceScore: undefined as number | undefined,
  minComplaintRate: undefined as number | undefined,
  minViolationCount: undefined as number | undefined
})

const searchFields = [
  { prop: 'name', label: '司机姓名', type: 'input' },
  { prop: 'phone', label: '手机号码', type: 'input' },
  { prop: 'status', label: '账号状态', type: 'select', options: [
    { value: 0, label: '正常' },
    { value: 1, label: '限制接单' },
    { value: 2, label: '临时封禁' },
    { value: 3, label: '永久封禁' }
  ]},
  { prop: 'accountRiskLevel', label: '风险等级', type: 'select', options: [
    { value: 1, label: '低风险' },
    { value: 2, label: '中风险' },
    { value: 3, label: '高风险' }
  ]},
  { prop: 'minServiceScore', label: '最低评分', type: 'input', placeholder: '如：3.5' },
  { prop: 'minComplaintRate', label: '最低投诉率(%)', type: 'input', placeholder: '如：3' },
  { prop: 'minViolationCount', label: '最低违规次数', type: 'input', placeholder: '如：3' }
]

const getRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 1 ? 'row-striped' : ''
}

const getScoreClass = (score: number) => {
  const s = parseFloat(score as any) || 0
  if (s < 3.5) return 'text-danger'
  if (s < 4.0) return 'text-warning'
  return 'text-success'
}

const formatShortDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now()
}

const loadDashboard = async () => {
  try {
    const res = await getStatusDashboardApi()
    dashboard.value = res.data
  } catch (error) {
    // ignore
  }
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getDriverListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取司机列表失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  getList()
  loadDashboard()
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  queryParams.page = 1
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.name = ''
  queryParams.phone = ''
  queryParams.status = undefined
  queryParams.auditStatus = undefined
  queryParams.accountRiskLevel = undefined
  queryParams.minServiceScore = undefined
  queryParams.minComplaintRate = undefined
  queryParams.minViolationCount = undefined
  getList()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

const handleSelectionChange = (rows: Driver[]) => {
  selectedRows.value = rows
}

const handleStatusHover = (id: number) => {
  hoverDriverId.value = id
}

const handleView = (row: Driver) => {
  ElMessage.info('司机详情功能开发中')
}

const handleChangeStatus = (row: Driver) => {
  currentDriver.value = row
  statusDialogVisible.value = true
}

const handleViewHistory = (row: Driver) => {
  currentDriver.value = row
  historyDialogVisible.value = true
}

const handleStatusSuccess = () => {
  getList()
  loadDashboard()
}

const handleBatchTempBan = async () => {
  batchType.value = 'tempBan'
  batchReason.value = ''
  batchBanEndTime.value = ''
  batchPreCheck.value = null

  try {
    const res = await preCheckBatchOperationApi(selectedRows.value.map(r => r.id), 2)
    batchPreCheck.value = res.data
  } catch (error) {}

  batchDialogVisible.value = true
}

const handleBatchRemind = async () => {
  batchType.value = 'remind'
  batchReason.value = ''
  batchBanEndTime.value = ''
  batchPreCheck.value = null
  batchDialogVisible.value = true
}

const handleBatchRestore = async () => {
  if (!canBatchRestore.value) {
    ElMessage.warning('包含永久封禁账号，禁止批量恢复')
    return
  }
  batchType.value = 'restore'
  batchReason.value = ''
  batchBanEndTime.value = ''
  batchPreCheck.value = null

  try {
    const res = await preCheckBatchOperationApi(selectedRows.value.map(r => r.id), 0)
    batchPreCheck.value = res.data
  } catch (error) {}

  batchDialogVisible.value = true
}

const handleBatchSubmit = async () => {
  if (!batchReason.value.trim()) {
    ElMessage.warning('请输入操作原因')
    return
  }
  if (batchType.value === 'tempBan' && !batchBanEndTime.value) {
    ElMessage.warning('请选择封禁结束时间')
    return
  }

  batchSubmitting.value = true
  try {
    const ids = selectedRows.value
      .filter(r => !batchPreCheck.value?.blockedDrivers?.find(b => b.id === r.id))
      .map(r => r.id)

    if (ids.length === 0) {
      ElMessage.warning('没有可执行操作的账号')
      return
    }

    let res
    if (batchType.value === 'tempBan') {
      res = await batchTempBanApi(ids, batchReason.value, batchBanEndTime.value)
    } else if (batchType.value === 'remind') {
      res = await batchRemindRectificationApi(ids)
    } else {
      res = await batchRestoreNormalApi(ids, batchReason.value)
    }

    ElMessage.success(`操作完成：成功${res.data.successCount}个，失败${res.data.failCount}个`)
    batchDialogVisible.value = false
    getList()
    loadDashboard()
  } catch (error: any) {
    ElMessage.error(error.message || '批量操作失败')
  } finally {
    batchSubmitting.value = false
  }
}

onMounted(() => {
  getList()
  loadDashboard()
})
</script>

<style lang="scss" scoped>
.driver-list-page {
  :deep(.row-striped) {
    --el-table-tr-bg-color: #fafafa;
  }

  .dashboard-section {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 12px;
    margin-bottom: 16px;

    .dashboard-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .card-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 22px;
      }

      &.normal-card .card-icon {
        background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
      }
      &.restricted-card .card-icon {
        background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
      }
      &.temp-ban-card .card-icon {
        background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
      }
      &.permanent-ban-card .card-icon {
        background: linear-gradient(135deg, #909399 0%, #a6a9ad 100%);
      }
      &.risk-high-card .card-icon {
        background: linear-gradient(135deg, #f56c6c 0%, #ff9e9e 100%);
      }
      &.problem-card .card-icon {
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      }
      &.complaint-card .card-icon {
        background: linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%);
      }
      &.today-card .card-icon {
        background: linear-gradient(135deg, #409eff 0%, #36cfc9 100%);
      }

      .card-info {
        .card-value {
          font-size: 22px;
          font-weight: 700;
          color: #303133;
          line-height: 1.2;
        }
        .card-label {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }
  }

  .driver-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .info {
      .name {
        font-weight: 500;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 4px;

        .abnormal-tag {
          animation: blink 1.5s infinite;
        }
      }

      .phone {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }

    :deep(.el-avatar) {
      &.risk-border {
        border: 2px solid #f56c6c;
        animation: pulse 2s infinite;
      }
      &.medium-risk-border {
        border: 2px solid #e6a23c;
      }
    }
  }

  .status-text {
    cursor: help;
  }

  .ban-time {
    font-size: 11px;
    color: #909399;
    margin-top: 4px;
  }

  .score-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    span {
      font-size: 13px;
      font-weight: 600;
    }
    .text-danger { color: #f56c6c; }
    .text-warning { color: #e6a23c; }
    .text-success { color: #67c23a; }
  }

  .complaint-rate {
    font-weight: 600;
    font-size: 14px;
    &.text-danger { color: #f56c6c; }
    &.text-warning { color: #e6a23c; }
  }

  .permission-display {
    display: flex;
    justify-content: center;
    gap: 8px;

    .perm-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid #dcdfe6;

      &.on {
        background: #67c23a;
        border-color: #67c23a;
      }
      &.off {
        background: #f56c6c;
        border-color: #f56c6c;
      }
    }
  }

  .batch-dialog {
    .batch-info {
      margin-bottom: 16px;
    }

    .blocked-list {
      margin-top: 10px;

      .blocked-title {
        font-size: 13px;
        color: #606266;
        margin-bottom: 6px;
      }
    }

    .form-item {
      margin-bottom: 16px;

      .form-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;

        .required {
          color: #f56c6c;
          margin-left: 4px;
        }
      }
    }
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.5);
      transform: translate(-50%, -50%);
      transition: width 0.4s, height 0.4s;
      pointer-events: none;
    }

    &:active::after {
      width: 300px;
      height: 300px;
    }
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4); }
    70% { box-shadow: 0 0 0 8px rgba(245, 108, 108, 0); }
    100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0); }
  }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
}

:deep(.status-history-popper) {
  max-width: 420px !important;
  width: 420px !important;

  .status-tooltip-content {
    .tooltip-header {
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ebeef5;
    }
  }
}
</style>
