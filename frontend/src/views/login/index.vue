<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: 'admin',
  password: 'admin123456',
  remember: true,
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度为3-50个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度为6-50个字符', trigger: 'blur' },
  ],
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate()
  loading.value = true
  try {
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password,
    })
    ElMessage.success('登录成功')
    const redirect = route.query.redirect as string
    router.push(redirect ? decodeURIComponent(redirect) : '/')
  } catch (error) {
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-bg" />
    <div class="login-card">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="36" color="#409EFF"><VideoCamera /></el-icon>
        </div>
        <h1 class="title">奇影内容运营管理平台</h1>
        <p class="subtitle">文娱内容审核与运维一体化平台</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            clearable
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <div class="login-options">
          <el-checkbox v-model="loginForm.remember">记住账号</el-checkbox>
          <a class="forgot-link" href="javascript:;">忘记密码?</a>
        </div>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            style="width: 100%"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>默认账号：admin / admin123456</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1a2a6c 0%, #2d4373 50%, #b21f1f 100%);
}

.login-bg {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(64, 158, 255, 0.3) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(103, 194, 58, 0.3) 0%, transparent 50%);
}

.login-card {
  width: 440px;
  padding: 48px 40px;
  background: $bg-white;
  border-radius: $radius-lg;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;

  .logo {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    border-radius: 50%;
    background: linear-gradient(135deg, #409EFF, #67C23A);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    svg {
      color: white !important;
    }
  }

  .title {
    font-size: $font-2xl;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 8px;
    background: linear-gradient(135deg, #1a2a6c, #409EFF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .subtitle {
    font-size: $font-sm;
    color: $text-secondary;
    margin: 0;
  }
}

.login-form {
  :deep(.el-input__wrapper) {
    padding: 6px 16px;
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: $font-sm;
}

.forgot-link {
  color: $primary-color;
  text-decoration: none;
  &:hover {
    color: #66b1ff;
  }
}

.login-footer {
  margin-top: 24px;
  text-align: center;
  font-size: $font-xs;
  color: $text-placeholder;
}
</style>
