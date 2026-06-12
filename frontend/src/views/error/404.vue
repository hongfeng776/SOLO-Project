<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const goHome = () => router.push('/');
const goBack = () => window.history.back();
</script>

<template>
  <div class="notfound-page">
    <div class="nf-wrap">
      <div class="nf-code">
        <span>4</span>
        <span class="zero">
          <svg viewBox="0 0 100 100" class="z-anim">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1677ff" stroke-width="8" stroke-linecap="round"
              stroke-dasharray="220" stroke-dashoffset="55"
              style="transform-origin: center; animation: spin 3s linear infinite" />
          </svg>
        </span>
        <span>4</span>
      </div>
      <h1 class="nf-title">页面走丢啦 😵</h1>
      <p class="nf-desc">您访问的页面不存在或已被移除</p>
      <div class="nf-actions">
        <el-button @click="goHome" type="primary" size="large">
          <el-icon><House /></el-icon>返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><Back /></el-icon>返回上一页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.notfound-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa, #e6f4ff);
  padding: $spacing-xl;
}
.nf-wrap {
  text-align: center;
  max-width: 480px;
}
.nf-code {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 160px;
  font-weight: 800;
  color: #1677ff;
  line-height: 1;
  gap: 4px;
  margin-bottom: $spacing-lg;
  text-shadow: 0 10px 40px rgba(22, 119, 255, 0.2);
  > span {
    animation: bounce 2s ease-in-out infinite;
  }
  > span:nth-child(1) { animation-delay: 0s; }
  > span:nth-child(3) { animation-delay: 0.6s; }
}
.zero {
  width: 140px;
  height: 160px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.z-anim {
  width: 120px;
  height: 120px;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}
.nf-title {
  margin: 0 0 $spacing-sm;
  font-size: $font-size-xxl;
  font-weight: 600;
  color: $color-text-primary;
}
.nf-desc {
  margin: 0 0 $spacing-xl;
  color: $color-text-secondary;
  font-size: $font-size-md;
}
.nf-actions {
  display: flex;
  gap: $spacing-md;
  justify-content: center;
}
</style>
