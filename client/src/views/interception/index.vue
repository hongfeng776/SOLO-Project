<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button type="primary" @click="handlePreCheck">
        <el-icon><Search /></el-icon>
        交易预校验
      </el-button>
      <el-button
        type="success"
        :disabled="selectedIds.length === 0"
        @click="handleBatchRelease"
      >
        <el-icon><Unlock /></el-icon>
        批量解除
      </el-button>
      <el-button
        type="warning"
        :disabled="selectedIds.length === 0"
        @click="handleBatchManualReview"
      >
        <el-icon><User /></el-icon>
        转人工复核
      </el-button>
      <el-button type="primary" plain @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
      <el-button type="info" plain @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
    </div>

    <div class="stats-overview">
      <div
        v-for="card in overviewCards"
        :key="card.key"
        class="stat-card"
        :class="card.class"
        @click="handleFilterByStatus(card.status)"
      >
        <div class="card-left">
          <div class="card-icon" :style="{ backgroundColor: card.iconBg }">
            <el-icon :size="22" :color="card.iconColor">
              <component :is="card.icon" />
            </el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
          </div>
        </div>
        <div v-if="card.subLabel" class="card-right">
          <div class="sub-value">{{ card.subValue }}</div>
          <div class="sub-label">{{ card.subLabel }}</div>
        </div>
      </div>
    </div>

    <div class="row-panel">
      <div class="type-panel">
        <div class="panel-title">违规类型分布</div>
        <div class="type-list">
          <div
            v-for="item in typeDistribution"
            :key="item.type"
            class="type-item"
            :style="{ '--bar-color': item.color }"
          >
            <div class="type-header">
              <div class="type-name">
                <span class="type-dot" :style="{ backgroundColor: item.color }" />
                {{ item.label }}
              </div>
              <div class="type-count">{{ item.count }} 笔</div>
            </div>
            <div class="type-bar-wrapper">
              <div
                class="type-bar"
                :style="{ width: (item.count / maxTypeCount * 100) + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="trend-panel">
        <div class="panel-title">近7日拦截趋势</div>
        <div class="trend-chart">
          <div v-for="(d, idx) in trendData" :key="idx" class="trend-column">
            <div class="trend-bar-wrapper">
              <div
                class="trend-bar amount-bar"
                :style="{ height: (d.amount / maxAmount * 100) + '%' }"
                :title="'金额: ' + d.amount"
              />
            </div>
            <div class="trend-label">{{ d.date.slice(5) }}</div>
            <div class="trend-count">{{ d.count }}笔</div>
          </div>
        </div>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      v-loading="loading"
      :data="tableData"
      :pagination="pagination"
      :columns="tableColumns"
      :row-key="'id'"
      :selection="true"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      @row-click="handleRowClick"
    >
      <template #status="{ row }">
        <div class="status-cell">
          <el-tag
            :type="getInterceptionStatusType(row.status)"
            effect="light"
            round
          >
            {{ getInterceptionStatusLabel(row.status) }}
          </el-tag>
        </div>
      </template>

      <template #interceptionType="{ row }">
        <div class="type-cell" :style="{ '--type-color': getInterceptionTypeColor(row.interceptionType) }">
          <div class="type-badge">
            <el-icon><component :is="getInterceptionTypeIcon(row.interceptionType)" /></el-icon>
            {{ getInterceptionTypeLabel(row.interceptionType) }}
          </div>
        </div>
      </template>

      <template #interceptionLevel="{ row }">
        <div class="level-cell" :style="{ '--level-color': getInterceptionLevelColor(row.interceptionLevel) }">
          <div
            class="level-badge"
            :style="{ backgroundColor: getInterceptionLevelBgColor(row.interceptionLevel), color: getInterceptionLevelColor(row.interceptionLevel) }"
          >
            <el-icon><WarningFilled /></el-icon>
            {{ getInterceptionLevelLabel(row.interceptionLevel) }}
          </div>
          <div class="risk-score">
            <span class="score-label">风险分:</span>
            <span class="score-value" :style="{ color: getScoreColor(row.riskScore) }">{{ row.riskScore }}</span>
          </div>
        </div>
      </template>

      <template #tradeInfo="{ row }">
        <div class="trade-cell">
          <div v-if="row.stockCode" class="trade-stock">
            <span class="stock-name" :title="row.stockName">{{ row.stockName }}</span>
            <span class="stock-code">{{ row.stockCode }}</span>
          </div>
          <div class="trade-side">
            <span :class="'side-tag ' + (row.side === 'buy' || row.side === 'BUY' || row.side === '1' ? 'side-buy' : 'side-sell')">
              {{ getSideLabel(row.side) }}
            </span>
            <span class="trade-detail">{{ row.quantity }} 股 × {{ row.price?.toFixed(2) }} 元</span>
          </div>
          <div v-if="row.amount" class="trade-amount">
            成交金额：<strong>{{ formatMoney(row.amount) }}</strong>
          </div>
        </div>
      </template>

      <template #triggeredRules="{ row }">
        <div class="rules-cell">
          <el-tooltip
            v-if="row.triggeredRules.length > 0"
            placement="top-start"
            :show-after="300"
          >
            <template #content>
              <div class="rules-tooltip">
                <div v-for="(r, idx) in row.triggeredRules" :key="idx" class="rule-item">
                  <el-tag :type="getSeverityTagType(r.severity)" size="small">{{ r.ruleName }}</el-tag>
                  <div class="rule-reason">{{ r.triggerReason }}</div>
                  <div v-if="r.thresholdValue !== undefined" class="rule-detail">
                    阈值: {{ r.thresholdValue }} → 实际: <span class="actual-val">{{ r.actualValue }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="rules-summary">
              <el-tag type="danger" effect="plain" size="small">
                触发 {{ row.triggeredRules.length }} 条规则
              </el-tag>
            </div>
          </el-tooltip>
          <span v-else class="no-rules">-</span>
        </div>
      </template>

      <template #actions="{ row }">
        <div class="actions-cell">
          <el-button type="primary" link size="small" @click.stop="handleViewDetail(row)">
            详情
          </el-button>
          <el-button
            v-if="canAppeal(row)"
            type="success"
            link
            size="small"
            @click.stop="handleAppeal(row)"
          >
            申诉
          </el-button>
          <el-button
            v-if="canHandle(row)"
            type="warning"
            link
            size="small"
            :ripple="true"
            @click.stop="handleHandle(row)"
          >
            处理
          </el-button>
          <el-button
            v-if="canRelease(row)"
            type="success"
            link
            size="small"
            :ripple="true"
            @click.stop="handleRelease(row)"
          >
            解除
          </el-button>
          <el-button
            v-if="canManualReview(row)"
            type="primary"
            link
            size="small"
            @click.stop="handleManualReview(row)"
          >
            复核
          </el-button>
        </div>
      </template>
    </FinTable>

    <InterceptionDetailDialog
      v-model:visible="detailVisible"
      :interception-id="currentInterceptionId"
      @action-success="handleActionSuccess"
    />

    <TradePreCheckDialog
      v-model:visible="preCheckVisible"
      @interception-created="handleInterceptionCreated"
    />

    <FinDialog
      v-model:visible="appealDialogVisible"
      title="合规申诉"
      width="560px"
      :loading="appealSubmitting"
      @confirm="handleAppealSubmit"
    >
      <el-form
        ref="appealFormRef"
        :model="appealForm"
        :rules="appealRules"
        label-width="90px"
      >
        <el-form-item label="拦截编号" prop="interceptionId">
          <el-input v-model="appealForm.interceptionId" disabled />
        </el-form-item>
        <el-form-item label="申诉原因" prop="reason">
          <el-select v-model="appealForm.reason" placeholder="请选择申诉原因" class="full-width">
            <el-option label="操作失误，并非异常交易" value="操作失误" />
            <el-option label="策略交易，符合投资逻辑" value="策略交易" />
            <el-option label="风险等级误判，交易合规" value="风险误判" />
            <el-option label="账户被盗，非本人操作" value="账户异常" />
            <el-option label="其他原因" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" prop="description">
          <el-input
            v-model="appealForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述申诉理由，建议提供相关凭证说明（不少于20个字）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="联系方式" prop="contactInfo">
          <el-input v-model="appealForm.contactInfo" placeholder="手机号/邮箱，便于复核联系" />
        </el-form-item>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Search,
  Refresh,
  Download,
  Unlock,
  User,
  WarningFilled,
  Money,
  CircleClose,
  Timer,
  TrendCharts,
  Close,
} from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import InterceptionDetailDialog from './InterceptionDetailDialog.vue'
import TradePreCheckDialog from './TradePreCheckDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/utils/format'
import {
  INTERCEPTION_TYPE_LABELS,
  INTERCEPTION_TYPE_COLORS,
  INTERCEPTION_STATUS_LABELS,
  INTERCEPTION_STATUS_COLORS,
  INTERCEPTION_LEVEL_LABELS,
  INTERCEPTION_LEVEL_COLORS,
  INTERCEPTION_LEVEL_BG_COLORS,
  SIDE_LABELS,
} from '@/constants/dictionaries'
import {
  InterceptionType,
  InterceptionStatus,
  InterceptionLevel,
  AppealStatus,
} from '@/enums'
import * as interceptionApi from '@/api/interception'
import type {
  IInterceptionRecord,
  IInterceptionStats,
  IAppealCreateData,
} from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'
import type { FormInstance, FormRules } from 'element-plus'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<IInterceptionRecord[]>([])
const selectedIds = ref<number[]>([])
const interceptionStats = ref<IInterceptionStats | null>(null)

