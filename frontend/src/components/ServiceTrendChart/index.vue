<template>
  <div class="service-trend-chart">
    <div class="trend-header">
      <div class="trend-title">
        <el-icon class="title-icon"><TrendCharts /></el-icon>
        <span>服务数据趋势</span>
        <el-tag v-if="abnormalities.length > 0" type="danger" effect="dark" size="small" class="abnormal-tag">
          {{ abnormalities.length }}处异常
        </el-tag>
      </div>
      <div class="period-switcher">
        <el-radio-group v-model="currentPeriod" size="small" @change="handlePeriodChange">
          <el-radio-button value="day">今日</el-radio-button>
          <el-radio-button value="week">本周</el-radio-button>
          <el-radio-button value="month">本月</el-radio-button>
          <el-radio-button value="custom">自定义</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="currentPeriod === 'custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          size="small"
          style="margin-left: 10px"
          @change="handleCustomDateChange"
        />
      </div>
    </div>

    <div v-if="validity && !validity.valid" class="validity-warning">
      <el-alert :title="validity.warnings[0]" type="warning" show-icon :closable="false" />
    </div>

    <div v-loading="loading" class="trend-chart-body">
      <template v-if="loading">
        <div class="skeleton-container">
          <div class="skeleton-line" v-for="i in 8" :key="i" :style="{ width: `${60 + Math.random() * 30}%` }"></div>
        </div>
      </template>
      <template v-else>
        <div class="metrics-cards">
          <div class="metric-card">
            <div class="metric-value">{{ avgData.avgOrders }}</div>
            <div class="metric-label">平均接单量</div>
          </div>
          <div class="metric-card">
            <div class="metric-value score">{{ avgData.avgScore }}</div>
            <div class="metric-label">平均评分</div>
          </div>
          <div class="metric-card">
            <div class="metric-value complaint">{{ avgData.avgComplaintRate }}%</div>
            <div class="metric-label">平均投诉率</div>
          </div>
          <div class="metric-card">
            <div class="metric-value income">¥{{ avgData.avgIncome }}</div>
            <div class="metric-label">平均收入</div>
          </div>
        </div>

        <div class="chart-tabs">
          <div
            v-for="tab in chartTabs"
            :key="tab.key"
            class="chart-tab"
            :class="{ active: activeChart === tab.key }"
            @click="activeChart = tab.key"
          >
            {{ tab.label }}
          </div>
        </div>

        <div class="chart-container">
          <div v-if="trendData.length === 0" class="empty-data">
            <el-empty description="暂无数据" />
          </div>
          <template v-else>
            <div class="chart-bars">
              <div
                v-for="(item, index) in trendData"
                :key="index"
                class="chart-bar-item"
                :class="{ abnormal: item.isAbnormal }"
              >
                <div class="bar-wrapper">
                  <div
                    class="bar bar-orders"
                    :style="{ height: getBarHeight(item, 'orders') + '%' }"
                    :title="`接单量: ${item.totalOrders}`"
                  >
                    <span class="bar-value">{{ item.totalOrders }}</span>
                  </div>
                  <div
                    v-if="activeChart === 'score'"
                    class="bar bar-score"
                    :style="{ height: getBarHeight(item, 'score') + '%' }"
                  ></div>
                </div>
                <div class="bar-date">{{ formatDate(item.date) }}</div>
                <div v-if="item.isAbnormal" class="abnormal-dot" :title="getAbnormalTooltip(item)">
                  <el-icon><Warning /></el-icon>
                </div>
              </div>
            </div>

            <div class="chart-legend">
              <span class="legend-item">
                <span class="legend-dot dot-orders"></span>接单量
              </span>
              <span v-if="activeChart === 'score'" class="legend-item">
                <span class="legend-dot dot-score"></span>服务评分
              </span>
              <span class="legend-item abnormal">
                <el-icon><Warning /></el-icon>异常波动
              </span>
            </div>
          </template>
        </div>

        <div v-if="abnormalities.length > 0" class="abnormality-list">
          <div class="list-title">
            <el-icon class="warning-icon"><WarningFilled /></el-icon>
            <span>异常数据记录</span>
          </div>
          <el-scrollbar height="200px">
            <div
              v-for="(abnormal, index) in abnormalities"
              :key="index"
              class="abnormality-item"
            >
              <div class="abnormality-date">{{ abnormal.date }}</div>
              <div class="abnormality-items">
                <div
                  v-for="(item, i) in abnormal.abnormalities"
                  :key="i"
                  class="abnormality-detail"
                  :class="item.severity"
                >
                  <el-tag :type="item.severity === 'high' ? 'danger' : 'warning'" size="small" effect="light">
                    {{ item.fieldName }}{{ item.direction === 'up' ? '↑' : '↓' }}{{ item.changeRate }}
                  </el-tag>
                  <span class="abnormality-msg">{{ item.message }}</span>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { TrendCharts, Warning, WarningFilled } from '@element-plus/icons-vue'
import { getServiceTrendApi, checkServiceDataValidityApi } from '@/api/driver'
import type { ServiceTrendData, TrendAbnormality, ServiceAvgData, ServiceDataValidity } from '@/types/driver'

const props = defineProps<{
  driverId: number
}>()

const loading = ref(false)
const currentPeriod = ref('day')
const customDateRange = ref<[Date, Date] | null>(null)
const activeChart = ref('orders')

