<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand-info">
          <img src="/vite.svg" alt="logo" class="brand-logo" />
          <h1 class="brand-title">{{ appTitle }}</h1>
          <p class="brand-desc">专业的金融资产管理平台，助您智慧投资，稳健增长</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon :size="24"><DataLine /></el-icon>
            <span>智能数据分析</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><CircleCheck /></el-icon>
            <span>安全合规保障</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><TrendCharts /></el-icon>
            <span>实时行情监控</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2 class="form-title">欢迎登录</h2>
          <p class="form-subtitle">请输入您的账号信息</p>
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
                clearable
              />
            </el-form-item>
            <el-form-item>
              <div class="login-options">
                <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
                <a href="javascript:;" class="forgot-password">忘记密码？</a>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                class="login-btn"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-footer">
            <p>© 2024 智投金融资产管理系统 版权所有</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@stores/user'
import { User, Lock, DataLine, CircleCheck, TrendCharts } from '@element-plus/icons-vue'
import type { ILoginParams } from '@/types/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const appTitle = import.meta.env.VITE_APP_TITLE || '智投金融资产管理系统'

const formRef = ref<FormInstance>()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度在 6 到 32 个字符', trigger: 'blur' }
  ]
}

onMounted(() => {
  const savedUsername = localStorage.getItem('remember_username')
  if (savedUsername) {
    loginForm.username = savedUsername
    loginForm.remember = true
  }
})

const handleLogin = async () => {
  if (!formRef.value) return
  
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const params: ILoginParams = {
      username: loginForm.username.trim(),
      password: loginForm.password
    }
    
    await userStore.login(params)
    
    if (loginForm.remember) {
      localStorage.setItem('remember_username', loginForm.username)
    } else {
      localStorage.removeItem('remember_username')
    }

    ElMessage.success('登录成功')
    
    const redirect = route.query.redirect as string
    router.push(redirect || '/')
  } catch (error: any) {
    ElMessage.error(error.message || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, $fin-primary 0%, $fin-primary-light 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-wrapper {
  width: 100%;
  max-width: 1000px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
  min-height: 600px;
}

.login-left {
  width: 50%;
  background: linear-gradient(180deg, $fin-primary 0%, $fin-primary-light 100%);
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: #fff;

  .brand-info {
    .brand-logo {
      width: 60px;
      height: 60px;
      margin-bottom: 24px;
    }

    .brand-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.3;
    }

    .brand-desc {
      font-size: 16px;
      line-height: 1.8;
      opacity: 0.9;
    }
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 15px;
      opacity: 0.95;

      .el-icon {
        background: rgba(255, 255, 255, 0.15);
        padding: 8px;
        border-radius: 8px;
      }
    }
  }
}

.login-right {
  width: 50%;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .login-form-wrapper {
    width: 100%;
    max-width: 360px;
    margin: 0 auto;

    .form-title {
      font-size: 28px;
      font-weight: 700;
      color: $fin-text-primary;
      margin-bottom: 8px;
    }

    .form-subtitle {
      font-size: 14px;
      color: $fin-text-secondary;
      margin-bottom: 40px;
    }

    .login-form {
      .login-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        .forgot-password {
          color: $fin-primary;
          font-size: 14px;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .login-btn {
        width: 100%;
        height: 48px;
        font-size: 16px;
        font-weight: 500;
        margin-top: 8px;
      }
    }

    .login-footer {
      margin-top: 40px;
      text-align: center;

      p {
        font-size: 12px;
        color: $fin-text-secondary;
      }
    }
  }
}

@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
    min-height: auto;
  }

  .login-left,
  .login-right {
    width: 100%;
    padding: 40px 30px;
  }

  .login-left {
    min-height: 300px;
  }
}
</style>
