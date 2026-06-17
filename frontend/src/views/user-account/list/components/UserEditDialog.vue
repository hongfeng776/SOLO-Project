<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑用户信息"
    width="640px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="loading" class="skeleton-loading">
      <el-skeleton :rows="6" animated />
    </div>
    <el-form
      v-else
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="用户头像">
            <div class="avatar-uploader">
              <el-avatar
                v-if="formData.avatar"
                :size="80"
                :src="formData.avatar"
              />
              <el-avatar v-else :size="80">{{ formData.nickname?.charAt(0) }}</el-avatar>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="昵称" prop="nickname">
            <div class="form-item-with-validate">
              <el-input
                v-model="formData.nickname"
                placeholder="请输入昵称"
                @blur="validateNickname"
                @input="handleNicknameInput"
              >
                <template #append>
                  <el-icon
                    v-if="nicknameValidation.validating"
                    class="valid-icon"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-else-if="nicknameValidation.valid"
                    class="valid-icon success"
                  >
                    <CircleCheckFilled />
                  </el-icon>
                  <el-icon
                    v-else-if="nicknameValidation.message"
                    class="valid-icon error"
                  >
                    <CircleCloseFilled />
                  </el-icon>
                </template>
              </el-input>
              <div v-if="nicknameValidation.message" class="error-message">
                {{ nicknameValidation.message }}
                <div v-if="nicknameValidation.suggestions?.length" class="suggestions">
                  <span class="label">推荐昵称：</span>
                  <el-tag
                    v-for="(s, i) in nicknameValidation.suggestions"
                    :key="i"
                    size="small"
                    effect="plain"
                    class="suggestion-tag"
                    @click="applySuggestion(s)"
                  >
                    {{ s }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="头像URL" prop="avatar">
            <div class="form-item-with-validate">
              <el-input
                v-model="formData.avatar"
                placeholder="请输入头像URL"
                @blur="validateAvatar"
                @input="handleAvatarInput"
              >
                <template #append>
                  <el-icon
                    v-if="avatarValidation.validating"
                    class="valid-icon"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-else-if="avatarValidation.valid"
                    class="valid-icon success"
                  >
                    <CircleCheckFilled />
                  </el-icon>
                  <el-icon
                    v-else-if="avatarValidation.message"
                    class="valid-icon error"
                  >
                    <CircleCloseFilled />
                  </el-icon>
                </template>
              </el-input>
              <div v-if="avatarValidation.message" class="error-message">
                {{ avatarValidation.message }}
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="手机号" prop="phone">
            <div class="form-item-with-validate">
              <el-input
                v-model="formData.phone"
                placeholder="请输入手机号"
                @blur="validatePhone"
                @input="handlePhoneInput"
                maxlength="11"
              >
                <template #append>
                  <el-icon
                    v-if="phoneValidation.validating"
                    class="valid-icon"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-else-if="phoneValidation.valid"
                    class="valid-icon success"
                  >
                    <CircleCheckFilled />
                  </el-icon>
                  <el-icon
                    v-else-if="phoneValidation.message"
                    class="valid-icon error"
                  >
                    <CircleCloseFilled />
                  </el-icon>
                </template>
              </el-input>
              <div v-if="phoneValidation.message" class="error-message">
                {{ phoneValidation.message }}
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <div class="form-item-with-validate">
              <el-input
                v-model="formData.email"
                placeholder="请输入邮箱"
                @blur="validateEmail"
                @input="handleEmailInput"
              >
                <template #append>
                  <el-icon
                    v-if="emailValidation.validating"
                    class="valid-icon"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-else-if="emailValidation.valid"
                    class="valid-icon success"
                  >
                    <CircleCheckFilled />
                  </el-icon>
                  <el-icon
                    v-else-if="emailValidation.message"
                    class="valid-icon error"
                  >
                    <CircleCloseFilled />
                  </el-icon>
                </template>
              </el-input>
              <div v-if="emailValidation.message" class="error-message">
                {{ emailValidation.message }}
              </div>
            </div>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="修改原因">
            <el-input
              v-model="formData.reason"
              type="textarea"
              :rows="2"
              placeholder="请输入修改原因（可选）"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        确定修改
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Loading,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  getUserDetail,
  validatePhone as apiValidatePhone,
  validateNickname as apiValidateNickname,
  validateAvatar as apiValidateAvatar,
  updateUserInfo
} from '@api/user-account'
import type { UserAccount } from '@/types/business'

