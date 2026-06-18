<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  VALIDITY_TRACE_EVENT,
  TRACE_EXCEPTION_TYPE,
  VALIDITY_BATCH_STATUS,
  ENVIRONMENT_MODE,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getValidityTraceEventsApi,
  getValidityTraceExceptionsApi,
  checkValidityIntegrityApi,
  getValidityWarningsApi,
  getValidityBatchTasksApi,
} from '@/api/copyright'
import { formatDate, formatNumber } from '@/utils'
import {
  Search, Refresh, WarningFilled, View, CircleCheck, CircleClose,
  Aim, Document, RefreshRight, SwitchButton, Bell, DataAnalysis,
  Timer, Warning, Medal, MagicStick, Expand, Close,
} from '@element-plus/icons-vue'
import type { ValidityTraceEventItem, ValidityTraceException } from '@/types'

const formatThousands = (n: number | string | null | undefined): string => {
  return formatNumber(n, 0)
}

const calcHeight = computed(() => 'calc(100vh - 400px)')

const activeTab = ref('timeline')

const queryParams = reactive({
  copyrightId: '' as string | number,
  batchId: '',
  eventTypes: [] as string[],
  exceptionTypes: [] as string[],
  warningId: '' as string | number,
  environment: '' as string,
  dateRange: [] as string[],
})

const integrityDrawerVisible = ref(false)
const integrityLoading = ref(false)
const integrityAutoFix = ref(false)
const integrityResult = ref<any>(null)

const handleIntegrityCheck = async () => {
  integrityDrawerVisible.value = true
  integrityLoading.value = true
  integrityResult.value = null
  try {
    const result = await checkValidityIntegrityApi({
      checkScopes: ['offline', 'warning', 'sync', 'rule'],
      autoFix: integrityAutoFix.value,
    })
    integrityResult.value = result
  } catch (err: any) {
    ElMessage.error(err?.message || '完整性校验失败')
  } finally {
    integrityLoading.value = false
  }
}

const rerunIntegrityCheck = async () => {
  await handleIntegrityCheck()
}

const getScoreColor = (score: string) => {
  const map: Record<string, string> = { A: '#67C23A', B: '#409EFF', C: '#E6A23C', D: '#F56C6C' }
  return map[score] || '#909399'
}

const handleSearch = () => {
  if (activeTab.value === 'timeline') loadTimelineData()
  else if (activeTab.value === 'exceptions') loadExceptionData()
  else loadIntegrityTableData()
}

const handleReset = () => {
  queryParams.copyrightId = ''
  queryParams.batchId = ''
  queryParams.eventTypes = []
  queryParams.exceptionTypes = []
  queryParams.warningId = ''
  queryParams.environment = ''
  queryParams.dateRange = []
  handleSearch()
}

watch(activeTab, (val) => {
  if (val === 'timeline' && !copyrightGroups.value.length) loadTimelineData()
  else if (val === 'exceptions' && !exceptionList.value.length) loadExceptionData()
  else if (val === 'integrity' && !integrityTableData.value.length) loadIntegrityTableData()
})

const timelineLoading = ref(false)
const selectedCopyright = ref<any>(null)
const copyrightGroups = ref<any[]>([])
const timelineEvents = ref<ValidityTraceEventItem[]>([])
const timelineTotal = ref(0)
const timelinePage = reactive({ page: 1, pageSize: 50 })

