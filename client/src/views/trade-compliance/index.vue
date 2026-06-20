<template>
  <div class="trade-compliance-page">
    <div class="page-header">
      <h2 class="page-title">交易合规审核</h2>
      <div class="toolbar">
        <el-button type="warning" @click="handleMarkTimeout">
          <el-icon><Bell /></el-icon>
          刷新超时提醒
        </el-button>
        <el-button
          v-if="hasPerm('compliance:audit:batch')"
          type="primary"
          :disabled="selectedRows.length === 0"
          @click="handleBatchAudit"
        >
          <el-icon><Select /></el-icon>
          批量审核 ({{ selectedRows.length }})
        </el-button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card" :class="{ active: activeStatusFilter === '' }" @click="activeStatusFilter = ''; fetchData()">
        <div class="stat-value">{{ stats.totalPending || 0 }}</div>
        <div class="stat-label">待审核</div>
      </div>
      <div class="stat-card stat-card--auto" :class="{ active: activeStatusFilter === 'auto_approved' }" @click="activeStatusFilter = 'auto_approved'; fetchData()">
        <div class="stat-value">{{ stats.totalAutoApproved || 0 }}</div>
        <div class="stat-label">自动通过</div>
      </div>
      <div class="stat-card stat-card--manual" :class="{ active: activeStatusFilter === 'manual_pending' }" @click="activeStatusFilter = 'manual_pending'; fetchData()">
        <div class="stat-value">{{ stats.totalManualPending || 0 }}</div>
        <div class="stat-label">待人工审核</div>
      </div>
      <div class="stat-card stat-card--approved" :class="{ active: activeStatusFilter === 'approved' }" @click="activeStatusFilter = 'approved'; fetchData()">
        <div class="stat-value">{{ stats.totalApproved || 0 }}</div>
        <div class="stat-label">已通过</div>
      </div>
      <div class="stat-card stat-card--rejected" :class="{ active: activeStatusFilter === 'returned' }" @click="activeStatusFilter = 'returned'; fetchData()">
        <div class="stat-value">{{ stats.totalRejected || 0 }}</div>
        <div class="stat-label">已驳回</div>
      </div>
      <div class="stat-card stat-card--timeout" :class="{ active: activeStatusFilter === 'timeout' }" @click="activeStatusFilter = 'timeout'; fetchData()">
        <div class="stat-value">{{ stats.timeoutCount || 0 }}</div>
        <div class="stat-label">超时未审</div>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :selection="true"
      :show-index="true"
      :row-class-name="getRowClassName"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #complianceStatus="{ row }">
        <div class="status-cell" :class="{ 'timeout-pulse': row.timeoutFlag }">
          <el-tag :type="getComplianceStatusTagType(row.complianceStatus)" effect="light" size="small">
            {{ getComplianceStatusLabel(row.complianceStatus) }}
          </el-tag>
          <el-tag v-if="row.timeoutFlag" type="danger" effect="dark" size="small" class="timeout-tag">
            超时
          </el-tag>
        </div>
      </template>

      <template #riskCategory="{ row }">
        <span
          class="risk-badge"
          :style="{ backgroundColor: getRiskCategoryBgColor(row.riskCategory), color: getRiskCategoryColor(row.riskCategory) }"
        >
          {{ getRiskCategoryLabel(row.riskCategory) }}
        </span>
      </template>

      <template #tradeAmount="{ row }">
        <span class="amount-cell" :class="{ 'amount-large': row.tradeAmount >= 500000 }">
          {{ formatMoney(row.tradeAmount) }}
        </span>
      </template>

      <template #reviewType="{ row }">
        <span :class="row.reviewType === 'auto' ? 'review-auto' : 'review-manual'">
          {{ row.reviewType === 'auto' ? '自动' : '人工' }}
        </span>
      </template>

      <template #violationTypes="{ row }">
        <div v-if="row.violationTypes && row.violationTypes.length > 0" class="violation-tags">
          <el-tag
            v-for="vt in row.violationTypes.slice(0, 2)"
            :key="vt"
            size="small"
            type="danger"
            effect="plain"
          >
            {{ getViolationTypeLabel(vt) }}
          </el-tag>
          <el-tag v-if="row.violationTypes.length > 2" size="small" type="info" effect="plain">
            +{{ row.violationTypes.length - 2 }}
          </el-tag>
        </div>
        <span v-else class="text-muted">-</span>
      </template>

      <template #action="{ row }">
        <el-button
          v-if="hasPerm('compliance:audit:approve') && canReview(row)"
          type="success"
          link
          class="action-btn action-btn--approve"
          @click="handleApprove(row)"
        >
          通过
        </el-button>
        <el-button
          v-if="hasPerm('compliance:audit:reject') && canReview(row)"
          type="danger"
          link
          class="action-btn action-btn--reject"
          @click="handleReject(row)"
        >
          驳回
        </el-button>
        <el-tooltip content="查看审核溯源" placement="top">
          <el-button type="primary" link class="action-btn action-btn--trail" @click="handleViewTrail(row)">
            <el-icon><Document /></el-icon>
          </el-button>
        </el-tooltip>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="approveDialog.visible"
      :title="approveDialog.title"
      width="560px"
      :loading="approveDialog.loading"
      @confirm="handleApproveConfirm"
    >
      <div v-if="preCheckResult" class="precheck-result">
        <div v-if="preCheckResult.warnings.length > 0" class="precheck-warnings">
          <div v-for="(w, idx) in preCheckResult.warnings" :key="idx" class="warning-item">
            <el-icon color="#E6A23C"><WarningFilled /></el-icon>
            <span>{{ w }}</span>
          </div>
        </div>
        <div v-if="preCheckResult.timeRemainingMinutes !== undefined" class="time-remaining">
          <el-icon><Clock /></el-icon>
          <span>审核时效剩余: {{ preCheckResult.timeRemainingMinutes }} 分钟</span>
        </div>
      </div>
      <el-form :model="approveForm" label-width="100px" class="audit-form">
        <el-form-item label="审核意见" required>
          <el-input
            v-model="approveForm.opinion"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
            class="focus-highlight-input"
          />
        </el-form-item>
      </el-form>
    </FinDialog>

    <FinDialog
      v-model:visible="rejectDialog.visible"
      :title="rejectDialog.title"
      width="620px"
      :loading="rejectDialog.loading"
      @confirm="handleRejectConfirm"
    >
      <div v-if="preCheckResult" class="precheck-result">
        <div v-if="preCheckResult.warnings.length > 0" class="precheck-warnings">
          <div v-for="(w, idx) in preCheckResult.warnings" :key="idx" class="warning-item">
            <el-icon color="#E6A23C"><WarningFilled /></el-icon>
            <span>{{ w }}</span>
          </div>
        </div>
      </div>
      <el-form :model="rejectForm" label-width="100px" class="audit-form">
        <el-form-item label="违规类型" required>
          <el-select
            v-model="rejectForm.violationTypes"
            multiple
            placeholder="请选择违规类型"
            class="focus-highlight-input full-width"
          >
            <el-option
              v-for="item in violationTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="违规原因" required>
          <el-input
            v-model="rejectForm.violationReason"
            type="textarea"
            :rows="3"
            placeholder="请标注具体违规原因，退回修正"
            class="focus-highlight-input"
          />
        </el-form-item>
        <el-form-item label="审核意见" required>
          <el-input
            v-model="rejectForm.opinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
            class="focus-highlight-input"
          />
        </el-form-item>
      </el-form>
    </FinDialog>

    <BatchAuditDialog
      v-model:visible="batchDialog.visible"
      :selected-rows="selectedRows"
      @confirm="handleBatchConfirm"
    />

    <AuditTrailDialog
      v-model:visible="trailDialog.visible"
      :audit-id="trailDialog.auditId"
      :audit-no="trailDialog.auditNo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Select, Document, WarningFilled, Clock } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatDate, formatMoney } from '@/utils/format'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'
