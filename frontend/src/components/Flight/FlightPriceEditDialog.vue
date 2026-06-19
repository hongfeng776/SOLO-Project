<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="720px"
    class="flight-price-edit-dialog"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <template #header="{ close }">
      <div class="dialog-header">
        <el-icon color="#1890ff"><Money /></el-icon>
        <span class="title">{{ title }}</span>
        <el-button type="primary" link @click="handlePreviewPrice">
          <el-icon><TrendCharts /></el-icon>
          价格预览
        </el-button>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
      v-loading="loading"
    >
      <div class="cabin-tabs">
        <div
          v-for="(config, key) in CabinClassEnum"
          :key="key"
          class="cabin-tab-item"
          :class="{ active: form.cabinClass === config.value }"
          :style="{ '--cabin-color': config.color }"
          @click="handleCabinChange(config.value)"
        >
          <el-icon><Promotion /></el-icon>
          <span>{{ config.label }}</span>
          <div class="price-range">{{ config.minPrice }} - {{ config.maxPrice }}</div>
        </div>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="航班" prop="flightId">
            <el-select
              v-model="form.flightId"
              filterable
              placeholder="请选择航班"
              style="width: 100%"
              @change="handleFlightChange"
            >
              <el-option
                v-for="flight in flightList"
                :key="flight.id"
                :label="`${flight.flightNo} - ${flight.departureAirportCode} → ${flight.arrivalAirportCode}`"
                :value="flight.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="定价方式" prop="priceSource">
            <el-radio-group v-model="form.priceSource">
              <el-radio-button value="manual">手动定价</el-radio-button>
              <el-radio-button value="dynamic">动态定价</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <div
        v-if="selectedFlight"
        class="flight-info-card"
        :class="{ 'fade-in': true }"
      >
        <div class="flight-route">
          <el-icon color="#1890ff"><Airplane /></el-icon>
          <span class="flight-no">{{ selectedFlight.flightNo }}</span>
          <div class="route-detail">
            <span class="airport">{{ selectedFlight.departureAirportCode }}</span>
            <el-icon><Right /></el-icon>
            <span class="airport">{{ selectedFlight.arrivalAirportCode }}</span>
          </div>
        </div>
        <div class="flight-time">
          <el-icon color="#909399"><Clock /></el-icon>
          <span>{{ formatDate(selectedFlight.departureTime) }} - {{ formatDate(selectedFlight.arrivalTime) }}</span>
        </div>
      </div>

      <el-divider content-position="left">价格配置</el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="基准票价" prop="basePrice">
            <div class="price-input-wrapper">
              <span class="currency">¥</span>
              <el-input
                v-model="form.basePrice"
                type="number"
                :placeholder="`请输入${currentCabinConfig.label}基准票价`"
                class="price-input"
                :class="{ 'input-error': fieldErrors.basePrice, 'input-success': fieldStatus.basePrice }"
                @focus="handleInputFocus($event, 'basePrice')"
                @blur="handleInputBlur($event, 'basePrice')"
                @input="handlePriceInput('basePrice')"
              />
              <span
                v-if="fieldStatus.basePrice"
                class="validate-success-icon"
              >
                <el-icon color="#52c41a"><CircleCheck /></el-icon>
              </span>
            </div>
            <div v-if="fieldErrors.basePrice" class="error-message">{{ fieldErrors.basePrice }}</div>
            <div class="field-hint">范围: {{ currentCabinConfig.minPrice }} - {{ currentCabinConfig.maxPrice }}元</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="当前售价" prop="currentPrice">
            <div class="price-input-wrapper">
              <span class="currency">¥</span>
              <el-input
                v-model="form.currentPrice"
                type="number"
                :placeholder="`请输入${currentCabinConfig.label}当前售价`"
                class="price-input"
                :class="{ 'input-error': fieldErrors.currentPrice, 'input-success': fieldStatus.currentPrice }"
                @focus="handleInputFocus($event, 'currentPrice')"
                @blur="handleInputBlur($event, 'currentPrice')"
                @input="handlePriceInput('currentPrice')"
              />
              <span
                v-if="fieldStatus.currentPrice"
                class="validate-success-icon"
              >
                <el-icon color="#52c41a"><CircleCheck /></el-icon>
              </span>
            </div>
            <div v-if="fieldErrors.currentPrice" class="error-message">{{ fieldErrors.currentPrice }}</div>
            <div class="price-change-tag" v-if="priceChangeDirection">
              <el-icon :color="priceChangeDirection.color">
                <component :is="priceChangeDirection.icon" />
              </el-icon>
              <span :style="{ color: priceChangeDirection.color }">
                {{ priceChangeDirection.label }}: {{ priceChangeValue }}
              </span>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="折扣比例" prop="discount">
            <div class="price-input-wrapper">
              <el-slider
                v-model="form.discount"
                :min="currentCabinConfig.minPrice > 0 ? Math.max(30, (currentCabinConfig.minPrice / form.basePrice) * 100) : 30"
                :max="100"
                :step="1"
                :disabled="form.priceSource === 'dynamic'"
                style="flex: 1"
              />
              <el-input
                v-model="form.discount"
                type="number"
                :min="30"
                :max="100"
                class="discount-input"
                :class="{ 'input-error': fieldErrors.discount, 'input-success': fieldStatus.discount }"
                @blur="handleInputBlur($event, 'discount')"
                @input="calculateCurrentPrice"
              />
              <span class="unit">%</span>
            </div>
            <div v-if="fieldErrors.discount" class="error-message">{{ fieldErrors.discount }}</div>
            <div class="discount-preview">
              优惠金额: ¥{{ discountAmount.toFixed(2) }}
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="溢价上限" prop="premiumLimit">
            <div class="price-input-wrapper">
              <span class="currency">¥</span>
              <el-input
                v-model="form.premiumLimit"
                type="number"
                placeholder="请输入溢价上限"
                class="price-input"
                :class="{ 'input-error': fieldErrors.premiumLimit }"
                @blur="handleInputBlur($event, 'premiumLimit')"
                @input="handlePriceInput('premiumLimit')"
              />
            </div>
            <div class="field-hint">允许超出基准价的最大金额</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">税费配置</el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="税费比例" prop="taxRate">
            <div class="price-input-wrapper">
              <el-input
                v-model="form.taxRate"
                type="number"
                :min="0"
                :max="100"
                :step="0.01"
                placeholder="请输入税费比例"
                class="price-input"
                @input="calculateTaxAmount"
              />
              <span class="unit">%</span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="附加费" prop="surcharge">
            <div class="price-input-wrapper">
              <span class="currency">¥</span>
              <el-input
                v-model="form.surcharge"
                type="number"
                :min="0"
                placeholder="机场建设费、燃油费等"
                class="price-input"
                @input="calculateTaxAmount"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="税费金额">
            <div class="amount-display">
              <el-icon color="#faad14"><Wallet /></el-icon>
              <span>¥{{ form.taxAmount?.toFixed(2) || '0.00' }}</span>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="总价">
            <div class="total-price">
              <el-icon color="#ff4d4f"><Money /></el-icon>
              <span>¥{{ totalPrice.toFixed(2) }}</span>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">生效时间</el-divider>

      <el-form-item label="生效时间段" prop="effectiveTime">
        <el-date-picker
          v-model="form.effectiveTime"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%"
          :class="{ 'input-error': fieldErrors.effectiveTime }"
          @change="handleTimeChange"
        />
        <div v-if="fieldErrors.effectiveTime" class="error-message">{{ fieldErrors.effectiveTime }}</div>
      </el-form-item>

      <el-divider v-if="form.priceSource === 'dynamic'" content-position="left">动态定价规则</el-divider>

      <div v-if="form.priceSource === 'dynamic'" class="dynamic-rules">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="节假日上浮">
              <div class="price-input-wrapper">
                <el-input-number v-model="dynamicRules.holidaySurcharge" :min="0" :max="100" controls-position="right" />
                <span class="unit">%</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出行高峰上浮">
              <div class="price-input-wrapper">
                <el-input-number v-model="dynamicRules.peakSeasonSurcharge" :min="0" :max="100" controls-position="right" />
                <span class="unit">%</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="周末上浮">
              <div class="price-input-wrapper">
                <el-input-number v-model="dynamicRules.weekendSurcharge" :min="0" :max="100" controls-position="right" />
                <span class="unit">%</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="早鸟折扣">
              <div class="price-input-wrapper">
                <el-input-number v-model="dynamicRules.earlyBirdDiscount" :min="0" :max="100" controls-position="right" />
                <span class="unit">%</span>
                <div class="rule-hint">提前30天以上</div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-form-item label="调整原因">
        <el-input
          v-model="form.priceReason"
          type="textarea"
          :rows="2"
          placeholder="请输入价格调整原因（必填）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        <el-icon v-if="!submitting"><Check /></el-icon>
        确定保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Money, Promotion, TrendCharts, Airplane, Right, Clock,
  CircleCheck, Wallet, Check
} from '@element-plus/icons-vue'
import { CabinClassEnum, getEnumLabel, PriceChangeDirectionEnum } from '@/utils/enums'
import {
  getFlightList,
  getFlightPrice,
  createFlightPrice,
  updateFlightPrice,
  validateFlightPriceField
} from '@/api/flight'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  editId: { type: [Number, String], default: null },
  defaultFlightId: { type: [Number, String], default: null },
  defaultCabinClass: { type: String, default: 'economy' }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const title = computed(() => props.editId ? '编辑价格配置' : '新增价格配置')

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  flightId: null,
  cabinClass: props.defaultCabinClass,
  basePrice: null,
  currentPrice: null,
  discount: 100,
  taxRate: 0,
  taxAmount: 0,
  surcharge: 0,
  premiumLimit: 200,
  minDiscount: 70,
  effectiveTime: null,
  effectiveStartTime: null,
  effectiveEndTime: null,
  isDynamicPricing: 0,
  priceSource: 'manual',
  priceReason: '',
  dynamicRuleData: null
})

