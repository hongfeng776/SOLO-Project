<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <el-dialog
        v-model="innerVisible"
        :title="isEdit ? '编辑权重规则' : '新建权重规则'"
        width="720px"
        :close-on-click-modal="false"
        destroy-on-close
      >
        <el-form
          ref="formRef"
          :model="form"
          label-width="120px"
          @submit.prevent
        >
          <el-form-item label="规则名称" prop="ruleName" required>
            <el-input
              v-model="form.ruleName"
              placeholder="请输入规则名称"
              maxlength="100"
              show-word-limit
              @input="validateInline"
            />
          </el-form-item>

          <el-form-item label="生效场景" prop="sceneType" required>
            <el-radio-group v-model="form.sceneType" @change="validateInline">
              <el-radio-button label="daily">
                <el-icon><Sunny /></el-icon> 日常时段
              </el-radio-button>
              <el-radio-button label="activity">
                <el-icon><Present /></el-icon> 活动时段
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="优先级">
            <el-input-number
              v-model="form.priority"
              :min="0"
              :max="999"
              :step="1"
              style="width: 160px"
            />
            <span class="form-tip muted">数值越大，排序越靠前</span>
          </el-form-item>

          <el-divider content-position="left">
            <span class="divider-title">
              <el-icon><Aim /></el-icon>
              多维度权重配比（总和必须 100%）
            </span>
          </el-divider>

          <div class="weights-validate-card" :class="{ invalid: !lastValidation.valid, valid: lastValidation.valid && validated }">
            <div class="weights-header">
              <span class="sum-label">合计：</span>
              <span class="sum-value" :class="{ ok: totalSum === 100, err: totalSum !== 100 }">
                {{ totalSum }}%
              </span>
              <el-tag
                v-if="lastValidation.valid && validated"
                type="success"
                size="small"
                effect="light"
                class="check-tag"
              >
                <el-icon><CircleCheckFilled /></el-icon> 配比合规
              </el-tag>
              <el-tag
                v-else-if="validated"
                type="danger"
                size="small"
                effect="light"
                class="check-tag"
              >
                <el-icon><CircleCloseFilled /></el-icon> 配比错误
              </el-tag>
            </div>

            <div
              v-for="(dim, key) in dimensions"
              :key="key"
              class="weight-row"
              :class="{ invalid: validated && hasWeightError(String(key)) }"
            >
              <div class="dim-label">
                <span class="dim-dot" :style="{ background: dim.color }"></span>
                {{ dim.name }}
              </div>
              <div class="dim-input-wrap">
                <el-input-number
                  v-model="(form as any)[key]"
                  :min="0"
                  :max="60"
                  :step="1"
                  :controls="false"
                  class="weight-input"
                  @change="validateInline"
                />
                <span class="unit">%</span>
              </div>
              <div class="dim-bar-wrap">
                <div class="dim-bar">
                  <div
                    class="dim-bar-inner"
                    :style="{ width: ((form as any)[key]) + '%', background: dim.color }"
                  ></div>
                </div>
                <span class="dim-min-max muted">建议 5% ~ 60%</span>
              </div>
            </div>

            <div v-if="validated && !lastValidation.valid" class="validate-errors">
              <div v-for="(err, i) in lastValidation.errors" :key="i" class="err-line">
                <el-icon color="#f56c6c"><Warning /></el-icon>
                {{ err }}
              </div>
              <div v-if="lastValidation.blockDetail" class="block-detail">
                <el-tag type="danger" effect="dark" size="small">
                  拦截：{{ WEIGHT_RULE_BLOCK_REASON_NAMES[lastValidation.blockReason || ''] || lastValidation.blockReason }}
                </el-tag>
                <span class="muted block-detail-text">{{ lastValidation.blockDetail }}</span>
              </div>
            </div>
            <div v-if="lastValidation.warnings && lastValidation.warnings.length > 0" class="validate-warnings">
              <div v-for="(w, i) in lastValidation.warnings" :key="i" class="warn-line">
                <el-icon color="#e6a23c"><InfoFilled /></el-icon>
                {{ w }}
              </div>
            </div>
          </div>

          <el-form-item label="规则描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="请输入规则描述，可说明适用场景、特殊要求等"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="innerVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            {{ isEdit ? '保存修改' : '创建规则' }}
          </el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  Sunny, Present, Aim, Check, CircleCheckFilled, CircleCloseFilled, Warning, InfoFilled
} from '@element-plus/icons-vue'
import { ElMessage, type FormInstance } from 'element-plus'
import type { TrafficWeightRule, WeightRuleValidationResult } from '@/types/business'
import {
  WEIGHT_DIMENSION_NAMES,
  WEIGHT_DIMENSION_COLORS,
  WEIGHT_DIMENSION_DEFAULT,
  WEIGHT_RULE_BLOCK_REASON_NAMES
} from '@/enums/business'
import {
  validateTrafficWeightRule,
  createTrafficWeightRule,
  updateTrafficWeightRule
} from '@api/traffic-weight-rule'

