<template>
  <div class="log-page">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="模块">
          <el-select v-model="filterForm.module" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in moduleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="动作">
          <el-select v-model="filterForm.action" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in actionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="操作人/目标"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <DataTable
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        :show-action="false"
        @refresh="fetchList"
      >
        <el-table-column prop="username" label="操作人" width="100" align="center" />
        <el-table-column prop="module" label="模块" width="100" align="center">
          <template #default="{ row }">
            {{ moduleLabel[row.module] || row.module }}
          </template>
        </el-table-column>
        <el-table-column prop="action" label="动作" width="100" align="center">
          <template #default="{ row }">
            {{ actionLabel[row.action] || row.action }}
          </template>
        </el-table-column>
        <el-table-column prop="target" label="目标" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作结果" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.result === 'success' ? 'success' : 'danger'" size="small">
              {{ row.result === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="130" align="center" />
        <el-table-column prop="createdAt" label="时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { DataTable } from '@/components/business'
import { getLogList } from '@/api/log'
import type { OperationLog } from '@/types'

const loading = ref(false)
const tableData = ref<OperationLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const dateRange = ref<[string, string] | null>(null)

const filterForm = reactive({
  module: '',
  action: '',
  keyword: ''
})

const moduleOptions = [
  { value: 'resource', label: '资源管理' },
  { value: 'audit', label: '审核管理' },
  { value: 'user', label: '用户管理' },
  { value: 'violation', label: '违规管理' },
  { value: 'appeal', label: '申诉管理' },
  { value: 'system', label: '系统管理' }
]

const actionOptions = [
  { value: 'create', label: '创建' },
  { value: 'update', label: '更新' },
  { value: 'delete', label: '删除' },
  { value: 'approve', label: '通过' },
  { value: 'reject', label: '拒绝' },
  { value: 'handle', label: '处置' },
  { value: 'review', label: '复核' },
  { value: 'login', label: '登录' },
  { value: 'export', label: '导出' }
]

const moduleLabel = moduleOptions.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {} as Record<string, string>)

const actionLabel = actionOptions.reduce((acc, item) => {
  acc[item.value] = item.label
  return acc
}, {} as Record<string, string>)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getLogList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      module: filterForm.module || undefined,
      action: filterForm.action || undefined,
      startDate: dateRange.value?.[0] || undefined,
      endDate: dateRange.value?.[1] || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取日志列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.module = ''
  filterForm.action = ''
  filterForm.keyword = ''
  dateRange.value = null
  page.value = 1
  fetchList()
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.log-page {
  .filter-card {
    margin-bottom: 16px;
  }
}
</style>
