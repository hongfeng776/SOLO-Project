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
        <el-form-item label="审核层级">
          <el-select
            v-model="queryParams.reviewLevel"
            placeholder="全部层级"
            clearable
            style="width: 140px"
          >
            <el-option label="一级审核" :value="1" />
            <el-option label="二级审核" :value="2" />
            <el-option label="三级审核" :value="3" />
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
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">内容审核</span>
            <el-tabs v-model="activeTab" class="review-tabs" @tab-change="handleTabChange">
              <el-tab-pane label="待审核" name="pending" />
              <el-tab-pane label="已通过" name="passed" />
              <el-tab-pane label="已拒绝" name="rejected" />
            </el-tabs>
          </div>
        </div>
      </template>

      <BatchActions
        :selected-ids="selectedIds"
        :selected-rows="selectedRows"
        :total="total"
        always-show
        :allow-delete="false"
        :allow-export="false"
      >
        <el-button type="success" plain size="small" :icon="CircleCheck" :disabled="!hasSelection" @click="handleBatchAudit(2)">
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
        <el-table-column label="审核层级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.reviewLevel === 3 ? 'danger' : row.reviewLevel === 2 ? 'warning' : 'primary'" size="small" effect="plain">
              {{ levelMap[row.reviewLevel] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="作者" width="120" />
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="拒绝原因" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.status === 3" class="reject-reason">{{ row.rejectReason || '-' }}</span>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openPreview(row)">预览</el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="success"
              size="small"
              @click="openAudit(row, true)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="danger"
              size="small"
              @click="openAudit(row, false)"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <ContentPreview v-model="previewVisible" :data="previewData">
      <template #actions="{ data }">
        <el-button
          v-if="data?.status === 1"
          type="success"
          @click="openAudit(data, true)"
        >
          通过审核
        </el-button>
        <el-button
          v-if="data?.status === 1"
          type="danger"
          @click="openAudit(data, false)"
        >
          拒绝
        </el-button>
      </template>
    </ContentPreview>

    <ReviewDialog
      v-model="auditVisible"
      :data-id="currentId"
      :data-title="currentTitle"
      :data-author="currentAuthor"
      :data-time="currentTime"
      :data-level="currentLevel"
      @submit="handleAuditSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { getNoteList, auditNote, batchAuditNotes } from '@api/content'
import { NoteStatus, ReviewLevel } from '@enums/business'
import type { Note } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'
import ContentPreview from '@components/ContentPreview/index.vue'
import ReviewDialog from '@components/ReviewDialog/index.vue'

const levelMap: Record<number, string> = {
  [ReviewLevel.LEVEL_1]: '一级',
  [ReviewLevel.LEVEL_2]: '二级',
  [ReviewLevel.LEVEL_3]: '三级'
}

const activeTab = ref('pending')

const tabStatusMap: Record<string, number> = {
  pending: NoteStatus.PENDING_REVIEW,
  passed: NoteStatus.PUBLISHED,
  rejected: NoteStatus.REJECTED
}

const baseParams = computed(() => ({
  title: '',
  reviewLevel: undefined as number | undefined,
  authorName: '',
  status: tabStatusMap[activeTab.value]
}))

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handlePaginate
} = useFetchList<Note, { title?: string; status?: number; reviewLevel?: number; authorName?: string }>({
  fetchApi: getNoteList,
  defaultParams: baseParams.value
})

const handleReset = () => {
  Object.assign(queryParams, { page: 1, pageSize: 10, ...baseParams.value })
  fetchData()
}

const handleTabChange = () => {
  queryParams.page = 1
  queryParams.status = tabStatusMap[activeTab.value]
  fetchData()
}

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Note>()

const previewVisible = ref(false)
const previewData = ref<Note | null>(null)

const auditVisible = ref(false)
const currentId = ref<number | null>(null)
const currentTitle = ref('')
const currentAuthor = ref('')
const currentTime = ref('')
const currentLevel = ref<number | undefined>(undefined)

const openPreview = (row: Note) => {
  previewData.value = row
  previewVisible.value = true
}

const openAudit = (row: Note, _isPass: boolean) => {
  currentId.value = row.id
  currentTitle.value = row.title
  currentAuthor.value = row.authorName
  currentTime.value = row.createTime
  currentLevel.value = row.reviewLevel || ReviewLevel.LEVEL_1
  auditVisible.value = true
}

const handleAuditSubmit = async (data: { id: number; status: number; rejectReason?: string }) => {
  try {
    await auditNote(data.id, { status: data.status, rejectReason: data.rejectReason })
    ElMessage.success(data.status === 2 ? '审核通过' : '已拒绝')
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
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .review-tabs {
    margin: -12px 0;

    :deep(.el-tabs__header) {
      margin: 0;
      border: none;
    }

    :deep(.el-tabs__item) {
      height: 40px;
      line-height: 40px;
    }
  }

  .no-cover {
    color: $text-placeholder;
    font-size: 12px;
  }

  .reject-reason {
    color: $color-danger;
  }

  .text-empty {
    color: $text-placeholder;
  }
}
</style>
