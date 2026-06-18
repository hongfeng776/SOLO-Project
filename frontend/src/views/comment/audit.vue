<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import {
  COMMENT_AUDIT_STATUS,
  COMMENT_VIOLATION_TYPE,
  COMMENT_AUDIT_ACTION,
  USER_MUTE_LEVEL,
  COMMENT_AUDIT_SOURCE,
  BATCH_COMMENT_ACTION,
  USER_PUNISHMENT_THRESHOLD,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getCommentAuditPoolApi,
  getCommentAuditDetailApi,
  checkCommentDuplicateAuditApi,
  submitCommentAuditApi,
  batchCommentActionApi,
  getBatchProgressApi,
  refreshPartialCommentsApi,
  getCommentAuditTraceApi,
  checkCommentPunishmentConsistencyApi,
} from '@/api/comment-audit'
import type {
  CommentAuditPoolItem,
  CommentAuditDetail,
  CommentAuditSubmitData,
  CommentAuditTraceRecord,
  BatchCommentProgress,
} from '@/types'
import { formatDate, formatNumber, debounce, throttle } from '@/utils'
import { useUserStore } from '@/stores'
import {
  Search,
  RefreshLeft,
  Refresh,
  CircleCheck,
  CircleClose,
  Clock,
  View,
  DataBoard,
  Tickets,
  Document,
  WarningFilled,
  Warning,
  History,
  ArrowRight,
  Delete,
  Hide,
  Mute,
  User,
  Picture,
  Bell,
  Lock,
  Unlock,
  TrendCharts,
  Warning as WarningIcon,
  Check,
  Close,
  InfoFilled,
  SwitchButton,
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
const btnLoadingStates = reactive<Record<string, boolean>>({})
const focusStates = reactive<Record<string, boolean>>({
  violationRemark: false,
})
const shakeFields = reactive<Record<string, boolean>>({})
const batchProgressDialogVisible = ref(false)
const currentBatchProgress = ref<BatchCommentProgress | null>(null)
let batchProgressTimer: ReturnType<typeof setInterval> | null = null

const listData = ref<CommentAuditPoolItem[]>([])
const total = ref(0)
const currentDetail = ref<CommentAuditDetail | null>(null)
const duplicateCheck = ref<{ isDuplicate: boolean; lastAuditTime?: string; lastAuditor?: string } | null>(null)
const currentTrace = ref<CommentAuditTraceRecord | null>(null)
const selectedRows = ref<CommentAuditPoolItem[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  violationType: null as string | null,
  auditSource: null as string | null,
  publishTimeStart: null as string | null,
  publishTimeEnd: null as string | null,
  contentId: null as number | null,
  auditStatus: null as number | null,
  sortBy: 'createdAt',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
})

const batchTimeRange = reactive({
  startTime: null as string | null,
  endTime: null as string | null,
})

const currentCommentId = ref<number | null>(null)
const detailVisible = ref(false)
const auditDialogVisible = ref(false)
const traceVisible = ref(false)

const auditFormRef = ref<FormInstance>()
const auditFormData = reactive({
  action: 'approve' as string,
  violationType: '',
  violationRemark: '',
  muteLevel: null as number | null,
  muteDays: 0,
})

const triggerShake = (fieldName: string) => {
  shakeFields[fieldName] = true
  setTimeout(() => { shakeFields[fieldName] = false }, 600)
}

const createMismatchNotification = (deviationReason: string) => {
  ElNotification({
    type: 'warning',
    title: '处罚一致性偏差提醒',
    message: deviationReason,
    duration: 4500,
    showClose: true,
  })
}

const violationTypeOptions = computed(() => getEnumOptions(COMMENT_VIOLATION_TYPE))
const auditSourceOptions = computed(() => getEnumOptions(COMMENT_AUDIT_SOURCE))
const auditStatusOptions = computed(() => getEnumOptions(COMMENT_AUDIT_STATUS).filter(i => i.value !== 4 || isLeader.value))
const muteLevelOptions = computed(() => getEnumOptions(USER_MUTE_LEVEL))
const batchActionOptions = computed(() => getEnumOptions(BATCH_COMMENT_ACTION))

const pendingAuditCount = computed(() => listData.value.filter(r => r.auditStatus === 0).length)
const reportedCount = computed(() => listData.value.filter(r => r.auditSource === 'user_reported').length)
const lockedCount = computed(() => listData.value.filter(r => r.auditStatus === 4).length)
const overdueCount = computed(() => listData.value.filter(r => r.isOverdue).length)
const todayAuditedCount = computed(() => listData.value.filter(r => r.auditStatus !== 0 && r.auditedToday).length)

const currentDetailHasContext = computed(() => {
  if (!currentDetail.value) return false
  return currentDetail.value.hasContext !== false
})

const loadTaskPool = async () => {
  listLoading.value = true
  try {
    const params = { ...queryParams } as any
    if (queryParams.publishTimeStart) params.publishTimeStart = queryParams.publishTimeStart
    if (queryParams.publishTimeEnd) params.publishTimeEnd = queryParams.publishTimeEnd
    if (isAuditor.value) params.assignedTo = userStore.userId
    const result = await getCommentAuditPoolApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally { listLoading.value = false }
}

const loadDetail = async (commentId: number) => {
  detailLoading.value = true
  currentDetail.value = null
  duplicateCheck.value = null
  try {
    const [detail, dup] = await Promise.all([
      getCommentAuditDetailApi(commentId),
      checkCommentDuplicateAuditApi(commentId),
    ])
    currentDetail.value = detail
    duplicateCheck.value = dup

    if (!currentDetailHasContext.value) {
      await ElMessageBox.alert(
        '该评论上下文信息不完整（前后评论缺失），建议在完整上下文下进行审核以避免误判。是否继续？',
        '上下文完整性警告',
        {
          type: 'warning',
          confirmButtonText: '继续审核',
          cancelButtonText: '返回列表',
          showCancelButton: true,
        }
      ).catch(() => {
        detailVisible.value = false
        return null
      })
    }
  } finally { detailLoading.value = false }
}

const doSubmitCommentAudit = async (commentId: number, action: string) => {
  const btnKey = `${action}-${commentId}`
  if (btnLoadingStates[btnKey]) return
  btnLoadingStates[btnKey] = true

  await new Promise(r => setTimeout(r, 300))

  try {
    const submitData: CommentAuditSubmitData = {
      commentId,
      action,
      violationType: auditFormData.violationType || undefined,
      violationRemark: auditFormData.violationRemark || undefined,
      muteLevel: auditFormData.muteLevel || undefined,
      muteDays: auditFormData.muteDays || undefined,
    }

    const result = await submitCommentAuditApi(submitData)

    if (result.userViolationCount && result.userViolationCount >= USER_PUNISHMENT_THRESHOLD.MUTE_TRIGGER) {
      ElNotification({
        type: 'warning',
        title: '用户处罚触发',
        message: `该用户违规次数已达 ${result.userViolationCount} 次，已触发禁言机制`,
        duration: 4000,
      })
    }

    if (result.flowLimitTriggered) {
      ElMessage({
        type: 'warning',
        message: '检测到限流触发，后续该用户评论将进入人工复审队列',
        duration: 3500,
      })
    }

    ElMessage.success(`审核成功：${getEnumItem(COMMENT_AUDIT_ACTION as any, action)?.label || action}`)
    await loadTaskPool()
    return true
  } catch (e: any) {
    triggerShake('auditSubmit')
    ElMessage.error(e?.message || '审核提交失败')
    return false
  } finally {
    setTimeout(() => {
      btnLoadingStates[btnKey] = false
    }, 100)
  }
}

const handleBatchAction = async (action: string) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择需要操作的评论')
    return
  }

  if (!batchTimeRange.startTime || !batchTimeRange.endTime) {
    ElMessage.warning('请先设置批量操作的时间范围')
    return
  }

  if (new Date(batchTimeRange.startTime) >= new Date(batchTimeRange.endTime)) {
    ElMessage.warning('开始时间必须早于结束时间')
    return
  }

  const hasContentIdLimit = queryParams.contentId !== null
  if (!hasContentIdLimit && selectedRows.value.length > 100) {
    const confirm = await ElMessageBox.confirm(
      `当前已选择 ${selectedRows.value.length} 条评论，建议按所属内容ID缩小范围操作。是否继续？`,
      '批量操作范围提醒',
      { type: 'warning', confirmButtonText: '继续', cancelButtonText: '取消' }
    ).catch(() => null)
    if (!confirm) return
  }

  try {
    const res = await batchCommentActionApi({
      action: action as any,
      commentIds: selectedRows.value.map(r => r.commentId),
      startTime: batchTimeRange.startTime,
      endTime: batchTimeRange.endTime,
      contentId: queryParams.contentId || undefined,
    })

    batchProgressDialogVisible.value = true
    currentBatchProgress.value = {
      batchId: res.batchId,
      totalProcessed: 0,
      totalCount: res.totalProcessed,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      status: 'processing',
    }

    if (batchProgressTimer) clearInterval(batchProgressTimer)
    batchProgressTimer = setInterval(async () => {
      try {
        const progress = await getBatchProgressApi(res.batchId)
        currentBatchProgress.value = progress
        if (progress.status === 'completed' || progress.status === 'failed') {
          if (batchProgressTimer) clearInterval(batchProgressTimer)
          batchProgressTimer = null
          await loadTaskPool()
        }
      } catch {
        if (batchProgressTimer) clearInterval(batchProgressTimer)
        batchProgressTimer = null
      }
    }, 500)

  } catch (e: any) {
    ElMessage.error(e?.message || '批量操作提交失败')
  }
}

