<template>
  <div class="templates-page">
    <div class="page-header">
      <h2 class="page-title">特效模板</h2>
    </div>

    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="模板名称/描述"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filterForm.categoryId" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" :value="undefined" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增模板</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </div>
      </div>

      <BatchOperation :selected-count="selectedRows.length" @clear="handleClearSelection">
        <el-button size="small" type="success" @click="handleBatchStatus('published')">
          批量上架
        </el-button>
        <el-button size="small" type="warning" @click="handleBatchStatus('offline')">
          批量下架
        </el-button>
      </BatchOperation>

      <DataTable
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        show-selection
        @selection-change="handleSelectionChange"
        @refresh="fetchList"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="模板名称" min-width="200" show-overflow-tooltip />
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.coverUrl"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
            />
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="100" align="center" />
        <el-table-column prop="price" label="价格" width="100" align="center">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="resource" />
          </template>
        </el-table-column>
        <el-table-column prop="useCount" label="使用次数" width="100" align="center" />
        <el-table-column prop="authorName" label="作者" width="100" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataTable, StatusTag, BatchOperation } from '@/components/business'
import { ResourceStatusLabel } from '@/constants'
import { getTemplateList, batchDeleteTemplate } from '@/api/template'
import type { Template } from '@/types'

const loading = ref(false)
const tableData = ref<Template[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRows = ref<Template[]>([])

const filterForm = reactive({
  keyword: '',
  status: '',
  categoryId: undefined as number | undefined
})

const statusOptions = Object.entries(ResourceStatusLabel).map(([value, label]) => ({
  value,
  label
}))

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getTemplateList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      status: filterForm.status || undefined,
      categoryId: filterForm.categoryId
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取模板列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.categoryId = undefined
  page.value = 1
  fetchList()
}

const handleSelectionChange = (selection: Template[]) => {
  selectedRows.value = selection
}

const handleClearSelection = () => {
  selectedRows.value = []
}

const handleAdd = () => {
  ElMessage.info('新增模板功能开发中')
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个模板吗？`,
      '提示',
      { type: 'warning' }
    )

    const ids = selectedRows.value.map((item) => item.id)
    await batchDeleteTemplate(ids)
    ElMessage.success('批量删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const handleBatchStatus = (status: string) => {
  ElMessage.info(`批量${status === 'published' ? '上架' : '下架'}功能开发中`)
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

.templates-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        display: flex;
        gap: 8px;
      }
    }
  }
}
</style>
