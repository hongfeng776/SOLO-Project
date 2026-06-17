<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted } from 'vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  TOPIC_TYPE,
  TOPIC_COVER_TEMPLATE,
  TOPIC_SORT_RULE,
  TOPIC_STATUS,
  COVER_CATEGORY,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getTopicListApi,
  getTopicDetailApi,
  createTopicApi,
  updateTopicApi,
  changeTopicStatusApi,
  mountTopicContentApi,
  unmountTopicContentApi,
  reorderTopicContentsApi,
  batchEnableTopicsApi,
  batchDisableTopicsApi,
  batchSupplementContentsApi,
  batchUpdateTopicWeightApi,
  checkTopicTitleUniqueApi,
  checkTopicTimeOverlapApi,
  checkContentMountedApi,
} from '@/api/topic'
import type {
  TopicItem,
  TopicContentItem,
  TopicTitleCheckResult,
  TopicTimeOverlapResult,
  ContentMountCheckResult,
  BatchOperationResult,
} from '@/types'
import { formatDate, formatNumber, copyToClipboard } from '@/utils'
import {
  Search,
  RefreshLeft,
  Plus,
  Edit,
  View,
  Collection,
  Picture,
  Calendar,
  Sort,
  Upload,
  Histogram,
  DataLine,
  Warning,
  Check,
  MagicStick,
  Setting,
  Loading,
  Close,
  ArrowUp,
  ArrowDown,
} from '@element-plus/icons-vue'

const loading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const listData = ref<TopicItem[]>([])
const total = ref<number>(0)
const selectedRows = ref<TopicItem[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  topicId: null as number | null,
  topicType: null as number | null,
  hotScoreMin: null as number | null,
  status: null as number | null,
  createStartDate: '',
  createEndDate: '',
  minContent: null as number | null,
  maxContent: null as number | null,
  isCore: null as number | null,
  operationBatch: '',
  creatorName: '',
  sortBy: 'created_at',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
})

const tableHeight = computed<string>(`calc(100vh - 360px)`)

const loadData = async (): Promise<void> => {
  loading.value = true
  try {
    const params = { ...queryParams }
    if (queryParams.topicId) {
      params.id = queryParams.topicId
    }
    const result = await getTopicListApi(params)
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
  queryParams.topicId = null
  queryParams.topicType = null
  queryParams.hotScoreMin = null
  queryParams.status = null
  queryParams.createStartDate = ''
  queryParams.createEndDate = ''
  queryParams.minContent = null
  queryParams.maxContent = null
  queryParams.isCore = null
  queryParams.operationBatch = ''
  queryParams.creatorName = ''
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

const handleSelectionChange = (rows: TopicItem[]): void => {
  selectedRows.value = rows
}

const handleRefreshTable = (): void => {
  loadData()
}

const createDialogVisible = ref<boolean>(false)
const createFormRef = ref<FormInstance>()
const createSubmitLoading = ref<boolean>(false)

const createFormData = reactive<Partial<TopicItem>>({
  title: '',
  description: '',
  topicType: null as number | null,
  coverTemplate: '',
  sortRule: null as number | null,
  coverImage: '',
  operationStartTime: '',
  operationEndTime: '',
  coverCategories: [] as string[],
  weightScore: 0,
  isCore: 0,
  tags: [] as string[],
})

const topicTypeOptions = computed(() => getEnumOptions(TOPIC_TYPE))
const coverCategoryOptions = computed(() => getEnumOptions(COVER_CATEGORY))
const topicStatusOptions = computed(() => getEnumOptions(TOPIC_STATUS))
const sortRuleOptions = computed(() => getEnumOptions(TOPIC_SORT_RULE))

const topicTypeIconMap: Record<number, any> = {
  [TOPIC_TYPE.FESTIVAL.value]: Collection,
  [TOPIC_TYPE.HOT.value]: Histogram,
  [TOPIC_TYPE.CATEGORY.value]: DataLine,
  [TOPIC_TYPE.PEOPLE.value]: View,
  [TOPIC_TYPE.ACTIVITY.value]: MagicStick,
}

const isTimeExpired = computed<boolean>(() => {
  if (!createFormData.operationEndTime) return false
  return new Date(createFormData.operationEndTime).getTime() < Date.now()
})

const isTimeRangeValid = computed<boolean>(() => {
  if (!createFormData.operationStartTime || !createFormData.operationEndTime) return true
  return new Date(createFormData.operationStartTime).getTime() < new Date(createFormData.operationEndTime).getTime()
})

const titleChecking = ref<boolean>(false)
const titleUnique = ref<boolean | null>(null)
const duplicateTopic = ref<{ id: number; title: string } | null>(null)

let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null

const validateTitleUnique = async (): Promise<void> => {
  if (!createFormData.title || createFormData.topicType === null || createFormData.topicType === undefined) {
    titleUnique.value = null
    duplicateTopic.value = null
    return
  }
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer)
  titleDebounceTimer = setTimeout(async () => {
    titleChecking.value = true
    titleUnique.value = null
    duplicateTopic.value = null
    try {
      const result: TopicTitleCheckResult = await checkTopicTitleUniqueApi(
        createFormData.title,
        createFormData.topicType
      )
      titleUnique.value = result.isUnique
      duplicateTopic.value = result.duplicateTopic || null
    } catch {
      titleUnique.value = null
    } finally {
      titleChecking.value = false
    }
  }, 500)
}

const timeOverlapChecking = ref<boolean>(false)
const timeOverlapResult = ref<TopicTimeOverlapResult | null>(null)

const checkTimeOverlap = async (): Promise<void> => {
  if (
    createFormData.topicType === null ||
    createFormData.topicType === undefined ||
    !createFormData.operationStartTime ||
    !createFormData.operationEndTime
  ) {
    timeOverlapResult.value = null
    return
  }
  timeOverlapChecking.value = true
  try {
    const result: TopicTimeOverlapResult = await checkTopicTimeOverlapApi(
      createFormData.topicType,
      createFormData.operationStartTime,
      createFormData.operationEndTime
    )
    timeOverlapResult.value = result
  } catch {
    timeOverlapResult.value = null
  } finally {
    timeOverlapChecking.value = false
  }
}

watch(
  () => [createFormData.operationStartTime, createFormData.operationEndTime],
  () => {
    checkTimeOverlap()
  }
)

const handleTopicTypeSelect = (typeValue: number): void => {
  createFormData.topicType = typeValue
  switch (typeValue) {
    case TOPIC_TYPE.FESTIVAL.value:
      createFormData.coverTemplate = TOPIC_COVER_TEMPLATE.FESTIVAL_DEFAULT.value
      createFormData.sortRule = TOPIC_SORT_RULE.COMPOSITE.value
      break
    case TOPIC_TYPE.HOT.value:
      createFormData.coverTemplate = TOPIC_COVER_TEMPLATE.HOT_STYLE.value
      createFormData.sortRule = TOPIC_SORT_RULE.HOT.value
      break
    case TOPIC_TYPE.CATEGORY.value:
      createFormData.coverTemplate = TOPIC_COVER_TEMPLATE.CATEGORY_BANNER.value
      createFormData.sortRule = TOPIC_SORT_RULE.WEIGHT.value
      break
    case TOPIC_TYPE.PEOPLE.value:
      createFormData.coverTemplate = TOPIC_COVER_TEMPLATE.PEOPLE_FEATURE.value
      createFormData.sortRule = TOPIC_SORT_RULE.MANUAL.value
      break
    case TOPIC_TYPE.ACTIVITY.value:
      createFormData.coverTemplate = TOPIC_COVER_TEMPLATE.ACTIVITY_SPECIAL.value
      createFormData.sortRule = TOPIC_SORT_RULE.TIME.value
      break
  }
  validateTitleUnique()
  checkTimeOverlap()
}

const resetCreateForm = (): void => {
  Object.assign(createFormData, {
    title: '',
    description: '',
    topicType: null,
    coverTemplate: '',
    sortRule: null,
    coverImage: '',
    operationStartTime: '',
    operationEndTime: '',
    coverCategories: [],
    weightScore: 0,
    isCore: 0,
    tags: [],
  })
  titleUnique.value = null
  duplicateTopic.value = null
  timeOverlapResult.value = null
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer)
}

