
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, RefreshLeft, Plus, Edit, Delete, View, Check, Close,
  ArrowDown, ArrowRight, Warning, CircleCheck, Document, ChatDotRound,
  Timer, MagicStick, Upload, RefreshRight, Top, Filter,
} from '@element-plus/icons-vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  FEEDBACK_TYPE, FEEDBACK_STATUS, FEEDBACK_PRIORITY, FEEDBACK_SOURCE,
  FEEDBACK_BATCH_ACTION, FEEDBACK_TIMELINESS,
  getEnumLabel, getEnumItem,
} from '@/constants/enums'
import {
  getFeedbackStatsApi, getFeedbackListApi, getFeedbackDetailApi,
  createFeedbackApi, assignFeedbackApi, startProcessingFeedbackApi,
  resolveFeedbackApi, rejectFeedbackApi, batchActionFeedbackApi,
  traceFeedbackApi, validateFeedbackApi, checkDuplicateFeedbackApi,
  upgradePriorityApi,
} from '@/api/user-feedback'
import { formatDate, formatNumber } from '@/utils'
import type {
  FeedbackRecordItem, FeedbackStats, FeedbackBatchResult,
  FeedbackTraceResult, FeedbackValidateResult,
} from '@/types'

const activeTab = ref<'assign' | 'process' | 'batch' | 'trace'>('assign')
const loading = ref(false)
const stats = ref<FeedbackStats | null>(null)

const loadStats = async () => {
  try { stats.value = await getFeedbackStatsApi() } catch { /* */ }
}
const statsCards = computed(() => {
  const s = stats.value
  const byStatus = s?.byStatus || []
  const map: Record<number, number> = {}
  byStatus.forEach((x) => { map[x.status] = x.count })
  return [
    { label: '反馈总数', value: formatNumber(s?.total || 0), color: '#409EFF', icon: Document },
    { label: '待处理', value: formatNumber(map[1] || 0), color: '#E6A23C', icon: ChatDotRound },
    { label: '已超时', value: formatNumber(s?.overdue || 0), color: '#F56C6C', icon: Warning },
    { label: '今日解决', value: formatNumber(s?.todayResolved || 0), color: '#67C23A', icon: CircleCheck },
  ]
})

// ========== Tab1: 反馈接单 ==========
const assignList = ref<FeedbackRecordItem[]>([])
const assignTotal = ref(0)
const assignQuery = reactive({
  page: 1, pageSize: 10, keyword: '',
  feedbackType: null as string | null, status: null as number | null,
  priority: null as number | null, source: null as string | null,
  startDate: '', endDate: '',
})
const dateRange = ref<[string, string] | null>(null)
watch(dateRange, (val) => {
  assignQuery.startDate = val?.[0] || ''
  assignQuery.endDate = val?.[1] || ''
})
const loadAssignList = async () => {
  loading.value = true
  try {
    const res = await getFeedbackListApi({ ...assignQuery })
    assignList.value = res.list
    assignTotal.value = res.pagination.total
  } finally { loading.value = false }
}
const handleAssignPageChange = (p: number) => { assignQuery.page = p; loadAssignList() }
const handleAssignSizeChange = (s: number) => { assignQuery.pageSize = s; assignQuery.page = 1; loadAssignList() }
const handleAssignSearch = () => { assignQuery.page = 1; loadAssignList() }
const handleAssignReset = () => {
  Object.assign(assignQuery, { page: 1, keyword: '', feedbackType: null, status: null, priority: null, source: null, startDate: '', endDate: '' })
  dateRange.value = null
  loadAssignList()
}

const assignColumns = [
  { prop: 'feedbackNo', label: '反馈编号', width: 150 },
  { label: '标题/类型', minWidth: 220, slot: 'titleType' },
  { label: '用户UID', width: 140, slot: 'uid' },
  { label: '优先级', width: 90, slot: 'priority', align: 'center' },
  { label: '状态', width: 100, slot: 'status', align: 'center' },
  { label: '时效', width: 100, slot: 'timeliness', align: 'center' },
  { label: '处理人', width: 100, slot: 'handler', align: 'center' },
  { label: '截止时间', width: 150, slot: 'deadline', align: 'center' },
  { label: '创建时间', width: 150, slot: 'createdAt', align: 'center' },
  { label: '操作', width: 160, slot: 'actions', fixed: 'right', align: 'center' },
]

const handleAssign = async (row: FeedbackRecordItem) => {
  try {
    await ElMessageBox.confirm(`确认接单处理反馈 [${row.feedbackNo}]？`, '确认接单', { type: 'info' })
    await assignFeedbackApi(row.id)
    ElMessage.success('接单成功')
    loadAssignList(); loadStats()
  } catch { /* */ }
}
const handleViewDetail = async (row: FeedbackRecordItem) => {
  detailLoading.value = true
  detailDialogVisible.value = true
  try {
    detailData.value = await getFeedbackDetailApi(row.id)
  } finally { detailLoading.value = false }
}

// 新建反馈弹窗
const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createSubmitting = ref(false)
const createForm = reactive({
  userId: undefined as number | undefined,
  uid: '',
  feedbackType: '',
  priority: 2,
  source: 'APP',
  title: '',
  content: '',
  category: '',
})

const openCreateDialog = () => {
  Object.assign(createForm, { userId: undefined, uid: '', feedbackType: '', priority: 2, source: 'APP', title: '', content: '', category: '' })
  duplicateCheckResult.value = null
  createDialogVisible.value = true
}

const duplicateCheckResult = ref<{ isDuplicate: boolean; existingId: number | null } | null>(null)
const doCheckDuplicate = async () => {
  if (!createForm.userId || !createForm.title || !createForm.feedbackType) {
    ElMessage.warning('请先填写用户ID、标题和反馈类型')
    return
  }
  try {
    duplicateCheckResult.value = await checkDuplicateFeedbackApi({
      userId: createForm.userId,
      title: createForm.title,
      feedbackType: createForm.feedbackType,
    })
  } catch { /* */ }
}

const submitCreate = async () => {
  if (!createForm.userId) { ElMessage.warning('请填写用户ID'); return }
  if (!createForm.uid) { ElMessage.warning('请填写UID'); return }
  if (!createForm.feedbackType) { ElMessage.warning('请选择反馈类型'); return }
  if (!createForm.title?.trim()) { ElMessage.warning('请填写标题'); return }
  if (!createForm.content?.trim() || createForm.content.length < 5) { ElMessage.warning('请填写反馈内容（至少5字）'); return }

  if (!duplicateCheckResult.value) await doCheckDuplicate()
  if (duplicateCheckResult.value?.isDuplicate) {
    ElMessage.warning(`存在重复反馈，ID: ${duplicateCheckResult.value.existingId}`)
    return
  }

  createSubmitting.value = true
  try {
    await createFeedbackApi(createForm as any)
    ElMessage.success('反馈创建成功')
    createDialogVisible.value = false
    loadAssignList(); loadStats()
  } finally { createSubmitting.value = false }
}

