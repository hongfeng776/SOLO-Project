<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import {
  AI_PRE_SCREEN_RESULT,
  ARTICLE_AUDIT_STATUS,
  AI_RISK_TYPE,
  ARTICLE_RISK_TAG,
  ARTICLE_AUDIT_EXCEPTION,
  BATCH_ARTICLE_ACTION,
  DOMAIN_CATEGORY,
  REJECT_REASON_CATEGORY,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getArticleAuditPoolApi,
  getArticleAuditDetailApi,
  getArticleAiPreScreenApi,
  checkArticleAuditDuplicateApi,
  checkArticleConsistencyApi,
  handleArticleAiRiskApi,
  submitArticleAuditApi,
  reviewSuspectedArticleApi,
  batchArticleAuditActionApi,
  exportArticleAuditLedgerApi,
  getArticleAuditTraceApi,
} from '@/api/article-audit'
import type {
  ArticleAuditPoolItem,
  ArticleAuditDetail,
  AiPreScreenResult,
  ArticleAuditDuplicateCheckResult,
  ArticleAuditTraceRecord,
  ArticleAuditLedgerExportResult,
  ArticleAuditSubmitData,
  AiRiskItem,
} from '@/types'
import { formatDate, formatNumber, debounce, throttle, downloadFile, copyToClipboard } from '@/utils'
import { useUserStore } from '@/stores'
import {
  Search,
  RefreshLeft,
  Refresh,
  CircleCheck,
  CircleClose,
  Clock,
  AlarmClock,
  RefreshRight,
  Download,
  View,
  DataBoard,
  Checked,
  Tickets,
  Document,
  WarningFilled,
  Warning,
  History,
  ArrowRight,
  Plus,
  Picture,
  User,
  CopyDocument,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const isAuditor = computed(() => userStore.roleCode === 'CONTENT_AUDITOR' || userStore.hasRole(['CONTENT_AUDITOR']))
const isLeader = computed(() =>
  ['ADMIN', 'SUPER_ADMIN', 'AUDIT_LEADER'].includes(userStore.roleCode) ||
  userStore.hasRole(['ADMIN', 'SUPER_ADMIN', 'AUDIT_LEADER'])
)

const listLoading = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const aiRiskStates = reactive<Record<string, boolean>>({})
const glowStates = reactive<Record<string, boolean>>({})
const rippleStates = reactive<Record<string, boolean>>({})

const listData = ref<ArticleAuditPoolItem[]>([])
const total = ref(0)
const currentDetail = ref<ArticleAuditDetail | null>(null)
const currentAiScreen = ref<AiPreScreenResult | null>(null)
const duplicateCheck = ref<ArticleAuditDuplicateCheckResult | null>(null)
const currentTrace = ref<ArticleAuditTraceRecord | null>(null)
const exportResult = ref<ArticleAuditLedgerExportResult | null>(null)
const selectedRows = ref<ArticleAuditPoolItem[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  domainCategory: null as string | null,
  aiScreenResult: null as string | null,
  auditStatus: null as number | null,
  isOverdue: null as boolean | null,
  sortBy: 'submittedAt',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
})

const currentArticleId = ref<number | null>(null)
const detailVisible = ref(false)
const auditDialogVisible = ref(false)
const traceVisible = ref(false)
const exportVisible = ref(false)

const auditFormRef = ref<FormInstance>()
const auditFormData = reactive({
  auditStatus: 2,
  rejectReasonCategory: '',
  rejectReasonDetail: '',
  auditRemark: '',
  reviewLevel: 1,
  suspectedReviewRequested: false,
})

const shakeFields = reactive<Record<string, boolean>>({})
const triggerShake = (field: string) => {
  shakeFields[field] = true
  setTimeout(() => { shakeFields[field] = false }, 600)
}

const domainOptions = computed(() => getEnumOptions(DOMAIN_CATEGORY))
const auditStatusOptions = computed(() => getEnumOptions(ARTICLE_AUDIT_STATUS))
const aiScreenOptions = computed(() => getEnumOptions(AI_PRE_SCREEN_RESULT))
const rejectCategoryOptions = computed(() =>
  Object.entries(REJECT_REASON_CATEGORY).map(([, v]) => ({ value: (v as any).value, label: (v as any).label, examples: (v as any).examples }))
)
const rejectExamples = computed(() => {
  const cat = auditFormData.rejectReasonCategory
  if (!cat) return []
  const key = Object.keys(REJECT_REASON_CATEGORY).find(k => (REJECT_REASON_CATEGORY as any)[k].value === cat)
  return (REJECT_REASON_CATEGORY as any)[key || '']?.examples || []
})

const pendingCount = computed(() => listData.value.filter(r => r.auditStatus === 0).length)
const reviewingCount = computed(() => listData.value.filter(r => r.auditStatus === 1).length)
const approvedCount = computed(() => listData.value.filter(r => r.auditStatus === 2).length)
const rejectedCount = computed(() => listData.value.filter(r => r.auditStatus === 3).length)
const suspectedCount = computed(() => listData.value.filter(r => r.auditStatus === 6).length)
const overdueCount = computed(() => listData.value.filter(r => r.isOverdue).length)
const aiFailedCount = computed(() => listData.value.filter(r => r.aiScreenResult === 'failed').length)
const aiUnresolvedTotal = computed(() => listData.value.reduce((sum, r) => sum + (r.aiUnresolvedRiskCount || 0), 0))

const canSubmitCurrent = computed(() => {
  if (!currentAiScreen.value) return false
  return currentAiScreen.value.handledRiskCount === currentAiScreen.value.totalRiskCount
})

const unhandledRiskLabels = computed(() => {
  if (!currentAiScreen.value?.riskItems) return []
  return currentAiScreen.value.riskItems
    .filter(r => !r.handled)
    .map(r => {
      const item = Object.values(AI_RISK_TYPE).find(e => e.value === r.type)
      return item?.label || r.label
    })
})

const hasHighRisk = computed(() => {
  if (!currentAiScreen.value?.riskItems) return false
  return currentAiScreen.value.riskItems.some(r => r.severity === 'high')
})

const pendingCountFilter = computed(() => queryParams.auditStatus === 0)
const suspectedFilter = computed(() => queryParams.auditStatus === 6)

function triggerGlow(key: string) {
  glowStates[key] = true
  setTimeout(() => { glowStates[key] = false }, 1200)
}

function createRipple(event: MouseEvent, btnKey: string) {
  const target = event.currentTarget as HTMLElement
  if (!target) return
  const rect = target.getBoundingClientRect()
  const ripple = document.createElement('span')
  const size = Math.max(rect.width, rect.height)
  const x = event.clientX - rect.left - size / 2
  const y = event.clientY - rect.top - size / 2
  ripple.className = 'ripple'
  ripple.style.width = ripple.style.height = size + 'px'
  ripple.style.left = x + 'px'
  ripple.style.top = y + 'px'
  target.appendChild(ripple)
  rippleStates[btnKey] = true
  setTimeout(() => {
    ripple.remove()
    rippleStates[btnKey] = false
  }, 650)
}

function getContentHash(bodyText: string): string {
  let hash = 0
  const str = bodyText.trim()
  if (str.length === 0) return 'hash_0'
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'hash_' + Math.abs(hash).toString(36)
}

