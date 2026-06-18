<script setup lang="ts">
import { ref, computed, reactive, watch, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  Search, RefreshLeft, Operation, Edit, Warning, ArrowDown, CopyDocument,
  CircleCheckFilled, Check, Close, Lock, ArrowRight, CircleCheck
} from '@element-plus/icons-vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  END_USER_ACCOUNT_STATUS,
  END_USER_TYPE,
  END_USER_ACTIVITY_LEVEL,
  END_USER_FLOW_LIMIT_LEVEL,
  END_USER_GENDER,
  OPERATION_TYPE_USER,
  BATCH_END_USER_ACTION,
  MEMBER_LEVEL,
  CREATOR_LEVEL,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
  PERMISSION_LABEL,
} from '@/constants/enums'
import {
  getEndUserListApi,
  getEndUserDetailApi,
  getEndUserByUidApi,
  createEndUserApi,
  updateEndUserApi,
  changeEndUserStatusApi,
  validateStatusChangeApi,
  batchEndUserOperationApi,
  getAccountStatusLogsApi,
  getEndUserStatsApi,
  validateEndUserDuplicateApi,
  type ChangeStatusParams,
} from '@/api/end-user'
import { useUserStore } from '@/stores'
import { formatDate, formatNumber, copyToClipboard } from '@/utils'
import type { EndUserItem, AccountStatusLogItem, EndUserStats, StatusChangeValidation, BatchEndUserResult } from '@/types'

const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.roles.includes('SUPER_ADMIN'))

const loading = ref(false)
const listData = ref<EndUserItem[]>([])
const total = ref(0)
const stats = ref<EndUserStats | null>(null)
const highlightIds = ref<number[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  userType: null as number | null,
  accountStatus: null as number | null,
  creatorLevel: null as number | null,
  memberLevel: null as number | null,
  activityLevel: null as number | null,
  isVerified: null as number | null,
  minViolationCount: null as number | null,
  maxViolationCount: null as number | null,
  registerStartDate: null as string | null,
  registerEndDate: null as string | null,
  operationBatch: null as string | null,
  sortBy: 'createdAt',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
})

const fetchStats = async () => {
  try {
    stats.value = await getEndUserStatsApi()
  } catch {
    // ignore
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const result = await getEndUserListApi({ ...queryParams })
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
  queryParams.userType = null
  queryParams.accountStatus = null
  queryParams.creatorLevel = null
  queryParams.memberLevel = null
  queryParams.activityLevel = null
  queryParams.isVerified = null
  queryParams.minViolationCount = null
  queryParams.maxViolationCount = null
  queryParams.registerStartDate = null
  queryParams.registerEndDate = null
  queryParams.operationBatch = null
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

const quickFilters = computed(() => {
  if (!stats.value) return []
  const s = stats.value
  return [
    { label: '用户总数', value: formatNumber(s.total), color: '#409EFF', key: 'all' },
    { label: '未实名认证', value: formatNumber(s.unverifiedCount), color: '#E6A23C', key: 'unverified', apply: () => { queryParams.isVerified = 0; handleSearch() } },
    { label: '沉睡用户', value: formatNumber(s.dormantCount), color: '#909399', key: 'dormant', apply: () => { queryParams.activityLevel = 0; handleSearch() } },
    { label: '正常状态', value: formatNumber(s.byStatus.find(x => x.status === 1)?.count ?? 0), color: '#67C23A', key: 'normal', apply: () => { queryParams.accountStatus = 1; handleSearch() } },
    { label: '限流/禁言', value: formatNumber((s.byStatus.find(x => x.status === 2)?.count ?? 0) + (s.byStatus.find(x => x.status === 3)?.count ?? 0)), color: '#F56C6C', key: 'limited', apply: () => { queryParams.accountStatus = 2; handleSearch() } },
    { label: '封禁中', value: formatNumber((s.byStatus.find(x => x.status === 4)?.count ?? 0) + (s.byStatus.find(x => x.status === 5)?.count ?? 0)), color: '#C0392B', key: 'banned', apply: () => { queryParams.accountStatus = 4; handleSearch() } },
  ]
})

const selectedRows = ref<EndUserItem[]>([])
const handleSelectionChange = (rows: EndUserItem[]) => {
  selectedRows.value = rows
}

const accountStatusOptions = computed(() => getEnumOptions(END_USER_ACCOUNT_STATUS))
const userTypeOptions = computed(() => getEnumOptions(END_USER_TYPE))
const activityLevelOptions = computed(() => getEnumOptions(END_USER_ACTIVITY_LEVEL))
const creatorLevelOptions = computed(() => getEnumOptions(CREATOR_LEVEL))
const memberLevelOptions = computed(() => getEnumOptions(MEMBER_LEVEL))
const genderOptions = computed(() => getEnumOptions(END_USER_GENDER))
const batchActionOptions = computed(() => getEnumOptions(BATCH_END_USER_ACTION))

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'uid', label: 'UID', width: 140, slot: 'uid' },
  { prop: 'avatar', label: '头像', width: 70, slot: 'avatar', align: 'center' },
  { prop: 'nickname', label: '昵称/用户名', width: 160, slot: 'nickname' },
  { label: '账号类型', width: 110, align: 'center', slot: 'userType' },
  { label: '实名', width: 70, align: 'center', slot: 'verified' },
  { label: '账号状态', width: 100, align: 'center', slot: 'status' },
  { label: '违规', width: 80, align: 'center', slot: 'violation' },
  { label: '活跃度', width: 100, align: 'center', slot: 'activity' },
  { label: '核心数据', width: 180, slot: 'stats' },
  { prop: 'phone', label: '联系信息', width: 130, slot: 'contact' },
  { prop: 'lastLoginAt', label: '最近登录', width: 150, align: 'center', slot: 'lastLogin' },
  { prop: 'createdAt', label: '注册时间', width: 150, align: 'center', slot: 'registerTime' },
  { label: '操作', width: 220, fixed: 'right', align: 'center', slot: 'actions' },
]

// ============ 功能点1：账号信息编辑 ============
const editDialogVisible = ref(false)
const editDialogMode = ref<'create' | 'edit' | 'view'>('edit')
const editFormRef = ref<FormInstance>()
const editFormShake = ref(false)
const focusedField = ref<string | null>(null)
const duplicateCheckField = ref<string | null>(null)
const duplicateCheckResult = ref<any>(null)

const defaultEditForm = (): Partial<EndUserItem> => ({
  id: undefined,
  username: '',
  nickname: '',
  realName: '',
  idCardNo: '',
  email: '',
  phone: '',
  gender: 0,
  birthday: '',
  region: '',
  signature: '',
  userType: 1,
  creatorLevel: 0,
  memberLevel: 0,
  userTags: [],
  riskTags: [],
  remark: '',
})

const editForm = reactive<Partial<EndUserItem>>(defaultEditForm())

const isBannedStatus = computed(() => {
  if (editDialogMode.value === 'create') return false
  return editForm.accountStatus === 4 || editForm.accountStatus === 5
})

const isEditAllowed = computed(() => {
  if (editDialogMode.value === 'view') return false
  if (editDialogMode.value === 'create') return true
  if (isBannedStatus.value && !isSuperAdmin.value) return false
  return true
})

