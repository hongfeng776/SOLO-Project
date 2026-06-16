<template>
  <div class="page-container">
    <el-row :gutter="16" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in statCards" :key="index">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon" :style="{ backgroundColor: item.bgColor }">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :style="{ color: item.color }">
              {{ item.value.toLocaleString() }}
            </div>
            <div class="stat-unit">{{ item.unit }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="page-toolbar">
      <FinButton
        perm="alert:batchConfirm"
        type="warning"
        :disabled="selectedIds.length === 0"
        @click="handleBatchConfirm"
      >
        <el-icon><CircleCheck /></el-icon>
        批量确认
      </FinButton>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button @click="handleRefresh" :loading="refreshLoading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #alertLevel="{ row }">
        <el-tag :color="getAlertLevelColor(row.alertLevel)" effect="dark">
          {{ getAlertLevelLabel(row.alertLevel) }}
        </el-tag>
      </template>

      <template #alertStatus="{ row }">
        <el-tag :type="getAlertStatusColor(row.alertStatus)" effect="light">
          {{ getAlertStatusLabel(row.alertStatus) }}
        </el-tag>
      </template>

      <template #riskScore="{ row }">
        <span :class="getRiskScoreClass(row.riskScore)">
          {{ row.riskScore?.toFixed(0) || '-' }}
        </span>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          查看详情
        </el-button>
        <FinButton
          v-if="row.alertStatus === AlertStatus.PENDING"
          perm="alert:confirm"
          type="warning"
          link
          @click="handleConfirm(row)"
        >
          确认告警
        </FinButton>
        <FinButton
          v-if="row.alertStatus === AlertStatus.PENDING || row.alertStatus === AlertStatus.CONFIRMED"
          perm="alert:resolve"
          type="success"
          link
          @click="handleResolve(row)"
        >
          处理告警
        </FinButton>
        <FinButton
          v-if="row.alertStatus === AlertStatus.PENDING"
          perm="alert:ignore"
          type="info"
          link
          @click="handleIgnore(row)"
        >
          忽略告警
        </FinButton>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="告警详情"
      width="700px"
      :hide-footer="true"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="告警编号">
          {{ currentDetail.alertNo }}
        </el-descriptions-item>
        <el-descriptions-item label="告警级别">
          <el-tag :color="getAlertLevelColor(currentDetail.alertLevel)" effect="dark">
            {{ getAlertLevelLabel(currentDetail.alertLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警类型">
          {{ getAlertTypeLabel(currentDetail.alertType) }}
        </el-descriptions-item>
        <el-descriptions-item label="告警状态">
          <el-tag :type="getAlertStatusColor(currentDetail.alertStatus)" effect="light">
            {{ getAlertStatusLabel(currentDetail.alertStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警标题" :span="2">
          {{ currentDetail.title }}
        </el-descriptions-item>
        <el-descriptions-item label="关联客户">
          {{ currentDetail.customerName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联股票">
          {{ currentDetail.stockCode ? `${currentDetail.stockCode} ${currentDetail.stockName}` : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联交易">
          {{ currentDetail.tradeId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="风险评分">
          <span :class="getRiskScoreClass(currentDetail.riskScore)">
            {{ currentDetail.riskScore?.toFixed(0) || '-' }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDateTime(currentDetail.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="告警内容" :span="2">
          {{ currentDetail.content }}
        </el-descriptions-item>
        <el-descriptions-item label="处理意见" :span="2" v-if="currentDetail.handleOpinion">
          {{ currentDetail.handleOpinion }}
        </el-descriptions-item>
      </el-descriptions>
    </FinDialog>

    <FinDialog
      v-model:visible="resolveDialogVisible"
      title="处理告警"
      width="500px"
      :loading="resolveLoading"
      @confirm="handleResolveConfirm"
    >
      <el-descriptions v-if="currentResolve" :column="2" border size="small">
        <el-descriptions-item label="告警编号">
          {{ currentResolve.alertNo }}
        </el-descriptions-item>
        <el-descriptions-item label="告警级别">
          <el-tag :color="getAlertLevelColor(currentResolve.alertLevel)" effect="dark" size="small">
            {{ getAlertLevelLabel(currentResolve.alertLevel) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警标题" :span="2">
          {{ currentResolve.title }}
        </el-descriptions-item>
      </el-descriptions>
      <el-form :model="resolveForm" label-width="80px" style="margin-top: 16px">
        <el-form-item label="处理意见">
          <el-input
            v-model="resolveForm.opinion"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见"
          />
        </el-form-item>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Warning, CircleClose, Bell, Calendar, Download, Refresh, CircleCheck } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import FinButton from '@/components/common/FinButton.vue'
import { formatDateTime } from '@/utils/format'
import {
  ALERT_TYPE_LABELS,
  ALERT_LEVEL_LABELS,
  ALERT_LEVEL_COLORS,
  ALERT_STATUS_LABELS,
  ALERT_STATUS_COLORS
} from '@/constants/dictionaries'
import { AlertType, AlertLevel, AlertStatus } from '@/enums'
import * as alertApi from '@/api/alert'
import type { IRiskAlert } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const loading = ref(false)
const refreshLoading = ref(false)
const resolveLoading = ref(false)
const tableData = ref<IRiskAlert[]>([])
const selectedIds = ref<number[]>([])
const searchParams = reactive<Record<string, any>>({})
const detailDialogVisible = ref(false)
const resolveDialogVisible = ref(false)
const currentDetail = ref<IRiskAlert | null>(null)
const currentResolve = ref<IRiskAlert | null>(null)

const alertStats = reactive({
  pendingCount: 0,
  highRiskCount: 0,
  todayCount: 0,
  monthCount: 0
})

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES
})

const resolveForm = reactive({
  opinion: ''
})

const statCards = computed(() => [
  {
    label: '待处理告警',
    value: alertStats.pendingCount,
    unit: '条',
    icon: Warning,
    color: '#F56C6C',
    bgColor: 'rgba(245, 108, 108, 0.1)'
  },
  {
    label: '高风险告警',
    value: alertStats.highRiskCount,
    unit: '条',
    icon: CircleClose,
    color: '#C45656',
    bgColor: 'rgba(196, 86, 86, 0.1)'
  },
  {
    label: '今日告警',
    value: alertStats.todayCount,
    unit: '条',
    icon: Bell,
    color: '#E6A23C',
    bgColor: 'rgba(230, 162, 60, 0.1)'
  },
  {
    label: '本月告警',
    value: alertStats.monthCount,
    unit: '条',
    icon: Calendar,
    color: '#2C5F8A',
    bgColor: 'rgba(44, 95, 138, 0.1)'
  }
])

const filterConfig = [
  {
    prop: 'keyword',
    label: '告警编号',
    type: 'input' as const,
    placeholder: '请输入告警编号关键字'
  },
  {
    prop: 'alertType',
    label: '告警类型',
    type: 'select' as const,
    options: [
      { label: '持仓告警', value: AlertType.POSITION },
      { label: '交易告警', value: AlertType.TRADE },
      { label: '风险告警', value: AlertType.RISK },
      { label: '合规告警', value: AlertType.COMPLIANCE },
      { label: '系统告警', value: AlertType.SYSTEM }
    ]
  },
  {
    prop: 'alertLevel',
    label: '告警级别',
    type: 'select' as const,
    options: [
      { label: '低', value: AlertLevel.LOW },
      { label: '中', value: AlertLevel.MEDIUM },
      { label: '高', value: AlertLevel.HIGH },
      { label: '严重', value: AlertLevel.CRITICAL }
    ]
  },
  {
    prop: 'alertStatus',
    label: '告警状态',
    type: 'select' as const,
    options: [
      { label: '待处理', value: AlertStatus.PENDING },
      { label: '已确认', value: AlertStatus.CONFIRMED },
      { label: '已处理', value: AlertStatus.RESOLVED },
      { label: '已忽略', value: AlertStatus.IGNORED }
    ]
  },
  {
    prop: 'dateRange',
    label: '日期范围',
    type: 'daterange' as const,
    advanced: true
  }
]

const tableColumns = [
  { prop: 'alertNo', label: '告警编号', minWidth: 160, fixed: 'left' },
  { prop: 'alertType', label: '告警类型', minWidth: 100, align: 'center' },
  { prop: 'alertLevel', label: '告警级别', minWidth: 90, slot: 'alertLevel', align: 'center' },
  { prop: 'alertStatus', label: '告警状态', minWidth: 90, slot: 'alertStatus', align: 'center' },
  { prop: 'customerName', label: '关联客户', minWidth: 100 },
  { prop: 'stockCode', label: '关联股票', minWidth: 100 },
  { prop: 'tradeId', label: '关联交易', minWidth: 100 },
  { prop: 'riskScore', label: '风险评分', minWidth: 90, slot: 'riskScore', align: 'center' },
  { prop: 'title', label: '告警标题', minWidth: 200 },
  { prop: 'createdAt', label: '创建时间', minWidth: 160, type: 'datetime' as const }
]

function getAlertTypeLabel(type: string): string {
  return ALERT_TYPE_LABELS[type as AlertType] || type
}

function getAlertLevelLabel(level: string): string {
  return ALERT_LEVEL_LABELS[level as AlertLevel] || level
}

function getAlertLevelColor(level: string): string {
  return ALERT_LEVEL_COLORS[level as AlertLevel] || '#909399'
}

function getAlertStatusLabel(status: string): string {
  return ALERT_STATUS_LABELS[status as AlertStatus] || status
}

function getAlertStatusColor(status: string): string {
  return ALERT_STATUS_COLORS[status as AlertStatus] || 'info'
}

function getRiskScoreClass(score?: number): string {
  if (score === null || score === undefined) return ''
  if (score < 30) return 'risk-low'
  if (score <= 60) return 'risk-medium'
  return 'risk-high'
}

async function fetchStats() {
  try {
    const res = await alertApi.getAlertStats()
    if (res.code === 0) {
      Object.assign(alertStats, res.data)
    }
  } catch (error) {
    // ignore
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    if (searchParams.dateRange && Array.isArray(searchParams.dateRange)) {
      params.startDate = searchParams.dateRange[0]
      params.endDate = searchParams.dateRange[1]
    }
    const res = await alertApi.getAlertList(params)
    if (res.code === 0) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => {
    delete searchParams[key]
  })
  pagination.page = 1
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

function handleSelectionChange(selection: IRiskAlert[]) {
  selectedIds.value = selection.map(item => item.id)
}

let lastRefreshTime = 0
function handleRefresh() {
  const now = Date.now()
  if (now - lastRefreshTime < 3000) {
    ElMessage.warning('操作过于频繁，请稍后再试')
    return
  }
  lastRefreshTime = now
  refreshLoading.value = true
  Promise.all([fetchStats(), fetchData()]).finally(() => {
    refreshLoading.value = false
  })
}

async function handleView(row: IRiskAlert) {
  try {
    const res = await alertApi.getAlertById(row.id)
    if (res.code === 0) {
      currentDetail.value = res.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

async function handleConfirm(row: IRiskAlert) {
  try {
    await ElMessageBox.confirm(
      `确定要确认告警 ${row.alertNo} 吗？`,
      '确认告警',
      { type: 'warning' }
    )
    const res = await alertApi.confirmAlert(row.id)
    if (res.code === 0) {
      ElMessage.success('确认成功')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('确认失败')
    }
  }
}

function handleResolve(row: IRiskAlert) {
  currentResolve.value = row
  resolveForm.opinion = ''
  resolveDialogVisible.value = true
}

async function handleResolveConfirm() {
  if (!currentResolve.value) return
  resolveLoading.value = true
  try {
    const res = await alertApi.resolveAlert(currentResolve.value.id, resolveForm.opinion)
    if (res.code === 0) {
      ElMessage.success('处理成功')
      resolveDialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('处理失败')
  } finally {
    resolveLoading.value = false
  }
}

async function handleIgnore(row: IRiskAlert) {
  try {
    await ElMessageBox.confirm(
      `确定要忽略告警 ${row.alertNo} 吗？`,
      '忽略告警',
      { type: 'warning' }
    )
    const res = await alertApi.ignoreAlert(row.id)
    if (res.code === 0) {
      ElMessage.success('已忽略')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

async function handleBatchConfirm() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要确认的告警')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量确认选中的 ${selectedIds.value.length} 条告警吗？`,
      '批量确认',
      { type: 'warning' }
    )
    const res = await alertApi.batchConfirmAlert(selectedIds.value)
    if (res.code === 0) {
      ElMessage.success('批量确认成功')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量确认失败')
    }
  }
}

async function handleExport() {
  try {
    const blob = await alertApi.exportAlertList(searchParams)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `告警列表_${Date.now()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(async () => {
  await fetchStats()
  fetchData()
})
</script>

<style lang="scss" scoped>
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
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
      font-size: 12px;
      color: var(--fin-text-secondary);
      margin-bottom: 2px;
    }

    .stat-value {
      font-size: 20px;
      font-weight: 700;
      line-height: 1.2;
      font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
    }

    .stat-unit {
      font-size: 11px;
      color: var(--fin-text-secondary);
      margin-top: 2px;
    }
  }
}

.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
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
</style>