// 详情弹窗
const detailDialogVisible = ref(false)
const detailLoading = ref(false)
const detailData = ref<FeedbackRecordItem | null>(null)

// ========== Tab2: 反馈处理 ==========
const processList = ref<FeedbackRecordItem[]>([])
const processTotal = ref(0)
const processQuery = reactive({
  page: 1, pageSize: 10, keyword: '',
  feedbackType: null as string | null, priority: null as number | null,
})
const loadProcessList = async () => {
  loading.value = true
  try {
    const res = await getFeedbackListApi({ ...processQuery, status: undefined })
    processList.value = res.list.filter((r) => r.status === 1 || r.status === 2)
    processTotal.value = res.pagination.total
  } finally { loading.value = false }
}
const handleProcessPageChange = (p: number) => { processQuery.page = p; loadProcessList() }
const handleProcessSizeChange = (s: number) => { processQuery.pageSize = s; processQuery.page = 1; loadProcessList() }
const handleProcessSearch = () => { processQuery.page = 1; loadProcessList() }
const handleProcessReset = () => {
  Object.assign(processQuery, { page: 1, keyword: '', feedbackType: null, priority: null })
  loadProcessList()
}

const processColumns = [
  { prop: 'feedbackNo', label: '反馈编号', width: 150 },
  { label: '标题/类型', minWidth: 220, slot: 'titleType' },
  { label: '用户UID', width: 140, slot: 'uid' },
  { label: '优先级', width: 90, slot: 'priority', align: 'center' },
  { label: '状态', width: 100, slot: 'status', align: 'center' },
  { label: '时效', width: 100, slot: 'timeliness', align: 'center' },
  { label: '处理人', width: 100, slot: 'handler', align: 'center' },
  { label: '截止时间', width: 150, slot: 'deadline', align: 'center' },
  { label: '操作', width: 200, slot: 'actions', fixed: 'right', align: 'center' },
]

const handleStartProcessing = async (row: FeedbackRecordItem) => {
  try {
    await startProcessingFeedbackApi(row.id)
    ElMessage.success('已开始处理')
    loadProcessList(); loadStats()
  } catch { /* */ }
}

// 解决弹窗
const resolveDialogVisible = ref(false)
const resolveTarget = ref<FeedbackRecordItem | null>(null)
const resolveRippleKey = ref(0)
const resolveSubmitting = ref(false)
const resolveForm = reactive({ resolution: '', result: '' })

const openResolveDialog = (row: FeedbackRecordItem) => {
  resolveTarget.value = row
  resolveForm.resolution = ''
  resolveForm.result = ''
  resolveRippleKey.value++
  resolveDialogVisible.value = true
}
const submitResolve = async () => {
  if (!resolveForm.resolution || resolveForm.resolution.length < 10) {
    ElMessage.warning('请填写处理说明（至少10字）'); return
  }
  if (!resolveForm.result?.trim()) { ElMessage.warning('请填写处理结果'); return }
  resolveSubmitting.value = true
  try {
    const res = await resolveFeedbackApi(resolveTarget.value!.id, resolveForm as any)
    ElMessage.success('已标记解决' + (res.pushMessageId ? '，已推送消息通知' : ''))
    resolveDialogVisible.value = false
    loadProcessList(); loadStats()
  } finally { resolveSubmitting.value = false }
}

// 驳回弹窗
const rejectDialogVisible = ref(false)
const rejectTarget = ref<FeedbackRecordItem | null>(null)
const rejectRippleKey = ref(0)
const rejectSubmitting = ref(false)
const rejectForm = reactive({ rejectReason: '' })

const openRejectDialog = (row: FeedbackRecordItem) => {
  rejectTarget.value = row
  rejectForm.rejectReason = ''
  rejectRippleKey.value++
  rejectDialogVisible.value = true
}
const submitReject = async () => {
  if (!rejectForm.rejectReason || rejectForm.rejectReason.length < 5) {
    ElMessage.warning('请填写驳回原因（至少5字）'); return
  }
  rejectSubmitting.value = true
  try {
    const res = await rejectFeedbackApi(rejectTarget.value!.id, rejectForm as any)
    ElMessage.success('已驳回' + (res.pushMessageId ? '，已推送消息通知' : ''))
    rejectDialogVisible.value = false
    loadProcessList(); loadStats()
  } finally { rejectSubmitting.value = false }
}

// ========== Tab3: 批量处理 ==========
const batchList = ref<FeedbackRecordItem[]>([])
const batchTotal = ref(0)
const batchQuery = reactive({
  page: 1, pageSize: 10, keyword: '',
  feedbackType: null as string | null, status: null as number | null,
  priority: null as number | null, source: null as string | null,
})
const batchSelectedIds = ref<number[]>([])
const batchListRef = ref<any>(null)

const loadBatchList = async () => {
  loading.value = true
  try {
    const res = await getFeedbackListApi({ ...batchQuery })
    batchList.value = res.list
    batchTotal.value = res.pagination.total
  } finally { loading.value = false }
}
const handleBatchPageChange = (p: number) => { batchQuery.page = p; loadBatchList() }
const handleBatchSizeChange = (s: number) => { batchQuery.pageSize = s; batchQuery.page = 1; loadBatchList() }
const handleBatchSearch = () => { batchQuery.page = 1; loadBatchList() }
const handleBatchReset = () => {
  Object.assign(batchQuery, { page: 1, keyword: '', feedbackType: null, status: null, priority: null, source: null })
  loadBatchList()
}

const batchColumns = [
  { type: 'selection', width: 50 },
  { prop: 'feedbackNo', label: '反馈编号', width: 150 },
  { label: '标题/类型', minWidth: 220, slot: 'titleType' },
  { label: '用户UID', width: 140, slot: 'uid' },
  { label: '优先级', width: 90, slot: 'priority', align: 'center' },
  { label: '状态', width: 100, slot: 'status', align: 'center' },
  { label: '时效', width: 100, slot: 'timeliness', align: 'center' },
  { label: '处理人', width: 100, slot: 'handler', align: 'center' },
  { label: '创建时间', width: 150, slot: 'createdAt', align: 'center' },
]

const handleBatchSelectionChange = (rows: FeedbackRecordItem[]) => {
  batchSelectedIds.value = rows.map((r) => r.id)
}
const handleBatchSelectAll = (rows: FeedbackRecordItem[]) => {
  batchSelectedIds.value = rows.map((r) => r.id)
}

const batchActionKey = ref(0)
const batchConfirmDialogVisible = ref(false)
const batchAction = ref<'ARCHIVE' | 'URGENT' | 'CLOSE'>('ARCHIVE')
const batchSubmitting = ref(false)

