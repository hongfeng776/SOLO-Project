
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, RefreshLeft, Plus, Edit, Delete, Play, TrendCharts,
  Warning as WarningIcon,
  Odometer, Sunny, Trophy, Crown, Medal, Bell, Present,
  Check, Close, ArrowDown, ArrowRight, Calendar, Timer,
  Cpu, Document, CopyDocument, RefreshRight, DataLine,
  Setting, MagicStick, CircleCheck, Rank, View,
} from '@element-plus/icons-vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  SEGMENT_DIMENSION, SEGMENT_LEVEL, SEGMENT_RULE_STATUS, SEGMENT_CHANGE_TYPE,
  STRATEGY_TRIGGER_MODE, STRATEGY_STATUS, STRATEGY_TYPE, BENEFIT_TYPE,
  STRATEGY_PRESET_TEMPLATES, END_USER_TYPE, END_USER_ACTIVITY_LEVEL,
  getEnumOptions, getEnumLabel, getEnumItem,
} from '@/constants/enums'
import {
  getSegmentStatsApi,
  getSegmentRuleListApi, createSegmentRuleApi, updateSegmentRuleApi, deleteSegmentRuleApi,
  updateSegmentRuleStatusApi, runSegmentRuleCalcApi, validateSegmentThresholdsApi,
  getSegmentTagListApi, manualAdjustSegmentApi,
  getSegmentStrategyListApi, createSegmentStrategyApi, getSegmentStrategyPreviewApi, cancelSegmentStrategyApi,
  traceSegmentApi, validateSegmentMatchApi, checkSegmentBenefitFitApi,
} from '@/api/user-segment'
import { useUserStore } from '@/stores'
import { formatDate, formatNumber } from '@/utils'
import type { SegmentRuleItem, SegmentThreshold, SegmentStrategyItem, SegmentTagItem } from '@/types'

const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.roles.includes('SUPER_ADMIN'))

const activeTab = ref<'rules' | 'tags' | 'strategies' | 'trace'>('rules')
const loading = ref(false)
const stats = ref<any>(null)

const loadStats = async () => { try { stats.value = await getSegmentStatsApi() } catch { /* */ } }
const levelStatsCards = computed(() => {
  const byLevel = stats.value?.byLevel || []
  const map: Record<number, number> = {}
  byLevel.forEach((x: any) => { map[x.level] = x.count })
  return Object.values(SEGMENT_LEVEL).map((lv: any) => ({ ...lv, count: map[lv.value] || 0 }))
})
const generalStatsCards = computed(() => [
  { label: '分层规则总数', value: formatNumber(stats.value?.ruleCount || 0), color: '#409EFF', icon: Document },
  { label: '生效规则数', value: formatNumber(stats.value?.activeRuleCount || 0), color: '#67C23A', icon: CircleCheck },
  { label: '已分层用户', value: formatNumber(stats.value?.tagCount || 0), color: '#E6A23C', icon: Rank },
  { label: '运营策略数', value: formatNumber(stats.value?.strategyCount || 0), color: '#F56C6C', icon: Setting },
])

// 规则列表
const ruleList = ref<SegmentRuleItem[]>([])
const ruleTotal = ref(0)
const ruleQuery = reactive({ page: 1, pageSize: 10, keyword: '', status: null as number | null, dimension: null as string | null, sortBy: 'createdAt', sortOrder: 'DESC' as 'ASC' | 'DESC' })
const loadRuleList = async () => { loading.value = true; try { const res = await getSegmentRuleListApi({ ...ruleQuery }); ruleList.value = res.list; ruleTotal.value = res.pagination.total } finally { loading.value = false } }
const handleRulePageChange = (p: number) => { ruleQuery.page = p; loadRuleList() }
const handleRuleSizeChange = (s: number) => { ruleQuery.pageSize = s; ruleQuery.page = 1; loadRuleList() }
const handleRuleSearch = () => { ruleQuery.page = 1; loadRuleList() }
const handleRuleReset = () => { Object.assign(ruleQuery, { page: 1, keyword: '', status: null, dimension: null }); loadRuleList() }

const ruleColumns = [
  { prop: 'id', label: 'ID', width: 70 }, { prop: 'ruleName', label: '规则信息', minWidth: 220, slot: 'ruleInfo' },
  { label: '分层维度', width: 120, slot: 'dimension', align: 'center' },
  { label: '用户覆盖', width: 120, slot: 'coverage', align: 'center' },
  { label: '层级分布', minWidth: 220, slot: 'levelDist' },
  { label: '自动迭代', width: 100, slot: 'autoCalc', align: 'center' },
  { label: '状态', width: 100, slot: 'status', align: 'center' },
  { label: '创建时间', width: 160, slot: 'createdAt', align: 'center' },
  { label: '操作', width: 270, slot: 'actions', fixed: 'right', align: 'center' },
]

// 规则弹窗（功能点1）
const ruleDialogVisible = ref(false)
const ruleDialogMode = ref<'create' | 'edit'>('create')
const ruleFormRef = ref<FormInstance>()
const ruleValidateResult = ref<{ valid: boolean; reason?: string } | null>(null)
const ruleValidateLoading = ref(false)
const ruleDialogSubmitting = ref(false)
const hoverRuleCardId = ref<number | null>(null)
const defaultThresholds = (): SegmentThreshold[] => [
  { level: 2, min: 10, max: 30 }, { level: 3, min: 30, max: 80 },
  { level: 4, min: 80, max: 150 }, { level: 5, min: 150, max: null },
]
const ruleForm = reactive<any>({
  id: undefined, ruleName: '', ruleCode: '', description: '', dimension: 'COMPOSITE',
  thresholds: defaultThresholds(),
  weights: { PLAY: 0.25, INTERACTION: 0.3, CONSUMPTION: 0.25, PUBLISH: 0.2 },
  targetUserType: [], autoCalcEnabled: 1, status: 1, priority: 0, tagTemplate: {},
})
const weightsTotal = computed(() => {
  const w = ruleForm.weights || {}
  return Object.values(w).reduce((s: number, v: any) => s + (Number(v) || 0), 0)
})
const dimLabel = computed(() => (getEnumItem(SEGMENT_DIMENSION as any, ruleForm.dimension) as any)?.label || '综合评分')
const dimUnit = computed(() => (getEnumItem(SEGMENT_DIMENSION as any, ruleForm.dimension) as any)?.unit || '分')

