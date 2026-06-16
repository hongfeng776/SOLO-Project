<template>
  <div class="not-found">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-message">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.not-found {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color-page;

  .error-content {
    text-align: center;

    .error-code {
      font-size: 120px;
      font-weight: 700;
      color: $primary-color;
      line-height: 1;
      margin-bottom: 20px;
    }

    .error-message {
      font-size: $font-size-large;
      color: $text-secondary;
      margin-bottom: 32px;
    }
  }
}
</style>
