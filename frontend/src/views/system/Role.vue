<template>
  <div class="role-manage">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增角色</el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" />
        <el-table-column prop="code" label="角色编码" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handlePermission(row)">权限配置</el-button>
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
import { Plus } from '@element-plus/icons-vue'

const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const tableData = ref([
  {
    id: 1,
    name: '超级管理员',
    code: 'admin',
    description: '系统超级管理员，拥有所有权限',
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '普通用户',
    code: 'user',
    description: '普通用户，拥有基础操作权限',
    status: 1,
    createTime: '2024-01-01 00:00:00'
  }
])

const handleAdd = () => {
  ElMessage.info('新增角色功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑角色: ${row.name}`)
}

const handlePermission = (row) => {
  ElMessage.info(`配置角色权限: ${row.name}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除角色 "${row.name}" 吗？`, '提示', {
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
