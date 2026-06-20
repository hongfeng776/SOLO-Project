<template>
  <div class="vehicle-maintenance-panel" v-loading="loading">
    <div class="info-cards-row">
      <div class="priority-card">
        <div class="card-header">
          <el-icon><SetUp /></el-icon>
          <span>检修优先级</span>
        </div>
        <div class="priority-content" v-if="priorityResult">
          <div class="priority-badge" :style="{ background: MaintenancePriorityColorMap[priorityResult.priority as keyof typeof MaintenancePriorityColorMap] }">
            {{ MaintenancePriorityMap[priorityResult.priority as keyof typeof MaintenancePriorityMap] }}
          </div>
          <div class="score-display">
            <span class="score-value">{{ priorityResult.score.toFixed(0) }}</span>
            <span class="score-label">/ 100</span>
          </div>
          <div class="breakdown">
            <div class="breakdown-item">
              <span class="label">里程进度</span>
              <el-progress :percentage="Math.min(100, priorityResult.breakdown.mileage.progress)" :stroke-width="6" />
            </div>
            <div class="breakdown-item">
              <span class="label">车龄因素</span>
              <el-progress :percentage="priorityResult.breakdown.age.score" :stroke-width="6" color="#e6a23c" />
            </div>
            <div class="breakdown-item">
              <span class="label">故障频率</span>
              <el-progress :percentage="priorityResult.breakdown.faultFrequency.score" :stroke-width="6" color="#f56c6c" />
            </div>
            <div class="breakdown-item">
              <span class="label">预警等级</span>
              <el-progress :percentage="priorityResult.breakdown.warningLevel.score" :stroke-width="6" color="#409eff" />
            </div>
          </div>
        </div>
        <div v-else class="no-priority">暂无优先级数据</div>
      </div>

      <div class="warning-card" v-if="vehicle">
        <div class="warning-header">
          <el-icon :style="{ color: warningColor }"><Warning /></el-icon>
          <span class="warning-title">检修预警</span>
          <el-tag :type="warningTagType" size="small">{{ MaintenanceWarningLevelMap[vehicle.maintenanceWarningLevel as keyof typeof MaintenanceWarningLevelMap] }}</el-tag>
        </div>
        <div class="warning-details">
          <div class="detail-item"><span class="label">当前里程：</span><span class="value">{{ formatMileage(vehicle.mileage) }} km</span></div>
          <div class="detail-item"><span class="label">检修周期：</span><span class="value">{{ formatMileage(vehicle.maintenanceCycle) }} km</span></div>
          <div class="detail-item"><span class="label">上次检修里程：</span><span class="value">{{ formatMileage(vehicle.lastMaintenanceMileage) }} km</span></div>
          <div class="detail-item"><span class="label">距下次检修：</span><span class="value" :style="{ color: warningColor }">{{ remainingKm }} km</span></div>
          <div class="detail-item" v-if="vehicle.nextMaintenanceDate"><span class="label">下次检修日期：</span><span class="value">{{ formatDate(vehicle.nextMaintenanceDate) }}</span></div>
        </div>
        <el-progress :percentage="maintenanceProgress" :color="progressColors" :stroke-width="12" :format="(p: number) => `${p}%`" class="mt-12" />
      </div>
    </div>

    <div class="action-bar">
      <el-button type="primary" @click="openAddDialog"><el-icon><Plus /></el-icon> 新增检修记录</el-button>
      <el-button @click="loadPriority"><el-icon><SetUp /></el-icon> 刷新优先级</el-button>
    </div>

    <el-table :data="records" stripe class="mt-12">
      <el-table-column prop="priority" label="优先级" width="80" align="center">
        <template #default="{ row }">
          <el-tag :color="MaintenancePriorityColorMap[row.priority as keyof typeof MaintenancePriorityColorMap]" effect="dark" size="small" style="color: #fff; border: none">
            {{ MaintenancePriorityMap[row.priority as keyof typeof MaintenancePriorityMap] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ledgerNo" label="台账编号" width="150" show-overflow-tooltip />
      <el-table-column prop="maintenanceType" label="检修类型" width="120">
        <template #default="{ row }">{{ MaintenanceTypeMap[row.maintenanceType as keyof typeof MaintenanceTypeMap] }}</template>
      </el-table-column>
      <el-table-column prop="maintenanceStatus" label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.maintenanceStatus === 2 ? 'success' : row.maintenanceStatus === 1 ? 'warning' : row.maintenanceStatus === 3 ? 'info' : 'danger'" size="small">
            {{ MaintenanceStatusMap[row.maintenanceStatus as keyof typeof MaintenanceStatusMap] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="faultCategory" label="故障分类" width="100">
        <template #default="{ row }">
          <span v-if="row.faultCategory">{{ FaultCategoryMap[row.faultCategory as keyof typeof FaultCategoryMap] }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="mileageAtMaintenance" label="检修里程" width="110" align="right">
        <template #default="{ row }">{{ formatMileage(row.mileageAtMaintenance) }} km</template>
      </el-table-column>
      <el-table-column prop="maintenanceStation" label="检修站点" width="130" show-overflow-tooltip />
      <el-table-column prop="maintenanceCost" label="总费用" width="90" align="right">
        <template #default="{ row }">
          <span v-if="row.maintenanceCost">¥{{ Number(row.maintenanceCost).toFixed(2) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="isAbnormal" label="异常" width="70" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isAbnormal > 0" type="danger" size="small" effect="dark">
            {{ MaintenanceAnomalyTypeMap[row.isAbnormal as keyof typeof MaintenanceAnomalyTypeMap] }}
          </el-tag>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="isVerified" label="核验" width="70" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isVerified === 1" type="success" size="small">已核验</el-tag>
          <el-tag v-else type="info" size="small">未核验</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="scheduledDate" label="预约日期" width="110">
        <template #default="{ row }">{{ row.scheduledDate ? formatDate(row.scheduledDate) : '-' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button v-if="row.maintenanceStatus === 0" type="primary" link size="small" @click="handleStartMaintenance(row)">开始</el-button>
          <el-button v-if="row.maintenanceStatus === 1" type="success" link size="small" @click="handleCompleteMaintenance(row)">完成</el-button>
          <el-button v-if="row.maintenanceStatus === 0" type="info" link size="small" @click="handleCancelMaintenance(row)">取消</el-button>
          <el-button v-if="row.isVerified === 0 && row.maintenanceStatus === 2" type="warning" link size="small" @click="handleVerify(row)">核验</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper mt-12">
      <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="loadRecords" @size-change="loadRecords" />
    </div>

    <el-dialog v-model="addDialogVisible" title="新增检修记录" width="600px" :close-on-click-modal="false">
      <div v-if="validationResult" class="validation-results">
        <div class="validation-item" :class="{ passed: validationResult.checks.operationStatus.passed, failed: !validationResult.checks.operationStatus.passed }">
          <el-icon><component :is="validationResult.checks.operationStatus.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
          <span class="check-label">运营状态：</span>
          <span class="check-result">{{ validationResult.checks.operationStatus.message }}</span>
        </div>
        <div class="validation-item" :class="{ passed: validationResult.checks.lastMaintenanceTime.passed, failed: !validationResult.checks.lastMaintenanceTime.passed }">
          <el-icon><component :is="validationResult.checks.lastMaintenanceTime.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
          <span class="check-label">上次检修：</span>
          <span class="check-result">{{ validationResult.checks.lastMaintenanceTime.message }}</span>
        </div>
        <div class="validation-item" :class="{ passed: validationResult.checks.mileageThreshold.passed, failed: !validationResult.checks.mileageThreshold.passed }">
          <el-icon><component :is="validationResult.checks.mileageThreshold.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
          <span class="check-label">里程阈值：</span>
          <span class="check-result">{{ validationResult.checks.mileageThreshold.message }}</span>
        </div>
      </div>

      <el-alert v-if="validationResult && !validationResult.valid" :title="`校验不通过：${validationResult.errors.join('；')}`" type="error" :closable="false" show-icon class="mt-12" />
      <el-alert v-if="validationResult && validationResult.warnings.length" :title="`警告：${validationResult.warnings.join('；')}`" type="warning" :closable="false" show-icon class="mt-12" />

      <el-form ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="110px" class="mt-16">
        <el-form-item label="检修类型" prop="maintenanceType">
          <el-select v-model="addForm.maintenanceType" placeholder="请选择" style="width: 100%">
            <el-option v-for="(label, value) in MaintenanceTypeMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障分类" prop="faultCategory">
          <el-select v-model="addForm.faultCategory" placeholder="请选择" clearable style="width: 100%">
            <el-option v-for="(label, value) in FaultCategoryMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述" prop="faultDescription">
          <el-input v-model="addForm.faultDescription" type="textarea" :rows="2" placeholder="故障描述" />
        </el-form-item>
        <el-form-item label="检修站点" prop="maintenanceStation">
          <el-input v-model="addForm.maintenanceStation" placeholder="请输入检修站点" />
        </el-form-item>
        <el-form-item label="检修里程" prop="mileageAtMaintenance">
          <el-input-number v-model="addForm.mileageAtMaintenance" :min="0" :max="999999" :step="1000" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预约日期" prop="scheduledDate">
          <el-date-picker v-model="addForm.scheduledDate" type="date" placeholder="选择预约检修日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="addForm.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" :disabled="validationResult && !validationResult.valid" @click="handleAddRecord">确认添加</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="verifyDialogVisible" title="核验检修记录" width="500px">
      <el-form label-width="100px">
        <el-form-item label="台账编号">{{ verifyTarget?.ledgerNo }}</el-form-item>
        <el-form-item label="核验人">
          <el-input v-model="verifyForm.verifiedBy" placeholder="请输入核验人姓名" />
        </el-form-item>
        <el-form-item label="核验备注">
          <el-input v-model="verifyForm.reviewRemark" type="textarea" :rows="2" placeholder="核验备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="verifyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="verifyLoading" @click="handleVerifySubmit">确认核验</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Warning, SetUp, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { getMaintenanceRecordsApi, createMaintenanceRecordApi, updateMaintenanceRecordApi, getMaintenancePriorityApi, verifyMaintenanceRecordApi } from '@/api/vehicle'
import { MaintenanceTypeMap, MaintenanceStatusMap, MaintenancePriorityMap, MaintenancePriorityColorMap, FaultCategoryMap, MaintenanceAnomalyTypeMap, MaintenanceWarningLevelMap } from '@/enums/vehicle'
import { formatDate } from '@/utils/format'
import type { Vehicle, VehicleMaintenanceRecord, MaintenancePriorityResult, MaintenanceValidationResult } from '@/types/vehicle'

const props = defineProps<{
  vehicleId: number
  vehicle: Vehicle | null
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const loading = ref(false)
const submitting = ref(false)
const verifyLoading = ref(false)
const records = ref<VehicleMaintenanceRecord[]>([])
const total = ref(0)
const addDialogVisible = ref(false)
const verifyDialogVisible = ref(false)
const addFormRef = ref()
const priorityResult = ref<MaintenancePriorityResult | null>(null)
const validationResult = ref<MaintenanceValidationResult | null>(null)
const verifyTarget = ref<VehicleMaintenanceRecord | null>(null)

const queryParams = reactive({
  page: 1,
  pageSize: 10
})

const addForm = reactive({
  maintenanceType: undefined as number | undefined,
  faultCategory: undefined as number | undefined,
  faultDescription: '',
  maintenanceStation: '',
  mileageAtMaintenance: 0,
  scheduledDate: undefined as string | undefined,
  remark: ''
})

const addFormRules = {
  maintenanceType: [{ required: true, message: '请选择检修类型', trigger: 'change' }],
  maintenanceStation: [{ required: true, message: '请输入检修站点', trigger: 'blur' }]
}

const verifyForm = reactive({
  verifiedBy: '',
  reviewRemark: ''
})

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

const loadPriority = async () => {
  if (!props.vehicleId) return
  try {
    const res = await getMaintenancePriorityApi(props.vehicleId)
    priorityResult.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '获取优先级失败')
  }
}

const openAddDialog = () => {
  addForm.maintenanceType = undefined
  addForm.faultCategory = undefined
  addForm.faultDescription = ''
  addForm.maintenanceStation = ''
  addForm.mileageAtMaintenance = props.vehicle?.mileage || 0
  addForm.scheduledDate = undefined
  addForm.remark = ''
  validationResult.value = null
  addDialogVisible.value = true
  fetchValidation()
}

const fetchValidation = async () => {
  if (!props.vehicleId) return
  try {
    const res = await createMaintenanceRecordApi(props.vehicleId, {} as any)
    validationResult.value = (res as any).validation as MaintenanceValidationResult
  } catch (error: any) {
    if (error.data?.validation) {
      validationResult.value = error.data.validation
    }
  }
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
    loadPriority()
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
    loadPriority()
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

const handleVerify = (row: VehicleMaintenanceRecord) => {
  verifyTarget.value = row
  verifyForm.verifiedBy = ''
  verifyForm.reviewRemark = ''
  verifyDialogVisible.value = true
}

const handleVerifySubmit = async () => {
  if (!verifyForm.verifiedBy.trim()) {
    ElMessage.warning('请输入核验人姓名')
    return
  }
  if (!verifyTarget.value) return
  verifyLoading.value = true
  try {
    await verifyMaintenanceRecordApi(props.vehicleId, verifyTarget.value.id, {
      verifiedBy: verifyForm.verifiedBy,
      reviewRemark: verifyForm.reviewRemark || undefined
    })
    ElMessage.success('核验完成')
    verifyDialogVisible.value = false
    loadRecords()
    emit('refresh')
  } catch (error: any) {
    ElMessage.error(error.message || '核验失败')
  } finally {
    verifyLoading.value = false
  }
}

watch(() => props.vehicleId, (val) => {
  if (val) {
    queryParams.page = 1
    loadRecords()
    loadPriority()
  }
})

onMounted(() => {
  if (props.vehicleId) {
    loadRecords()
    loadPriority()
  }
})
</script>

<style lang="scss" scoped>
.vehicle-maintenance-panel {
  .info-cards-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .priority-card {
    flex: 1;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
    border-left: 4px solid #409eff;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: 600;
      font-size: 15px;
      color: #303133;
    }

    .priority-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .priority-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      color: #fff;
      font-size: 13px;
      font-weight: 500;
      width: fit-content;
    }

    .score-display {
      .score-value {
        font-size: 28px;
        font-weight: 700;
        color: #303133;
      }

      .score-label {
        font-size: 13px;
        color: #909399;
        margin-left: 4px;
      }
    }

    .breakdown {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .breakdown-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-size: 12px;
          color: #909399;
          white-space: nowrap;
          min-width: 60px;
        }

        .el-progress {
          flex: 1;
        }
      }
    }

    .no-priority {
      color: #c0c4cc;
      font-size: 13px;
      text-align: center;
      padding: 20px 0;
    }
  }

  .warning-card {
    flex: 1;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
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
    gap: 8px;
  }

  .validation-results {
    background: #fafafa;
    border-radius: 6px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .validation-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      padding: 6px 8px;
      border-radius: 4px;

      &.passed {
        background: #f0f9eb;
        color: #67c23a;
      }

      &.failed {
        background: #fef0f0;
        color: #f56c6c;
      }

      .check-label {
        font-weight: 500;
      }

      .check-result {
        color: #606266;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
  }

  .mt-12 {
    margin-top: 12px;
  }

  .mt-16 {
    margin-top: 16px;
  }

  .text-muted {
    color: #c0c4cc;
  }
}
</style>
