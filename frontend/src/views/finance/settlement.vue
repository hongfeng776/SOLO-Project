<template>
  <div class="finance-settlement">
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
        <el-button type="primary" @click="handleCreate">
          <el-icon><Plus /></el-icon>
          生成结算单
        </el-button>
      </template>

      <el-table-column prop="settlementNo" label="结算单号" width="180" />
      <el-table-column prop="driverName" label="司机" width="100" />
      <el-table-column prop="driverPhone" label="司机电话" width="130">
        <template #default="{ row }">{{ formatPhone(row.driverPhone) }}</template>
      </el-table-column>
      <el-table-column prop="orderCount" label="订单数" width="100" align="right" />
      <el-table-column prop="totalAmount" label="结算金额" width="120" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ row.totalAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="结算周期" width="200">
        <template #default="{ row }">
          {{ formatDate(row.periodStart, 'YYYY-MM-DD') }} 至 {{ formatDate(row.periodEnd, 'YYYY-MM-DD') }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
            {{ SettlementStatusMap[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="settleTime" label="结算时间" width="170">
        <template #default="{ row }">{{ row.settleTime ? formatDate(row.settleTime) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small">详情</el-button>
          <el-button
            v-if="row.status === 0"
            type="success"
            link
            size="small"
            @click="handleExecute(row)"
          >
            执行结算
          </el-button>
        </template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import { getSettlementListApi, executeSettlementApi } from '@/api/finance'
import { SettlementStatusMap } from '@/enums/finance'
import { formatDate, formatPhone } from '@/utils/format'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  driverName: '',
  status: undefined as number | undefined
})

const searchFields = [
  { prop: 'driverName', label: '司机姓名', type: 'input' },
  { prop: 'status', label: '结算状态', type: 'select', options: [
    { value: 0, label: '待结算' },
    { value: 1, label: '已结算' },
    { value: 2, label: '结算失败' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getSettlementListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取结算列表失败')
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

const handleCreate = () => {
  ElMessage.info('生成结算单功能开发中')
}

const handleExecute = (row: any) => {
  ElMessageBox.confirm('确定要执行该结算吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await executeSettlementApi(row.id)
      ElMessage.success('结算成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '结算失败')
    }
  })
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.finance-settlement {
  .amount {
    color: #f56c6c;
    font-weight: bold;
  }
}
</style>
