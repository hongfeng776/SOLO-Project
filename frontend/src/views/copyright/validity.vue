<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  nextTick,
  watch,
} from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
  VALIDITY_STATUS,
  EXPIRE_HANDLER_RULE,
  RELATED_CONTENT_SCOPE,
  WARNING_THRESHOLD_UNIT,
  COPYRIGHT_TYPE,
  COPYRIGHT_CONTENT_TYPE,
  WARNING_PUSH_CHANNEL,
  ROLE_CODE,
  CONTENT_CATEGORY,
} from '@/constants/enums'
import {
  getValidityConfigsApi,
  createValidityConfigApi,
  updateValidityConfigApi,
  deleteValidityConfigApi,
  triggerValidityScanApi,
  getValidityDashboardStatsApi,
  getValidityCopyrightListApi,
  changeValidityStatusApi,
  getValidityStatusHistoryApi,
  validateValidityThresholdApi,
} from '@/api/copyright'
import type {
  ValidityWarningConfig,
  ValidityWarningConfigForm,
  ValidityScanResult,
  ValidityDashboardStats,
  ValidityCopyrightItem,
  ValidityStatusChangeRecord,
  ValidityWarningRecord,
  PaginationResult,
} from '@/types'

const activeTab = ref<string>('config')
const loading = ref<boolean>(false)
const dashboardStats = ref<ValidityDashboardStats | null>(null)

const dashboardCards = computed(() => [
  { title: '生效配置数', value: dashboardStats.value?.activeConfigs ?? 0, icon: 'Setting', color: '#409EFF' },
  { title: '今日筛查量', value: dashboardStats.value?.last24hChanges ?? 0, icon: 'Search', color: '#67C23A' },
  { title: '预警中版权', value: dashboardStats.value?.warningCount ?? 0, icon: 'Warning', color: '#E6A23C' },
  { title: '已过期未下架', value: dashboardStats.value?.expiredNotOffline ?? 0, icon: 'CircleClose', color: '#F56C6C' },
])

const fetchDashboardStats = async () => {
  try {
    dashboardStats.value = await getValidityDashboardStatsApi()
  } catch (e) {
    console.error(e)
  }
}

onMounted(async () => {
  await fetchDashboardStats()
  await fetchConfigList()
  await fetchCopyrightList()
})

watch(activeTab, async (val) => {
  if (val === 'config') {
    await fetchConfigList()
  } else if (val === 'status') {
    await fetchCopyrightList()
  }
})

// ============ Tab1: 有效期配置 ============
const configList = ref<ValidityWarningConfig[]>([])
const configTotal = ref<number>(0)
const configPage = ref<number>(1)
const configPageSize = ref<number>(10)
const configLoading = ref<boolean>(false)

const configColumns = [
  { prop: 'name', label: '配置名称', minWidth: 160, showOverflowTooltip: true },
  {
    prop: 'enabled',
    label: '状态',
    width: 90,
    align: 'center',
    slot: 'enabled',
  },
  {
    prop: 'warningThreshold',
    label: '预警阈值',
    width: 140,
    align: 'center',
    slot: 'threshold',
  },
  {
    prop: 'expireHandlerRule',
    label: '过期处理规则',
    width: 160,
    align: 'center',
    slot: 'handlerRule',
  },
  {
    prop: 'relatedContentScope',
    label: '关联内容范围',
    width: 140,
    align: 'center',
    slot: 'scope',
  },
  { prop: 'scanCount', label: '筛查次数', width: 100, align: 'center' },
  { prop: 'lastScanAt', label: '最近筛查', width: 170, align: 'center', slot: 'lastScanAt' },
  {
    label: '操作',
    width: 260,
    fixed: 'right',
    align: 'center',
    slot: 'actions',
  },
]

const fetchConfigList = async () => {
  configLoading.value = true
  try {
    const res: PaginationResult<ValidityWarningConfig> = await getValidityConfigsApi({
      page: configPage.value,
      pageSize: configPageSize.value,
    })
    configList.value = res.list
    configTotal.value = res.pagination.total
  } finally {
    configLoading.value = false
  }
}

const configDialogVisible = ref<boolean>(false)
const isEditMode = ref<boolean>(false)
const editConfigId = ref<number | null>(null)
const configFormRef = ref<FormInstance>()
const thresholdErrorMsg = ref<string>('')
const thresholdShake = ref<boolean>(false)

const defaultConfigForm = (): ValidityWarningConfigForm => ({
  name: '',
  enabled: true,
  priority: 1,
  warningThreshold: 30,
  warningThresholdUnit: 'day',
  expireHandlerRule: 1,
  relatedContentScope: 1,
  specificContentCategories: [],
  pushChannels: [],
  receiverRoles: [],
  applicableCopyrightTypes: [],
  applicableContentTypes: [],
  remark: '',
  status: 1,
})

const configForm = reactive<ValidityWarningConfigForm>(defaultConfigForm())
const autoTriggerScan = ref<boolean>(true)

const configFormRules: FormRules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  warningThreshold: [{ required: true, message: '请输入预警阈值', trigger: 'blur' }],
  expireHandlerRule: [{ required: true, message: '请选择过期处理规则', trigger: 'change' }],
  relatedContentScope: [{ required: true, message: '请选择关联内容范围', trigger: 'change' }],
}

const THRESHOLD_MAX: Record<string, number> = {
  day: 3650,
  week: 520,
  month: 120,
}

const validateThresholdRange = () => {
  const val = configForm.warningThreshold
  const unit = configForm.warningThresholdUnit
  const max = THRESHOLD_MAX[unit] ?? 3650
  if (val <= 0 || val > max) {
    thresholdErrorMsg.value = `阈值范围应为 1-${max} ${getEnumLabel(WARNING_THRESHOLD_UNIT, unit)}`
    thresholdShake.value = true
    setTimeout(() => {
      thresholdShake.value = false
    }, 600)
    return false
  }
  thresholdErrorMsg.value = ''
  return true
}

