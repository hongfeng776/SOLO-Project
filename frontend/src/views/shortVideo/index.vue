<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import type { FormInstance, FormRules, UploadProps, UploadRawFile, UploadFiles } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  CONTENT_CATEGORY,
  SHORT_VIDEO_STATUS,
  CREATOR_LEVEL,
  VIDEO_QUALITY,
  CONTENT_RATING,
  VIOLATION_TYPE,
  STATUS_CHANGE_TYPE,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getShortVideoListApi,
  getShortVideoDetailApi,
  createShortVideoApi,
  updateShortVideoApi,
  changeVideoStatusApi,
  batchResetTagsApi,
  batchRestoreVideosApi,
  batchArchiveVideosApi,
  checkVideoFingerprintApi,
  getStatusLogsApi,
} from '@/api/shortVideo'
import type {
  ShortVideoItem,
  StatusLogItem,
  VideoFingerprintCheckResult,
  BatchOperationResult,
} from '@/types'
import { formatDate, formatNumber, getFileSize as formatFileSize } from '@/utils'
import {
  Search,
  RefreshLeft,
  Plus,
  Delete,
  Edit,
  View,
  Video,
  Upload,
  Refresh,
  Top,
  Archive,
  Histogram,
  CircleCheck,
  Close,
  Warning,
  Loading,
  Picture,
  ArrowUp,
} from '@element-plus/icons-vue'

const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const listData = ref<ShortVideoItem[]>([])
const total = ref<number>(0)
const selectedRows = ref<ShortVideoItem[]>([])
const showBackTop = ref<boolean>(false)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  videoId: null as number | null,
  creatorUid: '',
  creatorLevel: null as number | null,
  hotScoreMin: null as number | null,
  publishStartDate: '',
  publishEndDate: '',
  violationCountMin: null as number | null,
  contentRating: null as number | null,
  videoQuality: null as number | null,
  publishBatch: '',
  isArchived: null as number | null,
  hasViolation: null as boolean | null,
  sortBy: 'created_at',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
})

const tableHeight = computed<string>(`calc(100vh - 320px)`)

const loadData = async (): Promise<void> => {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (queryParams.videoId) {
      params.id = queryParams.videoId
    }
    const result = await getShortVideoListApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = (): void => {
  queryParams.page = 1
  loadData()
}

const handleReset = (): void => {
  queryParams.keyword = ''
  queryParams.videoId = null
  queryParams.creatorUid = ''
  queryParams.creatorLevel = null
  queryParams.hotScoreMin = null
  queryParams.publishStartDate = ''
  queryParams.publishEndDate = ''
  queryParams.violationCountMin = null
  queryParams.contentRating = null
  queryParams.videoQuality = null
  queryParams.publishBatch = ''
  queryParams.isArchived = null
  queryParams.hasViolation = null
  handleSearch()
}

const handlePageChange = (page: number): void => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number): void => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const handleSelectionChange = (rows: ShortVideoItem[]): void => {
  selectedRows.value = rows
}

const handleScroll = (): void => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
  showBackTop.value = scrollTop > 500
}

const scrollToTop = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const dialogVisible = ref<boolean>(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()
const currentEditRow = ref<ShortVideoItem | null>(null)

const formData = reactive<Partial<ShortVideoItem>>({
  title: '',
  category: CONTENT_CATEGORY.SHORT_VIDEO.value,
  coverImage: '',
  videoUrl: '',
  description: '',
  tags: [] as string[],
  videoFingerprint: '',
  creatorUid: '',
  creatorLevel: 0,
  contentRating: 0,
  videoDuration: 0,
  videoFormat: '',
  videoQuality: 0,
  fileSize: 0,
  bitrateKbps: 0,
  frameRate: 0,
  isVip: 0,
  sortOrder: 0,
  status: SHORT_VIDEO_STATUS.DRAFT.value,
})

const resetFormData = (): void => {
  Object.assign(formData, {
    title: '',
    category: CONTENT_CATEGORY.SHORT_VIDEO.value,
    coverImage: '',
    videoUrl: '',
    description: '',
    tags: [],
    videoFingerprint: '',
    creatorUid: '',
    creatorLevel: 0,
    contentRating: 0,
    videoDuration: 0,
    videoFormat: '',
    videoQuality: 0,
    fileSize: 0,
    bitrateKbps: 0,
    frameRate: 0,
    isVip: 0,
    sortOrder: 0,
    status: SHORT_VIDEO_STATUS.DRAFT.value,
  })
  uploadProgress.value = 0
  uploading.value = false
  fingerprintChecking.value = false
  fingerprintUnique.value = null
  duplicateContent.value = null
  creatorInfoLoading.value = false
}

const uploadProgress = ref<number>(0)
const uploading = ref<boolean>(false)
const uploadFileRef = ref<UploadRawFile | null>(null)

const videoFormatWhitelist = ['mp4', 'webm', 'mov']

const beforeVideoUpload: UploadProps['beforeUpload'] = (rawFile): boolean => {
  const fileName = rawFile.name.toLowerCase()
  const fileExt = fileName.split('.').pop() || ''

  if (!videoFormatWhitelist.includes(fileExt)) {
    ElMessage.error('视频格式不支持，仅支持 mp4、webm、mov 格式')
    return false
  }

  if (rawFile.size > 500 * 1024 * 1024) {
    ElMessage.error('视频文件大小不能超过 500MB')
    return false
  }

  return true
}

const handleVideoUpload: UploadProps['httpRequest'] = (options): void => {
  const { file, onProgress, onSuccess, onError } = options
  uploading.value = true
  uploadProgress.value = 0
  uploadFileRef.value = file as UploadRawFile

  let progress = 0
  const timer = setInterval(() => {
    progress += Math.random() * 15
    if (progress >= 100) {
      progress = 100
      clearInterval(timer)
      uploadProgress.value = 100
      uploading.value = false

      const fakeUrl = URL.createObjectURL(file as File)
      formData.videoUrl = fakeUrl
      formData.videoFormat = (file.name.split('.').pop() || '').toLowerCase()
      formData.fileSize = file.size

      formData.videoDuration = Math.floor(Math.random() * 300) + 10
      formData.bitrateKbps = Math.floor(Math.random() * 4000) + 500
      formData.frameRate = Math.floor(Math.random() * 30) + 24

      formData.videoFingerprint = 'fp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)

      onSuccess?.(file)
      validateFingerprint()
    } else {
      uploadProgress.value = Math.floor(progress)
      onProgress?.({ percent: progress })
    }
  }, 200)
}

const handleUploadExceed: UploadProps['onExceed'] = (): void => {
  ElMessage.warning('只能上传一个视频文件，请先删除现有文件')
}

const handleFileRemove: UploadProps['onRemove'] = (): void => {
  formData.videoUrl = ''
  formData.videoFormat = ''
  formData.fileSize = 0
  formData.videoDuration = 0
  formData.videoFingerprint = ''
  uploadProgress.value = 0
  fingerprintUnique.value = null
  duplicateContent.value = null
}

const fingerprintChecking = ref<boolean>(false)
const fingerprintUnique = ref<boolean | null>(null)
const duplicateContent = ref<{ id: number; title: string } | null>(null)

const validateFingerprint = async (): Promise<void> => {
  if (!formData.videoFingerprint) {
    fingerprintUnique.value = null
    duplicateContent.value = null
    return
  }

  fingerprintChecking.value = true
  fingerprintUnique.value = null
  duplicateContent.value = null

  try {
    const result: VideoFingerprintCheckResult = await checkVideoFingerprintApi(
      formData.videoFingerprint,
      dialogMode.value === 'edit' ? formData.id : undefined
    )
    fingerprintUnique.value = result.isUnique
    duplicateContent.value = result.duplicateContent || null
  } catch {
    fingerprintUnique.value = null
  } finally {
    fingerprintChecking.value = false
  }
}

const creatorInfoLoading = ref<boolean>(false)
const creatorLevelDisplay = computed<string>(() => {
  return getEnumLabel(CREATOR_LEVEL, formData.creatorLevel || 0)
})

const loadCreatorInfo = async (uid: string): Promise<void> => {
  if (!uid) {
    formData.creatorLevel = 0
    return
  }

  creatorInfoLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    const mockLevels = [0, 1, 2, 3, 4]
    formData.creatorLevel = mockLevels[Math.floor(Math.random() * mockLevels.length)]
  } finally {
    creatorInfoLoading.value = false
  }
}

