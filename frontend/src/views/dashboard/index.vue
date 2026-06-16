<script setup lang="ts">
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useRouter } from 'vue-router'
import { formatPlayCount, formatNumber } from '@/utils'
import { CONTENT_AUDIT_STATUS, CONTENT_CATEGORY, getEnumLabel } from '@/constants/enums'
import { useUserStore } from '@/stores'
import { getDashboardStatsApi, getPlayTrendApi, getAuditEfficiencyApi, getRevenueOverviewApi } from '@/api/dashboard'
import { getContentListApi } from '@/api/content'
import type { DashboardStats, PlayTrendItem, AuditEfficiencyItem, RevenueOverviewItem, ContentItem } from '@/types'

echarts.use([LineChart, BarChart, PieChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

type EChartsInst = ReturnType<typeof echarts.init>

const router = useRouter()
const userStore = useUserStore()

const loading = ref<boolean>(true)
const stats = ref<DashboardStats | null>(null)
const playTrend = ref<PlayTrendItem[]>([])
const auditEfficiency = ref<AuditEfficiencyItem[]>([])
const revenueOverview = ref<RevenueOverviewItem[]>([])
const recentContents = ref<ContentItem[]>([])

const playTrendChartRef = ref<HTMLElement>()
const revenueChartRef = ref<HTMLElement>()
const categoryChartRef = ref<HTMLElement>()
const auditEffChartRef = ref<HTMLElement>()

let playTrendChart: EChartsInst | null = null
let revenueChart: EChartsInst | null = null
let categoryChart: EChartsInst | null = null
let auditEffChart: EChartsInst | null = null

const CATEGORY_COLORS: Record<number, string> = {
  1: '#409EFF', 2: '#67C23A', 3: '#E6A23C', 4: '#F56C6C',
  5: '#722ed1', 6: '#13c2c2', 7: '#eb2f96',
}

const getAuditCount = (status: number): number =>
  stats.value?.contentStats.byAuditStatus.find(i => i.auditStatus === status)?.count ?? 0

const quickActions = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { label: '内容管理', icon: 'Film', path: '/contents', color: '#409EFF', count: s.contentStats.total, desc: '全部内容' },
    { label: '内容审核', icon: 'Checked', path: '/content-audit', color: '#E6A23C', count: getAuditCount(0), desc: '待审核' },
    { label: '版权管理', icon: 'Document', path: '/copyrights', color: '#67C23A', count: s.copyrightStats.activeCount, desc: '有效版权' },
    { label: '广告投放', icon: 'Promotion', path: '/advertisements', color: '#722ed1', count: s.adStats.totalClick, desc: '总点击' },
    { label: '活动运营', icon: 'Present', path: '/activities', color: '#F56C6C', count: s.activityStats.totalParticipant, desc: '参与人数' },
    { label: '用户管理', icon: 'User', path: '/system/users', color: '#13c2c2', count: s.userStats.activeCount, desc: '活跃用户' },
  ]
})

const todayStats = computed(() => {
  if (!stats.value) return []
  const totalPlay = playTrend.value.reduce((sum, i) => sum + i.playCount, 0)
  return [
    { title: '今日新增内容', value: String(stats.value.contentStats.todayNew), icon: 'DocumentAdd', color: '#409EFF' },
    { title: '审核通过', value: String(getAuditCount(2)), icon: 'CircleCheck', color: '#67C23A' },
    { title: '审核驳回', value: String(getAuditCount(3)), icon: 'CircleClose', color: '#F56C6C' },
    { title: '总播放量', value: formatPlayCount(totalPlay), icon: 'View', color: '#722ed1' },
  ]
})

const showCopyrightWarning = computed(() => (stats.value?.copyrightStats.expiringCount ?? 0) > 0)

