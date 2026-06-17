<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import type { FormInstance, FormRules, UploadProps, UploadRawFile, UploadFiles } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  ARTICLE_TYPE,
  DOMAIN_CATEGORY,
  PUBLISH_CHANNEL,
  PUBLISH_PERMISSION,
  LAYOUT_TEMPLATE,
  ARTICLE_QUALITY,
  EDIT_MODE,
  SENSITIVE_CHECK_STATUS,
  CONTENT_STATUS,
  CONTENT_AUDIT_STATUS,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getArticleListApi,
  getArticleDetailApi,
  createArticleApi,
  updateArticleApi,
  checkTitleUniqueApi,
  checkContentUniqueApi,
  generateCheckReportApi,
  getVersionListApi,
  batchTopArticlesApi,
  batchOfflineArticlesApi,
  batchClassifyTopicApi,
} from '@/api/article'
import type {
  ArticleItem,
  ArticleVersionItem,
  CheckReport,
  TitleCheckResult,
  ContentCheckResult,
  BatchOperationResult,
} from '@/types'
import { formatDate, formatNumber } from '@/utils'
import {
  Search,
  RefreshLeft,
  Plus,
  Edit,
  View,
  DocumentCopy,
  List,
  UploadFilled,
  Promotion,
  CopyDocument,
  Check,
  Histogram,
  Warning,
} from '@element-plus/icons-vue'

const formatWordCount = (count: number | null | undefined): string => {
  if (count === null || count === undefined) return '0'
  return formatNumber(count) + ' 字'
}

const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const listData = ref<ArticleItem[]>([])
const total = ref<number>(0)
const selectedRows = ref<ArticleItem[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  articleCode: '',
  publishAccount: '',
  topicId: null as number | null,
  readCountMin: null as number | null,
  likeCountMin: null as number | null,
  publishStartDate: '',
  publishEndDate: '',
  domainCategory: null as string | null,
  articleType: null as number | null,
  articleQuality: null as number | null,
  sortBy: 'created_at',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
})

const tableHeight = computed<string>(`calc(100vh - 360px)`)

const loadData = async (): Promise<void> => {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (queryParams.topicId) {
      params.topic_id = queryParams.topicId
    }
    if (queryParams.readCountMin !== null) {
      params.viewCountMin = queryParams.readCountMin
    }
    if (queryParams.likeCountMin !== null) {
      params.likeCountMin = queryParams.likeCountMin
    }
    const result = await getArticleListApi(params)
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
  queryParams.articleCode = ''
  queryParams.publishAccount = ''
  queryParams.topicId = null
  queryParams.readCountMin = null
  queryParams.likeCountMin = null
  queryParams.publishStartDate = ''
  queryParams.publishEndDate = ''
  queryParams.domainCategory = null
  queryParams.articleType = null
  queryParams.articleQuality = null
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

const handleSelectionChange = (rows: ArticleItem[]): void => {
  selectedRows.value = rows
}

const createDialogVisible = ref<boolean>(false)
const createFormRef = ref<FormInstance>()
const createFormData = reactive<Partial<ArticleItem>>({
  title: '',
  description: '',
  domainCategory: DOMAIN_CATEGORY.TECH.value,
  publishPermission: PUBLISH_PERMISSION.PUBLIC.value,
  publishChannel: PUBLISH_CHANNEL.HOME.value,
  layoutTemplate: LAYOUT_TEMPLATE.DEFAULT.value,
  coverImages: [] as string[],
  contentImages: [] as string[],
  tags: [] as string[],
  summary: '',
  topicId: null as number | null,
  topicTitle: '',
  resourcePosition: '',
  articleType: ARTICLE_TYPE.NEWS.value,
  articleQuality: ARTICLE_QUALITY.NORMAL.value,
  publishAccount: '',
  status: CONTENT_AUDIT_STATUS.PENDING.value,
})

const wordCountRule = computed<{ min: number; max: number }>(() => {
  const channel = createFormData.publishChannel
  switch (channel) {
    case PUBLISH_CHANNEL.HOME.value:
      return { min: 500, max: 5000 }
    case PUBLISH_CHANNEL.NEWS.value:
      return { min: 300, max: 3000 }
    case PUBLISH_CHANNEL.TOPIC.value:
      return { min: 800, max: 10000 }
    case PUBLISH_CHANNEL.MULTI.value:
      return { min: 500, max: 8000 }
    default:
      return { min: 500, max: 5000 }
  }
})

const currentWordCount = computed<number>(() => {
  const desc = createFormData.description || ''
  const title = createFormData.title || ''
  return desc.length + title.length
})

const wordCountWarning = computed<string>(() => {
  const { min, max } = wordCountRule.value
  if (currentWordCount.value === 0) return ''
  if (currentWordCount.value < min) {
    return `当前字数不足，最少需要 ${min} 字`
  }
  if (currentWordCount.value > max) {
    return `当前字数超出，最多允许 ${max} 字`
  }
  return ''
})

const sensitiveWords = ref<string[]>([])
const sensitiveChecking = ref<boolean>(false)

const detectSensitiveWords = (text: string): string[] => {
  const mockSensitiveWords = ['敏感词1', '违禁词', '违规内容']
  const found: string[] = []
  mockSensitiveWords.forEach((word) => {
    if (text.includes(word)) {
      found.push(word)
    }
  })
  return found
}

let sensitiveDebounceTimer: ReturnType<typeof setTimeout> | null = null
const handleSensitiveCheck = (): void => {
  if (sensitiveDebounceTimer) clearTimeout(sensitiveDebounceTimer)
  sensitiveDebounceTimer = setTimeout(() => {
    sensitiveChecking.value = true
    const text = (createFormData.title || '') + (createFormData.description || '')
    setTimeout(() => {
      sensitiveWords.value = detectSensitiveWords(text)
      createFormData.sensitiveWordCheck =
        sensitiveWords.value.length > 0
          ? SENSITIVE_CHECK_STATUS.FAILED.value
          : SENSITIVE_CHECK_STATUS.PASSED.value
      createFormData.sensitiveWords = sensitiveWords.value
      sensitiveChecking.value = false
    }, 300)
  }, 500)
}

watch([() => createFormData.title, () => createFormData.description], handleSensitiveCheck)

const titleChecking = ref<boolean>(false)
const titleUnique = ref<boolean | null>(null)
const duplicateTitleInfo = ref<{ title: string } | null>(null)

let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null
const checkTitleUnique = (): void => {
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer)
  if (!createFormData.title) {
    titleUnique.value = null
    duplicateTitleInfo.value = null
    return
  }
  titleDebounceTimer = setTimeout(async () => {
    titleChecking.value = true
    titleUnique.value = null
    duplicateTitleInfo.value = null
    try {
      const result: TitleCheckResult = await checkTitleUniqueApi(
        createFormData.title!,
        undefined,
        createFormData.articleType
      )
      titleUnique.value = result.isUnique
      if (!result.isUnique && result.duplicateTitle) {
        duplicateTitleInfo.value = { title: result.duplicateTitle }
      }
    } catch {
      titleUnique.value = null
    } finally {
      titleChecking.value = false
    }
  }, 500)
}

watch(() => createFormData.title, checkTitleUnique)

const contentHashChecking = ref<boolean>(false)
const contentUnique = ref<boolean | null>(null)
const duplicateContentInfo = ref<{ id: number; title: string } | null>(null)