let thresholdTimer: any = null
const onThresholdChange = () => {
  validateThresholdRange()
  clearTimeout(thresholdTimer)
  if (thresholdErrorMsg.value) return
  thresholdTimer = setTimeout(async () => {
    try {
      const res = await validateValidityThresholdApi({
        warningThreshold: configForm.warningThreshold,
        warningThresholdUnit: configForm.warningThresholdUnit,
      })
      if (!res.valid) {
        thresholdErrorMsg.value = res.reason || '阈值校验未通过'
        thresholdShake.value = true
        setTimeout(() => {
          thresholdShake.value = false
        }, 600)
      }
    } catch (e) {
      console.error(e)
    }
  }, 300)
}

const openCreateConfig = () => {
  isEditMode.value = false
  editConfigId.value = null
  Object.assign(configForm, defaultConfigForm())
  thresholdErrorMsg.value = ''
  autoTriggerScan.value = true
  configDialogVisible.value = true
}

const openEditConfig = (row: ValidityWarningConfig) => {
  isEditMode.value = true
  editConfigId.value = row.id
  Object.assign(configForm, {
    name: row.name,
    enabled: row.enabled,
    priority: row.priority,
    warningThreshold: row.warningThreshold,
    warningThresholdUnit: row.warningThresholdUnit,
    expireHandlerRule: row.expireHandlerRule,
    relatedContentScope: row.relatedContentScope,
    specificContentCategories: row.specificContentCategories || [],
    pushChannels: row.pushChannels as any,
    receiverRoles: row.receiverRoles,
    applicableCopyrightTypes: row.applicableCopyrightTypes || [],
    applicableContentTypes: row.applicableContentTypes || [],
    remark: row.remark,
    status: row.status,
  })
  thresholdErrorMsg.value = ''
  autoTriggerScan.value = false
  configDialogVisible.value = true
}

const submitConfig = async () => {
  if (!validateThresholdRange()) return
  await configFormRef.value?.validate()
  if (
    configForm.relatedContentScope === RELATED_CONTENT_SCOPE.SPECIFIC_CATEGORY.value &&
    (!configForm.specificContentCategories || configForm.specificContentCategories.length === 0)
  ) {
    ElMessage.warning('请选择指定的内容品类')
    return
  }
  loading.value = true
  try {
    if (isEditMode.value && editConfigId.value) {
      await updateValidityConfigApi(editConfigId.value, {
        ...configForm,
        autoTriggerScan: autoTriggerScan.value,
      } as any)
      ElMessage.success('修改成功')
    } else {
      await createValidityConfigApi({
        ...configForm,
        autoTriggerScan: autoTriggerScan.value,
      } as any)
      ElMessage.success('创建成功')
    }
    configDialogVisible.value = false
    await fetchConfigList()
    await fetchDashboardStats()
  } finally {
    loading.value = false
  }
}

const deleteConfig = async (row: ValidityWarningConfig) => {
  try {
    await ElMessageBox.confirm(`确认删除配置「${row.name}」？`, '删除确认', {
      type: 'warning',
    })
    await deleteValidityConfigApi(row.id)
    ElMessage.success('删除成功')
    await fetchConfigList()
    await fetchDashboardStats()
  } catch (e) {
    if ((e as any) !== 'cancel') console.error(e)
  }
}

const scanDrawerVisible = ref<boolean>(false)
const scanLoading = ref<boolean>(false)
const scanResult = ref<ValidityScanResult | null>(null)
const triggerScanConfigName = ref<string>('')

const triggerScan = async (row: ValidityWarningConfig) => {
  triggerScanConfigName.value = row.name
  scanLoading.value = true
  scanDrawerVisible.value = true
  scanResult.value = null
  try {
    scanResult.value = await triggerValidityScanApi(row.id, 'prod')
    await fetchConfigList()
    await fetchDashboardStats()
  } finally {
    scanLoading.value = false
  }
}

// ============ Tab2: 版权状态变更 ============
const copyrightList = ref<ValidityCopyrightItem[]>([])
const copyrightTotal = ref<number>(0)
const copyrightPage = ref<number>(1)
const copyrightPageSize = ref<number>(10)
const copyrightLoading = ref<boolean>(false)

const validityStatusFilter = ref<number | null>(null)
const remainingDaysMin = ref<number | undefined>()
const remainingDaysMax = ref<number | undefined>()
const filterCopyrightType = ref<number | undefined>()
const filterContentType = ref<number | undefined>()
const searchKeyword = ref<string>('')

const copyrightColumns = [
  { prop: 'code', label: '版权编码', width: 140, showOverflowTooltip: true },
  { prop: 'name', label: '版权名称', minWidth: 180, showOverflowTooltip: true },
  {
    prop: 'type',
    label: '版权类型',
    width: 110,
    align: 'center',
    slot: 'copyrightType',
  },
  {
    prop: 'validityStatus',
    label: '有效性状态',
    width: 110,
    align: 'center',
    slot: 'validityStatus',
  },
  {
    prop: 'remainingDays',
    label: '剩余天数',
    width: 100,
    align: 'center',
    slot: 'remainingDays',
  },
  { prop: 'endDate', label: '到期日期', width: 120, align: 'center' },
  {
    prop: 'relatedContentCount',
    label: '关联内容数',
    width: 100,
    align: 'center',
  },
  {
    label: '操作',
    width: 200,
    fixed: 'right',
    align: 'center',
    slot: 'copyrightActions',
  },
]

const fetchCopyrightList = async () => {
  copyrightLoading.value = true
  try {
    const res: PaginationResult<ValidityCopyrightItem> = await getValidityCopyrightListApi({
      page: copyrightPage.value,
      pageSize: copyrightPageSize.value,
      validityStatus: validityStatusFilter.value as any,
      minRemainingDays: remainingDaysMin.value,
      maxRemainingDays: remainingDaysMax.value,
      copyrightType: filterCopyrightType.value,
      contentType: filterContentType.value,
      keyword: searchKeyword.value || undefined,
    })
    copyrightList.value = res.list
    copyrightTotal.value = res.pagination.total
  } finally {
    copyrightLoading.value = false
  }
}

const resetCopyrightFilters = () => {
  validityStatusFilter.value = null
  remainingDaysMin.value = undefined
  remainingDaysMax.value = undefined
  filterCopyrightType.value = undefined
  filterContentType.value = undefined
  searchKeyword.value = ''
  copyrightPage.value = 1
  fetchCopyrightList()
}

const getRowBgClass = (row: ValidityCopyrightItem) => {
  const item = getEnumItem(VALIDITY_STATUS, row.validityStatus)
  return item?.bgClass || ''
}

