<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template v-if="!hasManagePermission">
      <el-alert type="warning" title="无录入权限，当前为只读模式" show-icon :closable="false" style="margin-bottom: 16px" />
    </template>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="手动录入" name="manual">
        <div class="session-info-bar">
          <div class="session-badges">
            <el-tag
              v-for="badge in sessionBadges"
              :key="badge.label"
              :type="badge.type"
              effect="light"
              class="session-badge"
            >
              {{ badge.label }}
            </el-tag>
          </div>
          <div class="storage-info">
            <span class="info-label">数据时段：</span>
            <span class="info-value">{{ dataPeriodLabel }}</span>
            <span class="info-divider">|</span>
            <span class="info-label">存储策略：</span>
            <span class="info-value">保留最近5条快照</span>
          </div>
        </div>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          :disabled="!hasManagePermission"
        >
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="股票代码" prop="stockCode">
                <div :class="['entry-input-wrapper', { 'has-error': fieldErrors.stockCode }]">
                  <el-input
                    v-model="formData.stockCode"
                    placeholder="请输入股票代码"
                    class="entry-input"
                    @blur="handleStockCodeBlur"
                  >
                    <template #suffix>
                      <el-icon v-if="codeChecking" class="is-loading"><Loading /></el-icon>
                      <el-icon v-else-if="codeRegistered === true" style="color: #67C23A"><CircleCheckFilled /></el-icon>
                      <el-icon v-else-if="codeRegistered === false" style="color: #F56C6C"><Warning /></el-icon>
                    </template>
                  </el-input>
                </div>
                <div v-if="codeRegistered === false" class="field-error-text">
                  该股票代码未在系统中备案，请先完成备案
                </div>
                <div v-if="fieldErrors.stockCode" class="field-error-text">
                  {{ fieldErrors.stockCode }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="股票名称" prop="stockName">
                <div :class="['entry-input-wrapper', { 'has-error': fieldErrors.stockName }]">
                  <el-input
                    v-model="formData.stockName"
                    placeholder="请输入股票名称"
                    class="entry-input"
                  />
                </div>
                <div v-if="fieldErrors.stockName" class="field-error-text">
                  {{ fieldErrors.stockName }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市场" prop="market">
                <el-select v-model="formData.market" placeholder="请选择市场" style="width: 100%">
                  <el-option
                    v-for="(label, value) in MARKET_LABELS"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="板块" prop="sector">
                <el-select v-model="formData.sector" placeholder="请选择板块" style="width: 100%">
                  <el-option v-for="sector in MARKET_SECTOR_LIST" :key="sector" :label="sector" :value="sector" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="状态" prop="status">
                <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                  <el-option
                    v-for="(label, value) in STOCK_STATUS_LABELS"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="交易日期" prop="tradeDate">
                <el-date-picker
                  v-model="formData.tradeDate"
                  type="date"
                  placeholder="请选择交易日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="现价" prop="currentPrice">
                <div :class="['entry-input-wrapper', { 'has-error': fieldErrors.currentPrice }]">
                  <el-input-number
                    v-model="formData.currentPrice"
                    :min="0"
                    :precision="2"
                    :controls="false"
                    :disabled="formData.status !== 'trading'"
                    class="entry-input entry-number-input"
                    @blur="handlePriceBlur"
                  />
                </div>
                <div v-if="fieldErrors.currentPrice" class="field-error-text">
                  {{ fieldErrors.currentPrice }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="涨跌额" prop="changeAmount">
                <div :class="['entry-input-wrapper', { 'has-error': fieldErrors.changeAmount }]">
                  <el-input-number
                    v-model="formData.changeAmount"
                    :precision="2"
                    :controls="false"
                    :disabled="formData.status === 'suspended'"
                    class="entry-input entry-number-input"
                  />
                </div>
                <div v-if="fieldErrors.changeAmount" class="field-error-text">
                  {{ fieldErrors.changeAmount }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="涨跌幅(%)" prop="changeRate">
                <div :class="['entry-input-wrapper', { 'has-error': fieldErrors.changeRate }]">
                  <el-input-number
                    v-model="formData.changeRate"
                    :precision="2"
                    :controls="false"
                    :disabled="formData.status === 'suspended'"
                    class="entry-input entry-number-input"
                  />
                </div>
                <div v-if="fieldErrors.changeRate" class="field-error-text">
                  {{ fieldErrors.changeRate }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开盘价" prop="openPrice">
                <el-input-number
                  v-model="formData.openPrice"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  :disabled="formData.status !== 'trading'"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="收盘价" prop="closePrice">
                <el-input-number
                  v-model="formData.closePrice"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  :disabled="formData.status !== 'trading'"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最高价" prop="highPrice">
                <el-input-number
                  v-model="formData.highPrice"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  :disabled="formData.status !== 'trading'"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="最低价" prop="lowPrice">
                <el-input-number
                  v-model="formData.lowPrice"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  :disabled="formData.status !== 'trading'"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成交量" prop="volume">
                <el-input-number
                  v-model="formData.volume"
                  :min="0"
                  :precision="0"
                  :controls="false"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成交额" prop="turnover">
                <el-input-number
                  v-model="formData.turnover"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市盈率" prop="peRatio">
                <el-input-number
                  v-model="formData.peRatio"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="市净率" prop="pbRatio">
                <el-input-number
                  v-model="formData.pbRatio"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="总市值" prop="totalMarketCap">
                <el-input-number
                  v-model="formData.totalMarketCap"
                  :min="0"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>

      <el-tab-pane label="模板导入" name="template">
        <div class="template-guide">
          <el-steps :active="2" finish-status="success" simple>
            <el-step title="下载模板" />
            <el-step title="填写数据" />
            <el-step title="前往导入" />
          </el-steps>
          <div class="template-actions">
            <el-button type="primary" :icon="Download" @click="handleJumpToImport">
              前往批量导入页面
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        v-if="hasManagePermission && activeTab === 'manual'"
        type="primary"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ mode === 'edit' ? '保存修改' : '确认录入' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Loading,
  CircleCheckFilled,
  Warning,
  Download,
} from '@element-plus/icons-vue'
import { usePermission } from '@/hooks/usePermission'
import {
  MARKET_LABELS,
  STOCK_STATUS_LABELS,
  MARKET_SECTOR_LIST,
} from '@/constants/dictionaries'
import * as stockApi from '@/api/stockQuote'
import type { IStockQuote, IQuoteValidationError } from '@/types/api'

const props = defineProps<{
  visible: boolean
  mode?: 'create' | 'edit'
  initialData?: Partial<IStockQuote>
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [data: IStockQuote]
  refresh: []
}>()

const { hasPerm } = usePermission()

const hasManagePermission = computed(() => hasPerm('stock:manage'))
const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

const dialogTitle = computed(() => {
  if (!hasManagePermission.value) return '查看行情数据'
  return props.mode === 'edit' ? '编辑行情数据' : '录入行情数据'
})

const activeTab = ref<'manual' | 'template'>('manual')
const submitting = ref(false)
const codeChecking = ref(false)
const codeRegistered = ref<boolean | null>(null)
const priceChecked = ref(false)

const formRef = ref<FormInstance>()

const defaultFormData = (): Partial<IStockQuote> => ({
  stockCode: '',
  stockName: '',
  market: '',
  sector: '',
  status: 'trading',
  tradeDate: new Date().toISOString().slice(0, 10),
  currentPrice: 0,
  changeAmount: 0,
  changeRate: 0,
  openPrice: 0,
  closePrice: 0,
  highPrice: 0,
  lowPrice: 0,
  volume: 0,
  turnover: 0,
  peRatio: 0,
  pbRatio: 0,
  totalMarketCap: 0,
})

const formData = reactive<Partial<IStockQuote>>(defaultFormData())
const fieldErrors = reactive<Record<string, string>>({})

const formRules: FormRules = {
  stockCode: [{ required: true, message: '请输入股票代码', trigger: 'blur' }],
  stockName: [{ required: true, message: '请输入股票名称', trigger: 'blur' }],
  market: [{ required: true, message: '请选择市场', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  tradeDate: [{ required: true, message: '请选择交易日期', trigger: 'change' }],
  currentPrice: [{ required: true, message: '请输入现价', trigger: 'blur' }],
}

const dataPeriodLabel = computed(() => {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const s = now.getSeconds()
  const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  let period = '盘后'
  if (h >= 9 && h < 11 || (h === 11 && m < 30)) {
    period = '早盘'
  } else if ((h === 11 && m >= 30) || (h >= 13 && h < 15)) {
    period = '午盘'
  }
  return `${period} ${timeStr}`
})

const sessionBadges = computed(() => {
  const badges: Array<{ label: string; type: 'primary' | 'success' | 'warning' | 'info' | 'danger' }> = []
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  if (h >= 9 && h < 11 || (h === 11 && m < 30)) {
    badges.push({ label: '早盘', type: 'primary' })
  }
  if ((h === 11 && m >= 30) || (h >= 13 && h < 15)) {
    badges.push({ label: '午盘', type: 'success' })
  }
  if (h >= 15 || h < 9) {
    badges.push({ label: '盘后', type: 'info' })
  }
  return badges
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm()
      if (props.initialData) {
        Object.assign(formData, props.initialData)
      }
    }
  },
  { immediate: true },
)

function resetForm() {
  Object.assign(formData, defaultFormData())
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key]
  })
  codeRegistered.value = null
  priceChecked.value = false
  formRef.value?.resetFields()
}

function handleClose() {
  if (submitting.value) return
  dialogVisible.value = false
  resetForm()
}

async function handleStockCodeBlur() {
  if (!formData.stockCode) {
    codeRegistered.value = null
    return
  }
  codeChecking.value = true
  try {
    const res = await stockApi.checkRegistered(formData.stockCode)
    codeRegistered.value = res.data?.registered ?? true
    if (!codeRegistered.value) {
      triggerShake('stockCode')
    }
  } catch {
    codeRegistered.value = true
  } finally {
    codeChecking.value = false
  }
}

async function handlePriceBlur() {
  if (!formData.currentPrice || !formData.id) {
    priceChecked.value = false
    return
  }
  try {
    const res = await stockApi.checkFluctuation(formData.id, formData.currentPrice)
    const exceedThreshold = res.data?.exceedThreshold ?? false
    const changePercent = res.data?.changePercent ?? 0
    if (exceedThreshold) {
      await ElMessageBox.confirm(
        `当前价格较上次波动 ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%，超过 ±10% 阈值，是否确认录入？`,
        '波动阈值警告',
        {
          type: 'warning',
          confirmButtonText: '确认录入',
          cancelButtonText: '修改价格',
        },
      )
      priceChecked.value = true
    } else {
      priceChecked.value = true
    }
  } catch (e) {
    if (e === 'cancel') {
      priceChecked.value = false
    } else {
      priceChecked.value = true
    }
  }
}

function triggerShake(field: string) {
  fieldErrors[field] = ''
  setTimeout(() => {
    delete fieldErrors[field]
  }, 500)
}

function applyValidationErrors(errors: IQuoteValidationError[]) {
  Object.keys(fieldErrors).forEach((key) => {
    delete fieldErrors[key]
  })
  errors.forEach((err) => {
    if (err.field) {
      fieldErrors[err.field] = err.message
    }
  })
}

async function handleSubmit() {
  if (!formRef.value || !hasManagePermission.value) return
  if (codeRegistered.value === false) {
    ElMessage.error('股票代码未备案，无法录入')
    triggerShake('stockCode')
    return
  }

  try {
    await formRef.value.validate()

    submitting.value = true
    try {
      const res = await stockApi.createWithAudit(formData)
      ElMessage({
        message: `${props.mode === 'edit' ? '保存成功' : '录入成功'} ✓`,
        type: 'success',
        duration: 2500,
        customClass: 'success-checkmark-msg',
      })
      emit('success', res.data as IStockQuote)
      emit('refresh')
      setTimeout(() => {
        dialogVisible.value = false
        resetForm()
      }, 300)
    } catch (e: any) {
      const errMessage = e?.message || '提交失败'
      if (e?.data?.errors && Array.isArray(e.data.errors)) {
        applyValidationErrors(e.data.errors)
      }
      if (e?.data?.fieldErrors) {
        Object.entries(e.data.fieldErrors as Record<string, string>).forEach(([k, v]) => {
          fieldErrors[k] = v
        })
      }
      ElMessage.error(errMessage)
    } finally {
      setTimeout(() => {
        submitting.value = false
      }, 300)
    }
  } catch {
    ElMessage.warning('请完善必填项')
  }
}

function handleJumpToImport() {
  dialogVisible.value = false
}
</script>

<style lang="scss" scoped>
.entry-input-wrapper {
  width: 100%;

  &.has-error {
    :deep(.entry-input) {
      animation: shakeX 0.4s ease;
      border-color: #F56C6C !important;
    }
  }
}

.entry-input {
  transition: all 0.2s ease-out;
  border: 1px solid #dcdfe6;
  border-radius: 4px;

  &:focus-within {
    border-color: #1A3A5C;
    transform: scale(1.01);
    box-shadow: 0 0 0 3px rgba(26, 58, 92, 0.15);
  }
}

.entry-number-input {
  width: 100%;
}

.field-error-text {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  line-height: 1.4;
}

.session-info-bar {
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e4e9f2;

  .session-badges {
    display: flex;
    gap: 8px;
  }

  .session-badge {
    font-weight: 500;
  }

  .storage-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #606266;

    .info-label {
      color: #909399;
    }

    .info-value {
      color: #1f2d3d;
      font-weight: 500;
    }

    .info-divider {
      color: #dcdfe6;
      margin: 0 4px;
    }
  }
}

.template-guide {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;

  .template-actions {
    display: flex;
    gap: 12px;
  }
}

:deep(.success-checkmark-msg) {
  .el-message__content {
    font-weight: 500;
  }
}

@keyframes shakeX {
  0%, 100% {
    transform: translateX(0);
  }
  20%, 60% {
    transform: translateX(-6px);
  }
  40%, 80% {
    transform: translateX(6px);
  }
}
</style>
