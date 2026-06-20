<template>
  <el-dialog
    v-model="visible"
    :title="formTitle"
    width="900px"
    :close-on-click-modal="false"
    :before-close="handleBeforeClose"
    class="store-detail-dialog"
    append-to-body
  >
    <div v-if="loading" style="padding: 40px; text-align: center;">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <p style="margin-top: 10px; color: #909399;">加载中...</p>
    </div>

    <el-form
      v-else
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      class="edit-dialog-form focus-glow"
      @submit.prevent
    >
      <div class="verify-warnings" v-if="verifyWarnings.length > 0">
        <el-alert
          v-for="(w, i) in verifyWarnings"
          :key="i"
          :type="w.type"
          :title="w.msg"
          show-icon
          :closable="false"
        />
      </div>

      <div class="form-section">
        <div class="section-title">基础信息</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="酒店名称" prop="name" :class="{'shake-error': shakeMap.name}">
              <el-input
                v-model="formData.name"
                placeholder="请输入酒店名称"
                maxlength="100"
                show-word-limit
                @blur="validateField('name')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="酒店类型" prop="hotelType">
              <el-select v-model="formData.hotelType" placeholder="请选择酒店类型">
                <el-option
                  v-for="item in Object.values(HotelTypeEnum)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="国家" prop="country" :class="{'shake-error': shakeMap.country}">
              <el-input
                v-model="formData.country"
                placeholder="请输入国家"
                @blur="validateField('country')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" prop="city" :class="{'shake-error': shakeMap.city}">
              <el-input
                v-model="formData.city"
                placeholder="请输入城市"
                @blur="validateField('city')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="星级" prop="star">
              <el-select v-model="formData.star" placeholder="请选择星级">
                <el-option label="一星级" :value="1" />
                <el-option label="二星级" :value="2" />
                <el-option label="三星级" :value="3" />
                <el-option label="四星级" :value="4" />
                <el-option label="五星级" :value="5" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="详细地址" prop="address" :class="{'shake-error': shakeMap.address}">
              <el-input
                v-model="formData.address"
                placeholder="请输入详细地址"
                maxlength="255"
                @blur="validateAddress"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="评级类型" prop="starLevel">
              <el-select v-model="formData.starLevel" placeholder="请选择评级类型">
                <el-option
                  v-for="item in Object.values(HotelStarLevelEnum)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="联系电话" prop="phone" :class="{'shake-error': shakeMap.phone}">
              <el-input
                v-model="formData.phone"
                placeholder="请输入联系电话"
                maxlength="30"
                @blur="validateField('phone')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入联系邮箱" maxlength="100" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="经营状态" prop="businessStatus">
              <el-select v-model="formData.businessStatus" placeholder="请选择经营状态">
                <el-option
                  v-for="item in Object.values(HotelBusinessStatusEnum)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="起步价格" prop="price">
              <el-input-number
                v-model="formData.price"
                :min="0"
                :precision="2"
                :step="10"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总房间数" prop="rooms">
              <el-input-number
                v-model="formData.rooms"
                :min="0"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="可用房间数" prop="availableRooms">
              <el-input-number
                v-model="formData.availableRooms"
                :min="0"
                :step="1"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="客房适配" prop="roomTypeRange">
          <el-select
            v-model="roomTypeList"
            multiple
            filterable
            allow-create
            placeholder="选择或输入客房类型（可多选）"
            style="width: 100%"
            @change="onRoomTypeChange"
          >
            <el-option label="标准间" value="标准间" />
            <el-option label="大床房" value="大床房" />
            <el-option label="双床房" value="双床房" />
            <el-option label="商务房" value="商务房" />
            <el-option label="套房" value="套房" />
            <el-option label="总统套房" value="总统套房" />
            <el-option label="家庭房" value="家庭房" />
            <el-option label="行政房" value="行政房" />
          </el-select>
        </el-form-item>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="入住时间" prop="checkInTime">
              <el-time-select
                v-model="formData.checkInTime"
                placeholder="选择入住时间"
                start="06:00"
                step="00:30"
                end="23:30"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="退房时间" prop="checkOutTime">
              <el-time-select
                v-model="formData.checkOutTime"
                placeholder="选择退房时间"
                start="06:00"
                step="00:30"
                end="23:30"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="酒店描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入酒店描述"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </div>

      <div class="form-section">
        <div class="section-title">经营资质</div>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="营业执照号" prop="businessLicenseNo" :class="{'shake-error': shakeMap.businessLicenseNo}">
              <el-input
                v-model="formData.businessLicenseNo"
                placeholder="请输入营业执照编号"
                @blur="validateField('businessLicenseNo')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="businessLicenseExpire" :class="{'shake-error': shakeMap.businessLicenseExpire}">
              <el-date-picker
                v-model="formData.businessLicenseExpire"
                type="date"
                placeholder="选择有效期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="validateLicense"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="特种许可证" prop="specialLicenseNo">
              <el-input
                v-model="formData.specialLicenseNo"
                placeholder="请输入特种行业许可证编号"
                @blur="validateField('specialLicenseNo')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="specialLicenseExpire">
              <el-date-picker
                v-model="formData.specialLicenseExpire"
                type="date"
                placeholder="选择有效期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="validateLicense"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="卫生许可证" prop="hygieneLicenseNo">
              <el-input
                v-model="formData.hygieneLicenseNo"
                placeholder="请输入卫生许可证编号"
                @blur="validateField('hygieneLicenseNo')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="hygieneLicenseExpire">
              <el-date-picker
                v-model="formData.hygieneLicenseExpire"
                type="date"
                placeholder="选择有效期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="validateLicense"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="消防合格证" prop="fireSafetyLicenseNo">
              <el-input
                v-model="formData.fireSafetyLicenseNo"
                placeholder="请输入消防安全检查合格证编号"
                @blur="validateField('fireSafetyLicenseNo')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="fireSafetyLicenseExpire">
              <el-date-picker
                v-model="formData.fireSafetyLicenseExpire"
                type="date"
                placeholder="选择有效期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="validateLicense"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-if="formData.hotelType === 'overseas'">
          <el-col :span="12">
            <el-form-item label="跨境许可证" prop="crossBorderLicense">
              <el-input
                v-model="formData.crossBorderLicense"
                placeholder="请输入跨境经营许可证编号"
                @blur="validateField('crossBorderLicense')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期至" prop="crossBorderLicenseExpire">
              <el-date-picker
                v-model="formData.crossBorderLicenseExpire"
                type="date"
                placeholder="选择有效期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="validateLicense"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div class="form-section" v-if="isEdit">
        <div class="section-title">操作原因</div>
        <el-form-item label="变更原因" prop="statusReason">
          <el-input
            v-model="formData.statusReason"
            type="textarea"
            :rows="2"
            placeholder="请输入本次变更的原因（可选）"
            maxlength="500"
          />
        </el-form-item>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
        v-ripple
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import vRipple from '@/utils/ripple'
import {
  HotelTypeEnum,
  HotelStarLevelEnum,
  HotelBusinessStatusEnum
} from '@/utils/enums'
import { createHotel, updateHotel, getHotel } from '@/api/hotel'

