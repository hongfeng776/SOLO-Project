<template>
  <div class="car-manage">
    <div class="page-header">
      <h2>租车管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增车辆</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="品牌">
          <el-input v-model="searchForm.brand" placeholder="请输入品牌" clearable />
        </el-form-item>
        <el-form-item label="车型">
          <el-input v-model="searchForm.model" placeholder="请输入车型" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="searchForm.city" placeholder="请输入城市" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="可租" :value="1" />
            <el-option label="已租" :value="2" />
            <el-option label="维护中" :value="0" />
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
        <el-table-column prop="brand" label="品牌" />
        <el-table-column prop="model" label="车型" />
        <el-table-column prop="plateNo" label="车牌号" />
        <el-table-column prop="city" label="所在城市" />
        <el-table-column prop="seats" label="座位数" />
        <el-table-column prop="transmission" label="变速箱">
          <template #default="{ row }">
            {{ row.transmission === 1 ? '自动' : '手动' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="日租价">
          <template #default="{ row }">¥{{ row.price }}/天</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
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
  brand: '',
  model: '',
  city: '',
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
    brand: '丰田',
    model: '凯美瑞',
    plateNo: '京A12345',
    city: '北京',
    seats: 5,
    transmission: 1,
    price: 399,
    status: 1
  },
  {
    id: 2,
    brand: '大众',
    model: '帕萨特',
    plateNo: '沪B67890',
    city: '上海',
    seats: 5,
    transmission: 1,
    price: 359,
    status: 2
  }
])

const getStatusLabel = (status) => {
  const map = { 0: '维护中', 1: '可租', 2: '已租' }
  return map[status] || '未知'
}

const getStatusType = (status) => {
  const map = { 0: 'info', 1: 'success', 2: 'warning' }
  return map[status] || 'info'
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.brand = ''
  searchForm.model = ''
  searchForm.city = ''
  searchForm.status = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  ElMessage.info('新增车辆功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑车辆: ${row.brand} ${row.model}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除车辆 "${row.brand} ${row.model}" 吗？`, '提示', {
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
