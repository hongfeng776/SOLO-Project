<template>
  <el-dialog
    v-model="dialogVisible"
    title="变更车辆运营状态"
    width="700px"
    :close-on-click-modal="false"
    class="vehicle-status-change-dialog"
  >
    <div class="current-status-card">
      <div class="vehicle-plate">{{ vehicle?.plateNumber }}</div>
      <div class="status-row">
        <span class="label">当前运营状态：</span>
        <el-tag :type="OperationStatusTypeMap[vehicle?.operationStatus]" effect="dark">
          {{ OperationStatusMap[vehicle?.operationStatus] }}
        </el-tag>
        <span v-if="vehicle?.bannedType === 2" class="banned-badge">
          <el-tag type="danger" effect="dark" size="small">永久封禁</el-tag>
        </span>
      </div>
      <div class="info-row">
        <span class="label">违规次数：</span><span>{{ vehicle?.violationCount || 0 }}</span>
        <span class="label ml-16">检修预警：</span>
        <el-tag
          :type="vehicle?.maintenanceWarningLevel >= 2 ? 'danger' : vehicle?.maintenanceWarningLevel === 1 ? 'warning' : 'success'"
          size="small"
        >
          {{ MaintenanceWarningLevelMap[vehicle?.maintenanceWarningLevel] }}
        </el-tag>
      </div>
    </div>

    <div v-if="validationResult" class="validation-results">
      <div class="validation-item" :class="{ passed: validationResult.checks.maintenance.passed, failed: !validationResult.checks.maintenance.passed }">
        <el-icon><component :is="validationResult.checks.maintenance.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
        <span class="check-label">检修记录校验：</span>
        <span class="check-result">{{ validationResult.checks.maintenance.message }}</span>
      </div>
      <div class="validation-item" :class="{ passed: validationResult.checks.documents.passed, failed: !validationResult.checks.documents.passed }">
        <el-icon><component :is="validationResult.checks.documents.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
        <span class="check-label">证件时效校验：</span>
        <span class="check-result">{{ validationResult.checks.documents.message }}</span>
      </div>
      <div class="validation-item" :class="{ passed: validationResult.checks.violations.passed, failed: !validationResult.checks.violations.passed }">
        <el-icon><component :is="validationResult.checks.violations.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
        <span class="check-label">违规状态校验：</span>
        <span class="check-result">{{ validationResult.checks.violations.message }}</span>
      </div>
      <div class="validation-item" :class="{ passed: validationResult.checks.banned.passed, failed: !validationResult.checks.banned.passed }">
        <el-icon><component :is="validationResult.checks.banned.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
        <span class="check-label">封禁状态校验：</span>
        <span class="check-result">{{ validationResult.checks.banned.message }}</span>
      </div>
      <div class="validation-item" :class="{ passed: validationResult.checks.mutualExclusion.passed, failed: !validationResult.checks.mutualExclusion.passed }">
        <el-icon><component :is="validationResult.checks.mutualExclusion.passed ? 'CircleCheck' : 'CircleClose'" /></el-icon>
        <span class="check-label">互斥逻辑校验：</span>
        <span class="check-result">{{ validationResult.checks.mutualExclusion.message }}</span>
      </div>
    </div>

    <el-alert
      v-if="validationResult && !validationResult.valid"
      :title="`存在${validationResult.errors.length}项校验不通过，无法变更状态`"
      type="error"
      :closable="false"
      show-icon
      class="mt-12"
    >
      <template #default>
        <p v-for="(err, idx) in validationResult.errors" :key="idx">{{ err }}</p>
      </template>
    </el-alert>

    <el-alert
      v-if="validationResult && validationResult.warnings.length"
      :title="`存在${validationResult.warnings.length}项警告`"
      type="warning"
      :closable="false"
      show-icon
      class="mt-12"
    >
      <template #default>
        <p v-for="(w, idx) in validationResult.warnings" :key="idx">{{ w }}</p>
      </template>
    </el-alert>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="mt-16">
      <el-form-item label="变更运营状态" prop="operationStatus">
        <el-radio-group v-model="formData.operationStatus" @change="handleStatusChange">
          <el-radio :value="1" :disabled="vehicle?.operationStatus === 1">正常运营</el-radio>
          <el-radio :value="2" :disabled="vehicle?.operationStatus === 2 || vehicle?.isLocked === 1">停运检修</el-radio>
          <el-radio :value="3" disabled>证件过期</el-radio>
          <el-radio :value="4" :disabled="vehicle?.operationStatus === 4">违规封禁</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.operationStatus === 4" label="封禁类型" prop="bannedType">
        <el-select v-model="formData.bannedType" placeholder="请选择封禁类型" style="width: 100%">
          <el-option label="临时封禁" :value="1" />
          <el-option label="永久封禁" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="formData.operationStatus === 4 && formData.bannedType === 1" label="封禁到期日期" prop="bannedExpireDate">
        <el-date-picker v-model="formData.bannedExpireDate" type="date" placeholder="选择到期日期" style="width: 100%" />
      </el-form-item>
      <el-form-item label="变更原因" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入变更原因" maxlength="200" show-word-limit />
      </el-form-item>
    </el-form>

    <div v-if="formData.operationStatus && mutualExclusionNotice" class="exclusion-notice">
      <el-alert :title="mutualExclusionNotice" type="info" :closable="false" show-icon />
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="confirmLoading"
        :disabled="!canConfirm"
        @click="handleConfirm"
      >
        <el-icon v-if="confirmLoading" class="is-loading"><Loading /></el-icon>
        {{ confirmLoading ? '正在变更...' : '确认变更' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheck, CircleClose, Loading } from '@element-plus/icons-vue'
import { changeOperationStatusApi, validateStatusChangeApi } from '@/api/vehicle'
import { OperationStatusMap, OperationStatusTypeMap, MaintenanceWarningLevelMap } from '@/enums/vehicle'
import type { Vehicle, StatusChangeValidation } from '@/types/vehicle'

const props = defineProps<{
  modelValue: boolean
  vehicle: Vehicle | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref()
const confirmLoading = ref(false)
const validationResult = ref<StatusChangeValidation | null>(null)
const validating = ref(false)

const formData = reactive({
  operationStatus: undefined as number | undefined,
  bannedType: undefined as number | undefined,
  bannedExpireDate: undefined as string | undefined,
  remark: ''
})

const formRules = {
  operationStatus: [{ required: true, message: '请选择运营状态', trigger: 'change' }],
  bannedType: [{ required: true, message: '请选择封禁类型', trigger: 'change' }],
  remark: [{ required: true, message: '请输入变更原因', trigger: 'blur' }]
}

const canConfirm = computed(() => {
  if (!formData.operationStatus) return false
  if (validationResult.value && !validationResult.value.valid) return false
  if (formData.operationStatus === 4 && !formData.bannedType) return false
  if (formData.operationStatus === 4 && formData.bannedType === 1 && !formData.bannedExpireDate) return false
  return true
})

const mutualExclusionNotice = computed(() => {
  if (!formData.operationStatus || !props.vehicle) return ''
  switch (formData.operationStatus) {
    case 1:
      return '恢复正常运营需满足：已备案、未锁定、无待检修、无未处理违规、证件均在有效期内'
    case 2:
      return '停运检修期间，车辆将禁止上线接单，排班计划将自动调整'
    case 4:
      return '违规封禁期间，车辆及关联司机将暂停所有运营权限'
    default:
      return ''
  }
})

const handleStatusChange = async (val: number) => {
  if (!props.vehicle) return
  validationResult.value = null
  validating.value = true
  try {
    const res = await validateStatusChangeApi(props.vehicle.id, val)
    validationResult.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '校验请求失败')
  } finally {
    validating.value = false
  }
}

const handleConfirm = async () => {
  if (!props.vehicle || !formData.operationStatus) return
  try {
    await formRef.value?.validate()
  } catch { return }

  const statusName = OperationStatusMap[formData.operationStatus as keyof typeof OperationStatusMap]
  try {
    await ElMessageBox.confirm(
      `确定将车辆 ${props.vehicle.plateNumber} 的运营状态变更为「${statusName}」吗？此操作将${formData.operationStatus === 1 ? '恢复' : '暂停'}该车辆的运营权限。`,
      '二次确认',
      {
        confirmButtonText: '确认变更',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
  } catch { return }

  confirmLoading.value = true
  try {
    await changeOperationStatusApi(props.vehicle.id, formData.operationStatus!, formData.remark)
    ElMessage.success('运营状态变更成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.message || '状态变更失败')
  } finally {
    confirmLoading.value = false
  }
}

const handleClose = () => {
  formData.operationStatus = undefined
  formData.bannedType = undefined
  formData.bannedExpireDate = undefined
  formData.remark = ''
  validationResult.value = null
  dialogVisible.value = false
}

watch(() => props.modelValue, (val) => {
  if (val && props.vehicle) {
    formData.operationStatus = undefined
  }
})
</script>

<style lang="scss" scoped>
.vehicle-status-change-dialog {
  .current-status-card {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;

    .vehicle-plate {
      font-size: 18px;
      font-weight: 700;
      color: #303133;
      margin-bottom: 8px;
    }

    .status-row, .info-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .label {
        color: #909399;
        font-size: 13px;
      }

      .ml-16 {
        margin-left: 16px;
      }
    }

    .banned-badge {
      margin-left: 8px;
    }
  }

  .validation-results {
    background: #fafafa;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px 16px;

    .validation-item {
      display: flex;
      align-items: center;
      padding: 6px 0;
      gap: 8px;

      .check-label {
        font-weight: 500;
        color: #606266;
        min-width: 100px;
      }

      .check-result {
        color: #909399;
        font-size: 13px;
      }

      &.passed {
        .el-icon {
          color: #67c23a;
        }
      }

      &.failed {
        .el-icon {
          color: #f56c6c;
        }

        .check-result {
          color: #f56c6c;
        }
      }
    }
  }

  .exclusion-notice {
    margin-top: 12px;
  }

  .mt-12 {
    margin-top: 12px;
  }

  .mt-16 {
    margin-top: 16px;
  }
}
</style>