const openCreateDialog = (): void => {
  resetCreateForm()
  createDialogVisible.value = true
  nextTick(() => {
    createFormRef.value?.clearValidate()
  })
}

const validateCreateTitle = (_rule: any, value: string): Promise<void> => {
  if (!value) return Promise.reject(new Error('请输入专题标题'))
  if (value.length < 2) return Promise.reject(new Error('标题至少2个字符'))
  if (value.length > 100) return Promise.reject(new Error('标题不能超过100个字符'))
  return Promise.resolve()
}

const validateTopicType = (_rule: any, value: number): Promise<void> => {
  if (value === null || value === undefined) return Promise.reject(new Error('请选择专题类型'))
  return Promise.resolve()
}

const validateCoverCategories = (_rule: any, value: string[]): Promise<void> => {
  if (!value || value.length === 0) return Promise.reject(new Error('请至少选择一个覆盖品类'))
  return Promise.resolve()
}

const validateCoverImage = (_rule: any, value: string): Promise<void> => {
  if (!value) return Promise.reject(new Error('请上传专题封面图'))
  return Promise.resolve()
}

const createFormRules: FormRules = {
  title: [{ validator: validateCreateTitle, trigger: ['blur', 'change'] }],
  topicType: [{ validator: validateTopicType, trigger: ['blur', 'change'] }],
  coverCategories: [{ validator: validateCoverCategories, trigger: ['blur', 'change'] }],
  coverImage: [{ validator: validateCoverImage, trigger: ['blur', 'change'] }],
}