const openRuleDialog = (mode: 'create' | 'edit', row?: SegmentRuleItem) => {
  ruleDialogMode.value = mode
  ruleValidateResult.value = null
  if (row) {
    Object.assign(ruleForm, JSON.parse(JSON.stringify(row)))
    if (!Array.isArray(ruleForm.thresholds)) ruleForm.thresholds = defaultThresholds()
  } else {
    Object.assign(ruleForm, { id: undefined, ruleName: '', ruleCode: '', description: '', dimension: 'COMPOSITE',
      thresholds: defaultThresholds(),
      weights: { PLAY: 0.25, INTERACTION: 0.3, CONSUMPTION: 0.25, PUBLISH: 0.2 },
      targetUserType: [], autoCalcEnabled: 1, status: 1, priority: 0, tagTemplate: {} })
  }
  ruleDialogVisible.value = true
}
const removeThreshold = (idx: number) => ruleForm.thresholds.splice(idx, 1)
const addThreshold = () => {
  const exist = ruleForm.thresholds.map((t: SegmentThreshold) => t.level)
  for (let lv = 1; lv <= 5; lv++) {
    if (!exist.includes(lv)) { ruleForm.thresholds.push({ level: lv, min: 0, max: null }); return }
  }
  ElMessage.warning('最多支持5个层级')
}
const doValidateThresholds = async () => {
  ruleValidateLoading.value = true
  try {
    ruleValidateResult.value = await validateSegmentThresholdsApi({
      thresholds: ruleForm.thresholds,
      weights: ruleForm.dimension === 'COMPOSITE' ? ruleForm.weights : undefined,
    })
  } finally { ruleValidateLoading.value = false }
}
watch([() => ruleForm.thresholds, () => ruleForm.weights, () => ruleForm.dimension], () => { ruleValidateResult.value = null }, { deep: true })
const submitRule = async () => {
  if (!ruleForm.ruleName?.trim()) { ElMessage.warning('请填写规则名称'); return }
  if (ruleForm.thresholds.length < 2) { ElMessage.warning('至少配置2个层级阈值'); return }
  if (ruleForm.dimension === 'COMPOSITE' && Math.abs(weightsTotal.value - 1) > 0.001) {
    ElMessage.warning(`权重总和需等于1，当前 ${weightsTotal.value.toFixed(2)}`); return
  }
  if (!ruleValidateResult.value) await doValidateThresholds()
  if (ruleValidateResult.value && !ruleValidateResult.value.valid) {
    ElMessage.error(ruleValidateResult.value.reason || '阈值校验不通过'); return
  }
  ruleDialogSubmitting.value = true
  try {
    if (ruleDialogMode.value === 'create') {
      await createSegmentRuleApi(ruleForm)
      ElMessage.success('规则创建成功' + (ruleForm.status === 2 ? '，已触发批量标签更新' : ''))
    } else { await updateSegmentRuleApi(ruleForm.id, ruleForm); ElMessage.success('规则更新成功') }
    ruleDialogVisible.value = false; loadRuleList(); loadStats()
  } finally { ruleDialogSubmitting.value = false }
}
const handleRuleRunCalc = async (row: SegmentRuleItem) => {
  try {
    await ElMessageBox.confirm(`确认立即为规则 [${row.ruleName}] 全量计算用户分层标签？`, '确认执行', { type: 'warning' })
    loading.value = true
    const res = await runSegmentRuleCalcApi(row.id)
    ElMessage.success(`已启动计算任务：批次号 ${res.operationBatch}`)
    loadRuleList()
  } catch { /* */ } finally { loading.value = false }
}
const handleRuleDelete = async (row: SegmentRuleItem) => {
  try {
    await ElMessageBox.confirm(`确认删除规则 [${row.ruleName}]？已打标签不受影响`, '确认删除', { type: 'error' })
    await deleteSegmentRuleApi(row.id); ElMessage.success('删除成功'); loadRuleList(); loadStats()
  } catch { /* */ }
}
const toggleRuleStatus = async (row: SegmentRuleItem, newStatus: number) => {
  try { await updateSegmentRuleStatusApi(row.id, newStatus); ElMessage.success('状态已更新'); loadRuleList(); loadStats() } catch { /* */ }
}

// 标签列表
const tagList = ref<SegmentTagItem[]>([])
const tagTotal = ref(0)
const tagQuery = reactive({ page: 1, pageSize: 10, currentLevel: null as number | null, ruleId: null as number | null, uid: '', changeType: null as string | null })
const loadTagList = async () => { loading.value = true; try { const res = await getSegmentTagListApi({ ...tagQuery }); tagList.value = res.list; tagTotal.value = res.pagination.total } finally { loading.value = false } }
const handleTagPageChange = (p: number) => { tagQuery.page = p; loadTagList() }
const handleTagSizeChange = (s: number) => { tagQuery.pageSize = s; tagQuery.page = 1; loadTagList() }
const handleTagSearch = () => { tagQuery.page = 1; loadTagList() }

const tagColumns = [
  { prop: 'userId', label: '用户ID', width: 90 }, { prop: 'uid', label: 'UID', width: 150, slot: 'uid' },
  { label: '当前层级', width: 120, slot: 'currentLevel', align: 'center' },
  { label: '来源', width: 110, slot: 'changeType', align: 'center' },
  { label: '行为快照', minWidth: 240, slot: 'behavior' },
  { label: '最近变更', width: 160, slot: 'changedAt', align: 'center' },
  { label: '操作', width: 120, slot: 'actions', fixed: 'right', align: 'center' },
]

// 手动调整弹窗（功能点2）
const adjustDialogVisible = ref(false)
const adjustTarget = ref<any>(null)
const adjustLoading = ref(false)
const adjustRippleKey = ref(0)
const adjustForm = reactive({ toLevel: 2, reason: '', remark: '', expireDays: null as number | null })
const openAdjustDialog = (row: SegmentTagItem) => {
  adjustTarget.value = row; adjustForm.toLevel = row.currentLevel || 2
  adjustForm.reason = ''; adjustForm.remark = ''; adjustForm.expireDays = null
  adjustDialogVisible.value = true
}
const submitAdjust = async () => {
  adjustRippleKey.value++
  if (!adjustForm.reason || adjustForm.reason.length < 5) { ElMessage.warning('请填写调整原因（至少5字）'); return }
  if (!adjustTarget.value?.userId) return
  adjustLoading.value = true
  try {
    await manualAdjustSegmentApi({ userId: adjustTarget.value.userId, ...adjustForm })
    ElMessage.success('层级调整完成，已联动对应权益策略')
    adjustDialogVisible.value = false; loadTagList()
  } finally { adjustLoading.value = false }
}

// 策略列表
const strategyList = ref<SegmentStrategyItem[]>([])
const strategyTotal = ref(0)
const strategyQuery = reactive({ page: 1, pageSize: 10, keyword: '', status: null as number | null, strategyType: null as string | null, triggerMode: null as number | null })
const loadStrategyList = async () => { loading.value = true; try { const res = await getSegmentStrategyListApi({ ...strategyQuery }); strategyList.value = res.list; strategyTotal.value = res.pagination.total } finally { loading.value = false } }
const handleStrategyPageChange = (p: number) => { strategyQuery.page = p; loadStrategyList() }
const handleStrategySizeChange = (s: number) => { strategyQuery.pageSize = s; strategyQuery.page = 1; loadStrategyList() }
const handleStrategySearch = () => { strategyQuery.page = 1; loadStrategyList() }

const strategyColumns = [
  { prop: 'id', label: 'ID', width: 70 }, { label: '策略信息', minWidth: 220, slot: 'strategyInfo' },
  { label: '目标层级', width: 180, slot: 'targetLevels' },
  { label: '触发方式', width: 120, slot: 'triggerMode', align: 'center' },
  { label: '状态', width: 100, slot: 'status', align: 'center' },
  { label: '执行结果', width: 160, slot: 'result', align: 'center' },
  { label: '创建时间', width: 160, slot: 'createdAt', align: 'center' },
  { label: '操作', width: 140, slot: 'actions', fixed: 'right', align: 'center' },
]

// 策略弹窗（功能点3）
const strategyDialogVisible = ref(false)
const strategyFormRef = ref<FormInstance>()
const strategyPreview = ref<any>(null)
const strategyPreviewLoading = ref(false)
const strategySubmitting = ref(false)

const defaultStrategy = (): Partial<SegmentStrategyItem> => ({
  strategyName: '', strategyCode: '', strategyType: 'BENEFIT', description: '',
  targetLevels: [], targetMinActivity: [], targetUserType: [], targetMinConsumption: undefined,
  benefitConfig: { type: 'VIP_DAY', value: 7, expireDays: 30 },
  pushConfig: { title: '', content: '', channels: ['APP'] },
  welfareConfig: { type: 'CREDIT', value: 100 },
  guideConfig: { taskIds: [], rewards: [] },
  triggerMode: 1, triggerTime: '', recurringCron: '',
})
const strategyForm = reactive<Partial<SegmentStrategyItem>>(defaultStrategy())

