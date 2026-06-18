<template>
  <el-dialog
    v-model="visible"
    class="flight-edit-dialog"
    :title="isEdit ? '编辑航班' : '新增航班'"
    width="820px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="$emit('closed')"
  >
    <div class="type-branch-switcher">
      <div
        v-for="(item, key) in FlightTypeEnum"
        :key="key"
        class="branch-btn"
        :class="{ active: form.flightType === item.value }"
        @click="handleTypeChange(item.value)"
      >
        <el-icon class="branch-icon" :style="{ color: item.color }">
          <component :is="item.icon" />
        </el-icon>
        <div class="branch-label">{{ item.label }}</div>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      @validate="handleValidate"
    >
      <div class="form-section">
        <div class="section-title">基础信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="航班号" prop="flightNo" :class="{ 'validate-shake': shakeFields.includes('flightNo') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.flightNo"
                  placeholder="请输入航班号，如 CA1234"
                  maxlength="20"
                  @blur="() => validateField('flightNo')"
                />
                <el-icon v-if="validatedSuccess.includes('flightNo')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.flightNo" class="validate-error-tip">{{ fieldErrors.flightNo }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="航线编码" prop="routeCode" :class="{ 'validate-shake': shakeFields.includes('routeCode') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.routeCode"
                  placeholder="请输入航线编码"
                  maxlength="50"
                  @blur="() => validateField('routeCode')"
                />
                <el-icon v-if="validatedSuccess.includes('routeCode')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.routeCode" class="validate-error-tip">{{ fieldErrors.routeCode }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="航空公司" prop="airline" :class="{ 'validate-shake': shakeFields.includes('airline') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.airline"
                  placeholder="请输入航空公司名称"
                  @blur="() => validateField('airline')"
                />
                <el-icon v-if="validatedSuccess.includes('airline')" class="validate-success-icon"><Check /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="航空二字码">
              <el-input v-model="form.airlineCode" placeholder="如 CA、MU" maxlength="10" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <div class="section-title">航线信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="出发城市" prop="departure" :class="{ 'validate-shake': shakeFields.includes('departure') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.departure"
                  placeholder="请输入出发城市"
                  @blur="() => validateField('departure')"
                />
                <el-icon v-if="validatedSuccess.includes('departure')" class="validate-success-icon"><Check /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达城市" prop="arrival" :class="{ 'validate-shake': shakeFields.includes('arrival') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.arrival"
                  placeholder="请输入到达城市"
                  @blur="() => validateField('arrival')"
                />
                <el-icon v-if="validatedSuccess.includes('arrival')" class="validate-success-icon"><Check /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出发机场" prop="departureAirport" :class="{ 'validate-shake': shakeFields.includes('departureAirport') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.departureAirport"
                  placeholder="请输入出发机场名称"
                  @blur="() => validateField('departureAirport')"
                />
                <el-icon v-if="validatedSuccess.includes('departureAirport')" class="validate-success-icon"><Check /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达机场" prop="arrivalAirport" :class="{ 'validate-shake': shakeFields.includes('arrivalAirport') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.arrivalAirport"
                  placeholder="请输入到达机场名称"
                  @blur="() => validateField('arrivalAirport')"
                />
                <el-icon v-if="validatedSuccess.includes('arrivalAirport')" class="validate-success-icon"><Check /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出发机场三字码" prop="departureAirportCode" :class="{ 'validate-shake': shakeFields.includes('departureAirportCode') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.departureAirportCode"
                  placeholder="如 PEK、SHA"
                  maxlength="3"
                  style="text-transform: uppercase"
                  @blur="handleAirportCodeBlur('departureAirportCode')"
                />
                <el-icon v-if="validatedSuccess.includes('departureAirportCode')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.departureAirportCode" class="validate-error-tip">{{ fieldErrors.departureAirportCode }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达机场三字码" prop="arrivalAirportCode" :class="{ 'validate-shake': shakeFields.includes('arrivalAirportCode') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.arrivalAirportCode"
                  placeholder="如 PEK、SHA"
                  maxlength="3"
                  style="text-transform: uppercase"
                  @blur="handleAirportCodeBlur('arrivalAirportCode')"
                />
                <el-icon v-if="validatedSuccess.includes('arrivalAirportCode')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.arrivalAirportCode" class="validate-error-tip">{{ fieldErrors.arrivalAirportCode }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出发时间" prop="departureTime" :class="{ 'validate-shake': shakeFields.includes('departureTime') }">
              <el-date-picker
                v-model="form.departureTime"
                type="datetime"
                placeholder="选择出发时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                @change="handleTimeChange"
              />
              <div v-if="fieldErrors.departureTime" class="validate-error-tip">{{ fieldErrors.departureTime }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达时间" prop="arrivalTime" :class="{ 'validate-shake': shakeFields.includes('arrivalTime') }">
              <el-date-picker
                v-model="form.arrivalTime"
                type="datetime"
                placeholder="选择到达时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                @change="handleTimeChange"
              />
              <div v-if="fieldErrors.arrivalTime" class="validate-error-tip">{{ fieldErrors.arrivalTime }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section" v-if="form.flightType === 2">
        <div class="section-title">国际航班信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="出发国家" prop="departureCountry" :class="{ 'validate-shake': shakeFields.includes('departureCountry') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.departureCountry"
                  placeholder="请输入出发国家"
                  @blur="() => validateField('departureCountry')"
                />
                <el-icon v-if="validatedSuccess.includes('departureCountry')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.departureCountry" class="validate-error-tip">{{ fieldErrors.departureCountry }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达国家" prop="arrivalCountry" :class="{ 'validate-shake': shakeFields.includes('arrivalCountry') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.arrivalCountry"
                  placeholder="请输入到达国家"
                  @blur="() => validateField('arrivalCountry')"
                />
                <el-icon v-if="validatedSuccess.includes('arrivalCountry')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.arrivalCountry" class="validate-error-tip">{{ fieldErrors.arrivalCountry }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否需要签证">
              <el-switch v-model="form.visaRequired" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section" v-if="form.flightType === 3">
        <div class="section-title">中转航班信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="中转城市" prop="transferCity" :class="{ 'validate-shake': shakeFields.includes('transferCity') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.transferCity"
                  placeholder="请输入中转城市"
                  @blur="() => validateField('transferCity')"
                />
                <el-icon v-if="validatedSuccess.includes('transferCity')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.transferCity" class="validate-error-tip">{{ fieldErrors.transferCity }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中转机场" prop="transferAirport">
              <el-input v-model="form.transferAirport" placeholder="请输入中转机场名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中转机场三字码" prop="transferAirportCode" :class="{ 'validate-shake': shakeFields.includes('transferAirportCode') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.transferAirportCode"
                  placeholder="如 PEK"
                  maxlength="3"
                  style="text-transform: uppercase"
                  @blur="handleAirportCodeBlur('transferAirportCode')"
                />
                <el-icon v-if="validatedSuccess.includes('transferAirportCode')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.transferAirportCode" class="validate-error-tip">{{ fieldErrors.transferAirportCode }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="中转时长(分钟)">
              <el-input-number v-model="form.transferDuration" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section" v-if="form.flightType === 4">
        <div class="section-title">包机航班信息</div>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="包机合同编号" prop="charterContractNo" :class="{ 'validate-shake': shakeFields.includes('charterContractNo') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.charterContractNo"
                  placeholder="请输入包机合同编号"
                  @blur="() => validateField('charterContractNo')"
                />
                <el-icon v-if="validatedSuccess.includes('charterContractNo')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.charterContractNo" class="validate-error-tip">{{ fieldErrors.charterContractNo }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <div class="section-title">机型与价格</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="机型" prop="aircraftType" :class="{ 'validate-shake': shakeFields.includes('aircraftType') }">
              <div style="display: flex; align-items: center">
                <el-input
                  v-model="form.aircraftType"
                  placeholder="如 波音737、空客A320"
                  @blur="() => validateField('aircraftType')"
                />
                <el-icon v-if="validatedSuccess.includes('aircraftType')" class="validate-success-icon"><Check /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="机型型号">
              <el-input v-model="form.aircraftModel" placeholder="如 B737-800" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="舱位等级">
              <el-select v-model="form.cabinClass" placeholder="请选择舱位" style="width: 100%">
                <el-option
                  v-for="(item, key) in CabinClassEnum"
                  :key="key"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格(元)" prop="price" :class="{ 'validate-shake': shakeFields.includes('price') }">
              <div style="display: flex; align-items: center">
                <el-input-number
                  v-model="form.price"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  @change="() => validateField('price')"
                />
                <el-icon v-if="validatedSuccess.includes('price')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.price" class="validate-error-tip">{{ fieldErrors.price }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="总座位数" prop="seatCount" :class="{ 'validate-shake': shakeFields.includes('seatCount') }">
              <el-input-number v-model="form.seatCount" :min="0" style="width: 100%" @change="handleSeatChange" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="剩余座位" prop="seats" :class="{ 'validate-shake': shakeFields.includes('seats') }">
              <div style="display: flex; align-items: center">
                <el-input-number
                  v-model="form.seats"
                  :min="0"
                  :max="form.seatCount || 9999"
                  style="width: 100%"
                  @change="() => validateField('seats')"
                />
                <el-icon v-if="validatedSuccess.includes('seats')" class="validate-success-icon"><Check /></el-icon>
              </div>
              <div v-if="fieldErrors.seats" class="validate-error-tip">{{ fieldErrors.seats }}</div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section">
        <div class="section-title">运营设置</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="展示状态">
              <el-switch v-model="form.displayStatus" :active-value="1" :inactive-value="0" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px">上架后前端可展示</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可售状态">
              <el-switch v-model="form.saleStatus" :active-value="1" :inactive-value="0" />
              <span style="margin-left: 8px; color: #909399; font-size: 12px">可售后用户可下单</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="运营资质编码">
              <el-input v-model="form.qualificationCode" placeholder="请输入运营资质编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="资质有效期至">
              <el-date-picker
                v-model="form.qualificationValidUntil"
                type="date"
                placeholder="选择有效期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '保存修改' : '确认创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Airplane, Global, Connection, Promotion } from '@element-plus/icons-vue'
import { createFlight, updateFlight, validateFlightData } from '@/api/flight'
import {
  FlightTypeEnum,
  CabinClassEnum,
  FlightValidateFieldEnum
} from '@/utils/enums'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  flightData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'closed'])

const visible = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const shakeFields = ref([])
const validatedSuccess = ref([])
const fieldErrors = reactive({})

const isEdit = computed(() => !!props.flightData)

const getDefaultForm = () => ({
  flightNo: '',
  airline: '',
  airlineCode: '',
  flightType: 1,
  routeCode: '',
  departure: '',
  departureAirport: '',
  departureAirportCode: '',
  arrival: '',
  arrivalAirport: '',
  arrivalAirportCode: '',
  departureTime: '',
  arrivalTime: '',
  aircraftType: '',
  aircraftModel: '',
  cabinClass: 'economy',
  price: 0,
  seatCount: 0,
  seats: 0,
  isInternational: 0,
  departureCountry: '',
  arrivalCountry: '',
  visaRequired: 0,
  isTransfer: 0,
  transferCity: '',
  transferAirport: '',
  transferAirportCode: '',
  transferDuration: 0,
  isCharter: 0,
  charterContractNo: '',
  flightDuration: 0,
  displayStatus: 1,
  saleStatus: 1,
  operationStatus: 1,
  qualificationCode: '',
  qualificationValidUntil: '',
  remark: ''
})

const form = reactive(getDefaultForm())

const rules = {
  flightNo: [
    { required: true, message: '请输入航班号', trigger: 'blur' }
  ],
  routeCode: [
    { required: true, message: '请输入航线编码', trigger: 'blur' }
  ],
  airline: [
    { required: true, message: '请输入航空公司', trigger: 'blur' }
  ],
  departure: [
    { required: true, message: '请输入出发城市', trigger: 'blur' }
  ],
  departureAirport: [
    { required: true, message: '请输入出发机场', trigger: 'blur' }
  ],
  departureAirportCode: [
    { required: true, message: '请输入出发机场三字码', trigger: 'blur' }
  ],
  arrival: [
    { required: true, message: '请输入到达城市', trigger: 'blur' }
  ],
  arrivalAirport: [
    { required: true, message: '请输入到达机场', trigger: 'blur' }
  ],
  arrivalAirportCode: [
    { required: true, message: '请输入到达机场三字码', trigger: 'blur' }
  ],
  departureTime: [
    { required: true, message: '请选择出发时间', trigger: 'change' }
  ],
  arrivalTime: [
    { required: true, message: '请选择到达时间', trigger: 'change' }
  ],
  aircraftType: [
    { required: true, message: '请输入机型', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'change' }
  ]
}

const triggerShake = (field) => {
  if (!shakeFields.value.includes(field)) {
    shakeFields.value.push(field)
    setTimeout(() => {
      shakeFields.value = shakeFields.value.filter(f => f !== field)
    }, 500)
  }
}

const validateField = async (field) => {
  const data = { ...form }
  try {
    const res = await validateFlightData(data, isEdit.value ? props.flightData?.id : null)
    const errors = res.data?.errors || []
    const fieldError = errors.find(e => e.field === field)
    if (fieldError) {
      fieldErrors[field] = fieldError.message
      validatedSuccess.value = validatedSuccess.value.filter(f => f !== field)
      triggerShake(field)
      return false
    } else {
      fieldErrors[field] = ''
      if (!validatedSuccess.value.includes(field)) {
        validatedSuccess.value.push(field)
      }
      return true
    }
  } catch (e) {
    return false
  }
}

const handleAirportCodeBlur = (field) => {
  if (form[field]) {
    form[field] = form[field].toUpperCase()
  }
  validateField(field)
}

const handleTimeChange = () => {
  if (form.departureTime && form.arrivalTime) {
    const dep = new Date(form.departureTime).getTime()
    const arr = new Date(form.arrivalTime).getTime()
    if (!isNaN(dep) && !isNaN(arr) && arr > dep) {
      form.flightDuration = Math.round((arr - dep) / 60000)
    }
  }
  validateField('departureTime')
  validateField('arrivalTime')
}

const handleSeatChange = () => {
  if (form.seats > form.seatCount) {
    form.seats = form.seatCount
  }
}

const handleTypeChange = (type) => {
  form.flightType = type
  form.isInternational = type === 2 ? 1 : 0
  form.isTransfer = type === 3 ? 1 : 0
  form.isCharter = type === 4 ? 1 : 0
  if (type !== 2) {
    form.departureCountry = ''
    form.arrivalCountry = ''
    form.visaRequired = 0
  }
  if (type !== 3) {
    form.transferCity = ''
    form.transferAirport = ''
    form.transferAirportCode = ''
    form.transferDuration = 0
  }
  if (type !== 4) {
    form.charterContractNo = ''
  }
}

const handleValidate = (prop, isValid) => {
  if (!isValid) {
    triggerShake(prop)
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (e) {
    ElMessage.warning('请检查表单填写是否正确')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateFlight(props.flightData.id, { ...form })
      ElMessage.success('航班更新成功')
    } else {
      await createFlight({ ...form })
      ElMessage.success('航班创建成功')
    }
    emit('success')
    emit('update:modelValue', false)
  } catch (e) {
    if (e.response?.data?.data) {
      const errors = e.response.data.data
      if (Array.isArray(errors)) {
        errors.forEach(err => {
          if (err.field) {
            fieldErrors[err.field] = err.message
            triggerShake(err.field)
          }
        })
      }
    }
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    Object.assign(form, getDefaultForm())
    shakeFields.value = []
    validatedSuccess.value = []
    Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
    if (props.flightData) {
      Object.assign(form, props.flightData)
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})
</script>
