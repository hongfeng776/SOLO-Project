<template>
  <div class="vehicle-maintenance-panel" v-loading="loading">
    <div class="warning-card" v-if="vehicle">
      <div class="warning-header">
        <el-icon :style="{ color: warningColor }"><Warning /></el-icon>
        <span class="warning-title">检修预警</span>
        <el-tag :type="warningTagType" size="small">{{ MaintenanceWarningLevelMap[vehicle.maintenanceWarningLevel] }}</el-tag>
      </div>
      <div class="warning-details">
        <div class="detail-item">
          <span class="label">当前里程：</span>
          <span class="value">{{ formatMileage(vehicle.mileage) }} km</span>
        </div>
        <div class="detail-item">
          <span class="label">检修周期：</span>
          <span class="value">{{ formatMileage(vehicle.maintenanceCycle) }} km</span>
        </div>
        <div class="detail-item">
          <span class="label">上次检修里程：</span>
          <span class="value">{{ formatMileage(vehicle.lastMaintenanceMileage) }} km</span>
        </div>
        <div class="detail-item">
          <span class="label">距下次检修：</span>
          <span class="value" :style="{ color: warningColor }">{{ remainingKm }} km</span>
        </div>
        <div class="detail-item" v-if="vehicle.nextMaintenanceDate">
          <span class="label">下次检修日期：</span>
          <span class="value">{{ formatDate(vehicle.nextMaintenanceDate) }}</span>
        </div>
      </div>
      <el-progress
        :percentage="maintenanceProgress"
        :color="progressColors"
        :stroke-width="12"
        :format="(p: number) => `${p}%`"
        class="mt-12"
      />
    </div>

    <div class="action-bar">
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增检修记录
      </el-button>
    </div>

    <el-table :data="records" stripe class="mt-12" @sort-change="handleSortChange">
      <el-table-column prop="maintenanceType" label="检修类型" width="120">
        <template #default="{ row }">
          <el-tag size="small">{{ MaintenanceTypeMap[row.maintenanceType as keyof typeof MaintenanceTypeMap] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="maintenanceStatus" label="检修状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.maintenanceStatus === 2 ? 'success' : row.maintenanceStatus === 1 ? 'warning' : row.maintenanceStatus === 3 ? 'info' : 'danger'" size="small">
            {{ MaintenanceStatusMap[row.maintenanceStatus as keyof typeof MaintenanceStatusMap] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="mileageAtMaintenance" label="检修里程" width="120" align="right">
        <template #default="{ row }">{{ formatMileage(row.mileageAtMaintenance) }} km</template>
      </el-table-column>
      <el-table-column prop="maintenanceStation" label="检修站点" width="150" show-overflow-tooltip />
      <el-table-column prop="startDate" label="检修日期" width="120">
        <template #default="{ row }">{{ formatDate(row.startDate) }}</template>
      </el-table-column>
      <el-table-column prop="maintenanceCost" label="检修费用" width="100" align="right">
        <template #default="{ row }">
          <span v-if="row.maintenanceCost">¥{{ row.maintenanceCost.toFixed(2) }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="result" label="检修结果" min-width="160" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="row.maintenanceStatus === 0" type="primary" link size="small" @click="handleStartMaintenance(row)">开始检修</el-button>
          <el-button v-if="row.maintenanceStatus === 1" type="success" link size="small" @click="handleCompleteMaintenance(row)">完成检修</el-button>
          <el-button v-if="row.maintenanceStatus === 0" type="info" link size="small" @click="handleCancelMaintenance(row)">取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper mt-12">
      <el-pagination
        v-model:current-page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @current-change="loadRecords"
        @size-change="loadRecords"
      />
    </div>

    <el-dialog v-model="addDialogVisible" title="新增检修记录" width="550px" :close-on-click-modal="false">
      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="100px">
        <el-form-item label="检修类型" prop="maintenanceType">
          <el-select v-model="addForm.maintenanceType" placeholder="请选择" style="width: 100%">
            <el-option v-for="(label, value) in MaintenanceTypeMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="检修站点" prop="maintenanceStation">
          <el-input v-model="addForm.maintenanceStation" placeholder="请输入检修站点" />
        </el-form-item>
        <el-form-item label="检修里程" prop="mileageAtMaintenance">
          <el-input-number v-model="addForm.mileageAtMaintenance" :min="0" :max="999999" :step="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预计完成日期" prop="nextMaintenanceDate">
          <el-date-picker v-model="addForm.nextMaintenanceDate" type="date" placeholder="选择预计完成日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAddRecord">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Warning } from '@element-plus/icons-vue'
import { getMaintenanceRecordsApi, createMaintenanceRecordApi, updateMaintenanceRecordApi } from '@/api/vehicle'
import { MaintenanceWarningLevelMap, MaintenanceTypeMap, MaintenanceStatusMap } from '@/enums/vehicle'
import { formatDate } from '@/utils/format'
import type { Vehicle, VehicleMaintenanceRecord } from '@/types/vehicle'

const props = defineProps<{
  vehicleId: number
  vehicle: Vehicle | null
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const records = ref<VehicleMaintenanceRecord[]>([])
const total = ref(0)
const addDialogVisible = ref(false)
const addFormRef = ref()

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const addForm = reactive({
  maintenanceType: undefined as number | undefined,
  maintenanceStation: '',
  mileageAtMaintenance: 0,
  nextMaintenanceDate: undefined as string | undefined,
  remark: ''
})

const addFormRules = {
  maintenanceType: [{ required: true, message: '请选择检修类型', trigger: 'change' }],
  maintenanceStation: [{ required: true, message: '请输入检修站点', trigger: 'blur' }]
}

const warningColor = computed(() => {
  const level = props.vehicle?.maintenanceWarningLevel || 0
  if (level >= 2) return '#f56c6c'
  if (level === 1) return '#e6a23c'
  return '#67c23a'
})

const warningTagType = computed(() => {
  const level = props.vehicle?.maintenanceWarningLevel || 0
  if (level >= 2) return 'danger'
  if (level === 1) return 'warning'
  return 'success'
})

const remainingKm = computed(() => {
  if (!props.vehicle) return 0
  return Math.max(0, props.vehicle.maintenanceCycle - (props.vehicle.mileage - props.vehicle.lastMaintenanceMileage))
})

const maintenanceProgress = computed(() => {
  if (!props.vehicle || props.vehicle.maintenanceCycle === 0) return 0
  const used = props.vehicle.mileage - props.vehicle.lastMaintenanceMileage
  return Math.min(100, Math.round((used / props.vehicle.maintenanceCycle) * 100))
})

const progressColors = [
  { color: '#67c23a', percentage: 60 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#f56c6c', percentage: 100 }
]

const formatMileage = (val: number | undefined) => {
  if (val === undefined || val === null) return '0'
  return Number(val).toLocaleString()
}

const loadRecords = async () => {
  if (!props.vehicleId) return
  loading.value = true
  try {
    const res = await getMaintenanceRecordsApi(props.vehicleId, queryParams)
    records.value = res.data.list
    total.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取检修记录失败')
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  addForm.maintenanceType = undefined
  addForm.maintenanceStation = ''
  addForm.mileageAtMaintenance = props.vehicle?.mileage || 0
  addForm.nextMaintenanceDate = undefined
  addForm.remark = ''
  addDialogVisible.value = true
}

const handleAddRecord = async () => {
  try {
    await addFormRef.value?.validate()
  } catch { return }

  submitting.value = true
  try {
    await createMaintenanceRecordApi(props.vehicleId, { ...addForm } as any)
    ElMessage.success('检修记录已添加，车辆已转为停运检修状态')
    addDialogVisible.value = false
    loadRecords()
    emit('refresh')
  } catch (error: any) {
    ElMessage.error(error.message || '添加失败')
  } finally {
    submitting.value = false
  }
}

const handleStartMaintenance = async (row: VehicleMaintenanceRecord) => {
  try {
    await updateMaintenanceRecordApi(props.vehicleId, row.id, { maintenanceStatus: 1 })
    ElMessage.success('检修已开始')
    loadRecords()
    emit('refresh')
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleCompleteMaintenance = async (row: VehicleMaintenanceRecord) => {
  try {
    await ElMessageBox.confirm('确认该检修已完成？车辆将自动恢复运营状态评估', '完成检修', {
      confirmButtonText: '确认完成',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await updateMaintenanceRecordApi(props.vehicleId, row.id, { maintenanceStatus: 2, endDate: new Date().toISOString() } as any)
    ElMessage.success('检修已完成')
    loadRecords()
    emit('refresh')
  } catch { }
}

const handleCancelMaintenance = async (row: VehicleMaintenanceRecord) => {
  try {
    await ElMessageBox.confirm('确认取消该检修记录？', '取消检修', {
      confirmButtonText: '确认取消',
      cancelButtonText: '返回',
      type: 'warning'
    })
    await updateMaintenanceRecordApi(props.vehicleId, row.id, { maintenanceStatus: 3 } as any)
    ElMessage.success('检修已取消')
    loadRecords()
    emit('refresh')
  } catch { }
}

const handleSortChange = () => {
  queryParams.page = 1
  loadRecords()
}

watch(() => props.vehicleId, (val) => {
  if (val) {
    queryParams.page = 1
    loadRecords()
  }
})

onMounted(() => {
  if (props.vehicleId) loadRecords()
})
</script>

<style lang="scss" scoped>
.vehicle-maintenance-panel {
  .warning-card {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    border-left: 4px solid #e6a23c;

    .warning-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;

      .warning-title {
        font-weight: 600;
        font-size: 15px;
      }
    }

    .warning-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px 24px;

      .detail-item {
        .label {
          color: #909399;
          font-size: 12px;
        }
        .value {
          font-weight: 500;
          font-size: 13px;
        }
      }
    }
  }

  .action-bar {
    display: flex;
    justify-content: flex-end;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
  }

  .mt-12 {
    margin-top: 12px;
  }

  .text-muted {
    color: #c0c4cc;
  }
}
</style>
