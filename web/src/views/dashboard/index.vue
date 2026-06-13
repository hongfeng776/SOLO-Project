<script setup lang="ts">
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()
</script>

<template>
  <div class="page-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header flex-between">
          <span>欢迎使用</span>
          <el-tag type="primary">仪表盘</el-tag>
        </div>
      </template>
      <div class="welcome-content">
        <h2>欢迎回来，{{ userStore.username }}！</h2>
        <p class="welcome-text">
          这是词研语言学习管理平台的工程基座，已打通前后端工程框架、权限体系、路由规范、全局组件与样式标准。
        </p>
        <el-divider />
        <div class="feature-list">
          <div class="feature-item">
            <el-icon :size="32" color="#409eff"><Promotion /></el-icon>
            <div class="feature-info">
              <h4>前后端分离架构</h4>
              <p>前端 Vue 3 + TypeScript + Element Plus，后端 Spring Boot 3 + MyBatis-Plus</p>
            </div>
          </div>
          <div class="feature-item">
            <el-icon :size="32" color="#67c23a"><Key /></el-icon>
            <div class="feature-info">
              <h4>JWT 权限体系</h4>
              <p>登录/登出、令牌校验、无权限接口自动拦截跳转登录页</p>
            </div>
          </div>
          <div class="feature-item">
            <el-icon :size="32" color="#e6a23c"><Menu /></el-icon>
            <div class="feature-info">
              <h4>后台基础布局</h4>
              <p>左侧导航 + 顶部头部 + 主体内容区，支持侧边栏折叠展开</p>
            </div>
          </div>
          <div class="feature-item">
            <el-icon :size="32" color="#f56c6c"><Box /></el-icon>
            <div class="feature-info">
              <h4>通用组件封装</h4>
              <p>分页、弹窗、二次确认组件，全局统一样式规范</p>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.welcome-card {
  :deep(.el-card__header) {
    padding: 20px;
  }

  :deep(.el-card__body) {
    padding: 30px;
  }
}

.welcome-content {
  h2 {
    font-size: 24px;
    color: $text-primary;
    margin-bottom: 10px;
  }

  .welcome-text {
    font-size: 14px;
    color: $text-regular;
    line-height: 1.8;
  }
}

.feature-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: $background-light;
    border-radius: 8px;
    transition: transform $transition-duration, box-shadow $transition-duration;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    .feature-info {
      flex: 1;

      h4 {
        font-size: 16px;
        color: $text-primary;
        margin-bottom: 8px;
      }

      p {
        font-size: 13px;
        color: $text-secondary;
        line-height: 1.6;
      }
    }
  }
}
</style>
