<template>
  <div class="ccb-error-page">
    <el-result
      icon="error"
      title="500"
      sub-title="抱歉，服务器发生错误"
    >
      <template #extra>
        <el-button type="primary" @click="goHome">返回首页</el-button>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = (): void => {
  router.push('/')
}
</script>

<style lang="scss" scoped>
.ccb-error-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f2f5;
}
</style>
