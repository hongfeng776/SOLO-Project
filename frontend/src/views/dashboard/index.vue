<template>
  <div class="dashboard-page" v-loading="pageLoading">
    <el-row :gutter="16" class="stat-cards">
      <el-col :xs="12" :sm="8" :md="4" v-for="card in statCards" :key="card.key">
        <div class="stat-card" :class="card.key">
          <div class="card-left">
            <p class="card-label">{{ card.label }}</p>
            <p class="card-value">{{ formatNumber(card.value) }}</p>
            <p class="card-tip" v-if="card.tip">{{ card.tip }}</p>
          </div>
          <div class="card-icon">
            <el-icon :size="28"><component :is="card.icon" /></el-icon>
            <span v-if="card.alert && card.value > 0" class="alert-badge">!</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">资源增长趋势</h3>
              <span class="card-subtitle">最近7天每日新增资源数</span>
            </div>
          </template>
          <div class="bar-chart">
            <div class="bar-chart-body">
              <div class="bar-item" v-for="item in resourceStats" :key="item.date">
                <div class="bar-fill" :style="{ height: getBarHeight(item.count, maxResourceCount) }">
                  <span class="bar-value" v-if="item.count > 0">{{ item.count }}</span>
                </div>
                <span class="bar-label">{{ formatShortDate(item.date) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">用户活跃度趋势</h3>
              <span class="card-subtitle">最近7天</span>
            </div>
          </template>
          <div class="line-chart">
            <div class="line-legend">
              <span class="legend-item"><i style="background:#409eff"></i>新增用户</span>
              <span class="legend-item"><i style="background:#67c23a"></i>新增资源</span>
              <span class="legend-item"><i style="background:#e6a23c"></i>新增审核</span>
            </div>
            <div class="line-chart-body">
              <svg class="line-svg" viewBox="0 0 700 200" preserveAspectRatio="none">
                <polyline :points="buildLinePoints(userActivityStats, 'newUsers', maxActivityVal)" fill="none" stroke="#409eff" stroke-width="2" />
                <polyline :points="buildLinePoints(userActivityStats, 'newResources', maxActivityVal)" fill="none" stroke="#67c23a" stroke-width="2" />
                <polyline :points="buildLinePoints(userActivityStats, 'newAudits', maxActivityVal)" fill="none" stroke="#e6a23c" stroke-width="2" />
              </svg>
              <div class="line-labels">
                <span v-for="item in userActivityStats" :key="item.date">{{ formatShortDate(item.date) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">资源状态分布</h3>
            </div>
          </template>
          <div class="horizontal-bar-list">
            <div class="h-bar-item" v-for="item in statusBarData" :key="item.key">
              <span class="h-bar-label">{{ item.label }}</span>
              <div class="h-bar-track">
                <div class="h-bar-fill" :style="{ width: getBarWidth(item.count, maxStatusCount), background: item.color }"></div>
              </div>
              <span class="h-bar-value">{{ formatNumber(item.count) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">分类资源分布</h3>
            </div>
          </template>
          <div class="horizontal-bar-list">
            <div class="h-bar-item" v-for="item in categoryBarData" :key="item.categoryId">
              <span class="h-bar-label">{{ item.categoryName }}</span>
              <div class="h-bar-track">
                <div class="h-bar-fill category-fill" :style="{ width: getBarWidth(item.count, maxCategoryCount) }"></div>
              </div>
              <span class="h-bar-value">{{ formatNumber(item.count) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">热门资源 TOP10</h3>
            </div>
          </template>
          <div class="rank-list">
            <div class="rank-item" v-for="(item, idx) in hotRankList" :key="item.id">
              <span class="rank-no" :class="{ top: idx < 3 }">{{ idx + 1 }}</span>
              <span class="rank-title text-ellipsis">{{ item.title }}</span>
              <el-tag size="small" type="info">{{ FileTypeLabel[item.fileType] || item.fileType }}</el-tag>
              <span class="rank-stat"><el-icon><View /></el-icon>{{ formatNumber(item.viewCount) }}</span>
              <span class="rank-stat"><el-icon><Download /></el-icon>{{ formatNumber(item.downloadCount) }}</span>
            </div>
            <el-empty v-if="hotRankList.length === 0" description="暂无数据" :image-size="60" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">会员等级分布</h3>
            </div>
          </template>
          <div class="member-section">
            <div class="member-summary">
              <div class="summary-item">
                <span class="summary-value">{{ formatNumber(memberStats.todayNewMembers) }}</span>
                <span class="summary-label">今日新增</span>
              </div>
              <div class="summary-item">
                <span class="summary-value">{{ formatNumber(memberStats.todayConsume) }}</span>
                <span class="summary-label">今日消费</span>
              </div>
            </div>
            <div class="horizontal-bar-list">
              <div class="h-bar-item" v-for="item in memberLevelData" :key="item.level">
                <span class="h-bar-label">{{ MemberLevelLabel[item.level] || item.level }}</span>
                <div class="h-bar-track">
                  <div class="h-bar-fill member-fill" :style="{ width: getBarWidth(item.count, maxMemberCount) }"></div>
                </div>
                <span class="h-bar-value">{{ formatNumber(item.count) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">违规概览</h3>
              <el-tag v-if="violationData.pendingCount > 0" type="danger" size="small">
                待处理 {{ violationData.pendingCount }}
              </el-tag>
            </div>
          </template>
          <div class="horizontal-bar-list">
            <div class="h-bar-item" v-for="item in violationTypeBarData" :key="item.type">
              <span class="h-bar-label">{{ ViolationTypeLabel[item.type] || item.type }}</span>
              <div class="h-bar-track">
                <div class="h-bar-fill violation-fill" :style="{ width: getBarWidth(item.count, maxViolationCount) }"></div>
              </div>
              <span class="h-bar-value">{{ formatNumber(item.count) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">审核效率</h3>
            </div>
          </template>
          <div class="audit-efficiency">
            <div class="ring-chart">
              <svg viewBox="0 0 120 120" class="ring-svg">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#f0f2f5" stroke-width="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#67c23a" stroke-width="10"
                  :stroke-dasharray="ringDash(auditPassRate)"
                  stroke-dashoffset="0"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)" />
              </svg>
              <div class="ring-text">
                <span class="ring-value">{{ auditPassRate }}%</span>
                <span class="ring-label">通过率</span>
              </div>
            </div>
            <div class="audit-stats-detail">
              <div class="detail-row">
                <span class="detail-label">今日审核</span>
                <span class="detail-value">{{ formatNumber(logStats.todayOperations) }} 次</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">审核通过</span>
                <span class="detail-value success">{{ formatNumber(conversionData.todayAuditPassed) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">审核总量</span>
                <span class="detail-value">{{ formatNumber(conversionData.todayTotalAudited) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="24">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <h3 class="card-title">转化数据</h3>
              <span class="card-subtitle">近7天汇总</span>
            </div>
          </template>
          <div class="conversion-section">
            <div class="conversion-item">
              <div class="conv-header">
                <span class="conv-label">资源发布转化率</span>
                <span class="conv-rate">{{ conversionData.publishRate }}%</span>
              </div>
              <div class="conv-track">
                <div class="conv-fill blue" :style="{ width: conversionData.publishRate + '%' }"></div>
              </div>
              <div class="conv-detail">
                已发布 {{ formatNumber(conversionData.todayPublished) }} / 提交 {{ formatNumber(conversionData.todayTotalSubmitted) }}
              </div>
            </div>
            <div class="conversion-item">
              <div class="conv-header">
                <span class="conv-label">审核通过率</span>
                <span class="conv-rate">{{ conversionData.auditPassRate }}%</span>
              </div>
              <div class="conv-track">
                <div class="conv-fill green" :style="{ width: conversionData.auditPassRate + '%' }"></div>
              </div>
              <div class="conv-detail">
                通过 {{ formatNumber(conversionData.todayAuditPassed) }} / 审核 {{ formatNumber(conversionData.todayTotalAudited) }}
              </div>
            </div>
            <div class="conversion-item">
              <div class="conv-header">
                <span class="conv-label">用户注册转化</span>
                <span class="conv-rate">{{ conversionData.registerRate }}%</span>
              </div>
              <div class="conv-track">
                <div class="conv-fill orange" :style="{ width: conversionData.registerRate + '%' }"></div>
              </div>
              <div class="conv-detail">
                注册 {{ formatNumber(conversionData.todayRegistered) }} / 访问 {{ formatNumber(conversionData.todayTotalVisitors) }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  Picture, MagicStick, User, Medal, Clock, Warning,
  View, Download
} from '@element-plus/icons-vue'
import {
  ResourceStatusLabel, FileTypeLabel, MemberLevelLabel, ViolationTypeLabel
} from '@/constants'
import {
  getStatistics, getStatusDistribution, getResourceStats,
  getResourceHotRank, getUserActivityStats, getMemberStats,
  getCategoryStats, getViolationOverview, getOperationLogStats,
  getConversionStats
} from '@/api/dashboard'
import type {
  DashboardStatistics, ResourceStatsItem,
  HotRankItem, UserActivityStats, MemberStatsData,
  CategoryStatsItem, ViolationOverviewData, OperationLogStatsData,
  ConversionStatsData
} from '@/types'

const pageLoading = ref(false)
const statistics = ref<DashboardStatistics>({
  resourceCount: 0, templateCount: 0, userCount: 0, memberCount: 0,
  pendingAuditCount: 0, todayResourceCount: 0, todayUserCount: 0,
  violationCount: 0, pendingAppealCount: 0, todayActiveUserCount: 0, hotResourceCount: 0
})
const statusData = ref<Record<string, number>>({
  draft: 0, pending: 0, approved: 0, rejected: 0, published: 0, offline: 0
})
const resourceStats = ref<ResourceStatsItem[]>([])
const hotRankList = ref<HotRankItem[]>([])
const userActivityStats = ref<UserActivityStats[]>([])
const memberStats = ref<MemberStatsData>({
  totalMembers: 0, todayNewMembers: 0, todayConsume: 0, levelDistribution: []
})
const categoryStats = ref<CategoryStatsItem[]>([])
const violationData = ref<ViolationOverviewData>({
  totalCount: 0, pendingCount: 0, byType: {}, byLevel: {}
})
const logStats = ref<OperationLogStatsData>({
  totalOperations: 0, todayOperations: 0, byModule: {}, dailyStats: []
})
const conversionData = ref<ConversionStatsData>({
  publishRate: 0, auditPassRate: 0, registerRate: 0,
  todayPublished: 0, todayTotalSubmitted: 0,
  todayAuditPassed: 0, todayTotalAudited: 0,
  todayRegistered: 0, todayTotalVisitors: 0
})

const statCards = computed(() => [
  { key: 'resource', label: '资源总数', value: statistics.value.resourceCount, tip: `今日新增 ${statistics.value.todayResourceCount}`, icon: Picture, alert: false },
  { key: 'template', label: '模板总数', value: statistics.value.templateCount, tip: '持续更新中', icon: MagicStick, alert: false },
  { key: 'user', label: '用户总数', value: statistics.value.userCount, tip: `今日新增 ${statistics.value.todayUserCount}`, icon: User, alert: false },
  { key: 'member', label: '会员总数', value: statistics.value.memberCount, tip: '', icon: Medal, alert: false },
  { key: 'audit', label: '待审核数', value: statistics.value.pendingAuditCount, tip: '需要及时处理', icon: Clock, alert: true },
  { key: 'violation', label: '违规总数', value: statistics.value.violationCount, tip: '风控监控中', icon: Warning, alert: true }
])

const statusList = [
  { key: 'draft', label: ResourceStatusLabel.draft, color: '#909399' },
  { key: 'pending', label: ResourceStatusLabel.pending, color: '#e6a23c' },
  { key: 'approved', label: ResourceStatusLabel.approved, color: '#67c23a' },
  { key: 'rejected', label: ResourceStatusLabel.rejected, color: '#f56c6c' },
  { key: 'published', label: ResourceStatusLabel.published, color: '#409eff' },
  { key: 'offline', label: ResourceStatusLabel.offline, color: '#c0c4cc' }
]

const maxResourceCount = computed(() => Math.max(...resourceStats.value.map(i => i.count), 1))

const statusBarData = computed(() =>
  statusList.map(s => ({ ...s, count: (statusData.value as any)[s.key] || 0 }))
)
const maxStatusCount = computed(() => Math.max(...statusBarData.value.map(i => i.count), 1))

const categoryBarData = computed(() => categoryStats.value)
const maxCategoryCount = computed(() => Math.max(...categoryStats.value.map(i => i.count), 1))

const memberLevelData = computed(() => memberStats.value.levelDistribution || [])
const maxMemberCount = computed(() => Math.max(...memberLevelData.value.map(i => i.count), 1))

const violationTypeBarData = computed(() =>
  Object.entries(violationData.value.byType || {}).map(([type, count]) => ({ type, count }))
)
const maxViolationCount = computed(() => Math.max(...violationTypeBarData.value.map(i => i.count), 1))

const maxActivityVal = computed(() => {
  const all = [
    ...userActivityStats.value.map(i => i.newUsers),
    ...userActivityStats.value.map(i => i.newResources),
    ...userActivityStats.value.map(i => i.newAudits)
  ]
  return Math.max(...all, 1)
})

const auditPassRate = computed(() => conversionData.value.auditPassRate || 0)

const formatNumber = (n: number | undefined) => {
  if (n == null) return '0'
  return n.toLocaleString('zh-CN')
}

const formatShortDate = (date: string) => {
  if (!date) return ''
  return date.substring(5)
}

const getBarHeight = (val: number, max: number) => {
  if (max === 0) return '0%'
  return Math.max((val / max) * 100, 0) + '%'
}

const getBarWidth = (val: number, max: number) => {
  if (max === 0) return '0%'
  return Math.max((val / max) * 100, 0) + '%'
}

const buildLinePoints = (data: UserActivityStats[], field: keyof UserActivityStats, maxVal: number) => {
  if (!data.length) return ''
  const w = 700
  const h = 180
  const padY = 10
  const step = w / (data.length - 1 || 1)
  return data.map((item, i) => {
    const x = i * step
    const val = item[field] as number
    const y = h - padY - ((val / maxVal) * (h - padY * 2))
    return `${x},${y}`
  }).join(' ')
}

const ringDash = (rate: number) => {
  const circumference = 2 * Math.PI * 50
  const filled = (rate / 100) * circumference
  return `${filled} ${circumference}`
}

const fetchAllData = async () => {
  pageLoading.value = true
  try {
    const [
      statsRes, statusRes, resourceRes,
      hotRankRes, activityRes, memberRes,
      categoryRes, violationRes, logRes, conversionRes
    ] = await Promise.all([
      getStatistics(),
      getStatusDistribution(),
      getResourceStats(7),
      getResourceHotRank(10),
      getUserActivityStats(7),
      getMemberStats(),
      getCategoryStats(),
      getViolationOverview(),
      getOperationLogStats(7),
      getConversionStats(7)
    ])
    statistics.value = statsRes.data
    statusData.value = statusRes.data
    resourceStats.value = resourceRes.data
    hotRankList.value = hotRankRes.data
    userActivityStats.value = activityRes.data
    memberStats.value = memberRes.data
    categoryStats.value = categoryRes.data
    violationData.value = violationRes.data
    logStats.value = logRes.data
    conversionData.value = conversionRes.data
  } catch (error) {
    console.error('获取看板数据失败:', error)
  } finally {
    pageLoading.value = false
  }
}

onMounted(() => {
  fetchAllData()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.dashboard-page {
  .mt-16 {
    margin-top: 16px;
  }

  .stat-cards {
    .stat-card {
      background: $bg-color-ffffff;
      border-radius: $border-radius-large;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: $shadow-light;
      transition: transform $transition-duration, box-shadow $transition-duration;
      position: relative;

      &:hover {
        transform: translateY(-2px);
        box-shadow: $shadow-medium;
      }

      .card-left {
        .card-label {
          font-size: $font-size-small;
          color: $text-secondary;
          margin-bottom: 6px;
        }

        .card-value {
          font-size: 24px;
          font-weight: 700;
          color: $text-primary;
          margin-bottom: 2px;
        }

        .card-tip {
          font-size: $font-size-extra-small;
          color: $text-secondary;
        }
      }

      .card-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        position: relative;
      }

      .alert-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        width: 16px;
        height: 16px;
        background: #f56c6c;
        color: #fff;
        border-radius: 50%;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }

      &.resource .card-icon { background: linear-gradient(135deg, #409eff, #337ecc); }
      &.template .card-icon { background: linear-gradient(135deg, #67c23a, #529b2e); }
      &.user .card-icon { background: linear-gradient(135deg, #e6a23c, #b88230); }
      &.member .card-icon { background: linear-gradient(135deg, #f7ba2a, #c99613); }
      &.audit .card-icon { background: linear-gradient(135deg, #f56c6c, #c45656); }
      &.violation .card-icon { background: linear-gradient(135deg, #9b59b6, #7d3c98); }
    }
  }

  .chart-card {
    :deep(.el-card__header) {
      padding: 12px 20px;
      border-bottom: 1px solid $border-color-extra-light;
    }
    :deep(.el-card__body) {
      padding: 16px 20px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: $font-size-medium;
      font-weight: 600;
      color: $text-primary;
    }

    .card-subtitle {
      font-size: $font-size-extra-small;
      color: $text-secondary;
    }
  }

  .bar-chart {
    height: 220px;

    .bar-chart-body {
      display: flex;
      align-items: flex-end;
      height: 180px;
      gap: 8px;
      padding-bottom: 24px;
      position: relative;

      .bar-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        justify-content: flex-end;
        position: relative;

        .bar-fill {
          width: 100%;
          max-width: 40px;
          background: linear-gradient(180deg, #409eff, #79bbff);
          border-radius: 4px 4px 0 0;
          min-height: 2px;
          transition: height 0.5s ease;
          position: relative;

          .bar-value {
            position: absolute;
            top: -18px;
            left: 50%;
            transform: translateX(-50%);
            font-size: $font-size-extra-small;
            color: $text-regular;
            white-space: nowrap;
          }
        }

        .bar-label {
          position: absolute;
          bottom: -22px;
          font-size: $font-size-extra-small;
          color: $text-secondary;
          white-space: nowrap;
        }
      }
    }
  }

  .line-chart {
    .line-legend {
      display: flex;
      gap: 16px;
      margin-bottom: 8px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: $font-size-extra-small;
        color: $text-secondary;

        i {
          width: 12px;
          height: 3px;
          border-radius: 2px;
          display: inline-block;
        }
      }
    }

    .line-chart-body {
      position: relative;
      height: 200px;

      .line-svg {
        width: 100%;
        height: 180px;
      }

      .line-labels {
        display: flex;
        justify-content: space-between;
        padding: 4px 0 0;

        span {
          font-size: $font-size-extra-small;
          color: $text-secondary;
        }
      }
    }
  }

  .horizontal-bar-list {
    .h-bar-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .h-bar-label {
        width: 80px;
        font-size: $font-size-small;
        color: $text-regular;
        flex-shrink: 0;
      }

      .h-bar-track {
        flex: 1;
        height: 16px;
        background: #f0f2f5;
        border-radius: 8px;
        overflow: hidden;
        margin: 0 10px;

        .h-bar-fill {
          height: 100%;
          border-radius: 8px;
          transition: width 0.5s ease;
          min-width: 2px;

          &.category-fill {
            background: linear-gradient(90deg, #409eff, #79bbff);
          }

          &.member-fill {
            background: linear-gradient(90deg, #f7ba2a, #ffd666);
          }

          &.violation-fill {
            background: linear-gradient(90deg, #f56c6c, #fab6b6);
          }
        }
      }

      .h-bar-value {
        width: 50px;
        text-align: right;
        font-size: $font-size-small;
        font-weight: 600;
        color: $text-primary;
        flex-shrink: 0;
      }
    }
  }

  .rank-list {
    .rank-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid $border-color-extra-light;
      gap: 8px;

      &:last-child {
        border-bottom: none;
      }

      .rank-no {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: #f0f2f5;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $font-size-extra-small;
        color: $text-secondary;
        flex-shrink: 0;

        &.top {
          background: linear-gradient(135deg, #f7ba2a, #e6a23c);
          color: #fff;
          font-weight: 700;
        }
      }

      .rank-title {
        flex: 1;
        font-size: $font-size-base;
        color: $text-regular;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rank-stat {
        display: flex;
        align-items: center;
        gap: 2px;
        font-size: $font-size-extra-small;
        color: $text-secondary;
        flex-shrink: 0;
      }
    }
  }

  .member-section {
    .member-summary {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid $border-color-extra-light;

      .summary-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .summary-value {
          font-size: 20px;
          font-weight: 700;
          color: $text-primary;
        }

        .summary-label {
          font-size: $font-size-extra-small;
          color: $text-secondary;
          margin-top: 2px;
        }
      }
    }
  }

  .audit-efficiency {
    display: flex;
    align-items: center;
    gap: 32px;

    .ring-chart {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;

      .ring-svg {
        width: 100%;
        height: 100%;
      }

      .ring-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;

        .ring-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: $text-primary;
        }

        .ring-label {
          display: block;
          font-size: $font-size-extra-small;
          color: $text-secondary;
        }
      }
    }

    .audit-stats-detail {
      flex: 1;

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid $border-color-extra-light;

        &:last-child {
          border-bottom: none;
        }

        .detail-label {
          font-size: $font-size-base;
          color: $text-secondary;
        }

        .detail-value {
          font-size: $font-size-base;
          font-weight: 600;
          color: $text-primary;

          &.success {
            color: $success-color;
          }
        }
      }
    }
  }

  .conversion-section {
    display: flex;
    gap: 32px;

    .conversion-item {
      flex: 1;

      .conv-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;

        .conv-label {
          font-size: $font-size-base;
          color: $text-regular;
        }

        .conv-rate {
          font-size: $font-size-medium;
          font-weight: 700;
          color: $text-primary;
        }
      }

      .conv-track {
        height: 12px;
        background: #f0f2f5;
        border-radius: 6px;
        overflow: hidden;

        .conv-fill {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s ease;
          min-width: 2px;

          &.blue { background: linear-gradient(90deg, #409eff, #79bbff); }
          &.green { background: linear-gradient(90deg, #67c23a, #95d475); }
          &.orange { background: linear-gradient(90deg, #e6a23c, #eebe77); }
        }
      }

      .conv-detail {
        margin-top: 6px;
        font-size: $font-size-extra-small;
        color: $text-secondary;
      }
    }
  }
}
</style>
