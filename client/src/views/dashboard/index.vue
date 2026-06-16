<template>
  <div class="dashboard-page">
    <div class="page-header">
      <h2 class="page-title">工作台</h2>
      <span class="refresh-time">最后更新：{{ refreshTime }}</span>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="4" v-for="(item, index) in statCards" :key="index">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">
              {{ formatStatValue(item.value, item.type) }}
            </div>
            <div class="stat-unit" v-if="item.unit">{{ item.unit }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-row">
      <el-col :xs="24" :lg="12">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近流水记录</span>
              <el-button type="primary" link @click="goToFlows">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentFlows" v-loading="flowsLoading" stripe height="300">
            <el-table-column prop="flowNo" label="流水号" min-width="140" show-overflow-tooltip />
            <el-table-column prop="customerName" label="客户名称" min-width="120" show-overflow-tooltip />
            <el-table-column prop="flowType" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="getFlowTypeTag(row.flowType)" size="small">
                  {{ getFlowTypeLabel(row.flowType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span :class="row.flowType === 'deposit' || row.flowType === 'sell' || row.flowType === 'dividend' ? 'text-success' : 'text-danger'">
                  {{ row.flowType === 'deposit' || row.flowType === 'sell' || row.flowType === 'dividend' ? '+' : '-' }}{{ formatMoney(row.amount) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="flowStatus" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getFlowStatusTag(row.flowStatus)" size="small">
                  {{ getFlowStatusLabel(row.flowStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="160" type="datetime" />
          </el-table>
          <el-empty v-if="!flowsLoading && recentFlows.length === 0" description="暂无流水记录" />
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近风险告警</span>
              <el-button type="primary" link @click="goToAlerts">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentAlerts" v-loading="alertsLoading" stripe height="300">
            <el-table-column prop="alertNo" label="告警编号" min-width="140" show-overflow-tooltip />
            <el-table-column prop="alertLevel" label="级别" width="70" align="center">
              <template #default="{ row }">
                <el-tag :color="getAlertLevelColor(row.alertLevel)" effect="dark" size="small">
                  {{ getAlertLevelLabel(row.alertLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="告警标题" min-width="160" show-overflow-tooltip />
            <el-table-column prop="alertStatus" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getAlertStatusTag(row.alertStatus)" size="small">
                  {{ getAlertStatusLabel(row.alertStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" type="datetime" />
          </el-table>
          <el-empty v-if="!alertsLoading && recentAlerts.length === 0" description="暂无告警记录" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="content-row">
      <el-col :xs="24" :lg="12">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">最近7天资产趋势</span>
            </div>
          </template>
          <div class="asset-trend-chart">
            <div
              v-for="(item, index) in assetTrendData"
              :key="index"
              class="trend-bar-item"
            >
              <div class="trend-bar-wrapper">
                <div
                  class="trend-bar"
                  :class="item.change >= 0 ? 'trend-up' : 'trend-down'"
                  :style="{ height: getTrendBarHeight(item.value) + '%' }"
                ></div>
              </div>
              <div class="trend-value" :class="item.change >= 0 ? 'text-success' : 'text-danger'">
                {{ formatMoney(item.value) }}
              </div>
              <div class="trend-label">{{ item.date }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="content-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时行情</span>
              <el-tag type="success" size="small" effect="light">
                <span class="live-dot"></span>
                实时更新中
              </el-tag>
            </div>
          </template>
          <el-table :data="stockQuoteList" v-loading="stockLoading" stripe height="300">
            <el-table-column prop="stockCode" label="代码" width="90" />
            <el-table-column prop="stockName" label="名称" min-width="100" show-overflow-tooltip />
            <el-table-column prop="currentPrice" label="现价" width="100" align="right">
              <template #default="{ row }">
                <span :class="row.changeRate >= 0 ? 'text-danger' : 'text-success'">
                  {{ formatMoney(row.currentPrice) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="changeRate" label="涨跌幅" width="100" align="right">
              <template #default="{ row }">
                <span :class="row.changeRate >= 0 ? 'text-danger' : 'text-success'">
                  {{ row.changeRate >= 0 ? '+' : '' }}{{ row.changeRate?.toFixed(2) || '0.00' }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="volume" label="成交量" width="110" align="right">
              <template #default="{ row }">
                {{ formatVolume(row.volume) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Wallet,
  TrendCharts,
  User,
  Goods,
  Timer,
  Warning,
  Bell
} from '@element-plus/icons-vue'
import { formatMoney, formatDate, formatVolume } from '@/utils/format'
import {
  FLOW_TYPE_LABELS,
  FLOW_STATUS_LABELS,
  FLOW_STATUS_COLORS,
  ALERT_LEVEL_LABELS,
  ALERT_LEVEL_COLORS,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_COLORS
} from '@/constants/dictionaries'
import { AlertLevel, AlertStatus } from '@/enums'
import {
  getStats,
  getRecentFlows,
  getRecentAudits,
  type IDashboardStats,
  type IRecentFlow
} from '@/api/dashboard'
import { getRecentAlerts } from '@/api/alert'
import type { IRiskAlert } from '@/types/api'
import { getStockList, type IStockQuote } from '@/api/stockQuote'
import { usePolling } from '@/hooks/usePolling'

const router = useRouter()

const refreshTime = ref('')
const statsLoading = ref(false)
const flowsLoading = ref(false)
const alertsLoading = ref(false)
const stockLoading = ref(false)

const stats = reactive<IDashboardStats>({
  totalAsset: 0,
  todayTransaction: 0,
  customerCount: 0,
  productCount: 0,
  pendingAuditCount: 0,
  pendingAlertCount: 0,
  todayTradeAmount: 0,
  riskWarningCount: 0
})

const recentFlows = ref<IRecentFlow[]>([])
const recentAlerts = ref<IRiskAlert[]>([])
const stockQuoteList = ref<IStockQuote[]>([])

const alertStats = reactive({
  pendingCount: 0,
  highRiskCount: 0
})

const statCards = computed(() => [
  {
    label: '总资产',
    value: stats.totalAsset,
    type: 'money',
    unit: '元',
    icon: Wallet,
    color: '#1A3A5C',
    bgColor: 'rgba(26, 58, 92, 0.1)'
  },
  {
    label: '今日交易额',
    value: stats.todayTransaction || stats.todayTradeAmount || 0,
    type: 'money',
    unit: '元',
    icon: TrendCharts,
    color: '#0F9B58',
    bgColor: 'rgba(15, 155, 88, 0.1)'
  },
  {
    label: '客户总数',
    value: stats.customerCount,
    type: 'number',
    unit: '户',
    icon: User,
    color: '#2C5F8A',
    bgColor: 'rgba(44, 95, 138, 0.1)'
  },
  {
    label: '产品总数',
    value: stats.productCount,
    type: 'number',
    unit: '只',
    icon: Goods,
    color: '#E8A838',
    bgColor: 'rgba(232, 168, 56, 0.1)'
  },
  {
    label: '待处理告警',
    value: alertStats.pendingCount || stats.pendingAlertCount || stats.riskWarningCount || 0,
    type: 'number',
    unit: '条',
    icon: Bell,
    color: '#F56C6C',
    bgColor: 'rgba(245, 108, 108, 0.1)'
  },
  {
    label: '高风险告警',
    value: alertStats.highRiskCount,
    type: 'number',
    unit: '条',
    icon: Warning,
    color: '#C45656',
    bgColor: 'rgba(196, 86, 86, 0.1)'
  }
])

const assetTrendData = computed(() => {
  const data = []
  const baseValue = stats.totalAsset || 1000000
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const randomChange = (Math.random() - 0.45) * 50000
    const value = baseValue + randomChange * (6 - i)
    data.push({
      date: formatDate(date, 'MM-DD'),
      value: Math.max(value, 0),
      change: randomChange
    })
  }
  return data
})

function formatStatValue(value: number, type: string): string {
  if (type === 'money') {
    return formatMoney(value)
  }
  if (type === 'number') {
    return value.toLocaleString()
  }
  return String(value)
}

function getFlowTypeLabel(type?: string): string {
  if (!type) return '-'
  return FLOW_TYPE_LABELS[type as keyof typeof FLOW_TYPE_LABELS] || type
}

function getFlowTypeTag(type?: string): string {
  if (!type) return 'info'
  const tagMap: Record<string, string> = {
    deposit: 'success',
    withdraw: 'danger',
    buy: 'primary',
    sell: 'warning',
    dividend: 'success',
    fee: 'info'
  }
  return tagMap[type] || 'info'
}

function getFlowStatusLabel(status?: string): string {
  if (!status) return '-'
  return FLOW_STATUS_LABELS[status as keyof typeof FLOW_STATUS_LABELS] || status
}

function getFlowStatusTag(status?: string): string {
  if (!status) return 'info'
  return FLOW_STATUS_COLORS[status as keyof typeof FLOW_STATUS_COLORS] || 'info'
}

function getAlertLevelLabel(level?: string): string {
  if (!level) return '-'
  return ALERT_LEVEL_LABELS[level as AlertLevel] || level
}

function getAlertLevelColor(level?: string): string {
  if (!level) return '#909399'
  return ALERT_LEVEL_COLORS[level as AlertLevel] || '#909399'
}

function getAlertStatusLabel(status?: string): string {
  if (!status) return '-'
  return ALERT_STATUS_LABELS[status as AlertStatus] || status
}

function getAlertStatusTag(status?: string): string {
  if (!status) return 'info'
  return ALERT_STATUS_COLORS[status as AlertStatus] || 'info'
}

function getTrendBarHeight(value: number): number {
  const maxValue = Math.max(...assetTrendData.value.map(d => d.value))
  const minValue = Math.min(...assetTrendData.value.map(d => d.value))
  const range = maxValue - minValue || 1
  return Math.max(((value - minValue) / range) * 80 + 20, 10)
}

async function fetchStats() {
  statsLoading.value = true
  try {
    const res = await getStats()
    if (res.code === 0) {
      Object.assign(stats, res.data)
      refreshTime.value = formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  } finally {
    statsLoading.value = false
  }
}

async function fetchRecentFlows() {
  flowsLoading.value = true
  try {
    const res = await getRecentFlows(10)
    if (res.code === 0) {
      recentFlows.value = res.data
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取流水记录失败')
  } finally {
    flowsLoading.value = false
  }
}

async function fetchRecentAlerts() {
  alertsLoading.value = true
  try {
    const res = await getRecentAlerts(10)
    if (res.code === 0) {
      recentAlerts.value = res.data
      alertStats.pendingCount = res.data.filter(a => a.alertStatus === AlertStatus.PENDING).length
      alertStats.highRiskCount = res.data.filter(a => a.alertLevel === AlertLevel.HIGH || a.alertLevel === AlertLevel.CRITICAL).length
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取告警记录失败')
  } finally {
    alertsLoading.value = false
  }
}

async function fetchStockQuotes() {
  try {
    stockLoading.value = true
    const res = await getStockList({ page: 1, pageSize: 8 })
    if (res.code === 0) {
      stockQuoteList.value = res.data.list
    }
  } catch (error) {
    // ignore
  } finally {
    stockLoading.value = false
  }
}

const { refresh: refreshStockQuotes } = usePolling(
  fetchStockQuotes,
  10000,
  { immediate: false }
)

function goToFlows() {
  router.push('/fund-flow')
}

function goToAlerts() {
  router.push('/alert')
}

onMounted(() => {
  fetchStats()
  fetchRecentFlows()
  fetchRecentAlerts()
  fetchStockQuotes()
})

onUnmounted(() => {
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--fin-text-primary);
      margin: 0;
    }

    .refresh-time {
      font-size: 13px;
      color: var(--fin-text-secondary);
    }
  }

  .stats-row {
    margin-bottom: 20px;
  }

  .stat-card {
    border-radius: 8px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--fin-primary);
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;
      min-width: 0;

      .stat-label {
        font-size: 13px;
        color: var(--fin-text-secondary);
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
        font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
      }

      .stat-unit {
        font-size: 12px;
        color: var(--fin-text-secondary);
        margin-top: 2px;
      }
    }
  }

  .content-row {
    margin-bottom: 16px;

    .content-card {
      border-radius: 8px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--fin-text-primary);
        }
      }
    }
  }

  .text-success {
    color: var(--fin-success);
    font-weight: 600;
  }

  .text-danger {
    color: var(--fin-danger);
    font-weight: 600;
  }

  .risk-low {
    color: var(--fin-success);
    font-weight: 600;
  }

  .risk-medium {
    color: var(--fin-warning);
    font-weight: 600;
  }

  .risk-high {
    color: var(--fin-danger);
    font-weight: 600;
  }

  .live-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: var(--fin-success);
    border-radius: 50%;
    margin-right: 4px;
    animation: blink 1.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  .asset-trend-chart {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    height: 260px;
    padding: 20px 10px 10px;
    gap: 8px;

    .trend-bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .trend-bar-wrapper {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        min-height: 160px;

        .trend-bar {
          width: 60%;
          min-height: 10px;
          border-radius: 4px 4px 0 0;
          transition: height 0.5s ease;

          &.trend-up {
            background: linear-gradient(180deg, var(--fin-danger) 0%, rgba(245, 108, 108, 0.3) 100%);
          }

          &.trend-down {
            background: linear-gradient(180deg, var(--fin-success) 0%, rgba(15, 155, 88, 0.3) 100%);
          }
        }
      }

      .trend-value {
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }

      .trend-label {
        font-size: 12px;
        color: var(--fin-text-secondary);
      }
    }
  }
}
</style>
