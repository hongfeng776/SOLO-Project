<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="login-logo">
          <el-icon :size="48" color="#409EFF"><DataAnalysis /></el-icon>
          <h1>{{ appTitle }}</h1>
        </div>
        <p class="login-desc">专业的全域分销管理系统，助力高效运营</p>
      </div>
      <div class="login-right">
        <el-card class="login-card" shadow="hover">
          <h2 class="login-title">用户登录</h2>
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-width="0"
            size="large"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="formData.username"
                placeholder="请输入账号"
                :prefix-icon="User"
                clearable
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>
            <el-form-item prop="captcha" v-if="false">
              <div class="captcha-wrapper">
                <el-input
                  v-model="formData.captcha"
                  placeholder="请输入验证码"
                  :prefix-icon="Key"
                  maxlength="4"
                />
                <div class="captcha-img">验证码</div>
              </div>
            </el-form-item>
            <el-form-item>
              <div class="login-options">
                <el-checkbox v-model="formData.remember">记住密码</el-checkbox>
                <el-link type="primary" :underline="false">忘记密码？</el-link>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                class="login-btn"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>
          <div class="login-footer">
            <p>还没有账号？<el-link type="primary" :underline="false">立即注册</el-link></p>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { Storage } from '@/utils/storage'

const appTitle = computed(() => import.meta.env.VITE_APP_TITLE || '管理系统')
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: false,
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度为3-20位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' },
  ],
}

onMounted(() => {
  const saved = Storage.get('loginForm')
  if (saved) {
    formData.username = saved.username || ''
    formData.password = saved.password || ''
    formData.remember = true
  }
})

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      if (formData.remember) {
        Storage.set('loginForm', {
          username: formData.username,
          password: formData.password,
        })
      } else {
        Storage.remove('loginForm')
      }
      await userStore.login(formData.username, formData.password)
      await userStore.fetchUserInfo()
      ElMessage.success('登录成功')
      const redirect = (route.query.redirect as string) || '/dashboard'
      router.push(redirect)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 960px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-left {
  flex: 1;
  padding: 60px 50px;
  background: linear-gradient(135deg, #409EFF 0%, #7c4dff 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .login-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
  }

  .login-desc {
    font-size: 16px;
    opacity: 0.9;
    line-height: 1.8;
  }
}

.login-right {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  border: none;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.login-title {
  margin: 0 0 32px;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  text-align: center;
}

.captcha-wrapper {
  display: flex;
  gap: 12px;

  .el-input {
    flex: 1;
  }

  .captcha-img {
    width: 120px;
    height: 40px;
    background: #f5f7fa;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 4px;
    color: #409EFF;
    user-select: none;
  }
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: #909399;
  font-size: 14px;
}
</style>