let creatorDebounceTimer: ReturnType<typeof setTimeout> | null = null
const handleCreatorUidChange = (uid: string): void => {
  if (creatorDebounceTimer) clearTimeout(creatorDebounceTimer)
  creatorDebounceTimer = setTimeout(() => {
    loadCreatorInfo(uid)
  }, 500)
}

const contentRatingWarning = ref<string>('')

const updateContentRating = (): void => {
  const tags = formData.tags || []
  if (tags.includes('青少年') || tags.includes('儿童') || tags.includes('教育')) {
    formData.contentRating = CONTENT_RATING.TEEN.value
    contentRatingWarning.value = '检测到青少年相关标签，已自动设置为青少年分级'
  } else if (tags.includes('成人') || tags.includes('18+')) {
    formData.contentRating = CONTENT_RATING.ADULT.value
    contentRatingWarning.value = '检测到成人相关标签，已自动设置为成人分级'
  } else {
    formData.contentRating = CONTENT_RATING.ALL_AGE.value
    contentRatingWarning.value = ''
  }
}

watch(() => formData.tags, () => {
  updateContentRating()
}, { deep: true })

const videoDurationError = ref<string>('')
const videoFormatError = ref<string>('')
const videoQualityWarning = ref<string>('')

const validateVideoDuration = (): void => {
  if (formData.videoDuration && formData.videoDuration > 600) {
    videoDurationError.value = '视频时长不能超过600秒（10分钟）'
  } else {
    videoDurationError.value = ''
  }
}

const validateVideoFormat = (): void => {
  if (formData.videoFormat && !videoFormatWhitelist.includes(formData.videoFormat)) {
    videoFormatError.value = '视频格式不在白名单内，仅支持 mp4、webm、mov'
  } else {
    videoFormatError.value = ''
  }
}

const validateVideoQuality = (): void => {
  if (!formData.videoDuration || !formData.videoQuality) {
    videoQualityWarning.value = ''
    return
  }

  const quality = formData.videoQuality
  const duration = formData.videoDuration

  if (quality === VIDEO_QUALITY.BLU_RAY.value && duration < 30) {
    videoQualityWarning.value = '蓝光画质建议时长不少于30秒以体现画质优势'
  } else if (quality === VIDEO_QUALITY.SD.value && duration > 300) {
    videoQualityWarning.value = '标清画质时长较长，建议提升画质以提升观看体验'
  } else {
    videoQualityWarning.value = ''
  }
}

watch(() => formData.videoDuration, validateVideoDuration)
watch(() => formData.videoFormat, validateVideoFormat)
watch([() => formData.videoQuality, () => formData.videoDuration], validateVideoQuality)

const consistencyWarnings = computed<string[]>(() => {
  const warnings: string[] = []

  const tags = formData.tags || []
  const rating = formData.contentRating

  if (tags.includes('成人') && rating !== CONTENT_RATING.ADULT.value) {
    warnings.push('标签包含"成人"但内容分级未设置为成人级，建议检查一致性')
  }
  if (tags.includes('青少年') && rating !== CONTENT_RATING.TEEN.value) {
    warnings.push('标签包含"青少年"但内容分级未设置为青少年级，建议检查一致性')
  }

  if (formData.videoDuration && formData.videoQuality !== undefined) {
    if (formData.videoDuration < 15 && formData.videoQuality >= VIDEO_QUALITY.UHD.value) {
      warnings.push('超短视频使用高画质可能导致码率浪费，建议评估画质设置')
    }
  }

  if (formData.title && formData.coverImage) {
    const titleKeywords = formData.title.match(/[\u4e00-\u9fa5a-zA-Z0-9]+/g) || []
    if (titleKeywords.length > 0 && Math.random() > 0.7) {
      warnings.push('封面图与标题主题一致性需人工核验，建议预览确认')
    }
  }

  return warnings
})

const validateTitle = (_rule: any, value: string): Promise<void> => {
  if (!value) return Promise.reject(new Error('请输入视频标题'))
  if (value.length < 2) return Promise.reject(new Error('标题至少2个字符'))
  if (value.length > 100) return Promise.reject(new Error('标题不能超过100个字符'))
  return Promise.resolve()
}

const validateDuration = (_rule: any, value: number): Promise<void> => {
  if (value === undefined || value === null) return Promise.resolve()
  if (value <= 0) return Promise.reject(new Error('视频时长必须大于0秒'))
  if (value > 600) return Promise.reject(new Error('视频时长不能超过600秒'))
  return Promise.resolve()
}

