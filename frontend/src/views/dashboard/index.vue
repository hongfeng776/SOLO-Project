<template>
  <div class="dashboard" v-loading="loading">
    <el-row :gutter="16" class="mb-20">
      <el-col :xs="12" :sm="6" :md="3" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color + '15', color: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ item.isMoney ? formatMoney(item.value) : formatCompact(item.value) }}</div>
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-trend" :class="item.trend >= 0 ? 'up' : 'down'">
              <el-icon><component :is="item.trend >= 0 ? Top : Bottom" /></el-icon>
              <span>{{ Math.abs(item.trend) }}%</span>
              <span class="trend-text">较昨日</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-20">
      <el-col :sm="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">核心数据趋势</span>
              <el-radio-group v-model="chartPeriod" size="small" @change="fetchTrendData">
                <el-radio-button value="week">近7天</el-radio-button>
                <el-radio-button value="month">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div style="height: 320px">
            <v-chart class="chart" :option="trendChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
      <el-col :sm="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">内容状态分布</span>
            </div>
          </template>
          <div style="height: 320px">
            <v-chart class="chart" :option="statusChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mb-20">
      <el-col :sm="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">达人排行榜</span>
              <el-button link type="primary" size="small" @click="goCreatorList">查看全部</el-button>
            </div>
          </template>
          <div class="ranking-list">
            <div
              v-for="(item, index) in creatorRanking"
              :key="item.id"
              class="ranking-item"
            >
              <div class="rank-num" :class="'rank-' + (index + 1)">{{ index + 1 }}</div>
              <el-avatar :size="36" :src="item.avatar">
                {{ item.name?.charAt(0) || '达' }}
              </el-avatar>
              <div class="ranking-info">
                <div class="ranking-name">{{ item.name }}</div>
                <div class="ranking-desc">粉丝 {{ formatCompact(item.followers) }} · 获赞 {{ formatCompact(item.likes) }}</div>
              </div>
              <div class="ranking-value">
                <span class="value-label">营收</span>
                <span class="value-amount">{{ formatMoney(item.revenue || 0) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :sm="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">热门内容TOP5</span>
              <el-button link type="primary" size="small" @click="goContentList">查看全部</el-button>
            </div>
          </template>
          <div class="hot-content-list">
            <div
              v-for="(item, index) in hotContentList"
              :key="item.id"
              class="hot-content-item"
            >
              <div class="hot-num" :class="'hot-' + (index + 1)">{{ index + 1 }}</div>
              <div class="hot-content-info">
                <div class="hot-content-title" :title="item.title">{{ item.title }}</div>
                <div class="hot-content-meta">
                  <span class="author">{{ item.authorName }}</span>
                  <span class="dot">·</span>
                  <span class="views">{{ formatCompact(item.viewCount) }} 浏览</span>
                </div>
              </div>
              <div class="hot-content-stats">
                <el-icon><View /></el-icon>
                <span>{{ formatCompact(item.viewCount) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :sm="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">待审核内容</span>
              <el-button link type="primary" size="small" @click="goReview">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingList" size="small" style="width: 100%">
            <el-table-column prop="title" label="内容标题" show-overflow-tooltip min-width="180" />
            <el-table-column prop="authorName" label="作者" width="100" />
            <el-table-column label="提交时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openPreview(row)">预览</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :sm="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span class="card-title">待办事项</span>
            </div>
          </template>
          <div class="todo-list">
            <div class="todo-item" @click="goReview">
              <div class="todo-icon pending-review">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-title">待审核内容</div>
                <div class="todo-desc">需要您及时处理的内容审核</div>
              </div>
              <el-tag type="warning" effect="dark" size="small">{{ overviewStats.pendingReviews || 0 }} 条</el-tag>
            </div>
            <div class="todo-item" @click="goSettlement">
              <div class="todo-icon pending-settle">
                <el-icon><Money /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-title">待结算订单</div>
                <div class="todo-desc">等待结算的达人订单</div>
              </div>
              <el-tag type="success" effect="dark" size="small">{{ overviewStats.pendingSettlements || 0 }} 条</el-tag>
            </div>
            <div class="todo-item" @click="goViolation">
              <div class="todo-icon pending-violation">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-title">待处理违规</div>
                <div class="todo-desc">需要处理的违规记录</div>
              </div>
              <el-tag type="danger" effect="dark" size="small">{{ pendingViolations }} 条</el-tag>
            </div>
            <div class="todo-item" @click="goFeedback">
              <div class="todo-icon pending-feedback">
                <el-icon><ChatDotRound /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-title">新增反馈</div>
                <div class="todo-desc">用户提交的新反馈</div>
              </div>
              <el-tag type="primary" effect="dark" size="small">{{ newFeedbacks }} 条</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <ContentPreview v-model="previewVisible" :data="previewData" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import { initECharts } from '@utils/echarts'
import {
  Document,
  View,
  User,
  Present,
  Top,
  Bottom,
  Money,
  Warning,
  ChatDotRound,
  CircleCheck
} from '@element-plus/icons-vue'
import { useNumberFormat, formatDateTime } from '@hooks/useFormat'
import { NoteStatus } from '@enums/business'
import type { Note, OverviewStats, TrendDataItem, Creator } from '@/types/business'
import { getOverviewStats, getTrendStats } from '@/api/stats'
import ContentPreview from '@components/ContentPreview/index.vue'

initECharts()

const router = useRouter()
const { formatCompact, formatMoney } = useNumberFormat()

const loading = ref(false)
const chartPeriod = ref('week')
const overviewStats = ref<OverviewStats>({
  totalNotes: 0,
  totalCreators: 0,
  totalOrders: 0,
  totalUsers: 0,
  totalComments: 0,
  totalRevenue: 0,
  todayNewNotes: 0,
  todayNewCreators: 0,
  todayNewOrders: 0,
  todayNewUsers: 0,
  todayRevenue: 0,
  pendingReviews: 0,
  pendingSettlements: 0
})

const pendingViolations = ref(12)
const newFeedbacks = ref(8)

const trendData = ref<TrendDataItem[]>([])

const statCards = computed(() => [
  { key: 'note', label: '内容总数', value: overviewStats.value.totalNotes, trend: 12.5, icon: Document, color: '#409eff', isMoney: false },
  { key: 'view', label: '今日浏览', value: 89432, trend: 8.3, icon: View, color: '#67c23a', isMoney: false },
  { key: 'creator', label: '合作达人', value: overviewStats.value.totalCreators, trend: -2.1, icon: User, color: '#e6a23c', isMoney: false },
  { key: 'activity', label: '进行中活动', value: 23, trend: 15.0, icon: Present, color: '#f56c6c', isMoney: false },
  { key: 'newUser', label: '今日新增用户', value: overviewStats.value.todayNewUsers, trend: 5.8, icon: User, color: '#909399', isMoney: false },
  { key: 'violation', label: '待处理违规', value: pendingViolations.value, trend: -10.2, icon: Warning, color: '#f56c6c', isMoney: false },
  { key: 'settlement', label: '待结算金额', value: overviewStats.value.totalRevenue, trend: 7.4, icon: Money, color: '#67c23a', isMoney: true },
  { key: 'feedback', label: '新增反馈', value: newFeedbacks.value, trend: 3.2, icon: ChatDotRound, color: '#909399', isMoney: false }
])

const trendChartOption = computed<EChartsOption>(() => {
  const dates = trendData.value.map(item => item.date)
  const noteCounts = trendData.value.map(item => item.noteCount || 0)
  const userCounts = trendData.value.map(item => item.userCount || 0)
  const orderCounts = trendData.value.map(item => item.orderCount || 0)
  const revenues = trendData.value.map(item => item.revenue || 0)

  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['内容数', '用户数', '订单数', '营收'], right: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '数量',
        position: 'left'
      },
      {
        type: 'value',
        name: '营收(元)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '内容数',
        type: 'line',
        smooth: true,
        data: noteCounts,
        itemStyle: { color: '#409eff' }
      },
      {
        name: '用户数',
        type: 'line',
        smooth: true,
        data: userCounts,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: orderCounts,
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '营收',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: revenues,
        itemStyle: { color: '#f56c6c' }
      }
    ]
  }
})

const statusChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: 10, top: 'center' },
  series: [
    {
      name: '内容状态',
      type: 'pie',
      radius: ['45%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: overviewStats.value.pendingReviews || 256, name: '待审核', itemStyle: { color: '#e6a23c' } },
        { value: 8964, name: '已发布', itemStyle: { color: '#67c23a' } },
        { value: 1842, name: '草稿', itemStyle: { color: '#909399' } },
        { value: 426, name: '已拒绝', itemStyle: { color: '#f56c6c' } },
        { value: 1358, name: '已下架', itemStyle: { color: '#409eff' } }
      ]
    }
  ]
}))

