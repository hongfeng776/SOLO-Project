<template>
  <div class="vehicle-list">
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
          新增车辆
        </el-button>
      </template>

      <el-table-column prop="plateNumber" label="车牌号" width="120" />
      <el-table-column label="车辆信息" width="200">
        <template #default="{ row }">
          <div>{{ row.brand }} {{ row.model }}</div>
          <div class="sub-text">{{ row.color }} / {{ row.seats }}座</div>
        </template>
      </el-table-column>
      <el-table-column label="运力类型" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.capacityType"
            :status-map="CapacityTypeMap"
            :color-map="CapacityTypeColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column prop="driverName" label="所属司机" width="100" />
      <el-table-column prop="status" label="车辆状态" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.status"
            :status-map="VehicleStatusMap"
            :color-map="VehicleStatusColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.auditStatus === 1 ? 'success' : row.auditStatus === 2 ? 'danger' : 'warning'" size="small">
            {{ VehicleAuditStatusMap[row.auditStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="inspectionDate" label="年检日期" width="120">
        <template #default="{ row }">{{ formatDate(row.inspectionDate, 'YYYY-MM-DD') }}</template>
      </el-table-column>
      <el-table-column prop="createTime" label="录入时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small">详情</el-button>
          <el-button type="primary" link size="small">编辑</el-button>
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
import { getVehicleListApi, deleteVehicleApi } from '@/api/vehicle'
import { VehicleStatusMap, VehicleStatusColorMap, VehicleAuditStatusMap } from '@/enums/vehicle'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'
import { formatDate } from '@/utils/format'
import type { Vehicle } from '@/types/vehicle'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<Vehicle[]>([])
const total = ref(0)
const selectedRows = ref<Vehicle[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  plateNumber: '',
  brand: '',
  capacityType: undefined as number | undefined,
  status: undefined as number | undefined,
  auditStatus: undefined as number | undefined
})

const searchFields = [
  { prop: 'plateNumber', label: '车牌号', type: 'input' },
  { prop: 'brand', label: '品牌', type: 'input' },
  { prop: 'capacityType', label: '运力类型', type: 'select', options: [
    { value: 1, label: '快车' },
    { value: 2, label: '专车' },
    { value: 3, label: '豪华车' },
    { value: 4, label: '拼车' },
    { value: 5, label: '出租车' }
  ]},
  { prop: 'status', label: '车辆状态', type: 'select', options: [
    { value: 0, label: '空闲' },
    { value: 1, label: '运营中' },
    { value: 2, label: '维修中' },
    { value: 3, label: '已报废' }
  ]}
]

const getList = async () => {
  loading.value = true
  try {
    const res = await getVehicleListApi(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取车辆列表失败')
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

const handleAdd = () => {
  ElMessage.info('新增车辆功能开发中')
}

const handleDelete = (row: Vehicle) => {
  ElMessageBox.confirm('确定要删除该车辆吗？', '提示', {
    type: 'warning'
  }).then(async () => {
    try {
      await deleteVehicleApi(row.id)
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

<style lang="scss" scoped>
.vehicle-list {
  .sub-text {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
