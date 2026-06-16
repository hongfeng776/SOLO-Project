<template>
  <div class="ccb-dashboard">
    <CcbPageHeader
      title="运营概览"
      description="全渠道业务运营数据总览"
      icon="DataAnalysis"
    />

    <el-row :gutter="16" class="ccb-stat-cards">
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="4">
        <el-card class="ccb-stat-card" shadow="hover">
          <div class="ccb-stat-icon ccb-stat-icon-primary">
            <el-icon :size="28"><Money /></el-icon>
          </div>
          <div class="ccb-stat-content">
            <div class="ccb-stat-value">¥{{ formatMoneyWithComma(statistics.todayTransactionAmount) }}</div>
            <div class="ccb-stat-label">今日交易金额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="4">
        <el-card class="ccb-stat-card" shadow="hover">
          <div class="ccb-stat-icon ccb-stat-icon-success">
            <el-icon :size="28"><List /></el-icon>
          </div>
          <div class="ccb-stat-content">
            <div class="ccb-stat-value">{{ statistics.todayTransactionCount }}</div>
            <div class="ccb-stat-label">今日交易笔数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="4">
        <el-card class="ccb-stat-card" shadow="hover">
          <div class="ccb-stat-icon ccb-stat-icon-warning">
            <el-icon :size="28"><Clock /></el-icon>
          </div>
          <div class="ccb-stat-content">
            <div class="ccb-stat-value">{{ statistics.pendingAuditCount }}</div>
            <div class="ccb-stat-label">待审核数量</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="4">
        <el-card class="ccb-stat-card" shadow="hover">
          <div class="ccb-stat-icon ccb-stat-icon-info">
            <el-icon :size="28"><User /></el-icon>
          </div>
          <div class="ccb-stat-content">
            <div class="ccb-stat-value">{{ statistics.activeUserCount }}</div>
            <div class="ccb-stat-label">活跃用户数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="4">
        <el-card class="ccb-stat-card" shadow="hover">
          <div class="ccb-stat-icon ccb-stat-icon-danger">
            <el-icon :size="28"><Goods /></el-icon>
          </div>
          <div class="ccb-stat-content">
            <div class="ccb-stat-value">{{ statistics.totalProductCount }}</div>
            <div class="ccb-stat-label">在售产品数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6" :xl="4">
        <el-card class="ccb-stat-card" shadow="hover">
          <div class="ccb-stat-icon ccb-stat-icon-secondary">
            <el-icon :size="28"><Connection /></el-icon>
          </div>
          <div class="ccb-stat-content">
            <div class="ccb-stat-value">{{ statistics.totalChannelCount }}</div>
            <div class="ccb-stat-label">接入渠道数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="ccb-chart-row">
      <el-col :md="16">
        <el-card class="ccb-chart-card" shadow="hover">
          <template #header>
            <div class="ccb-chart-header">
              <span>业务交易趋势</span>
              <el-radio-group v-model="trendDays" size="small">
                <el-radio-button :value="7">近7天</el-radio-button>
                <el-radio-button :value="30">近30天</el-radio-button>
                <el-radio-button :value="90">近90天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="ccb-chart-container"></div>
        </el-card>
      </el-col>
      <el-col :md="8">
        <el-card class="ccb-chart-card" shadow="hover">
          <template #header>
            <span>渠道交易占比</span>
          </template>
          <div ref="channelChartRef" class="ccb-chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="ccb-chart-row">
      <el-col :md="12">
        <el-card class="ccb-chart-card" shadow="hover">
          <template #header>
            <span>审核状态分布</span>
          </template>
          <div ref="auditChartRef" class="ccb-chart-container"></div>
        </el-card>
      </el-col>
      <el-col :md="12">
        <el-card class="ccb-chart-card" shadow="hover">
          <template #header>
            <span>待办提醒</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in todoList"
              :key="index"
              :timestamp="item.time"
              :type="item.type"
              :hollow="true"
            >
              {{ item.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Money, List, Clock, User, Goods, Connection } from '@element-plus/icons-vue'
import { formatMoneyWithComma, formatDateTime } from '@utils'
import {
  getOverviewApi,
  getChannelApi,
  getTrendApi,
  getAuditApi,
  getRiskApi
} from '@api/dashboard'
import type {
  OverviewData,
  ChannelItem,
  TrendItem,
  AuditItem,
  RiskItem
} from '@api/dashboard'

const trendChartRef = ref<HTMLElement | null>(null)
const channelChartRef = ref<HTMLElement | null>(null)
const auditChartRef = ref<HTMLElement | null>(null)

let trendChart: echarts.ECharts | null = null
let channelChart: echarts.ECharts | null = null
let auditChart: echarts.ECharts | null = null

const trendDays = ref<number>(7)

const statistics = reactive<OverviewData>({
  todayTransactionAmount: 0,
  todayTransactionCount: 0,
  pendingAuditCount: 0,
  activeUserCount: 0,
  totalProductCount: 0,
  totalChannelCount: 0
})

const mockStatistics: OverviewData = {
  todayTransactionAmount: 12580600.00,
  todayTransactionCount: 3256,
  pendingAuditCount: 128,
  activeUserCount: 892,
  totalProductCount: 156,
  totalChannelCount: 5
}

const channelStats = ref<ChannelItem[]>([])
const mockChannelStats: ChannelItem[] = [
  { channelCode: 'counter', channelName: '柜面渠道', amount: 5860000, count: 1256, percentage: 46.6 },
  { channelCode: 'mobile', channelName: '手机银行', amount: 4230000, count: 986, percentage: 33.6 },
  { channelCode: 'ebank', channelName: '网上银行', amount: 1580000, count: 520, percentage: 12.6 },
  { channelCode: 'atm', channelName: '自助终端', amount: 720000, count: 356, percentage: 5.7 },
  { channelCode: 'phone', channelName: '电话银行', amount: 190600, count: 138, percentage: 1.5 }
]

const auditStats = ref<AuditItem[]>([])
const mockAuditStats: AuditItem[] = [
  { status: '待审核', count: 128, percentage: 35.6 },
  { status: '审核中', count: 64, percentage: 17.8 },
  { status: '审核通过', count: 142, percentage: 39.4 },
  { status: '审核驳回', count: 26, percentage: 7.2 }
]

const trendData = ref<TrendItem[]>([])
const mockTrendData: Record<number, TrendItem[]> = {
  7: [
    { date: '06-10', amount: 8560000, count: 2356 },
    { date: '06-11', amount: 9230000, count: 2586 },
    { date: '06-12', amount: 7860000, count: 2120 },
    { date: '06-13', amount: 10520000, count: 2896 },
    { date: '06-14', amount: 9860000, count: 2656 },
    { date: '06-15', amount: 11230000, count: 3012 },
    { date: '06-16', amount: 12580600, count: 3256 }
  ],
  30: [],
  90: []
}

const riskStats = ref<RiskItem[]>([])
const mockRiskStats: RiskItem[] = [
  { riskLevel: '高风险', count: 12, percentage: 15.0 },
  { riskLevel: '中风险', count: 28, percentage: 35.0 },
  { riskLevel: '低风险', count: 40, percentage: 50.0 }
]

const todoList = ref<{ time: string; type: string; content: string }[]>([])

interface TodoItem {
  time: string
  type: string
  content: string
}

const buildTodoList = (stats: OverviewData, risks: RiskItem[], audits: AuditItem[]): TodoItem[] => {
  const now = formatDateTime(new Date().toISOString())
  const todos: TodoItem[] = []

  if (stats.pendingAuditCount > 0) {
    todos.push({
      time: now,
      type: 'warning',
      content: `有 ${stats.pendingAuditCount} 笔业务待审核`
    })
  }

  const highRisk = risks.find(r => r.riskLevel === '高风险')
  if (highRisk && highRisk.count > 0) {
    todos.push({
      time: now,
      type: 'danger',
      content: `有 ${highRisk.count} 笔高风险违规待处理`
    })
  }

  const pending = audits.find(a => a.status === '待审核')
  if (pending && pending.count > 0) {
    todos.push({
      time: now,
      type: 'primary',
      content: `待审核业务 ${pending.count} 笔，请及时处理`
    })
  }

  const rejected = audits.find(a => a.status === '审核驳回')
  if (rejected && rejected.count > 0) {
    todos.push({
      time: now,
      type: 'info',
      content: `审核驳回 ${rejected.count} 笔，请关注复核`
    })
  }

  if (todos.length === 0) {
    todos.push({
      time: now,
      type: 'success',
      content: '暂无待办事项，运营状态良好'
    })
  }

  return todos
}

const initTrendChart = (): void => {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value)
  }
  const data = trendData.value.length > 0 ? trendData.value : (mockTrendData[trendDays.value] || mockTrendData[7])

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['交易金额(万元)', '交易笔数'],
      right: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map((item) => item.date)
    },
    yAxis: [
      {
        type: 'value',
        name: '金额(万元)',
        axisLabel: {
          formatter: '{value}'
        }
      },
      {
        type: 'value',
        name: '笔数',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: [
      {
        name: '交易金额(万元)',
        type: 'line',
        smooth: true,
        data: data.map((item) => (item.amount / 10000).toFixed(0)),
        itemStyle: { color: '#004098' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(0, 64, 152, 0.3)' },
            { offset: 1, color: 'rgba(0, 64, 152, 0.05)' }
          ])
        }
      },
      {
        name: '交易笔数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: data.map((item) => item.count),
        itemStyle: { color: '#c9a961' }
      }
    ]
  }
  trendChart.setOption(option)
}