const beforeCoverUpload: UploadProps['beforeUpload'] = (rawFile): boolean => {
  const isImage = rawFile.type.startsWith('image/')
  const isLt5M = rawFile.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleCoverUpload: UploadProps['httpRequest'] = (options): void => {
  const { file, onProgress, onSuccess } = options
  let progress = 0
  const timer = setInterval(() => {
    progress += Math.random() * 30
    if (progress >= 100) {
      progress = 100
      clearInterval(timer)
      const fakeUrl = URL.createObjectURL(file as File)
      createFormData.coverImage = fakeUrl
      onSuccess?.(file)
    } else {
      onProgress?.({ percent: progress })
    }
  }, 200)
}

const handleCoverRemove = (): void => {
  createFormData.coverImage = ''
}

const operationTimeRange = computed({
  get: () => {
    if (createFormData.operationStartTime && createFormData.operationEndTime) {
      return [createFormData.operationStartTime, createFormData.operationEndTime]
    }
    return []
  },
  set: (val: string[]) => {
    if (val && val.length === 2) {
      createFormData.operationStartTime = val[0]
      createFormData.operationEndTime = val[1]
    } else {
      createFormData.operationStartTime = ''
      createFormData.operationEndTime = ''
    }
  },
})

const handleCreateSubmit = async (): Promise<void> => {
  await createFormRef.value?.validate()
  if (!isTimeRangeValid.value) {
    ElMessage.error('开始时间必须早于结束时间')
    return
  }
  if (titleUnique.value === false) {
    ElMessage.error('专题标题重复，请修改标题')
    return
  }
  if (timeOverlapResult.value?.hasOverlap) {
    ElMessage.error('存在时段重叠冲突，请调整运营时段')
    return
  }
  createSubmitLoading.value = true
  try {
    const result = await createTopicApi(createFormData)
    ElMessage.success(`专题创建成功，资源位链接：${result.resourceLink}`)
    createDialogVisible.value = false
    loadData()
  } finally {
    createSubmitLoading.value = false
  }
}

const detailDialogVisible = ref<boolean>(false)
const detailDialogAnimating = ref<boolean>(false)
const detailActiveTab = ref<string>('contents')
const detailData = ref<TopicItem | null>(null)
const detailContents = ref<TopicContentItem[]>([])
const detailLoading = ref<boolean>(false)
const detailFormRef = ref<FormInstance>()
const detailSubmitLoading = ref<boolean>(false)
const detailSortMode = ref<'MANUAL' | 'SMART'>('MANUAL')
const detailFormData = reactive<Partial<TopicItem>>({})
const contentMountDialogVisible = ref<boolean>(false)
const mountContentIds = ref<string>('')
const mountChecking = ref<boolean>(false)
const mountCheckResult = ref<ContentMountCheckResult | null>(null)

const isTopicOnline = computed<boolean>(() => {
  return detailData.value?.status === TOPIC_STATUS.ONLINE.value
})

const isTopicExpired = computed<boolean>(() => {
  if (!detailData.value?.operationEndTime) return false
  return new Date(detailData.value.operationEndTime).getTime() < Date.now()
})

const canEditContents = computed<boolean>(() => {
  if (!detailData.value) return false
  return !isTopicExpired.value
})

const openDetailDialog = async (row: TopicItem): Promise<void> => {
  detailDialogVisible.value = true
  detailDialogAnimating.value = true
  detailActiveTab.value = 'contents'
  detailData.value = row
  detailSortMode.value = detailData.value.sortRule === TOPIC_SORT_RULE.MANUAL.value ? 'MANUAL' : 'SMART'
  Object.assign(detailFormData, { ...row })
  detailLoading.value = true
  try {
    const detail = await getTopicDetailApi(row.id)
    detailContents.value = detail.topicContents || []
  } catch {
    detailContents.value = []
  } finally {
    detailLoading.value = false
  }
  nextTick(() => {
    detailFormRef.value?.clearValidate()
  })
}

const closeDetailDialog = (): void => {
  detailDialogAnimating.value = false
  setTimeout(() => {
    detailDialogVisible.value = false
  }, 300)
}

const handleDetailSortModeChange = (mode: 'MANUAL' | 'SMART'): void => {
  detailSortMode.value = mode
}

const moveContentUp = (index: number): void => {
  if (index <= 0) return
  const contents = [...detailContents.value]
  const temp = contents[index]
  contents[index] = contents[index - 1]
  contents[index - 1] = temp
  detailContents.value = contents
}

const moveContentDown = (index: number): void => {
  if (index >= detailContents.value.length - 1) return
  const contents = [...detailContents.value]
  const temp = contents[index]
  contents[index] = contents[index + 1]
  contents[index + 1] = temp
  detailContents.value = contents
}

const handleContentSortChange = async (): Promise<void> => {
  if (!detailData.value) return
  const orderList = detailContents.value.map((item, index) => ({
    id: item.id,
    sortOrder: index + 1,
  }))
  try {
    await reorderTopicContentsApi(detailData.value.id, orderList)
    ElMessage.success('排序保存成功')
  } catch {
    ElMessage.error('排序保存失败')
  }
}

const handleUnmountContent = async (contentItem: TopicContentItem): Promise<void> => {
  if (!detailData.value) return
  await ElMessageBox.confirm('确定要从专题中移除该内容吗？', '移除确认', { type: 'warning' })
  try {
    await unmountTopicContentApi(detailData.value.id, [contentItem.contentId])
    detailContents.value = detailContents.value.filter((c) => c.id !== contentItem.id)
    ElMessage.success('移除成功')
  } catch {
    ElMessage.error('移除失败')
  }
}

const openContentMountDialog = (): void => {
  mountContentIds.value = ''
  mountCheckResult.value = null
  contentMountDialogVisible.value = true
}

const checkMountContents = async (): Promise<void> => {
  if (!detailData.value || !mountContentIds.value.trim()) {
    mountCheckResult.value = null
    return
  }
  const ids = mountContentIds.value
    .split(/[,，\s]+/)
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
  if (ids.length === 0) {
    ElMessage.warning('请输入有效的内容ID')
    return
  }
  mountChecking.value = true
  try {
    const result: ContentMountCheckResult = await checkContentMountedApi(detailData.value.id, ids)
    mountCheckResult.value = result
  } catch {
    mountCheckResult.value = null
  } finally {
    mountChecking.value = false
  }
}

const handleMountContents = async (): Promise<void> => {
  if (!detailData.value || !mountContentIds.value.trim()) {
    ElMessage.warning('请输入内容ID')
    return
  }
  const ids = mountContentIds.value
    .split(/[,，\s]+/)
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
  if (ids.length === 0) {
    ElMessage.warning('请输入有效的内容ID')
    return
  }
  try {
    const contentList = ids.map((contentId, index) => ({
      contentId,
      sortOrder: detailContents.value.length + index + 1,
      weightScore: 50,
      isRecommended: 0,
    }))
    await mountTopicContentApi(detailData.value.id, contentList)
    ElMessage.success(`成功挂载 ${ids.length} 条内容`)
    contentMountDialogVisible.value = false
    const detail = await getTopicDetailApi(detailData.value.id)
    detailContents.value = detail.topicContents || []
  } catch {
    ElMessage.error('内容挂载失败')
  }
}

const handleDetailSubmit = async (): Promise<void> => {
  if (!detailData.value) return
  if (isTopicOnline.value) {
    await ElMessageBox.confirm(
      '当前专题已上线，修改内容可能影响线上展示效果，确定要继续保存吗？',
      '上线专题修改确认',
      { type: 'warning' }
    )
  }
  detailSubmitLoading.value = true
  try {
    await updateTopicApi(detailData.value.id, detailFormData)
    ElMessage.success('保存成功')
    closeDetailDialog()
    loadData()
  } finally {
    detailSubmitLoading.value = false
  }
}

const statusDialogVisible = ref<boolean>(false)
const statusDialogAnimating = ref<boolean>(false)
const currentStatusRow = ref<TopicItem | null>(null)
const targetStatus = ref<number | null>(null)

const statusTransitions: Record<number, number[]> = {
  [TOPIC_STATUS.DRAFT.value]: [TOPIC_STATUS.NOT_LAUNCHED.value],
  [TOPIC_STATUS.NOT_LAUNCHED.value]: [TOPIC_STATUS.ONLINE.value, TOPIC_STATUS.OFFLINE.value],
  [TOPIC_STATUS.ONLINE.value]: [TOPIC_STATUS.OFFLINE.value, TOPIC_STATUS.EXPIRED.value],
  [TOPIC_STATUS.OFFLINE.value]: [TOPIC_STATUS.ONLINE.value, TOPIC_STATUS.EXPIRED.value],
  [TOPIC_STATUS.EXPIRED.value]: [],
}

const getAvailableStatuses = (currentStatus: number): Array<{ value: number; label: string }> => {
  const allowed = statusTransitions[currentStatus] || []
  return allowed.map((status) => {
    const item = getEnumItem(TOPIC_STATUS, status)
    return { value: status, label: item?.label || '' }
  })
}

const openStatusDialog = (row: TopicItem): void => {
  currentStatusRow.value = row
  targetStatus.value = null
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

const handleStatusSubmit = async (): Promise<void> => {
  if (!currentStatusRow.value || targetStatus.value === null) return
  loading.value = true
  try {
    await changeTopicStatusApi(currentStatusRow.value.id, {
      toStatus: targetStatus.value,
    })
    ElMessage.success('状态变更成功')
    closeStatusDialog()
    loadData()
  } finally {
    loading.value = false
  }
}

const batchProgressVisible = ref<boolean>(false)
const batchProgress = ref<number>(0)
const batchProcessed = ref<number>(0)
const batchTotal = ref<number>(0)
const batchOperationName = ref<string>('')

const showBatchResult = (result: BatchOperationResult, action: string): void => {
  if (result.skippedCount > 0) {
    ElMessageBox.alert(
      `批量${action}完成：\n• 成功：${result.successCount}条\n• 跳过（核心专题不参与批量操作）：${result.skippedCount}条`,
      '操作明细',
      { type: 'info', confirmButtonText: '知道了' }
    )
  } else {
    ElMessage.success(`批量${action}成功，共${result.successCount}条`)
  }
}

const getNonCoreIds = (): number[] => {
  return selectedRows.value.filter((r) => r.isCore !== 1).map((r) => r.id)
}

const hasCoreSelected = computed<boolean>(() => {
  return selectedRows.value.some((r) => r.isCore === 1)
})

const simulateBatchProgress = (total: number, action: string, callback: () => Promise<BatchOperationResult>): void => {
  batchTotal.value = total
  batchProcessed.value = 0
  batchProgress.value = 0
  batchOperationName.value = action
  batchProgressVisible.value = true
  let processed = 0
  const timer = setInterval(() => {
    processed += Math.ceil(total / 10)
    if (processed >= total) {
      processed = total
      clearInterval(timer)
      callback().then((result) => {
        batchProgress.value = 100
        batchProcessed.value = total
        setTimeout(() => {
          batchProgressVisible.value = false
          showBatchResult(result, action)
          loadData()
        }, 500)
      })
    } else {
      batchProcessed.value = processed
      batchProgress.value = Math.floor((processed / total) * 100)
    }
  }, 200)
}

const handleBatchEnable = async (): Promise<void> => {
  const ids = getNonCoreIds()
  if (ids.length === 0) {
    ElMessage.warning('请选择要启用的专题')
    return
  }
  if (hasCoreSelected.value) {
    ElMessage.info('核心专题不参与批量操作，已自动跳过')
  }
  simulateBatchProgress(ids.length, '启用', () => batchEnableTopicsApi(ids))
}

const batchDisableDialogVisible = ref<boolean>(false)
const batchDisableReason = ref<string>('')

const openBatchDisableDialog = (): void => {
  const ids = getNonCoreIds()
  if (ids.length === 0) {
    ElMessage.warning('请选择要停用的专题')
    return
  }
  if (hasCoreSelected.value) {
    ElMessage.info('核心专题不参与批量操作，已自动跳过')
  }
  batchDisableReason.value = ''
  batchDisableDialogVisible.value = true
}

const handleBatchDisable = async (): Promise<void> => {
  const ids = getNonCoreIds()
  if (!batchDisableReason.value.trim()) {
    ElMessage.warning('请填写停用原因')
    return
  }
  batchDisableDialogVisible.value = false
  simulateBatchProgress(ids.length, '停用', () => batchDisableTopicsApi(ids, batchDisableReason.value))
}

const batchSupplementDialogVisible = ref<boolean>(false)
const batchSupplementContentIds = ref<string>('')

const openBatchSupplementDialog = (): void => {
  const ids = getNonCoreIds()
  if (ids.length === 0) {
    ElMessage.warning('请选择要补充内容的专题')
    return
  }
  if (hasCoreSelected.value) {
    ElMessage.info('核心专题不参与批量操作，已自动跳过')
  }
  batchSupplementContentIds.value = ''
  batchSupplementDialogVisible.value = true
}

const handleBatchSupplement = async (): Promise<void> => {
  const ids = getNonCoreIds()
  const contentIds = batchSupplementContentIds.value
    .split(/[,，\s]+/)
    .map((s) => parseInt(s.trim()))
    .filter((n) => !isNaN(n))
  if (contentIds.length === 0) {
    ElMessage.warning('请输入内容ID')
    return
  }
  batchSupplementDialogVisible.value = false
  simulateBatchProgress(ids.length, '补充内容', () => batchSupplementContentsApi(ids, contentIds))
}

const batchWeightDialogVisible = ref<boolean>(false)
const batchWeightScore = ref<number>(50)

const openBatchWeightDialog = (): void => {
  const ids = getNonCoreIds()
  if (ids.length === 0) {
    ElMessage.warning('请选择要修改权重的专题')
    return
  }
  if (hasCoreSelected.value) {
    ElMessage.info('核心专题不参与批量操作，已自动跳过')
  }
  batchWeightScore.value = 50
  batchWeightDialogVisible.value = true
}

const handleBatchWeight = async (): Promise<void> => {
  const ids = getNonCoreIds()
  batchWeightDialogVisible.value = false
  simulateBatchProgress(ids.length, '修改权重', () => batchUpdateTopicWeightApi(ids, batchWeightScore.value))
}

const handleCopyLink = async (row: TopicItem): Promise<void> => {
  if (!row.resourceLink) {
    ElMessage.warning('该专题暂无资源位链接')
    return
  }
  const success = await copyToClipboard(row.resourceLink)
  if (success) {
    ElMessage.success('链接已复制到剪贴板')
  } else {
    ElMessage.error('复制失败')
  }
}

const tableColumns = computed(() => [
  { type: 'selection', width: 50, resizable: true },
  { prop: 'id', label: 'ID', width: 70, align: 'center' as const, sortable: 'custom' as const, resizable: true },
  { prop: 'coverImage', label: '封面', width: 100, align: 'center' as const, slot: 'cover', resizable: true },
  { prop: 'title', label: '专题标题', minWidth: 180, showOverflowTooltip: true, slot: 'title', resizable: true },
  { prop: 'topicType', label: '专题类型', width: 110, align: 'center' as const, slot: 'topicType', resizable: true },
  { prop: 'status', label: '状态', width: 100, align: 'center' as const, slot: 'status', resizable: true },
  { prop: 'operationTime', label: '运营时段', minWidth: 200, align: 'center' as const, slot: 'operationTime', resizable: true },
  { prop: 'coverCategories', label: '覆盖品类', width: 150, align: 'center' as const, slot: 'coverCategories', resizable: true },
  { prop: 'contentCount', label: '内容数量', width: 100, align: 'center' as const, sortable: 'custom' as const, slot: 'contentCount', resizable: true },
  { prop: 'hotScore', label: '热度评分', width: 100, align: 'center' as const, sortable: 'custom' as const, slot: 'hotScore', resizable: true },
  { prop: 'weightScore', label: '权重分值', width: 100, align: 'center' as const, sortable: 'custom' as const, slot: 'weightScore', resizable: true },
  { prop: 'isCore', label: '核心', width: 70, align: 'center' as const, slot: 'isCore', resizable: true },
  { prop: 'resourceLink', label: '资源位链接', width: 130, align: 'center' as const, slot: 'resourceLink', resizable: true },
  { prop: 'creatorName', label: '创建人', width: 100, align: 'center' as const, slot: 'creatorName', resizable: true },
  { prop: 'createdAt', label: '创建时间', width: 160, align: 'center' as const, sortable: 'custom' as const, slot: 'createdAt', resizable: true },
  { label: '操作', width: 280, fixed: 'right' as const, align: 'center' as const, slot: 'actions', resizable: true },
])

const topicTypeOptionsFilter = computed(() => getEnumOptions(TOPIC_TYPE))
const topicStatusOptionsFilter = computed(() => getEnumOptions(TOPIC_STATUS))

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer)
})
</script>

