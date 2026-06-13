<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <div class="error-message">抱歉，您访问的页面不存在</div>
      <div class="error-desc">请检查您输入的网址是否正确，或点击下方按钮返回首页</div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">
          <el-icon><HomeFilled /></el-icon>
          返回首页
        </el-button>
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回上页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $background-color;
  padding: 20px;

  .error-content {
    text-align: center;
    max-width: 500px;

    .error-code {
      font-size: 120px;
      font-weight: bold;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
      margin-bottom: 20px;
    }

    .error-message {
      font-size: 24px;
      color: $text-primary;
      margin-bottom: 12px;
      font-weight: 600;
    }

    .error-desc {
      font-size: 14px;
      color: $text-secondary;
      margin-bottom: 40px;
      line-height: 1.6;
    }

    .error-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
    }
  }
}
</style>
