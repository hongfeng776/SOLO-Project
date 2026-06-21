<template>
  <div class="stock-classification-page">
    <div class="status-banner">
      <div class="banner-item">
        <span class="banner-label">分类总数：</span>
        <span class="banner-value">{{ stats.total }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">生效：</span>
        <span class="banner-value status-active">{{ stats.active }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">未生效：</span>
        <span class="banner-value status-inactive">{{ stats.inactive }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">已合并：</span>
        <span class="banner-value status-merged">{{ stats.merged }}</span>
      </div>
      <div class="banner-item">
        <span class="banner-label">已作废：</span>
        <span class="banner-value status-invalid">{{ stats.invalid }}</span>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <el-button v-if="hasPerm('stockClass:create')" type="primary" :icon="Plus" @click="handleCreate">
        新建分类
      </el-button>
      <el-button v-if="hasPerm('stockClass:batch')" type="success" :icon="Switch" @click="handleBatchMigrate">
        批量迁移
      </el-button>
      <el-button v-if="hasPerm('stockClass:invalidate')" type="danger" :icon="CircleClose" @click="handleBatchInvalidate">
        批量作废
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
      <template #classCode="{ row }">
        <div class="stock-code-cell">
          <span class="code-text">{{ row.classCode }}</span>
          <el-tag
            v-if="row.classStatus"
            size="small"
            :type="STOCK_CLASS_STATUS_TAG_TYPES[row.classStatus as StockClassStatus]"
            class="status-tag"
          >
            {{ STOCK_CLASS_STATUS_LABELS[row.classStatus as StockClassStatus] }}
          </el-tag>
        </div>
      </template>

      <template #className="{ row }">
        <div class="stock-name-cell">
          <span
            class="level-dot"
            :style="{ backgroundColor: STOCK_CLASS_LEVEL_COLORS[row.classLevel as StockClassLevel] || '#909399' }"
          />
          <span class="name-text">{{ row.className }}</span>
        </div>
      </template>

      <template #classLevel="{ row }">
        <el-tag
          v-if="row.classLevel"
          size="small"
          effect="plain"
          :style="getClassLevelStyle(row.classLevel)"
        >
          {{ STOCK_CLASS_LEVEL_LABELS[row.classLevel as StockClassLevel] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #classStatus="{ row }">
        <el-tag
          v-if="row.classStatus"
          size="small"
          :type="STOCK_CLASS_STATUS_TAG_TYPES[row.classStatus as StockClassStatus]"
        >
          {{ STOCK_CLASS_STATUS_LABELS[row.classStatus as StockClassStatus] }}
        </el-tag>
        <span v-else>--</span>
      </template>

      <template #action="{ row }">
        <el-button
          type="primary"
          link
          :icon="View"
          @click="handleAdjust(row)"
        >
          调整
        </el-button>
        <el-button
          type="success"
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

    <StockClassCreateDialog
      v-model:visible="createDialogVisible"
      :edit-data="currentEditData"
      @success="fetchData"
    />

    <StockClassAdjustDialog
      v-model:visible="adjustDialogVisible"
      :class-id="currentAdjustId"
      @refresh="fetchData"
    />

    <StockClassBatchDialog
      v-model:visible="batchDialogVisible"
      @success="fetchData"
    />

    <StockClassTraceDialog
      v-model:visible="traceDialogVisible"
      :class-id="currentTraceId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Switch, CircleClose, View, Delete, Tickets } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  STOCK_CLASS_LEVEL_LABELS,
  STOCK_CLASS_LEVEL_COLORS,
  STOCK_CLASS_STATUS_LABELS,
  STOCK_CLASS_STATUS_TAG_TYPES,
  STOCK_CLASS_FIELD_LABELS,
} from '@/constants/dictionaries'
import { StockClassLevel, StockClassStatus } from '@/enums'
import { formatVolume } from '@/utils/format'
import * as stockClassApi from '@/api/stockClassification'
import type { IStockClassification, IPaginatedData } from '@/types/api'
import type { ITableColumn } from '@/types/components'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'
import StockClassCreateDialog from './StockClassCreateDialog.vue'
import StockClassAdjustDialog from './StockClassAdjustDialog.vue'
import StockClassBatchDialog from './StockClassBatchDialog.vue'
import StockClassTraceDialog from './StockClassTraceDialog.vue'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<IStockClassification[]>([])
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
  active: 0,
  inactive: 0,
  merged: 0,
  invalid: 0,
})

const createDialogVisible = ref(false)
const currentEditData = ref<IStockClassification | null>(null)

const adjustDialogVisible = ref(false)
const currentAdjustId = ref<number | null>(null)

const batchDialogVisible = ref(false)

const traceDialogVisible = ref(false)
const currentTraceId = ref<number | null>(null)

const parentOptions = ref<Array<{ value: string | number; label: string }>>([])

const filterConfig = [
  { prop: 'keyword', label: '关键词', type: 'input' as const, placeholder: '分类编码/名称' },
  {
    prop: 'classLevel',
    label: '分类层级',
    type: 'select' as const,
    options: Object.entries(STOCK_CLASS_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'classStatus',
    label: '分类状态',
    type: 'select' as const,
    options: Object.entries(STOCK_CLASS_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'parentId',
    label: '上级分类',
    type: 'select' as const,
    options: parentOptions,
  },
]

const tableColumns: ITableColumn[] = [
  { prop: 'classCode', label: '分类编码', width: 150, fixed: 'left', slot: 'classCode' },
  { prop: 'className', label: '分类名称', width: 160, fixed: 'left', slot: 'className' },
  { prop: 'classLevel', label: '分类层级', width: 120, slot: 'classLevel' },
  { prop: 'parentName', label: '上级分类', width: 120 },
  { prop: 'classStatus', label: '分类状态', width: 100, slot: 'classStatus' },
  { prop: 'productCount', label: '关联产品数', width: 100 },
  { prop: 'riskTag', label: '风险标签', width: 100 },
  { prop: 'marketCapRange', label: '市值区间', width: 140 },
  { prop: 'sortOrder', label: '排序号', width: 80 },
  { prop: 'createdAt', label: '创建时间', width: 110, type: 'date' },
  { prop: 'action', label: '操作', width: 240, fixed: 'right', slot: 'action' },
]

function getClassLevelStyle(classLevel: string) {
  const color = STOCK_CLASS_LEVEL_COLORS[classLevel as StockClassLevel] || '#909399'
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
    const res = await stockClassApi.getList(params)
    const data = res.data as IPaginatedData<IStockClassification>
    tableData.value = data.list
    pagination.total = data.total
    updateStats(data.list)
  } catch (error) {
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

function updateStats(list: IStockClassification[]) {
  stats.total = pagination.total
  stats.active = list.filter(item => item.classStatus === StockClassStatus.ACTIVE).length
  stats.inactive = list.filter(item => item.classStatus === StockClassStatus.INACTIVE).length
  stats.merged = list.filter(item => item.classStatus === StockClassStatus.MERGED).length
  stats.invalid = list.filter(item => item.classStatus === StockClassStatus.INVALID).length
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

function handleAdjust(row: IStockClassification) {
  currentAdjustId.value = row.id
  adjustDialogVisible.value = true
}

function handleTrace(row: IStockClassification) {
  currentTraceId.value = row.id
  traceDialogVisible.value = true
}

async function handleDelete(row: IStockClassification) {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${row.className}"吗？`, '删除确认', {
      type: 'warning',
    })
    await stockClassApi.deleteFn(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

function handleBatchMigrate() {
  batchDialogVisible.value = true
}

function handleBatchInvalidate() {
  batchDialogVisible.value = true
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.stock-classification-page {
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

        &.status-active {
          color: #67C23A;
        }

        &.status-inactive {
          color: #909399;
        }

        &.status-merged {
          color: #409EFF;
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

    .level-dot {
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