const dynamicRules = reactive({
  holidaySurcharge: 10,
  peakSeasonSurcharge: 15,
  weekendSurcharge: 5,
  earlyBirdDiscount: 10,
  lastMinuteDiscount: 20
})

const fieldErrors = reactive({})
const fieldStatus = reactive({})

const flightList = ref([])
const selectedFlight = computed(() => {
  return flightList.value.find(f => f.id === form.flightId)
})

const currentCabinConfig = computed(() => {
  const config = Object.values(CabinClassEnum).find(c => c.value === form.cabinClass)
  return config || CabinClassEnum.ECONOMY
})

const discountAmount = computed(() => {
  if (!form.basePrice || !form.discount) return 0
  return form.basePrice - form.basePrice * (form.discount / 100)
})

const totalPrice = computed(() => {
  const price = parseFloat(form.currentPrice) || 0
  const tax = parseFloat(form.taxAmount) || 0
  return price + tax
})

const priceChangeDirection = computed(() => {
  if (!form.basePrice || !form.currentPrice) return null
  const diff = form.currentPrice - form.basePrice
  if (Math.abs(diff) < 0.01) return PriceChangeDirectionEnum.FLAT
  return diff > 0 ? PriceChangeDirectionEnum.UP : PriceChangeDirectionEnum.DOWN
})

