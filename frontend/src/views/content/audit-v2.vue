<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import type { FormInstance } from 'element-plus'
import QyAuditDialog from '@/components/QyAuditDialog/index.vue'
import QyContentPreview from '@/components/QyContentPreview/index.vue'
import {
  CONTENT_AUDIT_STATUS,
  CONTENT_CATEGORY,
  RISK_LEVEL,
  AUDIT_REVIEW_LEVEL,
  AUDIT_TASK_PRIORITY,
  REJECT_REASON_CATEGORY,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getAuditDetailApi,
  previewAssignApi,
  checkDuplicateAuditApi,
  submitAuditApi,
  batchAuditActionApi,
  getAuditTaskPoolApi,
  getAuditTraceApi,
  getQualityCheckReportApi,
  getRejectReasonTemplatesApi,
  refreshPartialAuditDataApi,
  validateAuditOperationApi,
} from '@/api/audit'
import type {
  AuditDetailInfo,
  AuditTaskPoolItem,
  AuditTraceRecord,
  QualityCheckReport,
  AssignPreviewResult,
  DuplicateCheckResult,
  RejectReasonTemplate,
  AuditSubmitData,
} from '@/types'
import { formatDate, formatNumber, debounce, throttle } from '@/utils'
import { useUserStore } from '@/stores'

const userStore = useUserStore()
const isAuditor = computed(() => userStore.roleCode === 'CONTENT_AUDITOR')
const isLeader = computed(() => ['ADMIN', 'SUPER_ADMIN'].includes(userStore.roleCode) || userStore.hasRole(['ADMIN', 'SUPER_ADMIN']))

const listLoading = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const submitBtnStates = reactive<Record<string, { offset: boolean; disabled: boolean }>>({})

const listData = ref<AuditTaskPoolItem[]>([])
const total = ref(0)
const currentDetail = ref<AuditDetailInfo | null>(null)
const assignPreview = ref<AssignPreviewResult | null>(null)
const duplicateCheck = ref<DuplicateCheckResult | null>(null)
const rejectTemplates = ref<RejectReasonTemplate[]>([])
const auditTrace = ref<AuditTraceRecord | null>(null)
const qualityReport = ref<QualityCheckReport | null>(null)

const queryParams = reactive({
  page: 1, pageSize: 10, keyword: '',
  category: null as number | null, auditStatus: null as number | null,
  priority: null as number | null, riskLevel: null as number | null,
  isArchived: null as boolean | null,
  sortBy: 'createdAt', sortOrder: 'DESC' as 'ASC' | 'DESC',
})

const selectedRows = ref<AuditTaskPoolItem[]>([])
const previewVisible = ref(false)
const auditDialogVisible = ref(false)
const detailVisible = ref(false)
const traceVisible = ref(false)
const reportVisible = ref(false)
const batchRejectVisible = ref(false)

const currentContentId = ref<number | null>(null)
const batchAuditAction = ref<string>('')

const auditFormRef = ref<FormInstance>()
const auditFormData = reactive({
  auditStatus: 2, auditRemark: '', rejectReasonCategory: '',
  rejectReasonDetail: '', reviewLevel: 1, nextReviewerId: null as number | null,
})

const batchRejectFormRef = ref<FormInstance>()
const batchRejectFormData = reactive({
  rejectReasonCategory: '', rejectReasonDetail: '', auditRemark: '',
})

const columnWidths = reactive<Record<string, number>>({
  selection: 50, id: 80, info: 300, category: 100, risk: 110,
  priority: 100, status: 110, reviewer: 110, deadline: 170, submitTime: 170, actions: 260,
})

const shakeFields = reactive<Record<string, boolean>>({})
const triggerShake = (field: string) => {
  shakeFields[field] = true
  setTimeout(() => { shakeFields[field] = false }, 600)
}

const auditStatusOptions = computed(() => getEnumOptions(CONTENT_AUDIT_STATUS).filter(i => i.value !== 4))
const categoryOptions = computed(() => getEnumOptions(CONTENT_CATEGORY))
const riskOptions = computed(() => getEnumOptions(RISK_LEVEL))
const priorityOptions = computed(() => getEnumOptions(AUDIT_TASK_PRIORITY))
const reviewLevelOptions = computed(() => getEnumOptions(AUDIT_REVIEW_LEVEL))
const rejectCategoryOptions = computed(() =>
  Object.entries(REJECT_REASON_CATEGORY).map(([, v]) => ({ value: (v as any).value, label: (v as any).label, examples: (v as any).examples }))
)

const rejectExamples = computed(() => {
  const cat = auditFormData.rejectReasonCategory || batchRejectFormData.rejectReasonCategory
  if (!cat) return []
  const key = Object.keys(REJECT_REASON_CATEGORY).find(k => (REJECT_REASON_CATEGORY as any)[k].value === cat)
  return (REJECT_REASON_CATEGORY as any)[key || '']?.examples || []
})

const pendingCount = computed(() => listData.value.filter(r => r.auditStatus === 0).length)
const reviewingCount = computed(() => listData.value.filter(r => r.auditStatus === 1).length)
const highRiskCount = computed(() => listData.value.filter(r => r.riskLevel >= 3).length)
const urgentCount = computed(() => listData.value.filter(r => r.priority >= 1).length)

const canStartCurrentAudit = computed(() => currentDetail.value?.completeness.canStartAudit ?? true)
const missingFieldLabels = computed(() => {
  const labelMap: Record<string, string> = {
    title: '内容标题', category: '内容分类', coverImage: '封面图', videoUrl: '视频文件',
    duration: '时长信息', description: '内容简介', copyright_id: '版权关联',
    copyright_record: '版权记录', copyright_name: '版权名称',
    copyright_start_date: '版权开始日期', copyright_end_date: '版权结束日期',
  }
  return (currentDetail.value?.completeness.missingFields || []).map(f => labelMap[f] || f)
})