const auditProgress = computed(() => {
  if (!stats.value) return []
  const total = stats.value.contentStats.byAuditStatus.reduce((sum, i) => sum + i.count, 0) || 1
  return [
    { label: '审核通过', value: getAuditCount(2), color: '#67C23A' },
    { label: '待审核', value: getAuditCount(0), color: '#E6A23C' },
    { label: '审核中', value: getAuditCount(1), color: '#409EFF' },
    { label: '已驳回', value: getAuditCount(3), color: '#F56C6C' },
  ].map(item => ({ ...item, percent: Math.round((item.value / total) * 100) }))
})

const categoryDist = computed(() => {
  if (!stats.value) return []
  return stats.value.contentStats.byCategory.map(item => ({
    label: getEnumLabel(CONTENT_CATEGORY, item.category),
    value: item.count,
    color: CATEGORY_COLORS[item.category] || '#909399',
  }))
})

const auditTotal = computed(() => stats.value?.contentStats.byAuditStatus.reduce((sum, i) => sum + i.count, 0) ?? 0)
const totalCategory = computed(() => categoryDist.value.reduce((sum, i) => sum + i.value, 0))

const fetchData = async () => {
  loading.value = true
  try {
    const [statsRes, trendRes, auditRes, revenueRes, contentRes] = await Promise.all([
      getDashboardStatsApi(),
      getPlayTrendApi(7),
      getAuditEfficiencyApi(7),
      getRevenueOverviewApi(7),
      getContentListApi({ page: 1, pageSize: 5, sortBy: 'createdAt', sortOrder: 'DESC' }),
    ])
    stats.value = statsRes
    playTrend.value = trendRes
    auditEfficiency.value = auditRes
    revenueOverview.value = revenueRes
    recentContents.value = contentRes.list
  } finally {
    loading.value = false
  }
}

const initPlayTrendChart = () => {
  if (!playTrendChartRef.value) return
  playTrendChart = echarts.init(playTrendChartRef.value)
  playTrendChart.setOption({
    tooltip: { trigger: 'axis', formatter: (params: any) => `${params[0].name}<br/>播放量: ${formatPlayCount(params[0].value)}` },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: playTrend.value.map(i => i.date.slice(5)), boundaryGap: false },
    yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatPlayCount(val) } },
    series: [{
      name: '播放量', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
      data: playTrend.value.map(i => i.playCount),
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(64,158,255,0.3)' }, { offset: 1, color: 'rgba(64,158,255,0.02)' }] } },
      lineStyle: { color: '#409EFF', width: 2 },
      itemStyle: { color: '#409EFF' },
    }],
  })
}

const initRevenueChart = () => {
  if (!revenueChartRef.value) return
  revenueChart = echarts.init(revenueChartRef.value)
  revenueChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['广告收入', '会员收入'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: { type: 'category', data: revenueOverview.value.map(i => i.date.slice(5)) },
    yAxis: { type: 'value', axisLabel: { formatter: (val: number) => val >= 10000 ? (val / 10000).toFixed(0) + '万' : String(val) } },
    series: [
      { name: '广告收入', type: 'bar', barWidth: '30%', data: revenueOverview.value.map(i => i.adRevenue), itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } },
      { name: '会员收入', type: 'bar', barWidth: '30%', data: revenueOverview.value.map(i => i.memberRevenue), itemStyle: { color: '#67C23A', borderRadius: [4, 4, 0, 0] } },
    ],
  })
}

const initCategoryChart = () => {
  if (!categoryChartRef.value) return
  categoryChart = echarts.init(categoryChartRef.value)
  categoryChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { fontSize: 12 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'], center: ['35%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: categoryDist.value.map(i => ({ name: i.label, value: i.value, itemStyle: { color: i.color } })),
    }],
  })
}

const initAuditEffChart = () => {
  if (!auditEffChartRef.value) return
  auditEffChart = echarts.init(auditEffChartRef.value)
  auditEffChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['审核量', '通过率'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '14%', containLabel: true },
    xAxis: { type: 'category', data: auditEfficiency.value.map(i => i.date.slice(5)) },
    yAxis: [
      { type: 'value', name: '审核量', axisLabel: { formatter: (val: number) => String(val) } },
      { type: 'value', name: '通过率', axisLabel: { formatter: (val: number) => val + '%' }, min: 0, max: 100 },
    ],
    series: [
      { name: '审核量', type: 'bar', barWidth: '35%', data: auditEfficiency.value.map(i => i.totalAudited), itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] } },
      { name: '通过率', type: 'line', smooth: true, yAxisIndex: 1, data: auditEfficiency.value.map(i => i.approvalRate), lineStyle: { color: '#67C23A' }, itemStyle: { color: '#67C23A' } },
    ],
  })
}

