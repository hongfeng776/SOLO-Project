<template>
  <div class="dashboard">
    <div class="stat-cards">
      <div class="stat-card" v-for="(card, index) in statCards" :key="index">
        <div class="card-header">
          <div class="card-icon" :style="{ background: card.bgColor }">
            <el-icon :size="24" :color="'#fff'">
              <component :is="card.icon" />
            </el-icon>
          </div>
          <el-tag v-if="card.trend !== undefined" :type="card.trend >= 0 ? 'success' : 'danger'" size="small" effect="light" round>
            <el-icon style="vertical-align: -2px;">
              <component :is="card.trend >= 0 ? 'Top' : 'Bottom'" />
            </el-icon>
            {{ Math.abs(card.trend).toFixed(1) }}%
          </el-tag>
        </div>
        <div class="card-label">{{ card.label }}</div>
        <div class="card-value" :style="{ color: card.valueColor }">
          {{ card.isAmount ? formatAmountWithSymbol(card.value) : card.isPercent ? (card.value * 100).toFixed(2) + '%' : formatLargeNumber(card.value) }}
        </div>
        <div class="card-sub">
          <span class="sub-label">{{ card.subLabel }}</span>
          <span class="sub-value">{{ card.isSubAmount ? formatAmountWithSymbol(card.subValue) : card.isSubPercent ? (card.subValue * 100).toFixed(2) + '%' : formatLargeNumber(card.subValue) }}</span>
        </div>
      </div>
    </div>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="16">
        <div class="chart-card">
          <div class="card-toolbar">
            <div class="chart-title">销售趋势</div>
            <el-radio-group v-model="salesDays" size="small" @change="refreshSalesChart">
              <el-radio-button :value="7">近7天</el-radio-button>
              <el-radio-button :value="30">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="salesChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">订单状态分布</div>
          <div ref="orderChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">商品热销 TOP10</div>
          <div ref="goodsChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">用户等级分布</div>
          <div ref="userLevelChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="16">
        <div class="chart-card">
          <div class="card-toolbar">
            <div class="chart-title">实时订单流水</div>
            <el-tag type="success" size="small" effect="light">
              <span class="pulse-dot"></span>实时更新
            </el-tag>
          </div>
          <el-table :data="realtimeOrders" stripe size="small" style="width: 100%">
            <el-table-column prop="orderNo" label="订单号" width="160" show-overflow-tooltip />
            <el-table-column prop="username" label="用户" width="100" />
            <el-table-column prop="goodsName" label="商品" show-overflow-tooltip />
            <el-table-column label="金额" width="110" align="right">
              <template #default="{ row }">
                <span class="amount-text">{{ formatAmountWithSymbol(row.amount) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">
                  {{ row.statusName || statusMap[row.status]?.label || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">营销活动 ROI 对比</div>
          <div ref="roiChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import type { DashboardOverview, SalesTrendItem, HotGoodsItem, RealtimeOrder } from '@/api/statistics'
import { formatAmountWithSymbol, formatLargeNumber } from '@/utils/amount'
import { formatDateTime } from '@/utils/date'

const statusMap: Record<number, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  0: { label: '待付款', type: 'warning' },
  1: { label: '已付款', type: 'primary' },
  2: { label: '已发货', type: 'info' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已取消', type: 'danger' },
  5: { label: '已退款', type: 'danger' }
}

const salesDays = ref(7)
const salesChartRef = ref<HTMLElement>()
const orderChartRef = ref<HTMLElement>()
const goodsChartRef = ref<HTMLElement>()
const userLevelChartRef = ref<HTMLElement>()
const roiChartRef = ref<HTMLElement>()

let salesChart: echarts.ECharts | null = null
let orderChart: echarts.ECharts | null = null
let goodsChart: echarts.ECharts | null = null
let userLevelChart: echarts.ECharts | null = null
let roiChart: echarts.ECharts | null = null
let resizeTimer: number | null = null
let refreshTimer: number | null = null

const overview = reactive<DashboardOverview>({
  todayGmv: 586520.5,
  todayOrders: 2856,
  todayUsers: 1568,
  todayRefundRate: 0.0235,
  todayConversionRate: 0.0862,
  todayAvgOrderValue: 205.36,
  yesterdayGmv: 512680,
  yesterdayOrders: 2468,
  yesterdayUsers: 1392,
  gmvGrowth: 14.4,
  ordersGrowth: 15.7,
  usersGrowth: 12.6
})

const statCards = ref([
  { label: '今日 GMV', value: overview.todayGmv, isAmount: true, bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', valueColor: '#667eea', icon: 'Money', trend: overview.gmvGrowth, subLabel: '昨日', subValue: overview.yesterdayGmv, isSubAmount: true },
  { label: '订单数', value: overview.todayOrders, isAmount: false, bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', valueColor: '#f5576c', icon: 'List', trend: overview.ordersGrowth, subLabel: '昨日', subValue: overview.yesterdayOrders },
  { label: '用户数', value: overview.todayUsers, isAmount: false, bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', valueColor: '#4facfe', icon: 'User', trend: overview.usersGrowth, subLabel: '昨日', subValue: overview.yesterdayUsers },
  { label: '退款率', value: overview.todayRefundRate, isPercent: true, bgColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', valueColor: '#fa709a', icon: 'Refund', subLabel: '行业均值', subValue: 0.035, isSubPercent: true },
  { label: '转化率', value: overview.todayConversionRate, isPercent: true, bgColor: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', valueColor: '#30cfd0', icon: 'TrendCharts', subLabel: '目标值', subValue: 0.10, isSubPercent: true },
  { label: '客单价', value: overview.todayAvgOrderValue, isAmount: true, bgColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', valueColor: '#009688', icon: 'Goods', subLabel: '上月均值', subValue: 192.5, isSubAmount: true }
])

const salesTrendData = ref<SalesTrendItem[]>([])
const hotGoodsData = ref<HotGoodsItem[]>([])
const realtimeOrders = ref<RealtimeOrder[]>([])

const generateSalesData = (days: number) => {
  const data: SalesTrendItem[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const baseAmount = days === 7 ? 250000 : 200000
    data.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      amount: Math.floor(baseAmount + Math.random() * 150000),
      orders: Math.floor(800 + Math.random() * 1500),
      visitors: Math.floor(10000 + Math.random() * 20000)
    })
  }
  return data
}

const generateHotGoods = () => {
  const goodsNames = [
    'iPhone 15 Pro Max 256G 原色钛金属',
    '华为 Mate 60 Pro 12+512G 雅川青',
    '小米14 Ultra 摄影套装版',
    '索尼 WH-1000XM5 无线降噪耳机',
    'Apple Watch Series 9 GPS 45mm',
    '戴尔 XPS 15 13代酷睿i7',
    '大疆 DJI Mini 4 Pro 无人机',
    'iPad Pro 12.9 寸 M2 芯片',
    'Switch OLED 马里奥红限定版',
    '戴森 V15 Detect 吸尘器'
  ]
  return goodsNames.map((name, i) => ({
    id: i + 1,
    name,
    image: '',
    sales: Math.floor(150 + Math.random() * 300),
    amount: Math.floor(50000 + Math.random() * 300000),
    stock: Math.floor(50 + Math.random() * 500)
  })).sort((a, b) => b.sales - a.sales)
}

const generateRealtimeOrders = () => {
  const usernames = ['张**', '李**', '王**', '赵**', '陈**', '刘**', '杨**', '黄**', '周**', '吴**']
  const goods = ['iPhone 15 Pro', '华为 Mate60', '小米14', 'AirPods Pro', '戴森吹风机', '索尼耳机', 'Switch游戏机', 'iPad Air', 'MacBook Air', '大疆无人机']
  const orders: RealtimeOrder[] = []
  for (let i = 0; i < 8; i++) {
    const status = Math.floor(Math.random() * 6)
    const now = new Date()
    now.setMinutes(now.getMinutes() - Math.floor(Math.random() * 60))
    orders.push({
      id: 100000 + i,
      orderNo: `SO${Date.now()}${i}`,
      username: usernames[Math.floor(Math.random() * usernames.length)],
      goodsName: goods[Math.floor(Math.random() * goods.length)],
      amount: Math.floor(100 + Math.random() * 9900),
      status,
      statusName: statusMap[status]?.label || '',
      createdAt: now.toISOString()
    })
  }
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

const initSalesChart = () => {
  if (!salesChartRef.value) return
  if (salesChart) salesChart.dispose()
  salesChart = echarts.init(salesChartRef.value)
  const dates = salesTrendData.value.map(d => d.date)
  salesChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['销售额', '订单数', '访客数'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: [
      { type: 'value', name: '金额/订单', position: 'left', axisLabel: { formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v } },
      { type: 'value', name: '访客数', position: 'right', axisLabel: { formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v } }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3, color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(102,126,234,0.5)' }, { offset: 1, color: 'rgba(102,126,234,0.05)' }]) },
        itemStyle: { color: '#667eea' },
        data: salesTrendData.value.map(d => d.amount)
      },
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        itemStyle: { color: '#f5576c' },
        data: salesTrendData.value.map(d => d.orders)
      },
      {
        name: '访客数',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        itemStyle: { color: '#4facfe' },
        data: salesTrendData.value.map(d => d.visitors)
      }
    ]
  })
}

const initOrderChart = () => {
  if (!orderChartRef.value) return
  if (orderChart) orderChart.dispose()
  orderChart = echarts.init(orderChartRef.value)
  orderChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, left: 'center' },
    series: [{
      name: '订单状态',
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      data: [
        { value: 356, name: '待付款', itemStyle: { color: '#e6a23c' } },
        { value: 528, name: '已付款', itemStyle: { color: '#409eff' } },
        { value: 485, name: '已发货', itemStyle: { color: '#909399' } },
        { value: 1256, name: '已完成', itemStyle: { color: '#67c23a' } },
        { value: 126, name: '已取消', itemStyle: { color: '#f56c6c' } },
        { value: 105, name: '已退款', itemStyle: { color: '#c0c4cc' } }
      ]
    }]
  })
}

const initGoodsChart = () => {
  if (!goodsChartRef.value) return
  if (goodsChart) goodsChart.dispose()
  goodsChart = echarts.init(goodsChartRef.value)
  const goods = hotGoodsData.value.slice(0, 10).reverse()
  goodsChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (params: any) => {
      const p = params[0]
      return `${p.name}<br/>销量: ${p.value}<br/>销售额: ${formatAmountWithSymbol(goods[p.dataIndex].amount)}`
    }},
    grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: goods.map(g => g.name.length > 12 ? g.name.slice(0, 12) + '...' : g.name), axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar',
      data: goods.map((g, i) => ({
        value: g.sales,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: ['#f5576c', '#f093fb', '#ffa751', '#ffe259', '#a8ff78', '#78ffd6', '#74ebd5', '#6dd5ed', '#667eea', '#a8edea'][i] },
            { offset: 1, color: ['#fee140', '#f5576c', '#ffe000', '#ffa751', '#78ffd6', '#667eea', '#acb6e5', '#4facfe', '#764ba2', '#fed6e3'][i] }
          ]),
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: '60%',
      label: { show: true, position: 'right', formatter: '{c}' }
    }]
  })
}