interface Props {
  modelValue: boolean
  userId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'updated'])

const dialogVisible = ref(false)
const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const userData = ref<UserAccount | null>(null)

const formData = reactive({
  nickname: '',
  avatar: '',
  phone: '',
  email: '',
  reason: ''
})

const nicknameValidation = reactive({
  validating: false,
  valid: false,
  message: '',
  suggestions: [] as string[]
})

const avatarValidation = reactive({
  validating: false,
  valid: false,
  message: ''
})

const phoneValidation = reactive({
  validating: false,
  valid: false,
  message: ''
})

const emailValidation = reactive({
  validating: false,
  valid: false,
  message: ''
})

const rules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
}

const canSubmit = computed(() => {
  const hasChanges =
    formData.nickname !== userData.value?.nickname ||
    formData.avatar !== userData.value?.avatar ||
    formData.phone !== userData.value?.phone ||
    formData.email !== userData.value?.email

  const allValid =
    (nicknameValidation.valid || formData.nickname === userData.value?.nickname) &&
    (avatarValidation.valid || formData.avatar === userData.value?.avatar || !formData.avatar) &&
    (phoneValidation.valid || formData.phone === userData.value?.phone || !formData.phone) &&
    (emailValidation.valid || formData.email === userData.value?.email || !formData.email)

  return hasChanges && allValid
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val && props.userId) {
    fetchUserDetail()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const fetchUserDetail = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    const result = await getUserDetail(props.userId)
    userData.value = result.user
    formData.nickname = result.user.nickname
    formData.avatar = result.user.avatar || ''
    formData.phone = result.user.phone || ''
    formData.email = result.user.email || ''
    formData.reason = ''
    resetValidation()
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const resetValidation = () => {
  nicknameValidation.validating = false
  nicknameValidation.valid = true
  nicknameValidation.message = ''
  nicknameValidation.suggestions = []

  avatarValidation.validating = false
  avatarValidation.valid = true
  avatarValidation.message = ''

  phoneValidation.validating = false
  phoneValidation.valid = true
  phoneValidation.message = ''

  emailValidation.validating = false
  emailValidation.valid = true
  emailValidation.message = ''
}

const handleNicknameInput = () => {
  if (formData.nickname === userData.value?.nickname) {
    nicknameValidation.valid = true
    nicknameValidation.message = ''
    nicknameValidation.suggestions = []
  } else {
    nicknameValidation.valid = false
    nicknameValidation.message = ''
  }
}

const handleAvatarInput = () => {
  if (formData.avatar === userData.value?.avatar || !formData.avatar) {
    avatarValidation.valid = true
    avatarValidation.message = ''
  } else {
    avatarValidation.valid = false
    avatarValidation.message = ''
  }
}

const handlePhoneInput = () => {
  if (formData.phone === userData.value?.phone || !formData.phone) {
    phoneValidation.valid = true
    phoneValidation.message = ''
  } else {
    phoneValidation.valid = false
    phoneValidation.message = ''
  }
}

const handleEmailInput = () => {
  if (formData.email === userData.value?.email || !formData.email) {
    emailValidation.valid = true
    emailValidation.message = ''
  } else {
    emailValidation.valid = false
    emailValidation.message = ''
  }
}

const validateNickname = async () => {
  if (!formData.nickname || formData.nickname === userData.value?.nickname) {
    nicknameValidation.valid = true
    nicknameValidation.message = ''
    return
  }
  nicknameValidation.validating = true
  nicknameValidation.message = ''
  try {
    const result = await apiValidateNickname({
      nickname: formData.nickname,
      excludeUserId: props.userId || undefined
    })
    nicknameValidation.valid = result.valid
    nicknameValidation.message = result.message || ''
    nicknameValidation.suggestions = result.suggestions || []
  } catch (error: any) {
    nicknameValidation.valid = false
    nicknameValidation.message = error.message || '校验失败'
  } finally {
    nicknameValidation.validating = false
  }
}

const validateAvatar = async () => {
  if (!formData.avatar || formData.avatar === userData.value?.avatar) {
    avatarValidation.valid = true
    avatarValidation.message = ''
    return
  }
  avatarValidation.validating = true
  avatarValidation.message = ''
  try {
    const result = await apiValidateAvatar({ avatar: formData.avatar })
    avatarValidation.valid = result.valid
    avatarValidation.message = result.message || ''
  } catch (error: any) {
    avatarValidation.valid = false
    avatarValidation.message = error.message || '校验失败'
  } finally {
    avatarValidation.validating = false
  }
}

const validatePhone = async () => {
  if (!formData.phone || formData.phone === userData.value?.phone) {
    phoneValidation.valid = true
    phoneValidation.message = ''
    return
  }
  phoneValidation.validating = true
  phoneValidation.message = ''
  try {
    const result = await apiValidatePhone({ phone: formData.phone })
    phoneValidation.valid = result.valid
    phoneValidation.message = result.message || ''
  } catch (error: any) {
    phoneValidation.valid = false
    phoneValidation.message = error.message || '校验失败'
  } finally {
    phoneValidation.validating = false
  }
}

const validateEmail = () => {
  if (!formData.email || formData.email === userData.value?.email) {
    emailValidation.valid = true
    emailValidation.message = ''
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    emailValidation.valid = false
    emailValidation.message = '邮箱格式不正确'
  } else {
    emailValidation.valid = true
    emailValidation.message = ''
  }
}

const applySuggestion = (suggestion: string) => {
  formData.nickname = suggestion
  nicknameValidation.valid = true
  nicknameValidation.message = ''
  nicknameValidation.suggestions = []
}

const handleClose = () => {
  userData.value = null
  formData.nickname = ''
  formData.avatar = ''
  formData.phone = ''
  formData.email = ''
  formData.reason = ''
  resetValidation()
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!props.userId || !canSubmit.value) return

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const updates: any = {}
    if (formData.nickname !== userData.value?.nickname) {
      updates.nickname = formData.nickname
    }
    if (formData.avatar !== userData.value?.avatar) {
      updates.avatar = formData.avatar
    }
    if (formData.phone !== userData.value?.phone) {
      updates.phone = formData.phone
    }
    if (formData.email !== userData.value?.email) {
      updates.email = formData.email
    }
    if (formData.reason) {
      updates.reason = formData.reason
    }

    await updateUserInfo(props.userId, updates)
    ElMessage.success('修改成功')
    emit('updated')
    dialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '修改失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.skeleton-loading {
  padding: 20px 0;
}

.form-item-with-validate {
  width: 100%;

  .valid-icon {
    font-size: 16px;
    color: #c0c4cc;
    animation: spin 1s linear infinite;

    &.success {
      color: #67c23a;
      animation: none;
    }

    &.error {
      color: #f56c6c;
      animation: none;
    }
  }

  .error-message {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 4px;

    .suggestions {
      margin-top: 4px;

      .label {
        color: #909399;
        margin-right: 4px;
      }

      .suggestion-tag {
        cursor: pointer;
        margin-right: 4px;
        margin-bottom: 2px;

        &:hover {
          border-color: #409eff;
          color: #409eff;
        }
      }
    }
  }
}

.avatar-uploader {
  display: flex;
  align-items: center;
  gap: 12px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