const handleResize = () => {
  playTrendChart?.resize()
  revenueChart?.resize()
  categoryChart?.resize()
  auditEffChart?.resize()
}

const handleAction = (path: string) => {
  router.push(path)
}

const goContent = (id: number) => {
  router.push('/contents')
}

onMounted(async () => {
  await fetchData()
  nextTick(() => {
    initPlayTrendChart()
    initRevenueChart()
    initCategoryChart()
    initAuditEffChart()
    window.addEventListener('resize', handleResize)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  playTrendChart?.dispose()
  revenueChart?.dispose()
  categoryChart?.dispose()
  auditEffChart?.dispose()
})
</script>

<template>
  <div class="dashboard-page">
    <template v-if="loading">
      <el-skeleton :rows="3" animated />
      <div style="margin-top: 16px"><el-skeleton :rows="6" animated /></div>
      <div style="margin-top: 16px"><el-skeleton :rows="8" animated /></div>
    </template>
    <template v-else>
      <div class="welcome-banner card-content">
        <div class="banner-left">
          <h2 class="welcome-title">
            👋 欢迎回来，{{ userStore.userInfo?.realName || userStore.username }}
          </h2>
          <p class="welcome-desc">
            今天是个好日子，系统中共有 <b style="color: #409EFF">{{ formatNumber(stats?.contentStats.total ?? 0) }}</b> 条内容，
            待审核 <b style="color: #E6A23C">{{ formatNumber(getAuditCount(0)) }}</b> 条，
            快去处理吧！
          </p>
        </div>
        <div class="banner-right">
          <el-button type="primary" :icon="Plus" size="large" @click="$router.push('/contents')">新增内容</el-button>
          <el-button :icon="Checked" size="large" @click="$router.push('/content-audit')">去审核</el-button>
        </div>
      </div>

      <div class="quick-grid">
        <div
          v-for="(action, index) in quickActions"
          :key="index"
          class="quick-card card-content"
          :style="{ borderTopColor: action.color }"
          @click="handleAction(action.path)"
        >
          <div class="quick-icon" :style="{ backgroundColor: action.color + '15', color: action.color }">
            <el-icon :size="28"><component :is="action.icon" /></el-icon>
          </div>
          <div class="quick-info">
            <div class="quick-label">{{ action.label }}</div>
            <div class="quick-count" :style="{ color: action.color }">{{ formatNumber(action.count) }}</div>
            <div class="quick-desc">{{ action.desc }}</div>
          </div>
          <el-icon class="quick-arrow"><ArrowRight /></el-icon>
        </div>
      </div>

      <div class="stats-grid">
        <div v-for="(stat, index) in todayStats" :key="index" class="stat-card card-content">
          <div class="stat-header">
            <span class="stat-title">{{ stat.title }}</span>
            <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
              <el-icon :size="20"><component :is="stat.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        </div>
      </div>

      <el-alert
        v-if="showCopyrightWarning"
        type="warning"
        :closable="false"
        show-icon
        class="copyright-warning"
      >
        <template #title>
          版权预警：有 <b>{{ stats?.copyrightStats.expiringCount }}</b> 个版权即将到期，请及时处理！
        </template>
      </el-alert>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="14">
          <div class="chart-card card-content">
            <div class="card-header flex-between">
              <span class="card-title">播放量趋势</span>
              <el-tag size="small" type="info">近7天</el-tag>
            </div>
            <div ref="playTrendChartRef" class="chart-container"></div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="10">
          <div class="chart-card card-content">
            <div class="card-header flex-between">
              <span class="card-title">收入分析</span>
              <el-tag size="small" type="info">近7天</el-tag>
            </div>
            <div ref="revenueChartRef" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="24" :md="8">
          <div class="chart-card card-content">
            <div class="card-header flex-between">
              <span class="card-title">审核进度统计</span>
              <el-tag size="small" type="info">累计: {{ formatNumber(auditTotal) }}</el-tag>
            </div>
            <div class="progress-list">
              <div v-for="item in auditProgress" :key="item.label" class="progress-item">
                <div class="progress-label-row">
                  <el-tag size="small" :color="item.color + '15'" :style="{ color: item.color, borderColor: 'transparent' }">
                    {{ item.label }}
                  </el-tag>
                  <span class="progress-value">{{ formatNumber(item.value) }} ({{ item.percent }}%)</span>
                </div>
                <el-progress :percentage="item.percent" :color="item.color" :stroke-width="10" :show-text="false" />
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8">
          <div class="chart-card card-content">
            <div class="card-header flex-between">
              <span class="card-title">内容分类分布</span>
              <el-tag size="small" type="info">总计: {{ formatNumber(totalCategory) }}</el-tag>
            </div>
            <div ref="categoryChartRef" class="chart-container"></div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="24" :md="8">
          <div class="chart-card card-content">
            <div class="card-header flex-between">
              <span class="card-title">审核效率</span>
              <el-tag size="small" type="info">近7天</el-tag>
            </div>
            <div ref="auditEffChartRef" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>

      <div class="recent-section card-content">
        <div class="card-header flex-between">
          <span class="card-title">最新内容</span>
          <el-button type="primary" link :icon="ArrowRight" @click="$router.push('/contents')">查看全部</el-button>
        </div>
        <el-table :data="recentContents" stripe style="width: 100%">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="title" label="内容标题" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="table-link" @click="goContent(row.id)">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="100" align="center">
            <template #default="{ row }">
              <el-tag size="small">{{ getEnumLabel(CONTENT_CATEGORY, row.category) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="评分" width="100" align="center">
            <template #default="{ row }">
              <span style="color: #E6A23C; font-weight: 600">★ {{ row.rating }}</span>
            </template>
          </el-table-column>
          <el-table-column label="播放量" width="120" align="center">
            <template #default="{ row }">
              {{ formatPlayCount(row.playCount) }}
            </template>
          </el-table-column>
          <el-table-column label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.auditStatus === 2 ? 'success' : row.auditStatus === 0 ? 'warning' : row.auditStatus === 1 ? 'primary' : 'danger'"
                size="small"
              >
                {{ getEnumLabel(CONTENT_AUDIT_STATUS, row.auditStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="提交时间" width="180" align="center" />
        </el-table>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(103, 194, 58, 0.08) 100%);
  border-left: 4px solid $primary-color;
}

.welcome-title {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 8px;
}

.welcome-desc {
  font-size: $font-sm;
  color: $text-secondary;
  margin: 0;
  line-height: 1.6;
}

.banner-right {
  display: flex;
  gap: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
  border-top: 3px solid;
  transition: $transition-base;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-base;
  }
}

.quick-icon {
  width: 56px;
  height: 56px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-info {
  flex: 1;
  min-width: 0;
}

.quick-label {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: 4px;
}

.quick-count {
  font-size: $font-2xl;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}

.quick-desc {
  font-size: $font-xs;
  color: $text-placeholder;
}

.quick-arrow {
  color: $text-placeholder;
  transition: $transition-base;
}

.quick-card:hover .quick-arrow {
  color: $primary-color;
  transform: translateX(4px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-title {
  font-size: $font-sm;
  color: $text-secondary;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.copyright-warning {
  border-radius: $radius-md;
}

.card-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid $border-lighter;
}

.card-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.chart-card {
  margin-bottom: 16px;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 4px;
}

.progress-item {
  .progress-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .progress-value {
    font-size: $font-sm;
    font-weight: 500;
    color: $text-primary;
  }
}

.recent-section {
  min-height: 300px;
}

.table-link {
  color: $primary-color;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
