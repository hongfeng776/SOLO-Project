<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore, useUserStore } from '@/stores'
import { changePasswordApi } from '@/api/auth'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const userDropdown = ref<InstanceType<any>>()
const passwordDialogVisible = ref(false)
const passwordLoading = ref(false)

const passwordFormRef = ref()
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
      validator: (_rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      passwordDialogVisible.value = true
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(async () => {
          await userStore.logout()
          ElMessage.success('已退出登录')
          router.push('/login')
        })
        .catch(() => {})
      break
  }
}

const handleSubmitPassword = async () => {
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
    router.push('/login')
  } finally {
    passwordLoading.value = false
  }
}

watch(passwordDialogVisible, (val) => {
  if (!val) {
    passwordFormRef.value?.resetFields()
    Object.assign(passwordForm, { oldPassword: '', newPassword: '', confirmPassword: '' })
  }
})
</script>

<template>
  <div class="qy-header">
    <div class="header-left">
      <el-icon
        class="toggle-btn"
        :size="20"
        @click="appStore.toggleSidebar()"
      >
        <component :is="appStore.sidebarCollapsed ? Expand : Fold" />
      </el-icon>
      <el-page-header :icon="null" class="page-header">
        <template #content>
          <span class="welcome-text">
            欢迎回来，<span class="username">{{ userStore.username }}</span>
          </span>
        </template>
      </el-page-header>
    </div>

    <div class="header-right">
      <el-tooltip content="全屏">
        <el-icon class="header-icon"><FullScreen /></el-icon>
      </el-tooltip>
      <el-tooltip content="刷新">
        <el-icon class="header-icon" @click="location.reload()"><Refresh /></el-icon>
      </el-tooltip>
      <el-dropdown
        ref="userDropdown"
        trigger="click"
        @command="handleCommand"
      >
        <div class="user-info">
          <el-avatar :size="36" :src="userStore.avatar">
            {{ userStore.username?.charAt(0)?.toUpperCase() }}
          </el-avatar>
          <span class="user-name">{{ userStore.userInfo?.realName || userStore.username }}</span>
          <el-icon class="caret-icon"><CaretBottom /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="profile">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <el-dropdown-item divided command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

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
        label-width="80px"
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
        <el-button type="primary" :loading="passwordLoading" @click="handleSubmitPassword">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.qy-header {
  height: $header-height;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: $bg-white;
  border-bottom: 1px solid $border-lighter;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.toggle-btn {
  cursor: pointer;
  color: $text-regular;
  padding: 8px;
  border-radius: 4px;
  transition: $transition-base;

  &:hover {
    background: $bg-color;
    color: $primary-color;
  }
}

.welcome-text {
  font-size: $font-md;
  color: $text-regular;
  .username {
    color: $primary-color;
    font-weight: 500;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  font-size: 20px;
  color: $text-regular;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: $transition-base;

  &:hover {
    background: $bg-color;
    color: $primary-color;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 20px;
  transition: $transition-base;

  &:hover {
    background: $bg-color;
  }
}

.user-name {
  font-size: $font-sm;
  color: $text-regular;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caret-icon {
  font-size: 12px;
  color: $text-secondary;
}
</style>
