<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QyAuditDialog from '@/components/QyAuditDialog/index.vue'
import { COMMENT_STATUS, VIOLATION_LEVEL, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getCommentListApi,
  deleteCommentApi,
  batchDeleteCommentsApi,
  auditCommentApi,
  batchAuditCommentsApi,
  getCommentDetailApi,
} from '@/api/comment'
import type { CommentItem } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<CommentItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  commentStatus: null as number | null,
  violationLevel: null as number | null,
  startDate: '',
  endDate: '',
})

const dateRange = ref<[string, string] | null>(null)

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const result = await getCommentListApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.commentStatus = null
  queryParams.violationLevel = null
  dateRange.value = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const selectedRows = ref<CommentItem[]>([])
const handleSelectionChange = (rows: CommentItem[]) => {
  selectedRows.value = rows
}

const handleDelete = async (row: CommentItem) => {
  await ElMessageBox.confirm('确定要删除该评论吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteCommentApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条评论吗？`, '提示', { type: 'warning' })
  loading.value = true
  try {
    await batchDeleteCommentsApi(selectedRows.value.map((r) => r.id))
    ElMessage.success('批量删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const auditDialogVisible = ref(false)
const currentAuditId = ref<number | null>(null)
const batchAuditMode = ref(false)

const openAuditDialog = (row?: CommentItem) => {
  if (row) {
    currentAuditId.value = row.id
    batchAuditMode.value = false
  } else {
    batchAuditMode.value = true
  }
  auditDialogVisible.value = true
}

const handleAuditSubmit = async (data: { auditStatus: number; auditRemark: string }) => {
  loading.value = true
  try {
    if (batchAuditMode.value) {
      await batchAuditCommentsApi(selectedRows.value.map((r) => r.id), {
        commentStatus: data.auditStatus === 2 ? 1 : 3,
        auditRemark: data.auditRemark,
      })
    } else {
      await auditCommentApi(currentAuditId.value!, {
        commentStatus: data.auditStatus === 2 ? 1 : 3,
        auditRemark: data.auditRemark,
      })
    }
    ElMessage.success('审核成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const detailVisible = ref(false)
const currentComment = ref<CommentItem | null>(null)
const detailLoading = ref(false)

const openDetail = async (row: CommentItem) => {
  detailLoading.value = true
  try {
    const detail = await getCommentDetailApi(row.id)
    currentComment.value = detail
    detailVisible.value = true
  } finally {
    detailLoading.value = false
  }
}

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'commentContent', label: '评论内容', minWidth: 220, showOverflowTooltip: true, slot: 'commentContent' },
  { prop: 'contentId', label: '关联内容', minWidth: 160, showOverflowTooltip: true, slot: 'contentTitle' },
  { prop: 'userId', label: '评论人', width: 120, align: 'center', slot: 'commentUser' },
  { prop: 'commentStatus', label: '状态', width: 100, align: 'center', slot: 'commentStatus' },
  { prop: 'violationLevel', label: '违规等级', width: 100, align: 'center', slot: 'violationLevel' },
  { prop: 'likeCount', label: '点赞', width: 80, align: 'center' },
  { prop: 'replyCount', label: '回复', width: 80, align: 'center' },
  { prop: 'ipAddress', label: 'IP', width: 130, align: 'center' },
  { prop: 'createdAt', label: '创建时间', width: 170, align: 'center', slot: 'createdAt' },
  { label: '操作', width: 220, fixed: 'right', align: 'center', slot: 'actions' },
]

const commentStatusOptions = computed(() => getEnumOptions(COMMENT_STATUS))
const violationLevelOptions = computed(() => getEnumOptions(VIOLATION_LEVEL))

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="comment-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="内容标题关键词"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="评论状态">
          <el-select
            v-model="queryParams.commentStatus"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in commentStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="违规等级">
          <el-select
            v-model="queryParams.violationLevel"
            placeholder="全部等级"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in violationLevelOptions"
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
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-create="false"
        :show-batch-actions="true"
        :selected-count="selectedRows.length"
        @refresh="loadData"
        @batch-delete="handleBatchDelete"
      >
        <template #batch-actions>
          <el-button
            type="warning"
            :icon="Checked"
            :disabled="selectedRows.length === 0"
            @click="openAuditDialog()"
          >
            批量审核
          </el-button>
        </template>
      </QyTableToolbar>

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :selection="true"
        :index="true"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #commentContent="{ row }">
          <span class="comment-text" @click="openDetail(row)">{{ row.commentContent }}</span>
        </template>

        <template #contentTitle="{ row }">
          <span v-if="row.content">{{ row.content.title }}</span>
          <span v-else style="color: #909399">-</span>
        </template>

        <template #commentUser="{ row }">
          <span v-if="row.commentUser">{{ row.commentUser.username }}</span>
          <span v-else style="color: #909399">-</span>
        </template>

        <template #commentStatus="{ row }">
          <el-tag
            :type="getEnumItem(COMMENT_STATUS, row.commentStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(COMMENT_STATUS, row.commentStatus) }}
          </el-tag>
        </template>

        <template #violationLevel="{ row }">
          <el-tag
            :type="getEnumItem(VIOLATION_LEVEL, row.violationLevel)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(VIOLATION_LEVEL, row.violationLevel) }}
          </el-tag>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <template #actions="{ row }">
          <el-button type="warning" link :icon="Checked" @click="openAuditDialog(row)">审核</el-button>
          <el-button type="primary" link :icon="ChatDotSquare" @click="openDetail(row)">查看回复</el-button>
          <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </QyDataTable>
    </div>

    <QyAuditDialog
      v-model="auditDialogVisible"
      :batch-mode="batchAuditMode"
      :batch-count="selectedRows.length"
      @submit="handleAuditSubmit"
    />

    <el-dialog
      v-model="detailVisible"
      title="评论详情"
      width="700px"
      destroy-on-close
    >
      <template v-if="currentComment">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="评论人" :span="1">
            {{ currentComment.commentUser?.username || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址" :span="1">
            {{ currentComment.ipAddress || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="状态" :span="1">
            <el-tag
              :type="getEnumItem(COMMENT_STATUS, currentComment.commentStatus)?.type || 'info'"
              size="small"
            >
              {{ getEnumLabel(COMMENT_STATUS, currentComment.commentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="违规等级" :span="1">
            <el-tag
              :type="getEnumItem(VIOLATION_LEVEL, currentComment.violationLevel)?.type || 'info'"
              size="small"
            >
              {{ getEnumLabel(VIOLATION_LEVEL, currentComment.violationLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关联内容" :span="2">
            {{ currentComment.content?.title || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="评论内容" :span="2">
            {{ currentComment.commentContent }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="currentComment.commentImages?.length" class="comment-images">
          <div class="detail-section-title">评论图片</div>
          <div class="image-list">
            <el-image
              v-for="(img, idx) in currentComment.commentImages"
              :key="idx"
              :src="img"
              fit="cover"
              class="comment-image"
              lazy
              :preview-src-list="currentComment.commentImages"
              :initial-index="idx"
            />
          </div>
        </div>

        <div v-if="currentComment.replies?.length" class="comment-replies">
          <div class="detail-section-title">回复列表 ({{ currentComment.replies.length }})</div>
          <div v-for="reply in currentComment.replies" :key="reply.id" class="reply-item">
            <div class="reply-header">
              <span class="reply-user">{{ reply.commentUser?.username || '匿名用户' }}</span>
              <span class="reply-time">{{ formatDate(reply.createdAt) }}</span>
            </div>
            <div class="reply-content">{{ reply.commentContent }}</div>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.comment-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-text {
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 16px 0 8px;
}

.comment-images {
  .image-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .comment-image {
    width: 100px;
    height: 100px;
    border-radius: 4px;
  }
}

.comment-replies {
  .reply-item {
    padding: 10px 12px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 8px;
  }

  .reply-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .reply-user {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
  }

  .reply-time {
    font-size: 12px;
    color: #909399;
  }

  .reply-content {
    font-size: 13px;
    color: #606266;
    line-height: 1.5;
  }
}
</style>
