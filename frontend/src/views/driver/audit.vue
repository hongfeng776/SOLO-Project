<template>
  <div class="driver-audit">
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
        <el-button type="success" :disabled="selectedRows.length === 0" @click="handleBatchAudit(1)">
          <el-icon><Check /></el-icon>
          批量通过
        </el-button>
        <el-button type="danger" :disabled="selectedRows.length === 0" @click="handleBatchAudit(2)">
          <el-icon><Close /></el-icon>
          批量拒绝
        </el-button>
      </template>

      <el-table-column type="selection" width="55" align="center" />
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
      <el-table-column label="驾驶证照片" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.driverLicenseImg"
            :src="row.driverLicenseImg"
            :preview-src-list="[row.driverLicenseImg]"
            style="width: 60px; height: 40px"
            fit="cover"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.auditStatus === 1 ? 'success' : row.auditStatus === 2 ? 'danger' : 'warning'" size="small">
            {{ DriverAuditStatusMap[row.auditStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="success" link size="small" @click="handleAudit(row, 1)">通过</el-button>
          <el-button type="danger" link size="small" @click="handleAudit(row, 2)">拒绝</el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <AuditDialog
      v-model="auditVisible"
      title="司机资质审核"
      :loading="auditLoading"
      @submit="handleAuditSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import AuditDialog from '@/components/AuditDialog/index.vue'
import {
  getDriverListApi,
  auditDriverApi
} from '@/api/driver'
import { DriverAuditStatusMap } from '@/enums/driver'
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
  auditStatus: 0
})

const searchFields = [
  { prop: 'name', label: '司机姓名', type: 'input' },
  { prop: 'phone', label: '手机号码', type: 'input' },
  { prop: 'auditStatus', label: '审核状态', type: 'select', options: [
    { value: 0, label: '待审核' },
    { value: 1, label: '已通过' },
    { value: 2, label: '已拒绝' }
  ]}
]

const auditVisible = ref(false)
const auditLoading = ref(false)
const currentAuditId = ref<number | null>(null)

const getList = async () => {
  loading.value = true
  try {
    const res = await getDriverListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取审核列表失败')
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
  queryParams.auditStatus = 0
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

const handleAudit = (row: Driver, status: number) => {
  currentAuditId.value = row.id
  auditVisible.value = true
}

const handleAuditSubmit = async (form: any) => {
  if (!currentAuditId.value) return
  auditLoading.value = true
  try {
    await auditDriverApi(currentAuditId.value, form.auditStatus, form.remark)
    ElMessage.success('审核成功')
    auditVisible.value = false
    getList()
  } catch (error: any) {
    ElMessage.error(error.message || '审核失败')
  } finally {
    auditLoading.value = false
  }
}

const handleBatchAudit = (status: number) => {
  const action = status === 1 ? '通过' : '拒绝'
  ElMessage.success(`已批量${action} ${selectedRows.value.length} 条记录`)
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.driver-audit {
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
