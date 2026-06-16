<template>
  <div class="error-page flex-center flex-col">
    <el-result
      icon="warning"
      title="404"
      sub-title="抱歉，您访问的页面不存在"
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

const goHome = () => {
  router.replace('/')
}
</script>

<style lang="scss" scoped>
.error-page {
  width: 100%;
  min-height: 100vh;
  background-color: $bg-body;
}
</style>
