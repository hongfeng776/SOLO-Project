<template>
  <div class="resources-page">
    <div class="page-header">
      <h2 class="page-title">影像资源</h2>
    </div>

    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="资源标题/描述"
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
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增资源</el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedRows.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button :icon="Upload" @click="handleUpload">上传资源</el-button>
        </div>
      </div>

      <BatchOperation :selected-count="selectedRows.length" @clear="handleClearSelection">
        <el-button size="small" type="success" @click="handleBatchStatus('approved')">
          批量通过
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
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.coverUrl"
              :preview-src-list="[row.fileUrl || row.coverUrl]"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer"
            />
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ fileTypeLabel[row.fileType] || row.fileType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="resource" />
          </template>
        </el-table-column>
        <el-table-column prop="categoryName" label="分类" width="100" align="center" />
        <el-table-column prop="authorName" label="作者" width="100" align="center" />
        <el-table-column prop="viewCount" label="浏览量" width="80" align="center" />
        <el-table-column prop="downloadCount" label="下载量" width="80" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </DataTable>
    </div>

    <ResourcePreview
      v-model:visible="previewVisible"
      :resource="currentResource"
      @download="handleDownload"
    />

    <FileUpload
      v-model:visible="uploadVisible"
      :multiple="true"
      :limit="10"
      file-type="image"
      drag
      @success="handleUploadSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, Delete, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataTable, StatusTag, BatchOperation, ResourcePreview, FileUpload } from '@/components/business'
import { ResourceStatusLabel, FileTypeLabel } from '@/constants'
import { getResourceList, batchDeleteResource, batchUpdateStatus } from '@/api/resource'
import type { ImageResource } from '@/types'

const loading = ref(false)
const tableData = ref<ImageResource[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRows = ref<ImageResource[]>([])

const filterForm = reactive({
  keyword: '',
  status: '',
  categoryId: undefined as number | undefined,
  fileType: 'image'
})

const previewVisible = ref(false)
const uploadVisible = ref(false)
const currentResource = ref<ImageResource | null>(null)

const categories = ref<any[]>([])

const statusOptions = Object.entries(ResourceStatusLabel).map(([value, label]) => ({
  value,
  label
}))

const fileTypeLabel = FileTypeLabel as Record<string, string>

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getResourceList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      status: filterForm.status || undefined,
      categoryId: filterForm.categoryId,
      fileType: filterForm.fileType
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取资源列表失败:', error)
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

const handleSelectionChange = (selection: ImageResource[]) => {
  selectedRows.value = selection
}

const handleClearSelection = () => {
  selectedRows.value = []
}

const handleAdd = () => {
  uploadVisible.value = true
}

const handleUpload = () => {
  uploadVisible.value = true
}

const handleUploadSuccess = () => {
  ElMessage.success('上传成功')
  uploadVisible.value = false
  fetchList()
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个资源吗？`,
      '提示',
      { type: 'warning' }
    )

    const ids = selectedRows.value.map((item) => item.id)
    await batchDeleteResource(ids)
    ElMessage.success('批量删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const handleBatchStatus = async (status: string) => {
  if (selectedRows.value.length === 0) return

  try {
    const ids = selectedRows.value.map((item) => item.id)
    await batchUpdateStatus(ids, status)
    ElMessage.success('批量操作成功')
    fetchList()
  } catch (error) {
    console.error('批量操作失败:', error)
  }
}

const handleDownload = (resource: ImageResource) => {
  console.log('下载资源:', resource)
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

.resources-page {
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
    background: $bg-color-ffffff;
    border-radius: $border-radius-large;
    padding: 20px;

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