const openTrace = async (row: CommentAuditPoolItem) => {
  currentCommentId.value = row.commentId
  traceVisible.value = true
  currentTrace.value = null
  try {
    currentTrace.value = await getCommentAuditTraceApi(row.commentId)
    if (currentTrace.value.consistencyDeviations && currentTrace.value.consistencyDeviations.length > 0) {
      const deviationText = currentTrace.value.consistencyDeviations
        .map((d: any) => `${d.rule}: ${d.description}`)
        .join('<br/>')
      ElNotification({
        type: 'warning',
        title: '溯源一致性偏差',
        dangerouslyUseHTMLString: true,
        message: `检测到 ${currentTrace.value.consistencyDeviations.length} 处偏差：<br/>${deviationText}`,
        duration: 5000,
      })
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '溯源数据加载失败')
  }
}

const handleQuickAction = async (row: CommentAuditPoolItem, action: string) => {
  if (action !== 'approve' && action !== 'unlock') {
    auditFormData.action = action
    auditFormData.violationType = ''
    auditFormData.violationRemark = ''
    auditFormData.muteLevel = null
    auditFormData.muteDays = 0
    currentCommentId.value = row.commentId
    auditDialogVisible.value = true
    nextTick(() => auditFormRef.value?.clearValidate())
    return
  }
  await doSubmitCommentAudit(row.commentId, action)
}

const handleAuditDialogSubmit = async () => {
  if (!currentCommentId.value) return

  const action = auditFormData.action

  if (action === 'hide' || action === 'delete' || action === 'mute') {
    if (!auditFormData.violationType) {
      triggerShake('violationType')
      return
    }
    if (!auditFormData.violationRemark || auditFormData.violationRemark.trim().length < 5) {
      triggerShake('violationRemark')
      return
    }
  }

  if (action === 'mute') {
    if (auditFormData.muteLevel === null || auditFormData.muteLevel < 1) {
      triggerShake('muteLevel')
      return
    }
    const muteItem = getEnumItem(USER_MUTE_LEVEL, auditFormData.muteLevel)
    if (muteItem && (muteItem as any).days <= 0 && auditFormData.muteLevel !== 9) {
      triggerShake('muteLevel')
      return
    }
    auditFormData.muteDays = (muteItem as any)?.days || 0
  }

  try {
    await auditFormRef.value?.validate()
  } catch {
    triggerShake('auditSubmit')
    return
  }

  if (action === 'hide' || action === 'delete' || action === 'mute') {
    const consistency = await checkCommentPunishmentConsistencyApi({
      violationType: auditFormData.violationType,
      action,
      muteDays: auditFormData.muteDays,
    }).catch(() => null)
    if (consistency && !consistency.consistent) {
      createMismatchNotification(consistency.deviation + '，建议：' + (consistency.suggestions?.[0] || ''))
    }
  }

  submitting.value = true
  try {
    const success = await doSubmitCommentAudit(currentCommentId.value, action)
    if (success) auditDialogVisible.value = false
  } finally { submitting.value = false }
}

const handleSearch = () => { queryParams.page = 1; loadTaskPool() }
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.violationType = null
  queryParams.auditSource = null
  queryParams.publishTimeStart = null
  queryParams.publishTimeEnd = null
  queryParams.contentId = null
  queryParams.auditStatus = null
  handleSearch()
}
const handlePageChange = (p: number) => { queryParams.page = p; loadTaskPool() }
const handleSizeChange = (s: number) => { queryParams.pageSize = s; queryParams.page = 1; loadTaskPool() }
const handleSelectionChange = (rows: CommentAuditPoolItem[]) => { selectedRows.value = rows }
const handleStatClick = (type: string) => {
  switch (type) {
    case 'pending':
      queryParams.auditStatus = queryParams.auditStatus === 0 ? null : 0
      queryParams.auditSource = null
      break
    case 'reported':
      queryParams.auditSource = queryParams.auditSource === 'user_reported' ? null : 'user_reported'
      queryParams.auditStatus = null
      break
    case 'locked':
      queryParams.auditStatus = queryParams.auditStatus === 4 ? null : 4
      queryParams.auditSource = null
      break
    case 'overdue':
      queryParams.auditStatus = 0
      queryParams.auditSource = queryParams.auditSource === null ? 'new_published' : null
      break
    default:
      break
  }
  handleSearch()
}
const openDetail = async (row: CommentAuditPoolItem) => {
  currentCommentId.value = row.commentId
  detailVisible.value = true
  await loadDetail(row.commentId)
}

watch(() => auditFormData.muteLevel, (val) => {
  if (val !== null) {
    const item = getEnumItem(USER_MUTE_LEVEL, val)
    if (item) auditFormData.muteDays = (item as any).days || 0
  }
})

watch(() => auditFormData.violationType, (val) => {
  if (val && auditFormData.action === 'mute') {
    const vItem = getEnumItem(COMMENT_VIOLATION_TYPE as any, val)
    if (vItem && (vItem as any).defaultMuteDays) {
      const days = (vItem as any).defaultMuteDays
      const levelItem = Object.values(USER_MUTE_LEVEL).find((m: any) => m.days === days)
      if (levelItem) auditFormData.muteLevel = (levelItem as any).value
    }
  }
})

