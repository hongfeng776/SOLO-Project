<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/modules/user'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const formRef = ref<FormInstance>()
const loading = ref(false)
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

const loginForm = reactive({
  username: 'admin',
  password: '123456'
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await userStore.handleLogin(loginForm)
    if (res.code === 200) {
      const redirect = route.query.redirect as string
      router.push(redirect || '/')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1 class="title">词研语言学习管理平台</h1>
        <p class="subtitle">欢迎登录</p>
      </div>
      <el-form
        ref="formRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
      </el-form>
      <div class="login-footer">
        <p>默认账号：admin / 123456</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  height: 100%;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .login-box {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 8px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

    .login-header {
      text-align: center;
      margin-bottom: 40px;

      .title {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 10px;
      }

      .subtitle {
        font-size: 14px;
        color: $text-secondary;
      }
    }

    .login-form {
      .el-form-item {
        margin-bottom: 24px;
      }

      .login-btn {
        width: 100%;
        height: 44px;
        font-size: 16px;
        margin-top: 10px;
      }
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      color: $text-secondary;
      font-size: 12px;
    }
  }
}
</style>
