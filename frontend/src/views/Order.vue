<template>
  <div class="order-manage-page">
    <div class="page-header">
      <div class="header-left">
        <h2>订单管理</h2>
        <p class="page-desc">管理所有订单信息，支持编辑、状态调整、批量操作和订单溯源</p>
      </div>
      <div class="header-right">
        <el-input
          v-model="traceKeyword"
          placeholder="订单溯源：输入订单号/手机号快速检索"
          class="trace-input input-glow-focus"
          clearable
          @keyup.enter="openTracePanel"
        >
          <template #prepend>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button @click="openTracePanel">溯源</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="order-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部订单" name="all" />
      <el-tab-pane label="正常订单" name="normal" />
      <el-tab-pane label="异常订单" name="abnormal" />
      <el-tab-pane label="作废订单" name="invalid" />
      <el-tab-pane label="已归档" name="archived" />
    </el-tabs>

    <OrderBatchToolbar
      :selected-count="selectedRows.length"
      :selected-ids="selectedIds"
      @success="handleBatchSuccess"
      @clear-selection="clearSelection"
    />

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable class="input-glow-focus" />
        </el-form-item>
        <el-form-item label="品类">
          <el-select v-model="searchForm.category" placeholder="请选择品类" clearable class="input-glow-focus">
            <el-option v-for="item in getEnumOptions(TravelCategoryEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable class="input-glow-focus">
            <el-option v-for="item in getEnumOptions(OrderStatusEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源渠道">
          <el-select v-model="searchForm.source" placeholder="请选择来源" clearable class="input-glow-focus">
            <el-option v-for="item in getEnumOptions(OrderSourceEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常标记">
          <el-select v-model="searchForm.abnormal" placeholder="请选择" clearable class="input-glow-focus">
            <el-option v-for="item in getEnumOptions(OrderAbnormalEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="锁定状态">
          <el-select v-model="searchForm.isLocked" placeholder="请选择" clearable class="input-glow-focus">
            <el-option v-for="item in getEnumOptions(OrderLockEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="归档状态">
          <el-select v-model="searchForm.isArchived" placeholder="请选择" clearable class="input-glow-focus">
            <el-option v-for="item in getEnumOptions(OrderArchiveEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="下单时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="input-glow-focus"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        border
        stripe
        @selection-change="handleSelectionChange"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="selection" width="55" :selectable="selectable" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="orderNo" label="订单号" min-width="160">
          <template #default="{ row }">
            <el-tooltip :content="row.orderNo" placement="top">
              <span class="order-no-text">{{ row.orderNo }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源渠道" width="100">
          <template #default="{ row }">{{ getEnumLabel(OrderSourceEnum, row.source) }}</template>
        </el-table-column>
        <el-table-column prop="category" label="品类" width="80">
          <template #default="{ row }">{{ getEnumLabel(TravelCategoryEnum, row.category) }}</template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.productName" placement="top">
              <span class="product-text">{{ row.productName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="merchantName" label="商家" min-width="120">
          <template #default="{ row }">
            <el-tooltip :content="row.merchantName" placement="top">
              <span>{{ row.merchantName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="buyer" label="购买人" width="80" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span class="amount-text">¥{{ row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :style="{ background: getEnumColor(OrderStatusEnum, row.status), borderColor: getEnumColor(OrderStatusEnum, row.status) }"
              effect="dark"
              size="small"
            >
              {{ getEnumLabel(OrderStatusEnum, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="abnormal" label="异常标记" width="90">
          <template #default="{ row }">
            <el-tag :type="getEnumType(OrderAbnormalEnum, row.abnormal)" size="small">
              {{ getEnumLabel(OrderAbnormalEnum, row.abnormal) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isLocked" label="锁定状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getEnumType(OrderLockEnum, row.isLocked)" size="small">
              {{ getEnumLabel(OrderLockEnum, row.isLocked) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isArchived" label="归档状态" width="90">
          <template #default="{ row }">
            {{ getEnumLabel(OrderArchiveEnum, row.isArchived) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="canEdit(row)"
              type="primary"
              link
              size="small"
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button
              type="success"
              link
              size="small"
              @click="handleStatusManage(row)"
            >状态管理</el-button>
            <el-button
              type="info"
              link
              size="small"
              @click="handleDetail(row)"
            >详情</el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              link
              size="small"
              @click="handleCancel(row)"
            >取消</el-button>
            <el-button
              v-if="row.status === 2"
              type="danger"
              link
              size="small"
              @click="handleRefund(row)"
            >退款</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <OrderEditDialog
      v-model="editDialogVisible"
      :order-id="currentEditOrderId"
      @success="handleEditSuccess"
    />

    <OrderStatusManager
      v-model="statusDialogVisible"
      :order-id="currentStatusOrderId"
      @success="handleStatusSuccess"
    />

    <el-drawer
      v-model="traceDrawerVisible"
      title="订单溯源"
      size="900px"
      destroy-on-close
    >
      <OrderTracePanel />
    </el-drawer>

    <el-drawer v-model="detailDrawerVisible" title="订单详情" size="600px" destroy-on-close>
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="来源渠道">{{ getEnumLabel(OrderSourceEnum, currentOrder.source) }}</el-descriptions-item>
          <el-descriptions-item label="品类">{{ getEnumLabel(TravelCategoryEnum, currentOrder.category) }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ currentOrder.productName }}</el-descriptions-item>
          <el-descriptions-item label="商家">{{ currentOrder.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="购买人">{{ currentOrder.buyer }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentOrder.phone }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ currentOrder.amount }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag
              :style="{ background: getEnumColor(OrderStatusEnum, currentOrder.status), borderColor: getEnumColor(OrderStatusEnum, currentOrder.status) }"
              effect="dark"
              size="small"
            >
              {{ getEnumLabel(OrderStatusEnum, currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常标记">
            <el-tag :type="getEnumType(OrderAbnormalEnum, currentOrder.abnormal)" size="small">
              {{ getEnumLabel(OrderAbnormalEnum, currentOrder.abnormal) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="锁定状态">
            <el-tag :type="getEnumType(OrderLockEnum, currentOrder.isLocked)" size="small">
              {{ getEnumLabel(OrderLockEnum, currentOrder.isLocked) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="归档状态">
            {{ getEnumLabel(OrderArchiveEnum, currentOrder.isArchived) }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间" :span="2">{{ currentOrder.createTime }}</el-descriptions-item>
        </el-descriptions>

        <h4 class="detail-section-title">流转日志</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(log, idx) in orderFlowLogs"
            :key="idx"
            :timestamp="log.time"
            placement="top"
            :type="getFlowType(log.action)"
          >
            <div class="flow-item">
              <span class="flow-action">{{ log.action }}</span>
              <span class="flow-operator">{{ log.operator }}</span>
              <div v-if="log.remark" class="flow-remark">{{ log.remark }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-drawer>

    <el-dialog v-model="refundDialogVisible" title="退款申请" width="450px" destroy-on-close>
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="订单号">
          <span>{{ refundTargetOrder?.orderNo }}</span>
        </el-form-item>
        <el-form-item label="退款金额">
          <span>¥{{ refundTargetOrder?.amount }}</span>
        </el-form-item>
        <el-form-item label="退款原因" prop="reason">
          <el-input
            v-model="refundForm.reason"
            type="textarea"
            :rows="3"
            class="input-glow-focus"
            placeholder="请输入退款原因（必填）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="refundDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRefundSubmit">确认退款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import {
  getOrderList,
  cancelOrder,
  refundOrder
} from '@/api/order'
import {
  OrderStatusEnum,
  OrderSourceEnum,
  OrderAbnormalEnum,
  OrderLockEnum,
  OrderArchiveEnum,
  TravelCategoryEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions,
  getEnumColor
} from '@/utils/enums'
import OrderEditDialog from '@/components/Order/OrderEditDialog.vue'
import OrderStatusManager from '@/components/Order/OrderStatusManager.vue'
import OrderBatchToolbar from '@/components/Order/OrderBatchToolbar.vue'
import OrderTracePanel from '@/components/Order/OrderTracePanel.vue'

const loading = ref(false)
const tableRef = ref(null)
const activeTab = ref('all')
const traceKeyword = ref('')

const editDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const traceDrawerVisible = ref(false)
const detailDrawerVisible = ref(false)
const refundDialogVisible = ref(false)

const currentEditOrderId = ref(null)
const currentStatusOrderId = ref(null)
const currentOrder = ref(null)
const refundTargetOrder = ref(null)
const refundFormRef = ref(null)

const selectedRows = ref([])

const selectedIds = computed(() => {
  return selectedRows.value.map(row => row.id)
})

const searchForm = reactive({
  orderNo: '',
  category: null,
  status: null,
  source: null,
  abnormal: null,
  isLocked: null,
  isArchived: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { id: 1, orderNo: 'ORD202401150001', source: 'app', category: 1, productName: '北京-上海 经济舱 往返机票', merchantName: '中国国航旗舰店', buyer: '张三', phone: '13800138000', amount: 1280, status: 2, abnormal: 0, isLocked: 0, isArchived: 0, createTime: '2024-01-15 14:30:00' },
  { id: 2, orderNo: 'ORD202401150002', source: 'web', category: 2, productName: '希尔顿酒店 豪华大床房 含双早', merchantName: '希尔顿酒店旗舰店', buyer: '李四', phone: '13800138001', amount: 888, status: 3, abnormal: 0, isLocked: 1, isArchived: 0, createTime: '2024-01-15 12:15:00' },
  { id: 3, orderNo: 'ORD202401150003', source: 'wechat', category: 3, productName: '丰田凯美瑞 舒适版 日租', merchantName: '神州租车', buyer: '王五', phone: '13800138002', amount: 399, status: 1, abnormal: 1, isLocked: 0, isArchived: 0, createTime: '2024-01-15 10:20:00' },
  { id: 4, orderNo: 'ORD202401140004', source: 'app', category: 1, productName: '上海-深圳 商务舱 单程机票', merchantName: '中国国航旗舰店', buyer: '赵六', phone: '13800138003', amount: 980, status: 6, abnormal: 0, isLocked: 0, isArchived: 0, createTime: '2024-01-14 16:00:00' },
  { id: 5, orderNo: 'ORD202401140005', source: 'offline', category: 4, productName: '故宫博物院 成人门票', merchantName: '故宫博物院', buyer: '钱七', phone: '13800138004', amount: 120, status: 3, abnormal: 0, isLocked: 0, isArchived: 1, createTime: '2024-01-14 09:00:00' },
  { id: 6, orderNo: 'ORD202401130006', source: 'third_party', category: 2, productName: '万豪酒店 行政套房 含双早', merchantName: '万豪酒店旗舰店', buyer: '孙八', phone: '13800138005', amount: 1680, status: 5, abnormal: 2, isLocked: 0, isArchived: 0, createTime: '2024-01-13 18:00:00' },
  { id: 7, orderNo: 'ORD202401130007', source: 'app', category: 1, productName: '广州-北京 经济舱 单程', merchantName: '南方航空旗舰店', buyer: '周九', phone: '13800138006', amount: 1580, status: 2, abnormal: 0, isLocked: 0, isArchived: 0, createTime: '2024-01-13 14:30:00' },
  { id: 8, orderNo: 'ORD202401120008', source: 'web', category: 3, productName: '宝马5系 豪华版 日租', merchantName: '一嗨租车', buyer: '吴十', phone: '13800138007', amount: 699, status: 4, abnormal: 0, isLocked: 0, isArchived: 1, createTime: '2024-01-12 10:00:00' }
])

const orderFlowLogs = ref([])

const flowLogsMap = {
  1: [
    { time: '2024-01-15 14:30:00', action: '创建订单', operator: '张三', remark: '用户下单' },
    { time: '2024-01-15 14:35:00', action: '支付成功', operator: '系统', remark: '微信支付 ¥1280' }
  ],
  2: [
    { time: '2024-01-15 12:15:00', action: '创建订单', operator: '李四', remark: '用户下单' },
    { time: '2024-01-15 12:20:00', action: '支付成功', operator: '系统', remark: '支付宝支付 ¥888' },
    { time: '2024-01-16 10:00:00', action: '确认完成', operator: '管理员', remark: '用户确认入住' }
  ],
  3: [
    { time: '2024-01-15 10:20:00', action: '创建订单', operator: '王五', remark: '用户下单' }
  ],
  4: [
    { time: '2024-01-14 16:00:00', action: '创建订单', operator: '赵六', remark: '用户下单' },
    { time: '2024-01-14 16:05:00', action: '支付成功', operator: '系统', remark: '微信支付 ¥980' },
    { time: '2024-01-14 18:00:00', action: '申请退款', operator: '赵六', remark: '行程变更，需要退款' },
    { time: '2024-01-15 09:00:00', action: '退款完成', operator: '财务', remark: '退款已到账' }
  ]
}

const refundForm = reactive({ reason: '' })

const refundRules = {
  reason: [{ required: true, message: '请输入退款原因', trigger: 'blur' }]
}

const getFlowType = (action) => {
  if (action.includes('创建')) return 'primary'
  if (action.includes('支付') || action.includes('完成')) return 'success'
  if (action.includes('退款')) return 'warning'
  if (action.includes('取消')) return 'danger'
  return 'info'
}

const canEdit = (row) => {
  if (row.abnormal === OrderAbnormalEnum.INVALID.value) return false
  if (row.isLocked === OrderLockEnum.LOCKED.value) return false
  if (row.isArchived === OrderArchiveEnum.ARCHIVED.value) return false
  if (row.status === OrderStatusEnum.PENDING_PAYMENT.value || row.status === OrderStatusEnum.PAID.value) {
    return ['app', 'web', 'wechat'].includes(row.source)
  }
  return false
}

const selectable = (row) => {
  return row.isArchived !== OrderArchiveEnum.ARCHIVED.value
}

const tableRowClassName = ({ row }) => {
  if (selectedRows.value.some(r => r.id === row.id)) {
    return 'row-selected-highlight'
  }
  return ''
}

const handleTabChange = () => {
  pagination.page = 1
  fetchData()
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.orderNo = ''
  searchForm.category = null
  searchForm.status = null
  searchForm.source = null
  searchForm.abnormal = null
  searchForm.isLocked = null
  searchForm.isArchived = null
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

const clearSelection = () => {
  selectedRows.value = []
  if (tableRef.value) {
    tableRef.value.clearSelection()
  }
}

const handleEdit = (row) => {
  currentEditOrderId.value = row.id
  editDialogVisible.value = true
}

const handleEditSuccess = () => {
  ElMessage.success('订单更新成功')
  fetchData()
}

const handleStatusManage = (row) => {
  currentStatusOrderId.value = row.id
  statusDialogVisible.value = true
}

const handleStatusSuccess = () => {
  fetchData()
}

const handleDetail = (row) => {
  currentOrder.value = row
  orderFlowLogs.value = flowLogsMap[row.id] || [
    { time: row.createTime, action: '创建订单', operator: row.buyer, remark: '用户下单' }
  ]
  detailDrawerVisible.value = true
}

const handleCancel = (row) => {
  ElMessageBox.confirm(`确定要取消订单 "${row.orderNo}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await cancelOrder(row.id)
      ElMessage.success('取消成功')
      fetchData()
    } catch (err) {
      ElMessage.error(err.message || '取消失败')
    }
  }).catch(() => {})
}

const handleRefund = (row) => {
  refundTargetOrder.value = row
  refundForm.reason = ''
  refundDialogVisible.value = true
}

const handleRefundSubmit = async () => {
  if (!refundFormRef.value) return
  try {
    await refundFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单填写')
    return
  }

  try {
    await refundOrder(refundTargetOrder.value.id)
    ElMessage.success('退款申请已提交')
    refundDialogVisible.value = false
    fetchData()
  } catch (err) {
    ElMessage.error(err.message || '退款申请失败')
  }
}

const handleBatchSuccess = (action) => {
  const actionMap = {
    confirm: '批量履约成功',
    abnormal: '批量标记异常成功',
    archive: '批量归档成功'
  }
  ElMessage.success(actionMap[action] || '操作成功')
  fetchData()
}

const openTracePanel = () => {
  traceDrawerVisible.value = true
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    let data = [...tableData.value]

    if (activeTab.value === 'normal') {
      data = data.filter(item => item.abnormal === OrderAbnormalEnum.NORMAL.value)
    } else if (activeTab.value === 'abnormal') {
      data = data.filter(item => item.abnormal === OrderAbnormalEnum.ABNORMAL.value)
    } else if (activeTab.value === 'invalid') {
      data = data.filter(item => item.abnormal === OrderAbnormalEnum.INVALID.value)
    } else if (activeTab.value === 'archived') {
      data = data.filter(item => item.isArchived === OrderArchiveEnum.ARCHIVED.value)
    }

    if (searchForm.orderNo) {
      data = data.filter(item => item.orderNo.toLowerCase().includes(searchForm.orderNo.toLowerCase()))
    }
    if (searchForm.category !== null) {
      data = data.filter(item => item.category === searchForm.category)
    }
    if (searchForm.status !== null) {
      data = data.filter(item => item.status === searchForm.status)
    }
    if (searchForm.source) {
      data = data.filter(item => item.source === searchForm.source)
    }
    if (searchForm.abnormal !== null) {
      data = data.filter(item => item.abnormal === searchForm.abnormal)
    }
    if (searchForm.isLocked !== null) {
      data = data.filter(item => item.isLocked === searchForm.isLocked)
    }
    if (searchForm.isArchived !== null) {
      data = data.filter(item => item.isArchived === searchForm.isArchived)
    }

    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    const pagedData = data.slice(start, end)

    tableData.value = pagedData
    pagination.total = data.length
    loading.value = false
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.order-manage-page {
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;

    .header-left {
      h2 {
        font-size: 22px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #303133;
      }

      .page-desc {
        font-size: 14px;
        color: #909399;
        margin: 0;
      }
    }

    .header-right {
      .trace-input {
        width: 400px;
      }
    }
  }

  .order-tabs {
    margin-bottom: 16px;

    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
  }

  .search-form {
    margin-bottom: 16px;
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  }

  .table-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    :deep(.el-table) {
      .order-no-text,
      .product-text {
        font-weight: 500;
        color: #303133;
      }

      .amount-text {
        color: #f56c6c;
        font-weight: 600;
      }
    }

    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }

  .detail-section-title {
    font-size: 15px;
    font-weight: 600;
    color: #333;
    margin: 20px 0 12px;
  }

  .flow-item {
    .flow-action {
      font-weight: 600;
      color: #333;
    }

    .flow-operator {
      margin-left: 12px;
      font-size: 12px;
      color: #999;
    }

    .flow-remark {
      margin-top: 4px;
      font-size: 12px;
      color: #666;
      padding: 4px 8px;
      background: #f5f7fa;
      border-radius: 4px;
    }
  }
}
</style>
