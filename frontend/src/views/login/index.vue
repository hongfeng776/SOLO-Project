<template>
  <div class="login-container">
    <div class="login-box" :class="{ 'shake-anomaly': showAnomalyShake }">
      <div class="login-header">
        <div class="logo">
          <el-icon :size="32" color="#2563eb"><UserFilled /></el-icon>
        </div>
        <h2 class="title">优才企招管理后台</h2>
        <p class="subtitle">企业招聘 · 高效运维</p>
      </div>
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            :class="{ 'input-focus': inputFocus === 'username' }"
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
            @keyup.enter="handleLogin"
            @focus="handleInputFocus('password')"
            @blur="handleInputBlur"
            :class="{ 'input-focus': inputFocus === 'password' }"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="loading"
            @mousedown="handleBtnMouseDown"
            @mouseup="handleBtnMouseUp"
            @mouseleave="handleBtnMouseUp"
            @click="handleLogin"
            :class="{ 'btn-offset': btnPressed }"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
      <div class="login-tip">
        <p>默认账号：admin / 123456</p>
      </div>
    </div>

    <el-dialog
      v-model="showAnomalyDialog"
      title="登录异常预警"
      width="480px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      class="anomaly-dialog"
    >
      <div class="anomaly-content">
        <div class="anomaly-icon">
          <el-icon :size="48" color="#f56c6c"><Warning /></el-icon>
        </div>
        <div class="anomaly-info">
          <h3 class="anomaly-title">检测到异常登录行为</h3>
          <p class="anomaly-reason">{{ anomalyReason }}</p>
          <div class="anomaly-details" v-if="riskLevel">
            <el-tag :type="getRiskTagType(riskLevel)" size="large">
              风险等级：{{ getRiskLevelLabel(riskLevel) }}
            </el-tag>
          </div>
        </div>
      </div>
      <div class="verify-section" v-if="showVerifySection">
        <el-divider content-position="left">安全验证</el-divider>
        <p class="verify-tip">请完成二次验证以继续登录：</p>
        <el-form :model="verifyForm" :rules="verifyRules" ref="verifyFormRef">
          <el-form-item prop="verifyCode">
            <el-input
              v-model="verifyForm.verifyCode"
              :placeholder="getVerifyPlaceholder()"
              size="large"
              maxlength="6"
              show-password
            />
          </el-form-item>
        </el-form>
        <p class="verify-hint">测试验证码：123456</p>
      </div>
      <template #footer>
        <el-button
          v-if="showVerifySection"
          @click="handleCancelVerify"
        >
          取消
        </el-button>
        <el-button
          v-if="showVerifySection"
          type="primary"
          :loading="verifying"
          @mousedown="handleVerifyBtnMouseDown"
          @mouseup="handleVerifyBtnMouseUp"
          @mouseleave="handleVerifyBtnMouseUp"
          @click="handleVerifyLogin"
          :class="{ 'btn-offset': verifyBtnPressed }"
        >
          验证登录
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="showAnomalyDialog = false"
        >
          我知道了
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { User, Lock, Warning, UserFilled } from '@element-plus/icons-vue';
import { useUserStore } from '@/store/modules/user';

const router = useRouter();
const route = useRoute();
const userStore = useUserStore();

const loginFormRef = ref<FormInstance>();
const verifyFormRef = ref<FormInstance>();
const loading = ref(false);
const verifying = ref(false);
const inputFocus = ref<string>('');
const btnPressed = ref(false);
const verifyBtnPressed = ref(false);
const showAnomalyShake = ref(false);
const showAnomalyDialog = ref(false);
const showVerifySection = ref(false);
const anomalyReason = ref('');
const riskLevel = ref('');

const loginForm = reactive({
  username: 'admin',
  password: '123456',
});

const verifyForm = reactive({
  verifyCode: '',
});

const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const verifyRules: FormRules = {
  verifyCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
};

const handleInputFocus = (field: string) => {
  inputFocus.value = field;
};

const handleInputBlur = () => {
  inputFocus.value = '';
};

const handleBtnMouseDown = () => {
  btnPressed.value = true;
};

const handleBtnMouseUp = () => {
  btnPressed.value = false;
};

const handleVerifyBtnMouseDown = () => {
  verifyBtnPressed.value = true;
};

const handleVerifyBtnMouseUp = () => {
  verifyBtnPressed.value = false;
};

const triggerShake = () => {
  showAnomalyShake.value = true;
  setTimeout(() => {
    showAnomalyShake.value = false;
  }, 820);
};