const buildCommonParams = () => {
  const params: any = {}
  if (queryParams.copyrightId) {
    const id = String(queryParams.copyrightId).replace(/^#/, '')
    params.copyrightId = Number(id) || undefined
  }
  if (queryParams.batchId) params.batchId = queryParams.batchId
  if (queryParams.environment && queryParams.environment !== 'all') {
    params.environmentMode = queryParams.environment as 'test' | 'prod'
  }
  if (queryParams.dateRange?.length === 2) {
    params.startAt = queryParams.dateRange[0]
    params.endAt = queryParams.dateRange[1]
  }
  return params
}

const loadTimelineData = async () => {
  timelineLoading.value = true
  try {
    const params = {
      ...buildCommonParams(),
      ...timelinePage,
    }
    if (queryParams.eventTypes?.length) params.eventType = queryParams.eventTypes.join(',')
    const result = await getValidityTraceEventsApi(params)
    const events = result.list || []
    timelineEvents.value = events
    timelineTotal.value = result.pagination?.total || 0

    const groupMap = new Map<number, any>()
    events.forEach((e) => {
      if (e.copyrightId) {
        if (!groupMap.has(e.copyrightId)) {
          groupMap.set(e.copyrightId, {
            copyrightId: e.copyrightId,
            copyrightCode: e.copyrightCode,
            eventCount: 0,
            lastTriggeredAt: '',
            exceptionCount: 0,
          })
        }
        const g = groupMap.get(e.copyrightId)!
        g.eventCount++
        if (!g.lastTriggeredAt || e.createdAt > g.lastTriggeredAt) g.lastTriggeredAt = e.createdAt
        if (e.eventType === 'exception') g.exceptionCount++
      }
    })
    copyrightGroups.value = Array.from(groupMap.values())
    if (copyrightGroups.value.length && !selectedCopyright.value) {
      selectCopyright(copyrightGroups.value[0])
    }
  } finally {
    timelineLoading.value = false
  }
}

const filteredTimelineEvents = computed(() => {
  if (!selectedCopyright.value) return timelineEvents.value
  return timelineEvents.value.filter((e) => e.copyrightId === selectedCopyright.value.copyrightId)
})

const selectCopyright = (item: any) => {
  selectedCopyright.value = item
}

const getEventColor = (eventType: string) => {
  const keys = Object.keys(VALIDITY_TRACE_EVENT) as (keyof typeof VALIDITY_TRACE_EVENT)[]
  for (const k of keys) {
    if (VALIDITY_TRACE_EVENT[k].value === eventType) return VALIDITY_TRACE_EVENT[k].color
  }
  return '#909399'
}

const expandMetadataMap = reactive<Record<number, boolean>>({})

const toggleMetadata = (id: number) => {
  expandMetadataMap[id] = !expandMetadataMap[id]
}

const severityMap = { low: 'success', medium: 'warning', high: 'danger' }

const exceptionLoading = ref(false)
const exceptionList = ref<ValidityTraceException[]>([])
const exceptionTotal = ref(0)
const exceptionPage = reactive({ page: 1, pageSize: 20 })
const selectedExceptionType = ref('')

const exceptionStats = computed(() => {
  const stats = {
    missed_offline: 0,
    missed_warning: 0,
    invalid_renewal: 0,
    duplicate_warning: 0,
  }
  exceptionList.value.forEach((e) => {
    if (e.exceptionType in stats) {
      ;(stats as any)[e.exceptionType]++
    }
  })
  return stats
})

const loadExceptionData = async () => {
  exceptionLoading.value = true
  try {
    const params = {
      ...buildCommonParams(),
      ...exceptionPage,
    }
    const types = selectedExceptionType.value ? [selectedExceptionType.value] : queryParams.exceptionTypes
    if (types?.length) params.exceptionType = types.join(',')
    const result = await getValidityTraceExceptionsApi(params)
    exceptionList.value = result.list || []
    exceptionTotal.value = result.pagination?.total || 0
  } finally {
    exceptionLoading.value = false
  }
}

const filterByExceptionType = (type: string) => {
  selectedExceptionType.value = selectedExceptionType.value === type ? '' : type
  exceptionPage.page = 1
  loadExceptionData()
}

const exceptionDetailVisible = ref(false)
const currentException = ref<ValidityTraceException | null>(null)

const viewExceptionDetail = (row: ValidityTraceException) => {
  currentException.value = row
  exceptionDetailVisible.value = true
}

const markExceptionResolved = async (row: ValidityTraceException) => {
  try {
    await ElMessageBox.confirm(`确认标记异常 #${row.id} 为已解决？`, '提示', { type: 'warning' })
    row.autoResolved = true
    ElMessage.success('已标记为解决')
  } catch {}
}

const recheckException = async (row: ValidityTraceException) => {
  ElMessage.info(`正在重新校验异常 #${row.id}...`)
}

const exceptionColumns = [
  { prop: 'id', label: 'ID', width: 100, align: 'center' },
  { prop: 'exceptionType', label: '异常类型', width: 150, align: 'center', slot: 'type' },
  { prop: 'severity', label: '严重度', width: 100, align: 'center', slot: 'severity' },
  { label: '版权信息', width: 200, slot: 'copyright' },
  { prop: 'contentId', label: '内容ID', width: 110, align: 'center', slot: 'contentId' },
  { prop: 'batchId', label: '批次号', width: 150, slot: 'batch' },
  { prop: 'detectedAt', label: '检测时间', width: 180, align: 'center', slot: 'detectedAt' },
  { prop: 'autoResolved', label: '自动解决', width: 100, align: 'center', slot: 'resolved' },
  { label: '操作', width: 200, align: 'center', slot: 'actions', fixed: 'right' as const },
]

const integrityTableLoading = ref(false)
const integrityTableData = ref<any[]>([])
const integrityCheckSwitches = reactive({
  missed_offline: true,
  missed_warning: true,
  invalid_renewal: true,
  duplicate_warning: true,
  sync_delay: true,
})

const loadIntegrityTableData = async () => {
  integrityTableLoading.value = true
  try {
    const scopes: Array<'offline' | 'warning' | 'sync' | 'rule'> = []
    if (integrityCheckSwitches.missed_offline) scopes.push('offline')
    if (integrityCheckSwitches.missed_warning) scopes.push('warning')
    if (integrityCheckSwitches.sync_delay) scopes.push('sync')
    if (integrityCheckSwitches.invalid_renewal || integrityCheckSwitches.duplicate_warning) scopes.push('rule')

    const result = await checkValidityIntegrityApi({ checkScopes: scopes.length ? scopes : undefined })
    integrityTableData.value = result.details || []
  } finally {
    integrityTableLoading.value = false
  }
}

const integrityColumns = [
  { prop: 'checkName', label: '检查名称', width: 220 },
  { prop: 'passed', label: '检查通过', width: 120, align: 'center', slot: 'passed' },
  { prop: 'failedCount', label: '失败数量', width: 120, align: 'center', slot: 'failed' },
  { label: '异常列表', slot: 'exceptions' },
]

const expandIntegrityRow = reactive<Record<number, boolean>>({})

const toggleIntegrityRow = (idx: number) => {
  expandIntegrityRow[idx] = !expandIntegrityRow[idx]
}

onMounted(() => {
  loadTimelineData()
})
</script>

<template>
  <div class="validity-trace-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-row :gutter="8" style="width: 100%;">
          <el-col :span="5">
            <el-form-item label="版权ID" style="width: 100%; justify-content: flex-end;">
              <el-input
                v-model="queryParams.copyrightId"
                placeholder="#ID 精准输入"
                clearable
                style="width: 160px;"
                :prefix-icon="Aim"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="管控批次" style="width: 100%; justify-content: flex-end;">
              <el-input
                v-model="queryParams.batchId"
                placeholder="批次号/批次ID"
                clearable
                style="width: 160px;"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="事件类型" style="width: 100%; justify-content: flex-end;">
              <el-select
                v-model="queryParams.eventTypes"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="全部事件"
                clearable
                style="width: 220px;"
              >
                <el-option
                  v-for="item in getEnumOptions(VALIDITY_TRACE_EVENT)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="异常类型" style="width: 100%; justify-content: flex-end;">
              <el-select
                v-model="queryParams.exceptionTypes"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="全部异常"
                clearable
                style="width: 220px;"
              >
                <el-option
                  v-for="item in getEnumOptions(TRACE_EXCEPTION_TYPE)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="2" style="display: flex; align-items: center;">
            <el-form-item style="margin: 0; width: 100%;">
              <el-button type="primary" :icon="Search" @click="handleSearch" style="width: 100%;">查询</el-button>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8" style="width: 100%;">
          <el-col :span="4">
            <el-form-item label="预警记录" style="width: 100%; justify-content: flex-end;">
              <el-input
                v-model="queryParams.warningId"
                placeholder="预警记录ID"
                clearable
                style="width: 140px;"
                :prefix-icon="Bell"
              />
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="环境" style="width: 100%; justify-content: flex-end;">
              <el-select v-model="queryParams.environment" placeholder="全部" clearable style="width: 110px;">
                <el-option
                  v-for="item in getEnumOptions(ENVIRONMENT_MODE)"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
                <el-option label="全部环境" value="all" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="时间范围" style="width: 100%; justify-content: flex-end;">
              <el-date-picker
                v-model="queryParams.dateRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 360px;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="4" style="display: flex; align-items: center;">
            <el-form-item style="margin: 0;">
              <el-button :icon="Refresh" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
          <el-col :span="6" style="display: flex; align-items: center; justify-content: flex-end;">
            <el-form-item style="margin: 0;">
              <el-button
                type="danger"
                :icon="WarningFilled"
                @click="handleIntegrityCheck"
              >
                一键完整性校验
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="card-content">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="事件时间线溯源" name="timeline">
          <QyTableToolbar :loading="timelineLoading" :show-create="false" @refresh="loadTimelineData">
            <template #left>
              <span style="font-size: 13px; color: #909399;">
                依托版权ID/批次/预警维度聚合溯源事件，共 {{ formatThousands(timelineTotal) }} 条
              </span>
            </template>
          </QyTableToolbar>

          <div class="timeline-layout">
            <div class="timeline-left-panel">
              <div class="panel-header">版权聚合列表</div>
              <div class="copyright-group-list" v-loading="timelineLoading">
                <div
                  v-for="(g, idx) in copyrightGroups"
                  :key="g.copyrightId"
                  class="copyright-group-item"
                  :class="{ active: selectedCopyright?.copyrightId === g.copyrightId }"
                  @click="selectCopyright(g)"
                >
                  <div class="cgi-header">
                    <span class="cgi-code">#{{ g.copyrightCode || g.copyrightId }}</span>
                    <el-tag v-if="g.exceptionCount" type="danger" size="small" effect="dark">
                      {{ formatThousands(g.exceptionCount) }}异常
                    </el-tag>
                  </div>
                  <div class="cgi-stats">
                    <span><el-icon><DataAnalysis /></el-icon> {{ formatThousands(g.eventCount) }} 事件</span>
                  </div>
                  <div class="cgi-time" :title="g.lastTriggeredAt">
                    <el-icon><Timer /></el-icon> {{ formatDate(g.lastTriggeredAt, 'MM-DD HH:mm') }}
                  </div>
                </div>
                <el-empty v-if="!copyrightGroups.length" description="暂无版权事件" :image-size="80" />
              </div>
            </div>

            <div class="timeline-right-panel">
              <div class="panel-header">
                事件时间线
                <span v-if="selectedCopyright" class="current-copyright-tag">
                  #{{ selectedCopyright.copyrightCode || selectedCopyright.copyrightId }}
                </span>
              </div>
              <div class="timeline-container" v-loading="timelineLoading">
                <el-timeline v-if="filteredTimelineEvents.length">
                  <el-timeline-item
                    v-for="(e, idx) in filteredTimelineEvents"
                    :key="e.id"
                    :timestamp="formatDate(e.createdAt)"
                    :color="getEventColor(e.eventType)"
                    :hollow="idx === filteredTimelineEvents.length - 1"
                    placement="top"
                  >
                    <div class="timeline-item-header">
                      <span class="ti-event-label" :style="{ color: getEventColor(e.eventType) }">
                        {{ e.eventLabel }}
                      </span>
                      <el-tag
                        :type="e.environmentMode === 'prod' ? 'danger' : 'info'"
                        size="small"
                        effect="plain"
                      >
                        {{ e.environmentMode === 'prod' ? '正式' : '测试' }}
                      </el-tag>
                      <span class="ti-operator">{{ e.operatorName || '系统' }}</span>
                      <span class="ti-event-id" title="事件ID（千分位）">
                        ID: {{ formatThousands(e.id) }}
                      </span>
                    </div>
                    <div v-if="e.detail" class="timeline-item-detail">{{ e.detail }}</div>
                    <div v-if="e.metadata && Object.keys(e.metadata).length" class="timeline-item-metadata">
                      <el-button
                        type="primary"
                        link
                        size="small"
                        :icon="expandMetadataMap[e.id] ? Close : Expand"
                        @click="toggleMetadata(e.id)"
                      >
                        {{ expandMetadataMap[e.id] ? '收起元数据' : '展开元数据' }}
                      </el-button>
                      <div v-show="expandMetadataMap[e.id]" class="metadata-json">
                        <pre>{{ JSON.stringify(e.metadata, null, 2) }}</pre>
                      </div>
                    </div>
                  </el-timeline-item>
                </el-timeline>
                <el-empty v-else description="暂无事件记录" :image-size="80" />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="异常场景排查" name="exceptions">
          <QyTableToolbar :loading="exceptionLoading" :show-create="false" @refresh="loadExceptionData">
            <template #left>
              <span style="font-size: 13px; color: #909399;">
                异常场景排查，共 {{ formatThousands(exceptionTotal) }} 条异常
              </span>
            </template>
          </QyTableToolbar>

          <div class="exception-stats-row">
            <div
              class="stat-card"
              :class="{ active: selectedExceptionType === 'missed_offline' }"
              @click="filterByExceptionType('missed_offline')"
            >
              <div class="stat-icon missed-offline">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stat-info">
                <el-tooltip effect="dark" placement="top" :content="getEnumItem(TRACE_EXCEPTION_TYPE, 'missed_offline')?.desc || ''">
                  <div class="stat-label">漏下架</div>
                </el-tooltip>
                <div class="stat-value">{{ formatThousands(exceptionStats.missed_offline) }}</div>
              </div>
            </div>
            <div
              class="stat-card"
              :class="{ active: selectedExceptionType === 'missed_warning' }"
              @click="filterByExceptionType('missed_warning')"
            >
              <div class="stat-icon missed-warning">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="stat-info">
                <el-tooltip effect="dark" placement="top" :content="getEnumItem(TRACE_EXCEPTION_TYPE, 'missed_warning')?.desc || ''">
                  <div class="stat-label">漏推送</div>
                </el-tooltip>
                <div class="stat-value">{{ formatThousands(exceptionStats.missed_warning) }}</div>
              </div>
            </div>
            <div
              class="stat-card"
              :class="{ active: selectedExceptionType === 'invalid_renewal' }"
              @click="filterByExceptionType('invalid_renewal')"
            >
              <div class="stat-icon invalid-renewal">
                <el-icon><RefreshRight /></el-icon>
              </div>
              <div class="stat-info">
                <el-tooltip effect="dark" placement="top" :content="getEnumItem(TRACE_EXCEPTION_TYPE, 'invalid_renewal')?.desc || ''">
                  <div class="stat-label">无效续期</div>
                </el-tooltip>
                <div class="stat-value">{{ formatThousands(exceptionStats.invalid_renewal) }}</div>
              </div>
            </div>
            <div
              class="stat-card"
              :class="{ active: selectedExceptionType === 'duplicate_warning' }"
              @click="filterByExceptionType('duplicate_warning')"
            >
              <div class="stat-icon duplicate-warning">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <el-tooltip effect="dark" placement="top" :content="getEnumItem(TRACE_EXCEPTION_TYPE, 'duplicate_warning')?.desc || ''">
                  <div class="stat-label">重复预警</div>
                </el-tooltip>
                <div class="stat-value">{{ formatThousands(exceptionStats.duplicate_warning) }}</div>
              </div>
            </div>
          </div>

          <el-table
            v-loading="exceptionLoading"
            :data="exceptionList"
            border
            stripe
            :height="calcHeight"
            :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
            style="margin-top: 16px;"
          >
            <el-table-column type="index" label="序号" width="55" align="center" fixed="left" />
            <template v-for="col in exceptionColumns" :key="col.prop || col.slot">
              <el-table-column
                v-if="col.slot === 'type'"
                v-bind="col"
              >
                <template #default="{ row }">
                  <el-tooltip
                    effect="dark"
                    placement="top"
                    :content="getEnumItem(TRACE_EXCEPTION_TYPE, row.exceptionType)?.desc || ''"
                  >
                    <el-tag :type="severityMap[row.severity as keyof typeof severityMap] || 'info'" size="small">
                      {{ row.exceptionLabel || getEnumLabel(TRACE_EXCEPTION_TYPE, row.exceptionType) }}
                    </el-tag>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'severity'" v-bind="col">
                <template #default="{ row }">
                  <el-tag
                    :type="severityMap[row.severity as keyof typeof severityMap] || 'info'"
                    size="small"
                    effect="plain"
                  >
                    {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'copyright'" v-bind="col">
                <template #default="{ row }">
                  <div style="font-size: 12px; line-height: 1.4;">
                    <div class="copyright-id-cell" v-if="row.copyrightCode">#{{ row.copyrightCode }}</div>
                    <div style="color: #909399;" v-if="row.copyrightId">ID: {{ formatThousands(row.copyrightId) }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'contentId'" v-bind="col">
                <template #default="{ row }">
                  <span v-if="row.contentId" class="content-id-cell">#{{ formatThousands(row.contentId) }}</span>
                  <span v-else style="color: #C0C4CC;">-</span>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'batch'" v-bind="col">
                <template #default="{ row }">
                  <span v-if="row.batchId" style="font-family: Menlo, Consolas, monospace; font-size: 12px;">
                    {{ row.batchId }}
                  </span>
                  <span v-else style="color: #C0C4CC;">-</span>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'detectedAt'" v-bind="col">
                <template #default="{ row }">
                  <el-tooltip
                    effect="dark"
                    placement="top"
                    :content="`检测耗时: ${formatThousands(((new Date(row.detectedAt).getTime()) % 1000000))} ms`"
                  >
                    <span>{{ formatDate(row.detectedAt) }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'resolved'" v-bind="col">
                <template #default="{ row }">
                  <el-tag v-if="row.autoResolved" type="success" size="small" effect="light">
                    <el-icon style="margin-right: 2px;"><CircleCheck /></el-icon>是
                  </el-tag>
                  <el-tag v-else type="warning" size="small" effect="plain">否</el-tag>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'actions'" v-bind="col">
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.exceptionType === 'invalid_renewal'"
                    effect="dark"
                    placement="top"
                    content="续期被拦截原因：续期参数无效或版权未处于可续期状态"
                  >
                    <el-button type="primary" link :icon="View" size="small" @click="viewExceptionDetail(row)">
                      详情
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    v-else-if="row.exceptionType === 'duplicate_warning'"
                    effect="dark"
                    placement="top"
                    content="重复次数统计：同一批次同一版权触发多次预警"
                  >
                    <el-button type="primary" link :icon="View" size="small" @click="viewExceptionDetail(row)">
                      详情
                    </el-button>
                  </el-tooltip>
                  <el-button v-else type="primary" link :icon="View" size="small" @click="viewExceptionDetail(row)">
                    详情
                  </el-button>
                  <el-button type="success" link :icon="CircleCheck" size="small" @click="markExceptionResolved(row)">
                    标记解决
                  </el-button>
                  <el-button type="warning" link :icon="Refresh" size="small" @click="recheckException(row)">
                    重新校验
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column v-else v-bind="col" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ formatThousands(row[col.prop as keyof typeof row] as any) }}
                </template>
              </el-table-column>
            </template>
          </el-table>

          <div class="pagination-bar">
            <el-pagination
              v-model:current-page="exceptionPage.page"
              v-model:page-size="exceptionPage.pageSize"
              :page-sizes="[20, 50, 100]"
              :total="exceptionTotal"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @current-change="() => loadExceptionData()"
              @size-change="() => { exceptionPage.page = 1; loadExceptionData() }"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="状态与同步校验" name="integrity">
          <QyTableToolbar :loading="integrityTableLoading" :show-create="false" @refresh="loadIntegrityTableData">
            <template #left>
              <span style="font-size: 13px; color: #909399;">
                校验处理规则完整性 + 同步及时性
              </span>
            </template>
            <template #right>
              <el-button type="primary" :icon="DataAnalysis" @click="loadIntegrityTableData">
                执行完整校验
              </el-button>
            </template>
          </QyTableToolbar>

          <div class="integrity-check-row">
            <div class="check-card">
              <div class="cc-header">
                <span class="cc-title">过期内容漏下架</span>
                <el-switch v-model="integrityCheckSwitches.missed_offline" />
              </div>
              <div class="cc-desc">检查版权过期后关联内容是否及时下架</div>
            </div>
            <div class="check-card">
              <div class="cc-header">
                <span class="cc-title">预警漏推送</span>
                <el-switch v-model="integrityCheckSwitches.missed_warning" />
              </div>
              <div class="cc-desc">检查到达阈值的版权是否发送预警消息</div>
            </div>
            <div class="check-card">
              <div class="cc-header">
                <span class="cc-title">无效续期</span>
                <el-switch v-model="integrityCheckSwitches.invalid_renewal" />
              </div>
              <div class="cc-desc">检查续期操作是否处于有效状态和参数</div>
            </div>
            <div class="check-card">
              <div class="cc-header">
                <span class="cc-title">重复预警配置</span>
                <el-switch v-model="integrityCheckSwitches.duplicate_warning" />
              </div>
              <div class="cc-desc">检查同一批次版权是否重复触发预警</div>
            </div>
            <div class="check-card">
              <div class="cc-header">
                <span class="cc-title">状态同步不及时</span>
                <el-switch v-model="integrityCheckSwitches.sync_delay" />
              </div>
              <div class="cc-desc">检查审核/风控模块状态同步是否超时</div>
            </div>
          </div>

          <el-table
            v-loading="integrityTableLoading"
            :data="integrityTableData"
            border
            stripe
            :height="calcHeight"
            :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
            style="margin-top: 16px;"
          >
            <template v-for="col in integrityColumns" :key="col.prop || col.slot">
              <el-table-column v-else-if="col.slot === 'passed'" v-bind="col">
                <template #default="{ row }">
                  <el-tag v-if="row.passed" type="success" size="small" effect="light">
                    <el-icon style="margin-right: 2px;"><CircleCheck /></el-icon>通过
                  </el-tag>
                  <el-tag v-else type="danger" size="small" effect="dark">
                    <el-icon style="margin-right: 2px;"><CircleClose /></el-icon>未通过
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'failed'" v-bind="col">
                <template #default="{ row }">
                  <span :class="{ 'failed-count': row.failedCount > 0 }">
                    {{ formatThousands(row.failedCount) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column v-else-if="col.slot === 'exceptions'" v-bind="col">
                <template #default="{ row, $index }">
                  <div v-if="row.exceptions && row.exceptions.length">
                    <el-button
                      type="primary"
                      link
                      size="small"
                      :icon="expandIntegrityRow[$index] ? Close : Expand"
                      @click="toggleIntegrityRow($index)"
                    >
                      展开异常列表（{{ formatThousands(row.exceptions.length) }} 项）
                    </el-button>
                    <div v-show="expandIntegrityRow[$index]" class="exception-expand-wrap">
                      <div
                        v-for="(ex, exIdx) in row.exceptions"
                        :key="ex.id || exIdx"
                        class="exception-expand-item"
                      >
                        <el-descriptions :column="2" border size="small">
                          <el-descriptions-item label="异常ID">
                            {{ formatThousands(ex.id) }}
                          </el-descriptions-item>
                          <el-descriptions-item label="异常类型">
                            {{ ex.exceptionLabel || getEnumLabel(TRACE_EXCEPTION_TYPE, ex.exceptionType) }}
                          </el-descriptions-item>
                          <el-descriptions-item label="期望值(expected)">
                            <code>{{ ex.expected || '-' }}</code>
                          </el-descriptions-item>
                          <el-descriptions-item label="实际值(actual)">
                            <code class="actual-value">{{ ex.actual || '-' }}</code>
                          </el-descriptions-item>
                          <el-descriptions-item label="影响范围(impact)">
                            {{ ex.impactScope || '-' }}
                          </el-descriptions-item>
                          <el-descriptions-item label="影响数量(affectedCount)">
                            <span class="affected-count">{{ formatThousands(ex.affectedCount) }}</span>
                          </el-descriptions-item>
                        </el-descriptions>
                      </div>
                    </div>
                  </div>
                  <span v-else style="color: #909399;">无异常</span>
                </template>
              </el-table-column>
              <el-table-column v-else v-bind="col" show-overflow-tooltip />
            </template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-drawer
      v-model="integrityDrawerVisible"
      title="版权管控完整性校验"
      direction="rtl"
      size="640px"
      append-to-body
    >
      <div v-loading="integrityLoading" class="integrity-drawer-content">
        <div class="drawer-section score-section" v-if="integrityResult">
          <div class="score-badge-wrapper">
            <div
              class="score-badge"
              :style="{ background: `linear-gradient(135deg, ${getScoreColor(integrityResult.integrityScore)}, ${getScoreColor(integrityResult.integrityScore)}88)` }"
            >
              <el-icon class="score-medal"><Medal /></el-icon>
              <span class="score-letter">{{ integrityResult.integrityScore }}</span>
            </div>
            <div class="score-desc">
              <div class="score-title">完整性评级</div>
              <div class="score-detail">
                共检查 {{ formatThousands(integrityResult.totalChecked) }} 项，
                通过 {{ formatThousands(integrityResult.passedCount) }}，
                失败 {{ formatThousands(integrityResult.failedCount) }}，
                异常 {{ formatThousands(integrityResult.exceptionCount) }}
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-section">
          <div class="drawer-section-header">
            <h4>全局校验选项</h4>
            <el-tooltip effect="dark" placement="top" content="开启后系统将尝试自动修复可修复的异常">
              <div class="auto-fix-switch">
                <span>自动修复</span>
                <el-switch
                  v-model="integrityAutoFix"
                  active-text="开启"
                  inactive-text="关闭"
                  inline-prompt
                />
              </div>
            </el-tooltip>
          </div>

          <div class="drawer-section-header" style="margin-top: 12px;">
            <h4>各检查项结果</h4>
            <el-button
              size="small"
              :icon="RefreshRight"
              :loading="integrityLoading"
              @click="rerunIntegrityCheck"
            >
              重新校验
            </el-button>
          </div>

          <div v-if="integrityResult?.details?.length" class="check-detail-list">
            <div
              v-for="(d, idx) in integrityResult.details"
              :key="idx"
              class="check-detail-item"
              :class="{ pass: d.passed, fail: !d.passed }"
            >
              <div class="cdi-header">
                <div class="cdi-title">
                  <el-icon v-if="d.passed" style="color: #67C23A;"><CircleCheck /></el-icon>
                  <el-icon v-else style="color: #F56C6C;"><CircleClose /></el-icon>
                  <span>{{ d.checkName }}</span>
                </div>
                <div class="cdi-stats">
                  <el-tag v-if="d.passed" type="success" size="small" effect="light">
                    通过 {{ formatThousands(d.passed ? 1 : 0) }}
                  </el-tag>
                  <el-tag v-if="d.failedCount" type="danger" size="small" effect="dark">
                    失败 {{ formatThousands(d.failedCount) }}
                  </el-tag>
                  <el-tag
                    v-if="d.exceptions?.length"
                    type="warning"
                    size="small"
                    effect="plain"
                  >
                    异常 {{ formatThousands(d.exceptions.length) }}
                  </el-tag>
                </div>
              </div>
              <div v-if="d.exceptions?.length" class="cdi-exceptions">
                <div
                  v-for="(ex, exIdx) in d.exceptions.slice(0, 3)"
                  :key="ex.id || exIdx"
                  class="cdi-exception-item"
                >
                  <span class="cei-type">
                    {{ ex.exceptionLabel || getEnumLabel(TRACE_EXCEPTION_TYPE, ex.exceptionType) }}
                  </span>
                  <span class="cei-desc">{{ ex.description || ex.impactScope }}</span>
                </div>
                <div v-if="d.exceptions.length > 3" class="cdi-more">
                  ...还有 {{ formatThousands(d.exceptions.length - 3) }} 项异常
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else-if="!integrityLoading" description="暂无校验结果" :image-size="80" />
        </div>

        <div v-if="integrityResult?.autoFixResult" class="drawer-section autifix-section">
          <div class="drawer-section-header"><h4>自动修复执行结果</h4></div>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="尝试修复">
              <span>{{ formatThousands(integrityResult.autoFixResult.attempted) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="成功解决">
              <span class="success-count">{{ formatThousands(integrityResult.autoFixResult.resolved) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="修复失败">
              <span class="fail-count">{{ formatThousands(integrityResult.autoFixResult.failed) }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="!integrityResult && !integrityLoading" class="drawer-empty-tip">
          <el-empty description="点击上方「一键完整性校验」或「重新校验」开始检测" :image-size="100">
            <template #image>
              <el-icon :size="60" style="color: #909399;"><MagicStick /></el-icon>
            </template>
          </el-empty>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="exceptionDetailVisible"
      title="异常详情"
      width="640px"
      append-to-body
    >
      <div v-if="currentException" class="exception-detail">
        <el-descriptions :column="2" border size="default">
          <el-descriptions-item label="异常ID">
            {{ formatThousands(currentException.id) }}
          </el-descriptions-item>
          <el-descriptions-item label="异常类型">
            <el-tag :type="severityMap[currentException.severity as keyof typeof severityMap] || 'info'" size="small">
              {{ currentException.exceptionLabel || getEnumLabel(TRACE_EXCEPTION_TYPE, currentException.exceptionType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="严重度">
            {{ currentException.severity === 'high' ? '高' : currentException.severity === 'medium' ? '中' : '低' }}
          </el-descriptions-item>
          <el-descriptions-item label="检测时间">
            {{ formatDate(currentException.detectedAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="版权ID" v-if="currentException.copyrightId">
            #{{ currentException.copyrightCode || '' }} ({{ formatThousands(currentException.copyrightId) }})
          </el-descriptions-item>
          <el-descriptions-item label="内容ID" v-if="currentException.contentId">
            {{ formatThousands(currentException.contentId) }}
          </el-descriptions-item>
          <el-descriptions-item label="批次号" v-if="currentException.batchId">
            {{ currentException.batchId }}
          </el-descriptions-item>
          <el-descriptions-item label="影响数量" v-if="currentException.affectedCount">
            {{ formatThousands(currentException.affectedCount) }}
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ currentException.description }}
          </el-descriptions-item>
          <el-descriptions-item label="期望值(expected)" v-if="currentException.expected" :span="2">
            <code>{{ currentException.expected }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="实际值(actual)" v-if="currentException.actual" :span="2">
            <code class="actual-value">{{ currentException.actual }}</code>
          </el-descriptions-item>
          <el-descriptions-item label="影响范围(impact)" v-if="currentException.impactScope" :span="2">
            {{ currentException.impactScope }}
          </el-descriptions-item>
          <el-descriptions-item label="是否自动解决">
            <el-tag v-if="currentException.autoResolved" type="success" size="small">是</el-tag>
            <el-tag v-else type="warning" size="small">否</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="解决时间" v-if="currentException.resolvedAt">
            {{ formatDate(currentException.resolvedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.validity-trace-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-tabs {
  :deep(.el-tabs__header) {
    margin: 0 0 12px;
  }
}

.timeline-layout {
  display: flex;
  gap: 16px;
  min-height: 500px;
}

.timeline-left-panel {
  width: 280px;
  flex-shrink: 0;
  border: 1px solid $border-lighter;
  border-radius: 6px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.timeline-right-panel {
  flex: 1;
  border: 1px solid $border-lighter;
  border-radius: 6px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 12px 16px;
  background: $bg-extra-light;
  border-bottom: 1px solid $border-lighter;
  font-weight: 600;
  font-size: 13px;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 10px;

  .current-copyright-tag {
    font-size: 12px;
    font-weight: 400;
    color: $primary-color;
    background: rgba(64, 158, 255, 0.08);
    padding: 2px 8px;
    border-radius: 3px;
  }
}

.copyright-group-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: calc(100vh - 420px);
}

.copyright-group-item {
  padding: 10px 12px;
  border: 1px solid $border-lighter;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: $primary-color;
    background: rgba(64, 158, 255, 0.02);
  }

  &.active {
    border-color: $primary-color;
    background: rgba(64, 158, 255, 0.06);
    box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.15);
  }
}

.cgi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.cgi-code {
  font-family: Menlo, Consolas, monospace;
  font-weight: 600;
  font-size: 13px;
  color: $text-primary;
}

.cgi-stats {
  font-size: 12px;
  color: $text-secondary;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cgi-time {
  font-size: 12px;
  color: $text-placeholder;
  display: flex;
  align-items: center;
  gap: 4px;
}

.timeline-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  max-height: calc(100vh - 420px);
}

.timeline-item-header {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.ti-event-label {
  font-weight: 600;
  font-size: 14px;
}

.ti-operator {
  font-size: 12px;
  color: $text-secondary;
}

.ti-event-id {
  font-size: 12px;
  color: $text-placeholder;
  font-family: Menlo, Consolas, monospace;
  margin-left: auto;
}

.timeline-item-detail {
  font-size: 13px;
  color: $text-regular;
  line-height: 1.6;
  margin-bottom: 6px;
}

.timeline-item-metadata {
  margin-top: 6px;
}

.metadata-json {
  margin-top: 8px;
  background: #f8f9fa;
  border: 1px solid $border-lighter;
  border-radius: 4px;
  padding: 10px;
  max-height: 240px;
  overflow-y: auto;

  pre {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: $text-regular;
    font-family: Menlo, Consolas, monospace;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.exception-stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid $border-lighter;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  &.active {
    border-color: $primary-color;
    background: rgba(64, 158, 255, 0.03);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
  }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;

  &.missed-offline { background: linear-gradient(135deg, #F56C6C, #C0392B); }
  &.missed-warning { background: linear-gradient(135deg, #E6A23C, #D48806); }
  &.invalid-renewal { background: linear-gradient(135deg, #722ed1, #531dab); }
  &.duplicate-warning { background: linear-gradient(135deg, #13c2c2, #08979c); }
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.2;
}

.copyright-id-cell {
  font-family: Menlo, Consolas, monospace;
  font-weight: 500;
  color: $primary-color;
}

.content-id-cell {
  font-family: Menlo, Consolas, monospace;
  font-weight: 500;
  color: $primary-color;
  background: rgba(64, 158, 255, 0.06);
  padding: 1px 6px;
  border-radius: 3px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

.failed-count {
  color: $danger-color;
  font-weight: 600;
}

.integrity-check-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 4px;
}

.check-card {
  padding: 14px 16px;
  border: 1px solid $border-lighter;
  border-radius: 8px;
  background: #fff;
  transition: all 0.2s;

  &:hover {
    border-color: $primary-color;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
  }
}

.cc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.cc-title {
  font-weight: 600;
  font-size: 13px;
  color: $text-primary;
}

.cc-desc {
  font-size: 12px;
  color: $text-secondary;
  line-height: 1.5;
}

.exception-expand-wrap {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.exception-expand-item {
  padding: 4px;
}

.affected-count {
  color: $danger-color;
  font-weight: 600;
}

.actual-value {
  color: $danger-color;
}

.integrity-drawer-content {
  padding: 4px 4px 20px;
}

.drawer-section {
  margin-bottom: 24px;
}

.drawer-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid $border-lighter;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
  }
}

.score-section {
  margin-bottom: 20px;
}

.score-badge-wrapper {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #eef2f7 100%);
  border-radius: 12px;
}

.score-badge {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  flex-shrink: 0;
  position: relative;
}

.score-medal {
  font-size: 20px;
  margin-bottom: 2px;
  opacity: 0.9;
}

.score-letter {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.score-desc {
  flex: 1;
}

.score-title {
  font-size: 18px;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 8px;
}

.score-detail {
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.7;
}

.auto-fix-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: $text-regular;
}

.check-detail-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.check-detail-item {
  border: 1px solid $border-lighter;
  border-radius: 8px;
  padding: 12px 14px;
  transition: all 0.2s;

  &.pass {
    background: rgba(103, 194, 58, 0.02);
    border-color: rgba(103, 194, 58, 0.2);
  }

  &.fail {
    background: rgba(245, 108, 108, 0.02);
    border-color: rgba(245, 108, 108, 0.2);
  }
}

.cdi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cdi-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  color: $text-primary;
}

.cdi-stats {
  display: flex;
  gap: 6px;
}

.cdi-exceptions {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed $border-lighter;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cdi-exception-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.cei-type {
  flex-shrink: 0;
  color: $danger-color;
  font-weight: 500;
}

.cei-desc {
  color: $text-secondary;
}

.cdi-more {
  font-size: 12px;
  color: $text-placeholder;
  font-style: italic;
}

.autifix-section {
  .success-count {
    color: $success-color;
    font-weight: 600;
  }
  .fail-count {
    color: $danger-color;
    font-weight: 600;
  }
}

.drawer-empty-tip {
  padding: 40px 0;
}

.exception-detail {
  code {
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
    background: #f5f7fa;
    padding: 2px 6px;
    border-radius: 3px;
  }
}
</style>
