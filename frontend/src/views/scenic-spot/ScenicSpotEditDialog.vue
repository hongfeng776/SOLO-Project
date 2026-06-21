<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="(v) => emit('update:visible', v)"
    :title="spotId ? '编辑景点信息' : '新增景点'"
    width="720px"
    class="scenic-spot-ops edit-dialog-form focus-glow"
    :close-on-click-modal="false"
    @open="onOpen"
  >
    <div v-if="verifyWarnings.length > 0" class="verify-warnings">
      <el-alert
        v-for="(w, i) in verifyWarnings"
        :key="i"
        :type="w.level"
        show-icon
        :closable="false"
        :title="w.title"
        :description="w.message"
      />
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      label-position="right"
    >
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <el-form-item label="景点类型" prop="spotType" required>
          <el-select
            v-model="formData.spotType"
            style="width: 200px"
            :disabled="!!spotId"
            @change="onSpotTypeChange"
          >
            <el-option
              v-for="item in Object.values(ScenicSpotTypeEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="景点名称" prop="name" required>
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.name"
              placeholder="请输入景点名称"
              maxlength="100"
              clearable
              :class="{ 'shake-error': shakeField === 'name' }"
              @blur="validateField('name')"
              @input="onFieldInput('name')"
              style="flex: 1;"
            />
            <el-icon
              v-if="validFields.has('name') && !shakeField"
              class="valid-check-icon"
            >
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="所在省份" prop="province" required>
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.province"
              placeholder="例如：浙江省"
              :class="{ 'shake-error': shakeField === 'province' }"
              @blur="validateField('province')"
              @input="onFieldInput('province')"
              style="flex: 1; width: 200px;"
            />
            <el-icon v-if="validFields.has('province')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="所在城市" prop="city" required>
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.city"
              placeholder="例如：杭州市"
              :class="{ 'shake-error': shakeField === 'city' }"
              @blur="validateField('city')"
              @input="onFieldInput('city')"
              style="flex: 1; width: 200px;"
            />
            <el-icon v-if="validFields.has('city')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="所在区县" prop="district">
          <el-input
            v-model="formData.district"
            placeholder="例如：西湖区"
            maxlength="50"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="详细地址" prop="address" required>
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.address"
              placeholder="请输入详细地址"
              maxlength="200"
              :class="{ 'shake-error': shakeField === 'address' }"
              @blur="validateAddress"
              @input="onFieldInput('address')"
              style="flex: 1;"
            />
            <el-icon v-if="validFields.has('address')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="景区等级" prop="level">
          <el-select v-model="formData.level" placeholder="请选择等级" clearable style="width: 200px;">
            <el-option
              v-for="item in Object.values(ScenicSpotLevelEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="经营主体" prop="merchantId">
          <el-input
            v-model="formData.merchantId"
            placeholder="关联商家ID"
            style="width: 200px;"
          />
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">运营与限流配置</div>
        <el-form-item label="营业时间" prop="openingHours" required>
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.openingHours"
              placeholder="例如：08:00-17:30（周一至周日）"
              :class="{ 'shake-error': shakeField === 'openingHours' }"
              @blur="validateOpeningHours"
              @input="onFieldInput('openingHours')"
              style="flex: 1;"
            />
            <el-icon v-if="validFields.has('openingHours')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="日承载量" prop="dailyCapacity">
          <el-input-number
            v-model="formData.dailyCapacity"
            :min="0"
            :max="999999"
            placeholder="最大日承载人数"
          />
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">人</span>
        </el-form-item>
        <el-form-item label="限流规则" prop="limitRule">
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.limitRule"
              type="textarea"
              :rows="2"
              placeholder="例如：旺季需提前预约、瞬时承载量不超过XXX人"
              :class="{ 'shake-error': shakeField === 'limitRule' }"
              @blur="validateLimitRule"
              @input="onFieldInput('limitRule')"
              style="flex: 1;"
            />
            <el-icon v-if="validFields.has('limitRule') || !formData.limitRule" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="参考票价" prop="ticketPrice">
          <el-input-number
            v-model="formData.ticketPrice"
            :min="0"
            :precision="2"
            :step="10"
            placeholder="参考门票价格"
          />
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">元</span>
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">资质信息（必填）</div>
        <el-form-item label="营业执照号" prop="businessLicense" required>
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.businessLicense"
              placeholder="统一社会信用代码（18位）"
              maxlength="18"
              :class="{ 'shake-error': shakeField === 'businessLicense' }"
              @blur="validateBusinessLicense"
              @input="onFieldInput('businessLicense')"
              style="flex: 1; width: 280px;"
            />
            <el-icon v-if="validFields.has('businessLicense')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="营业执照到期" prop="licenseExpiryDate" required>
          <div class="field-with-check" style="width: 100%;">
            <el-date-picker
              v-model="formData.licenseExpiryDate"
              type="date"
              placeholder="选择到期日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :class="{ 'shake-error': shakeField === 'licenseExpiryDate' }"
              @change="validateLicenseExpiry"
              style="width: 280px;"
            />
            <el-icon v-if="validFields.has('licenseExpiryDate')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="文旅经营许可" prop="tourismLicense">
          <el-input
            v-model="formData.tourismLicense"
            placeholder="文旅经营许可证编号"
            maxlength="50"
            style="width: 280px;"
          />
        </el-form-item>
        <el-form-item label="文旅许可到期" prop="tourismLicenseExpiry">
          <el-date-picker
            v-model="formData.tourismLicenseExpiry"
            type="date"
            placeholder="选择到期日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 280px;"
          />
        </el-form-item>
        <el-form-item label="安全许可证" prop="safetyLicense">
          <el-input
            v-model="formData.safetyLicense"
            placeholder="安全经营许可证编号"
            maxlength="50"
            style="width: 280px;"
          />
        </el-form-item>
        <el-form-item label="消防许可证" prop="fireLicense">
          <el-input
            v-model="formData.fireLicense"
            placeholder="消防检查合格证明"
            maxlength="50"
            style="width: 280px;"
          />
        </el-form-item>
      </div>

      <div v-if="formData.spotType === 'performance'" class="form-section">
        <div class="section-title">展演专属配置</div>
        <el-form-item label="演出许可证" prop="performanceLicense">
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.performanceLicense"
              placeholder="营业性演出许可证编号"
              maxlength="50"
              :class="{ 'shake-error': shakeField === 'performanceLicense' }"
              @blur="validatePerformanceLicense"
              @input="onFieldInput('performanceLicense')"
              style="flex: 1; width: 280px;"
            />
            <el-icon v-if="validFields.has('performanceLicense')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
        <el-form-item label="演出许可到期" prop="performanceLicenseExpiry">
          <el-date-picker
            v-model="formData.performanceLicenseExpiry"
            type="date"
            placeholder="选择到期日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 280px;"
          />
        </el-form-item>
        <el-form-item label="场次安排" prop="performanceSchedule">
          <div class="field-with-check" style="width: 100%;">
            <el-input
              v-model="formData.performanceSchedule"
              type="textarea"
              :rows="3"
              placeholder="请描述演出场次安排，如：每天 19:30-21:00、周末加场 14:00-15:30"
              :class="{ 'shake-error': shakeField === 'performanceSchedule' }"
              @blur="validatePerformanceSchedule"
              @input="onFieldInput('performanceSchedule')"
              style="flex: 1;"
            />
            <el-icon v-if="validFields.has('performanceSchedule')" class="valid-check-icon">
              <CircleCheckFilled />
            </el-icon>
          </div>
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">其他配置</div>
        <el-form-item label="展示权重" prop="displayWeight">
          <el-slider
            v-model="formData.displayWeight"
            :min="0"
            :max="100"
            :step="1"
            show-input
            style="width: 400px;"
          />
        </el-form-item>
        <el-form-item label="描述信息" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="景点描述介绍"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
        v-ripple
      >
        {{ spotId ? '保存修改' : '提交创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { getScenicSpot, createScenicSpot, updateScenicSpot } from '@/api/scenicSpot'
import {
  ScenicSpotTypeEnum, ScenicSpotLevelEnum
} from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  spotId: { type: [Number, String], default: null },
  spotType: { type: String, default: 'natural' }
})