const getRiskTagType = (level: string) => {
  const typeMap: Record<string, any> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  };
  return typeMap[level] || 'info';
};

const getRiskLevelLabel = (level: string) => {
  const labelMap: Record<string, string> = {
    low: '低风险',
    medium: '中风险',
    high: '高风险',
    critical: '极高风险',
  };
  return labelMap[level] || level;
};

const getVerifyPlaceholder = () => {
  const type = userStore.pendingVerification?.verifyType;
  const placeholderMap: Record<string, string> = {
    sms: '请输入短信验证码',
    email: '请输入邮箱验证码',
    totp: '请输入动态口令',
    question: '请输入安全问题答案',
  };
  return placeholderMap[type || 'sms'] || '请输入验证码';
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const result = await userStore.login(loginForm.username, loginForm.password);

        if (result.requireVerify && result.anomalyReason) {
          triggerShake();
          anomalyReason.value = result.anomalyReason;
          riskLevel.value = result.riskLevel || '';
          showVerifySection.value = true;
          showAnomalyDialog.value = true;
        } else if (result.token) {
          ElMessage.success('登录成功');
          const redirect = (route.query.redirect as string) || '/';
          router.push(redirect);
        } else if (result.anomalyReason) {
          triggerShake();
          anomalyReason.value = result.anomalyReason;
          riskLevel.value = result.riskLevel || '';
          showVerifySection.value = false;
          showAnomalyDialog.value = true;
        }
      } catch (error: any) {
        triggerShake();
        anomalyReason.value = error.message || '登录失败，请稍后重试';
        riskLevel.value = 'high';
        showVerifySection.value = false;
        showAnomalyDialog.value = true;
      } finally {
        loading.value = false;
      }
    }
  });
};

const handleVerifyLogin = async () => {
  if (!verifyFormRef.value) return;

  await verifyFormRef.value.validate(async (valid) => {
    if (valid) {
      verifying.value = true;
      try {
        await userStore.verifyLogin(verifyForm.verifyCode);
        ElMessage.success('验证成功，登录成功');
        showAnomalyDialog.value = false;
        verifyForm.verifyCode = '';
        const redirect = (route.query.redirect as string) || '/';
        router.push(redirect);
      } catch (error: any) {
        ElMessage.error(error.message || '验证失败');
      } finally {
        verifying.value = false;
      }
    }
  });
};

const handleCancelVerify = () => {
  userStore.cancelVerification();
  showAnomalyDialog.value = false;
  verifyForm.verifyCode = '';
};
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    width: 500px;
    height: 500px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    top: -100px;
    right: -100px;
  }

  &::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    bottom: -50px;
    left: -50px;
  }
}

.login-box {
  width: 420px;
  padding: 40px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  transition: all 0.2s ease;
}

.shake-anomaly {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
}

@keyframes shake {
  10%, 90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%, 80% {
    transform: translate3d(2px, 0, 0);
  }
  30%, 50%, 70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%, 60% {
    transform: translate3d(4px, 0, 0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  .logo {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .title {
    font-size: 24px;
    font-weight: 600;
    color: $text-primary;
    margin: 0 0 8px;
  }

  .subtitle {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;
  }
}

.input-focus {
  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #667eea inset !important;
    background-color: #f0f4ff !important;
  }
}

.login-btn {
  width: 100%;
  transition: all 0.15s ease;
}

.btn-offset {
  transform: translate(2px, 2px);
  background-color: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}

.login-tip {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: $text-placeholder;
}

.anomaly-dialog {
  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-radius: 8px 8px 0 0;
    margin-right: 0;
    padding: 20px 24px;
  }

  :deep(.el-dialog__title) {
    color: #dc2626;
    font-weight: 600;
  }
}

.anomaly-content {
  display: flex;
  gap: 16px;
  padding: 16px 0;

  .anomaly-icon {
    flex-shrink: 0;
    animation: pulse 2s infinite;
  }

  .anomaly-info {
    flex: 1;

    .anomaly-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 8px;
    }

    .anomaly-reason {
      font-size: 14px;
      color: $text-secondary;
      margin: 0 0 12px;
      line-height: 1.6;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.verify-section {
  .verify-tip {
    font-size: 14px;
    color: $text-secondary;
    margin: 0 0 16px;
  }

  .verify-hint {
    font-size: 12px;
    color: $text-placeholder;
    margin: 8px 0 0;
    text-align: right;
  }
}
</style>
