<template>
  <FinDialog
    v-model:visible="visible"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    :class="{ 'dialog-zoom-fade': dialogAnimating }"
    @closed="handleClosed"
    @open="handleOpen"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="fee-rate-form"
    >
      <el-divider content-position="left">基础费率信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="费率名称"
            prop="feeName"
            :class="{ 'shake-error': shakeFields.includes('feeName') }"
          >
            <div class="focus-change-color">
              <el-input
                v-model="formData.feeName"
                placeholder="请输入费率名称"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="费率类型"
            prop="feeRateType"
            :class="{ 'shake-error': shakeFields.includes('feeRateType') }"
          >
            <div class="focus-change-color">
              <el-select
                v-model="formData.feeRateType"
                placeholder="请选择费率类型"
                style="width: 100%"
                @change="handleFeeTypeChange"
              >
                <el-option
                  v-for="(label, value) in STOCK_FEE_RATE_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="费率值"
            prop="feeRateValue"
            :class="{ 'shake-error': shakeFields.includes('feeRateValue') }"
          >
            <div class="focus-change-color">
              <el-input-number
                v-model="formData.feeRateValue"
                :step="0.0001"
                :precision="4"
                style="width: 100%"
              >
                <template #suffix>{{ formData.feeRateUnit }}</template>
              </el-input-number>
            </div>
            <div v-if="feeRateRange" class="range-hint">
              费率范围: {{ feeRateRange.min }} - {{ feeRateRange.max }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="费率单位"
            prop="feeRateUnit"
            :class="{ 'shake-error': shakeFields.includes('feeRateUnit') }"
          >
            <div class="focus-change-color">
              <el-select
                v-model="formData.feeRateUnit"
                placeholder="请选择费率单位"
                style="width: 100%"
              >
                <el-option
                  v-for="item in STOCK_FEE_RATE_UNIT_LIST"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="最低费用"
            prop="minFee"
            :class="{ 'shake-error': shakeFields.includes('minFee') }"
          >
            <div class="focus-change-color">
              <el-input-number
                v-model="formData.minFee"
                :step="0.01"
                :precision="2"
                style="width: 100%"
              >
                <template #suffix>元</template>
              </el-input-number>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="最高费用"
            prop="maxFee"
            :class="{ 'shake-error': shakeFields.includes('maxFee') }"
          >
            <div class="focus-change-color">
              <el-input-number
                v-model="formData.maxFee"
                :step="0.01"
                :precision="2"
                style="width: 100%"
              >
                <template #suffix>元</template>
              </el-input-number>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">差异化配置</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="客户等级"
            prop="customerLevel"
            :class="{ 'shake-error': shakeFields.includes('customerLevel') }"
          >
            <div class="focus-change-color">
              <el-select
                v-model="formData.customerLevel"
                placeholder="请选择客户等级"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, value) in STOCK_FEE_CUSTOMER_LEVEL_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="交易场景"
            prop="tradeScene"
            :class="{ 'shake-error': shakeFields.includes('tradeScene') }"
          >
            <div class="focus-change-color">
              <el-select
                v-model="formData.tradeScene"
                placeholder="请选择交易场景"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, value) in STOCK_FEE_TRADE_SCENE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="产品类型"
            prop="productType"
            :class="{ 'shake-error': shakeFields.includes('productType') }"
          >
            <div class="focus-change-color">
              <el-select
                v-model="formData.productType"
                placeholder="请选择产品类型"
                style="width: 100%"
                clearable
              >
                <el-option
                  v-for="(label, value) in STOCK_PRODUCT_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="生效范围"
            prop="scopeType"
            :class="{ 'shake-error': shakeFields.includes('scopeType') }"
          >
            <div class="focus-change-color">
              <el-select
                v-model="formData.scopeType"
                placeholder="请选择生效范围"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, value) in STOCK_FEE_SCOPE_TYPE_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="formData.scopeType === StockFeeScopeType.LOCAL" :gutter="20">
        <el-col :span="24">
          <el-form-item
            label="产品代码"
            prop="productCodes"
            :class="{ 'shake-error': shakeFields.includes('productCodes') }"
          >
            <div class="focus-change-color">
              <el-select
                v-model="formData.productCodes"
                placeholder="选择适用产品"
                style="width: 100%"
                multiple
                filterable
              >
                <el-option
                  v-for="item in productCodeOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">生效配置</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="生效开始时间"
            prop="effectiveStartTime"
            :class="{ 'shake-error': shakeFields.includes('effectiveStartTime') }"
          >
            <div class="focus-change-color">
              <el-date-picker
                v-model="formData.effectiveStartTime"
                type="datetime"
                placeholder="请选择生效开始时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="生效结束时间"
            prop="effectiveEndTime"
            :class="{ 'shake-error': shakeFields.includes('effectiveEndTime') }"
          >
            <div class="focus-change-color">
              <el-date-picker
                v-model="formData.effectiveEndTime"
                type="datetime"
                placeholder="请选择生效结束时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
                clearable
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item
            label="描述"
            prop="description"
            :class="{ 'shake-error': shakeFields.includes('description') }"
          >
            <div class="focus-change-color">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入描述"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '确认提交' }}
      </el-button>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Loading, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockFeeApi from '@/api/stockFeeRate'