const priceChangeValue = computed(() => {
  if (!form.basePrice || !form.currentPrice) return ''
  const diff = form.currentPrice - form.basePrice
  const percent = form.basePrice > 0 ? (diff / form.basePrice) * 100 : 0
  const prefix = diff > 0 ? '+' : ''
  return `${prefix}${diff.toFixed(2)}元 (${prefix}${percent.toFixed(1)}%)`
})

const rules = {
  flightId: [{ required: true, message: '请选择航班', trigger: 'change' }],
  cabinClass: [{ required: true, message: '请选择舱位类型', trigger: 'change' }],
  basePrice: [{ required: true, message: '请输入基准票价', trigger: 'blur' }],
  currentPrice: [{ required: true, message: '请输入当前售价', trigger: 'blur' }],
  effectiveTime: [{ required: true, message: '请选择生效时间段', trigger: 'change' }],
  priceReason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }]
}

const loadFlights = async () => {
  try {
    const res = await getFlightList({ pageSize: 100, isActive: 1 })
    flightList.value = res.items || []
  } catch (e) {
    console.error('加载航班列表失败:', e)
  }
}

const loadPriceDetail = async () => {
  if (!props.editId) return
  loading.value = true
  try {
    const res = await getFlightPrice(props.editId)
    Object.assign(form, {
      flightId: res.flightId,
      cabinClass: res.cabinClass,
      basePrice: res.basePrice,
      currentPrice: res.currentPrice,
      discount: res.discount,
      taxRate: res.taxRate,
      taxAmount: res.taxAmount,
      surcharge: res.surcharge,
      premiumLimit: res.premiumLimit,
      minDiscount: res.minDiscount,
      effectiveTime: [res.effectiveStartTime, res.effectiveEndTime],
      effectiveStartTime: res.effectiveStartTime,
      effectiveEndTime: res.effectiveEndTime,
      isDynamicPricing: res.isDynamicPricing,
      priceSource: res.priceSource,
      priceReason: res.priceReason,
      dynamicRuleData: res.dynamicRuleData
    })

    if (res.dynamicRuleData) {
      try {
        const ruleData = typeof res.dynamicRuleData === 'string' ? JSON.parse(res.dynamicRuleData) : res.dynamicRuleData
        Object.assign(dynamicRules, ruleData)
      } catch (e) {}
    }
  } catch (e) {
    ElMessage.error('加载价格详情失败')
  } finally {
    loading.value = false
  }
}