const statusDialogVisible = ref<boolean>(false)
const statusDialogTarget = ref<ValidityCopyrightItem | null>(null)
const statusForm = reactive({
  targetStatus: 1 as 1 | 2 | 3,
  reason: '',
  remark: '',
})

const openStatusChange = (row: ValidityCopyrightItem, targetStatus: 1 | 2 | 3) => {
  statusDialogTarget.value = row
  statusForm.targetStatus = targetStatus
  statusForm.reason = ''
  statusForm.remark = ''
  statusDialogVisible.value = true
}

const previewPushChannels = computed(() => {
  if (!statusDialogTarget.value) return []
  return ['message_center', 'email']
})

const previewReceivers = computed(() => {
  if (!statusDialogTarget.value) return []
  return [
    { role: '版权管理员', name: '张三、李四' },
    { role: '内容审核主管', name: '王五' },
  ]
})

const affectedContentCount = computed(() => {
  return statusDialogTarget.value?.relatedContentCount ?? 0
})

const triggerWarningRipple = () => {
  ElMessage.success('预警通知已发送')
}

const submitStatusChange = async () => {
  if (!statusDialogTarget.value) return
  if (statusForm.targetStatus === 2 || statusForm.targetStatus === 3) {
    if (!statusForm.reason.trim()) {
      ElMessage.warning('请填写变更原因')
      return
    }
  }
  loading.value = true
  try {
    await changeValidityStatusApi(statusDialogTarget.value.id, {
      targetStatus: statusForm.targetStatus,
      reason: statusForm.reason || '确认变更状态',
      remark: statusForm.remark,
      environmentMode: 'prod',
    })
    ElMessage.success('状态变更成功')
    statusDialogVisible.value = false
    await fetchCopyrightList()
    await fetchDashboardStats()
  } finally {
    loading.value = false
  }
}

const historyDrawerVisible = ref<boolean>(false)
const historyTarget = ref<ValidityCopyrightItem | null>(null)
const historyList = ref<ValidityStatusChangeRecord[]>([])
const historyLoading = ref<boolean>(false)

const openHistory = async (row: ValidityCopyrightItem) => {
  historyTarget.value = row
  historyDrawerVisible.value = true
  historyLoading.value = true
  historyList.value = []
  try {
    const res = await getValidityStatusHistoryApi(row.id, { page: 1, pageSize: 50 })
    historyList.value = res.list
  } finally {
    historyLoading.value = false
  }
}

const createRipple = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement
  const ripple = document.createElement('span')
  const rect = target.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  ripple.className = 'ripple-effect'
  ripple.style.width = ripple.style.height = size + 'px'
  ripple.style.left = x + 'px'
  ripple.style.top = y + 'px'
  target.appendChild(ripple)
  setTimeout(() => ripple.remove(), 600)
}
</script>

