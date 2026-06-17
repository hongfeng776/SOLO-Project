<template>
  <div class="payment-flow-table">
    <div class="search-bar mb-20">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索流水号/订单号/交易号/手机号"
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prepend>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <div class="table-wrapper" ref="tableWrapperRef">
      <el-table
        ref="tableRef"
        :data="pagedData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        :row-class-name="rowClassName"
        @expand-change="handleExpandChange"
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="flow-detail-expand detail-expand">
              <div v-if="row.deductions && row.deductions.length > 0" class="detail-section">
                <h4 class="section-title">
                  <el-icon><Money /></el-icon>
                  抵扣明细
                </h4>
                <el-table :data="row.deductions" size="small" border>
                  <el-table-column label="抵扣类型" width="120">
                    <template #default="{ row: d }">
                      <el-tag :color="getDeductionColor(d.type)" effect="dark" size="small">
                        {{ getDeductionLabel(d.type) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="name" label="名称" min-width="150" />
                  <el-table-column label="基数" width="120">
                    <template #default="{ row: d }">¥{{ formatAmount(d.base) }}</template>
                  </el-table-column>
                  <el-table-column label="比例" width="100">
                    <template #default="{ row: d }">
                      {{ d.rate ? (d.rate * 100).toFixed(1) + '%' : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" width="120">
                    <template #default="{ row: d }">
                      <span class="deduction-value">-¥{{ formatAmount(d.amount) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <div v-if="row.fees && row.fees.length > 0" class="detail-section">
                <h4 class="section-title">
                  <el-icon><Ticket /></el-icon>
                  手续费明细
                </h4>
                <el-table :data="row.fees" size="small" border>
                  <el-table-column label="费用类型" width="120">
                    <template #default="{ row: f }">
                      {{ getFeeTypeLabel(f.type) }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="name" label="名称" min-width="150" />
                  <el-table-column label="计费基数" width="120">
                    <template #default="{ row: f }">¥{{ formatAmount(f.feeBase) }}</template>
                  </el-table-column>
                  <el-table-column label="费率" width="100">
                    <template #default="{ row: f }">
                      {{ f.feeRate ? (f.feeRate * 100).toFixed(2) + '%' : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="固定费" width="100">
                    <template #default="{ row: f }">
                      {{ f.fixedFee ? '¥' + formatAmount(f.fixedFee) : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" width="120">
                    <template #default="{ row: f }">
                      <span class="fee-value">+¥{{ formatAmount(f.amount) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="bearer" label="承担方" width="100" />
                </el-table>
              </div>

              <div v-if="(!row.deductions || row.deductions.length === 0) && (!row.fees || row.fees.length === 0)" class="empty-detail">
                <el-empty description="暂无明细数据" :image-size="60" />
              </div>
            </div>
          </template>
        </el-table-column>

        <template v-for="(col, idx) in columns" :key="col.prop">
          <el-table-column
            :prop="col.prop"
            :label="col.label"
            :width="colWidths[col.prop] || col.minWidth"
            :min-width="col.minWidth"
            :class-name="draggingCol === col.prop ? 'dragging-col' : ''"
          >
            <template #header>
              <div class="col-header-cell" :style="{ position: 'relative' }">
                <span>{{ col.label }}</span>
                <span
                  v-if="idx < columns.length - 1"
                  class="col-resize-handle"
                  @mousedown="startResize($event, col.prop)"
                ></span>
              </div>
            </template>
            <template #default="{ row }">
              <template v-if="col.prop === 'flowNo'">
                <el-tooltip :content="row.flowNo" placement="top">
                  <span class="flow-no-text">{{ row.flowNo }}</span>
                </el-tooltip>
              </template>
              <template v-else-if="col.prop === 'orderNo'">
                <span>{{ row.orderNo }}</span>
              </template>
              <template v-else-if="col.prop === 'paymentMode'">
                {{ getPaymentModeLabel(row.paymentMode) }}
              </template>
              <template v-else-if="col.prop === 'channel'">
                <el-icon style="vertical-align: middle; margin-right: 4px;">
                  <component :is="getChannelIcon(row.channel)" />
                </el-icon>
                {{ getChannelLabel(row.channel) }}
              </template>
              <template v-else-if="col.prop === 'totalAmount'">
                ¥{{ formatAmount(row.totalAmount) }}
              </template>
              <template v-else-if="col.prop === 'deductionTotal'">
                <span class="deduction-value">-¥{{ formatAmount(row.deductionTotal) }}</span>
              </template>
              <template v-else-if="col.prop === 'feeTotal'">
                <span class="fee-value">+¥{{ formatAmount(row.feeTotal) }}</span>
              </template>
              <template v-else-if="col.prop === 'actualAmount'">
                <span class="actual-value">¥{{ formatAmount(row.actualAmount) }}</span>
              </template>
              <template v-else-if="col.prop === 'status'">
                <el-tag
                  :style="{ background: getFlowStatusColor(row.status), borderColor: getFlowStatusColor(row.status) }"
                  effect="dark"
                  size="small"
                >
                  {{ getFlowStatusLabel(row.status) }}
                </el-tag>
              </template>
              <template v-else-if="col.prop === 'isAbnormal'">
                <template v-if="row.isAbnormal === 1">
                  <el-tooltip>
                    <template #content>
                      <div v-if="row.abnormalReasons && row.abnormalReasons.length">
                        <div v-for="(r, i) in row.abnormalReasons" :key="i" class="abnormal-reason-item">
                          · {{ r }}
                        </div>
                      </div>
                      <div v-else>未知异常</div>
                    </template>
                    <el-tag type="danger" effect="dark" size="small" class="flow-abnormal-tag">
                      <el-icon><Warning /></el-icon>
                      异常
                    </el-tag>
                  </el-tooltip>
                </template>
                <el-tag v-else type="success" size="small" effect="plain">正常</el-tag>
              </template>
              <template v-else-if="col.prop === 'payTime'">
                {{ row.payTime || '-' }}
              </template>
            </template>
          </el-table-column>
        </template>

        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleViewDetail(row)"
            >查看详情</el-button>
            <el-button
              v-if="row.status === 1"
              type="danger"
              link
              size="small"
              @click="handleRefund(row)"
            >发起退款</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container mt-20">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog v-model="detailDialogVisible" title="流水详情" width="640px" destroy-on-close>
      <div v-if="currentFlow" class="flow-detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="流水号">{{ currentFlow.flowNo }}</el-descriptions-item>
          <el-descriptions-item label="订单号">{{ currentFlow.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="支付类型">
            {{ getPaymentModeLabel(currentFlow.paymentMode) }}
          </el-descriptions-item>
          <el-descriptions-item label="支付渠道">
            <el-icon style="vertical-align: middle; margin-right: 4px;">
              <component :is="getChannelIcon(currentFlow.channel)" />
            </el-icon>
            {{ getChannelLabel(currentFlow.channel) }}
          </el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ formatAmount(currentFlow.totalAmount) }}</el-descriptions-item>
          <el-descriptions-item label="抵扣合计">
            <span class="deduction-value">-¥{{ formatAmount(currentFlow.deductionTotal) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="手续费合计">
            <span class="fee-value">+¥{{ formatAmount(currentFlow.feeTotal) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="实付金额">
            <span class="actual-value">¥{{ formatAmount(currentFlow.actualAmount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="流水状态">
            <el-tag
              :style="{ background: getFlowStatusColor(currentFlow.status), borderColor: getFlowStatusColor(currentFlow.status) }"
              effect="dark"
              size="small"
            >
              {{ getFlowStatusLabel(currentFlow.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常状态">
            <el-tag v-if="currentFlow.isAbnormal === 1" type="danger" size="small">异常</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ currentFlow.createTime }}</el-descriptions-item>
          <el-descriptions-item v-if="currentFlow.payTime" label="支付时间" :span="2">
            {{ currentFlow.payTime }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentFlow.transactionNo" label="第三方交易号" :span="2">
            {{ currentFlow.transactionNo }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentFlow.isAbnormal === 1 && currentFlow.abnormalReasons" label="异常原因" :span="2">
            <div v-for="(r, i) in currentFlow.abnormalReasons" :key="i" class="abnormal-reason-item">
              · {{ r }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <el-dialog v-model="refundDialogVisible" title="发起退款" width="480px" destroy-on-close>
      <el-form :model="refundForm" :rules="refundRules" ref="refundFormRef" label-width="100px">
        <el-form-item label="流水号">
          <span>{{ currentFlow?.flowNo }}</span>
        </el-form-item>
        <el-form-item label="实付金额">
          <span class="actual-value">¥{{ formatAmount(currentFlow?.actualAmount) }}</span>
        </el-form-item>
        <el-form-item label="退款金额" prop="amount">
          <el-input v-model="refundForm.amount" type="number" :step="0.01">
            <template #append>元</template>
          </el-input>
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-input v-model="refundForm.reason" type="textarea" :rows="3" placeholder="请输入退款原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="refundLoading" @click="submitRefund">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Money, Ticket, Warning,
  ChatDotRound, Aim, CreditCard, Wallet
} from '@element-plus/icons-vue'
import { tracePaymentFlows, getFlowDetail } from '@/api/payment'
import {
  PaymentModeEnum,
  PaymentChannelEnum,
  PaymentFlowStatusEnum,
  DeductionTypeEnum,
  FeeTypeEnum,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { formatAmount } from '@/utils/payment'
import eventBus from '@/utils/eventBus'

const props = defineProps({
  orderId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['abnormal-found'])

const loading = ref(false)
const tableRef = ref(null)
const tableWrapperRef = ref(null)
const searchKeyword = ref('')
const draggingCol = ref(null)

const detailDialogVisible = ref(false)
const refundDialogVisible = ref(false)
const refundLoading = ref(false)
const refundFormRef = ref(null)
const currentFlow = ref(null)

const refundForm = reactive({
  amount: '',
  reason: ''
})

const refundRules = {
  amount: [
    { required: true, message: '请输入退款金额', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入退款原因', trigger: 'blur' },
    { min: 5, message: '退款原因至少5个字符', trigger: 'blur' }
  ]
}

const columns = [
  { prop: 'flowNo', label: '流水号', minWidth: 180 },
  { prop: 'orderNo', label: '订单号', minWidth: 160 },
  { prop: 'paymentMode', label: '支付类型', width: 100 },
  { prop: 'channel', label: '支付渠道', width: 120 },
  { prop: 'totalAmount', label: '总金额', width: 100 },
  { prop: 'deductionTotal', label: '抵扣合计', width: 110 },
  { prop: 'feeTotal', label: '手续费', width: 100 },
  { prop: 'actualAmount', label: '实付金额', width: 110 },
  { prop: 'status', label: '状态', width: 100 },
  { prop: 'isAbnormal', label: '异常标记', width: 90 },
  { prop: 'payTime', label: '支付时间', minWidth: 180 }
]

const defaultColWidths = {
  flowNo: 200,
  orderNo: 180,
  paymentMode: 100,
  channel: 130,
  totalAmount: 100,
  deductionTotal: 110,
  feeTotal: 100,
  actualAmount: 110,
  status: 100,
  isAbnormal: 90,
  payTime: 180
}

const STORAGE_KEY = 'payment_flow_col_widths'
const colWidths = reactive({ ...defaultColWidths })

const saveColWidths = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colWidths))
  } catch (e) {}
}

const loadColWidths = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.keys(parsed).forEach(key => {
        if (colWidths.hasOwnProperty(key)) {
          colWidths[key] = parsed[key]
        }
      })
    }
  } catch (e) {}
}

let resizeState = null

const startResize = (e, colProp) => {
  e.preventDefault()
  e.stopPropagation()
  draggingCol.value = colProp
  resizeState = {
    startX: e.clientX,
    startWidth: colWidths[colProp] || 100,
    colProp
  }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', stopResize)
}

const onResize = (e) => {
  if (!resizeState) return
  const diff = e.clientX - resizeState.startX
  const newWidth = Math.max(60, resizeState.startWidth + diff)
  colWidths[resizeState.colProp] = newWidth
}

const stopResize = () => {
  if (resizeState) {
    draggingCol.value = null
    saveColWidths()
    resizeState = null
  }
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', stopResize)
}

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const mockFlows = [
  {
    id: 1, flowNo: 'FL202401150001', orderNo: 'ORD202401150001',
    paymentMode: 'instant', channel: 'wechat',
    totalAmount: 1280, deductionTotal: 150, feeTotal: 3.84, actualAmount: 1133.84,
    status: 1, isAbnormal: 0, payTime: '2024-01-15 14:35:00',
    createTime: '2024-01-15 14:30:00', transactionNo: 'TX20240115WX001',
    deductions: [
      { type: 'coupon', name: '满1000减100优惠券', base: 1280, rate: 0, amount: 100 },
      { type: 'points', name: '1000积分抵扣', base: 1280, rate: 0, amount: 50 }
    ],
    fees: [
      { type: 'channel', name: '微信支付手续费', feeBase: 1280, feeRate: 0.003, fixedFee: 0, amount: 3.84, bearer: '商家' }
    ]
  },
  {
    id: 2, flowNo: 'FL202401150002', orderNo: 'ORD202401150002',
    paymentMode: 'instant', channel: 'alipay',
    totalAmount: 888, deductionTotal: 0, feeTotal: 2.66, actualAmount: 890.66,
    status: 1, isAbnormal: 0, payTime: '2024-01-15 12:20:00',
    createTime: '2024-01-15 12:15:00', transactionNo: 'TX20240115AL002',
    deductions: [],
    fees: [
      { type: 'channel', name: '支付宝手续费', feeBase: 888, feeRate: 0.003, fixedFee: 0, amount: 2.66, bearer: '商家' }
    ]
  },
  {
    id: 3, flowNo: 'FL202401150003', orderNo: 'ORD202401150003',
    paymentMode: 'instant', channel: 'unionpay',
    totalAmount: 399, deductionTotal: 0, feeTotal: 0, actualAmount: 399,
    status: 0, isAbnormal: 1, payTime: null,
    createTime: '2024-01-15 10:20:00', transactionNo: null,
    abnormalReasons: ['支付渠道返回超时', '用户未在时效内完成支付'],
    deductions: [],
    fees: []
  },
  {
    id: 4, flowNo: 'FL202401150004', orderNo: 'ORD202401150004',
    paymentMode: 'installment', channel: 'credit_card',
    totalAmount: 980, deductionTotal: 0, feeTotal: 86.24, actualAmount: 1066.24,
    status: 3, isAbnormal: 0, payTime: '2024-01-14 16:05:00',
    createTime: '2024-01-14 16:00:00', transactionNo: 'TX20240114CC004',
    deductions: [],
    fees: [
      { type: 'installment', name: '12期分期手续费', feeBase: 980, feeRate: 0.088, fixedFee: 0, amount: 86.24, bearer: '用户' }
    ]
  },
  {
    id: 5, flowNo: 'FL202401150005', orderNo: 'ORD202401150005',
    paymentMode: 'difference', channel: 'balance',
    totalAmount: 2000, deductionTotal: 0, feeTotal: 0, actualAmount: 800,
    status: 1, isAbnormal: 0, payTime: '2024-01-14 10:30:00',
    createTime: '2024-01-14 10:25:00', transactionNo: 'TX20240114BL005',
    deductions: [],
    fees: []
  },
  {
    id: 6, flowNo: 'FL202401150006', orderNo: 'ORD202401150006',
    paymentMode: 'instant', channel: 'alipay',
    totalAmount: 3680, deductionTotal: 400, feeTotal: 9.84, actualAmount: 3289.84,
    status: 2, isAbnormal: 1, payTime: null,
    createTime: '2024-01-13 09:00:00', transactionNo: null,
    abnormalReasons: ['用户余额不足，支付失败'],
    deductions: [
      { type: 'member_discount', name: '钻石会员8折', base: 3680, rate: 0.2, amount: 400 }
    ],
    fees: [
      { type: 'channel', name: '支付宝手续费', feeBase: 3280, feeRate: 0.003, fixedFee: 0, amount: 9.84, bearer: '商家' }
    ]
  }
]

const allData = ref([])

const filteredData = computed(() => {
  let data = [...allData.value]
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    data = data.filter(item =>
      (item.flowNo && item.flowNo.toLowerCase().includes(kw)) ||
      (item.orderNo && item.orderNo.toLowerCase().includes(kw)) ||
      (item.transactionNo && item.transactionNo.toLowerCase().includes(kw))
    )
  }
  return data
})

const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const fetchData = async () => {
  loading.value = true
  try {
    if (props.orderId) {
      allData.value = mockFlows.filter(f => f.orderNo.includes(props.orderId))
    } else if (searchKeyword.value) {
      const res = await tracePaymentFlows({ keyword: searchKeyword.value })
      allData.value = res || mockFlows.filter(f => {
        const kw = searchKeyword.value.toLowerCase()
        return f.flowNo.toLowerCase().includes(kw) ||
          f.orderNo.toLowerCase().includes(kw)
      })
    } else {
      allData.value = mockFlows
    }
    pagination.total = filteredData.value.length

    const abnormalFlows = allData.value.filter(f => f.isAbnormal === 1)
    if (abnormalFlows.length > 0) {
      abnormalFlows.forEach(f => {
        eventBus.emit('notification:add', {
          type: 'order',
          title: '支付流水异常',
          content: `流水号 ${f.flowNo} 存在异常，请及时处理`,
          level: 'warning'
        })
      })
      emit('abnormal-found', abnormalFlows)
    }
  } catch (err) {
    ElMessage.error(err.message || '加载流水数据失败')
  } finally {
    loading.value = false
  }
}

const rowClassName = ({ row }) => {
  if (row.isAbnormal === 1) {
    return 'flow-abnormal-row'
  }
  return ''
}

const handleExpandChange = (row, expanded) => {
}

const getPaymentModeLabel = (val) => getEnumLabel(PaymentModeEnum, val)
const getChannelLabel = (val) => getEnumLabel(PaymentChannelEnum, val)
const getFlowStatusLabel = (val) => getEnumLabel(PaymentFlowStatusEnum, val)
const getFlowStatusColor = (val) => getEnumColor(PaymentFlowStatusEnum, val)
const getDeductionLabel = (val) => getEnumLabel(DeductionTypeEnum, val)
const getDeductionColor = (val) => {
  const item = Object.values(DeductionTypeEnum).find(d => d.value === val)
  return item ? item.color : '#909399'
}
const getFeeTypeLabel = (val) => getEnumLabel(FeeTypeEnum, val)

const getChannelIcon = (val) => {
  const iconMap = { wechat: ChatDotRound, alipay: Aim, unionpay: CreditCard, credit_card: CreditCard, balance: Wallet }
  return iconMap[val] || Wallet
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handlePageChange = () => {
}

const handleViewDetail = async (row) => {
  try {
    const detail = await getFlowDetail(row.id)
    currentFlow.value = detail || row
  } catch {
    currentFlow.value = row
  }
  detailDialogVisible.value = true
}

const handleRefund = (row) => {
  currentFlow.value = row
  refundForm.amount = String(row.actualAmount)
  refundForm.reason = ''
  refundDialogVisible.value = true
}

const submitRefund = async () => {
  if (!refundFormRef.value) return
  try {
    await refundFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单填写')
    return
  }
  const amt = Number(refundForm.amount)
  if (amt > Number(currentFlow.value.actualAmount)) {
    ElMessage.warning('退款金额不能超过实付金额')
    return
  }
  refundLoading.value = true
  try {
    ElMessage.success('退款申请已提交')
    refundDialogVisible.value = false
    fetchData()
  } catch (err) {
    ElMessage.error(err.message || '退款申请失败')
  } finally {
    refundLoading.value = false
  }
}

onMounted(() => {
  loadColWidths()
  fetchData()
})

onUnmounted(() => {
  stopResize()
})

watch(() => props.orderId, () => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.payment-flow-table {
  .search-bar {
    .search-input {
      width: 480px;
    }
  }

  .table-wrapper {
    :deep(.el-table) {
      .flow-no-text {
        font-weight: 500;
        color: #303133;
      }

      .deduction-value {
        color: #67c23a;
      }

      .fee-value {
        color: #e6a23c;
      }

      .actual-value {
        color: #f56c6c;
        font-weight: 600;
      }

      .abnormal-reason-item {
        font-size: 13px;
        color: #ff4d4f;
        line-height: 1.8;
      }
    }
  }

  .flow-detail-expand {
    padding: 12px 20px;
    background: #fafafa;
    border-radius: 6px;
    margin: 8px 0;

    .detail-section {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 12px 0;
        padding-left: 8px;
        border-left: 3px solid #409eff;
      }
    }

    .empty-detail {
      padding: 20px 0;
    }
  }

  .flow-detail-content {
    .actual-value {
      color: #f56c6c;
      font-weight: 600;
    }

    .abnormal-reason-item {
      color: #ff4d4f;
      font-size: 13px;
      line-height: 1.8;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
  }
}

.mt-20 {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
