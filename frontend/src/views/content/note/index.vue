<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="标题">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入内容标题"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 160px"
          >
            <el-option v-for="(label, value) in noteStatusOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="作者">
          <el-input
            v-model="queryParams.authorName"
            placeholder="作者昵称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="提交时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">笔记列表</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增内容</el-button>
            <el-button :icon="Download" plain>导出</el-button>
          </div>
        </div>
      </template>

      <BatchActions
        v-model:selected-ids="selectedIds"
        :selected-rows="selectedRows"
        :total="total"
        :delete-api="handleBatchDeleteApi"
        @select-all="handleSelectAll"
        @clear="clearSelection"
        @delete="handleBatchDeleted"
      >
        <el-button type="warning" plain size="small" :icon="CircleCheck" :disabled="!hasSelection" @click="handleBatchAudit(2)">
          批量通过
        </el-button>
        <el-button type="danger" plain size="small" :icon="CircleClose" :disabled="!hasSelection" @click="handleBatchAudit(3)">
          批量拒绝
        </el-button>
      </BatchActions>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        selectable
        show-index
        row-key="id"
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Note[])"
        @paginate="handlePaginate"
      >
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
              :preview-src-list="[row.coverImage]"
            />
            <span v-else class="no-cover">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="内容标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status] || 'info'" size="small">
              {{ noteStatusOptions[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="作者" width="120" />
        <el-table-column label="流量数据" width="200" align="center">
          <template #default="{ row }">
            <div class="flow-data">
              <span><el-icon><View /></el-icon>{{ formatCompact(row.viewCount) }}</span>
              <span><el-icon><Star /></el-icon>{{ formatCompact(row.likeCount) }}</span>
              <span><el-icon><ChatDotRound /></el-icon>{{ formatCompact(row.commentCount) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="标签" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="tag in row.tags?.slice(0, 3)" :key="tag.id" size="small" class="mr-5" effect="plain">
              {{ tag.name }}
            </el-tag>
            <el-tag v-if="row.tags?.length > 3" size="small" effect="plain" type="info">
              +{{ row.tags.length - 3 }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openPreview(row)">预览</el-button>
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button
              v-if="row.status === 0"
              link
              type="warning"
              size="small"
              @click="handleSubmitReview(row)"
            >
              提交审核
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <ContentPreview v-model="previewVisible" :data="previewData" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Download,
  View,
  Star,
  ChatDotRound,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { useFetchList, useCrud, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getNoteList,
  createNote,
  updateNote,
  deleteNote,
  submitNoteForReview,
  batchAuditNotes
} from '@api/content'
import { NoteStatus } from '@enums/business'
import type { Note } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'
import ContentPreview from '@components/ContentPreview/index.vue'

const { formatCompact } = useNumberFormat()

const noteStatusOptions: Record<number, string> = {
  [NoteStatus.DRAFT]: '草稿',
  [NoteStatus.PENDING_REVIEW]: '待审核',
  [NoteStatus.PUBLISHED]: '已发布',
  [NoteStatus.REJECTED]: '已拒绝',
  [NoteStatus.OFF_SHELF]: '已下架'
}

const statusTagMap: Record<number, string> = {
  [NoteStatus.DRAFT]: 'info',
  [NoteStatus.PENDING_REVIEW]: 'warning',
  [NoteStatus.PUBLISHED]: 'success',
  [NoteStatus.REJECTED]: 'danger',
  [NoteStatus.OFF_SHELF]: 'primary'
}

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Note, { title?: string; status?: number; authorName?: string; dateRange?: string[] }>({
  fetchApi: getNoteList,
  defaultParams: { title: '', status: undefined, authorName: '', dateRange: [] }
})

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Note>()

const {
  dialogVisible,
  formData,
  formLoading,
  handleAdd,
  handleEdit,
  handleDelete,
  handleSubmit,
  handleClose
} = useCrud<Note>({
  createApi: createNote,
  updateApi: updateNote,
  deleteApi: deleteNote,
  onDeleted: fetchData,
  onSaved: fetchData
})

const previewVisible = ref(false)
const previewData = ref<Note | null>(null)

const openPreview = (row: Note) => {
  previewData.value = row
  previewVisible.value = true
}

const handleSubmitReview = async (row: Note) => {
  try {
    await submitNoteForReview(row.id!)
    ElMessage.success('已提交审核')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleBatchAudit = async (status: number) => {
  try {
    await batchAuditNotes(selectedIds.value, { status })
    ElMessage.success(`批量${status === 2 ? '通过' : '拒绝'}成功`)
    clearSelection()
    fetchData()
  } catch (error) {
    console.error(error)
  }
}

const handleSelectAll = (val: boolean) => {
  console.log('select all', val)
}

const handleBatchDeleteApi = (ids: number[]) => {
  return Promise.all(ids.map((id) => deleteNote(id)))
}

const handleBatchDeleted = () => {
  clearSelection()
  fetchData()
}

// Suppress unused warning for form dialog (can be enhanced with form component later)
void dialogVisible
void formData
void formLoading
void handleSubmit
void handleClose
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .no-cover {
    color: $text-placeholder;
    font-size: 12px;
  }

  .flow-data {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: $text-secondary;
    align-items: flex-start;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      .el-icon {
        font-size: 12px;
      }
    }
  }

  .mr-5 {
    margin-right: 5px;
  }
}
</style>
