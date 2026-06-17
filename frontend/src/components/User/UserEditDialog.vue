<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑用户' : '新增用户'"
    width="680px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="user-edit-dialog">
      <div :class="['level-section', `level-${getLevelClass(formData.userLevel)}`]">
        <div class="level-title">
          <el-icon :size="20" :color="getLevelColor(formData.userLevel)">
            <User v-if="formData.userLevel === 1" />
            <ShoppingCart v-else-if="formData.userLevel === 2" />
            <Star v-else />
          </el-icon>
          <span>{{ getLevelLabel(formData.userLevel) }}专属编辑区</span>
        </div>
        <div v-if="formData.userLevel === 2" style="font-size: 13px; color: #606266;">
          商旅用户可享受：95折优惠、免费接送、优先客服支持等权益
        </div>
        <div v-if="formData.userLevel === 3" style="font-size: 13px; color: #606266;">
          VIP用户可享受：88折优惠、VIP休息室、专属客户经理、双倍积分等权益
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        @validate="handleValidate"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="formData.username"
                :disabled="isEdit"
                placeholder="请输入用户名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input v-model="formData.nickname" placeholder="请输入昵称" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户等级" prop="userLevel">
              <el-select v-model="formData.userLevel" placeholder="请选择用户等级" style="width: 100%;">
                <el-option
                  v-for="item in userLevelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="手机号"
              prop="phone"
              :class="['core-field', { 'is-focusing': focusField === 'phone', 'field-error': fieldErrors.phone }]"
            >
              <el-input
                v-model="formData.phone"
                placeholder="请输入手机号"
                @focus="focusField = 'phone'"
                @blur="handleFieldBlur('phone')"
                @input="handlePhoneChange"
              />
              <div v-if="fieldErrors.phone" class="error-tip">{{ fieldErrors.phone }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="身份证号"
              prop="idCard"
              :class="['core-field', { 'is-focusing': focusField === 'idCard', 'field-error': fieldErrors.idCard }]"
            >
              <el-input
                v-model="formData.idCard"
                placeholder="请输入身份证号"
                @focus="focusField = 'idCard'"
                @blur="handleFieldBlur('idCard')"
                @input="handleIdCardChange"
              />
              <div v-if="fieldErrors.idCard" class="error-tip">{{ fieldErrors.idCard }}</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册渠道" prop="registerChannel">
              <el-select v-model="formData.registerChannel" placeholder="请选择注册渠道" style="width: 100%;">
                <el-option
                  v-for="item in registerChannelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="0">禁用</el-radio>
                <el-radio :value="2">冻结</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="roleId">
              <el-select v-model="formData.roleId" placeholder="请选择角色" style="width: 100%;">
                <el-option
                  v-for="role in roleOptions"
                  :key="role.id"
                  :label="role.name"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item v-if="formData.status === 2" label="冻结原因" prop="freezeReason">
          <el-input
            v-model="formData.freezeReason"
            type="textarea"
            :rows="2"
            placeholder="请输入冻结原因"
          />
        </el-form-item>

        <el-form-item label="用户标签">
          <el-select
            v-model="formData.tags"
            multiple
            filterable
            placeholder="请选择用户标签"
            style="width: 100%;"
          >
            <el-option
              v-for="tag in userTagOptions"
              :key="tag.value"
              :label="tag.label"
              :value="tag.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Star, ShoppingCart } from '@element-plus/icons-vue'
import {
  UserLevelEnum,
  RegisterChannelEnum,
  UserTagOptions,
  getEnumOptions,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { validatePhone, validateIdCard, validateEmail } from '@/utils/validate'
import { createUser, updateUser, validateUniqueness } from '@/api/user'

const props = defineProps({
  modelValue: Boolean,
  userData: {
    type: Object,
    default: null
  },
  roleOptions: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.userData?.id)
const formRef = ref(null)
const submitting = ref(false)
const focusField = ref('')
const fieldErrors = reactive({
  phone: '',
  idCard: ''
})

const userLevelOptions = getEnumOptions(UserLevelEnum)
const registerChannelOptions = getEnumOptions(RegisterChannelEnum)
const userTagOptions = UserTagOptions

const defaultFormData = () => ({
  username: '',
  nickname: '',
  realName: '',
  phone: '',
  idCard: '',
  email: '',
  userLevel: 1,
  registerChannel: 'web',
  status: 1,
  roleId: null,
  freezeReason: '',
  tags: []
})

const formData = reactive(defaultFormData())

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  userLevel: [{ required: true, message: '请选择用户等级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

const getLevelClass = (level) => {
  const map = { 1: 'normal', 2: 'business', 3: 'vip' }
  return map[level] || 'normal'
}

const getLevelLabel = (level) => getEnumLabel(UserLevelEnum, level)
const getLevelColor = (level) => getEnumColor(UserLevelEnum, level)

const handlePhoneChange = async () => {
  fieldErrors.phone = ''
  if (!formData.phone) return
  if (!validatePhone(formData.phone)) {
    fieldErrors.phone = '手机号格式不正确'
    return
  }
  try {
    const res = await validateUniqueness({
      field: 'phone',
      value: formData.phone,
      excludeId: isEdit.value ? props.userData.id : null
    })
    if (!res.data?.isUnique) {
      fieldErrors.phone = res.data?.message || '手机号已被使用'
    }
  } catch (e) {}
}

const handleIdCardChange = async () => {
  fieldErrors.idCard = ''
  if (!formData.idCard) return
  if (!validateIdCard(formData.idCard)) {
    fieldErrors.idCard = '身份证号格式不正确'
    return
  }
  try {
    const res = await validateUniqueness({
      field: 'idCard',
      value: formData.idCard,
      excludeId: isEdit.value ? props.userData.id : null
    })
    if (!res.data?.isUnique) {
      fieldErrors.idCard = res.data?.message || '身份证号已被使用'
    }
  } catch (e) {}
}

const handleFieldBlur = (field) => {
  if (focusField.value === field) {
    focusField.value = ''
  }
}

const handleValidate = () => {}

const initFormData = () => {
  Object.assign(formData, defaultFormData())
  fieldErrors.phone = ''
  fieldErrors.idCard = ''
  if (props.userData) {
    Object.assign(formData, props.userData)
    try {
      if (props.userData.tags) {
        formData.tags = typeof props.userData.tags === 'string'
          ? JSON.parse(props.userData.tags)
          : props.userData.tags
      }
    } catch (e) {
      formData.tags = []
    }
  }
}

const handleSubmit = async () => {
  if (fieldErrors.phone || fieldErrors.idCard) {
    ElMessage.error('请修正表单中的错误')
    return
  }
  if (formData.email && !validateEmail(formData.email)) {
    ElMessage.error('邮箱格式不正确')
    return
  }
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    const data = { ...formData }
    if (isEdit.value) {
      await updateUser(props.userData.id, data)
      ElMessage.success('更新成功')
    } else {
      await createUser(data)
      ElMessage.success('创建成功')
    }
    emit('success')
    visible.value = false
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  formRef.value?.resetFields()
  initFormData()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    initFormData()
  }
})
</script>