const props = defineProps({
  modelValue: Boolean,
  hotelId: {
    type: [Number, String],
    default: null
  },
  defaultType: {
    type: String,
    default: 'domestic'
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const verifyWarnings = ref([])
const shakeMap = reactive({})
const roomTypeList = ref([])

const isEdit = computed(() => !!props.hotelId)
const formTitle = computed(() => (isEdit.value ? '编辑门店信息' : '新增酒店门店'))

const getDefaultForm = () => ({
  name: '',
  hotelType: props.defaultType || 'domestic',
  country: '中国',
  city: '',
  address: '',
  longitude: null,
  latitude: null,
  star: null,
  starLevel: '',
  phone: '',
  email: '',
  businessStatus: 'operating',
  status: 1,
  price: 0,
  rooms: 0,
  availableRooms: 0,
  roomTypeRange: '',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  description: '',
  businessLicenseNo: '',
  businessLicenseExpire: '',
  specialLicenseNo: '',
  specialLicenseExpire: '',
  hygieneLicenseNo: '',
  hygieneLicenseExpire: '',
  fireSafetyLicenseNo: '',
  fireSafetyLicenseExpire: '',
  crossBorderLicense: '',
  crossBorderLicenseExpire: '',
  statusReason: ''
})

const formData = reactive(getDefaultForm())

const formRules = {
  name: [
    { required: true, message: '请输入酒店名称', trigger: 'blur' },
    { min: 2, max: 100, message: '名称长度2-100字符', trigger: 'blur' }
  ],
  hotelType: [
    { required: true, message: '请选择酒店类型', trigger: 'change' }
  ],
  country: [
    { required: true, message: '请输入国家', trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请输入城市', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, message: '详细地址不能少于5个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { min: 6, message: '电话长度不能少于6位', trigger: 'blur' }
  ],
  businessLicenseNo: [
    { required: true, message: '请输入营业执照编号', trigger: 'blur' }
  ],
  businessLicenseExpire: [
    { required: true, message: '请选择营业执照有效期', trigger: 'change' }
  ],
  specialLicenseNo: [
    { required: true, message: '请输入特种行业许可证编号', trigger: 'blur' }
  ],
  specialLicenseExpire: [
    { required: true, message: '请选择特种行业许可证有效期', trigger: 'change' }
  ],
  hygieneLicenseNo: [
    { required: true, message: '请输入卫生许可证编号', trigger: 'blur' }
  ],
  hygieneLicenseExpire: [
    { required: true, message: '请选择卫生许可证有效期', trigger: 'change' }
  ],
  fireSafetyLicenseNo: [
    { required: true, message: '请输入消防合格证编号', trigger: 'blur' }
  ],
  fireSafetyLicenseExpire: [
    { required: true, message: '请选择消防合格证有效期', trigger: 'change' }
  ]
}

const triggerShake = (field) => {
  shakeMap[field] = true
  setTimeout(() => {
    shakeMap[field] = false
  }, 500)
}

const validateField = async (field) => {
  try {
    await formRef.value?.validateField(field)
    runVerify()
  } catch {
    triggerShake(field)
  }
}

const validateAddress = async () => {
  await validateField('address')
  await validateField('city')
  await validateField('country')
}

const validateLicense = () => {
  runVerify()
}

const onRoomTypeChange = (val) => {
  formData.roomTypeRange = val.join(',')
}

const checkExpiringDate = (dateStr, label) => {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return { type: 'error', msg: `${label}已过期（过期${-diffDays}天）` }
  } else if (diffDays < 30) {
    return { type: 'warning', msg: `${label}将在${diffDays}天后过期，请及时续期` }
  }
  return null
}

const runVerify = () => {
  const warnings = []

  if (formData.star && (formData.star === 4 || formData.star === 5) && formData.starLevel === 'user') {
    warnings.push({ type: 'warning', msg: '四星级及以上酒店建议提供国家评定或连锁品牌评级证明' })
  }

  if (formData.rooms <= 0 && formData.hotelType !== 'apartment') {
    // 这是错误，会在表单校验提示
  }

  if (formData.description && formData.description.length < 20) {
    warnings.push({ type: 'warning', msg: '酒店描述较为简短，建议补充完整信息' })
  }

  const checkList = [
    { date: formData.businessLicenseExpire, label: '营业执照' },
    { date: formData.specialLicenseExpire, label: '特种行业许可证' },
    { date: formData.hygieneLicenseExpire, label: '卫生许可证' },
    { date: formData.fireSafetyLicenseExpire, label: '消防合格证' }
  ]
  if (formData.hotelType === 'overseas') {
    checkList.push({ date: formData.crossBorderLicenseExpire, label: '跨境经营许可证' })
  }

  checkList.forEach(item => {
    const res = checkExpiringDate(item.date, item.label)
    if (res) warnings.push(res)
  })

  verifyWarnings.value = warnings
}

const resetForm = () => {
  Object.assign(formData, getDefaultForm())
  roomTypeList.value = []
  verifyWarnings.value = []
  formRef.value?.clearValidate()
}

const loadData = async () => {
  if (!isEdit.value) {
    resetForm()
    formData.hotelType = props.defaultType || 'domestic'
    return
  }

  loading.value = true
  try {
    const res = await getHotel(props.hotelId)
    const data = res.data || {}
    Object.assign(formData, getDefaultForm(), data)
    roomTypeList.value = data.roomTypeRange ? data.roomTypeRange.split(',') : []
    runVerify()
  } catch (e) {
    ElMessage.error('加载门店详情失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      nextTick(() => {
        loadData()
      })
    }
  }
)

const handleBeforeClose = (done) => {
  if (submitting.value) return
  const hasChanges = Object.keys(formData).some(k => {
    const def = getDefaultForm()[k]
    return formData[k] !== def
  })
  if (hasChanges) {
    ElMessageBox.confirm('表单内容尚未保存，确认关闭？', '提示', {
      type: 'warning',
      confirmButtonText: '确定关闭',
      cancelButtonText: '继续编辑'
    })
      .then(() => {
        resetForm()
        done()
      })
      .catch(() => {})
  } else {
    resetForm()
    done()
  }
}

const handleCancel = () => {
  visible.value = false
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    const firstField = e?.[0]?.field
    if (firstField) triggerShake(firstField)
    ElMessage.warning('请检查表单填写内容')
    return
  }

  runVerify()
  const blockErrors = verifyWarnings.value.filter(w => w.type === 'error')
  if (blockErrors.length > 0) {
    ElMessage.error(`保存被拦截：${blockErrors.map(b => b.msg).join('；')}`)
    return
  }

  submitting.value = true
  try {
    const payload = { ...formData }
    let res
    if (isEdit.value) {
      res = await updateHotel(props.hotelId, payload)
      ElMessage.success('更新成功')
    } else {
      res = await createHotel(payload)
      ElMessage.success('创建成功')
    }
    emit('success', res.data)
    visible.value = false
  } catch (e) {
    // 错误提示由拦截器处理
  } finally {
    submitting.value = false
  }
}
</script>