const detailVisible = ref(false)
const preCheckVisible = ref(false)
const appealDialogVisible = ref(false)
const appealSubmitting = ref(false)
const appealFormRef = ref<FormInstance>()
const currentInterceptionId = ref<number | null>(null)

const searchParams = reactive<Record<string, any>>({})

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES,
})

const appealForm = reactive<IAppealCreateData>({
  interceptionId: 0,
  reason: '',
  description: '',
  contactInfo: '',
})

const appealRules: FormRules = {
  reason: [{ required: true, message: '请选择申诉原因', trigger: 'change' }],
  description: [
    { required: true, message: '请填写详细说明', trigger: 'blur' },
    { min: 20, message: '详细说明不少于20个字', trigger: 'blur' },
  ],
  contactInfo: [{ required: true, message: '请填写联系方式', trigger: 'blur' }],
}

const filterConfig = [
  {
    prop: 'keyword',
    label: '客户/股票/编号',
    type: 'input' as const,
    placeholder: '请输入客户名称/股票代码/拦截编号',
  },
  {
    prop: 'interceptionType',
    label: '违规类型',
    type: 'select' as const,
    options: Object.entries(INTERCEPTION_TYPE_LABELS).map(([value, label]) => ({ label, value })),
  },
  {
    prop: 'status',
    label: '处理状态',
    type: 'select' as const,
    options: Object.entries(INTERCEPTION_STATUS_LABELS).map(([value, label]) => ({ label, value })),
  },
  {
    prop: 'interceptionLevel',
    label: '风险等级',
    type: 'select' as const,
    options: [
      { label: '一般', value: InterceptionLevel.LOW },
      { label: '关注', value: InterceptionLevel.MEDIUM },
      { label: '严重', value: InterceptionLevel.HIGH },
      { label: '紧急', value: InterceptionLevel.CRITICAL },
    ],
  },
  {
    prop: 'appealStatus',
    label: '申诉状态',
    type: 'select' as const,
    options: [
      { label: '未申诉', value: AppealStatus.NOT_SUBMITTED },
      { label: '申诉中', value: AppealStatus.PENDING },
      { label: '申诉通过', value: AppealStatus.APPROVED },
      { label: '申诉驳回', value: AppealStatus.REJECTED },
    ],
  },
  {
    prop: 'dateRange',
    label: '拦截时间',
    type: 'daterange' as const,
  },
]

