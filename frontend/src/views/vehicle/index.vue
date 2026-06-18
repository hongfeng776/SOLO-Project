<template>
  <div class="vehicle-list">
    <VehicleBatchOperation
      v-if="selectedRows.length > 0"
      :selected-rows="selectedRows"
      @success="handleBatchSuccess"
    />

    <CommonTable
      ref="tableRef"
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :show-selection="true"
      :search-fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @selection-change="handleSelectionChange"
    >
      <template #toolbar>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增车辆
        </el-button>
        <el-button type="success" @click="handleRecalculateLevel" :disabled="selectedRows.length === 0">
          <el-icon><TrendCharts /></el-icon>
          重新评定等级
        </el-button>
      </template>

      <el-table-column prop="plateNumber" label="车牌号" width="130" fixed="left">
        <template #default="{ row }">
          <div class="plate-cell">
            <span class="plate-text">{{ row.plateNumber }}</span>
            <el-tag
              v-if="row.isLocked === 1"
              type="danger"
              size="small"
              effect="dark"
              class="lock-tag"
            >
              <el-icon><Lock /></el-icon>
              锁定
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="车辆信息" width="200">
        <template #default="{ row }">
          <div class="vehicle-info">
            <div class="main-info">{{ row.brand }} {{ row.model }}</div>
            <div class="sub-info">
              <span>{{ row.color }}</span>
              <span class="divider">/</span>
              <span>{{ row.seats }}座</span>
              <span class="divider">/</span>
              <span>{{ getEmissionText(row.emissionStandard) }}</span>
            </div>
            <div class="vin-info" v-if="row.vin">
              <span class="vin-label">VIN:</span>
              <span class="vin-value">{{ row.vin }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="运营等级" width="120" align="center">
        <template #default="{ row }">
          <div class="level-cell">
            <span :class="['level-tag', `level-${getLevelChar(row.operationLevel)}"]>
              {{ getLevelText(row.operationLevel) }}
            </span>
            <div class="level-score" v-if="row.totalScore !== undefined">
              {{ row.totalScore }}分
            </div>
          </div>
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
      <el-table-column prop="driverName" label="所属司机" width="110" />
      <el-table-column prop="city" label="备案城市" width="100" />
      <el-table-column label="证件状态" width="180">
        <template #default="{ row }">
          <div class="doc-status">
            <el-tooltip
              :content="`行驶证: ${formatDate(row.drivingLicenseExpiry)}"
              placement="top"
            >
              <el-tag
              :type="isExpired(row.drivingLicenseExpiry) ? 'danger' : 'success'"
              size="small"
              class="doc-tag"
            >
              <el-icon v-if="isExpired(row.drivingLicenseExpiry)"><Warning /></el-icon>
              行驶证
            </el-tag>
          </el-tooltip>
          <el-tooltip
            :content="`年检: ${formatDate(row.inspectionExpiry)}"
            placement="top"
          >
            <el-tag
              :type="isExpired(row.inspectionExpiry) ? 'danger' : 'success'"
              size="small"
              class="doc-tag"
            >
              <el-icon v-if="isExpired(row.inspectionExpiry)"><Warning /></el-icon>
              年检
            </el-tag>
          </el-tooltip>
          <el-tooltip
            :content="`保险: ${formatDate(row.insuranceExpiry)}"
            placement="top"
          >
            <el-tag
              :type="isExpired(row.insuranceExpiry) ? 'danger' : 'success'"
              size="small"
              class="doc-tag"
            >
              <el-icon v-if="isExpired(row.insuranceExpiry)"><Warning /></el-icon>
              保险
            </el-tag>
          </el-tooltip>
          <el-tooltip
            v-if="row.riskLevel === 3"
            content="高风险车辆"
            placement="top"
          >
            <el-tag type="danger" size="small" effect="dark" class="risk-tag">
              <el-icon><WarningFilled /></el-icon>
              高风险
            </el-tag>
          </el-tooltip>
        </div>
        </template>
      </el-table-column>
      <el-table-column label="运营状态" width="100" align="center">
        <template #default="{ row }">
          <StatusTag
            :status="row.status"
            :status-map="VehicleStatusMap"
            :color-map="VehicleStatusColorMap"
          />
        </template>
      </el-table-column>
      <el-table-column label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="row.auditStatus === 1 ? 'success' : row.auditStatus === 2 ? 'danger' : row.auditStatus === 3 ? 'info' : 'warning'"
            size="small"
          >
            {{ VehicleAuditStatusMap[row.auditStatus as keyof typeof VehicleAuditStatusMap] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="录入时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="260" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewTrace(row)">
            <el-icon><Document /></el-icon>
            溯源
          </el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            <el-icon><Edit /></el-icon>
            编辑
          </el-button>
          <el-button
            v-if="row.isLocked !== 1"
            type="danger"
            link
            size="small"
            @click="handleLock(row)"
          >
            <el-icon><Lock /></el-icon>
            锁定
          </el-button>
          <el-button
            v-else
            type="success"
            link
            size="small"
            @click="handleUnlock(row)"
          >
            <el-icon><Key /></el-icon>
            解锁
          </el-button>
        </template>
      </el-table-column>
    </CommonTable>

    <VehicleEditDialog
      v-model="editDialogVisible"
      :vehicle-id="currentVehicleId"
      @success="handleEditSuccess"
    />

    <el-dialog
      v-model="traceDialogVisible"
      :title="`车辆溯源 - ${currentVehicle?.plateNumber || ''}`"
      width="1200px"
      :close-on-click-modal="false"
      v-if="traceDialogVisible && currentVehicle"
    >
      <VehicleOperationTrace
        :vehicle-id="currentVehicleId"
        :vehicle="currentVehicle"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Lock,
  Key,
  Edit,
  Document,
  TrendCharts,
  Warning,
  WarningFilled
} from '@element-plus/icons-vue'
import CommonTable from '@/components/CommonTable/index.vue'
import StatusTag from '@/components/StatusTag/index.vue'
import VehicleEditDialog from '@/components/VehicleEditDialog/index.vue'
import VehicleBatchOperation from '@/components/VehicleBatchOperation/index.vue'
import VehicleOperationTrace from '@/components/VehicleOperationTrace/index.vue'
import {
  getVehicleListApi,
  deleteVehicleApi,
  lockVehicleApi,
  unlockVehicleApi,
  recalculateLevelApi
} from '@/api/vehicle'
import {
  VehicleStatusMap,
  VehicleStatusColorMap,
  VehicleAuditStatusMap,
  OperationLevel,
  OperationLevelMap,
  EmissionStandard,
  EmissionStandardMap
} from '@/enums/vehicle'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'
import { formatDate } from '@/utils/format'
import type { Vehicle } from '@/types/vehicle'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<Vehicle[]>([])
const total = ref(0)
const selectedRows = ref<Vehicle[]>([])

const editDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const currentVehicleId = ref<number | null>(null)
const currentVehicle = ref<Vehicle | null>(null)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  plateNumber: '',
  vin: '',
  brand: '',
  capacityType: undefined as number | undefined,
  status: undefined as number | undefined,
  auditStatus: undefined as number | undefined,
  operationLevel: undefined as number | undefined,
  city: '',
  isLocked: undefined as number | undefined
})

