<template>
  <div class="dashboard-container">
    <div class="page-header">
      <div class="page-header-title">
        <el-icon :size="24" color="#409EFF"><DataAnalysis /></el-icon>
        <span>工作台</span>
      </div>
      <div class="welcome-text">
        欢迎回来，<b>{{ userStore.nickname || userStore.username }}</b>，今天是 {{ currentDate }}
      </div>
    </div>

    <el-row :gutter="20" class="stats-row mb-md">
      <el-col :xs="12" :sm="12" :md="6" v-for="stat in stats" :key="stat.label">
        <div class="stat-card">
          <div class="stat-card-header">
            <el-icon :size="28" :color="stat.color">
              <component :is="stat.icon" />
            </el-icon>
            <el-tag :type="stat.tagType" effect="light" size="small">{{ stat.trend }}</el-tag>
          </div>
          <div class="stat-card-label">{{ stat.label }}</div>
          <div class="stat-card-value" :style="{ color: stat.color }">
            {{ formatNumber(stat.value) }}
          </div>
          <div class="stat-card-footer">
            <span>较上周 {{ stat.change }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16">
        <div class="panel-card">
          <div class="panel-header">
            <span class="panel-title">
              <el-icon color="#409EFF"><Document /></el-icon>
              最近任务
            </span>
            <el-button type="primary" link size="small">查看全部</el-button>
          </div>
          <div class="panel-body">
            <el-table :data="recentTasks" stripe style="width: 100%">
              <el-table-column prop="id" label="编号" width="80" />
              <el-table-column prop="title" label="任务名称" min-width="180" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.typeColor" size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.statusColor" effect="dark" size="small">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="deadline" label="截止日期" width="120" />
              <el-table-column label="操作" width="100" align="center">
                <template #default>
                  <el-button type="primary" link size="small">详情</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8">
        <div class="panel-card">
          <div class="panel-header">
            <span class="panel-title">
              <el-icon color="#67C23A"><Bell /></el-icon>
              通知公告
            </span>
          </div>
          <div class="panel-body">
            <el-timeline>
              <el-timeline-item
                v-for="(notice, index) in notices"
                :key="index"
                :timestamp="notice.time"
                :type="notice.type"
                placement="top"
              >
                <div class="notice-item">
                  <div class="notice-title">{{ notice.title }}</div>
                  <div class="notice-content">{{ notice.content }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { useUserStore } from '@/stores'
import { formatNumber, formatDate } from '@/utils'
import {
  User,
  Document,
  DataLine,
  Bell,
  Money
} from '@element-plus/icons-vue'

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger'
type TimelineType = TagType | ''

interface StatItem {
  label: string
  value: number
  trend: string
  change: string
  color: string
  tagType: TagType
  icon: Component
}

interface NoticeItem {
  title: string
  content: string
  time: string
  type: TimelineType
}

const userStore = useUserStore()

const currentDate = computed(() => formatDate(new Date(), 'YYYY年MM月DD日'))

const stats = ref<StatItem[]>([
  {
    label: '待处理简历',
    value: 128,
    trend: '+12%',
    change: '+14',
    color: '#409EFF',
    tagType: 'success',
    icon: Document
  },
  {
    label: '今日面试',
    value: 16,
    trend: '+8%',
    change: '+1',
    color: '#67C23A',
    tagType: 'success',
    icon: User
  },
  {
    label: '本月Offer',
    value: 42,
    trend: '+23%',
    change: '+8',
    color: '#E6A23C',
    tagType: 'success',
    icon: DataLine
  },
  {
    label: '招聘预算',
    value: 268000,
    trend: '预算内',
    change: '剩余42%',
    color: '#F56C6C',
    tagType: 'warning',
    icon: Money
  }
])

const recentTasks = ref([
  {
    id: 'T001',
    title: '前端开发工程师简历筛选',
    type: '筛选',
    typeColor: 'primary',
    status: '进行中',
    statusColor: 'primary',
    deadline: '2026-06-15'
  },
  {
    id: 'T002',
    title: '产品经理终面安排',
    type: '面试',
    typeColor: 'success',
    status: '待开始',
    statusColor: 'warning',
    deadline: '2026-06-14'
  },
  {
    id: 'T003',
    title: 'Java开发Offer发放',
    type: 'Offer',
    typeColor: 'warning',
    status: '已完成',
    statusColor: 'success',
    deadline: '2026-06-12'
  },
  {
    id: 'T004',
    title: 'UI设计师笔试阅卷',
    type: '笔试',
    typeColor: 'info',
    status: '进行中',
    statusColor: 'primary',
    deadline: '2026-06-16'
  }
])

const notices = ref<NoticeItem[]>([
  {
    title: 'Q3招聘计划已发布',
    content: '请各部门负责人查看并确认招聘需求',
    time: '2小时前',
    type: 'primary'
  },
  {
    title: '新员工入职培训',
    content: '6月20日下午2点，会议室A',
    time: '5小时前',
    type: 'success'
  },
  {
    title: '系统升级通知',
    content: '本周六凌晨2-4点系统维护升级',
    time: '1天前',
    type: 'warning'
  },
  {
    title: '年度绩效评估',
    content: '请在6月30日前完成评估提交',
    time: '2天前',
    type: 'info'
  }
])
</script>

<style lang="scss" scoped>
.dashboard-container {
  width: 100%;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .page-header-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 20px;
    font-weight: 600;
    color: #303133;
  }

  .welcome-text {
    color: #909399;
    font-size: 14px;

    b {
      color: #409eff;
    }
  }
}

.stats-row {
  .stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    transition: all 0.3s;
    border: 1px solid #f0f0f0;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    &-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    &-label {
      font-size: 13px;
      color: #909399;
      margin-bottom: 8px;
    }

    &-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 8px;
    }

    &-footer {
      font-size: 12px;
      color: #c0c4cc;
    }
  }
}

.panel-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;

  & + & {
    margin-top: 20px;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f5f5f5;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.panel-body {
  padding: 16px 20px;
}

.notice-item {
  .notice-title {
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
  }

  .notice-content {
    font-size: 12px;
    color: #909399;
  }
}

.mb-md {
  margin-bottom: 20px;
}
</style>
