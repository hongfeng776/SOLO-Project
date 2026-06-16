<template>
  <div class="merchant-manage">
    <div class="page-header">
      <h2>商家管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增商家</el-button>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm" @submit.prevent>
        <el-form-item label="商家名称">
          <el-input v-model="searchForm.name" placeholder="请输入商家名称" clearable />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="searchForm.contact" placeholder="请输入联系人" clearable />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.auditStatus" placeholder="请选择审核状态" clearable>
            <el-option label="待审核" :value="1" />
            <el-option label="已通过" :value="2" />
            <el-option label="已拒绝" :value="3" />
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
        <el-table-column prop="name" label="商家名称" />
        <el-table-column prop="contact" label="联系人" />
        <el-table-column prop="phone" label="联系电话" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="businessType" label="业务类型">
          <template #default="{ row }">{{ getBusinessType(row.businessType) }}</template>
        </el-table-column>
        <el-table-column prop="auditStatus" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusType(row.auditStatus)" size="small">
              {{ getAuditStatusLabel(row.auditStatus) }}
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
        <el-table-column prop="createTime" label="注册时间" width="180" />
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.auditStatus === 1"
              type="success"
              link
              size="small"
              @click="handleAudit(row, 2)"
            >通过</el-button>
            <el-button
              v-if="row.auditStatus === 1"
              type="danger"
              link
              size="small"
              @click="handleAudit(row, 3)"
            >拒绝</el-button>
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
import { AuditStatusEnum, getEnumLabel, getEnumType } from '@/utils/enums'

const loading = ref(false)

const searchForm = reactive({
  name: '',
  contact: '',
  auditStatus: null,
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
    name: '中国国航旗舰店',
    contact: '王经理',
    phone: '13800138000',
    email: 'airchina@example.com',
    businessType: 1,
    auditStatus: 2,
    status: 1,
    createTime: '2024-01-01 00:00:00'
  },
  {
    id: 2,
    name: '希尔顿酒店旗舰店',
    contact: '李经理',
    phone: '13800138001',
    email: 'hilton@example.com',
    businessType: 2,
    auditStatus: 1,
    status: 1,
    createTime: '2024-01-10 10:00:00'
  }
])

const getBusinessType = (type) => {
  const map = { 1: '机票', 2: '酒店', 3: '租车', 4: '文旅票务' }
  return map[type] || '未知'
}

const getAuditStatusLabel = (status) => getEnumLabel(AuditStatusEnum, status)
const getAuditStatusType = (status) => getEnumType(AuditStatusEnum, status)

const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.contact = ''
  searchForm.auditStatus = null
  searchForm.status = null
  pagination.page = 1
  fetchData()
}

const handleAdd = () => {
  ElMessage.info('新增商家功能')
}

const handleEdit = (row) => {
  ElMessage.info(`编辑商家: ${row.name}`)
}

const handleAudit = (row, status) => {
  const action = status === 2 ? '通过' : '拒绝'
  ElMessageBox.confirm(`确定要${action}商家 "${row.name}" 的审核吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      ElMessage.success(`审核${action}成功`)
      fetchData()
    })
    .catch(() => {})
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除商家 "${row.name}" 吗？`, '提示', {
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
