<template>
  <div class="business-inspection-page">
    <div class="page-header">
      <h2 class="page-title">业务合规巡检</h2>
      <div class="toolbar">
        <el-button type="primary" @click="handleCreateInspection">
          <el-icon><VideoPlay /></el-icon>
          新建巡检
        </el-button>
        <el-button
          v-if="hasPerm('compliance:inspection:batch')"
          type="warning"
          :disabled="issueSelectedRows.length === 0"
          @click="handleBatchProcess"
        >
          <el-icon><Refresh /></el-icon>
          批量处理 ({{ issueSelectedRows.length }})
        </el-button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card" :class="{ active: activeTab === 'inspections' }">
        <div class="stat-value">{{ formatNumber(stats.totalInspections || 0) }}</div>
        <div class="stat-label">巡检总数</div>
      </div>
      <div class="stat-card stat-card--running">
        <div class="stat-value">{{ formatNumber(stats.totalRunning || 0) }}</div>
        <div class="stat-label">进行中</div>
      </div>
      <div class="stat-card stat-card--completed">
        <div class="stat-value">{{ formatNumber(stats.totalCompleted || 0) }}</div>
        <div class="stat-label">已完成</div>
      </div>
      <div class="stat-card stat-card--issues">
        <div class="stat-value">{{ formatNumber(stats.totalIssues || 0) }}</div>
        <div class="stat-label">违规问题</div>
      </div>
      <div class="stat-card stat-card--pending">
        <div class="stat-value">{{ formatNumber(stats.pendingIssues || 0) }}</div>
        <div class="stat-label">待整改</div>
      </div>
      <div class="stat-card stat-card--severe">
        <div class="stat-value severe-pulse">{{ formatNumber(stats.severeIssues || 0) }}</div>
        <div class="stat-label">严重违规</div>
      </div>
    </div>

    <div class="compliance-info-bar">
      <span>平均覆盖率：<strong>{{ formatNumber(stats.avgCoverageScore || 0) }}</strong> 分</span>
      <span>平均准确率：<strong>{{ formatNumber(stats.avgAccuracyScore || 0) }}</strong> 分</span>
    </div>

    <el-tabs v-model="activeTab" class="inspection-tabs">
      <el-tab-pane label="巡检记录" name="inspections">
        <transition name="slide-panel" mode="out-in">
          <div v-if="activeTab === 'inspections'" key="inspections" class="tab-panel">
            <el-skeleton :loading="scanning" :rows="5" animated>
              <template #default>
                <FinFilter :filters="inspectionFilterConfig" @search="handleInspectionSearch" @reset="handleInspectionReset" />
                <FinTable
                  :columns="inspectionTableColumns"
                  :data="inspectionTableData"
                  :loading="inspectionLoading"
                  :pagination="inspectionPagination"
                  :selection="false"
                  :show-index="true"
                  :row-class-name="getInspectionRowClassName"
                  @page-change="handleInspectionPageChange"
                  @size-change="handleInspectionSizeChange"
                >
                  <template #inspectionCycle="{ row }">
                    <span class="cycle-badge">{{ getInspectionCycleLabel(row.inspectionCycle) }}</span>
                  </template>

                  <template #inspectionScopes="{ row }">
                    <div class="scope-tags">
                      <span
                        v-for="scope in (row.inspectionScopes || []).slice(0, 3)"
                        :key="scope"
                        class="scope-badge"
                        :style="{
                          backgroundColor: getInspectionScopeBgColor(scope),
                          color: getInspectionScopeColor(scope)
                        }"
                      >
                        {{ getInspectionScopeLabel(scope) }}
                      </span>
                      <span v-if="(row.inspectionScopes || []).length > 3" class="scope-more">
                        +{{ row.inspectionScopes.length - 3 }}
                      </span>
                    </div>
                  </template>

                  <template #inspectionStatus="{ row }">
                    <div class="status-cell" :class="{ 'running-pulse': row.inspectionStatus === InspectionStatus.RUNNING }">
                      <el-tag :type="getInspectionStatusTagType(row.inspectionStatus)" effect="light" size="small">
                        {{ getInspectionStatusLabel(row.inspectionStatus) }}
                      </el-tag>
                    </div>
                  </template>

                  <template #totalScanned="{ row }">
                    <span class="number-cell">{{ formatNumber(row.totalScanned || 0) }}</span>
                  </template>

                  <template #totalIssues="{ row }">
                    <span class="number-cell" :class="{ 'text-severe': row.totalIssues > 0 }">
                      {{ formatNumber(row.totalIssues || 0) }}
                    </span>
                  </template>

                  <template #severeCount="{ row }">
                    <span class="number-cell" :class="{ 'text-severe': row.severeCount > 0 }">
                      {{ formatNumber(row.severeCount || 0) }}
                    </span>
                  </template>

                  <template #coverageScore="{ row }">
                    <span class="score-cell">{{ row.coverageScore != null ? row.coverageScore.toFixed(1) : '-' }}</span>
                  </template>

                  <template #accuracyScore="{ row }">
                    <span class="score-cell">{{ row.accuracyScore != null ? row.accuracyScore.toFixed(1) : '-' }}</span>
                  </template>

                  <template #action="{ row }">
                    <div class="action-btns">
                      <el-button
                        v-if="row.inspectionStatus === InspectionStatus.RUNNING"
                        link
                        type="primary"
                        size="small"
                        @click="handleViewInspection(row)"
                      >
                        查看
                      </el-button>
                      <el-button
                        v-if="row.inspectionStatus === InspectionStatus.COMPLETED"
                        link
                        type="success"
                        size="small"
                        @click="handleViewInspection(row)"
                      >
                        <el-icon><View /></el-icon>
                        报告
                      </el-button>
                      <el-button link type="info" size="small" @click="handleViewTrail(row)">
                        溯源
                      </el-button>
                    </div>
                  </template>
                </FinTable>
              </template>
            </el-skeleton>
          </div>
        </transition>
      </el-tab-pane>

      <el-tab-pane label="违规问题" name="issues">
        <transition name="slide-panel" mode="out-in">
          <div v-if="activeTab === 'issues'" key="issues" class="tab-panel">
            <el-skeleton :loading="scanning" :rows="5" animated>
              <template #default>
                <FinFilter :filters="issueFilterConfig" @search="handleIssueSearch" @reset="handleIssueReset" />
                <FinTable
                  :columns="issueTableColumns"
                  :data="issueTableData"
                  :loading="issueLoading"
                  :pagination="issuePagination"
                  :selection="true"
                  :show-index="true"
                  :row-class-name="getIssueRowClassName"
                  @selection-change="handleIssueSelectionChange"
                  @page-change="handleIssuePageChange"
                  @size-change="handleIssueSizeChange"
                >
                  <template #scope="{ row }">
                    <span
                      class="scope-badge"
                      :style="{
                        backgroundColor: getInspectionScopeBgColor(row.scope),
                        color: getInspectionScopeColor(row.scope)
                      }"
                    >
                      {{ getInspectionScopeLabel(row.scope) }}
                    </span>
                  </template>

                  <template #violationLevel="{ row }">
                    <span
                      class="violation-badge"
                      :class="{ 'severe-pulse-badge': row.violationLevel === ViolationLevel.SEVERE }"
                      :style="{
                        backgroundColor: getViolationLevelBgColor(row.violationLevel),
                        color: getViolationLevelColor(row.violationLevel)
                      }"
                    >
                      {{ getViolationLevelLabel(row.violationLevel) }}
                    </span>
                  </template>

                  <template #issueStatus="{ row }">
                    <el-tag :type="getIssueStatusTagType(row.issueStatus)" effect="light" size="small">
                      {{ getIssueStatusLabel(row.issueStatus) }}
                    </el-tag>
                  </template>

                  <template #action="{ row }">
                    <div class="action-btns">
                      <el-button
                        v-if="row.issueStatus === IssueStatus.PENDING"
                        link
                        type="success"
                        size="small"
                        @click="handleRectifyIssue(row)"
                      >
                        整改
                      </el-button>
                      <el-button
                        v-if="row.issueStatus === IssueStatus.PENDING"
                        link
                        type="info"
                        size="small"
                        @click="handleIgnoreIssue(row)"
                      >
                        忽略
                      </el-button>
                      <el-button
                        v-if="row.issueStatus === IssueStatus.PENDING && row.violationLevel === ViolationLevel.SEVERE"
                        link
                        type="danger"
                        size="small"
                        @click="handleReportIssue(row)"
                      >
                        上报
                      </el-button>
                      <el-button link type="info" size="small" @click="handleViewTrail(row)">
                        溯源
                      </el-button>
                    </div>
                  </template>
                </FinTable>
              </template>
            </el-skeleton>
          </div>
        </transition>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="createDialogVisible"
      title="新建巡检"
      width="620px"
      class="fade-in-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="preCheckResult" class="precheck-result">
        <el-alert v-if="preCheckResult.messages.length > 0" type="error" :closable="false" class="check-alert">
          <template #title>
            <div>
              <div v-for="(msg, idx) in preCheckResult.messages" :key="idx" class="check-msg">× {{ msg }}</div>
            </div>
          </template>
        </el-alert>
        <el-alert v-if="preCheckResult.warnings.length > 0" type="warning" :closable="false" class="check-alert">
          <template #title>
            <div>
              <div v-for="(w, idx) in preCheckResult.warnings" :key="idx" class="check-warn">! {{ w }}</div>
            </div>
          </template>
        </el-alert>
        <div class="check-items">
          <div class="check-item">
            <span>权限校验</span>
            <el-tag :type="preCheckResult.permissionValid ? 'success' : 'danger'" size="small">
              {{ preCheckResult.permissionValid ? '通过' : '不通过' }}
            </el-tag>
          </div>
          <div class="check-item">
            <span>参数有效性</span>
            <el-tag :type="preCheckResult.paramsValid ? 'success' : 'danger'" size="small">
              {{ preCheckResult.paramsValid ? '有效' : '无效' }}
            </el-tag>
          </div>
          <div class="check-item">
            <span>时间周期</span>
            <el-tag :type="preCheckResult.cycleAvailable ? 'success' : 'warning'" size="small">
              {{ preCheckResult.cycleAvailable ? '可用' : '不可用' }}
            </el-tag>
          </div>
          <div class="check-item">
            <span>巡检范围</span>
            <el-tag :type="preCheckResult.scopeAvailable ? 'success' : 'warning'" size="small">
              {{ preCheckResult.scopeAvailable ? '可用' : '不可用' }}
            </el-tag>
          </div>
        </div>
      </div>
      <el-form :model="createForm" label-width="100px" class="create-form">
        <el-form-item label="巡检周期" required>
          <el-select v-model="createForm.inspectionCycle" class="full-width" placeholder="请选择巡检周期">
            <el-option
              v-for="(label, key) in INSPECTION_CYCLE_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="巡检范围" required>
          <el-select v-model="createForm.inspectionScopes" multiple class="full-width" placeholder="请选择巡检范围">
            <el-option
              v-for="(label, key) in INSPECTION_SCOPE_LABELS"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="createForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            class="focus-highlight-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handlePreCheck">前置校验</el-button>
        <el-button
          v-if="preCheckResult && preCheckResult.canCreate"
          type="success"
          :loading="createLoading"
          @click="submitCreate"
        >
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <BatchProcessDialog
      v-model:visible="batchDialogVisible"
      :selected-rows="issueSelectedRows"
      @confirm="handleBatchConfirm"
    />

    <InspectionTrailDialog
      v-model:visible="trailDialogVisible"
      :inspection-id="trailInspectionId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, VideoPlay, View } from '@element-plus/icons-vue'
