<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { authApi } from '@/api';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);
const submitDisabled = ref(false);

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: '',
});

const validateConfirm = (_rule: any, value: string, callback: any) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { max: 20, message: '最多 20 个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '长度在 6 到 32 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
};

const handleSubmit = async () => {
  if (submitDisabled.value) return;
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  submitDisabled.value = true;
  loading.value = true;
  try {
    const res = await authApi.register({
      username: form.username.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
    });
    if (res.code === 0) {
      ElMessage.success('注册成功，即将跳转登录页');
      setTimeout(() => router.push('/login'), 800);
    }
  } finally {
    loading.value = false;
    setTimeout(() => (submitDisabled.value = false), 300);
  }
};
</script>

<template>
  <div class="register-page">
    <div class="register-box">
      <h2 class="reg-title">创建新账号</h2>
      <p class="reg-sub">欢迎加入标注系统</p>
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="reg-form">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" size="large" :prefix-icon="'User'" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" size="large" :prefix-icon="'Avatar'" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" placeholder="请输入密码" size="large" type="password" show-password :prefix-icon="'Lock'" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" placeholder="请再次输入密码" size="large" type="password" show-password :prefix-icon="'Lock'" />
        </el-form-item>
        <el-button type="primary" size="large" class="submit-btn" :loading="loading" :disabled="submitDisabled" @click="handleSubmit">
          {{ loading ? '注册中...' : '注 册' }}
        </el-button>
        <div class="reg-footer">
          已有账号？<el-button type="primary" link @click="$router.push('/login')">去登录</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e6f4ff, #f0f5ff);
  padding: $spacing-md;
}
.register-box {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: $radius-xl;
  box-shadow: $shadow-lg;
  padding: $spacing-xxl;
}
.reg-title {
  margin: 0;
  font-size: $font-size-title;
  font-weight: 700;
  color: $color-text-primary;
}
.reg-sub {
  margin: $spacing-xs 0 $spacing-lg;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}
.reg-form {
  :deep(.el-form-item) { margin-bottom: $spacing-md; }
}
.submit-btn {
  width: 100%;
  height: 44px;
  font-size: $font-size-lg;
  letter-spacing: 4px;
  margin-top: $spacing-sm;
}
.reg-footer {
  margin-top: $spacing-lg;
  text-align: center;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}
</style>
