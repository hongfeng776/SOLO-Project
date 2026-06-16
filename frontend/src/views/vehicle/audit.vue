<template>
  <div class="vehicle-audit">
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
          <el-icon><Check /></el-icon>
          批量通过
        </el-button>
        <el-button type="danger">
          <el-icon><Close /></el-icon>
          批量拒绝
        </el-button>
      </template>

      <el-table-column type="selection" width="55" align="center" />
      <el-table-column prop="plateNumber" label="车牌号" width="120" />
      <el-table-column label="车辆信息" width="200">
        <template #default="{ row }">
          <div>{{ row.brand }} {{ row.model }}</div>
          <div class="sub-text">{{ row.color }} / {{ row.seats }}座</div>
        </template>
      </el-table-column>
      <el-table-column label="运力类型" width="100">
        <template #default="{ row }">
          <StatusTag
            :status="row.capacityType"
            :status-map="CapacityTypeMap"
            :color-map="CapacityTypeColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column label="车辆照片" width="100">
        <template #default="{ row }">
          <el-image
            v-if="row.vehicleImg"
            :src="row.vehicleImg"
            :preview-src-list="[row.vehicleImg]"
            style="width: 60px; height: 40px"
            fit="cover"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.auditStatus === 1 ? 'success' : row.auditStatus === 2 ? 'danger' : 'warning'" size="small">
            {{ VehicleAuditStatusMap[row.auditStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="申请时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="success" link size="small">通过</el-button>
          <el-button type="danger" link size="small">拒绝</el-button>
        </template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { getVehicleListApi } from '@/api/vehicle'
import { VehicleAuditStatusMap } from '@/enums/vehicle'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'
import { formatDate } from '@/utils/format'
import type { Vehicle } from '@/types/vehicle'

const loading = ref(false)
const tableData = ref<Vehicle[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  plateNumber: '',
  auditStatus: 0
})

const searchFields = [
  { prop: 'plateNumber', label: '车牌号', type: 'input' },
  { prop: 'auditStatus', label: '审核状态', type: 'select', options: [
    { value: 0, label: '待审核' },
    { value: 1, label: '已通过' },
    { value: 2, label: '已拒绝' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getVehicleListApi(queryParams)
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
  queryParams.plateNumber = ''
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

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.vehicle-audit {
  .sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