const tableColumns = [
  { prop: 'interceptionNo', label: '拦截编号', width: 150, fixed: 'left' as const },
  { prop: 'customerName', label: '客户信息', width: 150, formatter: (r: any) => `${r.customerName || '-'}${r.customerAccount ? '(' + r.customerAccount + ')' : ''}` },
  { prop: 'interceptionType', label: '违规类型', width: 130, slot: 'interceptionType' },
  { prop: 'interceptionLevel', label: '风险等级', width: 160, slot: 'interceptionLevel' },
  { prop: 'tradeInfo', label: '交易信息', width: 240, slot: 'tradeInfo' },
  { prop: 'status', label: '处理状态', width: 120, slot: 'status' },
  { prop: 'triggeredRules', label: '触发规则', width: 130, slot: 'triggeredRules' },
  { prop: 'createdAt', label: '拦截时间', width: 170, formatter: (r: any) => formatDateTime(r.createdAt) },
  { prop: 'actions', label: '操作', width: 260, slot: 'actions', fixed: 'right' as const },
]

const overviewCards = computed(() => [
  {
    key: 'today',
    label: '今日拦截',
    value: interceptionStats.value?.todayCount || 0,
    subValue: formatMoney(interceptionStats.value?.todayAmount || 0),
    subLabel: '今日涉及金额',
    icon: 'WarningFilled',
    iconBg: 'rgba(245, 108, 108, 0.1)',
    iconColor: '#F56C6C',
    class: 'card-danger',
    status: null,
  },
  {
    key: 'temporary',
    label: '临时拦截',
    value: getStatusCount(InterceptionStatus.TEMPORARY),
    subValue: formatMoney(interceptionStats.value?.frozenFundTotal || 0),
    subLabel: '冻结资金',
    icon: 'Clock',
    iconBg: 'rgba(230, 162, 60, 0.1)',
    iconColor: '#E6A23C',
    class: 'card-warning',
    status: InterceptionStatus.TEMPORARY,
  },
  {
    key: 'manual',
    label: '待人工复核',
    value: interceptionStats.value?.pendingManualReviewCount || 0,
    subValue: interceptionStats.value?.pendingAppealCount || 0,
    subLabel: '待申诉审核',
    icon: 'UserFilled',
    iconBg: 'rgba(64, 158, 255, 0.1)',
    iconColor: '#409EFF',
    class: 'card-primary',
    status: InterceptionStatus.MANUAL_REVIEW,
  },
  {
    key: 'total',
    label: '累计拦截',
    value: interceptionStats.value?.total || 0,
    subValue: tableData.value.length,
    subLabel: '当前列表总数',
    icon: 'Finished',
    iconBg: 'rgba(103, 194, 58, 0.1)',
    iconColor: '#67C23A',
    class: 'card-success',
    status: null,
  },
])

