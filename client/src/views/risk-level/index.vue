<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button
        v-if="hasPerm('riskLevel:assess')"
        type="primary"
        @click="handleStartAssessment"
      >
        <el-icon><DataAnalysis /></el-icon>
        风险测评
      </el-button>
      <el-button
        v-if="hasPerm('riskLevel:batch')"
        type="success"
        @click="handleBatchUpdate"
      >
        <el-icon><Promotion /></el-icon>
        批量调级
      </el-button>
      <el-button type="warning" plain @click="handleExport">
        <el-icon><Download /></el-icon>
        导出数据
      </el-button>
      <el-button type="primary" plain @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <div class="level-distribution-cards">
      <div
        v-for="item in levelDistribution"
        :key="item.level"
        class="distribution-card"
        :style="{ '--card-color': getLevelColor(item.level), '--card-bg': getLevelBgColor(item.level) }"
        @click="handleTabSwitch(item.level)"
      >
        <div class="card-gradient-border" />
        <div class="card-header-bar" />
        <div class="card-body">
          <div class="level-badge">
            <span class="badge-dot" />
            {{ getLevelLabel(item.level) }}
          </div>
          <div class="stat-row">
            <div class="stat-main">
              <span class="stat-value">{{ formatThousands(item.count) }}</span>
              <span class="stat-unit">位客户</span>
            </div>
            <div class="stat-ratio" :style="{ color: getLevelColor(item.level) }">
              {{ (item.ratio * 100).toFixed(1) }}%
            </div>
          </div>
          <div class="stat-meta">
            <span>平均分：<strong>{{ item.avgScore.toFixed(1) }}</strong></span>
            <span>总资产：<strong>{{ formatMoneyCompact(item.totalAssets) }}</strong></span>
          </div>
          <div class="incidence-row">
            <span class="incidence-label">异常发生率</span>
            <span class="incidence-value" :class="{ danger: item.abnormalRatio > 0.05 }">
              {{ (item.abnormalRatio * 100).toFixed(2) }}%
            </span>
          </div>
          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{ width: (item.ratio * 100) + '%', background: getLevelColor(item.level) }"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="risk-metrics-overview" v-if="riskStats">
      <div class="metric-item">
        <div class="metric-icon" style="background: rgba(64, 158, 255, 0.1); color: #409EFF;">
          <el-icon><User /></el-icon>
        </div>
        <div class="metric-info">
          <div class="metric-value">{{ formatThousands(riskStats.metrics.totalCustomers) }}</div>
          <div class="metric-label">客户总数</div>
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-icon" style="background: rgba(103, 194, 58, 0.1); color: #67C23A;">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="metric-info">
          <div class="metric-value">{{ formatThousands(riskStats.metrics.assessedCustomers) }}</div>
          <div class="metric-label">已测评</div>
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-icon" style="background: rgba(230, 162, 60, 0.1); color: #E6A23C;">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="metric-info">
          <div class="metric-value">{{ riskStats.metrics.avgRiskScore.toFixed(1) }}</div>
          <div class="metric-label">平均风险分</div>
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-icon" style="background: rgba(245, 108, 108, 0.1); color: #F56C6C;">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="metric-info">
          <div class="metric-value">{{ formatThousands(riskStats.assessmentCompletion.overdueCount + riskStats.assessmentCompletion.expiringCount) }}</div>
          <div class="metric-label">待处理测评</div>
        </div>
      </div>
      <div class="metric-item">
        <div class="metric-icon" style="background: rgba(155, 89, 182, 0.1); color: #9B59B6;">
          <el-icon><DataLine /></el-icon>
        </div>
        <div class="metric-info">
          <div class="metric-value">{{ formatThousands(riskStats.dataIntegrityStats.missing) }}</div>
          <div class="metric-label">数据缺失客户</div>
        </div>
      </div>
    </div>

    <div class="tab-switcher-wrapper">
      <div class="tab-scroll-container" ref="tabScrollRef">
        <div
          class="tab-switcher"
          :class="{ scrolled: tabScrolled }"
          @scroll="onTabScroll"
        >
          <div
            v-for="tab in levelTabs"
            :key="tab.key"
            class="tab-item"
            :class="{
              active: activeLevelTab === tab.key,
              [`level-${tab.level}`]: true,
            }"
            @click="handleTabSwitch(tab.key)"
          >
            <div class="tab-indicator" />
            <el-icon class="tab-icon">
              <component :is="tab.key === 'all' ? 'Grid' : getLevelIcon(tab.level)" />
            </el-icon>
            <span class="tab-label">{{ tab.label }}</span>
            <span v-if="tab.key !== 'all'" class="tab-count">{{ getLevelCount(tab.level) }}</span>
          </div>
        </div>
        <div v-if="showLeftShadow" class="scroll-shadow left" />
        <div v-if="showRightShadow" class="scroll-shadow right" />
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <div class="table-card" v-loading="loading" element-loading-skeleton>
      <el-table
        v-if="!showSkeleton"
        :data="tableData"
        stripe
        :row-key="'id'"
        :header-cell-style="{ background: '#F5F7FA', color: '#1F2D3D', fontWeight: 600 }"
      >
        <el-table-column
          label="客户信息"
          width="170"
          fixed="left"
        >
          <template #default="{ row }">
            <div class="customer-cell">
              <div class="customer-avatar" :style="{ background: getLevelBgColor(row.riskLevel), color: getLevelColor(row.riskLevel) }">
                {{ row.customerName?.charAt(0) || '-' }}
              </div>
              <div class="customer-info">
                <div class="customer-name">{{ row.customerName }}</div>
                <div class="customer-account">{{ row.customerAccount }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="客户等级"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <span class="customer-level-tag">{{ row.customerLevel }}</span>
          </template>
        </el-table-column>

        <el-table-column
          label="风险等级"
          width="130"
          align="center"
        >
          <template #default="{ row }">
            <div class="risk-level-badge" :style="{
              background: getLevelBgColor(row.riskLevel),
              color: getLevelColor(row.riskLevel),
              borderColor: getLevelColor(row.riskLevel),
            }">
              <el-icon><component :is="getLevelIcon(row.riskLevel)" /></el-icon>
              <strong>{{ getLevelShortLabel(row.riskLevel) }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="风险评分"
          width="140"
          align="center"
        >
          <template #default="{ row }">
            <div class="score-cell">
              <el-progress
                type="dashboard"
                :percentage="row.riskScore"
                :width="60"
                :stroke-width="6"
                :color="getLevelColor(row.riskLevel)"
                :show-text="false"
              />
              <div class="score-text">
                <span class="score-num" :style="{ color: getLevelColor(row.riskLevel) }">{{ row.riskScore }}</span>
                <span class="score-range">{{ getScoreRange(row.riskLevel) }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="资产概览" width="220" align="right">
          <template #default="{ row }">
            <div class="asset-cell">
              <div class="asset-row">
                <span class="asset-label">总资产</span>
                <span class="asset-value">{{ formatThousands(row.assetStats.totalAssets) }}元</span>
              </div>
              <div class="asset-row">
                <span class="asset-label">可用资金</span>
                <span class="asset-value highlight">{{ formatThousands(row.assetStats.availableCash) }}元</span>
              </div>
              <div class="asset-row">
                <span class="asset-label">持仓占比</span>
                <span class="asset-value" :class="{ danger: row.assetStats.positionRatio > 80 }">
                  {{ row.assetStats.positionRatio.toFixed(1) }}%
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="30日交易" width="180" align="center">
          <template #default="{ row }">
            <div class="trade-cell">
              <div class="trade-metrics">
                <span class="trade-item">
                  <span class="trade-label">笔数</span>
                  <strong>{{ formatThousands(row.tradeStats.totalTrades30d) }}</strong>
                </span>
                <span class="trade-item">
                  <span class="trade-label">金额</span>
                  <strong>{{ formatMoneyCompact(row.tradeStats.totalAmount30d) }}</strong>
                </span>
              </div>
              <div class="interception-row" :class="{ highlight: row.tradeStats.interceptionCount30d > 0 }">
                <el-icon><WarningFilled /></el-icon>
                异常拦截 {{ row.tradeStats.interceptionCount30d }} 次
                <span v-if="row.tradeStats.interceptionCount30d > 0" class="abnormal-ratio">
                  占比 {{ (row.tradeStats.abnormalRatio * 100).toFixed(1) }}%
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="审核优先级" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="light"
              :style="{ color: getPriorityColor(row.reviewPriority), borderColor: getPriorityColor(row.reviewPriority), background: getPriorityColor(row.reviewPriority) + '15' }"
            >
              {{ getPriorityLabel(row.reviewPriority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="数据完整度" width="140" align="center">
          <template #default="{ row }">
            <div class="integrity-cell">
              <el-progress
                :percentage="row.overallIntegrity"
                :color="getIntegrityColor(row.overallIntegrity)"
                :stroke-width="6"
                :show-text="false"
                style="margin-bottom: 6px"
              />
              <div class="integrity-text" :style="{ color: getIntegrityColor(row.overallIntegrity) }">
                {{ row.overallIntegrity }}%
                <el-tooltip v-if="row.assessmentBlockers?.length" placement="top" :show-after="300">
                  <template #content>
                    <div v-for="(b, i) in row.assessmentBlockers" :key="i">{{ b }}</div>
                  </template>
                  <el-icon :size="12" color="#F56C6C" style="margin-left: 4px"><WarningFilled /></el-icon>
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="测评有效期" width="180" align="center">
          <template #default="{ row }">
            <div class="validity-cell">
              <div class="validity-dates">
                <div>评定: {{ formatDate(row.assessmentDate) }}</div>
                <div class="next-date" :class="{ overdue: isOverdue(row.nextAssessmentDate), expiring: isExpiring(row.nextAssessmentDate) }">
                  到期: {{ formatDate(row.nextAssessmentDate) }}
                </div>
              </div>
              <el-tag
                v-if="isOverdue(row.nextAssessmentDate)"
                type="danger"
                size="small"
                effect="dark"
              >已逾期</el-tag>
              <el-tag
                v-else-if="isExpiring(row.nextAssessmentDate)"
                type="warning"
                size="small"
                effect="light"
              >即将到期</el-tag>
              <el-tag v-else type="success" size="small" effect="plain">正常</el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="240"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div class="row-actions">
              <el-button type="primary" link size="small" @click="handleViewDetail(row)">
                详情
              </el-button>
              <el-button
                v-if="hasPerm('riskLevel:adjust') && row.canBeAssessed"
                type="warning"
                link
                size="small"
                @click="handleAdjustLevel(row)"
              >
                调级
              </el-button>
              <el-button
                v-if="hasPerm('riskLevel:history')"
                type="info"
                link
                size="small"
                @click="handleViewHistory(row)"
              >
                溯源
              </el-button>
              <el-button
                v-if="hasPerm('riskLevel:sync')"
                type="success"
                link
                size="small"
                @click="handleSyncStrategy(row)"
              >
                同步策略
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-else class="skeleton-wrapper">
        <div class="skeleton-row" v-for="i in 10" :key="i">
          <div class="skeleton-block block-avatar" />
          <div class="skeleton-block block-text" style="width: 80px" />
          <div class="skeleton-block block-tag" />
          <div class="skeleton-block block-progress" />
          <div class="skeleton-block block-text" style="width: 140px" />
          <div class="skeleton-block block-text" style="width: 120px" />
          <div class="skeleton-block block-tag-small" />
          <div class="skeleton-block block-progress-small" />
          <div class="skeleton-block block-text" style="width: 120px" />
          <div class="skeleton-block block-actions" />
        </div>
      </div>
    </div>

    <div class="pagination-wrapper" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="pagination.pageSizes"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <CustomerRiskDetailDialog
      v-model:visible="detailVisible"
      :profile-id="currentProfileId"
      @level-adjusted="handleLevelAdjusted"
      @strategy-synced="refreshData"
    />

    <RiskLevelHistoryDialog
      v-model:visible="historyVisible"
      :customer-id="currentCustomerId"
    />

    <BatchLevelUpdateDialog
      v-model:visible="batchDialogVisible"
      @update-completed="handleBatchCompleted"
    />

    <RiskAssessmentDialog
      v-model:visible="assessmentDialogVisible"
      :customer-ids="selectedCustomerIds"
      @assessment-completed="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  Promotion,
  Download,
  Refresh,
  User,
  CircleCheck,
  TrendCharts,
  Warning,
  WarningFilled,
  DataLine,
  Grid,
  Shield,
  Lock,
} from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import CustomerRiskDetailDialog from './CustomerRiskDetailDialog.vue'
import RiskLevelHistoryDialog from './RiskLevelHistoryDialog.vue'
import BatchLevelUpdateDialog from './BatchLevelUpdateDialog.vue'
import RiskAssessmentDialog from './RiskAssessmentDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  CUSTOMER_RISK_LEVEL_LABELS,
  CUSTOMER_RISK_LEVEL_SHORT_LABELS,
  CUSTOMER_RISK_LEVEL_COLORS,
  CUSTOMER_RISK_LEVEL_BG_COLORS,
  CUSTOMER_RISK_LEVEL_SCORES,
  REVIEW_PRIORITY_LABELS,
  REVIEW_PRIORITY_COLORS,
  LEVEL_SWITCH_TABS,
} from '@/constants/dictionaries'
import {
  CustomerRiskLevel,
  ReviewPriority,
} from '@/enums'
import * as riskLevelApi from '@/api/riskLevel'
import type {
  ICustomerRiskProfile,
  IRiskLevelStats,
} from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const { hasPerm } = usePermission()

const loading = ref(false)
const showSkeleton = ref(false)
const tableData = ref<ICustomerRiskProfile[]>([])
const levelStats = ref<IRiskLevelStats | null>(null)
const activeLevelTab = ref<string>('all')
const tabScrolled = ref(false)
const showLeftShadow = ref(false)
const showRightShadow = ref(true)
const selectedCustomerIds = ref<number[]>([])

const detailVisible = ref(false)
const historyVisible = ref(false)
const batchDialogVisible = ref(false)
const assessmentDialogVisible = ref(false)

const currentProfileId = ref<number | null>(null)
const currentCustomerId = ref<number | null>(null)

const tabScrollRef = ref<HTMLElement | null>(null)

const searchParams = reactive<Record<string, any>>({})

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES,
})

const levelTabs = LEVEL_SWITCH_TABS

const levelDistribution = computed(() => {
  if (levelStats.value?.levelDistribution?.length) {
    return levelStats.value.levelDistribution
  }
  return [
    { level: CustomerRiskLevel.LOW, count: 328, ratio: 0.28, avgScore: 18.5, totalAssets: 568000000, abnormalRatio: 0.012 },
    { level: CustomerRiskLevel.MEDIUM, count: 542, ratio: 0.46, avgScore: 46.3, totalAssets: 892000000, abnormalRatio: 0.038 },
    { level: CustomerRiskLevel.HIGH, count: 216, ratio: 0.18, avgScore: 71.2, totalAssets: 216000000, abnormalRatio: 0.086 },
    { level: CustomerRiskLevel.VERY_HIGH, count: 94, ratio: 0.08, avgScore: 89.7, totalAssets: 58000000, abnormalRatio: 0.182 },
  ]
})

const riskStats = computed(() => {
  if (levelStats.value) return levelStats.value
  return {
    metrics: {
      totalCustomers: 1180,
      assessedCustomers: 1042,
      avgRiskScore: 42.6,
      medianRiskScore: 44,
    },
    assessmentCompletion: {
      overdueCount: 38,
      expiringCount: 56,
      completedCount: 1042,
      pendingCount: 44,
    },
    dataIntegrityStats: {
      complete: 986,
      partial: 148,
      missing: 46,
    },
    levelDistribution: [],
    levelChanges: [],
    reviewDistribution: [],
    riskIncidence: {} as any,
  }
})

const filterConfig = [
  {
    prop: 'keyword',
    label: '客户信息',
    type: 'input' as const,
    placeholder: '姓名/账号搜索',
  },
  {
    prop: 'riskLevel',
    label: '风险等级',
    type: 'select' as const,
    options: [
      { label: '低风险', value: CustomerRiskLevel.LOW },
      { label: '中风险', value: CustomerRiskLevel.MEDIUM },
      { label: '较高风险', value: CustomerRiskLevel.HIGH },
      { label: '高风险', value: CustomerRiskLevel.VERY_HIGH },
    ],
  },
  {
    prop: 'reviewPriority',
    label: '审核优先级',
    type: 'select' as const,
    options: [
      { label: '免审核', value: ReviewPriority.NONE },
      { label: '普通审核', value: ReviewPriority.NORMAL },
      { label: '优先审核', value: ReviewPriority.HIGH },
      { label: '特级审核', value: ReviewPriority.VERY_HIGH },
    ],
  },
  {
    prop: 'canBeAssessed',
    label: '数据完整度',
    type: 'select' as const,
    options: [
      { label: '可正常评定', value: true },
      { label: '数据缺失', value: false },
    ],
  },
  {
    prop: 'dateRange',
    label: '评定时间',
    type: 'daterange' as const,
  },
]

function getLevelLabel(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_LABELS[level] || level
}

function getLevelShortLabel(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_SHORT_LABELS[level] || level
}

function getLevelColor(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_COLORS[level] || '#909399'
}

function getLevelBgColor(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_BG_COLORS[level] || 'rgba(144,147,153,0.1)'
}

function getLevelIcon(level: CustomerRiskLevel): any {
  const map: Record<CustomerRiskLevel, any> = {
    [CustomerRiskLevel.LOW]: Shield,
    [CustomerRiskLevel.MEDIUM]: User,
    [CustomerRiskLevel.HIGH]: Warning,
    [CustomerRiskLevel.VERY_HIGH]: Lock,
  }
  return map[level] || Shield
}

function getLevelCount(level: CustomerRiskLevel): number {
  const found = levelDistribution.value.find((d) => d.level === level)
  return found?.count || 0
}

function getScoreRange(level: CustomerRiskLevel): string {
  const range = CUSTOMER_RISK_LEVEL_SCORES[level]
  if (!range) return ''
  return `${range[0]}-${range[1]}`
}

function getPriorityLabel(p: ReviewPriority): string {
  return REVIEW_PRIORITY_LABELS[p] || p
}

function getPriorityColor(p: ReviewPriority): string {
  return REVIEW_PRIORITY_COLORS[p] || '#909399'
}

function getIntegrityColor(v: number): string {
  if (v >= 90) return '#67C23A'
  if (v >= 70) return '#409EFF'
  if (v >= 50) return '#E6A23C'
  return '#F56C6C'
}

function formatThousands(num: number): string {
  if (num === undefined || num === null) return '0'
  return num.toLocaleString('zh-CN')
}

function formatMoneyCompact(num: number): string {
  if (!num) return '0'
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿'
  if (num >= 10000) return (num / 10000).toFixed(2) + '万'
  return formatThousands(num)
}

function formatDate(d: string): string {
  if (!d) return '-'
  return d.slice(0, 10)
}

function isOverdue(d: string): boolean {
  if (!d) return false
  return new Date(d).getTime() < Date.now()
}

function isExpiring(d: string): boolean {
  if (!d) return false
  const t = new Date(d).getTime()
  const now = Date.now()
  return t > now && t - now < 30 * 86400000
}

async function fetchStats() {
  try {
    const res = await riskLevelApi.getRiskLevelStats()
    if (res.code === 0) {
      levelStats.value = res.data
    }
  } catch (e) {
    // 忽略
  }
}

async function fetchData(useSkeleton = false) {
  if (useSkeleton) {
    showSkeleton.value = true
    loading.value = false
  } else {
    loading.value = true
  }
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    if (activeLevelTab.value !== 'all') {
      params.riskLevel = activeLevelTab.value
    }
    if (params.dateRange && Array.isArray(params.dateRange)) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
      delete params.dateRange
    }
    const res = await riskLevelApi.getCustomerRiskList(params)
    if (res.code === 0) {
      await nextTick()
      await new Promise((r) => setTimeout(r, useSkeleton ? 600 : 0))
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error('获取风险等级列表失败')
  } finally {
    loading.value = false
    showSkeleton.value = false
  }
}

