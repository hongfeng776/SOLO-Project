<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QyAuditDialog from '@/components/QyAuditDialog/index.vue'
import QyUpload from '@/components/QyUpload/index.vue'
import {
  CONTENT_AUDIT_STATUS,
  CONTENT_CATEGORY,
  COPYRIGHT_TYPE,
  CLARITY_LEVEL,
  RESOLUTION_OPTIONS,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getContentListApi,
  createContentApi,
  updateContentApi,
  deleteContentApi,
  batchDeleteContentsApi,
  auditContentApi,
  batchAuditContentsApi,
  batchOfflineContentsApi,
  batchTopContentsApi,
  batchUpdateCategoryApi,
  checkTitleUniqueApi,
  checkCopyrightUniqueApi,
} from '@/api/content'
import { getCopyrightListApi } from '@/api/copyright'
import type { ContentItem, CopyrightItem, PaginationResult } from '@/types'
import { formatDate, formatNumber } from '@/utils'

const loading = ref(false)
const submitLoading = ref(false)
const listData = ref<ContentItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  category: null as number | null,
  auditStatus: null as number | null,
  status: null as number | null,
  copyrightId: null as number | null,
  releaseYear: null as number | null,
  sortBy: 'created_at',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
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
  queryParams.copyrightId = null
  queryParams.releaseYear = null
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

const handleSortChange = ({ prop, order }: any) => {
  if (prop && order) {
    queryParams.sortBy = prop
    queryParams.sortOrder = order === 'ascending' ? 'ASC' : 'DESC'
  }
  loadData()
}

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()

const copyrightList = ref<CopyrightItem[]>([])

const loadCopyrightList = async () => {
  try {
    const result = await getCopyrightListApi({ pageSize: 999, status: 1 })
    copyrightList.value = result.list
  } catch { /* empty */ }
}

const formData = reactive<Partial<ContentItem>>({
  title: '',
  subtitle: '',
  category: 1,
  coverImage: '',
  posterImage: '',
  videoUrl: '',
  description: '',
  director: '',
  actors: '',
  releaseYear: undefined,
  releaseDate: '',
  duration: undefined,
  area: '',
  language: '',
  tags: [],
  totalEpisodes: 0,
  updatedEpisodes: 0,
  copyrightId: undefined,
  copyrightType: undefined,
  resolution: '',
  bitrate: undefined,
  clarityLevel: undefined,
  qualificationFiles: [],
  isVip: 0,
  isHot: 0,
  isRecommend: 0,
  sortOrder: 0,
  status: 1,
  remark: '',
})

const resetFormData = () => {
  Object.assign(formData, {
    title: '',
    subtitle: '',
    category: 1,
    coverImage: '',
    posterImage: '',
    videoUrl: '',
    description: '',
    director: '',
    actors: '',
    releaseYear: undefined,
    releaseDate: '',
    duration: undefined,
    area: '',
    language: '',
    tags: [],
    totalEpisodes: 0,
    updatedEpisodes: 0,
    copyrightId: undefined,
    copyrightType: undefined,
    resolution: '',
    bitrate: undefined,
    clarityLevel: undefined,
    qualificationFiles: [],
    isVip: 0,
    isHot: 0,
    isRecommend: 0,
    sortOrder: 0,
    status: 1,
    remark: '',
  })
}

const currentEditRow = ref<ContentItem | null>(null)

const isOnlineContent = computed(() => {
  return dialogMode.value === 'edit' && currentEditRow.value?.status === 1 && currentEditRow.value?.auditStatus === 2
})

const isCoreFieldDisabled = computed(() => {
  if (dialogMode.value === 'view') return true
  return isOnlineContent.value
})

const coreFieldWarning = computed(() => {
  if (isOnlineContent.value) {
    return '当前内容已上架，仅可修改简介、封面、标签等非核心信息。修改核心资源文件需先执行下架操作。'
  }
  return ''
})

const categoryRequiredFields = computed(() => {
  switch (formData.category) {
    case 1: return ['duration', 'area', 'copyrightId']
    case 2: return ['totalEpisodes', 'area', 'copyrightId']
    case 3: return ['totalEpisodes', 'copyrightId']
    default: return ['copyrightId']
  }
})

