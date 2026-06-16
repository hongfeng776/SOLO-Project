<template>
  <div class="order-flow">
    <div class="page-header">
      <h2>订单流转追踪</h2>
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
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getEnumType(OrderStatusEnum, row.status)" size="small">
              {{ getEnumLabel(OrderStatusEnum, row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewFlow(row)">查看流转</el-button>
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

    <el-drawer v-model="drawerVisible" title="订单流转日志" size="550px" destroy-on-close>
      <div v-if="currentOrder" class="order-info">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="品类">{{ getEnumLabel(TravelCategoryEnum, currentOrder.category) }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ currentOrder.productName }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getEnumType(OrderStatusEnum, currentOrder.status)" size="small">
              {{ getEnumLabel(OrderStatusEnum, currentOrder.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="flow-timeline">
        <el-timeline>
          <el-timeline-item
            v-for="(log, idx) in flowLogs"
            :key="idx"
            :timestamp="log.time"
            placement="top"
            :type="getTimelineType(log.action)"
          >
            <div class="flow-node">
              <div class="flow-header">
                <span class="flow-action">{{ log.action }}</span>
                <span class="flow-operator">{{ log.operator }}</span>
              </div>
              <div v-if="log.statusFrom || log.statusTo" class="flow-status">
                <el-tag v-if="log.statusFrom" size="small" :type="getEnumType(OrderStatusEnum, log.statusFrom)">
                  {{ getEnumLabel(OrderStatusEnum, log.statusFrom) }}
                </el-tag>
                <el-icon v-if="log.statusFrom && log.statusTo"><ArrowRight /></el-icon>
                <el-tag v-if="log.statusTo" size="small" :type="getEnumType(OrderStatusEnum, log.statusTo)">
                  {{ getEnumLabel(OrderStatusEnum, log.statusTo) }}
                </el-tag>
              </div>
              <div v-if="log.remark" class="flow-remark">{{ log.remark }}</div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, ArrowRight } from '@element-plus/icons-vue'
import {
  OrderStatusEnum,
  TravelCategoryEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions
} from '@/utils/enums'

const loading = ref(false)
const drawerVisible = ref(false)
const currentOrder = ref(null)

const searchForm = reactive({
  orderNo: '',
  category: null,
  status: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { id: 1, orderNo: 'ORD202401150001', category: 1, productName: '北京-上海 机票', status: 2, createTime: '2024-01-15 14:30:00' },
  { id: 2, orderNo: 'ORD202401150002', category: 2, productName: '希尔顿酒店 豪华房', status: 3, createTime: '2024-01-15 12:15:00' },
  { id: 3, orderNo: 'ORD202401150003', category: 3, productName: '租车 丰田凯美瑞', status: 1, createTime: '2024-01-15 10:20:00' }
])

const flowLogs = ref([])

const flowLogsMap = {
  1: [
    { time: '2024-01-15 14:30:00', action: '创建订单', operator: '张三', statusFrom: null, statusTo: 1, remark: '用户下单' },
    { time: '2024-01-15 14:35:00', action: '支付成功', operator: '系统', statusFrom: 1, statusTo: 2, remark: '微信支付 ¥1280' }
  ],
  2: [
    { time: '2024-01-15 12:15:00', action: '创建订单', operator: '李四', statusFrom: null, statusTo: 1, remark: '用户下单' },
    { time: '2024-01-15 12:20:00', action: '支付成功', operator: '系统', statusFrom: 1, statusTo: 2, remark: '支付宝支付 ¥888' },
    { time: '2024-01-16 10:00:00', action: '确认完成', operator: '管理员', statusFrom: 2, statusTo: 3, remark: '用户确认入住' }
  ],
  3: [
    { time: '2024-01-15 10:20:00', action: '创建订单', operator: '王五', statusFrom: null, statusTo: 1, remark: '用户下单' }
  ]
}

const getTimelineType = (action) => {
  if (action.includes('创建')) return 'primary'
  if (action.includes('支付') || action.includes('完成') || action.includes('确认')) return 'success'
  if (action.includes('取消') || action.includes('退款')) return 'danger'
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
  pagination.page = 1
  fetchData()
}

const handleViewFlow = (row) => {
  currentOrder.value = row
  flowLogs.value = flowLogsMap[row.id] || []
  drawerVisible.value = true
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    pagination.total = 3
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.order-info {
  margin-bottom: 20px;
}

.flow-timeline {
  padding: 10px 0;
}

.flow-node {
  .flow-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;

    .flow-action {
      font-weight: 600;
      color: #333;
    }

    .flow-operator {
      font-size: 12px;
      color: #999;
    }
  }

  .flow-status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
  }

  .flow-remark {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
    padding: 4px 8px;
    background: #f5f7fa;
    border-radius: 4px;
  }
}
</style>
