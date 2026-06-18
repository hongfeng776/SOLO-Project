<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElNotification, ElMessageBox } from 'element-plus'
import {
  AUDIT_RULE_TYPE,
  AUDIT_RULE_STATUS,
  AUDIT_RULE_CATEGORY,
  AUDIT_RULE_TRIGGER_CONDITION,
  AUDIT_RULE_ACTION,
  BATCH_RULE_ACTION,
  RULE_MODIFY_TYPE,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getAuditRuleListApi,
  getAuditRuleDetailApi,
  createAuditRuleApi,
  updateAuditRuleApi,
  enableAuditRuleApi,
  disableAuditRuleApi,
  deleteAuditRuleApi,
  checkRuleConflictsApi,
  checkRuleConsistencyApi,
  getRuleTraceApi,
  getRuleModifyHistoryApi,
  batchRuleActionApi,
  syncRuleToAllCategoriesApi,
  getRuleDynamicFieldsApi,
  exportAuditRulesApi,
} from '@/api/audit-rules'
import type {
  AuditRule,
  AuditRuleListItem,
  AuditRuleCreateForm,
  AuditRuleEditForm,
  RuleConflictCheckResult,
  RuleConsistencyCheckResult,
  AuditRuleTraceResult,
  AuditRuleModifyRecord,
  AuditRuleTriggerCondition,
  AuditRuleActionConfig,
} from '@/types'
import { formatDate, formatNumber, debounce, throttle, downloadFile } from '@/utils'
import { useUserStore } from '@/stores/user'
import {
  Search,
  RefreshLeft,
  Refresh,
  Plus,
  Edit,
  View,
  Delete,
  SwitchButton,
  Download,
  Warning,
  WarningFilled,
  CircleCheck,
  CircleClose,
  Clock,
  Tickets,
  Document,
  History,
  ArrowRight,
  DataBoard,
  Setting,
  CopyDocument,
  MagicStick,
  Lock,
  Unlock,
  RefreshRight,
  Checked,
  Close,
  InfoFilled,
  TrendCharts,
  User,
  Picture,
  Bell,
  Film,
  ChatDotRound,
  Monitor,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const isAdmin = computed(() =>
  ['ADMIN', 'SUPER_ADMIN'].includes(userStore.roleCode) ||
  userStore.hasRole(['ADMIN', 'SUPER_ADMIN'])
)

const listLoading = ref(false)
const detailLoading = ref(false)
const submitting = ref(false)
const batchSubmitting = ref(false)
const cardHoverStates = reactive<Record<string, boolean>>({})
const btnOffsetStates = reactive<Record<string, boolean>>({})
const rippleStates = reactive<Record<string, boolean>>({})
const columnWidths = reactive<Record<string, number>>({})
const shakeFields = reactive<Record<string, boolean>>({})
const conflictCheckResult = ref<RuleConflictCheckResult | null>(null)
const consistencyCheckResult = ref<RuleConsistencyCheckResult | null>(null)

const listData = ref<AuditRuleListItem[]>([])
const total = ref(0)
const currentDetail = ref<AuditRule | null>(null)
const currentTrace = ref<AuditRuleTraceResult | null>(null)
const selectedRows = ref<AuditRuleListItem[]>([])
const viewMode = ref<'list' | 'card'>('list')
const activeTab = ref('basic')
const consistencyDrawerVisible = ref(false)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  ruleType: null as string | null,
  ruleCategory: null as string | null,
  ruleStatus: null as number | null,
  applicableCategory: null as string | null,
  isCoreDefault: null as boolean | null,
  startDate: null as string | null,
  endDate: null as string | null,
  sortBy: 'sortOrder',
  sortOrder: 'ASC' as 'ASC' | 'DESC',
})

const currentRuleId = ref<number | null>(null)
const createDialogVisible = ref(false)
const editDialogVisible = ref(false)
const detailVisible = ref(false)
const traceVisible = ref(false)
const batchConfirmVisible = ref(false)
const modifyHistoryVisible = ref(false)
const syncModeDialogVisible = ref(false)
const currentBatchAction = ref('')
const syncMode = ref<'copy' | 'merge'>('copy')

const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

const defaultFormData = (): AuditRuleCreateForm => ({
  ruleName: '',
  ruleType: '',
  ruleCategory: '',
  ruleDescription: '',
  applicableCategory: [],
  applicableRiskLevels: [],
  effectiveStartTime: '',
  effectiveEndTime: '',
  priority: 5,
  triggerConditions: [],
  actions: [],
  ruleParams: {},
  sortOrder: 100,
  remark: '',
})

const createFormData = reactive<AuditRuleCreateForm>(defaultFormData())
const editFormData = reactive<AuditRuleEditForm>({ ...defaultFormData(), id: 0 })

const dynamicFields = reactive<{
  triggerConditions: AuditRuleTriggerCondition[]
  actions: AuditRuleActionConfig[]
  ruleParams: Array<{ key: string; label: string; fieldType: string; options?: any[]; defaultValue?: any }>
}>({
  triggerConditions: [],
  actions: [],
  ruleParams: [],
})

const modifyHistory = ref<AuditRuleModifyRecord[]>([])
const modifyHistoryPage = ref(1)
const modifyHistoryTotal = ref(0)

