<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button type="primary" @click="openFilterDialog = true">
        <el-icon><Filter /></el-icon>
        高级筛选
        <span v-if="appliedFilterCount" class="filter-badge">{{ appliedFilterCount }}</span>
      </el-button>
      <el-button type="success" @click="handleManualRefresh">
        <el-icon><Refresh /></el-icon>
        刷新统计
      </el-button>
      <el-button type="warning" @click="openExportDialog = true">
        <el-icon><Download /></el-icon>
        导出数据
      </el-button>
      <el-button type="danger" plain @click="handleBatchValidate">
        <el-icon><View /></el-icon>
        批量校验
      </el-button>
    </div>

    <div class="quick-filter-bar">
      <div class="time-range-group">
        <span class="group-label"><el-icon><Calendar /></el-icon>时间</span>
        <el-radio-group v-model="quickForm.timeRange" size="default" @change="handleTimeRangeChange">
          <el-radio-button
            v-for="opt in REPLAY_TIME_RANGE_OPTIONS"
            :key="opt.value"
            :label="opt.value"
          >{{ opt.label }}</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-if="quickForm.timeRange === ReplayTimeRange.CUSTOM"
          v-model="customDateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          start-placeholder="开始"
          end-placeholder="结束"
          :disabled-date="disabledPastDate"
          style="margin-left: 12px; width: 260px"
          @change="handleCustomDateChange"
        />
      </div>
    </div>

    <div
      v-if="filterValidation"
      class="validation-alert"
      :class="validationHasErrors ? 'has-error' : 'has-warning'"
    >
      <el-icon class="valid-icon">
        <component :is="validationHasErrors ? 'CircleCloseFilled' : 'InfoFilled'" />
      </el-icon>
      <div class="valid-content">
        <div class="valid-summary">
          {{ filterValidation.totalFilters }} 个筛选条件，嵌套 {{ filterValidation.nestedDepth }} 层，
          预估 <strong>{{ formatThousands(filterValidation.estimatedRecords) }}</strong> 条，
          响应 <strong>{{ filterValidation.estimatedResponseMs }}ms</strong>
        </div>
        <div class="valid-warnings" v-if="filterValidation.warnings.length">
          <span
            v-for="(w, i) in filterValidation.warnings.slice(0, 3)"
            :key="i"
            class="warn-item"
            :class="w.severity"
          >
            <el-icon><component :is="w.severity === 'error' ? 'WarningFilled' : 'Warning'" /></el-icon>
            {{ w.message }}
          </span>
        </div>
      </div>
      <el-button
        v-if="validationHasErrors"
        type="danger"
        plain
        size="small"
        @click="openFilterDialog = true"
      >调整</el-button>
    </div>

    <transition name="fade-metric" mode="out-in">
      <div class="core-metrics-grid" :key="metricsSignature">
        <div
          v-for="metric in REPLAY_CORE_METRICS"
          :key="metric.key"
          class="metric-card"
          :style="{ '--card-color': metric.color }"
        >
          <div class="mc-glow" />
          <div class="mc-inner">
            <div class="mc-header">
              <div class="mc-icon" :style="{ background: metric.color + '18', color: metric.color }">
                <el-icon><component :is="metric.icon" /></el-icon>
              </div>
              <span class="mc-label">{{ metric.label }}</span>
            </div>
            <div class="mc-value-row">
              <span class="mc-value" :style="{ color: metric.color }">
                {{ coreMetrics ? formatMetric(metric.key, coreMetrics[metric.key]) : '-' }}
              </span>
              <span class="mc-unit">{{ metric.unit }}</span>
            </div>
            <div v-if="coreMetrics" class="mc-trend">
              <span class="trend-label">环比</span>
              <span class="trend-value" :class="metricTrend(metric.key) >= 0 ? 'up' : 'down'">
                <el-icon><component :is="metricTrend(metric.key) >= 0 ? 'Top' : 'Bottom'" /></el-icon>
                {{ Math.abs(metricTrend(metric.key)).toFixed(2) }}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade-panel" mode="out-in">
      <div class="content-grid" :key="'grid-' + metricsSignature">
        <div class="main-chart-panel">
          <div class="panel-header">
            <h4 class="panel-title">
              <el-icon color="#409EFF"><TrendCharts /></el-icon>
              趋势（近{{ currentDays }}天）
            </h4>
          </div>
          <div class="chart-body" v-loading="trendLoading">
            <template v-if="trendData.length">
              <div class="chart-legend">
                <span class="legend-item total"><span class="legend-dot" />总事件</span>
                <span class="legend-item inter"><span class="legend-dot" />拦截</span>
                <span class="legend-item valid"><span class="legend-dot" />有效</span>
                <span class="legend-item recur"><span class="legend-dot" />复发</span>
              </div>
              <div class="bars-container">
                <div v-for="(p, i) in trendData" :key="i" class="bar-group">
                  <div class="bars-wrap">
                    <div class="bar-stack">
                      <div class="bar total" :style="{ height: getBarH(p.totalEvents, 'total') + '%' }" />
                      <div class="bar inter" :style="{ height: getBarH(p.interceptions, 'inter') + '%' }" />
                      <div class="bar valid" :style="{ height: getBarH(p.validInterceptions, 'valid') + '%' }" />
                      <div class="bar recur" :style="{ height: getBarH(p.recurrences, 'recur') + '%' }" />
                    </div>
                  </div>
                  <div class="bar-date">{{ formatShortDate(p.date) }}</div>
                </div>
              </div>
            </template>
            <FinEmpty v-else description="暂无趋势数据" size="medium" />
          </div>
        </div>

        <div class="right-column">
          <div class="distribution-panel">
            <div class="panel-header">
              <h4 class="panel-title">
                <el-icon color="#8E44AD"><PieChart /></el-icon>
                拦截效果分布
              </h4>
            </div>
            <div class="dist-body" v-loading="distLoading">
              <div v-if="effectDistribution.length" class="effect-list">
                <div v-for="(e, i) in effectDistribution" :key="i" class="effect-row">
                  <span
                    class="eff-tag"
                    :style="{
                      background: INTERCEPTION_EFFECT_BG_COLORS[e.key],
                      color: INTERCEPTION_EFFECT_COLORS[e.key],
                      borderColor: INTERCEPTION_EFFECT_COLORS[e.key],
                    }"
                  >{{ e.label }}</span>
                  <div class="eff-progress">
                    <div
                      class="eff-fill"
                      :style="{ width: e.ratio * 100 + '%', background: INTERCEPTION_EFFECT_COLORS[e.key] }"
                    />
                  </div>
                  <span class="eff-count">{{ (e.ratio * 100).toFixed(1) }}%</span>
                </div>
              </div>
              <FinEmpty v-else description="暂无分布数据" size="small" />
            </div>
          </div>

          <div class="rule-validity-panel">
            <div class="panel-header">
              <h4 class="panel-title">
                <el-icon color="#E67E22"><Finished /></el-icon>
                规则落地效果（Top5）
              </h4>
            </div>
            <div class="rv-body" v-loading="ruleLoading">
              <template v-if="ruleValidity.length">
                <div v-for="(r, i) in ruleValidity.slice(0, 5)" :key="i" class="rv-row">
                  <div class="rv-title">
                    <span class="rv-rank">{{ i + 1 }}</span>
                    <span class="rv-name">{{ r.ruleName }}</span>
                    <el-tag
                      size="small"
                      effect="light"
                      :style="{
                        color: RULE_VALIDITY_COLORS[r.validityStatus],
                        borderColor: RULE_VALIDITY_COLORS[r.validityStatus],
                        background: RULE_VALIDITY_COLORS[r.validityStatus] + '15',
                      }"
                    >{{ RULE_VALIDITY_LABELS[r.validityStatus] }}</el-tag>
                  </div>
                  <div class="rv-progress-row">
                    <span class="rv-metric">触发{{ formatThousands(r.triggerCount) }}</span>
                    <el-progress
                      :percentage="Math.round(r.effectiveness * 100)"
                      :color="RULE_VALIDITY_COLORS[r.validityStatus]"
                      :stroke-width="6"
                      style="flex: 1"
                      :show-text="false"
                    />
                    <span class="rv-metric" :style="{ color: RULE_VALIDITY_COLORS[r.validityStatus] }">
                      {{ (r.effectiveness * 100).toFixed(0) }}%
                    </span>
                  </div>
                </div>
              </template>
              <FinEmpty v-else description="暂无规则数据" size="small" />
            </div>
          </div>
        </div>
      </div>
    </transition>

    <div class="table-card" style="margin-top: 18px" v-loading="tableLoading">
      <div class="table-header-section">
        <h4 class="section-title">
          <el-icon><WarningFilled /></el-icon>
          风控事件明细（共 {{ formatThousands(pagination.total) }} 条）
        </h4>
      </div>

      <el-table :data="eventList" stripe height="460" @row-click="openChainDialog">
        <el-table-column label="事件编号" width="160" fixed="left">
          <template #default="{ row }">
            <span class="event-id">{{ row.eventId }}</span>
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="150">
          <template #default="{ row }">
            <span class="event-time">{{ row.occurredAt?.replace('T', ' ').slice(5, 16) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="客户" width="130">
          <template #default="{ row }">
            <div class="mini-customer">
              <div class="mc-name">{{ row.customerName }}</div>
              <div class="mc-acc">{{ row.customerAccount }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="异常类型" width="130" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.exceptionTypeLabel" placement="top">
              <el-tag size="small" effect="light" :color="getExceptionTagColor(row.severity)">
                {{ row.exceptionTypeLabel?.slice(0, 6) || '-' }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="拦截效果" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="light"
              :style="{
                color: INTERCEPTION_EFFECT_COLORS[row.interceptionEffect],
                borderColor: INTERCEPTION_EFFECT_COLORS[row.interceptionEffect],
                background: INTERCEPTION_EFFECT_BG_COLORS[row.interceptionEffect],
              }"
            >{{ INTERCEPTION_EFFECT_LABELS[row.interceptionEffect] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="涉及金额" width="110" align="right">
          <template #default="{ row }">
            <span class="amount-cell">{{ formatCompact(row.involvedAmount) }}元</span>
          </template>
        </el-table-column>
        <el-table-column label="复发" width="100" align="center">
          <template #default="{ row }">
            <span :style="{ color: RECURRENCE_STATUS_COLORS[row.recurrenceStatus] }">
              <el-icon v-if="row.recurrenceCount > 0"><RefreshRight /></el-icon>
              {{ RECURRENCE_STATUS_LABELS[row.recurrenceStatus] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="处理通道" width="120" align="center">
          <template #default="{ row }">
            <span :style="{ color: HANDLE_CHANNEL_COLORS[row.handleChannel] }">
              {{ HANDLE_CHANNEL_LABELS[row.handleChannel] }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="完整性" width="90" align="center">
          <template #default="{ row }">
            <span :class="row.dataIntegrity >= 85 ? 'int-ok' : 'int-warn'">{{ row.dataIntegrity }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="校验" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.replayValidated" type="success" size="small" effect="dark">已</el-tag>
            <el-tag v-else-if="row.replayIssues?.length" type="danger" size="small" effect="light">!</el-tag>
            <el-tag v-else size="small" effect="plain">待</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click.stop="openChainDialog(row)">溯源</el-button>
            <el-button type="info" link size="small" @click.stop="handleSingleValidate(row)">校验</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="pagination.pageSizes"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetchEventList"
          @size-change="handleSizeChange"
        />
      </div>
    </div>

    <div class="vulnerability-section" v-if="vulnerabilities.length">
      <div class="section-header">
        <h3 class="section-title">
          <el-icon color="#F56C6C"><WarningFilled /></el-icon>
          风控漏洞挖掘与优化建议（{{ vulnerabilities.length }}项）
        </h3>
      </div>
      <div class="vuln-grid">
        <div
          v-for="(v, i) in vulnerabilities.slice(0, 4)"
          :key="v.id"
          class="vuln-card"
          :style="{ '--glow-color': VULNERABILITY_SEVERITY_GLOW[v.severity] }"
          @click="viewSingleVuln(v)"
        >
          <div class="vuln-glow" />
          <div class="vuln-inner">
            <div class="vuln-header">
              <el-tag
                size="small"
                effect="dark"
                :style="{ background: VULNERABILITY_SEVERITY_COLORS[v.severity] }"
              >{{ VULNERABILITY_SEVERITY_LABELS[v.severity] }}</el-tag>
              <span class="vuln-code">{{ v.code }}</span>
            </div>
            <h4 class="vuln-title">{{ v.title }}</h4>
            <p class="vuln-desc">{{ v.description }}</p>
            <div class="vuln-stats">
              <div class="vs-item"><span>影响事件</span><strong>{{ formatThousands(v.affectedEventsCount) }}</strong></div>
              <div class="vs-item"><span>涉及金额</span><strong class="danger">{{ formatCompact(v.estimatedFinancialImpact) }}</strong></div>
              <div class="vs-item"><span>难度</span><strong>{{ exploitLabels[v.exploitDifficulty] }}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ReplayFilterDialog
      v-model:visible="openFilterDialog"
      :current-params="queryParams"
      @apply="handleApplyFilter"
    />

    <ReplayExportDialog
      v-model:visible="openExportDialog"
      :query-params="queryParams"
      :record-count="pagination.total"
    />

    <ReplayChainDialog
      v-model:visible="chainDialogVisible"
      :event="currentChainEvent"
    />

    <VulnerabilityDetailDialog
      v-model:visible="vulnDetailVisible"
      :vulnerability="currentVuln"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import {
  Filter,
  Refresh,
  Download,
  View,
  Calendar,
  InfoFilled,
  CircleCloseFilled,
  WarningFilled,
  Warning,
  TrendCharts,
  PieChart,
  Finished,
  Top,
  Bottom,
  RefreshRight,
  Right,
  Lightning,
  Shield,
  Settings,
  Check,
  User,
} from '@element-plus/icons-vue'
import FinEmpty from '@/components/common/FinEmpty.vue'
import ReplayFilterDialog from './ReplayFilterDialog.vue'
import ReplayExportDialog from './ReplayExportDialog.vue'
import ReplayChainDialog from './ReplayChainDialog.vue'
import VulnerabilityDetailDialog from './VulnerabilityDetailDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  REPLAY_TIME_RANGE_OPTIONS,
  REPLAY_CORE_METRICS,
  INTERCEPTION_EFFECT_LABELS,
  INTERCEPTION_EFFECT_COLORS,
  INTERCEPTION_EFFECT_BG_COLORS,
  RULE_VALIDITY_LABELS,
  RULE_VALIDITY_COLORS,
  RECURRENCE_STATUS_LABELS,
  RECURRENCE_STATUS_COLORS,
  HANDLE_CHANNEL_LABELS,
  HANDLE_CHANNEL_COLORS,
  VULNERABILITY_SEVERITY_LABELS,
  VULNERABILITY_SEVERITY_COLORS,
  VULNERABILITY_SEVERITY_GLOW,
  REPLAY_FILTER_HINTS,
} from '@/constants/dictionaries'
import {
  ReplayTimeRange,
  InterceptionEffectiveness,
  InterceptionType,
  VulnerabilitySeverity,
  HandleChannel,
  CustomerRiskLevel,
} from '@/enums'
import * as riskReplayApi from '@/api/riskReplay'
import { INTERCEPTION_TYPE_LABELS } from '@/constants/dictionaries'
import type {
  IReplayQueryParams,
  IReplayFilterValidation,
  IReplayCoreMetrics,
  IReplayTrendPoint,
  IReplayEvent,
  IRuleValidityAnalysis,
  IRiskVulnerability,
} from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const { hasPerm } = usePermission()

const openFilterDialog = ref(false)
const openExportDialog = ref(false)
const chainDialogVisible = ref(false)
const vulnDetailVisible = ref(false)

const trendLoading = ref(false)
const tableLoading = ref(false)
const ruleLoading = ref(false)
const distLoading = ref(false)

const filterValidation = ref<IReplayFilterValidation | null>(null)
const coreMetrics = ref<IReplayCoreMetrics | null>(null)
const trendData = ref<IReplayTrendPoint[]>([])
const eventList = ref<IReplayEvent[]>([])
const effectDistribution = ref<any[]>([])
const ruleValidity = ref<IRuleValidityAnalysis[]>([])
const vulnerabilities = ref<IRiskVulnerability[]>([])

const customDateRange = ref<[string, string] | null>(null)
const currentChainEvent = ref<IReplayEvent | null>(null)
const currentVuln = ref<IRiskVulnerability | null>(null)

const quickForm = reactive({ timeRange: ReplayTimeRange.LAST_MONTH, dimension: 'exception_type' })

const queryParams = reactive<IReplayQueryParams>({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  timeRange: ReplayTimeRange.LAST_MONTH,
})

const pagination = reactive({
  page: 1, pageSize: DEFAULT_PAGE_SIZE, total: 0, pageSizes: PAGE_SIZES,
})

const appliedFilterCount = computed(() => {
  let n = 0
  const keys: (keyof IReplayQueryParams)[] = [
    'exceptionTypes', 'riskLevels', 'interceptionEffects',
    'ruleCategories', 'customerLevels', 'handleOutcomes', 'reviewChannels',
    'recurrenceStatus', 'minInvolvedAmount', 'maxInvolvedAmount',
  ]
  keys.forEach((k) => {
    const v = queryParams[k] as any
    if (Array.isArray(v) && v.length > 0) n++
    else if (typeof v === 'number') n++
  })
  if (queryParams.customStart || queryParams.customEnd) n++
  return n
})

const metricsSignature = computed(() => JSON.stringify(coreMetrics.value || {}) + quickForm.timeRange)

const currentDays = computed(() => {
  const found = REPLAY_TIME_RANGE_OPTIONS.find((o) => o.value === quickForm.timeRange)
  return found?.days || 30
})

const validationHasErrors = computed(() =>
  filterValidation.value?.warnings.some((w) => w.severity === 'error') || false,
)

const exploitLabels: Record<string, string> = { low: '低', medium: '中', high: '高' }

function formatThousands(n: number): string {
  if (!n && n !== 0) return '0'
  return n.toLocaleString('zh-CN')
}
function formatCompact(n: number): string {
  if (!n) return '0'
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return formatThousands(n)
}
function formatShortDate(d: string): string {
  if (!d) return ''
  return d.slice(5).replace('-', '/')
}
function getExceptionTagColor(sev: string): string {
  const map: Record<string, string> = { low: '#909399', medium: '#409EFF', high: '#E6A23C', critical: '#F56C6C' }
  return map[sev] || '#909399'
}
function formatMetric(key: string, v: number): string {
  if (!v && v !== 0) return '0.00'
  const metric = REPLAY_CORE_METRICS.find((m) => m.key === key)
  const p = metric?.precision || 2
  const multiplier = metric && /Rate/i.test(key) ? 100 : 1
  return (v * multiplier).toFixed(p)
}
function metricTrend(key: string): number {
  const base: Record<string, number> = { interceptionRate: 2.3, recurrenceRate: -5.8, resolutionRate: 1.2, avgHandleTime: -12.4, compliancePassRate: 0.6, ruleEffectiveness: 3.1 }
  return base[key] || 0
}
function disabledPastDate(d: Date): boolean { return d.getTime() > Date.now() }
function getBarH(value: number, type: string): number {
  const max: Record<string, number> = {
    total: Math.max(...trendData.value.map((t) => t.totalEvents), 1),
    inter: Math.max(...trendData.value.map((t) => t.interceptions), 1),
    valid: Math.max(...trendData.value.map((t) => t.validInterceptions), 1),
    recur: Math.max(...trendData.value.map((t) => t.recurrences), 1),
  }
  const m = max[type] || 1
  return Math.max((value / m) * 100, value > 0 ? 4 : 0)
}

function handleTimeRangeChange(v: ReplayTimeRange) {
  queryParams.timeRange = v
  if (v !== ReplayTimeRange.CUSTOM) {
    queryParams.customStart = undefined
    queryParams.customEnd = undefined
    customDateRange.value = null
  }
  refreshAll()
}
function handleCustomDateChange() {
  if (customDateRange.value?.length === 2) {
    queryParams.timeRange = ReplayTimeRange.CUSTOM
    queryParams.customStart = customDateRange.value[0]
    queryParams.customEnd = customDateRange.value[1]
    refreshAll()
  }
}
function handleManualRefresh() {
  ElNotification.info({ title: '统计刷新', message: '正在重新计算核心指标...' })
  refreshAll(true)
}

async function validateFilter() {
  try {
    const res = await riskReplayApi.validateReplayFilter(queryParams)
    if (res.code === 0) filterValidation.value = res.data
    else buildMockValidation()
  } catch (e) { buildMockValidation() }
}
function buildMockValidation() {
  filterValidation.value = {
    valid: true,
    totalFilters: appliedFilterCount.value || 1,
    nestedDepth: 1,
    warnings: [{ code: 'W001', message: REPLAY_FILTER_HINTS[0], severity: 'info' }],
    timeSpanDays: currentDays.value,
    estimatedRecords: 1280 + currentDays.value * 42,
    estimatedResponseMs: 1200 + currentDays.value * 12,
    complianceFlags: [{ flag: '客户隐私合规', passed: true }, { flag: '导出权限校验', passed: true }],
  }
}

async function refreshAll(manual = false) {
  validateFilter()
  pagination.page = 1
  fetchDashboard()
  fetchEventList()
}

async function fetchDashboard() {
  try {
    const params = { ...queryParams } as any
    delete params.page
    delete params.pageSize
    const res = await riskReplayApi.getReplayCoreMetrics(params)
    if (res.code === 0) coreMetrics.value = res.data
    else buildMockMetrics()
    trendData.value = buildMockTrend()
    buildMockDist()
    ruleValidity.value = buildMockRuleValidity()
    vulnerabilities.value = buildMockVulnerabilities()
  } catch (e) {
    buildMockMetrics()
    trendData.value = buildMockTrend()
    buildMockDist()
    ruleValidity.value = buildMockRuleValidity()
    vulnerabilities.value = buildMockVulnerabilities()
  }
}

function buildMockMetrics() {
  coreMetrics.value = {
    totalEvents: 12840, screenedEvents: 11286,
    totalInterceptions: 2486, validInterceptions: 2106,
    validRiskEvents: 2300, recurrenceCount: 382, resolvedEvents: 2204,
    manuallyReviewedEvents: 812, complianceReviewed: 186, compliancePassed: 180,
    interceptionRate: 0.1936, recurrenceRate: 0.1537, resolutionRate: 0.8866,
    avgHandleTime: 3.4, medianHandleTime: 2.1, compliancePassRate: 0.9677,
    ruleEffectiveness: 0.847, falsePositiveRate: 0.153, falseNegativeRate: 0.052, totalEffectiveness: 0.891,
  }
}
function buildMockTrend(): IReplayTrendPoint[] {
  const days = Math.min(currentDays.value, 30)
  const arr: IReplayTrendPoint[] = []
  const now = new Date()
  const step = Math.ceil(currentDays.value / days)
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * step * 86400000)
    const base = 300 + Math.round(Math.sin(i * 0.3) * 80)
    arr.push({
      date: d.toISOString().slice(0, 10),
      totalEvents: base + Math.round(Math.random() * 80),
      interceptions: Math.round(base * 0.22),
      validInterceptions: Math.round(base * 0.18),
      recurrences: Math.round(base * 0.03 + Math.random() * 20),
      resolved: Math.round(base * 0.2),
      manuallyHandled: Math.round(base * 0.07),
      avgHandleTime: 2.5 + Math.random() * 2.5,
      complianceRate: 0.9 + Math.random() * 0.08,
    })
  }
  return arr
}
function buildMockDist() {
  effectDistribution.value = [
    { key: InterceptionEffectiveness.FULLY_EFFECTIVE, label: INTERCEPTION_EFFECT_LABELS[InterceptionEffectiveness.FULLY_EFFECTIVE], count: 1208, ratio: 0.486 },
    { key: InterceptionEffectiveness.PARTIALLY_EFFECTIVE, label: INTERCEPTION_EFFECT_LABELS[InterceptionEffectiveness.PARTIALLY_EFFECTIVE], count: 684, ratio: 0.275 },
    { key: InterceptionEffectiveness.OVER_INTERCEPTED, label: INTERCEPTION_EFFECT_LABELS[InterceptionEffectiveness.OVER_INTERCEPTED], count: 268, ratio: 0.108 },
    { key: InterceptionEffectiveness.INEFFECTIVE, label: INTERCEPTION_EFFECT_LABELS[InterceptionEffectiveness.INEFFECTIVE], count: 182, ratio: 0.073 },
    { key: InterceptionEffectiveness.UNDER_INTERCEPTED, label: INTERCEPTION_EFFECT_LABELS[InterceptionEffectiveness.UNDER_INTERCEPTED], count: 144, ratio: 0.058 },
  ]
}
function buildMockRuleValidity(): IRuleValidityAnalysis[] {
  const names = ['大额集中交易风控', '频繁撤单识别规则', '异常波段交易拦截', '关联账户对倒', '敏感时间窗口交易']
  return names.map((name, i) => {
    const triggers = [842, 612, 426, 318, 284][i]
    const statuses = ['fully_effective', 'partially_effective', 'overly_aggressive', 'partially_effective', 'requires_update'] as any
    return {
      ruleId: 100 + i, ruleName: name, ruleType: 'limit',
      validityStatus: statuses[i],
      triggerCount: triggers,
      validTriggerCount: Math.round(triggers * (0.7 + Math.random() * 0.2)),
      invalidTriggerCount: Math.round(triggers * 0.05),
      overTriggeredCount: Math.round(triggers * (0.05 + Math.random() * 0.1)),
      effectiveness: 0.68 + Math.random() * 0.3,
      avgResponseTimeMs: 40 + Math.round(Math.random() * 120),
      falsePositiveRate: 0.05 + Math.random() * 0.1,
      falseNegativeRate: 0.02 + Math.random() * 0.06,
      optimizedSuggestions: [],
      triggeredEventDistribution: {},
    }
  })
}
function buildMockVulnerabilities(): IRiskVulnerability[] {
  const titles = [
    '高净值客户高风险板块拦截阈值过高',
    '凌晨撤单组合规则缺失人工复核节点',
    '两融与普通账户跨端关联识别率低',
    'ST股票波动规则时间窗配置过大',
  ]
  const descs = [
    '当前高风险板块买入限额100万/日，但20-50万区间异常发生率明显攀升，建议分档拦截。',
    '00:00-09:15频繁撤单+大额组合触发后直接永久拦截，缺少人工复核，申诉解除比例达23%。',
    '同实名下普通账户与融资融券账户联动分析覆盖不足65%，存在跨端规避限额风险。',
    'ST板块波动规则时间窗240分钟，建议压缩为120分钟并提高识别权重，可降低误判率18%。',
  ]
  const severities: VulnerabilitySeverity[] = [VulnerabilitySeverity.CRITICAL, VulnerabilitySeverity.HIGH, VulnerabilitySeverity.MEDIUM, VulnerabilitySeverity.MEDIUM]
  return titles.map((t, i) => ({
    id: 'vuln-' + i,
    code: 'FRV-' + (2025000 + i),
    title: t, description: descs[i],
    severity: severities[i],
    affectedScope: ['全量高净值客户', '夜间时段', '两融客户', 'ST参与者'][i],
    affectedEventsCount: [182, 318, 256, 128][i],
    estimatedFinancialImpact: [18_600_000, 2_400_000, 5_800_000, 760_000][i],
    detectionDate: '2025-06-' + (10 + i),
    reportedBy: '风控复盘模型 v2.3',
    rootCauseAnalysis: ['阈值与分层不匹配', '处理链路SOP断点', '跨端特征缺失', '时间窗过大'][i],
    exploitDifficulty: (['medium', 'low', 'high', 'medium'] as any)[i],
    priorityScore: 95 - i * 10,
    remediationMeasures: [],
    mitigationTimeline: { identifiedAt: '2025-06-' + (10 + i) },
    relatedRuleIds: [100 + i],
    optimizationSuggestions: [],
    evidenceChains: [],
    dataQualityIssues: [],
  }))
}

async function fetchEventList() {
  tableLoading.value = true
  try {
    buildMockEvents()
  } finally { tableLoading.value = false }
}
function buildMockEvents() {
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  const types = [InterceptionType.LARGE_AMOUNT, InterceptionType.FREQUENT_CANCEL, InterceptionType.ABNORMAL_WAVE, InterceptionType.CONCENTRATED_POSITION]
  const effects = [InterceptionEffectiveness.FULLY_EFFECTIVE, InterceptionEffectiveness.PARTIALLY_EFFECTIVE, InterceptionEffectiveness.OVER_INTERCEPTED, InterceptionEffectiveness.INEFFECTIVE]
  const channels = [HandleChannel.SYSTEM_AUTO, HandleChannel.MANUAL_FIRST, HandleChannel.MANUAL_SECOND, HandleChannel.COMPLIANCE_REVIEW, HandleChannel.APPEALS_CLEARED]
  const levels = [CustomerRiskLevel.LOW, CustomerRiskLevel.MEDIUM, CustomerRiskLevel.HIGH, CustomerRiskLevel.VERY_HIGH]
  const severities = ['low', 'medium', 'high', 'critical']
  const recurrences = ['no_recurrence', 'minor_recurrence', 'moderate_recurrence', 'severe_recurrence']
  eventList.value = Array.from({ length: pagination.pageSize }).map((_, i) => {
    const idx = (pagination.page - 1) * pagination.pageSize + i
    const now = Date.now() - idx * 3600_000 * 8
    const integrity = 60 + (idx * 13) % 40
    return {
      id: 10000 + idx,
      eventId: 'FR-EV-' + (2025060000 + idx),
      customerId: 100 + idx,
      customerName: names[idx % names.length],
      customerAccount: `62220${100000 + idx}`,
      customerLevel: ['普通', '白银', '黄金', '铂金'][idx % 4],
      customerRiskLevel: levels[idx % 4],
      occurredAt: new Date(now).toISOString().slice(0, 19),
      exceptionType: types[idx % 4],
      exceptionTypeLabel: INTERCEPTION_TYPE_LABELS[types[idx % 4]],
      interceptionLevel: (['low', 'medium', 'high', 'critical'] as any)[idx % 4],
      severity: (severities[idx % 4] as any),
      triggeredRuleId: 100 + (idx % 5),
      triggeredRuleName: ['大额集中', '频繁撤单', '异常波段', '集中度', '联动'][idx % 5],
      triggeredRuleType: 'limit',
      interceptionEffect: effects[idx % 4],
      recurrenceStatus: (recurrences[idx % 4] as any),
      recurrenceCount: idx % 5,
      involvedAmount: 20_000 + idx * 23_600,
      handleChannel: channels[idx % 5],
      handleOutcome: ['永久拦截', '临时拦截', '人工通过', '申诉解除', '合规通过'][idx % 5],
      handledByName: ['系统', '风控A', '风控B', '合规C', ''][idx % 5],
      handledAt: new Date(now + 3_600_000 * (idx % 12)).toISOString().slice(0, 19),
      appealSubmitted: idx % 5 === 4,
      appealSucceeded: idx % 5 === 4,
      slaBreached: idx % 7 === 0,
      dataIntegrity: integrity,
      missingFields: integrity < 80 ? ['行为日志快照', '账户归属机构', '关联账户'] : undefined,
      replayValidated: idx % 3 !== 2,
      replayIssues: idx % 4 === 3 ? [{ type: 'duplicate', description: '疑似重复', severity: 'medium' }] : [],
      processingChainIds: ['C-' + (1000 + idx)],
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now + 3_600_000).toISOString(),
    } as IReplayEvent
  })
  pagination.total = 864
}

function handleApplyFilter(p: IReplayQueryParams) {
  Object.assign(queryParams, p)
  openFilterDialog.value = false
  refreshAll()
}
function handleSizeChange(s: number) {
  pagination.pageSize = s
  pagination.page = 1
  fetchEventList()
}
function openChainDialog(row?: IReplayEvent) {
  if (row) {
    currentChainEvent.value = row
    chainDialogVisible.value = true
  }
}
function handleSingleValidate(row: IReplayEvent) {
  ElMessage.info(`校验事件 ${row.eventId}...`)
}
function handleBatchValidate() {
  if (!hasPerm('riskReplay:validate')) {
    ElMessage.warning('无批量校验权限')
    return
  }
  ElMessageBox.confirm('对当前复盘条件下的所有事件进行重复与合规校验？', '批量校验', { type: 'warning' })
    .then(() => ElNotification.success({ title: '批量校验已启动', message: '完成后将在消息中心通知' }))
    .catch(() => {})
}
function viewSingleVuln(v: IRiskVulnerability) {
  currentVuln.value = v
  vulnDetailVisible.value = true
}

watch(() => quickForm.timeRange, (v) => {
  queryParams.timeRange = v
  validateFilter()
}, { immediate: true })

onMounted(() => {
  buildMockMetrics()
  refreshAll()
})
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.filter-badge {
  display: inline-block;
  min-width: 18px; padding: 0 6px; height: 18px; line-height: 18px;
  background: #F56C6C; color: #fff; border-radius: 9px;
  font-size: 11px; text-align: center; font-weight: 600;
  font-family: 'DIN', monospace; margin-left: 4px;
}
.quick-filter-bar {
  display: flex;
  gap: 20px;
  background: #fff;
  padding: 14px 18px;
  border-radius: 10px;
  border: 1px solid #E4E7ED;
  margin-bottom: 14px;
  align-items: center;
  flex-wrap: wrap;
}
.time-range-group {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.group-label {
  font-size: 13px; font-weight: 600; color: #606266;
  display: inline-flex; align-items: center; gap: 4px;
  .el-icon { color: #409EFF; }
}
.validation-alert {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; border-radius: 8px; margin-bottom: 18px;
  border: 1px solid;
  &.has-warning { background: #F0F9FF; border-color: #B3D8FF; color: #2E5A8B; }
  &.has-error { background: #FEF0F0; border-color: #FBC4C4; color: #8B2E2E; }
}
.valid-icon { font-size: 22px; flex-shrink: 0; }
.valid-content { flex: 1; }
.valid-summary { font-size: 13px; font-weight: 500; strong { font-family: 'DIN', monospace; color: inherit; } }
.valid-warnings { display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 6px; }
.warn-item { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; opacity: 0.9;
  &.error { color: #F56C6C; } &.warning { color: #E67E22; } }

.core-metrics-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; margin-bottom: 18px;
}
.metric-card {
  position: relative; background: #fff; border-radius: 10px;
  border: 1px solid #E4E7ED; padding: 16px 18px; overflow: hidden;
  transition: all 0.3s ease;
  &::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--card-color) 0%, transparent 55%);
    opacity: 0.06; pointer-events: none;
  }
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 26px rgba(26, 58, 92, 0.1);
    border-color: var(--card-color);
    .mc-glow { opacity: 0.7; }
  }
}
.mc-glow {
  position: absolute; top: -40px; right: -40px; width: 120px; height: 120px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--card-color) 0%, transparent 70%);
  opacity: 0; transition: opacity 0.4s ease;
}
.mc-inner { position: relative; }
.mc-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.mc-icon {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.mc-label { font-size: 12px; font-weight: 600; color: #606266; }
.mc-value-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 10px; }
.mc-value {
  font-size: 28px; font-weight: 700;
  font-family: 'DIN', monospace; line-height: 1;
}
.mc-unit { font-size: 12px; color: #8492A6; }
.mc-trend {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 10px; border-top: 1px dashed #EBEEF5; font-size: 11px;
}
.trend-label { color: #8492A6; }
.trend-value {
  display: inline-flex; align-items: center; gap: 2px;
  font-weight: 600; font-family: 'DIN', monospace;
  &.up { color: #F56C6C; } &.down { color: #67C23A; }
}

.content-grid {
  display: grid; grid-template-columns: 1fr 380px; gap: 16px; margin-bottom: 18px;
}
.main-chart-panel,
.distribution-panel,
.rule-validity-panel,
.table-card {
  background: #fff; border: 1px solid #E4E7ED; border-radius: 10px; overflow: hidden;
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 18px; border-bottom: 1px solid #F2F6FC;
}
.panel-title {
  margin: 0; font-size: 14px; font-weight: 600; color: #1F2D3D;
  display: inline-flex; align-items: center; gap: 6px;
}
.chart-body, .dist-body, .rv-body { padding: 18px; }
.chart-legend {
  display: flex; flex-wrap: wrap; gap: 16px;
  padding: 0 4px 14px; font-size: 12px; color: #606266;
}
.legend-item {
  display: inline-flex; align-items: center; gap: 6px; font-weight: 500;
}
.legend-dot {
  width: 10px; height: 10px; border-radius: 3px; display: inline-block;
  .legend-item.total & { background: #2980B9; }
  .legend-item.inter & { background: #8E44AD; }
  .legend-item.valid & { background: #27AE60; }
  .legend-item.recur & { background: #E67E22; }
}
.bars-container {
  display: flex; align-items: flex-end; justify-content: space-between;
  height: 240px; gap: 3px; padding-top: 10px; border-bottom: 1px dashed #E4E7ED;
}
.bar-group {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  height: 100%; min-width: 18px; transition: all 0.3s ease;
  &:hover { .bar { filter: brightness(1.15); transform: scaleY(1.02); } }
}
.bars-wrap {
  flex: 1; width: 100%; display: flex; align-items: flex-end;
  justify-content: center; gap: 2px; padding: 0 4px;
}
.bar-stack {
  width: 100%; height: 100%;
  display: flex; align-items: flex-end; justify-content: space-around; gap: 2px;
}
.bar {
  width: 4px; border-radius: 2px 2px 0 0;
  transition: all 0.3s ease; transform-origin: bottom;
  &.total { background: linear-gradient(180deg, #3498DB, #2980B9); }
  &.inter { background: linear-gradient(180deg, #9B59B6, #8E44AD); }
  &.valid { background: linear-gradient(180deg, #2ECC71, #27AE60); }
  &.recur { background: linear-gradient(180deg, #F39C12, #E67E22); }
}
.bar-date {
  font-size: 10px; color: #8492A6; margin-top: 6px;
  font-family: 'DIN', monospace;
}
.right-column { display: flex; flex-direction: column; gap: 16px; }
.effect-list { display: flex; flex-direction: column; gap: 12px; }
.effect-row {
  display: grid; grid-template-columns: 96px 1fr auto;
  align-items: center; gap: 10px;
}
.eff-tag {
  padding: 3px 10px; border-radius: 12px; border: 1px solid;
  font-size: 11px; font-weight: 600; text-align: center;
}
.eff-progress { height: 8px; background: #F2F6FC; border-radius: 4px; overflow: hidden; }
.eff-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
.eff-count {
  font-size: 11px; color: #606266; font-weight: 600;
  font-family: 'DIN', monospace; white-space: nowrap;
}
.rv-row { margin-bottom: 14px; &:last-child { margin-bottom: 0; } }
.rv-title { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.rv-rank {
  width: 20px; height: 20px; border-radius: 50%;
  background: #F2F6FC; color: #606266;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
}
.rv-name {
  font-size: 13px; font-weight: 600; color: #1F2D3D; flex: 1;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rv-progress-row {
  display: flex; align-items: center; gap: 10px; padding-left: 28px;
}
.rv-metric {
  font-size: 11px; color: #8492A6; font-family: 'DIN', monospace;
  min-width: 70px;
  &:last-child { text-align: right; min-width: 40px; font-weight: 600; }
}

.section-title {
  margin: 0; font-size: 15px; font-weight: 600; color: #1F2D3D;
  display: inline-flex; align-items: center; gap: 8px;
}
.table-header-section {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px 0; gap: 12px; flex-wrap: wrap;
}
.event-id {
  font-family: 'DIN', monospace; font-size: 12px; color: #1F2D3D; font-weight: 600;
}
.event-time {
  font-family: 'DIN', monospace; font-size: 12px; color: #606266;
}
.mini-customer { min-width: 0; }
.mc-name { font-size: 13px; font-weight: 600; color: #1F2D3D; }
.mc-acc { font-size: 11px; color: #8492A6; font-family: monospace; }
.amount-cell {
  font-family: 'DIN', monospace; font-weight: 600; color: #1F2D3D;
}
.int-ok { color: #27AE60; font-weight: 600; font-family: 'DIN', monospace; }
.int-warn { color: #E67E22; font-weight: 600; font-family: 'DIN', monospace; }
.pagination-wrapper {
  display: flex; justify-content: center; margin-top: 16px; padding-bottom: 16px;
}

.vulnerability-section {
  margin-top: 18px;
}
.section-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.vuln-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px;
}
.vuln-card {
  position: relative; background: #fff; border-radius: 10px;
  border: 1px solid #E4E7ED; padding: 16px 18px;
  overflow: hidden; cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  &::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(245,108,108,0.04) 0%, transparent 60%);
    opacity: 0; pointer-events: none;
    transition: opacity 0.3s;
  }
  &:hover {
    transform: translateY(-4px);
    border-color: transparent;
    .vuln-glow { opacity: 1; }
    &::before { opacity: 1; }
  }
}
.vuln-glow {
  position: absolute;
  inset: -1px;
  border-radius: 10px;
  box-shadow: var(--glow-color);
  opacity: 0;
  transition: opacity 0.35s ease;
  pointer-events: none;
}
.vuln-inner { position: relative; z-index: 1; }
.vuln-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.vuln-code {
  font-family: 'DIN', monospace; font-size: 11px; color: #909399;
}
.vuln-title {
  margin: 0 0 8px;
  font-size: 14px; font-weight: 700; color: #1F2D3D; line-height: 1.4;
  min-height: 40px;
}
.vuln-desc {
  margin: 0 0 14px;
  font-size: 12px; color: #606266; line-height: 1.6;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; min-height: 58px;
}
.vuln-stats {
  display: flex; flex-direction: column; gap: 6px;
  padding-top: 12px; border-top: 1px dashed #EBEEF5;
}
.vs-item {
  display: flex; justify-content: space-between;
  font-size: 11px; color: #8492A6;
  strong { color: #1F2D3D; font-weight: 600; font-family: 'DIN', monospace; }
  strong.danger { color: #F56C6C; }
}

.fade-metric-enter-active, .fade-metric-leave-active { transition: all 0.3s ease; }
.fade-metric-enter-from, .fade-metric-leave-to { opacity: 0; transform: translateY(6px); }

.fade-panel-enter-active, .fade-panel-leave-active { transition: all 0.3s ease; }
.fade-panel-enter-from, .fade-panel-leave-to { opacity: 0; }

@media (max-width: 1400px) {
  .core-metrics-grid { grid-template-columns: repeat(3, 1fr); }
  .vuln-grid { grid-template-columns: repeat(2, 1fr); }
  .content-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .core-metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .vuln-grid { grid-template-columns: 1fr; }
}
</style>