const generateSha256 = async (text: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

let contentDebounceTimer: ReturnType<typeof setTimeout> | null = null
const checkContentUnique = (): void => {
  if (contentDebounceTimer) clearTimeout(contentDebounceTimer)
  if (!createFormData.description) {
    contentUnique.value = null
    duplicateContentInfo.value = null
    return
  }
  contentDebounceTimer = setTimeout(async () => {
    contentHashChecking.value = true
    contentUnique.value = null
    duplicateContentInfo.value = null
    try {
      const hash = await generateSha256(createFormData.description || '')
      createFormData.contentHash = hash
      const result: ContentCheckResult = await checkContentUniqueApi(hash)
      contentUnique.value = result.isUnique
      if (!result.isUnique && result.duplicateContent) {
        duplicateContentInfo.value = result.duplicateContent
      }
    } catch {
      contentUnique.value = null
    } finally {
      contentHashChecking.value = false
    }
  }, 800)
}

watch(() => createFormData.description, checkContentUnique)

const imageResolutionWarnings = ref<string[]>([])

const simulateImageCheck = (images: string[]): void => {
  const warnings: string[] = []
  const mockResolutions = ['800x600', '1920x1080', '640x480', '1024x768']
  images.forEach((_img, index) => {
    const res = mockResolutions[index % mockResolutions.length]
    const [width, height] = res.split('x').map(Number)
    if (width < 800 || height < 600) {
      warnings.push(`第${index + 1}张图片分辨率(${res})低于推荐的800x600`)
    }
  })
  imageResolutionWarnings.value = warnings
}

watch(() => createFormData.coverImages, simulateImageCheck, { deep: true })
watch(() => createFormData.contentImages, simulateImageCheck, { deep: true })

const linkValidityWarnings = ref<string[]>([])

const checkLinks = (text: string): void => {
  const urlRegex = /https?:\/\/[^\s<>"']+/g
  const urls = text.match(urlRegex) || []
  const warnings: string[] = []
  urls.forEach((url, index) => {
    if (url.length < 10) {
      warnings.push(`链接${index + 1}: URL格式可能不完整`)
    }
  })
  linkValidityWarnings.value = warnings
}

watch(() => createFormData.description, checkLinks)

const topicInfoLoading = ref<boolean>(false)

let topicDebounceTimer: ReturnType<typeof setTimeout> | null = null
const loadTopicInfo = (topicId: number | null | undefined): void => {
  if (topicDebounceTimer) clearTimeout(topicDebounceTimer)
  if (!topicId) {
    createFormData.topicTitle = ''
    createFormData.resourcePosition = ''
    return
  }
  topicDebounceTimer = setTimeout(() => {
    topicInfoLoading.value = true
    setTimeout(() => {
      const mockTitles = ['科技前沿专题', '深度解析专栏', '行业观察']
      const mockPositions = ['首页Banner', '推荐位-1', '侧边栏-2']
      createFormData.topicTitle = mockTitles[topicId % mockTitles.length]
      createFormData.resourcePosition = mockPositions[topicId % mockPositions.length]
      topicInfoLoading.value = false
    }, 400)
  }, 400)
}

watch(() => createFormData.topicId, loadTopicInfo)

watch(
  () => createFormData.publishChannel,
  (channel) => {
    switch (channel) {
      case PUBLISH_CHANNEL.HOME.value:
        createFormData.layoutTemplate = LAYOUT_TEMPLATE.DEFAULT.value
        break
      case PUBLISH_CHANNEL.NEWS.value:
        createFormData.layoutTemplate = LAYOUT_TEMPLATE.FULL_WIDTH.value
        break
      case PUBLISH_CHANNEL.TOPIC.value:
        createFormData.layoutTemplate = LAYOUT_TEMPLATE.MAGAZINE.value
        break
      case PUBLISH_CHANNEL.MULTI.value:
        createFormData.layoutTemplate = LAYOUT_TEMPLATE.ELEGANT.value
        break
    }
  }
)

const resetCreateForm = (): void => {
  Object.assign(createFormData, {
    title: '',
    description: '',
    domainCategory: DOMAIN_CATEGORY.TECH.value,
    publishPermission: PUBLISH_PERMISSION.PUBLIC.value,
    publishChannel: PUBLISH_CHANNEL.HOME.value,
    layoutTemplate: LAYOUT_TEMPLATE.DEFAULT.value,
    coverImages: [],
    contentImages: [],
    tags: [],
    summary: '',
    topicId: null,
    topicTitle: '',
    resourcePosition: '',
    articleType: ARTICLE_TYPE.NEWS.value,
    articleQuality: ARTICLE_QUALITY.NORMAL.value,
    publishAccount: '',
    status: CONTENT_AUDIT_STATUS.PENDING.value,
    sensitiveWordCheck: SENSITIVE_CHECK_STATUS.UNCHECKED.value,
    sensitiveWords: [],
    contentHash: '',
  })
  sensitiveWords.value = []
  titleUnique.value = null
  duplicateTitleInfo.value = null
  contentUnique.value = null
  duplicateContentInfo.value = null
  imageResolutionWarnings.value = []
  linkValidityWarnings.value = []
}

const createFormRules = computed<FormRules>(() => ({
  title: [
    { required: true, message: '请输入图文标题', trigger: 'blur' },
    { min: 5, max: 100, message: '标题长度在5-100字符之间', trigger: 'blur' },
  ],
  description: [
    { required: true, message: '请输入图文内容', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        const { min, max } = wordCountRule.value
        if (value.length < min) {
          callback(new Error(`内容字数不足，最少需要 ${min} 字`))
        } else if (value.length > max) {
          callback(new Error(`内容字数超出，最多允许 ${max} 字`))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  domainCategory: [{ required: true, message: '请选择内容领域分类', trigger: 'change' }],
  publishPermission: [{ required: true, message: '请选择发布权限', trigger: 'change' }],
  publishChannel: [{ required: true, message: '请选择发布渠道', trigger: 'change' }],
}))

const openCreateDialog = (): void => {
  resetCreateForm()
  createDialogVisible.value = true
  nextTick(() => {
    createFormRef.value?.clearValidate()
  })
}

const handleCreateSubmit = async (): Promise<void> => {
  await createFormRef.value?.validate()

  if (sensitiveWords.value.length > 0) {
    ElMessage.error('内容包含敏感词，请修改后再提交')
    return
  }

  if (titleUnique.value === false) {
    ElMessage.error('标题已存在，请修改后再提交')
    return
  }

  if (contentUnique.value === false) {
    ElMessage.error('内容与已有内容重复，请修改后再提交')
    return
  }

  if (wordCountWarning.value) {
    ElMessage.error(wordCountWarning.value)
    return
  }

  submitLoading.value = true
  try {
    createFormData.wordCount = currentWordCount.value
    const result = await createArticleApi(createFormData)
    ElMessage.success(`创建成功，图文编码：${result.articleCode}`)
    createDialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const editDialogVisible = ref<boolean>(false)
const editMode = ref<number>(EDIT_MODE.FULL.value)
const editFormRef = ref<FormInstance>()
const currentEditRow = ref<ArticleItem | null>(null)

const editFormData = reactive<Partial<ArticleItem>>({
  title: '',
  description: '',
  domainCategory: DOMAIN_CATEGORY.TECH.value,
  publishPermission: PUBLISH_PERMISSION.PUBLIC.value,
  publishChannel: PUBLISH_CHANNEL.HOME.value,
  layoutTemplate: LAYOUT_TEMPLATE.DEFAULT.value,
  coverImages: [] as string[],
  contentImages: [] as string[],
  tags: [] as string[],
  summary: '',
  topicId: null as number | null,
  topicTitle: '',
  resourcePosition: '',
  articleType: ARTICLE_TYPE.NEWS.value,
  articleQuality: ARTICLE_QUALITY.NORMAL.value,
})

const isPublishedArticle = computed<boolean>(() => {
  return currentEditRow.value?.status === CONTENT_AUDIT_STATUS.APPROVED.value
})

const isDraftArticle = computed<boolean>(() => {
  return currentEditRow.value?.status === CONTENT_AUDIT_STATUS.PENDING.value
})

const openEditDialog = (row: ArticleItem): void => {
  currentEditRow.value = row
  editMode.value = EDIT_MODE.FULL.value
  Object.assign(editFormData, { ...row })
  editDialogVisible.value = true
  nextTick(() => {
    editFormRef.value?.clearValidate()
  })
}

const handleEditSubmit = async (): Promise<void> => {
  if (!currentEditRow.value) return

  await editFormRef.value?.validate()

  submitLoading.value = true
  try {
    const result = await updateArticleApi(
      currentEditRow.value.id,
      editFormData,
      editMode.value
    )
    if (result.needAudit) {
      ElMessage.success(`修改已提交，新版本号 v${result.versionNo}，将进入审核流程`)
    } else {
      ElMessage.success(`修改成功，当前版本号 v${result.versionNo}`)
    }
    editDialogVisible.value = false
    loadData()
  } finally {
    submitLoading.value = false
  }
}

const detailDialogVisible = ref<boolean>(false)
const detailData = ref<ArticleItem | null>(null)

const openDetailDialog = async (row: ArticleItem): Promise<void> => {
  detailDialogVisible.value = true
  detailData.value = row
}

const versionDialogVisible = ref<boolean>(false)
const versionList = ref<ArticleVersionItem[]>([])
const versionLoading = ref<boolean>(false)
const versionArticleId = ref<number | null>(null)
const compareVersionVisible = ref<boolean>(false)
const compareFrom = ref<ArticleVersionItem | null>(null)
const compareTo = ref<ArticleVersionItem | null>(null)

const openVersionDialog = async (row: ArticleItem): Promise<void> => {
  versionArticleId.value = row.id
  versionDialogVisible.value = true
  versionLoading.value = true
  try {
    const versions = await getVersionListApi(row.id)
    versionList.value = versions
  } catch {
    versionList.value = []
  } finally {
    versionLoading.value = false
  }
}

const rollbackVersion = async (version: ArticleVersionItem): Promise<void> => {
  await ElMessageBox.confirm(
    `确定要回滚到版本 v${version.versionNo} 吗？回滚后将生成新版本并进入审核流程。`,
    '版本回滚确认',
    { type: 'warning' }
  )
  ElMessage.success(`已提交回滚请求，将基于 v${version.versionNo} 生成新版本`)
}

const compareVersions = (v1: ArticleVersionItem, v2: ArticleVersionItem): void => {
  compareFrom.value = v1
  compareTo.value = v2
  compareVersionVisible.value = true
}

const checkReportDialogVisible = ref<boolean>(false)
const checkReportData = ref<CheckReport | null>(null)
const checkReportLoading = ref<boolean>(false)

const openCheckReport = async (row: ArticleItem): Promise<void> => {
  checkReportDialogVisible.value = true
  checkReportLoading.value = true
  try {
    const report = await generateCheckReportApi(row.id)
    checkReportData.value = report
  } catch {
    checkReportData.value = null
  } finally {
    checkReportLoading.value = false
  }
}

const batchTopDialogVisible = ref<boolean>(false)
const batchTopDays = ref<number>(7)

const openBatchTopDialog = (): void => {
  if (selectedRows.value.length === 0) return
  batchTopDays.value = 7
  batchTopDialogVisible.value = true
}

const handleBatchTop = async (): Promise<void> => {
  loading.value = true
  try {
    const result: BatchOperationResult = await batchTopArticlesApi(
      selectedRows.value.map((r) => r.id),
      batchTopDays.value
    )
    showBatchResult(result, `置顶${batchTopDays.value}天`)
    batchTopDialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const batchOfflineDialogVisible = ref<boolean>(false)
const batchOfflineReason = ref<string>('')

const openBatchOfflineDialog = (): void => {
  if (selectedRows.value.length === 0) return
  batchOfflineReason.value = ''
  batchOfflineDialogVisible.value = true
}

const handleBatchOffline = async (): Promise<void> => {
  if (!batchOfflineReason.value.trim()) {
    ElMessage.warning('请填写下架原因')
    return
  }
  loading.value = true
  try {
    const result: BatchOperationResult = await batchOfflineArticlesApi(
      selectedRows.value.map((r) => r.id),
      batchOfflineReason.value
    )
    showBatchResult(result, '下架')
    batchOfflineDialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const batchClassifyDialogVisible = ref<boolean>(false)
const batchClassifyTopicId = ref<number | null>(null)
const batchClassifyTopicTitle = ref<string>('')
const batchClassifyLoading = ref<boolean>(false)

const openBatchClassifyDialog = (): void => {
  if (selectedRows.value.length === 0) return
  batchClassifyTopicId.value = null
  batchClassifyTopicTitle.value = ''
  batchClassifyDialogVisible.value = true
}

let classifyDebounceTimer: ReturnType<typeof setTimeout> | null = null
const loadBatchTopicInfo = (): void => {
  if (classifyDebounceTimer) clearTimeout(classifyDebounceTimer)
  if (!batchClassifyTopicId.value) {
    batchClassifyTopicTitle.value = ''
    return
  }
  classifyDebounceTimer = setTimeout(() => {
    batchClassifyLoading.value = true
    setTimeout(() => {
      const mockTitles = ['科技前沿专题', '深度解析专栏', '行业观察']
      batchClassifyTopicTitle.value =
        mockTitles[(batchClassifyTopicId.value || 0) % mockTitles.length]
      batchClassifyLoading.value = false
    }, 300)
  }, 300)
}

watch(() => batchClassifyTopicId.value, loadBatchTopicInfo)

const handleBatchClassify = async (): Promise<void> => {
  if (!batchClassifyTopicId.value || !batchClassifyTopicTitle.value) {
    ElMessage.warning('请选择有效的专题')
    return
  }
  loading.value = true
  try {
    const result: BatchOperationResult = await batchClassifyTopicApi(
      selectedRows.value.map((r) => r.id),
      batchClassifyTopicId.value,
      batchClassifyTopicTitle.value
    )
    showBatchResult(result, '归类专题')
    batchClassifyDialogVisible.value = false
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

const coverUploadRef = ref()
const contentUploadRef = ref()

const beforeCoverUpload: UploadProps['beforeUpload'] = (rawFile): boolean => {
  const isImage = rawFile.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  const isLt5M = rawFile.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const handleCoverUpload: UploadProps['httpRequest'] = (options): void => {
  const { file, onSuccess } = options
  setTimeout(() => {
    const fakeUrl = URL.createObjectURL(file as File)
    createFormData.coverImages = [...(createFormData.coverImages || []), fakeUrl]
    onSuccess?.(file)
    ElMessage.success('封面图上传成功')
  }, 500)
}

const handleCoverRemove = (file: any, uploadFiles: UploadFiles): void => {
  const index = createFormData.coverImages?.findIndex((url) => url.includes(file.name)) ?? -1
  if (index > -1) {
    createFormData.coverImages?.splice(index, 1)
  }
}

const handleContentUpload: UploadProps['httpRequest'] = (options): void => {
  const { file, onSuccess } = options
  setTimeout(() => {
    const fakeUrl = URL.createObjectURL(file as File)
    createFormData.contentImages = [...(createFormData.contentImages || []), fakeUrl]
    onSuccess?.(file)
    ElMessage.success('内容图上传成功')
  }, 500)
}

const handleContentImageRemove = (file: any, _uploadFiles: UploadFiles): void => {
  const index = createFormData.contentImages?.findIndex((url) => url.includes(file.name)) ?? -1
  if (index > -1) {
    createFormData.contentImages?.splice(index, 1)
  }
}

const truncateText = (text: string, max: number): string => {
  if (!text) return '-'
  return text.length > max ? text.substring(0, max) + '...' : text
}

const tableColumns = computed(() => [
  { type: 'selection', width: 50, resizable: true },
  {
    prop: 'coverImage',
    label: '封面',
    width: 90,
    align: 'center' as const,
    slot: 'cover',
    resizable: true,
  },
  {
    prop: 'title',
    label: '标题',
    minWidth: 200,
    showOverflowTooltip: true,
    slot: 'title',
    resizable: true,
  },
  {
    prop: 'domainCategory',
    label: '领域分类',
    width: 100,
    align: 'center' as const,
    slot: 'domainCategory',
    resizable: true,
  },
  {
    prop: 'articleType',
    label: '图文类型',
    width: 100,
    align: 'center' as const,
    slot: 'articleType',
    resizable: true,
  },
  {
    prop: 'publishChannel',
    label: '发布渠道',
    width: 100,
    align: 'center' as const,
    slot: 'publishChannel',
    resizable: true,
  },
  {
    prop: 'publishPermission',
    label: '发布权限',
    width: 100,
    align: 'center' as const,
    slot: 'publishPermission',
    resizable: true,
  },
  {
    prop: 'wordCount',
    label: '字数',
    width: 90,
    align: 'center' as const,
    slot: 'wordCount',
    resizable: true,
  },
  {
    prop: 'viewCount',
    label: '阅读量',
    width: 90,
    align: 'center' as const,
    sortable: 'custom' as const,
    slot: 'viewCount',
    resizable: true,
  },
  {
    prop: 'likeCountArticle',
    label: '点赞量',
    width: 90,
    align: 'center' as const,
    sortable: 'custom' as const,
    slot: 'likeCount',
    resizable: true,
  },
  {
    prop: 'commentCountArticle',
    label: '评论量',
    width: 90,
    align: 'center' as const,
    slot: 'commentCount',
    resizable: true,
  },
  {
    prop: 'versionNo',
    label: '版本号',
    width: 110,
    align: 'center' as const,
    slot: 'versionNo',
    resizable: true,
  },
  {
    prop: 'articleQuality',
    label: '质量等级',
    width: 90,
    align: 'center' as const,
    slot: 'articleQuality',
    resizable: true,
  },
  {
    prop: 'isTop',
    label: '置顶',
    width: 70,
    align: 'center' as const,
    slot: 'isTop',
    resizable: true,
  },
  {
    prop: 'isExpired',
    label: '是否过期',
    width: 80,
    align: 'center' as const,
    slot: 'isExpired',
    resizable: true,
  },
  {
    prop: 'publishAccount',
    label: '发布账号',
    width: 110,
    align: 'center' as const,
    slot: 'publishAccount',
    resizable: true,
  },
  {
    prop: 'createdAt',
    label: '发布时间',
    width: 160,
    align: 'center' as const,
    sortable: 'custom' as const,
    slot: 'createdAt',
    resizable: true,
  },
  {
    label: '操作',
    width: 260,
    fixed: 'right' as const,
    align: 'center' as const,
    slot: 'actions',
    resizable: true,
  },
])

const domainCategoryOptions = computed(() => getEnumOptions(DOMAIN_CATEGORY))
const articleTypeOptions = computed(() => getEnumOptions(ARTICLE_TYPE))
const publishChannelOptions = computed(() => getEnumOptions(PUBLISH_CHANNEL))
const publishPermissionOptions = computed(() => getEnumOptions(PUBLISH_PERMISSION))
const layoutTemplateOptions = computed(() => getEnumOptions(LAYOUT_TEMPLATE))
const articleQualityOptions = computed(() => getEnumOptions(ARTICLE_QUALITY))
const editModeOptions = computed(() => getEnumOptions(EDIT_MODE))

const topDaysOptions = [
  { value: 3, label: '3天' },
  { value: 7, label: '7天' },
  { value: 15, label: '15天' },
  { value: 30, label: '30天' },
]

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (sensitiveDebounceTimer) clearTimeout(sensitiveDebounceTimer)
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer)
  if (contentDebounceTimer) clearTimeout(contentDebounceTimer)
  if (topicDebounceTimer) clearTimeout(topicDebounceTimer)
  if (classifyDebounceTimer) clearTimeout(classifyDebounceTimer)
})
</script>

<template>
  <div class="article-page">
    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent class="filter-form">
        <div class="filter-row">
          <el-form-item label="图文编码">
            <el-input
              v-model="queryParams.articleCode"
              placeholder="精确搜索"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="发布账号">
            <el-input
              v-model="queryParams.publishAccount"
              placeholder="请输入账号"
              clearable
              style="width: 140px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="专题ID">
            <el-input-number
              v-model="queryParams.topicId"
              :min="1"
              placeholder="ID"
              style="width: 120px"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="阅读量≥">
            <el-input-number
              v-model="queryParams.readCountMin"
              :min="0"
              placeholder="阅读量"
              style="width: 120px"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="点赞量≥">
            <el-input-number
              v-model="queryParams.likeCountMin"
              :min="0"
              placeholder="点赞量"
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
          <el-form-item label="领域分类">
            <el-select
              v-model="queryParams.domainCategory"
              placeholder="全部分类"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in domainCategoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="图文类型">
            <el-select
              v-model="queryParams.articleType"
              placeholder="全部类型"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in articleTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="质量等级">
            <el-select
              v-model="queryParams.articleQuality"
              placeholder="全部等级"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in articleQualityOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
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
        @create="openCreateDialog"
        @refresh="loadData"
        @batch-delete="() => {}"
      >
        <template #batch-actions>
          <el-button
            type="primary"
            :icon="Promotion"
            :disabled="selectedRows.length === 0"
            @click="openBatchTopDialog"
            class="btn-shift"
          >
            批量置顶
          </el-button>
          <el-button
            type="danger"
            :icon="Warning"
            :disabled="selectedRows.length === 0"
            @click="openBatchOfflineDialog"
            class="btn-shift"
          >
            批量下架
          </el-button>
          <el-button
            type="success"
            :icon="CopyDocument"
            :disabled="selectedRows.length === 0"
            @click="openBatchClassifyDialog"
            class="btn-shift"
          >
            批量归类专题
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
        highlight-current-row
        class="article-table"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #cover="{ row }">
          <div class="cover-cell">
            <el-image
              v-if="row.coverImage || row.coverImages?.[0]"
              :src="row.coverImage || row.coverImages?.[0]"
              fit="cover"
              class="cover-thumb"
              :preview-src-list="[row.coverImage || row.coverImages?.[0]]"
            >
              <template #error>
                <div class="cover-placeholder">
                  <el-icon><DocumentCopy /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="cover-placeholder">
              <el-icon><DocumentCopy /></el-icon>
            </div>
          </div>
        </template>

        <template #title="{ row }">
          <div class="title-cell">
            <span class="title-text" :title="row.title">{{ truncateText(row.title, 30) }}</span>
            <div class="title-meta">
              <el-tag v-if="row.articleCode" type="info" size="small" effect="plain">
                {{ row.articleCode }}
              </el-tag>
              <el-tag v-if="row.isVip" type="warning" size="small" effect="plain">VIP</el-tag>
              <el-tag
                v-if="row.sensitiveWordCheck === SENSITIVE_CHECK_STATUS.FAILED.value"
                type="danger"
                size="small"
                effect="plain"
              >
                含敏感词
              </el-tag>
            </div>
          </div>
        </template>

        <template #domainCategory="{ row }">
          <el-tag
            :type="getEnumItem(DOMAIN_CATEGORY, row.domainCategory)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(DOMAIN_CATEGORY, row.domainCategory) }}
          </el-tag>
        </template>

        <template #articleType="{ row }">
          <el-tag
            :type="getEnumItem(ARTICLE_TYPE, row.articleType)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(ARTICLE_TYPE, row.articleType) }}
          </el-tag>
        </template>

        <template #publishChannel="{ row }">
          <el-tag
            :type="getEnumItem(PUBLISH_CHANNEL, row.publishChannel)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(PUBLISH_CHANNEL, row.publishChannel) }}
          </el-tag>
        </template>

        <template #publishPermission="{ row }">
          <el-tag
            :type="getEnumItem(PUBLISH_PERMISSION, row.publishPermission)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(PUBLISH_PERMISSION, row.publishPermission) }}
          </el-tag>
        </template>

        <template #wordCount="{ row }">
          <span class="word-count">{{ formatWordCount(row.wordCount) }}</span>
        </template>

        <template #viewCount="{ row }">
          <span class="count-num">{{ formatNumber(row.viewCount) }}</span>
        </template>

        <template #likeCount="{ row }">
          <span class="count-num">{{ formatNumber(row.likeCountArticle) }}</span>
        </template>

        <template #commentCount="{ row }">
          <span class="count-num">{{ formatNumber(row.commentCountArticle) }}</span>
        </template>

        <template #versionNo="{ row }">
          <div class="version-info">
            <span class="version-current">当前 v{{ row.versionNo }}</span>
            <span v-if="row.latestPublishedVersion" class="version-published">
              / 已发 v{{ row.latestPublishedVersion }}
            </span>
          </div>
        </template>

        <template #articleQuality="{ row }">
          <el-tag
            :type="getEnumItem(ARTICLE_QUALITY, row.articleQuality)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(ARTICLE_QUALITY, row.articleQuality) }}
          </el-tag>
        </template>

        <template #isTop="{ row }">
          <el-tag
            v-if="row.isTop === 1"
            type="danger"
            size="small"
            effect="dark"
          >
            置顶
          </el-tag>
          <span v-else class="text-muted">否</span>
        </template>

        <template #isExpired="{ row }">
          <el-tag
            v-if="row.isExpired === 1"
            type="info"
            size="small"
            effect="plain"
          >
            已过期
          </el-tag>
          <span v-else class="text-active">有效</span>
        </template>

        <template #publishAccount="{ row }">
          <span class="account-text" :title="row.publishAccount">
            {{ row.publishAccount || '-' }}
          </span>
        </template>

        <template #createdAt="{ row }">
          <span class="date-text">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link size="small" :icon="View" @click="openDetailDialog(row)">
            查看
          </el-button>
          <el-button type="primary" link size="small" :icon="Edit" @click="openEditDialog(row)">
            编辑
          </el-button>
          <el-button
            type="success"
            link
            size="small"
            :icon="Check"
            @click="openCheckReport(row)"
          >
            校验报告
          </el-button>
          <el-button
            type="warning"
            link
            size="small"
            :icon="List"
            @click="openVersionDialog(row)"
          >
            版本
          </el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="createDialogVisible"
      title="新增图文内容"
      width="900px"
      :close-on-click-modal="false"
      class="article-create-dialog"
      destroy-on-close
    >
      <el-form
        ref="createFormRef"
        :model="createFormData"
        :rules="createFormRules"
        label-width="110px"
        class="article-form"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="图文标题" prop="title">
              <el-input
                v-model="createFormData.title"
                placeholder="请输入图文标题"
                maxlength="100"
                show-word-limit
                class="input-focus"
              >
                <template #suffix>
                  <el-icon
                    v-if="titleChecking"
                    class="is-loading"
                    style="animation: spin 1s linear infinite"
                  >
                    <RefreshLeft />
                  </el-icon>
                  <el-icon v-else-if="titleUnique === true" class="check-icon" style="color: #67c23a">
                    <Check />
                  </el-icon>
                  <el-icon v-else-if="titleUnique === false" class="error-icon" style="color: #f56c6c">
                    <Warning />
                  </el-icon>
                </template>
              </el-input>
              <div v-if="titleUnique === false && duplicateTitleInfo" class="duplicate-warning">
                <el-icon><Warning /></el-icon>
                <span>标题重复，已存在：{{ duplicateTitleInfo.title }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="内容领域分类" prop="domainCategory">
              <el-select v-model="createFormData.domainCategory" style="width: 100%" class="input-focus">
                <el-option
                  v-for="item in domainCategoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布权限" prop="publishPermission">
              <el-select v-model="createFormData.publishPermission" style="width: 100%" class="input-focus">
                <el-option
                  v-for="item in publishPermissionOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发布渠道" prop="publishChannel">
              <el-select v-model="createFormData.publishChannel" style="width: 100%" class="input-focus">
                <el-option
                  v-for="item in publishChannelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="布局模板">
              <el-select v-model="createFormData.layoutTemplate" style="width: 100%" class="input-focus">
                <el-option
                  v-for="item in layoutTemplateOptions"
                  :key="item.value"
                  :label="item.label + '（' + item.desc + '）'"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">专题关联</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="专题ID">
              <el-input-number
                v-model="createFormData.topicId"
                :min="1"
                :controls="false"
                style="width: 100%"
                class="input-focus"
              >
                <template #suffix>
                  <el-icon
                    v-if="topicInfoLoading"
                    class="is-loading"
                    style="animation: spin 1s linear infinite"
                  >
                    <RefreshLeft />
                  </el-icon>
                </template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="专题标题">
              <el-input v-model="createFormData.topicTitle" placeholder="自动填充" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="资源位">
              <el-input v-model="createFormData.resourcePosition" placeholder="自动填充" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">内容与媒体</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="图文内容" prop="description">
              <el-input
                v-model="createFormData.description"
                type="textarea"
                :rows="8"
                :placeholder="`请输入图文内容，字数要求 ${wordCountRule.min}-${wordCountRule.max} 字`"
                maxlength="15000"
                show-word-limit
                class="input-focus content-textarea"
              />
              <div class="content-check-list">
                <div class="check-item">
                  <span class="check-label">字数统计：</span>
                  <span :class="{ 'text-warning': wordCountWarning }">
                    {{ currentWordCount }} / {{ wordCountRule.min }}-{{ wordCountRule.max }}
                  </span>
                  <el-tag v-if="wordCountWarning" type="warning" size="small" effect="plain">
                    {{ wordCountWarning }}
                  </el-tag>
                </div>
                <div class="check-item">
                  <span class="check-label">敏感词检测：</span>
                  <el-icon
                    v-if="sensitiveChecking"
                    class="is-loading"
                    style="animation: spin 1s linear infinite"
                  >
                    <RefreshLeft />
                  </el-icon>
                  <el-tag
                    v-else-if="sensitiveWords.length > 0"
                    type="danger"
                    size="small"
                    effect="light"
                  >
                    发现敏感词：{{ sensitiveWords.join('、') }}
                  </el-tag>
                  <el-tag v-else type="success" size="small" effect="light">
                    未检测到敏感词
                  </el-tag>
                </div>
                <div class="check-item">
                  <span class="check-label">内容查重：</span>
                  <el-icon
                    v-if="contentHashChecking"
                    class="is-loading"
                    style="animation: spin 1s linear infinite"
                  >
                    <RefreshLeft />
                  </el-icon>
                  <span v-else-if="contentUnique === true" class="text-success">内容唯一</span>
                  <span v-else-if="contentUnique === false" class="text-danger">
                    已存在相似内容
                    <el-link
                      v-if="duplicateContentInfo"
                      type="primary"
                      @click="openDetailDialog(listData.find(r => r.id === duplicateContentInfo!.id) || listData[0])"
                    >
                      点击查看
                    </el-link>
                  </span>
                  <span v-else class="text-muted">检测中...</span>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="封面图片">
              <div class="upload-section">
                <el-upload
                  ref="coverUploadRef"
                  :show-file-list="true"
                  list-type="picture-card"
                  :before-upload="beforeCoverUpload"
                  :http-request="handleCoverUpload"
                  :on-remove="handleCoverRemove"
                  :file-list="(createFormData.coverImages || []).map((url, i) => ({ name: `cover-${i}`, url }))"
                  :limit="5"
                  accept="image/*"
                  multiple
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="内容配图">
              <div class="upload-section">
                <el-upload
                  ref="contentUploadRef"
                  :show-file-list="true"
                  list-type="picture-card"
                  :before-upload="beforeCoverUpload"
                  :http-request="handleContentUpload"
                  :on-remove="handleContentImageRemove"
                  :file-list="(createFormData.contentImages || []).map((url, i) => ({ name: `content-${i}`, url }))"
                  :limit="20"
                  accept="image/*"
                  multiple
                >
                  <el-icon><Plus /></el-icon>
                </el-upload>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <div v-if="imageResolutionWarnings.length > 0" class="warning-alert">
              <el-alert type="warning" show-icon :closable="false">
                <div class="warning-list">
                  <div v-for="(warn, idx) in imageResolutionWarnings" :key="idx" class="warning-item">
                    <el-icon><Warning /></el-icon>
                    <span>{{ warn }}</span>
                  </div>
                </div>
              </el-alert>
            </div>
            <div v-if="linkValidityWarnings.length > 0" class="warning-alert">
              <el-alert type="warning" show-icon :closable="false">
                <div class="warning-list">
                  <div v-for="(warn, idx) in linkValidityWarnings" :key="idx" class="warning-item">
                    <el-icon><Warning /></el-icon>
                    <span>{{ warn }}</span>
                  </div>
                </div>
              </el-alert>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="内容标签">
              <el-select
                v-model="createFormData.tags"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="选择或输入标签，回车确认"
                style="width: 100%"
              >
                <el-option v-for="tag in (createFormData.tags || [])" :key="tag" :label="tag" :value="tag" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="内容摘要">
              <el-input
                v-model="createFormData.summary"
                type="textarea"
                :rows="3"
                placeholder="请输入内容摘要，用于列表展示"
                maxlength="300"
                show-word-limit
                class="input-focus"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">发布设置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="图文类型">
              <el-select v-model="createFormData.articleType" style="width: 100%" class="input-focus">
                <el-option
                  v-for="item in articleTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="质量等级">
              <el-select v-model="createFormData.articleQuality" style="width: 100%" class="input-focus">
                <el-option
                  v-for="item in articleQualityOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发布账号">
              <el-input
                v-model="createFormData.publishAccount"
                placeholder="请输入发布账号"
                class="input-focus"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          class="btn-shift"
          @click="handleCreateSubmit"
        >
          创建图文
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑图文内容"
      width="900px"
      :close-on-click-modal="false"
      class="article-edit-dialog"
      destroy-on-close
    >
      <el-alert
        v-if="isPublishedArticle"
        type="warning"
        show-icon
        :closable="false"
        class="mb-16"
      >
        <el-icon><Warning /></el-icon>
        <span>该图文已发布，修改后需重新审核方可上线。</span>
      </el-alert>
      <el-alert
        v-else-if="isDraftArticle"
        type="info"
        show-icon
        :closable="false"
        class="mb-16"
      >
        <el-icon><DocumentCopy /></el-icon>
        <span>当前为草稿状态，可直接保存修改。</span>
      </el-alert>

      <el-form
        ref="editFormRef"
        :model="editFormData"
        label-width="110px"
        class="article-form edit-form"
      >
        <el-divider content-position="left">编辑模式</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="编辑模式">
              <el-radio-group v-model="editMode">
                <el-radio
                  v-for="item in editModeOptions"
                  :key="item.value"
                  :value="item.value"
                >
                  <span class="radio-label">{{ item.label }}</span>
                  <span class="radio-desc">{{ item.desc }}</span>
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">基础信息</el-divider>
        <div class="form-content" style="transition: opacity 0.3s ease">
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="图文标题">
                <el-input
                  v-model="editFormData.title"
                  placeholder="请输入图文标题"
                  maxlength="100"
                  show-word-limit
                  class="input-focus"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="内容领域分类">
                <el-select v-model="editFormData.domainCategory" style="width: 100%" class="input-focus">
                  <el-option
                    v-for="item in domainCategoryOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="发布权限">
                <el-select v-model="editFormData.publishPermission" style="width: 100%" class="input-focus">
                  <el-option
                    v-for="item in publishPermissionOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="发布渠道">
                <el-select v-model="editFormData.publishChannel" style="width: 100%" class="input-focus">
                  <el-option
                    v-for="item in publishChannelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="布局模板">
                <el-select v-model="editFormData.layoutTemplate" style="width: 100%" class="input-focus">
                  <el-option
                    v-for="item in layoutTemplateOptions"
                    :key="item.value"
                    :label="item.label + '（' + item.desc + '）'"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">内容与媒体</el-divider>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="图文内容">
                <el-input
                  v-model="editFormData.description"
                  type="textarea"
                  :rows="8"
                  placeholder="请输入图文内容"
                  maxlength="15000"
                  show-word-limit
                  class="input-focus content-textarea"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="内容标签">
                <el-select
                  v-model="editFormData.tags"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="选择或输入标签，回车确认"
                  style="width: 100%"
                >
                  <el-option v-for="tag in (editFormData.tags || [])" :key="tag" :label="tag" :value="tag" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="内容摘要">
                <el-input
                  v-model="editFormData.summary"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入内容摘要"
                  maxlength="300"
                  show-word-limit
                  class="input-focus"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">发布设置</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="图文类型">
                <el-select v-model="editFormData.articleType" style="width: 100%" class="input-focus">
                  <el-option
                    v-for="item in articleTypeOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="质量等级">
                <el-select v-model="editFormData.articleQuality" style="width: 100%" class="input-focus">
                  <el-option
                    v-for="item in articleQualityOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          class="btn-shift"
          @click="handleEditSubmit"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="图文详情"
      width="720px"
      :close-on-click-modal="false"
      class="article-detail-dialog"
      destroy-on-close
    >
      <div v-if="detailData" class="detail-content">
        <div class="detail-header">
          <div class="detail-cover">
            <el-image
              v-if="detailData.coverImage || detailData.coverImages?.[0]"
              :src="detailData.coverImage || detailData.coverImages?.[0]"
              fit="cover"
              :preview-src-list="[detailData.coverImage || detailData.coverImages?.[0]]"
            >
              <template #error>
                <div class="cover-placeholder-lg">
                  <el-icon><DocumentCopy /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="cover-placeholder-lg">
              <el-icon><DocumentCopy /></el-icon>
            </div>
          </div>
          <div class="detail-info">
            <h3 class="detail-title">{{ detailData.title }}</h3>
            <div class="detail-tags">
              <el-tag
                :type="getEnumItem(DOMAIN_CATEGORY, detailData.domainCategory)?.type || 'info'"
                size="small"
                effect="light"
              >
                {{ getEnumLabel(DOMAIN_CATEGORY, detailData.domainCategory) }}
              </el-tag>
              <el-tag
                :type="getEnumItem(ARTICLE_QUALITY, detailData.articleQuality)?.type || 'info'"
                size="small"
                effect="light"
              >
                {{ getEnumLabel(ARTICLE_QUALITY, detailData.articleQuality) }}
              </el-tag>
              <el-tag
                :type="getEnumItem(PUBLISH_PERMISSION, detailData.publishPermission)?.type || 'info'"
                size="small"
                effect="light"
              >
                {{ getEnumLabel(PUBLISH_PERMISSION, detailData.publishPermission) }}
              </el-tag>
              <el-tag v-if="detailData.isVip" type="warning" size="small" effect="plain">VIP</el-tag>
              <el-tag v-if="detailData.isTop === 1" type="danger" size="small" effect="dark">置顶</el-tag>
            </div>
            <div class="detail-meta">
              <span>阅读：{{ formatNumber(detailData.viewCount) }}</span>
              <span>点赞：{{ formatNumber(detailData.likeCountArticle) }}</span>
              <span>评论：{{ formatNumber(detailData.commentCountArticle) }}</span>
              <span>收藏：{{ formatNumber(detailData.favoriteCount) }}</span>
            </div>
          </div>
        </div>
        <el-descriptions :column="2" border size="default" class="detail-desc">
          <el-descriptions-item label="图文编码">{{ detailData.articleCode }}</el-descriptions-item>
          <el-descriptions-item label="图文类型">
            {{ getEnumLabel(ARTICLE_TYPE, detailData.articleType) }}
          </el-descriptions-item>
          <el-descriptions-item label="发布渠道">
            {{ getEnumLabel(PUBLISH_CHANNEL, detailData.publishChannel) }}
          </el-descriptions-item>
          <el-descriptions-item label="布局模板">
            {{ getEnumLabel(LAYOUT_TEMPLATE, detailData.layoutTemplate) }}
          </el-descriptions-item>
          <el-descriptions-item label="字数">{{ formatWordCount(detailData.wordCount) }}</el-descriptions-item>
          <el-descriptions-item label="发布账号">{{ detailData.publishAccount || '-' }}</el-descriptions-item>
          <el-descriptions-item label="版本号">
            v{{ detailData.versionNo }}
            <span v-if="detailData.latestPublishedVersion">
              / 已发布 v{{ detailData.latestPublishedVersion }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="质量权重分">{{ formatNumber(detailData.weightScore) }}</el-descriptions-item>
          <el-descriptions-item label="专题归属">
            {{ detailData.topicTitle ? `${detailData.topicTitle} (ID:${detailData.topicId})` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="资源位">{{ detailData.resourcePosition || '-' }}</el-descriptions-item>
          <el-descriptions-item label="敏感词检测">
            <el-tag
              :type="getEnumItem(SENSITIVE_CHECK_STATUS, detailData.sensitiveWordCheck)?.type || 'info'"
              size="small"
              effect="light"
            >
              {{ getEnumLabel(SENSITIVE_CHECK_STATUS, detailData.sensitiveWordCheck) }}
            </el-tag>
            <span v-if="detailData.sensitiveWords?.length" class="sensitive-words">
              ：{{ detailData.sensitiveWords.join('、') }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="链接有效性">
            <span :class="detailData.linksValid === 1 ? 'text-success' : 'text-danger'">
              {{ detailData.linksValid === 1 ? '全部有效' : '存在无效链接' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">
            {{ formatDate(detailData.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">
            {{ formatDate(detailData.updatedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="置顶过期时间" v-if="detailData.isTop === 1">
            {{ formatDate(detailData.topExpireAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="过期时间" v-if="detailData.isExpired === 1">
            {{ formatDate(detailData.expireAt) }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="detailData.tags?.length" class="detail-section">
          <div class="section-label">内容标签</div>
          <div class="section-content">
            <el-tag
              v-for="tag in detailData.tags"
              :key="tag"
              type="info"
              size="small"
              effect="plain"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <div class="detail-section">
          <div class="section-label">内容摘要</div>
          <div class="section-content summary-content">
            {{ detailData.summary || '暂无摘要' }}
          </div>
        </div>

        <div class="detail-section">
          <div class="section-label">正文内容</div>
          <div class="section-content body-content">
            {{ detailData.description || '暂无内容' }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="openEditDialog(detailData!); detailDialogVisible = false">
          编辑此图文
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="versionDialogVisible"
      title="版本管理"
      width="800px"
      :close-on-click-modal="false"
      class="version-dialog"
      destroy-on-close
    >
      <div v-loading="versionLoading" class="version-content">
        <el-alert
          type="info"
          show-icon
          :closable="false"
          class="mb-16"
        >
          <el-icon><List /></el-icon>
          <span>支持版本对比和回滚操作，回滚将生成新版本并进入审核流程。</span>
        </el-alert>

        <el-table :data="versionList" stripe border class="version-table">
          <el-table-column prop="versionNo" label="版本号" width="100" align="center">
            <template #default="{ row }">
              <el-tag type="primary" size="small">v{{ row.versionNo }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
          <el-table-column prop="wordCount" label="字数" width="90" align="center">
            <template #default="{ row }">
              {{ formatWordCount(row.wordCount) }}
            </template>
          </el-table-column>
          <el-table-column label="编辑模式" width="120" align="center">
            <template #default="{ row }">
              {{ getEnumLabel(EDIT_MODE, row.editMode) }}
            </template>
          </el-table-column>
          <el-table-column label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getEnumItem(CONTENT_AUDIT_STATUS, row.auditStatus)?.type || 'info'"
                size="small"
                effect="light"
              >
                {{ getEnumLabel(CONTENT_AUDIT_STATUS, row.auditStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="100" align="center" />
          <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                v-if="versionList.length >= 2"
                size="small"
                link
                type="primary"
                @click="compareVersions(row, versionList[0])"
              >
                对比最新
              </el-button>
              <el-button
                size="small"
                link
                type="warning"
                @click="rollbackVersion(row)"
              >
                回滚至此
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="versionDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="compareVersionVisible"
      title="版本对比"
      width="900px"
      :close-on-click-modal="false"
      class="compare-dialog"
      destroy-on-close
    >
      <div v-if="compareFrom && compareTo" class="compare-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="compare-header">
              <el-tag type="info" size="large">版本 v{{ compareFrom.versionNo }}</el-tag>
              <span class="compare-time">{{ formatDate(compareFrom.createdAt) }}</span>
            </div>
            <div class="compare-box">
              <div class="compare-title">{{ compareFrom.title }}</div>
              <div class="compare-meta">字数：{{ formatWordCount(compareFrom.wordCount) }}</div>
              <div class="compare-body">{{ compareFrom.summary }}</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="compare-header">
              <el-tag type="primary" size="large">版本 v{{ compareTo.versionNo }}</el-tag>
              <span class="compare-time">{{ formatDate(compareTo.createdAt) }}</span>
            </div>
            <div class="compare-box">
              <div class="compare-title">{{ compareTo.title }}</div>
              <div class="compare-meta">字数：{{ formatWordCount(compareTo.wordCount) }}</div>
              <div class="compare-body">{{ compareTo.summary }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
      <template #footer>
        <el-button @click="compareVersionVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="checkReportDialogVisible"
      title="内容校验报告"
      width="640px"
      :close-on-click-modal="false"
      class="check-report-dialog"
      destroy-on-close
    >
      <div v-loading="checkReportLoading" class="check-report-content">
        <div v-if="checkReportData" class="report-content">
          <div class="report-score">
            <div class="score-label">综合评分</div>
            <div class="score-value">{{ checkReportData.overallScore }}</div>
          </div>

          <el-divider />

          <div class="report-section">
            <div class="section-title">检测项目</div>
            <div class="check-items">
              <div
                v-for="(item, idx) in checkReportData.checks"
                :key="idx"
                class="check-item-row"
              >
                <div class="item-name">{{ item.item }}</div>
                <div class="item-status">
                  <el-tag
                    :type="item.status === 'pass' ? 'success' : item.status === 'warning' ? 'warning' : 'danger'"
                    size="small"
                    effect="light"
                  >
                    {{ item.status === 'pass' ? '通过' : item.status === 'warning' ? '警告' : '未通过' }}
                  </el-tag>
                </div>
                <div class="item-score">{{ item.score }} 分</div>
                <div class="item-message">{{ item.message }}</div>
              </div>
            </div>
          </div>

          <div v-if="checkReportData.issues?.length" class="report-section">
            <div class="section-title">
              <el-icon><Warning /></el-icon>
              <span>存在问题</span>
            </div>
            <ul class="issue-list">
              <li v-for="(issue, idx) in checkReportData.issues" :key="idx">{{ issue }}</li>
            </ul>
          </div>

          <div v-if="checkReportData.suggestions?.length" class="report-section">
            <div class="section-title">
              <el-icon><Promotion /></el-icon>
              <span>优化建议</span>
            </div>
            <ul class="suggestion-list">
              <li v-for="(sug, idx) in checkReportData.suggestions" :key="idx">{{ sug }}</li>
            </ul>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="checkReportDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchTopDialogVisible"
      title="批量置顶图文"
      width="440px"
      :close-on-click-modal="false"
      class="batch-dialog"
      destroy-on-close
    >
      <div class="batch-content">
        <el-alert
          :title="`已选择 ${selectedRows.length} 条图文，请选择置顶时长`"
          type="info"
          show-icon
          :closable="false"
          class="mb-16"
        />
        <el-form label-width="100px">
          <el-form-item label="置顶天数">
            <el-radio-group v-model="batchTopDays">
              <el-radio v-for="item in topDaysOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="batchTopDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          class="btn-shift"
          @click="handleBatchTop"
        >
          确认置顶
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchOfflineDialogVisible"
      title="批量下架图文"
      width="480px"
      :close-on-click-modal="false"
      class="batch-dialog"
      destroy-on-close
    >
      <div class="batch-content">
        <el-alert
          :title="`确定要下架选中的 ${selectedRows.length} 条图文吗？`"
          type="warning"
          show-icon
          :closable="false"
          class="mb-16"
        />
        <el-form label-width="100px">
          <el-form-item label="下架原因">
            <el-input
              v-model="batchOfflineReason"
              type="textarea"
              :rows="4"
              placeholder="请详细说明下架原因"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="batchOfflineDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="loading"
          class="btn-shift"
          @click="handleBatchOffline"
        >
          确认下架
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchClassifyDialogVisible"
      title="批量归类专题"
      width="520px"
      :close-on-click-modal="false"
      class="batch-dialog"
      destroy-on-close
    >
      <div class="batch-content">
        <el-alert
          :title="`将选中的 ${selectedRows.length} 条图文归类到指定专题`"
          type="info"
          show-icon
          :closable="false"
          class="mb-16"
        />
        <el-form label-width="100px">
          <el-form-item label="专题ID">
            <el-input-number
              v-model="batchClassifyTopicId"
              :min="1"
              :controls="false"
              style="width: 100%"
            >
              <template #suffix>
                <el-icon
                  v-if="batchClassifyLoading"
                  class="is-loading"
                  style="animation: spin 1s linear infinite"
                >
                  <RefreshLeft />
                </el-icon>
              </template>
            </el-input-number>
          </el-form-item>
          <el-form-item label="专题标题">
            <el-input v-model="batchClassifyTopicTitle" placeholder="输入ID后自动填充" readonly />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="batchClassifyDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          class="btn-shift"
          @click="handleBatchClassify"
        >
          确认归类
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.article-page {
  .filter-bar {
    margin-bottom: 16px;

    .filter-form {
      .filter-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;

        .date-separator {
          margin: 0 6px;
          color: #909399;
        }

        .filter-actions {
          margin-left: auto;
        }
      }
    }
  }

  .btn-shift {
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  .article-table {
    .cover-cell {
      .cover-thumb {
        width: 56px;
        height: 56px;
        border-radius: 4px;
        object-fit: cover;
        cursor: pointer;
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.05);
        }
      }

      .cover-placeholder {
        width: 56px;
        height: 56px;
        border-radius: 4px;
        background: #f5f7fa;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c0c4cc;
        font-size: 24px;
      }
    }

    .title-cell {
      .title-text {
        display: block;
        font-weight: 500;
        color: #303133;
        line-height: 1.5;
        margin-bottom: 4px;
      }

      .title-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
    }

    .word-count {
      color: #606266;
      font-size: 13px;
    }

    .count-num {
      color: #303133;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
    }

    .version-info {
      .version-current {
        color: #409eff;
        font-weight: 500;
      }

      .version-published {
        color: #909399;
        font-size: 12px;
      }
    }

    .account-text {
      color: #606266;
    }

    .date-text {
      color: #606266;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }

    .text-muted {
      color: #909399;
    }

    .text-active {
      color: #67c23a;
    }
  }

  .article-form {
    .input-focus {
      :deep(.el-input__wrapper),
      :deep(.el-textarea__inner) {
        transition: all 0.2s ease;
      }

      :deep(.el-input__wrapper:hover),
      :deep(.el-textarea__inner:hover) {
        box-shadow: 0 0 0 1px var(--el-input-border-color, #dcdfe6) inset;
      }

      :deep(.el-input__wrapper.is-focus),
      :deep(.el-textarea__inner:focus) {
        transform: scale(1.01);
        box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
      }
    }

    .content-textarea {
      :deep(.el-textarea__inner) {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.7;
      }
    }

    .content-check-list {
      margin-top: 8px;
      padding: 12px;
      background: #fafbfc;
      border-radius: 6px;
      border: 1px solid #ebeef5;

      .check-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        font-size: 13px;

        &:last-child {
          margin-bottom: 0;
        }

        .check-label {
          color: #606266;
          font-weight: 500;
          min-width: 80px;
        }
      }
    }

    .text-warning {
      color: #e6a23c;
    }

    .text-success {
      color: #67c23a;
    }

    .text-danger {
      color: #f56c6c;
    }

    .text-muted {
      color: #909399;
    }

    .duplicate-warning {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      padding: 6px 12px;
      background: #fef0f0;
      border-radius: 4px;
      color: #f56c6c;
      font-size: 12px;
    }

    .warning-alert {
      margin-bottom: 12px;

      .warning-list {
        .warning-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
          font-size: 13px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .radio-label {
      font-weight: 500;
      margin-right: 6px;
    }

    .radio-desc {
      color: #909399;
      font-size: 12px;
    }

    .edit-form {
      .mb-16 {
        margin-bottom: 16px;
      }
    }

    .mb-16 {
      margin-bottom: 16px;
    }

    .upload-section {
      width: 100%;
    }
  }

  .article-detail-dialog {
    .detail-content {
      .detail-header {
        display: flex;
        gap: 16px;
        margin-bottom: 20px;

        .detail-cover {
          flex-shrink: 0;
          width: 160px;
          height: 160px;

          .cover-placeholder-lg {
            width: 160px;
            height: 160px;
            border-radius: 8px;
            background: #f5f7fa;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #c0c4cc;
            font-size: 48px;
          }

          :deep(.el-image) {
            width: 160px;
            height: 160px;
            border-radius: 8px;
            overflow: hidden;
          }
        }

        .detail-info {
          flex: 1;
          min-width: 0;

          .detail-title {
            margin: 0 0 10px;
            font-size: 18px;
            font-weight: 600;
            color: #303133;
            line-height: 1.5;
          }

          .detail-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 12px;
          }

          .detail-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            color: #606266;
            font-size: 13px;
          }
        }
      }

      .detail-desc {
        margin-bottom: 20px;
      }

      .sensitive-words {
        color: #f56c6c;
        margin-left: 6px;
      }

      .detail-section {
        margin-bottom: 16px;

        .section-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .section-content {
          background: #fafbfc;
          border-radius: 6px;
          padding: 12px 16px;
          line-height: 1.7;
          color: #303133;
        }

        .tag-item {
          margin: 0 6px 6px 0;
        }

        .summary-content {
          color: #606266;
        }

        .body-content {
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }
      }

      .text-success {
        color: #67c23a;
      }

      .text-danger {
        color: #f56c6c;
      }
    }
  }

  .version-dialog {
    .version-content {
      .mb-16 {
        margin-bottom: 16px;
      }

      .version-table {
        :deep(.el-table__row) {
          transition: background-color 0.2s ease;
        }
      }
    }
  }

  .compare-dialog {
    .compare-content {
      .compare-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .compare-time {
          color: #909399;
          font-size: 13px;
        }
      }

      .compare-box {
        background: #fafbfc;
        border: 1px solid #ebeef5;
        border-radius: 6px;
        padding: 16px;
        min-height: 240px;

        .compare-title {
          font-size: 15px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 8px;
        }

        .compare-meta {
          font-size: 12px;
          color: #909399;
          margin-bottom: 12px;
        }

        .compare-body {
          font-size: 13px;
          color: #606266;
          line-height: 1.7;
        }
      }
    }
  }

  .check-report-dialog {
    .check-report-content {
      .report-content {
        .report-score {
          text-align: center;
          padding: 20px 0;

          .score-label {
            color: #909399;
            font-size: 13px;
            margin-bottom: 8px;
          }

          .score-value {
            font-size: 48px;
            font-weight: 600;
            color: #409eff;
            line-height: 1;
          }
        }

        .report-section {
          margin-top: 20px;

          .section-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            font-weight: 500;
            color: #303133;
            margin-bottom: 12px;
          }

          .check-items {
            .check-item-row {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 10px 12px;
              background: #fafbfc;
              border-radius: 6px;
              margin-bottom: 8px;

              &:last-child {
                margin-bottom: 0;
              }

              .item-name {
                flex: 1;
                color: #303133;
                font-weight: 500;
              }

              .item-score {
                color: #409eff;
                font-weight: 500;
                font-variant-numeric: tabular-nums;
              }

              .item-message {
                color: #909399;
                font-size: 12px;
                max-width: 200px;
              }
            }
          }

          .issue-list,
          .suggestion-list {
            margin: 0;
            padding-left: 20px;
            color: #606266;
            line-height: 2;

            li {
              font-size: 13px;
            }
          }

          .issue-list {
            li {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }

  .batch-dialog {
    .batch-content {
      .mb-16 {
        margin-bottom: 16px;
      }
    }
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
