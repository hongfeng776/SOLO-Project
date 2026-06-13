<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6" v-for="card in statCards" :key="card.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">{{ card.label }}</p>
              <p class="stat-value">{{ card.value }}</p>
              <p class="stat-change" :class="card.trend">
                <el-icon>
                  <component :is="trendIcons[card.trend]" />
                </el-icon>
                {{ card.change }}
              </p>
            </div>
            <div class="stat-icon" :class="card.iconClass">
              <el-icon :size="32">
                <component :is="card.icon" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-header">最近活动</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in activities"
              :key="index"
              :timestamp="activity.time"
              placement="top"
            >
              <el-card shadow="hover">
                <h4>{{ activity.title }}</h4>
                <p>{{ activity.content }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span class="card-header">欢迎使用</span>
          </template>
          <div class="welcome-content">
            <el-avatar :size="80">
              {{ userStore.userInfo?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <h2 class="welcome-title">
              您好，{{ userStore.userInfo?.nickname || '用户' }}！
            </h2>
            <p class="welcome-desc">
              欢迎来到红境系统，请开始您的工作。
            </p>
            <el-button type="primary" class="welcome-btn">
              开始使用
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  User,
  Goods,
  ShoppingCart,
  Money,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'

const userStore = useUserStore()

const trendIcons = {
  up: CaretTop,
  down: CaretBottom
}

const statCards = ref([
  {
    title: 'users',
    label: '用户总数',
    value: '12,345',
    change: '+12%',
    trend: 'up' as const,
    icon: User,
    iconClass: 'icon-blue'
  },
  {
    title: 'orders',
    label: '订单总数',
    value: '8,567',
    change: '+8%',
    trend: 'up' as const,
    icon: ShoppingCart,
    iconClass: 'icon-green'
  },
  {
    title: 'products',
    label: '产品总数',
    value: '2,345',
    change: '-3%',
    trend: 'down' as const,
    icon: Goods,
    iconClass: 'icon-orange'
  },
  {
    title: 'revenue',
    label: '总收入',
    value: '¥567,890',
    change: '+15%',
    trend: 'up' as const,
    icon: Money,
    iconClass: 'icon-purple'
  }
])

const activities = ref([
  {
    title: '系统更新',
    content: '系统已更新到最新版本 v1.0.0',
    time: '2026-06-12 10:30:00'
  },
  {
    title: '新用户注册',
    content: '用户张三完成注册并激活账号',
    time: '2026-06-11 15:20:00'
  },
  {
    title: '数据备份',
    content: '系统自动备份完成，数据安全',
    time: '2026-06-11 02:00:00'
  }
])
</script>

<style scoped lang="scss">
.dashboard {
  .stat-card {
    border-radius: 8px;

    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .stat-info {
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin: 0 0 8px 0;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          margin: 0 0 8px 0;
        }

        .stat-change {
          font-size: 12px;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 2px;

          &.up {
            color: #67c23a;
          }

          &.down {
            color: #f56c6c;
          }
        }
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.icon-blue {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.icon-green {
          background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        &.icon-orange {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.icon-purple {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
      }
    }
  }

  .mt-20 {
    margin-top: 20px;
  }

  .card-header {
    font-weight: 600;
    font-size: 16px;
  }

  .welcome-content {
    text-align: center;
    padding: 40px 20px;

    .welcome-title {
      font-size: 24px;
      color: #303133;
      margin: 16px 0 8px 0;
    }

    .welcome-desc {
      font-size: 14px;
      color: #909399;
      margin: 0 0 24px 0;
    }

    .welcome-btn {
      padding: 12px 40px;
      font-size: 16px;
    }
  }
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