const auditFormRules: FormRules = {
  violationType: [{
    validator: (_r: any, v: string, cb: any) => {
      if ((auditFormData.action === 'hide' || auditFormData.action === 'delete' || auditFormData.action === 'mute') && !v) {
        cb(new Error('请选择违规类型'))
      } else cb()
    }, trigger: 'change',
  }],
  violationRemark: [
    { validator: (_r: any, v: string, cb: any) => {
      if ((auditFormData.action === 'hide' || auditFormData.action === 'delete' || auditFormData.action === 'mute')
        && (!v || v.trim().length < 5)) {
        cb(new Error('违规原因至少5个字符'))
      } else cb()
    }, trigger: 'blur' },
    { max: 500, message: '不超过500字', trigger: 'blur' },
  ],
  muteLevel: [{
    validator: (_r: any, v: number, cb: any) => {
      if (auditFormData.action === 'mute' && (v === null || v < 1)) {
        cb(new Error('请选择禁言等级'))
      } else cb()
    }, trigger: 'change',
  }],
}

const debouncedSearch = debounce(handleSearch, 400)
const throttledRefresh = throttle(() => {
  const ids = selectedRows.value.map(r => r.commentId)
  if (ids.length === 0) return
  listLoading.value = true
  refreshPartialCommentsApi(ids).then(res => {
    for (const item of res.updatedItems) {
      const idx = listData.value.findIndex(r => r.commentId === item.commentId)
      if (idx >= 0) listData.value[idx] = item
    }
    ElMessage.success(`已刷新 ${res.updatedItems.length} 条数据`)
  }).finally(() => { listLoading.value = false })
}, 5000)

const getViolationLevel = (type: string) => {
  const item = getEnumItem(COMMENT_VIOLATION_TYPE as any, type)
  return item ? (item as any).level : 0
}

const getAuditSourceColor = (source: string) => {
  const item = getEnumItem(COMMENT_AUDIT_SOURCE as any, source)
  return item ? (item as any).color : '#909399'
}

onMounted(() => { loadTaskPool() })
</script>