const triggerRipple = (event: MouseEvent, btnKey: string) => {
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

const triggerOffset = (btnKey: string) => {
  btnOffsetStates[btnKey] = true
  setTimeout(() => { btnOffsetStates[btnKey] = false }, 150)
}

const triggerShake = (field: string) => {
  shakeFields[field] = true
  setTimeout(() => { shakeFields[field] = false }, 600)
}

const getRuleTypeColor = (type: string) => {
  const item = getEnumItem(AUDIT_RULE_TYPE as any, type)
  return item ? (item as any).color : '#909399'
}

const ruleTypeOptions = computed(() => getEnumOptions(AUDIT_RULE_TYPE))
const ruleStatusOptions = computed(() => getEnumOptions(AUDIT_RULE_STATUS))
const ruleCategoryOptions = computed(() => getEnumOptions(AUDIT_RULE_CATEGORY))
const batchActionOptions = computed(() => getEnumOptions(BATCH_RULE_ACTION))
const triggerConditionOptions = computed(() => getEnumOptions(AUDIT_RULE_TRIGGER_CONDITION))
const actionOptions = computed(() => getEnumOptions(AUDIT_RULE_ACTION))
const modifyTypeOptions = computed(() => getEnumOptions(RULE_MODIFY_TYPE))

const draftCount = computed(() => listData.value.filter(r => r.ruleStatus === 0).length)
const enabledCount = computed(() => listData.value.filter(r => r.ruleStatus === 1).length)
const expiredCount = computed(() => listData.value.filter(r => r.ruleStatus === 3).length)
const conflictCount = computed(() => listData.value.reduce((sum, r) => sum + (r.conflictCount || 0), 0))
const coreRuleCount = computed(() => listData.value.filter(r => r.isCoreDefault).length)
const coverageRate = computed(() => {
  if (!consistencyCheckResult.value) return 0
  return consistencyCheckResult.value.coverage?.coverageRate || 0
})

const canDeleteSelected = computed(() => {
  return selectedRows.value.every(r => !r.isCoreDefault)
})

const missingFieldLabels = computed(() => {
  if (!conflictCheckResult.value?.missingFields) return []
  return conflictCheckResult.value.missingFields.map(f => {
    const condition = dynamicFields.triggerConditions.find(c => c.conditionKey === f)
    return condition?.conditionLabel || f
  })
})

const hasCoreSelected = computed(() => selectedRows.value.some(r => r.isCoreDefault))
const selectedCoreRules = computed(() => selectedRows.value.filter(r => r.isCoreDefault))

const loadList = async () => {
  listLoading.value = true
  try {
    const params = { ...queryParams } as any
    const result = await getAuditRuleListApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally { listLoading.value = false }
}

const loadDetail = async (id: number) => {
  detailLoading.value = true
  currentDetail.value = null
  try {
    const detail = await getAuditRuleDetailApi(id)
    currentDetail.value = detail
  } finally { detailLoading.value = false }
}

const loadDynamicFields = async (ruleType: string, ruleCategory: string) => {
  if (!ruleType || !ruleCategory) return
  try {
    const result = await getRuleDynamicFieldsApi(ruleType, ruleCategory)
    dynamicFields.triggerConditions = result.triggerConditions.map(c => ({
      conditionKey: c.key,
      conditionLabel: c.label,
      fieldType: c.fieldType as any,
      options: c.options,
      unit: (c as any).unit,
      required: false,
    }))
    dynamicFields.actions = result.actions.map(a => ({
      actionKey: a.key,
      actionLabel: a.label,
      actionParams: a.defaultParams,
      enabled: false,
    }))
    dynamicFields.ruleParams = result.ruleParams
  } catch (e: any) {
    console.error('加载动态字段失败', e)
  }
}

const realtimeConflictCheck = debounce(async () => {
  if (!createFormData.ruleType || !createFormData.ruleName) {
    conflictCheckResult.value = null
    return
  }
  try {
    const params: any = {
      ruleName: createFormData.ruleName,
      ruleType: createFormData.ruleType,
      ruleCategory: createFormData.ruleCategory,
      applicableCategory: createFormData.applicableCategory,
      triggerConditions: createFormData.triggerConditions,
      actions: createFormData.actions,
    }
    if (editDialogVisible.value && currentRuleId.value) {
      params.excludeRuleId = currentRuleId.value
    }
    const result = await checkRuleConflictsApi(params)
    conflictCheckResult.value = result
  } catch {
    conflictCheckResult.value = null
  }
}, 600)

const handleCreate = () => {
  Object.assign(createFormData, defaultFormData())
  conflictCheckResult.value = null
  activeTab.value = 'basic'
  createDialogVisible.value = true
  nextTick(() => createFormRef.value?.clearValidate())
}

const handleCreateSubmit = async () => {
  if (!createFormData.ruleName || createFormData.ruleName.length < 2 || createFormData.ruleName.length > 50) {
    triggerShake('ruleName')
    return
  }
  if (!createFormData.ruleType) {
    triggerShake('ruleType')
    return
  }
  if (!createFormData.ruleCategory) {
    triggerShake('ruleCategory')
    return
  }
  if (createFormData.applicableCategory.length === 0) {
    triggerShake('applicableCategory')
    ElMessage.warning('请至少选择一个适用品类')
    return
  }
  const requiredConditions = dynamicFields.triggerConditions.filter(c => c.required)
  for (const cond of requiredConditions) {
    const val = (createFormData.triggerConditions as any[]).find((c: any) => c.conditionKey === cond.conditionKey)
    if (!val || val.value === undefined || val.value === '' || val.value === null) {
      triggerShake(`cond_${cond.conditionKey}`)
      ElMessage.warning(`请填写必填触发条件：${cond.conditionLabel}`)
      return
    }
  }
  const enabledActions = createFormData.actions.filter(a => a.enabled)
  if (enabledActions.length === 0) {
    triggerShake('actions')
    ElMessage.warning('请至少启用一个动作')
    return
  }
  if (conflictCheckResult.value && !conflictCheckResult.value.canSubmit) {
    ElMessage.warning('存在冲突或参数缺失，请先解决')
    return
  }
  submitting.value = true
  try {
    await createAuditRuleApi(createFormData)
    ElMessage.success('规则创建成功')
    createDialogVisible.value = false
    await loadList()
  } catch (e: any) {
    triggerShake('submit')
    ElMessage.error(e?.message || '创建失败')
  } finally { submitting.value = false }
}

const handleUpdate = (row: AuditRuleListItem) => {
  currentRuleId.value = row.id
  loadDetail(row.id).then(async () => {
    if (currentDetail.value) {
      const d = currentDetail.value
      editFormData.id = d.id
      editFormData.ruleName = d.ruleName
      editFormData.ruleType = d.ruleType
      editFormData.ruleCategory = d.ruleCategory
      editFormData.ruleDescription = d.ruleDescription
      editFormData.applicableCategory = [...d.applicableCategory]
      editFormData.applicableRiskLevels = [...d.applicableRiskLevels]
      editFormData.effectiveStartTime = d.effectiveStartTime || ''
      editFormData.effectiveEndTime = d.effectiveEndTime || ''
      editFormData.priority = d.priority
      editFormData.triggerConditions = JSON.parse(JSON.stringify(d.triggerConditions))
      editFormData.actions = JSON.parse(JSON.stringify(d.actions))
      editFormData.ruleParams = { ...d.ruleParams }
      editFormData.sortOrder = d.sortOrder
      editFormData.remark = d.remark || ''
      editFormData.version = d.version
      await loadDynamicFields(d.ruleType, d.ruleCategory)
      conflictCheckResult.value = null
      activeTab.value = 'basic'
      editDialogVisible.value = true
      nextTick(() => editFormRef.value?.clearValidate())
    }
  })
}

const handleUpdateSubmit = async () => {
  if (!editFormData.ruleName || editFormData.ruleName.length < 2 || editFormData.ruleName.length > 50) {
    triggerShake('ruleName')
    return
  }
  if (!editFormData.ruleType) {
    triggerShake('ruleType')
    return
  }
  if (editFormData.applicableCategory.length === 0) {
    triggerShake('applicableCategory')
    ElMessage.warning('请至少选择一个适用品类')
    return
  }
  const enabledActions = editFormData.actions.filter(a => a.enabled)
  if (enabledActions.length === 0) {
    triggerShake('actions')
    ElMessage.warning('请至少启用一个动作')
    return
  }
  submitting.value = true
  try {
    await updateAuditRuleApi(editFormData.id, editFormData)
    ElMessage.success('规则修改成功')
    editDialogVisible.value = false
    await loadList()
  } catch (e: any) {
    triggerShake('submit')
    ElMessage.error(e?.message || '修改失败')
  } finally { submitting.value = false }
}

const handleEnableRule = async (row: AuditRuleListItem) => {
  if (row.ruleStatus === 2) {
    try {
      await ElMessageBox.confirm(
        '重新启用将重置生效时间，是否确认？',
        '重新启用确认',
        { type: 'warning', confirmButtonText: '确认启用', cancelButtonText: '取消' }
      )
    } catch { return }
  }
  const btnKey = `enable-${row.id}`
  btnLoadingStates[btnKey] = true
  try {
    const res = await enableAuditRuleApi(row.id, {
      resetEffectiveTime: row.ruleStatus === 2,
    })
    ElMessage.success(res.lastEnabledAt ? '规则已重新启用' : '规则启用成功')
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '启用失败')
  } finally {
    btnLoadingStates[btnKey] = false
  }
}

const handleDisableRule = async (row: AuditRuleListItem) => {
  try {
    await ElMessageBox.confirm(
      `确定要停用规则"${row.ruleName}"吗？`,
      '停用确认',
      { type: 'warning', confirmButtonText: '确认停用', cancelButtonText: '取消' }
    )
  } catch { return }
  const btnKey = `disable-${row.id}`
  btnLoadingStates[btnKey] = true
  try {
    await disableAuditRuleApi(row.id)
    ElMessage.success('规则已停用')
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '停用失败')
  } finally {
    btnLoadingStates[btnKey] = false
  }
}