function refreshData() {
  fetchStats()
  fetchData(true)
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach((k) => delete searchParams[k])
  pagination.page = 1
  activeLevelTab.value = 'all'
  fetchData()
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

function handleTabSwitch(key: string) {
  activeLevelTab.value = key
  pagination.page = 1
  fetchData(true)
}

function onTabScroll(e: Event) {
  const el = e.target as HTMLElement
  tabScrolled.value = el.scrollLeft > 0
  showLeftShadow.value = el.scrollLeft > 0
  showRightShadow.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

function handleViewDetail(row: ICustomerRiskProfile) {
  currentProfileId.value = row.id
  detailVisible.value = true
}

function handleAdjustLevel(row: ICustomerRiskProfile) {
  currentProfileId.value = row.id
  detailVisible.value = true
  setTimeout(() => {
    // 详情弹窗内通过 prop 或事件触发调级
  }, 300)
}

function handleViewHistory(row: ICustomerRiskProfile) {
  currentCustomerId.value = row.customerId
  historyVisible.value = true
}

async function handleSyncStrategy(row: ICustomerRiskProfile) {
  try {
    await ElMessageBox.confirm(
      `确定为客户 ${row.customerName} 重新同步风控策略吗？将根据当前风险等级更新交易限制和审核优先级。`,
      '策略同步确认',
      { type: 'warning' },
    )
    const res = await riskLevelApi.syncCustomerStrategy(row.customerId)
    if (res.code === 0) {
      ElMessage.success(`策略同步成功，已更新 ${res.data.fields.length} 项配置`)
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('同步失败')
  }
}

function handleStartAssessment() {
  if (!hasPerm('riskLevel:assess')) {
    ElMessage.warning('您没有测评权限')
    return
  }
  selectedCustomerIds.value = []
  assessmentDialogVisible.value = true
}

function handleBatchUpdate() {
  if (!hasPerm('riskLevel:batch')) {
    ElMessage.warning('您没有批量调级权限')
    return
  }
  batchDialogVisible.value = true
}

function handleBatchCompleted() {
  batchDialogVisible.value = false
  fetchData()
  fetchStats()
}

function handleLevelAdjusted() {
  fetchData()
  fetchStats()
}

function handleExport() {
  ElMessage.success('导出任务已创建，将在后台完成')
}

onMounted(() => {
  fetchStats()
  fetchData(true)
})
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.level-distribution-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.distribution-card {
  position: relative;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--card-color) 0%, transparent 40%);
    opacity: 0.06;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(26, 58, 92, 0.12);
    border-color: var(--card-color);

    &::before { opacity: 0.1; }
  }
}

