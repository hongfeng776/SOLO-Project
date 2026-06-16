<template>
  <div class="ticket-manage">
    <div class="page-header">
      <h2>文旅票务</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增票务</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="景点名称">
          <el-input v-model="searchForm.name" placeholder="请输入景点名称" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="searchForm.city" placeholder="请输入城市" clearable />
        </el-form-item>
        <el-form-item label="票种">
          <el-select v-model="searchForm.type" placeholder="请选择票种" clearable>
            <el-option label="成人票" :value="1" />
            <el-option label="儿童票" :value="2" />
            <el-option label="老人票" :value="3" />
            <el-option label="学生票" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
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
        <el-table-column prop="name" label="景点名称" />
        <el-table-column prop="city" label="城市" />
        <el-table-column prop="ticketType" label="票种">
          <template #default="{ row }">{{ getTicketType(row.ticketType) }}</template>
        </el-table-column>
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" />
        <el-table-column prop="validDays" label="有效期">
          <template #default="{ row }">{{ row.validDays }}天</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '上架' : '下架' }}
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
  name: '',
  city: '',
  type: null,
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
    name: '故宫博物院',
    city: '北京',
    ticketType: 1,
    price: 60,
    stock: 1000,
    validDays: 1,
    status: 1
  },
  {
    id: 2,
    name: '上海迪士尼乐园',
    city: '上海',
    ticketType: 1,
    price: 435,
    stock: 500,
    validDays: 1,
    status: 1
  }
])

const getTicketType = (type) => {
  const map = { 1: '成人票', 2: '儿童票', 3: '老人票', 4: '学生票' }
  return map[type] || '未知'
}

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.city = ''
  searchForm.type = null
  searchForm.status = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  ElMessage.info('新增票务功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑票务: ${row.name}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除票务 "${row.name}" 吗？`, '提示', {
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
