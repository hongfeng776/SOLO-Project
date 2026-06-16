<template>
  <div class="ticket-list">
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
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增工单
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchClose">
          <el-icon><Close /></el-icon>
          批量关闭
        </el-button>
      </template>

      <el-table-column prop="ticketNo" label="工单号" width="160" />
      <el-table-column prop="orderNo" label="关联订单号" width="160" />
      <el-table-column prop="passengerName" label="乘客姓名" width="100" />
      <el-table-column prop="driverName" label="司机姓名" width="100" />
      <el-table-column prop="type" label="工单类型" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.type" :status-map="TicketTypeMap" />
        </template>
      </el-table-column>
      <el-table-column prop="priority" label="优先级" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.priority" :status-map="TicketPriorityMap" :color-map="TicketPriorityColorMap" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 1 ? 'warning' : row.status === 2 ? '' : row.status === 3 ? 'success' : 'info'"
            size="small"
          >
            {{ TicketStatusMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleProcess(row)">处理</el-button>
          <el-button type="warning" link size="small" @click="handleClose(row)">关闭</el-button>
          <el-button type="info" link size="small" @click="handleDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <AuditDialog
      v-model="auditVisible"
      title="工单处理"
      :loading="auditLoading"
      @submit="handleAuditSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import AuditDialog from '@/components/AuditDialog/index.vue'
import {
  getTicketListApi,
  handleTicketApi,
  closeTicketApi,
  batchCloseTicketApi
} from '@/api/ticket'
import {
  TicketTypeMap,
  TicketPriorityMap,
  TicketPriorityColorMap,
  TicketStatusMap
} from '@/enums/ticket'
import { formatDate } from '@/utils/format'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const selectedRows = ref<any[]>([])
const currentId = ref<number>(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  type: undefined as number | undefined,
  priority: undefined as number | undefined,
  status: undefined as number | undefined,
  ticketNo: ''
})

const searchFields = [
  { prop: 'type', label: '工单类型', type: 'select', options: [
    { value: 1, label: '投诉' },
    { value: 2, label: '退款' },
    { value: 3, label: '异常' },
    { value: 4, label: '咨询' }
  ]},
  { prop: 'priority', label: '优先级', type: 'select', options: [
    { value: 1, label: '低' },
    { value: 2, label: '中' },
    { value: 3, label: '高' },
    { value: 4, label: '紧急' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 1, label: '待处理' },
    { value: 2, label: '处理中' },
    { value: 3, label: '已解决' },
    { value: 4, label: '已关闭' }
  ]},
  { prop: 'ticketNo', label: '工单号', type: 'input' }
]

const auditVisible = ref(false)
const auditLoading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getTicketListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取工单列表失败')
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
  queryParams.type = undefined
  queryParams.priority = undefined
  queryParams.status = undefined
  queryParams.ticketNo = ''
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

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const handleAdd = () => {
  ElMessage.info('新增工单功能开发中')
}

const handleProcess = (row: any) => {
  currentId.value = row.id
  auditVisible.value = true
}

const handleAuditSubmit = async (formData: any) => {
  auditLoading.value = true
  try {
    await handleTicketApi(currentId.value, formData)
    ElMessage.success('处理成功')
    auditVisible.value = false
    getList()
  } catch (error: any) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    auditLoading.value = false
  }
}

const handleClose = (row: any) => {
  ElMessageBox.confirm('确定要关闭该工单吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await closeTicketApi(row.id)
      ElMessage.success('关闭成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '关闭失败')
    }
  })
}

const handleDetail = (row: any) => {
  ElMessage.info('工单详情功能开发中')
}

const handleBatchClose = () => {
  ElMessageBox.confirm(`确定要批量关闭选中的 ${selectedRows.value.length} 条工单吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await batchCloseTicketApi(selectedRows.value.map(row => row.id))
      ElMessage.success('批量关闭成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '批量关闭失败')
    }
  })
}

onMounted(() => {
  getList()
})
</script>
