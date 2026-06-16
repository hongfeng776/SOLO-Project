<template>
  <div class="order-list">
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
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增订单
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>
          批量删除
        </el-button>
      </template>

      <template #toolbar-right>
        <el-button @click="getList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>

      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column label="乘客信息" width="160">
        <template #default="{ row }">
          <div>{{ row.passengerName }}</div>
          <div class="sub-text">{{ formatPhone(row.passengerPhone) }}</div>
        </template>
      </el-table-column>
      <el-table-column label="司机信息" width="160">
        <template #default="{ row }">
          <div>{{ row.driverName || '-' }}</div>
          <div class="sub-text">{{ row.driverPhone ? formatPhone(row.driverPhone) : '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="起点" show-overflow-tooltip>
        <template #default="{ row }">{{ row.startAddress }}</template>
      </el-table-column>
      <el-table-column label="终点" show-overflow-tooltip>
        <template #default="{ row }">{{ row.endAddress }}</template>
      </el-table-column>
      <el-table-column prop="actualPrice" label="金额" width="100" align="right">
        <template #default="{ row }">
          <span class="price">¥{{ row.actualPrice || row.estimatedPrice || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.status"
            :status-map="OrderStatusMap"
            :color-map="OrderStatusColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <DetailDialog
      v-model="detailVisible"
      title="订单详情"
      :fields="detailFields"
      :detail-data="currentDetail"
      :loading="detailLoading"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import DetailDialog from '@/components/DetailDialog/index.vue'
import {
  getOrderListApi,
  deleteOrderApi,
  getOrderDetailApi
} from '@/api/order'
import { OrderStatusMap, OrderStatusColorMap } from '@/enums/order'
import { formatDate, formatPhone } from '@/utils/format'
import type { Order } from '@/types/order'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<Order[]>([])
const total = ref(0)
const selectedRows = ref<Order[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  orderNo: '',
  status: undefined as number | undefined,
  passengerName: '',
  driverName: ''
})

const searchFields = [
  { prop: 'orderNo', label: '订单号', type: 'input' },
  { prop: 'status', label: '订单状态', type: 'select', options: [
    { value: 1, label: '待接单' },
    { value: 2, label: '已派单' },
    { value: 3, label: '接驾中' },
    { value: 4, label: '行程中' },
    { value: 5, label: '已完成' },
    { value: 6, label: '已取消' },
    { value: 7, label: '已过期' }
  ]},
  { prop: 'passengerName', label: '乘客姓名', type: 'input' },
  { prop: 'driverName', label: '司机姓名', type: 'input' }
]

const detailFields = [
  { prop: 'orderNo', label: '订单号' },
  { prop: 'status', label: '订单状态', type: 'status', statusMap: OrderStatusMap, colorMap: OrderStatusColorMap },
  { prop: 'passengerName', label: '乘客姓名' },
  { prop: 'passengerPhone', label: '乘客电话' },
  { prop: 'driverName', label: '司机姓名' },
  { prop: 'driverPhone', label: '司机电话' },
  { prop: 'startAddress', label: '起点地址' },
  { prop: 'endAddress', label: '终点地址' },
  { prop: 'distance', label: '距离(公里)' },
  { prop: 'duration', label: '预计时长(分钟)' },
  { prop: 'estimatedPrice', label: '预估金额', type: 'money' },
  { prop: 'actualPrice', label: '实际金额', type: 'money' },
  { prop: 'createTime', label: '创建时间', type: 'date' },
  { prop: 'acceptTime', label: '接单时间', type: 'date' },
  { prop: 'pickupTime', label: '接驾时间', type: 'date' },
  { prop: 'completeTime', label: '完成时间', type: 'date' }
]

const detailVisible = ref(false)
const detailLoading = ref(false)
const currentDetail = ref<any>({})

const getList = async () => {
  loading.value = true
  try {
    const res = await getOrderListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  queryParams.orderNo = ''
  queryParams.status = undefined
  queryParams.passengerName = ''
  queryParams.driverName = ''
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

const handleAdd = () => {
  ElMessage.info('新增订单功能开发中')
}

const handleEdit = (row: Order) => {
  ElMessage.info('编辑订单功能开发中')
}

const handleView = async (row: Order) => {
  detailLoading.value = true
  detailVisible.value = true
  try {
    const res = await getOrderDetailApi(row.id)
    currentDetail.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取订单详情失败')
  } finally {
    detailLoading.value = false
  }
}

const handleDelete = (row: Order) => {
  ElMessageBox.confirm('确定要删除该订单吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteOrderApi(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  })
}

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条订单吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('批量删除成功')
    getList()
  })
}

onMounted(() => {
  getList()
})

defineExpose({
  selectedRows
})
</script>

<style lang="scss" scoped>
.order-list {
  .sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .price {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
