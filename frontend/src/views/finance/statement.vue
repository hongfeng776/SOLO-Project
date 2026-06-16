<template>
  <div class="finance-statement">
    <CommonTable
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
        <el-button type="success">
          <el-icon><Download /></el-icon>
          导出流水
        </el-button>
      </template>

      <el-table-column prop="id" label="流水号" width="100" />
      <el-table-column prop="orderNo" label="关联订单" width="180" />
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.type"
            :status-map="FinanceTypeMap"
            :color-map="FinanceTypeColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="金额" width="120" align="right">
        <template #default="{ row }">
          <span :class="{ 'income': row.type === 1, 'expense': row.type !== 1 }">
            {{ row.type === 1 ? '+' : '-' }}¥{{ Math.abs(row.amount) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="balance" label="余额" width="120" align="right">
        <template #default="{ row }">¥{{ row.balance }}</template>
      </el-table-column>
      <el-table-column prop="relatedType" label="关联类型" width="100" />
      <el-table-column prop="remark" label="备注" show-overflow-tooltip />
      <el-table-column prop="createTime" label="时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { getStatementListApi } from '@/api/finance'
import { FinanceTypeMap, FinanceTypeColorMap } from '@/enums/finance'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  type: undefined as number | undefined,
  startTime: '',
  endTime: ''
})

const searchFields = [
  { prop: 'type', label: '流水类型', type: 'select', options: [
    { value: 1, label: '收入' },
    { value: 2, label: '支出' },
    { value: 3, label: '退款' },
    { value: 4, label: '提现' }
  ]},
  { prop: 'dateRange', label: '时间范围', type: 'daterange' }
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getStatementListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取流水列表失败')
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

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.finance-statement {
  .income {
    color: #67c23a;
    font-weight: bold;
  }

  .expense {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