const trendData = ref<ServiceTrendData[]>([])
const abnormalities = ref<TrendAbnormality[]>([])
const avgData = ref<ServiceAvgData>({
  avgOrders: '0',
  avgScore: '0',
  avgComplaintRate: '0',
  avgIncome: '0'
})
const validity = ref<ServiceDataValidity | null>(null)

const chartTabs = [
  { key: 'orders', label: '订单量趋势' },
  { key: 'score', label: '评分趋势' },
  { key: 'complaint', label: '投诉率趋势' }
]

const loadTrendData = async () => {
  if (!props.driverId) return

  loading.value = true
  try {
    let startDate, endDate
    if (currentPeriod.value === 'custom' && customDateRange.value) {
      startDate = customDateRange.value[0].toISOString().split('T')[0]
      endDate = customDateRange.value[1].toISOString().split('T')[0]
    }

    const validityRes = await checkServiceDataValidityApi(
      currentPeriod.value,
      startDate,
      endDate
    )
    validity.value = validityRes.data

    const res = await getServiceTrendApi(props.driverId, currentPeriod.value, startDate, endDate)
    trendData.value = res.data.trendData
    abnormalities.value = res.data.abnormalities
    avgData.value = res.data.avgData

    if (validity.value && validity.value.warnings.length > 0) {
      ElMessage.warning(validity.value.warnings[0])
    }
  } catch (error) {
    ElMessage.error('加载趋势数据失败')
  } finally {
    loading.value = false
  }
}

const handlePeriodChange = () => {
  if (currentPeriod.value !== 'custom') {
    loadTrendData()
  }
}

const handleCustomDateChange = () => {
  if (customDateRange.value && customDateRange.value.length === 2) {
    loadTrendData()
  }
}

const getBarHeight = (item: ServiceTrendData, type: string) => {
  const maxValue = Math.max(...trendData.value.map(d => d.totalOrders || 1))
  if (type === 'orders') {
    return maxValue > 0 ? (item.totalOrders / maxValue) * 100 : 0
  }
  if (type === 'score') {
    return (parseFloat(String(item.serviceScore)) / 5) * 60 + 10
  }
  return 0
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const getAbnormalTooltip = (item: ServiceTrendData) => {
  const abn = abnormalities.value.find(a => a.date === item.date)
  if (abn && abn.abnormalities.length > 0) {
    return abn.abnormalities.map(a => a.message).join('；')
  }
  return '数据异常'
}

watch(() => props.driverId, () => {
  loadTrendData()
})

onMounted(() => {
  loadTrendData()
})
</script>

<style scoped>
.service-trend-chart {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.trend-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.title-icon {
  color: #409eff;
  font-size: 20px;
}

.abnormal-tag {
  margin-left: 10px;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.period-switcher {
  display: flex;
  align-items: center;
}

.validity-warning {
  margin-bottom: 15px;
}

.trend-chart-body {
  min-height: 300px;
}

.skeleton-container {
  padding: 20px 0;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(90deg, #f0f2f5 25%, #e5e7eb 50%, #f0f2f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  margin-bottom: 12px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.metrics-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.metric-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.metric-value.score {
  color: #67c23a;
}

.metric-value.complaint {
  color: #e6a23c;
}

.metric-value.income {
  color: #f56c6c;
}

.metric-label {
  font-size: 13px;
  color: #909399;
}

.chart-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.chart-tab {
  padding: 8px 0;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.3s;
}

.chart-tab.active {
  color: #409eff;
  border-bottom-color: #409eff;
}

.chart-container {
  position: relative;
  height: 200px;
  padding: 20px 0;
}

.empty-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 150px;
  padding: 0 10px;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.bar-wrapper {
  display: flex;
  gap: 4px;
  align-items: flex-end;
  height: 120px;
}

.bar {
  width: 20px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  position: relative;
  min-height: 2px;
}

.bar-orders {
  background: linear-gradient(180deg, #409eff 0%, #66b1ff 100%);
}

.bar-score {
  background: linear-gradient(180deg, #67c23a 0%, #85ce61 100%);
  width: 8px;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 11px;
  color: #606266;
  white-space: nowrap;
}

.chart-bar-item.abnormal .bar-orders {
  background: linear-gradient(180deg, #f56c6c 0%, #f78989 100%);
  animation: abnormalPulse 2s infinite;
}

@keyframes abnormalPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.bar-date {
  font-size: 11px;
  color: #909399;
  margin-top: 8px;
}

.abnormal-dot {
  position: absolute;
  top: -25px;
  right: 0;
  color: #f56c6c;
  font-size: 14px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  font-size: 12px;
  color: #606266;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.dot-orders {
  background: #409eff;
}

.dot-score {
  background: #67c23a;
}

.legend-item.abnormal {
  color: #f56c6c;
}

.abnormality-list {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.list-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #f56c6c;
  margin-bottom: 12px;
}

.warning-icon {
  font-size: 16px;
}

.abnormality-item {
  padding: 10px;
  background: #fef0f0;
  border-radius: 6px;
  margin-bottom: 8px;
}

.abnormality-date {
  font-size: 13px;
  font-weight: 500;
  color: #f56c6c;
  margin-bottom: 6px;
}

.abnormality-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.abnormality-msg {
  font-size: 12px;
  color: #606266;
}
</style>
