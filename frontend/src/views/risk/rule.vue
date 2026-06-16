<template>
  <div class="risk-rule">
    <CommonTable
      ref="tableRef"
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :search-fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增规则
        </el-button>
        <el-button @click="getList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>

      <el-table-column prop="name" label="规则名称" width="160" />
      <el-table-column prop="code" label="规则编码" width="160" />
      <el-table-column prop="type" label="规则类型" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.type" :status-map="RiskRuleTypeMap" />
        </template>
      </el-table-column>
      <el-table-column prop="category" label="风险类别" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.category" :status-map="RiskCategoryMap" />
        </template>
      </el-table-column>
      <el-table-column prop="action" label="处置动作" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.action" :status-map="RiskActionMap" />
        </template>
      </el-table-column>
      <el-table-column prop="severity" label="严重等级" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.severity" :status-map="RiskSeverityMap" :color-map="RiskSeverityColorMap" />
        </template>
      </el-table-column>
      <el-table-column prop="hitCount" label="命中次数" width="100" align="right" />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button :type="row.status === 1 ? 'warning' : 'success'" link size="small" @click="handleToggle(row)">
            {{ row.status === 1 ? '禁用' : '启用' }}
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import {
  getRiskRulesApi,
  deleteRiskRuleApi,
  toggleRiskRuleApi
} from '@/api/risk'
import {
  RiskRuleTypeMap,
  RiskCategoryMap,
  RiskActionMap,
  RiskSeverityMap,
  RiskSeverityColorMap
} from '@/enums/risk'
import { formatDate } from '@/utils/format'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  type: undefined as number | undefined,
  status: undefined as number | undefined
})

const searchFields = [
  { prop: 'name', label: '规则名称', type: 'input' },
  { prop: 'type', label: '规则类型', type: 'select', options: [
    { value: 1, label: '订单' },
    { value: 2, label: '司机' },
    { value: 3, label: '乘客' },
    { value: 4, label: '车辆' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 1, label: '启用' },
    { value: 0, label: '禁用' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getRiskRulesApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取风控规则列表失败')
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
  queryParams.name = ''
  queryParams.type = undefined
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

const handleAdd = () => {
  ElMessage.info('新增规则功能开发中')
}

const handleEdit = (row: any) => {
  ElMessage.info('编辑规则功能开发中')
}

const handleToggle = (row: any) => {
  const action = row.status === 1 ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}该规则吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await toggleRiskRuleApi(row.id)
      ElMessage.success(`${action}成功`)
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || `${action}失败`)
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该规则吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteRiskRuleApi(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  })
}

onMounted(() => {
  getList()
})
</script>