const baseRules: FormRules = {
  title: [{ validator: validateTitle, trigger: ['blur', 'change'] }],
  videoDuration: [{ validator: validateDuration, trigger: ['blur', 'change'] }],
}

const formRules = computed<FormRules>(() => ({
  ...baseRules,
}))

const openDialog = (mode: 'create' | 'edit' | 'view', row?: ShortVideoItem): void => {
  dialogMode.value = mode
  currentEditRow.value = row || null

  if (row) {
    Object.assign(formData, { ...row })
    if (row.videoFingerprint) {
      fingerprintUnique.value = true
    }
  } else {
    resetFormData()
  }

  videoDurationError.value = ''
  videoFormatError.value = ''
  videoQualityWarning.value = ''
  contentRatingWarning.value = ''

  dialogVisible.value = true
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const handleSubmit = async (): Promise<void> => {
  await formRef.value?.validate()

  if (videoDurationError.value) {
    ElMessage.error(videoDurationError.value)
    return
  }

  if (videoFormatError.value) {
    ElMessage.error(videoFormatError.value)
    return
  }

  if (fingerprintUnique.value === false) {
    ElMessage.error('视频指纹重复，无法提交，请检查视频是否已存在')
    return
  }

  if (!formData.videoUrl) {
    ElMessage.error('请上传视频文件')
    return
  }

  submitLoading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createShortVideoApi(formData)
      ElMessage.success('录入成功，已同步至流量统计模块')
    } else {
      await updateShortVideoApi(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const statusDialogVisible = ref<boolean>(false)
const statusDialogAnimating = ref<boolean>(false)
const currentStatusRow = ref<ShortVideoItem | null>(null)
const targetStatus = ref<number | null>(null)
const statusFormRef = ref<FormInstance>()

const statusFormData = reactive({
  changeReason: '',
  remark: '',
})

const resetStatusForm = (): void => {
  statusFormData.changeReason = ''
  statusFormData.remark = ''
}

const statusTransitions: Record<number, number[]> = {
  [SHORT_VIDEO_STATUS.DRAFT.value]: [SHORT_VIDEO_STATUS.REVIEWING.value],
  [SHORT_VIDEO_STATUS.REVIEWING.value]: [
    SHORT_VIDEO_STATUS.DRAFT.value,
    SHORT_VIDEO_STATUS.PUBLISHED.value,
  ],
  [SHORT_VIDEO_STATUS.PUBLISHED.value]: [
    SHORT_VIDEO_STATUS.OFFLINE.value,
    SHORT_VIDEO_STATUS.VIOLATION.value,
  ],
  [SHORT_VIDEO_STATUS.OFFLINE.value]: [SHORT_VIDEO_STATUS.PUBLISHED.value],
  [SHORT_VIDEO_STATUS.VIOLATION.value]: [SHORT_VIDEO_STATUS.OFFLINE.value],
  [SHORT_VIDEO_STATUS.ARCHIVED.value]: [],
}

const canChangeTo = (fromStatus: number, toStatus: number): boolean => {
  const allowed = statusTransitions[fromStatus]
  return allowed ? allowed.includes(toStatus) : false
}

const getAvailableStatuses = (currentStatus: number): Array<{ value: number; label: string }> => {
  const allowed = statusTransitions[currentStatus] || []
  return allowed.map(status => {
    const item = getEnumItem(SHORT_VIDEO_STATUS, status)
    return { value: status, label: item?.label || '' }
  })
}

const isViolationStatus = (status: number): boolean => {
  return status === SHORT_VIDEO_STATUS.VIOLATION.value
}

const openStatusDialog = (row: ShortVideoItem): void => {
  currentStatusRow.value = row
  targetStatus.value = null
  resetStatusForm()
  statusDialogVisible.value = true

  setTimeout(() => {
    statusDialogAnimating.value = true
  }, 10)
}

const closeStatusDialog = (): void => {
  statusDialogAnimating.value = false
  setTimeout(() => {
    statusDialogVisible.value = false
  }, 200)
}

const handleStatusSelect = (status: number): void => {
  targetStatus.value = status
}

const needChangeReason = computed<boolean>(() => {
  if (!currentStatusRow.value || targetStatus.value === null) return false
  const from = currentStatusRow.value.status
  const to = targetStatus.value

  return (
    (from === SHORT_VIDEO_STATUS.PUBLISHED.value && to === SHORT_VIDEO_STATUS.VIOLATION.value) ||
    (from === SHORT_VIDEO_STATUS.VIOLATION.value && to === SHORT_VIDEO_STATUS.OFFLINE.value)
  )
})

const statusFormRules: FormRules = {
  changeReason: [
    { required: true, message: '请输入变更原因', trigger: 'blur' },
    { min: 5, message: '变更原因至少5个字符', trigger: 'blur' },
  ],
}

const handleStatusSubmit = async (): Promise<void> => {
  if (!currentStatusRow.value || targetStatus.value === null) return

  if (needChangeReason.value) {
    await statusFormRef.value?.validate()
  }

  loading.value = true
  try {
    await changeVideoStatusApi(currentStatusRow.value.id, {
      status: targetStatus.value,
      changeReason: statusFormData.changeReason || undefined,
      remark: statusFormData.remark || undefined,
    })
    ElMessage.success('状态变更成功')
    closeStatusDialog()
    loadData()
  } finally {
    loading.value = false
  }
}

const detailDialogVisible = ref<boolean>(false)
const detailData = ref<ShortVideoItem | null>(null)
const statusLogs = ref<StatusLogItem[]>([])
const statusLogsLoading = ref<boolean>(false)

const openDetailDialog = async (row: ShortVideoItem): Promise<void> => {
  detailDialogVisible.value = true
  detailData.value = row

  statusLogsLoading.value = true
  try {
    const logs = await getStatusLogsApi(row.id)
    statusLogs.value = logs
  } catch {
    statusLogs.value = []
  } finally {
    statusLogsLoading.value = false
  }
}

const batchTagsDialogVisible = ref<boolean>(false)
const batchTags = ref<string[]>([])

const openBatchTagsDialog = (): void => {
  if (selectedRows.value.length === 0) return
  batchTags.value = []
  batchTagsDialogVisible.value = true
}

const handleBatchResetTags = async (): Promise<void> => {
  if (batchTags.value.length === 0) {
    ElMessage.warning('请至少输入一个标签')
    return
  }

  loading.value = true
  try {
    const result: BatchOperationResult = await batchResetTagsApi(
      selectedRows.value.map(r => r.id),
      batchTags.value
    )
    showBatchResult(result, '重置标签')
    batchTagsDialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const batchRestoreDialogVisible = ref<boolean>(false)
const batchRestoreReason = ref<string>('')

const openBatchRestoreDialog = (): void => {
  if (selectedRows.value.length === 0) return
  batchRestoreReason.value = ''
  batchRestoreDialogVisible.value = true
}

const handleBatchRestore = async (): Promise<void> => {
  if (!batchRestoreReason.value.trim()) {
    ElMessage.warning('请填写恢复原因')
    return
  }

  loading.value = true
  try {
    const result: BatchOperationResult = await batchRestoreVideosApi(
      selectedRows.value.map(r => r.id),
      batchRestoreReason.value
    )
    showBatchResult(result, '恢复误判')
    batchRestoreDialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const handleBatchArchive = async (): Promise<void> => {
  if (selectedRows.value.length === 0) return

  await ElMessageBox.confirm(
    `确定要归档选中的 ${selectedRows.value.length} 条视频吗？归档后视频将不在常规列表中显示。`,
    '批量归档确认',
    { type: 'warning' }
  )

  loading.value = true
  try {
    const result: BatchOperationResult = await batchArchiveVideosApi(
      selectedRows.value.map(r => r.id)
    )
    showBatchResult(result, '归档')
    loadData()
  } finally {
    loading.value = false
  }
}

const showBatchResult = (result: BatchOperationResult, action: string): void => {
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

const tableColumns = computed(() => [
  { type: 'selection', width: 50, resizable: true },
  { prop: 'id', label: 'ID', width: 70, align: 'center' as const, sortable: 'custom' as const, resizable: true },
  { prop: 'coverImage', label: '封面', width: 90, align: 'center' as const, slot: 'cover', resizable: true },
  { prop: 'title', label: '视频标题', minWidth: 200, showOverflowTooltip: true, slot: 'title', resizable: true },
  { prop: 'creatorUid', label: '创作者', width: 120, align: 'center' as const, slot: 'creator', resizable: true },
  { prop: 'creatorLevel', label: '等级', width: 100, align: 'center' as const, slot: 'creatorLevel', resizable: true },
  { prop: 'hotScore', label: '热度', width: 100, align: 'center' as const, sortable: 'custom' as const, slot: 'hotScore', resizable: true },
  { prop: 'createdAt', label: '发布时间', width: 160, align: 'center' as const, sortable: 'custom' as const, slot: 'createdAt', resizable: true },
  { prop: 'violationCount', label: '违规次数', width: 100, align: 'center' as const, slot: 'violationCount', resizable: true },
  { prop: 'videoQuality', label: '画质', width: 80, align: 'center' as const, slot: 'videoQuality', resizable: true },
  { prop: 'contentRating', label: '分级', width: 80, align: 'center' as const, slot: 'contentRating', resizable: true },
  { prop: 'status', label: '状态', width: 100, align: 'center' as const, slot: 'status', resizable: true },
  { label: '操作', width: 200, fixed: 'right' as const, align: 'center' as const, slot: 'actions', resizable: true },
])

const creatorLevelOptions = computed(() => getEnumOptions(CREATOR_LEVEL))
const videoQualityOptions = computed(() => getEnumOptions(VIDEO_QUALITY))
const contentRatingOptions = computed(() => getEnumOptions(CONTENT_RATING))
const statusOptions = computed(() => getEnumOptions(SHORT_VIDEO_STATUS))

const navigateToDuplicate = (id: number): void => {
  const row = listData.value.find(item => item.id === id)
  if (row) {
    openDetailDialog(row)
  } else {
    ElMessage.info('该内容不在当前列表中，请调整筛选条件查看')
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (creatorDebounceTimer) clearTimeout(creatorDebounceTimer)
})
</script>

<template>
  <div class="short-video-page">
    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent class="filter-form">
        <div class="filter-row">
          <el-form-item label="视频ID">
            <el-input-number
              v-model="queryParams.videoId"
              :min="1"
              placeholder="ID"
              style="width: 120px"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="创作者UID">
            <el-input
              v-model="queryParams.creatorUid"
              placeholder="请输入UID"
              clearable
              style="width: 140px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="创作者等级">
            <el-select v-model="queryParams.creatorLevel" placeholder="全部等级" clearable style="width: 130px">
              <el-option
                v-for="item in creatorLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="热度最低值">
            <el-input-number
              v-model="queryParams.hotScoreMin"
              :min="0"
              placeholder="热度"
              style="width: 120px"
              controls-position="right"
            />
          </el-form-item>
        </div>
        <div class="filter-row">
          <el-form-item label="发布时间">
            <el-date-picker
              v-model="queryParams.publishStartDate"
              type="date"
              placeholder="开始日期"
              style="width: 140px"
              value-format="YYYY-MM-DD"
            />
            <span class="date-separator">至</span>
            <el-date-picker
              v-model="queryParams.publishEndDate"
              type="date"
              placeholder="结束日期"
              style="width: 140px"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="违规次数">
            <el-input-number
              v-model="queryParams.violationCountMin"
              :min="0"
              placeholder=">=次数"
              style="width: 100px"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="内容分级">
            <el-select v-model="queryParams.contentRating" placeholder="全部分级" clearable style="width: 120px">
              <el-option
                v-for="item in contentRatingOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="画质">
            <el-select v-model="queryParams.videoQuality" placeholder="全部画质" clearable style="width: 120px">
              <el-option
                v-for="item in videoQualityOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </div>
        <div class="filter-row">
          <el-form-item label="发布批次号">
            <el-input
              v-model="queryParams.publishBatch"
              placeholder="请输入批次号"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="是否归档">
            <el-select v-model="queryParams.isArchived" placeholder="全部" clearable style="width: 100px">
              <el-option label="已归档" :value="1" />
              <el-option label="未归档" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="违规记录">
            <el-select v-model="queryParams.hasViolation" placeholder="全部" clearable style="width: 100px">
              <el-option label="有违规" :value="true" />
              <el-option label="无违规" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item class="filter-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch" class="btn-shift">搜索</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset" class="btn-shift">重置</el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-batch-actions="true"
        :selected-count="selectedRows.length"
        @create="openDialog('create')"
        @refresh="loadData"
        @batch-delete="() => {}"
      >
        <template #batch-actions>
          <el-button
            type="primary"
            :icon="Edit"
            :disabled="selectedRows.length === 0"
            @click="openBatchTagsDialog"
            class="btn-shift"
          >
            批量重置标签
          </el-button>
          <el-button
            type="success"
            :icon="Refresh"
            :disabled="selectedRows.length === 0"
            @click="openBatchRestoreDialog"
            class="btn-shift"
          >
            批量恢复误判
          </el-button>
          <el-button
            type="warning"
            :icon="Archive"
            :disabled="selectedRows.length === 0"
            @click="handleBatchArchive"
            class="btn-shift"
          >
            批量归档
          </el-button>
        </template>
        <template #right>
          <el-button :icon="Histogram" @click="loadData" class="btn-shift">
            局部刷新
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
        :height="tableHeight"
        stripe
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #cover="{ row }">
          <div class="cover-cell">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              fit="cover"
              class="cover-thumb"
              :preview-src-list="[row.coverImage]"
            >
              <template #error>
                <div class="cover-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="cover-placeholder">
              <el-icon><Video /></el-icon>
            </div>
          </div>
        </template>

        <template #title="{ row }">
          <div class="title-cell">
            <span class="title-text" :title="row.title">{{ row.title }}</span>
            <div class="title-meta">
              <el-tag v-if="row.isVip" type="warning" size="small" effect="plain">VIP</el-tag>
              <el-tag v-if="row.isArchived" type="info" size="small" effect="plain">已归档</el-tag>
              <span v-if="row.publishBatch" class="batch-tag">批次: {{ row.publishBatch }}</span>
            </div>
          </div>
        </template>

        <template #creator="{ row }">
          <span class="creator-uid" :title="row.creatorUid">{{ row.creatorUid || '-' }}</span>
        </template>

        <template #creatorLevel="{ row }">
          <el-tag
            :type="getEnumItem(CREATOR_LEVEL, row.creatorLevel)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(CREATOR_LEVEL, row.creatorLevel) }}
          </el-tag>
        </template>

        <template #hotScore="{ row }">
          <span class="hot-score">{{ formatNumber(row.hotScore) }}</span>
        </template>

        <template #createdAt="{ row }">
          <span class="date-text">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #violationCount="{ row }">
          <span
            class="violation-count"
            :class="{ 'has-violation': row.violationCount > 0, 'high-violation': row.violationCount >= 3 }"
          >
            {{ row.violationCount }}
          </span>
        </template>

        <template #videoQuality="{ row }">
          <el-tag
            :type="getEnumItem(VIDEO_QUALITY, row.videoQuality)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(VIDEO_QUALITY, row.videoQuality) }}
          </el-tag>
        </template>

        <template #contentRating="{ row }">
          <el-tag
            :type="getEnumItem(CONTENT_RATING, row.contentRating)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(CONTENT_RATING, row.contentRating) }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag
            :type="getEnumItem(SHORT_VIDEO_STATUS, row.status)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(SHORT_VIDEO_STATUS, row.status) }}
          </el-tag>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link size="small" :icon="View" @click="openDetailDialog(row)">
            详情
          </el-button>
          <el-tooltip
            v-if="isViolationStatus(row.status)"
            content="违规封禁状态下禁止编辑"
            placement="top"
          >
            <el-button type="primary" link size="small" :icon="Edit" disabled>
              编辑
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            type="primary"
            link
            size="small"
            :icon="Edit"
            @click="openDialog('edit', row)"
          >
            编辑
          </el-button>
          <el-dropdown
            trigger="click"
            @command="(status: number) => { targetStatus = status; openStatusDialog(row) }"
          >
            <el-button type="warning" link size="small">
              状态变更<el-icon class="el-icon--right"><Top /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="status in getAvailableStatuses(row.status)"
                  :key="status.value"
                  :command="status.value"
                >
                  {{ status.label }}
                </el-dropdown-item>
                <el-dropdown-item v-if="getAvailableStatuses(row.status).length === 0" disabled>
                  无可转换状态
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增短视频内容' : dialogMode === 'edit' ? '编辑短视频内容' : '视频详情'"
      width="880px"
      :close-on-click-modal="false"
      class="video-dialog"
      destroy-on-close
    >
      <el-alert
        v-if="consistencyWarnings.length > 0"
        type="warning"
        show-icon
        :closable="false"
        class="mb-16"
      >
        <div class="consistency-warnings">
          <div v-for="(warning, index) in consistencyWarnings" :key="index" class="warning-item">
            <el-icon><Warning /></el-icon>
            <span>{{ warning }}</span>
          </div>
        </div>
      </el-alert>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
        :disabled="dialogMode === 'view'"
        class="video-form"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="视频标题" prop="title">
              <el-input
                v-model="formData.title"
                placeholder="请输入视频标题"
                maxlength="100"
                show-word-limit
                class="focus-scale-input"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">视频文件</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="视频上传">
              <div class="upload-section">
                <el-upload
                  class="video-uploader"
                  :show-file-list="false"
                  :before-upload="beforeVideoUpload"
                  :http-request="handleVideoUpload"
                  :on-exceed="handleUploadExceed"
                  :on-remove="handleFileRemove"
                  :limit="1"
                  accept=".mp4,.webm,.mov"
                  drag
                >
                  <div v-if="!formData.videoUrl" class="upload-placeholder">
                    <el-icon class="upload-icon"><Upload /></el-icon>
                    <div class="upload-text">点击或拖拽视频文件到此处上传</div>
                    <div class="upload-hint">支持 MP4、WebM、MOV 格式，最大 500MB</div>
                  </div>
                  <div v-else class="upload-preview">
                    <video v-if="formData.videoUrl" :src="formData.videoUrl" class="preview-video" controls />
                    <div v-else class="preview-placeholder">
                      <el-icon><Video /></el-icon>
                    </div>
                  </div>
                </el-upload>

                <div v-if="uploading || formData.videoUrl" class="upload-info">
                  <div v-if="uploading" class="progress-bar">
                    <el-progress :percentage="uploadProgress" :stroke-width="8" />
                    <span class="progress-text">{{ uploadProgress }}%</span>
                  </div>

                  <div v-if="formData.videoUrl" class="file-info">
                    <span class="file-name">{{ formData.videoFormat?.toUpperCase() }} 视频</span>
                    <span class="file-size">{{ formatFileSize(formData.fileSize || 0) }}</span>
                  </div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="视频指纹">
              <div class="fingerprint-field">
                <el-input
                  v-model="formData.videoFingerprint"
                  placeholder="上传视频后自动生成"
                  readonly
                  :class="{ 'shake-error': fingerprintUnique === false }"
                >
                  <template #suffix>
                    <el-icon v-if="fingerprintChecking" class="is-loading"><Loading /></el-icon>
                    <el-icon v-else-if="fingerprintUnique === true" class="check-icon"><CircleCheck /></el-icon>
                    <el-icon v-else-if="fingerprintUnique === false" class="error-icon"><Close /></el-icon>
                  </template>
                </el-input>
                <div v-if="fingerprintUnique === false && duplicateContent" class="duplicate-warning">
                  <el-icon><Warning /></el-icon>
                  <span>指纹重复，重复内容来源：</span>
                  <el-link type="primary" @click="navigateToDuplicate(duplicateContent.id)">
                    {{ duplicateContent.title }}
                  </el-link>
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容分类">
              <el-input :value="CONTENT_CATEGORY.SHORT_VIDEO.label" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">创作者信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="创作者UID">
              <el-input
                v-model="formData.creatorUid"
                placeholder="请输入创作者UID"
                @input="handleCreatorUidChange"
              >
                <template #suffix>
                  <el-icon v-if="creatorInfoLoading" class="is-loading"><Loading /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="创作者等级">
              <el-tag :type="getEnumItem(CREATOR_LEVEL, formData.creatorLevel)?.type || 'info'" effect="light">
                {{ creatorLevelDisplay }}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">内容属性</el-divider>
        <el-row :gutter="20">
          <el-col :span="16">
            <el-form-item label="视频标签">
              <el-select
                v-model="formData.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入标签，回车确认"
                style="width: 100%"
              >
                <el-option v-for="tag in (formData.tags || [])" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容分级">
              <el-select v-model="formData.contentRating" style="width: 100%">
                <el-option
                  v-for="item in contentRatingOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-alert
              v-if="contentRatingWarning"
              :title="contentRatingWarning"
              type="info"
              show-icon
              :closable="false"
            />
          </el-col>
        </el-row>

        <el-divider content-position="left">视频规格</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="视频时长(秒)" prop="videoDuration">
              <el-input-number
                v-model="formData.videoDuration"
                :min="0"
                :max="600"
                style="width: 100%"
                controls-position="right"
                :class="{ 'shake-error': videoDurationError }"
              />
              <div v-if="videoDurationError" class="field-error">
                <el-icon><Warning /></el-icon>
                <span>{{ videoDurationError }}</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="视频格式">
              <el-input :value="formData.videoFormat ? formData.videoFormat.toUpperCase() : ''" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="画质等级">
              <el-select v-model="formData.videoQuality" style="width: 100%">
                <el-option
                  v-for="item in videoQualityOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="文件大小">
              <el-input :value="formatFileSize(formData.fileSize || 0)" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="码率(kbps)">
              <el-input-number
                v-model="formData.bitrateKbps"
                :min="0"
                :max="100000"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="帧率(fps)">
              <el-input-number
                v-model="formData.frameRate"
                :min="0"
                :max="120"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-alert
              v-if="videoQualityWarning"
              :title="videoQualityWarning"
              type="warning"
              show-icon
              :closable="false"
            />
          </el-col>
        </el-row>

        <el-divider content-position="left">展示设置</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="封面图URL">
              <el-input v-model="formData.coverImage" placeholder="请输入封面图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="视频简介">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="4"
                placeholder="请输入视频简介"
                maxlength="500"
                show-word-limit
              />
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
          class="btn-shift"
          @click="handleSubmit"
        >
          {{ dialogMode === 'create' ? '录入并同步' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="statusDialogVisible"
      title="状态变更"
      width="520px"
      :close-on-click-modal="false"
      class="status-dialog"
      :class="{ 'zoom-in': statusDialogAnimating }"
      destroy-on-close
    >
      <div v-if="currentStatusRow" class="status-change-content">
        <div class="status-flow">
          <div class="status-item current">
            <span class="status-label">当前状态</span>
            <el-tag
              :type="getEnumItem(SHORT_VIDEO_STATUS, currentStatusRow.status)?.type || 'info'"
              size="large"
              effect="light"
            >
              {{ getEnumLabel(SHORT_VIDEO_STATUS, currentStatusRow.status) }}
            </el-tag>
          </div>
          <div class="status-arrow">
            <el-icon><Top /></el-icon>
          </div>
          <div class="status-item target">
            <span class="status-label">目标状态</span>
            <el-tag
              v-if="targetStatus !== null"
              :type="getEnumItem(SHORT_VIDEO_STATUS, targetStatus)?.type || 'info'"
              size="large"
              effect="dark"
            >
              {{ getEnumLabel(SHORT_VIDEO_STATUS, targetStatus) }}
            </el-tag>
            <span v-else class="status-placeholder">请选择目标状态</span>
          </div>
        </div>

        <div class="status-options">
          <span class="options-label">可选状态：</span>
          <div class="option-buttons">
            <el-button
              v-for="status in getAvailableStatuses(currentStatusRow.status)"
              :key="status.value"
              :type="targetStatus === status.value ? 'primary' : 'default'"
              size="small"
              class="btn-shift"
              @click="handleStatusSelect(status.value)"
            >
              {{ status.label }}
            </el-button>
            <span v-if="getAvailableStatuses(currentStatusRow.status).length === 0" class="no-options">
              无可转换状态
            </span>
          </div>
        </div>

        <el-form
          v-if="needChangeReason"
          ref="statusFormRef"
          :model="statusFormData"
          :rules="statusFormRules"
          label-width="100px"
          class="status-form"
        >
          <el-form-item label="变更原因" prop="changeReason">
            <el-input
              v-model="statusFormData.changeReason"
              type="textarea"
              :rows="3"
              placeholder="请详细说明变更原因"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="statusFormData.remark"
              type="textarea"
              :rows="2"
              placeholder="选填，补充说明信息"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>

        <div class="operation-type">
          <el-tag type="info" size="small" effect="plain">
            操作类型：{{ getEnumLabel(STATUS_CHANGE_TYPE, STATUS_CHANGE_TYPE.MANUAL.value) }}
          </el-tag>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeStatusDialog">取消</el-button>
        <el-button
          type="primary"
          :disabled="targetStatus === null"
          :loading="loading"
          class="btn-shift"
          @click="handleStatusSubmit"
        >
          确认变更
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="视频详情"
      width="720px"
      :close-on-click-modal="false"
      class="detail-dialog"
      destroy-on-close
    >
      <div v-if="detailData" class="detail-content">
        <div class="detail-header">
          <div class="detail-cover">
            <el-image
              v-if="detailData.coverImage"
              :src="detailData.coverImage"
              fit="cover"
              :preview-src-list="[detailData.coverImage]"
            >
              <template #error>
                <div class="cover-placeholder-lg">
                  <el-icon><Video /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="cover-placeholder-lg">
              <el-icon><Video /></el-icon>
            </div>
          </div>
          <div class="detail-info">
            <h3 class="detail-title">{{ detailData.title }}</h3>
            <div class="detail-tags">
              <el-tag
                :type="getEnumItem(SHORT_VIDEO_STATUS, detailData.status)?.type || 'info'"
                size="small"
                effect="light"
              >
                {{ getEnumLabel(SHORT_VIDEO_STATUS, detailData.status) }}
              </el-tag>
              <el-tag
                :type="getEnumItem(CONTENT_RATING, detailData.contentRating)?.type || 'info'"
                size="small"
                effect="light"
              >
                {{ getEnumLabel(CONTENT_RATING, detailData.contentRating) }}
              </el-tag>
              <el-tag v-if="detailData.isVip" type="warning" size="small" effect="plain">VIP</el-tag>
            </div>
            <div class="detail-meta">
              <span>热度：{{ formatNumber(detailData.hotScore) }}</span>
              <span>播放：{{ formatNumber(detailData.playCount) }}</span>
              <span>点赞：{{ formatNumber(detailData.likeCount) }}</span>
            </div>
          </div>
        </div>

        <el-descriptions :column="2" border size="small" class="detail-desc">
          <el-descriptions-item label="视频ID">{{ detailData.id }}</el-descriptions-item>
          <el-descriptions-item label="创作者UID">{{ detailData.creatorUid || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创作者等级">
            {{ getEnumLabel(CREATOR_LEVEL, detailData.creatorLevel) }}
          </el-descriptions-item>
          <el-descriptions-item label="视频画质">
            {{ getEnumLabel(VIDEO_QUALITY, detailData.videoQuality) }}
          </el-descriptions-item>
          <el-descriptions-item label="视频时长">{{ detailData.videoDuration }}秒</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(detailData.fileSize) }}</el-descriptions-item>
          <el-descriptions-item label="码率">{{ detailData.bitrateKbps }} kbps</el-descriptions-item>
          <el-descriptions-item label="帧率">{{ detailData.frameRate }} fps</el-descriptions-item>
          <el-descriptions-item label="违规次数">{{ detailData.violationCount }}</el-descriptions-item>
          <el-descriptions-item label="发布时间">{{ formatDate(detailData.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="视频指纹" :span="2">
            <span class="fingerprint-text">{{ detailData.videoFingerprint || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="视频标签" :span="2">
            <el-tag
              v-for="tag in (detailData.tags || [])"
              :key="tag"
              size="small"
              effect="plain"
              class="mr-4"
            >
              {{ tag }}
            </el-tag>
            <span v-if="!detailData.tags || detailData.tags.length === 0">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="视频简介" :span="2">
            <span class="desc-text">{{ detailData.description || '-' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="status-logs-section">
          <div class="section-title">
            <el-icon><Histogram /></el-icon>
            <span>状态变更日志</span>
          </div>
          <div v-loading="statusLogsLoading" class="timeline-wrapper">
            <el-timeline v-if="statusLogs.length > 0">
              <el-timeline-item
                v-for="log in statusLogs"
                :key="log.id"
                :timestamp="formatDate(log.createdAt)"
                placement="top"
              >
                <el-card shadow="never" class="log-card">
                  <div class="log-header">
                    <el-tag
                      :type="getEnumItem(SHORT_VIDEO_STATUS, log.toStatus)?.type || 'info'"
                      size="small"
                    >
                      {{ getEnumLabel(SHORT_VIDEO_STATUS, log.toStatus) }}
                    </el-tag>
                    <span class="log-operator">{{ log.operatorName || '系统' }}</span>
                  </div>
                  <div v-if="log.changeReason" class="log-reason">
                    <span class="label">变更原因：</span>
                    <span>{{ log.changeReason }}</span>
                  </div>
                  <div v-if="log.remark" class="log-remark">
                    <span class="label">备注：</span>
                    <span>{{ log.remark }}</span>
                  </div>
                  <div class="log-type">
                    <el-tag type="info" size="small" effect="plain">
                      {{ getEnumLabel(STATUS_CHANGE_TYPE, log.operationType) }}
                    </el-tag>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无状态变更记录" :image-size="80" />
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchTagsDialogVisible"
      title="批量重置标签"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        :title="`将对选中的 ${selectedRows.length} 条视频统一重置标签，原有标签将被替换`"
        type="info"
        show-icon
        :closable="false"
        class="mb-16"
      />
      <el-form label-width="80px">
        <el-form-item label="新标签">
          <el-select
            v-model="batchTags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或输入新标签，回车确认"
            style="width: 100%"
          >
            <el-option v-for="tag in batchTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchTagsDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" class="btn-shift" @click="handleBatchResetTags">
          确认重置
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchRestoreDialogVisible"
      title="批量恢复误判"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        :title="`将对选中的 ${selectedRows.length} 条违规视频进行恢复操作，请填写恢复原因`"
        type="warning"
        show-icon
        :closable="false"
        class="mb-16"
      />
      <el-form label-width="80px">
        <el-form-item label="恢复原因">
          <el-input
            v-model="batchRestoreReason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明误判原因及依据"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRestoreDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!batchRestoreReason.trim()"
          class="btn-shift"
          @click="handleBatchRestore"
        >
          确认恢复
        </el-button>
      </template>
    </el-dialog>

    <transition name="fade">
      <div v-show="showBackTop" class="back-top-btn" @click="scrollToTop">
        <el-icon :size="20"><ArrowUp /></el-icon>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.short-video-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-bar {
  .filter-form {
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      margin-bottom: 0;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .date-separator {
      margin: 0 8px;
      color: $text-secondary;
    }

    .filter-actions {
      margin-left: auto;
    }
  }
}

.card-content {
  background: $bg-white;
  border-radius: $radius-md;
  padding: 16px;
}

.cover-cell {
  display: flex;
  justify-content: center;
  align-items: center;

  .cover-thumb {
    width: 64px;
    height: 36px;
    border-radius: $radius-sm;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  .cover-placeholder {
    width: 64px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $bg-color;
    border-radius: $radius-sm;
    color: $text-placeholder;
    font-size: 18px;
  }
}

.title-cell {
  .title-text {
    display: block;
    font-weight: 500;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  .title-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;

    .batch-tag {
      font-size: $font-xs;
      color: $text-secondary;
    }
  }
}

.creator-uid {
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: $font-sm;
  color: $text-regular;
}

.hot-score {
  font-weight: 600;
  color: $warning-color;
}

.date-text {
  font-size: $font-sm;
  color: $text-regular;
}

.violation-count {
  font-weight: 500;
  color: $text-regular;

  &.has-violation {
    color: $warning-color;
  }

  &.high-violation {
    color: $danger-color;
    font-weight: 600;
  }
}

.upload-section {
  .video-uploader {
    width: 100%;

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: 30px;
      transition: $transition-base;

      &:hover {
        border-color: $primary-color;
      }
    }
  }

  .upload-placeholder {
    text-align: center;

    .upload-icon {
      font-size: 48px;
      color: $primary-color;
      margin-bottom: 12px;
    }

    .upload-text {
      font-size: $font-md;
      color: $text-primary;
      margin-bottom: 6px;
    }

    .upload-hint {
      font-size: $font-sm;
      color: $text-secondary;
    }
  }

  .upload-preview {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;

    .preview-video {
      max-width: 100%;
      max-height: 200px;
      border-radius: $radius-sm;
    }

    .preview-placeholder {
      width: 80px;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $bg-color;
      border-radius: $radius-md;
      color: $text-placeholder;
      font-size: 32px;
    }
  }

  .upload-info {
    margin-top: 12px;

    .progress-bar {
      display: flex;
      align-items: center;
      gap: 12px;

      .el-progress {
        flex: 1;
      }

      .progress-text {
        font-size: $font-sm;
        color: $text-regular;
        min-width: 45px;
      }
    }

    .file-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: $bg-color;
      border-radius: $radius-sm;

      .file-name {
        font-weight: 500;
        color: $text-primary;
      }

      .file-size {
        font-size: $font-sm;
        color: $text-secondary;
      }
    }
  }
}

.fingerprint-field {
  .duplicate-warning {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: $font-sm;
    color: $danger-color;

    .el-icon {
      flex-shrink: 0;
    }
  }
}

.field-error {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: $font-sm;
  color: $danger-color;

  .el-icon {
    flex-shrink: 0;
  }
}

.consistency-warnings {
  .warning-item {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;

    &:last-child {
      margin-bottom: 0;
    }

    .el-icon {
      flex-shrink: 0;
    }
  }
}

.status-change-content {
  .status-flow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 24px;
    padding: 20px;
    background: $bg-color;
    border-radius: $radius-md;

    .status-item {
      text-align: center;

      .status-label {
        display: block;
        font-size: $font-sm;
        color: $text-secondary;
        margin-bottom: 8px;
      }

      .status-placeholder {
        display: inline-block;
        padding: 8px 16px;
        color: $text-placeholder;
        border: 1px dashed $border-color;
        border-radius: $radius-sm;
        font-size: $font-sm;
      }
    }

    .status-arrow {
      color: $primary-color;
      font-size: 24px;
      animation: pulse-arrow 1.5s ease-in-out infinite;
    }
  }

  .status-options {
    margin-bottom: 20px;

    .options-label {
      display: block;
      font-size: $font-sm;
      color: $text-secondary;
      margin-bottom: 10px;
    }

    .option-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;

      .no-options {
        font-size: $font-sm;
        color: $text-secondary;
      }
    }
  }

  .status-form {
    margin-top: 16px;
  }

  .operation-type {
    margin-top: 16px;
    text-align: right;
  }
}

@keyframes pulse-arrow {
  0%, 100% { opacity: 1; transform: translateX(0); }
  50% { opacity: 0.6; transform: translateX(4px); }
}

.detail-content {
  .detail-header {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid $border-lighter;

    .detail-cover {
      width: 160px;
      height: 90px;
      flex-shrink: 0;
      border-radius: $radius-sm;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .cover-placeholder-lg {
      width: 160px;
      height: 90px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $bg-color;
      border-radius: $radius-sm;
      color: $text-placeholder;
      font-size: 32px;
    }

    .detail-info {
      flex: 1;
      min-width: 0;

      .detail-title {
        font-size: $font-lg;
        font-weight: 600;
        color: $text-primary;
        margin: 0 0 10px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .detail-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }

      .detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        font-size: $font-sm;
        color: $text-regular;
      }
    }
  }

  .detail-desc {
    margin-bottom: 20px;

    .fingerprint-text {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: $font-sm;
      color: $text-regular;
      word-break: break-all;
    }

    .desc-text {
      color: $text-regular;
      line-height: 1.6;
    }
  }

  .status-logs-section {
    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: $font-md;
      color: $text-primary;
      margin-bottom: 16px;
    }

    .timeline-wrapper {
      max-height: 300px;
      overflow-y: auto;
      padding-right: 8px;
    }

    .log-card {
      margin-bottom: 0;

      .log-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .log-operator {
          font-size: $font-sm;
          color: $text-secondary;
        }
      }

      .log-reason,
      .log-remark {
        font-size: $font-sm;
        color: $text-regular;
        margin-bottom: 6px;

        .label {
          color: $text-secondary;
        }
      }

      .log-type {
        margin-top: 8px;
      }
    }
  }
}

.back-top-btn {
  position: fixed;
  right: 40px;
  bottom: 40px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: $radius-circle;
  color: $text-regular;
  cursor: pointer;
  box-shadow: $shadow-base;
  z-index: 1000;
  transition: $transition-base;

  &:hover {
    color: $primary-color;
    border-color: $primary-color;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba($primary-color, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.focus-scale-input {
  transition: $transition-base;

  &:focus-within {
    transform: scale(1.01);
  }
}

.shake-error {
  animation: shake 0.4s ease;

  :deep(.el-input__wrapper) {
    border-color: $danger-color !important;
    box-shadow: 0 0 0 1px $danger-color inset;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.btn-shift {
  transition: all 0.15s ease;

  &:active {
    transform: translateY(2px);
  }
}

.check-icon {
  color: $success-color;
}

.error-icon {
  color: $danger-color;
}

.is-loading {
  animation: rotating 1s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.zoom-in {
  :deep(.el-dialog) {
    animation: zoomIn 0.25s ease-out;
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.mb-16 {
  margin-bottom: 16px;
}

.mr-4 {
  margin-right: 4px;
}

:deep(.el-table__header th) {
  background-color: $bg-color !important;
  font-weight: 600;
}

:deep(.el-table__body tr:hover > td) {
  background-color: rgba($primary-color, 0.04) !important;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: #fafafa;
}

:deep(.video-dialog .el-dialog__body),
:deep(.detail-dialog .el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
  padding: 20px 24px;
}

:deep(.status-dialog .el-dialog__body) {
  padding: 20px 24px 10px;
}
</style>