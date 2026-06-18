<template>
  <div class="settlement-container slide-enter-active">
    <div class="page-header">
      <div class="header-left">
        <el-button link type="primary" class="back-btn" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2 class="page-title">
          <el-icon><CreditCard /></el-icon>
          司机收益结算管控
        </h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="ruleDialogVisible = true" class="ripple-btn">
          <el-icon><SetUp /></el-icon>
          规则配置
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeStatus" type="card" class="status-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="all">
        <span class="badge">{{ statistics.total || 0 }}</span>
      </el-tab-pane>
      <el-tab-pane label="待结算" name="1">
        <span class="badge warn">{{ statistics.pending || 0 }}</span>
      </el-tab-pane>
      <el-tab-pane label="结算中" name="2">
        <span class="badge primary">{{ statistics.processing || 0 }}</span>
      </el-tab-pane>
      <el-tab-pane label="已结算" name="3">
        <span class="badge success">{{ statistics.settled || 0 }}</span>
      </el-tab-pane>
      <el-tab-pane label="已入账" name="4">
        <span class="badge ok">{{ statistics.posted || 0 }}</span>
      </el-tab-pane>
      <el-tab-pane label="结算异常" name="5">
        <span class="badge danger pulse-tag">{{ statistics.abnormal || 0 }}</span>
      </el-tab-pane>
      <el-tab-pane label="已驳回" name="6">
        <span class="badge info">{{ statistics.rejected || 0 }}</span>
      </el-tab-pane>
    </el-tabs>

    <div class="statistics-bar">
      <div class="stat-card income">
        <div class="stat-icon"><el-icon><Money /></el-icon></div>
        <div class="stat-info">
          <div class="stat-label">司机总收益</div>
          <div class="stat-value">¥{{ (statistics.totalIncome || 0).toLocaleString() }}</div>
        </div>
      </div>
      <div class="stat-card subsidy">
        <div class="stat-icon"><el-icon><Present /></el-icon></div>
        <div class="stat-info">
          <div class="stat-label">补贴合计</div>
          <div class="stat-value">¥{{ (statistics.totalSubsidy || 0).toLocaleString() }}</div>
        </div>
      </div>
      <div class="stat-card commission">
        <div class="stat-icon"><el-icon><Coin /></el-icon></div>
        <div class="stat-info">
          <div class="stat-label">平台佣金</div>
          <div class="stat-value">¥{{ (statistics.totalCommission || 0).toLocaleString() }}</div>
        </div>
      </div>
      <div class="stat-card today">
        <div class="stat-icon"><el-icon><Calendar /></el-icon></div>
        <div class="stat-info">
          <div class="stat-label">今日新增结算</div>
          <div class="stat-value">{{ statistics.todayCreated || 0 }}单</div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-left">
        <el-input
          v-model="query.driverName"
          placeholder="搜索司机姓名/手机号"
          clearable
          style="width: 240px"
          @keyup.enter="fetchList"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select
          v-model="query.driverLevel"
          placeholder="司机等级"
          clearable
          style="width: 140px"
        >
          <el-option label="优质司机" :value="1" />
          <el-option label="普通司机" :value="2" />
          <el-option label="待整改" :value="3" />
          <el-option label="劣质司机" :value="4" />
        </el-select>
        <el-select
          v-model="query.isAbnormal"
          placeholder="异常筛选"
          clearable
          style="width: 140px"
        >
          <el-option label="仅异常" :value="1" />
          <el-option label="仅正常" :value="0" />
        </el-select>
        <el-date-picker
          v-model="periodRange"
          type="daterange"
          range-separator="至"
          start-placeholder="结算开始"
          end-placeholder="结算结束"
          value-format="YYYY-MM-DD"
          style="width: 300px"
        />
      </div>
      <div class="filter-right">
        <el-button @click="resetFilter">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="primary" @click="fetchList" class="ripple-btn">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>
    </div>

    <div class="batch-toolbar">
      <div class="selected-info">
        <el-icon><Pointer /></el-icon>
        <span>已选择 <strong>{{ selectedIds.length }}</strong> 条记录</span>
        <el-button link size="small" @click="clearSelection" v-if="selectedIds.length">
          清空选择
        </el-button>
      </div>
      <div class="batch-btns">
        <el-tooltip content="批量发起结算（仅待结算）">
          <el-button
            type="warning"
            :disabled="!canBatchInitiate"
            @click="handleBatchInitiate"
            :loading="batchLoading.initiate"
            class="ripple-btn"
          >
            <el-icon><Promotion /></el-icon>
            批量发起结算
          </el-button>
        </el-tooltip>
        <el-tooltip content="批量复核通过（仅结算中）">
          <el-button
            type="success"
            :disabled="!canBatchAudit"
            @click="handleBatchAudit(true)"
            :loading="batchLoading.audit"
            class="ripple-btn"
          >
            <el-icon><CircleCheckFilled /></el-icon>
            批量复核通过
          </el-button>
        </el-tooltip>
        <el-tooltip content="批量驳回违规结算（结算中/待结算）">
          <el-button
            type="danger"
            :disabled="!canBatchReject"
            @click="handleBatchAudit(false)"
            :loading="batchLoading.reject"
            class="ripple-btn"
          >
            <el-icon><CircleCloseFilled /></el-icon>
            批量驳回
          </el-button>
        </el-tooltip>
      </div>
    </div>

    <div class="table-card">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        stripe
        @selection-change="handleSelectionChange"
        :row-class-name="rowClassName"
      >
        <el-table-column type="selection" width="48" :selectable="selectable" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="结算单号" min-width="180">
          <template #default="{ row }">
            <div class="settlement-no">
              <el-icon><Document /></el-icon>
              <span>{{ row.settlementNo }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="司机信息" min-width="200">
          <template #default="{ row }">
            <div class="driver-info">
              <div class="driver-name">{{ row.driver?.name || '--' }}</div>
              <div class="driver-sub">
                {{ row.driver?.phone || '--' }} · {{ row.driver?.city || '--' }}
                <el-tag
                  v-if="row.driver?.driverLevel"
                  :type="DriverLevelTagMap[row.driver.driverLevel]"
                  size="small"
                  effect="light"
                >
                  {{ DriverLevelMap[row.driver.driverLevel] }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="周期" width="200">
          <template #default="{ row }">
            <div class="period">
              {{ row.periodStart?.slice(0, 10) }} ~ {{ row.periodEnd?.slice(0, 10) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="订单数" width="80" align="center" prop="totalOrders" />
        <el-table-column label="订单金额" width="110" align="right">
          <template #default="{ row }">¥{{ (row.totalOrderAmount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="司机收益" width="120" align="right">
          <template #default="{ row }">
            <span class="income-amount">¥{{ (row.totalIncome || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="补贴" width="100" align="right">
          <template #default="{ row }">
            <span class="subsidy-amount" v-if="row.totalSubsidy">
              +¥{{ (row.totalSubsidy || 0).toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="实际结算" width="120" align="right">
          <template #default="{ row }">
            <span class="final-amount">¥{{ (row.actualSettleAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag
                :type="SettlementStatusTypeMap[row.settleStatus]"
                effect="dark"
                :class="{ 'pulse-tag': row.isAbnormal }"
              >
                {{ SettlementStatusMap[row.settleStatus] }}
              </el-tag>
              <el-tag
                v-if="row.isPosted"
                type="success"
                effect="light"
                size="small"
                class="lock-tag"
              >
                <el-icon><Lock /></el-icon>
                已入账
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="异常标记" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              v-if="row.isAbnormal"
              type="danger"
              effect="dark"
              size="small"
              class="abnormal-tag pulse-tag"
            >
              {{ AbnormalTypeMap[row.abnormalType || ''] || '异常' }}
            </el-tag>
            <el-tag v-else type="success" effect="light" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleViewTrace(row)"
            >
              <el-icon><DataAnalysis /></el-icon>
              溯源
            </el-button>
            <el-button
              v-if="row.settleStatus === SettlementStatus.PENDING && !row.isPosted"
              type="warning"
              link
              size="small"
              @click="handleInitiate(row)"
            >
              发起结算
            </el-button>
            <el-button
              v-if="row.settleStatus === SettlementStatus.PROCESSING && !row.isPosted"
              type="success"
              link
              size="small"
              @click="handleAudit(row, true)"
            >
              审核通过
            </el-button>
            <el-button
              v-if="[SettlementStatus.PENDING, SettlementStatus.PROCESSING].includes(row.settleStatus) && !row.isPosted"
              type="danger"
              link
              size="small"
              @click="handleAudit(row, false)"
            >
              驳回
            </el-button>
            <el-button
              v-if="row.settleStatus === SettlementStatus.SETTLED && !row.isPosted"
              type="primary"
              link
              size="small"
              @click="handlePost(row)"
            >
              入账
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <SettlementRuleDialog
      v-model="ruleDialogVisible"
      @success="handleRuleSuccess"
    />

    <SettlementTraceDetail
      v-model="traceVisible"
      :recordId="currentRecordId"
      :settlementNo="currentSettlementNo"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  CreditCard,
  SetUp,
  Money,
  Present,
  Coin,
  Calendar,
  Search,
  Refresh,
  Pointer,
  Promotion,
  CircleCheckFilled,
  CircleCloseFilled,
  Document,
  Lock,
  DataAnalysis
} from '@element-plus/icons-vue'
import {
  DriverLevelMap,
  DriverLevelTagMap,
  SettlementStatusMap,
  SettlementStatusTypeMap,
  SettlementStatus,
  AbnormalTypeMap
} from '@/enums/driver'
import {
  getSettlementListApi,
  getSettlementStatisticsApi,
  initiateSettlementApi,
  auditSettlementApi,
  postSettlementApi,
  batchInitiateSettlementApi,
  batchAuditSettlementApi,
  batchRejectSettlementApi
} from '@/api/settlement'
import type { SettlementRecord, SettlementStatistics, SettlementQueryParams } from '@/types/driver'
import SettlementRuleDialog from '@/components/SettlementRuleDialog/index.vue'
import SettlementTraceDetail from '@/components/SettlementTraceDetail/index.vue'

const router = useRouter()

const loading = ref(false)
const tableData = ref<SettlementRecord[]>([])
const total = ref(0)
const statistics = ref<SettlementStatistics>({
  total: 0,
  pending: 0,
  processing: 0,
  settled: 0,
  posted: 0,
  abnormal: 0,
  rejected: 0,
  totalIncome: 0,
  totalSubsidy: 0,
  totalCommission: 0,
  levelDistribution: {},
  cityDistribution: {},
  todayCreated: 0,
  todaySettled: 0
})

const activeStatus = ref('all')
const periodRange = ref<string[]>([])
const selectedIds = ref<number[]>([])
const selectedRows = ref<SettlementRecord[]>([])

const query = reactive<SettlementQueryParams>({
  page: 1,
  pageSize: 20,
  driverName: undefined,
  settleStatus: undefined,
  driverLevel: undefined,
  isAbnormal: undefined,
  periodStart: undefined,
  periodEnd: undefined
})

const batchLoading = reactive({
  initiate: false,
  audit: false,
  reject: false
})

const ruleDialogVisible = ref(false)
const traceVisible = ref(false)
const currentRecordId = ref<number | null>(null)
const currentSettlementNo = ref('')

const canBatchInitiate = computed(() => {
  return selectedRows.value.some(r => r.settleStatus === SettlementStatus.PENDING && !r.isPosted)
})

const canBatchAudit = computed(() => {
  return selectedRows.value.some(r => r.settleStatus === SettlementStatus.PROCESSING && !r.isPosted)
})

const canBatchReject = computed(() => {
  return selectedRows.value.some(r =>
    [SettlementStatus.PENDING, SettlementStatus.PROCESSING].includes(r.settleStatus) && !r.isPosted
  )
})

const goBack = () => {
  router.push({ path: '/driver' })
}

const fetchStatistics = async () => {
  try {
    const res = await getSettlementStatisticsApi()
    statistics.value = res.data
  } catch (e) {}
}

const fetchList = async () => {
  loading.value = true
  try {
    if (periodRange.value?.length === 2) {
      query.periodStart = periodRange.value[0]
      query.periodEnd = periodRange.value[1]
    }
    const res = await getSettlementListApi(query)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '查询失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  Object.assign(query, {
    page: 1,
    driverName: undefined,
    driverLevel: undefined,
    isAbnormal: undefined,
    periodStart: undefined,
    periodEnd: undefined
  })
  periodRange.value = []
  fetchList()
}

const handleTabChange = (name: string) => {
  query.page = 1
  query.settleStatus = name === 'all' ? undefined : Number(name)
  fetchList()
  clearSelection()
}

const handleSelectionChange = (rows: SettlementRecord[]) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

const clearSelection = () => {
  selectedRows.value = []
  selectedIds.value = []
}

const selectable = (row: SettlementRecord) => {
  return row.isPosted !== 1
}

const rowClassName = ({ row }: { row: SettlementRecord }) => {
  if (row.isPosted === 1) return 'is-posted-row'
  if (row.isAbnormal === 1) return 'is-abnormal-row'
  return ''
}

const handleViewTrace = (row: SettlementRecord) => {
  currentRecordId.value = row.id
  currentSettlementNo.value = row.settlementNo
  traceVisible.value = true
}

const handleInitiate = async (row: SettlementRecord) => {
  try {
    await ElMessageBox.confirm(`确认发起结算单 ${row.settlementNo}？`, '确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await initiateSettlementApi(row.id)
    ElMessage.success('发起结算成功')
    fetchList()
    fetchStatistics()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleAudit = async (row: SettlementRecord, passed: boolean) => {
  let rejectReason = ''
  if (!passed) {
    try {
      const { value } = await ElMessageBox.prompt('请输入驳回理由', '驳回结算', {
        confirmButtonText: '确定驳回',
        cancelButtonText: '取消',
        inputValidator: v => !!v || '请输入驳回理由'
      })
      rejectReason = value as string
    } catch {
      return
    }
  } else {
    try {
      await ElMessageBox.confirm(`确认审核通过结算单 ${row.settlementNo}？`, '确认', {
        type: 'success'
      })
    } catch {
      return
    }
  }
  try {
    await auditSettlementApi(row.id, passed, rejectReason)
    ElMessage.success(passed ? '审核通过成功' : '驳回成功')
    fetchList()
    fetchStatistics()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handlePost = async (row: SettlementRecord) => {
  try {
    await ElMessageBox.confirm(
      `入账后数据将不可修改，确认将结算单 ${row.settlementNo} 入账？`,
      '入账确认',
      { type: 'warning' }
    )
  } catch {
    return
  }
  try {
    await postSettlementApi(row.id)
    ElMessage.success('入账成功')
    fetchList()
    fetchStatistics()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleBatchInitiate = async () => {
  const ids = selectedRows.value
    .filter(r => r.settleStatus === SettlementStatus.PENDING && !r.isPosted)
    .map(r => r.id)
  if (!ids.length) {
    ElMessage.warning('无可发起结算的记录')
    return
  }
  try {
    await ElMessageBox.confirm(`确认批量发起 ${ids.length} 条结算？`, '批量确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  batchLoading.initiate = true
  try {
    const res = await batchInitiateSettlementApi(ids)
    ElMessage.success(`成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    fetchList()
    fetchStatistics()
    clearSelection()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    batchLoading.initiate = false
  }
}

const handleBatchAudit = async (passed: boolean) => {
  let ids: number[]
  if (passed) {
    ids = selectedRows.value
      .filter(r => r.settleStatus === SettlementStatus.PROCESSING && !r.isPosted)
      .map(r => r.id)
  } else {
    ids = selectedRows.value
      .filter(r =>
        [SettlementStatus.PENDING, SettlementStatus.PROCESSING].includes(r.settleStatus) && !r.isPosted
      )
      .map(r => r.id)
  }
  if (!ids.length) {
    ElMessage.warning(passed ? '无可审核通过的记录' : '无可驳回的记录')
    return
  }
  let rejectReason = ''
  if (!passed) {
    try {
      const { value } = await ElMessageBox.prompt(
        `请输入批量驳回理由（将驳回 ${ids.length} 条记录）`,
        '批量驳回',
        {
          confirmButtonText: '确定驳回',
          cancelButtonText: '取消',
          inputValidator: v => !!v || '请输入驳回理由'
        }
      )
      rejectReason = value as string
    } catch {
      return
    }
  } else {
    try {
      await ElMessageBox.confirm(`确认批量审核通过 ${ids.length} 条结算？`, '批量确认', {
        type: 'success'
      })
    } catch {
      return
    }
  }
  if (passed) {
    batchLoading.audit = true
  } else {
    batchLoading.reject = true
  }
  try {
    const res = passed
      ? await batchAuditSettlementApi(ids, true)
      : await batchRejectSettlementApi(ids, rejectReason)
    ElMessage.success(`成功 ${res.data.successCount} 条，失败 ${res.data.failCount} 条`)
    fetchList()
    fetchStatistics()
    clearSelection()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    batchLoading.audit = false
    batchLoading.reject = false
  }
}

const handleRuleSuccess = () => {
  fetchStatistics()
}

onMounted(() => {
  fetchStatistics()
  fetchList()
})
</script>

<style scoped>
.settlement-container {
  padding: 20px;
  min-height: 100vh;
  background: #f5f7fa;
}

.slide-enter-active {
  animation: slideInLeft 0.5s ease;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  font-size: 14px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-title .el-icon {
  color: #4f46e5;
}

.status-tabs {
  margin-bottom: 16px;
}

.badge {
  margin-left: 6px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.badge.warn {
  background: #fef3c7;
  color: #92400e;
}

.badge.primary {
  background: #dbeafe;
  color: #1e40af;
}

.badge.success {
  background: #d1fae5;
  color: #065f46;
}

.badge.ok {
  background: #ccfbf1;
  color: #0f766e;
}

.badge.danger {
  background: #fee2e2;
  color: #991b1b;
}

.badge.info {
  background: #f1f5f9;
  color: #475569;
}

.pulse-tag {
  animation: pulse-danger 2s infinite;
}

@keyframes pulse-danger {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
  }
}

.statistics-bar {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-card.income {
  border-left: 4px solid #6366f1;
}
.stat-card.income .stat-icon {
  background: #eef2ff;
  color: #4f46e5;
}

.stat-card.subsidy {
  border-left: 4px solid #14b8a6;
}
.stat-card.subsidy .stat-icon {
  background: #ccfbf1;
  color: #0d9488;
}

.stat-card.commission {
  border-left: 4px solid #f59e0b;
}
.stat-card.commission .stat-icon {
  background: #fef3c7;
  color: #d97706;
}

.stat-card.today {
  border-left: 4px solid #8b5cf6;
}
.stat-card.today .stat-icon {
  background: #ede9fe;
  color: #7c3aed;
}

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}

.stat-info .stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 6px;
}

.stat-info .stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  font-family: 'Courier New', monospace;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}

.filter-left {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-right {
  display: flex;
  gap: 8px;
}

.batch-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #fcd34d;
  border-radius: 8px;
  margin-bottom: 12px;
}

.selected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #92400e;
  font-size: 14px;
}

.selected-info strong {
  color: #d97706;
  font-size: 16px;
  margin: 0 2px;
}

.batch-btns {
  display: flex;
  gap: 10px;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.ripple-btn:active::after {
  width: 300px;
  height: 300px;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

:deep(.el-table) {
  --el-table-tr-bg-color: #fff;
}

:deep(.is-posted-row) {
  background: #f8fafc !important;
}

:deep(.is-posted-row td) {
  color: #94a3b8 !important;
}

:deep(.is-posted-row .cell .final-amount) {
  color: #0f766e !important;
}

:deep(.is-abnormal-row) {
  background: #fef2f2 !important;
}

:deep(.is-abnormal-row:hover > td) {
  background: #fee2e2 !important;
}

.settlement-no {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #4f46e5;
}

.driver-info .driver-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.driver-info .driver-sub {
  font-size: 12px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 6px;
}

.period {
  font-size: 12px;
  color: #475569;
  font-family: 'Courier New', monospace;
}

.income-amount {
  color: #0891b2;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.subsidy-amount {
  color: #059669;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.final-amount {
  color: #d97706;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  font-size: 13px;
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.lock-tag {
  border: 1px solid #10b981;
}

.abnormal-tag {
  animation: pulse-danger 2s infinite;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
