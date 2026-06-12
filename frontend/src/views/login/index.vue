<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '@/store';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const redirect = computed(() => (route.query.redirect as string) || '/dashboard');

const form = reactive({
  username: 'admin',
  password: 'admin123',
});

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '长度在 6 到 32 个字符', trigger: 'blur' },
  ],
};

const submitDisabled = ref(false);
const handleSubmit = async () => {
  if (submitDisabled.value) return;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitDisabled.value = true;
  loading.value = true;
  try {
    const ok = await userStore.login(form.username.trim(), form.password);
    if (ok) {
      setTimeout(() => {
        router.replace(redirect.value);
      }, 150);
    }
  } finally {
    loading.value = false;
    setTimeout(() => {
      submitDisabled.value = false;
    }, 300);
  }
};

const gotoRegister = () => router.push('/register');
</script>

<template>
  <div class="login-page">
    <div class="bg-deco">
      <div class="deco deco-1" />
      <div class="deco deco-2" />
      <div class="deco deco-3" />
    </div>
    <div class="login-box">
      <div class="login-header">
        <svg viewBox="0 0 64 64" class="brand-icon">
          <rect width="64" height="64" rx="14" fill="url(#g)" />
          <path d="M18 46V18h6l10 16V18h6v28h-6L24 30v16z" fill="#fff" />
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#1677ff" />
              <stop offset="100%" stop-color="#0958d9" />
            </linearGradient>
          </defs>
        </svg>
        <h1 class="brand-title">标注系统</h1>
        <p class="brand-subtitle">Annotation Management Platform</p>
      </div>
      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleSubmit" label-position="top" class="login-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="'User'" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" size="large" type="password" show-password :prefix-icon="'Lock'" />
        </el-form-item>
        <div class="login-actions">
          <label class="remember-me">
            <el-checkbox v-model="form.username" style="visibility: hidden; width: 0" />
            <span>默认账号: admin / admin123</span>
          </label>
          <a class="forgot-link" href="javascript:;">忘记密码？</a>
        </div>
        <el-button
          type="primary"
          size="large"
          class="submit-btn"
          :loading="loading"
          :disabled="submitDisabled"
          @click="handleSubmit"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </el-button>
        <div class="login-footer">
          <span>还没有账号？</span>
          <el-button type="primary" link @click="gotoRegister">立即注册</el-button>
        </div>
      </el-form>
    </div>
    <div class="copyright">© {{ new Date().getFullYear() }} Annotation System · All Rights Reserved</div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #e6f4ff 0%, #f0f5ff 50%, #ffffff 100%);
  padding: $spacing-md;
}

.bg-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  .deco {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.4;
    animation: float 8s ease-in-out infinite;
  }
  .deco-1 {
    width: 420px;
    height: 420px;
    background: #1677ff;
    top: -120px;
    left: -100px;
  }
  .deco-2 {
    width: 360px;
    height: 360px;
    background: #4096ff;
    bottom: -100px;
    right: -80px;
    animation-delay: -3s;
  }
  .deco-3 {
    width: 240px;
    height: 240px;
    background: #69b1ff;
    top: 40%;
    right: 30%;
    animation-delay: -5s;
  }
}
@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(12px, -20px); }
}

.login-box {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  border-radius: $radius-xl;
  box-shadow: 0 20px 60px rgba(22, 119, 255, 0.15);
  padding: $spacing-xxl;
  border: 1px solid rgba(22, 119, 255, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: $spacing-xl;
  .brand-icon {
    width: 56px;
    height: 56px;
    margin-bottom: $spacing-md;
  }
  .brand-title {
    font-size: $font-size-title;
    font-weight: 700;
    color: $color-text-primary;
    margin: 0 0 $spacing-xs;
    background: linear-gradient(135deg, $color-primary, $color-primary-dark);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .brand-subtitle {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin: 0;
    letter-spacing: 0.5px;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: $spacing-md;
  }
}

.login-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 $spacing-lg;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  .forgot-link {
    color: $color-primary;
    &:hover { color: $color-primary-light; }
  }
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: $font-size-lg;
  font-weight: 500;
  letter-spacing: 4px;
  border-radius: $radius-md;
  background: linear-gradient(135deg, $color-primary, $color-primary-dark);
  border: none;
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, $color-primary-light, $color-primary);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(22, 119, 255, 0.3);
  }
}

.login-footer {
  margin-top: $spacing-lg;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.copyright {
  position: absolute;
  bottom: $spacing-lg;
  left: 0;
  right: 0;
  text-align: center;
  font-size: $font-size-xs;
  color: $color-text-placeholder;
  z-index: 1;
}
</style>