const loadTaskPool = async () => {
  listLoading.value = true
  try {
    const params = { ...queryParams } as any
    if (isAuditor.value) params.assignedTo = userStore.userId
    const result = await getArticleAuditPoolApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally { listLoading.value = false }
}

const loadDetail = async (articleId: number) => {
  detailLoading.value = true
  currentDetail.value = null
  currentAiScreen.value = null
  duplicateCheck.value = null
  try {
    const [detail, aiScreen, dup] = await Promise.all([
      getArticleAuditDetailApi(articleId),
      getArticleAiPreScreenApi(articleId),
      checkArticleAuditDuplicateApi(articleId),
    ])
    currentDetail.value = detail
    currentAiScreen.value = aiScreen
    duplicateCheck.value = dup
    aiScreen.riskItems.forEach(r => {
      aiRiskStates[r.type] = r.handled
    })
  } finally { detailLoading.value = false }
}

const handleRisk = async (riskType: string, handled: boolean) => {
  if (!currentArticleId.value) return
  const riskKey = `risk-${riskType}-${currentArticleId.value}`
  try {
    const res = await handleArticleAiRiskApi(currentArticleId.value, riskType, handled)
    aiRiskStates[riskType] = handled
    if (currentAiScreen.value) {
      currentAiScreen.value.handledRiskCount = res.handledCount
      currentAiScreen.value.totalRiskCount = res.totalCount
      const item = currentAiScreen.value.riskItems.find(r => r.type === riskType)
      if (item) item.handled = handled
    }
    triggerGlow(riskKey)
    ElMessage.success(handled ? `已标记处理: ${getEnumItem(AI_RISK_TYPE as any, riskType)?.label || riskType}` : '已取消处理标记')
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const doSubmitArticleAudit = async () => {
  if (!currentArticleId.value || !currentDetail.value) return
  const btnKey = `submit-${currentArticleId.value}`
  if (submitting.value) return

  if (!canSubmitCurrent.value) {
    ElMessage.warning(`还有 ${unhandledRiskLabels.value.length} 项AI风险未处理，请先确认`)
    triggerShake('auditSubmit')
    return
  }

  submitting.value = true
  try {
    const bodyText = currentDetail.value.summary || ''
    const contentHash = getContentHash(bodyText)
    const consistency = await checkArticleConsistencyApi(currentArticleId.value, contentHash)
    if (!consistency.contentUnchanged) {
      const confirmChange = await ElMessageBox.confirm(
        '检测到内容已被修改，是否继续提交审核？' + (consistency.blockReasons?.length ? '\n原因：' + consistency.blockReasons.join('、') : ''),
        '内容变更提醒',
        { type: 'warning', confirmButtonText: '继续提交', cancelButtonText: '取消' }
      ).catch(() => null)
      if (!confirmChange) return
    }

    if (auditFormData.auditStatus === 2 && hasHighRisk.value) {
      const confirmHigh = await ElMessageBox.confirm(
        '当前内容含高风险项，确认要审核通过吗？建议选择"疑似违规"进行复核。',
        '高风险警告',
        { type: 'error', confirmButtonText: '仍通过', cancelButtonText: '转为疑似' }
      ).catch(() => {
        auditFormData.auditStatus = 6
        auditFormData.suspectedReviewRequested = true
      })
      if (confirmHigh !== 'confirm' && confirmHigh !== undefined) {
        auditFormData.auditStatus = 6
        auditFormData.suspectedReviewRequested = true
      }
    }

    const submitData: ArticleAuditSubmitData = {
      articleId: currentArticleId.value,
      articleCode: currentDetail.value.articleCode,
      auditStatus: auditFormData.auditStatus,
      reviewLevel: auditFormData.reviewLevel,
      rejectReasonCategory: auditFormData.rejectReasonCategory || undefined,
      rejectReasonDetail: auditFormData.rejectReasonDetail || undefined,
      auditRemark: auditFormData.auditRemark || undefined,
      handledRiskItems: currentAiScreen.value?.riskItems.filter(r => r.handled).map(r => r.type) || [],
      contentConsistentHash: contentHash,
      suspectedReviewRequested: auditFormData.suspectedReviewRequested,
    }

    if (auditFormData.auditStatus === 6 && isLeader.value) {
      await reviewSuspectedArticleApi(currentArticleId.value, {
        reviewLevel: auditFormData.reviewLevel,
        auditRemark: auditFormData.auditRemark,
      })
      ElMessage.success('疑似违规复核完成')
    } else {
      const res = await submitArticleAuditApi(submitData)
      ElMessage.success(`审核成功，单号: ${res.auditNo}`)
    }
    auditDialogVisible.value = false
    await loadTaskPool()
    if (detailVisible.value) await loadDetail(currentArticleId.value)
  } catch (e: any) {
    triggerShake('auditSubmit')
    ElMessage.error(e?.message || '审核提交失败')
  } finally { submitting.value = false }
}

const handleBatchAction = async (action: string, extraData: any = {}) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择需要操作的记录')
    return
  }
  const auditorActions = ['approve_low_risk', 'mark_overdue']
  const leaderActions = ['review_suspected', 'export_ledger']
  if (auditorActions.includes(action) && !isAuditor.value && !isLeader.value) {
    ElMessage.error('无权限执行此操作')
    return
  }
  if (leaderActions.includes(action) && !isLeader.value) {
    ElMessage.error('仅组长/管理员可执行此操作')
    return
  }
  if (action === 'export_ledger') {
    exportVisible.value = true
    return
  }
  batchSubmitting.value = true
  try {
    const res = await batchArticleAuditActionApi({
      action: action as any,
      articleIds: selectedRows.value.map(r => r.articleId),
      ...extraData,
    })
    const labelMap: Record<string, string> = {
      approve_low_risk: '批量通过低风险',
      mark_overdue: '批量标记超时',
      review_suspected: '批量复核疑似违规',
    }
    ElMessage.success(`${labelMap[action] || '批量操作'}：成功${res.successCount}条，跳过${res.skippedCount}条`)
    loadTaskPool()
  } finally { batchSubmitting.value = false }
}

const exportLedger = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择需要导出的记录')
    return
  }
  batchSubmitting.value = true
  try {
    const res = await exportArticleAuditLedgerApi({
      action: 'export_ledger',
      articleIds: selectedRows.value.map(r => r.articleId),
    })
    exportResult.value = res
    if (res.url) {
      downloadFile(res.url, res.fileName)
      ElMessage.success(`导出台账成功，共${res.totalCount}条`)
    } else {
      const copyOk = await copyToClipboard(JSON.stringify(res.ledgerItems.slice(0, 5), null, 2))
      ElMessage[copyOk ? 'success' : 'info'](copyOk ? '台账数据已复制到剪贴板' : '导出完成，请在预览中查看')
    }
    exportVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message || '导出失败')
  } finally { batchSubmitting.value = false }
}