const editableFieldsByType = computed(() => {
  const base = ['nickname', 'gender', 'birthday', 'region', 'signature', 'avatar']
  switch (editForm.userType) {
    case 1:
      return [...base, 'email', 'phone']
    case 2:
      return [...base, 'email', 'phone', 'realName', 'idCardNo', 'creatorLevel']
    case 3:
      return [...base, 'email', 'phone', 'realName', 'idCardNo', 'memberLevel']
    default:
      return base
  }
})

const isFieldEditable = (field: string): boolean => {
  if (!isEditAllowed.value) return false
  if (editDialogMode.value === 'create') return true
  if (['username', 'userType'].includes(field)) return isSuperAdmin.value
  return editableFieldsByType.value.includes(field) || ['remark', 'riskTags', 'userTags'].includes(field)
}

const editFormRules = computed<FormRules>(() => ({
  username: [
    { required: editDialogMode.value === 'create', message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 50, message: '用户名长度3-50位', trigger: 'blur' },
    {
      validator: async (_rule: any, value: string, callback: any) => {
        if (!value || editDialogMode.value !== 'create') return callback()
        const res = await validateEndUserDuplicateApi({ username: value, checkType: 'CREATE' })
        if (res.isDuplicate) callback(new Error('用户名已存在'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  nickname: [{ min: 2, max: 50, message: '昵称长度2-50位', trigger: 'blur' }],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
    {
      validator: async (_rule: any, value: string, callback: any) => {
        if (!value) return callback()
        const res = await validateEndUserDuplicateApi({ phone: value, checkType: editDialogMode.value === 'create' ? 'CREATE' : 'ALL' })
        if (res.isDuplicate && res.existingUser?.id !== editForm.id) callback(new Error('手机号已被使用'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }],
  userType: [{ required: true, message: '请选择账号类型', trigger: 'change' }],
  realName: [
    {
      validator: (_rule: any, _value: string, callback: any) => {
        if ((editForm.realName && !editForm.idCardNo) || (!editForm.realName && editForm.idCardNo)) {
          callback(new Error('真实姓名和身份证号需同时填写'))
        } else callback()
      },
      trigger: 'blur',
    },
  ],
}))

const openEditDialog = async (mode: 'create' | 'edit' | 'view', row?: EndUserItem) => {
  editDialogMode.value = mode
  focusedField.value = null
  duplicateCheckResult.value = null

  if (row) {
    const detail = await getEndUserDetailApi(row.id)
    Object.assign(editForm, detail)
  } else {
    Object.assign(editForm, defaultEditForm())
  }
  editDialogVisible.value = true
}

const triggerShake = () => {
  editFormShake.value = true
  setTimeout(() => { editFormShake.value = false }, 500)
}

const handleEditSubmit = async () => {
  if (!isEditAllowed.value) {
    ElMessage.warning('封禁状态账号禁止修改基础信息')
    return
  }
  try {
    await editFormRef.value?.validate()
  } catch {
    triggerShake()
    return
  }
  loading.value = true
  try {
    if (editDialogMode.value === 'create') {
      await createEndUserApi(editForm)
      ElMessage.success('用户创建成功')
    } else {
      await updateEndUserApi(editForm.id!, editForm)
      ElMessage.success('用户信息更新成功')
    }
    editDialogVisible.value = false
    loadData()
    fetchStats()
  } finally {
    loading.value = false
  }
}

const handleFieldFocus = (field: string) => {
  focusedField.value = field
}

const handleFieldBlur = (field: string) => {
  focusedField.value = null
}

// ============ 功能点2：账号状态切换 ============
const statusDialogVisible = ref(false)
const statusDialogSubmitting = ref(false)
const statusValidation = ref<StatusChangeValidation | null>(null)
const targetStatusRow = ref<EndUserItem | null>(null)

const statusForm = reactive<ChangeStatusParams>({
  toStatus: 1,
  reason: '',
  remark: '',
  durationDays: 7,
  flowLimitLevel: 1,
})

const affectedPermissions = computed(() => {
  const perms: Record<string, boolean> = {
    canWatch: true, canComment: true, canPublish: true, canDistribute: true,
  }
  switch (statusForm.toStatus) {
    case 2: perms.canDistribute = false; break
    case 3: perms.canComment = false; break
    case 4:
    case 5:
      perms.canWatch = perms.canComment = perms.canPublish = perms.canDistribute = false
      break
  }
  return perms
})

const showDurationDays = computed(() => statusForm.toStatus === 4)
const showMuteDays = computed(() => statusForm.toStatus === 3)
const showFlowLimitLevel = computed(() => statusForm.toStatus === 2 || statusForm.toStatus === 4 || statusForm.toStatus === 5)

const openStatusDialog = async (row: EndUserItem) => {
  targetStatusRow.value = row
  statusForm.toStatus = 1
  statusForm.reason = ''
  statusForm.remark = ''
  statusForm.durationDays = 7
  statusForm.flowLimitLevel = 1
  statusValidation.value = null
  statusDialogVisible.value = true
}

watch(() => statusForm.toStatus, async (newVal) => {
  if (!targetStatusRow.value) return
  try {
    statusValidation.value = await validateStatusChangeApi(targetStatusRow.value.id, newVal)
  } catch {
    statusValidation.value = null
  }
})

const handleStatusSubmit = async () => {
  if (!targetStatusRow.value) return
  if (!statusForm.reason.trim()) {
    ElMessage.warning('请填写变更原因')
    return
  }
  if (statusValidation.value && !statusValidation.value.canChange) {
    ElMessage.error(statusValidation.value.reasons[0] || '状态变更不合法')
    return
  }
  statusDialogSubmitting.value = true
  try {
    await changeEndUserStatusApi(targetStatusRow.value.id, { ...statusForm, operationType: 'MANUAL' })
    ElMessage.success('状态变更成功')
    statusDialogVisible.value = false
    loadData()
    fetchStats()
    highlightIds.value = [targetStatusRow.value.id]
    setTimeout(() => { highlightIds.value = [] }, 3000)
  } finally {
    statusDialogSubmitting.value = false
  }
}

// ============ 功能点3：批量管控 ============
const batchDialogVisible = ref(false)
const batchDialogSubmitting = ref(false)
const batchResult = ref<BatchEndUserResult | null>(null)
const batchForm = reactive({
  action: '',
  reason: '',
  remark: '',
  flowLimitLevel: 2,
  durationDays: 7,
})

const showBatchFlowLevel = computed(() =>
  ['FLOW_LIMIT_LOW_QUALITY', 'BATCH_FLOW_LIMIT'].includes(batchForm.action)
)
const showBatchDuration = computed(() => batchForm.action === 'BATCH_TEMP_BAN')

const getBatchActionLabel = (val: string) => {
  const item = getEnumItem(BATCH_END_USER_ACTION as any, val)
  return item?.label || val
}

const openBatchDialog = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的用户')
    return
  }
  batchForm.action = ''
  batchForm.reason = ''
  batchForm.remark = ''
  batchForm.flowLimitLevel = 2
  batchForm.durationDays = 7
  batchResult.value = null
  batchDialogVisible.value = true
}

const handleBatchSubmit = async () => {
  if (!batchForm.action) {
    ElMessage.warning('请选择批量操作类型')
    return
  }
  if (batchForm.action !== 'ACTIVATE_DORMANT' && !batchForm.reason.trim()) {
    ElMessage.warning('请填写操作原因')
    return
  }
  batchDialogSubmitting.value = true
  try {
    const result = await batchEndUserOperationApi({
      ids: selectedRows.value.map(r => r.id),
      action: batchForm.action,
      reason: batchForm.reason,
      remark: batchForm.remark,
      flowLimitLevel: batchForm.flowLimitLevel,
      durationDays: batchForm.durationDays,
    })
    batchResult.value = result
    ElMessage.success(`批量操作完成：成功${result.successCount}，跳过${result.skippedCount}，失败${result.failedCount}`)
    loadData()
    fetchStats()
    highlightIds.value = result.successIds
    setTimeout(() => { highlightIds.value = [] }, 5000)
  } finally {
    batchDialogSubmitting.value = false
  }
}

// ============ 功能点4：全生命周期溯源 ============
const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceTargetType = ref<'uid' | 'batch' | 'userId'>('uid')
const traceInput = ref('')
const traceDetail = ref<EndUserItem | null>(null)
const traceLogs = ref<AccountStatusLogItem[]>([])
const traceLogsTotal = ref(0)
const traceLogsPage = ref(1)
const duplicateCheckResultGlobal = ref<any>(null)

const openTraceDialog = () => {
  traceTargetType.value = 'uid'
  traceInput.value = ''
  traceDetail.value = null
  traceLogs.value = []
  traceLogsTotal.value = 0
  duplicateCheckResultGlobal.value = null
  traceDialogVisible.value = true
}

const handleTraceSearch = async () => {
  if (!traceInput.value.trim()) {
    ElMessage.warning('请输入查询条件')
    return
  }
  traceLoading.value = true
  traceDetail.value = null
  traceLogs.value = []
  try {
    if (traceTargetType.value === 'uid') {
      const duplicate = await validateEndUserDuplicateApi({ uid: traceInput.value.trim(), checkType: 'ALL' })
      if (!duplicate.isDuplicate) {
        ElMessage.warning('未找到该UID对应的用户')
        duplicateCheckResultGlobal.value = duplicate
        return
      }
      duplicateCheckResultGlobal.value = duplicate
      const detail = await getEndUserByUidApi(traceInput.value.trim())
      traceDetail.value = detail
      traceLogsPage.value = 1
      loadTraceLogs()
    } else if (traceTargetType.value === 'batch') {
      traceLogsPage.value = 1
      await loadTraceLogs()
    } else {
      const id = parseInt(traceInput.value.trim())
      if (isNaN(id)) {
        ElMessage.warning('请输入有效的用户ID')
        return
      }
      const duplicate = await validateEndUserDuplicateApi({ uid: '', checkType: 'ALL' })
      duplicateCheckResultGlobal.value = duplicate
      const detail = await getEndUserDetailApi(id)
      traceDetail.value = detail
      traceLogsPage.value = 1
      loadTraceLogs()
    }
  } finally {
    traceLoading.value = false
  }
}

const loadTraceLogs = async () => {
  traceLoading.value = true
  try {
    const params: any = { page: traceLogsPage.value, pageSize: 10, sortBy: 'createdAt', sortOrder: 'DESC' }
    if (traceTargetType.value === 'uid' && traceDetail.value) {
      params.uid = traceDetail.value.uid
    } else if (traceTargetType.value === 'batch') {
      params.operationBatch = traceInput.value.trim()
    } else if (traceDetail.value) {
      params.userId = traceDetail.value.id
    }
    const result = await getAccountStatusLogsApi(params)
    traceLogs.value = result.list
    traceLogsTotal.value = result.pagination.total
  } finally {
    traceLoading.value = false
  }
}

const handleTracePageChange = (page: number) => {
  traceLogsPage.value = page
  loadTraceLogs()
}

// ============ 快捷操作 ============
const handleCopyUid = async (uid: string) => {
  await copyToClipboard(uid)
  ElMessage.success('UID已复制')
}

const handleQuickFilter = (item: any) => {
  if (item.apply) item.apply()
}

// ============ init ============
onMounted(() => {
  fetchStats()
  loadData()
})
</script>

<template>
  <div class="user-account-page">
    <el-row :gutter="12" class="stats-row">
      <el-col
        v-for="(item, idx) in quickFilters"
        :key="idx"
        :xs="12" :sm="8" :md="6" :lg="4"
      >
        <div
          class="stat-card card-content"
          :class="{ clickable: item.apply }"
          :style="{ borderLeftColor: item.color }"
          @click="item.apply && handleQuickFilter(item)"
        >
          <div class="stat-label" :style="{ color: item.color }">{{ item.label }}</div>
          <div class="stat-value">{{ item.value }}</div>
        </div>
      </el-col>
    </el-row>

    <div class="filter-bar card-content">
      <el-form :inline="true" :model="queryParams" @submit.prevent class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="UID/用户名/昵称/手机号/邮箱/姓名"
            clearable style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="账号类型">
          <el-select v-model="queryParams.userType" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="opt in userTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select v-model="queryParams.accountStatus" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in accountStatusOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="创作者等级">
          <el-select v-model="queryParams.creatorLevel" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in creatorLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="queryParams.memberLevel" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="opt in memberLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="活跃度">
          <el-select v-model="queryParams.activityLevel" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="opt in activityLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="实名">
          <el-select v-model="queryParams.isVerified" placeholder="全部" clearable style="width: 100px">
            <el-option label="已认证" :value="1" />
            <el-option label="未认证" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规次数">
          <el-input-number v-model="queryParams.minViolationCount" :min="0" placeholder="最小" controls-position="right" style="width: 110px" />
          <span style="margin: 0 4px">-</span>
          <el-input-number v-model="queryParams.maxViolationCount" :min="0" placeholder="最大" controls-position="right" style="width: 110px" />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="queryParams.registerStartDate" type="date" value-format="YYYY-MM-DD"
            placeholder="开始" style="width: 130px"
          />
          <span style="margin: 0 4px">至</span>
          <el-date-picker
            v-model="queryParams.registerEndDate" type="date" value-format="YYYY-MM-DD"
            placeholder="结束" style="width: 130px"
          />
        </el-form-item>
        <el-form-item label="操作批次">
          <el-input
            v-model="queryParams.operationBatch"
            placeholder="批次号溯源" clearable style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          <el-button :icon="Search" @click="openTraceDialog" plain>全量溯源</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-batch-actions="true"
        :selected-count="selectedRows.length"
        create-text="新建账号"
        @create="openEditDialog('create')"
        @refresh="loadData"
      >
        <template #batch-actions>
          <el-button :icon="Operation" :loading="loading" @click="openBatchDialog">批量管控</el-button>
        </template>
        <template #right>
          <el-tag type="info" effect="plain">
            共 <b style="color: #409EFF">{{ formatNumber(total) }}</b> 条
          </el-tag>
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
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        :row-class-name="({ row }: any) => highlightIds.includes(row.id) ? 'row-highlight' : ''"
      >
        <template #uid="{ row }">
          <div class="uid-cell">
            <span class="uid-text" :title="'点击复制: ' + row.uid" @click="handleCopyUid(row.uid)">
              {{ row.uid }}
            </span>
            <el-icon class="copy-icon" @click.stop="handleCopyUid(row.uid)"><CopyDocument /></el-icon>
          </div>
        </template>

        <template #avatar="{ row }">
          <el-avatar :size="36" :src="row.avatar">
            {{ row.nickname?.[0] || row.username?.[0] }}
          </el-avatar>
        </template>

        <template #nickname="{ row }">
          <div class="nickname-cell">
            <div class="nickname-name" :title="row.nickname || row.username">
              {{ row.nickname || row.username }}
            </div>
            <div class="nickname-sub" style="color: #909399; font-size: 12px">
              @{{ row.username }}
            </div>
            <div v-if="row.operationBatch" class="batch-tag" :title="'所属批次: ' + row.operationBatch">
              <el-tag size="small" effect="plain" type="primary">
                {{ row.operationBatch.slice(-8) }}
              </el-tag>
            </div>
          </div>
        </template>

        <template #userType="{ row }">
          <div class="type-tags">
            <el-tag
              size="small"
              :type="(getEnumItem(END_USER_TYPE, row.userType) as any)?.type || 'info'"
            >
              {{ getEnumLabel(END_USER_TYPE, row.userType) }}
            </el-tag>
            <el-tag
              v-if="row.userType === 2"
              size="small"
              effect="plain"
              :style="{ borderColor: (getEnumItem(CREATOR_LEVEL, row.creatorLevel) as any)?.color, color: (getEnumItem(CREATOR_LEVEL, row.creatorLevel) as any)?.color, marginTop: '2px' }"
            >
              {{ getEnumLabel(CREATOR_LEVEL, row.creatorLevel) }}
            </el-tag>
            <el-tag
              v-if="row.userType === 3"
              size="small"
              effect="plain"
              :style="{ borderColor: (getEnumItem(MEMBER_LEVEL, row.memberLevel) as any)?.color, color: (getEnumItem(MEMBER_LEVEL, row.memberLevel) as any)?.color, marginTop: '2px' }"
            >
              {{ getEnumLabel(MEMBER_LEVEL, row.memberLevel) }}
            </el-tag>
          </div>
        </template>

        <template #verified="{ row }">
          <el-tooltip v-if="row.isVerified" content="已完成实名认证">
            <el-icon :size="20" color="#67C23A"><CircleCheckFilled /></el-icon>
          </el-tooltip>
          <el-tooltip v-else content="未完成实名认证，特殊管控">
            <el-tag size="small" type="warning" effect="dark">未实名</el-tag>
          </el-tooltip>
        </template>

        <template #status="{ row }">
          <div>
            <el-tag
              size="small"
              :type="(getEnumItem(END_USER_ACCOUNT_STATUS, row.accountStatus) as any)?.type || 'info'"
              effect="dark"
            >
              {{ getEnumLabel(END_USER_ACCOUNT_STATUS, row.accountStatus) }}
            </el-tag>
            <div
              v-if="row.accountStatus === 2 && row.flowLimitLevel > 0"
              style="font-size: 11px; color: #909399; margin-top: 2px"
            >
              {{ getEnumLabel(END_USER_FLOW_LIMIT_LEVEL, row.flowLimitLevel) }}
            </div>
            <div
              v-if="(row.accountStatus === 4 || row.accountStatus === 3) && row.banEndTime"
              style="font-size: 11px; color: #909399; margin-top: 2px"
              :title="'至 ' + formatDate(row.banEndTime)"
            >
              至{{ formatDate(row.banEndTime, 'MM-DD') }}
            </div>
          </div>
        </template>

        <template #violation="{ row }">
          <el-tooltip :content="'违规次数: ' + row.violationCount + ' 次'">
            <span
              :class="['violation-count', row.violationCount >= 5 ? 'high' : row.violationCount >= 3 ? 'medium' : 'low']"
            >
              {{ formatNumber(row.violationCount) }}
            </span>
          </el-tooltip>
          <div v-if="row.riskTags && row.riskTags.length > 0" style="margin-top: 2px">
            <el-tag
              v-for="tag in row.riskTags.slice(0, 2)"
              :key="tag"
              size="small"
              type="danger"
              effect="plain"
              style="margin-right: 2px"
            >
              {{ tag }}
            </el-tag>
            <el-tag v-if="row.riskTags.length > 2" size="small" effect="plain">+{{ row.riskTags.length - 2 }}</el-tag>
          </div>
        </template>

        <template #activity="{ row }">
          <el-tag
            size="small"
            :type="(getEnumItem(END_USER_ACTIVITY_LEVEL, row.activityLevel) as any)?.type || 'info'"
            effect="plain"
          >
            {{ getEnumLabel(END_USER_ACTIVITY_LEVEL, row.activityLevel) }}
          </el-tag>
          <div style="font-size: 11px; color: #909399; margin-top: 2px">
            积分{{ formatNumber(row.activityScore) }}
          </div>
        </template>

        <template #stats="{ row }">
          <div class="stats-grid">
            <div class="stats-item">
              <span class="stats-label">观看</span>
              <el-tooltip :content="'观看: ' + formatNumber(row.watchCount) + ' 次'">
                <span class="stats-value">{{ formatNumber(row.watchCount) }}</span>
              </el-tooltip>
            </div>
            <div class="stats-item">
              <span class="stats-label">投稿</span>
              <el-tooltip :content="'投稿: ' + formatNumber(row.publishCount) + ' 次'">
                <span class="stats-value">{{ formatNumber(row.publishCount) }}</span>
              </el-tooltip>
            </div>
            <div class="stats-item">
              <span class="stats-label">评论</span>
              <el-tooltip :content="'评论: ' + formatNumber(row.commentCount) + ' 次'">
                <span class="stats-value">{{ formatNumber(row.commentCount) }}</span>
              </el-tooltip>
            </div>
            <div class="stats-item">
              <span class="stats-label">粉丝</span>
              <el-tooltip :content="'粉丝: ' + formatNumber(row.followerCount) + ' 人'">
                <span class="stats-value">{{ formatNumber(row.followerCount) }}</span>
              </el-tooltip>
            </div>
          </div>
        </template>

        <template #contact="{ row }">
          <div style="font-size: 12px; line-height: 1.6">
            <div v-if="row.phone">📱 {{ row.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') }}</div>
            <div v-if="row.email" style="color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px" :title="row.email">✉️ {{ row.email }}</div>
          </div>
        </template>

        <template #lastLogin="{ row }">
          <div style="font-size: 12px; line-height: 1.5">
            <div>{{ row.lastLoginAt ? formatDate(row.lastLoginAt, 'YYYY-MM-DD HH:mm') : '从未登录' }}</div>
            <div v-if="row.lastLoginIp" style="color: #909399">IP: {{ row.lastLoginIp }}</div>
          </div>
        </template>

        <template #registerTime="{ row }">
          <div style="font-size: 12px; line-height: 1.5">
            <div>{{ formatDate(row.createdAt, 'YYYY-MM-DD HH:mm') }}</div>
            <div v-if="row.registerSource" style="color: #909399">来源: {{ row.registerSource }}</div>
          </div>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="Edit" @click="openEditDialog('edit', row)">编辑</el-button>
          <el-button type="warning" link :icon="Warning" @click="openStatusDialog(row)">状态</el-button>
          <el-dropdown trigger="click" @command="(cmd: string) => {
            if (cmd === 'view') openEditDialog('view', row)
            else if (cmd === 'trace') { traceTargetType.value = 'uid'; traceInput.value = row.uid; traceDialogVisible.value = true; setTimeout(handleTraceSearch, 50) }
          }">
            <el-button type="primary" link>
              更多
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="view">查看详情</el-dropdown-item>
                <el-dropdown-item command="trace">全生命周期溯源</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </QyDataTable>
    </div>

    <!-- 功能点1：账号信息编辑弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="editDialogMode === 'create' ? '新建用户账号' : editDialogMode === 'edit' ? '编辑用户账号信息' : '查看用户详情'"
      width="760px"
      :close-on-click-modal="false"
      class="edit-dialog"
      :class="{ 'dialog-shake': editFormShake }"
      append-to-body
    >
      <el-alert
        v-if="isBannedStatus && editDialogMode !== 'create'"
        title="封禁状态警告"
        type="error"
        :description="isSuperAdmin ? '当前账号处于封禁状态，超级管理员可调整状态后修改基础信息' : '当前账号处于封禁状态，禁止修改基础信息，仅可查看及调整状态'"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />

      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
        :disabled="editDialogMode === 'view' || !isEditAllowed"
        class="edit-form"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="UID" v-if="editDialogMode !== 'create'">
              <div class="form-readonly">{{ editForm.uid || '-' }}</div>
            </el-form-item>
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="editForm.username"
                :disabled="!isFieldEditable('username')"
                placeholder="请输入登录用户名"
                :class="{ 'input-focused': focusedField === 'username' }"
                @focus="handleFieldFocus('username')"
                @blur="handleFieldBlur('username')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账号类型" prop="userType">
              <el-select
                v-model="editForm.userType"
                :disabled="!isFieldEditable('userType')"
                placeholder="请选择账号类型"
                style="width: 100%"
                :class="{ 'input-focused': focusedField === 'userType' }"
                @focus="handleFieldFocus('userType')"
                @blur="handleFieldBlur('userType')"
              >
                <el-option v-for="opt in userTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="昵称" prop="nickname">
              <el-input
                v-model="editForm.nickname"
                :disabled="!isFieldEditable('nickname')"
                placeholder="请输入昵称"
                :class="{ 'input-focused': focusedField === 'nickname' }"
                @focus="handleFieldFocus('nickname')"
                @blur="handleFieldBlur('nickname')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group
                v-model="editForm.gender"
                :disabled="!isFieldEditable('gender')"
                :class="{ 'input-focused': focusedField === 'gender' }"
                @focus="handleFieldFocus('gender')"
                @blur="handleFieldBlur('gender')"
              >
                <el-radio v-for="opt in genderOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="editForm.phone"
                :disabled="!isFieldEditable('phone')"
                placeholder="请输入手机号"
                :class="{ 'input-focused': focusedField === 'phone' }"
                @focus="handleFieldFocus('phone')"
                @blur="handleFieldBlur('phone')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="editForm.email"
                :disabled="!isFieldEditable('email')"
                placeholder="请输入邮箱"
                :class="{ 'input-focused': focusedField === 'email' }"
                @focus="handleFieldFocus('email')"
                @blur="handleFieldBlur('email')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生日">
              <el-date-picker
                v-model="editForm.birthday"
                type="date"
                value-format="YYYY-MM-DD"
                :disabled="!isFieldEditable('birthday')"
                placeholder="请选择生日"
                style="width: 100%"
                :class="{ 'input-focused': focusedField === 'birthday' }"
                @focus="handleFieldFocus('birthday')"
                @blur="handleFieldBlur('birthday')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="地区">
              <el-input
                v-model="editForm.region"
                :disabled="!isFieldEditable('region')"
                placeholder="请输入所在地区"
                :class="{ 'input-focused': focusedField === 'region' }"
                @focus="handleFieldFocus('region')"
                @blur="handleFieldBlur('region')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="个性签名">
              <el-input
                v-model="editForm.signature"
                :disabled="!isFieldEditable('signature')"
                type="textarea"
                :rows="2"
                placeholder="请输入个性签名"
                maxlength="200"
                show-word-limit
                :class="{ 'input-focused': focusedField === 'signature' }"
                @focus="handleFieldFocus('signature')"
                @blur="handleFieldBlur('signature')"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">实名信息
          <el-tag v-if="editForm.isVerified" type="success" size="small" style="margin-left: 8px">已认证</el-tag>
          <el-tag v-else type="warning" size="small" style="margin-left: 8px">未认证</el-tag>
        </el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="真实姓名" prop="realName">
              <el-input
                v-model="editForm.realName"
                :disabled="!isFieldEditable('realName')"
                placeholder="请输入真实姓名"
                :class="{ 'input-focused': focusedField === 'realName' }"
                @focus="handleFieldFocus('realName')"
                @blur="handleFieldBlur('realName')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCardNo">
              <el-input
                v-model="editForm.idCardNo"
                :disabled="!isFieldEditable('idCardNo')"
                placeholder="请输入身份证号"
                :class="{ 'input-focused': focusedField === 'idCardNo' }"
                @focus="handleFieldFocus('idCardNo')"
                @blur="handleFieldBlur('idCardNo')"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider v-if="editForm.userType === 2" content-position="left">创作者信息（根据账号类型联动展示）</el-divider>
        <el-row v-if="editForm.userType === 2" :gutter="16">
          <el-col :span="12">
            <el-form-item label="创作者等级">
              <el-select
                v-model="editForm.creatorLevel"
                :disabled="!isFieldEditable('creatorLevel')"
                placeholder="请选择创作者等级"
                style="width: 100%"
                :class="{ 'input-focused': focusedField === 'creatorLevel' }"
                @focus="handleFieldFocus('creatorLevel')"
                @blur="handleFieldBlur('creatorLevel')"
              >
                <el-option v-for="opt in creatorLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider v-if="editForm.userType === 3" content-position="left">会员信息（根据账号类型联动展示）</el-divider>
        <el-row v-if="editForm.userType === 3" :gutter="16">
          <el-col :span="12">
            <el-form-item label="会员等级">
              <el-select
                v-model="editForm.memberLevel"
                :disabled="!isFieldEditable('memberLevel')"
                placeholder="请选择会员等级"
                style="width: 100%"
                :class="{ 'input-focused': focusedField === 'memberLevel' }"
                @focus="handleFieldFocus('memberLevel')"
                @blur="handleFieldBlur('memberLevel')"
              >
                <el-option v-for="opt in memberLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">运营标签与备注</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="用户标签">
              <el-select
                v-model="editForm.userTags"
                multiple
                filterable
                allow-create
                default-first-option
                :disabled="!isFieldEditable('userTags')"
                placeholder="输入标签后回车添加"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="风险标签">
              <el-select
                v-model="editForm.riskTags"
                multiple
                filterable
                allow-create
                default-first-option
                :disabled="!isFieldEditable('riskTags')"
                placeholder="输入风险标签后回车添加"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="运营备注">
              <el-input
                v-model="editForm.remark"
                :disabled="!isFieldEditable('remark')"
                type="textarea"
                :rows="3"
                placeholder="请输入运营备注"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">
          {{ editDialogMode === 'view' ? '关闭' : '取消' }}
        </el-button>
        <el-button
          v-if="editDialogMode !== 'view'"
          type="primary"
          :loading="loading"
          :disabled="!isEditAllowed"
          @click="handleEditSubmit"
        >
          {{ editDialogMode === 'create' ? '创建' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 功能点2：账号状态变更弹窗 -->
    <el-dialog
      v-model="statusDialogVisible"
      title="账号状态变更"
      width="560px"
      :close-on-click-modal="false"
      class="status-dialog scale-dialog"
      append-to-body
    >
      <div v-if="targetStatusRow" class="status-user-info">
        <el-avatar :size="44" :src="targetStatusRow.avatar" style="margin-right: 12px">
          {{ targetStatusRow.nickname?.[0] }}
        </el-avatar>
        <div style="flex: 1">
          <div style="font-weight: 600">{{ targetStatusRow.nickname || targetStatusRow.username }}</div>
          <div style="font-size: 12px; color: #909399">
            UID: {{ targetStatusRow.uid }} · 当前状态:
            <el-tag size="small" :type="(getEnumItem(END_USER_ACCOUNT_STATUS, targetStatusRow.accountStatus) as any)?.type">
              {{ getEnumLabel(END_USER_ACCOUNT_STATUS, targetStatusRow.accountStatus) }}
            </el-tag>
          </div>
        </div>
      </div>

      <el-form label-width="110px" style="margin-top: 16px">
        <el-form-item label="目标状态" required>
          <el-radio-group v-model="statusForm.toStatus">
            <el-radio
              v-for="opt in accountStatusOptions.filter(o => isSuperAdmin || o.value !== 5 || targetStatusRow?.accountStatus === 5)"
              :key="opt.value"
              :value="opt.value"
              :disabled="opt.value === 5 && !isSuperAdmin"
            >
              <span :style="{ color: (opt as any).color, fontWeight: 600 }">{{ opt.label }}</span>
              <el-tooltip v-if="opt.value === 5 && !isSuperAdmin" content="仅超级管理员可操作">
                <el-icon><Lock /></el-icon>
              </el-tooltip>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="权限影响">
          <div class="perm-preview">
            <span
              v-for="(allowed, key) in affectedPermissions"
              :key="key"
              :class="['perm-item', allowed ? 'allow' : 'deny']"
            >
              <el-icon>{{ allowed ? <Check /> : <Close /> }}</el-icon>
              {{ PERMISSION_LABEL[key] || key }}
            </span>
          </div>
        </el-form-item>

        <el-form-item v-if="showFlowLimitLevel" label="限流等级">
          <el-select v-model="statusForm.flowLimitLevel" style="width: 100%">
            <el-option
              v-for="opt in getEnumOptions(END_USER_FLOW_LIMIT_LEVEL)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="showDurationDays" label="封禁天数">
          <el-input-number v-model="statusForm.durationDays" :min="1" :max="365" style="width: 100%" />
          <div style="font-size: 12px; color: #909399; margin-top: 4px">
            到期自动解封（建议根据违规严重程度选择）
          </div>
        </el-form-item>

        <el-form-item v-if="showMuteDays" label="禁言天数">
          <el-input-number v-model="statusForm.durationDays" :min="1" :max="365" style="width: 100%" />
        </el-form-item>

        <el-form-item label="变更原因" required>
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请详细填写变更原因（必填，全程留痕）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="statusForm.remark"
            type="textarea"
            :rows="2"
            placeholder="补充说明（选填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <div v-if="statusValidation && (statusValidation.warnings.length || statusValidation.info.length)" style="margin-bottom: 16px">
        <el-alert
          v-for="(w, i) in statusValidation.warnings"
          :key="'w' + i"
          :title="w"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 8px"
        />
        <el-alert
          v-for="(info, i) in statusValidation.info"
          :key="'i' + i"
          :title="info"
          type="info"
          :closable="false"
          show-icon
        />
      </div>

      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="statusDialogSubmitting"
          :disabled="!statusForm.reason.trim() || (statusValidation && !statusValidation.canChange)"
          @click="handleStatusSubmit"
        >
          {{ statusDialogSubmitting ? '提交中...' : '确认变更' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 功能点3：批量管控弹窗 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量账号管控"
      width="620px"
      :close-on-click-modal="false"
      class="batch-dialog scale-dialog"
      append-to-body
    >
      <el-alert
        :title="`已选择 ${selectedRows.length} 个用户，将根据用户类型/等级/状态差异化执行操作`"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />

      <el-form label-width="120px">
        <el-form-item label="操作类型" required>
          <el-radio-group v-model="batchForm.action">
            <div style="display: flex; flex-direction: column; gap: 10px">
              <el-radio
                v-for="opt in batchActionOptions"
                :key="opt.value"
                :value="opt.value"
                :border="true"
                style="margin-right: 0"
                class="batch-action-radio"
              >
                <div class="radio-content">
                  <div style="font-weight: 600; color: (opt as any).color">
                    <el-icon :size="16" style="vertical-align: -2px"><component :is="(opt as any).icon" /></el-icon>
                    {{ opt.label }}
                  </div>
                  <div style="font-size: 12px; color: #909399; font-weight: 400; margin-top: 2px">{{ (opt as any).desc }}</div>
                </div>
              </el-radio>
            </div>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="showBatchFlowLevel" label="限流等级">
          <el-select v-model="batchForm.flowLimitLevel" style="width: 100%">
            <el-option
              v-for="opt in getEnumOptions(END_USER_FLOW_LIMIT_LEVEL).filter((o: any) => o.value !== 0)"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item v-if="showBatchDuration" label="封禁天数">
          <el-input-number v-model="batchForm.durationDays" :min="1" :max="365" style="width: 100%" />
        </el-form-item>

        <el-form-item v-if="batchForm.action && batchForm.action !== 'ACTIVATE_DORMANT'" label="操作原因" required>
          <el-input
            v-model="batchForm.reason"
            type="textarea"
            :rows="2"
            placeholder="请填写操作原因（必填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="batchForm.remark"
            type="textarea"
            :rows="2"
            placeholder="补充说明（选填）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <el-divider v-if="batchResult" />
      <div v-if="batchResult" class="batch-result">
        <h4 style="margin: 0 0 12px">
          <el-icon><CircleCheck /></el-icon>
          批次号: {{ batchResult.batchNo }}
          <el-button size="small" link type="primary" @click="() => { traceInput.value = batchResult.batchNo; traceTargetType.value = 'batch'; batchDialogVisible = false; traceDialogVisible = true; setTimeout(handleTraceSearch, 50) }">
            溯源该批次
          </el-button>
        </h4>
        <el-row :gutter="12">
          <el-col :span="8"><div class="result-card success">成功 <b>{{ batchResult.successCount }}</b></div></el-col>
          <el-col :span="8"><div class="result-card skipped">跳过 <b>{{ batchResult.skippedCount }}</b></div></el-col>
          <el-col :span="8"><div class="result-card failed">失败 <b>{{ batchResult.failedCount }}</b></div></el-col>
        </el-row>
        <el-collapse v-if="batchResult.skippedItems.length > 0" style="margin-top: 12px">
          <el-collapse-item title="跳过明细" name="skipped">
            <el-table :data="batchResult.skippedItems.slice(0, 20)" size="small" border stripe>
              <el-table-column prop="uid" label="UID" width="150" />
              <el-table-column prop="reason" label="跳过原因" />
            </el-table>
            <div v-if="batchResult.skippedItems.length > 20" style="font-size: 12px; color: #909399; margin-top: 8px; text-align: center">
              仅展示前20条，共 {{ batchResult.skippedItems.length }} 条
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-collapse v-if="batchResult.failedItems.length > 0" style="margin-top: 8px">
          <el-collapse-item title="失败明细" name="failed">
            <el-table :data="batchResult.failedItems" size="small" border stripe>
              <el-table-column prop="id" label="用户ID" width="100" />
              <el-table-column prop="reason" label="失败原因" />
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false">{{ batchResult ? '关闭' : '取消' }}</el-button>
        <el-button
          v-if="!batchResult"
          type="primary"
          :loading="batchDialogSubmitting"
          :disabled="!batchForm.action"
          @click="handleBatchSubmit"
        >
          {{ batchDialogSubmitting ? '执行中...' : '执行批量操作' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 功能点4：全生命周期溯源弹窗 -->
    <el-dialog
      v-model="traceDialogVisible"
      title="用户全生命周期溯源"
      width="960px"
      :close-on-click-modal="false"
      class="trace-dialog scale-dialog"
      append-to-body
    >
      <div class="trace-search-bar">
        <el-radio-group v-model="traceTargetType" style="margin-right: 16px">
          <el-radio value="uid">按UID溯源</el-radio>
          <el-radio value="batch">按批次溯源</el-radio>
          <el-radio value="userId">按用户ID溯源</el-radio>
        </el-radio-group>
        <el-input
          v-model="traceInput"
          :placeholder="traceTargetType === 'uid' ? '请输入用户UID' : traceTargetType === 'batch' ? '请输入操作批次号' : '请输入用户ID'"
          style="width: 320px; margin-right: 12px"
          clearable
          @keyup.enter="handleTraceSearch"
        />
        <el-button type="primary" :icon="Search" :loading="traceLoading" @click="handleTraceSearch">查询溯源</el-button>
        <el-button :icon="RefreshLeft" @click="() => { traceDetail.value = null; traceLogs.value = []; duplicateCheckResultGlobal.value = null }">清空结果</el-button>
      </div>

      <el-alert
        v-if="duplicateCheckResultGlobal && duplicateCheckResultGlobal.isDuplicate === false"
        title="未找到匹配记录"
        type="warning"
        :closable="false"
        show-icon
        style="margin: 16px 0"
      />

      <div v-if="traceDetail" class="trace-detail card-content" style="margin: 16px 0; background: #fafbfc">
        <el-row :gutter="20">
          <el-col :span="4" style="text-align: center">
            <el-avatar :size="72" :src="traceDetail.avatar">{{ traceDetail.nickname?.[0] }}</el-avatar>
            <div style="margin-top: 8px; font-weight: 600">{{ traceDetail.nickname || traceDetail.username }}</div>
            <el-tag size="small" type="info" style="margin-top: 4px">UID: {{ traceDetail.uid }}</el-tag>
          </el-col>
          <el-col :span="20">
            <el-descriptions :column="3" size="small" border>
              <el-descriptions-item label="账号类型">
                <el-tag size="small" :type="(getEnumItem(END_USER_TYPE, traceDetail.userType) as any)?.type">
                  {{ getEnumLabel(END_USER_TYPE, traceDetail.userType) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="账号状态">
                <el-tag size="small" :type="(getEnumItem(END_USER_ACCOUNT_STATUS, traceDetail.accountStatus) as any)?.type" effect="dark">
                  {{ getEnumLabel(END_USER_ACCOUNT_STATUS, traceDetail.accountStatus) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="实名状态">
                <el-tag v-if="traceDetail.isVerified" type="success" size="small">已认证</el-tag>
                <el-tag v-else type="warning" size="small">未认证</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="违规次数">
                <span :class="['violation-count', traceDetail.violationCount >= 5 ? 'high' : traceDetail.violationCount >= 3 ? 'medium' : 'low']">
                  {{ formatNumber(traceDetail.violationCount) }} 次
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="活跃度">
                {{ getEnumLabel(END_USER_ACTIVITY_LEVEL, traceDetail.activityLevel) }}
                <span style="color: #909399"> (积分{{ formatNumber(traceDetail.activityScore) }})</span>
              </el-descriptions-item>
              <el-descriptions-item label="创作者/会员等级">
                <span v-if="traceDetail.userType === 2">{{ getEnumLabel(CREATOR_LEVEL, traceDetail.creatorLevel) }}</span>
                <span v-else-if="traceDetail.userType === 3">{{ getEnumLabel(MEMBER_LEVEL, traceDetail.memberLevel) }}</span>
                <span v-else style="color: #909399">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="核心数据" :span="3">
                <div style="display: flex; gap: 20px; flex-wrap: wrap">
                  <span>📺 观看 <b style="color: #409EFF">{{ formatNumber(traceDetail.watchCount) }}</b></span>
                  <span>✍️ 投稿 <b style="color: #67C23A">{{ formatNumber(traceDetail.publishCount) }}</b></span>
                  <span>💬 评论 <b style="color: #E6A23C">{{ formatNumber(traceDetail.commentCount) }}</b></span>
                  <span>👥 粉丝 <b style="color: #F56C6C">{{ formatNumber(traceDetail.followerCount) }}</b></span>
                  <span>🔔 登录 <b>{{ formatNumber(traceDetail.loginCount) }}</b> 次</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="注册信息" :span="3">
                <div style="line-height: 1.8">
                  <div>⏰ 注册时间：{{ formatDate(traceDetail.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</div>
                  <div>📍 注册来源：{{ traceDetail.registerSource || '-' }} · IP: {{ traceDetail.registerIp || '-' }}</div>
                  <div>🪪 最近登录：{{ traceDetail.lastLoginAt ? formatDate(traceDetail.lastLoginAt, 'YYYY-MM-DD HH:mm:ss') : '从未登录' }}
                    <span v-if="traceDetail.lastLoginIp"> · IP: {{ traceDetail.lastLoginIp }}</span>
                  </div>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="联系信息">
                <div style="line-height: 1.8">
                  <div>📱 {{ traceDetail.phone ? traceDetail.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '-' }}</div>
                  <div>✉️ {{ traceDetail.email || '-' }}</div>
                </div>
              </el-descriptions-item>
              <el-descriptions-item label="用户标签">
                <el-tag v-for="tag in traceDetail.userTags" :key="tag" size="small" style="margin: 2px">{{ tag }}</el-tag>
                <span v-if="!traceDetail.userTags?.length" style="color: #909399">-</span>
              </el-descriptions-item>
              <el-descriptions-item label="风险标签">
                <el-tag v-for="tag in traceDetail.riskTags" :key="tag" size="small" type="danger" effect="plain" style="margin: 2px">{{ tag }}</el-tag>
                <span v-if="!traceDetail.riskTags?.length" style="color: #909399">无风险标签</span>
              </el-descriptions-item>
              <el-descriptions-item label="运营备注" :span="3">
                {{ traceDetail.remark || '无' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </div>

      <div v-if="traceLogs.length || traceLoading" class="trace-logs-section card-content" style="background: #fafbfc">
        <h4 style="margin: 0 0 12px; display: flex; justify-content: space-between; align-items: center">
          <span>📜 状态变更日志（{{ formatNumber(traceLogsTotal) }} 条）</span>
          <span style="font-size: 12px; color: #909399; font-weight: 400">按时间倒序展示</span>
        </h4>
        <el-table :data="traceLogs" size="small" border stripe v-loading="traceLoading" style="width: 100%">
          <el-table-column label="时间" width="170">
            <template #default="{ row }">
              <el-tooltip :content="formatDate(row.createdAt, 'YYYY-MM-DD HH:mm:ss')">
                {{ formatDate(row.createdAt, 'MM-DD HH:mm:ss') }}
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="操作类型" width="90" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="(getEnumItem(OPERATION_TYPE_USER, row.operationType) as any)?.type || 'info'">
                {{ getEnumLabel(OPERATION_TYPE_USER, row.operationType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="批次号" width="130">
            <template #default="{ row }">
              <span v-if="row.operationBatch" :title="row.operationBatch" style="color: #409EFF; cursor: pointer">
                {{ row.operationBatch.slice(-12) }}
              </span>
              <span v-else style="color: #909399">-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态变更" width="170">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap">
                <el-tag size="small" :type="(getEnumItem(END_USER_ACCOUNT_STATUS, row.fromStatus) as any)?.type" effect="plain">
                  {{ getEnumLabel(END_USER_ACCOUNT_STATUS, row.fromStatus) }}
                </el-tag>
                <el-icon color="#909399"><ArrowRight /></el-icon>
                <el-tag size="small" :type="(getEnumItem(END_USER_ACCOUNT_STATUS, row.toStatus) as any)?.type" effect="dark">
                  {{ getEnumLabel(END_USER_ACCOUNT_STATUS, row.toStatus) }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="变更原因" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <div>
                <div>{{ row.changeReason || '-' }}</div>
                <div v-if="row.changeRemark" style="color: #909399; font-size: 11px; margin-top: 2px">
                  备注: {{ row.changeRemark }}
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="权限影响" width="160">
            <template #default="{ row }">
              <div v-if="row.affectedPermissions" style="display: flex; gap: 4px; flex-wrap: wrap">
                <el-tooltip v-for="(allowed, key) in row.affectedPermissions" :key="key" :content="allowed ? '允许' : '禁止' + PERMISSION_LABEL[key]">
                  <el-tag
                    :type="allowed ? 'success' : 'danger'"
                    effect="plain"
                    size="small"
                    style="font-size: 11px; padding: 0 6px"
                  >
                    {{ (PERMISSION_LABEL[key] || key).replace(/(内容|评论|发布|观看)/, '') }}
                    {{ allowed ? '✓' : '✗' }}
                  </el-tag>
                </el-tooltip>
              </div>
              <span v-else style="color: #909399">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作人" width="120">
            <template #default="{ row }">
              <div v-if="row.operatorName">
                <div>{{ row.operatorName }}</div>
                <div v-if="row.ipAddress" style="color: #909399; font-size: 11px">IP: {{ row.ipAddress }}</div>
              </div>
              <span v-else style="color: #909399">系统</span>
            </template>
          </el-table-column>
          <el-table-column label="是否撤销" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isReverted" size="small" type="info">已撤销</el-tag>
              <span v-else style="color: #909399">-</span>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="traceLogsTotal > 10" style="margin-top: 12px; text-align: right">
          <el-pagination
            background
            layout="prev, pager, next"
            :current-page="traceLogsPage"
            :page-size="10"
            :total="traceLogsTotal"
            @current-change="handleTracePageChange"
          />
        </div>
      </div>

      <template #footer>
        <el-button @click="traceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-account-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stats-row {
  .stat-card {
    padding: 18px 20px;
    border-left: 4px solid #409EFF;
    border-radius: 6px;
    background: #fff;
    transition: all 0.3s ease;
    &.clickable {
      cursor: pointer;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
    }
    .stat-label {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #303133;
      font-family: 'DIN', 'Helvetica Neue', Arial;
    }
  }
}

.filter-bar {
  .filter-form {
    .el-form-item {
      margin-bottom: 12px;
    }
  }
}

.uid-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  .uid-text {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #409EFF;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
  .copy-icon {
    font-size: 14px;
    color: #909399;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }
  &:hover .copy-icon {
    opacity: 1;
  }
}

.nickname-cell {
  .nickname-name {
    font-weight: 600;
    color: #303133;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .batch-tag {
    margin-top: 4px;
  }
}

.type-tags {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.violation-count {
  font-weight: 700;
  font-size: 15px;
  font-family: 'DIN', Arial;
  &.low { color: #67C23A; }
  &.medium { color: #E6A23C; }
  &.high { color: #F56C6C; }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 12px;
  font-size: 12px;
  .stats-item {
    display: flex;
    justify-content: space-between;
    .stats-label {
      color: #909399;
    }
    .stats-value {
      font-weight: 600;
      font-family: 'DIN', Arial;
    }
  }
}

:deep(.row-highlight) {
  background-color: #ecf5ff !important;
  animation: rowPulse 1.5s ease-in-out 2;
}
@keyframes rowPulse {
  0%, 100% { background-color: #ecf5ff; }
  50% { background-color: #d9ecff; }
}

/* 功能点1：输入框聚焦变色 + 错误抖动 */
.input-focused {
  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-date-editor) {
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.25) !important;
    border-color: #409EFF !important;
    transition: all 0.25s ease;
  }
}
:deep(.dialog-shake) {
  animation: dialogShake 0.45s cubic-bezier(.36,.07,.19,.97) both;
}
@keyframes dialogShake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-8px); }
  40%, 60% { transform: translateX(8px); }
}

/* 功能点2/3/4：弹窗缩放淡入 */
:deep(.scale-dialog) {
  .el-dialog {
    transform-origin: center center;
    animation: dialogScaleIn 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
}
@keyframes dialogScaleIn {
  0% {
    transform: scale(0.92);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 功能点2：权限预览 */
.perm-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  .perm-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 14px;
    font-size: 12px;
    font-weight: 500;
    &.allow {
      background: #f0f9eb;
      color: #67C23A;
      border: 1px solid #e1f3d8;
    }
    &.deny {
      background: #fef0f0;
      color: #F56C6C;
      border: 1px solid #fde2e2;
      text-decoration: line-through;
      text-decoration-color: rgba(245, 108, 108, 0.5);
    }
  }
}

/* 功能点3：批量操作 */
.batch-action-radio {
  width: 100% !important;
  padding: 10px 14px;
  border-radius: 8px;
  transition: all 0.2s ease;
  &:hover {
    background: #f5f7fa;
  }
  :deep(.el-radio__label) {
    width: 100%;
  }
}
.radio-content {
  display: flex;
  flex-direction: column;
}
.batch-result {
  .result-card {
    padding: 14px;
    border-radius: 8px;
    text-align: center;
    font-size: 13px;
    &.success {
      background: #f0f9eb;
      color: #67C23A;
      border: 1px solid #e1f3d8;
    }
    &.skipped {
      background: #fdf6ec;
      color: #E6A23C;
      border: 1px solid #faecd8;
    }
    &.failed {
      background: #fef0f0;
      color: #F56C6C;
      border: 1px solid #fde2e2;
    }
    b {
      font-size: 22px;
      margin-left: 4px;
      font-family: 'DIN', Arial;
    }
  }
}

/* 功能点4：溯源面板 */
.trace-search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.trace-detail {
  .el-descriptions {
    --el-descriptions-table-border: #ebeef5;
  }
}
.form-readonly {
  line-height: 32px;
  padding: 0 12px;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #606266;
  font-weight: 500;
}
.status-user-info {
  display: flex;
  align-items: center;
  padding: 14px;
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
  border-radius: 10px;
  margin-bottom: 8px;
}
</style>
