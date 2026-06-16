<template>
  <div class="ccb-login-container">
    <div class="ccb-login-wrapper">
      <div class="ccb-login-left">
        <div class="ccb-brand-info">
          <h1 class="ccb-brand-title">建行全渠道智慧业务运营管理平台</h1>
          <p class="ccb-brand-subtitle">China Construction Bank Omni-Channel Smart Business Operations Platform</p>
          <div class="ccb-brand-desc">
            <p>安全 · 稳定 · 高效 · 合规</p>
            <p>金融级全渠道业务运营管理解决方案</p>
          </div>
        </div>
      </div>
      <div class="ccb-login-right">
        <div class="ccb-login-card">
          <h2 class="ccb-login-title">用户登录</h2>
          <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            label-position="top"
            @submit.prevent="handleLogin"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                size="large"
                :prefix-icon="User"
                autocomplete="username"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                autocomplete="current-password"
                show-password
              />
            </el-form-item>
            <el-form-item label="验证码" prop="captcha">
              <div class="ccb-captcha-wrap">
                <el-input
                  v-model="loginForm.captcha"
                  placeholder="请输入验证码"
                  size="large"
                  :prefix-icon="Key"
                  maxlength="4"
                />
                <div class="ccb-captcha-img" @click="refreshCaptcha">
                  <img v-if="captchaData.captchaBase64" :src="captchaData.captchaBase64" alt="验证码" />
                  <span v-else>点击刷新</span>
                </div>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="ccb-login-btn"
                :loading="loading"
                native-type="submit"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
            <div class="ccb-login-tips">
              <span class="ccb-text-muted">默认账号：admin / 123456</span>
            </div>
          </el-form>
        </div>
      </div>
    </div>
    <div class="ccb-login-footer">
      <p>© 2024 中国建设银行 版权所有 | 技术支持：金融科技团队</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { userStore } from '@store'

const route = useRoute()
const router = useRouter()
const uStore = userStore()

const loginFormRef = ref<FormInstance>()
const loading = ref<boolean>(false)

const loginForm = reactive({
  username: 'admin',
  password: '123456',
  captcha: ''
})

const captchaData = reactive({
  captchaId: '',
  captchaBase64: ''
})

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度在 4 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

const refreshCaptcha = (): void => {
  captchaData.captchaId = 'mock_captcha_' + Date.now()
  captchaData.captchaBase64 = ''
}

const handleLogin = async (): Promise<void> => {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await uStore.login(loginForm)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error) {
    ElMessage.error('登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  refreshCaptcha()
})
</script>

<style lang="scss" scoped>
.ccb-login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #001529 0%, #004098 50%, #1e63c4 100%);
  overflow: hidden;
}

.ccb-login-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 80px;
  gap: 80px;
}

.ccb-login-left {
  flex: 1;
  color: #fff;

  .ccb-brand-title {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 12px;
    letter-spacing: 2px;
  }

  .ccb-brand-subtitle {
    font-size: 16px;
    opacity: 0.8;
    margin-bottom: 40px;
    letter-spacing: 1px;
  }

  .ccb-brand-desc {
    font-size: 14px;
    opacity: 0.7;
    line-height: 2;
  }
}

.ccb-login-right {
  width: 440px;
}

.ccb-login-card {
  background-color: #fff;
  border-radius: 12px;
  padding: 40px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  .ccb-login-title {
    font-size: 24px;
    font-weight: 600;
    color: #262626;
    margin-bottom: 32px;
    text-align: center;
  }

  .ccb-login-btn {
    width: 100%;
    height: 44px;
    font-size: 16px;
    letter-spacing: 4px;
  }

  .ccb-login-tips {
    text-align: center;
    margin-top: 16px;

    .ccb-text-muted {
      color: #8c8c8c;
      font-size: 13px;
    }
  }
}

.ccb-captcha-wrap {
  display: flex;
  gap: 12px;

  .el-input {
    flex: 1;
  }

  .ccb-captcha-img {
    width: 120px;
    height: 40px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fafafa;
    transition: all 0.3s;

    &:hover {
      border-color: #004098;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    span {
      font-size: 12px;
      color: #8c8c8c;
    }
  }
}

.ccb-login-footer {
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}
</style>