const openBatchConfirm = (action: 'ARCHIVE' | 'URGENT' | 'CLOSE') => {
  if (!batchSelectedIds.value.length) { ElMessage.warning('请先选择反馈记录'); return }
  batchAction.value = action
  batchConfirmDialogVisible.value = true
}
const submitBatchAction = async () => {
  batchSubmitting.value = true
  batchActionKey.value++
  try {
    const res = await batchActionFeedbackApi({ action: batchAction.value, ids: batchSelectedIds.value })
    ElMessage.success(`批量操作完成，批次号: ${res.batchNo}`)
    batchConfirmDialogVisible.value = false
    batchResult.value = res
    batchResultDialogVisible.value = true
    batchSelectedIds.value = []
    loadBatchList(); loadStats()
  } finally { batchSubmitting.value = false }
}

const batchResultDialogVisible = ref(false)
const batchResult = ref<FeedbackBatchResult | null>(null)

// ========== Tab4: 溯源与校验 ==========
const traceLoading = ref(false)
const traceInput = reactive({ feedbackNo: '', uid: '', userId: '', batchNo: '' })
const traceResult = ref<FeedbackTraceResult | null>(null)
const validateResult = ref<FeedbackValidateResult | null>(null)
const traceScrollRef = ref<HTMLElement | null>(null)
const showBackToTop = ref(false)

const doTrace = async () => {
  const params: any = {}
  if (traceInput.feedbackNo) params.feedbackNo = traceInput.feedbackNo
  if (traceInput.uid) params.uid = traceInput.uid
  if (traceInput.userId) params.userId = Number(traceInput.userId)
  if (traceInput.batchNo) params.batchNo = traceInput.batchNo
  if (!Object.keys(params).length) { ElMessage.warning('请至少输入一个查询条件'); return }
  traceLoading.value = true
  try {
    traceResult.value = await traceFeedbackApi(params)
    validateResult.value = null
  } finally { traceLoading.value = false }
}
const doValidate = async (id: number) => {
  traceLoading.value = true
  try {
    validateResult.value = await validateFeedbackApi(id)
  } finally { traceLoading.value = false }
}
const clearTracePanel = () => {
  traceResult.value = null
  validateResult.value = null
  Object.assign(traceInput, { feedbackNo: '', uid: '', userId: '', batchNo: '' })
}
const scrollToTop = () => {
  traceScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}
const handleTraceScroll = (e: Event) => {
  const el = e.target as HTMLElement
  showBackToTop.value = el.scrollTop > 300
}

const ISSUE_TYPE_MAP: Record<string, { label: string; type: string }> = {
  STATUS_REGRESSION: { label: '状态回退', type: 'danger' },
  DUPLICATE_ASSIGN: { label: '重复分配', type: 'warning' },
  TIMEOUT_PROCESSED: { label: '超时处理', type: 'danger' },
  PERFUNCTORY: { label: '敷衍处理', type: 'warning' },
  INCOMPLETE_REJECTION: { label: '驳回不完整', type: 'info' },
  LONG_PENDING: { label: '长期滞留', type: 'warning' },
}

watch(activeTab, (val) => {
  if (val === 'process') loadProcessList()
  else if (val === 'batch') loadBatchList()
})
onMounted(() => { loadStats(); loadAssignList() })
</script>

