<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <el-icon :size="120" color="#F56C6C" class="error-icon"><Warning /></el-icon>
      <h1 class="error-title">403</h1>
      <p class="error-desc">抱歉，您没有权限访问该页面</p>
      <div class="error-actions">
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-page;
}

.error-content {
  text-align: center;
  padding: 60px;
}

.error-icon {
  margin-bottom: 24px;
}

.error-title {
  font-size: 64px;
  font-weight: 700;
  color: $text-primary;
  margin: 0 0 16px;
}

.error-desc {
  font-size: $font-md;
  color: $text-secondary;
  margin: 0 0 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
