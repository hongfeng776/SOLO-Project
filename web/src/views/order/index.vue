<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="订单号">
          <el-input
            v-model="queryParams.orderNo"
            placeholder="请输入订单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select
            v-model="queryParams.channelId"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in channelOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="推客">
          <el-select
            v-model="queryParams.promoterId"
            placeholder="请选择"
            filterable
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in promoterOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in ORDER_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <BaseBatchOperation
        :selected-count="selectedIds.length"
        @clear="handleClearSelection"
      >
        <el-button
          type="primary"
          size="small"
          :icon="Van"
          :disabled="selectedIds.length === 0"
          @click="handleBatchShip"
        >
          批量发货
        </el-button>
        <el-button
          size="small"
          :icon="Edit"
          :disabled="selectedIds.length === 0"
          @click="handleBatchStatusChange"
        >
          批量修改状态
        </el-button>
      </BaseBatchOperation>

      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        show-selection
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Download" @click="handleExport">导出</el-button>
          </div>
        </template>
        <el-table-column prop="orderNo" label="订单号" min-width="180" />
        <el-table-column label="商品信息" min-width="220">
          <template #default="{ row }">
            <div class="product-info">
              <el-image
                v-if="(row as OrderItem).productImage"
                :src="(row as OrderItem).productImage"
                :preview-src-list="[(row as OrderItem).productImage as string]"
                fit="cover"
                style="width: 48px; height: 48px; border-radius: 4px; flex-shrink: 0"
              />
              <div class="product-detail">
                <div class="product-name">{{ (row as OrderItem).productName }}</div>
                <div class="product-sku" v-if="(row as OrderItem).productSku">SKU: {{ (row as OrderItem).productSku }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="amount" label="金额" width="100" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney((row as OrderItem).amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="commission" label="佣金" width="100" align="right">
          <template #default="{ row }">
            <span class="text-success">¥{{ formatMoney((row as OrderItem).commission) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="channelName" label="渠道" width="100" />
        <el-table-column prop="promoterName" label="推客" width="100" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="ORDER_STATUS_MAP[(row as OrderItem).status as any]?.type || 'info'">
              {{ ORDER_STATUS_MAP[(row as OrderItem).status as any]?.label || (row as OrderItem).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as OrderItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleDetail(row as OrderItem)">详情</el-button>
            <el-dropdown
              trigger="click"
              @command="(val: number) => handleStatusChange(row as OrderItem, val)"
            >
              <el-button type="warning" link>
                修改状态
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="item in ORDER_STATUS_OPTIONS" :key="item.value" :command="item.value">
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="detailVisible"
      title="订单详情"
      width="700px"
      :show-footer="false"
    >
      <el-descriptions v-if="detailData" :column="2" border size="small">
        <el-descriptions-item label="订单号" :span="2">
          <span class="copy-text" @click="copyText(detailData.orderNo)">
            {{ detailData.orderNo }}
            <el-icon class="ml-1"><DocumentCopy /></el-icon>
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ detailData.productName }}</el-descriptions-item>
        <el-descriptions-item label="商品SKU">{{ detailData.productSku || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ detailData.quantity }}</el-descriptions-item>
        <el-descriptions-item label="商品金额">¥{{ formatMoney(detailData.amount) }}</el-descriptions-item>
        <el-descriptions-item label="佣金比例">{{ (detailData.commissionRate * 100).toFixed(2) }}%</el-descriptions-item>
        <el-descriptions-item label="佣金金额">
          <span class="text-success">¥{{ formatMoney(detailData.commission) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detailData.channelName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="推客">{{ detailData.promoterName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="ORDER_STATUS_MAP[detailData.status as any]?.type || 'info'">
            {{ ORDER_STATUS_MAP[detailData.status as any]?.label || detailData.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDateTime(detailData.payTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发货时间">{{ formatDateTime((detailData as any).shipTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDateTime(detailData.completeTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ formatDateTime(detailData.cancelTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="退款时间">{{ formatDateTime(detailData.refundTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshRight,
  Download,
  View,
  Edit,
  Van,
  ArrowDown,
  DocumentCopy,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import { ORDER_STATUS_OPTIONS, ORDER_STATUS_MAP } from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getChannelList } from '@/api/channel'
import { getPromoterList } from '@/api/promoter'
import {
  getOrderList,
  exportOrders,
  batchUpdateOrders,
  updateOrderStatus,
  getOrder,
  type OrderItem,
  type OrderQueryParams,
} from '@/api/order'

const channelOptions = ref<Array<{ id: number | string; name: string }>>([])
const promoterOptions = ref<Array<{ id: number | string; name: string }>>([])
const dateRange = ref<string[]>([])

async function fetchChannelOptions() {
  try {
    const res = await getChannelList({ page: 1, pageSize: 999, status: 1 as any })
    channelOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch channels error:', error)
  }
}

async function fetchPromoterOptions() {
  try {
    const res = await getPromoterList({ page: 1, pageSize: 999, status: 1 as any })
    promoterOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch promoters error:', error)
  }
}

onMounted(() => {
  fetchChannelOptions()
  fetchPromoterOptions()
})

const {
  loading,
  dataList,
  total,
  selectedIds,
  pagination,
  queryParams,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange,
  fetchData,
} = useTable<OrderItem, OrderQueryParams>({
  fetchApi: getOrderList,
})

function handleSearch() {
  if (dateRange.value?.length === 2) {
    queryParams.startDate = dateRange.value[0]
    queryParams.endDate = dateRange.value[1]
  } else {
    queryParams.startDate = undefined
    queryParams.endDate = undefined
  }
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(queryParams).forEach((key) => {
    if (key !== 'page' && key !== 'pageSize') {
      ;(queryParams as any)[key] = undefined
    }
  })
  dateRange.value = []
  handleSearch()
}

function handleClearSelection() {
  selectedIds.value = []
}

const detailVisible = ref(false)
const detailData = ref<OrderItem | null>(null)

async function handleDetail(row: OrderItem) {
  try {
    detailData.value = await getOrder(row.id)
    detailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const STATUS_TRANSITION_MAP: Record<number, number[]> = {
  0: [1, 4],
  1: [2, 4, 5],
  2: [3, 5],
  3: [5],
  5: [6, 3],
  4: [],
  6: [],
}

async function handleStatusChange(row: OrderItem, status: number) {
  const currentStatus = Number(row.status)
  const allowed = STATUS_TRANSITION_MAP[currentStatus] || []

  if (!allowed.includes(status)) {
    ElMessage.warning(
      `订单状态不能从【${ORDER_STATUS_MAP[currentStatus]?.label}】变更为【${ORDER_STATUS_MAP[status]?.label}】`
    )
    return
  }

  let confirmMsg = `确定要将订单【${row.orderNo}】状态修改为【${ORDER_STATUS_MAP[status]?.label}】吗？`

  if (status === 1) {
    confirmMsg = `订单支付后将自动核算推客佣金，确定要将订单【${row.orderNo}】标记为已支付吗？`
  } else if (status === 3) {
    confirmMsg = `订单完成后将自动结算关联佣金，确定要将订单【${row.orderNo}】标记为已完成吗？`
  } else if (status === 4 || status === 6) {
    confirmMsg = `订单取消/退款后将自动扣减关联佣金，确定要将订单【${row.orderNo}】状态修改为【${ORDER_STATUS_MAP[status]?.label}】吗？`
  }

  try {
    await ElMessageBox.confirm(confirmMsg, '状态确认', { type: 'warning' })
    await updateOrderStatus(row.id, status)
    ElMessage.success('状态修改成功')
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

async function handleBatchShip() {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedIds.value.length} 个订单批量发货吗？`,
      '批量发货确认',
      { type: 'warning' }
    )
    await batchUpdateOrders(selectedIds.value, { status: 2 as any })
    ElMessage.success('批量发货成功')
    selectedIds.value = []
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

async function handleBatchStatusChange() {
  if (selectedIds.value.length === 0) return
  ;(ElMessageBox as any).prompt('请选择要修改为的状态', '批量修改状态', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'select',
    inputValue: 1,
    inputOptions: ORDER_STATUS_OPTIONS.map((item) => ({
      value: item.value,
      label: item.label,
    })),
    inputValidator: (value: any) => {
      if (value === '' || value === undefined || value === null) {
        return '请选择状态'
      }
      return true
    },
  })
    .then(async ({ value }: any) => {
      try {
        await batchUpdateOrders(selectedIds.value, { status: value as any })
        ElMessage.success('批量修改成功')
        selectedIds.value = []
        fetchData()
      } catch (error) {
        console.error(error)
      }
    })
    .catch(() => {})
}

async function handleExport() {
  try {
    const params = { ...queryParams }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    ElMessage.info('导出中，请稍候...')
    await exportOrders(params)
    ElMessage.success('导出成功')
  } catch (error) {
    console.error(error)
  }
}

function copyText(text: string) {
  navigator.clipboard?.writeText(text)
  ElMessage.success('已复制到剪贴板')
}
</script>

<style scoped lang="scss">
.page-container {
  .search-form {
    margin-bottom: 0;
  }

  .table-toolbar {
    display: flex;
    gap: 12px;
  }
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;

  .product-detail {
    flex: 1;
    min-width: 0;

    .product-name {
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .product-sku {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }
}

.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}

.copy-text {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  color: var(--el-color-primary);

  &:hover {
    text-decoration: underline;
  }
}

.ml-1 {
  margin-left: 4px;
}
</style>
