<template>
  <div class="holding-control-page">
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statCards" :key="index">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">
              {{ formatStatValue(item.value, item.type) }}
            </div>
            <div class="stat-unit" v-if="item.unit">{{ item.unit }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-toolbar">
      <el-button
        v-if="hasPerm('holding:manage')"
        type="warning"
        :disabled="selectedIds.length === 0"
        class="ripple-btn"
        @click="handleBatchLock"
      >
        <el-icon><Lock /></el-icon>
        批量锁定
      </el-button>
      <el-button
        v-if="hasPerm('holding:manage')"
        type="success"
        :disabled="selectedIds.length === 0"
        class="ripple-btn"
        @click="handleBatchUnlock"
      >
        <el-icon><Unlock /></el-icon>
        批量解锁
      </el-button>
      <el-button
        v-if="hasPerm('holding:manage')"
        type="primary"
        class="ripple-btn"
        @click="handleBatchLockByFilter"
      >
        <el-icon><Filter /></el-icon>
        筛选批量锁定
      </el-button>
      <el-button
        v-if="hasPerm('holding:manage')"
        type="info"
        class="ripple-btn"
        @click="handleSyncMarketValue"
      >
        <el-icon><Refresh /></el-icon>
        同步市值
      </el-button>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-wrapper">
      <FinTable
        ref="tableRef"
        :columns="tableColumns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :selection="true"
        :show-index="true"
        row-key="id"
        highlight-current-row
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @row-click="handleRowClick"
      >
        <template #lockStatus="{ row }">
          <el-tag :type="getLockStatusType(row.lockStatus)" effect="light">
            {{ getLockStatusLabel(row.lockStatus) }}
          </el-tag>
        </template>

        <template #floatingProfit="{ row }">
          <span :class="getProfitClass(row.floatingProfit)">
            {{ row.floatingProfit > 0 ? '+' : '' }}{{ formatMoney(row.floatingProfit) }}
          </span>
        </template>

        <template #floatingProfitRate="{ row }">
          <span :class="getProfitClass(row.floatingProfitRate)">
            {{ row.floatingProfitRate > 0 ? '+' : '' }}{{ formatPercent(row.floatingProfitRate) }}
          </span>
        </template>

        <template #marketValue="{ row }">
          <span class="amount-value">{{ formatNumber(row.marketValue) }}</span>
        </template>

        <template #totalQuantity="{ row }">
          {{ formatInteger(row.totalQuantity) }}
        </template>

        <template #availableQuantity="{ row }">
          {{ formatInteger(row.availableQuantity) }}
        </template>

        <template #frozenQuantity="{ row }">
          <span :class="{ 'frozen-text': row.frozenQuantity > 0 }">
            {{ formatInteger(row.frozenQuantity) }}
          </span>
        </template>

        <template #customerRiskLevel="{ row }">
          <el-tag :color="getRiskLevelColor(row.customerRiskLevel)" effect="light" size="small">
            {{ getRiskLevelLabel(row.customerRiskLevel) }}
          </el-tag>
        </template>

        <template #action="{ row }">
          <el-button
            v-if="hasPerm('holding:manage') && row.lockStatus !== 'locked'"
            type="warning"
            link
            class="ripple-btn"
            @click.stop="handleLock(row)"
          >
            锁定
          </el-button>
          <el-button
            v-if="hasPerm('holding:manage') && row.lockStatus === 'locked'"
            type="success"
            link
            class="ripple-btn"
            @click.stop="handleUnlock(row)"
          >
            解锁
          </el-button>
          <el-button
            v-if="hasPerm('holding:manage') && row.lockStatus !== 'locked'"
            type="primary"
            link
            class="ripple-btn"
            @click.stop="handleAdjust(row)"
          >
            调整
          </el-button>
          <el-button type="info" link @click.stop="handleAuditTrail(row)">
            溯源
          </el-button>
        </template>
      </FinTable>
    </div>

    <HoldingAdjustDialog
      v-model:visible="adjustDialogVisible"
      :holding="currentHolding"
      @success="fetchData"
    />

    <HoldingAuditTrailDialog
      v-model:visible="auditTrailVisible"
      :holding-id="currentAuditId"
    />

    <el-dialog
      v-model="lockReasonDialogVisible"
      title="输入锁定原因"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form ref="lockReasonFormRef" :model="lockReasonForm" :rules="lockReasonRules">
        <el-form-item label="锁定原因" prop="reason">
          <el-input
            v-model="lockReasonForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入锁定原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lockReasonDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="lockSubmitting" @click="confirmLock">确认锁定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchLockFilterDialogVisible"
      title="筛选批量锁定"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form ref="batchFilterFormRef" :model="batchFilterForm" label-width="120px">
        <el-form-item label="股票代码">
          <el-input v-model="batchFilterForm.stockCode" placeholder="请输入股票代码（选填）" />
        </el-form-item>
        <el-form-item label="最小持仓市值">
          <el-input-number v-model="batchFilterForm.minMarketValue" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="最大持仓市值">
          <el-input-number v-model="batchFilterForm.maxMarketValue" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="客户风险等级">
          <el-select v-model="batchFilterForm.riskLevel" placeholder="请选择" clearable style="width: 100%">
            <el-option label="R1-低风险" value="R1" />
            <el-option label="R2-中低风险" value="R2" />
            <el-option label="R3-中风险" value="R3" />
            <el-option label="R4-中高风险" value="R4" />
            <el-option label="R5-高风险" value="R5" />
          </el-select>
        </el-form-item>
        <el-form-item label="锁定原因" prop="reason">
          <el-input
            v-model="batchFilterForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入锁定原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchLockFilterDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLockSubmitting" @click="confirmBatchLockByFilter">
          执行批量锁定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Wallet, TrendCharts, Goods, DataAnalysis, Lock, Unlock, Filter, Refresh } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import HoldingAdjustDialog from './HoldingAdjustDialog.vue'
