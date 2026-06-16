<template>
  <div class="flight-manage">
    <div class="page-header">
      <h2>机票管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增机票</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="航班号">
          <el-input v-model="searchForm.flightNo" placeholder="请输入航班号" clearable />
        </el-form-item>
        <el-form-item label="出发地">
          <el-input v-model="searchForm.departure" placeholder="请输入出发地" clearable />
        </el-form-item>
        <el-form-item label="目的地">
          <el-input v-model="searchForm.destination" placeholder="请输入目的地" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
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
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="flightNo" label="航班号" />
        <el-table-column prop="airline" label="航空公司" />
        <el-table-column prop="departure" label="出发地" />
        <el-table-column prop="destination" label="目的地" />
        <el-table-column prop="departureTime" label="起飞时间" />
        <el-table-column prop="arrivalTime" label="到达时间" />
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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
import { Plus, Search, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)

const searchForm = reactive({
  flightNo: '',
  departure: '',
  destination: '',
  status: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  {
    id: 1,
    flightNo: 'CA1234',
    airline: '中国国航',
    departure: '北京',
    destination: '上海',
    departureTime: '08:00',
    arrivalTime: '10:30',
    price: 1280,
    stock: 50,
    status: 1
  },
  {
    id: 2,
    flightNo: 'MU5678',
    airline: '东方航空',
    departure: '上海',
    destination: '深圳',
    departureTime: '14:00',
    arrivalTime: '16:30',
    price: 980,
    stock: 30,
    status: 1
  }
])

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.flightNo = ''
  searchForm.departure = ''
  searchForm.destination = ''
  searchForm.status = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  ElMessage.info('新增机票功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑机票: ${row.flightNo}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除航班 "${row.flightNo}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      ElMessage.success('删除成功')
      fetchData()
    })
    .catch(() => {})
}

const fetchData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    pagination.total = 2
  }, 500)
}

onMounted(() => {
  fetchData()
})
</script>
