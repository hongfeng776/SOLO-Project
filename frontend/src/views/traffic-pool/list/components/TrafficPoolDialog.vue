<template>
  <Teleport to="body">
    <Transition name="dialog-scale">
      <el-dialog
        v-model="innerVisible"
        :title="dialogTitle"
        :width="720"
        :close-on-click-modal="false"
        class="traffic-pool-dialog"
        destroy-on-close
        @closed="handleClosed"
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
          :disabled="isViewMode"
        >
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="流量池名称" prop="poolName">
                <el-input
                  v-model="formData.poolName"
                  placeholder="请输入流量池名称"
                  maxlength="50"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="流量池编码" prop="poolCode">
                <el-input
                  v-model="formData.poolCode"
                  placeholder="请输入编码(英文+数字)"
                  :disabled="isEditMode"
                  maxlength="30"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="流量池等级" prop="poolLevel">
                <el-select
                  v-model="formData.poolLevel"
                  placeholder="请选择等级"
                  style="width: 100%"
                  @change="handleLevelChange"
                >
                  <el-option
                    v-for="(name, value) in TRAFFIC_POOL_LEVEL_NAMES"
                    :key="value"
                    :label="name"
                    :value="Number(value)"
                  >
                    <span style="display: flex; align-items: center; gap: 8px">
                      <span
                        class="level-dot"
                        :style="{ background: TRAFFIC_POOL_LEVEL_COLORS[Number(value)] }"
                      ></span>
                      {{ name }}
                      <span style="color: #909399; font-size: 12px">
                        质量分≥{{ LEVEL_REQUIRED_SCORE[Number(value)] }}
                      </span>
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="内容适配类型" prop="contentAdaptType">
                <el-select
                  v-model="formData.contentAdaptType"
                  placeholder="请选择内容类型"
                  style="width: 100%"
                >
                  <el-option
                    v-for="(name, value) in CONTENT_ADAPT_TYPE_NAMES"
                    :key="value"
                    :label="name"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item
                label="日流量配额"
                prop="dailyQuota"
                :class="{ 'shake-error': shakeQuota }"
              >
                <div class="input-with-validation">
                  <el-input-number
                    v-model="formData.dailyQuota"
                    :min="0"
                    :max="PLATFORM_TOTAL_FLOW_QUOTA"
                    :step="10000"
                    :controls="!isViewMode"
                    style="width: 100%"
                    @change="handleQuotaChange"
                  />
                  <div class="validation-icons">
                    <el-icon
                      v-if="quotaValidationState === 'valid'"
                      class="valid-icon"
                    >
                      <CircleCheckFilled />
                    </el-icon>
                    <el-icon
                      v-else-if="quotaValidationState === 'invalid'"
                      class="invalid-icon"
                    >
                      <CircleCloseFilled />
                    </el-icon>
                  </div>
                </div>
                <div v-if="quotaValidationState === 'invalid' && quotaErrors.length > 0" class="field-error-msg">
                  {{ quotaErrors[0] }}
                </div>
                <div class="quota-hint">
                  <span>平台总配额：{{ formatNumber(PLATFORM_TOTAL_FLOW_QUOTA) }}</span>
                  <span v-if="currentLevelRatio !== null">
                    当前等级占比：{{ (currentLevelRatio * 100).toFixed(1) }}%
                  </span>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="分发权重倍数" prop="weightMultiplier">
                <el-input-number
                  v-model="formData.weightMultiplier"
                  :min="0.1"
                  :max="10"
                  :step="0.1"
                  :precision="2"
                  :controls="!isViewMode"
                  style="width: 100%"
                />
                <div class="weight-hint">
                  影响池内内容曝光倍率
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">准入规则配置</el-divider>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item
                label="最低质量分"
                prop="minContentScore"
                :class="{ 'shake-error': shakeScore }"
              >
                <div class="input-with-validation">
                  <el-input-number
                    v-model="formData.minContentScore"
                    :min="0"
                    :max="100"
                    :step="5"
                    :controls="!isViewMode"
                    style="width: 100%"
                    @change="handleScoreChange"
                  />
                  <div class="validation-icons">
                    <el-icon
                      v-if="scoreValidationState === 'valid'"
                      class="valid-icon"
                    >
                      <CircleCheckFilled />
                    </el-icon>
                    <el-icon
                      v-else-if="scoreValidationState === 'invalid'"
                      class="invalid-icon"
                    >
                      <CircleCloseFilled />
                    </el-icon>
                  </div>
                </div>
                <div
                  v-if="scoreValidationState === 'invalid' && scoreErrors.length > 0"
                  class="field-error-msg"
                >
                  {{ scoreErrors[0] }}
                </div>
                <div class="score-hint">
                  {{ TRAFFIC_POOL_LEVEL_NAMES[formData.poolLevel] }}需≥{{ LEVEL_REQUIRED_SCORE[formData.poolLevel] }}分
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最大违规次数" prop="maxViolationCount">
                <el-input-number
                  v-model="formData.maxViolationCount"
                  :min="0"
                  :max="10"
                  :step="1"
                  :controls="!isViewMode"
                  style="width: 100%"
                />
                <div class="violation-hint">
                  超过次数的内容将被拦截
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="排序优先级" prop="sortOrder">
                <el-input-number
                  v-model="formData.sortOrder"
                  :min="0"
                  :max="999"
                  :controls="!isViewMode"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="启用状态" prop="status">
                <el-switch
                  v-model="formData.status"
                  :active-value="1"
                  :inactive-value="0"
                  :disabled="isViewMode"
                  active-text="启用"
                  inactive-text="停用"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="描述说明" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              maxlength="500"
              show-word-limit
              placeholder="请输入流量池描述"
            />
          </el-form-item>

          <el-form-item
            v-if="!isViewMode && showReasonField"
            label="变更原因"
            prop="reason"
          >
            <el-input
              v-model="reason"
              type="textarea"
              :rows="2"
              maxlength="200"
              placeholder="请输入变更原因"
            />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="handleClose">
            {{ isViewMode ? '关闭' : '取消' }}
          </el-button>
          <el-button
            v-if="!isViewMode"
            type="primary"
            :loading="saving"
            @click="handleSave"
          >
            保存配置
          </el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  reactive,
  nextTick
} from 'vue'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { formatNumber } from '@hooks/index'
import {
  validateTrafficPoolCreate,
  createTrafficPool,
  updateTrafficPool
} from '@api/traffic-pool'
import type {
  TrafficPool,
  QuotaStats,
  CreateValidationResult
} from '@/types/business'
import {
  TrafficPoolLevel,
  TRAFFIC_POOL_LEVEL_NAMES,
  TRAFFIC_POOL_LEVEL_COLORS,
  CONTENT_ADAPT_TYPE_NAMES,
  PLATFORM_TOTAL_FLOW_QUOTA
} from '@/enums/business'