<template>
  <div class="comment-audit-page btn-custom-radius">
    <div class="audit-stat-bar">
      <div v-for="item in [
        { label: '待审核', count: pendingAuditCount, type: 'pending', color: '#E6A23C', icon: Clock },
        { label: '用户举报', count: reportedCount, type: 'reported', color: '#F56C6C', icon: Bell },
        { label: '高危锁定', count: lockedCount, type: 'locked', color: '#C0392B', icon: Lock },
        { label: '审核超时', count: overdueCount, type: 'overdue', color: '#722ed1', icon: WarningFilled },
        { label: '今日已审', count: todayAuditedCount, type: 'audited', color: '#67C23A', icon: CircleCheck },
      ]" :key="item.label" class="stat-card card-content"
        :class="{ active: (item.type === 'pending' && queryParams.auditStatus === 0)
          || (item.type === 'reported' && queryParams.auditSource === 'user_reported')
          || (item.type === 'locked' && queryParams.auditStatus === 4)
          || (item.type === 'overdue' && queryParams.auditSource === 'new_published' && queryParams.auditStatus === 0) }"
        :style="{ borderLeftColor: item.color }"
        @click="handleStatClick(item.type)">
        <div class="stat-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-count" :style="{ color: item.color }">{{ formatNumber(item.count) }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
        <el-icon class="stat-arrow" v-if="item.type !== 'audited'"><ArrowRight /></el-icon>
      </div>
    </div>

    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="评论内容/ID/用户" clearable style="width: 220px"
            @keyup.enter="handleSearch" @input="debouncedSearch" />
        </el-form-item>
        <el-form-item label="违规类型">
          <el-select v-model="queryParams.violationType" placeholder="全部类型" clearable style="width: 150px" @change="handleSearch">
            <el-option v-for="opt in violationTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核来源">
          <el-select v-model="queryParams.auditSource" placeholder="全部来源" clearable style="width: 150px" @change="handleSearch">
            <el-option v-for="opt in auditSourceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="queryParams.publishTimeStart"
            type="datetime"
            placeholder="开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 180px"
            @change="handleSearch"
          />
          <span style="margin: 0 6px">-</span>
          <el-date-picker
            v-model="queryParams.publishTimeEnd"
            type="datetime"
            placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 180px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item label="内容ID">
          <el-input-number v-model="queryParams.contentId" :min="1" placeholder="所属内容ID" clearable style="width: 140px" @change="handleSearch" />
        </el-form-item>
        <el-form-item label="评论状态">
          <el-select v-model="queryParams.auditStatus" placeholder="全部状态" clearable style="width: 130px" @change="handleSearch">
            <el-option v-for="opt in auditStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
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
        <span class="selected-info">已选择 <b>{{ formatNumber(selectedRows.length) }}</b> 项</span>
        <el-divider direction="vertical" />
        <span class="time-range-info">
          <el-icon color="#409EFF"><Clock /></el-icon>
          操作范围：
          <el-date-picker
            v-model="batchTimeRange.startTime"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 130px; margin-left: 6px"
            size="small"
          />
          <span style="margin: 0 4px">-</span>
          <el-date-picker
            v-model="batchTimeRange.endTime"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 130px"
            size="small"
          />
        </span>
        <el-tooltip content="局部刷新（5s节流）" placement="top">
          <el-button :icon="Refresh" size="small" :disabled="selectedRows.length === 0" @click="throttledRefresh">局部刷新</el-button>
        </el-tooltip>
      </div>
      <div class="toolbar-right">
        <el-button type="danger" :icon="Delete" size="small"
          :disabled="selectedRows.length === 0"
          @click="() => handleBatchAction('clean_history')">
          批量清理历史违规
        </el-button>
        <el-button type="success" :icon="CircleCheck" size="small"
          :disabled="selectedRows.length === 0"
          @click="() => handleBatchAction('approve_compliant')">
          批量放行合规待审
        </el-button>
        <el-button type="warning" :icon="Warning" size="small"
          :disabled="selectedRows.length === 0"
          @click="() => handleBatchAction('mark_suspected')">
          批量标记疑似风险
        </el-button>
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
        :row-class-name="({ row }) => {
          let cls = ''
          if (row.auditStatus === queryParams.auditStatus) cls += ' row--current'
          if ((row.$index || 0) % 2 === 1) cls += ' row--zebra'
          return cls.trim()
        }"
        @selection-change="handleSelectionChange"
        :header-cell-class-name="'sticky-header-th'"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="评论ID" prop="commentId" width="110" align="center" fixed="left">
          <template #default="{ row }">
            <el-tooltip :content="`ID: ${row.commentId}`" placement="top" :show-after="400">
              <span class="mono-text comment-id-text">{{ formatNumber(row.commentId) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="所属内容" min-width="200">
          <template #default="{ row }">
            <el-tooltip placement="top" :show-after="500">
              <template #content>
                <div style="max-width: 280px; line-height: 1.6">
                  <div><b>标题：</b>{{ row.contentTitle || '-' }}</div>
                  <div><b>分类：</b>{{ row.contentCategory || '-' }}</div>
                  <div v-if="row.contentId"><b>内容ID：</b>{{ formatNumber(row.contentId) }}</div>
                </div>
              </template>
              <div class="content-cell">
                <span class="content-title text-ellipsis">{{ row.contentTitle || '未知内容' }}</span>
                <el-tag v-if="row.contentCategory" size="small" type="info" effect="plain" class="content-tag">
                  {{ row.contentCategory }}
                </el-tag>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="用户信息" width="180">
          <template #default="{ row }">
            <div class="user-info-cell">
              <el-avatar :size="28" :src="row.userAvatar || ''">
                {{ (row.userName || '?').slice(0, 1) }}
              </el-avatar>
              <div class="user-info-text">
                <div class="user-name">
                  {{ row.userName }}
                  <el-tag
                    v-if="row.userViolationCount && row.userViolationCount > 0"
                    size="small"
                    class="violation-badge"
                    :class="{
                      'violation-badge--low': row.userViolationCount < 2,
                      'violation-badge--mid': row.userViolationCount === 2,
                      'violation-badge--high': row.userViolationCount >= 3,
                    }"
                  >
                    {{ formatNumber(row.userViolationCount) }}次
                  </el-tag>
                </div>
                <div class="user-id text-placeholder" v-if="row.userId">UID: {{ formatNumber(row.userId) }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评论预览" min-width="260">
          <template #default="{ row }">
            <div class="comment-preview text-ellipsis" :class="{ 'sensitive-highlight': row.hasSensitiveWord }">
              <template v-if="row.sensitiveRanges && row.sensitiveRanges.length > 0">
                <template v-for="(seg, i) in buildHighlightSegments(row.content, row.sensitiveRanges)" :key="i">
                  <span v-if="!seg.highlight">{{ seg.text }}</span>
                  <mark v-else class="danger-highlight">{{ seg.text }}</mark>
                </template>
              </template>
              <template v-else>{{ row.content }}</template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核来源" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="dark"
              :style="{
                backgroundColor: getAuditSourceColor(row.auditSource) + '20',
                borderColor: getAuditSourceColor(row.auditSource),
                color: getAuditSourceColor(row.auditSource),
              }"
            >
              {{ getEnumLabel(COMMENT_AUDIT_SOURCE as any, row.auditSource) || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="违规等级" width="100" align="center">
          <template #default="{ row }">
            <template v-if="row.violationType">
              <div class="violation-level-cell" :class="{ 'risk-high-glow': getViolationLevel(row.violationType) >= 3 }">
                <el-tag
                  size="small"
                  effect="dark"
                  :type="getViolationLevel(row.violationType) >= 3 ? 'danger' : getViolationLevel(row.violationType) === 2 ? 'warning' : 'info'"
                >
                  <el-icon style="vertical-align: -2px"><WarningIcon /></el-icon>
                  Lv.{{ getViolationLevel(row.violationType) }}
                </el-tag>
              </div>
            </template>
            <span v-else class="text-placeholder">-</span>
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag
                v-if="row.auditStatus === 4"
                size="small"
                effect="dark"
                type="danger"
                class="locked-tag"
              >
                <el-icon style="vertical-align: -2px"><Lock /></el-icon>
                {{ getEnumLabel(COMMENT_AUDIT_STATUS, row.auditStatus) }}
              </el-tag>
              <el-tag
                v-else
                :type="getEnumItem(COMMENT_AUDIT_STATUS, row.auditStatus)?.type || 'info'"
                size="small"
                effect="dark"
              >
                {{ getEnumLabel(COMMENT_AUDIT_STATUS, row.auditStatus) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="点赞" width="90" align="center">
          <template #default="{ row }">{{ formatNumber(row.likeCount || 0) }}</template>
        </el-table-column>
        <el-table-column label="发布时间" width="160" align="center">
          <template #default="{ row }">
            <el-tooltip :content="formatDate(row.createdAt)" placement="top" :show-after="400">
              <span :class="['time-text', { overdue: row.isOverdue }]">
                {{ row.createdAt ? formatDate(row.createdAt, 'MM-DD HH:mm') : '-' }}
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <template v-if="row.auditStatus === 0">
                <el-button
                  type="success" link size="small" :icon="CircleCheck"
                  :v-loading="btnLoadingStates[`approve-${row.commentId}`]"
                  @click="handleQuickAction(row, 'approve')"
                >放行</el-button>
                <el-button
                  type="warning" link size="small" :icon="Hide"
                  :v-loading="btnLoadingStates[`hide-${row.commentId}`]"
                  @click="handleQuickAction(row, 'hide')"
                >屏蔽</el-button>
                <el-button
                  type="danger" link size="small" :icon="Delete"
                  :v-loading="btnLoadingStates[`delete-${row.commentId}`]"
                  @click="handleQuickAction(row, 'delete')"
                >删除</el-button>
                <el-button
                  type="danger" link size="small" :icon="Mute"
                  :v-loading="btnLoadingStates[`mute-${row.commentId}`]"
                  @click="handleQuickAction(row, 'mute')"
                >禁言</el-button>
              </template>
              <template v-else-if="row.auditStatus === 1">
                <el-button
                  type="warning" link size="small" :icon="Hide"
                  :v-loading="btnLoadingStates[`hide-${row.commentId}`]"
                  @click="handleQuickAction(row, 'hide')"
                >屏蔽</el-button>
                <el-button
                  type="danger" link size="small" :icon="Delete"
                  :v-loading="btnLoadingStates[`delete-${row.commentId}`]"
                  @click="handleQuickAction(row, 'delete')"
                >删除</el-button>
              </template>
              <template v-else-if="row.auditStatus === 4">
                <el-button
                  type="primary" link size="small" :icon="Unlock"
                  :v-loading="btnLoadingStates[`unlock-${row.commentId}`]"
                  @click="handleQuickAction(row, 'unlock')"
                >解禁</el-button>
                <el-button
                  type="danger" link size="small" :icon="Delete"
                  :v-loading="btnLoadingStates[`delete-${row.commentId}`]"
                  @click="handleQuickAction(row, 'delete')"
                >删除</el-button>
              </template>
              <el-button type="info" link size="small" :icon="DataBoard" @click="openDetail(row)">详情</el-button>
              <el-button type="warning" link size="small" :icon="Tickets" @click="openTrace(row)">溯源</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-tip">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
            <p>暂无评论审核任务</p>
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

    <transition name="dialog-zoom">
      <el-dialog v-model="detailVisible" title="评论审核详情" width="1080px" destroy-on-close top="4vh">
        <div v-if="detailLoading" class="skeleton-wrapper">
          <el-skeleton :rows="3" animated /><el-divider />
          <el-skeleton :rows="5" animated /><el-divider />
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else-if="currentDetail" class="detail-content">
          <el-alert v-if="!currentDetailHasContext" type="warning" :closable="false" show-icon class="mb-16">
            <template #title><b>上下文信息缺失 - 前后评论不完整，可能导致误判</b></template>
          </el-alert>
          <el-alert v-if="duplicateCheck?.isDuplicate" type="error" :closable="false" show-icon class="mb-16">
            <template #title>
              <b>重复审核提醒：最近由 {{ duplicateCheck.lastAuditor || '未知' }} 处理</b>
              <div class="mt-4" style="font-size: 12px; color: #606266">
                {{ duplicateCheck.lastAuditTime ? formatDate(duplicateCheck.lastAuditTime) : '' }}
              </div>
            </template>
          </el-alert>

          <el-row :gutter="16">
            <el-col :span="7">
              <div class="detail-section">
                <div class="section-title"><el-icon><Picture /></el-icon> 所属内容</div>
                <div class="info-card">
                  <div class="content-info-card">
                    <div class="content-title-row">
                      <h4 class="content-card-title text-ellipsis">{{ currentDetail.contentTitle || '未知内容' }}</h4>
                    </div>
                    <el-descriptions :column="1" size="small" border class="mt-12">
                      <el-descriptions-item label="内容状态">
                        <el-tag :type="currentDetail.contentStatus === 'normal' ? 'success' : 'info'" size="small">
                          {{ currentDetail.contentStatus === 'normal' ? '正常' : currentDetail.contentStatus || '-' }}
                        </el-tag>
                      </el-descriptions-item>
                      <el-descriptions-item label="作者">
                        <el-avatar :size="20" style="vertical-align: -6px; margin-right: 4px">
                          {{ (currentDetail.contentAuthor || '?').slice(0, 1) }}
                        </el-avatar>
                        {{ currentDetail.contentAuthor || '-' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="内容ID">
                        <span class="mono-text">{{ formatNumber(currentDetail.contentId) }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="内容分类">
                        {{ currentDetail.contentCategory || '-' }}
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
              </div>
            </el-col>

            <el-col :span="10">
              <div class="detail-section">
                <div class="section-title"><el-icon><TrendCharts /></el-icon> 评论内容与上下文</div>
                <div class="info-card context-card">
                  <div class="context-list">
                    <div v-for="(c, i) in (currentDetail.contextBefore || []).slice(-3)" :key="'before-'+i" class="context-item context-before">
                      <div class="context-user">
                        <el-avatar :size="22">{{ (c.userName || '?').slice(0, 1) }}</el-avatar>
                        <span class="context-username">{{ c.userName }}</span>
                        <span class="context-time">{{ formatDate(c.createdAt, 'MM-DD HH:mm') }}</span>
                      </div>
                      <div class="context-content">{{ c.content }}</div>
                    </div>
                    <div class="context-item context-target comment-target-highlight">
                      <div class="context-user">
                        <el-avatar :size="24" :src="currentDetail.userAvatar || ''">
                          {{ (currentDetail.userName || '?').slice(0, 1) }}
                        </el-avatar>
                        <span class="context-username target-username">
                          <b>{{ currentDetail.userName }}</b>
                          <el-tag size="small" type="danger" effect="dark" style="margin-left: 6px">
                            <el-icon style="vertical-align: -2px"><InfoFilled /></el-icon>
                            当前审核
                          </el-tag>
                        </span>
                        <span class="context-time">{{ formatDate(currentDetail.createdAt, 'MM-DD HH:mm') }}</span>
                      </div>
                      <div class="context-content target-content">{{ currentDetail.content }}</div>
                      <div v-if="currentDetail.sensitiveWords && currentDetail.sensitiveWords.length > 0" class="sensitive-tags mt-8">
                        <el-tag v-for="(w, i) in currentDetail.sensitiveWords" :key="i" size="small" type="danger" effect="plain" class="mr-4">
                          敏感词: {{ w }}
                        </el-tag>
                      </div>
                    </div>
                    <div v-for="(c, i) in (currentDetail.contextAfter || []).slice(0, 3)" :key="'after-'+i" class="context-item context-after">
                      <div class="context-user">
                        <el-avatar :size="22">{{ (c.userName || '?').slice(0, 1) }}</el-avatar>
                        <span class="context-username">{{ c.userName }}</span>
                        <span class="context-time">{{ formatDate(c.createdAt, 'MM-DD HH:mm') }}</span>
                      </div>
                      <div class="context-content">{{ c.content }}</div>
                    </div>
                  </div>
                  <el-empty v-if="!currentDetailHasContext" description="无上下文数据" :image-size="60" />
                </div>
              </div>
            </el-col>

            <el-col :span="7">
              <div class="detail-section">
                <div class="section-title"><el-icon><User /></el-icon> 用户信息</div>
                <div class="info-card">
                  <div class="user-info-card">
                    <div class="user-card-header">
                      <el-avatar :size="48" :src="currentDetail.userAvatar || ''">
                        {{ (currentDetail.userName || '?').slice(0, 1) }}
                      </el-avatar>
                      <div class="user-card-info">
                        <div class="user-card-name">{{ currentDetail.userName }}</div>
                        <el-tag
                          v-if="currentDetail.userViolationCount && currentDetail.userViolationCount > 0"
                          size="small"
                          class="violation-badge"
                          :class="{
                            'violation-badge--low': currentDetail.userViolationCount < 2,
                            'violation-badge--mid': currentDetail.userViolationCount === 2,
                            'violation-badge--high': currentDetail.userViolationCount >= 3,
                          }"
                        >
                          违规 {{ formatNumber(currentDetail.userViolationCount) }} 次
                        </el-tag>
                      </div>
                    </div>
                    <el-descriptions :column="1" size="small" border class="mt-12">
                      <el-descriptions-item label="用户ID">
                        <span class="mono-text">{{ formatNumber(currentDetail.userId) }}</span>
                      </el-descriptions-item>
                      <el-descriptions-item label="注册时间">
                        {{ currentDetail.userRegisterTime ? formatDate(currentDetail.userRegisterTime, 'YYYY-MM-DD') : '-' }}
                      </el-descriptions-item>
                      <el-descriptions-item label="账号状态">
                        <el-tag :type="currentDetail.userStatus === 'normal' ? 'success' : 'danger'" size="small">
                          {{ currentDetail.userStatus === 'normal' ? '正常' : currentDetail.userStatus === 'muted' ? '禁言中' : '异常' }}
                        </el-tag>
                      </el-descriptions-item>
                    </el-descriptions>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-16">
                <div class="section-title"><el-icon><History /></el-icon> 历史处罚链</div>
                <div class="info-card">
                  <el-timeline v-if="currentDetail.userPunishmentHistory && currentDetail.userPunishmentHistory.length > 0">
                    <el-timeline-item
                      v-for="(p, i) in currentDetail.userPunishmentHistory.slice(0, 6)"
                      :key="i"
                      :timestamp="formatDate(p.time, 'MM-DD HH:mm')"
                      :type="p.type === 'mute' ? 'danger' : p.type === 'warning' ? 'warning' : 'primary'"
                      size="large"
                    >
                      <div class="punishment-item">
                        <b>{{ p.action || '-' }}</b>
                        <span v-if="p.violationType" class="punishment-type">（{{ getEnumLabel(COMMENT_VIOLATION_TYPE as any, p.violationType) || p.violationType }}）</span>
                        <div v-if="p.remark" class="punishment-remark text-placeholder mt-4">{{ p.remark }}</div>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                  <el-empty v-else description="无历史处罚记录" :image-size="60" />
                </div>
              </div>

              <div class="detail-section mt-16">
                <div class="section-title"><el-icon><WarningFilled /></el-icon> 风险自动检测</div>
                <div class="info-card risk-card">
                  <div v-if="currentDetail.riskDetectedItems && currentDetail.riskDetectedItems.length > 0" class="risk-list">
                    <div v-for="(r, i) in currentDetail.riskDetectedItems" :key="i" class="risk-item"
                      :style="{ borderLeftColor: r.level === 'high' ? '#F56C6C' : r.level === 'medium' ? '#E6A23C' : '#909399' }">
                      <el-tag
                        size="small"
                        :type="r.level === 'high' ? 'danger' : r.level === 'medium' ? 'warning' : 'info'"
                        effect="plain"
                      >
                        <el-icon style="vertical-align: -2px"><WarningIcon /></el-icon>
                        {{ r.label }}
                      </el-tag>
                      <div v-if="r.description" class="risk-desc mt-4 text-placeholder">{{ r.description }}</div>
                    </div>
                  </div>
                  <el-empty v-else description="未检测到风险" :image-size="60" />
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="primary" :icon="Checked"
            @click="() => { if (currentCommentId !== null) { const r = listData.find(x => x.commentId === currentCommentId); if (r) { detailVisible = false; handleQuickAction(r, 'approve') } } }">
            立即放行
          </el-button>
          <el-button type="warning" :icon="Hide"
            @click="() => { if (currentCommentId !== null) { const r = listData.find(x => x.commentId === currentCommentId); if (r) { detailVisible = false; handleQuickAction(r, 'hide') } } }">
            审核处理
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="auditDialogVisible" title="评论审核处理" width="640px" :close-on-click-modal="false" destroy-on-close top="6vh">
        <el-form ref="auditFormRef" :model="auditFormData" :rules="auditFormRules" label-width="100px" @submit.prevent>
          <el-form-item label="审核动作">
            <el-radio-group v-model="auditFormData.action" class="result-radio-group">
              <el-radio-button value="approve">
                <el-icon color="#67C23A"><CircleCheck /></el-icon><span>放行</span>
              </el-radio-button>
              <el-radio-button value="hide">
                <el-icon color="#E6A23C"><Hide /></el-icon><span>屏蔽</span>
              </el-radio-button>
              <el-radio-button value="delete">
                <el-icon color="#F56C6C"><Delete /></el-icon><span>删除</span>
              </el-radio-button>
              <el-radio-button value="mute">
                <el-icon color="#C0392B"><Mute /></el-icon><span>禁言用户</span>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <template v-if="auditFormData.action === 'hide' || auditFormData.action === 'delete' || auditFormData.action === 'mute'">
            <el-form-item label="违规分类" prop="violationType" :class="{ 'field-shake': shakeFields.violationType }">
              <el-select v-model="auditFormData.violationType" placeholder="请选择违规类型" style="width: 100%">
                <el-option v-for="opt in violationTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value">
                  <span>{{ opt.label }}</span>
                  <el-tag size="small" type="info" effect="plain" style="margin-left: 8px">Lv.{{ (opt as any).level }}</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="违规原因" prop="violationRemark" :class="{ 'field-shake': shakeFields.violationRemark }">
              <el-input
                v-model="auditFormData.violationRemark"
                type="textarea"
                :rows="4"
                placeholder="请详细描述违规原因（至少5字符），将作为处罚依据"
                maxlength="500"
                show-word-limit
                :class="{ 'input-glow-focus': focusStates.violationRemark }"
                @focus="focusStates.violationRemark = true"
                @blur="focusStates.violationRemark = false"
              />
            </el-form-item>
          </template>

          <template v-if="auditFormData.action === 'mute'">
            <el-form-item label="禁言等级" prop="muteLevel" :class="{ 'field-shake': shakeFields.muteLevel }">
              <el-select v-model="auditFormData.muteLevel" placeholder="请选择禁言时长" style="width: 100%">
                <el-option v-for="opt in muteLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
              <div class="form-tip text-warning mt-4" v-if="auditFormData.muteDays">
                <el-icon style="vertical-align: -2px"><WarningIcon /></el-icon>
                对应禁言天数：{{ auditFormData.muteDays === -1 ? '永久' : auditFormData.muteDays + ' 天' }}
              </div>
            </el-form-item>
          </template>
        </el-form>
        <template #footer>
          <el-button @click="auditDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :icon="Checked"
            :loading="submitting"
            :class="{ 'field-shake': shakeFields.auditSubmit }"
            @click="handleAuditDialogSubmit"
          >确认提交</el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="batchProgressDialogVisible" title="批量操作进度" width="560px" destroy-on-close top="10vh"
        :close-on-click-modal="false">
        <div v-if="currentBatchProgress" class="batch-progress-content">
          <div class="batch-progress-header">
            <span class="batch-id">批次号: <span class="mono-text">{{ currentBatchProgress.batchId }}</span></span>
            <el-tag
              :type="currentBatchProgress.status === 'completed' ? 'success' : currentBatchProgress.status === 'failed' ? 'danger' : 'warning'"
              effect="dark"
              size="small"
            >
              {{ currentBatchProgress.status === 'processing' ? '处理中...' : currentBatchProgress.status === 'completed' ? '已完成' : '失败' }}
            </el-tag>
          </div>

          <el-progress
            class="batch-progress-bar"
            :percentage="currentBatchProgress.totalCount ? Math.round((currentBatchProgress.totalProcessed / currentBatchProgress.totalCount) * 100) : 0"
            :stroke-width="18"
            :status="currentBatchProgress.status === 'completed' ? 'success' : currentBatchProgress.status === 'failed' ? 'exception' : ''"
            text-inside
          />

          <el-row :gutter="12" class="batch-stats-row">
            <el-col :span="6">
              <div class="batch-progress-card card-total">
                <div class="card-num">{{ formatNumber(currentBatchProgress.totalCount) }}</div>
                <div class="card-label">总数</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="batch-progress-card card-success">
                <div class="card-num">{{ formatNumber(currentBatchProgress.successCount) }}</div>
                <div class="card-label">成功</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="batch-progress-card card-failed">
                <div class="card-num">{{ formatNumber(currentBatchProgress.failedCount) }}</div>
                <div class="card-label">失败</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="batch-progress-card card-skipped">
                <div class="card-num">{{ formatNumber(currentBatchProgress.skippedCount) }}</div>
                <div class="card-label">跳过</div>
              </div>
            </el-col>
          </el-row>
        </div>
        <template #footer>
          <el-button @click="batchProgressDialogVisible = false">
            {{ currentBatchProgress?.status === 'processing' ? '后台继续' : '关闭' }}
          </el-button>
          <el-button
            v-if="currentBatchProgress?.status === 'completed'"
            type="primary"
            :icon="View"
            @click="batchProgressDialogVisible = false"
          >查看详情</el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="traceVisible" title="评论审核溯源" width="880px" destroy-on-close top="4vh">
        <div v-if="!currentTrace" class="skeleton-wrapper">
          <el-skeleton :rows="3" animated /><el-divider /><el-skeleton :rows="8" animated />
        </div>
        <div v-else class="trace-content">
          <el-descriptions :column="3" size="small" border class="mb-16">
            <el-descriptions-item label="评论UID">
              <el-tag type="primary" effect="plain" class="mono-text">C-{{ formatNumber(currentTrace.commentId || currentCommentId) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户UID">
              <el-tag type="success" effect="plain" class="mono-text">U-{{ formatNumber(currentTrace.userId) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="内容ID">
              <el-tag type="warning" effect="plain" class="mono-text">CONT-{{ formatNumber(currentTrace.contentId) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div class="section-block">
            <div class="section-title"><el-icon><Clock /></el-icon> 审核操作时间线</div>
            <el-timeline v-if="currentTrace.auditTimeline && currentTrace.auditTimeline.length > 0">
              <el-timeline-item
                v-for="(t, i) in currentTrace.auditTimeline"
                :key="i"
                :timestamp="formatDate(t.time)"
                :type="t.result === 'approve' ? 'success' : t.result === 'delete' || t.result === 'mute' ? 'danger' : 'warning'"
                size="large"
              >
                <div class="timeline-item">
                  <b>{{ t.auditorName || '系统' }}</b>
                  <span class="timeline-action">- {{ getEnumLabel(COMMENT_AUDIT_ACTION as any, t.action) || t.action }}</span>
                  <div v-if="t.remark" class="timeline-remark mt-4 text-placeholder">{{ t.remark }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>

          <div class="section-block mt-16">
            <div class="section-title"><el-icon><SwitchButton /></el-icon> 用户处罚链</div>
            <el-table v-if="currentTrace.userPunishmentChain && currentTrace.userPunishmentChain.length > 0"
              :data="currentTrace.userPunishmentChain" size="small" stripe style="width: 100%">
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDate(row.time) }}</template>
              </el-table-column>
              <el-table-column label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.type === 'ban' ? 'danger' : row.type === 'mute' ? 'warning' : 'info'" size="small">
                    {{ row.type === 'ban' ? '封号' : row.type === 'mute' ? '禁言' : row.type === 'warning' ? '警告' : '其他' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="原因">
                <template #default="{ row }">{{ row.reason || '-' }}</template>
              </el-table-column>
              <el-table-column label="操作人" width="100">
                <template #default="{ row }">{{ row.operator || '系统' }}</template>
              </el-table-column>
            </el-table>
            <el-empty v-else description="无处罚记录" :image-size="60" />
          </div>

          <div class="section-block mt-16">
            <div class="section-title"><el-icon><TrendCharts /></el-icon> 一致性对比偏差分析</div>
            <el-table v-if="currentTrace.consistencyDeviations && currentTrace.consistencyDeviations.length > 0"
              :data="currentTrace.consistencyDeviations" size="small" stripe style="width: 100%">
              <el-table-column label="规则" prop="rule" width="160" />
              <el-table-column label="标准动作" prop="standardAction" width="120" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="success">{{ row.standardAction }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="实际动作" prop="actualAction" width="120" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="warning">{{ row.actualAction }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="偏差说明" prop="description" />
            </el-table>
            <el-empty v-else description="未检测到一致性偏差" :image-size="60" />
          </div>

          <div class="section-block mt-16">
            <div class="section-title"><el-icon><WarningFilled /></el-icon> 异常清单</div>
            <div class="exception-list" v-if="currentTrace.exceptions && currentTrace.exceptions.length > 0">
              <div v-for="(ex, i) in currentTrace.exceptions" :key="i" class="exception-item"
                :class="{
                  'exception-danger': ex.type === 'duplicate' || ex.type === 'high_risk_approve',
                  'exception-warning': ex.type === 'inconsistent',
                }">
                <el-icon>
                  <Warning v-if="ex.type === 'inconsistent'" />
                  <CircleClose v-else-if="ex.type === 'duplicate'" />
                  <WarningFilled v-else />
                </el-icon>
                <div class="exception-content">
                  <b>{{ ex.title }}</b>
                  <div class="exception-desc mt-4">{{ ex.description }}</div>
                  <div class="exception-time mt-4 text-placeholder">{{ formatDate(ex.time) }}</div>
                </div>
              </div>
            </div>
            <el-empty v-else description="无异常记录" :image-size="60" />
          </div>
        </div>
        <template #footer>
          <el-button @click="traceVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </transition>
  </div>
</template>

<script lang="ts">
function buildHighlightSegments(text: string, ranges: Array<{ start: number; end: number }>) {
  if (!text || !ranges || ranges.length === 0) return [{ text: text || '', highlight: false }]
  const sorted = [...ranges].sort((a, b) => a.start - b.start)
  const segments: Array<{ text: string; highlight: boolean }> = []
  let cursor = 0
  for (const range of sorted) {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start), highlight: false })
    }
    if (range.end > range.start) {
      segments.push({ text: text.slice(range.start, range.end), highlight: true })
    }
    cursor = Math.max(cursor, range.end)
  }
  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlight: false })
  }
  return segments
}
export default { name: 'CommentAudit' }
</script>

<style lang="scss" scoped>
.comment-audit-page {
  padding: 16px 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.card-content {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.row--zebra {
  background-color: #fafbfc !important;
  td {
    background-color: #fafbfc !important;
  }
}

.row--current {
  background-color: #ecf5ff !important;
  td {
    background-color: #ecf5ff !important;
  }
}

.sticky-header-th {
  position: sticky !important;
  top: 0;
  z-index: 10;
  background: #fafafa !important;
  font-weight: 600;
}

.input-glow-focus {
  :deep(.el-textarea__inner) {
    border-radius: 8px !important;
    border-color: #409eff !important;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15) !important;
    transition: all 0.28s ease !important;
  }
  :deep(.el-textarea__inner):focus {
    border-radius: 8px !important;
    border-color: #409eff !important;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15) !important;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10% { transform: translateX(-6px); }
  20% { transform: translateX(6px); }
  30% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  50% { transform: translateX(-4px); }
  60% { transform: translateX(4px); }
  70% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
  90% { transform: translateX(-1px); }
}

@keyframes loadingFade {
  0% { opacity: 0.4; transform: scale(0.96); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 1; transform: scale(1); }
}

.field-shake {
  animation: shake 0.6s ease-in-out;
  :deep(.el-input__wrapper) {
    border-color: #f56c6c !important;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
  :deep(.el-textarea__inner) {
    border-color: #f56c6c !important;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
  :deep(.el-select .el-input__wrapper) {
    border-color: #f56c6c !important;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
}

.btn-custom-radius {
  :deep(.el-button) {
    border-radius: 8px !important;
  }
}

.comment-target-highlight {
  border: 2px solid #f56c6c !important;
  border-radius: 10px !important;
  background: #fef0f0 !important;
  padding: 14px 16px !important;
  margin: 12px 0 !important;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 14px;
    bottom: 14px;
    width: 4px;
    background: #f56c6c;
    border-radius: 2px;
  }
}

.violation-badge {
  margin-left: 6px;
  font-weight: 600;
  border: none;
  &--low {
    background: #fdf6ec !important;
    color: #e6a23c !important;
    border-color: #e6a23c !important;
  }
  &--mid {
    background: #fdf6ec !important;
    color: #e6a23c !important;
    border-color: #e6a23c !important;
  }
  &--high {
    background: #fef0f0 !important;
    color: #f56c6c !important;
    border-color: #f56c6c !important;
    animation: pulse-red 2s ease-in-out infinite;
  }
}

@keyframes pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.5); }
  50% { box-shadow: 0 0 0 4px rgba(245, 108, 108, 0); }
}

.risk-high-glow {
  position: relative;
  :deep(.el-tag) {
    box-shadow: 0 0 8px rgba(245, 108, 108, 0.6) !important;
    animation: glow-pulse 2s ease-in-out infinite;
  }
}

@keyframes glow-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.25); }
}

.audit-stat-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 4px;
}

.stat-card {
  display: flex;
  align-items: center;
  cursor: pointer;
  border-left: 4px solid #409eff;
  transition: all 0.28s ease;
  margin-bottom: 0 !important;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  }
  &.active {
    background: linear-gradient(135deg, #f0f7ff 0%, #e6f4ff 100%);
    border-left-width: 5px;
  }
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 14px;
    flex-shrink: 0;
  }
  .stat-body {
    flex: 1;
    .stat-count {
      font-size: 26px;
      font-weight: 700;
      line-height: 1.2;
    }
    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
  }
  .stat-arrow {
    color: #c0c4cc;
    font-size: 14px;
  }
}

.filter-bar {
  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 10px;
  }
}

.batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 6px;
    .selected-info {
      font-size: 14px;
      b {
        color: #409eff;
        font-size: 15px;
      }
    }
    .time-range-info {
      font-size: 13px;
      color: #606266;
      display: flex;
      align-items: center;
    }
  }
  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.table-wrapper {
  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
  }
  .comment-id-text {
    font-weight: 600;
    color: #606266;
  }
  .content-cell {
    display: flex;
    align-items: center;
    gap: 6px;
    .content-title {
      flex: 1;
      color: #303133;
    }
    .content-tag {
      flex-shrink: 0;
    }
  }
  .user-info-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    .user-info-text {
      flex: 1;
      min-width: 0;
      .user-name {
        font-size: 13px;
        color: #303133;
        display: flex;
        align-items: center;
      }
      .user-id {
        font-size: 11px;
        margin-top: 2px;
      }
    }
  }
  .comment-preview {
    color: #606266;
    font-size: 13px;
    line-height: 1.5;
    &.sensitive-highlight {
      color: #f56c6c;
      font-weight: 500;
    }
  }
  .danger-highlight {
    background: #fef0f0;
    color: #f56c6c;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
  }
  .status-cell {
    .locked-tag {
      animation: pulse-red 2.5s ease-in-out infinite;
    }
  }
  .time-text {
    &.overdue {
      color: #f56c6c;
      font-weight: 600;
    }
  }
  .action-btns {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 2px;
  }
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.empty-tip {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
  p {
    margin-top: 12px;
  }
}

.mono-text {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
}

.text-ellipsis {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.text-placeholder {
  color: #c0c4cc;
  font-size: 12px;
}

.text-primary {
  color: #409eff;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.text-success {
  color: #67c23a;
}

.mt-4 { margin-top: 4px; }
.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.mb-16 { margin-bottom: 16px; }
.mr-4 { margin-right: 4px; }

.detail-content {
  .detail-section {
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      &::before {
        content: '';
        display: inline-block;
        width: 3px;
        height: 14px;
        background: #409eff;
        border-radius: 2px;
      }
    }
  }
  .info-card {
    background: #fafbfc;
    border-radius: 8px;
    padding: 14px;
    border: 1px solid #ebeef5;
  }
  .content-card-title {
    font-size: 15px;
    margin: 0;
    color: #303133;
  }
  .context-card {
    max-height: 520px;
    overflow-y: auto;
  }
  .context-list {
    .context-item {
      padding: 10px 12px;
      border-radius: 8px;
      margin-bottom: 8px;
      background: #fff;
      border: 1px solid #f0f2f5;
      .context-user {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
        .context-username {
          font-weight: 600;
          color: #303133;
          font-size: 13px;
          &.target-username {
            color: #f56c6c;
          }
        }
        .context-time {
          margin-left: auto;
          font-size: 11px;
          color: #909399;
        }
      }
      .context-content {
        color: #606266;
        font-size: 13px;
        line-height: 1.6;
        padding-left: 30px;
        &.target-content {
          color: #c0392b;
          font-weight: 500;
        }
      }
      &.context-before, &.context-after {
        opacity: 0.75;
        background: #f9fafb;
      }
    }
  }
  .sensitive-tags {
    padding-left: 30px;
  }
  .user-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    .user-card-name {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 4px;
    }
  }
  .risk-list {
    .risk-item {
      padding: 10px 12px;
      border-left: 3px solid #909399;
      border-radius: 0 6px 6px 0;
      background: #fff;
      margin-bottom: 8px;
      .risk-desc {
        font-size: 12px;
      }
    }
  }
  .punishment-item {
    font-size: 13px;
    .punishment-type {
      color: #909399;
      font-weight: normal;
    }
    .punishment-remark {
      font-size: 12px;
    }
  }
}

.result-radio-group {
  :deep(.el-radio-button__inner) {
    border-radius: 8px !important;
    padding: 10px 18px !important;
    font-size: 14px !important;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: 8px 0 0 8px !important;
  }
  :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 8px 8px 0 !important;
  }
}

