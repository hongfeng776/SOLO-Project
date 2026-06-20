<template>
  <div class="fulfillment-page">
    <div class="page-header">
      <h2>
        <el-icon><Plane /></el-icon>
        机票订单履约管控
      </h2>
      <div>
        <el-button :icon="Refresh" @click="loadStats">刷新数据</el-button>
        <el-button type="danger" :icon="Warning" @click="checkTimeout">检测出票超时</el-button>
      </div>
    </div>

    <div class="stats-row">
      <el-card shadow="hover" v-for="stat in statsCards" :key="stat.key" class="stat-card" @click="handleStatClick(stat)">
        <div class="stat-content" :style="{ '--stat-color': stat.color }">
          <div class="stat-icon">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </div>
      </el-card>
    </div>

    <el-tabs v-model="activeStage" class="stage-tabs" @tab-change="handleStageChange">
      <el-tab-pane v-for="stage in stageOptions" :key="stage.value" :label="stage.label" :name="stage.value" />
    </el-tabs>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable class="input-glow-focus" />
        </el-form-item>
        <el-form-item label="航班号">
          <el-input v-model="searchForm.flightNo" placeholder="请输入航班号" clearable class="input-glow-focus" />
        </el-form-item>
        <el-form-item label="履约状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable class="input-glow-focus">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否国际">
          <el-select v-model="searchForm.isInternational" placeholder="全部" clearable class="input-glow-focus">
            <el-option label="国内机票" :value="false" />
            <el-option label="国际机票" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常标记">
          <el-select v-model="searchForm.isAbnormal" placeholder="全部" clearable class="input-glow-focus">
            <el-option label="正常履约" :value="false" />
            <el-option label="异常履约" :value="true" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="input-glow-focus"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="fulfillment-toolbar">
      <div class="toolbar-left">
        <span v-if="selectedRows.length > 0" class="selected-tip">
          已选中 <strong>{{ selectedRows.length }}</strong> 条记录
          <span v-if="internationalCount > 0" class="warn-tip">
            （含 {{ internationalCount }} 条国际机票，不支持批量处理）
          </span>
        </span>
      </div>
      <div class="toolbar-right">
        <el-button
          type="primary"
          :icon="Tickets"
          :disabled="canBatchIssue"
          @click="openBatchDialog('issue')"
        >
          批量出票
        </el-button>
        <el-button
          type="warning"
          :icon="RefreshRight"
          :disabled="canBatchHandleChange"
          @click="openBatchDialog('change')"
        >
          批量处理航班变动
        </el-button>
        <el-button
          type="danger"
          :icon="Warning"
          :disabled="canBatchMarkAbnormal"
          @click="openBatchDialog('abnormal')"
        >
          批量标记异常
        </el-button>
      </div>
    </div>

    <el-table
      ref="tableRef"
      :data="pagedData"
      v-loading="loading"
      border
      class="fulfillment-table"
      @selection-change="handleSelectionChange"
      :row-class-name="tableRowClassName"
    >
      <el-table-column type="selection" width="55" :selectable="isRowSelectable" />
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="orderNo" label="订单号" min-width="160">
        <template #default="{ row }">
          <span class="order-no-cell">{{ row.orderNo }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="flightNo" label="航班号" width="110">
        <template #default="{ row }">
          <span class="flight-no-cell">{{ row.flightNo }}</span>
          <el-tag v-if="row.isInternational" type="danger" size="small" style="margin-left: 4px;">国际</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="履约阶段" width="110">
        <template #default="{ row }">
          <el-tag :type="getStageType(row.fulfillmentStage)" class="stage-tag" :class="getStageClass(row.fulfillmentStage)">
            {{ getEnumLabel(FulfillmentStageEnum, row.fulfillmentStage) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="履约状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.fulfillmentStatus)">
            {{ getEnumLabel(FulfillmentStatusEnum, row.fulfillmentStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="passengerCount" label="乘客数" width="80" align="center" />
      <el-table-column label="证件状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.idValidStatus === IdValidStatusEnum.EXPIRED.value" type="danger" size="small">已过期</el-tag>
          <el-tag v-else-if="row.idValidStatus === IdValidStatusEnum.EXPIRING.value" type="warning" size="small">即将过期</el-tag>
          <el-tag v-else type="success" size="small">有效</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="pnrCode" label="PNR编码" width="110">
        <template #default="{ row }">
          <span v-if="row.pnrCode" style="font-family: monospace;">{{ row.pnrCode }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="票号数量" width="90" align="center">
        <template #default="{ row }">
          <span v-if="row.ticketNumbers && row.ticketNumbers.length">{{ row.ticketNumbers.length }}/{{ row.passengerCount }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="凭证状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.ticketVoucherStatus" :type="getVoucherType(row.ticketVoucherStatus)" size="small">
            {{ getEnumLabel(TicketVoucherStatusEnum, row.ticketVoucherStatus) }}
          </el-tag>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="异常标记" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isAbnormal" type="danger" size="small" effect="dark">
            <el-icon><WarningFilled /></el-icon>
            {{ getEnumLabel(FulfillmentAbnormalTypeEnum, row.abnormalType) }}
          </el-tag>
          <el-tag v-else type="success" size="small">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" :icon="Edit" @click="openEditDialog(row)">
            履约处理
          </el-button>
          <el-button type="info" link size="small" :icon="Document" @click="openLogPanel(row)">
            履约溯源
          </el-button>
          <el-button
            v-if="row.fulfillmentStage === FulfillmentStageEnum.PENDING_TICKET.value && row.fulfillmentStatus === FulfillmentStatusEnum.PENDING.value"
            type="success"
            link
            size="small"
            :icon="Check"
            @click="handleQuickAudit(row)"
          >
            审核通过
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <FlightFulfillmentEditDialog
      v-model:visible="editDialogVisible"
      :fulfillment-id="currentFulfillmentId"
      @success="handleFulfillmentSuccess"
    />

    <FlightFulfillmentBatchDialog
      v-model:visible="batchDialogVisible"
      :operation-type="batchOperationType"
      :selected-ids="batchableIds"
      :selected-rows="batchableRows"
      @success="handleBatchSuccess"
    />

    <FlightFulfillmentLogPanel
      v-model:visible="logPanelVisible"
      :fulfillment-id="currentFulfillmentId"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Warning, Plane, Tickets, RefreshRight, Edit, Document, Check, WarningFilled
} from '@element-plus/icons-vue'
import {
  FulfillmentStageEnum,
  FulfillmentStatusEnum,
  FulfillmentAbnormalTypeEnum,
  FulfillmentBatchOperationEnum,
  TicketVoucherStatusEnum,
  IdValidStatusEnum
} from '@/utils/enums'
import { getEnumLabel } from '@/utils/enumHelper'
import {
  getFlightFulfillmentList,
  getFlightFulfillmentStats,
  checkFlightFulfillmentTicketTimeout,
  auditFlightFulfillment
} from '@/api/flight'
import FlightFulfillmentEditDialog from './FlightFulfillmentEditDialog.vue'
import FlightFulfillmentBatchDialog from './FlightFulfillmentBatchDialog.vue'
import FlightFulfillmentLogPanel from './FlightFulfillmentLogPanel.vue'

const emit = defineEmits(['row-selection-change'])

const loading = ref(false)
const activeStage = ref('')
const tableRef = ref(null)

const searchForm = reactive({
  orderNo: '',
  flightNo: '',
  status: '',
  isInternational: null,
  isAbnormal: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const fulfillmentList = ref([])
const selectedRows = ref([])
const statsData = ref({
  totalCount: 0,
  pendingCount: 0,
  ticketedCount: 0,
  changeCount: 0,
  abnormalCount: 0
})

const editDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const logPanelVisible = ref(false)
const currentFulfillmentId = ref(null)
const batchOperationType = ref(FulfillmentBatchOperationEnum.ISSUE.value)

const stageOptions = computed(() => [
  { value: '', label: '全部阶段' },
  { value: FulfillmentStageEnum.PENDING_TICKET.value, label: FulfillmentStageEnum.PENDING_TICKET.label },
  { value: FulfillmentStageEnum.TICKETED.value, label: FulfillmentStageEnum.TICKETED.label },
  { value: FulfillmentStageEnum.FLIGHT_CHANGED.value, label: FulfillmentStageEnum.FLIGHT_CHANGED.label },
  { value: FulfillmentStageEnum.TERMINATED.value, label: FulfillmentStageEnum.TERMINATED.label }
])

const statusOptions = computed(() => Object.values(FulfillmentStatusEnum).map(item => ({
  value: item.value,
  label: item.label
})))

const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return fulfillmentList.value.slice(start, end)
})

const statsCards = computed(() => [
  { key: 'total', label: '履约总数', value: statsData.value.totalCount, color: '#1890ff', icon: 'Document' },
  { key: 'pending', label: '待出票', value: statsData.value.pendingCount, color: '#1890ff', icon: 'Tickets' },
  { key: 'ticketed', label: '已出票', value: statsData.value.ticketedCount, color: '#52c41a', icon: 'Check' },
  { key: 'change', label: '航班变动', value: statsData.value.changeCount, color: '#faad14', icon: 'RefreshRight' },
  { key: 'abnormal', label: '异常履约', value: statsData.value.abnormalCount, color: '#ff4d4f', icon: 'Warning' }
])

const internationalCount = computed(() =>
  selectedRows.value.filter(r => r.isInternational).length
)

const batchableIds = computed(() =>
  selectedRows.value.filter(r => !r.isInternational).map(r => r.id)
)

const batchableRows = computed(() =>
  selectedRows.value.filter(r => !r.isInternational)
)

const canBatchIssue = computed(() => {
  const rows = batchableRows.value.filter(
    r => r.fulfillmentStage === FulfillmentStageEnum.PENDING_TICKET.value &&
         r.fulfillmentStatus === FulfillmentStatusEnum.PENDING.value
  )
  return rows.length === 0
})

const canBatchHandleChange = computed(() => {
  const rows = batchableRows.value.filter(
    r => r.fulfillmentStage === FulfillmentStageEnum.FLIGHT_CHANGED.value
  )
  return rows.length === 0
})

const canBatchMarkAbnormal = computed(() => {
  const rows = batchableRows.value.filter(r => !r.isAbnormal)
  return rows.length === 0
})

function getStageType(stage) {
  const map = {
    [FulfillmentStageEnum.PENDING_TICKET.value]: '',
    [FulfillmentStageEnum.TICKETED.value]: 'success',
    [FulfillmentStageEnum.FLIGHT_CHANGED.value]: 'warning',
    [FulfillmentStageEnum.TERMINATED.value]: 'danger'
  }
  return map[stage] || ''
}

function getStageClass(stage) {
  const map = {
    [FulfillmentStageEnum.PENDING_TICKET.value]: 'pending',
    [FulfillmentStageEnum.TICKETED.value]: 'ticketed',
    [FulfillmentStageEnum.FLIGHT_CHANGED.value]: 'changed',
    [FulfillmentStageEnum.TERMINATED.value]: 'terminated'
  }
  return map[stage] || ''
}

function getStatusType(status) {
  const map = {
    [FulfillmentStatusEnum.PENDING.value]: 'info',
    [FulfillmentStatusEnum.PROCESSING.value]: 'warning',
    [FulfillmentStatusEnum.COMPLETED.value]: 'success',
    [FulfillmentStatusEnum.ABNORMAL.value]: 'danger',
    [FulfillmentStatusEnum.TERMINATED.value]: 'danger'
  }
  return map[status] || ''
}

function getVoucherType(status) {
  const map = {
    [TicketVoucherStatusEnum.PENDING.value]: 'info',
    [TicketVoucherStatusEnum.GENERATED.value]: 'warning',
    [TicketVoucherStatusEnum.SENT.value]: 'success',
    [TicketVoucherStatusEnum.INVALID.value]: 'danger'
  }
  return map[status] || ''
}

function isRowSelectable(row) {
  return !row.isInternational
}

function tableRowClassName({ row, rowIndex }) {
  const isSelected = selectedRows.value.some(r => r.id === row.id)
  let className = rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
  if (isSelected) className += ' row-highlight'
  return className
}

async function loadList() {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      fulfillmentStage: activeStage.value || undefined
    }
    const res = await getFlightFulfillmentList(params)
    if (res.data?.success) {
      fulfillmentList.value = res.data.data?.list || []
      pagination.total = fulfillmentList.value.length
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const res = await getFlightFulfillmentStats()
    if (res.data?.success) {
      statsData.value = res.data.data || statsData.value
    }
  } catch (e) {
    console.error(e)
  }
}

async function checkTimeout() {
  try {
    const res = await checkFlightFulfillmentTicketTimeout()
    if (res.data?.success) {
      const data = res.data.data || {}
      ElMessage.success(`检测完成，发现 ${data.timeoutCount || 0} 条出票超时订单`)
      loadList()
      loadStats()
    }
  } catch (e) {
    console.error(e)
  }
}

function handleSearch() {
  pagination.page = 1
  loadList()
}

function handleReset() {
  Object.assign(searchForm, {
    orderNo: '',
    flightNo: '',
    status: '',
    isInternational: null,
    isAbnormal: null,
    dateRange: []
  })
  activeStage.value = ''
  pagination.page = 1
  loadList()
}

function handleStageChange() {
  pagination.page = 1
  loadList()
}

function handlePageChange() {
  // handled by computed
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
  emit('row-selection-change', rows)
}

function handleStatClick(stat) {
  if (stat.key === 'pending') activeStage.value = FulfillmentStageEnum.PENDING_TICKET.value
  else if (stat.key === 'ticketed') activeStage.value = FulfillmentStageEnum.TICKETED.value
  else if (stat.key === 'change') activeStage.value = FulfillmentStageEnum.FLIGHT_CHANGED.value
  else if (stat.key === 'abnormal') searchForm.isAbnormal = true
  loadList()
}

function openEditDialog(row) {
  currentFulfillmentId.value = row.id
  editDialogVisible.value = true
}

function openLogPanel(row) {
  currentFulfillmentId.value = row.id
  logPanelVisible.value = true
}

function openBatchDialog(type) {
  batchOperationType.value = type
  batchDialogVisible.value = true
}

async function handleQuickAudit(row) {
  try {
    await ElMessageBox.confirm(
      `确定审核通过订单 ${row.orderNo} 的履约申请吗？`,
      '审核确认',
      { type: 'warning' }
    )
    const res = await auditFlightFulfillment(row.id, { pass: true, remark: '快速审核通过' })
    if (res.data?.success) {
      ElMessage.success('审核通过成功')
      handleFulfillmentSuccess()
    }
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

function handleFulfillmentSuccess() {
  editDialogVisible.value = false
  loadList()
  loadStats()
}

function handleBatchSuccess() {
  batchDialogVisible.value = false
  tableRef.value?.clearSelection()
  loadList()
  loadStats()
}

onMounted(() => {
  loadList()
  loadStats()
})
</script>

<style lang="scss" scoped>
@import '@/styles/order.scss';

.text-muted {
  color: #909399;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;

  .stat-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--stat-color);
    color: #fff;
    border-radius: 12px;
    font-size: 28px;
    opacity: 0.9;
  }

  .stat-info {
    .stat-label {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: var(--stat-color);
    }
  }
}

.selected-tip {
  font-size: 14px;
  color: #303133;

  strong {
    color: #1890ff;
    font-size: 16px;
  }

  .warn-tip {
    color: #faad14;
    margin-left: 8px;
  }
}
</style>