const initChannelChart = (): void => {
  if (!channelChartRef.value) return
  if (!channelChart) {
    channelChart = echarts.init(channelChartRef.value)
  }
  const data = channelStats.value.length > 0 ? channelStats.value : mockChannelStats

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        name: '渠道占比',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        data: data.map((item, index) => ({
          value: item.percentage,
          name: item.channelName,
          itemStyle: {
            color: ['#004098', '#1e63c4', '#c9a961', '#52c41a', '#faad14'][index % 5]
          }
        }))
      }
    ]
  }
  channelChart.setOption(option)
}

const initAuditChart = (): void => {
  if (!auditChartRef.value) return
  if (!auditChart) {
    auditChart = echarts.init(auditChartRef.value)
  }
  const data = auditStats.value.length > 0 ? auditStats.value : mockAuditStats

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.status)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '数量',
        type: 'bar',
        barWidth: '50%',
        data: data.map((item, index) => ({
          value: item.count,
          itemStyle: {
            color: ['#faad14', '#1890ff', '#52c41a', '#f5222d'][index % 4],
            borderRadius: [4, 4, 0, 0]
          }
        })),
        label: {
          show: true,
          position: 'top',
          formatter: '{c}'
        }
      }
    ]
  }
  auditChart.setOption(option)
}