import type { IStockFeeRate, IStockFeeRateValidation, IValidationError } from '@/types/api'
import {
  STOCK_FEE_RATE_TYPE_LABELS,
  STOCK_FEE_RATE_TYPE_COLORS,
  STOCK_FEE_CUSTOMER_LEVEL_LABELS,
  STOCK_FEE_TRADE_SCENE_LABELS,
  STOCK_FEE_SCOPE_TYPE_LABELS,
  STOCK_FEE_RATE_UNIT_LIST,
  STOCK_FEE_RATE_RANGE_CONFIG,
  STOCK_PRODUCT_TYPE_LABELS,
} from '@/constants/dictionaries'
import {
  StockFeeRateType,
  StockFeeRateStatus,
  StockFeeCustomerLevel,
  StockFeeTradeScene,
  StockFeeScopeType,
} from '@/enums'

interface Props {
  visible: boolean
  editData?: IStockFeeRate | null
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const shakeFields = ref<string[]>([])
const dialogAnimating = ref(false)
const productCodeOptions = ref<string[]>(['000001', '000002', '600000', '600001', '000858', '000003', '600519', '000004'])

const feeRateValidation = reactive<IStockFeeRateValidation>({
  valid: true,
  permissionValid: true,
  permissionMessage: '',
  rangeValid: true,
  rangeMessage: '',
  productScopeValid: true,
  productScopeMessage: '',
  rateExceeded: false,
  conflictFound: false,
  conflictDetails: [],
})

const defaultFormData = {
  feeName: '',
  feeRateType: StockFeeRateType.COMMISSION,
  feeRateValue: 0.0003,
  feeRateUnit: '‰',
  minFee: 5,
  maxFee: undefined as number | undefined,
  customerLevel: StockFeeCustomerLevel.NORMAL,
  tradeScene: StockFeeTradeScene.BUY,
  productType: '',
  scopeType: StockFeeScopeType.GLOBAL,
  productCodes: [] as string[],
  effectiveStartTime: '',
  effectiveEndTime: '',
  description: '',
  feeRateStatus: StockFeeRateStatus.DRAFT,
  conflictLevel: 'none',
}

const formData = ref({ ...defaultFormData })

const dialogTitle = computed(() => (props.editData ? '编辑费率配置' : '新增费率配置'))

const feeRateRange = computed(() => {
  return STOCK_FEE_RATE_RANGE_CONFIG[formData.value.feeRateType] || null
})

const formRules = computed<FormRules>(() => ({
  feeName: [{ required: true, message: '请输入费率名称', trigger: 'blur' }],
  feeRateType: [{ required: true, message: '请选择费率类型', trigger: 'change' }],
  feeRateValue: [{ required: true, message: '请输入费率值', trigger: 'blur' }],
  customerLevel: [{ required: true, message: '请选择客户等级', trigger: 'change' }],
  tradeScene: [{ required: true, message: '请选择交易场景', trigger: 'change' }],
  scopeType: [{ required: true, message: '请选择生效范围', trigger: 'change' }],
  effectiveStartTime: [{ required: true, message: '请选择生效开始时间', trigger: 'change' }],
}))

function triggerShake(fields: string[]) {
  shakeFields.value = fields
  setTimeout(() => {
    shakeFields.value = []
  }, 500)
}

function handleOpen() {
  dialogAnimating.value = true
  setTimeout(() => {
    dialogAnimating.value = false
  }, 300)
}

function handleFeeTypeChange() {
  if (feeRateRange.value) {
    formData.value.feeRateValue = (feeRateRange.value.min + feeRateRange.value.max) / 2
  }
}

async function handleValidateFeeRate(): Promise<boolean> {
  try {
    const res = await stockFeeApi.validateFeeRate(formData.value)
    if (res.code === 0 && res.data) {
      Object.assign(feeRateValidation, res.data)
    }
    if (!feeRateValidation.valid) {
      if (feeRateValidation.rateExceeded && feeRateRange.value) {
        ElMessage.error(`费率值超出允许范围，请调整至 ${feeRateRange.value.min} - ${feeRateRange.value.max}`)
        triggerShake(['feeRateValue'])
        return false
      }
      if (feeRateValidation.conflictFound) {
        ElMessage.error('产品适配范围冲突，存在相同条件的费率配置')
        if (feeRateValidation.conflictDetails && feeRateValidation.conflictDetails.length > 0) {
          console.log('冲突详情:', feeRateValidation.conflictDetails)
        }
        triggerShake(['productCodes', 'scopeType'])
        return false
      }
      if (!feeRateValidation.permissionValid) {
        ElMessage.error(feeRateValidation.permissionMessage || '无操作权限')
        return false
      }
      if (!feeRateValidation.rangeValid) {
        ElMessage.error(feeRateValidation.rangeMessage || '费率范围校验不通过')
        triggerShake(['feeRateValue', 'minFee', 'maxFee'])
        return false
      }
      if (!feeRateValidation.productScopeValid) {
        ElMessage.error(feeRateValidation.productScopeMessage || '产品适配范围校验不通过')
        triggerShake(['productCodes', 'scopeType', 'productType'])
        return false
      }
    }
    return true
  } catch {
    ElMessage.error('前置校验失败，请稍后重试')
    return false
  }
}

function handleClosed() {
  formData.value = { ...defaultFormData }
  shakeFields.value = []
  Object.assign(feeRateValidation, {
    valid: true,
    permissionValid: true,
    permissionMessage: '',
    rangeValid: true,
    rangeMessage: '',
    productScopeValid: true,
    productScopeMessage: '',
    rateExceeded: false,
    conflictFound: false,
    conflictDetails: [],
  })
  formRef.value?.clearValidate()
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.editData) {
      formData.value = {
        ...defaultFormData,
        feeName: props.editData.feeName,
        feeRateType: props.editData.feeRateType,
        feeRateValue: props.editData.feeRateValue,
        feeRateUnit: props.editData.feeRateUnit,
        minFee: props.editData.minFee ?? undefined,
        maxFee: props.editData.maxFee ?? undefined,
        customerLevel: props.editData.customerLevel,
        tradeScene: props.editData.tradeScene,
        productType: props.editData.productType || '',
        scopeType: props.editData.scopeType,
        productCodes: props.editData.productCodes || [],
        effectiveStartTime: props.editData.effectiveStartTime,
        effectiveEndTime: props.editData.effectiveEndTime || '',
        description: props.editData.description || '',
        feeRateStatus: props.editData.feeRateStatus,
        conflictLevel: props.editData.conflictLevel || 'none',
      }
    } else if (val) {
      formData.value = { ...defaultFormData }
    }
  },
)

