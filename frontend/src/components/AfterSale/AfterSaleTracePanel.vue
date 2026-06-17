<template>
  <div class="after-sale-trace-panel">
    <div class="toolbar-bar mb-20">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索售后单号/订单号/手机号"
        clearable
        class="search-input"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      >
        <template #prepend>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <div class="toolbar-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="Refresh" @click="handleRefresh">刷新</el-button>
        <el-button
          :type="showBatchToolbar ? 'success' : 'default'"
          @click="toggleBatchToolbar"
        >
          <el-icon v-if="showBatchToolbar"><CircleCheckFilled /></el-icon>
          <el-icon v-else><CircleCloseFilled /></el-icon>
          {{ showBatchToolbar ? '关闭批量操作' : '批量操作' }}
        </el-button>
      </div>
    </div>

    <AfterSaleBatchToolbar
      :visible="showBatchToolbar && selectedRows.length > 0"
      :selected-ids="selectedIds"
      :selected-rows="selectedRows"
      @action-success="handleBatchActionSuccess"
      @clear-selection="clearSelection"
    />

    <div class="table-wrapper">
      <el-table
        ref="tableRef"
        :data="pagedData"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
        :row-class-name="rowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          v-if="showBatchToolbar"
          type="selection"
          width="55"
          :selectable="selectable"
        />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="afterSaleNo" label="售后单号" min-width="170">
          <template #default="{ row }">
            <el-tooltip :content="row.afterSaleNo" placement="top">
              <span class="after-sale-no">{{ row.afterSaleNo }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="orderNo" label="订单号" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.orderNo" placement="top">
              <span>{{ row.orderNo }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="售后类型" width="130">
          <template #default="{ row }">
            <el-tag
              :style="{ background: getTypeColor(row.afterSaleType), borderColor: getTypeColor(row.afterSaleType) }"
              effect="dark"
              size="small"
            >
              {{ getTypeLabel(row.afterSaleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请金额" width="110">
          <template #default="{ row }">
            ¥{{ formatAmount(row.applyAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="违约金" width="100">
          <template #default="{ row }">
            <span class="penalty-value">-¥{{ formatAmount(row.penaltyAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最终退款" width="110">
          <template #default="{ row }">
            <span class="final-refund-value">¥{{ formatAmount(row.finalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :style="{ background: getStatusColor(row.status), borderColor: getStatusColor(row.status) }"
              effect="dark"
              size="small"
            >
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否大额" width="90">
          <template #default="{ row }">
            <span v-if="isLarge(row.finalAmount)" class="refund-large-tag">大额</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" min-width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="handleShowDetail(row)"
            >查看详情</el-button>
            <el-button
              v-if="row.status === AfterSaleStatusEnum.PENDING.value"
              type="success"
              link
              size="small"
              @click="handleAudit(row)"
            >审核</el-button>
            <el-button
              v-if="isAdmin && (row.status === AfterSaleStatusEnum.APPROVED.value || row.status === AfterSaleStatusEnum.REFUNDING.value)"
              type="warning"
              link
              size="small"
              @click="handleExecuteRefund(row)"
            >执行退款</el-button>
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

    <el-dialog
      v-model="detailDialogVisible"
      title="售后详情"
      width="720px"
      destroy-on-close
      custom-class="refund-modal-zoom"
    >
      <div v-if="currentDetail" class="after-sale-detail">
        <div v-if="hasAbnormal(currentDetail)" class="abnormal-warning mb-20">
          <el-alert type="error" :closable="false" show-icon>
            <template #title>
              <el-icon><Warning /></el-icon>
              <span v-for="(msg, idx) in getAbnormalMessages(currentDetail)" :key="idx" class="abnormal-msg">
                {{ msg }}
              </span>
            </template>
          </el-alert>
        </div>

        <div class="detail-section mb-20">
          <h4 class="section-title">
            <el-icon><Ticket /></el-icon>
            售后申请信息
          </h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="售后单号">
              <span class="highlight-text">{{ currentDetail.afterSaleNo }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="订单号">
              {{ currentDetail.orderNo }}
            </el-descriptions-item>
            <el-descriptions-item label="售后类型">
              <el-tag
                :style="{ background: getTypeColor(currentDetail.afterSaleType), borderColor: getTypeColor(currentDetail.afterSaleType) }"
                effect="dark"
                size="small"
              >
                {{ getTypeLabel(currentDetail.afterSaleType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="申请状态">
              <el-tag
                :style="{ background: getStatusColor(currentDetail.status), borderColor: getStatusColor(currentDetail.status) }"
                effect="dark"
                size="small"
              >
                {{ getStatusLabel(currentDetail.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="申请金额">
              ¥{{ formatAmount(currentDetail.applyAmount) }}
            </el-descriptions-item>
            <el-descriptions-item label="违约金">
              <span class="penalty-value">-¥{{ formatAmount(currentDetail.penaltyAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="最终退款">
              <span class="final-refund-value">¥{{ formatAmount(currentDetail.finalAmount) }}</span>
              <span v-if="isLarge(currentDetail.finalAmount)" class="refund-large-tag ml-10">
                大额退款
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="申请人">
              {{ currentDetail.buyer }}
            </el-descriptions-item>
            <el-descriptions-item label="申请时间" :span="2">
              {{ currentDetail.createTime }}
            </el-descriptions-item>
            <el-descriptions-item label="退款原因" :span="2">
              {{ currentDetail.reason }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section mb-20">
          <h4 class="section-title">
            <el-icon><Money /></el-icon>
            关联订单信息
          </h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="商品名称">
              {{ currentDetail.productName }}
            </el-descriptions-item>
            <el-descriptions-item label="订单金额">
              ¥{{ formatAmount(currentDetail.orderAmount) }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ currentDetail.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="支付时间">
              {{ currentDetail.payTime || '--' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section mb-20">
          <AfterSaleAudit :audit-logs="currentDetail.auditLogs || []" />
        </div>

        <div class="detail-section">
          <RefundFlow :flow-list="currentDetail.refundFlows || []" />
        </div>
      </div>
    </el-dialog>

    <div
      :class="['refund-back-top', { visible: showBackTop }]"
      @click="scrollToTop"
    >
      <el-button :icon="ArrowUp" circle type="primary" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, ArrowUp, Warning, Ticket, Money,
  CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  traceAfterSales,
  getAfterSaleDetail,
  executeRefund
} from '@/api/afterSale'
import {
  AfterSaleTypeEnum,
  AfterSaleStatusEnum,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { formatAmount } from '@/utils/payment'
import { isLargeAmount } from '@/utils/refund'
import { useUserStore } from '@/store/modules/user'
import AfterSaleBatchToolbar from './AfterSaleBatchToolbar.vue'
import AfterSaleAudit from './AfterSaleAudit.vue'
import RefundFlow from './RefundFlow.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['row-selection-change'])

const userStore = useUserStore()

const loading = ref(false)
const tableRef = ref(null)
const searchKeyword = ref('')
const showBatchToolbar = ref(false)
const showBackTop = ref(false)

const detailDialogVisible = ref(false)
const currentDetail = ref(null)

const selectedRows = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const mockAfterSales = [
  {
    id: 1, afterSaleNo: 'AS202401150001', orderNo: 'ORD202401150001',
    afterSaleType: 'not_fulfilled', applyAmount: 1280, penaltyAmount: 0, finalAmount: 1280,
    status: 0, createTime: '2024-01-15 16:30:00',
    productName: '北京-上海 经济舱 往返机票', orderAmount: 1280,
    buyer: '张三', phone: '13800138000', payTime: '2024-01-15 14:35:00',
    reason: '行程变更，需要全额退款',
    isLargeAmount: 0, hasDuplicate: 0,
    auditLogs: [
      { action: 'submit', status: 0, operator: '张三', time: '2024-01-15 16:30:00', remark: '用户提交售后申请' }
    ],
    refundFlows: []
  },
  {
    id: 2, afterSaleNo: 'AS202401150002', orderNo: 'ORD202401150002',
    afterSaleType: 'partial_fulfilled', applyAmount: 621.6, penaltyAmount: 44.4, finalAmount: 577.2,
    status: 1, createTime: '2024-01-15 10:20:00',
    productName: '希尔顿酒店 豪华大床房 含双早', orderAmount: 888,
    buyer: '李四', phone: '13800138001', payTime: '2024-01-15 12:20:00',
    reason: '行程提前结束，需要部分退款',
    isLargeAmount: 0, hasDuplicate: 0,
    auditLogs: [
      { action: 'submit', status: 0, operator: '李四', time: '2024-01-15 10:20:00', remark: '用户提交售后申请' },
      { action: 'approve', status: 1, operator: '审核员小王', time: '2024-01-15 11:00:00', remark: '审核通过，可部分退款' }
    ],
    refundFlows: []
  },
  {
    id: 3, afterSaleNo: 'AS202401140003', orderNo: 'ORD202401140004',
    afterSaleType: 'full_fulfilled', applyAmount: 490, penaltyAmount: 98, finalAmount: 392,
    status: 4, createTime: '2024-01-14 18:00:00',
    productName: '上海-深圳 商务舱 单程机票', orderAmount: 980,
    buyer: '赵六', phone: '13800138003', payTime: '2024-01-14 16:05:00',
    reason: '行程变更，申请退款',
    isLargeAmount: 0, hasDuplicate: 0,
    auditLogs: [
      { action: 'submit', status: 0, operator: '赵六', time: '2024-01-14 18:00:00', remark: '用户提交售后申请' },
      { action: 'approve', status: 1, operator: '审核员小王', time: '2024-01-14 18:30:00', remark: '审核通过' },
      { action: 'execute_refund', status: 4, operator: '财务小李', time: '2024-01-14 19:00:00', remark: '退款已到账' }
    ],
    refundFlows: [
      { flowNo: 'RF202401140001', channel: 'credit_card', amount: 392, status: 1, createTime: '2024-01-14 18:35:00', completeTime: '2024-01-14 19:00:00' }
    ]
  },
  {
    id: 4, afterSaleNo: 'AS202401140004', orderNo: 'ORD202401130006',
    afterSaleType: 'not_fulfilled', applyAmount: 5000, penaltyAmount: 0, finalAmount: 5000,
    status: 0, createTime: '2024-01-14 20:00:00',
    productName: '万豪酒店 行政套房 含双早', orderAmount: 5000,
    buyer: '孙八', phone: '13800138005', payTime: '2024-01-13 18:00:00',
    reason: '临时有事，申请全额退款',
    isLargeAmount: 1, hasDuplicate: 0,
    auditLogs: [
      { action: 'submit', status: 0, operator: '孙八', time: '2024-01-14 20:00:00', remark: '用户提交售后申请' }
    ],
    refundFlows: []
  },
  {
    id: 5, afterSaleNo: 'AS202401130005', orderNo: 'ORD202401130006',
    afterSaleType: 'not_fulfilled', applyAmount: 1000, penaltyAmount: 0, finalAmount: 1000,
    status: 2, createTime: '2024-01-13 21:00:00',
    productName: '万豪酒店 行政套房 含双早', orderAmount: 1680,
    buyer: '孙八', phone: '13800138005', payTime: '2024-01-13 18:00:00',
    reason: '服务不好，申请退款',
    isLargeAmount: 0, hasDuplicate: 1,
    auditLogs: [
      { action: 'submit', status: 0, operator: '孙八', time: '2024-01-13 21:00:00', remark: '用户提交售后申请' },
      { action: 'reject', status: 2, operator: '审核员小王', time: '2024-01-13 22:00:00', remark: '该订单已有一笔售后申请，请不要重复申请' }
    ],
    refundFlows: []
  },
  {
    id: 6, afterSaleNo: 'AS202401130006', orderNo: 'ORD202401130007',
    afterSaleType: 'full_fulfilled', applyAmount: 2000, penaltyAmount: 79, finalAmount: 1921,
    status: 3, createTime: '2024-01-13 16:00:00',
    productName: '广州-北京 经济舱 单程', orderAmount: 1580,
    buyer: '周九', phone: '13800138006', payTime: '2024-01-13 14:30:00',
    reason: '航班取消，需要退款',
    isLargeAmount: 0, hasDuplicate: 0, isOverRefund: 1,
    auditLogs: [
      { action: 'submit', status: 0, operator: '周九', time: '2024-01-13 16:00:00', remark: '用户提交售后申请' },
      { action: 'approve', status: 1, operator: '审核员小王', time: '2024-01-13 16:30:00', remark: '审核通过' },
      { action: 'execute_refund', status: 3, operator: '财务小李', time: '2024-01-13 17:00:00', remark: '退款处理中' }
    ],
    refundFlows: [
      { flowNo: 'RF202401130002', channel: 'balance', amount: 1921, status: 0, createTime: '2024-01-13 17:00:00', completeTime: null }
    ]
  }
]

const allData = ref([])

const isAdmin = computed(() => {
  return userStore.roles?.includes('admin') || false
})

const selectedIds = computed(() => {
  return selectedRows.value.map(row => row.id)
})

const filteredData = computed(() => {
  let data = [...allData.value]
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    data = data.filter(item =>
      (item.afterSaleNo && item.afterSaleNo.toLowerCase().includes(kw)) ||
      (item.orderNo && item.orderNo.toLowerCase().includes(kw)) ||
      (item.phone && item.phone.includes(kw))
    )
  }
  return data
})

const pagedData = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  return filteredData.value.slice(start, end)
})

const getTypeLabel = (val) => getEnumLabel(AfterSaleTypeEnum, val)
const getTypeColor = (val) => getEnumColor(AfterSaleTypeEnum, val)
const getStatusLabel = (val) => getEnumLabel(AfterSaleStatusEnum, val)
const getStatusColor = (val) => getEnumColor(AfterSaleStatusEnum, val)

const isLarge = (amount) => isLargeAmount(amount)

const selectable = (row) => {
  return row.status === AfterSaleStatusEnum.PENDING.value
}

const rowClassName = ({ row }) => {
  const classes = []
  if (selectedRows.value.some(r => r.id === row.id)) {
    classes.push('refund-row-selected')
  }
  return classes.join(' ')
}

const hasAbnormal = (row) => {
  return (row.hasDuplicate === 1) || (row.isOverRefund === 1)
}

const getAbnormalMessages = (row) => {
  const msgs = []
  if (row.hasDuplicate === 1) msgs.push('重复售后申请')
  if (row.isOverRefund === 1) msgs.push('超额退款风险')
  return msgs
}

const fetchData = async () => {
  loading.value = true
  try {
    if (searchKeyword.value) {
      const res = await traceAfterSales({ keyword: searchKeyword.value })
      allData.value = res || mockAfterSales.filter(f => {
        const kw = searchKeyword.value.toLowerCase()
        return f.afterSaleNo.toLowerCase().includes(kw) ||
          f.orderNo.toLowerCase().includes(kw) ||
          (f.phone && f.phone.includes(kw))
      })
    } else {
      allData.value = mockAfterSales
    }
    pagination.total = filteredData.value.length
  } catch (err) {
    ElMessage.error(err.message || '加载售后数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleRefresh = () => {
  searchKeyword.value = ''
  pagination.page = 1
  fetchData()
}

const handlePageChange = () => {
}

const toggleBatchToolbar = () => {
  showBatchToolbar.value = !showBatchToolbar.value
  if (!showBatchToolbar.value) {
    clearSelection()
  }
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  emit('row-selection-change', selection)
}

const clearSelection = () => {
  selectedRows.value = []
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
}

const handleBatchActionSuccess = (action) => {
  const actionMap = {
    'approve': '批量审核通过成功',
    'reject': '批量驳回成功',
    'postpone': '批量暂缓成功'
  }
  ElMessage.success(actionMap[action] || '操作成功')
  fetchData()
}

const handleShowDetail = async (row) => {
  try {
    const detail = await getAfterSaleDetail(row.id)
    currentDetail.value = detail || row
  } catch {
    currentDetail.value = row
  }
  detailDialogVisible.value = true
}

const handleAudit = (row) => {
  emit('open-audit-panel', row)
}

const handleExecuteRefund = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确认执行退款 "${row.afterSaleNo}" 吗？退款金额：¥${formatAmount(row.finalAmount)}`,
      '执行退款',
      {
        confirmButtonText: '确认退款',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  try {
    await executeRefund(row.id)
    ElMessage.success('退款执行成功')
    fetchData()
  } catch (err) {
    ElMessage.error(err.message || '退款执行失败')
  }
}

const handleScroll = () => {
  showBackTop.value = window.scrollY > 500
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  fetchData()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss" scoped>
@import '@/styles/afterSale.scss';

.after-sale-trace-panel {
  .toolbar-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .search-input {
      width: 400px;
    }

    .toolbar-actions {
      display: flex;
      gap: 10px;
    }
  }

  .table-wrapper {
    :deep(.el-table) {
      .after-sale-no {
        font-weight: 500;
        color: #303133;
      }

      .penalty-value {
        color: #e6a23c;
      }

      .final-refund-value {
        color: #f56c6c;
        font-weight: 600;
      }

      .text-muted {
        color: #c0c4cc;
      }
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
  }

  .after-sale-detail {
    .detail-section {
      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 12px 0;
        padding-left: 8px;
        border-left: 3px solid #409eff;
      }

      .highlight-text {
        font-weight: 600;
        color: #409eff;
      }

      .penalty-value {
        color: #e6a23c;
        font-weight: 500;
      }

      .final-refund-value {
        color: #f56c6c;
        font-weight: 600;
        font-size: 15px;
      }
    }

    .abnormal-warning {
      :deep(.el-alert) {
        .abnormal-msg {
          margin-left: 8px;
          font-weight: 500;
          animation: pulseWarn 1.5s ease-in-out infinite;

          & + .abnormal-msg::before {
            content: '、';
          }
        }
      }
    }
  }
}

.mt-20 {
  margin-top: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.ml-10 {
  margin-left: 10px;
}

@keyframes pulseWarn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
