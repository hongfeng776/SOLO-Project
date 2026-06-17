<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="720px"
    :close-on-click-modal="false"
    class="dialog-center-zoom"
    @close="handleClose"
    @open="handleDialogOpen"
  >
    <el-steps :active="activeStep" finish-status="success" align-center style="margin-bottom: 24px">
      <el-step title="基础信息" description="类型/板块/范围" />
      <el-step title="阈值参数" description="min/max/warning/trigger" />
      <el-step title="生效配置" description="临时/永久 + 预览确认" />
    </el-steps>

    <div class="step-content">
      <div v-show="activeStep === 0">
        <el-form :model="formData" label-width="100px">
          <el-form-item label="阈值类型" required>
            <el-radio-group v-model="formData.thresholdType">
              <el-radio value="change_rate">涨跌幅</el-radio>
              <el-radio value="volume">成交量</el-radio>
              <el-radio value="turnover">换手率</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="范围类型" required>
            <el-radio-group v-model="formData.scopeType">
              <el-radio value="global">全局</el-radio>
              <el-radio value="sector">指定板块</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="formData.scopeType === 'sector'" label="目标板块" required>
            <el-select
              v-model="selectedSectors"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择目标板块"
              style="width: 100%"
            >
              <el-option
                v-for="sector in STOCK_SECTORS"
                :key="sector"
                :label="sector"
                :value="sector"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息（可选）"
            />
          </el-form-item>
        </el-form>
      </div>

      <div v-show="activeStep === 1">
        <el-form :model="formData" label-width="120px">
          <el-form-item label="最小值" required>
            <div :class="['threshold-input-wrapper', { 'input-error-shake': fieldErrors.minValue }]">
              <el-popover
                v-if="fieldErrors.minValue"
                :width="280"
                placement="top"
                trigger="manual"
                :visible="!!fieldErrors.minValue"
              >
                <template #reference>
                  <el-input-number
                    v-model="formData.minValue"
                    :controls="false"
                    :precision="formData.thresholdType === 'volume' ? 0 : 2"
                    class="threshold-input"
                    @blur="handleFieldBlur('minValue')"
                  />
                </template>
                <div class="popover-error-content">
                  <p class="error-msg">{{ fieldErrors.minValue }}</p>
                  <p v-if="fieldSuggestions.minValue" class="suggestion-msg">
                    <span class="suggestion-label">建议：</span>{{ fieldSuggestions.minValue }}
                  </p>
                </div>
              </el-popover>
              <el-input-number
                v-else
                v-model="formData.minValue"
                :controls="false"
                :precision="formData.thresholdType === 'volume' ? 0 : 2"
                class="threshold-input"
                @blur="handleFieldBlur('minValue')"
              />
            </div>
          </el-form-item>

          <el-form-item label="最大值" required>
            <div :class="['threshold-input-wrapper', { 'input-error-shake': fieldErrors.maxValue }]">
              <el-popover
                v-if="fieldErrors.maxValue"
                :width="280"
                placement="top"
                trigger="manual"
                :visible="!!fieldErrors.maxValue"
              >
                <template #reference>
                  <el-input-number
                    v-model="formData.maxValue"
                    :controls="false"
                    :precision="formData.thresholdType === 'volume' ? 0 : 2"
                    class="threshold-input"
                    @blur="handleFieldBlur('maxValue')"
                  />
                </template>
                <div class="popover-error-content">
                  <p class="error-msg">{{ fieldErrors.maxValue }}</p>
                  <p v-if="fieldSuggestions.maxValue" class="suggestion-msg">
                    <span class="suggestion-label">建议：</span>{{ fieldSuggestions.maxValue }}
                  </p>
                </div>
              </el-popover>
              <el-input-number
                v-else
                v-model="formData.maxValue"
                :controls="false"
                :precision="formData.thresholdType === 'volume' ? 0 : 2"
                class="threshold-input"
                @blur="handleFieldBlur('maxValue')"
              />
            </div>
          </el-form-item>

          <el-form-item label="预警阈值" required>
            <div :class="['threshold-input-wrapper', { 'input-error-shake': fieldErrors.warningThreshold }]">
              <el-popover
                v-if="fieldErrors.warningThreshold"
                :width="280"
                placement="top"
                trigger="manual"
                :visible="!!fieldErrors.warningThreshold"
              >
                <template #reference>
                  <el-input-number
                    v-model="formData.warningThreshold"
                    :controls="false"
                    :precision="formData.thresholdType === 'volume' ? 0 : 2"
                    class="threshold-input"
                    @blur="handleFieldBlur('warningThreshold')"
                  />
                </template>
                <div class="popover-error-content">
                  <p class="error-msg">{{ fieldErrors.warningThreshold }}</p>
                  <p v-if="fieldSuggestions.warningThreshold" class="suggestion-msg">
                    <span class="suggestion-label">建议：</span>{{ fieldSuggestions.warningThreshold }}
                  </p>
                </div>
              </el-popover>
              <el-input-number
                v-else
                v-model="formData.warningThreshold"
                :controls="false"
                :precision="formData.thresholdType === 'volume' ? 0 : 2"
                class="threshold-input"
                @blur="handleFieldBlur('warningThreshold')"
              />
            </div>
          </el-form-item>

          <el-form-item label="触发阈值" required>
            <div :class="['threshold-input-wrapper', { 'input-error-shake': fieldErrors.triggerThreshold }]">
              <el-popover
                v-if="fieldErrors.triggerThreshold"
                :width="280"
                placement="top"
                trigger="manual"
                :visible="!!fieldErrors.triggerThreshold"
              >
                <template #reference>
                  <el-input-number
                    v-model="formData.triggerThreshold"
                    :controls="false"
                    :precision="formData.thresholdType === 'volume' ? 0 : 2"
                    class="threshold-input"
                    @blur="handleFieldBlur('triggerThreshold')"
                  />
                </template>
                <div class="popover-error-content">
                  <p class="error-msg">{{ fieldErrors.triggerThreshold }}</p>
                  <p v-if="fieldSuggestions.triggerThreshold" class="suggestion-msg">
                    <span class="suggestion-label">建议：</span>{{ fieldSuggestions.triggerThreshold }}
                  </p>
                </div>
              </el-popover>
              <el-input-number
                v-else
                v-model="formData.triggerThreshold"
                :controls="false"
                :precision="formData.thresholdType === 'volume' ? 0 : 2"
                class="threshold-input"
                @blur="handleFieldBlur('triggerThreshold')"
              />
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="activeStep === 2">
        <el-form :model="formData" label-width="100px">
          <el-form-item label="配置状态" required>
            <el-radio-group v-model="formData.configStatus">
              <el-radio value="permanent">永久生效</el-radio>
              <el-radio value="temporary">临时生效</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="生效时间" required>
            <el-date-picker
              v-model="formData.effectiveStart"
              type="datetime"
              placeholder="请选择生效开始时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item v-if="formData.configStatus === 'temporary'" label="失效时间" required>
            <el-date-picker
              v-model="formData.effectiveEnd"
              type="datetime"
              placeholder="请选择生效结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>

        <el-divider content-position="left">配置预览</el-divider>

        <el-descriptions class="threshold-preview-card" border :column="1" size="default">
          <el-descriptions-item label="阈值类型">
            {{ THRESHOLD_TYPE_LABELS[formData.thresholdType] }}
          </el-descriptions-item>
          <el-descriptions-item label="范围类型">
            {{ formData.scopeType === 'global' ? '全局' : '指定板块' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="formData.scopeType === 'sector'" label="目标板块">
            <el-tag
              v-for="sector in selectedSectors"
              :key="sector"
              type="info"
              effect="light"
              style="margin-right: 6px"
            >
              {{ sector }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最小值">{{ formData.minValue }}</el-descriptions-item>
          <el-descriptions-item label="最大值">{{ formData.maxValue }}</el-descriptions-item>
          <el-descriptions-item label="预警阈值">{{ formData.warningThreshold }}</el-descriptions-item>
          <el-descriptions-item label="触发阈值">{{ formData.triggerThreshold }}</el-descriptions-item>
          <el-descriptions-item label="配置状态">
            {{ formData.configStatus === 'permanent' ? '永久生效' : '临时生效' }}
          </el-descriptions-item>
          <el-descriptions-item label="生效时间">{{ formData.effectiveStart }}</el-descriptions-item>
          <el-descriptions-item v-if="formData.configStatus === 'temporary'" label="失效时间">
            {{ formData.effectiveEnd || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="formData.remark" label="备注">{{ formData.remark }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="showSuccessCheckmark" class="checkmark-pop">
          <svg viewBox="0 0 52 52" class="checkmark-svg">
            <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
            <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="activeStep > 0"
          @click="handlePrev"
        >
          上一步
        </el-button>
        <el-button
          v-if="activeStep < 2"
          type="primary"
          @click="handleNext"
        >
          下一步
        </el-button>
        <button
          v-if="activeStep === 2"
          class="threshold-btn"
          :disabled="submitting"
          @mousedown="handleBtnMouseDown"
          @mouseup="handleBtnMouseUp"
          @mouseleave="handleBtnMouseUp"
          @click="handleSubmit"
        >
          <span v-if="submitting" class="btn-loading">
            <i class="el-icon-loading" />
            提交中...
          </span>
          <span v-else>{{ props.isEdit ? '保存修改' : '确认提交' }}</span>
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/hooks/usePermission'
import { MARKET_SECTOR_LIST } from '@/constants/dictionaries'
import {
  checkRange,
  checkConflict,
  checkPeriod,
  createThreshold,
  updateThreshold,
} from '@/api/threshold'
import type {
  IQuoteThreshold,
  ThresholdType,
  ScopeType,
  ConfigStatus,
  IThresholdCreateData,
  IThresholdUpdateData,
  IThresholdValidationError,
} from '@/types/api'

const STOCK_SECTORS: string[] = MARKET_SECTOR_LIST.length > 0
  ? MARKET_SECTOR_LIST
  : ['金融', '科技', '医药', '消费', '能源', '制造', '地产', '其他']

const THRESHOLD_TYPE_LABELS: Record<ThresholdType, string> = {
  change_rate: '涨跌幅',
  volume: '成交量',
  turnover: '换手率',
}

type NumericFieldKey = 'minValue' | 'maxValue' | 'warningThreshold' | 'triggerThreshold'

interface IThresholdFormData {
  thresholdType: ThresholdType
  scopeType: ScopeType
  configStatus: ConfigStatus
  sector: string
  minValue: number
  maxValue: number
  warningThreshold: number
  triggerThreshold: number
  remark: string
  effectiveStart: string
  effectiveEnd: string | null
}

const props = defineProps<{
  modelValue: boolean
  isEdit?: boolean
  editData?: Partial<IQuoteThreshold>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [result: IQuoteThreshold]
}>()

const { hasPerm } = usePermission()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const dialogTitle = computed(() => {
  return props.isEdit ? '编辑阈值配置' : '新增阈值配置'
})

const activeStep = ref(0)
const submitting = ref(false)
const showSuccessCheckmark = ref(false)
const btnPressed = ref(false)
const selectedSectors = ref<string[]>([])

const defaultFormData = (): IThresholdFormData => ({
  thresholdType: 'change_rate',
  scopeType: 'global',
  configStatus: 'permanent',
  sector: 'GLOBAL',
  minValue: 0,
  maxValue: 0,
  warningThreshold: 0,
  triggerThreshold: 0,
  remark: '',
  effectiveStart: '',
  effectiveEnd: null,
})

const formData = reactive<IThresholdFormData>(defaultFormData())
const fieldErrors = reactive<Record<string, string>>({})
const fieldSuggestions = reactive<Record<string, string>>({})

watch(
  () => formData.configStatus,
  (val: ConfigStatus) => {
    if (val === 'permanent') {
      formData.effectiveEnd = null
    }
  },
)

watch(
  () => formData.scopeType,
  (val: ScopeType) => {
    if (val === 'global') {
      formData.sector = 'GLOBAL'
      selectedSectors.value = []
    }
  },
)

async function handleDialogOpen(): Promise<void> {
  if (!hasPerm('stock:threshold:manage')) {
    ElMessage.warning('您没有阈值配置管理权限')
    dialogVisible.value = false
    return
  }
  resetForm()
  if (props.isEdit && props.editData) {
    fillEditData(props.editData)
  }
  activeStep.value = 0
}

function resetForm(): void {
  Object.assign(formData, defaultFormData())
  Object.keys(fieldErrors).forEach((key: string) => {
    delete fieldErrors[key]
  })
  Object.keys(fieldSuggestions).forEach((key: string) => {
    delete fieldSuggestions[key]
  })
  selectedSectors.value = []
  showSuccessCheckmark.value = false
}

function fillEditData(data: Partial<IQuoteThreshold>): void {
  if (data.thresholdType) formData.thresholdType = data.thresholdType
  if (data.scopeType) formData.scopeType = data.scopeType
  if (data.configStatus) formData.configStatus = data.configStatus
  if (data.sector) formData.sector = data.sector
  if (typeof data.minValue === 'number') formData.minValue = data.minValue
  if (typeof data.maxValue === 'number') formData.maxValue = data.maxValue
  if (typeof data.warningThreshold === 'number') formData.warningThreshold = data.warningThreshold
  if (typeof data.triggerThreshold === 'number') formData.triggerThreshold = data.triggerThreshold
  if (data.remark) formData.remark = data.remark
  if (data.effectiveStart) formData.effectiveStart = data.effectiveStart
  if (data.effectiveEnd) formData.effectiveEnd = data.effectiveEnd

  if (data.scopeType === 'sector' && data.sector && data.sector !== 'GLOBAL') {
    selectedSectors.value = data.sector.split(',').filter(Boolean)
  }
}

function handleClose(): void {
  if (submitting.value) return
  dialogVisible.value = false
  resetForm()
}

function handlePrev(): void {
  if (activeStep.value > 0) {
    activeStep.value -= 1
  }
}

function handleNext(): void {
  if (activeStep.value === 0) {
    if (!validateStep1()) return
  } else if (activeStep.value === 1) {
    if (!validateStep2()) return
  }
  if (activeStep.value < 2) {
    activeStep.value += 1
  }
}

function validateStep1(): boolean {
  if (!formData.thresholdType) {
    ElMessage.warning('请选择阈值类型')
    return false
  }
  if (!formData.scopeType) {
    ElMessage.warning('请选择范围类型')
    return false
  }
  if (formData.scopeType === 'sector' && selectedSectors.value.length === 0) {
    ElMessage.warning('请选择至少一个目标板块')
    return false
  }
  return true
}

function validateStep2(): boolean {
  const numericFields: NumericFieldKey[] = ['minValue', 'maxValue', 'warningThreshold', 'triggerThreshold']
  for (const field of numericFields) {
    if (typeof formData[field] !== 'number' || Number.isNaN(formData[field])) {
      ElMessage.warning('请完整填写所有阈值参数')
      return false
    }
  }
  if (formData.minValue >= formData.maxValue) {
    ElMessage.warning('最小值必须小于最大值')
    return false
  }
  return true
}

async function handleFieldBlur(field: NumericFieldKey): Promise<void> {
  if (typeof formData[field] !== 'number' || Number.isNaN(formData[field])) {
    return
  }

  const checkData: Partial<IQuoteThreshold> = {
    thresholdType: formData.thresholdType,
    minValue: formData.minValue,
    maxValue: formData.maxValue,
    warningThreshold: formData.warningThreshold,
    triggerThreshold: formData.triggerThreshold,
  }

  try {
    const res = await checkRange(checkData)
    const errors: IThresholdValidationError[] = res.data?.errors ?? []

    delete fieldErrors[field]
    delete fieldSuggestions[field]

    const fieldError: IThresholdValidationError | undefined = errors.find(
      (e: IThresholdValidationError) => e.field === field,
    )

    if (fieldError) {
      fieldErrors[field] = fieldError.message
      if (fieldError.suggestion) {
        fieldSuggestions[field] = fieldError.suggestion
      }
      triggerShake(field)
    }
  } catch {
    // ignore
  }
}

function triggerShake(field: string): void {
  nextTick(() => {
    setTimeout(() => {
      delete fieldErrors[field]
    }, 2500)
  })
}

function handleBtnMouseDown(): void {
  btnPressed.value = true
}

function handleBtnMouseUp(): void {
  btnPressed.value = false
}

function buildSubmitData(): IThresholdCreateData {
  const sectorValue: string = formData.scopeType === 'global'
    ? 'GLOBAL'
    : selectedSectors.value.join(',')

  const data: IThresholdCreateData = {
    thresholdType: formData.thresholdType,
    sector: sectorValue,
    scopeType: formData.scopeType,
    configStatus: formData.configStatus,
    minValue: formData.minValue,
    maxValue: formData.maxValue,
    warningThreshold: formData.warningThreshold,
    triggerThreshold: formData.triggerThreshold,
    effectiveStart: formData.effectiveStart,
  }

  if (formData.remark) {
    data.remark = formData.remark
  }

  if (formData.configStatus === 'temporary' && formData.effectiveEnd) {
    data.effectiveEnd = formData.effectiveEnd
  }

  return data
}

async function handleSubmit(): Promise<void> {
  if (submitting.value) return

  if (!validateStep1() || !validateStep2()) {
    return
  }

  if (!formData.effectiveStart) {
    ElMessage.warning('请选择生效开始时间')
    return
  }

  if (formData.configStatus === 'temporary' && !formData.effectiveEnd) {
    ElMessage.warning('请选择生效结束时间')
    return
  }

  submitting.value = true

  try {
    const submitData: IThresholdCreateData = buildSubmitData()

    const [rangeRes, periodRes, conflictRes] = await Promise.all([
      checkRange(submitData),
      checkPeriod({
        effectiveStart: submitData.effectiveStart,
        effectiveEnd: submitData.effectiveEnd,
      }),
      checkConflict(submitData),
    ])

    const rangeErrors: IThresholdValidationError[] = rangeRes.data?.errors ?? []
    if (rangeErrors.length > 0) {
      applyFieldErrors(rangeErrors)
      ElMessage.error('存在参数校验错误，请检查')
      submitting.value = false
      return
    }

    if (!periodRes.data?.valid) {
      ElMessage.error(periodRes.data?.message ?? '生效时间校验失败')
      submitting.value = false
      return
    }

    if (conflictRes.data?.hasConflict) {
      const highConflicts = conflictRes.data.conflicts.filter(
        (c) => c.level === 'high',
      )
      if (highConflicts.length > 0) {
        try {
          await ElMessageBox.confirm(
            `检测到高风险配置冲突：${highConflicts[0].message}，是否确认提交？`,
            '配置冲突警告',
            {
              type: 'warning',
              confirmButtonText: '确认提交',
              cancelButtonText: '返回修改',
            },
          )
        } catch {
          submitting.value = false
          return
        }
      }
    }

    let result: IQuoteThreshold
    if (props.isEdit && props.editData?.id) {
      const updateData: IThresholdUpdateData = { ...submitData }
      if (props.editData.version) {
        updateData.version = props.editData.version
      }
      const updateRes = await updateThreshold(props.editData.id, updateData)
      result = updateRes.data as IQuoteThreshold
    } else {
      const createRes = await createThreshold(submitData)
      result = createRes.data as IQuoteThreshold
    }

    showSuccessCheck()
    ElMessage.success('阈值配置已生效，联动更新行情规则')
    emit('saved', result)

    setTimeout(() => {
      dialogVisible.value = false
      resetForm()
    }, 1000)
  } catch (e: unknown) {
    const err = e as { data?: { errors?: IThresholdValidationError[]; message?: string }; message?: string }
    if (err?.data?.errors && Array.isArray(err.data.errors)) {
      applyFieldErrors(err.data.errors)
    }
    const errMsg: string = err?.data?.message || err?.message || '提交失败'
    ElMessage.error(errMsg)
  } finally {
    setTimeout(() => {
      submitting.value = false
    }, 300)
  }
}

function applyFieldErrors(errors: IThresholdValidationError[]): void {
  Object.keys(fieldErrors).forEach((key: string) => {
    delete fieldErrors[key]
  })
  Object.keys(fieldSuggestions).forEach((key: string) => {
    delete fieldSuggestions[key]
  })
  errors.forEach((err: IThresholdValidationError) => {
    if (err.field) {
      fieldErrors[err.field] = err.message
      if (err.suggestion) {
        fieldSuggestions[err.field] = err.suggestion
      }
      triggerShake(err.field)
    }
  })
}

function showSuccessCheck(): void {
  showSuccessCheckmark.value = true
  setTimeout(() => {
    showSuccessCheckmark.value = false
  }, 800)
}
</script>

<style lang="scss" scoped>
.dialog-center-zoom {
  :deep(.el-dialog) {
    animation: dialogZoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
}

@keyframes dialogZoomIn {
  0% {
    transform: scale(0.85);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.step-content {
  padding: 24px 0;
  min-height: 320px;
}

.threshold-input-wrapper {
  width: 100%;
  position: relative;
}

.threshold-input {
  width: 100%;

  :deep(.el-input__wrapper) {
    transition: all 0.2s ease-out;
  }

  :deep(.el-input__wrapper.is-focus) {
    border-color: #1A3A5C;
    transform: scale(1.01);
    box-shadow: 0 0 0 3px rgba(26, 58, 92, 0.15);
  }
}

.focused-input {
  :deep(.el-input__wrapper) {
    border-color: #1A3A5C !important;
    transform: scale(1.01);
    box-shadow: 0 0 0 3px rgba(26, 58, 92, 0.15);
  }
}

.input-error-shake {
  :deep(.el-input__wrapper) {
    animation: shakeX 0.4s ease;
    border-color: #F56C6C !important;
    box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.15);
  }
}

@keyframes shakeX {
  0% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-2px);
  }
  80% {
    transform: translateX(2px);
  }
  100% {
    transform: translateX(0);
  }
}

.popover-error-content {
  .error-msg {
    color: #F56C6C;
    margin: 0 0 8px 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .suggestion-msg {
    color: #67C23A;
    margin: 0;
    font-size: 12px;
    line-height: 1.5;

    .suggestion-label {
      font-weight: 600;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.threshold-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: #1A3A5C;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease-out;
  transform: translate(0, 0);
  box-shadow: 0 2px 4px rgba(26, 58, 92, 0.25);

  &:hover:not(:disabled) {
    background: #234B75;
    box-shadow: 0 4px 8px rgba(26, 58, 92, 0.3);
  }

  &:active:not(:disabled),
  &.is-pressed {
    transform: translate(1px, 2px);
    background: #2C5282;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    background: #8A9BAE;
    cursor: not-allowed;
    opacity: 0.7;
    transition: opacity 0.3s ease;
  }

  .btn-loading {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.threshold-preview-card {
  margin-top: 8px;

  :deep(.el-descriptions__label) {
    width: 120px;
    font-weight: 500;
    color: #606266;
    background: #FAFBFC;
  }

  :deep(.el-descriptions__content) {
    color: #1f2d3d;
  }
}

.checkmark-pop {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
  pointer-events: none;
  animation: checkmarkPop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes checkmarkPop {
  0% {
    transform: translate(-50%, -50%) scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1) rotate(360deg);
    opacity: 1;
  }
}

.checkmark-svg {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: block;
  stroke-width: 3;
  stroke: #fff;
  stroke-miterlimit: 10;
  filter: drop-shadow(0 4px 12px rgba(103, 194, 58, 0.4));
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 3;
  stroke-miterlimit: 10;
  stroke: #67C23A;
  fill: #67C23A;
  animation: strokeFill 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  stroke: #fff;
  stroke-width: 4;
  animation: strokeDraw 0.4s 0.2s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

@keyframes strokeFill {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes strokeDraw {
  100% {
    stroke-dashoffset: 0;
  }
}
</style>