const emit = defineEmits(['update:visible', 'success'])

const formRef = ref(null)
const submitting = ref(false)
const shakeField = ref('')
const validFields = ref(new Set())
const verifyWarnings = ref([])

const formData = reactive({
  spotType: 'natural',
  name: '',
  province: '',
  city: '',
  district: '',
  address: '',
  level: '',
  merchantId: null,
  openingHours: '',
  dailyCapacity: null,
  limitRule: '',
  ticketPrice: null,
  businessLicense: '',
  licenseExpiryDate: '',
  tourismLicense: '',
  tourismLicenseExpiry: '',
  safetyLicense: '',
  fireLicense: '',
  performanceLicense: '',
  performanceLicenseExpiry: '',
  performanceSchedule: '',
  displayWeight: 50,
  description: ''
})

const resetForm = () => {
  Object.assign(formData, {
    spotType: props.spotType || 'natural',
    name: '', province: '', city: '', district: '', address: '',
    level: '', merchantId: null, openingHours: '', dailyCapacity: null,
    limitRule: '', ticketPrice: null, businessLicense: '', licenseExpiryDate: '',
    tourismLicense: '', tourismLicenseExpiry: '', safetyLicense: '', fireLicense: '',
    performanceLicense: '', performanceLicenseExpiry: '', performanceSchedule: '',
    displayWeight: 50, description: ''
  })
  validFields.value = new Set()
  verifyWarnings.value = []
  shakeField.value = ''
}

