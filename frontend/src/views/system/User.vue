<template>
  <div class="user-manage">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增用户</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
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
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="roles" label="角色">
          <template #default="{ row }">
            <el-tag v-for="role in row.roles" :key="role" size="small" class="mr-5">
              {{ role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
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
import { CommonStatusEnum, getEnumOptions } from '@/utils/enums'

const loading = ref(false)

const searchForm = reactive({
  username: '',
  phone: '',
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
    username: 'admin',
    nickname: '超级管理员',
    phone: '13800138000',
    email: 'admin@example.com',
    roles: ['admin'],
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    username: 'user',
    nickname: '普通用户',
    phone: '13800138001',
    email: 'user@example.com',
    roles: ['user'],
    status: 1,
    createTime: '2024-01-02 10:00:00'
  }
])

const statusOptions = ref(getEnumOptions(CommonStatusEnum))

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.username = ''
  searchForm.phone = ''
  searchForm.status = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  ElMessage.info('新增用户功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑用户: ${row.username}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户 "${row.username}" 吗？`, '提示', {
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

<style lang="scss" scoped>
.user-manage {
  .mr-5 {
    margin-right: 5px;
  }
}
</style>
