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
          <el-table :data="recentFlows" v-loading="flowsLoading" stripe>
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
              <span class="card-title">最近审核记录</span>
              <el-button type="primary" link @click="goToCompliance">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentAudits" v-loading="auditsLoading" stripe>
            <el-table-column prop="auditNo" label="审计编号" min-width="140" show-overflow-tooltip />
            <el-table-column prop="auditType" label="类型" width="100">
              <template #default="{ row }">
                {{ getAuditTypeLabel(row.auditType) }}
              </template>
            </el-table-column>
            <el-table-column prop="targetName" label="目标" min-width="120" show-overflow-tooltip />
            <el-table-column prop="riskScore" label="风险评分" width="90" align="center">
              <template #default="{ row }">
                <span :class="getRiskScoreClass(row.riskScore)">
                  {{ row.riskScore }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="auditStatus" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getAuditStatusTag(row.auditStatus)" size="small">
                  {{ getAuditStatusLabel(row.auditStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="160" type="datetime" />
          </el-table>
          <el-empty v-if="!auditsLoading && recentAudits.length === 0" description="暂无审核记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Wallet,
  TrendCharts,
  User,
  Goods,
  Timer,
  Warning
} from '@element-plus/icons-vue'
import { formatMoney, formatDate } from '@/utils/format'
import {
  FLOW_TYPE_LABELS,
  FLOW_STATUS_LABELS,
  FLOW_STATUS_COLORS,
  AUDIT_TYPE_LABELS,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_COLORS
} from '@/constants/dictionaries'
import {
  getStats,
  getRecentFlows,
  getRecentAudits,
  type IDashboardStats,
  type IRecentFlow,
  type IRecentAudit
} from '@/api/dashboard'

const router = useRouter()

const refreshTime = ref('')
const statsLoading = ref(false)
const flowsLoading = ref(false)
const auditsLoading = ref(false)

const stats = reactive<IDashboardStats>({
  totalAsset: 0,
  todayTransaction: 0,
  customerCount: 0,
  productCount: 0,
  pendingAuditCount: 0,
  riskWarningCount: 0
})

const recentFlows = ref<IRecentFlow[]>([])
const recentAudits = ref<IRecentAudit[]>([])

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
    value: stats.todayTransaction,
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
    label: '待审核数量',
    value: stats.pendingAuditCount,
    type: 'number',
    unit: '条',
    icon: Timer,
    color: '#F56C6C',
    bgColor: 'rgba(245, 108, 108, 0.1)'
  },
  {
    label: '风险预警数量',
    value: stats.riskWarningCount,
    type: 'number',
    unit: '条',
    icon: Warning,
    color: '#D93025',
    bgColor: 'rgba(217, 48, 37, 0.1)'
  }
])

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

function getAuditTypeLabel(type?: string): string {
  if (!type) return '-'
  return AUDIT_TYPE_LABELS[type as keyof typeof AUDIT_TYPE_LABELS] || type
}

function getAuditStatusLabel(status?: string): string {
  if (!status) return '-'
  return AUDIT_STATUS_LABELS[status as keyof typeof AUDIT_STATUS_LABELS] || status
}

function getAuditStatusTag(status?: string): string {
  if (!status) return 'info'
  return AUDIT_STATUS_COLORS[status as keyof typeof AUDIT_STATUS_COLORS] || 'info'
}

function getRiskScoreClass(score?: number): string {
  if (score === null || score === undefined) return ''
  if (score < 30) return 'risk-low'
  if (score <= 60) return 'risk-medium'
  return 'risk-high'
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

async function fetchRecentAudits() {
  auditsLoading.value = true
  try {
    const res = await getRecentAudits(10)
    if (res.code === 0) {
      recentAudits.value = res.data
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取审核记录失败')
  } finally {
    auditsLoading.value = false
  }
}

function goToFlows() {
  router.push('/fund-flow')
}

function goToCompliance() {
  router.push('/compliance')
}

onMounted(() => {
  fetchStats()
  fetchRecentFlows()
  fetchRecentAudits()
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
}
</style>