const typeDistribution = computed(() => {
  const raw = interceptionStats.value?.byType || []
  if (raw.length === 0) {
    const defaultTypes = [
      InterceptionType.LARGE_AMOUNT,
      InterceptionType.FREQUENCY_TRIGGER,
      InterceptionType.FREQUENT_CANCEL,
      InterceptionType.ABNORMAL_WAVE,
      InterceptionType.OVER_POSITION_LIMIT,
    ]
    return defaultTypes.map((t, i) => ({
      type: t,
      label: getInterceptionTypeLabel(t),
      color: getInterceptionTypeColor(t),
      count: [12, 8, 6, 4, 3][i],
    }))
  }
  return raw.map((r) => ({
    type: r.type,
    label: getInterceptionTypeLabel(r.type),
    color: getInterceptionTypeColor(r.type),
    count: r.count,
  }))
})

const maxTypeCount = computed(() => Math.max(...typeDistribution.value.map((t) => t.count), 1))

const trendData = computed(() => {
  if (interceptionStats.value?.trend?.length) return interceptionStats.value.trend
  const result = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    result.push({
      date: dateStr,
      count: Math.floor(Math.random() * 15) + 3,
      amount: Math.floor(Math.random() * 500000) + 50000,
    })
  }
  return result
})

const maxAmount = computed(() => Math.max(...trendData.value.map((d) => d.amount), 1))