const props = defineProps<{
  modelValue: boolean
  editData?: TrafficWeightRule | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  'success': [data: any]
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const isEdit = computed(() => !!props.editData?.id)
const formRef = ref<FormInstance>()
const submitting = ref(false)
const validated = ref(false)
const lastValidation = ref<WeightRuleValidationResult>({
  valid: true, errors: [], warnings: [], sum: 100, fairnessScore: 100
})

const defaultForm = () => ({
  ruleName: '',
  sceneType: 'daily',
  priority: 0,
  contentQualityWeight: WEIGHT_DIMENSION_DEFAULT.content_quality,
  userActivityWeight: WEIGHT_DIMENSION_DEFAULT.user_activity,
  interactionWeight: WEIGHT_DIMENSION_DEFAULT.interaction,
  complianceWeight: WEIGHT_DIMENSION_DEFAULT.compliance,
  description: ''
})

const form = reactive<any>(defaultForm())

const dimensions = computed(() => ([
  { key: 'contentQualityWeight', name: WEIGHT_DIMENSION_NAMES.content_quality, color: WEIGHT_DIMENSION_COLORS.content_quality },
  { key: 'userActivityWeight', name: WEIGHT_DIMENSION_NAMES.user_activity, color: WEIGHT_DIMENSION_COLORS.user_activity },
  { key: 'interactionWeight', name: WEIGHT_DIMENSION_NAMES.interaction, color: WEIGHT_DIMENSION_COLORS.interaction },
  { key: 'complianceWeight', name: WEIGHT_DIMENSION_NAMES.compliance, color: WEIGHT_DIMENSION_COLORS.compliance }
]))

const totalSum = computed(() =>
  Number(form.contentQualityWeight || 0) +
  Number(form.userActivityWeight || 0) +
  Number(form.interactionWeight || 0) +
  Number(form.complianceWeight || 0)
)

const validationPayload = computed(() => ({
  ruleName: form.ruleName,
  sceneType: form.sceneType,
  contentQualityWeight: Number(form.contentQualityWeight) || 0,
  userActivityWeight: Number(form.userActivityWeight) || 0,
  interactionWeight: Number(form.interactionWeight) || 0,
  complianceWeight: Number(form.complianceWeight) || 0
}))

const hasWeightError = (key: string) => {
  const val = Number((form as any)[key]) || 0
  if (val < 0) return true
  if (val > 60) return true
  if (totalSum.value !== 100) return true
  return false
}

let validateTimer: any = null
const validateInline = () => {
  validated.value = true
  clearTimeout(validateTimer)
  validateTimer = setTimeout(async () => {
    try {
      const r = await validateTrafficWeightRule(validationPayload.value)
      lastValidation.value = r as any
    } catch {
      lastValidation.value = { valid: true, errors: [], warnings: [], sum: totalSum.value, fairnessScore: 100 }
    }
  }, 200)
}

const handleSubmit = async () => {
  if (!form.ruleName || !String(form.ruleName).trim()) {
    ElMessage.warning('请输入规则名称')
    return
  }
  validated.value = true
  try {
    const validation = await validateTrafficWeightRule(validationPayload.value)
    lastValidation.value = validation as any
    if (!(validation as any).valid) {
      ElMessage.error('配置校验未通过，请检查权重配比')
      return
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '校验失败')
    return
  }

  submitting.value = true
  try {
    let result: any
    if (isEdit.value && props.editData) {
      result = await updateTrafficWeightRule(props.editData.id, { ...form, reason: '编辑修改' })
    } else {
      result = await createTrafficWeightRule(form)
    }
    if (result.success) {
      ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
      emit('success', result)
      innerVisible.value = false
    } else {
      ElMessage.error(result.errors?.[0] || result.blockDetail || '操作失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, (v) => {
  if (v) {
    validated.value = false
    lastValidation.value = { valid: true, errors: [], warnings: [], sum: 100, fairnessScore: 100 }
    if (props.editData) {
      Object.assign(form, {
        ruleName: props.editData.ruleName,
        sceneType: props.editData.sceneType,
        priority: props.editData.priority,
        contentQualityWeight: props.editData.contentQualityWeight,
        userActivityWeight: props.editData.userActivityWeight,
        interactionWeight: props.editData.interactionWeight,
        complianceWeight: props.editData.complianceWeight,
        description: props.editData.description || ''
      })
    } else {
      Object.assign(form, defaultForm())
    }
  }
})
</script>

<style lang="scss" scoped>
.form-tip {
  margin-left: 8px;
  font-size: 12px;
}
.divider-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
}

.weights-validate-card {
  padding: 18px 20px;
  border: 1px solid $border-color;
  border-radius: 6px;
  background: #fafbfc;
  transition: all 0.3s ease;
  margin-bottom: 18px;

  &.invalid {
    border-color: #f56c6c;
    background: rgba(245, 108, 108, 0.04);
    box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.08);
  }

  &.valid {
    border-color: #67c23a;
    background: rgba(103, 194, 58, 0.03);
  }

  .weights-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px dashed $border-color;

    .sum-label { font-size: 13px; color: $text-secondary; }
    .sum-value {
      font-family: 'DIN', monospace;
      font-size: 22px;
      font-weight: 700;

      &.ok { color: #67c23a; }
      &.err { color: #f56c6c; animation: shake-red 0.5s ease-in-out; }
    }
    .check-tag { margin-left: auto; }
  }

  .weight-row {
    display: grid;
    grid-template-columns: 110px 120px 1fr;
    align-items: center;
    gap: 14px;
    padding: 8px 0;
    border-radius: 4px;
    transition: all 0.25s ease;

    &.invalid {
      background: rgba(245, 108, 108, 0.06);
      padding-left: 6px;
      padding-right: 6px;
    }

    .dim-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;

      .dim-dot {
        width: 8px; height: 8px; border-radius: 50%;
        flex-shrink: 0;
      }
    }
    .dim-input-wrap {
      display: flex;
      align-items: center;
      gap: 4px;

      .weight-input {
        width: 80px;
        :deep(.el-input__inner) {
          text-align: right;
          font-family: 'DIN', monospace;
          font-weight: 600;
        }
      }
      .unit { color: $text-secondary; }
    }
    .dim-bar-wrap {
      .dim-bar {
        height: 8px;
        background: $border-color-light;
        border-radius: 4px;
        overflow: hidden;

        .dim-bar-inner {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
      }
      .dim-min-max {
        font-size: 11px;
        margin-top: 3px;
      }
    }
  }

  .validate-errors {
    margin-top: 12px;
    padding: 10px 12px;
    background: rgba(245, 108, 108, 0.05);
    border-radius: 4px;

    .err-line {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 12px;
      color: #f56c6c;
      margin-bottom: 4px;
    }
    .block-detail {
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      .block-detail-text {
        font-size: 12px;
      }
    }
  }

  .validate-warnings {
    margin-top: 10px;
    padding: 8px 12px;
    background: rgba(230, 162, 60, 0.06);
    border-radius: 4px;

    .warn-line {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #b88230;
    }
  }
}

@keyframes shake-red {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
</style>