import FinFilter from '@/components/FinFilter/index.vue'
import FinTable from '@/components/FinTable/index.vue'
import BatchProcessDialog from './BatchProcessDialog.vue'
import InspectionTrailDialog from './InspectionTrailDialog.vue'
import {
  InspectionCycle,
  InspectionScope,
  InspectionStatus,
  ViolationLevel,
  IssueStatus,
} from '@/enums'
import {
  INSPECTION_CYCLE_LABELS,
  INSPECTION_SCOPE_LABELS,
  INSPECTION_SCOPE_COLORS,
  INSPECTION_STATUS_LABELS,
  INSPECTION_STATUS_TAG_TYPES,
  VIOLATION_LEVEL_LABELS,
  VIOLATION_LEVEL_COLORS,
  VIOLATION_LEVEL_BG_COLORS,
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_TAG_TYPES,
} from '@/constants/dictionaries'
import { usePerm } from '@/hooks/usePerm'
import {
  getBusinessInspectionList,
  getBusinessInspectionIssues,
  getBusinessInspectionStats,
  preCheckBusinessInspection,
  createBusinessInspection,
  startBusinessInspection,
  getBusinessInspectionLogs,
} from '@/api/businessInspection'
import type {
  IBusinessInspection,
  IBusinessInspectionIssue,
  IInspectionStats,
  IInspectionListParams,
  IIssueListParams,
} from '@/types/api'

