<template>
  <div class="error-page">
    <div class="error-container">
      <h1 class="error-code">404</h1>
      <p class="error-message">抱歉，您访问的页面不存在</p>
      <p class="error-desc">请检查您输入的网址是否正确，或返回首页继续浏览</p>
      <div class="error-actions">
        <el-button type="primary" :icon="House" @click="goHome">返回首页</el-button>
        <el-button :icon="ArrowLeft" @click="goBack">返回上一页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { House, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.go(-1)
}
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-container {
  text-align: center;
  padding: 60px;
}

.error-code {
  font-size: 160px;
  font-weight: 700;
  color: #409EFF;
  margin: 0 0 24px;
  line-height: 1;
}

.error-message {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.error-desc {
  font-size: 14px;
  color: #909399;
  margin: 0 0 40px;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