async function handleSubmit() {
  if (submitting.value) return

  try {
    await formRef.value?.validate()
  } catch (err: any) {
    const fields = Object.keys(err || {})
    triggerShake(fields)
    ElMessage.warning('请检查表单填写是否正确')
    return
  }

  submitting.value = true
  try {
    const valid = await handleValidateFeeRate()
    if (!valid) {
      return
    }

    if (props.editData) {
      const res = await stockFeeApi.update(props.editData.id, formData.value)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        emit('success')
        visible.value = false
      } else {
        handleSubmitError(res.message)
      }
    } else {
      const res = await stockFeeApi.create(formData.value)
      if (res.code === 0) {
        ElMessage.success('创建成功')
        emit('success')
        visible.value = false
      } else {
        handleSubmitError(res.message)
      }
    }
  } catch (err: any) {
    handleSubmitError(err.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleSubmitError(message: string) {
  try {
    const errors: IValidationError[] = JSON.parse(message)
    if (Array.isArray(errors) && errors.length > 0) {
      const fields = errors.map((e) => toCamelCase(e.field))
      triggerShake(fields)
      ElMessage.error(errors[0].message)
    } else {
      ElMessage.error(message)
    }
  } catch {
    ElMessage.error(message)
  }
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}
</script>

<style lang="scss" scoped>
.focus-change-color {
  transition: all 0.2s ease;
  border-radius: 4px;
  overflow: hidden;
}

.focus-change-color:focus-within {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  background-color: #f0f7ff;
}

.range-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.fee-rate-form {
  :deep(.el-form-item.shake-error .el-input__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.shake-error .el-select .el-select__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.shake-error .el-input-number .el-input__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.shake-error .el-date-editor .el-input__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.is-error .el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
}

.dialog-zoom-fade {
  :deep(.el-dialog) {
    animation: zoomFadeIn 0.3s ease-out;
  }
}

@keyframes zoomFadeIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
</style>
