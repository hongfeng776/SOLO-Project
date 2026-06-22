<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QySkeleton from '@/components/QySkeleton/index.vue'
import {
  Search,
  RefreshLeft,
  List,
  TrendCharts,
  DataLine,
  ChatDotRound,
  ChatLineSquare,
  Star,
  Share,
  StarFilled,
  CircleCheck,
  Warning,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'
import {
  CONTENT_CATEGORY,
  INTERACTION_TYPE,
  INTERACTION_TAG,
  ANALYTICS_VIEW_MODE,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
  DATE_FORMAT_STRING,
} from '@/constants/enums'
import {
  getInteractionStatsApi,
  getInteractionTrendApi,
  getCategoryComparisonApi,
} from '@/api/interaction-analytics'
import type {
  InteractionStatItem,
  InteractionTrendItem,
  CategoryComparisonItem,
  InteractionAnalyticsQueryParams,
} from '@/types'
import { formatDate, formatNumber, formatPlayCount } from '@/utils'

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
])
type EChartsInst = ReturnType<typeof echarts.init>

const loading = ref<boolean>(false)
const trendLoading = ref<boolean>(false)
const comparisonLoading = ref<boolean>(false)
const detailDialogVisible = ref<boolean>(false)
const currentDetailItem = ref<InteractionStatItem | null>(null)

const filters = reactive({
  contentCategory: null as number | null,
  dateRange: [] as string[],
  interactionTypes: [] as string[],
})

const viewMode = ref<string>(ANALYTICS_VIEW_MODE.LIST.value)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const statsList = ref<InteractionStatItem[]>([])
const trendData = ref<InteractionTrendItem[]>([])
const comparisonData = ref<CategoryComparisonItem[]>([])

const trendChartRef = ref<HTMLElement>()
const comparisonChartRef = ref<HTMLElement>()

let trendChart: EChartsInst | null = null
let comparisonChart: EChartsInst | null = null
let trendRefreshTimer: ReturnType<typeof setInterval> | null = null

const INTERACTION_COUNT_KEYS: Record<string, keyof InteractionStatItem | keyof InteractionTrendItem | keyof CategoryComparisonItem> = {
  comment: 'commentCount',
  danmaku: 'danmakuCount',
  like: 'likeCount',
  share: 'shareCount',
  collect: 'collectCount',
}

const ICON_MAP: Record<string, any> = {
  ChatDotRound,
  ChatLineSquare,
  Star,
  Share,
  StarFilled,
  CircleCheck,
  Warning,
  ArrowUp,
  ArrowDown,
}

const summaryCards = computed(() => {
  if (!statsList.value.length) return []
  const cards: Array<{
    type: string
    label: string
    value: number
    color: string
    icon: string
    yoy?: number
    mom?: number
  }> = []

  filters.interactionTypes.forEach((type) => {
    const typeItem = getEnumItem(INTERACTION_TYPE, type)
    if (!typeItem) return
    const countKey = INTERACTION_COUNT_KEYS[type] as keyof InteractionStatItem
    const total = statsList.value.reduce((sum, item) => sum + Number(item[countKey] || 0), 0)
    cards.push({
      type,
      label: typeItem.label,
      value: total,
      color: (typeItem as any).color,
      icon: (typeItem as any).icon,
    })
  })

  const totalInteractions = statsList.value.reduce((sum, item) => sum + Number(item.totalInteractions || 0), 0)
  const avgRate = statsList.value.length
    ? statsList.value.reduce((sum, item) => sum + Number(item.interactionRate || 0), 0) / statsList.value.length
    : 0

  cards.push(
    {
      type: 'total',
      label: '总互动数',
      value: totalInteractions,
      color: '#409EFF',
      icon: 'DataLine',
    },
    {
      type: 'avgRate',
      label: '平均互动率',
      value: Number(avgRate.toFixed(2)),
      color: '#67C23A',
      icon: 'CircleCheck',
    }
  )

  return cards
})

