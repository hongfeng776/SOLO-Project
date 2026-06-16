<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-title">页面不存在</p>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
        <el-button @click="history.back()">返回上一页</el-button>
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

.error-code {
  font-size: 180px;
  font-weight: 700;
  line-height: 1;
  margin: 0 0 24px;
  background: linear-gradient(135deg, $primary-color, #79bbff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.error-title {
  font-size: $font-2xl;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 12px;
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