.card-gradient-border {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  padding: 1px;
  background: linear-gradient(135deg, var(--card-color) 0%, transparent 60%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s;

  .distribution-card:hover & { opacity: 1; }
}

.card-header-bar {
  height: 4px;
  background: var(--card-color);
  opacity: 0.8;
}

.card-body {
  padding: 16px 20px 20px;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 14px;
  background: var(--card-bg);
  color: var(--card-color);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 14px;
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--card-color);
  box-shadow: 0 0 8px var(--card-color);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1F2D3D;
  font-family: 'DIN', monospace;
  line-height: 1;
}

.stat-unit {
  font-size: 13px;
  color: #606266;
  margin-left: 4px;
}

.stat-ratio {
  font-size: 18px;
  font-weight: 700;
  font-family: 'DIN', monospace;
}

.stat-meta {
  display: flex;
  gap: 18px;
  font-size: 12px;
  color: #8492A6;
  margin-bottom: 12px;

  strong {
    color: #1F2D3D;
    font-weight: 600;
    font-family: 'DIN', monospace;
  }
}

.incidence-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #8492A6;
  margin-bottom: 12px;
}

.incidence-value {
  font-weight: 600;
  color: #67C23A;
  font-family: 'DIN', monospace;

  &.danger { color: #F56C6C; }
}

.progress-bar {
  height: 4px;
  background: #F2F6FC;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}

.risk-metrics-overview {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  background: #fff;
  padding: 18px 20px;
  border-radius: 10px;
  border: 1px solid #E4E7ED;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-right: 1px solid #F2F6FC;

  &:last-child { border-right: none; }
}

.metric-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-info { flex: 1; min-width: 0; }

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #1F2D3D;
  font-family: 'DIN', monospace;
  line-height: 1.2;
}

.metric-label {
  font-size: 12px;
  color: #8492A6;
}

.tab-switcher-wrapper {
  position: relative;
  margin-bottom: 20px;
}

.tab-scroll-container {
  position: relative;
  overflow: hidden;
}

.tab-switcher {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 8px;
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E4E7ED;
  scroll-behavior: smooth;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }

  &.scrolled { box-shadow: inset 8px 0 12px -8px rgba(0,0,0,0.06); }
}