const tableColumns = computed(() => {
  const baseColumns = [
    { prop: 'contentTitle', label: '内容标题', minWidth: 200, showOverflowTooltip: true, slot: 'contentTitle' },
    { prop: 'contentCategory', label: '内容品类', width: 120, align: 'center', slot: 'contentCategory' },
    { prop: 'statDate', label: '统计日期', width: 120, align: 'center', slot: 'statDate' },
  ]

  filters.interactionTypes.forEach((type) => {
    const typeItem = getEnumItem(INTERACTION_TYPE, type)
    if (!typeItem) return
    baseColumns.push({
      prop: INTERACTION_COUNT_KEYS[type],
      label: typeItem.label,
      width: 100,
      align: 'center',
    })
  })

  baseColumns.push(
    { prop: 'playCount', label: '播放数', width: 120, align: 'center', slot: 'playCount' },
    { prop: 'totalInteractions', label: '总互动数', width: 110, align: 'center', sortable: 'custom' },
    { prop: 'interactionRate', label: '互动率', width: 100, align: 'center', slot: 'interactionRate' },
    { prop: 'interactionTag', label: '互动标签', width: 100, align: 'center', slot: 'interactionTag' }
  )

  return baseColumns
})

const validateFilters = (): boolean => {
  if (!filters.contentCategory || filters.dateRange.length !== 2 || filters.interactionTypes.length === 0) {
    ElMessage.warning('筛选维度不全，请完善内容品类、统计时段、互动类型')
    return false
  }
  return true
}

const fetchStats = async () => {
  if (!validateFilters()) return
  loading.value = true
  try {
    const params: InteractionAnalyticsQueryParams = {
      contentCategory: filters.contentCategory,
      startDate: filters.dateRange[0],
      endDate: filters.dateRange[1],
      interactionTypes: filters.interactionTypes.join(','),
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortBy: 'totalInteractions',
      sortOrder: 'DESC',
    }
    const res = await getInteractionStatsApi(params)
    statsList.value = res.list
    pagination.total = res.pagination.total
    if (!res.list.length) {
      ElMessage.info('所选时段暂无互动数据')
    }
  } finally {
    loading.value = false
  }
}

const fetchTrend = async () => {
  if (!validateFilters()) return
  trendLoading.value = true
  try {
    const params = {
      contentCategory: filters.contentCategory,
      startDate: filters.dateRange[0],
      endDate: filters.dateRange[1],
      interactionTypes: filters.interactionTypes.join(','),
    }
    trendData.value = await getInteractionTrendApi(params)
    await nextTick()
    initTrendChart()
  } finally {
    trendLoading.value = false
  }
}

const fetchComparison = async () => {
  if (!validateFilters()) return
  comparisonLoading.value = true
  try {
    const params = {
      contentCategories: String(filters.contentCategory),
      startDate: filters.dateRange[0],
      endDate: filters.dateRange[1],
    }
    comparisonData.value = await getCategoryComparisonApi(params)
    await nextTick()
    initComparisonChart()
  } finally {
    comparisonLoading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchStats()
  if (viewMode.value === ANALYTICS_VIEW_MODE.TREND.value) {
    fetchTrend()
  } else if (viewMode.value === ANALYTICS_VIEW_MODE.COMPARISON.value) {
    fetchComparison()
  }
}

const handleReset = () => {
  filters.contentCategory = null
  filters.dateRange = []
  filters.interactionTypes = []
  pagination.page = 1
  statsList.value = []
  trendData.value = []
  comparisonData.value = []
  pagination.total = 0
  trendChart?.clear()
  comparisonChart?.clear()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  fetchStats()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchStats()
}

const handleSortChange = (sortInfo: any) => {
  if (sortInfo.prop && sortInfo.order) {
    fetchStats()
  }
}

const handleViewModeChange = (mode: string) => {
  viewMode.value = mode
  if (mode === ANALYTICS_VIEW_MODE.LIST.value) {
    fetchStats()
    stopTrendAutoRefresh()
  } else if (mode === ANALYTICS_VIEW_MODE.TREND.value) {
    fetchTrend()
    startTrendAutoRefresh()
  } else if (mode === ANALYTICS_VIEW_MODE.COMPARISON.value) {
    fetchComparison()
    stopTrendAutoRefresh()
  }
}

const startTrendAutoRefresh = () => {
  stopTrendAutoRefresh()
  trendRefreshTimer = setInterval(() => {
    if (viewMode.value === ANALYTICS_VIEW_MODE.TREND.value) {
      fetchTrend()
    }
  }, 30000)
}

const stopTrendAutoRefresh = () => {
  if (trendRefreshTimer) {
    clearInterval(trendRefreshTimer)
    trendRefreshTimer = null
  }
}

const handleRowClick = (row: InteractionStatItem) => {
  currentDetailItem.value = row
  detailDialogVisible.value = true
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  const dates = trendData.value.map((item) => formatDate(item.date, DATE_FORMAT_STRING.DATE))
  const series = filters.interactionTypes.map((type) => {
    const typeItem = getEnumItem(INTERACTION_TYPE, type)
    const countKey = INTERACTION_COUNT_KEYS[type] as keyof InteractionTrendItem
    return {
      name: typeItem?.label || type,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      data: trendData.value.map((item) => Number(item[countKey] || 0)),
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: `${(typeItem as any)?.color || '#409EFF'}33` },
            { offset: 1, color: `${(typeItem as any)?.color || '#409EFF'}05` },
          ],
        },
      },
      lineStyle: { color: (typeItem as any)?.color || '#409EFF', width: 2 },
      itemStyle: { color: (typeItem as any)?.color || '#409EFF' },
    }
  })

  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: filters.interactionTypes.map((type) => getEnumItem(INTERACTION_TYPE, type)?.label || type),
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 5 }],
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (val: number) => formatNumber(val) },
    },
    series,
  })
}