const props = defineProps<{
  modelValue: boolean
  mode: 'create' | 'edit' | 'view'
  poolData: TrafficPool | null
  quotaStats: QuotaStats
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const LEVEL_REQUIRED_SCORE: Record<number, number> = {
  [TrafficPoolLevel.NORMAL]: 0,
  [TrafficPoolLevel.QUALITY]: 60,
  [TrafficPoolLevel.HOT]: 80,
  [TrafficPoolLevel.PREMIUM]: 90
}

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const isViewMode = computed(() => props.mode === 'view')
const isEditMode = computed(() => props.mode === 'edit')
const isCreateMode = computed(() => props.mode === 'create')

const showReasonField = computed(() => isEditMode.value)

const dialogTitle = computed(() => {
  if (isViewMode.value) return '流量池详情'
  if (isEditMode.value) return '编辑流量池配置'
  return '新建流量池'
})

const formRef = ref<FormInstance>()
const saving = ref(false)

const defaultFormData = {
  poolName: '',
  poolCode: '',
  poolLevel: TrafficPoolLevel.NORMAL,
  contentAdaptType: 'general',
  dailyQuota: 1000000,
  weightMultiplier: 1.0,
  minContentScore: 0,
  maxViolationCount: 3,
  description: '',
  status: 1,
  sortOrder: 0
}

const formData = reactive<any>({ ...defaultFormData })
const reason = ref('')

const validationResult = ref<CreateValidationResult | null>(null)
const quotaErrors = ref<string[]>([])
const scoreErrors = ref<string[]>([])
const shakeQuota = ref(false)
const shakeScore = ref(false)

const quotaValidationState = computed<'idle' | 'valid' | 'invalid'>(() => {
  if (!validationResult.value) return 'idle'
  return validationResult.value.quota.valid ? 'valid' : 'invalid'
})

const scoreValidationState = computed<'idle' | 'valid' | 'invalid'>(() => {
  if (!validationResult.value) return 'idle'
  return validationResult.value.admission.valid ? 'valid' : 'invalid'
})

const currentLevelRatio = computed(() => {
  if (!formData.poolLevel || !formData.dailyQuota) return null
  const levelQuota = Number(props.quotaStats?.byLevel?.[formData.poolLevel]?.quota || 0)
  const proposed = isEditMode.value
    ? levelQuota - Number(props.poolData?.dailyQuota || 0) + Number(formData.dailyQuota)
    : levelQuota + Number(formData.dailyQuota)
  return PLATFORM_TOTAL_FLOW_QUOTA > 0 ? proposed / PLATFORM_TOTAL_FLOW_QUOTA : 0
})

const formRules: FormRules = {
  poolName: [
    { required: true, message: '请输入流量池名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度2-50字符', trigger: 'blur' }
  ],
  poolCode: [
    { required: true, message: '请输入流量池编码', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '编码只能包含英文、数字和下划线', trigger: 'blur' }
  ],
  poolLevel: [{ required: true, message: '请选择流量池等级', trigger: 'change' }],
  contentAdaptType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  dailyQuota: [
    { required: true, message: '请输入日流量配额', trigger: 'blur' },
    { type: 'number', min: 0, message: '配额不能为负数', trigger: 'blur' }
  ],
  weightMultiplier: [
    { required: true, message: '请输入权重倍数', trigger: 'blur' },
    { type: 'number', min: 0.1, max: 10, message: '权重范围0.1-10', trigger: 'blur' }
  ],
  minContentScore: [
    { required: true, message: '请输入最低质量分', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '质量分范围0-100', trigger: 'blur' }
  ],
  maxViolationCount: [
    { required: true, message: '请输入最大违规次数', trigger: 'blur' },
    { type: 'number', min: 0, max: 10, message: '范围0-10', trigger: 'blur' }
  ]
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      if (props.poolData) {
        Object.assign(formData, {
          poolName: props.poolData.poolName,
          poolCode: props.poolData.poolCode,
          poolLevel: props.poolData.poolLevel,
          contentAdaptType: props.poolData.contentAdaptType,
          dailyQuota: Number(props.poolData.dailyQuota),
          weightMultiplier: Number(props.poolData.weightMultiplier),
          minContentScore: props.poolData.minContentScore,
          maxViolationCount: props.poolData.maxViolationCount,
          description: props.poolData.description,
          status: props.poolData.status,
          sortOrder: props.poolData.sortOrder
        })
      } else {
        Object.assign(formData, defaultFormData)
      }
      reason.value = ''
      validationResult.value = null
      quotaErrors.value = []
      scoreErrors.value = []
      if (!isViewMode.value) {
        runValidation()
      }
    }
  }
)

