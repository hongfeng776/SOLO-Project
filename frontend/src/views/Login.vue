<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <img src="@/assets/logo.svg" alt="logo" />
        <h1>文旅电商管理后台</h1>
        <p>欢迎回来，请登录您的账户</p>
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
            size="large"
            :prefix-icon="User"
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
          />
        </el-form-item>
        <el-form-item prop="captcha" v-if="showCaptcha">
          <el-input
            v-model="loginForm.captcha"
            placeholder="请输入验证码"
            size="large"
            :prefix-icon="Key"
          />
          <div class="captcha-img" @click="refreshCaptcha">
            <img :src="captchaUrl" alt="验证码" />
          </div>
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="loading"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form>
      <div class="login-footer">
        <p>© 2024 文旅电商管理系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/modules/user'
import { validateUsername, validatePassword } from '@/utils/validate'
import { User, Lock, Key } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const loading = ref(false)
const showCaptcha = ref(false)
const captchaUrl = ref('')

const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!validateUsername(value)) {
        callback(new Error('用户名格式不正确'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!validatePassword(value)) {
        callback(new Error('密码长度应在6-20位之间'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  captcha: [
    { required: true, message: '请输入验证码', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
    loading.value = true
    await userStore.login(loginForm)
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (error) {
    if (error !== false) {
      console.error(error)
    }
  } finally {
    loading.value = false
  }
}

const refreshCaptcha = () => {
  captchaUrl.value = `/api/captcha?time=${Date.now()}`
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;

  .login-box {
    width: 400px;
    background: #fff;
    border-radius: 12px;
    padding: 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .login-header {
    text-align: center;
    margin-bottom: 30px;

    img {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    p {
      color: #999;
      font-size: 14px;
    }
  }

  .login-form {
    .el-form-item {
      margin-bottom: 20px;
    }

    .captcha-img {
      position: absolute;
      right: 0;
      top: 0;
      height: 40px;
      cursor: pointer;

      img {
        height: 100%;
      }
    }
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
    color: #999;
    font-size: 12px;
  }
}
</style>