const initComparisonChart = () => {
  if (!comparisonChartRef.value) return
  if (!comparisonChart) {
    comparisonChart = echarts.init(comparisonChartRef.value)
  }
  const categories = comparisonData.value.map((item) => item.categoryName || getEnumLabel(CONTENT_CATEGORY, item.category))

  const series = filters.interactionTypes.map((type) => {
    const typeItem = getEnumItem(INTERACTION_TYPE, type)
    const countKey = INTERACTION_COUNT_KEYS[type] as keyof CategoryComparisonItem
    return {
      name: typeItem?.label || type,
      type: 'bar',
      barWidth: '15%',
      data: comparisonData.value.map((item) => Number(item[countKey] || 0)),
      itemStyle: {
        color: (typeItem as any)?.color || '#409EFF',
        borderRadius: [4, 4, 0, 0],
      },
    }
  })

  comparisonChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    legend: {
      data: filters.interactionTypes.map((type) => getEnumItem(INTERACTION_TYPE, type)?.label || type),
      top: 0,
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    dataZoom: [{ type: 'inside' }, { type: 'slider', height: 20, bottom: 5 }],
    xAxis: {
      type: 'category',
      data: categories,
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (val: number) => formatNumber(val) },
    },
    series,
  })
}

const handleResize = () => {
  trendChart?.resize()
  comparisonChart?.resize()
}

const formatInteractionRate = (rate: number): string => {
  return Number(rate).toFixed(2) + '%'
}

const getInteractionTagInfo = (tag: number) => {
  return getEnumItem(INTERACTION_TAG, tag) || INTERACTION_TAG.NORMAL
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  stopTrendAutoRefresh()
  trendChart?.dispose()
  comparisonChart?.dispose()
})

watch(
  () => filters.interactionTypes,
  () => {
    if (viewMode.value === ANALYTICS_VIEW_MODE.TREND.value && trendData.value.length) {
      nextTick(() => initTrendChart())
    }
    if (viewMode.value === ANALYTICS_VIEW_MODE.COMPARISON.value && comparisonData.value.length) {
      nextTick(() => initComparisonChart())
    }
  },
  { deep: true }
)
</script>

