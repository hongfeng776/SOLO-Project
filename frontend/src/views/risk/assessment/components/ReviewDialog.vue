<template>
  <el-dialog
    v-model="dialogVisible"
    title="风险等级复核"
    width="700px"
    :close-on-click-modal="false"
  >
    <div v-if="loading" class="loading-container">
      <el-loading text="加载中..." />
    </div>

    <div v-else-if="assessmentDetail">
      <div class="assessment-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评定编号">
            {{ assessmentDetail.assessment_no }}
          </el-descriptions-item>
          <el-descriptions-item label="客户信息">
            {{ assessmentDetail.customer_name }} ({{ assessmentDetail.customer_no }})
          </el-descriptions-item>
          <el-descriptions-item label="当前风险等级">
            <el-tag :type="getRiskLevelType(assessmentDetail.risk_level)" effect="dark" size="small">
              {{ assessmentDetail.risk_level_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="综合评分">
            <span :class="getScoreClass(assessmentDetail.total_score)">{{ assessmentDetail.total_score }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="评定类型">
            {{ assessmentDetail.assessment_type_text }}
          </el-descriptions-item>
          <el-descriptions-item label="评定时间">
            {{ assessmentDetail.assessment_time }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider>指标详情</el-divider>

      <div class="indicator-table">
        <el-table :data="assessmentDetail.indicator_scores || []" size="small">
          <el-table-column prop="indicator_name" label="指标名称" width="150" />
          <el-table-column prop="category" label="类别" width="80">
            <template #default="{ row }">
              {{ getCategoryText(row.category) }}
            </template>
          </el-table-column>
          <el-table-column prop="raw_value" label="原始值" width="100" />
          <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
          <el-table-column prop="score" label="得分" width="80" align="center" />
          <el-table-column prop="weighted_score" label="加权得分" width="100" align="center" />
          <el-table-column prop="scoring_details" label="评分说明" />
        </el-table>
      </div>

      <el-divider>复核调整</el-divider>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="调整后等级" prop="riskLevel">
          <el-select v-model="form.riskLevel" placeholder="请选择调整后的风险等级" style="width: 100%">
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
            <el-option label="人工复核" value="人工复核" />
          </el-select>
        </el-form-item>

        <el-form-item label="复核备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入复核说明，必填项"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <div v-if="illegalCheckResult" class="illegal-check-panel" :class="{ 'is-danger': illegalCheckResult.is_illegal }">
        <el-icon :class="illegalCheckResult.is_illegal ? 'text-danger' : 'text-success'">
          <CircleCheck v-if="!illegalCheckResult.is_illegal" />
          <CircleClose v-else />
        </el-icon>
        <div class="illegal-check-content">
          <div class="illegal-check-title">
            {{ illegalCheckResult.is_illegal ? '存在违规调低风险' : '合规检查通过' }}
          </div>
          <div v-if="illegalCheckResult.block_reason" class="illegal-check-desc">
            {{ illegalCheckResult.block_reason }}
          </div>
          <div v-if="illegalCheckResult.high_risk_reasons && illegalCheckResult.high_risk_reasons.length > 0">
            <div class="illegal-check-subtitle">高风险因素：</div>
            <div class="illegal-check-reasons">
              <el-tag v-for="(reason, index) in illegalCheckResult.high_risk_reasons" :key="index" type="danger" effect="light" size="small">
                {{ reason }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        确认复核
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  getRiskAssessmentDetailApi,
  reviewRiskAssessmentApi,
  checkIllegalDowngradeApi,
  RiskLevelOptions,
  IndicatorCategoryOptions,
  type RiskAssessment,
  type IllegalDowngradeCheckResult
} from '@api/riskAssessment'

const props = defineProps<{
  modelValue: boolean
  assessmentId: string
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
const loading = ref<boolean>(false)
const submitting = ref<boolean>(false)
const assessmentDetail = ref<RiskAssessment | null>(null)
const illegalCheckResult = ref<IllegalDowngradeCheckResult | null>(null)

const form = reactive({
  riskLevel: undefined as number | undefined,
  riskTags: [] as string[],
  remark: ''
})

const rules: FormRules = {
  riskLevel: [{ required: true, message: '请选择调整后的风险等级', trigger: 'change' }],
  remark: [{ required: true, message: '请输入复核备注', trigger: 'blur' }]
}

const canSubmit = computed(() => {
  return form.riskLevel !== undefined && form.remark !== '' && !illegalCheckResult.value?.is_illegal
})

watch(() => props.assessmentId, async (val) => {
  if (val && dialogVisible.value) {
    await fetchDetail()
  }
})

watch(dialogVisible, async (val) => {
  if (val && props.assessmentId) {
    await fetchDetail()
  } else {
    resetForm()
  }
})

watch(() => form.riskLevel, async (newVal) => {
  if (newVal && assessmentDetail.value) {
    await checkIllegalDowngrade(newVal)
  } else {
    illegalCheckResult.value = null
  }
})

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getRiskAssessmentDetailApi(props.assessmentId)
    assessmentDetail.value = res.data
    form.riskLevel = res.data.risk_level
    form.riskTags = res.data.risk_tag_list || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  } finally {
    loading.value = false
  }
}

const checkIllegalDowngrade = async (requestedLevel: number) => {
  if (!assessmentDetail.value) return

  try {
    const res = await checkIllegalDowngradeApi(assessmentDetail.value.customer_id, {
      requested_risk_level: requestedLevel,
      current_risk_level: assessmentDetail.value.risk_level
    })
    illegalCheckResult.value = res.data

    if (res.data.is_illegal) {
      ElMessage.warning(res.data.block_reason || '存在违规调低风险等级的情况')
    }
  } catch (error: any) {
    illegalCheckResult.value = null
  }
}

const resetForm = () => {
  form.riskLevel = undefined
  form.riskTags = []
  form.remark = ''
  assessmentDetail.value = null
  illegalCheckResult.value = null
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (illegalCheckResult.value?.is_illegal) {
      ElMessage.error('存在违规调低风险等级的情况，无法提交')
      return
    }

    submitting.value = true
    try {
      await reviewRiskAssessmentApi(props.assessmentId, {
        risk_level: form.riskLevel!,
        risk_tags: form.riskTags,
        remark: form.remark
      })
      ElMessage.success('复核成功')
      emit('success')
    } catch (error: any) {
      ElMessage.error(error.message || '复核失败')
    } finally {
      submitting.value = false
    }
  })
}

const handleCancel = () => {
  dialogVisible.value = false
}

const getRiskLevelType = (level: number) => {
  const option = RiskLevelOptions.find(item => item.value === level)
  return option?.color || 'info'
}

const getCategoryText = (category: number) => {
  const option = IndicatorCategoryOptions.find(item => item.value === category)
  return option?.label || '-'
}

const getScoreClass = (score: number) => {
  if (score >= 70) return 'text-success font-bold'
  if (score >= 50) return 'text-warning font-bold'
  if (score >= 30) return 'text-orange font-bold'
  return 'text-danger font-bold'
}
</script>

<style scoped lang="scss">
.loading-container {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.assessment-info {
  margin-bottom: 16px;
}

.indicator-table {
  max-height: 250px;
  overflow-y: auto;
}

.illegal-check-panel {
  display: flex;
  gap: 12px;
  padding: 16px;
  margin-top: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);

  &.is-danger {
    background: rgba(245, 108, 108, 0.1);
    border-color: var(--el-color-danger-lighter);
  }

  .el-icon {
    font-size: 24px;
    flex-shrink: 0;
  }
}

.illegal-check-content {
  flex: 1;
}

.illegal-check-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.illegal-check-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}

.illegal-check-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.illegal-check-reasons {
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

.text-warning {
  color: var(--el-color-warning);
}

.text-orange {
  color: var(--el-color-warning);
}

.font-bold {
  font-weight: 600;
}
</style>