.skeleton-wrapper {
  padding: 10px 0;
}

.batch-progress-content {
  .batch-progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    .batch-id {
      font-size: 13px;
      color: #606266;
    }
  }
  .batch-progress-bar {
    margin-bottom: 24px;
  }
  .batch-stats-row {
    margin: 0 -6px;
  }
  .batch-progress-card {
    text-align: center;
    padding: 14px 10px;
    border-radius: 10px;
    margin: 0 6px;
    .card-num {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .card-label {
      font-size: 12px;
      color: #909399;
    }
    &.card-total {
      background: #ecf5ff;
      .card-num { color: #409eff; }
    }
    &.card-success {
      background: #f0f9eb;
      .card-num { color: #67c23a; }
    }
    &.card-failed {
      background: #fef0f0;
      .card-num { color: #f56c6c; }
    }
    &.card-skipped {
      background: #fdf6ec;
      .card-num { color: #e6a23c; }
    }
  }
}

.trace-content {
  .section-block {
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      &::before {
        content: '';
        display: inline-block;
        width: 3px;
        height: 14px;
        background: #722ed1;
        border-radius: 2px;
      }
    }
  }
  .timeline-item {
    font-size: 13px;
    .timeline-action {
      color: #909399;
      margin-left: 6px;
    }
    .timeline-remark {
      font-size: 12px;
    }
  }
  .exception-list {
    .exception-item {
      display: flex;
      gap: 12px;
      padding: 14px;
      border-radius: 10px;
      margin-bottom: 10px;
      border: 1px solid #ebeef5;
      > .el-icon {
        flex-shrink: 0;
        font-size: 20px;
        margin-top: 2px;
      }
      &.exception-danger {
        background: #fef0f0;
        border-color: #fbc4c4;
        > .el-icon { color: #f56c6c; }
        .exception-content b { color: #c0392b; }
      }
      &.exception-warning {
        background: #fdf6ec;
        border-color: #f5dab1;
        > .el-icon { color: #e6a23c; }
        .exception-content b { color: #b88230; }
      }
      .exception-content {
        flex: 1;
        font-size: 13px;
        .exception-desc {
          color: #606266;
          line-height: 1.5;
        }
        .exception-time {
          font-size: 11px;
        }
      }
    }
  }
}

.dialog-zoom-enter-active,
.dialog-zoom-leave-active {
  transition: all 0.28s cubic-bezier(0.34, 0.69, 0.1, 1);
}
.dialog-zoom-enter-from,
.dialog-zoom-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

:deep(.el-dialog) {
  border-radius: 12px !important;
  overflow: hidden;
}
:deep(.el-dialog__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f2f5;
  margin-right: 0 !important;
}
:deep(.el-dialog__body) {
  padding: 20px;
}
:deep(.el-dialog__footer) {
  padding: 12px 20px;
  border-top: 1px solid #f0f2f5;
}
:deep(.el-button) {
  border-radius: 8px !important;
  transition: all 0.3s ease;
}
:deep(.el-button.is-loading) {
  animation: loadingFade 0.3s ease-in-out;
}
:deep(.el-input__wrapper),
:deep(.el-textarea__inner),
:deep(.el-select .el-input__wrapper),
:deep(.el-date-editor.el-input__wrapper),
:deep(.el-input-number) {
  border-radius: 8px !important;
}
:deep(.el-tag) {
  border-radius: 6px !important;
}
:deep(.el-descriptions) {
  :deep(.el-descriptions__label),
  :deep(.el-descriptions__cell) {
    padding: 10px 12px;
  }
}
</style>