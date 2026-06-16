<template>
  <div class="page-container">
    <div class="page-toolbar">
      <FinButton
        perm="trade:create"
        type="primary"
        @click="handleCreate"
      >
        <el-icon><Plus /></el-icon>
        新建交易
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
      :show-index="true"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #tradeType="{ row }">
        <el-tag :type="getTradeTypeColor(row.tradeType)" effect="dark">
          {{ getTradeTypeLabel(row.tradeType) }}
        </el-tag>
      </template>

      <template #tradeStatus="{ row }">
        <el-tag :type="getTradeStatusColor(row.tradeStatus)" effect="light">
          {{ getTradeStatusLabel(row.tradeStatus) }}
        </el-tag>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          查看详情
        </el-button>
        <FinButton
          v-if="row.tradeStatus === TradeStatus.AUDITING"
          perm="trade:audit:approve"
          type="success"
          link
          @click="handleApprove(row)"
        >
          审核通过
        </FinButton>
        <FinButton
          v-if="row.tradeStatus === TradeStatus.AUDITING"
          perm="trade:audit:reject"
          type="danger"
          link
          @click="handleReject(row)"
        >
          审核拒绝
        </FinButton>
        <FinButton
          v-if="row.tradeStatus === TradeStatus.PENDING || row.tradeStatus === TradeStatus.AUDITING"
          perm="trade:cancel"
          type="warning"
          link
          @click="handleCancel(row)"
        >
          撤销
        </FinButton>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="createDialogVisible"
      title="新建交易"
      width="600px"
      :loading="createLoading"
      @confirm="handleCreateConfirm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="100px"
      >
        <el-form-item label="客户" prop="customerId">
          <el-select v-model="createForm.customerId" placeholder="请选择客户" style="width: 100%">
            <el-option
              v-for="customer in customerList"
              :key="customer.id"
              :label="customer.customerName"
              :value="customer.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="股票" prop="stockId">
          <el-select v-model="createForm.stockId" placeholder="请选择股票" style="width: 100%" filterable>
            <el-option
              v-for="stock in stockList"
              :key="stock.id"
              :label="`${stock.stockCode} - ${stock.stockName}`"
              :value="stock.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="交易类型" prop="tradeType">
          <el-radio-group v-model="createForm.tradeType">
            <el-radio :value="TradeType.BUY">买入</el-radio>
            <el-radio :value="TradeType.SELL">卖出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="交易价格" prop="tradePrice">
          <el-input-number
            v-model="createForm.tradePrice"
            :min="0.01"
            :precision="2"
            :step="0.01"
            style="width: 100%"
            @change="calcTradeAmount"
          />
        </el-form-item>
        <el-form-item label="交易数量" prop="tradeQuantity">
          <el-input-number
            v-model="createForm.tradeQuantity"
            :min="100"
            :step="100"
            style="width: 100%"
            @change="calcTradeAmount"
          />
          <div class="form-tip">数量必须为100的整数倍</div>
        </el-form-item>
        <el-divider>费用计算</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="交易金额">
            <span class="amount-value">{{ formatMoney(tradeCalcResult.tradeAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="佣金(0.03%)">
            {{ formatMoney(tradeCalcResult.commission) }}
          </el-descriptions-item>
          <el-descriptions-item label="印花税(0.1%)">
            {{ formatMoney(tradeCalcResult.stampTax) }}
          </el-descriptions-item>
          <el-descriptions-item label="总金额">
            <span class="amount-value">{{ formatMoney(tradeCalcResult.totalAmount) }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-form>
    </FinDialog>

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="交易详情"
      width="700px"
      :hide-footer="true"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="交易单号">
          {{ currentDetail.tradeNo }}
        </el-descriptions-item>
        <el-descriptions-item label="交易状态">
          <el-tag :type="getTradeStatusColor(currentDetail.tradeStatus)" effect="light">
            {{ getTradeStatusLabel(currentDetail.tradeStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户">
          {{ currentDetail.customerName }}
        </el-descriptions-item>
        <el-descriptions-item label="交易类型">
          <el-tag :type="getTradeTypeColor(currentDetail.tradeType)" effect="dark">
            {{ getTradeTypeLabel(currentDetail.tradeType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="股票代码">
          {{ currentDetail.stockCode }}
        </el-descriptions-item>
        <el-descriptions-item label="股票名称">
          {{ currentDetail.stockName }}
        </el-descriptions-item>
        <el-descriptions-item label="委托价格" align="right">
          {{ formatMoney(currentDetail.tradePrice) }}
        </el-descriptions-item>
        <el-descriptions-item label="委托数量" align="right">
          {{ currentDetail.tradeQuantity.toLocaleString() }}
        </el-descriptions-item>
        <el-descriptions-item label="交易金额" align="right">
          <span class="amount-value">{{ formatMoney(currentDetail.tradeAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="手续费" align="right">
          {{ formatMoney(currentDetail.commission) }}
        </el-descriptions-item>
        <el-descriptions-item label="印花税" align="right">
          {{ formatMoney(currentDetail.stampTax) }}
        </el-descriptions-item>
        <el-descriptions-item label="总费用" align="right">
          {{ formatMoney(currentDetail.totalFee) }}
        </el-descriptions-item>
        <el-descriptions-item label="下单时间">
          {{ formatDateTime(currentDetail.orderAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="成交时间">
          {{ currentDetail.dealAt ? formatDateTime(currentDetail.dealAt) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="审核意见" :span="2" v-if="currentDetail.auditOpinion">
          {{ currentDetail.auditOpinion }}
        </el-descriptions-item>
      </el-descriptions>
    </FinDialog>

    <FinDialog
      v-model:visible="auditDialogVisible"
      :title="auditType === 'approve' ? '审核通过' : '审核拒绝'"
      width="500px"
      :loading="auditLoading"
      @confirm="handleAuditConfirm"
    >
      <el-descriptions v-if="currentAudit" :column="2" border size="small">
        <el-descriptions-item label="交易单号">
          {{ currentAudit.tradeNo }}
        </el-descriptions-item>
        <el-descriptions-item label="客户">
          {{ currentAudit.customerName }}
        </el-descriptions-item>
        <el-descriptions-item label="股票">
          {{ currentAudit.stockCode }} {{ currentAudit.stockName }}
        </el-descriptions-item>
        <el-descriptions-item label="交易金额" align="right">
          {{ formatMoney(currentAudit.tradeAmount) }}
        </el-descriptions-item>
      </el-descriptions>
      <el-form :model="auditForm" label-width="80px" style="margin-top: 16px">
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.opinion"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Download, Refresh } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import FinButton from '@/components/common/FinButton.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatMoney, formatDateTime } from '@/utils/format'
import {
  TRADE_TYPE_LABELS,
  TRADE_TYPE_COLORS,
  TRADE_STATUS_LABELS,
  TRADE_STATUS_COLORS
} from '@/constants/dictionaries'
import { TradeType, TradeStatus } from '@/enums'
import * as tradeApi from '@/api/trade'
import type { ITrade, ITradeCreateParams } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const { hasPerm } = usePermission()

const loading = ref(false)
const refreshLoading = ref(false)
const createLoading = ref(false)
const auditLoading = ref(false)
const tableData = ref<ITrade[]>([])
const searchParams = reactive<Record<string, any>>({})
const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const currentDetail = ref<ITrade | null>(null)
const currentAudit = ref<ITrade | null>(null)
const auditType = ref<'approve' | 'reject'>('approve')
const customerList = ref<any[]>([])
const stockList = ref<any[]>([])

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES
})

const createFormRef = ref<FormInstance>()
const createForm = reactive<ITradeCreateParams & { customerId: number | null; stockId: number | null }>({
  customerId: null,
  stockId: null,
  tradeType: TradeType.BUY,
  tradePrice: 0,
  tradeQuantity: 0,
  remark: ''
})

const createFormRules: FormRules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  stockId: [{ required: true, message: '请选择股票', trigger: 'change' }],
  tradeType: [{ required: true, message: '请选择交易类型', trigger: 'change' }],
  tradePrice: [
    { required: true, message: '请输入交易价格', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('交易价格必须大于0'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  tradeQuantity: [
    { required: true, message: '请输入交易数量', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('交易数量必须大于0'))
        } else if (value % 100 !== 0) {
          callback(new Error('交易数量必须为100的整数倍'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const auditForm = reactive({
  opinion: ''
})

const tradeCalcResult = computed(() => {
  const price = createForm.tradePrice || 0
  const quantity = createForm.tradeQuantity || 0
  const tradeAmount = price * quantity
  const commission = Math.max(tradeAmount * 0.0003, 5)
  const stampTax = createForm.tradeType === TradeType.SELL ? tradeAmount * 0.001 : 0
  const totalAmount = tradeAmount + commission + stampTax
  return {
    tradeAmount,
    commission,
    stampTax,
    totalAmount
  }
})

const filterConfig = [
  {
    prop: 'keyword',
    label: '交易单号',
    type: 'input' as const,
    placeholder: '请输入交易单号关键字'
  },
  {
    prop: 'customerName',
    label: '客户',
    type: 'input' as const,
    placeholder: '请输入客户ID或名称'
  },
  {
    prop: 'tradeType',
    label: '交易类型',
    type: 'select' as const,
    options: [
      { label: '买入', value: TradeType.BUY },
      { label: '卖出', value: TradeType.SELL }
    ]
  },
  {
    prop: 'tradeStatus',
    label: '交易状态',
    type: 'select' as const,
    options: [
      { label: '待处理', value: TradeStatus.PENDING },
      { label: '审核中', value: TradeStatus.AUDITING },
      { label: '已通过', value: TradeStatus.APPROVED },
      { label: '已拒绝', value: TradeStatus.REJECTED },
      { label: '已成交', value: TradeStatus.DEALED },
      { label: '已撤销', value: TradeStatus.CANCELLED },
      { label: '失败', value: TradeStatus.FAILED }
    ]
  },
  {
    prop: 'dateRange',
    label: '日期范围',
    type: 'daterange' as const,
    advanced: true
  },
  {
    prop: 'stockCode',
    label: '股票代码',
    type: 'input' as const,
    placeholder: '请输入股票代码',
    advanced: true
  }
]

const tableColumns = [
  { prop: 'tradeNo', label: '交易单号', minWidth: 160, fixed: 'left' },
  { prop: 'customerName', label: '客户', minWidth: 120 },
  { prop: 'stockCode', label: '股票代码', minWidth: 100 },
  { prop: 'stockName', label: '股票名称', minWidth: 120 },
  { prop: 'tradeType', label: '交易类型', minWidth: 90, slot: 'tradeType', align: 'center' },
  { prop: 'tradePrice', label: '委托价格', minWidth: 100, type: 'money' as const },
  { prop: 'tradeQuantity', label: '委托数量', minWidth: 100, align: 'right' },
  { prop: 'tradeAmount', label: '交易金额', minWidth: 120, type: 'money' as const },
  { prop: 'commission', label: '手续费', minWidth: 100, type: 'money' as const },
  { prop: 'stampTax', label: '印花税', minWidth: 100, type: 'money' as const },
  { prop: 'totalFee', label: '总费用', minWidth: 100, type: 'money' as const },
  { prop: 'tradeStatus', label: '交易状态', minWidth: 100, slot: 'tradeStatus', align: 'center' },
  { prop: 'orderAt', label: '下单时间', minWidth: 160, type: 'datetime' as const },
  { prop: 'dealAt', label: '成交时间', minWidth: 160, type: 'datetime' as const }
]

function getTradeTypeLabel(type: string): string {
  return TRADE_TYPE_LABELS[type as TradeType] || type
}

function getTradeTypeColor(type: string): 'danger' | 'success' {
  return TRADE_TYPE_COLORS[type as TradeType] || 'info'
}

function getTradeStatusLabel(status: string): string {
  return TRADE_STATUS_LABELS[status as TradeStatus] || status
}

function getTradeStatusColor(status: string): string {
  return TRADE_STATUS_COLORS[status as TradeStatus] || 'info'
}

function calcTradeAmount() {
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
    const res = await tradeApi.getTradeList(params)
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

let lastRefreshTime = 0
function handleRefresh() {
  const now = Date.now()
  if (now - lastRefreshTime < 3000) {
    ElMessage.warning('操作过于频繁，请稍后再试')
    return
  }
  lastRefreshTime = now
  refreshLoading.value = true
  fetchData().finally(() => {
    refreshLoading.value = false
  })
}

async function handleCreate() {
  createForm.customerId = null
  createForm.stockId = null
  createForm.tradeType = TradeType.BUY
  createForm.tradePrice = 0
  createForm.tradeQuantity = 0
  try {
    const [customerRes, stockRes] = await Promise.all([
      tradeApi.getCustomerList(),
      tradeApi.getStockList()
    ])
    if (customerRes.code === 0) {
      customerList.value = customerRes.data
    }
    if (stockRes.code === 0) {
      stockList.value = stockRes.data
    }
  } catch (error) {
    ElMessage.error('获取基础数据失败')
  }
  createDialogVisible.value = true
}

async function handleCreateConfirm() {
  if (!createFormRef.value) return
  await createFormRef.value.validate(async (valid) => {
    if (!valid) return
    createLoading.value = true
    try {
      const res = await tradeApi.createTrade({
        customerId: createForm.customerId!,
        stockId: createForm.stockId!,
        tradeType: createForm.tradeType,
        tradePrice: createForm.tradePrice,
        tradeQuantity: createForm.tradeQuantity,
        remark: createForm.remark
      })
      if (res.code === 0) {
        ElMessage.success('创建成功')
        createDialogVisible.value = false
        fetchData()
      } else {
        ElMessage.error(res.message)
      }
    } catch (error) {
      ElMessage.error('创建失败')
    } finally {
      createLoading.value = false
    }
  })
}

async function handleView(row: ITrade) {
  try {
    const res = await tradeApi.getTradeById(row.id)
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

function handleApprove(row: ITrade) {
  currentAudit.value = row
  auditType.value = 'approve'
  auditForm.opinion = ''
  auditDialogVisible.value = true
}

function handleReject(row: ITrade) {
  currentAudit.value = row
  auditType.value = 'reject'
  auditForm.opinion = ''
  auditDialogVisible.value = true
}

async function handleAuditConfirm() {
  if (!currentAudit.value) return
  auditLoading.value = true
  try {
    const api = auditType.value === 'approve' ? tradeApi.approveTrade : tradeApi.rejectTrade
    const res = await api(currentAudit.value.id, auditForm.opinion)
    if (res.code === 0) {
      ElMessage.success(auditType.value === 'approve' ? '审核通过成功' : '审核拒绝成功')
      auditDialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('审核失败')
  } finally {
    auditLoading.value = false
  }
}

async function handleCancel(row: ITrade) {
  try {
    await ElMessageBox.confirm(
      `确定要撤销交易 ${row.tradeNo} 吗？`,
      '撤销确认',
      { type: 'warning' }
    )
    const res = await tradeApi.cancelTrade(row.id)
    if (res.code === 0) {
      ElMessage.success('撤销成功')
      fetchData()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('撤销失败')
    }
  }
}

async function handleExport() {
  try {
    const blob = await tradeApi.exportTradeList(searchParams)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `交易列表_${Date.now()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.form-tip {
  font-size: 12px;
  color: var(--fin-text-secondary);
  margin-top: 4px;
}

.amount-value {
  color: var(--fin-primary);
  font-weight: 600;
}
</style>
