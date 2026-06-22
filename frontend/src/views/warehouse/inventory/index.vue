<template>
  <div class="warehouse-inventory">
    <div class="page-header">
      <h2>仓储库存管理</h2>
      <p class="header-desc">数字化精准管控仓储库存全流程</p>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="批次号">
          <el-input v-model="filterForm.batch_no" placeholder="请输入批次号" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="仓储位置">
          <el-select v-model="filterForm.warehouse_location" placeholder="请选择" clearable style="width: 150px">
            <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
          </el-select>
        </el-form-item>
        <el-form-item label="库存类型">
          <el-select v-model="filterForm.inventory_type" placeholder="请选择" clearable style="width: 130px">
            <el-option v-for="(v, k) in InventoryTypeMap" :key="k" :label="v.label" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-form-item label="盘点状态">
          <el-select v-model="filterForm.count_status" placeholder="请选择" clearable style="width: 130px">
            <el-option v-for="(v, k) in CountStatusMap" :key="k" :label="v.label" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品编码">
          <el-input v-model="filterForm.goods_code" placeholder="请输入" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="filterForm.goods_name" placeholder="请输入" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="action-bar">
      <div class="action-left">
        <el-button type="success" @click="showInboundDialog">入库操作</el-button>
        <el-button type="warning" @click="showOutboundDialog">出库操作</el-button>
        <el-button type="info" @click="showCountDialog">库存盘点</el-button>
        <el-button type="primary" @click="showImportDialog">导入盘点</el-button>
      </div>
      <div class="action-right" v-if="selectedRows.length > 0">
        <el-button v-if="batchPermissions.can_count" type="primary" plain @click="handleBatchCount">
          批量盘点 ({{ selectedRows.length }})
        </el-button>
        <el-button v-if="batchPermissions.can_transfer" type="warning" plain @click="handleBatchTransfer">
          批量调拨 ({{ selectedRows.length }})
        </el-button>
        <el-button v-if="batchPermissions.can_alert" type="danger" plain @click="handleBatchAlert">
          批量预警 ({{ selectedRows.length }})
        </el-button>
      </div>
    </div>

    <el-table
      :data="tableData"
      border
      stripe
      @selection-change="handleSelectionChange"
      @column-resize="handleColumnResize"
      style="width: 100%"
    >
      <el-table-column type="selection" width="45" />
      <el-table-column prop="inventory_no" label="库存编号" min-width="140" resizable />
      <el-table-column prop="goods_code" label="商品编码" min-width="110" resizable />
      <el-table-column prop="goods_name" label="商品名称" min-width="130" resizable />
      <el-table-column prop="goods_spec" label="规格" min-width="120" resizable show-overflow-tooltip />
      <el-table-column prop="batch_no" label="批次号" min-width="130" resizable />
      <el-table-column prop="warehouse_location" label="仓储位置" min-width="110" resizable />
      <el-table-column label="系统库存" min-width="100" resizable align="right">
        <template #default="{ row }">
          <span :class="{ 'shake-error': row.diff_quantity && row.diff_quantity !== 0 }">
            {{ formatThousand(row.system_quantity) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="实际库存" min-width="100" resizable align="right">
        <template #default="{ row }">
          {{ formatThousand(row.actual_quantity) }}
        </template>
      </el-table-column>
      <el-table-column label="差异" min-width="80" resizable align="right">
        <template #default="{ row }">
          <span v-if="row.diff_quantity > 0" style="color: #67c23a">+{{ formatThousand(row.diff_quantity) }}</span>
          <span v-else-if="row.diff_quantity < 0" style="color: #f56c6c">{{ formatThousand(row.diff_quantity) }}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <el-table-column label="库存类型" min-width="100" resizable>
        <template #default="{ row }">
          <el-tag :type="getInventoryTypeTag(row.inventory_type)" size="small">
            {{ getInventoryTypeLabel(row.inventory_type) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="盘点状态" min-width="100" resizable>
        <template #default="{ row }">
          <el-tag :type="getCountStatusTag(row.count_status)" size="small" effect="plain">
            {{ getCountStatusLabel(row.count_status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="低库存" min-width="80" resizable align="center">
        <template #default="{ row }">
          <el-icon v-if="row.is_low_stock_alert" color="#f56c6c" size="18"><WarningFilled /></el-icon>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="同步状态" min-width="140" resizable>
        <template #default="{ row }">
          <el-tooltip content="前台商品库存" placement="top">
            <el-tag :type="row.is_synced_front ? 'success' : 'danger'" size="small" style="margin-right:4px">
              前台{{ row.is_synced_front ? '✓' : '✗' }}
            </el-tag>
          </el-tooltip>
          <el-tooltip content="商家库存台账" placement="top">
            <el-tag :type="row.is_synced_merchant ? 'success' : 'danger'" size="small" style="margin-right:4px">
              商家{{ row.is_synced_merchant ? '✓' : '✗' }}
            </el-tag>
          </el-tooltip>
          <el-tooltip content="物流备货数据" placement="top">
            <el-tag :type="row.is_synced_logistics ? 'success' : 'danger'" size="small">
              物流{{ row.is_synced_logistics ? '✓' : '✗' }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="160" resizable fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewTrace(row)">溯源</el-button>
          <el-button type="success" link size="small" @click="handleCorrect(row)">修正</el-button>
          <el-button type="warning" link size="small" @click="handleSync(row)">同步</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-section">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSearch"
        @current-change="handleSearch"
      />
    </div>

    <InboundOutboundDialog
      v-model:visible="inboundDialogVisible"
      mode="inbound"
      @submit="handleInboundSubmit"
    />

    <InboundOutboundDialog
      v-model:visible="outboundDialogVisible"
      mode="outbound"
      @submit="handleOutboundSubmit"
    />

    <InventoryCountDialog
      v-model:visible="countDialogVisible"
      :inventory="currentInventory"
      @submit="handleCountSubmit"
    />

    <InventoryCorrectDialog
      v-model:visible="correctDialogVisible"
      :inventory="currentInventory"
      @submit="handleCorrectSubmit"
    />

    <InventoryImportDialog
      v-model:visible="importDialogVisible"
      @submit="handleImportSubmit"
    />

    <InventoryTraceDialog
      v-model:visible="traceDialogVisible"
      :inventory-id="currentInventoryId"
    />

    <BatchTransferDialog
      v-model:visible="batchTransferDialogVisible"
      :inventory-ids="selectedIds"
      @submit="handleBatchTransferSubmit"
    />

    <BatchAlertDialog
      v-model:visible="batchAlertDialogVisible"
      :inventory-ids="selectedIds"
      @submit="handleBatchAlertSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled } from '@element-plus/icons-vue'
import { queryInventory, getUserPermissions, batchCount, batchLowStockAlert, getRefreshData } from '@/api/warehouseInventoryBatch'
import { syncInventory } from '@/api/warehouseInventoryCount'
import { InventoryTypeMap, CountStatusMap } from '@/types/business'
import InboundOutboundDialog from './components/InboundOutboundDialog.vue'
import InventoryCountDialog from './components/InventoryCountDialog.vue'
import InventoryCorrectDialog from './components/InventoryCorrectDialog.vue'
import InventoryImportDialog from './components/InventoryImportDialog.vue'
import InventoryTraceDialog from './components/InventoryTraceDialog.vue'
import BatchTransferDialog from './components/BatchTransferDialog.vue'
import BatchAlertDialog from './components/BatchAlertDialog.vue'

const filterForm = reactive({
  batch_no: '',
  warehouse_location: '',
  inventory_type: undefined as number | undefined,
  count_status: undefined as number | undefined,
  goods_code: '',
  goods_name: '',
})

const locationOptions = ['A仓-1区', 'A仓-2区', 'B仓-1区', 'B仓-2区', 'C仓-1区']

const tableData = ref<any[]>([])
const selectedRows = ref<any[]>([])
const selectedIds = computed(() => selectedRows.value.map(r => r.id))
const pagination = reactive({ page: 1, pageSize: 20, total: 0 })

const batchPermissions = reactive({
  can_count: false,
  can_transfer: false,
  can_alert: false,
  can_import: false,
})

const inboundDialogVisible = ref(false)
const outboundDialogVisible = ref(false)
const countDialogVisible = ref(false)
const correctDialogVisible = ref(false)
const importDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const batchTransferDialogVisible = ref(false)
const batchAlertDialogVisible = ref(false)

const currentInventory = ref<any>(null)
const currentInventoryId = ref(0)

const formatThousand = (val: number | undefined) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString('zh-CN')
}

const getInventoryTypeLabel = (type: number) => {
  return (InventoryTypeMap as any)[type]?.label || '未知'
}

const getInventoryTypeTag = (type: number) => {
  return (InventoryTypeMap as any)[type]?.type || 'info'
}

const getCountStatusLabel = (status: number) => {
  return (CountStatusMap as any)[status]?.label || '未知'
}

const getCountStatusTag = (status: number) => {
  return (CountStatusMap as any)[status]?.type || 'info'
}

const handleColumnResize = (newWidth: number, oldWidth: number, column: any) => {}

const fetchData = async () => {
  try {
    const res = await queryInventory({
      ...filterForm,
      page: pagination.page,
      page_size: pagination.pageSize,
    })
    const data = res.data?.data
    if (data) {
      tableData.value = data.list || []
      pagination.total = data.total || 0
    }
  } catch (e: any) {
    ElMessage.error('获取数据失败')
  }
}

const loadPermissions = async () => {
  try {
    const res = await getUserPermissions()
    const data = res.data?.data
    if (data) {
      Object.assign(batchPermissions, data)
    }
  } catch {
    Object.assign(batchPermissions, { can_count: true, can_transfer: true, can_alert: true, can_import: true })
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(filterForm, {
    batch_no: '',
    warehouse_location: '',
    inventory_type: undefined,
    count_status: undefined,
    goods_code: '',
    goods_name: '',
  })
  handleSearch()
}

const handleSelectionChange = (rows: any[]) => {
  selectedRows.value = rows
}

const showInboundDialog = () => { inboundDialogVisible.value = true }
const showOutboundDialog = () => { outboundDialogVisible.value = true }
const showCountDialog = () => {
  if (selectedRows.value.length > 0) {
    countDialogVisible.value = true
  } else {
    ElMessage.warning('请先选择要盘点的库存记录')
  }
}
const showImportDialog = () => { importDialogVisible.value = true }

const handleInboundSubmit = async (data: any) => {
  inboundDialogVisible.value = false
  fetchData()
}

const handleOutboundSubmit = async (data: any) => {
  outboundDialogVisible.value = false
  fetchData()
}

const handleCountSubmit = async (data: any) => {
  countDialogVisible.value = false
  fetchData()
}

const handleCorrect = (row: any) => {
  currentInventory.value = row
  correctDialogVisible.value = true
}

const handleCorrectSubmit = async (data: any) => {
  correctDialogVisible.value = false
  fetchData()
}

const handleSync = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确认同步库存数据？将联动更新前台商品库存、商家台账、物流备货数据`, '同步确认', {
      confirmButtonText: '确认同步',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const res = await syncInventory(row.goods_id, row.system_quantity)
    const data = res.data?.data
    if (data) {
      const syncs = []
      if (data.front_synced) syncs.push('前台')
      if (data.merchant_synced) syncs.push('商家')
      if (data.logistics_synced) syncs.push('物流')
      ElMessage.success(`同步完成：${syncs.join('、')}`)
    }
    fetchData()
  } catch {}
}

const handleViewTrace = (row: any) => {
  currentInventoryId.value = row.id
  traceDialogVisible.value = true
}

const handleBatchCount = async () => {
  try {
    await ElMessageBox.confirm(`确认对选中的 ${selectedIds.value.length} 条记录发起批量盘点？`, '批量盘点', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    })
    const res = await batchCount(selectedIds.value)
    const data = res.data?.data
    if (data) {
      ElMessage.success(`批量盘点完成：成功${data.success}条，失败${data.failed}条`)
      if (selectedIds.value.length > 0) {
        const refreshRes = await getRefreshData(selectedIds.value)
        const refreshData = refreshRes.data?.data
        if (refreshData && Array.isArray(refreshData)) {
          refreshData.forEach((item: any) => {
            const idx = tableData.value.findIndex(r => r.id === item.id)
            if (idx !== -1) tableData.value[idx] = { ...tableData.value[idx], ...item }
          })
        }
      }
    }
  } catch {}
}

const handleBatchTransfer = () => {
  batchTransferDialogVisible.value = true
}

const handleBatchTransferSubmit = async (data: any) => {
  batchTransferDialogVisible.value = false
  fetchData()
}

const handleBatchAlert = () => {
  batchAlertDialogVisible.value = true
}

const handleBatchAlertSubmit = async (data: any) => {
  batchAlertDialogVisible.value = false
  fetchData()
}

const handleImportSubmit = async (data: any) => {
  importDialogVisible.value = false
  fetchData()
}

onMounted(() => {
  fetchData()
  loadPermissions()
})
</script>

<style scoped lang="scss">
.warehouse-inventory {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 6px;
    font-size: 20px;
    color: #303133;
  }

  .header-desc {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.shake-error {
  color: #f56c6c;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
</style>
