<template>
  <div class="stock-status-sync-page">
    <div class="status-banner">
      <div class="banner-item">
        <span class="banner-label">今日同步数：</span>
        <span class="banner-value">{{ stats.todaySync }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">自动同步数：</span>
        <span class="banner-value status-auto">{{ stats.autoSync }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">手动更新数：</span>
        <span class="banner-value status-manual">{{ stats.manualUpdate }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">待审核：</span>
        <span class="banner-value status-pending">{{ stats.pendingAudit }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">审核通过：</span>
        <span class="banner-value status-approved">{{ stats.approved }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">风险拦截：</span>
        <span class="banner-value status-risk">{{ stats.riskBlocked }}</span>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <el-button v-if="hasPerm('stockStatus:sync')" type="primary" :icon="MagicStick" @click="handleOpsPanel">
        运维面板
      </el-button>
      <el-button v-if="hasPerm('stockStatus:sync')" type="success" :icon="RefreshRight" @click="handleBatchSync">
        批量同步
      </el-button>
      <el-button v-if="hasPerm('stockStatus:sync')" type="warning" :icon="Download" @click="handleFetchAnnouncements">
        拉取公告
      </el-button>
      <el-button
        v-if="hasPerm('stockStatus:sync') && hasPerm('stockStatus:audit')"
        type="danger"
        :icon="CircleCheck"
        @click="handleBatchAuditPass"
      >
        审核通过
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
      <template #stockCode="{ row }">
        <div class="stock-code-cell">
          <span
            class="type-dot"
            :style="{ backgroundColor: STOCK_STATUS_CHANGE_TYPE_COLORS[row.changeType as StockStatusChangeType] || '#909399' }"
          />
          <span class="code-text">{{ row.stockCode }}</span>
        </div>
      </template>

      <template #fromStatus="{ row }">
        <el-tag
          v-if="row.fromStatus"
          size="small"
          :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.fromStatus as StockProductStatus]"
        >
          {{ STOCK_PRODUCT_STATUS_LABELS[row.fromStatus as StockProductStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #toStatus="{ row }">
        <el-tag
          v-if="row.toStatus"
          size="small"
          :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.toStatus as StockProductStatus]"
        >
          {{ STOCK_PRODUCT_STATUS_LABELS[row.toStatus as StockProductStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #changeType="{ row }">
        <el-tag
          v-if="row.changeType"
          size="small"
          effect="plain"
          :style="getChangeTypeStyle(row.changeType)"
        >
          {{ STOCK_STATUS_CHANGE_TYPE_LABELS[row.changeType as StockStatusChangeType] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #syncSource="{ row }">
        <el-tag
          v-if="row.syncSource"
          size="small"
          effect="plain"
          :style="getSyncSourceStyle(row.syncSource)"
        >
          {{ STOCK_STATUS_SYNC_SOURCE_LABELS[row.syncSource as StockStatusSyncSource] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #riskLevel="{ row }">
        <el-tag
          v-if="row.riskLevel"
          size="small"
          :type="STOCK_STATUS_RISK_LEVEL_TAG_TYPES[row.riskLevel as StockStatusRiskLevel]"
        >
          {{ STOCK_STATUS_RISK_LEVEL_LABELS[row.riskLevel as StockStatusRiskLevel] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #auditStatus="{ row }">
        <el-tag
          v-if="row.auditStatus"
          size="small"
          :type="STOCK_STATUS_AUDIT_STATUS_TAG_TYPES[row.auditStatus as StockStatusAuditStatus]"
        >
          {{ STOCK_STATUS_AUDIT_STATUS_LABELS[row.auditStatus as StockStatusAuditStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #tradingLocked="{ row }">
        <el-icon
          v-if="row.tradingLocked"
          class="status-icon locked"
          :size="18"
        >
          <CircleClose />
        </el-icon>
        <el-icon
          v-else
          class="status-icon unlocked"
          :size="18"
        >
          <CircleCheck />
        </el-icon>
      </template>

      <template #pushedToClient="{ row }">
        <el-icon
          v-if="row.pushedToClient"
          class="status-icon pushed"
          :size="18"
        >
          <CircleCheck />
        </el-icon>
        <el-icon
          v-else
          class="status-icon not-pushed"
          :size="18"
        >
          <CircleClose />
        </el-icon>
      </template>

      <template #action="{ row }">
        <el-button
          type="primary"
          link
          :icon="Lock"
          @click="handleLock(row)"
        >
          权限联动
        </el-button>
        <el-button
          type="warning"
          link
          :icon="Tickets"
          @click="handleTrace(row)"
        >
          状态溯源
        </el-button>
        <el-button
          v-if="row.auditStatus === StockStatusAuditStatus.PENDING"
          type="success"
          link
          :icon="CircleCheck"
          @click="handleAuditPass(row)"
        >
          审核通过
        </el-button>
        <el-button
          v-if="row.auditStatus === StockStatusAuditStatus.PENDING"
          type="danger"
          link
          :icon="CircleClose"
          @click="handleAuditReject(row)"
        >
          驳回
        </el-button>
      </template>
    </FinTable>

    <StockStatusOpsPanel
      v-model:visible="opsPanelVisible"
      @success="fetchData"
    />

    <StockStatusLockDialog
      v-model:visible="lockDialogVisible"
      :sync-record-id="currentLockId"
      @refresh="fetchData"
    />

    <StockStatusBatchDialog
      v-model:visible="batchDialogVisible"
      @success="fetchData"
    />

    <StockStatusTraceDialog
      v-model:visible="traceDialogVisible"
      :stock-code="currentTraceStockCode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { MagicStick, RefreshRight, Download, CircleCheck, CircleClose, Lock, Tickets, Switch } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  STOCK_STATUS_CHANGE_TYPE_LABELS,
  STOCK_STATUS_CHANGE_TYPE_COLORS,
  STOCK_STATUS_SYNC_SOURCE_LABELS,
  STOCK_STATUS_SYNC_SOURCE_COLORS,
  STOCK_STATUS_RISK_LEVEL_LABELS,
  STOCK_STATUS_RISK_LEVEL_TAG_TYPES,
  STOCK_STATUS_AUDIT_STATUS_LABELS,
  STOCK_STATUS_AUDIT_STATUS_TAG_TYPES,
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_STATUS_FIELD_LABELS,
} from '@/constants/dictionaries'
import {
  StockStatusChangeType,
  StockStatusSyncSource,
  StockStatusRiskLevel,
  StockStatusAuditStatus,
  StockProductStatus,
} from '@/enums'
import { formatDateTime } from '@/utils/format'
import * as statusSyncApi from '@/api/stockStatusSync'
import type { IStockStatusSyncRecord, IPaginatedData } from '@/types/api'
import type { ITableColumn } from '@/types/components'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'
import StockStatusOpsPanel from './StockStatusOpsPanel.vue'
import StockStatusLockDialog from './StockStatusLockDialog.vue'
import StockStatusBatchDialog from './StockStatusBatchDialog.vue'
import StockStatusTraceDialog from './StockStatusTraceDialog.vue'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<IStockStatusSyncRecord[]>([])
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
  todaySync: 0,
  autoSync: 0,
  manualUpdate: 0,
  pendingAudit: 0,
  approved: 0,
  riskBlocked: 0,
})

const opsPanelVisible = ref(false)

const lockDialogVisible = ref(false)
const currentLockId = ref<number | null>(null)

const batchDialogVisible = ref(false)

const traceDialogVisible = ref(false)
const currentTraceStockCode = ref<string | null>(null)

const filterConfig = [
  { prop: 'keyword', label: '关键词', type: 'input' as const, placeholder: '股票代码/名称' },
  {
    prop: 'changeType',
    label: STOCK_STATUS_FIELD_LABELS.changeType,
    type: 'select' as const,
    options: Object.entries(STOCK_STATUS_CHANGE_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'syncSource',
    label: STOCK_STATUS_FIELD_LABELS.syncSource,
    type: 'select' as const,
    options: Object.entries(STOCK_STATUS_SYNC_SOURCE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'riskLevel',
    label: STOCK_STATUS_FIELD_LABELS.riskLevel,
    type: 'select' as const,
    options: Object.entries(STOCK_STATUS_RISK_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'auditStatus',
    label: STOCK_STATUS_FIELD_LABELS.auditStatus,
    type: 'select' as const,
    options: Object.entries(STOCK_STATUS_AUDIT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'dateRange',
    label: '时间范围',
    type: 'daterange' as const,
    startPlaceholder: '开始时间',
    endPlaceholder: '结束时间',
    valueFormat: 'YYYY-MM-DD HH:mm:ss',
  },
]

const tableColumns: ITableColumn[] = [
  { prop: 'stockCode', label: STOCK_STATUS_FIELD_LABELS.stockCode, width: 120, fixed: 'left', slot: 'stockCode' },
  { prop: 'stockName', label: STOCK_STATUS_FIELD_LABELS.stockName, width: 160, fixed: 'left' },
  { prop: 'fromStatus', label: STOCK_STATUS_FIELD_LABELS.fromStatus, width: 100, slot: 'fromStatus' },
  { prop: 'toStatus', label: STOCK_STATUS_FIELD_LABELS.toStatus, width: 100, slot: 'toStatus' },
  { prop: 'changeType', label: STOCK_STATUS_FIELD_LABELS.changeType, width: 110, slot: 'changeType' },
  { prop: 'syncSource', label: STOCK_STATUS_FIELD_LABELS.syncSource, width: 100, slot: 'syncSource' },
  { prop: 'riskLevel', label: STOCK_STATUS_FIELD_LABELS.riskLevel, width: 100, slot: 'riskLevel' },
  { prop: 'auditStatus', label: STOCK_STATUS_FIELD_LABELS.auditStatus, width: 100, slot: 'auditStatus' },
  { prop: 'tradingLocked', label: STOCK_STATUS_FIELD_LABELS.tradingLocked, width: 80, slot: 'tradingLocked' },
  { prop: 'pushedToClient', label: STOCK_STATUS_FIELD_LABELS.pushedToClient, width: 90, slot: 'pushedToClient' },
  { prop: 'effectiveTime', label: STOCK_STATUS_FIELD_LABELS.effectiveTime, width: 160, type: 'date' },
  { prop: 'operatorName', label: STOCK_STATUS_FIELD_LABELS.operatorName, width: 100 },
  { prop: 'operationTime', label: STOCK_STATUS_FIELD_LABELS.operationTime, width: 160, type: 'date' },
  { prop: 'action', label: '操作', width: 280, fixed: 'right', slot: 'action' },
]

function getChangeTypeStyle(changeType: string) {
  const color = STOCK_STATUS_CHANGE_TYPE_COLORS[changeType as StockStatusChangeType] || '#909399'
  return {
    backgroundColor: `${color}20`,
    color,
    borderColor: `${color}50`,
  }
}

function getSyncSourceStyle(syncSource: string) {
  const color = STOCK_STATUS_SYNC_SOURCE_COLORS[syncSource as StockStatusSyncSource] || '#909399'
  return {
    backgroundColor: `${color}20`,
    color,
    borderColor: `${color}50`,
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    const res = await statusSyncApi.getSyncRecords(params)
    const data = res.data as IPaginatedData<IStockStatusSyncRecord>
    tableData.value = data.list
    pagination.total = data.total
    updateStats(data.list)
  } catch (error) {
    ElMessage.error('获取同步记录失败')
  } finally {
    loading.value = false
  }
}

function updateStats(list: IStockStatusSyncRecord[]) {
  stats.todaySync = list.length
  stats.autoSync = list.filter(item => item.changeType === StockStatusChangeType.AUTO_SYNC).length
  stats.manualUpdate = list.filter(item => item.changeType === StockStatusChangeType.MANUAL_UPDATE).length
  stats.pendingAudit = list.filter(item => item.auditStatus === StockStatusAuditStatus.PENDING).length
  stats.approved = list.filter(item => item.auditStatus === StockStatusAuditStatus.APPROVED).length
  stats.riskBlocked = list.filter(item =>
    item.riskLevel === StockStatusRiskLevel.HIGH_RISK || item.riskLevel === StockStatusRiskLevel.CRITICAL
  ).length
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

function handleOpsPanel() {
  opsPanelVisible.value = true
}

function handleLock(row: IStockStatusSyncRecord) {
  currentLockId.value = row.id
  lockDialogVisible.value = true
}

function handleTrace(row: IStockStatusSyncRecord) {
  currentTraceStockCode.value = row.stockCode
  traceDialogVisible.value = true
}

async function handleAuditPass(row: IStockStatusSyncRecord) {
  try {
    await ElMessageBox.confirm(`确定要审核通过"${row.stockName}"的状态变更吗？`, '审核确认', {
      type: 'warning',
    })
    await statusSyncApi.auditSyncRecord(row.id, { auditStatus: StockStatusAuditStatus.APPROVED })
    ElMessage.success('审核通过')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审核失败')
    }
  }
}

async function handleAuditReject(row: IStockStatusSyncRecord) {
  try {
    await ElMessageBox.confirm(`确定要驳回"${row.stockName}"的状态变更吗？`, '驳回确认', {
      type: 'warning',
    })
    await statusSyncApi.auditSyncRecord(row.id, { auditStatus: StockStatusAuditStatus.REJECTED })
    ElMessage.success('已驳回')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('驳回失败')
    }
  }
}

function handleBatchSync() {
  batchDialogVisible.value = true
}

async function handleFetchAnnouncements() {
  loading.value = true
  try {
    const res = await statusSyncApi.syncAllAnnouncements()
    const data = res.data as { fetched: number; matched: number }
    ElMessage.success(`拉取完成：获取${data.fetched}条公告，匹配${data.matched}条`)
    fetchData()
  } catch (error) {
    ElMessage.error('拉取公告失败')
  } finally {
    loading.value = false
  }
}

async function handleBatchAuditPass() {
  ElMessage.warning('请在表格中选择需要审核的记录')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.stock-status-sync-page {
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

        &.status-auto {
          color: #67C23A;
        }

        &.status-manual {
          color: #409EFF;
        }

        &.status-pending {
          color: #E6A23C;
        }

        &.status-approved {
          color: #67C23A;
        }

        &.status-risk {
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

  .stock-code-cell {
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

  .status-icon {
    &.locked,
    &.not-pushed {
      color: #F56C6C;
    }

    &.unlocked,
    &.pushed {
      color: #67C23A;
    }
  }
}
</style>
