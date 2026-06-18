<template>
  <div class="status-control-page">
    <div class="page-header">
      <h2 class="page-title">交易状态管控</h2>
      <div class="header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索委托单号/客户名"
          clearable
          class="search-input"
          @clear="fetchOrders"
          @keyup.enter="fetchOrders"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <div class="filter-bar">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待撮合" name="pending" />
        <el-tab-pane label="部分成交" name="partial_dealed" />
        <el-tab-pane label="已成交" name="dealed" />
        <el-tab-pane label="已撤单" name="cancelled" />
        <el-tab-pane label="撮合失败" name="failed" />
      </el-tabs>
      <div class="filter-actions">
        <FinButton perm="trade:manage" type="primary" @click="showBatchDialog" :disabled="selectedIds.length === 0">
          批量变更 ({{ selectedIds.length }})
        </FinButton>
      </div>
    </div>

    <div class="table-wrap">
      <el-table
        ref="tableRef"
        :data="orderList"
        v-loading="loading"
        stripe
        border
        height="calc(100vh - 340px)"
        @selection-change="handleSelectionChange"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="selection" width="45" fixed="left" />
        <el-table-column prop="trade_no" label="委托单号" width="160" fixed="left" />
        <el-table-column prop="customer_id" label="客户ID" width="80" />
        <el-table-column prop="stock_code" label="股票代码" width="100" />
        <el-table-column prop="stock_name" label="股票名称" width="120" />
        <el-table-column prop="direction" label="方向" width="70" align="center">
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
        <el-table-column prop="quantity" label="数量" width="90" align="right">
          <template #default="{ row }">
            {{ formatThousand(Number(row.quantity)) }}
          </template>
        </el-table-column>
        <el-table-column prop="trade_amount" label="金额" width="130" align="right">
          <template #default="{ row }">
            {{ formatThousand(Number(row.trade_amount || 0).toFixed(2)) }}
          </template>
        </el-table-column>
        <el-table-column prop="trade_status" label="当前状态" width="110" align="center">
          <template #default="{ row }">
            <el-tooltip :content="getStatusTooltip(row.trade_status)" placement="top" :show-after="300">
              <el-tag
                :type="getStatusColor(row.trade_status)"
                effect="light"
                size="small"
                class="status-tag"
              >
                {{ getStatusLabel(row.trade_status) }}
              </el-tag>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="frozen_amount" label="冻结金额" width="110" align="right">
          <template #default="{ row }">
            <span v-if="Number(row.frozen_amount || 0) > 0" class="frozen-text">
              {{ formatThousand(Number(row.frozen_amount).toFixed(2)) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="委托时间" width="170">
          <template #default="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="showChangeDialog(row)" class="action-btn">变更状态</el-button>
            <el-button type="info" link @click="showValidateDialog(row)" class="action-btn">校验</el-button>
            <el-button type="success" link @click="showTraceDialog(row)" class="action-btn">溯源</el-button>
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

    <el-dialog v-model="changeDialogVisible" title="手动变更订单状态" width="520px" destroy-on-close class="change-dialog">
      <div v-if="currentOrder" class="change-form">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="委托单号">{{ currentOrder.trade_no }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusColor(currentOrder.trade_status)" size="small">
              {{ getStatusLabel(currentOrder.trade_status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="股票">{{ currentOrder.stock_name }}</el-descriptions-item>
          <el-descriptions-item label="方向">
            {{ currentOrder.direction === 'buy' ? '买入' : '卖出' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-form :model="changeForm" label-width="100px" style="margin-top: 16px">
          <el-form-item label="目标状态" required>
            <el-select v-model="changeForm.targetStatus" placeholder="选择目标状态" class="focus-input" @change="handleTargetStatusChange">
              <el-option
                v-for="action in allowedActions"
                :key="action"
                :label="getStatusLabel(action)"
                :value="action"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="变更原因" required>
            <el-input
              v-model="changeForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入变更原因"
              class="focus-input"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div v-if="changeValidation" class="validation-panel">
          <div v-if="changeValidation.errors.length > 0" class="validation-errors">
            <div v-for="(err, idx) in changeValidation.errors" :key="idx" class="error-item">
              <el-icon color="#F56C6C"><CircleCloseFilled /></el-icon>
              {{ err }}
            </div>
          </div>
          <div v-if="changeValidation.warnings.length > 0" class="validation-warnings">
            <div v-for="(warn, idx) in changeValidation.warnings" :key="idx" class="warning-item">
              <el-icon color="#E6A23C"><WarningFilled /></el-icon>
              {{ warn }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="changeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmitChange"
          :loading="changeLoading"
          :disabled="!changeForm.targetStatus || !changeForm.reason || (changeValidation && !changeValidation.valid)"
          class="submit-btn"
        >
          确认变更
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="validateDialogVisible" title="状态操作校验" width="500px" destroy-on-close>
      <div v-if="validateData" class="validate-content">
        <div class="validate-summary" :class="{ valid: validateData.valid, invalid: !validateData.valid }">
          <el-icon :size="28">
            <SuccessFilled v-if="validateData.valid" />
            <CircleCloseFilled v-else />
          </el-icon>
          <span>{{ validateData.valid ? '校验通过，可执行操作' : '校验未通过' }}</span>
        </div>
        <el-descriptions :column="2" border size="small" style="margin-top: 12px">
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusColor(validateData.currentStatus)" size="small">
              {{ getStatusLabel(validateData.currentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="允许操作">
            <span v-if="validateData.allowedActions.length === 0">无（终态）</span>
            <el-tag v-for="a in validateData.allowedActions" :key="a" size="small" style="margin-right: 4px">
              {{ getStatusLabel(a) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="validateData.errors.length > 0" class="validation-errors">
          <div v-for="(err, idx) in validateData.errors" :key="idx" class="error-item">
            <el-icon color="#F56C6C"><CircleCloseFilled /></el-icon>
            {{ err }}
          </div>
        </div>
        <div v-if="validateData.warnings.length > 0" class="validation-warnings">
          <div v-for="(warn, idx) in validateData.warnings" :key="idx" class="warning-item">
            <el-icon color="#E6A23C"><WarningFilled /></el-icon>
            {{ warn }}
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="traceDialogVisible" title="状态变更溯源" width="750px" destroy-on-close class="trace-dialog">
      <div v-if="traceData" class="trace-content">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="委托单号">{{ traceData.tradeNo }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusColor(traceData.currentStatus)" size="small">
              {{ getStatusLabel(traceData.currentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时序校验">
            <el-tag :type="traceData.sequenceValid ? 'success' : 'danger'" size="small">
              {{ traceData.sequenceValid ? '合法' : '异常' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="traceData.sequenceErrors.length > 0" class="sequence-errors">
          <el-alert
            v-for="(err, idx) in traceData.sequenceErrors"
            :key="idx"
            :title="err"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
        </div>

        <div class="trace-data-summary">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="资金总变动">{{ formatThousand(traceData.dataSummary.totalFundChange.toFixed(2)) }}</el-descriptions-item>
            <el-descriptions-item label="持仓总变动">{{ traceData.dataSummary.totalHoldingChange }}</el-descriptions-item>
            <el-descriptions-item label="数据一致性">
              <el-tag :type="traceData.dataSummary.allConsistent ? 'success' : 'danger'" size="small">
                {{ traceData.dataSummary.allConsistent ? '一致' : '存在偏差' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="trace-timeline">
          <h4>状态变更记录</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(record, idx) in traceData.records"
              :key="idx"
              :type="record.changeType === 'system' ? 'primary' : 'warning'"
              :timestamp="formatDateTime(record.createdAt)"
              placement="top"
            >
              <el-tooltip placement="right" :show-after="200">
                <template #content>
                  <div class="trace-tooltip">
                    <p>操作人：{{ record.operatorName }}</p>
                    <p>变更类型：{{ record.changeType === 'system' ? '系统自动' : '人工手动' }}</p>
                    <p>原因：{{ record.reason || '-' }}</p>
                    <p>资金变动：{{ formatThousand(record.fundDiff.toFixed(2)) }}</p>
                    <p>持仓变动：{{ record.holdingDiff }}</p>
                    <p>数据一致性：{{ record.dataConsistent ? '一致' : '存在偏差' }}</p>
                  </div>
                </template>
                <div class="trace-record-card">
                  <div class="record-header">
                    <span class="status-flow">
                      <el-tag :type="getStatusColor(record.fromStatus)" size="small" v-if="record.fromStatus">
                        {{ getStatusLabel(record.fromStatus) }}
                      </el-tag>
                      <span v-if="record.fromStatus" class="arrow">→</span>
                      <el-tag :type="getStatusColor(record.toStatus)" size="small">
                        {{ getStatusLabel(record.toStatus) }}
                      </el-tag>
                    </span>
                    <el-tag
                      :type="record.changeType === 'system' ? 'primary' : 'warning'"
                      size="small"
                      effect="plain"
                    >
                      {{ record.changeType === 'system' ? '系统' : '人工' }}
                    </el-tag>
                  </div>
                  <div class="record-detail">
                    <span>操作人：{{ record.operatorName }}</span>
                    <span v-if="record.fundDiff !== 0">资金变动：{{ formatThousand(record.fundDiff.toFixed(2)) }}</span>
                    <span v-if="record.holdingDiff !== 0">持仓变动：{{ record.holdingDiff }}</span>
                    <el-tag :type="record.dataConsistent ? 'success' : 'danger'" size="small" effect="plain">
                      {{ record.dataConsistent ? '数据一致' : '数据偏差' }}
                    </el-tag>
                  </div>
                </div>
              </el-tooltip>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量变更状态" width="600px" destroy-on-close class="batch-dialog">
      <div class="batch-form">
        <el-alert
          :title="`已选择 ${selectedIds.length} 笔订单`"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />

        <el-form :model="batchForm" label-width="100px">
          <el-form-item label="目标状态" required>
            <el-select v-model="batchForm.targetStatus" placeholder="选择目标状态" class="focus-input">
              <el-option label="待撮合" value="pending" />
              <el-option label="已成交" value="dealed" />
              <el-option label="部分成交" value="partial_dealed" />
              <el-option label="已撤单" value="cancelled" />
              <el-option label="撮合失败" value="failed" />
            </el-select>
          </el-form-item>
          <el-form-item label="变更原因" required>
            <el-input v-model="batchForm.reason" type="textarea" :rows="3" placeholder="请输入批量变更原因" class="focus-input" maxlength="200" show-word-limit />
          </el-form-item>

          <el-divider content-position="left">差异化筛选（可选）</el-divider>

          <el-form-item label="风险等级">
            <el-select v-model="batchForm.filters.riskLevel" placeholder="不限" clearable class="focus-input">
              <el-option label="R1-保守型" value="R1" />
              <el-option label="R2-稳健型" value="R2" />
              <el-option label="R3-平衡型" value="R3" />
              <el-option label="R4-进取型" value="R4" />
              <el-option label="R5-激进型" value="R5" />
            </el-select>
          </el-form-item>
          <el-form-item label="金额范围">
            <div style="display: flex; gap: 8px; align-items: center">
              <el-input-number v-model="batchForm.filters.minAmount" :min="0" placeholder="最低" class="focus-input" />
              <span>-</span>
              <el-input-number v-model="batchForm.filters.maxAmount" :min="0" placeholder="最高" class="focus-input" />
            </div>
          </el-form-item>
          <el-form-item label="委托时间">
            <el-date-picker
              v-model="batchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              class="focus-input"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleBatchChange"
          :loading="batchLoading"
          :disabled="!batchForm.targetStatus || !batchForm.reason"
          class="submit-btn"
        >
          确认批量变更
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resultDialogVisible" title="操作结果" width="500px" destroy-on-close>
      <div v-if="batchResult" class="result-content">
        <el-result
          :icon="batchResult.failedCount === 0 ? 'success' : 'warning'"
          :title="`成功 ${batchResult.successCount} 笔，失败 ${batchResult.failedCount} 笔`"
        />
        <el-descriptions :column="1" border size="small" style="margin-top: 16px">
          <el-descriptions-item label="总数">{{ batchResult.total }}</el-descriptions-item>
          <el-descriptions-item label="成功">{{ batchResult.successCount }}</el-descriptions-item>
          <el-descriptions-item label="失败">{{ batchResult.failedCount }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="batchResult.results.filter(r => !r.success).length > 0" class="failed-list">
          <h4>失败详情</h4>
          <div v-for="(r, idx) in batchResult.results.filter(r => !r.success)" :key="idx" class="failed-item">
            订单#{{ r.tradeId }}：{{ r.message }}
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, CircleCloseFilled, WarningFilled, SuccessFilled } from '@element-plus/icons-vue'
import FinButton from '@/components/common/FinButton.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatDateTime } from '@/utils/format'
import * as tradeApi from '@/api/trade'
import type { ITrade } from '@/types/api'
import type { IStatusValidation, IStatusChangeResult, IStatusTraceInfo, IBatchStatusChangeResult } from '@/api/trade'

const { hasPerm } = usePermission()

const loading = ref(false)
const changeLoading = ref(false)
const batchLoading = ref(false)
const orderList = ref<ITrade[]>([])
const selectedIds = ref<number[]>([])
const activeTab = ref('all')
const searchKeyword = ref('')

const changeDialogVisible = ref(false)
const validateDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const resultDialogVisible = ref(false)

const currentOrder = ref<ITrade | null>(null)
const allowedActions = ref<string[]>([])
const validateData = ref<IStatusValidation | null>(null)
const traceData = ref<IStatusTraceInfo | null>(null)
const batchResult = ref<IBatchStatusChangeResult | null>(null)

const changeForm = reactive({
  targetStatus: '',
  reason: '',
})
const changeValidation = ref<IStatusValidation | null>(null)

const batchForm = reactive({
  targetStatus: '',
  reason: '',
  filters: {
    riskLevel: '',
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
  },
  dateRange: null as [string, string] | null,
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
})

const tableRef = ref()

function formatThousand(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  const parts = num.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

const STATUS_MAP: Record<string, string> = {
  pending: '待撮合',
  success: '待撮合',
  approved: '待撮合',
  auditing: '审核中',
  partial_dealed: '部分成交',
  dealed: '已成交',
  cancelled: '已撤单',
  failed: '撮合失败',
  rejected: '已驳回',
  paused: '已暂停',
}

const STATUS_COLOR_MAP: Record<string, string> = {
  pending: 'warning',
  success: 'warning',
  approved: 'warning',
  auditing: 'primary',
  partial_dealed: 'primary',
  dealed: 'success',
  cancelled: 'info',
  failed: 'danger',
  rejected: 'danger',
  paused: 'info',
}

const STATUS_TOOLTIP_MAP: Record<string, string> = {
  pending: '等待撮合执行',
  success: '委托成功，等待撮合',
  approved: '审核通过，等待撮合',
  auditing: '正在审核中',
  partial_dealed: '部分数量已成交，剩余待撮合',
  dealed: '全部数量已成交',
  cancelled: '订单已撤销',
  failed: '撮合执行失败',
  rejected: '审核已驳回',
  paused: '撮合已暂停',
}

function getStatusLabel(status: string): string {
  return STATUS_MAP[status] || status
}

function getStatusColor(status: string): string {
  return STATUS_COLOR_MAP[status] || 'info'
}

function getStatusTooltip(status: string): string {
  return STATUS_TOOLTIP_MAP[status] || status
}

function getRowClassName({ row }: { row: ITrade }): string {
  if (row.trade_status === 'partial_dealed') return 'row-partial'
  if (row.trade_status === 'dealed') return 'row-dealed'
  if (row.trade_status === 'cancelled') return 'row-cancelled'
  if (row.trade_status === 'failed') return 'row-failed'
  return ''
}

function handleSelectionChange(selection: ITrade[]) {
  selectedIds.value = selection.map(s => s.id)
}

async function fetchOrders() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (activeTab.value !== 'all') {
      params.status = activeTab.value
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    const res = await tradeApi.getTradeList(params)
    if (res.code === 0) {
      orderList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  pagination.page = 1
  selectedIds.value = []
  fetchOrders()
}

async function showChangeDialog(row: ITrade) {
  currentOrder.value = row
  changeForm.targetStatus = ''
  changeForm.reason = ''
  changeValidation.value = null
  allowedActions.value = []
  changeDialogVisible.value = true

  const statusActions: Record<string, string[]> = {
    pending: ['success', 'auditing', 'cancelled', 'failed'],
    success: ['dealed', 'cancelled', 'failed', 'partial_dealed'],
    approved: ['dealed', 'cancelled', 'failed', 'partial_dealed'],
    auditing: ['success', 'rejected', 'cancelled'],
    partial_dealed: ['dealed', 'failed'],
    paused: ['pending', 'cancelled'],
  }
  allowedActions.value = statusActions[row.trade_status] || []
}

async function handleTargetStatusChange(val: string) {
  if (!currentOrder.value || !val) return
  try {
    const res = await tradeApi.validateStatusOperation(currentOrder.value.id, val)
    if (res.code === 0) {
      changeValidation.value = res.data
    }
  } catch { /* ignore */ }
}

async function handleSubmitChange() {
  if (!currentOrder.value || !changeForm.targetStatus || !changeForm.reason) return

  try {
    await ElMessageBox.confirm(
      `确认将订单 ${currentOrder.value.trade_no} 的状态从 ${getStatusLabel(currentOrder.value.trade_status)} 变更为 ${getStatusLabel(changeForm.targetStatus)}？`,
      '状态变更确认',
      { type: 'warning' },
    )
  } catch {
    return
  }

  changeLoading.value = true
  try {
    const res = await tradeApi.manualChangeStatus({
      id: currentOrder.value.id,
      targetStatus: changeForm.targetStatus,
      reason: changeForm.reason,
    })
    if (res.code === 0 && res.data.success) {
      ElMessage.success(res.data.message)
      changeDialogVisible.value = false
      fetchOrders()
    } else {
      ElMessage.error(res.data?.message || '状态变更失败')
    }
  } catch {
    ElMessage.error('状态变更请求失败')
  } finally {
    changeLoading.value = false
  }
}

async function showValidateDialog(row: ITrade) {
  try {
    const res = await tradeApi.validateStatusOperation(row.trade_status, row.trade_status)
    if (res.code === 0) {
      validateData.value = res.data
      validateDialogVisible.value = true
    }
  } catch {
    ElMessage.error('校验请求失败')
  }
}

async function showTraceDialog(row: ITrade) {
  try {
    const res = await tradeApi.getStatusTrace(row.id)
    if (res.code === 0) {
      traceData.value = res.data
      traceDialogVisible.value = true
    }
  } catch {
    ElMessage.error('获取溯源信息失败')
  }
}

function showBatchDialog() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要变更的订单')
    return
  }
  batchForm.targetStatus = ''
  batchForm.reason = ''
  batchForm.filters.riskLevel = ''
  batchForm.filters.minAmount = undefined
  batchForm.filters.maxAmount = undefined
  batchForm.dateRange = null
  batchDialogVisible.value = true
}

async function handleBatchChange() {
  if (!batchForm.targetStatus || !batchForm.reason) return

  try {
    await ElMessageBox.confirm(
      `确认批量将 ${selectedIds.value.length} 笔订单变更为 ${getStatusLabel(batchForm.targetStatus)}？此操作不可撤销！`,
      '批量变更确认',
      { type: 'warning' },
    )
  } catch {
    return
  }

  batchLoading.value = true
  try {
    const filters: any = {}
    if (batchForm.filters.riskLevel) filters.riskLevel = batchForm.filters.riskLevel
    if (batchForm.filters.minAmount !== undefined) filters.minAmount = batchForm.filters.minAmount
    if (batchForm.filters.maxAmount !== undefined) filters.maxAmount = batchForm.filters.maxAmount
    if (batchForm.dateRange && batchForm.dateRange.length === 2) {
      filters.startDate = batchForm.dateRange[0]
      filters.endDate = batchForm.dateRange[1]
    }

    const res = await tradeApi.batchChangeStatus({
      ids: selectedIds.value,
      targetStatus: batchForm.targetStatus,
      reason: batchForm.reason,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
    })
    if (res.code === 0) {
      batchResult.value = res.data
      batchDialogVisible.value = false
      resultDialogVisible.value = true
      fetchOrders()
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('批量变更请求失败')
  } finally {
    batchLoading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})
</script>

<style lang="scss" scoped>
.status-control-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }

  .search-input {
    width: 260px;
  }
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;

  .filter-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.table-wrap {
  :deep(.row-partial) {
    background-color: #ecf5ff !important;
  }
  :deep(.row-dealed) {
    background-color: #f0f9eb !important;
  }
  :deep(.row-cancelled) {
    background-color: #f4f4f5 !important;
  }
  :deep(.row-failed) {
    background-color: #fef0f0 !important;
  }

  .status-tag {
    transition: all 0.3s ease;
  }

  .frozen-text {
    color: #e6a23c;
    font-weight: 500;
  }

  .action-btn {
    transition: all 0.2s ease;

    &:active {
      transform: translateY(1px);
      opacity: 0.8;
    }
  }
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.change-form,
.batch-form {
  .validation-panel {
    margin-top: 12px;
  }

  .validation-errors .error-item,
  .validation-warnings .warning-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    font-size: 13px;
  }

  .validation-errors .error-item {
    color: #f56c6c;
  }

  .validation-warnings .warning-item {
    color: #e6a23c;
  }
}

.focus-input {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus-within {
      border-color: #409eff;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
    }
  }
}

.submit-btn {
  transition: all 0.2s ease;

  &:active {
    transform: translateY(2px);
    filter: brightness(0.9);
  }
}

.validate-content {
  .validate-summary {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    border-radius: 8px;
    font-size: 15px;
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

  .validation-errors .error-item,
  .validation-warnings .warning-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 0;
    font-size: 13px;
  }

  .validation-errors .error-item { color: #f56c6c; }
  .validation-warnings .warning-item { color: #e6a23c; }
}

.trace-content {
  .sequence-errors {
    margin-top: 12px;
  }

  .trace-data-summary {
    margin-top: 12px;
  }

  .trace-timeline {
    margin-top: 16px;

    h4 {
      margin: 0 0 12px;
      font-size: 14px;
    }

    .trace-record-card {
      padding: 10px 12px;
      border: 1px solid #ebeef5;
      border-radius: 6px;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;

      &:hover {
        border-color: #409eff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.12);
      }

      .record-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;

        .status-flow {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .arrow {
          font-size: 14px;
          color: #909399;
        }
      }

      .record-detail {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        font-size: 12px;
        color: #606266;
      }
    }
  }
}

.trace-tooltip {
  p {
    margin: 2px 0;
    font-size: 12px;
  }
}

.result-content {
  .failed-list {
    margin-top: 12px;

    h4 {
      margin: 0 0 8px;
      font-size: 13px;
    }

    .failed-item {
      padding: 6px 0;
      font-size: 12px;
      color: #f56c6c;
    }
  }
}
</style>
