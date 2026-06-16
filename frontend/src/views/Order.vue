<template>
  <div class="order-manage">
    <div class="page-header">
      <h2>订单管理</h2>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNo" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="品类">
          <el-select v-model="searchForm.category" placeholder="请选择品类" clearable>
            <el-option v-for="item in getEnumOptions(TravelCategoryEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in getEnumOptions(OrderStatusEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="商家">
          <el-select v-model="searchForm.merchantId" placeholder="请选择商家" clearable filterable>
            <el-option v-for="m in merchantOptions" :key="m.id" :label="m.name" :value="m.id" />
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
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="orderNo" label="订单号" min-width="160" />
        <el-table-column prop="category" label="品类">
          <template #default="{ row }">{{ getEnumLabel(TravelCategoryEnum, row.category) }}</template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="merchantName" label="商家" min-width="120" show-overflow-tooltip />
        <el-table-column prop="buyer" label="购买人" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnumType(OrderStatusEnum, row.status)" size="small">
              {{ getEnumLabel(OrderStatusEnum, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
            <el-button
              v-if="row.status === 1"
              type="warning"
              link
              size="small"
              @click="handleCancel(row)"
            >取消订单</el-button>
            <el-button
              v-if="row.status === 2"
              type="success"
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

    <el-drawer v-model="drawerVisible" title="订单详情" size="600px" destroy-on-close>
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="品类">{{ getEnumLabel(TravelCategoryEnum, currentOrder.category) }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ currentOrder.productName }}</el-descriptions-item>
          <el-descriptions-item label="商家">{{ currentOrder.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="购买人">{{ currentOrder.buyer }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentOrder.phone }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ currentOrder.amount }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getEnumType(OrderStatusEnum, currentOrder.status)" size="small">
              {{ getEnumLabel(OrderStatusEnum, currentOrder.status) }}
            </el-tag>
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
          <el-input v-model="refundForm.reason" type="textarea" :rows="3" placeholder="请输入退款原因（必填）" />
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { OrderStatusEnum, TravelCategoryEnum, getEnumLabel, getEnumType, getEnumOptions } from '@/utils/enums'

const loading = ref(false)
const drawerVisible = ref(false)
const refundDialogVisible = ref(false)
const currentOrder = ref(null)
const refundTargetOrder = ref(null)
const refundFormRef = ref(null)

const searchForm = reactive({
  orderNo: '',
  category: null,
  status: null,
  merchantId: null,
  dateRange: []
})

const merchantOptions = ref([
  { id: 1, name: '中国国航旗舰店' },
  { id: 2, name: '希尔顿酒店旗舰店' },
  { id: 3, name: '神州租车' },
  { id: 4, name: '故宫博物院' }
])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { id: 1, orderNo: 'ORD202401150001', category: 1, productName: '北京-上海 机票', merchantName: '中国国航旗舰店', buyer: '张三', phone: '13800138000', amount: 1280, status: 2, createTime: '2024-01-15 14:30:00' },
  { id: 2, orderNo: 'ORD202401150002', category: 2, productName: '希尔顿酒店 豪华房', merchantName: '希尔顿酒店旗舰店', buyer: '李四', phone: '13800138001', amount: 888, status: 3, createTime: '2024-01-15 12:15:00' },
  { id: 3, orderNo: 'ORD202401150003', category: 3, productName: '租车 丰田凯美瑞', merchantName: '神州租车', buyer: '王五', phone: '13800138002', amount: 399, status: 1, createTime: '2024-01-15 10:20:00' },
  { id: 4, orderNo: 'ORD202401150004', category: 1, productName: '上海-深圳 机票', merchantName: '中国国航旗舰店', buyer: '赵六', phone: '13800138003', amount: 980, status: 5, createTime: '2024-01-14 16:00:00' }
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
    { time: '2024-01-15 09:00:00', action: '退款中', operator: '管理员', remark: '退款审核通过，处理中' }
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

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.orderNo = ''
  searchForm.category = null
  searchForm.status = null
  searchForm.merchantId = null
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleDetail = (row) => {
  currentOrder.value = row
  orderFlowLogs.value = flowLogsMap[row.id] || []
  drawerVisible.value = true
}

const handleCancel = (row) => {
  ElMessageBox.confirm(`确定要取消订单 "${row.orderNo}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('取消成功')
    fetchData()
  }).catch(() => {})
}

const handleRefund = (row) => {
  refundTargetOrder.value = row
  refundForm.reason = ''
  refundDialogVisible.value = true
}

const handleRefundSubmit = async () => {
  if (!refundFormRef.value) return
  await refundFormRef.value.validate((valid) => {
    if (valid) {
      ElMessage.success('退款申请已提交')
      refundDialogVisible.value = false
      fetchData()
    }
  })
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    pagination.total = 4
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
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
</style>