const openStrategyDialog = (templateId?: string) => {
  strategyPreview.value = null
  if (templateId) {
    const tpl = (STRATEGY_PRESET_TEMPLATES as any[]).find(x => x.id === templateId)
    if (tpl) {
      Object.assign(strategyForm, defaultStrategy(), {
        strategyName: tpl.label, strategyType: tpl.type, description: tpl.desc,
        targetLevels: [...tpl.targetLevels],
        targetMinActivity: tpl.targetMinActivity ? [...tpl.targetMinActivity] : [],
        ...tpl.config,
      })
    }
  } else { Object.assign(strategyForm, defaultStrategy()) }
  strategyDialogVisible.value = true
}
const fetchStrategyPreview = async () => {
  if (!strategyForm.targetLevels?.length) { ElMessage.warning('请先选择目标层级'); return }
  strategyPreviewLoading.value = true
  try {
    const mock: any = await getSegmentTagListApi({ page: 1, pageSize: 1000 })
    const rows: SegmentTagItem[] = mock.list.filter((t: SegmentTagItem) => strategyForm.targetLevels!.includes(t.currentLevel))
    const byLevel: Record<number, number> = {}
    rows.forEach(r => { byLevel[r.currentLevel] = (byLevel[r.currentLevel] || 0) + 1 })
    strategyPreview.value = { total: rows.length, byLevel: Object.entries(byLevel).map(([lv, cnt]) => ({ level: Number(lv), count: cnt })) }
  } finally { strategyPreviewLoading.value = false }
}
const submitStrategy = async () => {
  if (!strategyForm.strategyName?.trim()) { ElMessage.warning('请填写策略名称'); return }
  if (!strategyForm.targetLevels?.length) { ElMessage.warning('请选择目标用户层级'); return }
  if (strategyForm.triggerMode === 2 && !strategyForm.triggerTime) { ElMessage.warning('定时策略需指定时间'); return }
  strategySubmitting.value = true
  try {
    await createSegmentStrategyApi(strategyForm)
    ElMessage.success('策略创建成功' + (strategyForm.triggerMode === 1 ? '，已即时生效' : ''))
    strategyDialogVisible.value = false; loadStrategyList(); loadStats()
  } finally { strategySubmitting.value = false }
}
const handleStrategyCancel = async (row: SegmentStrategyItem) => {
  try {
    await ElMessageBox.confirm(`确认取消策略 [${row.strategyName}]？`, '确认', { type: 'warning' })
    await cancelSegmentStrategyApi(row.id); ElMessage.success('已取消'); loadStrategyList()
  } catch { /* */ }
}

// 溯源面板（功能点4）
const traceLoading = ref(false)
const traceInputUserId = ref<string>('')
const traceInputRuleId = ref<string>('')
const traceResult = ref<any>(null)
const validateResult = ref<any>(null)
const benefitFitResult = ref<any>(null)
const doTrace = async () => { const id = Number(traceInputUserId.value); if (!id) { ElMessage.warning('请输入用户ID'); return }; traceLoading.value = true; try { traceResult.value = await traceSegmentApi(id); benefitFitResult.value = null } finally { traceLoading.value = false } }
const doValidateMatch = async () => { const id = Number(traceInputRuleId.value); if (!id) { ElMessage.warning('请输入规则ID'); return }; traceLoading.value = true; try { validateResult.value = await validateSegmentMatchApi(id); benefitFitResult.value = null } finally { traceLoading.value = false } }
const doCheckBenefitFit = async () => { const lv = (traceResult.value?.tag?.currentLevel) || 4; const cfg = strategyForm.benefitConfig || { type: 'VIP_DAY', value: 7 }; try { benefitFitResult.value = await checkSegmentBenefitFitApi({ level: lv, benefitConfig: cfg }) } catch { /* */ } }
const clearTracePanel = () => { traceResult.value = null; validateResult.value = null; benefitFitResult.value = null; traceInputUserId.value = ''; traceInputRuleId.value = '' }

watch(activeTab, (val) => { if (val === 'tags') loadTagList(); else if (val === 'strategies') loadStrategyList() })
onMounted(() => { loadStats(); loadRuleList() })
</script>