<template>
  <div class="analytics-page">
    <div class="filter-bar card-content">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="内容品类">
          <el-select
            v-model="filters.contentCategory"
            placeholder="请选择内容品类"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="item in getEnumOptions(CONTENT_CATEGORY)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="统计时段">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="互动类型">
          <el-select
            v-model="filters.interactionTypes"
            multiple
            placeholder="请选择互动类型"
            collapse-tags
            collapse-tags-tooltip
            style="width: 260px"
          >
            <el-option
              v-for="item in getEnumOptions(INTERACTION_TYPE)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
              <span style="display: flex; align-items: center; gap: 8px">
                <el-icon :size="16" :style="{ color: (item as any).color }">
                  <component :is="ICON_MAP[(item as any).icon]" />
                </el-icon>
                {{ item.label }}
              </span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <transition name="fade" mode="out-in">
      <div v-if="!loading && statsList.length > 0" key="content">
        <div class="summary-grid">
          <div
            v-for="(card, index) in summaryCards"
            :key="card.type + '-' + index"
            class="stat-card card-content"
          >
            <div class="stat-header">
              <span class="stat-label">{{ card.label }}</span>
              <div class="stat-icon" :style="{ backgroundColor: card.color + '15', color: card.color }">
                <el-icon :size="20">
                  <component :is="ICON_MAP[card.icon]" />
                </el-icon>
              </div>
            </div>
            <div class="stat-value" :style="{ color: card.color }">
              {{ card.type === 'avgRate' ? formatInteractionRate(card.value) : formatNumber(card.value) }}
            </div>
            <div v-if="card.yoy !== undefined || card.mom !== undefined" class="stat-trend">
              <span v-if="card.yoy !== undefined" class="trend-item">
                同比
                <span :class="card.yoy >= 0 ? 'trend-up' : 'trend-down'">
                  <el-icon :size="12">
                    <component :is="card.yoy >= 0 ? ArrowUp : ArrowDown" />
                  </el-icon>
                  {{ Math.abs(card.yoy).toFixed(2) }}%
                </span>
              </span>
              <span v-if="card.mom !== undefined" class="trend-item">
                环比
                <span :class="card.mom >= 0 ? 'trend-up' : 'trend-down'">
                  <el-icon :size="12">
                    <component :is="card.mom >= 0 ? ArrowUp : ArrowDown" />
                  </el-icon>
                  {{ Math.abs(card.mom).toFixed(2) }}%
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="view-mode-switch card-content">
          <el-radio-group v-model="viewMode" @change="handleViewModeChange" size="default">
            <el-radio-button :value="ANALYTICS_VIEW_MODE.LIST.value">
              <el-icon style="margin-right: 4px"><List /></el-icon>
              {{ ANALYTICS_VIEW_MODE.LIST.label }}
            </el-radio-button>
            <el-radio-button :value="ANALYTICS_VIEW_MODE.TREND.value">
              <el-icon style="margin-right: 4px"><TrendCharts /></el-icon>
              {{ ANALYTICS_VIEW_MODE.TREND.label }}
            </el-radio-button>
            <el-radio-button :value="ANALYTICS_VIEW_MODE.COMPARISON.value">
              <el-icon style="margin-right: 4px"><DataLine /></el-icon>
              {{ ANALYTICS_VIEW_MODE.COMPARISON.label }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <div v-show="viewMode === ANALYTICS_VIEW_MODE.LIST.value" class="content-section card-content">
          <QyTableToolbar
            :show-create="false"
            :show-export="true"
            :show-refresh="true"
            @refresh="fetchStats"
          />
          <QyDataTable
            :columns="tableColumns"
            :data="statsList"
            :loading="loading"
            :total="pagination.total"
            :page="pagination.page"
            :page-size="pagination.pageSize"
            :index="true"
            @page-change="handlePageChange"
            @size-change="handleSizeChange"
            @sort-change="handleSortChange"
            @row-click="handleRowClick"
          >
            <template #contentTitle="{ row }">
              <span class="table-link">{{ row.content?.contentTitle || '-' }}</span>
            </template>
            <template #contentCategory="{ row }">
              <el-tag size="small">{{ getEnumLabel(CONTENT_CATEGORY, row.content?.contentCategory || 0) }}</el-tag>
            </template>
            <template #statDate="{ row }">
              {{ formatDate(row.statDate, DATE_FORMAT_STRING.DATE) }}
            </template>
            <template #playCount="{ row }">
              {{ formatPlayCount(row.playCount) }}
            </template>
            <template #interactionRate="{ row }">
              {{ formatInteractionRate(row.interactionRate) }}
            </template>
            <template #interactionTag="{ row }">
              <el-tag
                v-if="row.interactionTag === INTERACTION_TAG.HIGH_QUALITY.value"
                :type="getInteractionTagInfo(row.interactionTag).type as any"
                size="small"
                effect="light"
              >
                <el-icon style="margin-right: 2px"><CircleCheck /></el-icon>
                {{ getInteractionTagInfo(row.interactionTag).label }}
              </el-tag>
              <el-tag
                v-else-if="row.interactionTag === INTERACTION_TAG.NEED_OPTIMIZE.value"
                :type="getInteractionTagInfo(row.interactionTag).type as any"
                size="small"
                effect="light"
              >
                <el-icon style="margin-right: 2px"><Warning /></el-icon>
                {{ getInteractionTagInfo(row.interactionTag).label }}
              </el-tag>
              <el-tag
                v-else-if="row.interactionTag === INTERACTION_TAG.ABNORMAL.value"
                :type="getInteractionTagInfo(row.interactionTag).type as any"
                size="small"
                effect="light"
              >
                {{ getInteractionTagInfo(row.interactionTag).label }}
              </el-tag>
              <el-tag
                v-else
                :type="getInteractionTagInfo(row.interactionTag).type as any"
                size="small"
                effect="plain"
              >
                {{ getInteractionTagInfo(row.interactionTag).label }}
              </el-tag>
            </template>
          </QyDataTable>
        </div>

        <div v-show="viewMode === ANALYTICS_VIEW_MODE.TREND.value" class="content-section card-content">
          <QySkeleton variant="chart" :loading="trendLoading">
            <div ref="trendChartRef" class="chart-container"></div>
          </QySkeleton>
        </div>

        <div v-show="viewMode === ANALYTICS_VIEW_MODE.COMPARISON.value" class="content-section card-content">
          <QySkeleton variant="chart" :loading="comparisonLoading">
            <div ref="comparisonChartRef" class="chart-container"></div>
          </QySkeleton>
        </div>
      </div>
    </transition>

    <QySkeleton v-if="loading" variant="table" :rows="8" />

    <el-dialog
      v-model="detailDialogVisible"
      title="互动数据详情"
      width="680px"
      custom-class="detail-dialog"
      destroy-on-close
    >
      <div v-if="currentDetailItem" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="内容标题" :span="2">
            {{ currentDetailItem.content?.contentTitle || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="内容品类">
            {{ getEnumLabel(CONTENT_CATEGORY, currentDetailItem.content?.contentCategory || 0) }}
          </el-descriptions-item>
          <el-descriptions-item label="统计日期">
            {{ formatDate(currentDetailItem.statDate, DATE_FORMAT_STRING.DATE) }}
          </el-descriptions-item>
          <el-descriptions-item label="播放数">
            {{ formatPlayCount(currentDetailItem.playCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="总互动数">
            {{ formatNumber(currentDetailItem.totalInteractions) }}
          </el-descriptions-item>
          <el-descriptions-item label="评论数">
            {{ formatNumber(currentDetailItem.commentCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="弹幕数">
            {{ formatNumber(currentDetailItem.danmakuCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="点赞数">
            {{ formatNumber(currentDetailItem.likeCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="转发数">
            {{ formatNumber(currentDetailItem.shareCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="收藏数">
            {{ formatNumber(currentDetailItem.collectCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="互动率" :span="2">
            {{ formatInteractionRate(currentDetailItem.interactionRate) }}
          </el-descriptions-item>
          <el-descriptions-item label="互动标签">
            <el-tag
              :type="getInteractionTagInfo(currentDetailItem.interactionTag).type as any"
              size="small"
            >
              {{ getInteractionTagInfo(currentDetailItem.interactionTag).label }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="是否异常">
            <el-tag :type="currentDetailItem.isAnomaly ? 'danger' : 'success'" size="small">
              {{ currentDetailItem.isAnomaly ? '异常' : '正常' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.analytics-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-bar {
  .filter-form {
    margin-bottom: 0;

    .el-form-item {
      margin-bottom: 0;
      margin-right: 16px;
    }
  }
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-label {
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

.stat-trend {
  margin-top: 8px;
  display: flex;
  gap: 16px;

  .trend-item {
    font-size: $font-xs;
    color: $text-placeholder;

    .trend-up {
      color: $success-color;
      margin-left: 4px;
    }

    .trend-down {
      color: $danger-color;
      margin-left: 4px;
    }
  }
}

.view-mode-switch {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.content-section {
  min-height: 400px;
}

.chart-container {
  height: 420px;
  width: 100%;
}

.table-link {
  color: $primary-color;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.detail-content {
  padding: 8px 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.detail-dialog) {
  .detail-dialog-enter-active {
    animation: slideDownFade 0.3s ease;
  }
}

@keyframes slideDownFade {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