const creatorRanking = ref<(Creator & { revenue?: number })[]>([
  { id: 1, name: '旅行达人小王', avatar: '', platform: '小红书', followers: 125600, likes: 890000, category: '旅行', level: 5, qualificationStatus: 2, contactName: '小王', contactPhone: '13800138001', createTime: '2024-01-15', revenue: 56800 },
  { id: 2, name: '时尚博主Lily', avatar: '', platform: '抖音', followers: 256000, likes: 1200000, category: '时尚', level: 5, qualificationStatus: 2, contactName: 'Lily', contactPhone: '13800138002', createTime: '2024-02-20', revenue: 48200 },
  { id: 3, name: '美食家阿May', avatar: '', platform: '小红书', followers: 89000, likes: 560000, category: '美食', level: 4, qualificationStatus: 2, contactName: '阿May', contactPhone: '13800138003', createTime: '2024-03-10', revenue: 35600 },
  { id: 4, name: '科技达人老李', avatar: '', platform: 'B站', followers: 178000, likes: 980000, category: '数码', level: 4, qualificationStatus: 2, contactName: '老李', contactPhone: '13800138004', createTime: '2024-01-25', revenue: 32100 },
  { id: 5, name: '健身教练Amy', avatar: '', platform: '抖音', followers: 312000, likes: 1500000, category: '健身', level: 5, qualificationStatus: 2, contactName: 'Amy', contactPhone: '13800138005', createTime: '2024-02-05', revenue: 28900 },
  { id: 6, name: '母婴达人小周', avatar: '', platform: '小红书', followers: 95000, likes: 420000, category: '母婴', level: 3, qualificationStatus: 2, contactName: '小周', contactPhone: '13800138006', createTime: '2024-04-01', revenue: 24500 },
  { id: 7, name: '家居设计师', avatar: '', platform: '抖音', followers: 145000, likes: 680000, category: '家居', level: 4, qualificationStatus: 2, contactName: '设计师', contactPhone: '13800138007', createTime: '2024-03-15', revenue: 21800 },
  { id: 8, name: '汽车评测阿杰', avatar: '', platform: 'B站', followers: 203000, likes: 1100000, category: '汽车', level: 4, qualificationStatus: 2, contactName: '阿杰', contactPhone: '13800138008', createTime: '2024-02-28', revenue: 19200 },
  { id: 9, name: '美妆达人小美', avatar: '', platform: '小红书', followers: 167000, likes: 890000, category: '美妆', level: 4, qualificationStatus: 2, contactName: '小美', contactPhone: '13800138009', createTime: '2024-01-30', revenue: 17600 },
  { id: 10, name: '数码评测小王', avatar: '', platform: '抖音', followers: 112000, likes: 540000, category: '数码', level: 3, qualificationStatus: 2, contactName: '小王', contactPhone: '13800138010', createTime: '2024-04-10', revenue: 15300 }
])

