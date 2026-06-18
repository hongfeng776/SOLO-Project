<template>
  <div class="review-page">
    <div class="page-header">
      <h2 class="page-title">交易订单复盘</h2>
    </div>

    <div class="filter-bar">
      <div
        class="filter-toggle"
        @click="showFilter = !showFilter"
        :class="{ expanded: showFilter }"
      >
        <el-icon><Filter /></el-icon>
        <span>筛选条件</span>
        <el-icon :size="16" class="toggle-arrow"><ArrowUp v-if="!showFilter" /><ArrowDown v-else /></el-icon>
      </div>
      <div class="filter-panel" :class="{ collapsed: !showFilter }">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="时间区间" required>
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="focus-input"
              @change="handleFilterChange"
            />
          </el-form-item>
          <el-form-item label="订单状态">
            <el-select
              v-model="filterForm.statusList"
              multiple
              collapse-tags
              placeholder="全部"
              class="focus-input"
              @change="handleFilterChange"
            >
              <el-option label="待撮合" value="pending" />
              <el-option label="部分成交" value="partial_dealed" />
              <el-option label="已成交" value="dealed" />
              <el-option label="已撤单" value="cancelled" />
              <el-option label="撮合失败" value="failed" />
              <el-option label="审核中" value="auditing" />
              <el-option label="已驳回" value="rejected" />
              <el-option label="已暂停" value="paused" />
            </el-select>
          </el-form-item>
          <el-form-item label="客户">
            <el-select
              v-model="filterForm.customerIds"
              multiple
              collapse-tags
              filterable
              placeholder="不限"
              class="focus-input"
              @change="handleFilterChange"
            >
              <el-option
                v-for="c in customerList"
                :key="c.id"
                :label="c.customer_name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="股票代码">
            <el-select
              v-model="filterForm.stockCodes"
              multiple
              collapse-tags
              filterable
              placeholder="不限"
              class="focus-input"
              @change="handleFilterChange"
            >
              <el-option
                v-for="s in stockList"
                :key="s.id"
                :label="`${s.stock_code} ${s.stock_name}"
                :value="s.stock_code"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <div v-if="filterErrors.length > 0" class="filter-errors">
          <el-icon color="#F56C6C" v-for="(e, i" :key="i"><CircleCloseFilled /> {{ e }}
        </div>
        <div v-if="filterWarnings.length > 0" class="filter-warnings">
          <el-icon color="#E6A23C" v-for="(w, i)" :key="i"><WarningFilled /> {{ w }}
        </div>
      </div>
    </div>

    <div class="stats-row">
      <el-row :gutter="16">
        <el-col :span="4" v-for="(card, i" in="true">
          <el-card v-if="!statsLoading" class="skeleton-card">
            <el-skeleton :rows="2" animated />
          </el-card>
          <el-card v-else class="stat-card hover-shadow" :body-style="{ padding: '16px' }">
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-value" :style="{ color: card.color }">
              {{ formatThousand(card.value) }}
            </div>
            <div class="stat-rate" v-if="card.rate">
              {{ card.rateLabel }}:
              <span :style="{ color: card.rateColor }">{{ card.rate }}</span>
            </div>
          </el-card>
        </el-col>
      </el-col>
      </el-row>
    </div>

    <div class="chart-section">
      <el-card class="timeline-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">订单时序走势</span>
            <el-radio-group v-model="timelineType">
              <el-radio-button value="count">订单量</el-radio-button>
              <el-radio-button value="amount">成交额</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div class="chart-wrap" v-loading="statsLoading">
          <el-empty v-if="!statsLoading && timelineData.length === 0" description="暂无数据" />
          <svg v-else class="timeline-chart" viewBox="0 0 800 280" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#409eff;stop-opacity:0.3" />
                <stop offset="100%" style="stop-color:#409eff;stop-opacity:0.05" />
              </linearGradient>
            </defs>
            <polyline
              :points="chartlinePoints"
              fill="none"
              stroke="#409eff"
              stroke-width="2"
            />
            <polygon
              :points="areaPoints"
              fill="url(#lineGradient)"
            />
            <circle
              v-for="(p, i) in timelinePoints"
              :key="i"
              :cx="p.split(',')[0"
              :cy="p.split(',')[1]"
              r="4"
              fill="#409eff"
              class="chart-dot"
            />
          </svg>
          <div class="chart-x-axis">
            <span v-for="(d, i) in timelineData" :key="i" class="x-label">{{ d.date.slice(5) }}</span>
          </div>
        </div>
      </el-card>

      <el-card class="conclusion-card">
        <template #header>
          <span class="card-title">复盘结论</span>
        </template>
        <div v-if="statsLoading" class="skeleton-loader">
          <el-skeleton :rows="3" animated />
        </div>
        <div v-else class="conclusion-content">
          <div class="score-circle" :class="scoreClass">
            <div class="score-value">{{ conclusion.overallScore }}</div>
            <div class="score-label">综合评分</div>
          </div>
          <div class="conclusion-metrics">
            <div class="metric-item">
              <span class="metric-label">订单合规性</span>
              <el-tag :type="complianceType">
                {{ conclusion.orderCompliance }}
              </el-tag>
            </div>
            <div class="metric-item">
              <span class="metric-label">价格一致性</span>
              <el-tag :type="consistencyType">
                {{ conclusion.priceConsistency }}
              </el-tag>
            </div>
            <div class="metric-item">
              <span class="metric-label">风险等级</span>
              <el-tag :type="riskType">
                {{ conclusion.riskLevel }}
              </el-tag>
            </div>
          </div>
          <div class="suggestions">
            <h4>优化建议</h4>
            <ul>
              <li v-for="(s, i) in conclusion.suggestions" :key="i">{{ s }}</li>
            </ul>
          </div>
        </div>
      </el-card>
    </div>

    <div class="content-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="异常订单" name="abnormal">
          <div class="abnormal-list">
            <el-table :data="abnormalList" v-loading="abnormalLoading" stripe>
              <el-table-column prop="tradeNo" label="委托单号" width="160" />
              <el-table-column prop="stockCode" label="股票代码" width="100" />
              <el-table-column prop="stockName" label="股票名称" width="120" />
              <el-table-column prop="abnormalType" label="异常类型" width="100">
                <template #default="{ row }">
                  <el-tag type="danger" size="small" effect="dark"">{{ row.abnormalType }}
                </template>
              </el-table-column>
              <el-table-column prop="abnormalReason" label="异常原因" min-width="200" />
              <el-table-column prop="orderPrice" label="委托价" width="90" align="right">
                <template #default="{ row }">{{ formatThousand(row.orderPrice.toFixed(2)) }}
                </template>
              </el-table-column>
              <el-table-column prop="marketPrice" label="市场价" width="90" align="right">
                <template #default="{ row }">{{ formatThousand(row.marketPrice.toFixed(2)) }}
                </template>
              </el-table-column>
              <el-table-column prop="priceDeviation" label="价格偏离" width="90" align="center">
                <template #default="{ row }">
                  <el-tag type="danger" size="small" effect="light">{{ row.priceDeviation }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="detectedAt" label="检测时间" width="170">
                <template #default="{ row }">{{ formatDateTime(row.detectedAt) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>
        <el-tab-pane label="数据导出" name="export">
          <div class="export-panel">
            <h4>导出设置</h4>
            <el-form :model="exportForm" label-width="100px">
              <el-form-item label="导出字段">
                <el-checkbox-group v-model="exportForm.exportFields">
                  <el-checkbox label="trade_no">委托单号</el-checkbox>
                  <el-checkbox label="stock_code">股票代码</el-checkbox>
                  <el-checkbox label="stock_name">股票名称</el-checkbox>
                  <el-checkbox label="direction">买卖方向</el-checkbox>
                  <el-checkbox label="price">委托价格</el-checkbox>
                  <el-checkbox label="quantity">委托数量</el-checkbox>
                  <el-checkbox label="trade_amount">成交金额</el-checkbox>
                  <el-checkbox label="trade_status">订单状态</el-checkbox>
                  <el-checkbox label="frozen_amount">冻结金额</el-checkbox>
                  <el-checkbox label="created_at">委托时间</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              <el-form-item label="排序字段">
                <el-select v-model="exportForm.sortField" placeholder="不排序" class="focus-input">
                  <el-option label="委托时间" value="created_at" />
                  <el-option label="成交金额" value="trade_amount" />
                  <el-option label="委托价格" value="price" />
                </el-select>
                <el-select v-model="exportForm.sortOrder" placeholder="排序" style="margin-left: 8px" class="focus-input">
                  <el-option label="升序" value="ASC" />
                  <el-option label="降序" value="DESC" />
                </el-select>
              </el-form-item>
            </el-form-item>

            <div class="export-actions">
              <el-button type="primary" @click="handleValidateExport">校验数据</el-button>
              <el-button type="success" @click="handleExport" :disabled="!exportValidated">
                导出数据
              </el-button>
            </div>

            <div v-if="exportProgress > 0 && exportProgress < 100" class="export-progress">
              <el-progress :percentage="exportProgress" :stroke-width="12" />
              <span class="progress-text">{{ exportProgress }}% 完成</span>
            </div>

            <div v-if="exportValidationResult" class="export-validation">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="总订单数">{{ exportValidationResult.totalCount }}
                </el-descriptions-item>
                <el-descriptions-item label="有效数据">{{ exportValidationResult.validCount }}
                </el-descriptions-item>
                <el-descriptions-item label="异常数据">
                  <span :style="{ color: '#f56c6c }">{{ exportValidationResult.invalidCount }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item label="缺失字段">
                  <el-tag
                    v-for="(f, i) in exportValidationResult.missingFields" :key="i" type="danger" size="small" style="margin-right: 4px" effect="plain"
                    >{{ f }}</el-tag
                  >
                  <span v-if="exportValidationResult.missingFields.length === 0">无</span>
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="exportValidationResult.invalidOrders.length > 0" class="invalid-list">
                <h4>异常明细</h4>
                <div v-for="(order, i) in exportValidationResult.invalidOrders.slice(0, 5)" :key="i" class="invalid-item">
                  <span class="order-no">{{ order.tradeNo }}</span>
                  <span v-if="order.missingFields.length > 0">
                    缺失:
                    <el-tag v-for="(f, j) in order.missingFields" :key="j" type="warning" size="small" effect="plain"
                      >{{ f }}</el-tag
                    >
                  </span>
                  <span v-if="order.abnormalFlags.length > 0">
                    异常:
                    <el-tag v-for="(f, j) in order.abnormalFlags" :key="j" type="danger" size="small" effect="plain"
                      >{{ f }}</el-tag
                    >
                  </span>
                </div>
                <div v-if="exportValidationResult.invalidOrders.length > 5" class="more-text">
                  ... 还有 {{ exportValidationResult.invalidOrders.length - 5 }} 条更多
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Filter,
  ArrowUp,
  ArrowDown,
  CircleCloseFilled,
  WarningFilled,
} from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/format'
import * as tradeApi from '@/api/trade'
import type { ICustomer, IStockQuote } from '@/types/api'
import type {
  IReviewStats,
  ITimelinePoint,
  IAbnormalOrder,
  IReviewConclusion,
  IExportValidateResult,
} from '@/api/trade'

const showFilter = ref(true)
const activeTab = ref('abnormal')
const statsLoading = ref(false)
const abnormalLoading = ref(false)
const customerList = ref<ICustomer[]>([])
const stockList = ref<IStockQuote[]>([])
const timelineData = ref<ITimelinePoint[]>([])
const abnormalList = ref<IAbnormalOrder[]>([])
const conclusion = ref<IReviewConclusion>({
  orderCompliance: '-',
  priceConsistency: '-',
  riskLevel: '-',
  suggestions: [],
  overallScore: 0,
})
const filterErrors = ref<string[]>([])
const filterWarnings = ref<string[]>([])
const timelineType = ref<'count' | 'amount'>('count')
const exportValidated = ref(false)
const exportProgress = ref(0)
const exportValidationResult = ref<IExportValidateResult | null>(null)

const filterForm = reactive({
  dateRange: null as [string, string] | null,
  statusList: [] as string[],
  customerIds: [] as number[],
  stockCodes: [] as string[],
})

const exportForm = reactive({
  exportFields: [
    'trade_no',
    'stock_code',
    'stock_name',
    'direction',
    'price',
    'quantity',
    'trade_amount',
    'trade_status',
    'frozen_amount',
    'created_at',
  ],
  sortField: 'created_at',
  sortOrder: 'DESC',
})

const stats = computed(() => {
  const raw = reactive<IReviewStats>({
  totalCount: 0,
  dealedCount: 0,
  dealedRate: '0%',
  cancelledCount: 0,
  cancelledRate: '0%',
  failedCount: 0,
  failedRate: '0%',
  abnormalCount: 0,
  abnormalRate: '0%',
  totalAmount: '0',
  avgOrderAmount: '0',
  avgMatchPrice: '0',
})

const statCards = computed(() => {
  const list = [
    {
      label: '总订单数',
      value: stats.totalCount,
      color: '#303133',
      rate: null,
    },
    {
      label: '已成交',
      value: rawStats.dealedCount,
      color: '#67c23a',
      rateLabel: '成交率',
      rate: rawStats.dealedRate,
      rateColor: '#67c23a',
    },
    {
      label: '已撤单',
      value: rawStats.cancelledCount,
      color: '#909399',
      rateLabel: '撤单率',
      rate: rawStats.cancelledRate,
      rateColor: '#909399',
    },
    {
      label: '撮合失败',
      value: rawStats.failedCount,
      color: '#f56c6c',
      rateLabel: '失败率',
      rate: rawStats.failedRate,
      rateColor: '#f56c6c',
    },
    {
      label: '异常订单',
      value: rawStats.abnormalCount,
      color: '#e6a23c',
      rateLabel: '异常率',
      rate: rawStats.abnormalRate,
      rateColor: '#e6a23c',
    },
    {
      label: '总成交金额',
      value: formatThousand(rawStats.totalAmount) + ' 元',
      color: '#409eff',
      rate: null,
    },
  ]
  return list
})

const scoreClass = computed(() => {
  const s = conclusion.value.overallScore
  if (s >= 90) return 'excellent'
  if (s >= 70) return 'good'
  if (s >= 60) return 'fair'
  return 'poor'
})

const complianceType = computed(() => {
  const map: Record<string, string> = { 优': 'success', 良': 'primary', 中': 'warning', 差': 'danger' }
  return map[conclusion.value.orderCompliance] || 'info'
})

const consistencyType = computed(() => {
  const map: Record<string, string> = { 高': 'success', 中': 'warning', 低': 'danger' }
  return map[conclusion.value.priceConsistency] || 'info'
})

const riskType = computed(() => {
  const map: Record<string, string> = { 低': 'success', 中': 'warning', 高': 'danger' }
  return map[conclusion.value.riskLevel] || 'info'
})

const timelineChartDataXLen = computed(() => {
  if (timelineData.value.length === 0 return ''
  const values = timelineType.value === 'count'
    ? timelineData.value.map(d => d.orderCount)
    : timelineData.value.map(d => d.amount)
  const maxVal = Math.max(...values, 1)
  const minVal = 0
  const height = 240
  const width = 800
  const len = timelineData.value.length
  const points: string[] = []
  for (let i = 0; i < len; i++) {
    x = (i / (len - 1 || 1)) * (width - 40) + 20
    const v = values[i]
    const y = height - ((v - minVal) / (maxVal - minVal)) * 200 + 20
    points.push(`${x},${y})
  }
  return points.join(' ')
})

const areaPoints = computed(() => {
  if (timelineData.value.length === 0) return ''
  return timelineChartXLen.value + ' 780,260 20,260'
})

function formatThousand(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

async function loadCustomersAndStocks() {
  try {
    const [custRes = await tradeApi.getCustomerList()
    const stockRes = await tradeApi.getStockList()
    if (custRes.code === 0) customerList.value = custRes.data
    if (stockRes.code === 0) stockList.value = stockRes.data
  } catch {
    ElMessage.error('加载基础数据失败')
  }
}

async function validateFilters() {
  if (!filterForm.dateRange || filterForm.dateRange.length !== 2) {
    filterErrors.value = ['请选择时间区间']
    return false
  }
  try {
    const res = await tradeApi.validateReviewFilters({
      statusList: filterForm.statusList.length > 0 ? filterForm.statusList : undefined,
      customerIds: filterForm.customerIds.length > 0 ? filterForm.customerIds : undefined,
      stockCodes: filterForm.stockCodes.length > 0 ? filterForm.stockCodes : undefined,
      startDate: filterForm.dateRange[0],
      endDate: filterForm.dateRange[1],
    })
    if (res.code === 0) {
      filterErrors.value = res.data.errors
      filterWarnings.value = res.data.warnings
      return res.data.valid
    }
    return false
  } catch {
    return false
  }
}

async function loadReviewData() {
  const valid = await validateFilters()
  if (!valid) return

  statsLoading.value = true
  abnormalLoading.value = true
  try {
    const params = {
      statusList: filterForm.statusList.length > 0 ? filterForm.statusList : undefined,
      customerIds: filterForm.customerIds.length > 0 ? filterForm.customerIds : undefined,
      stockCodes: filterForm.stockCodes.length > 0 ? filterForm.stockCodes : undefined,
      startDate: filterForm.dateRange![0],
      endDate: filterForm.dateRange![1],
    }

    const [statsRes, timelineRes, abnormalRes, conclusionRes] = await Promise.all([
      tradeApi.getReviewStats(params),
      tradeApi.getReviewTimeline(params),
      tradeApi.getAbnormalOrders(params),
      tradeApi.getReviewConclusion(params),
    ])

    if (statsRes.code === 0) Object.assign(rawStats, statsRes.data)
    if (timelineRes.code === 0) timelineData.value = timelineRes.data
    if (abnormalRes.code === 0) abnormalList.value = abnormalRes.data
    if (conclusionRes.code === 0) conclusion.value = conclusionRes.data
  } catch {
    ElMessage.error('加载复盘数据失败')
  } finally {
    statsLoading.value = false
    abnormalLoading.value = false
  }
}

function handleFilterChange() {
  exportValidated.value = false
  exportValidationResult.value = null
  loadReviewData()
}

async function handleValidateExport() {
  if (!filterForm.dateRange) {
    ElMessage.warning('请先选择筛选条件')
    return
  }
  if (exportForm.exportFields.length === 0) {
    ElMessage.warning('请选择导出字段')
    return
  }

  try {
    const res = await tradeApi.validateExportData({
      statusList: filterForm.statusList.length > 0 ? filterForm.statusList : undefined,
      customerIds: filterForm.customerIds.length > 0 ? filterForm.customerIds : undefined,
      stockCodes: filterForm.stockCodes.length > 0 ? filterForm.stockCodes : undefined,
      startDate: filterForm.dateRange![0],
      endDate: filterForm.dateRange![1],
      exportFields: exportForm.exportFields,
    })
    if (res.code === 0) {
      exportValidationResult.value = res.data
      exportValidated.value = true
      ElMessage.success(`数据校验完成')
    }
  } catch {
    ElMessage.error('数据校验失败')
  }
}

async function handleExport() {
  if (!exportValidated.value) {
    ElMessage.warning('请先校验数据')
    return
  }

  exportProgress.value = 0
  const timer = setInterval(() => {
    if (exportProgress.value = Math.min(exportProgress.value + 10, 90)
  }, 200)

  try {
    const blob = await tradeApi.exportReviewData({
      statusList: filterForm.statusList.length > 0 ? filterForm.statusList : undefined,
      customerIds: filterForm.customerIds.length > 0 ? filterForm.customerIds : undefined,
      stockCodes: filterForm.stockCodes.length > 0 ? filterForm.stockCodes : undefined,
      startDate: filterForm.dateRange![0],
      endDate: filterForm.dateRange![1],
      exportFields: exportForm.exportFields,
      sortField: exportForm.sortField,
      sortOrder: exportForm.sortOrder,
    })

    clearInterval(timer)
    exportProgress.value = 100

    setTimeout(() => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      a.download = `trade-review-${timestamp}.csv`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    }, 500)
  } catch {
    clearInterval(timer)
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadCustomersAndStocks()
  const today = new Date()
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  const formatDate = (d: Date) => d.toISOString().split('T')[0]
  filterForm.dateRange = [formatDate(thirtyDaysAgo), formatDate(today)] as [string, string]
  loadReviewData()
})
</script>

<style lang="scss" scoped>
.review-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 16px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.filter-bar {
  margin-bottom: 16px;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    background: #ecf5ff;
  }

  .toggle-arrow {
    margin-left: auto;
    transition: transform 0.3s ease;
  }

  &.expanded .toggle-arrow {
    color: #409eff;
  }
}

.filter-panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  max-height: 500px;

  &.collapsed {
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    opacity: 0;
  }

  .filter-form {
    .el-form-item {
      margin-bottom: 12px;
    }
  }

  .filter-errors {
    .el-icon {
      margin-right: 4px;
    }
    color: #f56c6c;
    font-size: 13px;
  }
  .filter-warnings {
    .el-icon {
      margin-right: 4px;
    }
    color: #e6a23c;
    font-size: 13px;
  }
}

.focus-input {
  :deep(.el-input__wrapper,
  :deep(.el-input__inner),
  :deep(.el-select__wrapper) {
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus-within,
    &.is-focus {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
    }
  }
}

.stats-row {
  margin-bottom: 16px;

  .stat-card {
    transition: all 0.3s ease;

    &.hover-card-shadow:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    margin: 8px 0 4px;
  }
  .stat-rate {
    font-size: 12px;
    color: #909399;
  }
}

.skeleton-card {
  height: 120px;
}

.chart-section {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.timeline-card {
  flex: 2;
}

.conclusion-card {
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
}

.chart-wrap {
  position: relative;
  height: 320px;

  .timeline-chart {
    width: 100%;
    height: 260px;

    .chart-dot {
      transition: r 0.2s ease;

      &:hover {
        r: 6;
      }
    }
  }

  .chart-x-axis {
    display: flex;
    justify-content: space-between;
    padding: 0 20px;
    margin-top: 8px;

    .x-label {
      font-size: 11px;
      color: #909399;
    }
  }
}

.conclusion-content {
  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    border: 4px solid;

    &.excellent {
      border-color: #67c23a;
      color: #67c23a;
    }
    &.good {
      border-color: #409eff;
      color: #409eff;
    }
    &.fair {
      border-color: #e6a23c;
      color: #e6a23c;
    }
    &.poor {
      border-color: #f56c6c;
      color: #f56c6c;
    }

    .score-value {
      font-size: 32px;
      font-weight: 700;
    }
    .score-label {
      font-size: 12px;
      margin-top: -4px;
    }
  }

  .conclusion-metrics {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;

    .metric-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .metric-label {
      font-size: 13px;
      color: #606266;
    }
  }

  .suggestions {
    h4 {
      margin: 0 0 8px;
      font-size: 13px;
      color: #303133;
    }
    ul {
      margin: 0;
      padding-left: 20px;
      font-size: 13px;
      color: #606266;
      li {
        margin-bottom: 4px;
      }
    }
  }
}

.content-tabs {
  margin-top: 16px;

  .abnormal-list {
    padding: 16px 0;
  }

  .export-panel {
    padding: 16px 0;

    h4 {
      margin: 0 0 12px;
      font-size: 14px;
    }

    .export-actions {
      margin: 16px 0;
    }

    .export-progress {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 16px 0;

      .progress-text {
        font-size: 13px;
        color: #606266;
      }
    }

    .export-validation {
      margin-top: 16px;

      .invalid-list {
        margin-top: 12px;

        h4 {
          margin: 0 0 8px;
          font-size: 13px;
        }
        .invalid-item {
          padding: 8px 12px;
          background: #fef0f0;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 13px;

          .order-no {
            font-weight: 500;
            margin-right: 12px;
          }
        }
        .more-text {
          text-align: center;
          color: #909399;
          font-size: 12px;
          padding-top: 8px;
        }
      }
    }
  }
}
</style>
