<template>
  <div class="analytics-page">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="订单分析" name="order">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header><span>订单量趋势</span></template>
              <div ref="orderTrendRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><span>完成率/取消率</span></template>
              <div ref="orderRateRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header><span>各状态分布</span></template>
              <div ref="orderStatusRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><span>时段分布</span></template>
              <div ref="orderHourRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="运力分析" name="capacity">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header><span>在线率趋势</span></template>
              <div ref="capOnlineRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><span>接单率</span></template>
              <div ref="capAcceptRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header><span>各类型运力分布</span></template>
              <div ref="capTypeRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><span>高峰供需比</span></template>
              <div ref="capSupplyRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="用户分析" name="user">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header><span>新增用户趋势</span></template>
              <div ref="userNewRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><span>活跃用户</span></template>
              <div ref="userActiveRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header><span>消费分布</span></template>
              <div ref="userConsumeRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="财务分析" name="finance">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header><span>收入趋势</span></template>
              <div ref="finIncomeRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><span>支出分布</span></template>
              <div ref="finExpenseRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header><span>各运力类型收入占比</span></template>
              <div ref="finTypeRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>

      <el-tab-pane label="风控分析" name="risk">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header><span>风险趋势</span></template>
              <div ref="riskTrendRef" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header><span>类型分布</span></template>
              <div ref="riskTypeRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px">
          <el-col :span="12">
            <el-card>
              <template #header><span>处置率</span></template>
              <div ref="riskRateRef" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'

const activeTab = ref('order')

const chartRefs: Record<string, any> = {}
const chartInstances: echarts.ECharts[] = []

const orderTrendRef = ref<HTMLDivElement>()
const orderRateRef = ref<HTMLDivElement>()
const orderStatusRef = ref<HTMLDivElement>()
const orderHourRef = ref<HTMLDivElement>()
const capOnlineRef = ref<HTMLDivElement>()
const capAcceptRef = ref<HTMLDivElement>()
const capTypeRef = ref<HTMLDivElement>()
const capSupplyRef = ref<HTMLDivElement>()
const userNewRef = ref<HTMLDivElement>()
const userActiveRef = ref<HTMLDivElement>()
const userConsumeRef = ref<HTMLDivElement>()
const finIncomeRef = ref<HTMLDivElement>()
const finExpenseRef = ref<HTMLDivElement>()
const finTypeRef = ref<HTMLDivElement>()
const riskTrendRef = ref<HTMLDivElement>()
const riskTypeRef = ref<HTMLDivElement>()
const riskRateRef = ref<HTMLDivElement>()

const days = ['01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '01-15']
const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

const initChart = (el: HTMLDivElement | undefined, option: any) => {
  if (!el) return
  const chart = echarts.init(el)
  chart.setOption(option)
  chartInstances.push(chart)
  return chart
}

const baseLineOption = (title: string, data: number[], color: string = '#409eff') => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: days },
  yAxis: { type: 'value' },
  series: [{ name: title, type: 'line', data, itemStyle: { color }, smooth: true, areaStyle: { opacity: 0.1 } }]
})

const initOrderCharts = () => {
  initChart(orderTrendRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单量', '完成量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value' },
    series: [
      { name: '订单量', type: 'line', data: [320, 380, 290, 450, 420, 480, 510], itemStyle: { color: '#409eff' }, smooth: true },
      { name: '完成量', type: 'line', data: [280, 340, 260, 400, 380, 430, 460], itemStyle: { color: '#67c23a' }, smooth: true }
    ]
  })

  initChart(orderRateRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['完成率', '取消率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value', axisLabel: { formatter: '{value}%' } },
    series: [
      { name: '完成率', type: 'line', data: [87, 89, 90, 89, 90, 90, 90], itemStyle: { color: '#67c23a' }, smooth: true },
      { name: '取消率', type: 'line', data: [8, 7, 6, 7, 6, 6, 5], itemStyle: { color: '#f56c6c' }, smooth: true }
    ]
  })

  initChart(orderStatusRef.value, {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: 460, name: '已完成' },
        { value: 30, name: '已取消' },
        { value: 10, name: '待接单' },
        { value: 5, name: '行程中' },
        { value: 5, name: '已过期' }
      ]
    }]
  })

  initChart(orderHourRef.value, {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: hours },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar', data: [5, 3, 2, 2, 3, 8, 25, 45, 60, 50, 40, 38, 42, 35, 30, 28, 32, 48, 55, 42, 30, 20, 12, 8],
      itemStyle: { color: '#409eff' }
    }]
  })
}