const handleSearch = () => { queryParams.page = 1; loadTaskPool() }
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.domainCategory = null
  queryParams.aiScreenResult = null
  queryParams.auditStatus = null
  queryParams.isOverdue = null
  handleSearch()
}
const handlePageChange = (p: number) => { queryParams.page = p; loadTaskPool() }
const handleSizeChange = (s: number) => { queryParams.pageSize = s; queryParams.page = 1; loadTaskPool() }
const handleSelectionChange = (rows: ArticleAuditPoolItem[]) => { selectedRows.value = rows }
const handleStatClick = (status: number | null) => {
  if (status === queryParams.auditStatus) queryParams.auditStatus = null
  else queryParams.auditStatus = status
  if (status === -1) queryParams.isOverdue = queryParams.isOverdue ? null : true
  else if (status === -2) queryParams.aiScreenResult = queryParams.aiScreenResult === 'failed' ? null : 'failed'
  handleSearch()
}
const openDetail = async (row: ArticleAuditPoolItem) => {
  currentArticleId.value = row.articleId
  detailVisible.value = true
  await loadDetail(row.articleId)
}
const openAuditDialog = (row?: ArticleAuditPoolItem, defaultStatus = 2) => {
  if (row) {
    currentArticleId.value = row.articleId
    auditFormData.auditStatus = defaultStatus
    auditFormData.rejectReasonCategory = ''
    auditFormData.rejectReasonDetail = ''
    auditFormData.auditRemark = ''
    auditFormData.reviewLevel = 1
    auditFormData.suspectedReviewRequested = false
  }
  auditDialogVisible.value = true
  nextTick(() => auditFormRef.value?.clearValidate())
}
const openTrace = async (row: ArticleAuditPoolItem) => {
  currentArticleId.value = row.articleId
  traceVisible.value = true
  currentTrace.value = null
  try {
    currentTrace.value = await getArticleAuditTraceApi(row.articleCode)
  } catch (e: any) {
    ElMessage.error(e?.message || '溯源数据加载失败')
  }
}
const handleQuickApprove = async (row: ArticleAuditPoolItem, ev: MouseEvent) => {
  const btnKey = `approve-${row.articleId}`
  createRipple(ev, btnKey)
  await new Promise(r => setTimeout(r, 300))
  currentArticleId.value = row.articleId
  await loadDetail(row.articleId)
  auditFormData.auditStatus = 2
  auditFormData.auditRemark = '快速通过'
  if (canSubmitCurrent.value) {
    await doSubmitArticleAudit()
  } else {
    openAuditDialog(row, 2)
    ElMessage.warning('存在未处理AI风险，请在弹窗中确认')
  }
}

const auditFormRules: FormRules = {
  rejectReasonCategory: [{
    validator: (_r: any, v: string, cb: any) => {
      if (auditFormData.auditStatus === 3 && !v) cb(new Error('请选择驳回分类'))
      else cb()
    }, trigger: 'change',
  }],
  rejectReasonDetail: [
    { validator: (_r: any, v: string, cb: any) => {
      if (auditFormData.auditStatus === 3 && (!v || v.trim().length < 5)) cb(new Error('驳回详情至少5个字符'))
      else cb()
    }, trigger: 'blur' },
    { max: 500, message: '不超过500字', trigger: 'blur' },
  ],
  auditRemark: [{ max: 500, message: '不超过500字', trigger: 'blur' }],
}

const debouncedSearch = debounce(handleSearch, 400)
const throttledBatchRefresh = throttle(() => {
  const ids = selectedRows.value.map(r => r.articleId)
  if (ids.length === 0) return
  ElMessage.info('批量刷新节流中，已触发局部刷新')
  loadTaskPool()
}, 5000)

const getAiScreenItem = (v: string) => getEnumItem(AI_PRE_SCREEN_RESULT, v)
const getRiskTagItem = (v: string) => getEnumItem(ARTICLE_RISK_TAG as any, v)
const getAiRiskItem = (type: string) => Object.values(AI_RISK_TYPE).find(e => e.value === type)

onMounted(() => { loadTaskPool() })
</script>

