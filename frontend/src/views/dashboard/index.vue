<template>
  <div class="dashboard-page">
    <div class="stat-cards">
      <el-row :gutter="20">
        <el-col :span="6" v-for="card in statCards" :key="card.key">
          <div class="stat-card" :class="card.key">
            <div class="card-left">
              <p class="card-label">{{ card.label }}</p>
              <p class="card-value">{{ card.value }}</p>
              <p class="card-tip" v-if="card.tip">{{ card.tip }}</p>
            </div>
            <div class="card-icon">
              <el-icon :size="32">
                <component :is="card.icon" />
              </el-icon>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="16">
        <div class="card-wrapper">
          <div class="card-header">
            <h3 class="card-title">资源增长趋势</h3>
            <el-radio-group v-model="statsDays" size="small">
              <el-radio-button :value="7">近7天</el-radio-button>
              <el-radio-button :value="30">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-placeholder">
            <el-empty description="图表组件占位" />
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card-wrapper">
          <div class="card-header">
            <h3 class="card-title">资源状态分布</h3>
          </div>
          <div class="status-distribution">
            <div class="status-item" v-for="item in statusList" :key="item.key">
              <span class="status-dot" :style="{ background: item.color }"></span>
              <span class="status-label">{{ item.label }}</span>
              <span class="status-count">{{ statusData[item.key] || 0 }}</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <h3 class="card-title">最新资源</h3>
            <el-button type="primary" text @click="goToResources">查看全部</el-button>
          </div>
          <div class="recent-list">
            <div class="recent-item" v-for="item in recentResources" :key="item.id">
              <el-image
                :src="item.coverUrl"
                fit="cover"
                class="item-cover"
              />
              <div class="item-info">
                <p class="item-title text-ellipsis">{{ item.title }}</p>
                <p class="item-meta">
                  <span>{{ item.authorName }}</span>
                  <span class="dot">·</span>
                  <span>{{ formatDate(item.createdAt) }}</span>
                </p>
              </div>
              <StatusTag :status="item.status" type="resource" />
            </div>
            <EmptyState v-if="recentResources.length === 0" type="image" />
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <h3 class="card-title">最近审核</h3>
            <el-button type="primary" text @click="goToAudit">查看全部</el-button>
          </div>
          <div class="recent-list">
            <div class="recent-item" v-for="item in recentAudits" :key="item.id">
              <el-avatar :size="40">
                {{ item.auditorName?.charAt(0) || 'A' }}
              </el-avatar>
              <div class="item-info">
                <p class="item-title text-ellipsis">{{ item.resourceTitle }}</p>
                <p class="item-meta">
                  <span>{{ item.auditorName }}</span>
                  <span class="dot">·</span>
                  <span>{{ item.auditResult === 'approved' ? '通过' : '拒绝' }}</span>
                </p>
              </div>
              <span class="audit-time">{{ formatDate(item.auditTime) }}</span>
            </div>
            <EmptyState v-if="recentAudits.length === 0" type="data" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Picture,
  VideoCamera,
  User,
  Clock
} from '@element-plus/icons-vue'
import { StatusTag, EmptyState } from '@/components/business'
import { getStatistics, getStatusDistribution, getRecentResources, getRecentAudits } from '@/api/dashboard'

const router = useRouter()

const statsDays = ref(7)
const statistics = ref<any>({})
const statusData = ref<any>({})
const recentResources = ref<any[]>([])
const recentAudits = ref<any[]>([])

const statCards = computed(() => [
  {
    key: 'resource',
    label: '影像资源',
    value: statistics.value.resourceCount || 0,
    tip: `今日新增 ${statistics.value.todayResourceCount || 0}`,
    icon: Picture,
    color: '#409eff'
  },
  {
    key: 'template',
    label: '特效模板',
    value: statistics.value.templateCount || 0,
    tip: '持续更新中',
    icon: VideoCamera,
    color: '#67c23a'
  },
  {
    key: 'user',
    label: '平台用户',
    value: statistics.value.userCount || 0,
    tip: `今日新增 ${statistics.value.todayUserCount || 0}`,
    icon: User,
    color: '#e6a23c'
  },
  {
    key: 'audit',
    label: '待审核',
    value: statistics.value.pendingAuditCount || 0,
    tip: '需要及时处理',
    icon: Clock,
    color: '#f56c6c'
  }
])

const statusList = [
  { key: 'draft', label: '草稿', color: '#909399' },
  { key: 'pending', label: '待审核', color: '#e6a23c' },
  { key: 'approved', label: '审核通过', color: '#67c23a' },
  { key: 'rejected', label: '审核拒绝', color: '#f56c6c' },
  { key: 'published', label: '已发布', color: '#409eff' },
  { key: 'offline', label: '已下架', color: '#c0c4cc' }
]

const fetchData = async () => {
  try {
    const [statsRes, statusRes, resourcesRes, auditsRes] = await Promise.all([
      getStatistics(),
      getStatusDistribution(),
      getRecentResources(),
      getRecentAudits()
    ])
    statistics.value = statsRes.data
    statusData.value = statusRes.data
    recentResources.value = resourcesRes.data
    recentAudits.value = auditsRes.data
  } catch (error) {
    console.error('获取数据失败:', error)
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

const goToResources = () => {
  router.push('/resources/image')
}

const goToAudit = () => {
  router.push('/audit/records')
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.dashboard-page {
  .stat-cards {
    .stat-card {
      background: $bg-color-ffffff;
      border-radius: $border-radius-large;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: $shadow-light;
      transition: transform $transition-duration, box-shadow $transition-duration;

      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-medium;
      }

      .card-left {
        .card-label {
          font-size: $font-size-base;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .card-value {
          font-size: 28px;
          font-weight: 700;
          color: $text-primary;
          margin-bottom: 4px;
        }

        .card-tip {
          font-size: $font-size-extra-small;
          color: $text-secondary;
        }
      }

      .card-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }

      &.resource .card-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.template .card-icon {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.user .card-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.audit .card-icon {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .card-title {
      font-size: $font-size-medium;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .chart-placeholder {
    height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .status-distribution {
    .status-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid $border-color-extra-light;

      &:last-child {
        border-bottom: none;
      }

      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 10px;
      }

      .status-label {
        flex: 1;
        font-size: $font-size-base;
        color: $text-regular;
      }

      .status-count {
        font-size: $font-size-medium;
        font-weight: 600;
        color: $text-primary;
      }
    }
  }

  .recent-list {
    .recent-item {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid $border-color-extra-light;

      &:last-child {
        border-bottom: none;
      }

      .item-cover {
        width: 50px;
        height: 50px;
        border-radius: $border-radius;
        margin-right: 12px;
        flex-shrink: 0;
        object-fit: cover;
      }

      .item-info {
        flex: 1;
        min-width: 0;

        .item-title {
          font-size: $font-size-base;
          color: $text-regular;
          margin-bottom: 4px;
        }

        .item-meta {
          font-size: $font-size-extra-small;
          color: $text-secondary;

          .dot {
            margin: 0 4px;
          }
        }
      }

      .audit-time {
        font-size: $font-size-extra-small;
        color: $text-secondary;
        flex-shrink: 0;
      }
    }
  }

  .mt-20 {
    margin-top: 20px;
  }
}
</style>