const searchFields = [
  { prop: 'plateNumber', label: '车牌号', type: 'input' },
  { prop: 'vin', label: '车架号', type: 'input' },
  { prop: 'brand', label: '品牌', type: 'input' },
  { prop: 'city', label: '备案城市', type: 'input' },
  { prop: 'capacityType', label: '运力类型', type: 'select', options: [
    { value: 1, label: '快车' },
    { value: 2, label: '专车' },
    { value: 3, label: '豪华车' },
    { value: 4, label: '拼车' },
    { value: 5, label: '出租车' }
  ]},
  { prop: 'operationLevel', label: '运营等级', type: 'select', options: [
    { value: 1, label: 'S级' },
    { value: 2, label: 'A级' },
    { value: 3, label: 'B级' },
    { value: 4, label: 'C级' }
  ]},
  { prop: 'status', label: '车辆状态', type: 'select', options: [
    { value: 0, label: '空闲' },
    { value: 1, label: '运营中' },
    { value: 2, label: '维修中' },
    { value: 3, label: '已报废' }
  ]},
  { prop: 'auditStatus', label: '审核状态', type: 'select', options: [
    { value: 0, label: '待审核' },
    { value: 1, label: '已备案' },
    { value: 2, label: '已驳回' },
    { value: 3, label: '已过期' }
  ]},
  { prop: 'isLocked', label: '锁定状态', type: 'select', options: [
    { value: 0, label: '未锁定' },
    { value: 1, label: '已锁定' }
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
  queryParams.page = 1
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

const handleSelectionChange = (rows: Vehicle[]) => {
  selectedRows.value = rows
}

const handleAdd = () => {
  currentVehicleId.value = null
  currentVehicle.value = null
  editDialogVisible.value = true
}

const handleEdit = (row: Vehicle) => {
  currentVehicleId.value = row.id
  currentVehicle.value = row
  editDialogVisible.value = true
}

const handleViewTrace = (row: Vehicle) => {
  currentVehicleId.value = row.id
  currentVehicle.value = row
  traceDialogVisible.value = true
}

const handleLock = async (row: Vehicle) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入锁定原因',
      `锁定车辆 ${row.plateNumber}`,
      {
        confirmButtonText: '确认锁定',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入锁定原因',
        inputValidator: (value) => {
          if (!value || value.length < 2) {
            return '请输入至少2个字符的锁定原因'
          }
          return true
        }
      }
    )
    
    await lockVehicleApi(row.id, reason)
    ElMessage.success('锁定成功')
    getList()
  } catch {
    // User cancelled or error handled by message box
  }
}