<template>
  <div class="user-feedback-page">
    <el-row :gutter="12" class="top-stats">
      <el-col v-for="(card, idx) in statsCards" :key="idx" :xs="12" :sm="6" :md="6" :lg="6">
        <div class="stat-card card-hover" :style="{ borderLeftColor: card.color }">
          <div class="stat-left">
            <div class="stat-label" :style="{ color: card.color }">{{ card.label }}</div>
            <div class="stat-value">{{ card.value }}</div>
          </div>
          <div class="stat-icon" :style="{ background: card.color + '20', color: card.color }">
            <el-icon :size="28"><component :is="card.icon" /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="tabs-wrap card-content">
      <el-tabs v-model="activeTab" class="main-tabs">
        <!-- Tab1: 反馈接单 -->
        <el-tab-pane label="① 反馈接单" name="assign">
          <div class="filter-bar">
            <el-form :inline="true" :model="assignQuery" @submit.prevent>
              <el-form-item label="关键词">
                <el-input v-model="assignQuery.keyword" placeholder="编号/标题" clearable style="width: 180px" @keyup.enter="handleAssignSearch" />
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="assignQuery.feedbackType" placeholder="全部类型" clearable style="width: 140px">
                  <el-option v-for="(opt, k) in FEEDBACK_TYPE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="assignQuery.status" placeholder="全部状态" clearable style="width: 120px">
                  <el-option v-for="(opt, k) in FEEDBACK_STATUS" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="优先级">
                <el-select v-model="assignQuery.priority" placeholder="全部" clearable style="width: 100px">
                  <el-option v-for="(opt, k) in FEEDBACK_PRIORITY" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="来源">
                <el-select v-model="assignQuery.source" placeholder="全部" clearable style="width: 120px">
                  <el-option v-for="(opt, k) in FEEDBACK_SOURCE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="日期">
                <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD" style="width: 240px" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleAssignSearch">搜索</el-button>
                <el-button :icon="RefreshLeft" @click="handleAssignReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <QyTableToolbar
            :loading="loading"
            :show-batch-actions="false"
            :selected-count="0"
            create-text="新建反馈"
            @create="openCreateDialog"
            @refresh="loadAssignList"
          >
            <template #right>
              <el-tag type="info" effect="plain">共 <b style="color:#409EFF">{{ formatNumber(assignTotal) }}</b> 条反馈</el-tag>
            </template>
          </QyTableToolbar>

          <el-skeleton :loading="loading" animated :rows="6" :throttle="500">
            <template #default>
              <el-table :data="assignList" v-loading="loading" size="default" stripe border row-key="id"
                :header-cell-style="{ background: '#fafbfc' }">
                <el-table-column v-for="col in assignColumns" :key="col.prop || col.slot" v-bind="col as any">
                  <template v-if="col.slot === 'titleType'" #default="{ row }">
                    <div class="title-type-cell">
                      <div class="title-text">{{ row.title }}</div>
                      <el-tag size="small" :type="(getEnumItem(FEEDBACK_TYPE as any, row.feedbackType) as any)?.type" effect="plain">
                        {{ getEnumLabel(FEEDBACK_TYPE as any, row.feedbackType) }}
                      </el-tag>
                    </div>
                  </template>
                  <template v-else-if="col.slot === 'uid'" #default="{ row }">
                    <span class="mono" style="color:#409EFF">{{ row.uid }}</span>
                  </template>
                  <template v-else-if="col.slot === 'priority'" #default="{ row }">
                    <el-tag :type="(getEnumItem(FEEDBACK_PRIORITY as any, row.priority) as any)?.type" effect="dark" size="small">
                      {{ getEnumLabel(FEEDBACK_PRIORITY as any, row.priority) }}
                    </el-tag>
                  </template>
                  <template v-else-if="col.slot === 'status'" #default="{ row }">
                    <el-tag :type="(getEnumItem(FEEDBACK_STATUS as any, row.status) as any)?.type" effect="dark" size="small">
                      {{ getEnumLabel(FEEDBACK_STATUS as any, row.status) }}
                    </el-tag>
                  </template>
                  <template v-else-if="col.slot === 'timeliness'" #default="{ row }">
                    <el-tag :type="(getEnumItem(FEEDBACK_TIMELINESS as any, row.timeliness) as any)?.type" effect="light" size="small">
                      {{ getEnumLabel(FEEDBACK_TIMELINESS as any, row.timeliness) }}
                    </el-tag>
                  </template>
                  <template v-else-if="col.slot === 'handler'" #default="{ row }">
                    <span v-if="row.handlerName">{{ row.handlerName }}</span>
                    <span v-else style="color:#909399">-</span>
                  </template>
                  <template v-else-if="col.slot === 'deadline'" #default="{ row }">
                    <div v-if="row.deadlineAt" style="font-size:12px">
                      <div>{{ formatDate(row.deadlineAt, 'YYYY-MM-DD') }}</div>
                      <div style="color:#909399">{{ formatDate(row.deadlineAt, 'HH:mm') }}</div>
                    </div>
                    <span v-else style="color:#909399">-</span>
                  </template>
                  <template v-else-if="col.slot === 'createdAt'" #default="{ row }">
                    <div style="font-size:12px">
                      <div>{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</div>
                      <div style="color:#909399">{{ formatDate(row.createdAt, 'HH:mm') }}</div>
                    </div>
                  </template>
                  <template v-else-if="col.slot === 'actions'" #default="{ row }">
                    <el-button v-if="row.status === 1" type="primary" link :icon="Check" class="click-offset" @click="handleAssign(row)">接单</el-button>
                    <el-button type="info" link :icon="View" @click="handleViewDetail(row)">查看</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </template>
          </el-skeleton>

          <div style="margin-top:12px;text-align:right">
            <el-pagination background layout="total, sizes, prev, pager, next, jumper"
              :current-page="assignQuery.page" :page-size="assignQuery.pageSize"
              :page-sizes="[10,20,50,100]" :total="assignTotal"
              @current-change="handleAssignPageChange" @size-change="handleAssignSizeChange" />
          </div>
        </el-tab-pane>

        <!-- Tab2: 反馈处理 -->
        <el-tab-pane label="② 反馈处理" name="process">
          <div class="filter-bar">
            <el-form :inline="true" :model="processQuery" @submit.prevent>
              <el-form-item label="关键词">
                <el-input v-model="processQuery.keyword" placeholder="编号/标题" clearable style="width: 180px" @keyup.enter="handleProcessSearch" />
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="processQuery.feedbackType" placeholder="全部类型" clearable style="width: 140px">
                  <el-option v-for="(opt, k) in FEEDBACK_TYPE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="优先级">
                <el-select v-model="processQuery.priority" placeholder="全部" clearable style="width: 100px">
                  <el-option v-for="(opt, k) in FEEDBACK_PRIORITY" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleProcessSearch">搜索</el-button>
                <el-button :icon="RefreshLeft" @click="handleProcessReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <el-table :data="processList" v-loading="loading" size="default" stripe border row-key="id"
            :header-cell-style="{ background: '#fafbfc' }">
            <el-table-column v-for="col in processColumns" :key="col.prop || col.slot" v-bind="col as any">
              <template v-if="col.slot === 'titleType'" #default="{ row }">
                <div class="title-type-cell">
                  <div class="title-text">{{ row.title }}</div>
                  <el-tag size="small" :type="(getEnumItem(FEEDBACK_TYPE as any, row.feedbackType) as any)?.type" effect="plain">
                    {{ getEnumLabel(FEEDBACK_TYPE as any, row.feedbackType) }}
                  </el-tag>
                </div>
              </template>
              <template v-else-if="col.slot === 'uid'" #default="{ row }">
                <span class="mono" style="color:#409EFF">{{ row.uid }}</span>
              </template>
              <template v-else-if="col.slot === 'priority'" #default="{ row }">
                <el-tag :type="(getEnumItem(FEEDBACK_PRIORITY as any, row.priority) as any)?.type" effect="dark" size="small">
                  {{ getEnumLabel(FEEDBACK_PRIORITY as any, row.priority) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'status'" #default="{ row }">
                <el-tag :type="(getEnumItem(FEEDBACK_STATUS as any, row.status) as any)?.type" effect="dark" size="small">
                  {{ getEnumLabel(FEEDBACK_STATUS as any, row.status) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'timeliness'" #default="{ row }">
                <el-tag :type="(getEnumItem(FEEDBACK_TIMELINESS as any, row.timeliness) as any)?.type" effect="light" size="small">
                  {{ getEnumLabel(FEEDBACK_TIMELINESS as any, row.timeliness) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'handler'" #default="{ row }">
                <span v-if="row.handlerName">{{ row.handlerName }}</span>
                <span v-else style="color:#909399">-</span>
              </template>
              <template v-else-if="col.slot === 'deadline'" #default="{ row }">
                <div v-if="row.deadlineAt" style="font-size:12px">
                  <div>{{ formatDate(row.deadlineAt, 'YYYY-MM-DD') }}</div>
                  <div style="color:#909399">{{ formatDate(row.deadlineAt, 'HH:mm') }}</div>
                </div>
                <span v-else style="color:#909399">-</span>
              </template>
              <template v-else-if="col.slot === 'actions'" #default="{ row }">
                <template v-if="row.status === 1">
                  <el-button type="primary" link :icon="MagicStick" class="click-offset ripple-btn" @click="handleStartProcessing(row)">开始处理</el-button>
                </template>
                <template v-else-if="row.status === 2">
                  <el-button type="success" link :icon="Check" class="click-offset ripple-btn" @click="openResolveDialog(row)">标记已解决</el-button>
                  <el-button type="danger" link :icon="Close" class="click-offset ripple-btn" @click="openRejectDialog(row)">驳回</el-button>
                </template>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top:12px;text-align:right">
            <el-pagination background layout="total, sizes, prev, pager, next"
              :current-page="processQuery.page" :page-size="processQuery.pageSize"
              :page-sizes="[10,20,50,100]" :total="processTotal"
              @current-change="handleProcessPageChange" @size-change="handleProcessSizeChange" />
          </div>
        </el-tab-pane>

        <!-- Tab3: 批量处理 -->
        <el-tab-pane label="③ 批量处理" name="batch">
          <div class="filter-bar">
            <el-form :inline="true" :model="batchQuery" @submit.prevent>
              <el-form-item label="关键词">
                <el-input v-model="batchQuery.keyword" placeholder="编号/标题" clearable style="width: 180px" @keyup.enter="handleBatchSearch" />
              </el-form-item>
              <el-form-item label="类型">
                <el-select v-model="batchQuery.feedbackType" placeholder="全部类型" clearable style="width: 140px">
                  <el-option v-for="(opt, k) in FEEDBACK_TYPE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="batchQuery.status" placeholder="全部状态" clearable style="width: 120px">
                  <el-option v-for="(opt, k) in FEEDBACK_STATUS" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="优先级">
                <el-select v-model="batchQuery.priority" placeholder="全部" clearable style="width: 100px">
                  <el-option v-for="(opt, k) in FEEDBACK_PRIORITY" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="来源">
                <el-select v-model="batchQuery.source" placeholder="全部" clearable style="width: 120px">
                  <el-option v-for="(opt, k) in FEEDBACK_SOURCE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleBatchSearch">搜索</el-button>
                <el-button :icon="RefreshLeft" @click="handleBatchReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div class="batch-action-bar card-content" style="margin-bottom:16px;padding:12px 16px;background:#f8fafb;border-radius:10px">
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
              <span style="font-weight:600;color:#606266">批量操作：</span>
              <el-button v-for="(act, k) in FEEDBACK_BATCH_ACTION" :key="k"
                :type="(act as any).type"
                :icon="act.value === 'ARCHIVE' ? Document : act.value === 'URGENT' ? Warning : Close"
                :disabled="!batchSelectedIds.length"
                @click="openBatchConfirm(act.value as 'ARCHIVE' | 'URGENT' | 'CLOSE')">
                {{ act.label }}
                <span style="font-size:11px;color:#909399;margin-left:4px">({{ act.desc }})</span>
              </el-button>
              <el-tag v-if="batchSelectedIds.length" type="primary" effect="dark" size="small">
                已选 {{ batchSelectedIds.length }} 条
              </el-tag>
            </div>
          </div>

          <el-table ref="batchListRef" :data="batchList" v-loading="loading" size="default" stripe border row-key="id"
            :header-cell-style="{ background: '#fafbfc' }"
            :row-class-name="({ row }: any) => batchSelectedIds.includes(row.id) ? 'row-selected' : ''"
            @selection-change="handleBatchSelectionChange"
            @select-all="handleBatchSelectAll">
            <el-table-column v-for="col in batchColumns" :key="col.prop || col.slot || col.type" v-bind="col as any">
              <template v-if="col.slot === 'titleType'" #default="{ row }">
                <div class="title-type-cell">
                  <div class="title-text">{{ row.title }}</div>
                  <el-tag size="small" :type="(getEnumItem(FEEDBACK_TYPE as any, row.feedbackType) as any)?.type" effect="plain">
                    {{ getEnumLabel(FEEDBACK_TYPE as any, row.feedbackType) }}
                  </el-tag>
                </div>
              </template>
              <template v-else-if="col.slot === 'uid'" #default="{ row }">
                <span class="mono" style="color:#409EFF">{{ row.uid }}</span>
              </template>
              <template v-else-if="col.slot === 'priority'" #default="{ row }">
                <el-tag :type="(getEnumItem(FEEDBACK_PRIORITY as any, row.priority) as any)?.type" effect="dark" size="small">
                  {{ getEnumLabel(FEEDBACK_PRIORITY as any, row.priority) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'status'" #default="{ row }">
                <el-tag :type="(getEnumItem(FEEDBACK_STATUS as any, row.status) as any)?.type" effect="dark" size="small">
                  {{ getEnumLabel(FEEDBACK_STATUS as any, row.status) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'timeliness'" #default="{ row }">
                <el-tag :type="(getEnumItem(FEEDBACK_TIMELINESS as any, row.timeliness) as any)?.type" effect="light" size="small">
                  {{ getEnumLabel(FEEDBACK_TIMELINESS as any, row.timeliness) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'handler'" #default="{ row }">
                <span v-if="row.handlerName">{{ row.handlerName }}</span>
                <span v-else style="color:#909399">-</span>
              </template>
              <template v-else-if="col.slot === 'createdAt'" #default="{ row }">
                <div style="font-size:12px">
                  <div>{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</div>
                  <div style="color:#909399">{{ formatDate(row.createdAt, 'HH:mm') }}</div>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top:12px;text-align:right">
            <el-pagination background layout="total, sizes, prev, pager, next"
              :current-page="batchQuery.page" :page-size="batchQuery.pageSize"
              :page-sizes="[10,20,50,100]" :total="batchTotal"
              @current-change="handleBatchPageChange" @size-change="handleBatchSizeChange" />
          </div>
        </el-tab-pane>

        <!-- Tab4: 溯源与校验 -->
        <el-tab-pane label="④ 溯源与校验" name="trace">
          <div class="trace-panel card-content" ref="traceScrollRef" @scroll="handleTraceScroll">
            <div class="trace-search-row">
              <div class="trace-search-group">
                <div style="font-weight:600;margin-bottom:8px">🔍 反馈溯源查询</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                  <el-input v-model="traceInput.feedbackNo" placeholder="反馈编号" clearable style="width:180px" @keyup.enter="doTrace" />
                  <el-input v-model="traceInput.uid" placeholder="用户UID" clearable style="width:150px" @keyup.enter="doTrace" />
                  <el-input v-model="traceInput.userId" placeholder="用户ID" clearable style="width:120px" @keyup.enter="doTrace" />
                  <el-input v-model="traceInput.batchNo" placeholder="批次号" clearable style="width:180px" @keyup.enter="doTrace" />
                  <el-button type="primary" :icon="Search" :loading="traceLoading" @click="doTrace">溯源查询</el-button>
                  <el-button :icon="RefreshLeft" @click="clearTracePanel">清空</el-button>
                </div>
              </div>
            </div>

            <div v-if="traceResult" class="trace-result-block">
              <h4 style="margin:16px 0 12px">
                <el-icon color="#67C23A"><CircleCheck /></el-icon>
                反馈 <span class="mono">{{ traceResult.record.feedbackNo }}</span> 溯源结果
              </h4>
              <div class="trace-summary card-content" style="background:#fafbfc">
                <el-descriptions :column="3" size="small" border>
                  <el-descriptions-item label="用户UID"><span class="mono">{{ traceResult.record.uid }}</span></el-descriptions-item>
                  <el-descriptions-item label="反馈类型">
                    <el-tag :type="(getEnumItem(FEEDBACK_TYPE as any, traceResult.record.feedbackType) as any)?.type" effect="plain" size="small">
                      {{ getEnumLabel(FEEDBACK_TYPE as any, traceResult.record.feedbackType) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="当前状态">
                    <el-tag :type="(getEnumItem(FEEDBACK_STATUS as any, traceResult.record.status) as any)?.type" effect="dark" size="small">
                      {{ getEnumLabel(FEEDBACK_STATUS as any, traceResult.record.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="优先级">
                    <el-tag :type="(getEnumItem(FEEDBACK_PRIORITY as any, traceResult.record.priority) as any)?.type" effect="dark" size="small">
                      {{ getEnumLabel(FEEDBACK_PRIORITY as any, traceResult.record.priority) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="处理人">{{ traceResult.record.handlerName || '-' }}</el-descriptions-item>
                  <el-descriptions-item label="创建时间">{{ formatDate(traceResult.record.createdAt, 'YYYY-MM-DD HH:mm') }}</el-descriptions-item>
                  <el-descriptions-item label="标题" :span="3">{{ traceResult.record.title }}</el-descriptions-item>
                  <el-descriptions-item label="内容" :span="3">{{ traceResult.record.content }}</el-descriptions-item>
                </el-descriptions>

                <div style="margin-top:12px;display:flex;gap:8px">
                  <el-button type="warning" :icon="Warning" :loading="traceLoading" @click="doValidate(traceResult!.record.id)">校验完整性</el-button>
                </div>

                <div v-if="traceResult.record.logs?.length" style="margin-top:16px">
                  <div style="font-weight:600;margin-bottom:8px">📋 操作日志（时间线）</div>
                  <el-timeline>
                    <el-timeline-item v-for="log in traceResult.record.logs" :key="log.id"
                      :timestamp="formatDate(log.createdAt, 'YYYY-MM-DD HH:mm:ss')" placement="top">
                      <div style="background:#fff;padding:10px 14px;border-radius:8px;border:1px solid #ebeef5">
                        <div style="display:flex;justify-content:space-between;align-items:center">
                          <div>
                            <el-tag v-if="log.toStatus" size="small"
                              :type="(getEnumItem(FEEDBACK_STATUS as any, log.toStatus) as any)?.type">
                              {{ getEnumLabel(FEEDBACK_STATUS as any, log.toStatus) }}
                            </el-tag>
                            <span style="margin-left:8px;font-weight:500">{{ log.action }}</span>
                          </div>
                          <span v-if="log.operatorName" style="font-size:12px;color:#909399">{{ log.operatorName }}</span>
                        </div>
                        <div v-if="log.remark" style="font-size:12px;color:#606266;margin-top:4px">{{ log.remark }}</div>
                        <div v-if="log.operationBatch" style="font-size:11px;color:#909399;margin-top:2px">
                          批次: <span class="mono">{{ log.operationBatch }}</span>
                        </div>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </div>

              <div v-if="validateResult" class="trace-result-block" style="margin-top:16px">
                <h4 style="margin:0 0 12px">
                  <el-icon color="#E6A23C"><Warning /></el-icon>
                  完整性校验结果
                </h4>
                <div class="trace-summary card-content" style="background:#fafbfc">
                  <el-alert v-if="validateResult.isValid" type="success" :closable="false" show-icon
                    title="✅ 反馈处理流程完整，未发现异常" style="margin-bottom:12px" />
                  <el-alert v-else type="warning" :closable="false" show-icon
                    :title="`⚠️ 发现 ${validateResult.issues.length} 个完整性问题`" style="margin-bottom:12px" />
                  <el-table v-if="validateResult.issues?.length" :data="validateResult.issues" size="small" border stripe
                    :header-cell-style="{ background: '#eef2f6' }">
                    <el-table-column label="问题类型" width="150" show-overflow-tooltip>
                      <template #default="{ row }">
                        <el-tag :type="(ISSUE_TYPE_MAP[row.type] as any)?.type || 'info'" effect="plain" size="small">
                          {{ (ISSUE_TYPE_MAP[row.type] as any)?.label || row.type }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="message" label="问题描述" min-width="300" show-overflow-tooltip />
                  </el-table>
                </div>
              </div>
            </div>

            <el-empty v-if="!traceResult && !validateResult" description="请在上方输入查询条件开始溯源/校验" :image-size="120" />
          </div>

          <transition name="fade">
            <div v-if="showBackToTop" class="back-to-top" @click="scrollToTop">
              <el-icon :size="20"><Top /></el-icon>
            </div>
          </transition>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 功能点1：新建反馈弹窗 -->
    <el-dialog v-model="createDialogVisible" title="① 新建反馈" width="640px"
      :close-on-click-modal="false" append-to-body class="scale-dialog">
      <el-form :model="createForm" label-width="100px" ref="createFormRef" class="focus-glow-form">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户ID" required>
              <el-input v-model.number="createForm.userId" placeholder="用户ID" maxlength="20" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="用户UID" required>
              <el-input v-model="createForm.uid" placeholder="用户UID" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="反馈类型" required>
              <el-select v-model="createForm.feedbackType" placeholder="请选择" style="width:100%">
                <el-option v-for="(opt, k) in FEEDBACK_TYPE" :key="k" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级">
              <el-select v-model="createForm.priority" style="width:100%">
                <el-option v-for="(opt, k) in FEEDBACK_PRIORITY" :key="k" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-select v-model="createForm.source" style="width:100%">
                <el-option v-for="(opt, k) in FEEDBACK_SOURCE" :key="k" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类">
              <el-input v-model="createForm.category" placeholder="如：功能异常/体验问题" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="标题" required>
              <el-input v-model="createForm.title" placeholder="请简述反馈问题" maxlength="200" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="反馈内容" required>
              <el-input v-model="createForm.content" type="textarea" :rows="4" placeholder="请详细描述反馈内容（至少5字）" maxlength="2000" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert v-if="duplicateCheckResult?.isDuplicate" type="warning" :closable="false" show-icon
          :title="'检测到重复反馈，已有记录ID: ' + duplicateCheckResult.existingId" style="margin-top:12px" />
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button plain :icon="Filter" @click="doCheckDuplicate">查重</el-button>
        <el-button type="primary" :icon="Check" :loading="createSubmitting" @click="submitCreate">创建反馈</el-button>
      </template>
    </el-dialog>

    <!-- 功能点2：标记已解决弹窗 -->
    <el-dialog v-model="resolveDialogVisible" title="② 标记已解决" width="520px"
      :close-on-click-modal="false" append-to-body class="scale-dialog">
      <div v-if="resolveTarget" style="background:#f5f7fa;padding:14px 16px;border-radius:8px;margin-bottom:18px">
        <div style="font-size:13px;color:#909399">反馈: <span class="mono">{{ resolveTarget.feedbackNo }}</span></div>
        <div style="margin-top:4px;font-weight:500">{{ resolveTarget.title }}</div>
      </div>
      <el-form :model="resolveForm" label-width="100px">
        <el-form-item label="处理说明" required>
          <el-input v-model="resolveForm.resolution" type="textarea" :rows="4"
            placeholder="请详细说明处理过程（至少10字）" maxlength="1000" show-word-limit />
        </el-form-item>
        <el-form-item label="处理结果" required>
          <el-input v-model="resolveForm.result" placeholder="如：已修复/已补偿/已解释" maxlength="200" />
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon
          title="解决后将自动推送消息通知用户" style="border-radius:8px" />
      </el-form>
      <template #footer>
        <el-button @click="resolveDialogVisible = false">取消</el-button>
        <button :key="resolveRippleKey"
          class="ripple-btn click-offset el-button el-button--success"
          :disabled="resolveSubmitting"
          @click="submitResolve">
          <el-icon><Check /></el-icon> 确认解决
        </button>
      </template>
    </el-dialog>

    <!-- 功能点2：驳回弹窗 -->
    <el-dialog v-model="rejectDialogVisible" title="② 驳回反馈" width="520px"
      :close-on-click-modal="false" append-to-body class="scale-dialog">
      <div v-if="rejectTarget" style="background:#f5f7fa;padding:14px 16px;border-radius:8px;margin-bottom:18px">
        <div style="font-size:13px;color:#909399">反馈: <span class="mono">{{ rejectTarget.feedbackNo }}</span></div>
        <div style="margin-top:4px;font-weight:500">{{ rejectTarget.title }}</div>
      </div>
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectForm.rejectReason" type="textarea" :rows="4"
            placeholder="请说明驳回原因（至少5字）" maxlength="500" show-word-limit />
        </el-form-item>
        <el-alert type="warning" :closable="false" show-icon
          title="驳回后将自动推送消息通知用户" style="border-radius:8px" />
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <button :key="rejectRippleKey"
          class="ripple-btn click-offset el-button el-button--danger"
          :disabled="rejectSubmitting"
          @click="submitReject">
          <el-icon><Close /></el-icon> 确认驳回
        </button>
      </template>
    </el-dialog>

    <!-- 功能点3：批量操作确认弹窗 -->
    <el-dialog v-model="batchConfirmDialogVisible" title="③ 确认批量操作" width="460px"
      :close-on-click-modal="false" append-to-body class="scale-dialog">
      <div style="text-align:center;padding:16px 0">
        <el-icon :size="48" :color="(getEnumItem(FEEDBACK_BATCH_ACTION as any, batchAction) as any)?.color">
          <Warning />
        </el-icon>
        <div style="font-size:16px;font-weight:600;margin-top:12px">
          {{ (getEnumItem(FEEDBACK_BATCH_ACTION as any, batchAction) as any)?.label }}
        </div>
        <div style="font-size:13px;color:#909399;margin-top:6px">
          {{ (getEnumItem(FEEDBACK_BATCH_ACTION as any, batchAction) as any)?.desc }}
        </div>
        <el-divider />
        <div style="font-size:14px">
          已选择 <b style="color:#409EFF">{{ batchSelectedIds.length }}</b> 条反馈记录
        </div>
        <div style="font-size:12px;color:#909399;margin-top:4px">操作不可撤销，请确认</div>
      </div>
      <template #footer>
        <el-button @click="batchConfirmDialogVisible = false">取消</el-button>
        <button :key="batchActionKey"
          class="ripple-btn el-button"
          :class="'el-button--' + (getEnumItem(FEEDBACK_BATCH_ACTION as any, batchAction) as any)?.type"
          :disabled="batchSubmitting"
          @click="submitBatchAction">
          <el-icon><Check /></el-icon> 确认执行
        </button>
      </template>
    </el-dialog>

    <!-- 功能点3：批量操作结果弹窗 -->
    <el-dialog v-model="batchResultDialogVisible" title="批量操作结果" width="560px"
      append-to-body class="scale-dialog">
      <div v-if="batchResult" style="padding:8px 0">
        <div style="text-align:center;margin-bottom:16px">
          <span style="font-size:14px">批次号: <span class="mono" style="color:#409EFF">{{ batchResult.batchNo }}</span></span>
        </div>
        <el-row :gutter="16">
          <el-col :span="8">
            <div class="result-stat-card" style="border-left-color:#409EFF">
              <div style="font-size:12px;color:#909399">总计</div>
              <div style="font-size:22px;font-weight:700;color:#303133">{{ formatNumber(batchResult.total) }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="result-stat-card" style="border-left-color:#67C23A">
              <div style="font-size:12px;color:#909399">成功</div>
              <div style="font-size:22px;font-weight:700;color:#67C23A">{{ formatNumber(batchResult.success.length) }}</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="result-stat-card" style="border-left-color:#F56C6C">
              <div style="font-size:12px;color:#909399">失败</div>
              <div style="font-size:22px;font-weight:700;color:#F56C6C">{{ formatNumber(batchResult.failed.length) }}</div>
            </div>
          </el-col>
        </el-row>
        <el-collapse v-if="batchResult.failed.length" style="margin-top:12px">
          <el-collapse-item :title="'失败明细（' + batchResult.failed.length + '条）'" name="failed">
            <el-table :data="batchResult.failed" size="small" border stripe>
              <el-table-column prop="feedbackNo" label="反馈编号" width="150" />
              <el-table-column prop="reason" label="失败原因" min-width="200" show-overflow-tooltip />
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>
      <template #footer>
        <el-button type="primary" @click="batchResultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="反馈详情" width="680px"
      append-to-body class="scale-dialog">
      <div v-if="detailLoading" style="padding:40px 0;text-align:center">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else-if="detailData">
        <el-descriptions :column="2" size="small" border>
          <el-descriptions-item label="反馈编号"><span class="mono">{{ detailData.feedbackNo }}</span></el-descriptions-item>
          <el-descriptions-item label="用户UID"><span class="mono">{{ detailData.uid }}</span></el-descriptions-item>
          <el-descriptions-item label="反馈类型">
            <el-tag :type="(getEnumItem(FEEDBACK_TYPE as any, detailData.feedbackType) as any)?.type" effect="plain" size="small">
              {{ getEnumLabel(FEEDBACK_TYPE as any, detailData.feedbackType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            <el-tag :type="(getEnumItem(FEEDBACK_SOURCE as any, detailData.source) as any)?.type" effect="plain" size="small">
              {{ getEnumLabel(FEEDBACK_SOURCE as any, detailData.source) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="(getEnumItem(FEEDBACK_PRIORITY as any, detailData.priority) as any)?.type" effect="dark" size="small">
              {{ getEnumLabel(FEEDBACK_PRIORITY as any, detailData.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="(getEnumItem(FEEDBACK_STATUS as any, detailData.status) as any)?.type" effect="dark" size="small">
              {{ getEnumLabel(FEEDBACK_STATUS as any, detailData.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时效">
            <el-tag :type="(getEnumItem(FEEDBACK_TIMELINESS as any, detailData.timeliness) as any)?.type" effect="light" size="small">
              {{ getEnumLabel(FEEDBACK_TIMELINESS as any, detailData.timeliness) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ detailData.handlerName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ detailData.title }}</el-descriptions-item>
          <el-descriptions-item label="内容" :span="2">{{ detailData.content }}</el-descriptions-item>
          <el-descriptions-item label="处理说明" :span="2">{{ detailData.resolution || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理结果">{{ detailData.result || '-' }}</el-descriptions-item>
          <el-descriptions-item label="驳回原因">{{ detailData.rejectReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(detailData.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
          <el-descriptions-item label="截止时间">{{ detailData.deadlineAt ? formatDate(detailData.deadlineAt, 'YYYY-MM-DD HH:mm') : '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-feedback-page {
  .card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    will-change: transform, box-shadow;
    &:hover {
      transform: translateY(-3px) scale(1.015);
      box-shadow: 0 10px 28px rgba(64, 158, 255, 0.18), 0 4px 12px rgba(0, 0, 0, 0.06);
    }
  }
  .top-stats {
    .stat-card {
      padding: 16px 18px;
      border-radius: 12px;
      background: #fff;
      border-left: 4px solid #409eff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
      .stat-left {
        flex: 1; min-width: 0;
        .stat-label { font-size: 12px; font-weight: 500; }
        .stat-value { font-size: 22px; font-weight: 700; color: #303133; margin-top: 4px; }
      }
      .stat-icon {
        width: 52px; height: 52px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
      }
    }
  }
  .tabs-wrap {
    border-radius: 12px;
    padding: 8px 20px 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    :deep(.el-tabs__header) { margin-bottom: 16px; }
    :deep(.el-tabs__item) {
      border-radius: 8px 8px 0 0;
      font-weight: 500;
      font-size: 14px;
    }
  }
  .filter-bar {
    background: #f8fafb;
    padding: 12px 16px 0;
    border-radius: 10px;
    margin-bottom: 12px;
    :deep(.el-form-item) { margin-bottom: 12px; }
    :deep(.el-form-item__label) { font-size: 13px; color: #606266; }
    :deep(.el-button) { border-radius: 8px; }
  }
  .mono { font-family: 'SF Mono', 'Consolas', monospace; }
  .title-type-cell {
    .title-text { font-size: 14px; color: #303133; margin-bottom: 4px; }
  }
  .batch-action-bar {
    border-radius: 12px;
  }
  .trace-panel {
    border-radius: 12px;
    padding: 20px;
    max-height: calc(100vh - 280px);
    overflow-y: auto;
    .trace-search-row {
      display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;
      .trace-search-group { flex: 1; min-width: 420px; }
    }
    .trace-result-block {
      margin-top: 16px;
      h4 { margin: 0 0 12px; display: flex; align-items: center; gap: 6px; color: #303133; font-size: 15px; }
      .trace-summary { border-radius: 10px; padding: 18px; }
    }
  }

  /* 功能点1: 输入框聚焦变色、边框发光 */
  .focus-glow-form {
    :deep(.el-form-item:focus-within) {
      .el-input__wrapper,
      .el-textarea__inner,
      .el-select .el-input__wrapper {
        box-shadow: 0 0 0 1px #409eff inset, 0 0 12px rgba(64, 158, 255, 0.25);
        transition: box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }
  }

  /* 功能点2: 波纹扩散 */
  .ripple-btn {
    position: relative; overflow: hidden;
    border-radius: 8px;
    &::after {
      content: ''; position: absolute; left: 50%; top: 50%;
      width: 10px; height: 10px; background: rgba(255, 255, 255, 0.5);
      border-radius: 50%; transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
    }
    &:not(:disabled):active::after {
      animation: ripple 0.6s ease-out;
    }
  }
  @keyframes ripple {
    0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(40); opacity: 0; }
  }

  /* 功能点2: 点击偏移变色 */
  .click-offset {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    &:active {
      transform: translateY(2px);
      filter: brightness(0.85);
    }
  }

  /* 功能点3: 选中行高亮 */
  :deep(.el-table__body tr.row-selected > td.el-table__cell) {
    background-color: #ecf5ff !important;
  }

  /* 功能点3: 表格隔行变色增强 */
  :deep(.el-table__row.row-striped-alt) {
    background-color: #fafcff !important;
  }
  :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
    background: #fafcff;
  }
  :deep(.el-table--border .el-table__cell) {
    transition: background 0.2s ease;
  }
  :deep(.el-table__body tr:hover > td.el-table__cell) {
    background-color: #f0f9ff !important;
  }

  /* 功能点4: 返回顶部按钮 */
  .back-to-top {
    position: fixed;
    bottom: 60px;
    right: 40px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #409eff;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.35);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 999;
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    }
    &:active {
      transform: translateY(0);
    }
  }
  .fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }

  /* 功能点4: 表头固定 */
  :deep(.el-table .el-table__header-wrapper) {
    position: sticky;
    top: 0;
    z-index: 2;
  }

  /* 结果统计卡片 */
  .result-stat-card {
    background: #fff;
    padding: 16px;
    border-radius: 10px;
    border-left: 4px solid #409eff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    text-align: center;
  }

  /* 所有按钮统一8px圆角 */
  :deep(.el-button) {
    border-radius: 8px;
    transition: all 0.3s ease !important;
  }
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select .el-input__wrapper),
  :deep(.el-input-number__decrease),
  :deep(.el-input-number__increase),
  :deep(.el-date-editor.el-input__wrapper) {
    border-radius: 8px;
  }
  :deep(.el-tag) { border-radius: 8px; }
  :deep(.el-message-box) { border-radius: 12px; }

  /* 弹窗进入动画 */
  .scale-dialog {
    :deep(.el-dialog) {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
      transform-origin: center top;
      border-radius: 14px;
      overflow: hidden;
    }
    :deep(.el-dialog__header) { padding: 16px 20px; background: linear-gradient(135deg, #f5faff 0%, #fff 100%); }
    :deep(.el-dialog__title) { font-size: 15px; font-weight: 600; }
    :deep(.el-dialog__body) { padding: 8px 24px 16px; }
    :deep(.el-dialog__footer) { padding: 10px 24px 18px; }
  }

  /* Skeleton loading */
  :deep(.el-skeleton__item) {
    border-radius: 8px;
  }

  /* 分隔线样式 */
  :deep(.el-divider__text) {
    font-size: 13px;
    color: #606266;
    font-weight: 600;
  }
  :deep(.el-divider) { --el-border-style: dashed; }
}
</style>
   </think>