<template>
  <div class="topic-page">
    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent class="filter-form">
        <div class="filter-row">
          <el-form-item label="专题ID">
            <el-input-number
              v-model="queryParams.topicId"
              :min="1"
              placeholder="ID"
              style="width: 120px"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="专题类型">
            <el-select v-model="queryParams.topicType" placeholder="全部类型" clearable style="width: 130px">
              <el-option
                v-for="item in topicTypeOptionsFilter"
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
          <el-form-item label="运营状态">
            <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 130px">
              <el-option
                v-for="item in topicStatusOptionsFilter"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="是否核心">
            <el-select v-model="queryParams.isCore" placeholder="全部" clearable style="width: 110px">
              <el-option label="核心专题" :value="1" />
              <el-option label="普通专题" :value="0" />
            </el-select>
          </el-form-item>
        </div>
        <div class="filter-row">
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="queryParams.createStartDate"
              type="date"
              placeholder="开始日期"
              style="width: 140px"
              value-format="YYYY-MM-DD"
            />
            <span class="date-separator">至</span>
            <el-date-picker
              v-model="queryParams.createEndDate"
              type="date"
              placeholder="结束日期"
              style="width: 140px"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="内容数量">
            <el-input-number
              v-model="queryParams.minContent"
              :min="0"
              placeholder="最少"
              style="width: 100px"
              controls-position="right"
            />
            <span class="date-separator">-</span>
            <el-input-number
              v-model="queryParams.maxContent"
              :min="0"
              placeholder="最多"
              style="width: 100px"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="运营批次号">
            <el-input
              v-model="queryParams.operationBatch"
              placeholder="批次号"
              clearable
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="创建人员">
            <el-input
              v-model="queryParams.creatorName"
              placeholder="创建人"
              clearable
              style="width: 140px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
        </div>
        <div class="filter-row">
          <el-form-item label="关键词">
            <el-input
              v-model="queryParams.keyword"
              placeholder="请输入关键词搜索"
              clearable
              style="width: 220px"
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item class="filter-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch" class="btn-rounded btn-shift">搜索</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset" class="btn-rounded btn-shift">重置</el-button>
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
            type="success"
            :icon="Check"
            :disabled="selectedRows.length === 0"
            @click="handleBatchEnable"
            class="btn-rounded btn-shift"
          >
            批量启用
          </el-button>
          <el-button
            type="warning"
            :icon="Warning"
            :disabled="selectedRows.length === 0"
            @click="openBatchDisableDialog"
            class="btn-rounded btn-shift"
          >
            批量停用
          </el-button>
          <el-button
            type="primary"
            :icon="Plus"
            :disabled="selectedRows.length === 0"
            @click="openBatchSupplementDialog"
            class="btn-rounded btn-shift"
          >
            批量补充内容
          </el-button>
          <el-button
            type="info"
            :icon="Setting"
            :disabled="selectedRows.length === 0"
            @click="openBatchWeightDialog"
            class="btn-rounded btn-shift"
          >
            批量修改权重
          </el-button>
        </template>
        <template #right>
          <el-button :icon="Histogram" @click="handleRefreshTable" class="btn-rounded btn-shift">
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
              <el-icon><Collection /></el-icon>
            </div>
          </div>
        </template>

        <template #title="{ row }">
          <div class="title-cell">
            <span class="title-text" :title="row.title">{{ row.title }}</span>
            <div v-if="row.operationBatch" class="title-meta">
              <el-tag size="small" effect="plain" type="info">批次: {{ row.operationBatch }}</el-tag>
            </div>
          </div>
        </template>

        <template #topicType="{ row }">
          <el-tag
            :type="getEnumItem(TOPIC_TYPE, row.topicType)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(TOPIC_TYPE, row.topicType) }}
          </el-tag>
        </template>

        <template #status="{ row }">
          <el-tag
            :type="getEnumItem(TOPIC_STATUS, row.status)?.type || 'info'"
            size="small"
            effect="light"
          >
            {{ getEnumLabel(TOPIC_STATUS, row.status) }}
          </el-tag>
        </template>

        <template #operationTime="{ row }">
          <div class="time-cell">
            <span class="time-text">{{ formatDate(row.operationStartTime, 'YYYY-MM-DD HH:mm') }}</span>
            <span class="time-separator">~</span>
            <span class="time-text">{{ formatDate(row.operationEndTime, 'YYYY-MM-DD HH:mm') }}</span>
          </div>
        </template>

        <template #coverCategories="{ row }">
          <div class="categories-cell">
            <el-tooltip
              v-if="(row.coverCategories || []).length > 2"
            >
              <template #content>
                <div class="tooltip-categories">
                  <div v-for="cat in row.coverCategories" :key="cat">
                    {{ getEnumLabel(COVER_CATEGORY, cat) || cat }}
                  </div>
                </div>
              </template>
              <div class="category-tags">
                <el-tag
                  v-for="(cat, index) in (row.coverCategories || []).slice(0, 2)"
                  :key="cat"
                  size="small"
                  effect="plain"
                  type="info"
                  class="category-tag"
                >
                  {{ getEnumLabel(COVER_CATEGORY, cat) || cat }}
                </el-tag>
                <el-tag v-if="(row.coverCategories || []).length > 2" size="small" effect="plain">
                  +{{ (row.coverCategories || []).length - 2 }}
                </el-tag>
              </div>
            </el-tooltip>
            <div v-else class="category-tags">
              <el-tag
                v-for="cat in (row.coverCategories || [])"
                :key="cat"
                size="small"
                effect="plain"
                type="info"
                class="category-tag"
              >
                {{ getEnumLabel(COVER_CATEGORY, cat) || cat }}
              </el-tag>
            </div>
          </div>
        </template>

        <template #contentCount="{ row }">
          <span class="number-text">{{ formatNumber(row.contentCount) }}</span>
        </template>

        <template #hotScore="{ row }">
          <span class="hot-score">{{ formatNumber(row.hotScore) }}</span>
        </template>

        <template #weightScore="{ row }">
          <span class="weight-score">{{ formatNumber(row.weightScore) }}</span>
        </template>

        <template #isCore="{ row }">
          <span v-if="row.isCore === 1" class="core-star" title="核心专题">★</span>
          <span v-else class="non-core-dot" title="普通专题">●</span>
        </template>

        <template #resourceLink="{ row }">
          <el-tooltip v-if="row.resourceLink" :content="row.resourceLink" placement="top">
            <el-link type="primary" @click="handleCopyLink(row)" class="resource-link">
              复制链接
            </el-link>
          </el-tooltip>
          <span v-else class="no-link">-</span>
        </template>

        <template #creatorName="{ row }">
          <span class="creator-text" :title="row.creatorName">{{ row.creatorName || '-' }}</span>
        </template>

        <template #createdAt="{ row }">
          <span class="date-text">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link size="small" :icon="View" @click="openDetailDialog(row)">
            详情
          </el-button>
          <el-button type="primary" link size="small" :icon="Edit" @click="openDetailDialog(row)">
            编辑
          </el-button>
          <el-button type="success" link size="small" :icon="Sort" @click="() => { detailActiveTab = 'contents'; openDetailDialog(row) }">
            内容管理
          </el-button>
          <el-dropdown
            trigger="click"
            @command="(status: number) => { targetStatus = status; openStatusDialog(row) }"
          >
            <el-button type="warning" link size="small">
              状态变更
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
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="info" link size="small" @click="handleCopyLink(row)">
            复制链接
          </el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="createDialogVisible"
      title="新建专题"
      width="960px"
      :close-on-click-modal="false"
      class="create-topic-dialog"
      destroy-on-close
    >
      <el-form
        ref="createFormRef"
        :model="createFormData"
        :rules="createFormRules"
        label-width="110px"
        class="create-topic-form"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="专题标题" prop="title">
              <el-input
                v-model="createFormData.title"
                placeholder="请输入专题标题"
                maxlength="100"
                show-word-limit
                @input="validateTitleUnique"
              >
                <template #suffix>
                  <el-icon v-if="titleChecking" class="is-loading"><Loading /></el-icon>
                  <el-icon v-else-if="titleUnique === true" class="check-icon"><Check /></el-icon>
                  <el-icon v-else-if="titleUnique === false" class="error-icon"><Close /></el-icon>
                </template>
              </el-input>
              <div v-if="titleUnique === false && duplicateTopic" class="duplicate-warning">
                <el-icon><Warning /></el-icon>
                <span>标题重复：{{ duplicateTopic.title }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="专题类型" prop="topicType">
              <div class="topic-type-list">
                <div
                  v-for="item in topicTypeOptions"
                  :key="item.value"
                  class="topic-type-card"
                  :class="{ active: createFormData.topicType === item.value }"
                  @click="handleTopicTypeSelect(item.value as number)"
                >
                  <div class="type-icon-wrapper" :style="{ backgroundColor: item.color + '20', color: item.color }">
                    <el-icon :size="28">
                      <component :is="topicTypeIconMap[item.value as number]" />
                    </el-icon>
                  </div>
                  <div class="type-label">{{ item.label }}</div>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">运营设置</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="运营时段">
              <el-date-picker
                v-model="operationTimeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
                :class="{ 'shake-error': !isTimeRangeValid }"
              />
              <div v-if="isTimeExpired" class="field-error error">
                <el-icon><Warning /></el-icon>
                <span>结束时间已过期，请重新选择</span>
              </div>
              <div v-if="!isTimeRangeValid && createFormData.operationStartTime && createFormData.operationEndTime" class="field-error">
                <el-icon><Warning /></el-icon>
                <span>开始时间必须早于结束时间</span>
              </div>
              <div v-if="timeOverlapChecking" class="field-checking">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>正在检测时段冲突...</span>
              </div>
              <div v-if="timeOverlapResult?.hasOverlap" class="field-error">
                <el-icon><Warning /></el-icon>
                <span>存在时段重叠冲突：</span>
                <div v-for="t in timeOverlapResult.overlappingTopics" :key="t.id" class="overlap-item">
                  {{ t.title }} ({{ formatDate(t.operationStartTime, 'MM-DD HH:mm') }} ~ {{ formatDate(t.operationEndTime, 'MM-DD HH:mm') }})
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="覆盖品类" prop="coverCategories">
              <el-checkbox-group v-model="createFormData.coverCategories">
                <el-checkbox
                  v-for="item in coverCategoryOptions"
                  :key="item.value"
                  :label="item.value"
                >
                  {{ item.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="封面模板">
              <el-input :value="createFormData.coverTemplate ? getEnumLabel(TOPIC_COVER_TEMPLATE, createFormData.coverTemplate) : '根据类型自动选择'" readonly />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序规则">
              <el-input :value="createFormData.sortRule !== null && createFormData.sortRule !== undefined ? getEnumLabel(TOPIC_SORT_RULE, createFormData.sortRule) : '根据类型自动选择'" readonly />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="权重分值">
              <el-input-number
                v-model="createFormData.weightScore"
                :min="0"
                :max="100"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="核心专题">
              <el-switch v-model="createFormData.isCore" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">视觉素材</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="封面图" prop="coverImage">
              <el-upload
                class="cover-uploader"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                :http-request="handleCoverUpload"
                :on-remove="handleCoverRemove"
                accept="image/*"
                drag
              >
                <div v-if="!createFormData.coverImage" class="upload-placeholder">
                  <el-icon class="upload-icon"><Upload /></el-icon>
                  <div class="upload-text">点击或拖拽封面图到此处上传</div>
                  <div class="upload-hint">支持 JPG、PNG、GIF 格式，最大 5MB</div>
                </div>
                <div v-else class="upload-preview">
                  <el-image :src="createFormData.coverImage" fit="cover" class="preview-image" />
                </div>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="专题描述">
              <el-input
                v-model="createFormData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入专题描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="createSubmitLoading"
          class="btn-rounded btn-shift"
          @click="handleCreateSubmit"
        >
          创建专题
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      :title="detailData?.title || '专题详情'"
      width="1100px"
      :close-on-click-modal="false"
      class="detail-topic-dialog"
      :class="{ 'slide-down-close': !detailDialogAnimating }"
      destroy-on-close
      @close="closeDetailDialog"
    >
      <el-tabs v-model="detailActiveTab" class="detail-tabs">
        <el-tab-pane label="内容管理" name="contents">
          <div class="content-manage-header">
            <div class="sort-mode-switch">
              <span class="mode-label">排序模式：</span>
              <el-radio-group v-model="detailSortMode" @change="handleDetailSortModeChange" :disabled="detailSortMode === 'SMART'">
                <el-radio-button value="MANUAL">手动排序</el-radio-button>
                <el-radio-button value="SMART" disabled>智能权重排序</el-radio-button>
              </el-radio-group>
              <el-tooltip v-if="detailSortMode === 'SMART'" content="根据排序规则自动排序，禁用手动调整" placement="top">
                <el-icon class="tip-icon"><Warning /></el-icon>
              </el-tooltip>
            </div>
            <div class="content-actions">
              <el-button
                v-if="canEditContents"
                type="primary"
                :icon="Plus"
                @click="openContentMountDialog"
                class="btn-rounded btn-shift"
              >
                挂载内容
              </el-button>
              <el-tooltip v-else content="专题已过期，禁止新建内容挂载" placement="top">
                <el-button type="primary" :icon="Plus" disabled class="btn-rounded btn-shift">
                  挂载内容
                </el-button>
              </el-tooltip>
              <el-button
                v-if="detailSortMode === 'MANUAL'"
                :icon="Sort"
                @click="handleContentSortChange"
                class="btn-rounded btn-shift"
              >
                保存排序
              </el-button>
            </div>
          </div>

          <div v-if="isTopicExpired && canEditContents === false" class="expired-warning">
            <el-icon><Warning /></el-icon>
            <span>专题已过期，禁止新建内容挂载</span>
          </div>

          <el-table
            :data="detailContents"
            v-loading="detailLoading"
            stripe
            border
            style="width: 100%; margin-top: 16px"
          >
            <el-table-column type="index" label="序号" width="60" align="center" />
            <el-table-column prop="contentCover" label="封面" width="80" align="center">
              <template #default="{ row }">
                <div class="content-cover-cell">
                  <el-image
                    v-if="row.contentCover"
                    :src="row.contentCover"
                    fit="cover"
                    class="content-cover-thumb"
                  >
                    <template #error>
                      <div class="content-cover-placeholder">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div v-else class="content-cover-placeholder">
                    <el-icon><Picture /></el-icon>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="contentTitle" label="内容标题" min-width="200" show-overflow-tooltip />
            <el-table-column prop="contentCategory" label="内容类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" effect="light">
                  {{ getEnumLabel(COVER_CATEGORY, row.contentCategory) || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="weightScore" label="权重" width="80" align="center">
              <template #default="{ row }">
                {{ formatNumber(row.weightScore) }}
              </template>
            </el-table-column>
            <el-table-column prop="sortOrder" label="排序值" width="80" align="center" />
            <el-table-column prop="mountTime" label="挂载时间" width="160" align="center">
              <template #default="{ row }">
                {{ formatDate(row.mountTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160" align="center" fixed="right">
              <template #default="{ row, $index }">
                <template v-if="detailSortMode === 'MANUAL'">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    :icon="ArrowUp"
                    :disabled="$index === 0"
                    @click="moveContentUp($index)"
                  >
                    上移
                  </el-button>
                  <el-button
                    type="primary"
                    link
                    size="small"
                    :icon="ArrowDown"
                    :disabled="$index === detailContents.length - 1"
                    @click="moveContentDown($index)"
                  >
                    下移
                  </el-button>
                </template>
                <el-button
                  type="danger"
                  link
                  size="small"
                  :disabled="!canEditContents"
                  @click="handleUnmountContent(row)"
                >
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="基础信息" name="info">
          <el-form
            ref="detailFormRef"
            :model="detailFormData"
            label-width="110px"
            class="detail-info-form"
          >
            <el-divider content-position="left">基本信息</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="专题标题">
                  <el-input v-model="detailFormData.title" maxlength="100" show-word-limit />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专题类型">
                  <el-select v-model="detailFormData.topicType" style="width: 100%">
                    <el-option
                      v-for="item in topicTypeOptions"
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
                <el-form-item label="运营状态">
                  <el-tag
                    :type="detailData ? getEnumItem(TOPIC_STATUS, detailData.status)?.type || 'info' : 'info'"
                    size="large"
                    effect="light"
                  >
                    {{ detailData ? getEnumLabel(TOPIC_STATUS, detailData.status) : '-' }}
                  </el-tag>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="核心专题">
                  <el-switch v-model="detailFormData.isCore" :active-value="1" :inactive-value="0" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">运营设置</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="开始时间">
                  <el-date-picker
                    v-model="detailFormData.operationStartTime"
                    type="datetime"
                    placeholder="开始时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结束时间">
                  <el-date-picker
                    v-model="detailFormData.operationEndTime"
                    type="datetime"
                    placeholder="结束时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="权重分值">
                  <el-input-number
                    v-model="detailFormData.weightScore"
                    :min="0"
                    :max="100"
                    style="width: 100%"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="排序规则">
                  <el-select v-model="detailFormData.sortRule" style="width: 100%">
                    <el-option
                      v-for="item in sortRuleOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="覆盖品类">
                  <el-checkbox-group v-model="detailFormData.coverCategories">
                    <el-checkbox
                      v-for="item in coverCategoryOptions"
                      :key="item.value"
                      :label="item.value"
                    >
                      {{ item.label }}
                    </el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">视觉素材</el-divider>
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="专题描述">
                  <el-input
                    v-model="detailFormData.description"
                    type="textarea"
                    :rows="3"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="closeDetailDialog">关闭</el-button>
        <el-button
          v-if="detailActiveTab === 'info'"
          type="primary"
          :loading="detailSubmitLoading"
          class="btn-rounded btn-shift"
          @click="handleDetailSubmit"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="contentMountDialogVisible"
      title="挂载内容"
      width="560px"
      :close-on-click-modal="false"
      class="content-mount-dialog"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="内容ID列表">
          <el-input
            v-model="mountContentIds"
            type="textarea"
            :rows="4"
            placeholder="请输入内容ID，多个ID用逗号或空格分隔"
          />
          <div class="input-hint">示例：1001, 1002, 1003</div>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Search" @click="checkMountContents" :loading="mountChecking" class="btn-rounded btn-shift">
            检测重复挂载
          </el-button>
        </el-form-item>
        <el-form-item v-if="mountCheckResult">
          <div class="mount-check-result">
            <div v-if="mountCheckResult.mounted.length > 0" class="check-warning">
              <el-icon><Warning /></el-icon>
              <span>以下内容已在专题中挂载：{{ mountCheckResult.mounted.map(m => m.contentId).join(', ') }}</span>
            </div>
            <div v-if="mountCheckResult.notMounted.length > 0" class="check-success">
              <el-icon><Check /></el-icon>
              <span>以下内容可正常挂载：{{ mountCheckResult.notMounted.join(', ') }}</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="contentMountDialogVisible = false">取消</el-button>
        <el-button type="primary" class="btn-rounded btn-shift" @click="handleMountContents">
          确认挂载
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
              :type="getEnumItem(TOPIC_STATUS, currentStatusRow.status)?.type || 'info'"
              size="large"
              effect="light"
            >
              {{ getEnumLabel(TOPIC_STATUS, currentStatusRow.status) }}
            </el-tag>
          </div>
          <div class="status-arrow">
            <el-icon><Sort /></el-icon>
          </div>
          <div class="status-item target">
            <span class="status-label">目标状态</span>
            <el-tag
              v-if="targetStatus !== null"
              :type="getEnumItem(TOPIC_STATUS, targetStatus)?.type || 'info'"
              size="large"
              effect="dark"
            >
              {{ getEnumLabel(TOPIC_STATUS, targetStatus) }}
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
              class="btn-rounded btn-shift"
              @click="targetStatus = status.value"
            >
              {{ status.label }}
            </el-button>
            <span v-if="getAvailableStatuses(currentStatusRow.status).length === 0" class="no-options">
              无可转换状态
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeStatusDialog">取消</el-button>
        <el-button
          type="primary"
          :disabled="targetStatus === null"
          :loading="loading"
          class="btn-rounded btn-shift"
          @click="handleStatusSubmit"
        >
          确认变更
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchDisableDialogVisible"
      title="批量停用"
      width="520px"
      :close-on-click-modal="false"
      class="batch-dialog"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="停用原因">
          <el-input
            v-model="batchDisableReason"
            type="textarea"
            :rows="4"
            placeholder="请输入停用原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDisableDialogVisible = false">取消</el-button>
        <el-button type="primary" class="btn-rounded btn-shift" @click="handleBatchDisable">
          确认停用
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchSupplementDialogVisible"
      title="批量补充内容"
      width="560px"
      :close-on-click-modal="false"
      class="batch-dialog"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="内容ID列表">
          <el-input
            v-model="batchSupplementContentIds"
            type="textarea"
            :rows="4"
            placeholder="请输入要补充的内容ID，多个ID用逗号或空格分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSupplementDialogVisible = false">取消</el-button>
        <el-button type="primary" class="btn-rounded btn-shift" @click="handleBatchSupplement">
          确认补充
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchWeightDialogVisible"
      title="批量修改权重"
      width="480px"
      :close-on-click-modal="false"
      class="batch-dialog"
      destroy-on-close
    >
      <el-form label-width="100px">
        <el-form-item label="权重分值">
          <el-input-number
            v-model="batchWeightScore"
            :min="0"
            :max="100"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchWeightDialogVisible = false">取消</el-button>
        <el-button type="primary" class="btn-rounded btn-shift" @click="handleBatchWeight">
          确认修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchProgressVisible"
      title="批量操作进度"
      width="480px"
      :close-on-click-modal="false"
      class="batch-progress-dialog"
      destroy-on-close
    >
      <div class="progress-content">
        <div class="progress-title">
          <el-icon class="progress-icon"><Setting /></el-icon>
          <span>正在批量{{ batchOperationName }}...</span>
        </div>
        <el-progress
          :percentage="batchProgress"
          :stroke-width="12"
          :show-text="false"
          class="progress-bar"
        />
        <div class="progress-info">
          <span>已处理：{{ batchProcessed }} / {{ batchTotal }}</span>
          <span class="progress-percent">{{ batchProgress }}%</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.topic-page {
  padding: 16px;

  .filter-bar {
    margin-bottom: 16px;

    .filter-form {
      .filter-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        margin-bottom: 0;
      }

      .date-separator {
        margin: 0 8px;
        color: #909399;
      }

      .filter-actions {
        margin-left: auto;
      }
    }
  }

  .card-content {
    margin-bottom: 16px;
  }

  .cover-cell {
    width: 72px;
    height: 48px;

    .cover-thumb {
      width: 72px;
      height: 48px;
      border-radius: 4px;
    }

    .cover-placeholder {
      width: 72px;
      height: 48px;
      background: #f5f7fa;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;

      .el-icon {
        font-size: 20px;
      }
    }
  }

  .title-cell {
    .title-text {
      display: block;
      font-size: 14px;
      color: #303133;
      line-height: 1.4;
    }

    .title-meta {
      margin-top: 4px;
    }

    .batch-tag {
      display: inline-block;
    }
  }

  .time-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    color: #606266;
    line-height: 1.6;

    .time-separator {
      color: #c0c4cc;
      margin: 2px 0;
    }
  }

  .categories-cell {
    .category-tags {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 4px;

      .category-tag {
        margin: 0;
      }
    }
  }

  .number-text,
  .hot-score,
  .weight-score {
    font-family: 'DIN', 'Arial', sans-serif;
    font-weight: 500;
    color: #303133;
  }

  .core-star {
    color: #f56c6c;
    font-size: 18px;
    font-weight: bold;
  }

  .non-core-dot {
    color: #c0c4cc;
    font-size: 12px;
  }

  .resource-link {
    font-size: 13px;
  }

  .no-link {
    color: #c0c4cc;
  }

  .creator-text,
  .date-text {
    font-size: 13px;
    color: #606266;
  }
}

.create-topic-dialog {
  .topic-type-list {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
  }

  .topic-type-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px 12px;
    border: 2px solid #e4e7ed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.25s ease;
    background: #fff;

    &:hover {
      transform: scale(1.03);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.2);
      border-color: #b3d8ff;
    }

    &.active {
      border-color: #409eff;
      border-width: 2px;
      background: #ecf5ff;
      box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
    }

    .type-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      transition: all 0.25s ease;
    }

    .type-label {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }

  .duplicate-warning,
  .field-error {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 6px;
    font-size: 12px;
    color: #f56c6c;

    .el-icon {
      margin-top: 2px;
      flex-shrink: 0;
    }

    &.error {
      color: #f56c6c;
    }

    .overlap-item {
      margin-left: 18px;
      color: #e6a23c;
    }
  }

  .field-checking {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 12px;
    color: #909399;

    .el-icon {
      flex-shrink: 0;
    }
  }

  .shake-error {
    animation: shake 0.3s ease-in-out;
  }

  .cover-uploader {
    width: 320px;

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      color: #909399;

      .upload-icon {
        font-size: 48px;
        color: #c0c4cc;
        margin-bottom: 12px;
      }

      .upload-text {
        font-size: 14px;
        color: #606266;
        margin-bottom: 6px;
      }

      .upload-hint {
        font-size: 12px;
        color: #909399;
      }
    }

    .upload-preview {
      width: 100%;

      .preview-image {
        width: 100%;
        height: 180px;
        border-radius: 4px;
      }
    }
  }
}

.detail-topic-dialog {
  .detail-tabs {
    margin-top: 8px;
  }

  &.slide-down-close {
    animation: slideDownFade 0.3s ease forwards;
  }

  .content-manage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .sort-mode-switch {
      display: flex;
      align-items: center;
      gap: 12px;

      .mode-label {
        font-size: 14px;
        color: #606266;
      }

      .tip-icon {
        color: #e6a23c;
        font-size: 18px;
      }
    }
  }

  .expired-warning {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: #fef0f0;
    border-radius: 6px;
    color: #f56c6c;
    font-size: 13px;
    margin-bottom: 12px;

    .el-icon {
      font-size: 18px;
    }
  }

  .content-cover-cell {
    width: 56px;
    height: 40px;

    .content-cover-thumb {
      width: 56px;
      height: 40px;
      border-radius: 4px;
    }

    .content-cover-placeholder {
      width: 56px;
      height: 40px;
      background: #f5f7fa;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #c0c4cc;

      .el-icon {
        font-size: 16px;
      }
    }
  }

  .input-hint {
    font-size: 12px;
    color: #909399;
    margin-top: 6px;
  }

  .mount-check-result {
    .check-warning {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      color: #e6a23c;
      font-size: 13px;
      margin-bottom: 8px;

      .el-icon {
        margin-top: 2px;
        flex-shrink: 0;
      }
    }

    .check-success {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      color: #67c23a;
      font-size: 13px;

      .el-icon {
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
  }
}

.status-dialog {
  .status-change-content {
    padding: 8px 0;
  }

  .status-flow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    margin-bottom: 24px;
    padding: 24px;
    background: #f5f7fa;
    border-radius: 8px;

    .status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      .status-label {
        font-size: 12px;
        color: #909399;
      }

      .status-placeholder {
        padding: 6px 16px;
        color: #c0c4cc;
        font-size: 13px;
      }
    }

    .status-arrow {
      color: #409eff;
      font-size: 24px;
    }
  }

  .status-options {
    .options-label {
      font-size: 13px;
      color: #606266;
      margin-right: 12px;
    }

    .option-buttons {
      display: inline-flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .no-options {
      color: #c0c4cc;
      font-size: 13px;
    }
  }

  &.zoom-in {
    animation: zoomIn 0.2s ease;
  }
}

.batch-progress-dialog {
  .progress-content {
    padding: 16px 0;

    .progress-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      color: #303133;
      margin-bottom: 20px;

      .progress-icon {
        color: #409eff;
        font-size: 20px;
      }
    }

    .progress-bar {
      margin-bottom: 12px;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #606266;

      .progress-percent {
        font-weight: 500;
        color: #409eff;
      }
    }
  }
}

.btn-rounded {
  border-radius: 8px;
}

.ripple-btn,
.btn-shift {
  position: relative;
  overflow: hidden;

  &:active {
    transform: scale(0.97);
  }
}

.check-icon {
  color: #67c23a;
}

.error-icon {
  color: #f56c6c;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

@keyframes slideDownFade {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(20px);
    opacity: 0;
  }
}

@keyframes zoomIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>

