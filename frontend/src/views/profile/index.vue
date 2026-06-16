<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores'
import { changePasswordApi } from '@/api/auth'
import type { FormInstance } from 'element-plus'
import { formatDate } from '@/utils'

const userStore = useUserStore()
const userInfo = ref<any>({})

const loadUserInfo = async () => {
  try {
    userInfo.value = await userStore.fetchCurrentUser()
  } catch {
  }
}

const passwordFormRef = ref<FormInstance>()
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度6-50位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_r, value, cb) => {
        if (value !== passwordForm.newPassword) cb(new Error('两次输入的密码不一致'))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

const openPasswordDialog = () => {
  passwordDialogVisible.value = true
}

const handleChangePassword = async () => {
  await passwordFormRef.value?.validate()
  passwordLoading.value = true
  try {
    await changePasswordApi({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    ElMessage.success('密码修改成功，请重新登录')
    passwordDialogVisible.value = false
    await userStore.logout()
    window.location.href = '/login'
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="8">
        <div class="profile-card card-content">
          <div class="avatar-section">
            <el-avatar :size="96" :src="userInfo.avatar">
              {{ userStore.username?.charAt(0)?.toUpperCase() }}
            </el-avatar>
            <h3 class="user-name">{{ userInfo.realName || userInfo.username }}</h3>
            <el-tag :type="userInfo.role?.code === 'SUPER_ADMIN' ? 'danger' : 'primary'" size="large" effect="light">
              {{ userInfo.role?.name }}
            </el-tag>
          </div>
          <el-divider />
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-label">部门</span>
              <span class="stat-value">{{ userInfo.department || '-' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">账号</span>
              <span class="stat-value">{{ userInfo.username }}</span>
            </div>
          </div>
          <el-button type="primary" style="width: 100%; margin-top: 16px" @click="openPasswordDialog">
            <el-icon><Lock /></el-icon>
            修改密码
          </el-button>
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="16">
        <div class="profile-card card-content">
          <div class="card-header flex-between">
            <span class="card-title">个人信息</span>
          </div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户名">{{ userInfo.username || '-' }}</el-descriptions-item>
            <el-descriptions-item label="真实姓名">{{ userInfo.realName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ userInfo.role?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ userInfo.department || '-' }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ userInfo.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ userInfo.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ userInfo.id || '-' }}</el-descriptions-item>
            <el-descriptions-item label="拥有权限">
              {{ userInfo.role?.code === 'SUPER_ADMIN' ? '全部权限' : `${userInfo.permissions?.length || 0} 项` }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="profile-card card-content mt-16">
          <div class="card-header flex-between">
            <span class="card-title">操作记录</span>
          </div>
          <el-empty description="暂无操作记录" />
        </div>
      </el-col>
    </el-row>

    <el-dialog
      v-model="passwordDialogVisible"
      title="修改密码"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handleChangePassword">
          确定修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.profile-page {
  display: flex;
  flex-direction: column;
}

.profile-card {
  margin-bottom: 0;
}

.avatar-section {
  text-align: center;
  padding: 20px 0;

  :deep(.el-avatar) {
    margin-bottom: 16px;
    background: linear-gradient(135deg, $primary-color, #67C23A);
  }
}

.user-name {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 12px;
}

.profile-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed $border-light;

  &:last-child {
    border-bottom: none;
  }
}

.stat-label {
  font-size: $font-sm;
  color: $text-secondary;
}

.stat-value {
  font-size: $font-sm;
  color: $text-primary;
  font-weight: 500;
}

.card-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid $border-lighter;
}

.card-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.mt-16 {
  margin-top: 16px;
}
</style>