const initCapacityCharts = () => {
  initChart(capOnlineRef.value, baseLineOption('在线率', [72, 75, 78, 74, 80, 82, 85], '#67c23a'))

  initChart(capAcceptRef.value, baseLineOption('接单率', [85, 88, 87, 90, 89, 92, 91], '#409eff'))

  initChart(capTypeRef.value, {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: 480, name: '快车' },
        { value: 320, name: '专车' },
        { value: 180, name: '出租车' },
        { value: 150, name: '拼车' },
        { value: 80, name: '豪华车' }
      ]
    }]
  })

  initChart(capSupplyRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['需求量', '供应量'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['早高峰', '上午', '午间', '下午', '晚高峰', '夜间'] },
    yAxis: { type: 'value' },
    series: [
      { name: '需求量', type: 'bar', data: [580, 320, 380, 350, 620, 280], itemStyle: { color: '#f56c6c' } },
      { name: '供应量', type: 'bar', data: [520, 380, 420, 400, 550, 320], itemStyle: { color: '#67c23a' } }
    ]
  })
}

const initUserCharts = () => {
  initChart(userNewRef.value, baseLineOption('新增用户', [120, 145, 132, 168, 155, 178, 190], '#409eff'))

  initChart(userActiveRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['DAU', 'MAU'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value' },
    series: [
      { name: 'DAU', type: 'line', data: [3500, 3800, 3600, 4200, 4000, 4500, 4800], itemStyle: { color: '#409eff' }, smooth: true },
      { name: 'MAU', type: 'line', data: [28000, 28500, 29200, 30000, 30800, 31500, 32000], itemStyle: { color: '#67c23a' }, smooth: true, yAxisIndex: 0 }
    ]
  })

  initChart(userConsumeRef.value, {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: 35, name: '0-50元' },
        { value: 28, name: '50-100元' },
        { value: 20, name: '100-200元' },
        { value: 12, name: '200-500元' },
        { value: 5, name: '500元以上' }
      ]
    }]
  })
}

const initFinanceCharts = () => {
  initChart(finIncomeRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
    series: [
      { name: '收入', type: 'bar', data: [12500, 15200, 13800, 18000, 16800, 19200, 20500], itemStyle: { color: '#67c23a' } },
      { name: '支出', type: 'line', data: [9800, 12000, 10800, 14200, 13200, 15000, 16200], itemStyle: { color: '#f56c6c' }, smooth: true }
    ]
  })

  initChart(finExpenseRef.value, {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: 45, name: '司机结算' },
        { value: 25, name: '优惠券补贴' },
        { value: 15, name: '平台运营' },
        { value: 10, name: '退款' },
        { value: 5, name: '其他' }
      ]
    }]
  })

  initChart(finTypeRef.value, {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: 42, name: '快车' },
        { value: 28, name: '专车' },
        { value: 15, name: '出租车' },
        { value: 10, name: '拼车' },
        { value: 5, name: '豪华车' }
      ]
    }]
  })
}

const initRiskCharts = () => {
  initChart(riskTrendRef.value, {
    tooltip: { trigger: 'axis' },
    legend: { data: ['告警数', '高危数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value' },
    series: [
      { name: '告警数', type: 'line', data: [45, 52, 38, 65, 48, 56, 50], itemStyle: { color: '#e6a23c' }, smooth: true },
      { name: '高危数', type: 'line', data: [8, 12, 6, 15, 9, 11, 8], itemStyle: { color: '#f56c6c' }, smooth: true }
    ]
  })

  initChart(riskTypeRef.value, {
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      data: [
        { value: 35, name: '欺诈' },
        { value: 28, name: '滥用' },
        { value: 18, name: '安全' },
        { value: 12, name: '支付' },
        { value: 7, name: '账号' }
      ]
    }]
  })

  initChart(riskRateRef.value, baseLineOption('处置率', [72, 78, 75, 80, 82, 85, 88], '#67c23a'))
}

const initTabCharts = (tab: string) => {
  nextTick(() => {
    switch (tab) {
      case 'order': initOrderCharts(); break
      case 'capacity': initCapacityCharts(); break
      case 'user': initUserCharts(); break
      case 'finance': initFinanceCharts(); break
      case 'risk': initRiskCharts(); break
    }
  })
}

watch(activeTab, (val) => {
  initTabCharts(val)
})

const handleResize = () => {
  chartInstances.forEach(chart => chart?.resize())
}

onMounted(() => {
  initTabCharts(activeTab.value)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  chartInstances.forEach(chart => chart?.dispose())
})
</script>

<style lang="scss" scoped>
.analytics-page {
  .chart-container {
    height: 300px;
  }
}
</style>
