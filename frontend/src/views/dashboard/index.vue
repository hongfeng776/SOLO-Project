<template>
  <div class="dashboard">
    <el-row :gutter="16" class="mb-20">
      <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color + '15', color: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCompact(item.value) }}</div>
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
              <span class="card-title">内容流量趋势</span>
              <el-radio-group v-model="chartPeriod" size="small">
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
              <span class="card-title">热门标签</span>
            </div>
          </template>
          <div class="tag-cloud">
            <el-tag
              v-for="tag in hotTags"
              :key="tag.id"
              :type="tag.hot > 500 ? 'danger' : tag.hot > 200 ? 'warning' : 'primary'"
              effect="light"
              class="tag-item"
            >
              {{ tag.name }}
              <span class="tag-count">{{ tag.hot }}</span>
            </el-tag>
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
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { EChartsOption } from 'echarts'
import {
  Document,
  View,
  User,
  Present,
  Top,
  Bottom
} from '@element-plus/icons-vue'
import { useNumberFormat, formatDateTime } from '@hooks/useFormat'
import { NoteStatus } from '@enums/business'
import type { Note } from '@/types/business'
import ContentPreview from '@components/ContentPreview/index.vue'

use([CanvasRenderer, LineChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent, DatasetComponent])

const router = useRouter()
const { formatCompact } = useNumberFormat()

const chartPeriod = ref('week')

const statCards = ref([
  { key: 'note', label: '内容总数', value: 12846, trend: 12.5, icon: Document, color: '#409eff' },
  { key: 'view', label: '今日浏览', value: 89432, trend: 8.3, icon: View, color: '#67c23a' },
  { key: 'creator', label: '合作达人', value: 1256, trend: -2.1, icon: User, color: '#e6a23c' },
  { key: 'activity', label: '进行中活动', value: 23, trend: 15.0, icon: Present, color: '#f56c6c' }
])

const trendChartOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['浏览量', '点赞数', '评论数'], right: 10 },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['06-10', '06-11', '06-12', '06-13', '06-14', '06-15', '06-16']
  },
  yAxis: { type: 'value' },
  series: [
    {
      name: '浏览量',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: [45000, 52000, 61000, 58000, 72000, 81000, 89432],
      itemStyle: { color: '#409eff' }
    },
    {
      name: '点赞数',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: [3200, 4100, 4800, 5200, 6100, 6800, 7420],
      itemStyle: { color: '#67c23a' }
    },
    {
      name: '评论数',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: [820, 960, 1120, 1080, 1340, 1520, 1680],
      itemStyle: { color: '#e6a23c' }
    }
  ]
}))

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
        { value: 256, name: '待审核', itemStyle: { color: '#e6a23c' } },
        { value: 8964, name: '已发布', itemStyle: { color: '#67c23a' } },
        { value: 1842, name: '草稿', itemStyle: { color: '#909399' } },
        { value: 426, name: '已拒绝', itemStyle: { color: '#f56c6c' } },
        { value: 1358, name: '已下架', itemStyle: { color: '#409eff' } }
      ]
    }
  ]
}))

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

const hotTags = ref([
  { id: 1, name: '夏日穿搭', hot: 682 },
  { id: 2, name: '旅行攻略', hot: 523 },
  { id: 3, name: '美食探店', hot: 445 },
  { id: 4, name: '居家好物', hot: 378 },
  { id: 5, name: '护肤心得', hot: 312 },
  { id: 6, name: '健身打卡', hot: 286 },
  { id: 7, name: '亲子时光', hot: 234 },
  { id: 8, name: '职场干货', hot: 198 },
  { id: 9, name: '数码评测', hot: 176 },
  { id: 10, name: '宠物日常', hot: 152 }
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

onMounted(() => {
  // 初始化加载数据
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
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
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

  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    padding: 4px;
  }

  .tag-item {
    font-size: 13px;
    padding: 6px 12px;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    .tag-count {
      font-size: 11px;
      opacity: 0.8;
      background: rgba(255, 255, 255, 0.4);
      padding: 1px 6px;
      border-radius: 10px;
    }
  }
}
</style>
