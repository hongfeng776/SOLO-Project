<template>
  <div class="campaign-list">
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
          新增活动
        </el-button>
      </template>

      <el-table-column prop="name" label="活动名称" width="160" />
      <el-table-column prop="code" label="活动编码" width="140" />
      <el-table-column prop="type" label="类型" width="110" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.type" :status-map="CampaignTypeMap" />
        </template>
      </el-table-column>
      <el-table-column prop="couponId" label="关联优惠券ID" width="120" align="center" />
      <el-table-column label="预算/已用" width="140" align="right">
        <template #default="{ row }">
          ¥{{ row.budget }} / ¥{{ row.usedBudget }}
        </template>
      </el-table-column>
      <el-table-column label="参与/订单" width="120" align="center">
        <template #default="{ row }">
          {{ row.participantCount }} / {{ row.orderCount }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.status" :status-map="CampaignStatusMap" :color-map="CampaignStatusColorMap" />
        </template>
      </el-table-column>
      <el-table-column label="活动时间" width="200">
        <template #default="{ row }">
          {{ formatDate(row.startTime, 'YYYY-MM-DD') }} 至 {{ formatDate(row.endTime, 'YYYY-MM-DD') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="success" link size="small" @click="handleEffect(row)">查看效果</el-button>
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
  CampaignTypeMap,
  CampaignStatusMap,
  CampaignStatusColorMap
} from '@/enums/marketing'
import { formatDate } from '@/utils/format'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  type: undefined as number | undefined,
  status: undefined as number | undefined
})

const searchFields = [
  { prop: 'type', label: '活动类型', type: 'select', options: [
    { value: 1, label: '新用户' },
    { value: 2, label: '节日' },
    { value: 3, label: '高峰补贴' },
    { value: 4, label: '会员专享' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 0, label: '草稿' },
    { value: 1, label: '进行中' },
    { value: 2, label: '已结束' },
    { value: 3, label: '已暂停' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    tableData.value = []
    total.value = 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取活动列表失败')
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
  ElMessage.info('新增活动功能开发中')
}

const handleEdit = (row: any) => {
  ElMessage.info('编辑活动功能开发中')
}

const handleEffect = (row: any) => {
  ElMessage.info('查看活动效果功能开发中')
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该活动吗？', '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  })
}

onMounted(() => {
  getList()
})
</script>
