<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建风险评定"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="选择客户" prop="customerId">
        <el-input
          v-model="form.customerId"
          placeholder="请输入客户ID"
          clearable
          @blur="checkCustomerDataSync"
        />
      </el-form-item>

      <div v-if="customerId && syncCheckResult" class="sync-status-panel">
        <div class="sync-status-header">
          <el-icon :class="syncCheckResult.can_assess ? 'text-success' : 'text-danger'">
            <CircleCheck v-if="syncCheckResult.can_assess" />
            <CircleClose v-else />
          </el-icon>
          <span :class="syncCheckResult.can_assess ? 'text-success' : 'text-danger'">
            {{ syncCheckResult.can_assess ? '数据同步完成，可以评定' : '数据未完成同步，禁止评定' }}
          </span>
        </div>

        <div v-if="syncCheckResult.missing_data_types.length > 0" class="sync-error">
          <div class="sync-error-title">缺失的数据类型：</div>
          <div class="sync-error-list">
            <el-tag v-for="(item, index) in syncCheckResult.missing_data_types" :key="index" type="danger" effect="light" size="small">
              {{ item }}
            </el-tag>
          </div>
        </div>

        <div v-if="syncCheckResult.syncing_data_types.length > 0" class="sync-warning">
          <div class="sync-warning-title">正在同步的数据类型：</div>
          <div class="sync-warning-list">
            <el-tag v-for="(item, index) in syncCheckResult.syncing_data_types" :key="index" type="warning" effect="light" size="small">
              {{ item }}
            </el-tag>
          </div>
        </div>
      </div>

      <el-form-item label="评定类型" prop="assessmentType">
        <el-select v-model="form.assessmentType" placeholder="请选择评定类型" style="width: 100%">
          <el-option v-for="item in AssessmentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="手动调整等级" prop="manualRiskLevel">
        <el-select v-model="form.manualRiskLevel" placeholder="如需人工调整请选择（可选）" style="width: 100%" clearable>
          <el-option v-for="item in RiskLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="风险标签" prop="riskTags">
        <el-select
          v-model="form.riskTags"
          multiple
          filterable
          allow-create
          placeholder="可输入自定义风险标签（可选）"
          style="width: 100%"
        >
          <el-option label="高负债" value="高负债" />
          <el-option label="逾期记录" value="逾期记录" />
          <el-option label="涉诉" value="涉诉" />
          <el-option label="异常交易" value="异常交易" />
          <el-option label="高风险地区" value="高风险地区" />
          <el-option label="可疑行为" value="可疑行为" />
        </el-select>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!syncCheckResult?.can_assess"
        @click="handleSubmit"
      >
        开始评定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  createRiskAssessmentApi,
  checkDataSyncApi,
  validateWeightsApi,
  AssessmentTypeOptions,
  RiskLevelOptions,
  type DataSyncCheckResult
} from '@api/riskAssessment'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': []
}>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref<FormInstance>()
const submitting = ref<boolean>(false)
const syncCheckResult = ref<DataSyncCheckResult | null>(null)
const weightValidation = ref<any>(null)

const customerId = computed(() => form.customerId)

const form = reactive({
  customerId: '',
  assessmentType: 1,
  manualRiskLevel: undefined as number | undefined,
  riskTags: [] as string[],
  remark: ''
})

const rules: FormRules = {
  customerId: [{ required: true, message: '请输入客户ID', trigger: 'blur' }],
  assessmentType: [{ required: true, message: '请选择评定类型', trigger: 'change' }]
}

watch(dialogVisible, async (val) => {
  if (val) {
    resetForm()
    try {
      const weightRes = await validateWeightsApi()
      weightValidation.value = weightRes.data
      if (!weightRes.data.is_valid) {
        ElMessage.warning(`指标权重配置异常：${weightRes.data.error_message}`)
      }
    } catch (error: any) {
      ElMessage.error('获取权重配置失败')
    }
  }
})

const resetForm = () => {
  form.customerId = ''
  form.assessmentType = 1
  form.manualRiskLevel = undefined
  form.riskTags = []
  form.remark = ''
  syncCheckResult.value = null
  weightValidation.value = null
  formRef.value?.resetFields()
}

const checkCustomerDataSync = async () => {
  if (!form.customerId) {
    syncCheckResult.value = null
    return
  }

  try {
    const res = await checkDataSyncApi(form.customerId)
    syncCheckResult.value = res.data

    if (!res.data.can_assess) {
      ElMessage.warning(res.data.error_message || '数据未同步完成，禁止评定')
    } else {
      ElMessage.success('数据同步完成，可以进行评定')
    }
  } catch (error: any) {
    syncCheckResult.value = {
      can_assess: false,
      missing_data_types: [],
      syncing_data_types: [],
      error_message: error.message
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (!syncCheckResult.value?.can_assess) {
      ElMessage.error('数据未同步完成，禁止评定')
      return
    }

    submitting.value = true
    try {
      const requestData: any = {
        customer_id: form.customerId,
        assessment_type: form.assessmentType
      }

      if (form.manualRiskLevel) {
        requestData.manual_risk_level = form.manualRiskLevel
      }
      if (form.riskTags && form.riskTags.length > 0) {
        requestData.manual_risk_tags = form.riskTags
      }
      if (form.remark) {
        requestData.remark = form.remark
      }

      await createRiskAssessmentApi(requestData)
      ElMessage.success('风险评定创建成功')
      emit('success')
    } catch (error: any) {
      ElMessage.error(error.message || '创建评定失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleCancel = () => {
  dialogVisible.value = false
}
</script>

<style scoped lang="scss">
.sync-status-panel {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.sync-status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.sync-error,
.sync-warning {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
}

.sync-error-title,
.sync-warning-title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.sync-error-list,
.sync-warning-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
