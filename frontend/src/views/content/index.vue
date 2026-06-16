<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QyAuditDialog from '@/components/QyAuditDialog/index.vue'
import { CONTENT_AUDIT_STATUS, CONTENT_CATEGORY, getEnumOptions, getEnumLabel } from '@/constants/enums'
import {
  getContentListApi,
  createContentApi,
  updateContentApi,
  deleteContentApi,
  batchDeleteContentsApi,
  auditContentApi,
  batchAuditContentsApi,
} from '@/api/content'
import { getAllRolesApi } from '@/api/role'
import type { ContentItem, PaginationResult } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<ContentItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: null as number | null,
  auditStatus: null as number | null,
  status: null as number | null,
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
  queryParams.auditStatus = null
  queryParams.status = null
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

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()

const formData = reactive<Partial<ContentItem>>({
  title: '',
  category: 1,
  coverImage: '',
  director: '',
  actors: '',
  releaseYear: undefined,
  duration: undefined,
  area: '',
  tags: [],
  totalEpisodes: 0,
  copyrightId: undefined,
  isVip: 0,
  sortOrder: 0,
  status: 1,
  description: '',
})

const formRules = {
  title: [{ required: true, message: '请输入内容标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择内容分类', trigger: 'change' }],
}

const openDialog = (mode: 'create' | 'edit' | 'view', row?: ContentItem) => {
  dialogMode.value = mode
  if (row) {
    Object.assign(formData, row)
  } else {
    Object.assign(formData, {
      title: '',
      category: 1,
      coverImage: '',
      director: '',
      actors: '',
      releaseYear: undefined,
      duration: undefined,
      area: '',
      tags: [],
      totalEpisodes: 0,
      copyrightId: undefined,
      isVip: 0,
      sortOrder: 0,
      status: 1,
      description: '',
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createContentApi(formData)
      ElMessage.success('创建成功')
    } else {
      await updateContentApi(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: ContentItem) => {
  await ElMessageBox.confirm('确定要删除该内容吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteContentApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const selectedRows = ref<ContentItem[]>([])
const handleSelectionChange = (rows: ContentItem[]) => {
  selectedRows.value = rows
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条内容吗？`, '提示', { type: 'warning' })
  loading.value = true
  try {
    await batchDeleteContentsApi(selectedRows.value.map((r) => r.id))
    ElMessage.success('批量删除成功')
    loadData()
  } finally {
    loading.value = false
  }
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

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'id', label: 'ID', width: 80, align: 'center' },
  { prop: 'title', label: '内容标题', minWidth: 200, showOverflowTooltip: true },
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
    prop: 'rating',
    label: '评分',
    width: 90,
    align: 'center',
    slot: 'rating',
  },
  {
    prop: 'playCount',
    label: '播放量',
    width: 110,
    align: 'center',
    slot: 'playCount',
  },
  {
    prop: 'isVip',
    label: 'VIP',
    width: 80,
    align: 'center',
    slot: 'isVip',
  },
  {
    prop: 'createdAt',
    label: '创建时间',
    width: 170,
    align: 'center',
    slot: 'createdAt',
  },
  { label: '操作', width: 240, fixed: 'right', align: 'center', slot: 'actions' },
]

const auditStatusOptions = computed(() => getEnumOptions(CONTENT_AUDIT_STATUS))
const categoryOptions = computed(() => getEnumOptions(CONTENT_CATEGORY))

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="content-page">
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
        <el-form-item label="审核状态">
          <el-select
            v-model="queryParams.auditStatus"
            placeholder="全部状态"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in auditStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="上下架">
          <el-select
            v-model="queryParams.status"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
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
        :show-batch-actions="true"
        :selected-count="selectedRows.length"
        @create="openDialog('create')"
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

        <template #rating="{ row }">
          <span style="color: #E6A23C; font-weight: 600">{{ row.rating }}</span>
        </template>

        <template #playCount="{ row }">
          {{ formatNumber(row.playCount) }}
        </template>

        <template #isVip="{ row }">
          <el-tag v-if="row.isVip" type="warning" size="small">VIP</el-tag>
          <span v-else style="color: #909399">-</span>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="View" @click="openDialog('view', row)">查看</el-button>
          <el-button type="primary" link :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
          <el-button
            type="warning"
            link
            :icon="Checked"
            @click="openAuditDialog(row)"
          >
            审核
          </el-button>
          <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增内容' : dialogMode === 'edit' ? '编辑内容' : '内容详情'"
      width="760px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="内容标题" prop="title">
              <el-input v-model="formData.title" placeholder="请输入内容标题" maxlength="255" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in categoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="导演">
              <el-input v-model="formData.director" placeholder="请输入导演姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="主演">
              <el-input v-model="formData.actors" placeholder="请输入主演，多个用逗号分隔" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上映年份">
              <el-input-number v-model="formData.releaseYear" :min="1900" :max="2100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时长(分钟)">
              <el-input-number v-model="formData.duration" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="地区">
              <el-input v-model="formData.area" placeholder="请输入地区" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标签">
              <el-select
                v-model="formData.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入标签"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总集数">
              <el-input-number v-model="formData.totalEpisodes" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="VIP专享">
              <el-switch v-model="formData.isVip" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">上架</el-radio>
                <el-radio :value="0">下架</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="封面图">
              <el-input v-model="formData.coverImage" placeholder="请输入图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容简介">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="4"
                placeholder="请输入内容简介"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="loading" @click="handleSubmit">
          确定
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
.content-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
