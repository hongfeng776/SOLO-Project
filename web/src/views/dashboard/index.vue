<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="12" :md="6" v-for="item in statCards" :key="item.label">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-card__icon" :style="{ background: item.bgColor }">
            <el-icon :size="28" color="#fff">
              <component :is="item.icon" />
            </el-icon>
          </div>
          <div class="stat-card__info">
            <p class="stat-card__label">{{ item.label }}</p>
            <p class="stat-card__value">{{ item.value }}</p>
            <p class="stat-card__growth" :class="{ positive: item.growth >= 0 }">
              <el-icon><component :is="item.growth >= 0 ? 'Top' : 'Bottom'" /></el-icon>
              {{ Math.abs(item.growth) }}%
            </p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
              <el-radio-group v-model="trendDays" size="small">
                <el-radio-button :value="7">近7天</el-radio-button>
                <el-radio-button :value="30">近30天</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <span>渠道分布</span>
          </template>
          <div ref="pieChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick, computed } from 'vue'
import { useECharts } from '@/composables/useECharts'

const statCards = reactive([
  { label: '订单总数', value: '12,345', icon: 'List', bgColor: '#409EFF', growth: 12.5 },
  { label: '总金额', value: '¥234.5万', icon: 'Money', bgColor: '#67C23A', growth: 8.2 },
  { label: '总用户', value: '6,789', icon: 'User', bgColor: '#E6A23C', growth: 15.3 },
  { label: '总佣金', value: '¥23.4万', icon: 'Wallet', bgColor: '#F56C6C', growth: -3.1 },
])

const trendDays = ref(7)
const trendChart = useECharts()
const pieChart = useECharts()

const trendChartRef = computed(() => trendChart.chartRef.value)
const pieChartRef = computed(() => pieChart.chartRef.value)

function renderTrendChart() {
  const days = trendDays.value
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  trendChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: { data: ['订单数', '金额'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: [
      { type: 'value', name: '订单数' },
      { type: 'value', name: '金额(元)', position: 'right' },
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: Array.from({ length: days }, () => Math.floor(Math.random() * 500 + 100)),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.01)' },
            ],
          },
        },
      },
      {
        name: '金额',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: Array.from({ length: days }, () => Math.floor(Math.random() * 50000 + 5000)),
      },
    ],
  })
}

function renderPieChart() {
  pieChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0', left: 'center' },
    series: [
      {
        name: '渠道',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: '16', fontWeight: 'bold' },
        },
        data: [
          { value: 1048, name: '微信渠道' },
          { value: 735, name: '抖音渠道' },
          { value: 580, name: '微博渠道' },
          { value: 484, name: '小红书' },
          { value: 300, name: '其他渠道' },
        ],
      },
    ],
  })
}

onMounted(() => {
  nextTick(() => {
    renderTrendChart()
    renderPieChart()
  })
})

watch(trendDays, () => {
  nextTick(renderTrendChart)
})
</script>

<style scoped lang="scss">
.dashboard {
  .stat-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }

    &__icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    &__info {
      flex: 1;
    }

    &__label {
      margin: 0 0 8px;
      font-size: 14px;
      color: #909399;
    }

    &__value {
      margin: 0 0 6px;
      font-size: 24px;
      font-weight: 700;
      color: #303133;
    }

    &__growth {
      margin: 0;
      font-size: 12px;
      color: #F56C6C;
      display: flex;
      align-items: center;
      gap: 2px;

      &.positive {
        color: #67C23A;
      }
    }
  }

  .chart-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .chart-container {
      height: 360px;
      width: 100%;
    }
  }
}
</style>