const onOpen = async () => {
  resetForm()
  if (props.spotId) {
    try {
      const res = await getScenicSpot(props.spotId)
      if (res.data) {
        Object.assign(formData, res.data)
      }
    } catch (e) {
      ElMessage.error('加载景点信息失败')
    }
  }
  formRef.value?.clearValidate()
}

const triggerShake = (field) => {
  shakeField.value = field
  validFields.value.delete(field)
  setTimeout(() => (shakeField.value = ''), 500)
}

const onFieldInput = (field) => {
  if (shakeField.value === field) shakeField.value = ''
}

const runValidate = async (field, validator) => {
  try {
    await formRef.value?.validateField(field)
    const ok = validator ? validator() : true
    if (ok) {
      validFields.value.add(field)
      return true
    } else {
      triggerShake(field)
      return false
    }
  } catch (e) {
    triggerShake(field)
    return false
  }
}

const validateField = (field) => runValidate(field)

const validateAddress = () => {
  if (!formData.address || formData.address.length < 5) {
    ElMessage.warning('详细地址长度不少于5个字符')
    triggerShake('address')
    validFields.value.delete('address')
    return false
  }
  return runValidate('address', () => true)
}

const validateOpeningHours = () => {
  if (!formData.openingHours) return runValidate('openingHours')
  const regex = /^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/
  if (!regex.test(formData.openingHours)) {
    ElMessage.warning('营业时间格式应为 HH:MM-HH:MM，如 08:00-18:00')
    triggerShake('openingHours')
    validFields.value.delete('openingHours')
    return false
  }
  return runValidate('openingHours', () => true)
}

const validateLimitRule = () => {
  if (!formData.limitRule) {
    validFields.value.add('limitRule')
    return true
  }
  if (formData.limitRule.length > 0 && formData.limitRule.length < 4) {
    ElMessage.warning('限流规则描述过于简短')
    triggerShake('limitRule')
    validFields.value.delete('limitRule')
    return false
  }
  validFields.value.add('limitRule')
  return true
}

