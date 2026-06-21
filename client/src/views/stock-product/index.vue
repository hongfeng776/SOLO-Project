<template>
  <div class="stock-product-page">
    <div class="status-banner">
      <div class="banner-item">
        <span class="banner-label">产品总数：</span>
        <span class="banner-value">{{ stats.total }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">正常：</span>
        <span class="banner-value status-normal">{{ stats.normal }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">停牌：</span>
        <span class="banner-value status-suspended">{{ stats.suspended }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">退市：</span>
        <span class="banner-value status-delisted">{{ stats.delisted }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">暂停交易：</span>
        <span class="banner-value status-paused">{{ stats.paused }}</span>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <el-button v-if="hasPerm('stockProduct:create')" type="primary" :icon="Plus" @click="handleArchive">
        新增建档
      </el-button>
      <el-button v-if="hasPerm('stockProduct:import')" type="success" :icon="Upload" @click="handleImport">
        批量导入
      </el-button>
      <el-button :icon="Download" @click="handleExport">
        导出
      </el-button>

      <div class="toolbar-right">
        <div class="stats-display">
          <span class="stat-item">
            <span class="stat-label">总计</span>
            <span class="stat-value">{{ stats.total }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">正常</span>
            <span class="stat-value stat-normal">{{ stats.normal }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">停牌</span>
            <span class="stat-value stat-suspended">{{ stats.suspended }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">退市</span>
            <span class="stat-value stat-delisted">{{ stats.delisted }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">暂停</span>
            <span class="stat-value stat-paused">{{ stats.paused }}</span>
          </span>
        </div>
      </div>
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
          <span class="code-text">{{ row.stockCode }}</span>
          <el-tag
            v-if="row.productStatus"
            size="small"
            :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.productStatus as StockProductStatus]"
            class="status-tag"
          >
            {{ STOCK_PRODUCT_STATUS_LABELS[row.productStatus as StockProductStatus] }}
          </el-tag>
        </div>
      </template>

      <template #stockName="{ row }">
        <div class="stock-name-cell">
          <span
            class="sector-dot"
            :style="{ backgroundColor: SECTOR_COLORS[row.sector] || '#909399' }"
          />
          <span class="name-text">{{ row.stockName }}</span>
        </div>
      </template>

      <template #productType="{ row }">
        <el-tag
          v-if="row.productType"
          size="small"
          effect="plain"
          :style="getProductTypeStyle(row.productType)"
        >
          {{ STOCK_PRODUCT_TYPE_LABELS[row.productType as StockProductType] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #market="{ row }">
        {{ MARKET_LABELS[row.market as keyof typeof MARKET_LABELS] || '--' }}
      </template>

      <template #sector="{ row }">
        <el-tag
          v-if="row.sector"
          size="small"
          effect="plain"
          :style="getSectorTagStyle(row.sector)"
        >
          {{ row.sector }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #productStatus="{ row }">
        <el-tag
          v-if="row.productStatus"
          size="small"
          :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.productStatus as StockProductStatus]"
        >
          {{ STOCK_PRODUCT_STATUS_LABELS[row.productStatus as StockProductStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #filingStatus="{ row }">
        <el-tag
          v-if="row.filingStatus"
          size="small"
          :type="STOCK_PRODUCT_FILING_STATUS_COLORS[row.filingStatus as StockProductFilingStatus] as any"
        >
          {{ STOCK_PRODUCT_FILING_STATUS_LABELS[row.filingStatus as StockProductFilingStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #archiveStatus="{ row }">
        <el-tag
          v-if="row.archiveStatus"
          size="small"
          :type="STOCK_PRODUCT_ARCHIVE_STATUS_COLORS[row.archiveStatus as StockProductArchiveStatus] as any"
        >
          {{ STOCK_PRODUCT_ARCHIVE_STATUS_LABELS[row.archiveStatus as StockProductArchiveStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #totalShares="{ row }">
        {{ formatVolume(row.totalShares) }}
      </template>

      <template #action="{ row }">
        <el-button type="primary" link :icon="View" @click="handleView(row)">查看</el-button>
        <el-button
          v-if="hasPerm('stockProduct:edit')"
          type="primary"
          link
          :icon="Edit"
          @click="handleEdit(row)"
        >
          编辑
        </el-button>
        <el-button
          v-if="hasPerm('stockProduct:trail')"
          type="success"
          link
          :icon="Tickets"
          @click="handleAuditTrail(row)"
        >
          溯源
        </el-button>
        <el-button
          v-if="hasPerm('stockProduct:delete')"
          type="danger"
          link
          :icon="Delete"
          @click="handleDelete(row)"
        >
          删除
        </el-button>
      </template>
    </FinTable>

    <StockProductArchiveDialog
      v-model:visible="archiveDialogVisible"
      :edit-data="currentEditData"
      @success="fetchData"
    />

    <StockProductProfileDialog
      v-model:visible="profileDialogVisible"
      :product-id="currentProfileId"
      @refresh="fetchData"
    />

    <StockProductBatchImportDialog
      v-model:visible="importDialogVisible"
      @success="fetchData"
    />

    <StockProductAuditTrailDialog
      v-model:visible="auditTrailVisible"
      :product-id="currentAuditId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Download, View, Edit, Delete, Tickets } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  MARKET_LABELS,
  STOCK_PRODUCT_TYPE_LABELS,
  STOCK_PRODUCT_TYPE_COLORS,
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_PRODUCT_ARCHIVE_STATUS_LABELS,
  STOCK_PRODUCT_ARCHIVE_STATUS_COLORS,
  STOCK_PRODUCT_FILING_STATUS_LABELS,
  STOCK_PRODUCT_FILING_STATUS_COLORS,
  SECTOR_COLORS,
  MARKET_SECTOR_LIST,
} from '@/constants/dictionaries'
import { StockProductStatus, StockProductArchiveStatus, StockProductFilingStatus, StockProductType } from '@/enums'
import { formatVolume } from '@/utils/format'
import * as stockProductApi from '@/api/stockProduct'
import type { IStockProduct, IPaginatedData } from '@/types/api'
import type { ITableColumn } from '@/types/components'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'
import StockProductArchiveDialog from './StockProductArchiveDialog.vue'
import StockProductProfileDialog from './StockProductProfileDialog.vue'
import StockProductBatchImportDialog from './StockProductBatchImportDialog.vue'
import StockProductAuditTrailDialog from './StockProductAuditTrailDialog.vue'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<IStockProduct[]>([])
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
  normal: 0,
  suspended: 0,
  delisted: 0,
  paused: 0,
})

const archiveDialogVisible = ref(false)
const currentEditData = ref<IStockProduct | null>(null)

const importDialogVisible = ref(false)

const auditTrailVisible = ref(false)
const currentAuditId = ref<number | null>(null)

const profileDialogVisible = ref(false)
const currentProfileId = ref<number | null>(null)

const filterConfig = [
  { prop: 'keyword', label: '关键词', type: 'input' as const, placeholder: '股票代码/名称/产品编码' },
  {
    prop: 'productType',
    label: '产品类型',
    type: 'select' as const,
    options: Object.entries(STOCK_PRODUCT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'market',
    label: '市场',
    type: 'select' as const,
    options: Object.entries(MARKET_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'productStatus',
    label: '产品状态',
    type: 'select' as const,
    options: Object.entries(STOCK_PRODUCT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'filingStatus',
    label: '备案状态',
    type: 'select' as const,
    options: Object.entries(STOCK_PRODUCT_FILING_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'archiveStatus',
    label: '建档状态',
    type: 'select' as const,
    options: Object.entries(STOCK_PRODUCT_ARCHIVE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'sector',
    label: '板块',
    type: 'select' as const,
    options: MARKET_SECTOR_LIST.map(s => ({ value: s, label: s })),
  },
]

const tableColumns: ITableColumn[] = [
  { prop: 'stockCode', label: '股票代码', width: 150, fixed: 'left', slot: 'stockCode' },
  { prop: 'stockName', label: '股票名称', width: 160, fixed: 'left', slot: 'stockName' },
  { prop: 'productType', label: '产品类型', width: 90, slot: 'productType' },
  { prop: 'productCode', label: '产品编码', width: 140 },
  { prop: 'market', label: '市场', width: 80, slot: 'market' },
  { prop: 'sector', label: '板块', width: 80, slot: 'sector' },
  { prop: 'productStatus', label: '产品状态', width: 100, slot: 'productStatus' },
  { prop: 'filingStatus', label: '备案状态', width: 100, slot: 'filingStatus' },
  { prop: 'archiveStatus', label: '建档状态', width: 90, slot: 'archiveStatus' },
  { prop: 'tradingRule', label: '交易规则', width: 80 },
  { prop: 'feeStandard', label: '费率标准', width: 100 },
  { prop: 'listingDate', label: '上市日期', width: 110, type: 'date' },
  { prop: 'faceValue', label: '面值', width: 80, type: 'money', precision: 2 },
  { prop: 'totalShares', label: '总股本', width: 120, slot: 'totalShares' },
  { prop: 'action', label: '操作', width: 240, fixed: 'right', slot: 'action' },
]

function getProductTypeStyle(productType: string) {
  const color = STOCK_PRODUCT_TYPE_COLORS[productType as StockProductType] || '#909399'
  return {
    backgroundColor: `${color}20`,
    color,
    borderColor: `${color}50`,
  }
}

function getSectorTagStyle(sector: string) {
  const color = SECTOR_COLORS[sector] || '#909399'
  return {
    borderColor: `${color}50`,
    color,
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
    const res = await stockProductApi.getList(params)
    const data = res.data as IPaginatedData<IStockProduct>
    tableData.value = data.list
    pagination.total = data.total
    updateStats(data.list)
  } catch (error) {
    ElMessage.error('获取产品列表失败')
  } finally {
    loading.value = false
  }
}

function updateStats(list: IStockProduct[]) {
  stats.total = pagination.total
  stats.normal = list.filter(item => item.productStatus === StockProductStatus.NORMAL).length
  stats.suspended = list.filter(item => item.productStatus === StockProductStatus.SUSPENDED).length
  stats.delisted = list.filter(item => item.productStatus === StockProductStatus.DELISTED).length
  stats.paused = list.filter(item => item.productStatus === StockProductStatus.PAUSED).length
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

function handleArchive() {
  currentEditData.value = null
  archiveDialogVisible.value = true
}

function handleEdit(row: IStockProduct) {
  currentEditData.value = row
  archiveDialogVisible.value = true
}

function handleView(row: IStockProduct) {
  currentProfileId.value = row.id
  profileDialogVisible.value = true
}

async function handleDelete(row: IStockProduct) {
  try {
    await ElMessageBox.confirm(`确定要删除产品"${row.stockName}"吗？`, '删除确认', {
      type: 'warning',
    })
    await stockProductApi.deleteFn(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function handleAuditTrail(row: IStockProduct) {
  currentAuditId.value = row.id
  auditTrailVisible.value = true
}

function handleImport() {
  importDialogVisible.value = true
}

async function handleExport() {
  try {
    const params = { ...searchParams }
    const res = await stockProductApi.exportStockProducts(params)
    const blob = new Blob([res.data as BlobPart], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `产品建档数据_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.stock-product-page {
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

        &.status-normal {
          color: #67C23A;
        }

        &.status-suspended {
          color: #E6A23C;
        }

        &.status-delisted {
          color: #F56C6C;
        }

        &.status-paused {
          color: #909399;
        }
      }
    }
  }

  .table-toolbar {
    margin-bottom: 16px;
    display: flex;
    gap: 8px;
    align-items: center;

    .toolbar-right {
      margin-left: auto;
      display: flex;
      gap: 8px;
      align-items: center;

      .stats-display {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 6px 16px;
        background: #fff;
        border-radius: 4px;
        border: 1px solid #ebeef5;

        .stat-item {
          display: flex;
          gap: 4px;
          align-items: center;
          font-size: 13px;

          .stat-label {
            color: #909399;
          }

          .stat-value {
            font-weight: 600;
            color: #1f2d3d;

            &.stat-normal {
              color: #67C23A;
            }

            &.stat-suspended {
              color: #E6A23C;
            }

            &.stat-delisted {
              color: #F56C6C;
            }

            &.stat-paused {
              color: #909399;
            }
          }
        }
      }
    }
  }

  .stock-code-cell {
    display: flex;
    align-items: center;
    gap: 6px;

    .code-text {
      font-family: 'Consolas', 'Monaco', monospace;
      font-weight: 600;
      color: #1f2d3d;
    }

    .status-tag {
      margin-left: 4px;
      font-size: 11px;
      padding: 0 6px;
      height: 18px;
      line-height: 16px;
    }
  }

  .stock-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .sector-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .name-text {
      font-weight: 500;
      color: #1f2d3d;
    }
  }
}
</style>