function getStatusCount(status: InterceptionStatus): number {
  const found = interceptionStats.value?.byStatus?.find((s) => s.status === status)
  return found?.count || 0
}

function getInterceptionTypeLabel(type: string): string {
  return INTERCEPTION_TYPE_LABELS[type as InterceptionType] || type
}

function getInterceptionTypeColor(type: string): string {
  return INTERCEPTION_TYPE_COLORS[type as InterceptionType] || '#909399'
}

function getInterceptionTypeIcon(type: string): any {
  const map: Record<string, any> = {
    [InterceptionType.LARGE_AMOUNT]: Money,
    [InterceptionType.CONCENTRATED_TRADE]: 'Collection',
    [InterceptionType.FREQUENT_CANCEL]: Close,
    [InterceptionType.ABNORMAL_WAVE]: TrendCharts,
    [InterceptionType.PRICE_MANIPULATION]: WarningFilled,
    [InterceptionType.BLACKLIST_STOCK]: CircleClose,
    [InterceptionType.RISK_CUSTOMER]: User,
    [InterceptionType.OVER_POSITION_LIMIT]: 'Goods',
    [InterceptionType.OVER_TRADE_LIMIT]: Money,
    [InterceptionType.VOLATILITY_TRIGGER]: TrendCharts,
    [InterceptionType.FREQUENCY_TRIGGER]: Timer,
  }
  return map[type] || WarningFilled
}

function getInterceptionStatusLabel(status: string): string {
  return INTERCEPTION_STATUS_LABELS[status as InterceptionStatus] || status
}

function getInterceptionStatusType(status: string): 'success' | 'warning' | 'info' | 'primary' | 'danger' {
  return (INTERCEPTION_STATUS_COLORS[status as InterceptionStatus] as any) || 'info'
}

function getInterceptionLevelLabel(level: string): string {
  return INTERCEPTION_LEVEL_LABELS[level as InterceptionLevel] || level
}

function getInterceptionLevelColor(level: string): string {
  return INTERCEPTION_LEVEL_COLORS[level as InterceptionLevel] || '#909399'
}

function getInterceptionLevelBgColor(level: string): string {
  return INTERCEPTION_LEVEL_BG_COLORS[level as InterceptionLevel] || 'rgba(144,147,153,0.1)'
}

function getSideLabel(side?: string): string {
  if (!side) return '-'
  return SIDE_LABELS[side] || side
}

function getSeverityTagType(s: string): 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'error') return 'danger'
  if (s === 'warning') return 'warning'
  return 'info'
}

function formatMoney(amount: number): string {
  if (amount === undefined || amount === null) return '0 元'
  if (amount >= 100000000) return (amount / 100000000).toFixed(2) + ' 亿'
  if (amount >= 10000) return (amount / 10000).toFixed(2) + ' 万'
  return amount.toFixed(2) + ' 元'
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#F56C6C'
  if (score >= 60) return '#E6A23C'
  if (score >= 40) return '#409EFF'
  return '#909399'
}

function canAppeal(row: IInterceptionRecord): boolean {
  const appealable = [
    InterceptionStatus.TEMPORARY,
    InterceptionStatus.PERMANENT,
    InterceptionStatus.MANUAL_REVIEW,
  ]
  return (
    hasPerm('interception:appeal') &&
    appealable.includes(row.status) &&
    row.appealStatus === AppealStatus.NOT_SUBMITTED
  )
}

