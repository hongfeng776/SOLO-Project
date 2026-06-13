<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { useConfirm } from '@/components/ConfirmDialog'
import type { CommentVO } from '@/types/api'
import {
  getCommentList,
  updateCommentStatus,
  batchUpdateCommentStatus,
  removeComment,
  type CommentQuery
} from '@/api/comment'

const { confirm, confirmDelete } = useConfirm()

const initialQuery: Partial<CommentQuery> = {
  vocabularyId: undefined,
  materialId: undefined,
  userId: undefined,
  status: undefined,
  keyword: ''
}

const {
  list,
  loading,
  pageNum,
  pageSize,
  total,
  queryForm,
  selectedIds,
  handleSearch,
  handleReset,
  handleRefresh,
  handlePageChange,
  handleSelectionChange
} = useTable<CommentVO, CommentQuery>(getCommentList, initialQuery)

const batchLoading = ref(false)
const deleteLoading = ref(false)

async function handleDelete(row: CommentVO) {
  const ok = await confirmDelete()
  if (!ok) return
  try {
    deleteLoading.value = true
    await removeComment([row.id])
    ElMessage.success('删除成功')
    handleRefresh()
  } finally {
    deleteLoading.value = false
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirmDelete(`确定要删除选中的 ${selectedIds.value.length} 条评论吗？`)
  if (!ok) return
  try {
    batchLoading.value = true
    await removeComment(selectedIds.value)
    ElMessage.success('批量删除成功')
    handleRefresh()
  } finally {
    batchLoading.value = false
  }
}

async function handleStatusChange(row: CommentVO, status: number) {
  const action = status === 1 ? '显示' : '隐藏'
  const ok = await confirm(`确定要${action}这条评论吗？`, '状态确认')
  if (!ok) return
  await updateCommentStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  handleRefresh()
}

async function handleBatchStatus(status: number) {
  if (selectedIds.value.length === 0) return
  const action = status === 1 ? '显示' : '隐藏'
  const ok = await confirm(`确定要${action}选中的 ${selectedIds.value.length} 条评论吗？`, '批量操作确认')
  if (!ok) return
  try {
    batchLoading.value = true
    await batchUpdateCommentStatus(selectedIds.value, status)
    ElMessage.success(`批量${action}成功`)
    handleRefresh()
  } finally {
    batchLoading.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form
        :model="queryForm"
        label-width="90px"
        inline
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="关联词汇ID">
          <el-input
            v-model="queryForm.vocabularyId"
            placeholder="请输入词汇ID"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="关联素材ID">
          <el-input
            v-model="queryForm.materialId"
            placeholder="请输入素材ID"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="用户ID">
          <el-input
            v-model="queryForm.userId"
            placeholder="请输入用户ID"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="已显示" :value="1" />
            <el-option label="已隐藏" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="请输入内容关键词"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <BatchToolbar
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :total-count="total"
      >
        <el-button type="success" plain :loading="batchLoading" @click="handleBatchStatus(1)">
          批量显示
        </el-button>
        <el-button type="warning" plain :loading="batchLoading" @click="handleBatchStatus(0)">
          批量隐藏
        </el-button>
        <el-button type="danger" plain :loading="batchLoading" @click="handleBatchDelete">
          批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="5" :col-count="10" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <el-table
          v-else
          :data="list"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" :reserve-selection="false" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="vocabularyWord" label="所属词汇" width="140" />
          <el-table-column prop="materialTitle" label="所属素材" width="160" show-overflow-tooltip />
          <el-table-column prop="userName" label="评论人" width="120" />
          <el-table-column label="内容" min-width="300">
            <template #default="{ row }">
              <el-tooltip :content="row.content" placement="top" :show-after="500">
                <span class="ellipsis">{{ row.content }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="likes" label="点赞数" width="90" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '已显示' : '已隐藏' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button
                :type="(row as CommentVO).status === 1 ? 'warning' : 'success'"
                link
                @click="handleStatusChange(row as CommentVO, (row as CommentVO).status === 1 ? 0 : 1)"
              >
                {{ (row as CommentVO).status === 1 ? '隐藏' : '显示' }}
              </el-button>
              <el-button type="danger" link :loading="deleteLoading" @click="handleDelete(row as CommentVO)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <Pagination
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </template>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
}
</style>
