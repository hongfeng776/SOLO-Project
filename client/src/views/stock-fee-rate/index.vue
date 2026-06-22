<template>
  <div class="stock-fee-rate-page">
    <div class="status-banner">
      <div class="banner-item">
        <span class="banner-label">费率总数：</span>
        <span class="banner-value">{{ stats.total }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">草稿：</span>
        <span class="banner-value status-draft">{{ stats.draft }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">待生效：</span>
        <span class="banner-value status-pending">{{ stats.pending }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">已生效：</span>
        <span class="banner-value status-active">{{ stats.active }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">已过期：</span>
        <span class="banner-value status-expired">{{ stats.expired }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">已作废：</span>
        <span class="banner-value status-invalid">{{ stats.invalid }}</span>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <el-button v-if="hasPerm('stockFee:create')" type="primary" :icon="Plus" @click="handleCreate">
        新增费率
      </el-button>
      <el-button v-if="hasPerm('stockFee:batch')" type="success" :icon="Setting" @click="handleBatch">
        批量配置
      </el-button>
      <el-button v-if="hasPerm('stockFee:activate')" type="warning" :icon="CircleCheck" @click="handleBatchActivate">
        批量激活
      </el-button>
    </div>

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :showIndex="true"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #feeCode="{ row }">
        <div class="fee-code-cell">
          <span
            class="type-dot"
            :style="{ backgroundColor: STOCK_FEE_RATE_TYPE_COLORS[row.feeRateType as StockFeeRateType] || '#909399' }"
          />
          <span class="code-text">{{ row.feeCode }}</span>
        </div>
      </template>

      <template #feeName="{ row }">
        <div class="fee-name-cell">
          <span class="name-text">{{ row.feeName }}</span>
        </div>
      </template>

      <template #feeRateType="{ row }">
        <el-tag
          v-if="row.feeRateType"
          size="small"
          effect="plain"
          :style="getFeeRateTypeStyle(row.feeRateType)"
        >
          {{ STOCK_FEE_RATE_TYPE_LABELS[row.feeRateType as StockFeeRateType] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #feeRateValue="{ row }">
        <el-tooltip :content="getFeeCalculationTooltip(row)" placement="top">
          <span class="fee-rate-value">
            {{ row.feeRateValue }}{{ row.feeRateUnit || '‰' }}
          </span>
        </el-tooltip>
      </template>

      <template #customerLevel="{ row }">
        <el-tag
          v-if="row.customerLevel"
          size="small"
          effect="plain"
          :style="getCustomerLevelStyle(row.customerLevel)"
        >
          {{ STOCK_FEE_CUSTOMER_LEVEL_LABELS[row.customerLevel as StockFeeCustomerLevel] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #tradeScene="{ row }">
        <el-tag
          v-if="row.tradeScene"
          size="small"
          effect="plain"
          :style="getTradeSceneStyle(row.tradeScene)"
        >
          {{ STOCK_FEE_TRADE_SCENE_LABELS[row.tradeScene as StockFeeTradeScene] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #scopeType="{ row }">
        <el-tag
          v-if="row.scopeType"
          size="small"
          effect="plain"
        >
          {{ STOCK_FEE_SCOPE_TYPE_LABELS[row.scopeType as StockFeeScopeType] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #feeRateStatus="{ row }">
        <el-tag
          v-if="row.feeRateStatus"
          size="small"
          :type="STOCK_FEE_RATE_STATUS_TAG_TYPES[row.feeRateStatus as StockFeeRateStatus]"
        >
          {{ STOCK_FEE_RATE_STATUS_LABELS[row.feeRateStatus as StockFeeRateStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #conflictLevel="{ row }">
        <el-tag
          v-if="row.conflictLevel"
          size="small"
          :type="STOCK_FEE_CONFLICT_LEVEL_TAG_TYPES[row.conflictLevel as StockFeeConflictLevel]"
        >
          {{ STOCK_FEE_CONFLICT_LEVEL_LABELS[row.conflictLevel as StockFeeConflictLevel] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #action="{ row }">
        <el-button
          type="primary"
          link
          :icon="Switch"
          @click="handleAdjust(row)"
        >
          调整
        </el-button>
        <el-button
          v-if="row.feeRateStatus === StockFeeRateStatus.ACTIVE"
          type="danger"
          link
          :icon="CircleClose"
          @click="handleDeactivate(row)"
        >
          作废
        </el-button>
        <el-button
          v-else-if="row.feeRateStatus === StockFeeRateStatus.PENDING || row.feeRateStatus === StockFeeRateStatus.DRAFT"
          type="success"
          link
          :icon="CircleCheck"
          @click="handleActivate(row)"
        >
          激活
        </el-button>
        <el-button
          v-else
          type="info"
          link
          :icon="CircleCheck"
          disabled
        >
          激活
        </el-button>
        <el-button
          type="warning"
          link
          :icon="Tickets"
          @click="handleTrace(row)"
        >
          溯源
        </el-button>
        <el-button
          type="danger"
          link
          :icon="Delete"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </FinTable>

    <StockFeeRateCreateDialog
      v-model:visible="createDialogVisible"
      :edit-data="currentEditData"
      @success="fetchData"
    />

    <StockFeeRateActiveDialog
      v-model:visible="activeDialogVisible"
      :fee-id="currentActiveId"
      @refresh="fetchData"
    />

    <StockFeeRateBatchDialog
      v-model:visible="batchDialogVisible"
      @success="fetchData"
    />

    <StockFeeRateTraceDialog
      v-model:visible="traceDialogVisible"
      :fee-id="currentTraceId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Setting, CircleCheck, CircleClose, Tickets, Delete, Switch } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  STOCK_FEE_RATE_TYPE_LABELS,
  STOCK_FEE_RATE_TYPE_COLORS,
  STOCK_FEE_RATE_STATUS_LABELS,
  STOCK_FEE_RATE_STATUS_TAG_TYPES,
  STOCK_FEE_CUSTOMER_LEVEL_LABELS,
  STOCK_FEE_CUSTOMER_LEVEL_COLORS,
  STOCK_FEE_TRADE_SCENE_LABELS,
  STOCK_FEE_SCOPE_TYPE_LABELS,
  STOCK_FEE_CONFLICT_LEVEL_LABELS,
  STOCK_FEE_CONFLICT_LEVEL_TAG_TYPES,
  STOCK_FEE_FIELD_LABELS,
} from '@/constants/dictionaries'
import {
  StockFeeRateType,
  StockFeeRateStatus,
  StockFeeCustomerLevel,
  StockFeeTradeScene,
  StockFeeScopeType,
  StockFeeConflictLevel,
} from '@/enums'
import { formatVolume } from '@/utils/format'
import * as stockFeeApi from '@/api/stockFeeRate'
import type { IStockFeeRate, IPaginatedData } from '@/types/api'
import type { ITableColumn } from '@/types/components'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'
import StockFeeRateCreateDialog from './StockFeeRateCreateDialog.vue'
import StockFeeRateActiveDialog from './StockFeeRateActiveDialog.vue'
import StockFeeRateBatchDialog from './StockFeeRateBatchDialog.vue'
import StockFeeRateTraceDialog from './StockFeeRateTraceDialog.vue'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<IStockFeeRate[]>([])
const tableRef = ref()

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES,
})

const searchParams = reactive<Record<string, any>>({})

const stats = reactive({
  total: 0,
  draft: 0,
  pending: 0,
  active: 0,
  expired: 0,
  invalid: 0,
})

const createDialogVisible = ref(false)
const currentEditData = ref<IStockFeeRate | null>(null)

const activeDialogVisible = ref(false)
const currentActiveId = ref<number | null>(null)

const batchDialogVisible = ref(false)

const traceDialogVisible = ref(false)
const currentTraceId = ref<number | null>(null)

const filterConfig = [
  { prop: 'keyword', label: '关键词', type: 'input' as const, placeholder: '费率编码/名称' },
  {
    prop: 'feeRateType',
    label: STOCK_FEE_FIELD_LABELS.feeRateType,
    type: 'select' as const,
    options: Object.entries(STOCK_FEE_RATE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'customerLevel',
    label: STOCK_FEE_FIELD_LABELS.customerLevel,
    type: 'select' as const,
    options: Object.entries(STOCK_FEE_CUSTOMER_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'tradeScene',
    label: STOCK_FEE_FIELD_LABELS.tradeScene,
    type: 'select' as const,
    options: Object.entries(STOCK_FEE_TRADE_SCENE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'scopeType',
    label: STOCK_FEE_FIELD_LABELS.scopeType,
    type: 'select' as const,
    options: Object.entries(STOCK_FEE_SCOPE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'feeRateStatus',
    label: STOCK_FEE_FIELD_LABELS.feeRateStatus,
    type: 'select' as const,
    options: Object.entries(STOCK_FEE_RATE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
]

const tableColumns: ITableColumn[] = [
  { prop: 'feeCode', label: STOCK_FEE_FIELD_LABELS.feeCode, width: 140, fixed: 'left', slot: 'feeCode' },
  { prop: 'feeName', label: STOCK_FEE_FIELD_LABELS.feeName, width: 180, fixed: 'left', slot: 'feeName' },
  { prop: 'feeRateType', label: STOCK_FEE_FIELD_LABELS.feeRateType, width: 120, slot: 'feeRateType' },
  { prop: 'feeRateValue', label: STOCK_FEE_FIELD_LABELS.feeRateValue, width: 120, slot: 'feeRateValue' },
  { prop: 'minFee', label: STOCK_FEE_FIELD_LABELS.minFee, width: 100 },
  { prop: 'maxFee', label: STOCK_FEE_FIELD_LABELS.maxFee, width: 100 },
  { prop: 'customerLevel', label: STOCK_FEE_FIELD_LABELS.customerLevel, width: 120, slot: 'customerLevel' },
  { prop: 'tradeScene', label: STOCK_FEE_FIELD_LABELS.tradeScene, width: 100, slot: 'tradeScene' },
  { prop: 'scopeType', label: STOCK_FEE_FIELD_LABELS.scopeType, width: 120, slot: 'scopeType' },
  { prop: 'feeRateStatus', label: STOCK_FEE_FIELD_LABELS.feeRateStatus, width: 100, slot: 'feeRateStatus' },
  { prop: 'conflictLevel', label: STOCK_FEE_FIELD_LABELS.conflictLevel, width: 100, slot: 'conflictLevel' },
  { prop: 'effectiveStartTime', label: STOCK_FEE_FIELD_LABELS.effectiveStartTime, width: 140, type: 'date' },
  { prop: 'createdAt', label: '创建时间', width: 140, type: 'date' },
  { prop: 'action', label: '操作', width: 260, fixed: 'right', slot: 'action' },
]

function getFeeRateTypeStyle(feeRateType: string) {
  const color = STOCK_FEE_RATE_TYPE_COLORS[feeRateType as StockFeeRateType] || '#909399'
  return {
    backgroundColor: `${color}20`,
    color,
    borderColor: `${color}50`,
  }
}

function getCustomerLevelStyle(customerLevel: string) {
  const color = STOCK_FEE_CUSTOMER_LEVEL_COLORS[customerLevel as StockFeeCustomerLevel] || '#909399'
  return {
    backgroundColor: `${color}20`,
    color,
    borderColor: `${color}50`,
  }
}

function getTradeSceneStyle(tradeScene: string) {
  const colorMap: Record<string, string> = {
    [StockFeeTradeScene.BUY]: '#F56C6C',
    [StockFeeTradeScene.SELL]: '#67C23A',
    [StockFeeTradeScene.SUBSCRIBE]: '#E6A23C',
    [StockFeeTradeScene.REDEEM]: '#409EFF',
  }
  const color = colorMap[tradeScene] || '#909399'
  return {
    backgroundColor: `${color}20`,
    color,
    borderColor: `${color}50`,
  }
}

function getFeeCalculationTooltip(row: IStockFeeRate) {
  const rate = row.feeRateValue
  const unit = row.feeRateUnit || '‰'
  const exampleAmount = 100000
  let calculatedFee = 0
  if (unit === '‰') {
    calculatedFee = exampleAmount * rate / 1000
  } else if (unit === '%') {
    calculatedFee = exampleAmount * rate / 100
  } else if (unit === '元/笔') {
    calculatedFee = rate
  } else if (unit === '元/股') {
    calculatedFee = exampleAmount * rate
  }
  return `示例: 交易金额10万 × ${rate}${unit} = ${calculatedFee.toFixed(2)}元`
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    const res = await stockFeeApi.getList(params)
    const data = res.data as IPaginatedData<IStockFeeRate>
    tableData.value = data.list
    pagination.total = data.total
    updateStats(data.list)
  } catch (error) {
    ElMessage.error('获取费率列表失败')
  } finally {
    loading.value = false
  }
}

function updateStats(list: IStockFeeRate[]) {
  stats.total = pagination.total
  stats.draft = list.filter(item => item.feeRateStatus === StockFeeRateStatus.DRAFT).length
  stats.pending = list.filter(item => item.feeRateStatus === StockFeeRateStatus.PENDING).length
  stats.active = list.filter(item => item.feeRateStatus === StockFeeRateStatus.ACTIVE).length
  stats.expired = list.filter(item => item.feeRateStatus === StockFeeRateStatus.EXPIRED).length
  stats.invalid = list.filter(item => item.feeRateStatus === StockFeeRateStatus.INVALID).length
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => {
    delete searchParams[key]
  })
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

function handleCreate() {
  currentEditData.value = null
  createDialogVisible.value = true
}

function handleAdjust(row: IStockFeeRate) {
  currentEditData.value = row
  createDialogVisible.value = true
}

async function handleActivate(row: IStockFeeRate) {
  try {
    await ElMessageBox.confirm(`确定要激活费率"${row.feeName}"吗？`, '激活确认', {
      type: 'warning',
    })
    await stockFeeApi.activateFee(row.id)
    ElMessage.success('激活成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('激活失败')
    }
  }
}

async function handleDeactivate(row: IStockFeeRate) {
  try {
    await ElMessageBox.confirm(`确定要作废费率"${row.feeName}"吗？`, '作废确认', {
      type: 'warning',
    })
    await stockFeeApi.deactivateFee(row.id)
    ElMessage.success('作废成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('作废失败')
    }
  }
}

function handleTrace(row: IStockFeeRate) {
  currentTraceId.value = row.id
  traceDialogVisible.value = true
}

async function handleDelete(row: IStockFeeRate) {
  try {
    await ElMessageBox.confirm(`确定要删除费率"${row.feeName}"吗？`, '删除确认', {
      type: 'warning',
    })
    await stockFeeApi.deleteFn(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function handleBatch() {
  batchDialogVisible.value = true
}

function handleBatchActivate() {
  batchDialogVisible.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.stock-fee-rate-page {
  padding: 20px;

  .status-banner {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
    border-radius: 8px;
    margin-bottom: 16px;
    border: 1px solid #e4e9f2;

    .banner-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;

      .banner-label {
        color: #606266;
        font-weight: 500;
      }

      .banner-value {
        color: #1f2d3d;
        font-weight: 600;

        &.status-draft {
          color: #909399;
        }

        &.status-pending {
          color: #E6A23C;
        }

        &.status-active {
          color: #67C23A;
        }

        &.status-expired {
          color: #C0C4CC;
        }

        &.status-invalid {
          color: #F56C6C;
        }
      }
    }
  }

  .table-toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .fee-code-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .type-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .code-text {
      font-family: 'Consolas', 'Monaco', monospace;
      font-weight: 600;
      color: #1f2d3d;
    }
  }

  .fee-name-cell {
    .name-text {
      font-weight: 500;
      color: #1f2d3d;
    }
  }

  .fee-rate-value {
    font-family: 'Consolas', 'Monaco', monospace;
    font-weight: 600;
    color: #409EFF;
  }
}
</style>