import {
  TRADE_COMPLIANCE_STATUS_LABELS,
  TRADE_COMPLIANCE_STATUS_TAG_TYPES,
  TRADE_RISK_CATEGORY_LABELS,
  TRADE_RISK_CATEGORY_COLORS,
  TRADE_RISK_CATEGORY_BG_COLORS,
  VIOLATION_TYPE_LABELS,
  TRADE_REVIEW_TYPE_LABELS,
} from '@/constants/dictionaries'
import {
  TradeComplianceStatus,
  TradeRiskCategory,
  ViolationType,
} from '@/enums'
import {
  getTradeComplianceList,
  getTradeComplianceStats,
  preCheckTradeCompliance,
  approveTradeCompliance,
  rejectTradeCompliance,
  markTimeoutTradeCompliance,
} from '@/api/tradeCompliance'
import type { ITradeComplianceAudit, ITradeCompliancePreCheckResult, ITradeComplianceStats } from '@/types/api'
import type { IFilterConfig, ITableColumn } from '@/types/components'
import BatchAuditDialog from './BatchAuditDialog.vue'
import AuditTrailDialog from './AuditTrailDialog.vue'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<ITradeComplianceAudit[]>([])
const selectedRows = ref<ITradeComplianceAudit[]>([])
const activeStatusFilter = ref('')
const stats = ref<ITradeComplianceStats>({} as ITradeComplianceStats)
const preCheckResult = ref<ITradeCompliancePreCheckResult | null>(null)

