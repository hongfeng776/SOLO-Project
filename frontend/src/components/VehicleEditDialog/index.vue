<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑车辆备案' : '新增车辆备案'"
    width="880px"
    :close-on-click-modal="false"
    :before-close="handleClose"
    class="vehicle-edit-dialog"
  >
    <div v-if="validationResult && validationResult.risks?.some((r: any) => r.level === 'high')" class="risk-warning">
      <el-alert
        title="检测到高风险问题"
        type="error"
        :closable="false"
        show-icon
      >
        <template #default>
          <p v-for="(risk, idx) in validationResult.risks.filter((r: any) => r.level === 'high')" :key="idx">
            {{ risk.message }}
          </p>
        </template>
      </el-alert>
    </div>

    <div v-if="validationResult && !validationResult.valid && validationResult.failed?.length" class="validation-warning">
      <el-alert
        :title="`存在${validationResult.failed.length}项校验不通过`"
        type="error"
        :closable="false"
        show-icon
      >
        <template #default>
          <p v-for="(item, idx) in validationResult.failed.slice(0, 3)" :key="idx">
            {{ item.message }}
          </p>
        </template>
      </el-alert>
    </div>

    <div v-if="validationResult && validationResult.warnings?.length" class="warning-alert">
      <el-alert
        :title="`存在${validationResult.warnings.length}项警告`"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <p v-for="(item, idx) in validationResult.warnings" :key="idx">
            {{ item.message }}
          </p>
        </template>
      </el-alert>
    </div>

    <div v-if="levelInfo" class="level-preview">
      <div class="level-header">
        <span class="label">运营等级评估：</span>
        <span :class="['level-tag', `level-${levelInfo.levelName?.charAt(0)}`]">
          {{ levelInfo.levelName }}
        </span>
        <span class="score">综合评分: {{ levelInfo.totalScore }}分</span>
      </div>
      <div class="level-breakdown" v-if="levelInfo.breakdown?.length">
        <div v-for="(item, idx) in levelInfo.breakdown" :key="idx" class="breakdown-item">
          <span class="item-label">{{ item.item }}:</span>
          <span class="item-value">{{ item.value }}</span>
          <span class="item-score">+{{ item.score }}分</span>
        </div>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="vehicle-edit-form"
    >
      <el-tabs v-model="activeTab" class="edit-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="车牌号" prop="plateNumber" :class="{ 'input-error': plateValidationStatus === 'error', 'shake': shakeFields.plateNumber }">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.plateNumber"
                    placeholder="请输入车牌号"
                    @blur="validatePlateUnique"
                    @input="handlePlateInput"
                    clearable
                    style="text-transform: uppercase"
                  />
                  <div v-if="plateValidationStatus !== 'pending'" class="validation-icon">
                    <el-icon v-if="plateValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="plateValidationStatus === 'validating'" class="icon-loading">
                      <Loading />
                    </el-icon>
                    <el-icon v-else-if="plateValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
                <div v-if="plateValidationStatus === 'error'" class="error-message">
                  {{ plateValidationMessage }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="车架号" prop="vin" :class="{ 'input-error': vinValidationStatus === 'error', 'shake': shakeFields.vin }">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.vin"
                    placeholder="请输入17位车架号"
                    @blur="validateVINUnique"
                    @input="handleVINInput"
                    clearable
                    style="text-transform: uppercase"
                  />
                  <div v-if="vinValidationStatus !== 'pending'" class="validation-icon">
                    <el-icon v-if="vinValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="vinValidationStatus === 'validating'" class="icon-loading">
                      <Loading />
                    </el-icon>
                    <el-icon v-else-if="vinValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
                <div v-if="vinValidationStatus === 'error'" class="error-message">
                  {{ vinValidationMessage }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发动机号" prop="engineNo" :class="{ 'shake': shakeFields.engineNo }">
                <el-input
                  v-model="formData.engineNo"
                  placeholder="请输入发动机号"
                  @input="handleEngineNoInput"
                  clearable
                  style="text-transform: uppercase"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备案城市" prop="city">
                <el-input v-model="formData.city" placeholder="请输入备案城市" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="品牌" prop="brand" :class="{ 'shake': shakeFields.brand }">
                <el-input v-model="formData.brand" placeholder="请输入品牌" clearable @input="handleFieldInput('brand')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="型号" prop="model" :class="{ 'shake': shakeFields.model }">
                <el-input v-model="formData.model" placeholder="请输入型号" clearable @input="handleFieldInput('model')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="颜色" prop="color" :class="{ 'shake': shakeFields.color }">
                <el-input v-model="formData.color" placeholder="请输入颜色" clearable @input="handleFieldInput('color')" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="车辆类型" prop="vehicleType">
                <el-select v-model="formData.vehicleType" placeholder="请选择车辆类型" style="width: 100%">
                  <el-option label="轿车" value="轿车" />
                  <el-option label="SUV" value="SUV" />
                  <el-option label="面包车" value="面包车" />
                  <el-option label="货车" value="货车" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="运力类型" prop="capacityType">
                <el-select v-model="formData.capacityType" placeholder="请选择运力类型" style="width: 100%">
                  <el-option label="快车" :value="1" />
                  <el-option label="专车" :value="2" />
                  <el-option label="豪华车" :value="3" />
                  <el-option label="拼车" :value="4" />
                  <el-option label="出租车" :value="5" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="座位数" prop="seats">
                <el-input-number v-model="formData.seats" :min="2" :max="9" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排量(L)" prop="displacement">
                <el-input-number v-model="formData.displacement" :min="0.8" :max="6.0" :step="0.1" :precision="1" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="排放标准" prop="emissionStandard">
                <el-select v-model="formData.emissionStandard" placeholder="请选择排放标准" style="width: 100%">
                  <el-option label="国一" :value="1" />
                  <el-option label="国二" :value="2" />
                  <el-option label="国三" :value="3" />
                  <el-option label="国四" :value="4" />
                  <el-option label="国五" :value="5" />
                  <el-option label="国六" :value="6" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="注册日期" prop="registrationDate">
                <el-date-picker
                  v-model="formData.registrationDate"
                  type="date"
                  placeholder="请选择注册日期"
                  style="width: 100%"
                  :disabled-date="disabledFutureDate"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="证件信息" name="documents">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="行驶证有效期" prop="drivingLicenseDate" :class="{ 'shake': shakeFields.drivingLicenseDate }">
                <el-date-picker
                  v-model="formData.drivingLicenseDate"
                  type="date"
                  placeholder="请选择行驶证有效期"
                  style="width: 100%"
                  :disabled-date="disabledPastDate"
                  @change="handleFieldInput('drivingLicenseDate')"
                />
                <div v-if="isDateExpired(formData.drivingLicenseDate)" class="error-message">
                  行驶证已过期
                </div>
                <div v-else-if="isDateExpiringSoon(formData.drivingLicenseDate)" class="warning-message">
                  行驶证将在30天内到期
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年检有效期" prop="inspectionDate" :class="{ 'shake': shakeFields.inspectionDate }">
                <el-date-picker
                  v-model="formData.inspectionDate"
                  type="date"
                  placeholder="请选择年检有效期"
                  style="width: 100%"
                  :disabled-date="disabledPastDate"
                  @change="handleFieldInput('inspectionDate')"
                />
                <div v-if="isDateExpired(formData.inspectionDate)" class="error-message">
                  年检已过期
                </div>
                <div v-else-if="isDateExpiringSoon(formData.inspectionDate)" class="warning-message">
                  年检将在30天内到期
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保险有效期" prop="insuranceDate" :class="{ 'shake': shakeFields.insuranceDate }">
                <el-date-picker
                  v-model="formData.insuranceDate"
                  type="date"
                  placeholder="请选择保险有效期"
                  style="width: 100%"
                  :disabled-date="disabledPastDate"
                  @change="handleFieldInput('insuranceDate')"
                />
                <div v-if="isDateExpired(formData.insuranceDate)" class="error-message">
                  保险已过期
                </div>
                <div v-else-if="isDateExpiringSoon(formData.insuranceDate)" class="warning-message">
                  保险将在30天内到期
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="绑定司机" prop="driverName">
                <el-input v-model="formData.driverName" placeholder="请输入司机姓名" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="车辆照片" prop="vehicleImg">
                <QualificationUpload
                  v-model="formData.vehicleImg"
                  label="车辆照片"
                  placeholder="上传车辆照片"
                  :max-count="3"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="行驶证照片" prop="drivingLicenseImg">
                <QualificationUpload
                  v-model="formData.drivingLicenseImg"
                  label="行驶证"
                  placeholder="上传行驶证照片"
                  :max-count="2"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="保险单照片" prop="insuranceImg">
                <QualificationUpload
                  v-model="formData.insuranceImg"
                  label="保险单"
                  placeholder="上传保险单照片"
                  :max-count="2"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="年检照片" prop="inspectionImg">
                <QualificationUpload
                  v-model="formData.inspectionImg"
                  label="年检标志"
                  placeholder="上传年检照片"
                  :max-count="2"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          {{ isEdit ? '保存修改' : '提交备案' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Check, Close, Loading } from '@element-plus/icons-vue'
import QualificationUpload from '@/components/QualificationUpload/index.vue'
import {
  checkPlateApi,
  checkVINApi,
  validateVehicleApi,
  createVehicleApi,
  updateVehicleApi
} from '@/api/vehicle'
import type { Vehicle, ValidationResult, LevelBreakdownItem } from '@/types/vehicle'

interface Props {
  modelValue: boolean
  vehicleData: Vehicle | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  vehicleData: null
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref<FormInstance>()
const dialogVisible = ref(props.modelValue)
const activeTab = ref('basic')
const submitting = ref(false)
const validating = ref(false)
const validationResult = ref<ValidationResult | null>(null)
const levelInfo = ref<{
  level: number
  levelName: string
  totalScore: number
  breakdown: LevelBreakdownItem[]
} | null>(null)

const plateValidationStatus = ref<'pending' | 'validating' | 'success' | 'error'>('pending')
const plateValidationMessage = ref('')
const vinValidationStatus = ref<'pending' | 'validating' | 'success' | 'error'>('pending')
const vinValidationMessage = ref('')

const shakeFields = reactive<Record<string, boolean>>({
  plateNumber: false,
  vin: false,
  engineNo: false,
  brand: false,
  model: false,
  color: false,
  drivingLicenseDate: false,
  inspectionDate: false,
  insuranceDate: false
})

const isEdit = computed(() => !!props.vehicleData?.id)

const formData = ref({
  plateNumber: '',
  vin: '',
  engineNo: '',
  brand: '',
  model: '',
  color: '',
  capacityType: 1,
  seats: 5,
  displacement: 1.8,
  emissionStandard: 5,
  vehicleType: '轿车',
  vehicleImg: '',
  drivingLicenseImg: '',
  insuranceImg: '',
  inspectionImg: '',
  registrationDate: '',
  drivingLicenseDate: '',
  inspectionDate: '',
  insuranceDate: '',
  city: '',
  driverName: ''
})

const formRules: FormRules = {
  plateNumber: [
    { required: true, message: '请输入车牌号', trigger: 'blur' }
  ],
  vin: [
    { required: true, message: '请输入车架号', trigger: 'blur' }
  ],
  brand: [
    { required: true, message: '请输入品牌', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入型号', trigger: 'blur' }
  ],
  color: [
    { required: true, message: '请输入颜色', trigger: 'blur' }
  ],
  capacityType: [
    { required: true, message: '请选择运力类型', trigger: 'change' }
  ],
  seats: [
    { required: true, message: '请输入座位数', trigger: 'blur' }
  ],
  drivingLicenseDate: [
    { required: true, message: '请选择行驶证有效期', trigger: 'change' }
  ],
  inspectionDate: [
    { required: true, message: '请选择年检有效期', trigger: 'change' }
  ],
  insuranceDate: [
    { required: true, message: '请选择保险有效期', trigger: 'change' }
  ]
}

const canSubmit = computed(() => {
  if (!validationResult.value?.valid) return false
  if (plateValidationStatus.value === 'error') return false
  if (vinValidationStatus.value === 'error') return false
  return true
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    initFormData()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

watch(formData, () => {
  if (dialogVisible.value) {
    debouncedValidate()
  }
}, { deep: true })

let validateTimer: any = null
const debouncedValidate = () => {
  if (validateTimer) clearTimeout(validateTimer)
  validateTimer = setTimeout(() => {
    validateAll()
  }, 500)
}

const initFormData = () => {
  if (props.vehicleData) {
    formData.value = {
      plateNumber: props.vehicleData.plateNumber || '',
      vin: props.vehicleData.vin || '',
      engineNo: props.vehicleData.engineNo || '',
      brand: props.vehicleData.brand || '',
      model: props.vehicleData.model || '',
      color: props.vehicleData.color || '',
      capacityType: props.vehicleData.capacityType || 1,
      seats: props.vehicleData.seats || 5,
      displacement: props.vehicleData.displacement || 1.8,
      emissionStandard: props.vehicleData.emissionStandard || 5,
      vehicleType: props.vehicleData.vehicleType || '轿车',
      vehicleImg: props.vehicleData.vehicleImg || '',
      drivingLicenseImg: props.vehicleData.drivingLicenseImg || '',
      insuranceImg: props.vehicleData.insuranceImg || '',
      inspectionImg: props.vehicleData.inspectionImg || '',
      registrationDate: props.vehicleData.registrationDate || '',
      drivingLicenseDate: props.vehicleData.drivingLicenseDate || '',
      inspectionDate: props.vehicleData.inspectionDate || '',
      insuranceDate: props.vehicleData.insuranceDate || '',
      city: props.vehicleData.city || '',
      driverName: props.vehicleData.driverName || ''
    }
  } else {
    formData.value = {
      plateNumber: '',
      vin: '',
      engineNo: '',
      brand: '',
      model: '',
      color: '',
      capacityType: 1,
      seats: 5,
      displacement: 1.8,
      emissionStandard: 5,
      vehicleType: '轿车',
      vehicleImg: '',
      drivingLicenseImg: '',
      insuranceImg: '',
      inspectionImg: '',
      registrationDate: '',
      drivingLicenseDate: '',
      inspectionDate: '',
      insuranceDate: '',
      city: '',
      driverName: ''
    }
  }
  resetValidationStatus()
  activeTab.value = 'basic'
}

const resetValidationStatus = () => {
  plateValidationStatus.value = 'pending'
  plateValidationMessage.value = ''
  vinValidationStatus.value = 'pending'
  vinValidationMessage.value = ''
  validationResult.value = null
  levelInfo.value = null
  Object.keys(shakeFields).forEach(key => {
    shakeFields[key] = false
  })
}

const triggerShake = (field: string) => {
  shakeFields[field] = true
  setTimeout(() => {
    shakeFields[field] = false
  }, 400)
}

const handlePlateInput = () => {
  plateValidationStatus.value = 'pending'
  plateValidationMessage.value = ''
}

const handleVINInput = () => {
  vinValidationStatus.value = 'pending'
  vinValidationMessage.value = ''
}

const handleEngineNoInput = () => {
  if (formData.value.engineNo && !/^[A-Z0-9]{6,20}$/.test(formData.value.engineNo.toUpperCase().replace(/\s/g, ''))) {
    triggerShake('engineNo')
  }
}

const handleFieldInput = (field: string) => {
  if (!formData.value[field as keyof typeof formData.value]) {
    triggerShake(field)
  }
}

const validatePlateUnique = async () => {
  if (!formData.value.plateNumber) {
    plateValidationStatus.value = 'error'
    plateValidationMessage.value = '请输入车牌号'
    triggerShake('plateNumber')
    return
  }
  
  const platePattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/
  const platePattern2 = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][0-9]{5,6}$/
  
  const cleanPlate = formData.value.plateNumber.toUpperCase().replace(/\s/g, '')
  
  if (!platePattern.test(cleanPlate) && !platePattern2.test(cleanPlate)) {
    plateValidationStatus.value = 'error'
    plateValidationMessage.value = '车牌号格式不正确'
    triggerShake('plateNumber')
    return
  }
  
  plateValidationStatus.value = 'validating'
  try {
    const res = await checkPlateApi(cleanPlate, props.vehicleData?.id)
    if (res.data.valid && res.data.unique) {
      plateValidationStatus.value = 'success'
      plateValidationMessage.value = ''
    } else {
      plateValidationStatus.value = 'error'
      plateValidationMessage.value = res.data.message || '该车牌号已存在'
      triggerShake('plateNumber')
    }
  } catch (error: any) {
    plateValidationStatus.value = 'error'
    plateValidationMessage.value = error.message || '车牌号校验失败'
    triggerShake('plateNumber')
  }
}

const validateVINUnique = async () => {
  if (!formData.value.vin) {
    vinValidationStatus.value = 'error'
    vinValidationMessage.value = '请输入车架号'
    triggerShake('vin')
    return
  }
  
  const cleanVIN = formData.value.vin.toUpperCase().replace(/\s/g, '')
  
  if (cleanVIN.length !== 17) {
    vinValidationStatus.value = 'error'
    vinValidationMessage.value = '车架号必须为17位'
    triggerShake('vin')
    return
  }
  
  if (cleanVIN.includes('I') || cleanVIN.includes('O') || cleanVIN.includes('Q')) {
    vinValidationStatus.value = 'error'
    vinValidationMessage.value = '车架号不能包含I、O、Q字符'
    triggerShake('vin')
    return
  }
  
  vinValidationStatus.value = 'validating'
  try {
    const res = await checkVINApi(cleanVIN, props.vehicleData?.id)
    if (res.data.valid && res.data.unique) {
      vinValidationStatus.value = 'success'
      vinValidationMessage.value = ''
    } else {
      vinValidationStatus.value = 'error'
      vinValidationMessage.value = res.data.message || '该车架号已存在'
      triggerShake('vin')
    }
  } catch (error: any) {
    vinValidationStatus.value = 'error'
    vinValidationMessage.value = error.message || '车架号校验失败'
    triggerShake('vin')
  }
}

const validateAll = async () => {
  validating.value = true
  try {
    const data = { ...formData.value }
    if (data.plateNumber) {
      data.plateNumber = data.plateNumber.toUpperCase().replace(/\s/g, '')
    }
    if (data.vin) {
      data.vin = data.vin.toUpperCase().replace(/\s/g, '')
    }
    if (data.engineNo) {
      data.engineNo = data.engineNo.toUpperCase().replace(/\s/g, '')
    }
    
    const res = await validateVehicleApi(data, props.vehicleData?.id)
    validationResult.value = res.data
    
    if (res.data.passed?.some((p: any) => p.field === 'vinUniqueness')) {
      vinValidationStatus.value = 'success'
    }
    if (res.data.passed?.some((p: any) => p.field === 'plateNumberUniqueness')) {
      plateValidationStatus.value = 'success'
    }
    
    if (res.data.totalScore !== undefined) {
      levelInfo.value = {
        level: res.data.level || 3,
        levelName: ['S级', 'A级', 'B级', 'C级'][(res.data.level || 3) - 1],
        totalScore: res.data.totalScore,
        breakdown: res.data.levelBreakdown || []
      }
    }
  } catch (error: any) {
    console.error('Validation error:', error)
  } finally {
    validating.value = false
  }
}

const isDateExpired = (dateStr: string) => {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

const isDateExpiringSoon = (dateStr: string) => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
  return date >= now && date < thirtyDaysLater
}

const disabledFutureDate = (date: any) => {
  return date && date.valueOf() > Date.now()
}

const disabledPastDate = (date: any) => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date && date.valueOf() < yesterday.valueOf()
}

const handleClose = () => {
  if (submitting.value) return
  dialogVisible.value = false
  formRef.value?.resetFields()
  resetValidationStatus()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善必填信息')
    return
  }
  
  if (plateValidationStatus.value !== 'success') {
    ElMessage.warning('请校验车牌号唯一性')
    triggerShake('plateNumber')
    return
  }
  
  if (vinValidationStatus.value !== 'success') {
    ElMessage.warning('请校验车架号唯一性')
    triggerShake('vin')
    return
  }
  
  if (!validationResult.value?.valid) {
    ElMessage.warning('存在校验不通过项，请检查后重试')
    return
  }
  
  submitting.value = true
  try {
    const data = { ...formData.value }
    if (data.plateNumber) {
      data.plateNumber = data.plateNumber.toUpperCase().replace(/\s/g, '')
    }
    if (data.vin) {
      data.vin = data.vin.toUpperCase().replace(/\s/g, '')
    }
    if (data.engineNo) {
      data.engineNo = data.engineNo.toUpperCase().replace(/\s/g, '')
    }
    
    let res
    if (isEdit.value && props.vehicleData?.id) {
      res = await updateVehicleApi(props.vehicleData.id, data)
    } else {
      res = await createVehicleApi(data)
    }
    
    ElMessage.success(isEdit.value ? '修改成功' : '备案提交成功')
    emit('success', res.data)
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.vehicle-edit-dialog {
  .risk-warning,
  .validation-warning,
  .warning-alert {
    margin-bottom: 16px;
  }

  .level-preview {
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    border: 1px solid #7dd3fc;

    .level-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .label {
        font-weight: 600;
        color: #1e293b;
      }

      .score {
        margin-left: auto;
        color: #0369a1;
        font-weight: 600;
      }
    }

    .level-breakdown {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;

      .breakdown-item {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #fff;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12px;

        .item-label {
          color: #64748b;
        }

        .item-value {
          color: #1e293b;
          font-weight: 500;
        }

        .item-score {
          color: #059669;
          font-weight: 600;
        }
      }
    }
  }

  .edit-tabs {
    :deep(.el-tabs__header) {
      margin: 0 0 20px 0;
    }
  }

  .form-item-with-status {
    position: relative;
    width: 100%;

    .validation-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;

      .icon-success {
        color: #67c23a;
        font-size: 18px;
      }

      .icon-error {
        color: #f56c6c;
        font-size: 18px;
      }

      .icon-loading {
        color: #409eff;
        font-size: 18px;
        animation: rotate 1s linear infinite;
      }
    }

    :deep(.el-input__wrapper) {
      padding-right: 36px;
    }
  }

  .error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.2;
  }

  .warning-message {
    color: #e6a23c;
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.2;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