<template>
  <div class="article-audit-page">
    <div class="stat-bar">
      <div v-for="item in [
        { label: '待审核', count: pendingCount, status: 0, color: '#E6A23C', icon: Clock },
        { label: '审核中', count: reviewingCount, status: 1, color: '#409EFF', icon: Refresh },
        { label: '已通过', count: approvedCount, status: 2, color: '#67C23A', icon: CircleCheck },
        { label: '已驳回', count: rejectedCount, status: 3, color: '#F56C6C', icon: CircleClose },
        { label: '疑似违规', count: suspectedCount, status: 6, color: '#722ed1', icon: WarningFilled },
        { label: 'AI异常', count: aiFailedCount, status: -2, color: '#C0392B', icon: Warning },
      ]" :key="item.label" class="stat-card card-content"
        :class="{ active: (item.status === -2 ? queryParams.aiScreenResult === 'failed' : queryParams.auditStatus === item.status) }"
        :style="{ borderLeftColor: item.color }"
        @click="handleStatClick(item.status)">
        <div class="stat-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-count" :style="{ color: item.color }">{{ formatNumber(item.count) }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="标题/编码/作者" clearable style="width: 220px"
            @keyup.enter="handleSearch" @input="debouncedSearch" />
        </el-form-item>
        <el-form-item label="领域">
          <el-select v-model="queryParams.domainCategory" placeholder="全部领域" clearable style="width: 130px" @change="handleSearch">
            <el-option v-for="opt in domainOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="AI初筛">
          <el-select v-model="queryParams.aiScreenResult" placeholder="全部" clearable style="width: 140px" @change="handleSearch">
            <el-option v-for="opt in aiScreenOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.auditStatus" placeholder="全部" clearable style="width: 130px" @change="handleSearch">
            <el-option v-for="opt in auditStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否超时">
          <el-select v-model="queryParams.isOverdue" placeholder="全部" clearable style="width: 110px" @change="handleSearch">
            <el-option label="已超时" :value="true" />
            <el-option label="未超时" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch" :loading="listLoading">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          <el-button :icon="Refresh" @click="loadTaskPool" :loading="listLoading">刷新</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="batch-toolbar card-content">
      <div class="toolbar-left">
        <span class="selected-info">已选择 <b>{{ selectedRows.length }}</b> 项</span>
        <el-divider direction="vertical" />
        <span class="unresolved-info" v-if="aiUnresolvedTotal > 0">
          <el-icon color="#E6A23C"><Warning /></el-icon>
          AI未处理风险共 <b class="text-warning">{{ aiUnresolvedTotal }}</b> 项
        </span>
        <el-tooltip content="局部刷新（5s节流）" placement="top">
          <el-button :icon="Refresh" size="small" :disabled="selectedRows.length === 0" @click="throttledBatchRefresh">局部刷新</el-button>
        </el-tooltip>
      </div>
      <div class="toolbar-right">
        <el-button type="success" :icon="CircleCheck" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="() => handleBatchAction('approve_low_risk')">批量通过低风险</el-button>
        <el-button type="warning" :icon="AlarmClock" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="() => handleBatchAction('mark_overdue')">批量标记超时</el-button>
        <el-button type="primary" :icon="RefreshRight" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting || !isLeader"
          @click="() => handleBatchAction('review_suspected')">批量复核疑似违规</el-button>
        <el-button :icon="Download" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting || !isLeader"
          @click="exportLedger">导出审核台账</el-button>
      </div>
    </div>

    <div class="table-wrapper card-content">
      <el-table
        v-loading="listLoading"
        :data="listData"
        stripe
        border
        highlight-current-row
        style="width: 100%"
        :row-class-name="({ row }) => (row.auditStatus === queryParams.auditStatus ? 'row--current' : '')"
        @selection-change="handleSelectionChange"
        :header-cell-class-name="'sticky-header-th'"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="编码" prop="articleCode" width="140" align="center" fixed="left">
          <template #default="{ row }">
            <el-tooltip :content="row.articleCode" placement="top" :show-after="400">
              <span class="article-code mono-text">{{ row.articleCode }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="标题" min-width="260">
          <template #default="{ row }">
            <el-tooltip :content="row.title" placement="top" :show-after="500">
              <div class="title-cell">
                <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" class="title-thumb" lazy
                  :preview-src-list="[row.coverImage]">
                  <template #error>
                    <div class="thumb-placeholder"><el-icon :size="18"><Picture /></el-icon></div>
                  </template>
                </el-image>
                <span class="title-text text-ellipsis">{{ row.title }}</span>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="领域" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="(getEnumItem(DOMAIN_CATEGORY as any, row.domainCategory)?.type as any) || 'info'" effect="plain">
              {{ row.domainCategoryLabel || getEnumLabel(DOMAIN_CATEGORY as any, row.domainCategory) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="字数" width="100" align="center">
          <template #default="{ row }">{{ formatNumber(row.wordCount) }} 字</template>
        </el-table-column>
        <el-table-column label="作者" width="120" align="center">
          <template #default="{ row }">
            <el-tooltip :content="`账号: ${row.publishAccount}`" placement="top" :show-after="400">
              <span class="author-name">
                <el-avatar :size="22" style="vertical-align: -6px; margin-right: 4px">{{ (row.authorName || '?').slice(0, 1) }}</el-avatar>
                {{ row.authorName }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="AI初筛" width="130" align="center">
          <template #default="{ row }">
            <div :class="['ai-screen-cell', {
              'risk-glow-error': row.aiScreenResult === 'failed',
              'risk-glow-warning': row.aiScreenResult === 'warning',
            }]">
              <el-tag v-if="getAiScreenItem(row.aiScreenResult)" size="small" effect="dark"
                :type="getAiScreenItem(row.aiScreenResult)?.type as any">
                <el-icon style="vertical-align: -2px"><Warning /></el-icon>
                {{ row.aiScreenResultLabel || getAiScreenItem(row.aiScreenResult)?.label }}
              </el-tag>
              <span v-else class="text-placeholder">-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="风险标签" min-width="180">
          <template #default="{ row }">
            <div class="risk-tags-wrapper">
              <el-tag
                v-for="(tag, i) in (row.riskTags || []).slice(0, 4)"
                :key="i"
                size="small"
                class="risk-item"
                :class="{ 'risk-shake': (row.aiUnresolvedRiskCount || 0) > 0 }"
                :style="{
                  backgroundColor: getRiskTagItem(tag)?.color + '15',
                  color: getRiskTagItem(tag)?.color,
                  borderColor: getRiskTagItem(tag)?.color + '40',
                }"
              >
                {{ getRiskTagItem(tag)?.label || tag }}
              </el-tag>
              <el-tag v-if="(row.riskTags?.length || 0) > 4" size="small" type="info" effect="plain">
                +{{ row.riskTags!.length - 4 }}
              </el-tag>
              <span v-if="!row.riskTags?.length" class="text-placeholder">无</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getEnumItem(ARTICLE_AUDIT_STATUS, row.auditStatus)?.type || 'info'" size="small" effect="dark"
              :style="row.auditStatus === 6 ? { background: '#722ed1', borderColor: '#722ed1' } : {}">
              {{ row.auditStatusLabel || getEnumLabel(ARTICLE_AUDIT_STATUS, row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核员" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.assignedAuditorName" class="reviewer-name">{{ row.assignedAuditorName }}</span>
            <span v-else class="text-placeholder">待分配</span>
          </template>
        </el-table-column>
        <el-table-column label="截止" width="160" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.deadline ? formatDate(row.deadline) : '无截止时间'" placement="top" :show-after="400">
              <span :class="['deadline-text', { 'overdue blink-red': row.isOverdue }]">
                {{ row.deadline ? formatDate(row.deadline, 'MM-DD HH:mm') : '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160" align="center">
          <template #default="{ row }">
            <el-tooltip :content="formatDate(row.submittedAt)" placement="top" :show-after="400">
              {{ formatDate(row.submittedAt, 'MM-DD HH:mm') }}
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="primary" link size="small" :icon="View"
                @click="() => { currentArticleId = row.articleId; detailVisible = true; loadDetail(row.articleId); }">预览</el-button>
              <el-button type="info" link size="small" :icon="DataBoard" @click="openDetail(row)">详情</el-button>
              <el-button type="success" link size="small" :icon="CircleCheck"
                class="btn-ripple"
                :disabled="row.auditStatus === 2 || row.auditStatus === 3"
                @click="(e) => handleQuickApprove(row, e)">通过</el-button>
              <el-button type="primary" link size="small" :icon="Checked"
                :disabled="row.auditStatus === 2 || row.auditStatus === 3"
                @click="() => openAuditDialog(row, 2)">审核</el-button>
              <el-button type="warning" link size="small" :icon="Tickets" @click="openTrace(row)">溯源</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-tip">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
            <p>暂无图文审核任务</p>
          </div>
        </template>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 50, 100]" :total="total"
          layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </div>

    <el-backtop class="backtop-float" :right="40" :bottom="60" />

    <transition name="dialog-zoom">
      <el-dialog v-model="detailVisible" title="图文审核详情" width="960px" destroy-on-close top="5vh">
        <div v-if="detailLoading" class="skeleton-wrapper">
          <el-skeleton :rows="3" animated />
          <el-divider />
          <el-skeleton :rows="5" animated />
          <el-divider />
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else-if="currentDetail && currentAiScreen" class="detail-content">
          <el-alert v-if="!canSubmitCurrent" type="warning" :closable="false" show-icon class="mb-16">
            <template #title>
              <b>风险未处理：还有 {{ unhandledRiskLabels.length }} 项AI风险需确认</b>
              <div class="mt-8">
                <el-tag v-for="(l, i) in unhandledRiskLabels" :key="i" size="small" type="warning" effect="plain" style="margin-right: 6px">
                  {{ l }}
                </el-tag>
              </div>
            </template>
          </el-alert>
          <el-alert v-if="duplicateCheck?.isDuplicate" type="error" :closable="false" show-icon class="mb-16">
            <template #title>
              <b>重复审核提醒：{{ duplicateCheck.duplicateWithinMinutes }}分钟内已有审核记录</b>
              <div class="mt-4" style="font-size: 12px; color: #606266">
                最近：{{ duplicateCheck.lastAuditRecord?.auditTime ? formatDate(duplicateCheck.lastAuditRecord.auditTime) : '' }}
                {{ duplicateCheck.lastAuditRecord?.auditorName }} -
                {{ getEnumLabel(ARTICLE_AUDIT_STATUS, duplicateCheck.lastAuditRecord?.auditStatus || 0) }}
              </div>
            </template>
          </el-alert>
          <el-alert v-if="duplicateCheck?.contentModifiedAfter" type="warning" :closable="false" show-icon class="mb-16">
            <template #title><b>内容在审核后被修改过，请注意版本差异</b></template>
          </el-alert>

          <el-row :gutter="16">
            <el-col :span="14">
              <div class="detail-section">
                <div class="section-title"><el-icon><CopyDocument /></el-icon> 图文基础信息</div>
                <div class="info-card">
                  <div class="info-header">
                    <div class="info-cover-list">
                      <el-image v-for="(img, i) in (currentDetail.coverImages || []).slice(0, 3)" :key="i" :src="img"
                        fit="cover" class="info-cover-img" :preview-src-list="currentDetail.coverImages">
                        <template #error><div class="cover-error"><el-icon :size="24"><Picture /></el-icon></div></template>
                      </el-image>
                    </div>
                    <div class="info-title-area">
                      <h3 class="info-title">{{ currentDetail.title }}</h3>
                      <div class="info-meta-row">
                        <el-tag size="small" :type="(getEnumItem(DOMAIN_CATEGORY as any, currentDetail.domainCategory)?.type as any) || 'info'">
                          {{ getEnumLabel(DOMAIN_CATEGORY as any, currentDetail.domainCategory) }}
                        </el-tag>
                        <el-tag size="small" type="info" effect="plain" style="margin-left: 6px">
                          V{{ currentDetail.versionNo }}
                        </el-tag>
                        <span class="meta-word">共 {{ formatNumber(currentDetail.wordCount) }} 字</span>
                      </div>
                      <div class="info-author mt-8">
                        <el-icon><User /></el-icon>
                        {{ currentDetail.author.name }}（Lv.{{ currentDetail.author.level }}）
                        <span :class="currentDetail.author.violationCount > 0 ? 'text-danger' : 'text-success'" style="margin-left: 12px">
                          历史违规：{{ currentDetail.author.violationCount }}次
                        </span>
                      </div>
                    </div>
                  </div>
                  <el-descriptions :column="2" size="small" border class="mt-16">
                    <el-descriptions-item label="图文编码">
                      <span class="mono-text">{{ currentDetail.articleCode }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="发布账号">{{ currentDetail.publishAccount }}</el-descriptions-item>
                    <el-descriptions-item label="摘要" :span="2">
                      <div class="summary-text">{{ currentDetail.summary || '-' }}</div>
                    </el-descriptions-item>
                    <el-descriptions-item label="风险等级" :span="2">
                      <el-tag :type="getEnumItem(AI_PRE_SCREEN_RESULT, currentAiScreen.overallResult)?.type as any" effect="dark" size="large">
                        {{ getEnumLabel(AI_PRE_SCREEN_RESULT, currentAiScreen.overallResult) }} · 评分 {{ currentAiScreen.overallScore }}
                      </el-tag>
                      <el-tag v-for="(tag, i) in currentAiScreen.suspiciousTags" :key="i" size="small" type="danger" effect="plain"
                        style="margin-left: 6px">{{ tag }}</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>

              <div class="detail-section mt-16">
                <div class="section-title"><el-icon><Document /></el-icon> 原文预览</div>
                <div class="info-card preview-card">
                  <el-collapse>
                    <el-collapse-item title="正文段落（AI敏感词已高亮）" name="body">
                      <div class="body-preview">
                        <el-typography>
                          <p v-for="(p, i) in 5" :key="i" class="body-paragraph">
                            <template v-for="(seg, j) in 3" :key="j">
                              <span :class="{ 'sensitive-highlight': (i + j) % 4 === 0 }">
                                这是第{{ i + 1 }}段的示例文字内容，用于展示图文的排版效果。其中可能包含
                              </span>
                              <mark v-if="(i + j) % 4 === 0" class="ai-highlight-mark">敏感词检测结果</mark>
                              <span :class="{ 'sensitive-highlight': (i + j) % 4 === 0 }">
                                ，会被AI高亮标记出来供审核员参考。
                              </span>
                            </template>
                          </p>
                        </el-typography>
                      </div>
                    </el-collapse-item>
                    <el-collapse-item :title="`正文配图 (${(currentDetail.bodyImages || []).length || 0}张)`" name="images" v-if="currentDetail.bodyImages?.length">
                      <div class="body-images">
                        <el-image v-for="(img, i) in currentDetail.bodyImages.slice(0, 8)" :key="i" :src="img"
                          fit="cover" class="body-img" :preview-src-list="currentDetail.bodyImages">
                          <template #error><div class="cover-error"><el-icon :size="28"><Picture /></el-icon></div></template>
                        </el-image>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
            </el-col>

            <el-col :span="10">
              <div class="detail-section">
                <div class="section-title"><el-icon><WarningFilled /></el-icon> AI检测明细</div>
                <div class="info-card risk-card">
                  <div class="risk-score-row">
                    <div class="risk-gauge">
                      <svg viewBox="0 0 120 120" class="gauge-svg">
                        <circle cx="60" cy="60" r="50" stroke="#e4e7ed" stroke-width="10" fill="none" />
                        <circle cx="60" cy="60" r="50"
                          :stroke="getEnumItem(AI_PRE_SCREEN_RESULT, currentAiScreen.overallResult)?.color || '#909399'"
                          stroke-width="10" fill="none"
                          stroke-dasharray="314"
                          :stroke-dashoffset="314 - (currentAiScreen.overallScore / 100 * 314)"
                          transform="rotate(-90 60 60)" stroke-linecap="round" />
                      </svg>
                      <div class="gauge-num">{{ currentAiScreen.overallScore }}</div>
                    </div>
                    <div class="risk-side">
                      <el-tag effect="dark" :type="getEnumItem(AI_PRE_SCREEN_RESULT, currentAiScreen.overallResult)?.type as any" size="large">
                        {{ getEnumLabel(AI_PRE_SCREEN_RESULT, currentAiScreen.overallResult) }}
                      </el-tag>
                      <div class="risk-progress mt-8">
                        <div class="progress-label">
                          已处理 <b>{{ currentAiScreen.handledRiskCount }}</b> / {{ currentAiScreen.totalRiskCount }} 项
                        </div>
                        <el-progress :percentage="currentAiScreen.totalRiskCount ? Math.round(currentAiScreen.handledRiskCount / currentAiScreen.totalRiskCount * 100) : 100"
                          :stroke-width="8" />
                      </div>
                    </div>
                  </div>
                  <div v-if="currentAiScreen.riskItems.length > 0" class="risk-items mt-12">
                    <div v-for="risk in currentAiScreen.riskItems" :key="risk.type"
                      :class="['glow-wrapper', 'risk-detail-item', {
                        'glow-active': glowStates[`risk-${risk.type}-${currentArticleId}`]
                      }]"
                      :style="{ borderLeftColor: getAiRiskItem(risk.type)?.severity === 'high' ? '#F56C6C' : getAiRiskItem(risk.type)?.severity === 'medium' ? '#E6A23C' : '#909399' }">
                      <div class="risk-item-header">
                        <div class="risk-item-left">
                          <el-icon :size="16" :color="getAiRiskItem(risk.type)?.severity === 'high' ? '#F56C6C' : '#E6A23C'">
                            <WarningFilled />
                          </el-icon>
                          <span class="risk-item-label">{{ getAiRiskItem(risk.type)?.label || risk.label }}</span>
                          <el-tag size="small" :type="risk.severity === 'high' ? 'danger' : risk.severity === 'medium' ? 'warning' : 'info'" effect="plain" style="margin-left: 6px">
                            {{ risk.score }}分 · {{ risk.severity === 'high' ? '高' : risk.severity === 'medium' ? '中' : '低' }}
                          </el-tag>
                        </div>
                        <el-switch
                          :model-value="risk.handled"
                          active-text="已处理"
                          inactive-text="未处理"
                          inline-prompt
                          size="small"
                          @change="(v) => handleRisk(risk.type, v)"
                        />
                      </div>
                      <div class="risk-item-desc">{{ risk.description }}</div>
                      <div v-if="risk.suggestions?.length" class="risk-suggestions">
                        <div v-for="(s, i) in risk.suggestions.slice(0, 2)" :key="i" class="suggestion-item">
                          <el-icon color="#67C23A" size="14"><CircleCheck /></el-icon> {{ s }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <el-empty v-else description="未检测到风险项" :image-size="60" />
                </div>
              </div>

              <div class="detail-section mt-16">
                <div class="section-title"><el-icon><History /></el-icon> 历史审核记录</div>
                <div class="info-card">
                  <el-table :data="currentDetail.previousAuditLogs || []" size="small" stripe style="width: 100%" v-if="currentDetail.previousAuditLogs?.length">
                    <el-table-column label="单号" width="140">
                      <template #default="{ row }">
                        <el-tooltip :content="row.auditNo" placement="top">
                          <span class="mono-text">{{ row.auditNo }}</span>
                        </el-tooltip>
                      </template>
                    </el-table-column>
                    <el-table-column label="结果" width="80" align="center">
                      <template #default="{ row }">
                        <el-tag :type="getEnumItem(ARTICLE_AUDIT_STATUS, row.auditStatus)?.type || 'info'" size="small">
                          {{ getEnumLabel(ARTICLE_AUDIT_STATUS, row.auditStatus) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="审核人" width="80">{{ row.auditorName }}</el-table-column>
                    <el-table-column label="驳回原因" min-width="100">
                      <template #default="{ row }">
                        <el-tooltip v-if="row.rejectReason" placement="top" :show-after="400" :content="row.rejectReason">
                          <span class="reject-text">{{ row.rejectReason.slice(0, 15) }}...</span>
                        </el-tooltip>
                        <span v-else>-</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="时间" width="140">
                      <template #default="{ row }">{{ formatDate(row.auditTime, 'MM-DD HH:mm') }}</template>
                    </el-table-column>
                  </el-table>
                  <el-empty v-else description="暂无历史审核记录" :image-size="60" />
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="primary" :icon="Checked" :disabled="!canSubmitCurrent"
            @click="() => { if (currentArticleId !== null) { const r = listData.find(x => x.articleId === currentArticleId); if (r) { detailVisible = false; openAuditDialog(r) } } }">
            {{ !canSubmitCurrent ? '请先处理全部风险' : '发起审核' }}
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="auditDialogVisible" title="审核处理" width="680px" :close-on-click-modal="false" destroy-on-close top="8vh">
        <el-form ref="auditFormRef" :model="auditFormData" :rules="auditFormRules" label-width="100px" @submit.prevent>
          <el-alert v-if="hasHighRisk && auditFormData.auditStatus === 2" type="error" :closable="false" show-icon class="mb-16">
            <template #title><b>⚠️ 高风险提醒：当前内容含高风险项，通过请务必确认无误</b></template>
          </el-alert>
          <el-alert v-if="!canSubmitCurrent && currentArticleId" type="warning" :closable="false" show-icon class="mb-16">
            <template #title><b>还有 {{ unhandledRiskLabels.length }} 项AI风险未处理，无法提交</b></template>
          </el-alert>

          <el-form-item label="审核结果">
            <el-radio-group v-model="auditFormData.auditStatus" class="result-radio-group">
              <el-radio-button :value="2">
                <el-icon color="#67C23A"><CircleCheck /></el-icon><span>通过</span>
              </el-radio-button>
              <el-radio-button :value="6">
                <el-icon color="#722ed1"><WarningFilled /></el-icon><span>疑似违规</span>
              </el-radio-button>
              <el-radio-button :value="3">
                <el-icon color="#F56C6C"><CircleClose /></el-icon><span>驳回</span>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="复核级别" v-if="isLeader || auditFormData.auditStatus === 6">
            <el-radio-group v-model="auditFormData.reviewLevel">
              <el-radio-button :value="1">初审</el-radio-button>
              <el-radio-button :value="2">复审</el-radio-button>
              <el-radio-button :value="3">终审</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <template v-if="auditFormData.auditStatus === 3">
            <el-form-item label="驳回分类" prop="rejectReasonCategory" :class="{ 'field-shake': shakeFields.rejectReasonCategory }">
              <el-select v-model="auditFormData.rejectReasonCategory" placeholder="请选择驳回原因分类" style="width: 100%">
                <el-option v-for="opt in rejectCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="驳回详情" prop="rejectReasonDetail" :class="{ 'field-shake': shakeFields.rejectReasonDetail }">
              <el-input v-model="auditFormData.rejectReasonDetail" type="textarea" :rows="4"
                placeholder="请详细描述驳回原因（至少5字符），将反馈创作者" maxlength="500" show-word-limit />
            </el-form-item>
            <el-form-item label="快捷原因">
              <div class="quick-reject-tags">
                <el-tag v-for="(ex, i) in rejectExamples" :key="i"
                  :class="['quick-tag', { 'risk-shake': shakeFields.rejectReasonDetail }]" effect="plain"
                  @click="auditFormData.rejectReasonDetail = ex; triggerShake('rejectReasonDetail')">
                  <el-icon><Plus /></el-icon> {{ ex }}
                </el-tag>
                <span v-if="rejectExamples.length === 0" class="text-placeholder" style="font-size: 12px">
                  先选择驳回分类以显示快捷标签
                </span>
              </div>
            </el-form-item>
          </template>

          <el-form-item label="审核备注" prop="auditRemark">
            <el-input v-model="auditFormData.auditRemark" type="textarea" :rows="3"
              placeholder="请输入审核备注（选填）" maxlength="500" show-word-limit />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button type="primary" :icon="Checked" :loading="submitting"
            :disabled="!canSubmitCurrent && currentArticleId !== null"
            :class="['btn-ripple', { 'field-shake': shakeFields.auditSubmit }]"
            @click="(e) => { createRipple(e, `submit-${currentArticleId}`); doSubmitArticleAudit() }">
            确认提交
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="traceVisible" title="审核溯源" width="820px" destroy-on-close top="5vh">
        <div v-if="!currentTrace" class="skeleton-wrapper">
          <el-skeleton :rows="3" animated /><el-divider /><el-skeleton :rows="8" animated />
        </div>
        <div v-else class="trace-content">
          <div class="section-block">
            <div class="section-title"><el-icon><Tickets /></el-icon> 检索条件</div>
            <el-descriptions :column="3" size="small" border class="mb-16">
              <el-descriptions-item label="图文编码">
                <el-tag type="primary" effect="plain">{{ currentTrace.articleCode }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="审核批次">{{ currentTrace.auditBatch }}</el-descriptions-item>
              <el-descriptions-item label="风险标签">
                <el-tag v-for="(t, i) in currentTrace.riskTags" :key="i" size="small"
                  :style="{ backgroundColor: getRiskTagItem(t)?.color + '15', color: getRiskTagItem(t)?.color, marginRight: '4px' }">
                  {{ getRiskTagItem(t)?.label || t }}
                </el-tag>
                <span v-if="!currentTrace.riskTags?.length">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="文章标题" :span="2">{{ currentTrace.articleTitle }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getEnumItem(ARTICLE_AUDIT_STATUS, currentTrace.auditStatus)?.type || 'info'" effect="dark">
                  {{ currentTrace.auditStatusLabel }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="section-block">
            <div class="section-title"><el-icon><CopyDocument /></el-icon> 版本差异对比</div>
            <el-table :data="currentTrace.contentVersionDiff" size="small" stripe style="width: 100%" border>
              <el-table-column label="版本号" width="80" align="center">
                <template #default="{ row }">V{{ row.versionNo }}</template>
              </el-table-column>
              <el-table-column label="标题哈希" width="100" align="center">
                <template #default="{ row }">
                  <el-icon :color="row.titleHashMatch ? '#67C23A' : '#F56C6C'">
                    <component :is="row.titleHashMatch ? CircleCheck : CircleClose" />
                  </el-icon>
                </template>
              </el-table-column>
              <el-table-column label="内容哈希" width="100" align="center">
                <template #default="{ row }">
                  <el-icon :color="row.contentHashMatch ? '#67C23A' : '#F56C6C'">
                    <component :is="row.contentHashMatch ? CircleCheck : CircleClose" />
                  </el-icon>
                </template>
              </el-table-column>
              <el-table-column label="配图增减" width="100" align="center">
                <template #default="{ row }">
                  <span :class="row.bodyImageCountDiff !== 0 ? 'text-danger' : ''">
                    {{ row.bodyImageCountDiff > 0 ? '+' : '' }}{{ row.bodyImageCountDiff }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="字数差" width="100" align="center">
                <template #default="{ row }">
                  <span :class="Math.abs(row.wordCountDiff) > 50 ? 'text-warning' : ''">
                    {{ row.wordCountDiff > 0 ? '+' : '' }}{{ row.wordCountDiff }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="修改人" width="100">{{ row.modifiedBy }}</el-table-column>
              <el-table-column label="修改时间" min-width="150">
                <template #default="{ row }">{{ formatDate(row.modifiedAt, 'MM-DD HH:mm') }}</template>
              </el-table-column>
            </el-table>
          </div>

          <div class="section-block mt-16">
            <div class="section-title"><el-icon><WarningFilled /></el-icon> 风险匹配分析</div>
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item label="预期结果">
                <el-tag type="danger">{{ currentTrace.riskMatchAnalysis.expectedResult }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="实际结果">
                <el-tag :type="currentTrace.riskMatchAnalysis.matchRate >= 80 ? 'success' : 'warning'">
                  {{ currentTrace.riskMatchAnalysis.actualResult }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="匹配率">
                <el-progress :percentage="currentTrace.riskMatchAnalysis.matchRate" :stroke-width="10" />
              </el-descriptions-item>
              <el-descriptions-item label="不匹配项">
                <el-tag v-for="(r, i) in currentTrace.riskMatchAnalysis.mismatchedRisks" :key="i" size="small" type="danger" effect="plain" style="margin-right: 4px">
                  {{ r }}
                </el-tag>
                <span v-if="!currentTrace.riskMatchAnalysis.mismatchedRisks?.length" class="text-success">全部匹配</span>
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="section-block mt-16">
            <div class="section-title"><el-icon><Warning /></el-icon> 异常列表 ({{ currentTrace.exceptions.length }})</div>
            <el-table :data="currentTrace.exceptions" size="small" stripe v-if="currentTrace.exceptions.length" style="width: 100%" border>
              <el-table-column label="类型" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :style="{ backgroundColor: (getEnumItem(ARTICLE_AUDIT_EXCEPTION as any, row.type)?.color || '#909399') + '15', color: getEnumItem(ARTICLE_AUDIT_EXCEPTION as any, row.type)?.color }">
                    {{ row.typeLabel }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="描述" min-width="200">{{ row.description }}</el-table-column>
              <el-table-column label="严重度" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'">
                    {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="建议措施" min-width="160">{{ row.suggestedAction }}</el-table-column>
            </el-table>
            <el-empty v-else description="无异常记录" :image-size="60" />
          </div>

          <div class="section-block mt-16">
            <div class="section-title"><el-icon><Clock /></el-icon> 时间线流水</div>
            <el-timeline>
              <el-timeline-item
                v-for="(item, i) in currentTrace.timeline.slice().reverse()"
                :key="i"
                :type="{ '已完成': 'success', '已驳回': 'danger', '处理中': 'primary', '异常': 'warning' }[item.status] || 'primary'"
                :timestamp="formatDate(item.time)"
                placement="top"
              >
                <el-card shadow="never" class="timeline-card">
                  <div class="timeline-header">
                    <el-tag size="small" type="primary" effect="plain">{{ item.action }}</el-tag>
                    <span class="operator-text">
                      {{ item.operator }} ({{ item.operatorRole }})
                    </span>
                    <span class="status-badge" v-if="item.riskChecks?.length">
                      风险检查：{{ item.riskChecks.join('、') }}
                    </span>
                  </div>
                  <div class="timeline-detail">{{ item.detail || '无详情' }}</div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
        <template #footer>
          <el-button @click="traceVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="exportVisible" title="导出审核台账" width="560px" destroy-on-close top="12vh">
        <div v-if="!exportResult" class="export-loading">
          <el-icon class="loading-icon" :size="40" color="#409EFF"><Refresh /></el-icon>
          <p class="text-secondary">正在生成台账，请稍候...</p>
        </div>
        <div v-else class="export-content">
          <el-alert type="success" :closable="false" show-icon class="mb-16">
            <template #title>
              <b>台账生成成功</b>，共 <b>{{ exportResult.totalCount }}</b> 条记录
            </template>
          </el-alert>

          <div class="export-meta">
            <div class="meta-row"><span class="label">文件名称：</span>{{ exportResult.fileName }}</div>
            <div class="meta-row"><span class="label">导出台账ID：</span><span class="mono-text">{{ exportResult.exportId }}</span></div>
            <div class="meta-row"><span class="label">生成时间：</span>{{ formatDate(exportResult.generatedAt) }}</div>
          </div>

          <div class="export-preview mt-16">
            <div class="preview-title">数据预览（前5条）</div>
            <el-table :data="exportResult.ledgerItems.slice(0, 5)" size="small" border stripe style="width: 100%">
              <el-table-column label="编码" width="120">
                <template #default="{ row }">
                  <span class="mono-text">{{ row.articleCode }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }">{{ row.auditAction }}</template>
              </el-table-column>
              <el-table-column label="审核员" width="80">{{ row.auditorName }}</el-table-column>
              <el-table-column label="AI风险前/后" width="100" align="center">
                <template #default="{ row }">
                  <span :class="row.aiRiskCountAfter > 0 ? 'text-warning' : 'text-success'">
                    {{ row.aiRiskCountBefore }} / {{ row.aiRiskCountAfter }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="140">
                <template #default="{ row }">{{ formatDate(row.auditTime, 'MM-DD HH:mm') }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <template #footer>
          <el-button @click="exportVisible = false">关闭</el-button>
          <el-button type="primary" :icon="Download" :loading="batchSubmitting"
            @click="async () => { if (exportResult?.url) { downloadFile(exportResult.url, exportResult.fileName); ElMessage.success('开始下载'); } }">
            下载台账文件
          </el-button>
          <el-button :icon="CopyDocument"
            @click="async () => { if (exportResult) { const ok = await copyToClipboard(JSON.stringify(exportResult.ledgerItems, null, 2)); ElMessage[ok ? 'success' : 'error'](ok ? '已复制到剪贴板' : '复制失败'); } }">
            复制数据(JSON)
          </el-button>
        </template>
      </el-dialog>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.article-audit-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-content {
  background: $bg-white;
  border-radius: $radius-md;
  box-shadow: $shadow-light;
}

.stat-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-left: 4px solid;
  cursor: pointer;
  transition: all .3s ease;
  border-radius: $radius-md;
  &:hover { transform: translateY(-2px); box-shadow: $shadow-base; }
  &.active { background: rgba(64, 158, 255, .06); }
}
.stat-icon {
  width: 48px; height: 48px;
  border-radius: $radius-md;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-body { flex: 1; min-width: 0; }
.stat-count { font-size: 24px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: $font-sm; color: $text-secondary; margin-top: 4px; }
.stat-arrow { color: $text-placeholder; transition: $transition-base; }
.stat-card:hover .stat-arrow { color: $primary-color; transform: translateX(4px); }

.filter-bar {
  padding: 16px 16px 0;
  .el-form { margin-bottom: 0; display: flex; flex-wrap: wrap; }
}

.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(90deg, rgba(64, 158, 255, .03), rgba(103, 194, 58, .03));
}
.toolbar-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; }
.selected-info {
  color: $text-secondary;
  b { color: $primary-color; font-size: 16px; padding: 0 4px; }
}
.unresolved-info { font-size: 13px; display: flex; align-items: center; gap: 4px; }

.table-wrapper {
  padding: 0;
  .el-table {
    border-radius: $radius-md $radius-md 0 0;
    :deep(.el-table__row) {
      &.row--zebra { background: $bg-hover; }
      &.row--current,
      &.current-row {
        background: rgba(64, 158, 255, .08) !important;
        > td { background: transparent !important; }
      }
      &:hover > td { background-color: rgba(64, 158, 255, .04) !important; }
    }
  }
}
.sticky-header-th {
  background: #fafafa !important;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}
.article-code { font-size: 12px; color: $text-secondary; }
.title-cell { display: flex; gap: 10px; align-items: center; }
.title-thumb { width: 48px; height: 48px; border-radius: $radius-sm; flex-shrink: 0; background: $bg-color; }
.thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: $text-placeholder; }
.title-text { font-size: $font-base; font-weight: 500; color: $text-primary; }
.text-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.author-name, .reviewer-name { font-size: $font-sm; }
.mono-text { font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; }
.text-placeholder { color: $text-placeholder; }

.ai-screen-cell {
  padding: 2px 6px;
  border-radius: $radius-sm;
  transition: all .3s;
}
.risk-glow-error {
  box-shadow: 0 0 12px rgba(245, 108, 108, .8);
  border: 1px solid rgba(245, 108, 108, .5);
  animation: glowPulse 2s ease-in-out infinite;
}
.risk-glow-warning {
  box-shadow: 0 0 12px rgba(230, 162, 60, .7);
  border: 1px solid rgba(230, 162, 60, .4);
  animation: glowPulseWarn 2.5s ease-in-out infinite;
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(245, 108, 108, .6); }
  50% { box-shadow: 0 0 16px rgba(245, 108, 108, .95); }
}
@keyframes glowPulseWarn {
  0%, 100% { box-shadow: 0 0 8px rgba(230, 162, 60, .5); }
  50% { box-shadow: 0 0 14px rgba(230, 162, 60, .85); }
}

.risk-tags-wrapper { display: flex; flex-wrap: wrap; gap: 5px; }
.risk-item {
  transition: all .25s ease;
  &:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,.1); }
}
.risk-shake {
  animation: shake .6s cubic-bezier(.36, .07, .19, .97) both;
}
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.deadline-text {
  &.overdue { color: $danger-color; font-weight: 600; }
}
.blink-red {
  animation: blinkRed 1.5s ease-in-out infinite;
}
@keyframes blinkRed {
  0%, 100% { opacity: 1; }
  50% { opacity: .45; }
}

.action-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; }
.btn-ripple {
  position: relative;
  overflow: hidden;
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(103, 194, 58, .4);
    transform: scale(0);
    animation: rippleAnim .6s linear;
    pointer-events: none;
    z-index: 1;
  }
}
@keyframes rippleAnim {
  to { transform: scale(4); opacity: 0; }
}

.empty-tip {
  padding: 60px 0;
  text-align: center;
  color: $text-placeholder;
  p { margin-top: 12px; }
}
.pagination-wrapper {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
}

.backtop-float {
  :deep(.el-backtop) {
    background: $primary-color;
    color: white;
    border-radius: 50%;
    box-shadow: $shadow-base;
    transition: all .3s;
    &:hover { background: darken($primary-color, 8%); }
  }
}

.skeleton-wrapper {
  padding: 4px;
  .el-skeleton + .el-divider { margin: 16px 0; }
}

.mb-16 { margin-bottom: 16px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.text-primary { color: $primary-color; }
.text-danger { color: $danger-color; }
.text-success { color: $success-color; }
.text-warning { color: $warning-color; }
.text-secondary { color: $text-secondary; }

.dialog-zoom-enter-active,
.dialog-zoom-leave-active {
  transition: transform .28s cubic-bezier(.22, 1, .36, 1),
              opacity .28s cubic-bezier(.22, 1, .36, 1);
}
.dialog-zoom-enter-from,
.dialog-zoom-leave-to {
  opacity: 0;
  transform: scale(.92) translateY(10px);
}
:deep(.el-dialog) {
  border-radius: $radius-md;
}

.detail-content { display: flex; flex-direction: column; gap: 16px; }
.detail-section {
  .section-title {
    font-size: $font-md;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
.info-card {
  background: $bg-white;
  border: 1px solid $border-lighter;
  border-radius: $radius-md;
  padding: 16px;
}
.info-header { display: flex; gap: 16px; }
.info-cover-list { display: flex; gap: 8px; flex-shrink: 0; }
.info-cover-img {
  width: 90px; height: 90px;
  border-radius: $radius-sm;
  background: $bg-color;
}
.cover-error {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: $bg-color; color: $text-placeholder;
}
.info-title-area { flex: 1; min-width: 0; }
.info-title {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 8px;
  line-height: 1.4;
}
.info-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.meta-word { font-size: 13px; color: $text-secondary; }
.info-author { font-size: 13px; color: $text-regular; display: flex; align-items: center; gap: 4px; }

.summary-text {
  max-height: 80px;
  overflow-y: auto;
  line-height: 1.7;
  font-size: 13px;
  color: $text-regular;
}

.preview-card .body-preview {
  padding: 16px;
  background: #fafbfc;
  border-radius: $radius-sm;
}
.body-paragraph {
  line-height: 2;
  margin-bottom: 12px;
  color: $text-primary;
  text-indent: 2em;
}
.ai-highlight-mark {
  background: linear-gradient(180deg, transparent 55%, rgba(245, 108, 108, .35) 55%);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}
.sensitive-highlight { background: rgba(245, 108, 108, .06); }
.body-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 16px;
  background: #fafbfc;
  border-radius: $radius-sm;
}
.body-img {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: $radius-sm;
  background: $bg-color;
}

.risk-card {
  background: linear-gradient(135deg, rgba(245, 108, 108, .03), rgba(230, 162, 60, .03));
}
.risk-score-row {
  display: flex;
  gap: 20px;
  align-items: center;
}
.risk-gauge {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}
.gauge-svg { width: 100%; height: 100%; }
.gauge-num {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  font-size: 28px;
  font-weight: 700;
  color: $text-primary;
}
.risk-side { flex: 1; min-width: 0; }
.progress-label { font-size: 12px; color: $text-secondary; margin-bottom: 4px; }

.risk-items {
  border-top: 1px dashed $border-lighter;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.glow-wrapper {
  transition: all .3s ease;
  border: 1px solid transparent;
  &:hover {
    box-shadow: 0 0 12px rgba(64, 158, 255, .35);
    border-color: rgba(64, 158, 255, .4);
  }
}
.glow-active {
  box-shadow: 0 0 18px rgba(103, 194, 58, .7) !important;
  border-color: rgba(103, 194, 58, .6) !important;
}
.risk-detail-item {
  padding: 12px 14px;
  border-radius: $radius-md;
  background: $bg-white;
  border-left: 4px solid;
}
.risk-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.risk-item-left { display: flex; align-items: center; gap: 6px; }
.risk-item-label { font-weight: 600; color: $text-primary; font-size: 14px; }
.risk-item-desc {
  margin-top: 8px;
  font-size: 13px;
  color: $text-regular;
  line-height: 1.6;
}
.risk-suggestions {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.suggestion-item {
  font-size: 12px;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 4px;
}

.reject-text { color: $text-secondary; font-size: 13px; }

.result-radio-group { display: flex; gap: 0; }
.field-shake {
  animation: shake .55s cubic-bezier(.36, .07, .19, .97) both;
}
.quick-reject-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.quick-tag {
  cursor: pointer;
  transition: all .2s;
  &:hover { transform: scale(1.04); }
}

.trace-content .section-block {
  margin-top: 0;
  & + .section-block { margin-top: 20px; }
  .section-title {
    font-size: $font-md;
    font-weight: 600;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: $text-primary;
  }
}
.timeline-card { border: 1px solid $border-lighter; }
.timeline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.operator-text { font-size: 12px; color: $text-secondary; }
.status-badge {
  margin-left: auto;
  padding: 2px 8px;
  background: #ecf5ff;
  color: $primary-color;
  border-radius: 4px;
  font-size: 11px;
}
.timeline-detail { font-size: 13px; color: $text-primary; line-height: 1.5; }

.export-loading {
  padding: 40px 0;
  text-align: center;
  .loading-icon { animation: spin 1s linear infinite; }
  p { margin-top: 16px; color: $text-secondary; }
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.export-content .export-meta {
  background: #fafbfc;
  border-radius: $radius-sm;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.meta-row {
  display: flex;
  font-size: 13px;
  .label {
    width: 100px;
    color: $text-secondary;
    flex-shrink: 0;
  }
}
.export-preview .preview-title {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 10px;
  font-weight: 500;
}
</style>