import HoldingAuditTrailDialog from './HoldingAuditTrailDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatMoney, formatDate, formatPercent, formatNumber } from '@/utils/format'
import {
  RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  HOLDING_LOCK_STATUS_LABELS,
  HOLDING_LOCK_STATUS_COLORS,
} from '@/constants/dictionaries'
import { RiskLevel, HoldingLockStatus } from '@/enums'
import * as holdingApi from '@/api/holding'
import type { ICustomerHolding } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<ICustomerHolding[]>([])
const selectedIds = ref<number[]>([])
const searchParams = reactive<Record<string, any>>({})
const adjustDialogVisible = ref(false)
const auditTrailVisible = ref(false)
const currentHolding = ref<ICustomerHolding | null>(null)
const currentAuditId = ref<number | null>(null)

const lockReasonDialogVisible = ref(false)
const lockSubmitting = ref(false)
const lockReasonFormRef = ref<FormInstance>()
const lockReasonForm = reactive({ reason: '' })
const lockReasonRules: FormRules = { reason: [{ required: true, message: '请输入锁定原因', trigger: 'blur' }] }
let pendingLockId: number | null = null
let pendingLockType: 'single' | 'batch' = 'single'

const batchLockFilterDialogVisible = ref(false)
const batchLockSubmitting = ref(false)
const batchFilterFormRef = ref<FormInstance>()
const batchFilterForm = reactive({
  stockCode: '',
  minMarketValue: undefined as number | undefined,
  maxMarketValue: undefined as number | undefined,
  riskLevel: '',
  reason: '',
})

const holdingStats = reactive({
  totalMarketValue: 0,
  totalFloatingProfit: 0,
  totalProfitRate: 0,
  stockCount: 0,
})

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES,
})

const statCards = computed(() => [
  {
    label: '总持仓市值',
    value: holdingStats.totalMarketValue,
    type: 'money',
    unit: '元',
    icon: Wallet,
    color: '#1A3A5C',
    bgColor: 'rgba(26, 58, 92, 0.1)',
  },
  {
    label: '总浮动盈亏',
    value: holdingStats.totalFloatingProfit,
    type: 'money',
    unit: '元',
    icon: TrendCharts,
    color: holdingStats.totalFloatingProfit >= 0 ? '#0F9B58' : '#F56C6C',
    bgColor: holdingStats.totalFloatingProfit >= 0 ? 'rgba(15, 155, 88, 0.1)' : 'rgba(245, 108, 108, 0.1)',
  },
  {
    label: '总盈亏比例',
    value: holdingStats.totalProfitRate,
    type: 'percent',
    unit: '',
    icon: DataAnalysis,
    color: holdingStats.totalProfitRate >= 0 ? '#0F9B58' : '#F56C6C',
    bgColor: holdingStats.totalProfitRate >= 0 ? 'rgba(15, 155, 88, 0.1)' : 'rgba(245, 108, 108, 0.1)',
  },
  {
    label: '持仓股票数量',
    value: holdingStats.stockCount,
    type: 'number',
    unit: '只',
    icon: Goods,
    color: '#2C5F8A',
    bgColor: 'rgba(44, 95, 138, 0.1)',
  },
])