function canHandle(row: IInterceptionRecord): boolean {
  return hasPerm('interception:handle') && [
    InterceptionStatus.MANUAL_REVIEW,
    InterceptionStatus.APPEALING,
  ].includes(row.status)
}

function canRelease(row: IInterceptionRecord): boolean {
  return hasPerm('interception:release') && [
    InterceptionStatus.TEMPORARY,
    InterceptionStatus.PERMANENT,
    InterceptionStatus.MANUAL_REVIEW,
    InterceptionStatus.APPEALING,
    InterceptionStatus.APPEAL_REJECTED,
  ].includes(row.status)
}

function canManualReview(row: IInterceptionRecord): boolean {
  return hasPerm('interception:review') && [
    InterceptionStatus.TEMPORARY,
    InterceptionStatus.PERMANENT,
  ].includes(row.status)
}

async function fetchStats() {
  try {
    const res = await interceptionApi.getInterceptionStats()
    if (res.code === 0) {
      interceptionStats.value = res.data
    }
  } catch (e) {
    // 忽略
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    if (params.dateRange && Array.isArray(params.dateRange)) {
      params.startDate = params.dateRange[0]
      params.endDate = params.dateRange[1]
      delete params.dateRange
    }
    const res = await interceptionApi.getInterceptionList(params)
    if (res.code === 0) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取拦截记录失败')
  } finally {
    loading.value = false
  }
}

function refreshData() {
  fetchStats()
  fetchData()
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach((key) => {
    delete searchParams[key]
  })
  pagination.page = 1
  fetchData()
}

function handleFilterByStatus(status: InterceptionStatus | null) {
  if (status === null) {
    handleReset()
  } else {
    searchParams.status = status
    pagination.page = 1
    fetchData()
  }
}