const loadTaskPool = async () => {
  listLoading.value = true
  try {
    const params = { ...queryParams } as any
    if (isAuditor.value) params.assignedTo = userStore.userId
    const result = await getAuditTaskPoolApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally { listLoading.value = false }
}

const loadDetail = async (contentId: number) => {
  detailLoading.value = true
  currentDetail.value = null
  assignPreview.value = null
  duplicateCheck.value = null
  try {
    const [detail, assign, dup] = await Promise.all([
      getAuditDetailApi(contentId), previewAssignApi(contentId), checkDuplicateAuditApi(contentId),
    ])
    currentDetail.value = detail
    assignPreview.value = assign
    duplicateCheck.value = dup
  } finally { detailLoading.value = false }
}

const loadRejectTemplates = async () => {
  try { rejectTemplates.value = await getRejectReasonTemplatesApi() } catch {}
}

const loadAuditTrace = async (contentId: number) => {
  try { auditTrace.value = await getAuditTraceApi({ contentId }) } catch {}
}

const loadQualityReport = async (period = 'week') => {
  try { qualityReport.value = await getQualityCheckReportApi({ period }) } catch {}
}

const loadData = () => loadTaskPool()
const handleSearch = () => { queryParams.page = 1; loadData() }
const handleReset = () => {
  queryParams.keyword = ''; queryParams.category = null; queryParams.auditStatus = null
  queryParams.priority = null; queryParams.riskLevel = null; queryParams.isArchived = null
  handleSearch()
}
const handlePageChange = (p: number) => { queryParams.page = p; loadData() }
const handleSizeChange = (s: number) => { queryParams.pageSize = s; queryParams.page = 1; loadData() }
const handleSelectionChange = (rows: AuditTaskPoolItem[]) => { selectedRows.value = rows }
const openPreview = (row: AuditTaskPoolItem) => { currentContentId.value = row.contentId; previewVisible.value = true }
const openDetail = async (row: AuditTaskPoolItem) => {
  currentContentId.value = row.contentId; detailVisible.value = true
  await loadDetail(row.contentId)
}
const openTrace = async (row: AuditTaskPoolItem) => {
  currentContentId.value = row.contentId; traceVisible.value = true
  await loadAuditTrace(row.contentId)
}

const openAuditDialog = (row?: AuditTaskPoolItem, defaultStatus = 2) => {
  if (row) {
    currentContentId.value = row.contentId
    auditFormData.auditStatus = defaultStatus
    auditFormData.auditRemark = ''; auditFormData.rejectReasonCategory = ''
    auditFormData.rejectReasonDetail = ''; auditFormData.reviewLevel = 1
    auditFormData.nextReviewerId = null; batchAuditAction.value = ''
  }
  auditDialogVisible.value = true
  nextTick(() => auditFormRef.value?.clearValidate())
}

const handleApproveDirect = async (row: AuditTaskPoolItem) => {
  const btnKey = `approve-${row.contentId}`
  if (submitBtnStates[btnKey]?.disabled) return
  submitBtnStates[btnKey] = { offset: true, disabled: true }
  try {
    await doSubmitAudit(row.contentId, {
      contentId: row.contentId, auditStatus: 2, auditRemark: '', reviewLevel: 1,
    })
  } finally {
    setTimeout(() => { submitBtnStates[btnKey] = { offset: false, disabled: false } }, 300)
  }
}

const handleQuickApproveSelected = async () => {
  if (selectedRows.value.length === 0) return
  batchSubmitting.value = true
  try {
    const res = await batchAuditActionApi({
      ids: selectedRows.value.map(r => r.contentId), action: 'approve',
      auditStatus: 2, auditRemark: '批量快速通过',
    })
    ElMessage.success(`批量通过：成功${res.successCount}条，跳过${res.skippedCount}条`)
    loadData()
  } finally { batchSubmitting.value = false }
}

const openBatchRejectDialog = () => {
  if (selectedRows.value.length === 0) return
  batchRejectFormData.rejectReasonCategory = ''
  batchRejectFormData.rejectReasonDetail = ''
  batchRejectFormData.auditRemark = ''
  batchRejectVisible.value = true
}

const doSubmitAudit = async (contentId: number, data: AuditSubmitData, fromDialog = false) => {
  const dupResult = duplicateCheck.value || await checkDuplicateAuditApi(contentId)
  if (dupResult.isDuplicate) {
    ElMessage.warning({ message: `检测到重复提交，最近单号: ${dupResult.recentAuditRecords?.[0]?.auditNo || '-'}`, duration: 4000 })
    return false
  }
  const validateResult = await validateAuditOperationApi({
    contentId, auditStatus: data.auditStatus, reviewLevel: data.reviewLevel || 1,
  })
  if (validateResult.warnings?.length) {
    for (const w of validateResult.warnings) {
      ElNotification({ type: 'warning', title: '操作提醒', message: w, duration: 3500 })
    }
  }
  if (!validateResult.valid) {
    if (validateResult.errors?.length) {
      ElMessage.error(validateResult.errors[0])
      triggerShake('auditSubmit')
    }
    return false
  }
  submitting.value = true
  try {
    const res = await submitAuditApi(data)
    ElMessage.success(`审核成功，单号: ${res.auditNo}`)
    if (fromDialog) auditDialogVisible.value = false
    loadData()
    if (currentDetail.value) refreshPartialDetail(contentId)
    return true
  } catch (e: any) {
    triggerShake('auditSubmit')
    ElMessage.error(e?.message || '审核提交失败')
    return false
  } finally { submitting.value = false }
}

const refreshPartialDetail = async (contentId: number) => {
  listLoading.value = true
  try {
    const result = await refreshPartialAuditDataApi([contentId])
    for (const item of result) {
      const idx = listData.value.findIndex(r => r.contentId === item.contentId)
      if (idx >= 0) listData.value[idx] = item
    }
    if (currentContentId.value === contentId) await loadDetail(contentId)
  } finally { listLoading.value = false }
}

const refreshPartialSelected = async () => {
  const ids = selectedRows.value.map(r => r.contentId)
  if (ids.length === 0) return
  listLoading.value = true
  try {
    const result = await refreshPartialAuditDataApi(ids)
    for (const item of result) {
      const idx = listData.value.findIndex(r => r.contentId === item.contentId)
      if (idx >= 0) listData.value[idx] = item
    }
    ElMessage.success(`已刷新 ${result.length} 条数据`)
  } finally { listLoading.value = false }
}

const handleAuditDialogSubmit = async () => {
  if (!currentContentId.value) return
  if (auditFormData.auditStatus === 3) {
    if (!auditFormData.rejectReasonCategory) { triggerShake('rejectCategory'); return }
    if (!auditFormData.rejectReasonDetail || auditFormData.rejectReasonDetail.trim().length < 5) {
      triggerShake('rejectDetail'); return
    }
  }
  try { await auditFormRef.value?.validate() } catch { triggerShake('auditSubmit'); return }
  await doSubmitAudit(currentContentId.value, {
    contentId: currentContentId.value,
    auditStatus: auditFormData.auditStatus,
    auditRemark: auditFormData.auditRemark,
    rejectReasonCategory: auditFormData.rejectReasonCategory,
    rejectReasonDetail: auditFormData.rejectReasonDetail,
    reviewLevel: auditFormData.reviewLevel,
    nextReviewerId: auditFormData.nextReviewerId,
  }, true)
}

const handleBatchAction = async (action: string, extraData: any = {}) => {
  if (selectedRows.value.length === 0) { ElMessage.warning('请先选择'); return }
  batchSubmitting.value = true
  try {
    const res = await batchAuditActionApi({
      ids: selectedRows.value.map(r => r.contentId), action, ...extraData,
    })
    const labelMap: Record<string, string> = { approve: '通过', reject: '驳回', pending: '待定', urgent: '加急', archive: '归档' }
    ElMessage.success(`批量${labelMap[action] || '操作'}：成功${res.successCount}条，跳过${res.skippedCount}条`)
    if ((res as any).skippedDetails?.length) {
      ElNotification({
        type: 'info', title: '跳过详情', duration: 5000,
        message: (res as any).skippedDetails.slice(0, 5).map((s: any) => `#${s.id}: ${s.reason}`).join('<br/>'),
        dangerouslyUseHTMLString: true,
      })
    }
    loadData()
  } finally { batchSubmitting.value = false }
}

const handleBatchRejectSubmit = async () => {
  if (!batchRejectFormData.rejectReasonCategory) { triggerShake('batchRejectCategory'); return }
  if (!batchRejectFormData.rejectReasonDetail || batchRejectFormData.rejectReasonDetail.trim().length < 5) {
    triggerShake('batchRejectDetail'); return
  }
  batchRejectVisible.value = false
  await handleBatchAction('reject', {
    auditStatus: 3, auditRemark: batchRejectFormData.auditRemark,
    rejectReasonCategory: batchRejectFormData.rejectReasonCategory,
    rejectReasonDetail: batchRejectFormData.rejectReasonDetail,
  })
}

const formatDuration = (sec?: number) => {
  if (!sec) return '-'
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const getRiskTag = (l: number) => getEnumItem(RISK_LEVEL, l)
const getPriorityTag = (p: number) => getEnumItem(AUDIT_TASK_PRIORITY, p)

const auditFormRules = {
  rejectReasonCategory: [{
    validator: (_r: any, v: string, cb: any) => {
      if (auditFormData.auditStatus === 3 && !v) cb(new Error('请选择驳回分类'))
      else cb()
    }, trigger: 'change',
  }],
  rejectReasonDetail: [
    { validator: (_r: any, v: string, cb: any) => {
      if (auditFormData.auditStatus === 3 && (!v || v.trim().length < 5)) cb(new Error('至少5字符驳回详情'))
      else cb()
    }, trigger: 'blur' },
    { max: 500, message: '不超过500字', trigger: 'blur' },
  ],
  auditRemark: [{ max: 500, message: '不超过500字', trigger: 'blur' }],
}

const batchRejectRules = {
  rejectReasonCategory: [{ required: true, message: '请选择驳回分类', trigger: 'change' }],
  rejectReasonDetail: [
    { required: true, min: 5, message: '至少5字符', trigger: 'blur' },
    { max: 500, message: '不超过500字', trigger: 'blur' },
  ],
}

const debouncedSearch = debounce(handleSearch, 400)
const throttledRefresh = throttle(refreshPartialSelected, 5000)

onMounted(() => { loadData(); loadRejectTemplates() })
</script>

<template>
  <div class="audit-page-v2">
    <div class="audit-stat-bar">
      <div v-for="item in [
        { label: '待审核', count: pendingCount, status: 0, color: '#E6A23C', icon: 'Clock' },
        { label: '审核中', count: reviewingCount, status: 1, color: '#409EFF', icon: 'Loading' },
        { label: '高风险', count: highRiskCount, color: '#F56C6C', icon: 'WarningFilled' },
        { label: '加急', count: urgentCount, color: '#C0392B', icon: 'Lightning' },
      ]" :key="item.label" class="stat-card card-content"
        :class="{ active: queryParams.auditStatus === item.status }"
        :style="{ borderLeftColor: item.color }"
        @click="() => { if (item.status !== undefined) { queryParams.auditStatus = queryParams.auditStatus === item.status ? null : item.status; handleSearch() } }">
        <div class="stat-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-count" :style="{ color: item.color }">{{ formatNumber(item.count) }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
        <el-icon class="stat-arrow" v-if="item.status !== undefined"><ArrowRight /></el-icon>
      </div>
      <div class="stat-card card-content action-card" @click="reportVisible = true; loadQualityReport('week')">
        <div class="stat-icon" :style="{ backgroundColor: '#722ed1' + '15', color: '#722ed1' }">
          <el-icon :size="22"><DataAnalysis /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-count" style="color: #722ed1">质检</div>
          <div class="stat-label">查看质检报告</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="标题/审核单号" clearable style="width: 220px"
            @keyup.enter="handleSearch" @input="debouncedSearch" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="queryParams.category" placeholder="全部分类" clearable style="width: 140px" @change="handleSearch">
            <el-option v-for="opt in categoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="queryParams.auditStatus" placeholder="全部状态" clearable style="width: 130px" @change="handleSearch">
            <el-option v-for="opt in auditStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="queryParams.riskLevel" placeholder="全部" clearable style="width: 120px" @change="handleSearch">
            <el-option v-for="opt in riskOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="queryParams.priority" placeholder="全部" clearable style="width: 110px" @change="handleSearch">
            <el-option v-for="opt in priorityOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="归档">
          <el-select v-model="queryParams.isArchived" placeholder="全部" clearable style="width: 110px" @change="handleSearch">
            <el-option label="仅归档" :value="true" /><el-option label="排除归档" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch" :loading="listLoading">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          <el-button :icon="Refresh" @click="loadData" :loading="listLoading">刷新</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="batch-toolbar card-content">
      <div class="toolbar-left">
        <span class="selected-info">已选择 <b>{{ selectedRows.length }}</b> 项</span>
        <el-divider direction="vertical" />
        <el-tooltip content="局部刷新所选数据" placement="top">
          <el-button :icon="Refresh" size="small" :disabled="selectedRows.length === 0" @click="throttledRefresh">局部刷新</el-button>
        </el-tooltip>
      </div>
      <div class="toolbar-right">
        <el-button type="success" :icon="CircleCheck" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="handleQuickApproveSelected">批量通过</el-button>
        <el-button type="danger" :icon="CircleClose" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="openBatchRejectDialog">批量驳回</el-button>
        <el-button type="warning" :icon="Clock" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting || isAuditor"
          @click="() => handleBatchAction('pending')">批量待定</el-button>
        <el-button type="primary" :icon="Lightning" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting || isAuditor"
          @click="() => handleBatchAction('urgent', { priority: 1 })">批量加急</el-button>
        <el-button :icon="Folder" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting || isAuditor"
          @click="() => handleBatchAction('archive')">批量归档</el-button>
      </div>
    </div>

    <div class="table-wrapper card-content">
      <el-table v-loading="listLoading" :data="listData" stripe border style="width: 100%"
        @selection-change="handleSelectionChange"
        :header-cell-style="{ background: '#fafafa', fontWeight: 600 }">
        <el-table-column type="selection" :width="columnWidths.selection" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="contentId" label="ID" :width="columnWidths.id" align="center" />
        <el-table-column label="内容信息" :min-width="columnWidths.info">
          <template #default="{ row }">
            <div class="content-info-cell">
              <el-image v-if="row.coverImage" :src="row.coverImage" fit="cover" class="content-thumb" lazy
                :preview-src-list="[row.coverImage]">
                <template #error>
                  <div class="thumb-placeholder"><el-icon :size="20"><Picture /></el-icon></div>
                </template>
              </el-image>
              <div class="content-text">
                <div class="content-title-row">
                  <el-tooltip :content="row.contentTitle" placement="top" :show-after="500">
                    <span class="content-title text-ellipsis">{{ row.contentTitle }}</span>
                  </el-tooltip>
                  <el-tag v-if="row.reviewLevel >= 2" size="small"
                    :type="row.reviewLevel === 3 ? 'danger' : 'warning'" effect="dark"
                    style="margin-left: 6px; flex-shrink: 0">
                    {{ getEnumLabel(AUDIT_REVIEW_LEVEL, row.reviewLevel) }}
                  </el-tag>
                </div>
                <div class="content-meta">
                  <el-tooltip :content="`任务ID: ${row.taskId}`" placement="bottom" :show-after="600">
                    <span class="meta-item"><el-icon><Tickets /></el-icon> {{ row.taskId }}</span>
                  </el-tooltip>
                  <span class="meta-item" v-if="row.videoDuration"><el-icon><VideoPlay /></el-icon> {{ formatDuration(row.videoDuration) }}</span>
                  <span class="meta-item" v-if="row.creatorName"><el-icon><User /></el-icon> {{ row.creatorName }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" :width="columnWidths.category" align="center">
          <template #default="{ row }"><el-tag size="small">{{ getEnumLabel(CONTENT_CATEGORY, row.category) }}</el-tag></template>
        </el-table-column>
        <el-table-column label="风险" :width="columnWidths.risk" align="center">
          <template #default="{ row }">
            <el-tag v-if="getRiskTag(row.riskLevel)" size="small" effect="dark" :type="getRiskTag(row.riskLevel)?.type">
              <el-icon style="vertical-align: -2px"><Warning /></el-icon>
              {{ getEnumLabel(RISK_LEVEL, row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="优先级" :width="columnWidths.priority" align="center">
          <template #default="{ row }">
            <el-tag v-if="getPriorityTag(row.priority)" size="small" :type="getPriorityTag(row.priority)?.type">
              {{ getEnumLabel(AUDIT_TASK_PRIORITY, row.priority) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" :width="columnWidths.status" align="center">
          <template #default="{ row }">
            <el-tag :type="getEnumItem(CONTENT_AUDIT_STATUS, row.auditStatus)?.type || 'info'" size="small">
              {{ getEnumLabel(CONTENT_AUDIT_STATUS, row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核员" :width="columnWidths.reviewer" align="center">
          <template #default="{ row }">
            <span v-if="row.assignedName" class="reviewer-name">
              <el-avatar :size="22" style="vertical-align: -6px; margin-right: 4px">{{ (row.assignedName || '?').slice(0, 1) }}</el-avatar>
              {{ row.assignedName }}
            </span>
            <span v-else class="text-placeholder">待分配</span>
          </template>
        </el-table-column>
        <el-table-column label="截止" :width="columnWidths.deadline" align="center">
          <template #default="{ row }">
            <el-tooltip :content="row.deadline ? formatDate(row.deadline) : '无截止时间'" placement="top" :show-after="400">
              <span :class="['deadline-text', { overdue: row.deadline && new Date(row.deadline) < new Date() }]">
                {{ row.deadline ? formatDate(row.deadline, 'MM-DD HH:mm') : '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="提交" :width="columnWidths.submitTime" align="center">
          <template #default="{ row }">
            <el-tooltip :content="formatDate(row.submittedAt)" placement="top" :show-after="400">
              {{ row.submittedAt ? formatDate(row.submittedAt, 'MM-DD HH:mm') : '-' }}
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" :width="columnWidths.actions" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button type="primary" link size="small" :icon="View" @click="openPreview(row)">预览</el-button>
              <el-button type="info" link size="small" :icon="DataBoard" @click="openDetail(row)">详情</el-button>
              <el-button type="warning" link size="small" :icon="Tickets" @click="openTrace(row)">溯源</el-button>
              <el-button type="success" link size="small" :icon="CircleCheck"
                :class="['btn-offset', { 'is-offset': submitBtnStates[`approve-${row.contentId}`]?.offset, 'is-disabled': submitBtnStates[`approve-${row.contentId}`]?.disabled }]"
                :disabled="submitBtnStates[`approve-${row.contentId}`]?.disabled || row.auditStatus === 2 || row.auditStatus === 4"
                @click="handleApproveDirect(row)">通过</el-button>
              <el-button type="primary" link size="small" :icon="Checked"
                :disabled="row.auditStatus === 2 || row.auditStatus === 4"
                @click="() => { currentContentId = row.contentId; openAuditDialog(row, 2) }">审核</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-tip">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
            <p>暂无审核任务数据</p>
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

    <el-dialog v-model="previewVisible" title="内容预览" width="780px" destroy-on-close>
      <div v-loading="detailLoading && !currentDetail">
        <template v-if="currentContentId !== null">
          <QyContentPreview
            v-if="listData.find(r => r.contentId === currentContentId)"
            :id="currentContentId"
            :title="(listData.find(r => r.contentId === currentContentId)?.contentTitle) || ''"
            :cover-image="listData.find(r => r.contentId === currentContentId)?.coverImage"
            :category="listData.find(r => r.contentId === currentContentId)?.category || 1"
            :audit-status="listData.find(r => r.contentId === currentContentId)?.auditStatus || 0"
          />
        </template>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="success" :icon="CircleCheck" :disabled="currentContentId === null"
          @click="() => { const r = listData.find(x => x.contentId === currentContentId); if (r) { previewVisible = false; handleApproveDirect(r) } }">审核通过</el-button>
        <el-button type="primary" :icon="Checked" :disabled="currentContentId === null"
          @click="() => { const r = listData.find(x => x.contentId === currentContentId); if (r) { previewVisible = false; openAuditDialog(r, 2) } }">审核处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="审核详情" width="960px" destroy-on-close>
      <div v-if="detailLoading" class="skeleton-wrapper">
        <el-skeleton :rows="5" animated /><el-divider /><el-skeleton :rows="4" animated />
        <el-divider /><el-skeleton :rows="6" animated />
      </div>
      <div v-else-if="currentDetail" class="detail-content">
        <el-alert v-if="!currentDetail.completeness.isComplete" type="error" :closable="false" show-icon class="mb-16">
          <template #title>
            <b>信息不完整，无法发起审核</b>
            <div class="missing-list mt-8">
              缺失字段:
              <el-tag v-for="(f, i) in missingFieldLabels" :key="i" size="small" type="danger" effect="plain"
                style="margin-right: 6px; margin-top: 4px">{{ f }}</el-tag>
            </div>
          </template>
        </el-alert>
        <el-alert v-else-if="currentDetail.riskInfo.requiresMultiLevelReview" type="warning" :closable="false" show-icon class="mb-16">
          <template #title><b>⚠️ 高风险内容 - 需多级复核 (Lv.{{ currentDetail.riskInfo.reviewLevel }})</b></template>
        </el-alert>
        <el-alert v-if="duplicateCheck?.isDuplicate" type="error" :closable="false" show-icon class="mb-16">
          <template #title>
            <b>检测到重复提交：{{ duplicateCheck.recentAuditRecords?.[0]?.result }} by {{ duplicateCheck.recentAuditRecords?.[0]?.auditorName }}</b>
          </template>
        </el-alert>

        <el-row :gutter="16">
          <el-col :span="15">
            <div class="detail-section">
              <div class="section-title"><el-icon><Film /></el-icon> 基础信息</div>
              <div class="info-card">
                <div class="info-header">
                  <el-image v-if="currentDetail.basicInfo.coverImage" :src="currentDetail.basicInfo.coverImage"
                    fit="cover" class="info-cover" :preview-src-list="[currentDetail.basicInfo.coverImage]">
                    <template #error><div class="cover-error"><el-icon :size="30"><Picture /></el-icon></div></template>
                  </el-image>
                  <div class="info-title-area">
                    <h3 class="info-title">{{ currentDetail.basicInfo.title }}</h3>
                    <div class="info-tags">
                      <el-tag size="small">{{ getEnumLabel(CONTENT_CATEGORY, currentDetail.basicInfo.category) }}</el-tag>
                      <el-tag size="small" type="info" effect="plain" v-if="currentDetail.basicInfo.duration">
                        时长: {{ formatDuration(currentDetail.basicInfo.duration) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
                <el-descriptions :column="2" size="small" border class="mt-16">
                  <el-descriptions-item label="导演">{{ currentDetail.basicInfo.director || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="演员">{{ currentDetail.basicInfo.actors || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="年份">{{ currentDetail.basicInfo.releaseYear || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="地区/语言">
                    {{ [currentDetail.basicInfo.area, currentDetail.basicInfo.language].filter(Boolean).join(' / ') || '-' }}
                  </el-descriptions-item>
                  <el-descriptions-item label="标签" :span="2">
                    <el-tag v-for="(t, i) in (currentDetail.basicInfo.tags || [])" :key="i" size="small"
                      style="margin-right: 6px; margin-bottom: 4px">{{ t }}</el-tag>
                    <span v-if="!currentDetail.basicInfo.tags?.length">-</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="简介" :span="2">
                    <div style="max-height: 80px; overflow-y: auto; line-height: 1.6">
                      {{ currentDetail.basicInfo.description || '-' }}
                    </div>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-col>
          <el-col :span="9">
            <div class="detail-section">
              <div class="section-title"><el-icon><WarningFilled /></el-icon> 风险评估</div>
              <div class="info-card risk-card">
                <div class="risk-score-row">
                  <div class="risk-score-circle" :style="{ borderColor: getRiskTag(currentDetail.riskInfo.riskLevel)?.color }">
                    <div class="score-num" :style="{ color: getRiskTag(currentDetail.riskInfo.riskLevel)?.color }">
                      {{ currentDetail.riskInfo.riskScore }}
                    </div>
                    <div class="score-label">风险分</div>
                  </div>
                  <div class="risk-side">
                    <el-tag effect="dark" :type="getRiskTag(currentDetail.riskInfo.riskLevel)?.type" size="large">
                      {{ getEnumLabel(RISK_LEVEL, currentDetail.riskInfo.riskLevel) }}
                    </el-tag>
                    <div class="review-level-info mt-8">
                      <span>复核：</span>
                      <el-tag v-for="lvl in [1, 2, 3]" :key="lvl" size="small"
                        :type="lvl <= currentDetail.riskInfo.reviewLevel ? (getEnumItem(AUDIT_REVIEW_LEVEL, lvl)?.type as any) : 'info'"
                        :effect="lvl <= currentDetail.riskInfo.reviewLevel ? 'dark' : 'plain'"
                        style="margin-right: 4px">{{ getEnumLabel(AUDIT_REVIEW_LEVEL, lvl) }}</el-tag>
                    </div>
                  </div>
                </div>
                <div v-if="currentDetail.riskInfo.autoDetectedIssues.length > 0" class="risk-issues mt-12">
                  <div class="issues-label">自动检测：</div>
                  <div class="issues-list">
                    <el-tag v-for="(issue, i) in currentDetail.riskInfo.autoDetectedIssues" :key="i"
                      type="danger" effect="plain" size="small"
                      style="margin-right: 6px; margin-bottom: 4px">
                      <el-icon><Warning /></el-icon> {{ issue }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
            <div class="detail-section">
              <div class="section-title"><el-icon><Document /></el-icon> 版权信息</div>
              <div class="info-card">
                <template v-if="currentDetail.copyrightInfo.exists">
                  <el-descriptions :column="1" size="small" border>
                    <el-descriptions-item label="版权名称">
                      <span class="text-primary">{{ currentDetail.copyrightInfo.name }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="有效期">
                      {{ currentDetail.copyrightInfo.startDate ? formatDate(currentDetail.copyrightInfo.startDate, 'YYYY-MM-DD') : '-' }}
                      ~ {{ currentDetail.copyrightInfo.endDate ? formatDate(currentDetail.copyrightInfo.endDate, 'YYYY-MM-DD') : '-' }}
                    </el-descriptions-item>
                  </el-descriptions>
                </template>
                <template v-else><el-empty description="未关联版权信息" :image-size="60" /></template>
              </div>
            </div>
            <div class="detail-section">
              <div class="section-title"><el-icon><UserFilled /></el-icon> 分配信息</div>
              <div class="info-card">
                <div class="assign-preview" v-if="assignPreview">
                  <div class="assign-row"><span class="assign-label">任务：</span><b>{{ currentDetail.assignInfo.taskId }}</b></div>
                  <div class="assign-row mt-4">
                    <span class="assign-label">审核员：</span>
                    <div class="assign-reviewer">
                      <el-avatar :size="28">{{ (assignPreview.reviewerName || '?').slice(0, 1) }}</el-avatar>
                      <div class="reviewer-info">
                        <div class="reviewer-name">{{ assignPreview.reviewerName }}</div>
                        <div class="reviewer-meta">
                          匹配度 <el-tag size="small" type="success">{{ assignPreview.matchScore }}%</el-tag>
                          <span class="workload-text">{{ assignPreview.currentWorkload }}个任务</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="match-reasons mt-8">
                    <div v-for="(r, i) in assignPreview.matchReasons" :key="i" class="match-reason-item">
                      <el-icon color="#67C23A"><CircleCheckFilled /></el-icon> {{ r }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="detail-section mt-16">
          <div class="section-title"><el-icon><History /></el-icon> 历史审核记录</div>
          <div class="info-card">
            <el-table :data="currentDetail.assignInfo.reviewHistory || []" size="small" stripe style="width: 100%">
              <el-table-column label="单号" width="180">
                <template #default="{ row }">
                  <el-tooltip :content="row.auditNo" placement="top"><span class="mono-text">{{ row.auditNo || '-' }}</span></el-tooltip>
                </template>
              </el-table-column>
              <el-table-column label="级别" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getEnumItem(AUDIT_REVIEW_LEVEL, row.reviewLevel)?.type">
                    {{ getEnumLabel(AUDIT_REVIEW_LEVEL, row.reviewLevel) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="结果" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getEnumItem(CONTENT_AUDIT_STATUS, row.auditStatus)?.type || 'info'" size="small">
                    {{ getEnumLabel(CONTENT_AUDIT_STATUS, row.auditStatus) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="审核人" width="110">
                <template #default="{ row }">{{ row.auditorName || '系统' }}</template>
              </el-table-column>
              <el-table-column label="驳回原因">
                <template #default="{ row }">
                  <template v-if="row.rejectReasonCategory || row.rejectReasonDetail">
                    <el-tooltip placement="top" :show-after="500">
                      <template #content>
                        <div style="max-width: 360px; line-height: 1.6">
                          <div v-if="row.rejectReasonCategory">分类：{{ row.rejectReasonCategory }}</div>
                          <div v-if="row.rejectReasonDetail">详情：{{ row.rejectReasonDetail }}</div>
                        </div>
                      </template>
                      <span class="reject-text">
                        {{ (row.rejectReasonDetail || row.rejectReasonCategory || '').slice(0, 30) }}{{ (row.rejectReasonDetail || '').length > 30 ? '...' : '' }}
                      </span>
                    </el-tooltip>
                  </template>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="170">
                <template #default="{ row }">{{ formatDate(row.auditTime) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" :icon="Checked" :disabled="!canStartCurrentAudit"
          @click="() => { if (currentContentId !== null) { const r = listData.find(x => x.contentId === currentContentId); if (r) { detailVisible = false; openAuditDialog(r) } } }">
          {{ !canStartCurrentAudit ? '信息不完整' : '发起审核' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="auditDialogVisible" title="审核处理" width="620px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="auditFormRef" :model="auditFormData" :rules="auditFormRules" label-width="100px" @submit.prevent>
        <el-alert v-if="duplicateCheck?.isDuplicate && currentContentId !== null" type="error" :closable="false" show-icon class="mb-16">
          <template #title>
            <b>警告：5分钟内有重复审核记录</b>
            <div class="mt-4" style="font-size: 12px; color: #606266">
              最近：{{ duplicateCheck.recentAuditRecords?.[0]?.auditTime ? formatDate(duplicateCheck.recentAuditRecords[0].auditTime) : '' }}
              {{ duplicateCheck.recentAuditRecords?.[0]?.auditorName }} - {{ duplicateCheck.recentAuditRecords?.[0]?.result }}
            </div>
          </template>
        </el-alert>
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditFormData.auditStatus" class="result-radio-group">
            <el-radio-button :value="2"><el-icon color="#67C23A"><CircleCheck /></el-icon><span>通过</span></el-radio-button>
            <el-radio-button :value="5"><el-icon color="#E6A23C"><Clock /></el-icon><span>待定</span></el-radio-button>
            <el-radio-button :value="3"><el-icon color="#F56C6C"><CircleClose /></el-icon><span>驳回</span></el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核级别" v-if="currentDetail?.riskInfo.requiresMultiLevelReview || auditFormData.auditStatus === 2">
          <el-select v-model="auditFormData.reviewLevel" style="width: 200px">
            <el-option v-for="opt in reviewLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value"
              :disabled="currentDetail?.riskInfo.requiresMultiLevelReview && opt.value < (currentDetail.riskInfo.reviewLevel || 1)" />
          </el-select>
          <div class="form-tip text-warning" v-if="currentDetail?.riskInfo.requiresMultiLevelReview">
            高风险要求至少 Lv.{{ currentDetail.riskInfo.reviewLevel }} 复核
          </div>
        </el-form-item>
        <template v-if="auditFormData.auditStatus === 3">
          <el-form-item label="驳回分类" prop="rejectReasonCategory" :class="{ 'field-shake': shakeFields.rejectCategory }">
            <el-select v-model="auditFormData.rejectReasonCategory" placeholder="请选择驳回原因分类" style="width: 100%">
              <el-option v-for="opt in rejectCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="驳回详情" prop="rejectReasonDetail" :class="{ 'field-shake': shakeFields.rejectDetail }">
            <el-input v-model="auditFormData.rejectReasonDetail" type="textarea" :rows="4"
              placeholder="请详细描述驳回原因（至少5个字符），将反馈给创作者" maxlength="500" show-word-limit />
          </el-form-item>
          <el-form-item label="快捷原因">
            <div class="quick-reject-tags">
              <el-tag v-for="(ex, i) in rejectExamples" :key="i" class="quick-tag" effect="plain"
                @click="auditFormData.rejectReasonDetail = ex; triggerShake('rejectDetail')">
                <el-icon><Plus /></el-icon> {{ ex }}
              </el-tag>
              <span v-if="rejectExamples.length === 0" class="text-placeholder" style="font-size: 12px">选择驳回分类后显示快捷标签</span>
            </div>
          </el-form-item>
        </template>
        <template v-if="auditFormData.auditStatus === 5">
          <el-alert type="info" :closable="false" show-icon class="mb-16">
            <template #title>待定内容将暂存任务池，自动设置 24 小时限时处理</template>
          </el-alert>
        </template>
        <el-form-item label="审核备注" prop="auditRemark">
          <el-input v-model="auditFormData.auditRemark" type="textarea" :rows="3" placeholder="请输入审核备注（选填）" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" :icon="Checked" :loading="submitting"
          :disabled="!canStartCurrentAudit && currentDetail !== null"
          :class="{ 'field-shake': shakeFields.auditSubmit }"
          @click="handleAuditDialogSubmit">确认提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchRejectVisible" title="批量驳回" width="580px" :close-on-click-modal="false" destroy-on-close>
      <el-alert type="warning" :closable="false" show-icon class="mb-16">
        <template #title>将对 <b>{{ selectedRows.length }}</b> 条内容执行批量驳回</template>
      </el-alert>
      <el-form ref="batchRejectFormRef" :model="batchRejectFormData" :rules="batchRejectRules" label-width="100px" @submit.prevent>
        <el-form-item label="驳回分类" prop="rejectReasonCategory" :class="{ 'field-shake': shakeFields.batchRejectCategory }">
          <el-select v-model="batchRejectFormData.rejectReasonCategory" placeholder="请选择驳回原因分类" style="width: 100%">
            <el-option v-for="opt in rejectCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="驳回详情" prop="rejectReasonDetail" :class="{ 'field-shake': shakeFields.batchRejectDetail }">
          <el-input v-model="batchRejectFormData.rejectReasonDetail" type="textarea" :rows="4"
            placeholder="请详细描述驳回原因（至少5个字符）" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="快捷原因">
          <div class="quick-reject-tags">
            <el-tag v-for="(ex, i) in rejectExamples" :key="i" class="quick-tag" effect="plain"
              @click="batchRejectFormData.rejectReasonDetail = ex; triggerShake('batchRejectDetail')">
              <el-icon><Plus /></el-icon> {{ ex }}
            </el-tag>
          </div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchRejectFormData.auditRemark" placeholder="批量驳回备注（选填）" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRejectVisible = false">取消</el-button>
        <el-button type="danger" :icon="CircleClose" :loading="batchSubmitting" @click="handleBatchRejectSubmit">确认批量驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceVisible" title="审核全流程溯源" width="820px" destroy-on-close>
      <div v-if="!auditTrace" class="skeleton-wrapper">
        <el-skeleton :rows="3" animated /><el-skeleton :rows="8" animated />
      </div>
      <div v-else class="trace-content">
        <el-descriptions :column="3" size="small" border class="mb-16">
          <el-descriptions-item label="审核单号"><el-tag type="primary" effect="plain">{{ auditTrace.auditNo }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="内容ID">{{ auditTrace.contentId }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag type="success" effect="dark">{{ auditTrace.status }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="内容标题" :span="2">{{ auditTrace.contentTitle }}</el-descriptions-item>
          <el-descriptions-item label="当前审核员">{{ auditTrace.currentReviewer }}</el-descriptions-item>
        </el-descriptions>
        <div class="section-block">
          <div class="section-title"><el-icon><Sort /></el-icon> 多级审核进度 ({{ auditTrace.currentStep }}/{{ auditTrace.totalSteps }})</div>
          <div class="review-steps">
            <div v-for="(step, i) in auditTrace.steps" :key="step.level"
              :class="['review-step', step.status, { active: i + 1 === auditTrace.currentStep }]">
              <div class="step-node">
                <div class="step-circle">
                  <el-icon v-if="step.status === 'completed'"><CircleCheckFilled /></el-icon>
                  <el-icon v-else-if="step.status === 'rejected'"><CircleCloseFilled /></el-icon>
                  <span v-else>{{ step.level }}</span>
                </div>
                <div class="step-label">{{ step.name }}</div>
              </div>
              <div class="step-detail" v-if="step.reviewer || step.remark">
                <el-tooltip :show-after="400" placement="top">
                  <template #content>
                    <div style="max-width: 280px; line-height: 1.8">
                      <div v-if="step.reviewer"><b>审核员：</b>{{ step.reviewer }}</div>
                      <div v-if="step.result"><b>结果：</b>{{ step.result }}</div>
                      <div v-if="step.time"><b>时间：</b>{{ formatDate(step.time) }}</div>
                      <div v-if="step.remark"><b>备注：</b>{{ step.remark }}</div>
                    </div>
                  </template>
                  <div>
                    <div class="reviewer-tag">{{ step.reviewer || '待处理' }} · {{ step.result || '进行中' }}</div>
                    <div class="time-tag" v-if="step.time">{{ formatDate(step.time, 'MM-DD HH:mm') }}</div>
                  </div>
                </el-tooltip>
              </div>
              <div class="step-line" v-if="i < auditTrace.steps.length - 1" />
            </div>
          </div>
        </div>
        <div class="section-block">
          <div class="section-title"><el-icon><Clock /></el-icon> 操作时间线</div>
          <el-timeline>
            <el-timeline-item v-for="(item, i) in auditTrace.timeline.slice().reverse()" :key="i"
              :type="{ '已完成': 'success', '已驳回': 'danger', '处理中': 'primary' }[item.status] || 'primary'"
              :timestamp="formatDate(item.time)" placement="top">
              <el-card shadow="never" class="timeline-card">
                <div class="timeline-header">
                  <el-tag size="small" type="primary" effect="plain">{{ item.action }}</el-tag>
                  <span class="operator-text">{{ item.operator }}</span>
                </div>
                <div class="timeline-detail">
                  {{ item.detail || '无详情' }}
                  <span class="status-badge">{{ item.status }}</span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
        <div class="section-block" v-if="auditTrace.creatorInfo">
          <div class="section-title"><el-icon><User /></el-icon> 创作者信息</div>
          <el-descriptions :column="3" size="small" border>
            <el-descriptions-item label="ID">{{ auditTrace.creatorInfo.id }}</el-descriptions-item>
            <el-descriptions-item label="名称">{{ auditTrace.creatorInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="等级">
              <el-tag>{{ getEnumLabel({ CREATOR_LEVEL: {} } as any, auditTrace.creatorInfo.level || 0) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="历史违规" :span="3">
              <span :class="auditTrace.creatorInfo.historyViolationCount > 0 ? 'text-danger' : 'text-success'">
                <b>{{ auditTrace.creatorInfo.historyViolationCount }}</b> 次
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer><el-button @click="traceVisible = false">关闭</el-button></template>
    </el-dialog>

    <el-dialog v-model="reportVisible" title="审核质检报告" width="1080px" destroy-on-close>
      <div v-if="!qualityReport" class="skeleton-wrapper">
        <el-skeleton :rows="4" animated /><el-skeleton :rows="6" animated />
      </div>
      <div v-else class="report-content">
        <div class="report-header">
          <div>
            <div class="report-title"><el-icon color="#722ed1"><DataAnalysis /></el-icon> 质检报告</div>
            <div class="report-meta">
              报告编号：<b>{{ qualityReport.reportNo }}</b> · 周期：{{ qualityReport.period }} · 生成：{{ formatDate(qualityReport.reportDate, 'YYYY-MM-DD') }}
            </div>
          </div>
          <div class="period-switcher">
            <el-radio-group :model-value="'week'" size="small">
              <el-radio-button value="today" @click="loadQualityReport('today')">今日</el-radio-button>
              <el-radio-button value="week" @click="loadQualityReport('week')">近7天</el-radio-button>
              <el-radio-button value="month" @click="loadQualityReport('month')">近30天</el-radio-button>
            </el-radio-group>
          </div>
        </div>
        <el-row :gutter="16" class="kpi-row">
          <div v-for="(k, i) in [
            { label: '总审核量', value: qualityReport.totalAudited, color: '#409EFF' },
            { label: '异常数', value: qualityReport.exceptionCount, color: '#F56C6C' },
            { label: '异常率', value: qualityReport.exceptionRate + '%', color: '#E6A23C' },
            { label: '通过率', value: qualityReport.passRate + '%', color: '#67C23A' },
          ]" :key="i" class="kpi-card" :style="{ borderTopColor: k.color }">
            <div class="kpi-label">{{ k.label }}</div>
            <div class="kpi-value" :style="{ color: k.color }">{{ formatNumber(k.value as any) }}</div>
          </div>
        </el-row>
        <div class="section-block">
          <div class="section-title"><el-icon><UserFilled /></el-icon> 审核员效率排行</div>
          <el-table :data="qualityReport.auditorStats" size="small" stripe>
            <el-table-column type="index" label="#" width="60" align="center" />
            <el-table-column prop="auditorName" label="审核员" width="120" />
            <el-table-column prop="totalCount" label="审核量" width="90" align="center" />
            <el-table-column prop="exceptionCount" label="异常数" width="90" align="center">
              <template #default="{ row }">
                <span :class="row.exceptionCount > 0 ? 'text-danger' : ''">{{ row.exceptionCount }}</span>
              </template>
            </el-table-column>
            <el-table-column label="通过率" width="110" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.approvalRate" :stroke-width="10" />
              </template>
            </el-table-column>
            <el-table-column prop="avgDuration" label="均耗时(分)" width="110" align="center" />
            <el-table-column label="效率分" width="140" align="center">
              <template #default="{ row }">
                <el-tag :type="row.efficiencyScore >= 80 ? 'success' : row.efficiencyScore >= 60 ? 'warning' : 'danger'" effect="dark" size="large">
                  {{ row.efficiencyScore }} 分
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div class="section-block">
          <div class="section-title"><el-icon><Warning /></el-icon> 异常清单 ({{ qualityReport.exceptionList.length }})</div>
          <el-table :data="qualityReport.exceptionList" size="small" stripe v-if="qualityReport.exceptionList.length > 0">
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                <el-tooltip :content="row.description" placement="top" :show-after="500">
                  <el-tag type="warning" size="small">{{ row.typeLabel }}</el-tag>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="contentId" label="内容ID" width="90" align="center" />
            <el-table-column label="审核单号" width="180">
              <template #default="{ row }"><span class="mono-text">{{ row.auditNo }}</span></template>
            </el-table-column>
            <el-table-column prop="auditorName" label="审核人" width="100" />
            <el-table-column label="详细" min-width="200">
              <template #default="{ row }">
                <el-tooltip placement="top" :show-after="500" :content="`建议：${row.suggestedAction || '无'}`">
                  <span>{{ row.description }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="发生时间" width="170">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无异常记录" />
        </div>
        <div class="section-block">
          <div class="section-title"><el-icon><Medal /></el-icon> 总结建议</div>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="✅ 优势">
              <div v-for="(s, i) in qualityReport.summary.strengths" :key="i" class="summary-item">· {{ s }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="⚠️ 不足">
              <div v-for="(s, i) in qualityReport.summary.weaknesses" :key="i" class="summary-item">· {{ s }}</div>
            </el-descriptions-item>
            <el-descriptions-item label="💡 建议">
              <div v-for="(s, i) in qualityReport.summary.suggestions" :key="i" class="summary-item">· {{ s }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer><el-button @click="reportVisible = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.audit-page-v2 { display: flex; flex-direction: column; gap: 16px; }

.audit-stat-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; }
.stat-card {
  display: flex; align-items: center; gap: 14px; padding: 18px 20px; border-left: 4px solid; cursor: pointer;
  transition: all .3s ease; border-radius: $radius-md;
  &:hover { transform: translateY(-2px); box-shadow: $shadow-base; }
  &.active { background: rgba(64, 158, 255, .06); }
  &.action-card { border-left-color: #722ed1; }
}
.stat-icon { width: 48px; height: 48px; border-radius: $radius-md; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-body { flex: 1; min-width: 0; }
.stat-count { font-size: 24px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: $font-sm; color: $text-secondary; margin-top: 4px; }
.stat-arrow { color: $text-placeholder; transition: $transition-base; }
.stat-card:hover .stat-arrow { color: $primary-color; transform: translateX(4px); }

.filter-bar .el-form { margin-bottom: 0; display: flex; flex-wrap: wrap; }

.batch-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-radius: $radius-md;
  background: linear-gradient(90deg, rgba(64, 158, 255, .03), rgba(103, 194, 58, .03));
}
.selected-info { color: $text-secondary; b { color: $primary-color; font-size: 16px; padding: 0 4px; } }
.toolbar-right { display: flex; gap: 8px; flex-wrap: wrap; }

.table-wrapper { padding: 0; .el-table { border-radius: $radius-md $radius-md 0 0; } }

.content-info-cell { display: flex; gap: 12px; align-items: center; }
.content-thumb { width: 60px; height: 80px; border-radius: $radius-sm; flex-shrink: 0; background: $bg-color; }
.thumb-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: $text-placeholder; }
.content-text { flex: 1; min-width: 0; }
.content-title-row { display: flex; align-items: center; }
.content-title { font-size: $font-base; font-weight: 500; color: $text-primary; margin-bottom: 4px; flex: 1; }
.content-meta { font-size: $font-xs; color: $text-secondary; line-height: 1.6; display: flex; flex-wrap: wrap; gap: 10px; }
.meta-item { display: inline-flex; align-items: center; gap: 3px; }
.text-ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.deadline-text { &.overdue { color: $danger-color; font-weight: 600; } }
.reviewer-name { font-size: $font-sm; }
.text-placeholder { color: $text-placeholder; }

.action-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; }

.btn-offset {
  transition: all .15s ease;
  &.is-offset { transform: translate(1px, 1px); filter: brightness(.92); }
  &.is-disabled { opacity: .5; cursor: not-allowed; }
}

.empty-tip { padding: 60px 0; text-align: center; color: $text-placeholder; p { margin-top: 12px; } }

.pagination-wrapper { padding: 16px; display: flex; justify-content: flex-end; }

.result-radio-group { display: flex; gap: 0; }
.form-tip { font-size: 12px; margin-top: 4px; }

.field-shake { animation: shake .55s cubic-bezier(.36, .07, .19, .97) both; }
@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

.quick-reject-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.quick-tag { cursor: pointer; transition: all .2s; &:hover { transform: scale(1.04); } }

.skeleton-wrapper { padding: 4px; .el-skeleton + .el-divider { margin: 16px 0; } }

.mb-16 { margin-bottom: 16px; } .mt-8 { margin-top: 8px; } .mt-12 { margin-top: 12px; } .mt-16 { margin-top: 16px; }
.text-primary { color: $primary-color; } .text-danger { color: $danger-color; } .text-success { color: $success-color; } .text-warning { color: $warning-color; }

.detail-content { display: flex; flex-direction: column; gap: 16px; }
.detail-section { .section-title { font-size: $font-md; font-weight: 600; color: $text-primary; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; } }
.info-card { background: $bg-white; border: 1px solid $border-lighter; border-radius: $radius-md; padding: 16px; }
.info-header { display: flex; gap: 16px; }
.info-cover { width: 120px; height: 160px; border-radius: $radius-sm; flex-shrink: 0; }
.cover-error { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: $bg-color; color: $text-placeholder; }
.info-title-area { flex: 1; min-width: 0; }
.info-title { font-size: $font-xl; font-weight: 600; color: $text-primary; margin: 0 0 8px; }
.info-tags { display: flex; flex-wrap: wrap; gap: 8px; }

.risk-card { background: linear-gradient(135deg, rgba(245, 108, 108, .03), rgba(230, 162, 60, .03)); }
.risk-score-row { display: flex; gap: 20px; align-items: center; }
.risk-score-circle {
  width: 90px; height: 90px; border-radius: 50%; border: 3px solid;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: $bg-white; flex-shrink: 0;
}
.score-num { font-size: 28px; font-weight: 700; line-height: 1; }
.score-label { font-size: 12px; color: $text-secondary; margin-top: 4px; }
.risk-side { flex: 1; min-width: 0; }
.review-level-info { font-size: 12px; color: $text-secondary; }
.issues-label { font-size: 12px; color: $text-secondary; margin-bottom: 6px; }
.issues-list { display: flex; flex-wrap: wrap; }
.risk-tag-item { color: #E6A23C; font-size: 12px; margin-right: 8px; }

.assign-row { display: flex; align-items: flex-start; }
.assign-label { color: $text-secondary; font-size: 13px; width: 60px; flex-shrink: 0; }
.assign-reviewer { display: flex; gap: 10px; align-items: center; flex: 1; }
.reviewer-info { flex: 1; min-width: 0; }
.reviewer-name { font-weight: 500; color: $text-primary; font-size: 14px; }
.reviewer-meta { margin-top: 4px; font-size: 12px; color: $text-secondary; display: flex; align-items: center; gap: 8px; }
.workload-text { color: #909399; }
.match-reasons { display: flex; flex-direction: column; gap: 4px; }
.match-reason-item { font-size: 12px; color: $text-secondary; display: flex; align-items: center; gap: 4px; }

.missing-list { .el-tag { animation: fadeIn .3s ease; } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

.mono-text { font-family: 'Consolas', 'Monaco', monospace; font-size: 12px; }
.reject-text { color: $text-secondary; font-size: 13px; }

.review-steps { display: flex; align-items: flex-start; justify-content: space-between; padding: 8px 0; position: relative; }
.review-step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; }
.step-node { display: flex; flex-direction: column; align-items: center; z-index: 2; }
.step-circle {
  width: 44px; height: 44px; border-radius: 50%; background: #f4f4f5; color: #909399;
  display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px;
  border: 2px solid #e4e7ed; transition: all .3s;
}
.review-step.completed .step-circle { background: #67C23A; color: white; border-color: #67C23A; }
.review-step.rejected .step-circle { background: #F56C6C; color: white; border-color: #F56C6C; }
.review-step.active .step-circle { background: #409EFF; color: white; border-color: #409EFF; box-shadow: 0 0 0 6px rgba(64, 158, 255, .15); }
.step-label { margin-top: 8px; font-size: 13px; color: $text-secondary; font-weight: 500; }
.review-step.completed .step-label { color: #67C23A; }
.review-step.rejected .step-label { color: #F56C6C; }
.review-step.active .step-label { color: #409EFF; }
.step-detail { margin-top: 10px; text-align: center; }
.reviewer-tag { font-size: 12px; color: $text-primary; font-weight: 500; }
.time-tag { font-size: 11px; color: $text-placeholder; margin-top: 2px; }
.step-line { position: absolute; top: 22px; left: 50%; width: 100%; height: 2px; background: #e4e7ed; z-index: 1; }
.review-step.completed + .review-step .step-line,
.review-step.rejected + .review-step .step-line { background: linear-gradient(90deg, #67C23A, #e4e7ed); }

.section-block { margin-top: 20px; .section-title { font-size: $font-md; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; color: $text-primary; } }

.timeline-card { border: 1px solid $border-lighter; }
.timeline-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.operator-text { font-size: 12px; color: $text-secondary; }
.timeline-detail { font-size: 13px; color: $text-primary; line-height: 1.5; }
.status-badge { margin-left: 8px; padding: 2px 8px; background: #ecf5ff; color: #409EFF; border-radius: 4px; font-size: 11px; }

.report-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.report-title { font-size: $font-xl; font-weight: 700; color: $text-primary; display: flex; align-items: center; gap: 6px; }
.report-meta { font-size: 13px; color: $text-secondary; margin-top: 4px; }
.kpi-row { margin-bottom: 16px; }
.kpi-card { padding: 16px; background: $bg-white; border-radius: $radius-md; border-top: 3px solid; box-shadow: $shadow-light; }
.kpi-label { font-size: 13px; color: $text-secondary; }
.kpi-value { font-size: 28px; font-weight: 700; line-height: 1.2; margin-top: 6px; }
.summary-item { line-height: 1.8; font-size: 13px; color: $text-primary; }
</style>

