<template>
  <div class="member-order-page">
    <div class="page-header">
      <h2>会员订单管理</h2>
      <p class="page-desc">管理会员订单查询核验、状态联动、批量处理与全链路溯源</p>
    </div>

    <el-row :gutter="16" class="stats-row">
      <el-col :span="3" v-for="stat in statsCards" :key="stat.key">
        <el-card shadow="hover" class="stat-card" :style="{ borderTop: `3px solid ${stat.color}` }">
          <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="queryForm" class="filter-form">
        <el-form-item label="订单状态">
          <el-select v-model="queryForm.orderStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in Object.values(MEMBER_ORDER_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐类型">
          <el-select v-model="queryForm.packageType" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in Object.values(MEMBER_ORDER_PACKAGE_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="支付渠道">
          <el-select v-model="queryForm.payChannel" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in Object.values(MEMBER_ORDER_PAY_CHANNEL)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="queryForm.keyword" placeholder="订单号/UID" clearable style="width: 160px" class="focus-color-input" />
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker v-model="queryForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 240px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadOrderList" style="border-radius: 8px"><el-icon><Search /></el-icon>查询</el-button>
          <el-button @click="resetQuery" style="border-radius: 8px">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button v-if="selectedIds.length > 0" type="info" @click="handleBatchAction('batch_close')" style="border-radius: 8px">
            <el-icon><CircleClose /></el-icon>批量关闭待支付({{ selectedIds.length }})
          </el-button>
          <el-button v-if="selectedIds.length > 0" type="success" @click="handleBatchAction('batch_verify')" style="border-radius: 8px">
            <el-icon><CircleCheck /></el-icon>批量核验({{ selectedIds.length }})
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip content="溯源查询" placement="top">
            <el-button @click="openTraceDrawer" style="border-radius: 8px"><el-icon><Connection /></el-icon></el-button>
          </el-tooltip>
        </div>
      </div>

      <el-table
        :data="orderList"
        v-loading="loading"
        v-if="!loading"
        @selection-change="handleSelectionChange"
        @header-dragend="onHeaderDragend"
        :row-class-name="tableRowClassName"
        highlight-current-row
        border
        stripe
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="orderNo" label="订单编号" min-width="170" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="primary" @click="openTraceForOrder(row.orderNo)">{{ row.orderNo }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="uid" label="用户UID" min-width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link type="info" @click="openTraceForUid(row.uid)">{{ row.uid }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="packageName" label="套餐" min-width="110" show-overflow-tooltip />
        <el-table-column prop="packageType" label="类型" min-width="90" align="center">
          <template #default="{ row }">
            <el-tag :color="getPackageTypeColor(row.packageType)" effect="dark" size="small" style="border: none">{{ getPackageTypeLabel(row.packageType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payAmount" label="实付金额" min-width="110" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ formatAmount(row.payAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="orderStatus" label="状态" min-width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.orderStatus)" size="small">{{ getStatusLabel(row.orderStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payChannel" label="支付渠道" min-width="100" align="center">
          <template #default="{ row }">
            <span>{{ getPayChannelLabel(row.payChannel) || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="isVerified" label="核验" min-width="70" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.isVerified === 1 && row.orderStatus === 1" style="color: #67C23A; font-size: 18px"><CircleCheck /></el-icon>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="isAbnormal" label="异常" min-width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isAbnormal === 1" :type="row.abnormalResolved === 1 ? 'success' : 'danger'" size="small">{{ row.abnormalResolved === 1 ? '已处理' : '异常' }}</el-tag>
            <span v-else style="color: #909399">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" min-width="110">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.orderStatus === 0" link type="danger" size="small" @click="handleCancel(row)" :loading="row._canceling">取消</el-button>
            <el-button v-if="row.orderStatus === 1 && row.isVerified === 0" link type="success" size="small" @click="handleVerify(row)" :loading="row._verifying">核验</el-button>
            <el-button v-if="row.orderStatus === 1" link type="warning" size="small" @click="openRefundDialog(row)">退款</el-button>
            <el-button v-if="row.isAbnormal === 1 && row.abnormalResolved === 0" link type="primary" size="small" @click="handleResolveAbnormal(row)">处理异常</el-button>
            <el-button v-if="row.orderStatus === 2 || row.isAbnormal === 0" link type="info" size="small" @click="openAppealDialog(row)">申诉</el-button>
            <el-button link type="primary" size="small" @click="openDetailDrawer(row)">详情</el-button>
            <el-button link type="info" size="small" @click="handleCheckConsistency(row)">合规</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="loading" class="skeleton-wrap">
        <el-skeleton :rows="8" animated />
      </div>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadOrderList"
          @current-change="loadOrderList"
        />
      </div>
    </el-card>

    <el-dialog v-model="refundDialogVisible" title="发起退款" width="500px" destroy-on-close class="order-dialog">
      <el-form :model="refundForm" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ refundForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="实付金额">
          <span class="amount-text">¥{{ formatAmount(refundForm.payAmount) }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <el-input-number v-model="refundForm.refundAmount" :min="0.01" :max="Number(refundForm.payAmount)" :precision="2" style="width: 200px" controls-position="right" />
        </el-form-item>
        <el-form-item label="退款原因" required>
          <el-input v-model="refundForm.refundReason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请输入退款原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false" style="border-radius: 8px">取消</el-button>
        <el-button type="danger" :loading="submitLoading" :disabled="!refundForm.refundReason" @click="handleRefund" style="border-radius: 8px">确认退款</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="appealDialogVisible" title="异常申诉" width="500px" destroy-on-close class="order-dialog">
      <el-form :model="appealForm" label-width="100px">
        <el-form-item label="订单编号">
          <span>{{ appealForm.orderNo }}</span>
        </el-form-item>
        <el-form-item label="申诉原因" required>
          <el-input v-model="appealForm.appealReason" type="textarea" :rows="3" maxlength="500" show-word-limit placeholder="请描述异常情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogVisible = false" style="border-radius: 8px">取消</el-button>
        <el-button type="warning" :loading="submitLoading" :disabled="!appealForm.appealReason" @click="handleAppeal" style="border-radius: 8px">提交申诉</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="detailDrawerVisible" title="订单详情" size="620px" direction="rtl" destroy-on-close>
      <div v-if="currentOrder" v-loading="detailLoading">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 20px">
          <el-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户UID">{{ currentOrder.uid }}</el-descriptions-item>
          <el-descriptions-item label="套餐名称">{{ currentOrder.packageName }}</el-descriptions-item>
          <el-descriptions-item label="套餐类型">{{ getPackageTypeLabel(currentOrder.packageType) }}</el-descriptions-item>
          <el-descriptions-item label="原始金额">¥{{ formatAmount(currentOrder.originalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="优惠金额">¥{{ formatAmount(currentOrder.discountAmount) }}</el-descriptions-item>
          <el-descriptions-item label="实付金额"><span class="amount-text">¥{{ formatAmount(currentOrder.payAmount) }}</span></el-descriptions-item>
          <el-descriptions-item label="订单状态"><el-tag :type="getStatusType(currentOrder.orderStatus)" size="small">{{ getStatusLabel(currentOrder.orderStatus) }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="支付渠道">{{ getPayChannelLabel(currentOrder.payChannel) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ currentOrder.payTime ? formatDateTime(currentOrder.payTime) : '-' }}</el-descriptions-item>
          <el-descriptions-item label="核验状态">
            <el-icon v-if="currentOrder.isVerified === 1" style="color: #67C23A"><CircleCheck /></el-icon>
            <span v-else style="color: #909399">未核验</span>
          </el-descriptions-item>
          <el-descriptions-item label="异常状态">
            <el-tag v-if="currentOrder.isAbnormal === 1" :type="currentOrder.abnormalResolved === 1 ? 'success' : 'danger'" size="small">{{ currentOrder.abnormalResolved === 1 ? '已处理' : '异常' }}</el-tag>
            <span v-else>正常</span>
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="过期时间">{{ currentOrder.expireTime ? formatDateTime(currentOrder.expireTime) : '-' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentOrder.logs && currentOrder.logs.length">
          <h4 style="margin-bottom: 8px">变更日志</h4>
          <el-timeline>
            <el-timeline-item v-for="log in currentOrder.logs" :key="log.id" :timestamp="formatDateTime(log.createdAt)" placement="top" :color="getLogTypeColor(log.logType)">
              <div style="display: flex; align-items: center; gap: 6px">
                <el-tag :color="getLogTypeColor(log.logType)" effect="dark" size="small" style="border: none">{{ log.logTypeLabel || log.logType }}</el-tag>
                <span v-if="log.operatorName" style="color: #909399; font-size: 12px">{{ log.operatorName }}</span>
              </div>
              <div v-if="log.changedFields && log.changedFields.length" style="font-size: 13px; color: #606266; margin-top: 4px">
                变更: {{ log.changedFields.join(', ') }}
              </div>
              <div v-if="log.operatorRemark" style="font-size: 12px; color: #909399; margin-top: 2px">{{ log.operatorRemark }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div v-if="currentOrder.refunds && currentOrder.refunds.length">
          <h4 style="margin-bottom: 8px">退款记录</h4>
          <el-table :data="currentOrder.refunds" size="small" border stripe>
            <el-table-column prop="refundNo" label="退款编号" min-width="140" show-overflow-tooltip />
            <el-table-column prop="refundAmount" label="退款金额" width="110" align="right">
              <template #default="{ row }">¥{{ formatAmount(row.refundAmount) }}</template>
            </el-table-column>
            <el-table-column prop="refundStatus" label="状态" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.refundStatus === 1 ? 'success' : row.refundStatus === 2 ? 'danger' : 'warning'" size="small">{{ getRefundStatusLabel(row.refundStatus) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="privilegeRevoked" label="权益收回" width="90" align="center">
              <template #default="{ row }">
                <el-icon v-if="row.privilegeRevoked === 1" style="color: #67C23A"><CircleCheck /></el-icon>
                <span v-else style="color: #909399">否</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" min-width="100">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-drawer>

    <el-drawer v-model="traceDrawerVisible" title="订单溯源" size="620px" direction="rtl" destroy-on-close>
      <div style="margin-bottom: 16px">
        <el-radio-group v-model="traceType" size="small" style="margin-bottom: 8px">
          <el-radio-button v-for="item in Object.values(MEMBER_ORDER_TRACE_TYPE)" :key="item.value" :value="item.value">{{ item.label }}</el-radio-button>
        </el-radio-group>
        <div style="display: flex; gap: 8px; margin-top: 8px">
          <el-input v-model="traceValue" :placeholder="`请输入${traceTypeLabel}`" clearable class="focus-color-input" @keyup.enter="loadTraceData" />
          <el-button type="primary" @click="loadTraceData" :loading="traceLoading" style="border-radius: 8px">查询</el-button>
        </div>
      </div>

      <div v-if="traceResult && traceResult.found" v-loading="traceLoading">
        <div v-if="traceResult.summary" style="margin-bottom: 16px">
          <el-row :gutter="12">
            <el-col :span="8"><el-statistic title="订单数" :value="traceResult.summary.totalOrders || 1" /></el-col>
            <el-col :span="8"><el-statistic title="总金额" :value="'¥' + formatAmount(traceResult.summary.totalAmount)" /></el-col>
            <el-col :span="8"><el-statistic title="退款数" :value="traceResult.summary.totalRefunds" /></el-col>
          </el-row>
        </div>

        <div v-if="traceResult.order">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="订单编号">{{ traceResult.order.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="用户UID">{{ traceResult.order.uid }}</el-descriptions-item>
            <el-descriptions-item label="实付金额">¥{{ formatAmount(traceResult.order.payAmount) }}</el-descriptions-item>
            <el-descriptions-item label="状态">{{ getStatusLabel(traceResult.order.orderStatus) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="traceResult.orders && traceResult.orders.length" style="margin-top: 16px">
          <el-table :data="traceResult.orders" size="small" border stripe max-height="400">
            <el-table-column prop="orderNo" label="订单编号" min-width="150" show-overflow-tooltip />
            <el-table-column prop="payAmount" label="金额" width="100" align="right">
              <template #default="{ row }">¥{{ formatAmount(row.payAmount) }}</template>
            </el-table-column>
            <el-table-column prop="orderStatus" label="状态" width="90" align="center">
              <template #default="{ row }"><el-tag :type="getStatusType(row.orderStatus)" size="small">{{ getStatusLabel(row.orderStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" min-width="100">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <el-empty v-else-if="traceSearched && (!traceResult || !traceResult.found)" description="未找到相关订单" />
    </el-drawer>

    <transition name="fade-back-top">
      <div v-if="showBackTop" class="back-top-btn" @click="scrollToTop">
        <el-icon><Top /></el-icon>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, CircleClose, CircleCheck, Connection, Top } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import {
  MEMBER_ORDER_STATUS,
  MEMBER_ORDER_PACKAGE_TYPE,
  MEMBER_ORDER_PAY_CHANNEL,
  MEMBER_ORDER_LOG_TYPE,
  MEMBER_ORDER_BATCH_ACTION,
  MEMBER_ORDER_TRACE_TYPE,
  MEMBER_ORDER_REFUND_STATUS,
} from '@/constants/enums'
import {
  getMemberOrderListApi,
  getMemberOrderStatsApi,
  verifyMemberOrderApi,
  cancelMemberOrderApi,
  refundMemberOrderApi,
  appealMemberOrderApi,
  resolveAbnormalOrderApi,
  batchActionMemberOrderApi,
  getMemberOrderDetailApi,
  getMemberOrderTraceApi,
  checkMemberOrderConsistencyApi,
} from '@/api/member-order'
import type {
  MemberOrderItem,
  MemberOrderStatsResult,
  MemberOrderTraceResult,
} from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const orderList = ref<MemberOrderItem[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const selectedRows = ref<MemberOrderItem[]>([])
const showBackTop = ref(false)

const stats = ref<MemberOrderStatsResult>({
  totalCount: 0, totalAmount: 0, abnormalCount: 0, unverifiedCount: 0,
  todayCount: 0, todayAmount: 0, refundCount: 0, refundAmount: 0, byStatus: [],
})

const statsCards = computed(() => [
  { key: 'total', label: '总订单', value: stats.value.totalCount, color: '#409EFF' },
  { key: 'amount', label: '总收入(元)', value: formatAmount(stats.value.totalAmount), color: '#67C23A' },
  { key: 'today', label: '今日订单', value: stats.value.todayCount, color: '#13c2c2' },
  { key: 'abnormal', label: '异常订单', value: stats.value.abnormalCount, color: '#F56C6C' },
  { key: 'unverified', label: '待核验', value: stats.value.unverifiedCount, color: '#E6A23C' },
  { key: 'refund', label: '退款数', value: stats.value.refundCount, color: '#722ed1' },
  { key: 'refundAmt', label: '退款额(元)', value: formatAmount(stats.value.refundAmount), color: '#909399' },
  { key: 'todayAmt', label: '今日收入(元)', value: formatAmount(stats.value.todayAmount), color: '#2ecc71' },
])

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  orderStatus: null as number | null,
  packageType: '',
  payChannel: '',
  keyword: '',
  dateRange: null as [string, string] | null,
})

const refundDialogVisible = ref(false)
const refundForm = reactive({ orderNo: '', orderId: 0, payAmount: 0, refundAmount: 0, refundReason: '' })

const appealDialogVisible = ref(false)
const appealForm = reactive({ orderNo: '', orderId: 0, appealReason: '' })

const detailDrawerVisible = ref(false)
const detailLoading = ref(false)
const currentOrder = ref<MemberOrderItem | null>(null)

const traceDrawerVisible = ref(false)
const traceLoading = ref(false)
const traceSearched = ref(false)
const traceType = ref('orderNo')
const traceValue = ref('')
const traceResult = ref<MemberOrderTraceResult | null>(null)
const traceTypeLabel = computed(() => {
  const found = Object.values(MEMBER_ORDER_TRACE_TYPE).find(t => t.value === traceType.value)
  return found?.label || ''
})

const getStatusLabel = (s: number) => Object.values(MEMBER_ORDER_STATUS).find(t => t.value === s)?.label || String(s)
const getStatusType = (s: number) => (Object.values(MEMBER_ORDER_STATUS).find(t => t.value === s)?.type || 'info') as any
const getPackageTypeLabel = (t: string) => Object.values(MEMBER_ORDER_PACKAGE_TYPE).find(p => p.value === t)?.label || t
const getPackageTypeColor = (t: string) => Object.values(MEMBER_ORDER_PACKAGE_TYPE).find(p => p.value === t)?.color || '#909399'
const getPayChannelLabel = (t?: string) => Object.values(MEMBER_ORDER_PAY_CHANNEL).find(p => p.value === t)?.label || ''
const getLogTypeColor = (t: string) => Object.values(MEMBER_ORDER_LOG_TYPE).find(l => l.value === t)?.color || '#909399'
const getRefundStatusLabel = (s: number) => Object.values(MEMBER_ORDER_REFUND_STATUS).find(r => r.value === s)?.label || String(s)

const formatAmount = (n: number | string) => {
  const num = Number(n) || 0
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
const formatDate = (d: string | Date) => d ? dayjs(d).format('YYYY-MM-DD') : ''
const formatDateTime = (d: string | Date) => d ? dayjs(d).format('YYYY-MM-DD HH:mm:ss') : ''

const loadOrderList = async () => {
  loading.value = true
  try {
    const params: any = { page: queryForm.page, pageSize: queryForm.pageSize }
    if (queryForm.orderStatus !== null && queryForm.orderStatus !== undefined) params.orderStatus = queryForm.orderStatus
    if (queryForm.packageType) params.packageType = queryForm.packageType
    if (queryForm.payChannel) params.payChannel = queryForm.payChannel
    if (queryForm.keyword) params.keyword = queryForm.keyword
    if (queryForm.dateRange && queryForm.dateRange.length === 2) {
      params.startTime = queryForm.dateRange[0]
      params.endTime = queryForm.dateRange[1]
    }
    const res = await getMemberOrderListApi(params)
    orderList.value = (res.list || []).map((o: any) => ({ ...o, _canceling: false, _verifying: false }))
    total.value = res.pagination?.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try { stats.value = await getMemberOrderStatsApi() } catch { /* */ }
}

const loadAllData = () => { loadOrderList(); loadStats() }

const resetQuery = () => {
  queryForm.page = 1
  queryForm.orderStatus = null
  queryForm.packageType = ''
  queryForm.payChannel = ''
  queryForm.keyword = ''
  queryForm.dateRange = null
  loadOrderList()
}

const handleSelectionChange = (rows: MemberOrderItem[]) => {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

const onHeaderDragend = () => {}

const tableRowClassName = ({ row }: { row: MemberOrderItem }) => {
  if (row.isAbnormal === 1 && row.abnormalResolved === 0) return 'abnormal-row'
  if (row.orderStatus === 2) return 'failed-row'
  return ''
}

const handleCancel = async (row: MemberOrderItem & { _canceling?: boolean }) => {
  try {
    await ElMessageBox.confirm(`确认取消订单「${row.orderNo}」？`, '取消确认', { type: 'warning' })
    row._canceling = true
    await cancelMemberOrderApi(row.id)
    ElMessage.success('订单已取消')
    loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '取消失败')
  } finally {
    row._canceling = false
  }
}

const handleVerify = async (row: MemberOrderItem & { _verifying?: boolean }) => {
  try {
    await ElMessageBox.confirm(`确认核验订单「${row.orderNo}」？核验后将标记为已合规。`, '核验确认', { type: 'info' })
    row._verifying = true
    await verifyMemberOrderApi(row.id)
    ElMessage({ type: 'success', message: '订单核验通过', icon: 'CircleCheck' })
    loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '核验失败')
  } finally {
    row._verifying = false
  }
}

const openRefundDialog = (row: MemberOrderItem) => {
  refundForm.orderNo = row.orderNo
  refundForm.orderId = row.id
  refundForm.payAmount = row.payAmount
  refundForm.refundAmount = row.payAmount
  refundForm.refundReason = ''
  refundDialogVisible.value = true
}

const handleRefund = async () => {
  if (!refundForm.refundReason) { ElMessage.warning('请输入退款原因'); return }
  submitLoading.value = true
  try {
    await refundMemberOrderApi(refundForm.orderId, {
      refundAmount: refundForm.refundAmount,
      refundReason: refundForm.refundReason,
    })
    ElMessage.success('退款处理成功')
    refundDialogVisible.value = false
    loadAllData()
  } catch (e: any) {
    ElMessage.error(e.message || '退款失败')
  } finally {
    submitLoading.value = false
  }
}

const openAppealDialog = (row: MemberOrderItem) => {
  appealForm.orderNo = row.orderNo
  appealForm.orderId = row.id
  appealForm.appealReason = ''
  appealDialogVisible.value = true
}

const handleAppeal = async () => {
  if (!appealForm.appealReason) { ElMessage.warning('请输入申诉原因'); return }
  submitLoading.value = true
  try {
    await appealMemberOrderApi(appealForm.orderId, { appealReason: appealForm.appealReason })
    ElMessage.success('异常申诉已提交')
    appealDialogVisible.value = false
    loadAllData()
  } catch (e: any) {
    ElMessage.error(e.message || '申诉失败')
  } finally {
    submitLoading.value = false
  }
}

const handleResolveAbnormal = async (row: MemberOrderItem) => {
  try {
    await ElMessageBox.confirm(`确认处理订单「${row.orderNo}」的异常？`, '异常处理确认', { type: 'info' })
    await resolveAbnormalOrderApi(row.id, { resolveRemark: '人工复核处理' })
    ElMessage.success('异常已处理')
    loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '处理失败')
  }
}

const handleCheckConsistency = async (row: MemberOrderItem) => {
  try {
    const result = await checkMemberOrderConsistencyApi(row.id)
    if (result.isConsistent) {
      ElMessage({ type: 'success', message: '订单合规校验通过', icon: 'CircleCheck' })
    } else {
      ElMessageBox.alert(
        result.issues.map(i => `<div style="margin:4px 0"><el-tag type="${i.level === 'high' ? 'danger' : 'warning'}" size="small">${i.level}</el-tag> ${i.message}</div>`).join(''),
        `检测到${result.issues.length}项不一致`,
        { dangerouslyUseHTMLString: true, type: 'warning' }
      )
    }
  } catch (e: any) {
    ElMessage.error(e.message || '校验失败')
  }
}

const handleBatchAction = async (action: string) => {
  if (selectedIds.value.length === 0) { ElMessage.warning('请先选择订单'); return }
  const actionLabel = Object.values(MEMBER_ORDER_BATCH_ACTION).find(a => a.value === action)?.label || action
  try {
    await ElMessageBox.confirm(`确认${actionLabel}${selectedIds.value.length}个订单？`, '批量操作确认', { type: 'warning' })
    const res = await batchActionMemberOrderApi({ action: action as any, ids: selectedIds.value })
    ElMessage.success(`${actionLabel}完成：成功${res.successCount}，失败${res.failCount}，跳过${res.skippedCount}`)
    loadAllData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '批量操作失败')
  }
}

const openDetailDrawer = async (row: MemberOrderItem) => {
  detailDrawerVisible.value = true
  detailLoading.value = true
  try {
    currentOrder.value = await getMemberOrderDetailApi(row.id)
  } catch { currentOrder.value = row as any } finally { detailLoading.value = false }
}

const openTraceDrawer = () => {
  traceType.value = 'orderNo'
  traceValue.value = ''
  traceResult.value = null
  traceSearched.value = false
  traceDrawerVisible.value = true
}

const openTraceForOrder = (orderNo: string) => {
  traceType.value = 'orderNo'
  traceValue.value = orderNo
  traceResult.value = null
  traceSearched.value = false
  traceDrawerVisible.value = true
  loadTraceData()
}

const openTraceForUid = (uid: string) => {
  traceType.value = 'uid'
  traceValue.value = uid
  traceResult.value = null
  traceSearched.value = false
  traceDrawerVisible.value = true
  loadTraceData()
}

const loadTraceData = async () => {
  if (!traceValue.value.trim()) { ElMessage.warning('请输入查询值'); return }
  traceLoading.value = true
  traceSearched.value = true
  try {
    traceResult.value = await getMemberOrderTraceApi({ traceType: traceType.value as any, traceValue: traceValue.value })
  } catch (e: any) { ElMessage.error(e.message || '溯源查询失败') } finally { traceLoading.value = false }
}

const scrollToTop = () => { window.scrollTo({ top: 0, behavior: 'smooth' }) }
const onScroll = () => { showBackTop.value = window.scrollY > 300 }

onMounted(() => { loadAllData(); window.addEventListener('scroll', onScroll) })
onUnmounted(() => { window.removeEventListener('scroll', onScroll) })
</script>

<style lang="scss" scoped>
.member-order-page { padding: 20px; }

.page-header {
  margin-bottom: 20px;
  h2 { margin: 0 0 4px; font-size: 22px; font-weight: 600; }
  .page-desc { margin: 0; font-size: 14px; color: #909399; }
}

.stats-row { margin-bottom: 16px; }

.stat-card {
  text-align: center; border-radius: 10px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
  .stat-value { font-size: 20px; font-weight: 700; line-height: 1.4; }
  .stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
}

.filter-card { margin-bottom: 16px; border-radius: 10px; }
.table-card { border-radius: 10px; }

.table-toolbar {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
  .toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }
  .toolbar-right { display: flex; gap: 8px; }
}

.pagination-wrap { display: flex; justify-content: flex-end; margin-top: 16px; }

.focus-color-input {
  :deep(.el-input__wrapper:focus-within) { box-shadow: 0 0 0 1px #409eff inset; }
}

.amount-text { font-weight: 600; color: #E6A23C; font-variant-numeric: tabular-nums; }

.skeleton-wrap { padding: 20px 0; }

:deep(.el-table .abnormal-row) { background-color: #fef0f0 !important; }
:deep(.el-table .failed-row) { background-color: #fdf6ec !important; }
:deep(.el-table__body tr.current-row > td) { background-color: #ecf5ff !important; }

.back-top-btn {
  position: fixed; right: 40px; bottom: 80px; width: 44px; height: 44px;
  border-radius: 50%; background: #409eff; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 2px 8px rgba(64,158,255,0.4); z-index: 999;
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: scale(1.1); box-shadow: 0 4px 16px rgba(64,158,255,0.5); }
}

.fade-back-top-enter-active, .fade-back-top-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-back-top-enter-from, .fade-back-top-leave-to { opacity: 0; transform: translateY(10px); }

:deep(.el-button) { border-radius: 8px; }
:deep(.el-card) { border-radius: 10px; }
:deep(.el-dialog) { border-radius: 12px; }
:deep(.el-drawer__header) { margin-bottom: 0; padding: 16px 20px; border-bottom: 1px solid #ebeef5; }
</style>
