<template>
  <div class="hotel-manage">
    <div class="page-header">
      <h2>酒店管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增酒店</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="酒店名称">
          <el-input v-model="searchForm.name" placeholder="请输入酒店名称" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="searchForm.city" placeholder="请输入城市" clearable />
        </el-form-item>
        <el-form-item label="星级">
          <el-select v-model="searchForm.star" placeholder="请选择星级" clearable>
            <el-option label="二星级" :value="2" />
            <el-option label="三星级" :value="3" />
            <el-option label="四星级" :value="4" />
            <el-option label="五星级" :value="5" />
          </el-select>
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
        <el-table-column prop="name" label="酒店名称" />
        <el-table-column prop="city" label="城市" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="star" label="星级">
          <template #default="{ row }">{{ row.star }}星级</template>
        </el-table-column>
        <el-table-column prop="price" label="价格">
          <template #default="{ row }">¥{{ row.price }}起</template>
        </el-table-column>
        <el-table-column prop="rooms" label="房间数" />
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
  name: '',
  city: '',
  star: null,
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
    name: '希尔顿酒店',
    city: '北京',
    address: '北京市朝阳区建国路88号',
    star: 5,
    price: 888,
    rooms: 200,
    status: 1
  },
  {
    id: 2,
    name: '万豪酒店',
    city: '上海',
    address: '上海市浦东新区陆家嘴环路1000号',
    star: 5,
    price: 1288,
    rooms: 350,
    status: 1
  }
])

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.city = ''
  searchForm.star = null
  searchForm.status = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  ElMessage.info('新增酒店功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑酒店: ${row.name}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除酒店 "${row.name}" 吗？`, '提示', {
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