let pollingTimer: ReturnType<typeof setInterval> | null = null

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES,
})

const searchParams = reactive<Record<string, any>>({})

const violationTypeOptions = Object.entries(VIOLATION_TYPE_LABELS).map(([value, label]) => ({ value, label }))

const filterConfig: IFilterConfig[] = [
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '审核编号/交易编号/客户/股票',
  },
  {
    prop: 'riskCategory',
    label: '风险分类',
    type: 'select',
    options: Object.entries(TRADE_RISK_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'reviewType',
    label: '审核方式',
    type: 'select',
    options: Object.entries(TRADE_REVIEW_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'tradeType',
    label: '交易类型',
    type: 'select',
    options: [{ value: 'buy', label: '买入' }, { value: 'sell', label: '卖出' }],
  },
  {
    prop: 'violationType',
    label: '违规类型',
    type: 'select',
    options: violationTypeOptions,
    advanced: true,
  },
  {
    prop: 'amountRange',
    label: '金额范围',
    type: 'numberrange',
    min: 0,
    advanced: true,
  },
  {
    prop: 'dateRange',
    label: '日期范围',
    type: 'daterange',
    advanced: true,
  },
]

const tableColumns: ITableColumn[] = [
  { prop: 'auditNo', label: '审核编号', minWidth: 140, fixed: 'left' },
  { prop: 'tradeNo', label: '交易编号', minWidth: 130 },
  { prop: 'customerName', label: '客户名称', width: 100 },
  { prop: 'stockCode', label: '股票代码', width: 100 },
  { prop: 'tradeType', label: '方向', width: 60, align: 'center' },
  { prop: 'tradeAmount', label: '交易金额', width: 120, slot: 'tradeAmount', type: 'money' },
  { prop: 'complianceStatus', label: '合规状态', width: 130, slot: 'complianceStatus' },
  { prop: 'riskCategory', label: '风险分类', width: 100, slot: 'riskCategory' },
  { prop: 'reviewType', label: '审核方式', width: 80, slot: 'reviewType', align: 'center' },
  { prop: 'violationTypes', label: '违规类型', minWidth: 140, slot: 'violationTypes' },
  { prop: 'reviewerName', label: '审核人', width: 90 },
  { prop: 'reviewAt', label: '审核时间', width: 170, type: 'datetime' },
  { prop: 'action', label: '操作', width: 150, fixed: 'right', slot: 'action' },
]

const approveDialog = reactive({
  visible: false,
  title: '',
  loading: false,
  id: 0,
})

const rejectDialog = reactive({
  visible: false,
  title: '',
  loading: false,
  id: 0,
})

const approveForm = reactive({ opinion: '' })
const rejectForm = reactive({
  violationTypes: [] as string[],
  violationReason: '',
  opinion: '',
})

const batchDialog = reactive({ visible: false })
const trailDialog = reactive({ visible: false, auditId: 0, auditNo: '' })

function getComplianceStatusLabel(status: string): string {
  return TRADE_COMPLIANCE_STATUS_LABELS[status as TradeComplianceStatus] || status
}

function getComplianceStatusTagType(status: string): string {
  return TRADE_COMPLIANCE_STATUS_TAG_TYPES[status as TradeComplianceStatus] || 'info'
}

function getRiskCategoryLabel(category: string): string {
  return TRADE_RISK_CATEGORY_LABELS[category as TradeRiskCategory] || category
}

function getRiskCategoryColor(category: string): string {
  return TRADE_RISK_CATEGORY_COLORS[category as TradeRiskCategory] || '#909399'
}

function getRiskCategoryBgColor(category: string): string {
  return TRADE_RISK_CATEGORY_BG_COLORS[category as TradeRiskCategory] || 'rgba(144,147,153,0.1)'
}

function getViolationTypeLabel(type: string): string {
  return VIOLATION_TYPE_LABELS[type as ViolationType] || type
}

function canReview(row: ITradeComplianceAudit): boolean {
  return ['pending', 'manual_pending'].includes(row.complianceStatus) && !['dealed', 'cancelled'].includes(row.orderStatus)
}

function getRowClassName({ row }: { row: ITradeComplianceAudit }): string {
  const classes: string[] = []
  if (row.timeoutFlag) classes.push('timeout-row')
  if (row.complianceStatus === 'returned') classes.push('returned-row')
  return classes.join(' ')
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    if (activeStatusFilter.value === 'timeout') {
      params.timeoutOnly = true
    } else if (activeStatusFilter.value) {
      params.complianceStatus = activeStatusFilter.value
    }
    const res = await getTradeComplianceList(params)
    if (res.code === 0) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const res = await getTradeComplianceStats()
    if (res.code === 0) {
      stats.value = res.data
    }
  } catch { /* ignore */ }
}