const categoryDynamicRules = computed(() => {
  const rules: Record<string, any[]> = []
  categoryRequiredFields.value.forEach(field => {
    const fieldLabels: Record<string, string> = {
      duration: '时长',
      area: '地区',
      totalEpisodes: '总集数',
      copyrightId: '版权',
    }
    if (!baseRules[field]) {
      rules[field] = [{ required: true, message: `请填写${fieldLabels[field] || field}`, trigger: ['blur', 'change'] }]
    }
  })
  return rules
})

const titleChecking = ref(false)
const titleUniqueError = ref('')

const validateTitleUnique = async (_rule: any, value: string) => {
  if (!value || value.length < 2) return true
  titleChecking.value = true
  titleUniqueError.value = ''
  try {
    const result = await checkTitleUniqueApi(value, dialogMode.value === 'edit' ? formData.id : undefined)
    if (!result.isUnique) {
      titleUniqueError.value = '该内容标题已存在，请更换标题'
      return new Error(titleUniqueError.value)
    }
    return true
  } finally {
    titleChecking.value = false
  }
}

const copyrightChecking = ref(false)
const copyrightUniqueError = ref('')

const validateCopyrightUnique = async (_rule: any, value: number | undefined) => {
  if (!value) return true
  copyrightChecking.value = true
  copyrightUniqueError.value = ''
  try {
    const result = await checkCopyrightUniqueApi(value, dialogMode.value === 'edit' ? formData.id : undefined)
    if (!result.isUnique) {
      copyrightUniqueError.value = '该版权编号已被其他内容关联，请选择其他版权'
      return new Error(copyrightUniqueError.value)
    }
    return true
  } finally {
    copyrightChecking.value = false
  }
}

const validateDuration = (_rule: any, value: number | undefined) => {
  if (value !== undefined && value !== null) {
    if (value <= 0) return new Error('时长必须大于0')
    if (value > 600) return new Error('时长不能超过600分钟')
  }
  return true
}

const validateBitrate = (_rule: any, value: number | undefined) => {
  if (value !== undefined && value !== null) {
    if (value <= 0) return new Error('码率必须大于0')
    if (value > 50000) return new Error('码率不能超过50000kbps')
  }
  return true
}

const validateResolution = (_rule: any, value: string | undefined) => {
  if (value && !/^\d+x\d+$/.test(value)) {
    return new Error('分辨率格式不正确，应为 宽x高，如1920x1080')
  }
  return true
}

const baseRules: FormRules = {
  title: [
    { required: true, message: '请输入内容标题', trigger: 'blur' },
    { min: 2, max: 255, message: '标题长度2-255个字符', trigger: 'blur' },
    { validator: validateTitleUnique, trigger: 'blur' },
  ],
  category: [{ required: true, message: '请选择内容分类', trigger: 'change' }],
  copyrightId: [
    { required: true, message: '请选择关联版权', trigger: 'change' },
    { validator: validateCopyrightUnique, trigger: 'change' },
  ],
  duration: [{ validator: validateDuration, trigger: 'blur' }],
  bitrate: [{ validator: validateBitrate, trigger: 'blur' }],
  resolution: [{ validator: validateResolution, trigger: 'blur' }],
}

const formRules = computed(() => ({
  ...baseRules,
  ...categoryDynamicRules.value,
}))

const selectedCopyright = computed(() => {
  if (!formData.copyrightId) return null
  return copyrightList.value.find(c => c.id === formData.copyrightId)
})

const copyrightStatusWarning = computed(() => {
  const cr = selectedCopyright.value
  if (!cr) return ''
  if (cr.status === 0) return '该版权已失效，不可用于新增内容'
  if (cr.status === 2) return '该版权即将到期，请尽快续约'
  return ''
})

const copyrightExpired = computed(() => {
  return selectedCopyright.value?.status === 0
})

