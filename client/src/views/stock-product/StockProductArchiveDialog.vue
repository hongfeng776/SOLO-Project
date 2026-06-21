<template>
  <FinDialog
    v-model:visible="visible"
    :title="dialogTitle"
    width="960px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="archive-form"
    >
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="股票代码"
            prop="stockCode"
            :class="{ 'shake-error': shakeFields.includes('stockCode') }"
          >
            <el-input
              v-model="formData.stockCode"
              placeholder="请输入股票代码"
              @blur="handleValidateCode"
            >
              <template #suffix>
                <el-icon v-if="codeValidating" class="is-loading"><Loading /></el-icon>
                <el-icon v-else-if="codeValidation.codeValid" style="color: #67C23A"><CircleCheckFilled /></el-icon>
                <el-icon v-else-if="formData.stockCode && !codeValidation.codeValid" style="color: #F56C6C"><CircleCloseFilled /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="股票名称"
            prop="stockName"
            :class="{ 'shake-error': shakeFields.includes('stockName') }"
          >
            <el-input
              v-model="formData.stockName"
              placeholder="请输入股票名称"
              @blur="validateField('stockName')"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item
            label="产品类型"
            prop="productType"
            :class="{ 'shake-error': shakeFields.includes('productType') }"
          >
            <el-select v-model="formData.productType" placeholder="请选择产品类型" style="width: 100%">
              <el-option
                v-for="(label, value) in STOCK_PRODUCT_TYPE_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item
            label="市场"
            prop="market"
            :class="{ 'shake-error': shakeFields.includes('market') }"
          >
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
        <el-col :span="8">
          <el-form-item label="板块" prop="sector">
            <el-select v-model="formData.sector" placeholder="请选择板块" style="width: 100%">
              <el-option
                v-for="item in MARKET_SECTOR_LIST"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="板块类型" prop="board">
            <el-select v-model="formData.board" placeholder="请选择板块类型" style="width: 100%">
              <el-option
                v-for="item in STOCK_PRODUCT_BOARD_LIST"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">备案信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item
            label="备案状态"
            prop="filingStatus"
            :class="{ 'shake-error': shakeFields.includes('filingStatus') }"
          >
            <el-select v-model="formData.filingStatus" placeholder="请选择备案状态" style="width: 100%">
              <el-option
                v-for="(label, value) in STOCK_PRODUCT_FILING_STATUS_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item
            label="备案编号"
            prop="filingNo"
            :class="{ 'shake-error': shakeFields.includes('filingNo') }"
          >
            <el-input
              v-model="formData.filingNo"
              placeholder="请输入备案编号"
              @blur="validateField('filingNo')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备案日期" prop="filingDate">
            <el-date-picker
              v-model="formData.filingDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="备案机构"
            prop="filingInstitution"
            :class="{ 'shake-error': shakeFields.includes('filingInstitution') }"
          >
            <el-select v-model="formData.filingInstitution" placeholder="请选择备案机构" style="width: 100%">
              <el-option
                v-for="(label, value) in EXCHANGE_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="交易所代码"
            prop="exchangeCode"
            :class="{ 'shake-error': shakeFields.includes('exchangeCode') }"
          >
            <el-input
              v-model="formData.exchangeCode"
              placeholder="请输入交易所代码"
              @blur="validateField('exchangeCode')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">交易参数</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item
            label="交易规则"
            prop="tradingRule"
            :class="{ 'shake-error': shakeFields.includes('tradingRule') }"
          >
            <el-select v-model="formData.tradingRule" placeholder="请选择交易规则" style="width: 100%">
              <el-option
                v-for="item in STOCK_PRODUCT_TRADING_RULE_LIST"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="费率标准" prop="feeStandard">
            <el-input v-model="formData.feeStandard" placeholder="请输入费率标准" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="结算规则" prop="settlementRule">
            <el-input v-model="formData.settlementRule" placeholder="请输入结算规则" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="最小交易单位" prop="minTradeUnit">
            <el-input-number
              v-model="formData.minTradeUnit"
              :min="1"
              :precision="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="涨跌停限制(%)" prop="priceLimit">
            <el-input-number
              v-model="formData.priceLimit"
              :precision="2"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="最小价格变动" prop="tickSize">
            <el-input-number
              v-model="formData.tickSize"
              :precision="3"
              :controls="false"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">其他信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="上市日期" prop="listingDate">
            <el-date-picker
              v-model="formData.listingDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="面值" prop="faceValue">
            <el-input-number
              v-model="formData.faceValue"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="总股本" prop="totalShares">
            <el-input-number
              v-model="formData.totalShares"
              :min="0"
              :precision="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="流通股本" prop="circulatingShares">
            <el-input-number
              v-model="formData.circulatingShares"
              :min="0"
              :precision="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="产品状态" prop="productStatus">
            <el-select v-model="formData.productStatus" placeholder="请选择产品状态" style="width: 100%">
              <el-option
                v-for="(label, value) in STOCK_PRODUCT_STATUS_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="备注" prop="remark">
            <el-input v-model="formData.remark" type="textarea" :rows="1" placeholder="请输入备注" />
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
import { ref, computed, watch, nextTick, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Loading, CircleCheckFilled, CircleCloseFilled, QuestionFilled } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { isStockCode } from '@/utils/validate'
import * as stockProductApi from '@/api/stockProduct'
import type { IStockProduct, IStockProductValidation, IValidationError } from '@/types/api'
import {
  MARKET_LABELS,
  STOCK_PRODUCT_TYPE_LABELS,
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_FILING_STATUS_LABELS,
  STOCK_PRODUCT_BOARD_LIST,
  STOCK_PRODUCT_TRADING_RULE_LIST,
  MARKET_SECTOR_LIST,
  EXCHANGE_LABELS,
} from '@/constants/dictionaries'
import { StockProductStatus, StockProductFilingStatus } from '@/enums'

