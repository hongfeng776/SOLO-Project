<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QyAuditDialog from '@/components/QyAuditDialog/index.vue'
import QyContentPreview from '@/components/QyContentPreview/index.vue'
import { CONTENT_AUDIT_STATUS, CONTENT_CATEGORY, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getContentListApi,
  auditContentApi,
  batchAuditContentsApi,
} from '@/api/content'
import type { ContentItem } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<ContentItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: null as number | null,
  auditStatus: 0,
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await getContentListApi({ ...queryParams })
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
  queryParams.category = null
  queryParams.auditStatus = 0
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

const previewVisible = ref(false)
const currentContent = ref<ContentItem | null>(null)

const openPreview = (row: ContentItem) => {
  currentContent.value = row
  previewVisible.value = true
}

const auditDialogVisible = ref(false)
const currentAuditId = ref<number | null>(null)
const batchAuditMode = ref(false)

const openAuditDialog = (row?: ContentItem) => {
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
      await batchAuditContentsApi(selectedRows.value.map((r) => r.id), data)
    } else {
      await auditContentApi(currentAuditId.value!, data)
    }
    ElMessage.success('审核成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const selectedRows = ref<ContentItem[]>([])
const handleSelectionChange = (rows: ContentItem[]) => {
  selectedRows.value = rows
}

const pendingCount = computed(() => listData.value.filter((r) => r.auditStatus === 0).length)
const reviewingCount = computed(() => listData.value.filter((r) => r.auditStatus === 1).length)

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  {
    label: '内容信息',
    minWidth: 280,
    slot: 'contentInfo',
  },
  {
    prop: 'category',
    label: '分类',
    width: 100,
    align: 'center',
    slot: 'category',
  },
  {
    prop: 'auditStatus',
    label: '审核状态',
    width: 110,
    align: 'center',
    slot: 'auditStatus',
  },
  {
    prop: 'createdAt',
    label: '提交时间',
    width: 170,
    align: 'center',
    slot: 'createdAt',
  },
  { label: '操作', width: 200, fixed: 'right', align: 'center', slot: 'actions' },
]

const auditStatusOptions = computed(() =>
  getEnumOptions(CONTENT_AUDIT_STATUS).filter((item) => item.value !== 4)
)
const categoryOptions = computed(() => getEnumOptions(CONTENT_CATEGORY))

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="audit-page">
    <div class="audit-stat-bar">
      <div class="stat-item" :class="{ active: queryParams.auditStatus === 0 }" @click="queryParams.auditStatus = 0; handleSearch()">
        <span class="stat-count">{{ pendingCount }}</span>
        <span class="stat-label">待审核</span>
      </div>
      <div class="stat-item" :class="{ active: queryParams.auditStatus === 1 }" @click="queryParams.auditStatus = 1; handleSearch()">
        <span class="stat-count">{{ reviewingCount }}</span>
        <span class="stat-label">审核中</span>
      </div>
      <div class="stat-item" :class="{ active: queryParams.auditStatus === 2 }" @click="queryParams.auditStatus = 2; handleSearch()">
        <span class="stat-count">—</span>
        <span class="stat-label">已通过</span>
      </div>
      <div class="stat-item" :class="{ active: queryParams.auditStatus === 3 }" @click="queryParams.auditStatus = 3; handleSearch()">
        <span class="stat-count">—</span>
        <span class="stat-label">已驳回</span>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="标题/导演/演员"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="queryParams.category"
            placeholder="全部分类"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in categoryOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
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
      >
        <template #batch-actions>
          <el-button
            type="success"
            :icon="CircleCheck"
            :disabled="selectedRows.length === 0"
            @click="() => handleAuditSubmit({ auditStatus: 2, auditRemark: '批量审核通过' })"
          >
            批量通过
          </el-button>
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
        <template #contentInfo="{ row }">
          <div class="content-info-cell">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              fit="cover"
              class="content-thumb"
              lazy
              :preview-src-list="[row.coverImage]"
            >
              <template #error>
                <div class="thumb-placeholder">
                  <el-icon :size="20"><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="content-text">
              <div class="content-title text-ellipsis">{{ row.title }}</div>
              <div class="content-meta">
                <span v-if="row.director">导演: {{ row.director }}</span>
                <span v-if="row.releaseYear"> · {{ row.releaseYear }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #category="{ row }">
          <el-tag size="small">{{ getEnumLabel(CONTENT_CATEGORY, row.category) }}</el-tag>
        </template>

        <template #auditStatus="{ row }">
          <el-tag
            :type="getEnumItem(CONTENT_AUDIT_STATUS, row.auditStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(CONTENT_AUDIT_STATUS, row.auditStatus) }}
          </el-tag>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="View" @click="openPreview(row)">预览</el-button>
          <el-button
            type="success"
            link
            :icon="CircleCheck"
            @click="() => handleAuditSubmit({ auditStatus: 2, auditRemark: '' })"
          >
            通过
          </el-button>
          <el-button type="warning" link :icon="Checked" @click="openAuditDialog(row)">审核</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="previewVisible"
      title="内容详情预览"
      width="780px"
      destroy-on-close
    >
      <QyContentPreview
        v-if="currentContent"
        :id="currentContent.id"
        :title="currentContent.title"
        :cover-image="currentContent.coverImage"
        :category="currentContent.category"
        :audit-status="currentContent.auditStatus"
        :description="currentContent.description"
        :director="currentContent.director"
        :actors="currentContent.actors"
        :release-year="currentContent.releaseYear"
        :duration="currentContent.duration"
        :rating="currentContent.rating"
      />
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button
          type="success"
          :icon="CircleCheck"
          @click="previewVisible = false; handleAuditSubmit({ auditStatus: 2, auditRemark: '' })"
        >
          审核通过
        </el-button>
        <el-button
          type="warning"
          :icon="Checked"
          @click="previewVisible = false; openAuditDialog(currentContent!)"
        >
          审核处理
        </el-button>
      </template>
    </el-dialog>

    <QyAuditDialog
      v-model="auditDialogVisible"
      :batch-mode="batchAuditMode"
      :batch-count="selectedRows.length"
      @submit="handleAuditSubmit"
    />
  </div>
</template>

<style lang="scss" scoped>
.audit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audit-stat-bar {
  display: flex;
  gap: 16px;
  background: $bg-white;
  padding: 16px;
  border-radius: $radius-md;
  box-shadow: $shadow-light;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-base;

  &:hover {
    background: $bg-hover;
  }

  &.active {
    background: rgba(64, 158, 255, 0.1);

    .stat-count {
      color: $primary-color;
    }
  }

  .stat-count {
    font-size: $font-2xl;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  .stat-label {
    font-size: $font-sm;
    color: $text-secondary;
    margin-top: 4px;
  }
}

.content-info-cell {
  display: flex;
  gap: 12px;
  align-items: center;
}

.content-thumb {
  width: 60px;
  height: 80px;
  border-radius: $radius-sm;
  flex-shrink: 0;
  background: $bg-color;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $text-placeholder;
  background: $bg-color;
}

.content-text {
  flex: 1;
  min-width: 0;
}

.content-title {
  font-size: $font-base;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 4px;
}

.content-meta {
  font-size: $font-xs;
  color: $text-secondary;
  line-height: 1.5;
}
</style>
