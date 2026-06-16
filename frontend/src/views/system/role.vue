<template>
  <div class="system-role">
    <CommonTable
      :loading="loading"
      :data="tableData"
      :total="total"
      :page="queryParams.page"
      :page-size="queryParams.pageSize"
      :show-search="true"
      :search-fields="searchFields"
      @search="handleSearch"
      @reset="handleReset"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #toolbar>
        <el-button type="primary">
          <el-icon><Plus /></el-icon>
          新增角色
        </el-button>
      </template>

      <el-table-column prop="name" label="角色名称" width="150" />
      <el-table-column prop="code" label="角色编码" width="150" />
      <el-table-column prop="description" label="角色描述" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="170">
        <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small">编辑</el-button>
          <el-button type="success" link size="small">分配权限</el-button>
          <el-button type="danger" link size="small">删除</el-button>
        </template>
      </el-table-column>
    </CommonTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CommonTable from '@/components/CommonTable/index.vue'
import { formatDate } from '@/utils/format'

const loading = ref(false)
const tableData = ref([
  { id: 1, name: '超级管理员', code: 'super_admin', description: '拥有系统所有权限', status: 1, createTime: '2024-01-01 00:00:00' },
  { id: 2, name: '运营管理员', code: 'operation_admin', description: '负责订单、运力等运营管理', status: 1, createTime: '2024-01-01 00:00:00' },
  { id: 3, name: '财务管理员', code: 'finance_admin', description: '负责财务对账和结算', status: 1, createTime: '2024-01-01 00:00:00' },
  { id: 4, name: '客服人员', code: 'customer_service', description: '处理用户投诉和咨询', status: 1, createTime: '2024-01-01 00:00:00' }
])
const total = ref(4)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  name: ''
})

const searchFields = [
  { prop: 'name', label: '角色名称', type: 'input' }
]

const getList = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

const handleSearch = (params: any) => {
  Object.assign(queryParams, params)
  getList()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 10
  getList()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  getList()
}

const handleSizeChange = (size: number) => {
  queryParams.pageSize = size
  queryParams.page = 1
  getList()
}

onMounted(() => {
  getList()
})
</script>