const validateBusinessLicense = () => {
  if (!formData.businessLicense) {
    triggerShake('businessLicense')
    return false
  }
  if (!/^[0-9A-Z]{15,18}$/i.test(formData.businessLicense)) {
    ElMessage.warning('营业执照号格式不正确（应为15-18位数字或字母）')
    triggerShake('businessLicense')
    validFields.value.delete('businessLicense')
    return false
  }
  return runValidate('businessLicense', () => true)
}

const validateLicenseExpiry = () => {
  if (!formData.licenseExpiryDate) {
    triggerShake('licenseExpiryDate')
    return false
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(formData.licenseExpiryDate)
  if (expiry < today) {
    verifyWarnings.value.push({
      level: 'warning',
      title: '营业执照已过期',
      message: '当前填写的营业执照到期日已过期，请确认资质有效性。'
    })
  }
  validFields.value.add('licenseExpiryDate')
  return true
}

const validatePerformanceLicense = () => {
  if (formData.spotType !== 'performance') return true
  if (!formData.performanceLicense) {
    ElMessage.warning('展演类景点必须填写演出许可证')
    triggerShake('performanceLicense')
    validFields.value.delete('performanceLicense')
    return false
  }
  validFields.value.add('performanceLicense')
  return true
}

const validatePerformanceSchedule = () => {
  if (formData.spotType !== 'performance') return true
  if (!formData.performanceSchedule || formData.performanceSchedule.length < 5) {
    ElMessage.warning('请填写完整的展演场次安排（不少于5个字符）')
    triggerShake('performanceSchedule')
    validFields.value.delete('performanceSchedule')
    return false
  }
  validFields.value.add('performanceSchedule')
  return true
}

const onSpotTypeChange = () => {
  if (formData.spotType !== 'performance') {
    formData.performanceLicense = ''
    formData.performanceLicenseExpiry = ''
    formData.performanceSchedule = ''
  }
}

const formRules = computed(() => ({
  spotType: [{ required: true, message: '请选择景点类型', trigger: 'change' }],
  name: [
    { required: true, message: '请输入景点名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  province: [{ required: true, message: '请输入省份', trigger: 'blur' }],
  city: [{ required: true, message: '请输入城市', trigger: 'blur' }],
  address: [{ required: true, message: '请输入详细地址', trigger: 'blur' }],
  openingHours: [{ required: true, message: '请输入营业时间', trigger: 'blur' }],
  businessLicense: [{ required: true, message: '请输入营业执照号', trigger: 'blur' }],
  licenseExpiryDate: [{ required: true, message: '请选择营业执照到期日', trigger: 'change' }]
}))

const handleClose = () => {
  if (submitting.value) return
  emit('update:visible', false)
}

const handleSubmit = async () => {
  verifyWarnings.value = []
  const allValid = [
    validateField('name'),
    validateAddress(),
    validateField('province'),
    validateField('city'),
    validateOpeningHours(),
    validateBusinessLicense(),
    validateLicenseExpiry(),
    validateLimitRule(),
    ...(formData.spotType === 'performance' ? [
      validatePerformanceLicense(),
      validatePerformanceSchedule()
    ] : [])
  ]
  if (!allValid.every(v => v)) {
    ElMessage.error('请完善红色标注的必填项后再提交')
    return
  }
  try {
    await formRef.value.validate()
  } catch (e) {
    ElMessage.error('请检查表单填写是否完整')
    return
  }

  submitting.value = true
  try {
    const payload = { ...formData }
    if (props.spotId) {
      await updateScenicSpot(props.spotId, payload)
      ElMessage.success('景点信息更新成功')
      emit('success', props.spotId)
    } else {
      const res = await createScenicSpot(payload)
      ElMessage.success('景点创建成功，已完成前置合规校验')
      emit('success', res.data?.id)
    }
    emit('update:visible', false)
  } catch (err) {
    if (err?.response?.data?.message) {
      ElMessage.error(err.response.data.message)
    } else {
      ElMessage.error(props.spotId ? '保存失败' : '创建失败')
    }
  } finally {
    submitting.value = false
  }
}

watch(() => props.visible, (val) => {
  if (val) onOpen()
})
</script>
