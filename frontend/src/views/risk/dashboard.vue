<template>
  <div class="risk-dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card alert-card">
          <div class="stat-icon">
            <el-icon size="32"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayAlerts }}</div>
            <div class="stat-label">今日告警数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card high-card">
          <div class="stat-icon">
            <el-icon size="32"><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.highRiskCount }}</div>
            <div class="stat-label">高危数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card done-card">
          <div class="stat-icon">
            <el-icon size="32"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.processedCount }}</div>
            <div class="stat-label">已处理数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card rate-card">
          <div class="stat-icon">
            <el-icon size="32"><DataLine /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.processRate }}%</div>
            <div class="stat-label">处理率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span>风险趋势</span>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>风险类型分布</span>
          </template>
          <div ref="typeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="bottom-row">
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>最新告警</span>
            </div>
          </template>
          <el-table :data="recentAlerts" size="small">
            <el-table-column prop="ruleName" label="规则名称" width="140" />
            <el-table-column prop="targetName" label="对象" width="100" />
            <el-table-column prop="severity" label="等级" width="80" align="center">
              <template #default="{ row }">
                <StatusTag :status="row.severity" :status-map="RiskSeverityMap" :color-map="RiskSeverityColorMap" />
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间">
              <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>待处理高危记录</span>
            </div>
          </template>
          <el-table :data="pendingHighRisk" size="small">
            <el-table-column prop="ruleName" label="规则名称" width="140" />
            <el-table-column prop="targetName" label="对象" width="100" />
            <el-table-column prop="category" label="类别" width="80" align="center">
              <template #default="{ row }">
                <StatusTag :status="row.category" :status-map="RiskCategoryMap" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleProcess(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import StatusTag from '@/components/StatusTag/index.vue'
import { getRiskDashboardApi } from '@/api/risk'
import {
  RiskSeverityMap,
  RiskSeverityColorMap,
  RiskCategoryMap
} from '@/enums/risk'
import { formatDate } from '@/utils/format'

const trendChartRef = ref<HTMLDivElement>()
const typeChartRef = ref<HTMLDivElement>()

let trendChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null

const stats = reactive({
  todayAlerts: 56,
  highRiskCount: 12,
  processedCount: 43,
  processRate: 76.8
})

const recentAlerts = ref([
  { id: 1, ruleName: '频繁取消订单', targetName: '司机张三', severity: 3, createTime: '2024-01-15 14:30:00' },
  { id: 2, ruleName: '异常支付行为', targetName: '乘客李四', severity: 3, createTime: '2024-01-15 14:20:00' },
  { id: 3, ruleName: '绕路检测', targetName: '司机王五', severity: 2, createTime: '2024-01-15 14:10:00' },
  { id: 4, ruleName: '多账号关联', targetName: '乘客赵六', severity: 2, createTime: '2024-01-15 13:50:00' },
  { id: 5, ruleName: '虚假行程', targetName: '司机钱七', severity: 1, createTime: '2024-01-15 13:30:00' }
])

const pendingHighRisk = ref([
  { id: 1, ruleName: '频繁取消订单', targetName: '司机张三', category: 2 },
  { id: 2, ruleName: '异常支付行为', targetName: '乘客李四', category: 4 },
  { id: 3, ruleName: '账号盗用风险', targetName: '乘客孙八', category: 5 },
  { id: 4, ruleName: '恶意刷单', targetName: '司机周九', category: 1 }
])

const initCharts = () => {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    trendChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['告警数', '高危数', '已处理'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '01-15']
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '告警数',
          type: 'line',
          data: [45, 52, 38, 65, 48, 56, 56],
          itemStyle: { color: '#409eff' },
          smooth: true
        },
        {
          name: '高危数',
          type: 'line',
          data: [8, 12, 6, 15, 9, 11, 12],
          itemStyle: { color: '#f56c6c' },
          smooth: true
        },
        {
          name: '已处理',
          type: 'line',
          data: [38, 45, 32, 55, 42, 48, 43],
          itemStyle: { color: '#67c23a' },
          smooth: true
        }
      ]
    })
  }

  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
    typeChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '风险类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          data: [
            { value: 35, name: '欺诈' },
            { value: 28, name: '滥用' },
            { value: 18, name: '安全' },
            { value: 12, name: '支付' },
            { value: 7, name: '账号' }
          ]
        }
      ]
    })
  }
}

const handleResize = () => {
  trendChart?.resize()
  typeChart?.resize()
}

const handleProcess = (row: any) => {
  ElMessage.info('跳转风控记录处理')
}

const loadDashboard = async () => {
  try {
    const res = await getRiskDashboardApi()
    if (res.data) {
      Object.assign(stats, res.data.stats || {})
      recentAlerts.value = res.data.recentAlerts || recentAlerts.value
      pendingHighRisk.value = res.data.pendingHighRisk || pendingHighRisk.value
    }
  } catch (e) {
    console.log('risk dashboard using mock data')
  }
}

onMounted(() => {
  nextTick(() => {
    initCharts()
  })
  loadDashboard()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  typeChart?.dispose()
})
</script>

<style lang="scss" scoped>
.risk-dashboard {
  .stat-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    padding: 10px;

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      color: #fff;
    }

    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }

    &.alert-card .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.high-card .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.done-card .stat-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    &.rate-card .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }

  .charts-row {
    margin-bottom: 20px;
  }

  .chart-container {
    height: 300px;
  }

  .bottom-row {
    .list-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }
}
</style>
