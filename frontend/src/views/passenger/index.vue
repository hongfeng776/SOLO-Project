<template>
  <div class="passenger-list">
    <CommonTable
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
        <el-button type="primary">
          <el-icon><Plus /></el-icon>
          新增乘客
        </el-button>
      </template>

      <el-table-column label="乘客信息" width="200">
        <template #default="{ row }">
          <div class="passenger-info">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.nickname?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ row.nickname }}</div>
              <div class="phone">{{ formatPhone(row.phone) }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="性别" width="80" align="center">
        <template #default="{ row }">{{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '未知' }}</template>
      </el-table-column>
      <el-table-column prop="totalOrders" label="总订单数" width="100" align="right" />
      <el-table-column prop="totalSpend" label="总消费" width="120" align="right">
        <template #default="{ row }">¥{{ row.totalSpend || 0 }}</template>
      </el-table-column>
      <el-table-column prop="rating" label="评分" width="120" align="center">
        <template #default="{ row }">
          <el-rate v-model="row.rating" disabled size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small">详情</el-button>
          <el-button type="primary" link size="small">编辑</el-button>
          <el-button type="danger" link size="small">删除</el-button>
        </template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import { getPassengerListApi } from '@/api/passenger'
import { formatDate, formatPhone } from '@/utils/format'
import type { Passenger } from '@/types/passenger'

const loading = ref(false)
const tableData = ref<Passenger[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  nickname: '',
  phone: '',
  status: undefined as number | undefined
})

const searchFields = [
  { prop: 'nickname', label: '昵称', type: 'input' },
  { prop: 'phone', label: '手机号', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 1, label: '正常' },
    { value: 0, label: '禁用' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getPassengerListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取乘客列表失败')
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
.passenger-list {
  .passenger-info {
    display: flex;
    align-items: center;
    gap: 10px;

    .info {
      .name {
        font-weight: 500;
        color: #303133;
      }

      .phone {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}
</style>