const { hasPerm } = usePerm()

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN')
}

const activeTab = ref('inspections')
const scanning = ref(false)

const inspectionLoading = ref(false)
const inspectionTableData = ref<IBusinessInspection[]>([])
const inspectionPagination = reactive({ page: 1, pageSize: 10, total: 0 })
const inspectionSearchParams = reactive<IInspectionListParams>({})

const issueLoading = ref(false)
const issueTableData = ref<IBusinessInspectionIssue[]>([])
const issueSelectedRows = ref<IBusinessInspectionIssue[]>([])
const issuePagination = reactive({ page: 1, pageSize: 10, total: 0 })
const issueSearchParams = reactive<IIssueListParams>({})

const stats = ref<IInspectionStats>({} as IInspectionStats)

const createDialogVisible = ref(false)
const createLoading = ref(false)
const preCheckResult = ref<{
  canCreate: boolean
  permissionValid: boolean
  paramsValid: boolean
  cycleAvailable: boolean
  scopeAvailable: boolean
  messages: string[]
  warnings: string[]
} | null>(null)
const createForm = reactive({
  inspectionCycle: '' as string,
  inspectionScopes: [] as string[],
  remark: '',
})

const batchDialogVisible = ref(false)
const trailDialogVisible = ref(false)
const trailInspectionId = ref<number | null>(null)