const handleResize = (): void => {
  trendChart?.resize()
  channelChart?.resize()
  auditChart?.resize()
}

const fetchStatistics = async (): Promise<void> => {
  try {
    const res = await getOverviewApi()
    if (res) {
      Object.assign(statistics, res)
    } else {
      Object.assign(statistics, mockStatistics)
    }
  } catch {
    Object.assign(statistics, mockStatistics)
  }
}

const fetchChannelStats = async (): Promise<void> => {
  try {
    const res = await getChannelApi()
    if (res && res.length > 0) {
      channelStats.value = res
    } else {
      channelStats.value = mockChannelStats
    }
  } catch {
    channelStats.value = mockChannelStats
  }
}

const fetchTrendData = async (): Promise<void> => {
  try {
    const res = await getTrendApi(trendDays.value)
    if (res && res.length > 0) {
      trendData.value = res
    } else {
      trendData.value = mockTrendData[trendDays.value] || mockTrendData[7]
    }
  } catch {
    trendData.value = mockTrendData[trendDays.value] || mockTrendData[7]
  }
}

const fetchAuditStats = async (): Promise<void> => {
  try {
    const res = await getAuditApi()
    if (res && res.length > 0) {
      auditStats.value = res
    } else {
      auditStats.value = mockAuditStats
    }
  } catch {
    auditStats.value = mockAuditStats
  }
}

const fetchRiskStats = async (): Promise<void> => {
  try {
    const res = await getRiskApi()
    if (res && res.length > 0) {
      riskStats.value = res
    } else {
      riskStats.value = mockRiskStats
    }
  } catch {
    riskStats.value = mockRiskStats
  }
}

const fetchAllData = async (): Promise<void> => {
  await Promise.all([
    fetchStatistics(),
    fetchChannelStats(),
    fetchTrendData(),
    fetchAuditStats(),
    fetchRiskStats()
  ])
  todoList.value = buildTodoList(statistics, riskStats.value, auditStats.value)
}

watch(trendDays, async () => {
  await fetchTrendData()
  nextTick(() => {
    initTrendChart()
  })
})

onMounted(async () => {
  await fetchAllData()
  nextTick(() => {
    initTrendChart()
    initChannelChart()
    initAuditChart()
  })
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  channelChart?.dispose()
  auditChart?.dispose()
})
</script>

<style lang="scss" scoped>
.ccb-dashboard {
  .ccb-stat-cards {
    margin-bottom: 16px;
  }

  .ccb-stat-card {
    border-radius: 8px;
    margin-bottom: 16px;

    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
  }

  .ccb-stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    &.ccb-stat-icon-primary {
      background: linear-gradient(135deg, #004098 0%, #1e63c4 100%);
    }

    &.ccb-stat-icon-success {
      background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
    }

    &.ccb-stat-icon-warning {
      background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
    }

    &.ccb-stat-icon-info {
      background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
    }

    &.ccb-stat-icon-danger {
      background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%);
    }

    &.ccb-stat-icon-secondary {
      background: linear-gradient(135deg, #c9a961 0%, #d4bc7c 100%);
    }
  }

  .ccb-stat-content {
    flex: 1;

    .ccb-stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #262626;
      margin-bottom: 4px;
    }

    .ccb-stat-label {
      font-size: 13px;
      color: #8c8c8c;
    }
  }

  .ccb-chart-row {
    margin-bottom: 16px;
  }

  .ccb-chart-card {
    border-radius: 8px;
    height: 100%;

    :deep(.el-card__header) {
      padding: 16px 20px;
      font-weight: 600;
      border-bottom: 1px solid #f0f0f0;
    }

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .ccb-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .ccb-chart-container {
    width: 100%;
    height: 320px;
  }
}
</style>