const triggerShake = (field: 'quota' | 'score') => {
  if (field === 'quota') {
    shakeQuota.value = true
    setTimeout(() => {
      shakeQuota.value = false
    }, 500)
  } else {
    shakeScore.value = true
    setTimeout(() => {
      shakeScore.value = false
    }, 500)
  }
}

const runValidation = async () => {
  try {
    const result = await validateTrafficPoolCreate({
      poolLevel: formData.poolLevel,
      contentAdaptType: formData.contentAdaptType,
      dailyQuota: Number(formData.dailyQuota),
      minContentScore: Number(formData.minContentScore),
      maxViolationCount: Number(formData.maxViolationCount)
    })
    validationResult.value = result
    quotaErrors.value = result.quota.errors || []
    scoreErrors.value = result.admission.errors || []
  } catch (e) {
    console.error(e)
  }
}

const handleQuotaChange = () => {
  nextTick(() => {
    runValidation()
    if (!validationResult.value?.quota.valid) {
      triggerShake('quota')
    }
  })
}

const handleScoreChange = () => {
  nextTick(() => {
    runValidation()
    if (!validationResult.value?.admission.valid) {
      triggerShake('score')
    }
  })
}

const handleLevelChange = () => {
  const requiredScore = LEVEL_REQUIRED_SCORE[formData.poolLevel] || 0
  if (Number(formData.minContentScore) < requiredScore) {
    formData.minContentScore = requiredScore
  }
  runValidation()
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (_e) {
    return
  }

  if (validationResult.value && !validationResult.value.valid) {
    if (!validationResult.value.quota.valid) {
      triggerShake('quota')
    }
    if (!validationResult.value.admission.valid) {
      triggerShake('score')
    }
    ElMessage.error('请检查配置参数是否合规')
    return
  }

  saving.value = true
  try {
    if (isCreateMode.value) {
      await createTrafficPool({ ...formData })
      ElMessage.success('创建成功')
    } else if (isEditMode.value && props.poolData) {
      await updateTrafficPool(props.poolData.id, {
        ...formData,
        reason: reason.value
      })
      ElMessage.success('更新成功，配置已即时生效')
    }
    emit('saved')
    handleClose()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  innerVisible.value = false
}

const handleClosed = () => {
  Object.assign(formData, defaultFormData)
  validationResult.value = null
  reason.value = ''
}
</script>

<style lang="scss" scoped>
.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.traffic-pool-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    margin: 0;
    padding: 16px 20px;

    .el-dialog__title {
      color: #fff;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: #fff;
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }

  :deep(.el-divider__text) {
    color: $text-primary;
    font-weight: 600;
  }

  .level-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }

  .input-with-validation {
    position: relative;
    display: flex;
    align-items: center;

    :deep(.el-input-number) {
      flex: 1;
    }

    .validation-icons {
      position: absolute;
      right: -28px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;

      .valid-icon {
        color: #67c23a;
        font-size: 20px;
        animation: check-pop 0.3s ease-out;
      }

      .invalid-icon {
        color: #f56c6c;
        font-size: 20px;
        animation: shake-icon 0.4s ease-in-out;
      }
    }
  }

  .field-error-msg {
    position: absolute;
    bottom: -20px;
    left: 0;
    font-size: 12px;
    color: #f56c6c;
    white-space: nowrap;
  }

  .quota-hint,
  .weight-hint,
  .score-hint,
  .violation-hint {
    font-size: 12px;
    color: $text-placeholder;
    margin-top: 4px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }

  .weight-hint,
  .violation-hint {
    justify-content: flex-start;
  }

  .shake-error {
    :deep(.el-input-number) {
      animation: shake-input 0.4s ease-in-out;
    }
  }

  @keyframes check-pop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    60% {
      transform: scale(1.3);
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes shake-icon {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-4px);
    }
    40%,
    80% {
      transform: translateX(4px);
    }
  }

  @keyframes shake-input {
    0%,
    100% {
      transform: translateX(0);
    }
    10%,
    30%,
    50%,
    70%,
    90% {
      transform: translateX(-4px);
    }
    20%,
    40%,
    60%,
    80% {
      transform: translateX(4px);
    }
  }
}
</style>
