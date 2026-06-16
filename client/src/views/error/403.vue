<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-code">403</div>
      <div class="error-title">权限不足</div>
      <div class="error-desc">抱歉，您没有权限访问该页面，请联系管理员获取权限</div>
      <div class="error-actions">
        <el-button type="primary" @click="goBack">返回上一页</el-button>
        <el-button @click="goHome">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.error-container {
  min-height: 100vh;
  background: $fin-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.error-content {
  text-align: center;
  max-width: 500px;

  .error-code {
    font-size: 120px;
    font-weight: 700;
    color: $fin-primary;
    line-height: 1;
    margin-bottom: 24px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .error-title {
    font-size: 28px;
    font-weight: 600;
    color: $fin-text-primary;
    margin-bottom: 16px;
  }

  .error-desc {
    font-size: 16px;
    color: $fin-text-secondary;
    margin-bottom: 40px;
    line-height: 1.6;
  }

  .error-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
  }
}
</style>