const filterConfig = [
  {
    prop: 'keyword',
    label: '股票代码/名称',
    type: 'input' as const,
    placeholder: '请输入股票代码或名称',
  },
  {
    prop: 'lockStatus',
    label: '锁定状态',
    type: 'select' as const,
    options: [
      { label: '正常', value: HoldingLockStatus.NORMAL },
      { label: '已锁定', value: HoldingLockStatus.LOCKED },
    ],
  },
  {
    prop: 'riskLevel',
    label: '客户风险等级',
    type: 'select' as const,
    options: [
      { label: 'R1-低风险', value: RiskLevel.R1 },
      { label: 'R2-中低风险', value: RiskLevel.R2 },
      { label: 'R3-中风险', value: RiskLevel.R3 },
      { label: 'R4-中高风险', value: RiskLevel.R4 },
      { label: 'R5-高风险', value: RiskLevel.R5 },
    ],
  },
  {
    prop: 'profitStatus',
    label: '盈亏状态',
    type: 'select' as const,
    options: [
      { label: '全部', value: 'all' },
      { label: '盈利', value: 'profit' },
      { label: '亏损', value: 'loss' },
    ],
  },
]

const tableColumns = [
  { prop: 'customerName', label: '客户', minWidth: 100 },
  { prop: 'stockCode', label: '股票代码', minWidth: 90 },
  { prop: 'stockName', label: '股票名称', minWidth: 100 },
  { prop: 'lockStatus', label: '锁定状态', minWidth: 80, slot: 'lockStatus', align: 'center' },
  { prop: 'totalQuantity', label: '持仓数量', minWidth: 100, slot: 'totalQuantity', align: 'right' },
  { prop: 'availableQuantity', label: '可用数量', minWidth: 100, slot: 'availableQuantity', align: 'right' },
  { prop: 'frozenQuantity', label: '冻结数量', minWidth: 100, slot: 'frozenQuantity', align: 'right' },
  { prop: 'costPrice', label: '成本价', minWidth: 90, type: 'money' as const },
  { prop: 'currentPrice', label: '现价', minWidth: 90, type: 'money' as const },
  { prop: 'marketValue', label: '市值', minWidth: 110, slot: 'marketValue' },
  { prop: 'floatingProfit', label: '浮动盈亏', minWidth: 110, slot: 'floatingProfit', align: 'right' },
  { prop: 'floatingProfitRate', label: '盈亏比例', minWidth: 100, slot: 'floatingProfitRate', align: 'right' },
  { prop: 'customerRiskLevel', label: '客户风险', minWidth: 100, slot: 'customerRiskLevel', align: 'center' },
  { prop: 'action', label: '操作', minWidth: 200, slot: 'action', align: 'center', fixed: 'right' as const },
]

function getLockStatusLabel(status: string): string {
  return HOLDING_LOCK_STATUS_LABELS[status as HoldingLockStatus] || status || '正常'
}

function getLockStatusType(status: string): 'success' | 'danger' | 'warning' | 'info' {
  return (HOLDING_LOCK_STATUS_COLORS[status as HoldingLockStatus] as 'success' | 'danger') || 'success'
}

function getRiskLevelLabel(level: string): string {
  return RISK_LEVEL_LABELS[level as RiskLevel] || level || '-'
}

function getRiskLevelColor(level: string): string {
  return RISK_LEVEL_COLORS[level as RiskLevel] || '#909399'
}

function getProfitClass(value: number): string {
  const classes = ['fin-money']
  if (value > 0) classes.push('fin-rise')
  else if (value < 0) classes.push('fin-fall')
  return classes.join(' ')
}

function formatStatValue(value: number, type: string): string {
  if (type === 'money') return formatMoney(value)
  if (type === 'percent') return formatPercent(value)
  if (type === 'number') return value.toLocaleString()
  return String(value)
}

function formatInteger(value: number): string {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString()
}

