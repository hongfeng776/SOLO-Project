<template>
  <div class="dashboard-page">
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in statCards" :key="card.key">
        <div class="stat-card" :class="card.key">
          <div class="stat-icon">
            <el-icon :size="32"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-lg">
      <el-col :span="12">
        <PageContainer title="招聘概况">
          <div class="chart-placeholder">
            <el-icon :size="48" color="#d1d5db"><DataAnalysis /></el-icon>
            <p class="text-muted mt-base">招聘数据图表</p>
          </div>
        </PageContainer>
      </el-col>
      <el-col :span="12">
        <PageContainer title="最新简历">
          <div class="recent-list">
            <div v-for="i in 5" :key="i" class="recent-item">
              <el-avatar :size="40" icon="UserFilled" />
              <div class="recent-info">
                <div class="recent-name">候选人 {{ i }}</div>
                <div class="recent-desc">应聘岗位 · {{ new Date().toLocaleDateString() }}</div>
              </div>
              <el-tag size="small" type="primary">新投递</el-tag>
            </div>
          </div>
        </PageContainer>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-lg">
      <el-col :span="16">
        <PageContainer title="面试安排">
          <div class="schedule-list">
            <div v-for="i in 4" :key="i" class="schedule-item">
              <div class="schedule-time">
                <div class="time-date">{{ 10 + i }}日</div>
                <div class="time-week">周{{ ['一', '二', '三', '四'][i - 1] }}</div>
              </div>
              <div class="schedule-content">
                <div class="schedule-title">面试 - 候选人 {{ i }}</div>
                <div class="schedule-meta">
                  <span><el-icon><Clock /></el-icon> 14:00 - 15:00</span>
                  <span><el-icon><Location /></el-icon> 会议室A</span>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </el-col>
      <el-col :span="8">
        <PageContainer title="快捷操作">
          <div class="quick-actions">
            <div v-for="action in quickActions" :key="action.key" class="action-item" @click="handleAction(action.key)">
              <el-icon :size="24" :color="action.color"><component :is="action.icon" /></el-icon>
              <span>{{ action.label }}</span>
            </div>
          </div>
        </PageContainer>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  OfficeBuilding,
  Briefcase,
  Document,
  UserFilled,
  DataAnalysis,
  Clock,
  Location,
  Plus,
  Search,
} from '@element-plus/icons-vue';
import { PageContainer } from '@/components';

const router = useRouter();

const statCards = ref([
  { key: 'company', label: '企业数量', value: '12', icon: OfficeBuilding },
  { key: 'job', label: '在招岗位', value: '36', icon: Briefcase },
  { key: 'resume', label: '简历总数', value: '258', icon: Document },
  { key: 'hire', label: '已入职', value: '45', icon: UserFilled },
]);

const quickActions = ref([
  { key: 'addJob', label: '发布岗位', icon: Plus, color: '#2563eb' },
  { key: 'addResume', label: '添加简历', icon: Document, color: '#10b981' },
  { key: 'addInterview', label: '安排面试', icon: Clock, color: '#f59e0b' },
  { key: 'searchResume', label: '简历搜索', icon: Search, color: '#8b5cf6' },
]);

const handleAction = (key: string) => {
  const routes: Record<string, string> = {
    addJob: '/job',
    addResume: '/resume',
    addInterview: '/interview',
    searchResume: '/resume',
  };
  if (routes[key]) {
    router.push(routes[key]);
  }
};
</script>

<style lang="scss" scoped>
.dashboard-page {
  .stat-card {
    background: $bg-white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    display: flex;
    align-items: center;
    gap: $spacing-base;
    box-shadow: $shadow-sm;
    transition: all $transition-base;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-md;
    }

    &.company .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.job .stat-icon {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }

    &.resume .stat-icon {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    }

    &.hire .stat-icon {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: $border-radius-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }

  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: $text-primary;
      line-height: 1.2;
    }

    .stat-label {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: 4px;
    }
  }
}

.chart-placeholder {
  height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: $text-placeholder;
}

.recent-list {
  .recent-item {
    display: flex;
    align-items: center;
    gap: $spacing-base;
    padding: $spacing-sm 0;
    border-bottom: 1px solid $border-light;

    &:last-child {
      border-bottom: none;
    }
  }

  .recent-info {
    flex: 1;

    .recent-name {
      font-size: $font-size-base;
      color: $text-primary;
      font-weight: 500;
    }

    .recent-desc {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-top: 2px;
    }
  }
}

.schedule-list {
  .schedule-item {
    display: flex;
    gap: $spacing-base;
    padding: $spacing-base 0;
    border-bottom: 1px solid $border-light;

    &:last-child {
      border-bottom: none;
    }
  }

  .schedule-time {
    width: 60px;
    text-align: center;

    .time-date {
      font-size: $font-size-xl;
      font-weight: 600;
      color: $primary-color;
    }

    .time-week {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
  }

  .schedule-content {
    flex: 1;

    .schedule-title {
      font-size: $font-size-base;
      color: $text-primary;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .schedule-meta {
      display: flex;
      gap: $spacing-base;
      font-size: $font-size-sm;
      color: $text-secondary;

      span {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: $spacing-base;

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $spacing-sm;
    padding: $spacing-lg 0;
    background: $bg-light;
    border-radius: $border-radius;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      background: $primary-color;
      color: #fff;

      :deep(.el-icon) {
        color: #fff !important;
      }
    }

    span {
      font-size: $font-size-sm;
    }
  }
}
</style>