watch(() => formData.copyrightId, (val) => {
  if (val) {
    const cr = copyrightList.value.find(c => c.id === val)
    if (cr) {
      formData.copyrightType = cr.type
    }
  } else {
    formData.copyrightType = undefined
  }
})

const qualificationMissing = computed(() => {
  const missing: string[] = []
  if (!formData.copyrightId) missing.push('版权资质')
  if (formData.category === 1 && !formData.duration) missing.push('时长信息')
  if ([2, 3].includes(formData.category) && (!formData.totalEpisodes || formData.totalEpisodes <= 0)) missing.push('集数信息')
  if (!formData.resolution) missing.push('清晰度规格')
  return missing
})

const openDialog = (mode: 'create' | 'edit' | 'view', row?: ContentItem) => {
  dialogMode.value = mode
  currentEditRow.value = row || null
  if (row) {
    Object.assign(formData, { ...row })
  } else {
    resetFormData()
  }
  titleUniqueError.value = ''
  copyrightUniqueError.value = ''
  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleSubmit = async () => {
  await formRef.value?.validate()

  if (dialogMode.value === 'create' && qualificationMissing.value.length > 0) {
    ElMessageBox.alert(
      `以下前置条件未完成，无法提交：\n${qualificationMissing.value.map(m => `• ${m}`).join('\n')}`,
      '提交拦截',
      { type: 'warning', confirmButtonText: '知道了' }
    )
    return
  }

  if (copyrightExpired.value && dialogMode.value === 'create') {
    ElMessage.error('关联版权已失效，无法创建内容')
    return
  }

  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createContentApi(formData)
      ElMessage.success('创建成功，内容已同步至素材资源库')
    } else {
      await updateContentApi(formData.id!, formData)
      if (isOnlineContent.value) {
        ElMessage.success('更新成功，已触发二次审核流程')
      } else {
        ElMessage.success('更新成功')
      }
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: ContentItem) => {
  await ElMessageBox.confirm('确定要删除该内容吗？删除后不可恢复。', '删除确认', { type: 'warning' })
  loading.value = true
  try {
    await deleteContentApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const handleOffline = async (row: ContentItem) => {
  await ElMessageBox.confirm(
    `确定要将「${row.title}」下架吗？下架后用户将无法查看该内容。`,
    '下架确认',
    { type: 'warning' }
  )
  loading.value = true
  try {
    await updateContentApi(row.id, { ...row, status: 0 })
    ElMessage.success('下架成功')
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
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条内容吗？`, '批量删除确认', { type: 'warning' })
  loading.value = true
  try {
    await batchDeleteContentsApi(selectedRows.value.map(r => r.id))
    ElMessage.success('批量删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const handleBatchOffline = async () => {
  if (selectedRows.value.length === 0) return
  await ElMessageBox.confirm(
    `确定要下架选中的 ${selectedRows.value.length} 条内容吗？仅已上架内容会被下架。`,
    '批量下架确认',
    { type: 'warning' }
  )
  loading.value = true
  try {
    const result = await batchOfflineContentsApi(selectedRows.value.map(r => r.id))
    showBatchResult(result, '下架')
    loadData()
  } finally {
    loading.value = false
  }
}

const handleBatchTop = async () => {
  if (selectedRows.value.length === 0) return
  await ElMessageBox.confirm(
    `确定要置顶选中的 ${selectedRows.value.length} 条内容吗？仅已上架内容可置顶。`,
    '批量置顶确认',
    { type: 'warning' }
  )
  loading.value = true
  try {
    const result = await batchTopContentsApi(selectedRows.value.map(r => r.id))
    showBatchResult(result, '置顶')
    loadData()
  } finally {
    loading.value = false
  }
}

const batchCategoryDialogVisible = ref(false)
const batchCategoryValue = ref<number | null>(null)

const openBatchCategoryDialog = () => {
  if (selectedRows.value.length === 0) return
  batchCategoryValue.value = null
  batchCategoryDialogVisible.value = true
}

const handleBatchUpdateCategory = async () => {
  if (!batchCategoryValue.value) {
    ElMessage.warning('请选择目标分类')
    return
  }
  loading.value = true
  try {
    const result = await batchUpdateCategoryApi(
      selectedRows.value.map(r => r.id),
      batchCategoryValue.value
    )
    showBatchResult(result, '修改分类')
    batchCategoryDialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const showBatchResult = (result: { successCount: number; skippedCount: number; operableIds: number[] }, action: string) => {
  if (result.skippedCount > 0) {
    ElMessageBox.alert(
      `批量${action}完成：\n• 成功：${result.successCount}条\n• 跳过（不可操作）：${result.skippedCount}条`,
      '操作明细',
      { type: 'info', confirmButtonText: '知道了' }
    )
  } else {
    ElMessage.success(`批量${action}成功，共${result.successCount}条`)
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
      await batchAuditContentsApi(selectedRows.value.map(r => r.id), data)
    } else {
      await auditContentApi(currentAuditId.value!, data)
    }
    ElMessage.success('审核成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const tableColumns = computed(() => [
  { type: 'selection', width: 50 },
  { prop: 'id', label: 'ID', width: 70, align: 'center' as const, sortable: 'custom' as const },
  { prop: 'title', label: '内容标题', minWidth: 200, showOverflowTooltip: true, slot: 'title' },
  { prop: 'category', label: '分类', width: 100, align: 'center' as const, slot: 'category' },
  { prop: 'copyrightId', label: '版权编号', width: 130, align: 'center' as const, slot: 'copyright' },
  { prop: 'auditStatus', label: '审核状态', width: 110, align: 'center' as const, slot: 'auditStatus' },
  { prop: 'status', label: '上架状态', width: 90, align: 'center' as const, slot: 'status' },
  { prop: 'resolution', label: '分辨率', width: 110, align: 'center' as const, slot: 'resolution' },
  { prop: 'playCount', label: '播放量', width: 110, align: 'center' as const, sortable: 'custom' as const, slot: 'playCount' },
  { prop: 'createdAt', label: '创建时间', width: 160, align: 'center' as const, sortable: 'custom' as const, slot: 'createdAt' },
  { label: '操作', width: 280, fixed: 'right' as const, align: 'center' as const, slot: 'actions' },
])

const auditStatusOptions = computed(() => getEnumOptions(CONTENT_AUDIT_STATUS))
const categoryOptions = computed(() => getEnumOptions(CONTENT_CATEGORY))
const clarityOptions = computed(() => getEnumOptions(CLARITY_LEVEL))
const copyrightTypeOptions = computed(() => getEnumOptions(COPYRIGHT_TYPE))

onMounted(() => {
  loadData()
  loadCopyrightList()
})
</script>

<template>
  <div class="content-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="标题/导演/演员/版权编号"
            clearable
            class="filter-input"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.category" placeholder="全部分类" clearable class="filter-select">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.auditStatus" placeholder="全部状态" clearable class="filter-select">
            <el-option v-for="item in auditStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="上架状态">
          <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="版权">
          <el-select v-model="queryParams.copyrightId" placeholder="全部版权" clearable filterable style="width: 160px">
            <el-option v-for="cr in copyrightList" :key="cr.id" :label="cr.name" :value="cr.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-input-number v-model="queryParams.releaseYear" :min="1900" :max="2100" placeholder="年份" style="width: 120px" controls-position="right" />
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
          <el-button type="warning" :icon="Checked" :disabled="selectedRows.length === 0" @click="openAuditDialog()">
            批量审核
          </el-button>
          <el-button type="danger" :icon="Bottom" :disabled="selectedRows.length === 0" @click="handleBatchOffline">
            批量下架
          </el-button>
          <el-button type="success" :icon="Top" :disabled="selectedRows.length === 0" @click="handleBatchTop">
            批量置顶
          </el-button>
          <el-button :icon="EditPen" :disabled="selectedRows.length === 0" @click="openBatchCategoryDialog">
            修正分类
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
        stripe
        row-class-name="content-row"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @sort-change="handleSortChange"
      >
        <template #title="{ row }">
          <div class="title-cell">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              fit="cover"
              class="title-cover"
              v-lazy="row.coverImage"
            >
              <template #error>
                <div class="cover-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="title-info">
              <span class="title-text" :title="row.title">{{ row.title }}</span>
              <div class="title-meta">
                <el-tag v-if="row.isVip" type="warning" size="small" class="mr-4">VIP</el-tag>
                <el-tag v-if="row.isHot" type="danger" size="small" class="mr-4">热</el-tag>
                <el-tag v-if="row.isRecommend" type="success" size="small">荐</el-tag>
              </div>
            </div>
          </div>
        </template>

        <template #category="{ row }">
          <el-tag size="small">{{ getEnumLabel(CONTENT_CATEGORY, row.category) }}</el-tag>
        </template>

        <template #copyright="{ row }">
          <span v-if="row.copyright" class="copyright-cell" :title="row.copyright.name">
            {{ row.copyright.name }}
          </span>
          <span v-else class="text-secondary">-</span>
        </template>

        <template #auditStatus="{ row }">
          <el-tag :type="getEnumItem(CONTENT_AUDIT_STATUS, row.auditStatus)?.type || 'info'" size="small">
            {{ getEnumLabel(CONTENT_AUDIT_STATUS, row.auditStatus) }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>

        <template #resolution="{ row }">
          <span v-if="row.resolution">{{ row.resolution }}</span>
          <span v-else class="text-secondary">-</span>
        </template>

        <template #playCount="{ row }">
          <span class="play-count">{{ formatNumber(row.playCount) }}</span>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link size="small" @click="openDialog('view', row)">查看</el-button>
          <el-button type="primary" link size="small" @click="openDialog('edit', row)">编辑</el-button>
          <el-button
            v-if="row.auditStatus === 0 || row.auditStatus === 1"
            type="warning"
            link
            size="small"
            @click="openAuditDialog(row)"
          >
            审核
          </el-button>
          <el-button
            v-if="row.status === 1"
            type="danger"
            link
            size="small"
            @click="handleOffline(row)"
          >
            下架
          </el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增影视内容' : dialogMode === 'edit' ? '编辑影视内容' : '内容详情'"
      width="900px"
      :close-on-click-modal="false"
      class="content-dialog"
      destroy-on-close
    >
      <el-alert
        v-if="coreFieldWarning"
        :title="coreFieldWarning"
        type="warning"
        show-icon
        :closable="false"
        class="mb-16"
      />

      <el-alert
        v-if="copyrightStatusWarning && dialogMode !== 'view'"
        :title="copyrightStatusWarning"
        :type="copyrightExpired ? 'error' : 'warning'"
        show-icon
        :closable="false"
        class="mb-16"
      />

      <div v-if="dialogMode === 'create'" class="prerequisite-section">
        <div class="section-title">
          <el-icon><Warning /></el-icon>
          <span>前置校验项</span>
        </div>
        <div class="prerequisite-items">
          <div class="prerequisite-item" :class="{ completed: formData.copyrightId && !copyrightExpired }">
            <el-icon v-if="formData.copyrightId && !copyrightExpired" class="check-icon"><CircleCheck /></el-icon>
            <el-icon v-else class="warn-icon"><Warning /></el-icon>
            <span>版权资质核验{{ copyrightExpired ? '（已失效）' : '' }}</span>
          </div>
          <div class="prerequisite-item" :class="{ completed: formData.category && formData.category > 0 }">
            <el-icon v-if="formData.category && formData.category > 0" class="check-icon"><CircleCheck /></el-icon>
            <el-icon v-else class="warn-icon"><Warning /></el-icon>
            <span>内容分类层级选定</span>
          </div>
          <div class="prerequisite-item" :class="{ completed: !!formData.clarityLevel }">
            <el-icon v-if="formData.clarityLevel" class="check-icon"><CircleCheck /></el-icon>
            <el-icon v-else class="warn-icon"><Warning /></el-icon>
            <span>清晰度规格配置</span>
          </div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
        :disabled="dialogMode === 'view'"
        class="content-form"
        :class="{ 'has-core-warning': isOnlineContent }"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="内容标题" prop="title">
              <el-input
                v-model="formData.title"
                placeholder="请输入内容标题"
                maxlength="255"
                show-word-limit
                class="focus-scale-input"
                :class="{ 'shake-error': titleUniqueError }"
              >
                <template #suffix>
                  <el-icon v-if="titleChecking" class="is-loading"><Loading /></el-icon>
                  <el-icon v-else-if="!titleUniqueError && formData.title" class="check-icon"><CircleCheck /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="副标题">
              <el-input v-model="formData.subtitle" placeholder="请输入副标题" maxlength="100" class="focus-scale-input" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容分类" prop="category">
              <el-select v-model="formData.category" placeholder="请选择" style="width: 100%" :disabled="isCoreFieldDisabled">
                <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版权" prop="copyrightId">
              <el-select
                v-model="formData.copyrightId"
                placeholder="请选择版权"
                filterable
                style="width: 100%"
                :disabled="isCoreFieldDisabled"
                :class="{ 'shake-error': copyrightUniqueError }"
              >
                <el-option
                  v-for="cr in copyrightList"
                  :key="cr.id"
                  :label="cr.name"
                  :value="cr.id"
                  :disabled="cr.status === 0"
                >
                  <span>{{ cr.name }}</span>
                  <el-tag v-if="cr.status === 0" type="danger" size="small" class="ml-8">已失效</el-tag>
                  <el-tag v-else-if="cr.status === 2" type="warning" size="small" class="ml-8">即将到期</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版权类型">
              <el-select v-model="formData.copyrightType" placeholder="自动同步" style="width: 100%" disabled>
                <el-option v-for="item in copyrightTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          影视信息
          <el-tag v-if="formData.category === 1" type="primary" size="small" class="ml-8">电影模式</el-tag>
          <el-tag v-else-if="formData.category === 2" type="success" size="small" class="ml-8">剧集模式</el-tag>
          <el-tag v-else-if="formData.category === 3" type="warning" size="small" class="ml-8">综艺模式</el-tag>
        </el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="导演">
              <el-input v-model="formData.director" placeholder="请输入导演" class="focus-scale-input" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="主演">
              <el-input v-model="formData.actors" placeholder="多人逗号分隔" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="地区">
              <el-input v-model="formData.area" placeholder="请输入地区" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上映年份" :required="categoryRequiredFields.includes('releaseYear')">
              <el-input-number v-model="formData.releaseYear" :min="1900" :max="2100" style="width: 100%" controls-position="right" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
          <el-col v-if="formData.category === 1" :span="8">
            <el-form-item label="时长(分钟)" prop="duration" :required="categoryRequiredFields.includes('duration')">
              <el-input-number v-model="formData.duration" :min="1" :max="600" style="width: 100%" controls-position="right" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
          <el-col v-if="[2, 3].includes(formData.category)" :span="8">
            <el-form-item label="总集数" prop="totalEpisodes" :required="categoryRequiredFields.includes('totalEpisodes')">
              <el-input-number v-model="formData.totalEpisodes" :min="1" style="width: 100%" controls-position="right" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
          <el-col v-if="[2, 3].includes(formData.category)" :span="8">
            <el-form-item label="更新至">
              <el-input-number v-model="formData.updatedEpisodes" :min="0" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="语言">
              <el-input v-model="formData.language" placeholder="请输入语言" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="上映日期">
              <el-date-picker v-model="formData.releaseDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">规格配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="清晰度" prop="clarityLevel">
              <el-select v-model="formData.clarityLevel" placeholder="请选择清晰度" style="width: 100%" :disabled="isCoreFieldDisabled">
                <el-option v-for="item in clarityOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="分辨率" prop="resolution">
              <el-select v-model="formData.resolution" placeholder="请选择分辨率" style="width: 100%" filterable allow-create :disabled="isCoreFieldDisabled">
                <el-option v-for="item in RESOLUTION_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="码率(kbps)" prop="bitrate">
              <el-input-number v-model="formData.bitrate" :min="1" :max="50000" style="width: 100%" controls-position="right" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">资源与展示</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="封面图">
              <el-input v-model="formData.coverImage" placeholder="请输入图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="海报图">
              <el-input v-model="formData.posterImage" placeholder="请输入海报URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="视频地址">
              <el-input v-model="formData.videoUrl" placeholder="请输入视频URL" :disabled="isCoreFieldDisabled" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="标签">
              <el-select v-model="formData.tags" multiple filterable allow-create default-first-option placeholder="选择或输入" style="width: 100%">
                <el-option v-for="tag in formData.tags" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="VIP专享">
              <el-switch v-model="formData.isVip" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序权重">
              <el-input-number v-model="formData.sortOrder" :min="0" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="内容简介">
              <el-input v-model="formData.description" type="textarea" :rows="4" placeholder="请输入内容简介" maxlength="2000" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          :loading="submitLoading"
          class="ripple-btn"
          @click="handleSubmit"
        >
          {{ dialogMode === 'create' ? '创建并同步素材库' : '提交更新' }}
        </el-button>
      </template>
    </el-dialog>

    <QyAuditDialog
      v-model="auditDialogVisible"
      :batch-mode="batchAuditMode"
      :batch-count="selectedRows.length"
      @submit="handleAuditSubmit"
    />

    <el-dialog
      v-model="batchCategoryDialogVisible"
      title="批量修正分类"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-alert
        :title="`将对选中的 ${selectedRows.length} 条内容统一修改分类，不可操作的条目将自动跳过`"
        type="info"
        show-icon
        :closable="false"
        class="mb-16"
      />
      <el-form label-width="80px">
        <el-form-item label="目标分类">
          <el-select v-model="batchCategoryValue" placeholder="请选择目标分类" style="width: 100%">
            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchCategoryDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleBatchUpdateCategory">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.content-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-input {
  width: 240px;
}

.filter-select {
  width: 150px;
}

.title-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-cover {
  width: 40px;
  height: 56px;
  border-radius: $radius-sm;
  flex-shrink: 0;
  overflow: hidden;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-color;
  color: $text-placeholder;
  font-size: 18px;
}

.title-info {
  flex: 1;
  min-width: 0;
}

.title-text {
  display: block;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title-meta {
  margin-top: 4px;
}

.copyright-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 120px;
}

.play-count {
  font-weight: 600;
  color: $warning-color;
}

.text-secondary {
  color: $text-secondary;
}

.prerequisite-section {
  background: $bg-color;
  border-radius: $radius-md;
  padding: 16px;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: $font-md;
  margin-bottom: 12px;
  color: $warning-color;
}

.prerequisite-items {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.prerequisite-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: $font-sm;
  color: $text-secondary;

  &.completed {
    color: $success-color;
  }
}

.check-icon {
  color: $success-color;
  font-size: 16px;
}

.warn-icon {
  color: $warning-color;
  font-size: 16px;
}

.focus-scale-input {
  transition: $transition-base;

  &:focus-within {
    transform: scale(1.02);
    box-shadow: 0 0 0 2px rgba($primary-color, 0.2);
  }
}

.shake-error {
  animation: shake 0.4s ease;
  border-color: $danger-color !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.ripple-btn {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: $radius-circle;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease, opacity 0.6s ease;
    opacity: 0;
  }

  &:active::after {
    width: 200px;
    height: 200px;
    opacity: 1;
    transition: 0s;
  }
}

:deep(.content-row) {
  transition: background-color 0.2s ease;
}

:deep(.el-table__body tr.current-row > td) {
  background-color: rgba($primary-color, 0.08) !important;
}

:deep(.el-table__body tr:hover > td) {
  background-color: rgba($primary-color, 0.04) !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #fafafa;
}

:deep(.content-form) {
  .el-form-item.is-error .el-input__wrapper,
  .el-form-item.is-error .el-select .el-input__wrapper {
    border-color: $danger-color;
    animation: shake 0.4s ease;
  }
}

:deep(.content-dialog) {
  .el-dialog__body {
    max-height: 65vh;
    overflow-y: auto;
    padding: 20px 24px;
  }
}
</style>