const initUserLevelChart = () => {
  if (!userLevelChartRef.value) return
  if (userLevelChart) userLevelChart.dispose()
  userLevelChart = echarts.init(userLevelChartRef.value)
  const data = [
    { value: 12568, name: '普通会员', itemStyle: { color: '#c0c4cc' } },
    { value: 5682, name: '白银会员', itemStyle: { color: '#c0c0c0' } },
    { value: 2156, name: '黄金会员', itemStyle: { color: '#f7ba2a' } },
    { value: 685, name: '铂金会员', itemStyle: { color: '#e5e4e2' } },
    { value: 168, name: '钻石会员', itemStyle: { color: '#667eea' } }
  ]
  const total = data.reduce((sum, d) => sum + d.value, 0)
  userLevelChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
    title: { text: formatLargeNumber(total), subtext: '总用户数', left: '38%', top: '38%', textAlign: 'center', textStyle: { fontSize: 24, fontWeight: 'bold', color: '#303133' }, subtextStyle: { fontSize: 13, color: '#909399' } },
    series: [{
      name: '用户等级',
      type: 'pie',
      radius: ['55%', '75%'],
      center: ['38%', '50%'],
      avoidLabelOverlap: false,
      label: { show: false },
      emphasis: { scale: true, scaleSize: 10, label: { show: true, fontSize: 13, fontWeight: 'bold', formatter: '{b}\n{d}%' } },
      data
    }]
  })
}

