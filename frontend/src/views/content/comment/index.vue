<template>
  <div class="page-container">
    <el-row :gutter="16" class="mb-20">
      <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color + '15', color: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCompact(item.value) }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索内容/用户名"
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
            <el-option v-for="(label, value) in commentStatusOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="笔记ID">
          <el-input
            v-model="queryParams.noteId"
            placeholder="笔记ID"
            clearable
            style="width: 140px"
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
          <span class="card-title">评论列表</span>
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
        <el-button type="success" plain size="small" :icon="CircleCheck" :disabled="!hasSelection" @click="handleBatchAudit(1)">
          批量通过
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
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Comment[])"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="noteTitle" label="笔记标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="评论用户" width="140">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="32" :src="row.userAvatar">{{ row.userName?.charAt(0) }}</el-avatar>
              <span class="user-name">{{ row.userName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="240" show-overflow-tooltip />
        <el-table-column prop="likeCount" label="点赞数" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status] || 'info'" size="small">
              {{ commentStatusOptions[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评论时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看</el-button>
            <el-button
              v-if="row.status !== 1"
              link
              type="success"
              size="small"
              @click="handleAuditPass(row)"
            >
              审核通过
            </el-button>
            <el-button
              v-if="row.status !== 2"
              link
              type="warning"
              size="small"
              @click="handleAuditReject(row)"
            >
              审核拒绝
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <ReviewDialog
      v-model="auditVisible"
      :data-id="currentId"
      :data-title="currentContent"
      :data-author="currentUserName"
      :data-time="currentTime"
      @submit="handleAuditSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  ChatDotRound,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getCommentList,
  auditComment,
  batchAuditComments,
  batchDeleteComments,
  getCommentStats,
  deleteComment
} from '@api/comment'
import { CommentStatus } from '@enums/business'
import type { Comment } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'
import ReviewDialog from '@components/ReviewDialog/index.vue'

const { formatCompact } = useNumberFormat()

const commentStatusOptions: Record<number, string> = {
  [CommentStatus.NORMAL]: '正常',
  [CommentStatus.VIOLATION]: '违规',
  [CommentStatus.DELETED]: '已删除'
}

const statusTagMap: Record<number, string> = {
  [CommentStatus.NORMAL]: 'success',
  [CommentStatus.VIOLATION]: 'danger',
  [CommentStatus.DELETED]: 'info'
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
} = useFetchList<Comment, { keyword?: string; status?: number; noteId?: string }>({
  fetchApi: getCommentList,
  defaultParams: { keyword: '', status: undefined, noteId: '' },
  immediate: false
})

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Comment>()

const statCards = ref([
  { key: 'total', label: '评论总数', value: 0, icon: ChatDotRound, color: '#409eff' },
  { key: 'normal', label: '正常评论', value: 0, icon: CircleCheck, color: '#67c23a' },
  { key: 'violation', label: '违规评论', value: 0, icon: CircleClose, color: '#f56c6c' },
  { key: 'deleted', label: '已删除', value: 0, icon: ChatDotRound, color: '#909399' }
])

const loadStats = async () => {
  try {
    const stats = await getCommentStats()
    statCards.value.forEach((item) => {
      if (stats[item.key] != null) {
        item.value = stats[item.key]
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const auditVisible = ref(false)
const currentId = ref<number | null>(null)
const currentContent = ref('')
const currentUserName = ref('')
const currentTime = ref('')

const handleView = (row: Comment) => {
  currentId.value = row.id
  currentContent.value = row.content
  currentUserName.value = row.userName
  currentTime.value = row.createTime
  auditVisible.value = true
}

const handleAuditPass = (row: Comment) => {
  currentId.value = row.id
  currentContent.value = row.content
  currentUserName.value = row.userName
  currentTime.value = row.createTime
  auditVisible.value = true
}

const handleAuditReject = (row: Comment) => {
  currentId.value = row.id
  currentContent.value = row.content
  currentUserName.value = row.userName
  currentTime.value = row.createTime
  auditVisible.value = true
}

const handleAuditSubmit = async (data: { id: number; status: number; rejectReason?: string }) => {
  try {
    await auditComment(data.id, { status: data.status, violationType: data.rejectReason })
    ElMessage.success(data.status === 1 ? '审核通过' : '已拒绝')
    fetchData()
    loadStats()
  } catch (error) {
    console.error(error)
  }
}

const handleBatchAudit = async (status: number) => {
  try {
    await batchAuditComments(selectedIds.value, { status })
    ElMessage.success(`批量${status === 1 ? '通过' : '拒绝'}成功`)
    clearSelection()
    fetchData()
    loadStats()
  } catch (error) {
    console.error(error)
  }
}

const handleDelete = async (row: Comment) => {
  try {
    await deleteComment(row.id)
    ElMessage.success('删除成功')
    fetchData()
    loadStats()
  } catch (error) {
    console.error(error)
  }
}

const handleSelectAll = (val: boolean) => {
  console.log('select all', val)
}

const handleBatchDeleteApi = (ids: number[]) => {
  return batchDeleteComments(ids)
}

const handleBatchDeleted = () => {
  clearSelection()
  fetchData()
  loadStats()
}

onMounted(() => {
  fetchData()
  loadStats()
})
</script>

<style lang="scss" scoped>
.page-container {
  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: $border-radius;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
  }

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

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-name {
    font-size: 14px;
    color: $text-primary;
  }

  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