const handleDeleteRule = async (row: AuditRuleListItem) => {
  if (row.isCoreDefault) {
    ElMessage.error('核心默认规则禁止删除，仅可修改状态')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除规则"${row.ruleName}"吗？此操作不可恢复。`,
      '删除确认',
      { type: 'error', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
  } catch { return }
  const btnKey = `delete-${row.id}`
  btnLoadingStates[btnKey] = true
  try {
    await deleteAuditRuleApi(row.id)
    ElMessage.success('删除成功')
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  } finally {
    btnLoadingStates[btnKey] = false
  }
}

const btnLoadingStates = reactive<Record<string, boolean>>({})

const handleBatchAction = async (action: string) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择需要操作的规则')
    return
  }
  if (action === 'batch_export') {
    batchSubmitting.value = true
    try {
      const res = await exportAuditRulesApi(selectedRows.value.map(r => r.id))
      if (res.downloadUrl) {
        downloadFile(res.downloadUrl, res.fileName)
      }
      ElMessage.success(`导出成功，共${res.count}条`)
    } catch (e: any) {
      ElMessage.error(e?.message || '导出失败')
    } finally { batchSubmitting.value = false }
    return
  }
  if (action === 'batch_sync') {
    syncModeDialogVisible.value = true
    return
  }
  currentBatchAction.value = action
  if (hasCoreSelected.value) {
    batchConfirmVisible.value = true
  } else {
    doBatchAction(action)
  }
}

const doBatchAction = async (action: string) => {
  batchSubmitting.value = true
  try {
    const ruleIds = selectedRows.value.filter(r => !r.isCoreDefault).map(r => r.id)
    const res = await batchRuleActionApi({
      action: action as any,
      ruleIds,
    })
    const actionLabel = getEnumLabel(BATCH_RULE_ACTION as any, action)
    const skippedMsg = res.skippedCount > 0 ? `，跳过${res.skippedCount}条核心规则` : ''
    ElMessage.success(`${actionLabel}：成功${res.successCount}条${skippedMsg}`)
    batchConfirmVisible.value = false
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量操作失败')
  } finally { batchSubmitting.value = false }
}

const handleSyncAllCategories = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择需要同步的规则')
    return
  }
  const coreRules = selectedRows.value.filter(r => r.isCoreDefault)
  if (coreRules.length > 0) {
    ElMessage.warning('核心默认规则无法同步，已自动跳过')
  }
  const normalRules = selectedRows.value.filter(r => !r.isCoreDefault)
  if (normalRules.length === 0) {
    return
  }
  batchSubmitting.value = true
  try {
    let newRulesCount = 0
    let skippedCategories: string[] = []
    for (const rule of normalRules) {
      try {
        const res = await syncRuleToAllCategoriesApi(rule.id, syncMode.value)
        newRulesCount += res.newRules.length
        skippedCategories = [...new Set([...skippedCategories, ...res.skippedCategories])]
      } catch {
        // continue
      }
    }
    syncModeDialogVisible.value = false
    ElMessage.success(`同步完成，新建${newRulesCount}条规则${skippedCategories.length ? `，跳过${skippedCategories.length}个品类` : ''}`)
    await loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '同步失败')
  } finally { batchSubmitting.value = false }
}

const openTrace = async (row: AuditRuleListItem) => {
  currentRuleId.value = row.id
  traceVisible.value = true
  currentTrace.value = null
  try {
    currentTrace.value = await getRuleTraceApi(row.ruleCode)
  } catch (e: any) {
    ElMessage.error(e?.message || '溯源数据加载失败')
  }
}

const openModifyHistory = async (row: AuditRuleListItem) => {
  currentRuleId.value = row.id
  modifyHistoryVisible.value = true
  modifyHistoryPage.value = 1
  modifyHistory.value = []
  loadModifyHistory(row.id)
}

const loadModifyHistory = async (ruleId: number) => {
  try {
    const res = await getRuleModifyHistoryApi(ruleId, modifyHistoryPage.value, 20)
    modifyHistory.value = res.list
    modifyHistoryTotal.value = res.pagination.total
  } catch (e: any) {
    ElMessage.error(e?.message || '修改记录加载失败')
  }
}

const handleColumnDragEnd = (column: any, width: number) => {
  if (column.prop) {
    columnWidths[column.prop] = width
  }
}

const handleSearch = () => { queryParams.page = 1; loadList() }
const handleReset = () => {
  queryParams.keyword = ''
  queryParams.ruleType = null
  queryParams.ruleCategory = null
  queryParams.ruleStatus = null
  queryParams.applicableCategory = null
  queryParams.isCoreDefault = null
  queryParams.startDate = null
  queryParams.endDate = null
  handleSearch()
}
const handlePageChange = (p: number) => { queryParams.page = p; loadList() }
const handleSizeChange = (s: number) => { queryParams.pageSize = s; queryParams.page = 1; loadList() }
const handleSelectionChange = (rows: AuditRuleListItem[]) => { selectedRows.value = rows }
const handleStatClick = (type: string) => {
  switch (type) {
    case 'draft':
      queryParams.ruleStatus = queryParams.ruleStatus === 0 ? null : 0
      break
    case 'enabled':
      queryParams.ruleStatus = queryParams.ruleStatus === 1 ? null : 1
      break
    case 'expired':
      queryParams.ruleStatus = queryParams.ruleStatus === 3 ? null : 3
      break
    case 'conflict':
      queryParams.ruleStatus = null
      break
    case 'core':
      queryParams.isCoreDefault = queryParams.isCoreDefault === true ? null : true
      break
    default:
      break
  }
  handleSearch()
}

const openConsistencyCheck = async () => {
  consistencyDrawerVisible.value = true
  consistencyCheckResult.value = null
  try {
    consistencyCheckResult.value = await checkRuleConsistencyApi(
      queryParams.ruleType || '',
      queryParams.ruleCategory || ''
    )
  } catch (e: any) {
    ElMessage.error(e?.message || '一致性检查失败')
  }
}

const debouncedSearch = debounce(handleSearch, 400)
const throttledRefresh = throttle(() => {
  if (selectedRows.value.length === 0) {
    loadList()
    return
  }
  listLoading.value = true
  loadList().finally(() => { listLoading.value = false })
  ElMessage.success('已刷新列表数据')
}, 5000)

watch(() => createFormData.ruleType, async (val) => {
  if (val && createFormData.ruleCategory) {
    await loadDynamicFields(val, createFormData.ruleCategory)
  }
  realtimeConflictCheck()
})
watch(() => createFormData.ruleCategory, async (val) => {
  if (val && createFormData.ruleType) {
    await loadDynamicFields(createFormData.ruleType, val)
  }
  realtimeConflictCheck()
})
watch(() => createFormData.ruleName, realtimeConflictCheck)
watch(() => createFormData.applicableCategory, realtimeConflictCheck, { deep: true })
watch(() => createFormData.triggerConditions, realtimeConflictCheck, { deep: true })
watch(() => createFormData.actions, realtimeConflictCheck, { deep: true })

watch(() => editFormData.ruleType, async (val) => {
  if (val && editFormData.ruleCategory) {
    await loadDynamicFields(val, editFormData.ruleCategory)
  }
})
watch(() => editFormData.ruleCategory, async (val) => {
  if (val && editFormData.ruleType) {
    await loadDynamicFields(editFormData.ruleType, val)
  }
})

const createFormRules: FormRules = {
  ruleName: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '规则名称长度为2-50字', trigger: 'blur' },
  ],
  ruleType: [{ required: true, message: '请选择规则类型', trigger: 'change' }],
  ruleCategory: [{ required: true, message: '请选择规则分类', trigger: 'change' }],
}

onMounted(() => { loadList() })
</script>

<template>
  <div class="audit-rule-page">
    <div class="stat-bar">
      <div v-for="item in [
        { label: '草稿规则', count: draftCount, type: 'draft', color: '#909399', icon: Document },
        { label: '已启用', count: enabledCount, type: 'enabled', color: '#67C23A', icon: CircleCheck },
        { label: '已过期', count: expiredCount, type: 'expired', color: '#F56C6C', icon: Clock },
        { label: '冲突数', count: conflictCount, type: 'conflict', color: '#E6A23C', icon: WarningFilled },
        { label: '核心规则', count: coreRuleCount, type: 'core', color: '#722ed1', icon: Star },
        { label: '覆盖率', count: coverageRate, type: 'coverage', color: '#13c2c2', icon: TrendCharts },
      ]" :key="item.label" class="stat-card card-content card-hover"
        :class="{ active: (item.type === 'draft' && queryParams.ruleStatus === 0)
          || (item.type === 'enabled' && queryParams.ruleStatus === 1)
          || (item.type === 'expired' && queryParams.ruleStatus === 3)
          || (item.type === 'core' && queryParams.isCoreDefault === true) }"
        :style="{ borderLeftColor: item.color }"
        @click="handleStatClick(item.type)">
        <div class="stat-icon" :style="{ backgroundColor: item.color + '15', color: item.color }">
          <el-icon :size="22"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-body">
          <div class="stat-count" :style="{ color: item.color }">
            {{ item.type === 'coverage' ? item.count + '%' : formatNumber(item.count) }}
          </div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
        <el-icon class="stat-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input v-model="queryParams.keyword" placeholder="规则名称/编码/描述" clearable style="width: 220px"
            @keyup.enter="handleSearch" @input="debouncedSearch" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="queryParams.ruleType" placeholder="全部类型" clearable style="width: 160px" @change="handleSearch">
            <el-option v-for="opt in ruleTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value">
              <span :style="{ color: (opt as any).color }">●</span>
              <span style="margin-left: 6px">{{ opt.label }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="规则分类">
          <el-select v-model="queryParams.ruleCategory" placeholder="全部分类" clearable style="width: 140px" @change="handleSearch">
            <el-option v-for="opt in ruleCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.ruleStatus" placeholder="全部状态" clearable style="width: 130px" @change="handleSearch">
            <el-option v-for="opt in ruleStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="适用品类">
          <el-select v-model="queryParams.applicableCategory" placeholder="全部品类" clearable style="width: 140px" @change="handleSearch">
            <el-option label="电影" value="movie" />
            <el-option label="电视剧" value="tv_series" />
            <el-option label="综艺" value="variety" />
            <el-option label="动漫" value="anime" />
            <el-option label="纪录片" value="documentary" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否核心">
          <el-select v-model="queryParams.isCoreDefault" placeholder="全部" clearable style="width: 110px" @change="handleSearch">
            <el-option label="核心规则" :value="true" />
            <el-option label="普通规则" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="queryParams.startDate"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
            @change="handleSearch"
          />
          <span style="margin: 0 6px">-</span>
          <el-date-picker
            v-model="queryParams.endDate"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch" :loading="listLoading">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          <el-button :icon="Refresh" @click="loadList" :loading="listLoading">刷新</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="batch-toolbar card-content">
      <div class="toolbar-left">
        <span class="selected-info">已选择 <b>{{ formatNumber(selectedRows.length) }}</b> 项</span>
        <el-divider direction="vertical" />
        <el-tooltip v-if="hasCoreSelected" content="核心默认规则将自动跳过" placement="top">
          <el-tag type="warning" effect="plain" size="small" class="core-warning-tag">
            <el-icon><Warning /></el-icon>
            选中含核心规则，将自动跳过
          </el-tag>
        </el-tooltip>
        <el-radio-group v-model="viewMode" size="small" class="view-mode-toggle">
          <el-radio-button value="list">
            <el-icon><Monitor /></el-icon>
            <span>列表视图</span>
          </el-radio-button>
          <el-radio-button value="card">
            <el-icon><Setting /></el-icon>
            <span>卡片视图</span>
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" :icon="Plus" @click="handleCreate">新建规则</el-button>
        <el-button type="success" :icon="CircleCheck" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="() => handleBatchAction('batch_enable')">批量启用</el-button>
        <el-button type="warning" :icon="SwitchButton" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="() => handleBatchAction('batch_disable')">批量停用</el-button>
        <el-button type="primary" :icon="RefreshRight" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="() => handleBatchAction('batch_sync')">同步全品类</el-button>
        <el-button type="danger" :icon="Delete" size="small"
          :disabled="selectedRows.length === 0 || !canDeleteSelected || batchSubmitting"
          @click="() => handleBatchAction('batch_delete')">批量删除</el-button>
        <el-button :icon="Download" size="small"
          :disabled="selectedRows.length === 0 || batchSubmitting"
          @click="() => handleBatchAction('batch_export')">批量导出</el-button>
        <el-button :icon="DataBoard" size="small" @click="openConsistencyCheck">一致性检查</el-button>
      </div>
    </div>

    <div v-if="viewMode === 'list'" class="table-wrapper card-content">
      <el-table
        v-loading="listLoading"
        :data="listData"
        stripe
        border
        highlight-current-row
        style="width: 100%"
        :row-class-name="({ row }) => {
          let cls = ''
          if ((row as any).$index % 2 === 1) cls += ' row--zebra'
          if (row.ruleStatus === queryParams.ruleStatus) cls += ' row--current'
          return cls.trim()
        }"
        @selection-change="handleSelectionChange"
        :header-cell-class-name="'sticky-header-th'"
        @header-dragend="handleColumnDragEnd"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="规则编码" prop="ruleCode" width="140" align="center" fixed="left" resizable>
          <template #default="{ row }">
            <el-tooltip :content="row.ruleCode" placement="top" :show-after="500">
              <span class="rule-code mono-text">{{ row.ruleCode }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="规则名称" min-width="200" resizable>
          <template #default="{ row }">
            <el-tooltip :content="row.ruleName" placement="top" :show-after="500">
              <div class="rule-name-cell">
                <span class="rule-name text-ellipsis">{{ row.ruleName }}</span>
                <el-tag v-if="row.isCoreDefault" size="small" class="core-badge" effect="dark">核心</el-tag>
              </div>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="规则类型" width="120" align="center" resizable>
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="dark"
              class="rule-type-tag"
              :style="{
                backgroundColor: getRuleTypeColor(row.ruleType) + '20',
                borderColor: getRuleTypeColor(row.ruleType),
                color: getRuleTypeColor(row.ruleType),
              }"
            >
              <el-icon style="vertical-align: -2px; margin-right: 2px">
                <component :is="(getEnumItem(AUDIT_RULE_TYPE as any, row.ruleType) as any)?.icon || Setting" />
              </el-icon>
              {{ getEnumLabel(AUDIT_RULE_TYPE as any, row.ruleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="规则分类" width="110" align="center" resizable>
          <template #default="{ row }">
            <el-tag size="small" type="info" effect="plain">
              {{ getEnumLabel(AUDIT_RULE_CATEGORY as any, row.ruleCategory) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适用品类" min-width="180" resizable>
          <template #default="{ row }">
            <div class="category-tags">
              <el-tag
                v-for="(cat, i) in row.applicableCategory.slice(0, 3)"
                :key="cat"
                size="small"
                type="primary"
                effect="plain"
                class="category-tag"
              >
                {{ cat }}
              </el-tag>
              <el-tooltip v-if="row.applicableCategory.length > 3" placement="top" :show-after="400">
                <template #content>
                  <div v-for="cat in row.applicableCategory.slice(3)" :key="cat" style="margin: 2px 0">{{ cat }}</div>
                </template>
                <el-tag size="small" type="info" effect="plain">+{{ row.applicableCategory.length - 3 }}</el-tag>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="优先级" width="90" align="center" resizable>
          <template #default="{ row }">
            <el-tag size="small" :type="row.priority >= 8 ? 'danger' : row.priority >= 5 ? 'warning' : 'info'" effect="plain">
              P{{ row.priority }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center" resizable>
          <template #default="{ row }">
            <div class="status-cell">
              <el-tag
                :type="getEnumItem(AUDIT_RULE_STATUS, row.ruleStatus)?.type || 'info'"
                size="small"
                effect="dark"
                class="status-tag"
              >
                {{ getEnumLabel(AUDIT_RULE_STATUS, row.ruleStatus) }}
              </el-tag>
              <el-tag v-if="row.conflictCount > 0" size="small" type="danger" effect="dark" class="conflict-badge">
                {{ row.conflictCount }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="版本" width="80" align="center" resizable>
          <template #default="{ row }">v{{ row.version }}</template>
        </el-table-column>
        <el-table-column label="生效批次" width="120" align="center" resizable>
          <template #default="{ row }">
            <el-tooltip :content="row.effectBatch" placement="top" :show-after="500">
              <span class="batch-text mono-text">{{ row.effectBatch }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="修改时间" width="160" align="center" resizable>
          <template #default="{ row }">
            <el-tooltip :content="formatDate(row.updatedAt)" placement="top" :show-after="400">
              <span class="time-text">{{ row.updatedAt ? formatDate(row.updatedAt, 'YYYY-MM-DD HH:mm') : '-' }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <div class="action-btns">
              <el-button
                type="primary" link size="small" :icon="View"
                @click="() => { currentRuleId = row.id; detailVisible = true; loadDetail(row.id); }">查看</el-button>
              <el-button
                type="primary" link size="small" :icon="Edit"
                @click="handleUpdate(row)">编辑</el-button>
              <el-button
                v-if="row.ruleStatus === 1"
                type="warning" link size="small" :icon="SwitchButton"
                :v-loading="btnLoadingStates[`disable-${row.id}`]"
                @click="handleDisableRule(row)">停用</el-button>
              <el-button
                v-else
                type="success" link size="small" :icon="CircleCheck"
                :v-loading="btnLoadingStates[`enable-${row.id}`]"
                @click="handleEnableRule(row)">{{ row.ruleStatus === 2 ? '重新启用' : '启用' }}</el-button>
              <el-button
                type="danger" link size="small" :icon="Delete"
                :v-loading="btnLoadingStates[`delete-${row.id}`]"
                :disabled="row.isCoreDefault"
                @click="handleDeleteRule(row)">删除</el-button>
              <el-button type="warning" link size="small" :icon="Tickets" @click="openTrace(row)">溯源</el-button>
            </div>
          </template>
        </el-table-column>
        <template #empty>
          <div class="empty-tip">
            <el-icon :size="48" color="#c0c4cc"><Document /></el-icon>
            <p>暂无审核规则</p>
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

    <div v-else class="card-view-wrapper">
      <div class="card-grid">
        <div
          v-for="item in listData"
          :key="item.id"
          class="rule-card card-content card-hover"
          :class="{ 'card-hover': true }"
          @mouseenter="cardHoverStates[item.id] = true"
          @mouseleave="cardHoverStates[item.id] = false"
        >
          <div class="card-header">
            <div class="card-title-row">
              <el-tag
                size="small"
                effect="dark"
                class="rule-type-tag"
                :style="{
                  backgroundColor: getRuleTypeColor(item.ruleType) + '20',
                  borderColor: getRuleTypeColor(item.ruleType),
                  color: getRuleTypeColor(item.ruleType),
                }"
              >
                {{ getEnumLabel(AUDIT_RULE_TYPE as any, item.ruleType) }}
              </el-tag>
              <el-tag v-if="item.isCoreDefault" size="small" class="core-badge" effect="dark">核心</el-tag>
            </div>
            <h3 class="card-title text-ellipsis">{{ item.ruleName }}</h3>
            <p class="card-code mono-text">{{ item.ruleCode }}</p>
          </div>
          <div class="card-body">
            <div class="card-info-row">
              <span class="info-label">分类</span>
              <span class="info-value">{{ getEnumLabel(AUDIT_RULE_CATEGORY as any, item.ruleCategory) }}</span>
            </div>
            <div class="card-info-row">
              <span class="info-label">优先级</span>
              <el-tag size="small" :type="item.priority >= 8 ? 'danger' : item.priority >= 5 ? 'warning' : 'info'" effect="plain">
                P{{ item.priority }}
              </el-tag>
            </div>
            <div class="card-info-row">
              <span class="info-label">版本</span>
              <span class="info-value">v{{ item.version }}</span>
            </div>
            <div class="card-info-row">
              <span class="info-label">状态</span>
              <el-tag
                :type="getEnumItem(AUDIT_RULE_STATUS, item.ruleStatus)?.type || 'info'"
                size="small"
                effect="dark"
              >
                {{ getEnumLabel(AUDIT_RULE_STATUS, item.ruleStatus) }}
              </el-tag>
              <el-tag v-if="item.conflictCount > 0" size="small" type="danger" effect="dark" class="conflict-badge">
                {{ item.conflictCount }}冲突
              </el-tag>
            </div>
            <div class="card-categories">
              <span class="info-label">适用品类</span>
              <div class="category-tags mt-4">
                <el-tag
                  v-for="cat in item.applicableCategory.slice(0, 3)"
                  :key="cat"
                  size="small"
                  type="primary"
                  effect="plain"
                >{{ cat }}</el-tag>
                <el-tag v-if="item.applicableCategory.length > 3" size="small" type="info" effect="plain">
                  +{{ item.applicableCategory.length - 3 }}
                </el-tag>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <span class="update-time">{{ formatDate(item.updatedAt, 'MM-DD HH:mm') }}</span>
            <div class="card-actions">
              <el-button
                type="primary" size="small" :icon="View"
                class="btn-ripple btn-offset"
                :class="{ 'is-offset': btnOffsetStates[`view-${item.id}`] }"
                @click="(e) => { triggerRipple(e, `view-${item.id}`); triggerOffset(`view-${item.id}`); currentRuleId = item.id; detailVisible = true; loadDetail(item.id); }">查看</el-button>
              <el-button
                type="success" size="small" :icon="Edit"
                class="btn-ripple btn-offset"
                :class="{ 'is-offset': btnOffsetStates[`edit-${item.id}`] }"
                @click="(e) => { triggerRipple(e, `edit-${item.id}`); triggerOffset(`edit-${item.id}`); handleUpdate(item); }">编辑</el-button>
            </div>
          </div>
        </div>
      </div>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="queryParams.page" v-model:page-size="queryParams.pageSize"
          :page-sizes="[12, 24, 48, 100]" :total="total"
          layout="total, sizes, prev, pager, next, jumper" background
          @size-change="handleSizeChange" @current-change="handlePageChange" />
      </div>
    </div>

    <transition name="dialog-zoom">
      <el-dialog v-model="createDialogVisible" title="新建审核规则" width="880px" :close-on-click-modal="false" destroy-on-close top="4vh" class="dialog-zoom">
        <div class="rule-create-dialog tabs-rule-create">
          <el-tabs v-model="activeTab" type="card" class="create-tabs">
            <el-tab-pane label="基础信息" name="basic">
              <el-form ref="createFormRef" :model="createFormData" :rules="createFormRules" label-width="110px" @submit.prevent>
                <el-form-item label="规则名称" prop="ruleName" :class="{ 'field-shake': shakeFields.ruleName }">
                  <el-input v-model="createFormData.ruleName" placeholder="请输入规则名称（2-50字）" maxlength="50" show-word-limit />
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="规则类型" prop="ruleType" :class="{ 'field-shake': shakeFields.ruleType }">
                      <el-select v-model="createFormData.ruleType" placeholder="请选择规则类型" style="width: 100%">
                        <el-option v-for="opt in ruleTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value">
                          <span :style="{ color: (opt as any).color }">●</span>
                          <span style="margin-left: 6px">{{ opt.label }}</span>
                        </el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="规则分类" prop="ruleCategory" :class="{ 'field-shake': shakeFields.ruleCategory }">
                      <el-select v-model="createFormData.ruleCategory" placeholder="请选择规则分类" style="width: 100%">
                        <el-option v-for="opt in ruleCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="规则描述">
                  <el-input v-model="createFormData.ruleDescription" type="textarea" :rows="2" placeholder="请输入规则描述" maxlength="200" show-word-limit />
                </el-form-item>
                <el-form-item label="适用品类" :class="{ 'field-shake': shakeFields.applicableCategory }">
                  <el-select v-model="createFormData.applicableCategory" multiple placeholder="请选择适用品类（至少选1项）" style="width: 100%">
                    <el-option label="电影" value="movie" />
                    <el-option label="电视剧" value="tv_series" />
                    <el-option label="综艺" value="variety" />
                    <el-option label="动漫" value="anime" />
                    <el-option label="纪录片" value="documentary" />
                    <el-option label="短视频" value="short_video" />
                    <el-option label="直播" value="live" />
                  </el-select>
                </el-form-item>
                <el-form-item label="风险等级">
                  <el-select v-model="createFormData.applicableRiskLevels" multiple placeholder="请选择适用风险等级" style="width: 100%">
                    <el-option label="低风险" :value="1" />
                    <el-option label="中风险" :value="2" />
                    <el-option label="高风险" :value="3" />
                    <el-option label="极高风险" :value="4" />
                  </el-select>
                </el-form-item>
                <el-form-item label="生效时段">
                  <el-date-picker
                    v-model="createFormData.effectiveStartTime"
                    type="datetime"
                    placeholder="开始时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 48%"
                  />
                  <span style="margin: 0 10px">至</span>
                  <el-date-picker
                    v-model="createFormData.effectiveEndTime"
                    type="datetime"
                    placeholder="结束时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 48%"
                  />
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="优先级">
                      <el-slider v-model="createFormData.priority" :min="1" :max="10" :marks="{ 1: '低', 5: '中', 10: '高' }" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="排序号">
                      <el-input-number v-model="createFormData.sortOrder" :min="1" :max="9999" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="备注">
                  <el-input v-model="createFormData.remark" type="textarea" :rows="2" placeholder="请输入备注" maxlength="200" show-word-limit />
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="触发条件" name="trigger">
              <div v-if="dynamicFields.triggerConditions.length === 0" class="empty-conditions">
                <el-empty description="请先选择规则类型和分类" :image-size="80" />
              </div>
              <div v-else class="trigger-conditions-list">
                <div
                  v-for="cond in dynamicFields.triggerConditions"
                  :key="cond.conditionKey"
                  class="condition-item"
                  :class="{ 'field-shake': shakeFields[`cond_${cond.conditionKey}`] }"
                >
                  <div class="condition-header">
                    <span class="condition-label">
                      <span v-if="cond.required" class="required-star">*</span>
                      {{ cond.conditionLabel }}
                    </span>
                    <el-tag size="small" type="info" effect="plain">{{ cond.fieldType }}</el-tag>
                  </div>
                  <div class="condition-input">
                    <template v-if="cond.fieldType === 'select'">
                      <el-select v-model="(createFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.value" placeholder="请选择" style="width: 100%" clearable>
                        <el-option v-for="opt in cond.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>
                    </template>
                    <template v-else-if="cond.fieldType === 'number'">
                      <el-input-number v-model="(createFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.value" :min="0" style="width: 100%">
                        <template #append>{{ cond.unit || '' }}</template>
                      </el-input-number>
                    </template>
                    <template v-else-if="cond.fieldType === 'number_range'">
                      <div class="range-input">
                        <el-input-number v-model="(createFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueStart" :min="0" placeholder="最小值" style="flex: 1" />
                        <span class="range-sep">-</span>
                        <el-input-number v-model="(createFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueEnd" :min="0" placeholder="最大值" style="flex: 1" />
                        <span class="range-unit">{{ cond.unit || '' }}</span>
                      </div>
                    </template>
                    <template v-else-if="cond.fieldType === 'time_range'">
                      <div class="range-input">
                        <el-time-picker v-model="(createFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueStart" placeholder="开始时间" value-format="HH:mm" style="flex: 1" />
                        <span class="range-sep">-</span>
                        <el-time-picker v-model="(createFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueEnd" placeholder="结束时间" value-format="HH:mm" style="flex: 1" />
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="动作配置" name="action">
              <div v-if="dynamicFields.actions.length === 0" class="empty-conditions">
                <el-empty description="请先选择规则类型和分类" :image-size="80" />
              </div>
              <div v-else :class="['actions-list', { 'field-shake': shakeFields.actions }]">
                <div v-for="action in dynamicFields.actions" :key="action.actionKey" class="action-item">
                  <div class="action-header">
                    <div class="action-left">
                      <el-switch
                        v-model="(createFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.enabled"
                        active-text="启用"
                        inactive-text="停用"
                        inline-prompt
                      />
                      <span class="action-name" :style="{ color: (getEnumItem(AUDIT_RULE_ACTION as any, action.actionKey) as any)?.color }">
                        {{ action.actionLabel }}
                      </span>
                    </div>
                    <el-tag size="small" type="info" effect="plain">
                      {{ action.actionKey }}
                    </el-tag>
                  </div>
                  <div v-if="(createFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.enabled" class="action-params mt-12">
                    <el-form label-width="100px" size="small">
                      <el-form-item v-for="(paramVal, paramKey) in (createFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.actionParams || {}" :key="paramKey" :label="paramKey">
                        <el-input v-model="(createFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.actionParams[paramKey]" placeholder="请输入" />
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>

          <div class="conflict-panel">
            <el-alert v-if="conflictCheckResult?.hasConflict" type="warning" :closable="false" show-icon class="mb-8">
              <template #title>
                <b>检测到 {{ conflictCheckResult.conflicts.length }} 处规则冲突</b>
              </template>
              <div class="conflict-list mt-8">
                <div v-for="(c, i) in conflictCheckResult.conflicts.slice(0, 3)" :key="i" class="conflict-item">
                  <el-tag size="small" :type="c.severity === 'high' ? 'danger' : c.severity === 'medium' ? 'warning' : 'info'" effect="plain">
                    {{ c.severity === 'high' ? '高' : c.severity === 'medium' ? '中' : '低' }}
                  </el-tag>
                  <span class="conflict-desc">{{ c.description }}</span>
                </div>
              </div>
            </el-alert>
            <el-alert v-if="conflictCheckResult?.hasParamsMissing" type="error" :closable="false" show-icon>
              <template #title>
                <b>参数缺失：{{ missingFieldLabels.length }} 项必填项未填写</b>
              </template>
              <div class="missing-fields mt-8">
                <el-tag v-for="f in missingFieldLabels" :key="f" size="small" type="danger" effect="plain" style="margin-right: 6px">
                  {{ f }}
                </el-tag>
              </div>
            </el-alert>
            <div v-if="!conflictCheckResult" class="checking-hint text-secondary">
              <el-icon class="loading-icon"><Refresh /></el-icon>
              正在检测冲突...
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :icon="Checked"
            :loading="submitting"
            :disabled="conflictCheckResult && !conflictCheckResult.canSubmit"
            class="btn-ripple"
            :class="{ 'field-shake': shakeFields.submit }"
            @click="(e) => { triggerRipple(e, 'create-submit'); triggerOffset('create-submit'); handleCreateSubmit(); }">
            保存
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="editDialogVisible" title="编辑审核规则" width="880px" :close-on-click-modal="false" destroy-on-close top="4vh" class="dialog-zoom">
        <div class="rule-create-dialog tabs-rule-create">
          <el-tabs v-model="activeTab" type="card" class="create-tabs">
            <el-tab-pane label="基础信息" name="basic">
              <el-form ref="editFormRef" :model="editFormData" :rules="createFormRules" label-width="110px" @submit.prevent>
                <el-form-item label="规则名称" prop="ruleName" :class="{ 'field-shake': shakeFields.ruleName }">
                  <el-input v-model="editFormData.ruleName" placeholder="请输入规则名称（2-50字）" maxlength="50" show-word-limit />
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="规则类型">
                      <el-select v-model="editFormData.ruleType" placeholder="请选择规则类型" style="width: 100%" disabled>
                        <el-option v-for="opt in ruleTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="规则分类">
                      <el-select v-model="editFormData.ruleCategory" placeholder="请选择规则分类" style="width: 100%" disabled>
                        <el-option v-for="opt in ruleCategoryOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="规则描述">
                  <el-input v-model="editFormData.ruleDescription" type="textarea" :rows="2" placeholder="请输入规则描述" maxlength="200" show-word-limit />
                </el-form-item>
                <el-form-item label="适用品类" :class="{ 'field-shake': shakeFields.applicableCategory }">
                  <el-select v-model="editFormData.applicableCategory" multiple placeholder="请选择适用品类（至少选1项）" style="width: 100%">
                    <el-option label="电影" value="movie" />
                    <el-option label="电视剧" value="tv_series" />
                    <el-option label="综艺" value="variety" />
                    <el-option label="动漫" value="anime" />
                    <el-option label="纪录片" value="documentary" />
                    <el-option label="短视频" value="short_video" />
                    <el-option label="直播" value="live" />
                  </el-select>
                </el-form-item>
                <el-form-item label="风险等级">
                  <el-select v-model="editFormData.applicableRiskLevels" multiple placeholder="请选择适用风险等级" style="width: 100%">
                    <el-option label="低风险" :value="1" />
                    <el-option label="中风险" :value="2" />
                    <el-option label="高风险" :value="3" />
                    <el-option label="极高风险" :value="4" />
                  </el-select>
                </el-form-item>
                <el-form-item label="生效时段">
                  <el-date-picker
                    v-model="editFormData.effectiveStartTime"
                    type="datetime"
                    placeholder="开始时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 48%"
                  />
                  <span style="margin: 0 10px">至</span>
                  <el-date-picker
                    v-model="editFormData.effectiveEndTime"
                    type="datetime"
                    placeholder="结束时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    style="width: 48%"
                  />
                </el-form-item>
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="优先级">
                      <el-slider v-model="editFormData.priority" :min="1" :max="10" :marks="{ 1: '低', 5: '中', 10: '高' }" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="排序号">
                      <el-input-number v-model="editFormData.sortOrder" :min="1" :max="9999" style="width: 100%" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="备注">
                  <el-input v-model="editFormData.remark" type="textarea" :rows="2" placeholder="请输入备注" maxlength="200" show-word-limit />
                </el-form-item>
              </el-form>
            </el-tab-pane>

            <el-tab-pane label="触发条件" name="trigger">
              <div v-if="dynamicFields.triggerConditions.length === 0" class="empty-conditions">
                <el-empty description="请先选择规则类型和分类" :image-size="80" />
              </div>
              <div v-else class="trigger-conditions-list">
                <div
                  v-for="cond in dynamicFields.triggerConditions"
                  :key="cond.conditionKey"
                  class="condition-item"
                  :class="{ 'field-shake': shakeFields[`cond_${cond.conditionKey}`] }"
                >
                  <div class="condition-header">
                    <span class="condition-label">
                      <span v-if="cond.required" class="required-star">*</span>
                      {{ cond.conditionLabel }}
                    </span>
                    <el-tag size="small" type="info" effect="plain">{{ cond.fieldType }}</el-tag>
                  </div>
                  <div class="condition-input">
                    <template v-if="cond.fieldType === 'select'">
                      <el-select v-model="(editFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.value" placeholder="请选择" style="width: 100%" clearable>
                        <el-option v-for="opt in cond.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>
                    </template>
                    <template v-else-if="cond.fieldType === 'number'">
                      <el-input-number v-model="(editFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.value" :min="0" style="width: 100%">
                        <template #append>{{ cond.unit || '' }}</template>
                      </el-input-number>
                    </template>
                    <template v-else-if="cond.fieldType === 'number_range'">
                      <div class="range-input">
                        <el-input-number v-model="(editFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueStart" :min="0" placeholder="最小值" style="flex: 1" />
                        <span class="range-sep">-</span>
                        <el-input-number v-model="(editFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueEnd" :min="0" placeholder="最大值" style="flex: 1" />
                        <span class="range-unit">{{ cond.unit || '' }}</span>
                      </div>
                    </template>
                    <template v-else-if="cond.fieldType === 'time_range'">
                      <div class="range-input">
                        <el-time-picker v-model="(editFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueStart" placeholder="开始时间" value-format="HH:mm" style="flex: 1" />
                        <span class="range-sep">-</span>
                        <el-time-picker v-model="(editFormData.triggerConditions as any[]).find(c => c.conditionKey === cond.conditionKey)?.valueEnd" placeholder="结束时间" value-format="HH:mm" style="flex: 1" />
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="动作配置" name="action">
              <div v-if="dynamicFields.actions.length === 0" class="empty-conditions">
                <el-empty description="请先选择规则类型和分类" :image-size="80" />
              </div>
              <div v-else :class="['actions-list', { 'field-shake': shakeFields.actions }]">
                <div v-for="action in dynamicFields.actions" :key="action.actionKey" class="action-item">
                  <div class="action-header">
                    <div class="action-left">
                      <el-switch
                        v-model="(editFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.enabled"
                        active-text="启用"
                        inactive-text="停用"
                        inline-prompt
                      />
                      <span class="action-name" :style="{ color: (getEnumItem(AUDIT_RULE_ACTION as any, action.actionKey) as any)?.color }">
                        {{ action.actionLabel }}
                      </span>
                    </div>
                    <el-tag size="small" type="info" effect="plain">
                      {{ action.actionKey }}
                    </el-tag>
                  </div>
                  <div v-if="(editFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.enabled" class="action-params mt-12">
                    <el-form label-width="100px" size="small">
                      <el-form-item v-for="(paramVal, paramKey) in (editFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.actionParams || {}" :key="paramKey" :label="paramKey">
                        <el-input v-model="(editFormData.actions as any[]).find(a => a.actionKey === action.actionKey)?.actionParams[paramKey]" placeholder="请输入" />
                      </el-form-item>
                    </el-form>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :icon="Checked"
            :loading="submitting"
            class="btn-ripple"
            :class="{ 'field-shake': shakeFields.submit }"
            @click="(e) => { triggerRipple(e, 'edit-submit'); triggerOffset('edit-submit'); handleUpdateSubmit(); }">
            保存
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="batchConfirmVisible" title="批量操作确认" width="520px" destroy-on-close top="12vh">
        <div class="batch-confirm-content">
          <el-alert type="warning" :closable="false" show-icon class="mb-16">
            <template #title>
              <b>检测到选中项包含 {{ selectedCoreRules.length }} 条核心默认规则，将自动跳过</b>
            </template>
          </el-alert>
          <div class="skipped-rules">
            <div class="skipped-title">将跳过的核心规则：</div>
            <div class="skipped-list">
              <div v-for="rule in selectedCoreRules" :key="rule.id" class="skipped-item">
                <el-tag size="small" type="warning" effect="plain">核心</el-tag>
                <span class="skipped-name">{{ rule.ruleName }}</span>
                <span class="skipped-reason text-secondary">（默认规则不可删除/修改）</span>
              </div>
            </div>
          </div>
          <div class="batch-summary mt-16">
            <div>将实际执行操作的规则数：<b class="text-primary">{{ selectedRows.length - selectedCoreRules.length }}</b> 条</div>
          </div>
        </div>
        <template #footer>
          <el-button @click="batchConfirmVisible = false">取消</el-button>
          <el-button type="primary" :loading="batchSubmitting" @click="doBatchAction(currentBatchAction)">
            确认执行
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="syncModeDialogVisible" title="同步至全品类" width="440px" destroy-on-close top="15vh">
        <div class="sync-mode-content">
          <p class="sync-tip">选择同步模式：</p>
          <el-radio-group v-model="syncMode" class="sync-mode-radio">
            <el-radio value="copy" border>
              <div class="radio-option">
                <div class="option-title">复制模式</div>
                <div class="option-desc text-secondary">在每个品类下创建规则副本，互不影响</div>
              </div>
            </el-radio>
            <el-radio value="merge" border>
              <div class="radio-option">
                <div class="option-title">合并模式</div>
                <div class="option-desc text-secondary">若目标品类已有同名规则则合并参数</div>
              </div>
            </el-radio>
          </el-radio-group>
          <el-alert v-if="hasCoreSelected" type="warning" :closable="false" show-icon class="mt-16" size="small">
            核心默认规则无法同步，将自动跳过
          </el-alert>
        </div>
        <template #footer>
          <el-button @click="syncModeDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="batchSubmitting" @click="handleSyncAllCategories">
            开始同步
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="detailVisible" title="规则详情" width="720px" destroy-on-close top="5vh">
        <div v-if="detailLoading" class="skeleton-wrapper">
          <el-skeleton :rows="3" animated />
          <el-divider />
          <el-skeleton :rows="5" animated />
        </div>
        <div v-else-if="currentDetail" class="detail-content">
          <div class="detail-header">
            <div class="detail-title-row">
              <h3 class="detail-title">{{ currentDetail.ruleName }}</h3>
              <el-tag v-if="currentDetail.isCoreDefault" size="small" class="core-badge" effect="dark">核心默认</el-tag>
            </div>
            <div class="detail-code mono-text">编码：{{ currentDetail.ruleCode }}</div>
          </div>
          <el-descriptions :column="2" size="small" border class="mt-16">
            <el-descriptions-item label="规则类型">
              <el-tag
                size="small"
                effect="dark"
                :style="{
                  backgroundColor: getRuleTypeColor(currentDetail.ruleType) + '20',
                  borderColor: getRuleTypeColor(currentDetail.ruleType),
                  color: getRuleTypeColor(currentDetail.ruleType),
                }"
              >
                {{ getEnumLabel(AUDIT_RULE_TYPE as any, currentDetail.ruleType) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="规则分类">
              {{ getEnumLabel(AUDIT_RULE_CATEGORY as any, currentDetail.ruleCategory) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getEnumItem(AUDIT_RULE_STATUS, currentDetail.ruleStatus)?.type || 'info'" size="small" effect="dark">
                {{ getEnumLabel(AUDIT_RULE_STATUS, currentDetail.ruleStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag size="small" :type="currentDetail.priority >= 8 ? 'danger' : currentDetail.priority >= 5 ? 'warning' : 'info'" effect="plain">
                P{{ currentDetail.priority }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="版本">v{{ currentDetail.version }}</el-descriptions-item>
            <el-descriptions-item label="生效批次">{{ currentDetail.effectBatch }}</el-descriptions-item>
            <el-descriptions-item label="适用品类" :span="2">
              <el-tag v-for="cat in currentDetail.applicableCategory" :key="cat" size="small" type="primary" effect="plain" style="margin-right: 6px">
                {{ cat }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="生效时间" :span="2">
              {{ currentDetail.effectiveStartTime ? formatDate(currentDetail.effectiveStartTime, 'YYYY-MM-DD HH:mm') : '立即' }}
              至
              {{ currentDetail.effectiveEndTime ? formatDate(currentDetail.effectiveEndTime, 'YYYY-MM-DD HH:mm') : '永久' }}
            </el-descriptions-item>
            <el-descriptions-item label="描述" :span="2">
              {{ currentDetail.ruleDescription || '无' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider>触发条件</el-divider>
          <div v-if="currentDetail.triggerConditions.length === 0" class="empty-section">
            暂无触发条件
          </div>
          <div v-else class="conditions-list">
            <div v-for="cond in currentDetail.triggerConditions" :key="cond.conditionKey" class="condition-row">
              <span class="cond-label">{{ cond.conditionLabel }}：</span>
              <span class="cond-value">
                <template v-if="cond.fieldType === 'number_range'">
                  {{ (cond as any).valueStart || 0 }} - {{ (cond as any).valueEnd || 0 }} {{ cond.unit || '' }}
                </template>
                <template v-else-if="cond.fieldType === 'time_range'">
                  {{ (cond as any).valueStart || '-' }} - {{ (cond as any).valueEnd || '-' }}
                </template>
                <template v-else>
                  {{ (cond as any).value || '-' }} {{ cond.unit || '' }}
                </template>
              </span>
            </div>
          </div>

          <el-divider>动作配置</el-divider>
          <div v-if="currentDetail.actions.filter(a => a.enabled).length === 0" class="empty-section">
            暂无启用的动作
          </div>
          <div v-else class="actions-grid">
            <div v-for="action in currentDetail.actions.filter(a => a.enabled)" :key="action.actionKey" class="action-card">
              <div class="action-card-header">
                <el-tag
                  size="small"
                  :style="{
                    color: (getEnumItem(AUDIT_RULE_ACTION as any, action.actionKey) as any)?.color,
                    borderColor: (getEnumItem(AUDIT_RULE_ACTION as any, action.actionKey) as any)?.color,
                    backgroundColor: (getEnumItem(AUDIT_RULE_ACTION as any, action.actionKey) as any)?.color + '10',
                  }"
                >
                  {{ action.actionLabel }}
                </el-tag>
              </div>
              <div v-if="Object.keys(action.actionParams).length > 0" class="action-params-list mt-8">
                <div v-for="(val, key) in action.actionParams" :key="key" class="param-row">
                  <span class="param-key">{{ key }}：</span>
                  <span class="param-val">{{ val }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
          <el-button type="primary" :icon="Edit" @click="() => { if (currentDetail) { detailVisible = false; handleUpdate(currentDetail as any); } }">
            编辑
          </el-button>
        </template>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="traceDialogVisible" title="规则溯源" width="960px" destroy-on-close top="3vh" class="trace-dialog">
        <div v-if="detailLoading" class="skeleton-wrapper">
          <el-skeleton :rows="2" animated />
          <el-divider />
          <el-skeleton :rows="4" animated />
        </div>
        <div v-else-if="traceData" class="trace-content">
          <div class="trace-header">
            <div class="trace-info">
              <div class="trace-title-row">
                <h3 class="trace-title">{{ traceData.ruleName }}</h3>
                <el-tag v-if="traceData.isCoreDefault" size="small" class="core-badge" effect="dark">核心默认</el-tag>
              </div>
              <div class="trace-meta">
                <span class="meta-item"><span class="meta-label">规则编码：</span>{{ traceData.ruleCode }}</span>
                <span class="meta-item"><span class="meta-label">当前版本：</span>v{{ traceData.version }}</span>
                <span class="meta-item"><span class="meta-label">生效批次：</span>{{ traceData.effectBatch }}</span>
              </div>
            </div>
          </div>

          <el-tabs v-model="traceActiveTab" class="trace-tabs">
            <el-tab-pane label="版本历史" name="versions">
              <div class="version-timeline">
                <el-timeline>
                  <el-timeline-item
                    v-for="ver in traceData.versionHistory"
                    :key="ver.version"
                    :timestamp="ver.publishTime ? formatDate(ver.publishTime, 'YYYY-MM-DD HH:mm') : '-'"
                    placement="top"
                    :type="ver.version === traceData.version ? 'primary' : 'info'"
                    :size="ver.version === traceData.version ? 'large' : 'normal'"
                  >
                    <el-card class="version-card" shadow="hover">
                      <div class="version-header">
                        <div class="version-left">
                          <span class="version-tag">v{{ ver.version }}</span>
                          <el-tag size="small" type="success" effect="plain" v-if="ver.version === traceData.version">当前版本</el-tag>
                          <span class="effect-batch">批次：{{ ver.effectBatch }}</span>
                        </div>
                        <div class="version-right">
                          <span class="publisher">{{ ver.publisher || '系统' }}</span>
                        </div>
                      </div>
                      <div class="change-summary mt-8">
                        <span class="summary-label">变更摘要：</span>
                        <span class="summary-text">{{ ver.changeSummary || '无' }}</span>
                      </div>
                    </el-card>
                  </el-timeline-item>
                </el-timeline>
              </div>
            </el-tab-pane>

            <el-tab-pane label="修改记录" name="modifications">
              <div class="modify-table-wrapper">
                <el-table :data="traceData.modifyHistory || []" stripe size="small" border>
                  <el-table-column prop="modifyType" label="修改类型" width="120">
                    <template #default="{ row }">
                      <el-tag size="small" :type="getEnumItem(RULE_MODIFY_TYPE, row.modifyType)?.type || 'info'">
                        {{ getEnumLabel(RULE_MODIFY_TYPE, row.modifyType) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="modifier" label="修改人" width="120" />
                  <el-table-column prop="modifyTime" label="修改时间" width="160">
                    <template #default="{ row }">
                      {{ row.modifyTime ? formatDate(row.modifyTime, 'YYYY-MM-DD HH:mm') : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="changeSummary" label="变更摘要" min-width="180">
                    <template #default="{ row }">
                      <el-tooltip :content="row.changeSummary" :show-after="500" placement="top">
                        <span class="long-text-tooltip">{{ row.changeSummary || '-' }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column prop="changeFields" label="变更字段" min-width="150">
                    <template #default="{ row }">
                      <template v-if="row.changeFields && row.changeFields.length > 0">
                        <el-tag v-for="(field, idx) in row.changeFields.slice(0, 3)" :key="idx" size="small" type="info" effect="plain" style="margin-right: 4px">
                          {{ field }}
                        </el-tag>
                        <el-tag v-if="row.changeFields.length > 3" size="small" type="info">
                          +{{ row.changeFields.length - 3 }}
                        </el-tag>
                      </template>
                      <span v-else class="text-secondary">-</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="冲突历史" name="conflicts">
              <div class="conflict-table-wrapper">
                <el-table :data="traceData.conflictHistory || []" stripe size="small" border>
                  <el-table-column prop="detectTime" label="检测时间" width="160">
                    <template #default="{ row }">
                      {{ row.detectTime ? formatDate(row.detectTime, 'YYYY-MM-DD HH:mm') : '-' }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="conflictType" label="冲突类型" width="120">
                    <template #default="{ row }">
                      <el-tag size="small" :type="row.conflictType === 'conflict' ? 'danger' : row.conflictType === 'overlap' ? 'warning' : 'info'">
                        {{ row.conflictType === 'conflict' ? '冲突' : row.conflictType === 'overlap' ? '重叠' : '异常' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="描述" min-width="250">
                    <template #default="{ row }">
                      <el-tooltip :content="row.description" :show-after="500" placement="top">
                        <span class="long-text-tooltip">{{ row.description || '-' }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column prop="resolved" label="是否已解决" width="100" align="center">
                    <template #default="{ row }">
                      <el-tag size="small" :type="row.resolved ? 'success' : 'danger'" effect="plain">
                        {{ row.resolved ? '已解决' : '未解决' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-dialog>
    </transition>

    <transition name="dialog-zoom">
      <el-dialog v-model="modifyHistoryDialogVisible" title="修改记录" width="720px" destroy-on-close top="8vh">
        <div class="modify-history-content">
          <div class="modify-header-info mb-12">
            <span class="info-label">规则：</span>
            <span class="info-value">{{ currentDetail?.ruleName || '-' }}</span>
          </div>
          <div class="modify-table-wrapper">
            <el-table :data="modifyHistoryList" stripe size="small" border v-loading="detailLoading">
              <el-table-column prop="modifyType" label="类型" width="110">
                <template #default="{ row }">
                  <el-tag size="small" :type="getEnumItem(RULE_MODIFY_TYPE, row.modifyType)?.type || 'info'">
                    {{ getEnumLabel(RULE_MODIFY_TYPE, row.modifyType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="modifier" label="修改人" width="100" />
              <el-table-column prop="modifyTime" label="修改时间" width="150">
                <template #default="{ row }">
                  {{ row.modifyTime ? formatDate(row.modifyTime, 'YYYY-MM-DD HH:mm') : '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="changeSummary" label="变更摘要" min-width="200">
                <template #default="{ row }">
                  <el-tooltip :content="row.changeSummary" :show-after="500" placement="top">
                    <span class="long-text-tooltip">{{ row.changeSummary || '-' }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-dialog>
    </transition>

    <el-drawer v-model="consistencyDrawerVisible" title="一致性检查" size="420px" direction="rtl" class="drawer-consistency">
      <div class="consistency-content" v-loading="detailLoading">
        <div class="gauge-section">
          <div class="gauge-title">综合评分</div>
          <div class="gauge-value" :style="{ color: consistencyCheckResult?.overallScore >= 90 ? '#67C23A' : consistencyCheckResult?.overallScore >= 70 ? '#E6A23C' : '#F56C6C' }">
            {{ consistencyCheckResult?.overallScore || 0 }}
          </div>
          <el-progress
            :percentage="consistencyCheckResult?.overallScore || 0"
            :color="consistencyCheckResult?.overallScore >= 90 ? '#67C23A' : consistencyCheckResult?.overallScore >= 70 ? '#E6A23C' : '#F56C6C'"
            :stroke-width="10"
            :show-text="false"
          />
        </div>

        <el-row :gutter="12" class="stat-cards">
          <el-col :span="12">
            <div class="stat-card">
              <div class="stat-num">{{ consistencyCheckResult?.coveredCategories || 0 }}</div>
              <div class="stat-label">覆盖品类数</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card stat-danger">
              <div class="stat-num">{{ consistencyCheckResult?.conflictCount || 0 }}</div>
              <div class="stat-label">冲突数</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card stat-warning">
              <div class="stat-num">{{ consistencyCheckResult?.contradictionCount || 0 }}</div>
              <div class="stat-label">矛盾数</div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="stat-card stat-info">
              <div class="stat-num">{{ consistencyCheckResult?.gapCount || 0 }}</div>
              <div class="stat-label">漏洞数</div>
            </div>
          </el-col>
        </el-row>

        <el-divider>问题列表</el-divider>

        <div class="problem-list">
          <div v-if="!consistencyCheckResult?.issues || consistencyCheckResult.issues.length === 0" class="empty-problems">
            <el-empty description="暂无问题" :image-size="60" />
          </div>
          <div v-else>
            <div v-for="(issue, idx) in consistencyCheckResult.issues" :key="idx" class="problem-item">
              <el-tag size="small" :type="issue.severity === 'high' ? 'danger' : issue.severity === 'medium' ? 'warning' : 'info'" class="problem-tag">
                {{ issue.severity === 'high' ? '高' : issue.severity === 'medium' ? '中' : '低' }}
              </el-tag>
              <div class="problem-content">
                <div class="problem-type">{{ issue.typeLabel }}</div>
                <div class="problem-desc">{{ issue.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>

    <transition name="dialog-zoom">
      <el-dialog v-model="enableConfirmVisible" title="确认操作" width="420px" destroy-on-close top="20vh">
        <div class="enable-confirm-content">
          <el-icon :size="22" color="#E6A23C" class="mr-8"><WarningFilled /></el-icon>
          <span class="confirm-text">重新启用将重置生效时间，是否确认？</span>
        </div>
        <template #footer>
          <el-button @click="enableConfirmVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="doEnableRule">
            确认启用
          </el-button>
        </template>
      </el-dialog>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.audit-rule-container {
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100%;
  box-sizing: border-box;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 16px;

  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    position: relative;
    overflow: hidden;

    &:hover {
      transform: scale(1.03) translateY(-4px);
      animation: shadowExpand 0.3s ease forwards;
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;

      &.draft { background: rgba(144, 147, 153, 0.15); color: #909399; }
      &.enabled { background: rgba(103, 194, 58, 0.15); color: #67C23A; }
      &.expired { background: rgba(245, 108, 108, 0.15); color: #F56C6C; }
      &.conflict { background: rgba(230, 162, 60, 0.15); color: #E6A23C; }
      &.core { background: rgba(64, 158, 255, 0.15); color: #409EFF; }
      &.coverage { background: rgba(155, 89, 182, 0.15); color: #9b59b6; }
    }

    .stat-num {
      font-size: 28px;
      font-weight: 700;
      line-height: 1.2;
      color: #303133;

      &.draft { color: #909399; }
      &.enabled { color: #67C23A; }
      &.expired { color: #F56C6C; }
      &.conflict { color: #E6A23C; }
      &.core { color: #409EFF; }
      &.coverage { color: #9b59b6; }
    }

    .stat-label {
      font-size: 13px;
      color: #909399;
      margin-top: 6px;
    }

    .stat-trend {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 12px;
    }
  }
}

@keyframes shadowExpand {
  from {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  to {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.filter-bar {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.batch-toolbar {
  background: #fff;
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .selected-info {
    font-size: 13px;
    color: #606266;
  }

  .core-warning {
    font-size: 12px;
    color: #E6A23C;
  }
}

.list-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

:deep(.el-table) {
  .row--zebra {
    background-color: #fafafa;
  }

  .row--current {
    background-color: #ecf5ff !important;
  }

  .sticky-header-th {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #f5f7fa;
  }
}

.rule-type-tag {
  font-weight: 500;
}

.core-badge {
  border: 1px solid #E6A23C;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  color: #E6A23C;
  animation: corePulse 2s ease-in-out infinite;
}

@keyframes corePulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(230, 162, 60, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(230, 162, 60, 0);
  }
}

.conflict-badge {
  position: absolute;
  top: -8px;
  right: -8px;
}

.long-text-tooltip {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.card-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 8px;
}

.rule-card {
  background: #fff;
  border-radius: 10px;
  border: 1px solid #ebeef5;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: scale(1.03) translateY(-4px);
    animation: shadowExpand 0.3s ease forwards;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 4px 0;
    flex: 1;
  }

  .card-code {
    font-size: 12px;
    color: #909399;
    font-family: monospace;
  }

  .card-body {
    margin-bottom: 16px;
  }

  .card-info-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;

    .info-label {
      color: #909399;
    }

    .info-value {
      color: #606266;
    }
  }

  .card-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }

  .card-actions {
    display: flex;
    gap: 8px;
  }
}

.btn-ripple {
  position: relative;
  overflow: hidden;

  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: scale(0);
    animation: rippleAnim 0.6s ease-out;
    pointer-events: none;
  }
}

@keyframes rippleAnim {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

.btn-offset {
  transition: all 0.1s ease;

  &.is-offset {
    transform: translate(1px, 1px);
    filter: brightness(0.92);
  }
}

.field-shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-8px); }
  40% { transform: translateX(8px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.dialog-zoom-enter-active,
.dialog-zoom-leave-active {
  transition: all 0.25s ease;

  :deep(.el-dialog) {
    transition: all 0.25s ease;
  }
}

.dialog-zoom-enter-from,
.dialog-zoom-leave-to {
  opacity: 0;

  :deep(.el-dialog) {
    transform: scale(0.85);
    opacity: 0;
  }
}

.create-dialog, .edit-dialog {
  .dialog-content {
    display: flex;
    gap: 20px;
  }

  .form-section {
    flex: 1;
    min-width: 0;
  }

  .conflict-panel {
    width: 240px;
    flex-shrink: 0;
    border-left: 1px solid #ebeef5;
    padding-left: 20px;

    .panel-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .conflict-list, .missing-list {
      margin-bottom: 16px;
    }

    .conflict-item, .missing-item {
      padding: 8px 10px;
      margin-bottom: 6px;
      border-radius: 4px;
      font-size: 12px;
      line-height: 1.5;

      &.warning {
        background: #fdf6ec;
        color: #e6a23c;
      }

      &.error {
        background: #fef0f0;
        color: #f56c6c;
      }
    }

    .submit-status {
      padding: 10px;
      border-radius: 4px;
      text-align: center;
      font-size: 13px;
      font-weight: 500;

      &.can-submit {
        background: #f0f9eb;
        color: #67c23a;
      }

      &.cannot-submit {
        background: #fef0f0;
        color: #f56c6c;
      }
    }
  }
}

.empty-conditions {
  padding: 40px 0;
}

.trigger-conditions-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.condition-item {
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 14px 16px;

  .condition-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .condition-label {
    font-weight: 500;
    color: #303133;
    font-size: 14px;
  }

  .required-star {
    color: #f56c6c;
    margin-right: 4px;
  }
}

.range-input {
  display: flex;
  align-items: center;
  gap: 8px;

  .range-sep {
    color: #909399;
  }

  .range-unit {
    color: #909399;
    font-size: 13px;
    margin-left: 4px;
  }
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  background: #fafbfc;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 14px 16px;

  .action-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .action-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .action-name {
    font-weight: 500;
    font-size: 14px;
  }

  .action-params {
    padding-top: 12px;
    border-top: 1px dashed #dcdfe6;
    margin-top: 12px;
  }
}

.batch-confirm-content {
  .skipped-rules {
    margin-top: 12px;
  }

  .skipped-title {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .skipped-list {
    max-height: 200px;
    overflow-y: auto;
    background: #fafafa;
    border-radius: 4px;
    padding: 8px;
  }

  .skipped-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    font-size: 13px;

    &:nth-child(even) {
      background: #f5f7fa;
    }
  }

  .skipped-name {
    flex: 1;
  }

  .skipped-reason {
    font-size: 12px;
  }

  .batch-summary {
    padding: 10px;
    background: #ecf5ff;
    border-radius: 4px;
    text-align: center;
    font-size: 13px;
  }
}

.sync-mode-content {
  .sync-tip {
    font-size: 14px;
    margin-bottom: 16px;
  }

  .sync-mode-radio {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;

    :deep(.el-radio) {
      margin: 0;
      display: block;
    }

    :deep(.el-radio__label) {
      display: block;
      padding: 12px 16px;
    }

    .radio-option {
      .option-title {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 4px;
      }

      .option-desc {
        font-size: 12px;
        line-height: 1.5;
      }
    }
  }
}

.detail-content {
  .detail-header {
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;
  }

  .detail-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-title {
    font-size: 18px;
    margin: 0;
    color: #303133;
  }

  .detail-code {
    margin-top: 6px;
    font-size: 13px;
    color: #909399;
  }

  .empty-section {
    text-align: center;
    color: #909399;
    padding: 24px 0;
    font-size: 13px;
  }

  .conditions-list {
    .condition-row {
      padding: 10px 0;
      border-bottom: 1px dashed #f0f0f0;
      font-size: 13px;

      &:last-child {
        border-bottom: none;
      }
    }

    .cond-label {
      color: #909399;
      margin-right: 8px;
    }

    .cond-value {
      color: #606266;
      font-weight: 500;
    }
  }

  .actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-card {
    background: #fafbfc;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 12px 14px;
  }

  .param-row {
    display: flex;
    font-size: 12px;
    padding: 3px 0;

    .param-key {
      color: #909399;
      width: 80px;
      flex-shrink: 0;
    }

    .param-val {
      color: #606266;
      flex: 1;
    }
  }
}

.trace-dialog {
  :deep(.el-dialog__body) {
    padding-top: 12px;
  }
}

.trace-content {
  .trace-header {
    padding-bottom: 12px;
    border-bottom: 1px solid #ebeef5;
    margin-bottom: 16px;
  }

  .trace-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .trace-title {
    font-size: 18px;
    margin: 0;
    color: #303133;
  }

  .trace-meta {
    margin-top: 8px;
    display: flex;
    gap: 24px;

    .meta-item {
      font-size: 13px;
      color: #606266;
    }

    .meta-label {
      color: #909399;
    }
  }

  .trace-tabs {
    :deep(.el-tabs__content) {
      padding: 16px 4px;
    }
  }

  .version-card {
    margin: 8px 0;

    .version-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .version-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .version-tag {
      font-size: 15px;
      font-weight: 700;
      color: #409eff;
    }

    .effect-batch {
      font-size: 12px;
      color: #909399;
    }

    .publisher {
      font-size: 13px;
      color: #606266;
    }

    .change-summary {
      .summary-label {
        font-size: 13px;
        color: #909399;
      }

      .summary-text {
        font-size: 13px;
        color: #606266;
      }
    }
  }
}

.modify-table-wrapper,
.conflict-table-wrapper {
  max-height: 400px;
  overflow-y: auto;
}

.drawer-consistency {
  :deep(.el-drawer__body) {
    padding: 0;
  }
}

.consistency-content {
  padding: 20px;

  .gauge-section {
    text-align: center;
    margin-bottom: 24px;

    .gauge-title {
      font-size: 14px;
      color: #909399;
      margin-bottom: 8px;
    }

    .gauge-value {
      font-size: 48px;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 8px;
    }
  }

  .stat-cards {
    margin-bottom: 8px;

    .stat-card {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 16px;
      text-align: center;

      .stat-num {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
      }

      &.stat-danger .stat-num {
        color: #f56c6c;
      }

      &.stat-warning .stat-num {
        color: #e6a23c;
      }

      &.stat-info .stat-num {
        color: #909399;
      }
    }
  }

  .problem-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .empty-problems {
    padding: 30px 0;
  }

  .problem-item {
    display: flex;
    gap: 10px;
    padding: 12px;
    background: #fafafa;
    border-radius: 6px;
    margin-bottom: 10px;

    .problem-tag {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .problem-type {
      font-size: 13px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 4px;
    }

    .problem-desc {
      font-size: 12px;
      color: #606266;
      line-height: 1.5;
    }
  }
}

.enable-confirm-content {
  display: flex;
  align-items: center;
  padding: 10px 0;

  .confirm-text {
    font-size: 14px;
    color: #606266;
  }
}

.modify-history-content {
  .modify-header-info {
    padding: 8px 0 12px;
    border-bottom: 1px solid #f0f0f0;

    .info-label {
      color: #909399;
      font-size: 13px;
    }

    .info-value {
      color: #303133;
      font-weight: 500;
    }
  }
}

.mono-text {
  font-family: 'Courier New', Consolas, monospace;
}

.mt-8 { margin-top: 8px; }
.mt-12 { margin-top: 12px; }
.mt-16 { margin-top: 16px; }
.mb-12 { margin-bottom: 12px; }
.mb-16 { margin-bottom: 16px; }
.mr-8 { margin-right: 8px; }
.text-secondary { color: #909399; }
.text-primary { color: #409eff; }

:deep(.el-table .cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.column-resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;

  &:hover {
    background: #409eff;
  }
}

.skeleton-wrapper {
  padding: 12px 0;
}

.tabs-rule-create {
  :deep(.el-tabs__item) {
    font-weight: 500;
  }

  :deep(.el-tab-pane) {
    padding-top: 8px;
  }
}

@media screen and (max-width: 1400px) {
  .stats-cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 992px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>