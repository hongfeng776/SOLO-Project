<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand">
          <h1 class="brand-title">红途内容生态管理后台</h1>
          <p class="brand-subtitle">HongTu Content Ecosystem Platform</p>
        </div>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon :size="24"><Document /></el-icon>
            <div>
              <h4>全链路内容运营</h4>
              <p>从内容创作到审核发布一站式管理</p>
            </div>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><DataAnalysis /></el-icon>
            <div>
              <h4>数据驱动决策</h4>
              <p>实时数据看板，洞察流量趋势</p>
            </div>
          </div>
          <div class="feature-item">
            <el-icon :size="24"><UserFilled /></el-icon>
            <div>
              <h4>达人精细运维</h4>
              <p>多维度达人画像，资质全流程管控</p>
            </div>
          </div>
        </div>
      </div>
      <div class="login-right">
        <div class="login-form-wrapper">
          <h2 class="form-title">账号登录</h2>
          <p class="form-subtitle">欢迎使用红途管理后台</p>
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            size="large"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="username">
              <el-input
                v-model="formData.username"
                placeholder="请输入用户名"
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
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button
              type="primary"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登 录' }}
            </el-button>
          </el-form>
          <div class="login-footer">
            <el-divider>快速体验</el-divider>
            <div class="quick-tips">
              <el-tag type="info">管理员 admin / admin123</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, Document, DataAnalysis, UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import type { LoginParams } from '@/types/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const formData = reactive<LoginParams>({
  username: 'admin',
  password: 'admin123'
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 50, message: '用户名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 50, message: '密码长度在 6 到 50 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(formData)
    ElMessage.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch (error) {
    console.error('[Login] error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 600px;
    height: 600px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    top: -200px;
    left: -200px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 400px;
    height: 400px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
    bottom: -100px;
    right: -100px;
  }
}

.login-wrapper {
  width: 960px;
  height: 560px;
  background: $bg-container;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.login-left {
  width: 55%;
  padding: 48px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  display: flex;
  flex-direction: column;
}

.brand {
  margin-bottom: 48px;
}

.brand-title {
  font-size: 26px;
  font-weight: 700;
  color: $text-primary;
  margin: 0 0 8px;
}

.brand-subtitle {
  font-size: 13px;
  color: $text-secondary;
  margin: 0;
  letter-spacing: 1px;
}

.brand-features {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;

  .el-icon {
    color: $color-primary;
    flex-shrink: 0;
    margin-top: 4px;
  }

  h4 {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 4px;
  }

  p {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
    line-height: 1.6;
  }
}

.login-right {
  width: 45%;
  padding: 48px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form-wrapper {
  width: 100%;
  max-width: 320px;
}

.form-title {
  font-size: 22px;
  font-weight: 700;
  color: $text-primary;
  margin: 0 0 8px;
}

.form-subtitle {
  font-size: 13px;
  color: $text-secondary;
  margin: 0 0 32px;
}

.login-btn {
  width: 100%;
  margin-top: 8px;
  height: 42px;
  font-size: 15px;
  letter-spacing: 2px;
}

.login-footer {
  margin-top: 32px;

  :deep(.el-divider__text) {
    background-color: $bg-container;
    font-size: 12px;
    color: $text-secondary;
  }
}

.quick-tips {
  text-align: center;

  .el-tag {
    cursor: pointer;
  }
}
</style>