const handleUnlock = async (row: Vehicle) => {
  try {
    await ElMessageBox.confirm(
      `确定要解锁车辆 ${row.plateNumber}吗？解锁后车辆将恢复运营权限`,
      '解锁车辆',
      {
        confirmButtonText: '确认解锁',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await unlockVehicleApi(row.id)
    ElMessage.success('解锁成功')
    getList()
  } catch {
    // User cancelled
  }
}

const handleRecalculateLevel = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择车辆')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要重新评定 ${selectedRows.value.length} 辆车辆的运营等级吗？`,
      '重新评定等级',
      {
        confirmButtonText: '确认评定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    for (const vehicle of selectedRows.value) {
      try {
        await recalculateLevelApi(vehicle.id)
      } catch (e: any) {
        console.error(`Failed to recalculate level for vehicle ${vehicle.id}:`, e)
      }
    }
    
    ElMessage.success('等级重新评定完成')
    getList()
  } catch {
    // User cancelled
  }
}

const handleEditSuccess = () => {
  editDialogVisible.value = false
  getList()
  ElMessage.success('操作成功')
}

const handleBatchSuccess = () => {
  selectedRows.value = []
  getList()
}

const isExpired = (dateStr: string) => {
  if (!dateStr) return false
  const today = new Date()
  const expiry = new Date(dateStr)
  return expiry < today
}

const getLevelText = (level: number) => {
  return OperationLevelMap[level as keyof typeof OperationLevelMap] || '-'
}

const getLevelChar = (level: number) => {
  const text = getLevelText(level)
  return text.charAt(0)
}

const getEmissionText = (standard: number) => {
  return EmissionStandardMap[standard as keyof typeof EmissionStandardMap] || '-'
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped>
.vehicle-list {
  padding: 20px;

  .plate-cell {
    display: flex;
    align-items: center;
    gap: 6px;

    .plate-text {
      font-weight: 600;
      color: #303133;
    }

    .lock-tag {
      margin-left: 4px;
    }
  }

  .vehicle-info {
    .main-info {
      font-weight: 500;
      color: #303133;
    }

    .sub-info {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;

      .divider {
        margin: 0 4px;
        color: #dcdfe6;
      }
    }

    .vin-info {
      font-size: 11px;
      color: #c0c4cc;
      margin-top: 2px;

      .vin-label {
        margin-right: 4px;
      }

      .vin-value {
        font-family: 'Courier New', monospace;
      }
    }
  }

  .level-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    .level-score {
      font-size: 11px;
      color: #909399;
    }
  }

  .level-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;

    &.level-S {
      background: linear-gradient(135deg, #ffd700, #ffb300);
      color: #fff;
      box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
    }

    &.level-A {
      background: linear-gradient(135deg, #409eff, #2b85e4);
      color: #fff;
    }

    &.level-B {
      background: linear-gradient(135deg, #67c23a, #529b2e);
      color: #fff;
    }

    &.level-C {
      background: linear-gradient(135deg, #909399, #73767a);
      color: #fff;
    }
  }

  .doc-status {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .doc-tag {
      margin-right: 4px;

      &:last-child {
        margin-right: 0;
      }
    }

    .risk-tag {
      margin-left: 4px;
    }
  }
}
</style>
