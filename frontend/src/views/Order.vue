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
            <el-option label="机票" :value="1" />
            <el-option label="酒店" :value="2" />
            <el-option label="租车" :value="3" />
            <el-option label="文旅票务" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待支付" :value="1" />
            <el-option label="已支付" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
            <el-option label="已退款" :value="5" />
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
          <template #default="{ row }">{{ getCategory(row.category) }}</template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="buyer" label="购买人" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="amount" label="金额">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { OrderStatusEnum, TravelCategoryEnum, getEnumLabel, getEnumType } from '@/utils/enums'

const loading = ref(false)

const searchForm = reactive({
  orderNo: '',
  category: null,
  status: null,
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  {
    id: 1,
    orderNo: 'ORD202401150001',
    category: 1,
    productName: '北京-上海 机票',
    buyer: '张三',
    phone: '13800138000',
    amount: 1280,
    status: 2,
    createTime: '2024-01-15 14:30:00'
  },
  {
    id: 2,
    orderNo: 'ORD202401150002',
    category: 2,
    productName: '希尔顿酒店 豪华房',
    buyer: '李四',
    phone: '13800138001',
    amount: 888,
    status: 3,
    createTime: '2024-01-15 12:15:00'
  },
  {
    id: 3,
    orderNo: 'ORD202401150003',
    category: 3,
    productName: '租车 丰田凯美瑞',
    buyer: '王五',
    phone: '13800138002',
    amount: 399,
    status: 1,
    createTime: '2024-01-15 10:20:00'
  }
])

const getCategory = (category) => getEnumLabel(TravelCategoryEnum, category)
const getStatusLabel = (status) => getEnumLabel(OrderStatusEnum, status)
const getStatusType = (status) => getEnumType(OrderStatusEnum, status)

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.orderNo = ''
  searchForm.category = null
  searchForm.status = null
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleDetail = (row) => {
  ElMessage.info(`查看订单详情: ${row.orderNo}`)
}

const handleCancel = (row) => {
  ElMessageBox.confirm(`确定要取消订单 "${row.orderNo}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      ElMessage.success('取消成功')
      fetchData()
    })
    .catch(() => {})
}

const handleRefund = (row) => {
  ElMessageBox.confirm(`确定要对订单 "${row.orderNo}" 进行退款吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      ElMessage.success('退款成功')
      fetchData()
    })
    .catch(() => {})
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