const hotContentList = ref<Note[]>([
  { id: 1001, title: '夏日旅行必看！这5个小众海岛美得让人窒息', status: NoteStatus.PUBLISHED, authorId: 1, authorName: '旅行达人小王', content: '', coverImage: '', tags: [], viewCount: 125600, likeCount: 8920, commentCount: 1256, shareCount: 3420, createTime: '2024-06-16 10:23:45', updateTime: '2024-06-16 10:23:45' },
  { id: 1002, title: '2024年夏季穿搭趋势，这几件单品一定要拥有', status: NoteStatus.PUBLISHED, authorId: 2, authorName: '时尚博主Lily', content: '', coverImage: '', tags: [], viewCount: 98700, likeCount: 6540, commentCount: 892, shareCount: 2150, createTime: '2024-06-16 09:15:30', updateTime: '2024-06-16 09:15:30' },
  { id: 1003, title: '零失败的家庭烘焙教程，新手也能做出完美蛋糕', status: NoteStatus.PUBLISHED, authorId: 3, authorName: '美食家阿May', content: '', coverImage: '', tags: [], viewCount: 76500, likeCount: 5230, commentCount: 756, shareCount: 1890, createTime: '2024-06-16 08:42:12', updateTime: '2024-06-16 08:42:12' },
  { id: 1004, title: '2024年最值得入手的5款旗舰手机，对比分析', status: NoteStatus.PUBLISHED, authorId: 4, authorName: '科技达人老李', content: '', coverImage: '', tags: [], viewCount: 65400, likeCount: 4560, commentCount: 923, shareCount: 1560, createTime: '2024-06-15 16:30:00', updateTime: '2024-06-15 16:30:00' },
  { id: 1005, title: '30天健身打卡计划，跟我一起练出好身材', status: NoteStatus.PUBLISHED, authorId: 5, authorName: '健身教练Amy', content: '', coverImage: '', tags: [], viewCount: 54300, likeCount: 3890, commentCount: 654, shareCount: 1230, createTime: '2024-06-15 14:20:00', updateTime: '2024-06-15 14:20:00' }
])

