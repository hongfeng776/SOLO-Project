<template>
  <div class="matching-page">
    <div class="matching-header">
      <div class="header-left">
        <h2 class="page-title">交易撮合管控</h2>
        <div class="session-badge" :class="sessionData.inSession ? 'active' : 'inactive'">
          <span class="pulse-dot"></span>
          {{ sessionData.currentPeriod }}
        </div>
      </div>
      <div class="header-right">
        <el-button @click="fetchProgress" :loading="progressLoading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="progress-section">
      <el-row :gutter="16">
        <el-col :span="4">
          <div class="progress-card">
            <div class="progress-value">{{ progressData.total }}</div>
            <div class="progress-label">待撮合</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="progress-card partial">
            <div class="progress-value">{{ progressData.partialDealed }}</div>
            <div class="progress-label">部分成交</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="progress-card success">
            <div class="progress-value">{{ progressData.fullDealed }}</div>
            <div class="progress-label">全部成交</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="progress-card failed">
            <div class="progress-value">{{ progressData.failed }}</div>
            <div class="progress-label">撮合失败</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="progress-card paused">
            <div class="progress-value">{{ progressData.paused }}</div>
            <div class="progress-label">已暂停</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="progress-card amount">
            <div class="progress-value">{{ formatThousand(progressData.dealedAmount) }}</div>
            <div class="progress-label">成交金额(元)</div>
          </div>
        </el-col>
      </el-row>
      <div class="progress-bar-wrap">
        <el-progress
          :percentage="Number(progressData.progressRate)"
          :stroke-width="12"
          :format="(p: number) => `撮合进度 ${p}%`"
        />
      </div>
    </div>

    <div class="filter-section">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待撮合" name="pending" />
        <el-tab-pane label="部分成交" name="partial" />
        <el-tab-pane label="全部成交" name="full" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>
      <div class="filter-actions">
        <el-input
          v-model="filterStockCode"
          placeholder="股票代码"
          clearable
          style="width: 160px; margin-right: 8px"
          @clear="fetchOrders"
          @keyup.enter="fetchOrders"
        />
        <el-select
          v-model="filterDirection"
          placeholder="方向"
          clearable
          style="width: 100px; margin-right: 8px"
          @change="fetchOrders"
        >
          <el-option label="买入" value="buy" />
          <el-option label="卖出" value="sell" />
        </el-select>
        <FinButton perm="trade:audit" type="primary" @click="handleBatchExecute" :disabled="selectedIds.length === 0">
          批量撮合 ({{ selectedIds.length }})
        </FinButton>
        <el-dropdown v-if="hasPerm('trade:audit')" @command="handleBatchControl" :disabled="selectedIds.length === 0">
          <el-button :disabled="selectedIds.length === 0">
            批量管控
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pause">暂停撮合</el-dropdown-item>
              <el-dropdown-item command="resume">恢复撮合</el-dropdown-item>
              <el-dropdown-item command="clear" divided>清空订单</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="table-section">
      <el-table
        ref="tableRef"
        :data="orderList"
        v-loading="loading"
        stripe
        border
        height="calc(100vh - 420px)"
        @selection-change="handleSelectionChange"
        :row-class-name="getRowClassName"
        :header-cell-style="{ position: 'sticky', top: 0, zIndex: 10, background: '#f5f7fa' }"
      >
        <el-table-column type="selection" width="45" fixed="left" />
        <el-table-column prop="trade_no" label="委托单号" width="160" fixed="left" />
        <el-table-column prop="stock_code" label="股票代码" width="100" />
        <el-table-column prop="stock_name" label="股票名称" width="120" />
        <el-table-column prop="direction" label="方向" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.direction === 'buy' ? 'danger' : 'success'" effect="dark" size="small">
              {{ row.direction === 'buy' ? '买入' : '卖出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="委托价格" width="110" align="right">
          <template #default="{ row }">
            {{ formatThousand(Number(row.price).toFixed(2)) }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="委托数量" width="110" align="right">
          <template #default="{ row }">
            {{ formatThousand(Number(row.quantity)) }}
          </template>
        </el-table-column>
        <el-table-column prop="trade_amount" label="委托金额" width="130" align="right">
          <template #default="{ row }">
            {{ formatThousand(Number(row.trade_amount || 0).toFixed(2)) }}
          </template>
        </el-table-column>
        <el-table-column prop="trade_status" label="撮合状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="getMatchStatusColor(row.trade_status)"
              effect="light"
              size="small"
              class="status-tag-animated"
            >
              {{ getMatchStatusLabel(row.trade_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="need_audit" label="需审核" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.need_audit" type="warning" size="small">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="委托时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <FinButton
              v-if="row.trade_status === 'pending' || row.trade_status === 'success' || row.trade_status === 'approved'"
              perm="trade:audit"
              type="primary"
              link
              @click="handleExecuteOne(row)"
            >
              撮合
            </FinButton>
            <el-button type="info" link @click="handleViewTrace(row)">溯源</el-button>
            <el-button type="primary" link @click="handleValidate(row)">校验</el-button>
            <FinButton
              v-if="hasPerm('trade:audit') && (row.trade_status === 'pending' || row.trade_status === 'success' || row.trade_status === 'approved')"
              perm="trade:audit"
              type="warning"
              link
              @click="handlePauseOne(row)"
            >
              暂停
            </FinButton>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchOrders"
          @current-change="fetchOrders"
        />
      </div>
    </div>

    <transition name="fade">
      <div v-if="matchingDialogVisible" class="matching-dialog-overlay" @click.self="matchingDialogVisible = false">
        <div class="matching-dialog">
          <div class="matching-dialog-header">
            <h3>撮合执行中</h3>
            <el-icon class="close-btn" @click="matchingDialogVisible = false"><Close /></el-icon>
          </div>
          <div class="matching-dialog-body">
            <div v-if="matchingLoading" class="matching-loading">
              <el-icon class="is-loading" :size="40"><Loading /></el-icon>
              <p>正在执行撮合...</p>
            </div>
            <div v-else-if="matchingResult" class="matching-result">
              <div class="result-status" :class="matchingResult.matchStatus">
                <el-icon :size="48">
                  <SuccessFilled v-if="matchingResult.matchStatus === 'full'" />
                  <WarningFilled v-else-if="matchingResult.matchStatus === 'partial'" />
                  <CircleCloseFilled v-else />
                </el-icon>
                <span class="result-text">{{ getMatchResultLabel(matchingResult.matchStatus) }}</span>
              </div>
              <el-descriptions :column="2" border size="small" style="margin-top: 16px">
                <el-descriptions-item label="成交价格">{{ formatThousand(matchingResult.matchPrice.toFixed(2)) }}</el-descriptions-item>
                <el-descriptions-item label="成交数量">{{ formatThousand(matchingResult.matchQuantity) }}</el-descriptions-item>
                <el-descriptions-item label="成交金额">{{ formatThousand(matchingResult.matchAmount.toFixed(2)) }}</el-descriptions-item>
                <el-descriptions-item label="剩余数量" v-if="matchingResult.remainQuantity > 0">{{ formatThousand(matchingResult.remainQuantity) }}</el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <el-dialog
      v-model="traceDialogVisible"
      title="撮合溯源"
      width="700px"
      class="trace-dialog"
      destroy-on-close
    >
      <div v-if="traceData" class="trace-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="委托单号">{{ traceData.tradeNo }}</el-descriptions-item>
          <el-descriptions-item label="撮合规则">{{ traceData.matchRule }}</el-descriptions-item>
          <el-descriptions-item label="成交价格">{{ formatThousand(traceData.matchPrice.toFixed(2)) }}</el-descriptions-item>
          <el-descriptions-item label="成交数量">{{ formatThousand(traceData.matchQuantity) }}</el-descriptions-item>
          <el-descriptions-item label="成交金额">{{ formatThousand(traceData.matchAmount.toFixed(2)) }}</el-descriptions-item>
          <el-descriptions-item label="市场价">{{ formatThousand(traceData.marketPrice.toFixed(2)) }}</el-descriptions-item>
          <el-descriptions-item label="价格偏差">{{ (traceData.priceDeviation * 100).toFixed(2) }}%</el-descriptions-item>
          <el-descriptions-item label="价格一致性">
            <el-tag :type="traceData.priceConsistent ? 'success' : 'danger'" size="small">
              {{ traceData.priceConsistent ? '一致' : '偏离' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="对手方">{{ traceData.counterParty }}</el-descriptions-item>
          <el-descriptions-item label="成交时间">{{ traceData.matchedAt ? formatDateTime(traceData.matchedAt) : '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="trace-timeline">
          <h4>撮合链路</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(node, idx) in traceData.traceNodes"
              :key="idx"
              :type="node.passed ? 'success' : 'danger'"
              :timestamp="formatDateTime(node.time)"
              placement="top"
            >
              <div class="trace-node">
                <span class="node-name">{{ node.name }}</span>
                <span class="node-msg" :class="{ error: !node.passed }">{{ node.message }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="validateDialogVisible"
      title="撮合校验"
      width="550px"
      destroy-on-close
    >
      <div v-if="validateData" class="validate-content">
        <div class="validate-summary" :class="{ valid: validateData.valid, invalid: !validateData.valid }">
          <el-icon :size="32">
            <SuccessFilled v-if="validateData.valid" />
            <CircleCloseFilled v-else />
          </el-icon>
          <span>{{ validateData.valid ? '校验通过' : '校验未通过' }}</span>
        </div>

        <el-descriptions :column="2" border size="small" style="margin-top: 12px">
          <el-descriptions-item label="订单有效性">
            <el-tag :type="validateData.orderValid ? 'success' : 'danger'" size="small">
              {{ validateData.orderValid ? '有效' : '无效' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="市场流动性">
            <el-tag :type="getLiquidityColor(validateData.marketLiquidity)" size="small">
              {{ getLiquidityLabel(validateData.marketLiquidity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="撮合规则">
            <el-tag :type="validateData.ruleActive ? 'success' : 'warning'" size="small">
              {{ validateData.ruleActive ? '生效中' : '未生效' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="股票状态">
            <el-tag :type="validateData.stockTradable ? 'success' : 'danger'" size="small">
              {{ validateData.stockTradable ? '可交易' : '不可交易' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="validateData.errors.length > 0" class="validate-errors">
          <h4>错误信息</h4>
          <div v-for="(err, idx) in validateData.errors" :key="idx" class="error-item">
            <el-icon color="#F56C6C"><CircleCloseFilled /></el-icon>
            {{ err }}
          </div>
        </div>

        <div v-if="validateData.warnings.length > 0" class="validate-warnings">
          <h4>警告信息</h4>
          <div v-for="(warn, idx) in validateData.warnings" :key="idx" class="warning-item">
            <el-icon color="#E6A23C"><WarningFilled /></el-icon>
            {{ warn }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, ArrowDown, Close, Loading, SuccessFilled, WarningFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import FinButton from '@/components/common/FinButton.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/utils/format'
import * as tradeApi from '@/api/trade'
import type { ITrade } from '@/types/api'
import type { IMatchingValidation, IMatchingResult, IMatchingProgress, IMatchingTrace } from '@/api/trade'

const { hasPerm } = usePermission()

const loading = ref(false)
const progressLoading = ref(false)
const orderList = ref<ITrade[]>([])
const selectedIds = ref<number[]>([])
const activeTab = ref('pending')
const filterStockCode = ref('')
const filterDirection = ref('')
const matchingDialogVisible = ref(false)
const matchingLoading = ref(false)
const matchingResult = ref<IMatchingResult | null>(null)
const traceDialogVisible = ref(false)
const traceData = ref<IMatchingTrace | null>(null)
const validateDialogVisible = ref(false)
const validateData = ref<IMatchingValidation | null>(null)
const sessionData = reactive({ inSession: false, currentPeriod: '开盘前', nextSessionAt: '' })
const progressData = reactive<IMatchingProgress>({
  total: 0,
  partialDealed: 0,
  fullDealed: 0,
  failed: 0,
  paused: 0,
  dealedAmount: '0.00',
  progressRate: '0.0',
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const tableRef = ref()

let refreshTimer: ReturnType<typeof setInterval> | null = null

function formatThousand(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

function getMatchStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待撮合',
    success: '待撮合',
    approved: '待撮合',
    partial_dealed: '部分成交',
    dealed: '全部成交',
    failed: '撮合失败',
    cancelled: '已撤销',
    paused: '已暂停',
    auditing: '审核中',
  }
  return map[status] || status
}

function getMatchStatusColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'warning',
    success: 'warning',
    approved: 'warning',
    partial_dealed: 'primary',
    dealed: 'success',
    failed: 'danger',
    cancelled: 'info',
    paused: 'info',
    auditing: 'primary',
  }
  return map[status] || 'info'
}

function getMatchResultLabel(status: string): string {
  const map: Record<string, string> = {
    full: '全部成交',
    partial: '部分成交',
    failed: '撮合失败',
  }
  return map[status] || status
}

function getLiquidityLabel(level: string): string {
  const map: Record<string, string> = {
    high: '高流动性',
    medium: '中等流动性',
    low: '低流动性',
    none: '无流动性',
  }
  return map[level] || level
}

function getLiquidityColor(level: string): string {
  const map: Record<string, string> = {
    high: 'success',
    medium: 'primary',
    low: 'warning',
    none: 'danger',
  }
  return map[level] || 'info'
}

function getRowClassName({ row }: { row: ITrade }): string {
  if (row.trade_status === 'partial_dealed') return 'row-partial'
  if (row.trade_status === 'dealed') return 'row-success'
  if (row.trade_status === 'failed') return 'row-failed'
  if (row.trade_status === 'paused') return 'row-paused'
  return ''
}

function handleSelectionChange(selection: ITrade[]) {
  selectedIds.value = selection.map(s => s.id)
}

async function fetchSession() {
  try {
    const res = await tradeApi.getTradingSession()
    if (res.code === 0) {
      Object.assign(sessionData, res.data)
    }
  } catch { /* ignore */ }
}

async function fetchProgress() {
  progressLoading.value = true
  try {
    const res = await tradeApi.getMatchingProgress()
    if (res.code === 0) {
      Object.assign(progressData, res.data)
    }
  } catch { /* ignore */ }
  finally {
    progressLoading.value = false
  }
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (activeTab.value !== 'all') {
      params.matchStatus = activeTab.value
    }
    if (filterStockCode.value) {
      params.stockCode = filterStockCode.value
    }
    if (filterDirection.value) {
      params.direction = filterDirection.value
    }
    const res = await tradeApi.getMatchingOrders(params)
    if (res.code === 0) {
      orderList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch {
    ElMessage.error('获取撮合订单失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
  selectedIds.value = []
  fetchOrders()
}

async function handleExecuteOne(row: ITrade) {
  try {
    await ElMessageBox.confirm(
      `确认对委托单 ${row.tradeNo} 执行撮合？`,
      '撮合确认',
      { type: 'info' },
    )
  } catch {
    return
  }

  matchingDialogVisible.value = true
  matchingLoading.value = true
  matchingResult.value = null

  try {
    const res = await tradeApi.executeMatching(row.id)
    if (res.code === 0) {
      matchingResult.value = res.data
      if (res.data.matchStatus === 'full') {
        ElMessage.success('撮合成功，全部成交')
      } else if (res.data.matchStatus === 'partial') {
        ElMessage.warning('部分成交，剩余订单待撮合')
      } else {
        ElMessage.error('撮合失败')
      }
      fetchOrders()
      fetchProgress()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('撮合执行失败')
  } finally {
    matchingLoading.value = false
  }
}

async function handleBatchExecute() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要撮合的订单')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认批量撮合 ${selectedIds.value.length} 笔订单？`,
      '批量撮合确认',
      { type: 'info' },
    )
  } catch {
    return
  }

  matchingDialogVisible.value = true
  matchingLoading.value = true
  matchingResult.value = null

  try {
    const res = await tradeApi.batchExecuteMatching(selectedIds.value)
    if (res.code === 0) {
      ElMessage.success(`撮合完成：成功${res.data.successCount}笔，部分成交${res.data.partialCount}笔，失败${res.data.failedCount}笔`)
      fetchOrders()
      fetchProgress()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('批量撮合执行失败')
  } finally {
    matchingLoading.value = false
  }
}

async function handleBatchControl(action: 'pause' | 'resume' | 'clear') {
  if (selectedIds.value.length === 0) return

  const actionLabels: Record<string, string> = { pause: '暂停', resume: '恢复', clear: '清空' }
  try {
    await ElMessageBox.confirm(
      `确认${actionLabels[action]} ${selectedIds.value.length} 笔订单？`,
      '批量管控确认',
      { type: action === 'clear' ? 'warning' : 'info' },
    )
  } catch {
    return
  }

  try {
    const res = await tradeApi.batchControlOrders({
      ids: selectedIds.value,
      action,
    })
    if (res.code === 0) {
      ElMessage.success(`${actionLabels[action]}操作完成：成功${res.data.successCount}笔，失败${res.data.failedCount}笔`)
      fetchOrders()
      fetchProgress()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('批量管控操作失败')
  }
}

async function handlePauseOne(row: ITrade) {
  try {
    await ElMessageBox.confirm(
      `确认暂停委托单 ${row.tradeNo} 的撮合？`,
      '暂停确认',
      { type: 'warning' },
    )
    const res = await tradeApi.batchControlOrders({ ids: [row.id], action: 'pause' })
    if (res.code === 0) {
      ElMessage.success('暂停成功')
      fetchOrders()
      fetchProgress()
    }
  } catch {
    if (arguments[0] !== 'cancel') {
      ElMessage.error('暂停操作失败')
    }
  }
}

async function handleViewTrace(row: ITrade) {
  try {
    const res = await tradeApi.getMatchingTrace(row.id)
    if (res.code === 0) {
      traceData.value = res.data
      traceDialogVisible.value = true
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('获取溯源信息失败')
  }
}

async function handleValidate(row: ITrade) {
  try {
    const res = await tradeApi.validateMatchingOrder(row.id)
    if (res.code === 0) {
      validateData.value = res.data
      validateDialogVisible.value = true
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('校验请求失败')
  }
}

onMounted(() => {
  fetchSession()
  fetchProgress()
  fetchOrders()
  refreshTimer = setInterval(() => {
    fetchProgress()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style lang="scss" scoped>
.matching-page {
  padding: 20px;
}

.matching-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--fin-text-primary);
  }

  .session-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;

    &.active {
      background: #f0f9eb;
      color: #67c23a;
    }

    &.inactive {
      background: #fdf6ec;
      color: #e6a23c;
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }
  }
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.progress-section {
  margin-bottom: 20px;

  .progress-card {
    text-align: center;
    padding: 16px 12px;
    border-radius: 8px;
    background: #f5f7fa;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .progress-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--fin-text-primary);
    }

    .progress-label {
      font-size: 12px;
      color: var(--fin-text-secondary);
      margin-top: 4px;
    }

    &.partial .progress-value { color: #409eff; }
    &.success .progress-value { color: #67c23a; }
    &.failed .progress-value { color: #f56c6c; }
    &.paused .progress-value { color: #909399; }
    &.amount .progress-value { color: var(--fin-primary); font-size: 18px; }
  }

  .progress-bar-wrap {
    margin-top: 12px;
  }
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;

  .filter-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.table-section {
  .status-tag-animated {
    transition: all 0.3s ease;
  }

  :deep(.row-partial) {
    background-color: #ecf5ff !important;
  }

  :deep(.row-success) {
    background-color: #f0f9eb !important;
  }

  :deep(.row-failed) {
    background-color: #fef0f0 !important;
  }

  :deep(.row-paused) {
    background-color: #f4f4f5 !important;
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.matching-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;

  .matching-dialog {
    background: #fff;
    border-radius: 12px;
    width: 500px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);

    .matching-dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;

      h3 {
        margin: 0;
        font-size: 16px;
      }

      .close-btn {
        cursor: pointer;
        font-size: 18px;
        color: #909399;
        transition: color 0.3s;

        &:hover {
          color: #303133;
        }
      }
    }

    .matching-dialog-body {
      padding: 32px 20px;

      .matching-loading {
        text-align: center;
        color: #409eff;

        p {
          margin-top: 12px;
          font-size: 14px;
        }
      }

      .matching-result {
        .result-status {
          text-align: center;
          margin-bottom: 12px;

          &.full { color: #67c23a; }
          &.partial { color: #e6a23c; }
          &.failed { color: #f56c6c; }

          .result-text {
            display: block;
            font-size: 18px;
            font-weight: 600;
            margin-top: 8px;
          }
        }
      }
    }
  }
}

.fade-enter-active {
  animation: fadeIn 0.3s ease;
}

.fade-leave-active {
  animation: fadeOut 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.trace-content {
  .trace-timeline {
    margin-top: 20px;

    h4 {
      margin: 0 0 12px;
      font-size: 14px;
      color: var(--fin-text-primary);
    }

    .trace-node {
      .node-name {
        font-weight: 600;
        margin-right: 8px;
      }

      .node-msg {
        color: var(--fin-text-secondary);

        &.error {
          color: #f56c6c;
        }
      }
    }
  }
}

.validate-content {
  .validate-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;

    &.valid {
      background: #f0f9eb;
      color: #67c23a;
    }

    &.invalid {
      background: #fef0f0;
      color: #f56c6c;
    }
  }

  .validate-errors,
  .validate-warnings {
    margin-top: 12px;

    h4 {
      margin: 0 0 8px;
      font-size: 13px;
      color: var(--fin-text-primary);
    }

    .error-item,
    .warning-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 0;
      font-size: 13px;
    }

    .error-item { color: #f56c6c; }
    .warning-item { color: #e6a23c; }
  }
}
</style>