<template>
  <div class="user-segment-page">
    <!-- 顶部通用统计卡片 -->
    <el-row :gutter="12" class="top-stats">
      <el-col v-for="(card, idx) in generalStatsCards" :key="'g'+idx" :xs="12" :sm="6" :md="6" :lg="6">
        <div class="stat-card general-card card-hover" :style="{ borderLeftColor: card.color }">
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
    <el-row :gutter="12" class="top-stats level-stats" style="margin-top: 0">
      <el-col v-for="(lv, idx) in levelStatsCards" :key="'lv'+idx" :xs="12" :sm="12" :md="(24/5|0)">
        <div class="stat-card level-card card-hover" :style="{ borderLeftColor: lv.color }">
          <div class="level-icon" :style="{ color: lv.color }">
            <el-icon :size="28"><component :is="(lv as any).icon || Crown" /></el-icon>
          </div>
          <div class="level-body">
            <div class="level-name" :style="{ color: lv.color }">{{ lv.label }}</div>
            <div class="level-desc">{{ (lv as any).desc }}</div>
            <div class="level-count">共 <b>{{ formatNumber(lv.count) }}</b> 人</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Tabs -->
    <div class="tabs-wrap card-content">
      <el-tabs v-model="activeTab" class="main-tabs">
        <!-- Tab1: 规则管理 -->
        <el-tab-pane label="① 分层规则管理" name="rules">
          <div class="filter-bar">
            <el-form :inline="true" :model="ruleQuery" @submit.prevent>
              <el-form-item label="关键词">
                <el-input v-model="ruleQuery.keyword" placeholder="规则名称/编码" clearable style="width: 200px" @keyup.enter="handleRuleSearch" />
              </el-form-item>
              <el-form-item label="维度">
                <el-select v-model="ruleQuery.dimension" placeholder="全部分层维度" clearable style="width: 160px">
                  <el-option v-for="(opt, k) in SEGMENT_DIMENSION" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="ruleQuery.status" placeholder="全部状态" clearable style="width: 140px">
                  <el-option v-for="(opt, k) in SEGMENT_RULE_STATUS" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleRuleSearch">搜索</el-button>
                <el-button :icon="RefreshLeft" @click="handleRuleReset">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <QyTableToolbar
            :loading="loading"
            :show-batch-actions="false"
            :selected-count="0"
            create-text="新建分层规则"
            @create="openRuleDialog('create')"
            @refresh="loadRuleList"
          >
            <template #right>
              <el-tag type="info" effect="plain">共 <b style="color:#409EFF">{{ formatNumber(ruleTotal) }}</b> 条规则</el-tag>
            </template>
          </QyTableToolbar>

          <el-table :data="ruleList" v-loading="loading" size="default" stripe border row-key="id"
            :header-cell-style="{ background: '#fafbfc' }">
            <el-table-column v-for="col in ruleColumns" :key="col.prop || col.slot" v-bind="col as any">
              <template v-if="col.slot === 'ruleInfo'" #default="{ row }">
                <div class="rule-info">
                  <div class="rule-name">
                    <el-icon :size="16" color="#409EFF" style="margin-right:4px;vertical-align:-2px"><DataLine /></el-icon>
                    <b>{{ row.ruleName }}</b>
                  </div>
                  <div class="rule-sub">编码: <span class="mono">{{ row.ruleCode }}</span></div>
                  <div v-if="row.description" class="rule-desc">{{ row.description }}</div>
                </div>
              </template>
              <template v-else-if="col.slot === 'dimension'" #default="{ row }">
                <el-tag :type="(getEnumItem(SEGMENT_DIMENSION as any, row.dimension) as any)?.type || 'info'" effect="light">
                  {{ getEnumLabel(SEGMENT_DIMENSION as any, row.dimension) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'coverage'" #default="{ row }">
                <div class="coverage-num">
                  <b style="color:#409EFF;font-size:16px">{{ formatNumber(row.userCount || 0) }}</b>
                  <span style="color:#909399;font-size:12px"> 人</span>
                </div>
              </template>
              <template v-else-if="col.slot === 'levelDist'" #default="{ row }">
                <div class="level-dist">
                  <div v-for="stat in (row.levelStats || [])" :key="stat.level" class="dist-bar"
                    :style="{ width: Math.max(24, (stat.count / Math.max(1, row.userCount || 1)) * 180) + 'px',
                    background: (getEnumItem(SEGMENT_LEVEL as any, stat.level) as any)?.color }"
                    :title="`L${stat.level}: ${stat.count}人`">
                    <span class="dist-label">L{{ stat.level }}</span>
                  </div>
                </div>
              </template>
              <template v-else-if="col.slot === 'autoCalc'" #default="{ row }">
                <el-switch v-model="row.autoCalcEnabled" :active-value="1" :inactive-value="0"
                  :disabled="!isSuperAdmin && row.status !== 2" inline-prompt active-text="开" inactive-text="关"
                  @change="async (val) => { await updateSegmentRuleApi(row.id, { autoCalcEnabled: val }); ElMessage.success('已更新') }" />
              </template>
              <template v-else-if="col.slot === 'status'" #default="{ row }">
                <el-tag :type="(getEnumItem(SEGMENT_RULE_STATUS as any, row.status) as any)?.type" effect="dark" size="small">
                  {{ getEnumLabel(SEGMENT_RULE_STATUS as any, row.status) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'createdAt'" #default="{ row }">
                <div style="font-size:12px">
                  <div>{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</div>
                  <div style="color:#909399">{{ row.lastCalcAt ? '上次: ' + formatDate(row.lastCalcAt, 'MM-DD HH:mm') : '未计算' }}</div>
                </div>
              </template>
              <template v-else-if="col.slot === 'actions'" #default="{ row }">
                <el-button type="primary" link :icon="Edit" @click="openRuleDialog('edit', row)">编辑</el-button>
                <el-button type="success" link :icon="Play" @click="handleRuleRunCalc(row)">运行</el-button>
                <el-dropdown trigger="click" @command="(cmd: any) => {
                  if (cmd === 'active') toggleRuleStatus(row, 2)
                  else if (cmd === 'pause') toggleRuleStatus(row, 3)
                  else if (cmd === 'delete') handleRuleDelete(row)
                }">
                  <el-button type="primary" link>更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="active" v-if="row.status !== 2">设为生效</el-dropdown-item>
                      <el-dropdown-item command="pause" v-if="row.status === 2">暂停使用</el-dropdown-item>
                      <el-dropdown-item divided command="delete" style="color:#F56C6C">删除规则</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top:12px;text-align:right">
            <el-pagination background layout="total, sizes, prev, pager, next, jumper"
              :current-page="ruleQuery.page" :page-size="ruleQuery.pageSize"
              :page-sizes="[10,20,50,100]" :total="ruleTotal"
              @current-change="handleRulePageChange" @size-change="handleRuleSizeChange" />
          </div>
        </el-tab-pane>

        <!-- Tab2: 用户标签 -->
        <el-tab-pane label="② 用户分层标签" name="tags">
          <div class="filter-bar">
            <el-form :inline="true" :model="tagQuery" @submit.prevent>
              <el-form-item label="UID"><el-input v-model="tagQuery.uid" placeholder="用户UID模糊搜" clearable style="width:180px" @keyup.enter="handleTagSearch" /></el-form-item>
              <el-form-item label="当前层级">
                <el-select v-model="tagQuery.currentLevel" placeholder="全部" clearable style="width:140px">
                  <el-option v-for="(opt, k) in SEGMENT_LEVEL" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="来源">
                <el-select v-model="tagQuery.changeType" placeholder="全部" clearable style="width:140px">
                  <el-option v-for="(opt, k) in SEGMENT_CHANGE_TYPE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleTagSearch">搜索</el-button>
                <el-button :icon="RefreshRight" @click="() => { Object.assign(tagQuery, {page:1, uid:'', currentLevel:null, ruleId:null, changeType:null}); loadTagList() }">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-table :data="tagList" v-loading="loading" size="default" stripe border :header-cell-style="{ background: '#fafbfc' }">
            <el-table-column v-for="col in tagColumns" :key="col.prop || col.slot" v-bind="col as any">
              <template v-if="col.slot === 'uid'" #default="{ row }">
                <span class="mono" style="color:#409EFF">{{ row.uid }}</span>
              </template>
              <template v-else-if="col.slot === 'currentLevel'" #default="{ row }">
                <div>
                  <el-tag :type="(getEnumItem(SEGMENT_LEVEL as any, row.currentLevel) as any)?.type" effect="dark" size="small">
                    {{ getEnumLabel(SEGMENT_LEVEL as any, row.currentLevel) }}
                  </el-tag>
                  <div v-if="row.previousLevel" style="font-size:11px;color:#909399;margin-top:2px">
                    由 L{{ row.previousLevel }} {{ row.currentLevel > row.previousLevel ? '↑升级' : '↓降级' }}
                  </div>
                </div>
              </template>
              <template v-else-if="col.slot === 'changeType'" #default="{ row }">
                <el-tag v-if="row.changeType" :type="(getEnumItem(SEGMENT_CHANGE_TYPE as any, row.changeType) as any)?.type" effect="plain" size="small">
                  {{ getEnumLabel(SEGMENT_CHANGE_TYPE as any, row.changeType) }}
                </el-tag>
                <span v-else style="color:#909399">-</span>
              </template>
              <template v-else-if="col.slot === 'behavior'" #default="{ row }">
                <div class="behavior-grid">
                  <span>📺 {{ formatNumber(row.behaviorSnapshot?.play || 0) }}</span>
                  <span>💬 {{ formatNumber(row.behaviorSnapshot?.interaction || 0) }}</span>
                  <span>💰 {{ formatNumber(row.behaviorSnapshot?.consumption || 0) }}</span>
                  <span>✍️ {{ formatNumber(row.behaviorSnapshot?.publish || 0) }}</span>
                </div>
              </template>
              <template v-else-if="col.slot === 'changedAt'" #default="{ row }">
                <div v-if="row.changedAt" style="font-size:12px">
                  <div>{{ formatDate(row.changedAt, 'YYYY-MM-DD HH:mm') }}</div>
                  <div v-if="row.expireAt" style="color:#E6A23C">到期: {{ formatDate(row.expireAt, 'MM-DD') }}</div>
                </div>
                <span v-else style="color:#909399">未变更</span>
              </template>
              <template v-else-if="col.slot === 'actions'" #default="{ row }">
                <el-button type="primary" link :icon="MagicStick" @click="openAdjustDialog(row)">手动调整</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top:12px;text-align:right">
            <el-pagination background layout="total, sizes, prev, pager, next"
              :current-page="tagQuery.page" :page-size="tagQuery.pageSize"
              :page-sizes="[10,20,50,100]" :total="tagTotal"
              @current-change="handleTagPageChange" @size-change="handleTagSizeChange" />
          </div>
        </el-tab-pane>

        <!-- Tab3: 运营策略 -->
        <el-tab-pane label="③ 运营策略配置" name="strategies">
          <div class="filter-bar">
            <el-form :inline="true" :model="strategyQuery" @submit.prevent>
              <el-form-item label="关键词"><el-input v-model="strategyQuery.keyword" placeholder="策略名称/编码" clearable style="width:200px" @keyup.enter="handleStrategySearch" /></el-form-item>
              <el-form-item label="策略类型">
                <el-select v-model="strategyQuery.strategyType" placeholder="全部" clearable style="width:140px">
                  <el-option v-for="(opt, k) in STRATEGY_TYPE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="strategyQuery.status" placeholder="全部" clearable style="width:120px">
                  <el-option v-for="(opt, k) in STRATEGY_STATUS" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleStrategySearch">搜索</el-button>
                <el-button :icon="RefreshLeft" @click="() => { Object.assign(strategyQuery, {page:1, keyword:'', status:null, strategyType:null, triggerMode:null}); loadStrategyList() }">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 策略模板栏 -->
          <div class="strategy-template-bar card-content" style="margin-bottom:16px;padding:16px;background:#f8fafb">
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
              <span style="font-weight:600;color:#606266">🎯 常用策略模板（点击快速创建）：</span>
              <div v-for="tpl in STRATEGY_PRESET_TEMPLATES" :key="tpl.id"
                class="tpl-card card-hover"
                :style="{ borderColor: (getEnumItem(STRATEGY_TYPE as any, tpl.type) as any)?.color }"
                @click="openStrategyDialog(tpl.id)">
                <div class="tpl-title">
                  <el-icon :size="14" :color="(getEnumItem(STRATEGY_TYPE as any, tpl.type) as any)?.color">
                    <component :is="(getEnumItem(STRATEGY_TYPE as any, tpl.type) as any)?.icon || Setting" />
                  </el-icon>
                  <b>{{ tpl.label }}</b>
                </div>
                <div class="tpl-desc">{{ tpl.desc }}</div>
                <div class="tpl-target">
                  <el-tag v-for="lv in tpl.targetLevels" :key="lv" size="small" :type="(getEnumItem(SEGMENT_LEVEL as any, lv) as any)?.type" effect="plain">L{{ lv }}</el-tag>
                </div>
              </div>
              <el-button type="primary" :icon="Plus" round @click="openStrategyDialog()">自定义策略</el-button>
            </div>
          </div>

          <el-table :data="strategyList" v-loading="loading" size="default" stripe border :header-cell-style="{ background: '#fafbfc' }">
            <el-table-column v-for="col in strategyColumns" :key="col.prop || col.slot" v-bind="col as any">
              <template v-if="col.slot === 'strategyInfo'" #default="{ row }">
                <div class="rule-info">
                  <div class="rule-name">
                    <el-icon :size="15" :color="(getEnumItem(STRATEGY_TYPE as any, row.strategyType) as any)?.color" style="vertical-align:-2px">
                      <component :is="(getEnumItem(STRATEGY_TYPE as any, row.strategyType) as any)?.icon || Setting" />
                    </el-icon>
                    <b>{{ row.strategyName }}</b>
                    <el-tag size="small" effect="plain" style="margin-left:6px" :type="(getEnumItem(STRATEGY_TYPE as any, row.strategyType) as any)?.type">
                      {{ getEnumLabel(STRATEGY_TYPE as any, row.strategyType) }}
                    </el-tag>
                  </div>
                  <div class="rule-sub">编码: <span class="mono">{{ row.strategyCode }}</span></div>
                  <div v-if="row.description" class="rule-desc">{{ row.description }}</div>
                </div>
              </template>
              <template v-else-if="col.slot === 'targetLevels'" #default="{ row }">
                <div style="display:flex;gap:4px;flex-wrap:wrap">
                  <el-tag v-for="lv in (row.targetLevels || [])" :key="lv" size="small"
                    :type="(getEnumItem(SEGMENT_LEVEL as any, lv) as any)?.type" effect="dark">
                    {{ getEnumLabel(SEGMENT_LEVEL as any, lv) }}
                  </el-tag>
                </div>
              </template>
              <template v-else-if="col.slot === 'triggerMode'" #default="{ row }">
                <div>
                  <el-tag :type="(getEnumItem(STRATEGY_TRIGGER_MODE as any, row.triggerMode) as any)?.type" effect="light" size="small">
                    <el-icon :size="12"><component :is="row.triggerMode === 2 ? Timer : row.triggerMode === 3 ? RefreshRight : Cpu" /></el-icon>
                    {{ getEnumLabel(STRATEGY_TRIGGER_MODE as any, row.triggerMode) }}
                  </el-tag>
                  <div v-if="row.triggerMode === 2 && row.triggerTime" style="font-size:11px;color:#909399;margin-top:2px">
                    {{ formatDate(row.triggerTime, 'MM-DD HH:mm') }}
                  </div>
                </div>
              </template>
              <template v-else-if="col.slot === 'status'" #default="{ row }">
                <el-tag :type="(getEnumItem(STRATEGY_STATUS as any, row.status) as any)?.type" effect="dark" size="small">
                  {{ getEnumLabel(STRATEGY_STATUS as any, row.status) }}
                </el-tag>
              </template>
              <template v-else-if="col.slot === 'result'" #default="{ row }">
                <div v-if="row.status >= 3" style="font-size:12px">
                  <div>🎯 {{ formatNumber(row.targetUserCount || 0) }}</div>
                  <div style="color:#67C23A">✓ {{ formatNumber(row.successCount || 0) }}</div>
                  <div v-if="row.failedCount" style="color:#F56C6C">✗ {{ formatNumber(row.failedCount) }}</div>
                </div>
                <span v-else style="color:#909399">-</span>
              </template>
              <template v-else-if="col.slot === 'createdAt'" #default="{ row }">
                <div style="font-size:12px">
                  <div>{{ formatDate(row.createdAt, 'YYYY-MM-DD') }}</div>
                  <div v-if="row.executedAt" style="color:#909399">执行: {{ formatDate(row.executedAt, 'MM-DD HH:mm') }}</div>
                </div>
              </template>
              <template v-else-if="col.slot === 'actions'" #default="{ row }">
                <el-button type="primary" link :icon="View" @click="() => { activeTab = 'trace'; nextTick(() => { traceInputRuleId.value = String(row.id || 1); doValidateMatch() }) }">校验</el-button>
                <el-button v-if="row.status === 1" type="danger" link @click="handleStrategyCancel(row)">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="margin-top:12px;text-align:right">
            <el-pagination background layout="total, sizes, prev, pager, next"
              :current-page="strategyQuery.page" :page-size="strategyQuery.pageSize"
              :page-sizes="[10,20,50,100]" :total="strategyTotal"
              @current-change="handleStrategyPageChange" @size-change="handleStrategySizeChange" />
          </div>
        </el-tab-pane>

        <!-- Tab4: 溯源与校验 -->
        <el-tab-pane label="④ 溯源与合理性校验" name="trace">
          <div class="trace-panel card-content">
            <div class="trace-tabs-bar">
              <div class="trace-search-row">
                <div class="trace-search-group">
                  <div style="font-weight:600;margin-bottom:8px">🔍 按用户ID溯源（全生命周期）</div>
                  <el-input v-model="traceInputUserId" placeholder="请输入用户ID（如 10001）" clearable style="width:240px;margin-right:8px" @keyup.enter="doTrace" />
                  <el-button type="primary" :icon="Search" :loading="traceLoading" @click="doTrace">溯源查询</el-button>
                </div>
                <el-divider direction="vertical" />
                <div class="trace-search-group">
                  <div style="font-weight:600;margin-bottom:8px">🧪 按规则ID校验（分层匹配度）</div>
                  <el-input v-model="traceInputRuleId" placeholder="请输入规则ID" clearable style="width:220px;margin-right:8px" @keyup.enter="doValidateMatch" />
                  <el-button type="warning" :icon="WarningIcon" :loading="traceLoading" @click="doValidateMatch">执行校验</el-button>
                  <el-button :icon="RefreshLeft" @click="clearTracePanel" style="margin-left:8px">清空</el-button>
                </div>
              </div>
            </div>

            <div v-if="traceResult" class="trace-result-block">
              <h4 style="margin:16px 0 12px"><el-icon color="#67C23A"><CircleCheck /></el-icon> 用户ID {{ traceResult.tag.userId }} 分层溯源结果</h4>
              <div class="trace-summary card-content" style="background:#fafbfc">
                <el-row :gutter="16">
                  <el-col :span="8"><div style="font-size:13px;color:#909399;margin-bottom:4px">UID</div><div class="mono">{{ traceResult.tag.uid }}</div></el-col>
                  <el-col :span="8">
                    <div style="font-size:13px;color:#909399;margin-bottom:4px">当前层级</div>
                    <el-tag :type="(getEnumItem(SEGMENT_LEVEL as any, traceResult.tag.currentLevel) as any)?.type" effect="dark">
                      {{ getEnumLabel(SEGMENT_LEVEL as any, traceResult.tag.currentLevel) }}
                    </el-tag>
                    <span v-if="traceResult.tag.previousLevel" style="margin-left:8px;color:#909399">(from L{{ traceResult.tag.previousLevel }})</span>
                  </el-col>
                  <el-col :span="8">
                    <div style="font-size:13px;color:#909399;margin-bottom:4px">分层来源</div>
                    <el-tag v-if="traceResult.tag.changeType"
                      :type="(getEnumItem(SEGMENT_CHANGE_TYPE as any, traceResult.tag.changeType) as any)?.type" size="small">
                      {{ getEnumLabel(SEGMENT_CHANGE_TYPE as any, traceResult.tag.changeType) }}
                    </el-tag>
                  </el-col>
                </el-row>
                <el-divider />
                <div style="margin-top:8px">
                  <div style="font-weight:600;margin-bottom:8px">📋 变更日志（展示前20条）</div>
                  <el-table :data="traceResult.logs.slice(0, 20)" size="small" border stripe :header-cell-style="{ background: '#eef2f6' }">
                    <el-table-column label="时间" width="160">
                      <template #default="{ row }">{{ formatDate(row.createdAt, 'YYYY-MM-DD HH:mm') }}</template>
                    </el-table-column>
                    <el-table-column label="类型" width="110">
                      <template #default="{ row }">
                        <el-tag :type="(getEnumItem(SEGMENT_CHANGE_TYPE as any, row.changeType) as any)?.type" effect="plain" size="small">
                          {{ getEnumLabel(SEGMENT_CHANGE_TYPE as any, row.changeType) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="层级变化" width="170">
                      <template #default="{ row }">
                        <span style="color:#909399">L{{ row.fromLevel || '?' }}</span>
                        <el-icon style="margin:0 4px"><ArrowRight /></el-icon>
                        <span style="font-weight:600;color:(getEnumItem(SEGMENT_LEVEL as any, row.toLevel) as any)?.color">L{{ row.toLevel }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="原因/说明" min-width="200" show-overflow-tooltip>
                      <template #default="{ row }">
                        <div style="font-size:12px">{{ row.adjustReason || '-' }}</div>
                        <div v-if="row.operatorName" style="color:#909399;font-size:11px">操作人: {{ row.operatorName }}</div>
                      </template>
                    </el-table-column>
                    <el-table-column label="批次号" width="130">
                      <template #default="{ row }">
                        <span v-if="row.operationBatch" class="mono" style="color:#409EFF;font-size:11px">{{ row.operationBatch.slice(-10) }}</span>
                        <span v-else style="color:#909399">-</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div style="margin-top:12px">
                  <el-button type="primary" :icon="Medal" @click="doCheckBenefitFit">校验权益适配合理性</el-button>
                </div>
                <div v-if="benefitFitResult" style="margin-top:12px">
                  <el-alert v-if="benefitFitResult.fit" type="success" :closable="false" show-icon
                    :title="'✅ 权益配置与 L' + traceResult.tag.currentLevel + ' 层级匹配合理'" />
                  <el-alert v-else type="warning" :closable="false" show-icon
                    :title="'⚠️ 权益与该层级不完全匹配: ' + (benefitFitResult.suggestions?.[0] || '')" />
                </div>
              </div>
            </div>

            <div v-if="validateResult" class="trace-result-block">
              <h4 style="margin:16px 0 12px"><el-icon color="#E6A23C"><WarningIcon /></el-icon> 规则ID {{ validateResult.rule?.id }} 分层匹配度校验</h4>
              <div class="trace-summary card-content" style="background:#fafbfc">
                <el-descriptions :column="3" size="small" border>
                  <el-descriptions-item label="规则名称">{{ validateResult.rule?.ruleName }}</el-descriptions-item>
                  <el-descriptions-item label="采样用户"><b style="color:#409EFF">{{ formatNumber(validateResult.sampleCount) }}</b> 人</el-descriptions-item>
                  <el-descriptions-item label="不匹配数"><b :style="{ color: validateResult.mismatchCount > 0 ? '#F56C6C' : '#67C23A' }">{{ formatNumber(validateResult.mismatchCount) }}</b> 人</el-descriptions-item>
                  <el-descriptions-item label="匹配度" :span="3">
                    <el-progress :percentage="validateResult.sampleCount ? Math.round(((validateResult.sampleCount - validateResult.mismatchCount) / validateResult.sampleCount) * 100) : 100"
                      :status="validateResult.mismatchCount > 50 ? 'warning' : validateResult.mismatchCount > 0 ? '' : 'success'" :stroke-width="16" />
                  </el-descriptions-item>
                </el-descriptions>
                <el-collapse v-if="validateResult.issues?.length" style="margin-top:12px">
                  <el-collapse-item :title="'异常明细（展示前50条 / 共 ' + validateResult.issues.length + ' 条）'" name="issues">
                    <el-table :data="validateResult.issues.slice(0, 50)" size="small" border stripe>
                      <el-table-column prop="userId" label="用户ID" width="90" />
                      <el-table-column prop="uid" label="UID" width="140" />
                      <el-table-column label="期望层级" width="100">
                        <template #default="{ row }"><el-tag :type="(getEnumItem(SEGMENT_LEVEL as any, row.expectedLevel) as any)?.type" size="small">L{{ row.expectedLevel }}</el-tag></template>
                      </el-table-column>
                      <el-table-column label="实际层级" width="100">
                        <template #default="{ row }"><el-tag :type="(getEnumItem(SEGMENT_LEVEL as any, row.actualLevel) as any)?.type" size="small" effect="dark">L{{ row.actualLevel }}</el-tag></template>
                      </el-table-column>
                      <el-table-column label="行为值" width="100"><template #default="{ row }"><b>{{ formatNumber(row.behaviorValue) }}</b></template></el-table-column>
                      <el-table-column prop="reason" label="原因" />
                    </el-table>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>

            <el-empty v-if="!traceResult && !validateResult" description="请在上方输入用户ID或规则ID开始溯源/校验" :image-size="120" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 功能点1：规则创建/编辑弹窗 -->
    <el-dialog v-model="ruleDialogVisible"
      :title="ruleDialogMode === 'create' ? '① 新建分层规则' : '编辑分层规则'"
      width="820px" :close-on-click-modal="false" append-to-body class="scale-dialog">
      <el-form :model="ruleForm" label-width="110px" ref="ruleFormRef">
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="规则名称" required>
              <el-input v-model="ruleForm.ruleName" placeholder="例如: 综合评分分层（标准版）" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="规则编码">
              <el-input v-model="ruleForm.ruleCode" placeholder="留空自动生成" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分层维度" required>
              <el-select v-model="ruleForm.dimension" style="width:100%">
                <el-option v-for="(opt, k) in SEGMENT_DIMENSION" :key="k" :label="opt.label + '（' + opt.desc + '）'" :value="opt.value">
                  <span><el-tag size="small" :type="(opt as any).type">{{ opt.label }}</el-tag>
                    <span style="margin-left:6px;color:#909399;font-size:12px">{{ opt.desc }}</span></span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="初始状态">
              <el-radio-group v-model="ruleForm.status">
                <el-radio :value="1">草稿</el-radio>
                <el-radio :value="2" :disabled="!isSuperAdmin && ruleDialogMode === 'edit'">立即生效</el-radio>
                <el-radio :value="3">暂停</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="规则描述">
              <el-input v-model="ruleForm.description" type="textarea" :rows="2" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">分层阈值（{{ dimLabel }} · 单位: {{ dimUnit }}）</el-divider>
        <div class="threshold-editor">
          <el-alert
            v-if="ruleValidateResult && !ruleValidateResult.valid"
            :title="ruleValidateResult.reason || '阈值设置异常，请修改'"
            type="error" show-icon :closable="false" style="margin-bottom:12px" />
          <el-alert v-else-if="ruleValidateResult && ruleValidateResult.valid"
            title="✅ 阈值校验通过" type="success" show-icon :closable="false" style="margin-bottom:12px" />

          <el-table :data="ruleForm.thresholds" size="default" border
            :header-cell-style="{ background: '#eef2f6' }" style="margin-bottom:8px">
            <el-table-column label="目标层级" width="150">
              <template #default="{ row }">
                <el-select v-model="row.level" style="width:100%">
                  <el-option v-for="(opt, k) in SEGMENT_LEVEL" :key="k" :label="opt.label" :value="opt.value">
                    <el-tag size="small" :type="(opt as any).type">{{ opt.label }}</el-tag>
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="最小值（≥）" min-width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.min" :min="0" controls-position="right" style="width:100%" />
              </template>
            </el-table-column>
            <el-table-column label="最大值（<）" min-width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.max" :min="0" controls-position="right" placeholder="留空表示无上限" style="width:100%" />
              </template>
            </el-table-column>
            <el-table-column label="区间预览" min-width="180">
              <template #default="{ row }">
                <div class="range-preview">
                  [ <b>{{ row.min ?? 0 }}</b>
                  <span style="margin:0 6px">,</span>
                  <b>{{ row.max ?? '∞' }}</b>
                  <span style="margin-left:4px">) {{ dimUnit }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button type="danger" link :icon="Delete" @click="removeThreshold($index)"
                  :disabled="ruleForm.thresholds.length <= 2">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div style="display:flex;gap:8px">
            <el-button :icon="Plus" plain @click="addThreshold">+ 添加层级阈值</el-button>
            <el-button :icon="Check" type="success" :loading="ruleValidateLoading" plain @click="doValidateThresholds">预校验阈值</el-button>
          </div>
        </div>

        <el-divider v-if="ruleForm.dimension === 'COMPOSITE'" content-position="left">维度权重（综合评分，总和须 = 1）</el-divider>
        <div v-if="ruleForm.dimension === 'COMPOSITE'" class="weights-editor">
          <div class="weights-total" :class="{ ok: Math.abs(weightsTotal - 1) < 0.001, warn: Math.abs(weightsTotal - 1) >= 0.001 }">
            权重总和: <b>{{ weightsTotal.toFixed(2) }}</b> / 1.00
            <el-tag v-if="Math.abs(weightsTotal - 1) < 0.001" size="small" type="success" effect="dark" style="margin-left:8px">✓ 正确</el-tag>
            <el-tag v-else size="small" type="danger" effect="dark" style="margin-left:8px">⚠ 需调整</el-tag>
          </div>
          <el-row :gutter="16">
            <el-col v-for="(opt, k) in ['PLAY', 'INTERACTION', 'CONSUMPTION', 'PUBLISH']" :key="k" :span="6">
              <div style="font-size:12px;color:#606266;margin-bottom:4px"><b>{{ getEnumLabel(SEGMENT_DIMENSION as any, k) }}</b></div>
              <el-input-number v-model="ruleForm.weights[k]" :min="0" :max="1" :step="0.05" :precision="2" style="width:100%" controls-position="right" />
            </el-col>
          </el-row>
        </div>

        <el-divider content-position="left">适用范围与迭代</el-divider>
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="适用用户类型">
              <el-select v-model="ruleForm.targetUserType" multiple placeholder="全部用户" style="width:100%">
                <el-option v-for="(opt, k) in END_USER_TYPE" :key="k" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="优先级">
              <el-input-number v-model="ruleForm.priority" :min="0" :max="999" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="自动迭代">
              <el-switch v-model="ruleForm.autoCalcEnabled" :active-value="1" :inactive-value="0" inline-prompt active-text="开启" inactive-text="关闭" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button :icon="Check" type="primary" :loading="ruleDialogSubmitting" @click="submitRule">
          {{ ruleDialogMode === 'create' ? '创建规则' : '保存修改' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 功能点2：手动调整层级弹窗 -->
    <el-dialog v-model="adjustDialogVisible" title="② 手动调整用户层级" width="540px" :close-on-click-modal="false" append-to-body class="scale-dialog">
      <div v-if="adjustTarget" style="background:#f5f7fa;padding:14px 16px;border-radius:8px;margin-bottom:18px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;color:#909399">UID: <span class="mono">{{ adjustTarget.uid }}</span>（ID: {{ adjustTarget.userId }}）</div>
            <div style="margin-top:6px">
              当前层级：
              <el-tag :type="(getEnumItem(SEGMENT_LEVEL as any, adjustTarget.currentLevel) as any)?.type" effect="dark">
                {{ getEnumLabel(SEGMENT_LEVEL as any, adjustTarget.currentLevel) }}
              </el-tag>
            </div>
          </div>
          <div style="text-align:center;background:#fff;padding:10px 18px;border-radius:8px">
            <div style="font-size:12px;color:#909399">预计变更为</div>
            <el-tag :type="(getEnumItem(SEGMENT_LEVEL as any, adjustForm.toLevel) as any)?.type" effect="dark" size="large">
              {{ getEnumLabel(SEGMENT_LEVEL as any, adjustForm.toLevel) }}
            </el-tag>
            <div style="margin-top:6px;font-size:11px" :style="{ color: adjustForm.toLevel > adjustTarget.currentLevel ? '#67C23A' : adjustForm.toLevel < adjustTarget.currentLevel ? '#F56C6C' : '#909399' }">
              {{ adjustForm.toLevel > adjustTarget.currentLevel ? '↑ 升级 ' + (adjustForm.toLevel - adjustTarget.currentLevel) + ' 级' : adjustForm.toLevel < adjustTarget.currentLevel ? '↓ 降级 ' + (adjustTarget.currentLevel - adjustForm.toLevel) + ' 级' : '平级调整' }}
            </div>
          </div>
        </div>
      </div>
      <el-form :model="adjustForm" label-width="110px">
        <el-form-item label="调整到层级" required>
          <el-radio-group v-model="adjustForm.toLevel" style="flex-wrap:wrap">
            <el-radio v-for="(opt, k) in SEGMENT_LEVEL" :key="k" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整原因" required>
          <el-input v-model="adjustForm.reason" type="textarea" :rows="3" maxlength="200"
            placeholder="请输入至少5字的调整原因，便于后续溯源审计。例：该用户为平台核心KOL，手动升级至高价值层。" show-word-limit />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="adjustForm.remark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="有效期(天)">
          <el-input-number v-model="adjustForm.expireDays" :min="1" :max="365" placeholder="留空表示永久" style="width:100%" />
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon
          title="层级变更后将自动：1) 匹配该层级对应运营权益策略；2) 推送相应通知；3) 写入操作日志用于溯源。"
          style="border-radius:8px" />
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <button :key="adjustRippleKey"
          class="ripple-btn el-button el-button--primary"
          :disabled="adjustLoading"
          @click="submitAdjust">
          <i v-if="adjustLoading" class="el-icon-loading"></i>
          <el-icon><Check /></el-icon> 确认调整
        </button>
      </template>
    </el-dialog>

    <!-- 功能点3：策略创建弹窗 -->
    <el-dialog v-model="strategyDialogVisible" title="③ 配置运营策略" width="760px" :close-on-click-modal="false" append-to-body class="scale-dialog">
      <el-form :model="strategyForm" label-width="110px" ref="strategyFormRef">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="16">
            <el-form-item label="策略名称" required>
              <el-input v-model="strategyForm.strategyName" placeholder="例如: 2026年Q3高价值用户专属权益发放" maxlength="100" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="策略类型" required>
              <el-select v-model="strategyForm.strategyType" style="width:100%">
                <el-option v-for="(opt, k) in STRATEGY_TYPE" :key="k" :label="opt.label + '（' + opt.desc + '）'" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="策略描述">
              <el-input v-model="strategyForm.description" type="textarea" :rows="2" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">目标人群配置</el-divider>
        <el-row :gutter="16">
          <el-col :span="14">
            <el-form-item label="目标层级" required>
              <el-select v-model="strategyForm.targetLevels" multiple placeholder="至少选择1个用户层级" style="width:100%">
                <el-option v-for="(opt, k) in SEGMENT_LEVEL" :key="k" :label="opt.label" :value="opt.value">
                  <el-tag size="small" :type="(opt as any).type">{{ opt.label }}</el-tag>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="用户类型">
              <el-select v-model="strategyForm.targetUserType" multiple placeholder="全部用户" style="width:100%">
                <el-option v-for="(opt, k) in END_USER_TYPE" :key="k" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="14">
            <el-form-item label="最低活跃度">
              <el-select v-model="strategyForm.targetMinActivity" multiple placeholder="不限" style="width:100%">
                <el-option v-for="(opt, k) in END_USER_ACTIVITY_LEVEL" :key="k" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="10">
            <el-form-item label="最低消费">
              <el-input-number v-model="strategyForm.targetMinConsumption" :min="0" style="width:100%" placeholder="不限" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">策略内容（按类型配置）</el-divider>
        <div class="strategy-type-block">
          <el-row v-if="strategyForm.strategyType === 'BENEFIT'" :gutter="16">
            <el-col :span="12">
              <el-form-item label="权益类型">
                <el-select v-model="strategyForm.benefitConfig.type" style="width:100%">
                  <el-option v-for="(opt, k) in BENEFIT_TYPE" :key="k" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数量/面额">
                <el-input-number v-model="strategyForm.benefitConfig.value" :min="1" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="有效期(天)">
                <el-input-number v-model="strategyForm.benefitConfig.expireDays" :min="1" :max="365" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <div v-if="strategyForm.strategyType === 'PUSH'">
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item label="推送标题">
                  <el-input v-model="strategyForm.pushConfig.title" placeholder="例如：恭喜您获得专属会员福利" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="推送内容">
                  <el-input v-model="strategyForm.pushConfig.content" type="textarea" :rows="3" />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="推送渠道">
                  <el-checkbox-group v-model="strategyForm.pushConfig.channels">
                    <el-checkbox label="APP">APP站内</el-checkbox>
                    <el-checkbox label="SMS">短信</el-checkbox>
                    <el-checkbox label="EMAIL">邮件</el-checkbox>
                    <el-checkbox label="WECHAT">微信</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <el-row v-if="strategyForm.strategyType === 'WELFARE'" :gutter="16">
            <el-col :span="12">
              <el-form-item label="福利类型">
                <el-select v-model="strategyForm.welfareConfig.type" style="width:100%">
                  <el-option value="CREDIT" label="积分" />
                  <el-option value="COUPON" label="优惠券" />
                  <el-option value="GIFT" label="实物礼品" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="数量/面额">
                <el-input-number v-model="strategyForm.welfareConfig.value" :min="1" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <div v-if="strategyForm.strategyType === 'GUIDE'">
            <el-form-item label="引导任务ID列表">
              <el-input v-model="strategyForm.guideConfig.taskIds" placeholder="例如: 1001,1002,1003（逗号分隔）" />
            </el-form-item>
          </div>
        </div>

        <el-divider content-position="left">生效方式</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="生效模式" required>
              <el-radio-group v-model="strategyForm.triggerMode">
                <el-radio :value="1"><el-icon><Cpu /></el-icon> 即时生效</el-radio>
                <el-radio :value="2"><el-icon><Timer /></el-icon> 定时生效</el-radio>
                <el-radio :value="3"><el-icon><RefreshRight /></el-icon> 周期推送</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="strategyForm.triggerMode === 2">
            <el-form-item label="生效时间">
              <el-date-picker v-model="strategyForm.triggerTime" type="datetime" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="strategyForm.triggerMode === 3">
            <el-form-item label="Cron 表达式">
              <el-input v-model="strategyForm.recurringCron" placeholder="例: 0 0 10 * * ? (每天10点)" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
              <el-button plain type="info" :icon="View" :loading="strategyPreviewLoading" @click="fetchStrategyPreview">预览匹配人群</el-button>
              <div v-if="strategyPreview" style="background:#f0f9ff;padding:10px 16px;border-radius:8px;border:1px solid #c6e2ff;flex:1">
                <span style="font-weight:600;color:#409EFF">预计覆盖：{{ formatNumber(strategyPreview.total) }} 人</span>
                <span style="margin-left:16px;color:#909399">
                  <el-tag v-for="s in (strategyPreview.byLevel || [])" :key="s.level" style="margin-left:6px" size="small"
                    :type="(getEnumItem(SEGMENT_LEVEL as any, s.level) as any)?.type" effect="plain">
                    L{{ s.level }}: {{ formatNumber(s.count) }}
                  </el-tag>
                </span>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="strategyDialogVisible = false">取消</el-button>
        <el-button type="primary" :icon="Check" :loading="strategySubmitting" @click="submitStrategy">
          创建{{ strategyForm.triggerMode === 1 ? '并即时生效' : '策略' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-segment-page {
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
      .stat-left { flex: 1; min-width: 0;
        .stat-label { font-size: 12px; font-weight: 500; }
        .stat-value { font-size: 22px; font-weight: 700; color: #303133; margin-top: 4px; }
      }
      .stat-icon {
        width: 52px; height: 52px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
      }
    }
    .level-stats {
      .level-card { flex-direction: row; gap: 14px; }
      .level-icon {
        width: 52px; height: 52px;
        background: currentColor + '15';
        border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
      }
      .level-body { flex: 1;
        .level-name { font-size: 14px; font-weight: 600; }
        .level-desc { font-size: 11px; color: #909399; margin: 2px 0; }
        .level-count { font-size: 12px; color: #606266; b { color: #303133; font-size: 15px; } }
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
  .rule-info {
    .rule-name { font-size: 14px; color: #303133; }
    .rule-sub { font-size: 11px; color: #909399; margin-top: 2px; }
    .rule-desc { font-size: 12px; color: #606266; margin-top: 3px; line-height: 1.4;
      overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; }
  }
  .coverage-num { text-align: center; }
  .level-dist {
    display: flex; gap: 4px; align-items: center; flex-wrap: wrap;
    .dist-bar {
      height: 22px;
      border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      min-width: 32px;
      box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.08);
      .dist-label { color: #fff; font-size: 11px; font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); }
    }
  }
  .behavior-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px;
    font-size: 12px; color: #606266;
  }
  .strategy-template-bar {
    border-radius: 12px;
    .tpl-card {
      background: #fff;
      padding: 10px 14px;
      border: 2px solid #dcdfe6;
      border-radius: 10px;
      min-width: 160px;
      cursor: pointer;
      transition: all 0.3s ease;
      .tpl-title {
        display: flex; align-items: center; gap: 6px;
        font-size: 13px; color: #303133;
      }
      .tpl-desc {
        font-size: 11px; color: #909399; margin: 4px 0;
        overflow: hidden; text-overflow: ellipsis; display: -webkit-box;
        -webkit-line-clamp: 2; -webkit-box-orient: vertical;
      }
      .tpl-target { display: flex; gap: 3px; flex-wrap: wrap; }
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(64, 158, 255, 0.2);
      }
    }
  }
  .threshold-editor {
    .range-preview {
      background: #f5f7fa;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 13px; color: #606266;
      text-align: center;
    }
  }
  .weights-editor {
    background: #f5f7fa;
    padding: 14px 16px;
    border-radius: 10px;
    margin-bottom: 12px;
    .weights-total {
      font-size: 14px; margin-bottom: 12px; font-weight: 500;
      &.ok { color: #67C23A; }
      &.warn { color: #F56C6C; animation: warnPulse 1.5s ease-in-out infinite; }
    }
  }
  @keyframes warnPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }

  /* 功能点2: 波纹按钮 */
  .ripple-btn {
    position: relative; overflow: hidden;
    border-radius: 8px;
    &::after {
      content: ''; position: absolute; left: 50%; top: 50%;
      width: 10px; height: 10px; background: rgba(255,255,255,0.5);
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

  .trace-panel {
    border-radius: 12px;
    padding: 20px;
    .trace-search-row {
      display: flex; gap: 16px; align-items: flex-start; flex-wrap: wrap;
      .trace-search-group { flex: 1; min-width: 420px; }
    }
    .trace-result-block {
      margin-top: 16px;
      h4 { margin: 0 0 12px; display: flex; align-items: center; gap: 6px;
        color: #303133; font-size: 15px; }
      .trace-summary { border-radius: 10px; padding: 18px; }
    }
  }
  .strategy-type-block {
    background: #f8fafb; padding: 14px 16px 0;
    border-radius: 10px; margin-bottom: 4px;
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

  /* 弹窗进入动画（0.3秒过渡） */
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

  /* 表格隔行变色强化 */
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

  /* 分隔线样式 */
  :deep(.el-divider__text) {
    font-size: 13px;
    color: #606266;
    font-weight: 600;
  }
  :deep(.el-divider) { --el-border-style: dashed; }
}
</style>

