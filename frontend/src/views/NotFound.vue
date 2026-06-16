<template>
  <div class="not-found">
    <div class="content">
      <h1>404</h1>
      <h2>页面未找到</h2>
      <p>抱歉，您访问的页面不存在或已被移除</p>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.not-found {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;

  .content {
    text-align: center;

    h1 {
      font-size: 120px;
      font-weight: 700;
      color: #1890ff;
      margin: 0;
      line-height: 1;
    }

    h2 {
      font-size: 32px;
      color: #333;
      margin: 20px 0 16px;
    }

    p {
      font-size: 16px;
      color: #666;
      margin-bottom: 32px;
    }
  }
}
</style>