interface Props {
  visible: boolean
  editData?: IStockProduct | null
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
const codeValidating = ref(false)
const codeValidation = reactive<IStockProductValidation>({
  valid: true,
  codeValid: true,
  codeMessage: '',
  filingValid: true,
  filingMessage: '',
  infoComplete: true,
  missingFields: [],
  duplicateCode: false,
})

const defaultFormData: Partial<IStockProduct> = {
  stockCode: '',
  stockName: '',
  productType: '',
  market: '',
  sector: '',
  board: '',
  filingStatus: StockProductFilingStatus.NOT_FILED,
  filingNo: '',
  filingDate: '',
  filingInstitution: '',
  exchangeCode: '',
  tradingRule: '',
  feeStandard: '',
  settlementRule: '',
  minTradeUnit: 100,
  priceLimit: 10,
  tickSize: 0.01,
  listingDate: '',
  faceValue: 0,
  totalShares: 0,
  circulatingShares: 0,
  productStatus: StockProductStatus.NORMAL,
  remark: '',
}

const formData = ref<Partial<IStockProduct>>({ ...defaultFormData })

const dialogTitle = computed(() => (props.editData ? '编辑股票产品建档' : '新增股票产品建档'))

const formRules = computed<FormRules>(() => ({
  stockCode: [
    { required: true, message: '请输入股票代码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (!value) return callback()
        if (!isStockCode(value)) {
          callback(new Error('股票代码格式不正确，应为6位数字'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  stockName: [{ required: true, message: '请输入股票名称', trigger: 'blur' }],
  productType: [{ required: true, message: '请选择产品类型', trigger: 'change' }],
  market: [{ required: true, message: '请选择市场', trigger: 'change' }],
  filingStatus: [{ required: true, message: '请选择备案状态', trigger: 'change' }],
  filingNo: [{ required: true, message: '请输入备案编号', trigger: 'blur' }],
  filingInstitution: [{ required: true, message: '请选择备案机构', trigger: 'change' }],
  exchangeCode: [{ required: true, message: '请输入交易所代码', trigger: 'blur' }],
  tradingRule: [{ required: true, message: '请选择交易规则', trigger: 'change' }],
}))

function triggerShake(fields: string[]) {
  shakeFields.value = fields
  setTimeout(() => {
    shakeFields.value = []
  }, 500)
}

async function validateField(field: string) {
  try {
    await formRef.value?.validateField(field)
  } catch {
    triggerShake([field])
  }
}

async function handleValidateCode() {
  if (!formData.value.stockCode) {
    codeValidation.codeValid = true
    codeValidation.valid = true
    return
  }
  codeValidating.value = true
  try {
    const res = await stockProductApi.validateStockCode(formData.value.stockCode, formData.value.market || '')
    if (res.code === 0 && res.data) {
      Object.assign(codeValidation, res.data)
    } else {
      codeValidation.codeValid = isStockCode(formData.value.stockCode)
      codeValidation.valid = codeValidation.codeValid
    }
    if (!codeValidation.codeValid) {
      triggerShake(['stockCode'])
    }
  } catch {
    codeValidation.codeValid = isStockCode(formData.value.stockCode)
    codeValidation.valid = codeValidation.codeValid
    if (!codeValidation.codeValid) {
      triggerShake(['stockCode'])
    }
  } finally {
    codeValidating.value = false
  }
}

async function handleValidateArchive(): Promise<boolean> {
  try {
    const res = await stockProductApi.validateArchive(formData.value)
    if (res.code === 0 && res.data) {
      Object.assign(codeValidation, res.data)
    }
    if (!codeValidation.valid) {
      const fields: string[] = []
      if (!codeValidation.codeValid) {
        fields.push('stockCode')
        ElMessage.error(codeValidation.codeMessage || '股票代码校验不通过')
      }
      if (!codeValidation.filingValid) {
        fields.push('filingStatus', 'filingNo', 'filingInstitution')
        ElMessage.error(codeValidation.filingMessage || '备案信息校验不通过')
      }
      if (!codeValidation.infoComplete && codeValidation.missingFields.length > 0) {
        const camelFields = codeValidation.missingFields.map((f) => toCamelCase(f))
        fields.push(...camelFields)
        ElMessage.error(`信息不完整，缺少字段：${codeValidation.missingFields.join('、')}`)
      }
      if (codeValidation.duplicateCode) {
        fields.push('stockCode')
        ElMessage.error('股票代码重复，已存在相同代码的产品')
      }
      if (fields.length > 0) {
        triggerShake(fields)
      }
      return false
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
  Object.assign(codeValidation, {
    valid: true,
    codeValid: true,
    codeMessage: '',
    filingValid: true,
    filingMessage: '',
    infoComplete: true,
    missingFields: [],
    duplicateCode: false,
  })
  formRef.value?.clearValidate()
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.editData) {
      formData.value = { ...defaultFormData, ...props.editData }
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
    const archiveValid = await handleValidateArchive()
    if (!archiveValid) {
      return
    }

    if (props.editData) {
      const res = await stockProductApi.update(props.editData.id, formData.value)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        emit('success')
        visible.value = false
      } else {
        handleSubmitError(res.message)
      }
    } else {
      const res = await stockProductApi.create(formData.value)
      if (res.code === 0) {
        ElMessage.success(`建档成功，产品编码：${res.data.productCode}`)
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
.archive-form {
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

  :deep(.el-form-item.is-error .el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset !important;
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