const pendingList = ref<Note[]>([
  {
    id: 1001,
    title: '夏日旅行必看！这5个小众海岛美得让人窒息',
    status: NoteStatus.PENDING_REVIEW,
    authorId: 1,
    authorName: '旅行达人小王',
    content: '',
    coverImage: '',
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    createTime: '2024-06-16 10:23:45',
    updateTime: '2024-06-16 10:23:45'
  },
  {
    id: 1002,
    title: '2024年夏季穿搭趋势，这几件单品一定要拥有',
    status: NoteStatus.PENDING_REVIEW,
    authorId: 2,
    authorName: '时尚博主Lily',
    content: '',
    coverImage: '',
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    createTime: '2024-06-16 09:15:30',
    updateTime: '2024-06-16 09:15:30'
  },
  {
    id: 1003,
    title: '零失败的家庭烘焙教程，新手也能做出完美蛋糕',
    status: NoteStatus.PENDING_REVIEW,
    authorId: 3,
    authorName: '美食家阿May',
    content: '',
    coverImage: '',
    tags: [],
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    createTime: '2024-06-16 08:42:12',
    updateTime: '2024-06-16 08:42:12'
  }
])

const previewVisible = ref(false)
const previewData = ref<Note | null>(null)

const openPreview = (row: Note) => {
  previewData.value = row
  previewVisible.value = true
}

const goReview = () => {
  router.push('/content/note/review')
}

const goCreatorList = () => {
  router.push('/creator/list')
}

const goContentList = () => {
  router.push('/content/note')
}

const goSettlement = () => {
  router.push('/finance/settlement')
}

const goViolation = () => {
  router.push('/risk/violation')
}

const goFeedback = () => {
  router.push('/risk/feedback')
}

const fetchOverviewData = async () => {
  try {
    const data = await getOverviewStats()
    overviewStats.value = data
  } catch (error) {
    console.error('获取概览统计失败:', error)
  }
}

const fetchTrendData = async () => {
  try {
    const endDate = new Date()
    const startDate = new Date()
    const days = chartPeriod.value === 'week' ? 7 : 30
    startDate.setDate(startDate.getDate() - days)

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }

    const data = await getTrendStats({
      type: 'all',
      startDate: formatDate(startDate),
      endDate: formatDate(endDate)
    })
    trendData.value = data
  } catch (error) {
    console.error('获取趋势统计失败:', error)
  }
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchOverviewData(),
      fetchTrendData()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: $border-radius;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
    min-width: 0;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
  }

  .stat-trend {
    font-size: 12px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 2px;

    &.up {
      color: $color-success;
    }

    &.down {
      color: $color-danger;
    }

    .trend-text {
      color: $text-secondary;
      margin-left: 4px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .ranking-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ranking-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: $border-radius-small;
    transition: background-color 0.2s;

    &:hover {
      background-color: $bg-body;
    }
  }

  .rank-num {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    background-color: $bg-body;
    color: $text-secondary;
    flex-shrink: 0;

    &.rank-1 {
      background-color: #ffd700;
      color: #fff;
    }

    &.rank-2 {
      background-color: #c0c0c0;
      color: #fff;
    }

    &.rank-3 {
      background-color: #cd7f32;
      color: #fff;
    }
  }

  .ranking-info {
    flex: 1;
    min-width: 0;
  }

  .ranking-name {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ranking-desc {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 2px;
  }

  .ranking-value {
    text-align: right;
    flex-shrink: 0;

    .value-label {
      font-size: 12px;
      color: $text-secondary;
      display: block;
    }

    .value-amount {
      font-size: 14px;
      font-weight: 600;
      color: $color-success;
    }
  }

  .hot-content-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .hot-content-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: $border-radius-small;
    transition: background-color 0.2s;

    &:hover {
      background-color: $bg-body;
    }
  }

  .hot-num {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    background-color: $bg-body;
    color: $text-secondary;
    flex-shrink: 0;

    &.hot-1 {
      background-color: #f56c6c;
      color: #fff;
    }

    &.hot-2 {
      background-color: #e6a23c;
      color: #fff;
    }

    &.hot-3 {
      background-color: #67c23a;
      color: #fff;
    }
  }

  .hot-content-info {
    flex: 1;
    min-width: 0;
  }

  .hot-content-title {
    font-size: 14px;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hot-content-meta {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 2px;
    display: flex;
    align-items: center;
    gap: 4px;

    .dot {
      color: $border-color-base;
    }
  }

  .hot-content-stats {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: $text-secondary;
    flex-shrink: 0;
  }

  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: $border-radius;
    background-color: $bg-body;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: $color-primary-light;
    }
  }

  .todo-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;

    &.pending-review {
      background-color: #fdf6ec;
      color: #e6a23c;
    }

    &.pending-settle {
      background-color: #f0f9eb;
      color: #67c23a;
    }

    &.pending-violation {
      background-color: #fef0f0;
      color: #f56c6c;
    }

    &.pending-feedback {
      background-color: #ecf5ff;
      color: #409eff;
    }
  }

  .todo-info {
    flex: 1;
    min-width: 0;
  }

  .todo-title {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  .todo-desc {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 2px;
  }
}
</style>