const initRoiChart = () => {
  if (!roiChartRef.value) return
  if (roiChart) roiChart.dispose()
  roiChart = echarts.init(roiChartRef.value)
  const campaigns = ['新人券', '满减活动', '限时折扣', '拼团活动', '会员专享']
  const costs = [50000, 80000, 60000, 45000, 35000]
  const revenues = [180000, 320000, 210000, 150000, 140000]
  const rois = revenues.map((r, i) => Number(((r - costs[i]) / costs[i]).toFixed(2)))
  roiChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['投入成本', '营销收入', 'ROI'], top: 0, textStyle: { fontSize: 11 } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '18%', containLabel: true },
    xAxis: { type: 'category', data: campaigns, axisLabel: { interval: 0, rotate: 0, fontSize: 11 } },
    yAxis: [
      { type: 'value', name: '金额', axisLabel: { formatter: (v: number) => v >= 10000 ? (v / 10000).toFixed(1) + '万' : v } },
      { type: 'value', name: 'ROI', min: 0, max: Math.max(...rois) * 1.2, axisLabel: { formatter: '{value}x' } }
    ],
    series: [
      { name: '投入成本', type: 'bar', data: costs, itemStyle: { color: '#f5576c', borderRadius: [4, 4, 0, 0] }, barWidth: '25%' },
      { name: '营销收入', type: 'bar', data: revenues, itemStyle: { color: '#67c23a', borderRadius: [4, 4, 0, 0] }, barWidth: '25%' },
      { name: 'ROI', type: 'line', yAxisIndex: 1, smooth: true, symbolSize: 8, itemStyle: { color: '#667eea' }, lineStyle: { width: 3 }, data: rois, label: { show: true, formatter: '{c}x', fontSize: 11, fontWeight: 'bold' } }
    ]
  })
}

