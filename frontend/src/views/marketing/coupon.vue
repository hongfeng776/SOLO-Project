<template>
  <div class="coupon-list">
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
          新增优惠券
        </el-button>
        <el-button type="success" @click="handleDistribute">
          <el-icon><Present /></el-icon>
          发放优惠券
        </el-button>
      </template>

      <el-table-column prop="name" label="名称" width="160" />
      <el-table-column prop="code" label="券码" width="140" />
      <el-table-column prop="type" label="类型" width="100" align="center">
        <template #default="{ row }">
          <StatusTag :status="row.type" :status-map="CouponTypeMap" />
        </template>
      </el-table-column>
      <el-table-column prop="amount" label="优惠额度" width="100" align="right">
        <template #default="{ row }">
          <span v-if="row.type === 2">{{ row.amount }}折</span>
          <span v-else>¥{{ row.amount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="minConsume" label="最低消费" width="100" align="right">
        <template #default="{ row }">¥{{ row.minConsume }}</template>
      </el-table-column>
      <el-table-column prop="totalCount" label="发放总量" width="100" align="right" />
      <el-table-column prop="usedCount" label="已使用" width="80" align="right" />
      <el-table-column prop="limitPerUser" label="限领数" width="80" align="center" />
      <el-table-column label="有效期" width="200">
        <template #default="{ row }">
          {{ formatDate(row.startTime, 'YYYY-MM-DD') }} 至 {{ formatDate(row.endTime, 'YYYY-MM-DD') }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
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
  getCouponListApi,
  deleteCouponApi,
  toggleCouponStatusApi
} from '@/api/coupon'
import { CouponTypeMap } from '@/enums/marketing'
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
  { prop: 'name', label: '优惠券名称', type: 'input' },
  { prop: 'type', label: '类型', type: 'select', options: [
    { value: 1, label: '满减' },
    { value: 2, label: '折扣' },
    { value: 3, label: '立减' }
  ]},
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 1, label: '启用' },
    { value: 0, label: '禁用' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getCouponListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取优惠券列表失败')
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
  ElMessage.info('新增优惠券功能开发中')
}

const handleDistribute = () => {
  ElMessage.info('发放优惠券功能开发中')
}

const handleEdit = (row: any) => {
  ElMessage.info('编辑优惠券功能开发中')
}

const handleToggle = (row: any) => {
  const action = row.status === 1 ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}该优惠券吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await toggleCouponStatusApi(row.id)
      ElMessage.success(`${action}成功`)
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || `${action}失败`)
    }
  })
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm('确定要删除该优惠券吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteCouponApi(row.id)
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
