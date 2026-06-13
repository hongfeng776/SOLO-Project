<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-left">
        <div class="brand">
          <el-icon :size="48" color="#409EFF"><Briefcase /></el-icon>
          <h1 class="brand-title">职擎招聘管理平台</h1>
          <p class="brand-desc">智能招聘 · 高效管理 · 精准匹配</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon :size="24" color="#409EFF"><User /></el-icon>
            <span>简历管理</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="#67C23A"><DataLine /></el-icon>
            <span>数据分析</span>
          </div>
          <div class="feature-item">
            <el-icon :size="24" color="#E6A23C"><Setting /></el-icon>
            <span>流程配置</span>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-wrap">
          <h2 class="form-title">用户登录</h2>
          <p class="form-subtitle">欢迎回来，请登录您的账号</p>
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
                size="large"
                :prefix-icon="User"
                clearable
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
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
                <a class="forgot-link" @click="forgotPassword">忘记密码？</a>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-btn"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-tips">
            <el-alert type="info" :closable="false" show-icon>
              <template #title>
                默认账号：<b>admin</b> / <b>admin</b>
              </template>
            </el-alert>
          </div>
        </div>
      </div>
    </div>
    <div class="login-footer">
      <p>© 2026 职擎招聘管理平台 All Rights Reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, message: '密码长度不能少于4位', trigger: 'blur' }
  ]
}

onMounted(() => {
  const savedUsername = localStorage.getItem('zhiqin-username')
  const savedPassword = localStorage.getItem('zhiqin-password')
  if (savedUsername && savedPassword) {
    loginForm.username = savedUsername
    loginForm.password = savedPassword
    rememberMe.value = true
  }
})

async function handleLogin() {
  if (!loginFormRef.value) return
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const result = await userStore.doLogin({
      username: loginForm.username.trim(),
      password: loginForm.password.trim()
    })

    if (rememberMe.value) {
      localStorage.setItem('zhiqin-username', loginForm.username)
      localStorage.setItem('zhiqin-password', loginForm.password)
    } else {
      localStorage.removeItem('zhiqin-username')
      localStorage.removeItem('zhiqin-password')
    }

    ElMessage.success(`欢迎回来，${result.nickname}！`)

    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (error: any) {
    ElMessage.error(error?.message || '登录失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}

function forgotPassword() {
  ElMessage.info('请联系管理员重置密码')
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    top: -200px;
    right: -200px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    bottom: -150px;
    left: -100px;
  }
}

.login-box {
  flex: 1;
  display: flex;
  width: 960px;
  max-width: 90%;
  margin: auto;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  z-index: 1;
}

.login-left {
  width: 50%;
  padding: 60px 50px;
  background: linear-gradient(180deg, #409eff 0%, #2b7cd3 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.brand {
  .brand-title {
    font-size: 28px;
    font-weight: 700;
    margin: 16px 0 8px;
    letter-spacing: 1px;
  }

  .brand-desc {
    font-size: 14px;
    opacity: 0.85;
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
    opacity: 0.9;
    background: rgba(255, 255, 255, 0.12);
    padding: 12px 16px;
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }
}

.login-right {
  width: 50%;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form-wrap {
  width: 100%;
  max-width: 320px;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 13px;
  color: #909399;
  margin-bottom: 32px;
}

.login-form {
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .forgot-link {
      font-size: 13px;
      color: #409eff;
    }
  }
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  letter-spacing: 4px;
  border-radius: 8px;
}

.login-tips {
  margin-top: 24px;

  :deep(.el-alert) {
    --el-alert-padding: 8px 12px;
  }
}

.login-footer {
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  z-index: 1;
}

@media (max-width: 768px) {
  .login-box {
    flex-direction: column;
  }

  .login-left,
  .login-right {
    width: 100%;
  }

  .login-left {
    padding: 40px 30px;

    .features {
      display: none;
    }
  }

  .login-right {
    padding: 40px 30px;
  }
}
</style>