const inspectionFilterConfig = [
  { prop: 'inspectionNo', label: '巡检编号', type: 'input', placeholder: '请输入巡检编号' },
  {
    prop: 'inspectionCycle',
    label: '巡检周期',
    type: 'select',
    options: Object.entries(INSPECTION_CYCLE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'inspectionStatus',
    label: '巡检状态',
    type: 'select',
    options: Object.entries(INSPECTION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'inspectionScope',
    label: '巡检范围',
    type: 'select',
    options: Object.entries(INSPECTION_SCOPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  { prop: 'dateRange', label: '日期范围', type: 'daterange', advanced: true },
]

const issueFilterConfig = [
  { prop: 'issueNo', label: '问题编号', type: 'input', placeholder: '请输入问题编号' },
  {
    prop: 'scope',
    label: '业务范围',
    type: 'select',
    options: Object.entries(INSPECTION_SCOPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'violationLevel',
    label: '违规等级',
    type: 'select',
    options: Object.entries(VIOLATION_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
  },
  {
    prop: 'issueStatus',
    label: '问题状态',
    type: 'select',
    options: Object.entries(ISSUE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  },
  { prop: 'businessNo', label: '业务编号', type: 'input', placeholder: '请输入业务编号', advanced: true },
]

const inspectionTableColumns = [
  { prop: 'inspectionNo', label: '巡检编号', minWidth: 140, fixed: 'left' },
  { prop: 'inspectionCycle', label: '巡检周期', width: 100, slot: 'inspectionCycle' },
  { prop: 'inspectionScopes', label: '巡检范围', minWidth: 160, slot: 'inspectionScopes' },
  { prop: 'inspectionStatus', label: '巡检状态', width: 110, slot: 'inspectionStatus' },
  { prop: 'totalScanned', label: '扫描总数', width: 100, slot: 'totalScanned', align: 'right' },
  { prop: 'totalIssues', label: '违规数', width: 90, slot: 'totalIssues', align: 'right' },
  { prop: 'severeCount', label: '严重数', width: 90, slot: 'severeCount', align: 'right' },
  { prop: 'coverageScore', label: '覆盖率', width: 90, slot: 'coverageScore', align: 'right' },
  { prop: 'accuracyScore', label: '准确率', width: 90, slot: 'accuracyScore', align: 'right' },
  { prop: 'operatorName', label: '操作人', width: 90 },
  { prop: 'action', label: '操作', width: 160, fixed: 'right', slot: 'action' },
]

const issueTableColumns = [
  { prop: 'issueNo', label: '问题编号', minWidth: 140, fixed: 'left' },
  { prop: 'scope', label: '业务范围', width: 100, slot: 'scope' },
  { prop: 'violationLevel', label: '违规等级', width: 100, slot: 'violationLevel' },
  { prop: 'issueStatus', label: '问题状态', width: 100, slot: 'issueStatus' },
  { prop: 'businessNo', label: '业务编号', minWidth: 130 },
  { prop: 'ruleName', label: '规则名称', minWidth: 120 },
  { prop: 'description', label: '问题描述', minWidth: 160 },
  { prop: 'actualValue', label: '实际值', width: 100 },
  { prop: 'expectedValue', label: '期望值', width: 100 },
  { prop: 'processedBy', label: '处理人', width: 90 },
  { prop: 'action', label: '操作', width: 200, fixed: 'right', slot: 'action' },
]

function getInspectionCycleLabel(cycle: string): string {
  return (INSPECTION_CYCLE_LABELS as any)[cycle] || cycle
}

function getInspectionScopeLabel(scope: string): string {
  return (INSPECTION_SCOPE_LABELS as any)[scope] || scope
}

function getInspectionScopeColor(scope: string): string {
  return (INSPECTION_SCOPE_COLORS as any)[scope] || '#909399'
}

function getInspectionScopeBgColor(scope: string): string {
  const color = getInspectionScopeColor(scope)
  return color + '1A'
}

function getInspectionStatusLabel(status: string): string {
  return (INSPECTION_STATUS_LABELS as any)[status] || status
}

function getInspectionStatusTagType(status: string): string {
  return (INSPECTION_STATUS_TAG_TYPES as any)[status] || 'info'
}

function getViolationLevelLabel(level: string): string {
  return (VIOLATION_LEVEL_LABELS as any)[level] || level
}

function getViolationLevelColor(level: string): string {
  return (VIOLATION_LEVEL_COLORS as any)[level] || '#909399'
}

function getViolationLevelBgColor(level: string): string {
  return (VIOLATION_LEVEL_BG_COLORS as any)[level] || 'rgba(144,147,153,0.1)'
}

function getIssueStatusLabel(status: string): string {
  return (ISSUE_STATUS_LABELS as any)[status] || status
}

function getIssueStatusTagType(status: string): string {
  return (ISSUE_STATUS_TAG_TYPES as any)[status] || 'info'
}

function getInspectionRowClassName({ row }: { row: IBusinessInspection }): string {
  if (row.inspectionStatus === InspectionStatus.RUNNING) return 'row-running'
  if (row.inspectionStatus === InspectionStatus.FAILED) return 'row-failed'
  return ''
}

function getIssueRowClassName({ row }: { row: IBusinessInspectionIssue }): string {
  const classes: string[] = []
  if (issueSelectedRows.value.some(r => r.id === row.id)) classes.push('selected-row')
  if (row.violationLevel === ViolationLevel.SEVERE && row.issueStatus === IssueStatus.PENDING) {
    classes.push('row-severe-pending')
  }
  if (row.issueStatus === IssueStatus.RECTIFIED) classes.push('row-rectified')
  return classes.join(' ')
}

async function fetchInspections() {
  inspectionLoading.value = true
  try {
    const params: IInspectionListParams = {
      page: inspectionPagination.page,
      pageSize: inspectionPagination.pageSize,
      ...inspectionSearchParams,
    }
    const res: any = await getBusinessInspectionList(params)
    inspectionTableData.value = res.data.list
    inspectionPagination.total = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取巡检列表失败')
  } finally {
    inspectionLoading.value = false
  }
}

async function fetchIssues() {
  issueLoading.value = true
  try {
    const params: IIssueListParams = {
      page: issuePagination.page,
      pageSize: issuePagination.pageSize,
      ...issueSearchParams,
    }
    const res: any = await getBusinessInspectionIssues(params)
    issueTableData.value = res.data.list
    issuePagination.total = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取违规问题失败')
  } finally {
    issueLoading.value = false
  }
}

async function fetchStats() {
  try {
    const res: any = await getBusinessInspectionStats()
    stats.value = res.data
  } catch { /* ignore */ }
}

function handleInspectionSearch(params: any) {
  Object.assign(inspectionSearchParams, params)
  inspectionPagination.page = 1
  fetchInspections()
}

function handleInspectionReset() {
  Object.keys(inspectionSearchParams).forEach(k => delete (inspectionSearchParams as any)[k])
  inspectionPagination.page = 1
  fetchInspections()
}

function handleInspectionPageChange(page: number) {
  inspectionPagination.page = page
  fetchInspections()
}

function handleInspectionSizeChange(size: number) {
  inspectionPagination.pageSize = size
  inspectionPagination.page = 1
  fetchInspections()
}

function handleIssueSearch(params: any) {
  Object.assign(issueSearchParams, params)
  issuePagination.page = 1
  fetchIssues()
}

function handleIssueReset() {
  Object.keys(issueSearchParams).forEach(k => delete (issueSearchParams as any)[k])
  issuePagination.page = 1
  fetchIssues()
}

function handleIssuePageChange(page: number) {
  issuePagination.page = page
  fetchIssues()
}

function handleIssueSizeChange(size: number) {
  issuePagination.pageSize = size
  issuePagination.page = 1
  fetchIssues()
}

function handleIssueSelectionChange(rows: any[]) {
  issueSelectedRows.value = rows
}

function handleCreateInspection() {
  createForm.inspectionCycle = ''
  createForm.inspectionScopes = []
  createForm.remark = ''
  preCheckResult.value = null
  createDialogVisible.value = true
}

async function handlePreCheck() {
  if (!createForm.inspectionCycle) {
    ElMessage.warning('请选择巡检周期')
    return
  }
  if (createForm.inspectionScopes.length === 0) {
    ElMessage.warning('请选择巡检范围')
    return
  }
  createLoading.value = true
  try {
    const res: any = await preCheckBusinessInspection({
      inspectionCycle: createForm.inspectionCycle,
      inspectionScopes: createForm.inspectionScopes,
    })
    preCheckResult.value = res.data
    if (!res.data.canCreate) {
      ElMessage.warning(res.data.messages.join('; ') || '参数校验不通过，无法创建巡检')
    } else {
      ElMessage.success('前置校验通过，可以创建巡检')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '前置校验失败')
  } finally {
    createLoading.value = false
  }
}

async function submitCreate() {
  if (!preCheckResult.value?.canCreate) {
    ElMessage.warning('请先通过前置校验')
    return
  }
  createLoading.value = true
  try {
    const res: any = await createBusinessInspection({
      inspectionCycle: createForm.inspectionCycle,
      inspectionScopes: createForm.inspectionScopes,
      remark: createForm.remark,
    })
    if (res.code === 0) {
      ElMessage.success('巡检任务已创建，即将开始扫描')
      createDialogVisible.value = false
      scanning.value = true
      fetchInspections()
      fetchStats()
      try {
        await startBusinessInspection(res.data.id)
        ElMessage.success('巡检扫描已完成，报告已生成')
      } catch {
        ElMessage.warning('巡检扫描异常，请稍后查看')
      } finally {
        scanning.value = false
        fetchInspections()
        fetchIssues()
        fetchStats()
      }
    } else {
      ElMessage.error(res.message)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '创建巡检失败')
  } finally {
    createLoading.value = false
  }
}

function handleViewInspection(row: IBusinessInspection) {
  trailInspectionId.value = row.id
  trailDialogVisible.value = true
}

function handleViewTrail(row: any) {
  trailInspectionId.value = row.id
  trailDialogVisible.value = true
}

async function handleRectifyIssue(row: IBusinessInspectionIssue) {
  try {
    await ElMessageBox.confirm('确认该违规问题已整改？', '整改确认', { type: 'warning' })
    const res: any = await preCheckBusinessInspection({ issueId: row.id, action: 'rectify' })
    if (res.code === 0) {
      ElMessage.success('问题已标记为已整改')
      fetchIssues()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

async function handleIgnoreIssue(row: IBusinessInspectionIssue) {
  try {
    await ElMessageBox.confirm('确认忽略该违规问题？忽略后将被归档。', '忽略确认', { type: 'warning' })
    const res: any = await preCheckBusinessInspection({ issueId: row.id, action: 'ignore' })
    if (res.code === 0) {
      ElMessage.success('问题已忽略并归档')
      fetchIssues()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

async function handleReportIssue(row: IBusinessInspectionIssue) {
  try {
    await ElMessageBox.confirm('确认上报该严重违规问题？', '上报确认', { type: 'error' })
    const res: any = await preCheckBusinessInspection({ issueId: row.id, action: 'report' })
    if (res.code === 0) {
      ElMessage.success('严重违规问题已上报')
      fetchIssues()
      fetchStats()
    } else {
      ElMessage.error(res.message)
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

function handleBatchProcess() {
  if (issueSelectedRows.value.length === 0) return
  batchDialogVisible.value = true
}

async function handleBatchConfirm(result: any) {
  if (result && result.success > 0) {
    ElMessage.success(`批量处理完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
    issueSelectedRows.value = []
    batchDialogVisible.value = false
    fetchIssues()
    fetchStats()
  }
}

let statsTimer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  fetchInspections()
  fetchIssues()
  fetchStats()
  statsTimer = setInterval(fetchStats, 60000)
})

onUnmounted(() => {
  if (statsTimer) {
    clearInterval(statsTimer)
    statsTimer = null
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/mixins' as *;

.business-inspection-page {
  padding: 20px;

  .page-header {
    @include flex-between;
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--fin-text-primary);
      margin: 0;
    }

    .toolbar {
      display: flex;
      gap: 8px;
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 12px;
    margin-bottom: 16px;

    .stat-card {
      padding: 16px;
      background: #fff;
      border-radius: 8px;
      border: 2px solid transparent;
      cursor: default;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      text-align: center;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      }

      &.active {
        border-color: var(--fin-primary);
        background: linear-gradient(135deg, rgba(52, 152, 219, 0.08), rgba(52, 152, 219, 0.02));
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--fin-text-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 12px;
        color: var(--fin-text-secondary);
        margin-top: 4px;
      }

      &--running .stat-value {
        color: #E6A23C;
      }

      &--completed .stat-value {
        color: #27AE60;
      }

      &--issues .stat-value {
        color: #E67E22;
      }

      &--pending .stat-value {
        color: #409EFF;
      }

      &--severe .stat-value {
        color: #C0392B;
      }
    }
  }

  .compliance-info-bar {
    display: flex;
    gap: 30px;
    padding: 12px 20px;
    margin-bottom: 16px;
    background: linear-gradient(90deg, rgba(52, 152, 219, 0.08), rgba(39, 174, 96, 0.08));
    border-radius: 8px;

    strong {
      color: #27AE60;
      font-size: 16px;
    }
  }

  .inspection-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
  }

  .tab-panel {
    min-height: 300px;
  }

  .cycle-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
    background: rgba(64, 158, 255, 0.1);
    color: #409EFF;
  }

  .scope-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .scope-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
  }

  .scope-more {
    font-size: 12px;
    color: var(--fin-text-secondary);
  }

  .status-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    &.running-pulse {
      animation: pulse-running 2s ease-in-out infinite;
    }
  }

  @keyframes pulse-running {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .number-cell {
    font-variant-numeric: tabular-nums;

    &.text-severe {
      color: #C0392B;
      font-weight: 600;
    }
  }

  .score-cell {
    font-variant-numeric: tabular-nums;
    color: var(--fin-text-primary);
  }

  .violation-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;

    &.severe-pulse-badge {
      animation: pulse-severe-badge 1.5s ease-in-out infinite;
    }
  }

  @keyframes pulse-severe-badge {
    0%, 100% { box-shadow: 0 0 0 0 rgba(192, 57, 43, 0.4); }
    50% { box-shadow: 0 0 8px 2px rgba(192, 57, 43, 0.2); }
  }

  .severe-pulse {
    animation: pulse-severe 1.5s ease-in-out infinite;
  }

  @keyframes pulse-severe {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .action-btns {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .precheck-result {
    margin-bottom: 16px;

    .check-alert {
      margin-bottom: 12px;
    }

    .check-msg {
      font-size: 13px;
      line-height: 1.8;
    }

    .check-warn {
      font-size: 13px;
      line-height: 1.8;
    }

    .check-items {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 16px;

      .check-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        background: #FAFBFD;
        border-radius: 6px;
      }
    }
  }

  .create-form {
    .full-width {
      width: 100%;
    }
  }
}

.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.3s ease;
}

.slide-panel-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-panel-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

.fade-in-dialog {
  :deep(.el-dialog) {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}

.focus-highlight-input {
  :deep(.el-input__wrapper) {
    transition: box-shadow 0.3s ease, border-color 0.3s ease;

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.25);
      border-color: var(--fin-primary, #3498DB);
    }
  }

  :deep(.el-textarea__inner) {
    transition: box-shadow 0.3s ease, border-color 0.3s ease;

    &:focus {
      box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.25);
      border-color: var(--fin-primary, #3498DB);
      outline: none;
    }
  }
}

:deep(.el-table__row:nth-child(even) td) {
  background-color: #FAFBFD;
}

:deep(.el-table__row.selected-row td) {
  background-color: rgba(52, 152, 219, 0.08) !important;
}

:deep(.el-table__row.row-running td) {
  background-color: rgba(230, 162, 60, 0.06) !important;
}

:deep(.el-table__row.row-failed td) {
  background-color: rgba(245, 108, 108, 0.06) !important;
}

:deep(.el-table__row.row-severe-pending td) {
  background-color: rgba(192, 57, 43, 0.06) !important;
}

:deep(.el-table__row.row-rectified td) {
  background-color: rgba(39, 174, 96, 0.04) !important;
}
</style>
