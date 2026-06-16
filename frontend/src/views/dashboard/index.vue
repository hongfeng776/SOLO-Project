<template>
  <div class="dashboard">
    <div class="card-container">
      <div class="stat-card" v-for="stat in statsCards" :key="stat.label">
        <div class="stat-label">{{ stat.label }}</div>
        <div class="stat-value" :class="stat.color">
          {{ stat.isAmount ? formatAmountWithSymbol(stat.value) : formatLargeNumber(stat.value) }}
        </div>
      </div>
    </div>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-title">近7日销售趋势</div>
          <div ref="salesChartRef" style="width: 100%; height: 320px;"></div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-title">订单状态分布</div>
          <div ref="orderChartRef" style="width: 100%; height: 320px;"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="chart-row">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">热销商品TOP10</div>
          <el-table :data="topGoods" stripe>
            <el-table-column type="index" label="排名" width="70" align="center">
              <template #default="{ $index }">
                <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index]">{{ $index + 1 }}</el-tag>
                <span v-else>{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" show-overflow-tooltip />
            <el-table-column prop="sales" label="销量" width="100" align="center" />
            <el-table-column label="销售额" width="140" align="right">
              <template #default="{ row }">
                <span class="amount-text">{{ formatAmount(row.amount) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-title">用户增长趋势</div>
          <div ref="userChartRef" style="width: 100%; height: 320px;"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { formatAmount, formatAmountWithSymbol, formatLargeNumber } from '@/utils/amount'

const salesChartRef = ref<HTMLElement>()
const orderChartRef = ref<HTMLElement>()
const userChartRef = ref<HTMLElement>()

let salesChart: echarts.ECharts | null = null
let orderChart: echarts.ECharts | null = null
let userChart: echarts.ECharts | null = null

const statsCards = ref([
  { label: '今日订单', value: 1286, color: 'primary', isAmount: false },
  { label: '今日销售额', value: 286500, color: 'success', isAmount: true },
  { label: '今日新增用户', value: 358, color: 'warning', isAmount: false },
  { label: '今日访问量', value: 28650, color: 'info', isAmount: false }
])

const topGoods = ref([
  { name: 'iPhone 15 Pro Max 256G 原色钛金属', sales: 286, amount: 286000 },
  { name: '华为 Mate 60 Pro 12+512G 雅川青', sales: 245, amount: 245000 },
  { name: '小米14 Ultra 摄影套装版', sales: 198, amount: 178200 },
  { name: '索尼 WH-1000XM5 无线降噪耳机', sales: 168, amount: 45360 },
  { name: 'Apple Watch Series 9 GPS 45mm', sales: 156, amount: 46800 }
])

const initCharts = async () => {
  await nextTick()

  if (salesChartRef.value) {
    salesChart = echarts.init(salesChartRef.value)
    salesChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['6/10', '6/11', '6/12', '6/13', '6/14', '6/15', '6/16']
      },
      yAxis: { type: 'value' },
      series: [{
        name: '销售额',
        type: 'line',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        itemStyle: { color: '#409eff' },
        data: [185000, 192000, 210000, 245000, 268000, 275000, 286500]
      }]
    })
  }

  if (orderChartRef.value) {
    orderChart = echarts.init(orderChartRef.value)
    orderChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        name: '订单状态',
        type: 'pie',
        radius: ['40%', '65%'],
        avoidLabelOverlap: false,
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 'bold' }
        },
        data: [
          { value: 256, name: '待付款', itemStyle: { color: '#e6a23c' } },
          { value: 428, name: '已付款', itemStyle: { color: '#409eff' } },
          { value: 385, name: '已发货', itemStyle: { color: '#909399' } },
          { value: 856, name: '已完成', itemStyle: { color: '#67c23a' } },
          { value: 86, name: '已取消', itemStyle: { color: '#f56c6c' } }
        ]
      }]
    })
  }

  if (userChartRef.value) {
    userChart = echarts.init(userChartRef.value)
    userChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['6/10', '6/11', '6/12', '6/13', '6/14', '6/15', '6/16']
      },
      yAxis: { type: 'value' },
      series: [{
        name: '新增用户',
        type: 'bar',
        itemStyle: { color: '#67c23a' },
        data: [268, 285, 312, 298, 345, 368, 358]
      }]
    })
  }

  window.addEventListener('resize', () => {
    salesChart?.resize()
    orderChart?.resize()
    userChart?.resize()
  })
}

onMounted(() => {
  initCharts()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.chart-row {
  margin-bottom: $spacing-base;
}

.chart-card {
  background: #fff;
  border-radius: $radius-md;
  padding: $spacing-base;
  box-shadow: $shadow-light;

  .chart-title {
    font-size: $font-size-md;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: $spacing-base;
  }
}
</style>