async function fetchStats() {
  try {
    const res = await holdingApi.getHoldingStats()
    if (res.code === 0) {
      Object.assign(holdingStats, res.data)
    }
  } catch {}
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    const res = await holdingApi.getHoldingList(params)
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

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach((key) => { delete searchParams[key] })
  pagination.page = 1
  fetchData()
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

function handleSelectionChange(selection: ICustomerHolding[]) {
  selectedIds.value = selection.map((item) => item.id)
}

function handleRowClick(row: ICustomerHolding) {}

function handleLock(row: ICustomerHolding) {
  pendingLockId = row.id
  pendingLockType = 'single'
  lockReasonForm.reason = ''
  lockReasonDialogVisible.value = true
}

async function handleUnlock(row: ICustomerHolding) {
  try {
    await ElMessageBox.confirm(
      `确定解锁 ${row.stockCode} ${row.stockName} 的持仓吗？解锁后将恢复正常交易权限。`,
      '解锁确认',
      { type: 'warning' },
    )
    const res = await holdingApi.unlockHolding(row.id)
    if (res.code === 0) {
      ElMessage.success('解锁成功')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch {}
}

function handleAdjust(row: ICustomerHolding) {
  currentHolding.value = row
  adjustDialogVisible.value = true
}

function handleAuditTrail(row: ICustomerHolding) {
  currentAuditId.value = row.id
  auditTrailVisible.value = true
}

async function confirmLock() {
  try {
    await lockReasonFormRef.value?.validate()
  } catch {
    return
  }

  lockSubmitting.value = true
  try {
    if (pendingLockType === 'single' && pendingLockId) {
      const res = await holdingApi.lockHolding(pendingLockId, lockReasonForm.reason)
      if (res.code === 0) {
        ElMessage.success('锁定成功')
        fetchData()
      } else {
        ElMessage.error(res.message)
      }
    } else if (pendingLockType === 'batch') {
      const res = await holdingApi.batchLockHolding(selectedIds.value, lockReasonForm.reason)
      if (res.code === 0) {
        ElMessage.success(`批量锁定完成：成功${res.data.success}条，失败${res.data.failed}条`)
        fetchData()
      } else {
        ElMessage.error(res.message)
      }
    }
    lockReasonDialogVisible.value = false
  } catch {
    ElMessage.error('操作失败')
  } finally {
    lockSubmitting.value = false
  }
}

function handleBatchLock() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要锁定的持仓')
    return
  }
  pendingLockType = 'batch'
  lockReasonForm.reason = ''
  lockReasonDialogVisible.value = true
}

async function handleBatchUnlock() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要解锁的持仓')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定批量解锁选中的 ${selectedIds.value.length} 条持仓吗？`,
      '批量解锁确认',
      { type: 'warning' },
    )
    const res = await holdingApi.batchUnlockHolding(selectedIds.value)
    if (res.code === 0) {
      ElMessage.success(`批量解锁完成：成功${res.data.success}条，失败${res.data.failed}条`)
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch {}
}

function handleBatchLockByFilter() {
  batchFilterForm.stockCode = ''
  batchFilterForm.minMarketValue = undefined
  batchFilterForm.maxMarketValue = undefined
  batchFilterForm.riskLevel = ''
  batchFilterForm.reason = ''
  batchLockFilterDialogVisible.value = true
}

async function confirmBatchLockByFilter() {
  if (!batchFilterForm.reason.trim()) {
    ElMessage.warning('请输入锁定原因')
    return
  }
  batchLockSubmitting.value = true
  try {
    const res = await holdingApi.batchLockByFilter({
      stockCode: batchFilterForm.stockCode || undefined,
      minMarketValue: batchFilterForm.minMarketValue,
      maxMarketValue: batchFilterForm.maxMarketValue,
      riskLevel: batchFilterForm.riskLevel || undefined,
      reason: batchFilterForm.reason,
    })
    if (res.code === 0) {
      ElMessage.success(`筛选批量锁定完成：成功${res.data.success}条，失败${res.data.failed}条`)
      batchLockFilterDialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    batchLockSubmitting.value = false
  }
}

async function handleSyncMarketValue() {
  try {
    await ElMessageBox.confirm('确定同步所有持仓的最新市值数据吗？', '同步确认', { type: 'info' })
    const res = await holdingApi.syncHoldingsMarketValue()
    if (res.code === 0) {
      ElMessage.success('市值同步完成')
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch {}
}

onMounted(async () => {
  await fetchStats()
  fetchData()
})
</script>

<style lang="scss" scoped>
.holding-control-page {
  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--fin-primary);
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
      min-width: 0;

      .stat-label { font-size: 12px; color: var(--fin-text-secondary); margin-bottom: 2px; }
      .stat-value { font-size: 20px; font-weight: 700; line-height: 1.2; font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif; }
      .stat-unit { font-size: 11px; color: var(--fin-text-secondary); margin-top: 2px; }
    }
  }

  .page-toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .table-wrapper {
    :deep(.el-table) {
      .el-table__row {
        cursor: pointer;
        transition: background-color 0.2s;

        &.current-row {
          background-color: #ecf5ff !important;
        }
      }
    }
  }

  .amount-value {
    color: var(--fin-primary);
    font-weight: 600;
  }

  .frozen-text {
    color: #F56C6C;
    font-weight: 600;
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
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.4s ease, height 0.4s ease;
    }

    &:active::after {
      width: 200px;
      height: 200px;
    }
  }
}
</style>