const handleCabinChange = (cabinClass) => {
  form.cabinClass = cabinClass
  const config = Object.values(CabinClassEnum).find(c => c.value === cabinClass)
  if (config) {
    form.premiumLimit = config.minPrice > 1000 ? 500 : config.minPrice > 500 ? 200 : 100
    form.minDiscount = config.minPrice > 1000 ? 50 : config.minPrice > 500 ? 60 : 70
  }
  clearFieldErrors()
}

const handleFlightChange = (flightId) => {
  clearFieldErrors()
}

const handleInputFocus = (event, fieldName) => {
  event.target.parentElement.classList.add('focused')
}

const handleInputBlur = async (event, fieldName) => {
  event.target.parentElement.classList.remove('focused')
  await validateField(fieldName, form[fieldName])
}

const handlePriceInput = (fieldName) => {
  fieldStatus[fieldName] = false
  fieldErrors[fieldName] = ''
  if (fieldName === 'basePrice' || fieldName === 'discount') {
    calculateCurrentPrice()
  }
}

const calculateCurrentPrice = () => {
  if (!form.basePrice || !form.discount) return
  form.currentPrice = Math.round(form.basePrice * (form.discount / 100) * 100) / 100
  calculateTaxAmount()
}

const calculateTaxAmount = () => {
  const price = parseFloat(form.currentPrice) || 0
  const taxRate = parseFloat(form.taxRate) || 0
  const surcharge = parseFloat(form.surcharge) || 0
  form.taxAmount = Math.round((price * (taxRate / 100) + surcharge) * 100) / 100
}

const handleTimeChange = (value) => {
  if (value && value.length === 2) {
    form.effectiveStartTime = value[0]
    form.effectiveEndTime = value[1]
  }
  validateField('effectiveTime', value)
}

const validateField = async (fieldName, value) => {
  if (fieldName === 'effectiveTime') {
    if (!value || value.length !== 2) {
      fieldErrors.effectiveTime = '请选择生效时间段'
      return false
    }
    const startTime = new Date(value[0])
    const endTime = new Date(value[1])
    if (startTime >= endTime) {
      fieldErrors.effectiveTime = '生效结束时间必须晚于开始时间'
      fieldStatus.effectiveTime = false
      return false
    }
    fieldErrors.effectiveTime = ''
    fieldStatus.effectiveTime = true
    return true
  }

  if (value === null || value === undefined || value === '') {
    fieldErrors[fieldName] = ''
    fieldStatus[fieldName] = false
    return true
  }

  try {
    const params = {}
    if (fieldName === 'currentPrice') {
      params.basePrice = form.basePrice
      params.premiumLimit = form.premiumLimit
      params.minDiscount = form.minDiscount
      params.cabinClass = form.cabinClass
    }
    const res = await validateFlightPriceField(fieldName, value, params)
    if (res.valid) {
      fieldErrors[fieldName] = ''
      fieldStatus[fieldName] = true
      return true
    } else {
      fieldErrors[fieldName] = res.message
      fieldStatus[fieldName] = false
      triggerShake(fieldName)
      return false
    }
  } catch (e) {
    return true
  }
}

const triggerShake = (fieldName) => {
  const input = document.querySelector(`[name="${fieldName}"] .price-input, [name="${fieldName}"] .el-input__inner`)
  if (input) {
    input.classList.add('validate-shake')
    setTimeout(() => input.classList.remove('validate-shake'), 500)
  }
}

const clearFieldErrors = () => {
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key] = ''
    fieldStatus[key] = false
  })
}