<template>
  <div class="copyright-validity-page">
    <el-tabs v-model="activeTab" class="main-tabs">
      <!-- ============ Tab1: 有效期配置 ============ -->
      <el-tab-pane label="有效期配置" name="config">
        <div class="card-grid">
          <div
            v-for="(card, idx) in dashboardCards"
            :key="idx"
            class="stat-card card-content"
          >
            <div class="stat-header">
              <span class="stat-title">{{ card.title }}</span>
              <div
                class="stat-icon"
                :style="{ backgroundColor: card.color + '15', color: card.color }"
              >
                <el-icon :size="22">
                  <component :is="card.icon" />
                </el-icon>
              </div>
            </div>
            <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          </div>
        </div>

        <div class="table-section card-content">
          <QyTableToolbar
            :show-create="true"
            create-text="新增配置"
            :show-refresh="true"
            @create="openCreateConfig"
            @refresh="fetchConfigList"
          />

          <QyDataTable
            :columns="configColumns"
            :data="configList"
            :loading="configLoading"
            :total="configTotal"
            :page="configPage"
            :page-size="configPageSize"
            @page-change="(p) => { configPage = p; fetchConfigList() }"
            @size-change="(s) => { configPageSize = s; fetchConfigList() }"
          >
            <template #enabled="{ row }">
              <el-tag
                :type="row.enabled ? 'success' : 'info'"
                size="small"
                effect="light"
              >
                {{ row.enabled ? '启用中' : '已停用' }}
              </el-tag>
            </template>

            <template #threshold="{ row }">
              <span class="threshold-text">
                {{ row.warningThreshold }}
                {{ getEnumLabel(WARNING_THRESHOLD_UNIT, row.warningThresholdUnit) }}
              </span>
            </template>

            <template #handlerRule="{ row }">
              <el-tooltip
                :content="getEnumItem(EXPIRE_HANDLER_RULE, row.expireHandlerRule)?.desc"
                placement="top"
              >
                <el-tag
                  :type="row.expireHandlerRule === 1 ? 'info' : row.expireHandlerRule === 4 ? 'warning' : 'danger'"
                  size="small"
                  effect="plain"
                >
                  {{ getEnumLabel(EXPIRE_HANDLER_RULE, row.expireHandlerRule) }}
                </el-tag>
              </el-tooltip>
            </template>

            <template #scope="{ row }">
              <span>{{ getEnumLabel(RELATED_CONTENT_SCOPE, row.relatedContentScope) }}</span>
            </template>

            <template #lastScanAt="{ row }">
              <span v-if="row.lastScanAt">{{ row.lastScanAt }}</span>
              <span v-else class="text-placeholder">未筛查</span>
            </template>

            <template #actions="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                class="ripple-btn"
                @click="(e) => { createRipple(e); triggerScan(row) }"
              >
                <el-icon><Search /></el-icon>
                立即筛查
              </el-button>
              <el-button
                type="primary"
                link
                size="small"
                class="ripple-btn"
                @click="(e) => { createRipple(e); openEditConfig(row) }"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                link
                size="small"
                class="ripple-btn"
                @click="(e) => { createRipple(e); deleteConfig(row) }"
              >
                删除
              </el-button>
            </template>
          </QyDataTable>
        </div>

        <!-- 新增/编辑配置弹窗 -->
        <el-dialog
          v-model="configDialogVisible"
          :title="isEditMode ? '编辑有效期配置' : '新增有效期配置'"
          width="820px"
          :close-on-click-modal="false"
          class="config-dialog"
        >
          <el-form
            ref="configFormRef"
            :model="configForm"
            :rules="configFormRules"
            label-width="130px"
          >
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="配置名称" prop="name">
                  <el-input v-model="configForm.name" placeholder="请输入配置名称" maxlength="50" show-word-limit />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="是否启用">
                  <el-switch v-model="configForm.enabled" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">预警阈值配置</el-divider>
            <el-form-item label="预警阈值" prop="warningThreshold">
              <div class="config-input-wrapper" :class="{ 'error-shake': thresholdShake }">
                <div class="threshold-input-group">
                  <el-input-number
                    v-model="configForm.warningThreshold"
                    :min="1"
                    :max="THRESHOLD_MAX[configForm.warningThresholdUnit]"
                    controls-position="right"
                    size="large"
                    @change="onThresholdChange"
                  />
                  <el-select
                    v-model="configForm.warningThresholdUnit"
                    class="unit-select"
                    size="large"
                    @change="onThresholdChange"
                  >
                    <el-option
                      v-for="opt in getEnumOptions(WARNING_THRESHOLD_UNIT)"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </div>
                <div v-if="thresholdErrorMsg" class="threshold-error">
                  <el-icon><Warning /></el-icon>
                  {{ thresholdErrorMsg }}
                </div>
              </div>
            </el-form-item>

            <el-divider content-position="left">过期处理规则</el-divider>
            <el-form-item label="处理规则" prop="expireHandlerRule">
              <div class="radio-card-group">
                <div
                  v-for="opt in getEnumOptions(EXPIRE_HANDLER_RULE)"
                  :key="opt.value"
                  class="radio-card"
                  :class="{ active: configForm.expireHandlerRule === opt.value }"
                  @click="configForm.expireHandlerRule = opt.value as any"
                >
                  <div class="radio-card-header">
                    <el-radio
                      :model-value="configForm.expireHandlerRule"
                      :label="opt.value"
                    />
                    <span class="radio-card-title">{{ opt.label }}</span>
                  </div>
                  <div class="radio-card-desc">{{ opt.desc }}</div>
                </div>
              </div>
            </el-form-item>

            <el-divider content-position="left">关联内容范围</el-divider>
            <el-form-item label="适用范围" prop="relatedContentScope">
              <div class="radio-card-group">
                <div
                  v-for="opt in getEnumOptions(RELATED_CONTENT_SCOPE)"
                  :key="opt.value"
                  class="radio-card"
                  :class="{ active: configForm.relatedContentScope === opt.value }"
                  @click="configForm.relatedContentScope = opt.value as any"
                >
                  <div class="radio-card-header">
                    <el-radio
                      :model-value="configForm.relatedContentScope"
                      :label="opt.value"
                    />
                    <span class="radio-card-title">{{ opt.label }}</span>
                  </div>
                </div>
              </div>
              <el-form-item
                v-if="configForm.relatedContentScope === RELATED_CONTENT_SCOPE.SPECIFIC_CATEGORY.value"
                label="指定品类"
                style="margin-top: 12px; margin-left: 0"
              >
                <el-select
                  v-model="configForm.specificContentCategories"
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  placeholder="请选择内容品类"
                  style="width: 100%"
                >
                  <el-option
                    v-for="opt in getEnumOptions(CONTENT_CATEGORY)"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-form-item>

            <el-divider content-position="left">预警推送配置</el-divider>
            <el-form-item label="推送渠道">
              <el-checkbox-group v-model="configForm.pushChannels">
                <el-checkbox
                  v-for="opt in getEnumOptions(WARNING_PUSH_CHANNEL)"
                  :key="opt.value"
                  :label="opt.value"
                >
                  <el-icon style="vertical-align: -2px; margin-right: 4px">
                    <component :is="(opt as any).icon" />
                  </el-icon>
                  {{ opt.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="接收角色">
              <el-checkbox-group v-model="configForm.receiverRoles">
                <el-checkbox
                  v-for="(label, code) in ROLE_CODE"
                  :key="code"
                  :label="code"
                >
                  {{ label === 'SUPER_ADMIN' ? '超级管理员' : label === 'ADMIN' ? '管理员' : label === 'CONTENT_AUDITOR' ? '内容审核员' : label === 'COPYRIGHT_MANAGER' ? '版权管理员' : label === 'AD_MANAGER' ? '广告管理员' : label === 'ACTIVITY_MANAGER' ? '活动运营' : '只读用户' }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-divider content-position="left">适用类型筛选</el-divider>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="版权类型">
                  <el-select
                    v-model="configForm.applicableCopyrightTypes"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="全部类型"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in getEnumOptions(COPYRIGHT_TYPE)"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="内容类型">
                  <el-select
                    v-model="configForm.applicableContentTypes"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="全部类型"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="opt in getEnumOptions(COPYRIGHT_CONTENT_TYPE)"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">其他设置</el-divider>
            <el-form-item label="备注">
              <el-input
                v-model="configForm.remark"
                type="textarea"
                :rows="2"
                placeholder="可选"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="生效后自动筛查">
              <el-switch v-model="autoTriggerScan" />
              <span class="form-tip">启用后，保存配置会立即触发一次全量筛查</span>
            </el-form-item>
          </el-form>

          <template #footer>
            <el-button @click="configDialogVisible = false">取消</el-button>
            <el-button
              type="primary"
              :loading="loading"
              class="ripple-btn"
              @click="(e) => { createRipple(e); submitConfig() }"
            >
              保存
            </el-button>
          </template>
        </el-dialog>

        <!-- 筛查结果抽屉 -->
        <el-drawer
          v-model="scanDrawerVisible"
          title="筛查执行结果"
          size="560px"
          direction="rtl"
        >
          <div v-if="scanLoading" class="drawer-loading">
            <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
            <p>正在扫描版权有效期...</p>
          </div>
          <div v-else-if="scanResult" class="scan-result">
            <div class="scan-header">
              <div class="scan-config-name">配置：{{ triggerScanConfigName }}</div>
              <div class="scan-time">执行时间：{{ scanResult.scannedAt }}</div>
            </div>

            <div class="scan-stat-grid">
              <div class="scan-stat normal">
                <div class="scan-stat-num">{{ scanResult.normalCount }}</div>
                <div class="scan-stat-label">正常版权</div>
              </div>
              <div class="scan-stat warning">
                <div class="scan-stat-num">{{ scanResult.warningCount }}</div>
                <div class="scan-stat-label">预警版权</div>
              </div>
              <div class="scan-stat danger">
                <div class="scan-stat-num">{{ scanResult.expiredCount }}</div>
                <div class="scan-stat-label">已过期版权</div>
              </div>
              <div class="scan-stat info">
                <div class="scan-stat-num">{{ scanResult.newlyTriggered }}</div>
                <div class="scan-stat-label">新触发预警</div>
              </div>
            </div>

            <el-descriptions :column="2" border size="small" style="margin-top: 20px">
              <el-descriptions-item label="扫描总数">{{ scanResult.totalScanned }}</el-descriptions-item>
              <el-descriptions-item label="受影响内容">{{ scanResult.affectedContentCount }}</el-descriptions-item>
              <el-descriptions-item label="耗时">{{ (scanResult.scanDurationMs / 1000).toFixed(2) }}s</el-descriptions-item>
              <el-descriptions-item label="应用配置数">{{ scanResult.configApplied?.length ?? 0 }}</el-descriptions-item>
            </el-descriptions>

            <div v-if="scanResult.warnings && scanResult.warnings.length > 0" class="warning-list-section">
              <div class="section-title">
                <el-icon><Warning /></el-icon>
                本次触发的预警列表
              </div>
              <div class="warning-list">
                <div
                  v-for="w in (scanResult.warnings as ValidityWarningRecord[]).slice(0, 10)"
                  :key="w.id"
                  class="warning-item"
                >
                  <div class="warning-item-top">
                    <span class="warning-name">{{ w.copyrightName }}</span>
                    <el-tag size="small" type="warning">剩余{{ w.remainingDays }}天</el-tag>
                  </div>
                  <div class="warning-item-sub">
                    编码：{{ w.copyrightCode }} · 到期：{{ w.endDate }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-drawer>
      </el-tab-pane>

      <!-- ============ Tab2: 版权状态变更 ============ -->
      <el-tab-pane label="版权状态变更" name="status">
        <div class="status-layout">
          <div class="filter-sidebar card-content">
            <div class="filter-section">
              <div class="filter-title">有效性状态</div>
              <div class="status-tags">
                <div
                  class="status-tag validity-normal-tag"
                  :class="{ active: validityStatusFilter === 1 }"
                  @click="validityStatusFilter = validityStatusFilter === 1 ? null : 1"
                >
                  <span class="tag-dot"></span>
                  正常
                </div>
                <div
                  class="status-tag validity-warning-tag"
                  :class="{ active: validityStatusFilter === 2 }"
                  @click="validityStatusFilter = validityStatusFilter === 2 ? null : 2"
                >
                  <span class="tag-dot"></span>
                  即将过期
                </div>
                <div
                  class="status-tag validity-expired-tag"
                  :class="{ active: validityStatusFilter === 3 }"
                  @click="validityStatusFilter = validityStatusFilter === 3 ? null : 3"
                >
                  <span class="tag-dot"></span>
                  已过期
                </div>
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-title">剩余天数范围</div>
              <div class="days-range">
                <el-input-number
                  v-model="remainingDaysMin"
                  :min="0"
                  placeholder="最小"
                  size="small"
                  controls-position="right"
                />
                <span class="range-sep">至</span>
                <el-input-number
                  v-model="remainingDaysMax"
                  :min="0"
                  placeholder="最大"
                  size="small"
                  controls-position="right"
                />
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-title">类型筛选</div>
              <el-form-item label="版权类型" style="margin-bottom: 10px" label-width="70px">
                <el-select
                  v-model="filterCopyrightType"
                  placeholder="全部"
                  clearable
                  style="width: 100%"
                  size="small"
                >
                  <el-option
                    v-for="opt in getEnumOptions(COPYRIGHT_TYPE)"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="内容类型" label-width="70px">
                <el-select
                  v-model="filterContentType"
                  placeholder="全部"
                  clearable
                  style="width: 100%"
                  size="small"
                >
                  <el-option
                    v-for="opt in getEnumOptions(COPYRIGHT_CONTENT_TYPE)"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </div>

            <div class="filter-section">
              <div class="filter-title">关键词</div>
              <el-input
                v-model="searchKeyword"
                placeholder="名称/编码"
                clearable
                size="small"
                @keyup.enter="fetchCopyrightList"
              />
            </div>

            <div class="filter-actions">
              <el-button
                type="primary"
                size="small"
                class="ripple-btn"
                style="width: 100%"
                @click="(e) => { createRipple(e); fetchCopyrightList() }"
              >
                查询
              </el-button>
              <el-button
                size="small"
                class="ripple-btn"
                style="width: 100%; margin-top: 8px"
                @click="(e) => { createRipple(e); resetCopyrightFilters() }"
              >
                重置
              </el-button>
            </div>
          </div>

          <div class="table-area">
            <div class="table-section card-content">
              <QyTableToolbar
                :show-create="false"
                :show-refresh="true"
                @refresh="fetchCopyrightList"
              />

              <QyDataTable
                :columns="copyrightColumns"
                :data="copyrightList"
                :loading="copyrightLoading"
                :total="copyrightTotal"
                :page="copyrightPage"
                :page-size="copyrightPageSize"
                @page-change="(p) => { copyrightPage = p; fetchCopyrightList() }"
                @size-change="(s) => { copyrightPageSize = s; fetchCopyrightList() }"
                :row-class-name="({ row }: { row: ValidityCopyrightItem }) => getRowBgClass(row)"
              >
                <template #copyrightType="{ row }">
                  <el-tag
                    :type="getEnumItem(COPYRIGHT_TYPE, row.type)?.type as any"
                    size="small"
                    effect="light"
                  >
                    {{ getEnumLabel(COPYRIGHT_TYPE, row.type) }}
                  </el-tag>
                </template>

                <template #validityStatus="{ row }">
                  <el-tag
                    :type="getEnumItem(VALIDITY_STATUS, row.validityStatus)?.type as any"
                    size="small"
                  >
                    {{ getEnumLabel(VALIDITY_STATUS, row.validityStatus) }}
                  </el-tag>
                </template>

                <template #remainingDays="{ row }">
                  <span
                    :style="{
                      color:
                        row.validityStatus === 1
                          ? '#67C23A'
                          : row.validityStatus === 2
                            ? '#E6A23C'
                            : '#F56C6C',
                      fontWeight: 600,
                    }"
                  >
                    {{ row.remainingDays }}天
                  </span>
                </template>

                <template #copyrightActions="{ row }">
                  <el-dropdown trigger="click" @command="(cmd: any) => openStatusChange(row, cmd)">
                    <el-button type="primary" link size="small" class="ripple-btn" @click="createRipple">
                      变更状态<el-icon><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="1" :disabled="row.validityStatus === 1">
                          <el-icon style="color: #67C23A"><CircleCheck /></el-icon>
                          标记为正常
                        </el-dropdown-item>
                        <el-dropdown-item :command="2" :disabled="row.validityStatus === 2">
                          <el-icon style="color: #E6A23C"><Warning /></el-icon>
                          标记为即将过期
                        </el-dropdown-item>
                        <el-dropdown-item :command="3" :disabled="row.validityStatus === 3">
                          <el-icon style="color: #F56C6C"><CircleClose /></el-icon>
                          标记为已过期
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                  <el-button
                    type="primary"
                    link
                    size="small"
                    class="ripple-btn"
                    @click="(e) => { createRipple(e); openHistory(row) }"
                  >
                    历史记录
                  </el-button>
                </template>
              </QyDataTable>
            </div>
          </div>
        </div>

        <!-- 状态变更弹窗 -->
        <el-dialog
          v-model="statusDialogVisible"
          :title="'变更状态 - ' + (statusDialogTarget?.name || '')"
          width="540px"
          :close-on-click-modal="false"
          class="status-dialog"
        >
          <div v-if="statusDialogTarget">
            <!-- 正常 -->
            <div v-if="statusForm.targetStatus === 1" class="status-branch normal-branch">
              <div class="branch-icon"><el-icon :size="48"><CircleCheck /></el-icon></div>
              <div class="branch-title">变更为「正常」状态</div>
              <div class="branch-desc success-text">
                版权将恢复正常状态，预警系统将从配置的阈值重新计算。是否确认变更？
              </div>
              <el-form label-width="100px" style="margin-top: 16px">
                <el-form-item label="变更原因">
                  <el-input v-model="statusForm.reason" placeholder="可选，如续期完成" />
                </el-form-item>
                <el-form-item label="备注">
                  <el-input v-model="statusForm.remark" type="textarea" :rows="2" placeholder="可选" />
                </el-form-item>
              </el-form>
            </div>

            <!-- 即将过期 -->
            <div v-else-if="statusForm.targetStatus === 2" class="status-branch warning-branch">
              <div class="branch-icon"><el-icon :size="48"><Bell /></el-icon></div>
              <div class="branch-title">变更为「即将过期」状态</div>
              <div class="branch-desc warning-text">
                系统将按照配置的推送渠道，向指定角色发送预警通知。
              </div>

              <div class="preview-card">
                <div class="preview-title">
                  <el-icon><View /></el-icon>
                  预警通知预览
                </div>
                <div class="preview-row">
                  <span class="preview-label">推送渠道：</span>
                  <div class="preview-tags">
                    <el-tag
                      v-for="c in previewPushChannels"
                      :key="c"
                      size="small"
                      type="warning"
                      effect="light"
                    >
                      {{ getEnumLabel(WARNING_PUSH_CHANNEL, c) }}
                    </el-tag>
                  </div>
                </div>
                <div class="preview-row">
                  <span class="preview-label">接收人：</span>
                  <div class="preview-receivers">
                    <div v-for="(r, idx) in previewReceivers" :key="idx" class="receiver-line">
                      <span class="receiver-role">{{ r.role }}：</span>
                      <span class="receiver-names">{{ r.name }}</span>
                    </div>
                  </div>
                </div>
                <div class="preview-trigger">
                  <el-button
                    type="warning"
                    size="small"
                    class="ripple-btn ripple-warning-btn"
                    @click="(e) => { createRipple(e); triggerWarningRipple() }"
                  >
                    <el-icon><Promotion /></el-icon>
                    立即发送预警通知
                  </el-button>
                </div>
              </div>

              <el-form label-width="100px" style="margin-top: 16px">
                <el-form-item label="变更原因">
                  <el-input v-model="statusForm.reason" placeholder="必填，请说明原因" />
                </el-form-item>
                <el-form-item label="备注">
                  <el-input v-model="statusForm.remark" type="textarea" :rows="2" placeholder="可选" />
                </el-form-item>
              </el-form>
            </div>

            <!-- 已过期 -->
            <div v-else-if="statusForm.targetStatus === 3" class="status-branch expired-branch">
              <div class="branch-icon"><el-icon :size="48"><CircleClose /></el-icon></div>
              <div class="branch-title">变更为「已过期」状态</div>
              <div class="branch-desc danger-text">
                ⚠️ 此操作将联动下架 <b>{{ affectedContentCount }}</b> 条关联内容，停止流量分发。该操作不可逆！
              </div>

              <el-alert
                type="error"
                :closable="false"
                show-icon
                title="确认后将执行以下动作"
                class="danger-alert"
              >
                <ul class="alert-list">
                  <li>立即下架全部关联内容，前台不可见</li>
                  <li>通知内容审核、风控模块进行状态同步</li>
                  <li>记录操作日志，生成状态变更流水</li>
                </ul>
              </el-alert>

              <el-form label-width="100px" style="margin-top: 16px">
                <el-form-item label="变更原因">
                  <el-input v-model="statusForm.reason" placeholder="必填，说明过期处理原因" />
                </el-form-item>
                <el-form-item label="备注">
                  <el-input v-model="statusForm.remark" type="textarea" :rows="2" placeholder="可选" />
                </el-form-item>
              </el-form>
            </div>
          </div>

          <template #footer>
            <el-button @click="statusDialogVisible = false">取消</el-button>
            <el-button
              :type="statusForm.targetStatus === 3 ? 'danger' : statusForm.targetStatus === 2 ? 'warning' : 'primary'"
              :loading="loading"
              class="ripple-btn"
              @click="(e) => { createRipple(e); submitStatusChange() }"
            >
              确认变更
            </el-button>
          </template>
        </el-dialog>

        <!-- 历史记录抽屉 -->
        <el-drawer
          v-model="historyDrawerVisible"
          :title="'状态变更历史 - ' + (historyTarget?.name || '')"
          size="520px"
          direction="rtl"
        >
          <div v-loading="historyLoading" class="history-drawer">
            <div class="history-info" v-if="historyTarget">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="版权编码">{{ historyTarget.code }}</el-descriptions-item>
                <el-descriptions-item label="版权类型">
                  {{ getEnumLabel(COPYRIGHT_TYPE, historyTarget.type) }}
                </el-descriptions-item>
                <el-descriptions-item label="当前状态">
                  <el-tag :type="getEnumItem(VALIDITY_STATUS, historyTarget.validityStatus)?.type as any" size="small">
                    {{ getEnumLabel(VALIDITY_STATUS, historyTarget.validityStatus) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="剩余天数">{{ historyTarget.remainingDays }} 天</el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="timeline-section">
              <div class="section-title">
                <el-icon><Clock /></el-icon>
                变更记录
              </div>
              <el-timeline v-if="historyList.length > 0">
                <el-timeline-item
                  v-for="record in historyList"
                  :key="record.id"
                  :timestamp="record.createdAt"
                  :type="
                    record.newStatus === 1
                      ? 'success'
                      : record.newStatus === 2
                        ? 'warning'
                        : 'danger'
                  "
                  :hollow="false"
                >
                  <div class="timeline-card">
                    <div class="timeline-header">
                      <el-tag
                        size="small"
                        :type="
                          record.newStatus === 1
                            ? 'success'
                            : record.newStatus === 2
                              ? 'warning'
                              : 'danger'
                        "
                      >
                        {{ getEnumLabel(VALIDITY_STATUS, record.oldStatus) }}
                        <el-icon><ArrowRight /></el-icon>
                        {{ getEnumLabel(VALIDITY_STATUS, record.newStatus) }}
                      </el-tag>
                      <span class="timeline-operator">{{ record.operatorName || '系统' }}</span>
                    </div>
                    <div class="timeline-body">
                      <div class="timeline-row">
                        <span class="row-label">变更来源：</span>
                        <span>{{ record.source }}</span>
                      </div>
                      <div class="timeline-row">
                        <span class="row-label">变更原因：</span>
                        <span>{{ record.reason }}</span>
                      </div>
                      <div class="timeline-row" v-if="record.affectedContentCount > 0">
                        <span class="row-label">影响内容：</span>
                        <span>{{ record.affectedContentCount }} 条</span>
                      </div>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无变更记录" :image-size="80" />
            </div>
          </div>
        </el-drawer>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.copyright-validity-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-tabs {
  :deep(.el-tabs__header) {
    margin: 0 0 16px;
    background: $bg-white;
    padding: 0 16px;
    border-radius: $radius-md;
  }
}

.card-content {
  background: $bg-white;
  padding: 20px;
  border-radius: $radius-md;
  box-shadow: $shadow-light;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  padding: 20px;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-title {
  font-size: $font-sm;
  color: $text-secondary;
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.text-placeholder {
  color: $text-placeholder;
}

.table-section {
  padding: 20px;
}

.threshold-text {
  font-weight: 500;
  color: $text-primary;
}

.form-tip {
  margin-left: 12px;
  color: $text-secondary;
  font-size: $font-xs;
}

/* 配置弹窗样式 */
.config-dialog {
  :deep(.el-dialog__body) {
    max-height: 70vh;
    overflow-y: auto;
    padding: 0 24px;
  }
}

.config-input-wrapper {
  width: 100%;
  padding: 4px;
  border: 1px solid $border-color;
  border-radius: $radius-base;
  transition: all 0.25s ease;

  &:focus-within {
    border-color: $primary-color;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.15);
  }
}

.threshold-input-group {
  display: flex;
  gap: 8px;
  align-items: center;

  :deep(.el-input-number) {
    flex: 1;

    .el-input__wrapper {
      border: none;
      box-shadow: none;
    }
  }

  .unit-select {
    width: 120px;

    :deep(.el-select__wrapper) {
      border: none;
      box-shadow: none;
    }
  }
}

.threshold-error {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $danger-color;
  font-size: $font-xs;
  padding: 6px 10px;
  border-top: 1px solid $border-lighter;
}

.error-shake {
  animation: inputShake 0.45s ease-in-out;
  border-color: $danger-color !important;

  :deep(.el-input__wrapper) {
    box-shadow: none;
  }
}

@keyframes inputShake {
  0%, 100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-8px);
  }
  40% {
    transform: translateX(8px);
  }
  60% {
    transform: translateX(-6px);
  }
  80% {
    transform: translateX(6px);
  }
}

.radio-card-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.radio-card {
  border: 1.5px solid $border-color;
  border-radius: $radius-md;
  padding: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: $bg-white;

  &:hover {
    border-color: $primary-color;
    background: rgba(64, 158, 255, 0.03);
  }

  &.active {
    border-color: $primary-color;
    background: rgba(64, 158, 255, 0.08);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
}

.radio-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.radio-card-title {
  font-weight: 600;
  color: $text-primary;
  font-size: $font-base;
}

.radio-card-desc {
  color: $text-secondary;
  font-size: $font-xs;
  line-height: 1.5;
  padding-left: 28px;
}

/* 筛查抽屉 */
.drawer-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: $text-secondary;

  .loading-icon {
    animation: rotate 1s linear infinite;
    color: $primary-color;
    margin-bottom: 16px;
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.scan-header {
  padding-bottom: 16px;
  border-bottom: 1px solid $border-lighter;
  margin-bottom: 20px;
}

.scan-config-name {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 4px;
}

.scan-time {
  font-size: $font-xs;
  color: $text-secondary;
}

.scan-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.scan-stat {
  padding: 16px;
  border-radius: $radius-md;
  text-align: center;

  &.normal { background: rgba(103, 194, 58, 0.08); }
  &.warning { background: rgba(230, 162, 60, 0.08); }
  &.danger { background: rgba(245, 108, 108, 0.08); }
  &.info { background: rgba(144, 147, 153, 0.08); }
}

.scan-stat-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;

  .scan-stat.normal & { color: $success-color; }
  .scan-stat.warning & { color: $warning-color; }
  .scan-stat.danger & { color: $danger-color; }
  .scan-stat.info & { color: $info-color; }
}

.scan-stat-label {
  font-size: $font-xs;
  color: $text-secondary;
}

.warning-list-section {
  margin-top: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
  font-size: $font-md;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.warning-item {
  padding: 12px;
  border: 1px solid $border-lighter;
  border-radius: $radius-base;
  transition: $transition-base;

  &:hover {
    border-color: $warning-color;
    background: rgba(230, 162, 60, 0.03);
  }
}

.warning-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.warning-name {
  font-weight: 500;
  color: $text-primary;
}

.warning-item-sub {
  font-size: $font-xs;
  color: $text-secondary;
}

/* ============ Tab2 布局 ============ */
.status-layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  align-items: start;
}

.filter-sidebar {
  position: sticky;
  top: 16px;
}

.filter-section {
  padding: 12px 0;
  border-bottom: 1px solid $border-lighter;

  &:last-of-type {
    border-bottom: none;
  }
}

.filter-title {
  font-weight: 600;
  font-size: $font-sm;
  color: $text-primary;
  margin-bottom: 10px;
}

.status-tags {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: $radius-base;
  cursor: pointer;
  font-size: $font-sm;
  border: 1px solid transparent;
  transition: $transition-base;

  .tag-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &.validity-normal-tag {
    background: rgba(103, 194, 58, 0.08);
    color: $success-color;
    .tag-dot { background: $success-color; }
    &.active {
      border-color: $success-color;
      background: rgba(103, 194, 58, 0.15);
      font-weight: 600;
    }
  }

  &.validity-warning-tag {
    background: rgba(230, 162, 60, 0.08);
    color: $warning-color;
    .tag-dot { background: $warning-color; }
    &.active {
      border-color: $warning-color;
      background: rgba(230, 162, 60, 0.15);
      font-weight: 600;
    }
  }

  &.validity-expired-tag {
    background: rgba(245, 108, 108, 0.08);
    color: $danger-color;
    .tag-dot { background: $danger-color; }
    &.active {
      border-color: $danger-color;
      background: rgba(245, 108, 108, 0.15);
      font-weight: 600;
    }
  }
}

.days-range {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(.el-input-number) {
    flex: 1;
    width: auto;
  }
}

.range-sep {
  color: $text-secondary;
  font-size: $font-sm;
}

.filter-actions {
  padding-top: 16px;
}

/* 行背景色联动 */
:deep(.validity-normal) {
  background-color: rgba(103, 194, 58, 0.06) !important;
  &.el-table__row--striped {
    background-color: rgba(103, 194, 58, 0.09) !important;
  }
  &:hover > td {
    background-color: rgba(103, 194, 58, 0.12) !important;
  }
}

:deep(.validity-warning) {
  background-color: rgba(230, 162, 60, 0.06) !important;
  &.el-table__row--striped {
    background-color: rgba(230, 162, 60, 0.09) !important;
  }
  &:hover > td {
    background-color: rgba(230, 162, 60, 0.12) !important;
  }
}

:deep(.validity-expired) {
  background-color: rgba(245, 108, 108, 0.06) !important;
  &.el-table__row--striped {
    background-color: rgba(245, 108, 108, 0.09) !important;
  }
  &:hover > td {
    background-color: rgba(245, 108, 108, 0.12) !important;
  }
}

/* 状态变更弹窗 */
.status-dialog {
  :deep(.el-dialog) {
    animation: slideDownFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: top center;
  }
}

@keyframes slideDownFadeIn {
  0% {
    opacity: 0;
    transform: translateY(-30px) scale(0.98);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.status-branch {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
}

.branch-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;

  .normal-branch & {
    background: rgba(103, 194, 58, 0.12);
    color: $success-color;
  }
  .warning-branch & {
    background: rgba(230, 162, 60, 0.12);
    color: $warning-color;
  }
  .expired-branch & {
    background: rgba(245, 108, 108, 0.12);
    color: $danger-color;
  }
}

.branch-title {
  font-size: $font-lg;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8px;
}

.branch-desc {
  text-align: center;
  font-size: $font-sm;
  line-height: 1.6;
  margin-bottom: 12px;

  &.success-text { color: $success-color; }
  &.warning-text { color: $warning-color; }
  &.danger-text {
    color: $danger-color;
    padding: 10px 16px;
    background: rgba(245, 108, 108, 0.08);
    border-radius: $radius-base;
    width: 100%;
  }
}

.preview-card {
  width: 100%;
  margin-top: 8px;
  padding: 14px;
  background: rgba(230, 162, 60, 0.06);
  border: 1px solid rgba(230, 162, 60, 0.2);
  border-radius: $radius-md;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: $warning-color;
  margin-bottom: 12px;
  font-size: $font-sm;
}

.preview-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 8px;
}

.preview-label {
  color: $text-secondary;
  font-size: $font-xs;
  min-width: 64px;
  flex-shrink: 0;
  line-height: 24px;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preview-receivers {
  flex: 1;
}

.receiver-line {
  font-size: $font-xs;
  line-height: 1.8;
}

.receiver-role {
  color: $text-secondary;
  margin-right: 4px;
}

.receiver-names {
  color: $text-primary;
}

.preview-trigger {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(230, 162, 60, 0.2);
}

.danger-alert {
  margin-top: 12px;
}

.alert-list {
  margin: 8px 0 0;
  padding-left: 18px;
  color: $danger-color;
  font-size: $font-xs;
  line-height: 1.8;
}

/* 历史记录抽屉 */
.history-drawer {
  .el-descriptions {
    margin-bottom: 20px;
  }
}

.timeline-section {
  margin-top: 8px;
}

.timeline-card {
  background: $bg-color;
  border-radius: $radius-base;
  padding: 12px;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.timeline-operator {
  font-size: $font-xs;
  color: $text-secondary;
}

.timeline-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-row {
  display: flex;
  font-size: $font-xs;
  line-height: 1.6;
}

.row-label {
  color: $text-secondary;
  flex-shrink: 0;
  min-width: 72px;
}

/* 按钮波纹效果 */
.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.25;
  transform: scale(0);
  pointer-events: none;
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease-out;
  z-index: 1;
}

.ripple-btn:active .ripple-effect {
  transform: scale(2.5);
  opacity: 0;
}
</style>