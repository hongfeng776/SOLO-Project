<template>
  <div class="risk-record">
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
        <el-button type="primary" :disabled="selectedRows.length === 0" @click="handleBatchProcess">
          <el-icon><Check /></el-icon>
          批量处理
        </el-button>
      </template>

      <el-table-column prop="ruleName" label="规则名称" width="160" />
      <el-table-column prop="targetType" label="对象类型" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.targetType" :status-map="RiskTargetTypeMap" />
        </template>
      </el-table-column>
      <el-table-column prop="targetName" label="对象名称" width="120" />
      <el-table-column prop="category" label="风险类别" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.category" :status-map="RiskCategoryMap" />
        </template>
      </el-table-column>
      <el-table-column prop="severity" label="严重等级" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.severity" :status-map="RiskSeverityMap" :color-map="RiskSeverityColorMap" />
        </template>
      </el-table-column>
      <el-table-column prop="action" label="处置动作" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.action" :status-map="RiskActionMap" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="处理状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.status === 0 ? 'warning' : row.status === 1 ? 'success' : 'info'"
            size="small"
          >
            {{ RiskRecordStatusMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="handler" label="处理人" width="100" />
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleProcess(row)">处理</el-button>
          <el-button type="info" link size="small" @click="handleDetail(row)">查看详情</el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <AuditDialog
      v-model="auditVisible"
      title="风控记录处理"
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
  getRiskRecordsApi,
  handleRiskRecordApi
} from '@/api/risk'
import {
  RiskTargetTypeMap,
  RiskCategoryMap,
  RiskSeverityMap,
  RiskSeverityColorMap,
  RiskActionMap,
  RiskRecordStatusMap
} from '@/enums/risk'
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
  targetType: undefined as number | undefined,
  severity: undefined as number | undefined,
  status: undefined as number | undefined
})

const searchFields = [
  { prop: 'targetType', label: '对象类型', type: 'select', options: [
    { value: 1, label: '订单' },
    { value: 2, label: '司机' },
    { value: 3, label: '乘客' },
    { value: 4, label: '车辆' }
  ]},
  { prop: 'severity', label: '严重等级', type: 'select', options: [
    { value: 1, label: '低' },
    { value: 2, label: '中' },
    { value: 3, label: '高' }
  ]},
  { prop: 'status', label: '处理状态', type: 'select', options: [
    { value: 0, label: '待处理' },
    { value: 1, label: '已处理' },
    { value: 2, label: '已忽略' }
  ]}
]

const auditVisible = ref(false)
const auditLoading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const res = await getRiskRecordsApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取风控记录列表失败')
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
  queryParams.targetType = undefined
  queryParams.severity = undefined
  queryParams.status = undefined
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

const handleProcess = (row: any) => {
  currentId.value = row.id
  auditVisible.value = true
}

const handleDetail = (row: any) => {
  ElMessage.info('查看详情功能开发中')
}

const handleAuditSubmit = async (formData: any) => {
  auditLoading.value = true
  try {
    await handleRiskRecordApi(currentId.value, formData)
    ElMessage.success('处理成功')
    auditVisible.value = false
    getList()
  } catch (error: any) {
    ElMessage.error(error.message || '处理失败')
  } finally {
    auditLoading.value = false
  }
}

const handleBatchProcess = () => {
  ElMessageBox.confirm(`确定要批量处理选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await Promise.all(selectedRows.value.map(row => handleRiskRecordApi(row.id, { auditStatus: 1, remark: '批量处理' })))
      ElMessage.success('批量处理成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '批量处理失败')
    }
  })
}

onMounted(() => {
  getList()
})
</script>