const handlePreviewPrice = () => {
  ElMessage.info('价格预览功能开发中...')
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  const fieldsToValidate = ['basePrice', 'currentPrice', 'discount', 'effectiveTime']
  for (const field of fieldsToValidate) {
    const val = field === 'effectiveTime' ? form.effectiveTime : form[field]
    const valid = await validateField(field, val)
    if (!valid) {
      ElMessage.warning('请检查表单数据')
      return
    }
  }

  submitting.value = true
  try {
    const submitData = {
      ...form,
      effectiveStartTime: form.effectiveStartTime,
      effectiveEndTime: form.effectiveEndTime,
      isDynamicPricing: form.priceSource === 'dynamic' ? 1 : 0,
      dynamicRuleData: form.priceSource === 'dynamic' ? JSON.stringify(dynamicRules) : null
    }

    if (props.editId) {
      await updateFlightPrice(props.editId, submitData)
      ElMessage.success('价格配置更新成功')
    } else {
      await createFlightPrice(submitData)
      ElMessage.success('价格配置创建成功')
    }

    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  formRef.value?.resetFields()
  clearFieldErrors()
  Object.assign(form, {
    flightId: props.defaultFlightId,
    cabinClass: props.defaultCabinClass,
    basePrice: null,
    currentPrice: null,
    discount: 100,
    taxRate: 0,
    taxAmount: 0,
    surcharge: 0,
    premiumLimit: 200,
    minDiscount: 70,
    effectiveTime: null,
    effectiveStartTime: null,
    effectiveEndTime: null,
    isDynamicPricing: 0,
    priceSource: 'manual',
    priceReason: '',
    dynamicRuleData: null
  })
  Object.assign(dynamicRules, {
    holidaySurcharge: 10,
    peakSeasonSurcharge: 15,
    weekendSurcharge: 5,
    earlyBirdDiscount: 10,
    lastMinuteDiscount: 20
  })
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadFlights()
    if (props.editId) {
      loadPriceDetail()
    } else {
      form.flightId = props.defaultFlightId
      form.cabinClass = props.defaultCabinClass
      handleCabinChange(props.defaultCabinClass)
    }
  }
})
</script>

<style lang="scss" scoped>
.flight-price-edit-dialog {
  :deep(.el-dialog__header) {
    padding: 20px 24px;
    margin: 0;
    border-bottom: 1px solid #f0f0f0;
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .title {
      font-size: 18px;
      font-weight: 600;
      flex: 1;
    }
  }

  .cabin-tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;

    .cabin-tab-item {
      padding: 16px;
      border: 2px solid #e8e8e8;
      border-radius: 8px;
      cursor: pointer;
      text-align: center;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: var(--cabin-color);
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }

      .el-icon {
        font-size: 24px;
        color: var(--cabin-color);
        margin-bottom: 8px;
      }

      span {
        display: block;
        font-weight: 500;
        margin-bottom: 4px;
      }

      .price-range {
        font-size: 12px;
        color: #909399;
      }

      &:hover {
        border-color: var(--cabin-color);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

        &::before {
          transform: scaleX(1);
        }
      }

      &.active {
        border-color: var(--cabin-color);
        background: rgba(24, 144, 255, 0.05);

        &::before {
          transform: scaleX(1);
        }
      }
    }
  }

  .flight-info-card {
    background: linear-gradient(135deg, #f0f7ff 0%, #e6f7ff 100%);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .flight-route {
      display: flex;
      align-items: center;
      gap: 12px;

      .el-icon {
        font-size: 24px;
      }

      .flight-no {
        font-size: 18px;
        font-weight: 600;
        color: #1890ff;
      }

      .route-detail {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: 12px;

        .airport {
          font-weight: 500;
          font-size: 16px;
        }
      }
    }

    .flight-time {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      font-size: 14px;
    }
  }

  .price-input-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;

    .currency {
      color: #606266;
      font-size: 14px;
      font-weight: 500;
    }

    .price-input {
      flex: 1;

      :deep(.el-input__wrapper) {
        transition: all 0.3s ease;
        border-radius: 6px;
      }

      &.input-error :deep(.el-input__wrapper) {
        border-color: #ff4d4f !important;
        box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.1);
      }

      &.input-success :deep(.el-input__wrapper) {
        border-color: #52c41a !important;
      }
    }

    .discount-input {
      width: 80px;
    }

    .unit {
      color: #909399;
      font-size: 14px;
    }

    &.focused .price-input :deep(.el-input__wrapper) {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
    }

    .validate-success-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      animation: scaleIn 0.3s ease;
    }
  }

  .error-message {
    color: #ff4d4f;
    font-size: 12px;
    margin-top: 4px;
  }

  .field-hint {
    color: #909399;
    font-size: 12px;
    margin-top: 4px;
  }

  .price-change-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    margin-top: 4px;
  }

  .discount-preview {
    color: #52c41a;
    font-size: 12px;
    margin-top: 4px;
  }

  .amount-display {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #faad14;
  }

  .total-price {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: #ff4d4f;
  }

  .dynamic-rules {
    padding: 16px;
    background: #fafafa;
    border-radius: 8px;
    margin-bottom: 16px;

    .rule-hint {
      font-size: 12px;
      color: #909399;
      margin-left: 8px;
    }
  }

  .validate-shake {
    animation: shake 0.5s ease !important;
  }

  .fade-in {
    animation: fadeIn 0.3s ease;
  }

  @keyframes scaleIn {
    from {
      transform: translateY(-50%) scale(0);
      opacity: 0;
    }
    to {
      transform: translateY(-50%) scale(1);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }
}
</style>