function handleSearch(params: Record<string, any>) {
  Object.keys(searchParams).forEach(key => { delete searchParams[key] })
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => { delete searchParams[key] })
  activeStatusFilter.value = ''
  pagination.page = 1
  fetchData()
}

function handleSelectionChange(selection: any[]) {
  selectedRows.value = selection
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

async function handleApprove(row: ITradeComplianceAudit) {
  preCheckResult.value = null
  try {
    const res = await preCheckTradeCompliance(row.id)
    if (res.code === 0) {
      preCheckResult.value = res.data
      if (!res.data.canReview) {
        ElMessage.warning(res.data.messages.join('; ') || '该订单不可审核')
        return
      }
    }
  } catch { /* pre-check failure is non-blocking */ }

  approveDialog.title = `审核通过 - ${row.tradeNo}`
  approveDialog.id = row.id
  approveForm.opinion = ''
  approveDialog.visible = true
}

async function handleReject(row: ITradeComplianceAudit) {
  preCheckResult.value = null
  try {
    const res = await preCheckTradeCompliance(row.id)
    if (res.code === 0) {
      preCheckResult.value = res.data
      if (!res.data.canReview) {
        ElMessage.warning(res.data.messages.join('; ') || '该订单不可审核')
        return
      }
    }
  } catch { /* pre-check failure is non-blocking */ }

  rejectDialog.title = `审核驳回 - ${row.tradeNo}`
  rejectDialog.id = row.id
  rejectForm.violationTypes = []
  rejectForm.violationReason = ''
  rejectForm.opinion = ''
  rejectDialog.visible = true
}

async function handleApproveConfirm() {
  if (!approveForm.opinion.trim()) {
    ElMessage.warning('请输入审核意见')
    return
  }
  approveDialog.loading = true
  try {
    const res = await approveTradeCompliance(approveDialog.id, approveForm.opinion)
    if (res.code === 0) {
      ElMessage.success('审核通过，合规状态已更新并同步')
      approveDialog.visible = false
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('审核操作失败')
  } finally {
    approveDialog.loading = false
  }
}

async function handleRejectConfirm() {
  if (rejectForm.violationTypes.length === 0) {
    ElMessage.warning('请选择违规类型')
    return
  }
  if (!rejectForm.violationReason.trim()) {
    ElMessage.warning('请标注具体违规原因')
    return
  }
  if (!rejectForm.opinion.trim()) {
    ElMessage.warning('请输入审核意见')
    return
  }
  rejectDialog.loading = true
  try {
    const res = await rejectTradeCompliance(
      rejectDialog.id,
      rejectForm.opinion,
      rejectForm.violationTypes,
      [rejectForm.violationReason],
    )
    if (res.code === 0) {
      ElMessage.success('已驳回并退回修正，合规状态已同步')
      rejectDialog.visible = false
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('审核操作失败')
  } finally {
    rejectDialog.loading = false
  }
}

function handleBatchAudit() {
  const reviewable = selectedRows.value.filter(r => canReview(r))
  if (reviewable.length === 0) {
    ElMessage.warning('选中的订单中无可审核项')
    return
  }
  batchDialog.visible = true
}

async function handleBatchConfirm(result: any) {
  if (result && result.success > 0) {
    ElMessage.success(`批量审核完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
    selectedRows.value = []
    batchDialog.visible = false
    fetchData()
    fetchStats()
  }
}

function handleViewTrail(row: ITradeComplianceAudit) {
  trailDialog.auditId = row.id
  trailDialog.auditNo = row.auditNo
  trailDialog.visible = true
}

async function handleMarkTimeout() {
  try {
    const res = await markTimeoutTradeCompliance()
    if (res.code === 0) {
      ElMessage.success(`已标记 ${res.data.marked} 条超时订单`)
      fetchData()
      fetchStats()
    }
  } catch {
    ElMessage.error('刷新超时提醒失败')
  }
}

onMounted(() => {
  fetchData()
  fetchStats()
  pollingTimer = setInterval(() => {
    fetchStats()
  }, 60000)
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/mixins' as *;

.trade-compliance-page {
  padding: 20px;

  .page-header {
    @include flex-between;
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--fin-text-primary);
      margin: 0;
    }

    .toolbar {
      display: flex;
      gap: 8px;
    }
  }

  .stats-cards {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    .stat-card {
      flex: 1;
      padding: 14px 16px;
      background: #fff;
      border-radius: 6px;
      border: 1px solid var(--fin-border);
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      &.active {
        border-color: var(--fin-primary);
        box-shadow: 0 0 0 1px var(--fin-primary);
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--fin-text-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 12px;
        color: var(--fin-text-secondary);
        margin-top: 4px;
      }

      &--auto .stat-value { color: #67C23A; }
      &--manual .stat-value { color: #409EFF; }
      &--approved .stat-value { color: #27AE60; }
      &--rejected .stat-value { color: #D93025; }
      &--timeout .stat-value { color: #E67E22; }
    }
  }

  .status-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    &.timeout-pulse {
      animation: pulse-timeout 2s ease-in-out infinite;
    }

    .timeout-tag {
      font-size: 10px;
      animation: pulse-timeout 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse-timeout {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  .risk-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  .amount-cell {
    &.amount-large {
      color: #D93025;
      font-weight: 600;
    }
  }

  .review-auto {
    color: #67C23A;
    font-weight: 500;
  }

  .review-manual {
    color: #409EFF;
    font-weight: 500;
  }

  .violation-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .text-muted {
    color: var(--fin-text-secondary);
  }

  .action-btn {
    transition: all 0.15s;

    &--approve:active {
      transform: translateY(1px);
      color: #0F9B58 !important;
    }

    &--reject:active {
      transform: translateY(1px);
      color: #B52A1C !important;
    }

    &--trail:active {
      transform: translateY(1px);
    }
  }

  .precheck-result {
    margin-bottom: 16px;
    padding: 12px;
    border-radius: 4px;
    background: #FDF6EC;

    .precheck-warnings {
      .warning-item {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        font-size: 13px;
        color: #E6A23C;
      }
    }

    .time-remaining {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #409EFF;
      margin-top: 8px;
    }
  }

  .audit-form {
    .focus-highlight-input {
      :deep(.el-input__wrapper),
      :deep(.el-textarea__inner) {
        transition: border-color 0.2s, box-shadow 0.2s;

        &:focus,
        &.is-focus {
          border-color: var(--fin-primary);
          box-shadow: 0 0 0 2px rgba(26, 58, 92, 0.15);
        }
      }
    }

    .full-width {
      width: 100%;
    }
  }
}

:deep(.timeout-row) {
  background-color: rgba(245, 108, 108, 0.06) !important;

  td {
    background-color: rgba(245, 108, 108, 0.06) !important;
  }
}

:deep(.returned-row) {
  td {
    color: #E67E22;
  }
}

:deep(.el-table) {
  .el-table__row:nth-child(even) td {
    background-color: #FAFBFD;
  }
}
</style>
