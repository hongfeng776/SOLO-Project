<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑乘客信息"
    width="720px"
    :close-on-click-modal="false"
    :before-close="handleClose"
  >
    <div v-if="!isVerified" class="realname-warning">
      <el-alert
        title="账号未实名"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>未实名账号禁止修改手机号、实名认证等核心隐私信息</p>
          <p>请先完成实名认证后再进行操作</p>
        </template>
      </el-alert>
    </div>

    <div v-if="validationResult && !validationResult.valid" class="validation-warning">
      <el-alert
        :title="validationResult.message"
        type="error"
        :closable="false"
        show-icon
      />
    </div>

    <div class="status-bar">
      <div class="status-item">
        <span class="label">实名状态：</span>
        <el-tag
          size="small"
          :style="{ backgroundColor: RealNameStatusColorMap[passengerData?.realNameStatus || 0], color: '#fff' }"
        >
          {{ RealNameStatusMap[passengerData?.realNameStatus || 0] }}
        </el-tag>
      </div>
      <div v-if="passengerData?.realNameExpireTime" class="status-item">
        <span class="label">实名过期时间：</span>
        <span :class="{ 'text-danger': isRealNameExpired }">
          {{ formatDate(passengerData.realNameExpireTime) }}
        </span>
        <el-tag v-if="isRealNameExpired" type="danger" size="small" style="margin-left: 8px">
          已过期
        </el-tag>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      class="passenger-edit-form"
    >
      <el-tabs v-model="activeTab" class="edit-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="手机号" prop="phone">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.phone"
                    placeholder="请输入手机号"
                    :disabled="!canEditPhone"
                    @blur="validatePhoneUnique"
                    @input="handlePhoneInput"
                    clearable
                  />
                  <div v-if="phoneValidationStatus !== 'pending'" class="validation-icon">
                    <el-icon v-if="phoneValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="phoneValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
                <div v-if="phoneValidationStatus === 'error'" class="error-message">
                  {{ phoneValidationMessage }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="昵称" prop="nickname">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.nickname"
                    placeholder="请输入昵称"
                    @blur="validateNickname"
                    @input="handleNicknameInput"
                    clearable
                  />
                  <div v-if="nicknameValidationStatus !== 'pending'" class="validation-icon">
                    <el-icon v-if="nicknameValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="nicknameValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="gender">
                <el-select v-model="formData.gender" placeholder="请选择性别" style="width: 100%">
                  <el-option label="男" :value="1" />
                  <el-option label="女" :value="2" />
                  <el-option label="保密" :value="0" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="实名认证" name="realname">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="真实姓名" prop="realName">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.realName"
                    placeholder="请输入真实姓名"
                    :disabled="!canEditRealName"
                    @blur="validateRealName"
                    @input="handleRealNameInput"
                    clearable
                  />
                  <div v-if="realNameValidationStatus !== 'pending'" class="validation-icon">
                    <el-icon v-if="realNameValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="realNameValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
                <div v-if="realNameValidationStatus === 'error'" class="error-message">
                  {{ realNameValidationMessage }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idCard">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.idCard"
                    placeholder="请输入身份证号"
                    :disabled="!canEditRealName"
                    @blur="validateIdCard"
                    @input="handleIdCardInput"
                    clearable
                  />
                  <div v-if="idCardValidationStatus !== 'pending'" class="validation-icon">
                    <el-icon v-if="idCardValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="idCardValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
                <div v-if="idCardValidationStatus === 'error'" class="error-message">
                  {{ idCardValidationMessage }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证正面" prop="idCardFront">
                <el-upload
                  class="idcard-uploader"
                  :action="uploadUrl"
                  :show-file-list="false"
                  :before-upload="beforeUpload"
                  :on-success="handleFrontSuccess"
                  :on-error="handleUploadError"
                  :disabled="!canEditRealName"
                  accept="image/*"
                >
                  <div v-if="formData.idCardFront" class="idcard-preview">
                    <img :src="formData.idCardFront" alt="身份证正面" />
                    <div class="upload-mask">
                      <el-icon><Edit /></el-icon>
                      <span>重新上传</span>
                    </div>
                  </div>
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>上传正面照</span>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证反面" prop="idCardBack">
                <el-upload
                  class="idcard-uploader"
                  :action="uploadUrl"
                  :show-file-list="false"
                  :before-upload="beforeUpload"
                  :on-success="handleBackSuccess"
                  :on-error="handleUploadError"
                  :disabled="!canEditRealName"
                  accept="image/*"
                >
                  <div v-if="formData.idCardBack" class="idcard-preview">
                    <img :src="formData.idCardBack" alt="身份证反面" />
                    <div class="upload-mask">
                      <el-icon><Edit /></el-icon>
                      <span>重新上传</span>
                    </div>
                  </div>
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>上传反面照</span>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="收货地址" name="address">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="省份" prop="province">
                <el-select v-model="formData.province" placeholder="请选择省份" style="width: 100%" @change="handleProvinceChange">
                  <el-option
                    v-for="item in provinceList"
                    :key="item.code"
                    :label="item.name"
                    :value="item.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="城市" prop="city">
                <el-select v-model="formData.city" placeholder="请选择城市" style="width: 100%" @change="handleCityChange">
                  <el-option
                    v-for="item in cityList"
                    :key="item.code"
                    :label="item.name"
                    :value="item.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="区县" prop="district">
                <el-select v-model="formData.district" placeholder="请选择区县" style="width: 100%">
                  <el-option
                    v-for="item in districtList"
                    :key="item.code"
                    :label="item.name"
                    :value="item.code"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="18">
              <el-form-item label="详细地址" prop="address">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.address"
                    placeholder="请输入详细地址"
                    type="textarea"
                    :rows="2"
                    @blur="validateAddress"
                    @input="handleAddressInput"
                    clearable
                  />
                  <div v-if="addressValidationStatus !== 'pending'" class="validation-icon textarea-icon">
                    <el-icon v-if="addressValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="addressValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="邮编" prop="zipCode">
                <div class="form-item-with-status">
                  <el-input
                    v-model="formData.zipCode"
                    placeholder="请输入邮编"
                    @blur="validateZipCode"
                    @input="handleZipCodeInput"
                    clearable
                  />
                  <div v-if="zipCodeValidationStatus !== 'pending'" class="validation-icon">
                    <el-icon v-if="zipCodeValidationStatus === 'success'" class="icon-success">
                      <Check />
                    </el-icon>
                    <el-icon v-else-if="zipCodeValidationStatus === 'error'" class="icon-error">
                      <Close />
                    </el-icon>
                  </div>
                </div>
                <div v-if="zipCodeValidationStatus === 'error'" class="error-message">
                  {{ zipCodeValidationMessage }}
                </div>
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
          保存修改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Check, Close, Plus, Edit } from '@element-plus/icons-vue'
import {
  validateBeforeUpdateApi,
  validatePhoneApi,
  validateIdCardApi,
  updatePassengerWithValidationApi
} from '@/api/passenger'
import {
  RealNameStatus,
  RealNameStatusMap,
  RealNameStatusColorMap
} from '@/enums/passenger'
import { formatDate } from '@/utils/format'
import type { Passenger, ValidationResult } from '@/types/passenger'

interface Props {
  modelValue: boolean
  passengerData: Passenger | null
}

interface AreaItem {
  code: string
  name: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  passengerData: null
})

const emit = defineEmits(['update:modelValue', 'success'])

const formRef = ref<FormInstance>()
const dialogVisible = ref(props.modelValue)
const activeTab = ref('basic')
const submitting = ref(false)
const validating = ref(false)
const validationResult = ref<ValidationResult | null>(null)

const phoneValidationStatus = ref<'pending' | 'success' | 'error'>('pending')
const phoneValidationMessage = ref('')
const phoneValidating = ref(false)

const nicknameValidationStatus = ref<'pending' | 'success' | 'error'>('pending')
const realNameValidationStatus = ref<'pending' | 'success' | 'error'>('pending')
const realNameValidationMessage = ref('')
const idCardValidationStatus = ref<'pending' | 'success' | 'error'>('pending')
const idCardValidationMessage = ref('')
const idCardValidating = ref(false)
const addressValidationStatus = ref<'pending' | 'success' | 'error'>('pending')
const zipCodeValidationStatus = ref<'pending' | 'success' | 'error'>('pending')
const zipCodeValidationMessage = ref('')

const uploadUrl = '/api/upload'

const formData = ref({
  phone: '',
  nickname: '',
  gender: 0,
  realName: '',
  idCard: '',
  idCardFront: '',
  idCardBack: '',
  province: '',
  city: '',
  district: '',
  address: '',
  zipCode: ''
})

const provinceList = ref<AreaItem[]>([
  { code: '110000', name: '北京市' },
  { code: '310000', name: '上海市' },
  { code: '440000', name: '广东省' },
  { code: '330000', name: '浙江省' },
  { code: '320000', name: '江苏省' }
])

const cityList = ref<AreaItem[]>([])
const districtList = ref<AreaItem[]>([])

const cityData: Record<string, AreaItem[]> = {
  '110000': [{ code: '110100', name: '北京市' }],
  '310000': [{ code: '310100', name: '上海市' }],
  '440000': [
    { code: '440100', name: '广州市' },
    { code: '440300', name: '深圳市' },
    { code: '440600', name: '佛山市' }
  ],
  '330000': [
    { code: '330100', name: '杭州市' },
    { code: '330200', name: '宁波市' }
  ],
  '320000': [
    { code: '320100', name: '南京市' },
    { code: '320500', name: '苏州市' }
  ]
}

const districtData: Record<string, AreaItem[]> = {
  '110100': [
    { code: '110101', name: '东城区' },
    { code: '110102', name: '西城区' },
    { code: '110105', name: '朝阳区' },
    { code: '110106', name: '丰台区' },
    { code: '110108', name: '海淀区' }
  ],
  '310100': [
    { code: '310101', name: '黄浦区' },
    { code: '310104', name: '徐汇区' },
    { code: '310105', name: '长宁区' },
    { code: '310106', name: '静安区' },
    { code: '310109', name: '虹口区' },
    { code: '310110', name: '杨浦区' },
    { code: '310112', name: '闵行区' },
    { code: '310115', name: '浦东新区' }
  ],
  '440100': [
    { code: '440103', name: '荔湾区' },
    { code: '440104', name: '越秀区' },
    { code: '440105', name: '海珠区' },
    { code: '440106', name: '天河区' }
  ],
  '440300': [
    { code: '440303', name: '罗湖区' },
    { code: '440304', name: '福田区' },
    { code: '440305', name: '南山区' },
    { code: '440306', name: '宝安区' }
  ],
  '440600': [
    { code: '440604', name: '禅城区' },
    { code: '440605', name: '南海区' },
    { code: '440606', name: '顺德区' }
  ],
  '330100': [
    { code: '330102', name: '上城区' },
    { code: '330103', name: '下城区' },
    { code: '330104', name: '江干区' },
    { code: '330105', name: '拱墅区' },
    { code: '330106', name: '西湖区' }
  ],
  '330200': [
    { code: '330203', name: '海曙区' },
    { code: '330205', name: '江北区' },
    { code: '330206', name: '北仑区' }
  ],
  '320100': [
    { code: '320102', name: '玄武区' },
    { code: '320104', name: '秦淮区' },
    { code: '320105', name: '建邺区' },
    { code: '320106', name: '鼓楼区' }
  ],
  '320500': [
    { code: '320505', name: '虎丘区' },
    { code: '320506', name: '吴中区' },
    { code: '320507', name: '相城区' },
    { code: '320508', name: '姑苏区' }
  ]
}

const formRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在2到20个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { pattern: /^[\u4e00-\u9fa5]{2,10}$/, message: '请输入正确的中文姓名', trigger: 'blur' }
  ],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请选择省份', trigger: 'change' }
  ],
  city: [
    { required: true, message: '请选择城市', trigger: 'change' }
  ],
  district: [
    { required: true, message: '请选择区县', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 200, message: '详细地址长度在5到200个字符', trigger: 'blur' }
  ],
  zipCode: [
    { pattern: /^\d{6}$/, message: '请输入6位邮编', trigger: 'blur' }
  ]
}