function handleSelectionChange(rows: any[]) {
  selectedIds.value = rows.map((r) => r.id)
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

function handleRowClick(row: IInterceptionRecord) {
  handleViewDetail(row)
}

function handleViewDetail(row: IInterceptionRecord) {
  currentInterceptionId.value = row.id
  detailVisible.value = true
}

function handlePreCheck() {
  if (!hasPerm('interception:precheck')) {
    ElMessage.warning('您没有交易预校验的权限')
    return
  }
  preCheckVisible.value = true
}

function handleAppeal(row: IInterceptionRecord) {
  appealForm.interceptionId = row.id
  appealForm.reason = ''
  appealForm.description = ''
  appealForm.contactInfo = ''
  currentInterceptionId.value = row.id
  appealDialogVisible.value = true
}

async function handleAppealSubmit() {
  if (!appealFormRef.value) return
  try {
    await appealFormRef.value.validate()
  } catch (e) {
    triggerShake()
    ElMessage.warning('请完整填写申诉信息')
    return
  }
  appealSubmitting.value = true
  try {
    const res = await interceptionApi.createAppeal({ ...appealForm })
    if (res.code === 0) {
      ElMessage.success('申诉提交成功，请等待人工审核')
      ElNotification({
        type: 'success',
        title: '申诉已提交',
        message: `申诉编号#${res.data.id}，将在1-3个工作日内处理完毕`,
        duration: 4000,
      })
      appealDialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message)
      triggerShake()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
    triggerShake()
  } finally {
    appealSubmitting.value = false
  }
}

let shakeTimer: any = null
function triggerShake() {
  const box = document.querySelector('.el-dialog__body')
  if (box) {
    box.classList.add('shake-animation')
    if (shakeTimer) clearTimeout(shakeTimer)
    shakeTimer = setTimeout(() => {
      box.classList.remove('shake-animation')
    }, 500)
  }
}

async function handleHandle(row: IInterceptionRecord) {
  currentInterceptionId.value = row.id
  detailVisible.value = true
}

async function handleRelease(row: IInterceptionRecord) {
  try {
    const { value: remark } = await ElMessageBox.prompt(
      `确定解除 ${row.customerName} 的${getInterceptionTypeLabel(row.interceptionType)}拦截吗？解除后将自动解冻资金和持仓。`,
      '解除拦截确认',
      {
        inputPlaceholder: '请输入解除事由（必填）',
        confirmButtonText: '确定解除',
        cancelButtonText: '取消',
        type: 'warning',
        inputValidator: (v) => (!!v && v.trim().length >= 4 ? true : '事由至少4个字符'),
      },
    )
    const res = await interceptionApi.releaseInterception(row.id, remark as string)
    if (res.code === 0) {
      ElMessage.success('拦截已解除，资金和持仓操作权限已恢复')
      ElNotification({
        type: 'success',
        title: '拦截解除通知',
        message: `客户 ${row.customerName} 的${getInterceptionTypeLabel(row.interceptionType)}拦截已解除，已自动解冻相关资产`,
        duration: 4000,
      })
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('解除失败')
  }
}

async function handleManualReview(row: IInterceptionRecord) {
  try {
    const { value: remark } = await ElMessageBox.prompt(
      `将 ${row.customerName} 的拦截记录转为人工复核？`,
      '转人工复核确认',
      {
        inputPlaceholder: '请输入转核说明（必填）',
        confirmButtonText: '确认转核',
        cancelButtonText: '取消',
        type: 'info',
        inputValidator: (v) => (!!v && v.trim().length >= 4 ? true : '说明至少4个字符'),
      },
    )
    const res = await interceptionApi.updateInterceptionStatus(
      row.id,
      InterceptionStatus.MANUAL_REVIEW,
      remark as string,
    )
    if (res.code === 0) {
      ElMessage.success('已转为人工复核')
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

async function handleBatchRelease() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择记录')
    return
  }
  try {
    const { value: remark } = await ElMessageBox.prompt(
      `确定批量解除选中的 ${selectedIds.value.length} 条拦截记录吗？`,
      '批量解除确认',
      {
        inputPlaceholder: '请输入批量解除事由（必填）',
        confirmButtonText: '确认解除',
        cancelButtonText: '取消',
        type: 'warning',
        inputValidator: (v) => (!!v && v.trim().length >= 4 ? true : '事由至少4个字符'),
      },
    )
    const res = await interceptionApi.batchReleaseInterception(selectedIds.value, remark as string)
    if (res.code === 0) {
      ElMessage.success(`批量解除完成：成功${res.data.success}条，失败${res.data.failed}条`)
      fetchData()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

async function handleBatchManualReview() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择记录')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定将选中的 ${selectedIds.value.length} 条拦截记录转为人工复核？`,
      '批量转核确认',
      { type: 'info' },
    )
    for (const id of selectedIds.value) {
      try {
        await interceptionApi.updateInterceptionStatus(
          id,
          InterceptionStatus.MANUAL_REVIEW,
          '批量转人工复核',
        )
      } catch (e) {
        // 忽略
      }
    }
    ElMessage.success('操作完成')
    fetchData()
    fetchStats()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

async function handleExport() {
  try {
    const res = await interceptionApi.getInterceptionExport({
      page: 1,
      pageSize: 10000,
      ...searchParams,
    })
    if (res.code === 0) {
      ElMessage.success('导出成功，下载已开始')
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

function handleInterceptionCreated() {
  fetchData()
  fetchStats()
}

function handleActionSuccess() {
  detailVisible.value = false
  fetchData()
  fetchStats()
}

onMounted(() => {
  fetchStats()
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }

  &.card-danger:hover { border-color: #F56C6C; }
  &.card-warning:hover { border-color: #E6A23C; }
  &.card-primary:hover { border-color: #409EFF; }
  &.card-success:hover { border-color: #67C23A; }
}

.card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.card-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-value {
  font-size: 26px;
  font-weight: 700;
  color: #1F2D3D;
  line-height: 1.2;
  margin-bottom: 4px;
}

.card-label {
  font-size: 13px;
  color: #8492A6;
}

.card-right {
  padding-top: 10px;
  border-top: 1px dashed #EBEEF5;
  display: flex;
  justify-content: space-between;
}

.sub-value {
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
}

.sub-label {
  font-size: 12px;
  color: #8492A6;
}

.row-panel {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

.type-panel,
.trend-panel {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #E4E7ED;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2D3D;
  margin-bottom: 16px;
  padding-left: 10px;
  border-left: 3px solid #409EFF;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.type-item {
  --bar-color: #909399;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.type-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1F2D3D;
  font-weight: 500;
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.type-count {
  font-size: 13px;
  color: #606266;
  font-weight: 600;
  font-family: monospace;
}

.type-bar-wrapper {
  height: 6px;
  background: #F2F6FC;
  border-radius: 3px;
  overflow: hidden;
}

.type-bar {
  height: 100%;
  background: var(--bar-color);
  border-radius: 3px;
  transition: width 0.6s ease;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  align-items: end;
  height: 180px;
  padding-top: 10px;
}

.trend-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
}

.trend-bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 60%;
  min-height: 4px;
  background: linear-gradient(180deg, #F56C6C 0%, rgba(245, 108, 108, 0.6) 100%);
  border-radius: 3px 3px 0 0;
  transition: height 0.5s ease;
  cursor: pointer;

  &:hover {
    background: linear-gradient(180deg, #D93025 0%, #F56C6C 100%);
  }
}

.trend-label {
  font-size: 11px;
  color: #8492A6;
}

.trend-count {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  font-family: monospace;
}

.status-cell {
  display: flex;
  justify-content: center;
}

.type-cell {
  --type-color: #909399;
}

.type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--type-color) + '15';
  color: var(--type-color);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  .el-icon {
    font-size: 13px;
  }
}

.level-cell {
  --level-color: #909399;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}

.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;

  .el-icon {
    font-size: 12px;
  }
}

.risk-score {
  font-size: 12px;
  display: flex;
  gap: 4px;
}

.score-label {
  color: #8492A6;
}

.score-value {
  font-weight: 700;
  font-family: monospace;
}

.trade-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.trade-stock {
  display: flex;
  gap: 6px;
  align-items: baseline;
}

.stock-name {
  font-weight: 600;
  color: #1F2D3D;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stock-code {
  font-size: 11px;
  color: #8492A6;
  font-family: monospace;
}

.trade-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.side-tag {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;

  &.side-buy {
    background: rgba(245, 108, 108, 0.1);
    color: #F56C6C;
  }

  &.side-sell {
    background: rgba(103, 194, 58, 0.1);
    color: #67C23A;
  }
}

.trade-detail {
  font-size: 12px;
  color: #606266;
}

.trade-amount {
  font-size: 12px;
  color: #606266;

  strong {
    color: #1F2D3D;
  }
}

.rules-cell {
  display: flex;
  justify-content: center;
}

.rules-tooltip {
  max-width: 400px;
}

.rule-item {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #E4E7ED;

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
}

.rule-reason {
  margin-top: 6px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

.rule-detail {
  margin-top: 4px;
  font-size: 12px;
  color: #8492A6;
}

.actual-val {
  color: #F56C6C;
  font-weight: 600;
}

.no-rules {
  color: #C0C4CC;
}

.actions-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.full-width {
  width: 100%;
}

.shake-animation {
  animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-8px); }
  40%, 60% { transform: translateX(8px); }
}

@media (max-width: 1400px) {
  .stats-overview { grid-template-columns: repeat(2, 1fr); }
  .row-panel { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .stats-overview { grid-template-columns: 1fr; }
}
</style>