.scroll-shadow {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: 40px;
  pointer-events: none;

  &.left {
    left: 0;
    background: linear-gradient(90deg, #fff 0%, transparent 100%);
  }

  &.right {
    right: 0;
    background: linear-gradient(270deg, #fff 0%, transparent 100%);
  }
}

.tab-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
  flex-shrink: 0;
  border: 1px solid transparent;

  &:hover {
    background: #F5F7FA;
    color: #1F2D3D;
  }

  &.active {
    background: var(--tab-bg, #ECF5FF);
    border-color: var(--tab-color, #409EFF);
    color: var(--tab-color, #409EFF);
    font-weight: 600;
    box-shadow: 0 2px 8px var(--tab-color, rgba(64,158,255,0.2));
  }

  &.level-low.active { --tab-color: #27AE60; --tab-bg: rgba(39,174,96,0.1); }
  &.level-medium.active { --tab-color: #2980B9; --tab-bg: rgba(41,128,185,0.1); }
  &.level-high.active { --tab-color: #E67E22; --tab-bg: rgba(230,126,34,0.1); }
  &.level-very_high.active { --tab-color: #C0392B; --tab-bg: rgba(192,57,43,0.1); }
}

.tab-icon { font-size: 16px; }

.tab-count {
  display: inline-block;
  min-width: 22px;
  padding: 0 8px;
  height: 20px;
  line-height: 20px;
  background: rgba(0,0,0,0.06);
  color: #606266;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  font-family: 'DIN', monospace;
  text-align: center;

  .tab-item.active & {
    background: rgba(255,255,255,0.6);
    color: inherit;
  }
}

.table-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #E4E7ED;
  overflow: hidden;
  min-height: 500px;
}

.customer-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
  border: 1px solid;
}

.customer-info { min-width: 0; }

.customer-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2D3D;
  margin-bottom: 2px;
}

.customer-account {
  font-size: 11px;
  color: #8492A6;
  font-family: monospace;
}

.customer-level-tag {
  padding: 2px 10px;
  background: #F5F7FA;
  color: #606266;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.risk-level-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 14px;
  border: 1px solid;
  font-size: 13px;
  font-weight: 600;

  .el-icon { font-size: 13px; }
}

.score-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: center;
}

.score-text {
  text-align: left;
}

.score-num {
  font-size: 20px;
  font-weight: 700;
  font-family: 'DIN', monospace;
  line-height: 1;
}

.score-range {
  display: block;
  font-size: 11px;
  color: #8492A6;
  margin-top: 2px;
}

.asset-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  text-align: right;
}

.asset-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.asset-label {
  color: #8492A6;
}

.asset-value {
  color: #1F2D3D;
  font-weight: 600;
  font-family: 'DIN', monospace;

  &.highlight { color: #409EFF; }
  &.danger { color: #F56C6C; }
}

.trade-cell {
  font-size: 12px;
}

.trade-metrics {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-bottom: 6px;
}

.trade-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.trade-label {
  font-size: 10px;
  color: #8492A6;
}

.trade-item strong {
  font-family: 'DIN', monospace;
  color: #1F2D3D;
}

.interception-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #F2F6FC;
  color: #8492A6;
  border-radius: 4px;
  font-size: 11px;

  &.highlight {
    background: #FEF0F0;
    color: #F56C6C;
  }
}

.abnormal-ratio {
  font-weight: 600;
  font-family: 'DIN', monospace;
}

.integrity-cell {
  text-align: center;
}

.integrity-text {
  font-size: 12px;
  font-weight: 600;
  font-family: 'DIN', monospace;
}

.validity-cell {
  font-size: 12px;
}

.validity-dates {
  margin-bottom: 6px;
}

.next-date {
  color: #606266;

  &.overdue { color: #F56C6C; font-weight: 600; }
  &.expiring { color: #E6A23C; font-weight: 600; }
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.skeleton-wrapper {
  padding: 12px 20px;
}

.skeleton-row {
  display: grid;
  grid-template-columns: 170px 100px 130px 140px 220px 180px 110px 140px 180px 240px;
  gap: 12px;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #F2F6FC;
}

.skeleton-block {
  height: 18px;
  background: linear-gradient(90deg, #F2F6FC 25%, #E8ECF1 37%, #F2F6FC 63%);
  background-size: 400% 100%;
  animation: skeleton-shine 1.4s ease infinite;
  border-radius: 4px;

  &.block-avatar { height: 42px; width: 140px; border-radius: 10px; }
  &.block-tag { width: 100px; height: 32px; border-radius: 16px; }
  &.block-progress { width: 120px; height: 40px; border-radius: 20px; }
  &.block-progress-small { width: 120px; height: 26px; border-radius: 13px; }
  &.block-tag-small { width: 80px; height: 24px; border-radius: 12px; }
  &.block-actions { width: 180px; }
}

@keyframes skeleton-shine {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@media (max-width: 1400px) {
  .level-distribution-cards { grid-template-columns: repeat(2, 1fr); }
  .risk-metrics-overview { grid-template-columns: repeat(3, 1fr); }
  .skeleton-row { grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); }
}

@media (max-width: 768px) {
  .level-distribution-cards { grid-template-columns: 1fr; }
  .risk-metrics-overview { grid-template-columns: 1fr; }
  .metric-item { border-right: none; border-bottom: 1px solid #F2F6FC; }
  .metric-item:last-child { border-bottom: none; }
}
</style>
