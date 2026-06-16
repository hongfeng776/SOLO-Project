<template>
  <div class="system-log">
    <div class="page-header">
      <h2>系统日志</h2>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="操作人">
          <el-input v-model="searchForm.operator" placeholder="请输入操作人" clearable />
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select v-model="searchForm.module" placeholder="请选择模块" clearable>
            <el-option label="用户管理" value="user" />
            <el-option label="角色管理" value="role" />
            <el-option label="产品管理" value="product" />
            <el-option label="订单管理" value="order" />
            <el-option label="商家管理" value="merchant" />
            <el-option label="优惠券管理" value="coupon" />
            <el-option label="审批中心" value="approval" />
            <el-option label="系统设置" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
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
          <el-button type="success" :icon="Download" @click="handleExport">导出日志</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ moduleMap[row.module] || row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="target" label="对象" min-width="150" show-overflow-tooltip />
        <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="140" />
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
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'

const loading = ref(false)
const moduleMap = {
  user: '用户管理',
  role: '角色管理',
  product: '产品管理',
  order: '订单管理',
  merchant: '商家管理',
  coupon: '优惠券管理',
  approval: '审批中心',
  system: '系统设置'
}

const searchForm = reactive({
  operator: '',
  module: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  { time: '2024-01-15 14:30:22', operator: 'admin', module: 'order', action: '查看详情', target: 'ORD202401150001', detail: '查看订单详情', ip: '192.168.1.100' },
  { time: '2024-01-15 14:25:10', operator: 'admin', module: 'merchant', action: '审核通过', target: '希尔顿酒店旗舰店', detail: '商家入驻审核通过', ip: '192.168.1.100' },
  { time: '2024-01-15 13:40:05', operator: 'admin', module: 'product', action: '新增', target: 'CA8888航班', detail: '新增机票产品', ip: '192.168.1.100' },
  { time: '2024-01-15 12:00:00', operator: 'admin', module: 'coupon', action: '发放', target: '新春满减券', detail: '向全部用户发放优惠券500张', ip: '192.168.1.100' },
  { time: '2024-01-15 10:20:15', operator: 'admin', module: 'approval', action: '审批拒绝', target: 'APR202401130001', detail: '拒绝原因：资料不齐全', ip: '192.168.1.100' },
  { time: '2024-01-15 09:00:00', operator: 'system', module: 'system', action: '定时任务', target: '数据备份', detail: '每日自动数据备份完成', ip: '127.0.0.1' },
  { time: '2024-01-14 18:30:45', operator: 'admin', module: 'order', action: '退款', target: 'ORD202401140003', detail: '退款原因：行程变更', ip: '192.168.1.100' },
  { time: '2024-01-14 16:10:30', operator: 'admin', module: 'user', action: '编辑', target: '用户ID:5', detail: '修改用户角色为操作员', ip: '192.168.1.100' }
])

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.operator = ''
  searchForm.module = ''
  searchForm.dateRange = []
  pagination.page = 1
  fetchData()
}

const handleExport = () => {
  ElMessage.success('日志导出功能')
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    pagination.total = 8
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>