const refreshSalesChart = () => {
  salesTrendData.value = generateSalesData(salesDays.value)
  nextTick(() => initSalesChart())
}

const handleResize = () => {
  if (resizeTimer) window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    salesChart?.resize()
    orderChart?.resize()
    goodsChart?.resize()
    userLevelChart?.resize()
    roiChart?.resize()
  }, 100)
}

const refreshData = () => {
  realtimeOrders.value = generateRealtimeOrders()
}

onMounted(async () => {
  salesTrendData.value = generateSalesData(salesDays.value)
  hotGoodsData.value = generateHotGoods()
  realtimeOrders.value = generateRealtimeOrders()

  await nextTick()
  initSalesChart()
  initOrderChart()
  initGoodsChart()
  initUserLevelChart()
  initRoiChart()

  window.addEventListener('resize', handleResize)
  refreshTimer = window.setInterval(refreshData, 30000)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimer) window.clearTimeout(resizeTimer)
  if (refreshTimer) window.clearInterval(refreshTimer)
  salesChart?.dispose()
  orderChart?.dispose()
  goodsChart?.dispose()
  userLevelChart?.dispose()
  roiChart?.dispose()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.dashboard {
  .stat-cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: $spacing-base;
    margin-bottom: $spacing-base;
  }

  .stat-card {
    background: #fff;
    border-radius: $radius-md;
    padding: $spacing-base;
    box-shadow: $shadow-light;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: $shadow-base;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;
    }

    .card-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-label {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: 4px;
    }

    .card-value {
      font-size: 24px;
      font-weight: 700;
      line-height: 1.3;
      margin-bottom: 6px;
    }

    .card-sub {
      font-size: $font-size-xs;
      color: $text-placeholder;
      display: flex;
      justify-content: space-between;

      .sub-value {
        color: $text-secondary;
      }
    }
  }

  .chart-row {
    margin-bottom: $spacing-base;
  }

  .chart-card {
    background: #fff;
    border-radius: $radius-md;
    padding: $spacing-base;
    box-shadow: $shadow-light;
    height: 100%;

    .chart-title {
      font-size: $font-size-md;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: $spacing-sm;
    }

    .card-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-sm;

      .chart-title {
        margin-bottom: 0;
      }
    }

    .chart-container {
      width: 100%;
      height: 320px;
    }

    .pulse-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      background: #67c23a;
      border-radius: 50%;
      margin-right: 4px;
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  .amount-text {
    color: $primary-color;
    font-weight: 600;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

@media screen and (max-width: 1680px) {
  .dashboard .stat-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 1200px) {
  .dashboard .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