const isVerified = computed(() => {
  return props.passengerData?.realNameStatus === RealNameStatus.VERIFIED
})

const isRealNameExpired = computed(() => {
  if (!props.passengerData?.realNameExpireTime) return false
  return new Date(props.passengerData.realNameExpireTime) < new Date()
})

const canEditPhone = computed(() => {
  return isVerified.value && !isRealNameExpired.value && validationResult.value?.canEdit?.phone !== false
})

const canEditRealName = computed(() => {
  return isVerified.value && !isRealNameExpired.value && validationResult.value?.canEdit?.realName !== false
})

const canSubmit = computed(() => {
  if (!validationResult.value?.valid) return false
  if (phoneValidationStatus.value === 'error') return false
  if (idCardValidationStatus.value === 'error') return false
  if (realNameValidationStatus.value === 'error') return false
  return true
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    initFormData()
    handleDialogOpen()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const initFormData = () => {
  if (!props.passengerData) return
  formData.value = {
    phone: props.passengerData.phone || '',
    nickname: props.passengerData.nickname || '',
    gender: props.passengerData.gender || 0,
    realName: props.passengerData.realName || '',
    idCard: props.passengerData.idCard || '',
    idCardFront: props.passengerData.idCardFront || '',
    idCardBack: props.passengerData.idCardBack || '',
    province: props.passengerData.province || '',
    city: props.passengerData.city || '',
    district: props.passengerData.district || '',
    address: props.passengerData.address || '',
    zipCode: props.passengerData.zipCode || ''
  }
  resetValidationStatus()
  if (formData.value.province) {
    cityList.value = cityData[formData.value.province] || []
  }
  if (formData.value.city) {
    districtList.value = districtData[formData.value.city] || []
  }
}

const resetValidationStatus = () => {
  phoneValidationStatus.value = 'pending'
  phoneValidationMessage.value = ''
  nicknameValidationStatus.value = 'pending'
  realNameValidationStatus.value = 'pending'
  realNameValidationMessage.value = ''
  idCardValidationStatus.value = 'pending'
  idCardValidationMessage.value = ''
  addressValidationStatus.value = 'pending'
  zipCodeValidationStatus.value = 'pending'
  zipCodeValidationMessage.value = ''
  validationResult.value = null
}

const handleDialogOpen = async () => {
  if (!props.passengerData) return
  validating.value = true
  try {
    const res = await validateBeforeUpdateApi(props.passengerData.id, 'phone,realName,idCard')
    validationResult.value = res.data
    if (!res.data.valid) {
      ElMessage.warning(res.data.message)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '校验失败')
    validationResult.value = {
      valid: false,
      message: error.message || '校验失败'
    }
  } finally {
    validating.value = false
  }
}

const handlePhoneInput = () => {
  phoneValidationStatus.value = 'pending'
  phoneValidationMessage.value = ''
}

const handleNicknameInput = () => {
  nicknameValidationStatus.value = 'pending'
}

const handleRealNameInput = () => {
  realNameValidationStatus.value = 'pending'
  realNameValidationMessage.value = ''
  if (formData.value.idCard && formData.value.realName) {
    idCardValidationStatus.value = 'pending'
  }
}

const handleIdCardInput = () => {
  idCardValidationStatus.value = 'pending'
  idCardValidationMessage.value = ''
}

const handleAddressInput = () => {
  addressValidationStatus.value = 'pending'
}

const handleZipCodeInput = () => {
  zipCodeValidationStatus.value = 'pending'
  zipCodeValidationMessage.value = ''
}

const validatePhoneUnique = async () => {
  if (!formData.value.phone || !canEditPhone.value) return
  if (!/^1[3-9]\d{9}$/.test(formData.value.phone)) {
    phoneValidationStatus.value = 'error'
    phoneValidationMessage.value = '请输入正确的手机号'
    return
  }
  phoneValidating.value = true
  try {
    const res = await validatePhoneApi(formData.value.phone, props.passengerData?.id)
    if (res.data.valid) {
      phoneValidationStatus.value = 'success'
      phoneValidationMessage.value = ''
    } else {
      phoneValidationStatus.value = 'error'
      phoneValidationMessage.value = res.data.message || '该手机号已被使用'
    }
  } catch (error: any) {
    phoneValidationStatus.value = 'error'
    phoneValidationMessage.value = error.message || '手机号校验失败'
  } finally {
    phoneValidating.value = false
  }
}

const validateNickname = () => {
  if (!formData.value.nickname) {
    nicknameValidationStatus.value = 'error'
    return
  }
  if (formData.value.nickname.length < 2 || formData.value.nickname.length > 20) {
    nicknameValidationStatus.value = 'error'
    return
  }
  nicknameValidationStatus.value = 'success'
}

const validateRealName = () => {
  if (!canEditRealName.value) return
  if (!formData.value.realName) {
    realNameValidationStatus.value = 'error'
    realNameValidationMessage.value = '请输入真实姓名'
    return
  }
  if (!/^[\u4e00-\u9fa5]{2,10}$/.test(formData.value.realName)) {
    realNameValidationStatus.value = 'error'
    realNameValidationMessage.value = '请输入正确的中文姓名'
    return
  }
  realNameValidationStatus.value = 'success'
  if (formData.value.idCard) {
    validateIdCard()
  }
}

const validateIdCard = async () => {
  if (!canEditRealName.value) return
  if (!formData.value.idCard) {
    idCardValidationStatus.value = 'error'
    idCardValidationMessage.value = '请输入身份证号'
    return
  }
  if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(formData.value.idCard)) {
    idCardValidationStatus.value = 'error'
    idCardValidationMessage.value = '请输入正确的身份证号'
    return
  }
  if (!formData.value.realName) {
    idCardValidationStatus.value = 'error'
    idCardValidationMessage.value = '请先输入真实姓名'
    return
  }
  idCardValidating.value = true
  try {
    const res = await validateIdCardApi({
      idCard: formData.value.idCard,
      realName: formData.value.realName,
      passengerId: props.passengerData?.id
    })
    if (res.data.valid) {
      idCardValidationStatus.value = 'success'
      idCardValidationMessage.value = ''
    } else {
      idCardValidationStatus.value = 'error'
      idCardValidationMessage.value = res.data.message || '身份证校验失败'
    }
  } catch (error: any) {
    idCardValidationStatus.value = 'error'
    idCardValidationMessage.value = error.message || '身份证校验失败'
  } finally {
    idCardValidating.value = false
  }
}

const validateAddress = () => {
  if (!formData.value.address) {
    addressValidationStatus.value = 'error'
    return
  }
  if (formData.value.address.length < 5 || formData.value.address.length > 200) {
    addressValidationStatus.value = 'error'
    return
  }
  addressValidationStatus.value = 'success'
}

const validateZipCode = () => {
  if (!formData.value.zipCode) {
    zipCodeValidationStatus.value = 'pending'
    return
  }
  if (!/^\d{6}$/.test(formData.value.zipCode)) {
    zipCodeValidationStatus.value = 'error'
    zipCodeValidationMessage.value = '请输入6位邮编'
    return
  }
  zipCodeValidationStatus.value = 'success'
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('请上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleFrontSuccess = (response: any) => {
  formData.value.idCardFront = response.data.url
  ElMessage.success('身份证正面上传成功')
}

const handleBackSuccess = (response: any) => {
  formData.value.idCardBack = response.data.url
  ElMessage.success('身份证反面上传成功')
}

const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

const handleProvinceChange = (val: string) => {
  formData.value.city = ''
  formData.value.district = ''
  cityList.value = cityData[val] || []
  districtList.value = []
}

const handleCityChange = (val: string) => {
  formData.value.district = ''
  districtList.value = districtData[val] || []
}

const handleClose = () => {
  if (submitting.value) return
  dialogVisible.value = false
  formRef.value?.resetFields()
  resetValidationStatus()
}

const handleSubmit = async () => {
  if (!formRef.value || !props.passengerData) return
  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请完善表单信息')
    return
  }
  if (phoneValidationStatus.value !== 'success' && canEditPhone.value) {
    ElMessage.warning('请校验手机号唯一性')
    return
  }
  if (idCardValidationStatus.value !== 'success' && canEditRealName.value) {
    ElMessage.warning('请校验身份证信息')
    return
  }
  if (realNameValidationStatus.value !== 'success' && canEditRealName.value) {
    ElMessage.warning('请校验真实姓名')
    return
  }
  submitting.value = true
  try {
    const updateData: Partial<Passenger> = { ...formData.value }
    if (!canEditPhone.value) {
      delete updateData.phone
    }
    if (!canEditRealName.value) {
      delete updateData.realName
      delete updateData.idCard
      delete updateData.idCardFront
      delete updateData.idCardBack
    }
    const res = await updatePassengerWithValidationApi(props.passengerData.id, updateData)
    ElMessage.success('修改成功')
    emit('success', res.data)
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.message || '修改失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.passenger-edit-dialog {
  .realname-warning {
    margin-bottom: 16px;
  }

  .validation-warning {
    margin-bottom: 16px;
  }

  .status-bar {
    display: flex;
    gap: 24px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 20px;

    .status-item {
      display: flex;
      align-items: center;
      font-size: 14px;

      .label {
        color: #909399;
        margin-right: 8px;
      }

      .text-danger {
        color: #f56c6c;
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

      &.textarea-icon {
        top: 16px;
        transform: none;
      }

      .icon-success {
        color: #67c23a;
        font-size: 18px;
      }

      .icon-error {
        color: #f56c6c;
        font-size: 18px;
      }
    }

    :deep(.el-input__wrapper) {
      padding-right: 36px;
    }

    :deep(.el-textarea__inner) {
      padding-right: 36px;
    }
  }

  .error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 4px;
    line-height: 1.2;
  }

  .idcard-uploader {
    width: 100%;

    .idcard-preview {
      position: relative;
      width: 100%;
      height: 120px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px dashed #dcdfe6;
      cursor: pointer;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .upload-mask {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        opacity: 0;
        transition: opacity 0.3s;

        el-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        span {
          font-size: 12px;
        }
      }

      &:hover .upload-mask {
        opacity: 1;
      }
    }

    .upload-placeholder {
      width: 100%;
      height: 120px;
      border: 1px dashed #dcdfe6;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      cursor: pointer;
      transition: all 0.3s;

      el-icon {
        font-size: 28px;
        margin-bottom: 8px;
      }

      span {
        font-size: 12px;
      }

      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
    }

    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload.is-disabled) {
      .upload-placeholder,
      .idcard-preview {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.text-danger {
  color: #f56c6c;
}
</style>
