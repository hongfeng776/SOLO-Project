<template>
  <div class="driver-list">
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
          新增司机
        </el-button>
        <el-button type="success" :disabled="selectedRows.length === 0" @click="handleBatchEnable">
          <el-icon><Check /></el-icon>
          批量启用
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchDisable">
          <el-icon><Close /></el-icon>
          批量禁用
        </el-button>
      </template>

      <template #toolbar-right>
        <el-button @click="getList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </template>

      <el-table-column label="司机信息" width="200">
        <template #default="{ row }">
          <div class="driver-info">
            <el-avatar :size="40" :src="row.avatar">
              {{ row.name?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ row.name }}</div>
              <div class="phone">{{ formatPhone(row.phone) }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="idCard" label="身份证号" width="200">
        <template #default="{ row }">{{ formatIdCard(row.idCard) }}</template>
      </el-table-column>
      <el-table-column prop="driverLicenseNo" label="驾驶证号" width="180" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.status"
            :status-map="DriverStatusMap"
            :color-map="DriverStatusColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.auditStatus === 1 ? 'success' : row.auditStatus === 2 ? 'danger' : 'warning'" size="small">
            {{ DriverAuditStatusMap[row.auditStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="totalOrders" label="总订单" width="100" align="right" />
      <el-table-column prop="rating" label="评分" width="100" align="center">
        <template #default="{ row }">
          <el-rate v-model="row.rating" disabled size="small" />
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="注册时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button type="warning" link size="small" @click="handleStatus(row)">
            {{ row.status === 3 ? '解封' : '封禁' }}
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
  getDriverListApi,
  deleteDriverApi,
  updateDriverStatusApi
} from '@/api/driver'
import {
  DriverStatusMap,
  DriverStatusColorMap,
  DriverAuditStatusMap
} from '@/enums/driver'
import { formatDate, formatPhone, formatIdCard } from '@/utils/format'
import type { Driver } from '@/types/driver'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<Driver[]>([])
const total = ref(0)
const selectedRows = ref<Driver[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: '',
  phone: '',
  status: undefined as number | undefined,
  auditStatus: undefined as number | undefined
})

const searchFields = [
  { prop: 'name', label: '司机姓名', type: 'input' },
  { prop: 'phone', label: '手机号码', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: 0, label: '离线' },
    { value: 1, label: '在线' },
    { value: 2, label: '接单中' },
    { value: 3, label: '已封禁' }
  ]},
  { prop: 'auditStatus', label: '审核状态', type: 'select', options: [
    { value: 0, label: '待审核' },
    { value: 1, label: '已通过' },
    { value: 2, label: '已拒绝' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getDriverListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取司机列表失败')
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
  queryParams.phone = ''
  queryParams.status = undefined
  queryParams.auditStatus = undefined
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
  ElMessage.info('新增司机功能开发中')
}

const handleEdit = (row: Driver) => {
  ElMessage.info('编辑司机功能开发中')
}

const handleView = (row: Driver) => {
  ElMessage.info('司机详情功能开发中')
}

const handleStatus = (row: Driver) => {
  const newStatus = row.status === 3 ? 1 : 3
  const action = row.status === 3 ? '解封' : '封禁'
  ElMessageBox.confirm(`确定要${action}该司机吗？`, '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await updateDriverStatusApi(row.id, newStatus)
      ElMessage.success(`${action}成功`)
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || `${action}失败`)
    }
  })
}

const handleDelete = (row: Driver) => {
  ElMessageBox.confirm('确定要删除该司机吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteDriverApi(row.id)
      ElMessage.success('删除成功')
      getList()
    } catch (error: any) {
      ElMessage.error(error.message || '删除失败')
    }
  })
}

const handleBatchEnable = () => {
  ElMessage.success(`已启用 ${selectedRows.value.length} 个司机`)
}

const handleBatchDisable = () => {
  ElMessage.success(`已禁用 ${selectedRows.value.length} 个司机`)
}

onMounted(() => {
  getList()
})

defineExpose({
  selectedRows
})
</script>

<style lang="scss" scoped>
.driver-list {
  .driver-info {
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
