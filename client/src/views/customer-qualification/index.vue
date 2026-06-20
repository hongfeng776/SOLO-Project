<template>
  <div class="customer-qualification-page">
    <div class="page-header">
      <h2 class="page-title">客户资质审核</h2>
      <div class="toolbar">
        <el-button type="warning" @click="handleCheckExpireWarning">
          <el-icon><Bell /></el-icon>
          刷新到期提醒
        </el-button>
        <el-button
          v-if="hasPerm('compliance:qualification:batch')"
          type="primary"
          :disabled="selectedRows.length === 0"
          @click="handleBatchOperation"
        >
          <el-icon><Select /></el-icon>
          批量操作 ({{ selectedRows.length }})
        </el-button>
      </div>
    </div>

    <div class="stats-cards">
      <div class="stat-card" :class="{ active: activeStatusFilter === '' }" @click="activeStatusFilter = ''; fetchData()">
        <div class="stat-value">{{ stats.totalPending || 0 }}</div>
        <div class="stat-label">待审核</div>
      </div>
      <div class="stat-card stat-card--approved" :class="{ active: activeStatusFilter === 'approved' }" @click="activeStatusFilter = 'approved'; fetchData()">
        <div class="stat-value">{{ stats.totalApproved || 0 }}</div>
        <div class="stat-label">已通过</div>
      </div>
      <div class="stat-card stat-card--rejected" :class="{ active: activeStatusFilter === 'rejected' }" @click="activeStatusFilter = 'rejected'; fetchData()">
        <div class="stat-value">{{ stats.totalRejected || 0 }}</div>
        <div class="stat-label">已驳回</div>
      </div>
      <div class="stat-card stat-card--expire-soon" :class="{ active: activeStatusFilter === 'expire_soon' }" @click="activeStatusFilter = 'expire_soon'; fetchData()">
        <div class="stat-value expire-pulse">{{ stats.totalExpireSoon || 0 }}</div>
        <div class="stat-label">即将过期</div>
      </div>
      <div class="stat-card stat-card--expired" :class="{ active: activeStatusFilter === 'expired' }" @click="activeStatusFilter = 'expired'; fetchData()">
        <div class="stat-value">{{ stats.totalExpired || 0 }}</div>
        <div class="stat-label">已过期</div>
      </div>
      <div class="stat-card stat-card--revoked" :class="{ active: activeStatusFilter === 'revoked' }" @click="activeStatusFilter = 'revoked'; fetchData()">
        <div class="stat-value">{{ stats.totalRevoked || 0 }}</div>
        <div class="stat-label">已撤销</div>
      </div>
    </div>

    <div class="compliance-info-bar">
      <span>合规平均分：<strong>{{ stats.avgComplianceScore || 0 }}</strong></span>
      <span>真实性通过率：<strong>{{ stats.authenticityPassRate || 0 }}%</strong></span>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :selection="true"
      :show-index="true"
      :row-class-name="getRowClassName"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #qualificationStatus="{ row }">
        <div class="status-cell" :class="{ 'expire-pulse': row.qualificationStatus === 'expire_soon' }">
          <el-tag :type="getQualificationStatusTagType(row.qualificationStatus)" effect="light" size="small">
            {{ getQualificationStatusLabel(row.qualificationStatus) }}
          </el-tag>
          <el-tag v-if="row.qualificationStatus === 'expire_soon'" type="warning" effect="dark" size="small" class="expire-tag">
            7日内到期
          </el-tag>
        </div>
      </template>

      <template #qualificationLevel="{ row }">
        <span
          class="level-badge"
          :style="{ backgroundColor: getLevelBgColor(row.qualificationLevel), color: getLevelColor(row.qualificationLevel) }"
        >
          {{ getLevelLabel(row.qualificationLevel) }}
        </span>
      </template>

      <template #reviewType="{ row }">
        <span :class="row.reviewType === 'new_customer' ? 'review-new' : 'review-recheck'">
          {{ row.reviewType === 'new_customer' ? '入网审核' : '资质复核' }}
        </span>
      </template>

      <template #documents="{ row }">
        <div class="doc-summary">
          <el-tooltip v-for="doc in (row.documents || []).slice(0, 3)" :key="doc.type" :content="getDocLabel(doc.type) + (doc.verified ? '（已验证）' : '（未验证）')" placement="top">
            <span class="doc-chip" :class="{ 'doc-chip--invalid': !doc.verified }">{{ getDocLabel(doc.type).substring(0, 2) }}</span>
          </el-tooltip>
          <span v-if="(row.documents || []).length > 3" class="doc-more">+{{ (row.documents || []).length - 3 }}</span>
        </div>
      </template>

      <template #expiryDate="{ row }">
        <span :class="{ 'date-expire-soon': isExpireSoon(row.expiryDate), 'date-expired': isExpired(row.expiryDate) }">
          {{ formatDate(row.expiryDate) }}
        </span>
      </template>

      <template #tradingAllowed="{ row }">
        <el-tag :type="row.tradingAllowed ? 'success' : 'info'" effect="light" size="small">
          {{ row.tradingAllowed ? '已开通' : '未开通' }}
        </el-tag>
      </template>

      <template #action="{ row }">
        <div class="action-btns">
          <el-button
            v-if="row.qualificationStatus === 'pending'"
            link type="primary" size="small" class="action-btn action-btn--approve"
            @click="handleApprove(row)"
          >通过</el-button>
          <el-button
            v-if="row.qualificationStatus === 'pending'"
            link type="danger" size="small" class="action-btn action-btn--reject"
            @click="handleReject(row)"
          >驳回</el-button>
          <el-button
            v-if="row.qualificationStatus === 'approved' || row.qualificationStatus === 'expire_soon' || row.qualificationStatus === 'expired'"
            link type="warning" size="small"
            @click="handleInitiateRecheck(row)"
          >发起复核</el-button>
          <el-button link size="small" @click="handleViewTrail(row)">溯源</el-button>
        </div>
      </template>
    </FinTable>

    <el-dialog
      v-model="preCheckDialogVisible"
      title="前置校验结果"
      width="560px"
      class="fade-in-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="currentPreCheck" class="pre-check-content">
        <div class="pre-check-score">
          资料完整度：<el-progress :percentage="currentPreCheck.documentIntegrityScore" :status="currentPreCheck.documentIntegrityScore >= 80 ? 'success' : 'warning'" />
        </div>
        <el-alert v-if="currentPreCheck.messages.length > 0" type="error" :closable="false" class="check-alert">
          <template #title>
            <div>
              <div v-for="(msg, idx) in currentPreCheck.messages" :key="idx" class="check-msg">× {{ msg }}</div>
            </div>
          </template>
        </el-alert>
        <el-alert v-if="currentPreCheck.warnings.length > 0" type="warning" :closable="false" class="check-alert">
          <template #title>
            <div>
              <div v-for="(w, idx) in currentPreCheck.warnings" :key="idx" class="check-warn">! {{ w }}</div>
            </div>
          </template>
        </el-alert>
        <div class="check-items">
          <div class="check-item">
            <span>权限校验</span>
            <el-tag :type="currentPreCheck.permissionValid ? 'success' : 'danger'" size="small">{{ currentPreCheck.permissionValid ? '通过' : '不通过' }}</el-tag>
          </div>
          <div class="check-item">
            <span>资料完整性</span>
            <el-tag :type="currentPreCheck.documentsComplete ? 'success' : 'warning'" size="small">{{ currentPreCheck.documentsComplete ? '完整' : '缺失' }}</el-tag>
          </div>
          <div class="check-item">
            <span>资料有效期</span>
            <el-tag :type="currentPreCheck.documentsValid ? 'success' : 'warning'" size="small">{{ currentPreCheck.documentsValid ? '有效' : '过期' }}</el-tag>
          </div>
          <div class="check-item">
            <span>真实性校验</span>
            <el-tag :type="currentPreCheck.documentsAuthentic ? 'success' : 'danger'" size="small">{{ currentPreCheck.documentsAuthentic ? '通过' : '疑似造假' }}</el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="preCheckDialogVisible = false">取消</el-button>
        <el-button v-if="pendingAction && currentPreCheck && currentPreCheck.canReview" type="primary" @click="confirmPendingAction">
          {{ pendingAction === 'approve' ? '继续审核通过' : '继续审核驳回' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="approveDialogVisible"
      title="审核通过"
      width="520px"
      class="fade-in-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="客户姓名">
          <span>{{ currentRow?.customerName }}</span>
        </el-form-item>
        <el-form-item label="资质等级">
          <el-select v-model="approveForm.qualificationLevel" class="full-width">
            <el-option v-for="(label, key) in QUALIFICATION_LEVEL_LABELS" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input
            v-model="approveForm.reviewOpinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
            class="focus-highlight-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="submitApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="rejectDialogVisible"
      title="审核驳回"
      width="560px"
      class="fade-in-dialog"
      :close-on-click-modal="false"
    >
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="客户姓名">
          <span>{{ currentRow?.customerName }}</span>
        </el-form-item>
        <el-form-item label="问题类型" required>
          <el-checkbox-group v-model="rejectForm.issueTypes">
            <el-checkbox v-for="(label, key) in QUALIFICATION_ISSUE_TYPE_LABELS" :key="key" :value="key" :label="key">{{ label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="具体原因">
          <el-input
            v-model="rejectForm.rejectReasons"
            type="textarea"
            :rows="3"
            placeholder="请输入具体违规原因（多条以分号分隔）"
            class="focus-highlight-input"
          />
        </el-form-item>
        <el-form-item label="审核意见" required>
          <el-input
            v-model="rejectForm.reviewOpinion"
            type="textarea"
            :rows="3"
            placeholder="请输入审核意见"
            class="focus-highlight-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="danger" :loading="submitLoading" @click="submitReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <BatchReviewDialog
      v-model="batchDialogVisible"
      :selected-ids="selectedIds"
      @success="fetchData"
    />

    <QualificationTrailDialog
      v-model="trailDialogVisible"
      :qualification-id="currentQualificationId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Select } from '@element-plus/icons-vue'
import { usePerm } from '@/hooks/usePerm'
import FinFilter from '@/components/FinFilter/index.vue'
import FinTable from '@/components/FinTable/index.vue'
import BatchReviewDialog from './BatchReviewDialog.vue'
import QualificationTrailDialog from './QualificationTrailDialog.vue'
import {
  getCustomerQualificationList,
  getCustomerQualificationStats,
  preCheckCustomerQualification,
  approveCustomerQualification,
  rejectCustomerQualification,
  initiateRecheckCustomerQualification,
  checkExpireWarningCustomerQualification,
} from '@/api/customerQualification'
import {
  QualificationStatus,
  QualificationLevel,
  QualificationDocumentType,
} from '@/enums'
import {
  QUALIFICATION_STATUS_LABELS,
  QUALIFICATION_STATUS_TAG_TYPES,
  QUALIFICATION_LEVEL_LABELS,
  QUALIFICATION_LEVEL_COLORS,
  QUALIFICATION_DOCUMENT_TYPE_LABELS,
  QUALIFICATION_ISSUE_TYPE_LABELS,
  QUALIFICATION_EXPIRE_WARNING_DAYS,
} from '@/constants/dictionaries'
import type {
  ICustomerQualification,
  ICustomerQualificationPreCheckResult,
  IQualificationStats,
  IQualificationListParams,
} from '@/types/api'

const { hasPerm } = usePerm()

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<ICustomerQualification[]>([])
const stats = ref<IQualificationStats>({} as IQualificationStats)
const selectedRows = ref<ICustomerQualification[]>([])
const selectedIds = ref<number[]>([])
const activeStatusFilter = ref('')

const pagination = reactive({ page: 1, pageSize: 10, total: 0 })
const searchParams = reactive<IQualificationListParams>({})

const preCheckDialogVisible = ref(false)
const approveDialogVisible = ref(false)
const rejectDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const trailDialogVisible = ref(false)
const currentRow = ref<ICustomerQualification | null>(null)
const currentQualificationId = ref<number | null>(null)
const currentPreCheck = ref<ICustomerQualificationPreCheckResult | null>(null)
const pendingAction = ref<'approve' | 'reject' | null>(null)

const approveForm = reactive({ qualificationLevel: QualificationLevel.BASIC, reviewOpinion: '' })
const rejectForm = reactive({ issueTypes: [] as string[], rejectReasons: '', reviewOpinion: '' })

const filterConfig = [
  { prop: 'qualificationNo', label: '资质编号', type: 'input', placeholder: '请输入资质编号' },
  { prop: 'customerName', label: '客户姓名', type: 'input', placeholder: '请输入客户姓名' },
  { prop: 'customerType', label: '客户类型', type: 'select', options: [{ label: '个人客户', value: 'individual' }, { label: '机构客户', value: 'institution' }] },
  { prop: 'reviewType', label: '审核类型', type: 'select', options: [{ label: '入网审核', value: 'new_customer' }, { label: '资质复核', value: 'recheck' }] },
  { prop: 'qualificationLevel', label: '资质等级', type: 'select', options: Object.entries(QUALIFICATION_LEVEL_LABELS).map(([value, label]) => ({ label, value })) },
]

const tableColumns = [
  { prop: 'qualificationNo', label: '资质编号', width: 180 },
  { prop: 'customerName', label: '客户姓名', width: 120 },
  { prop: 'customerType', label: '客户类型', width: 100, formatter: (row: any) => row.customerType === 'institution' ? '机构' : '个人' },
  { prop: 'reviewType', label: '审核类型', width: 110, slot: 'reviewType' },
  { prop: 'qualificationLevel', label: '资质等级', width: 100, slot: 'qualificationLevel' },
  { prop: 'documents', label: '资质资料', width: 180, slot: 'documents' },
  { prop: 'qualificationStatus', label: '审核状态', width: 150, slot: 'qualificationStatus' },
  { prop: 'tradingAllowed', label: '交易权限', width: 100, slot: 'tradingAllowed' },
  { prop: 'expiryDate', label: '到期日期', width: 130, slot: 'expiryDate' },
  { prop: 'reviewerName', label: '审核人', width: 100 },
  { prop: 'action', label: '操作', width: 240, fixed: 'right', slot: 'action' },
]

function getQualificationStatusLabel(status: string) {
  return (QUALIFICATION_STATUS_LABELS as any)[status] || status
}
function getQualificationStatusTagType(status: string) {
  return (QUALIFICATION_STATUS_TAG_TYPES as any)[status] || 'info'
}
function getLevelLabel(level: string) {
  return (QUALIFICATION_LEVEL_LABELS as any)[level] || level
}
function getLevelColor(level: string) {
  return (QUALIFICATION_LEVEL_COLORS as any)[level] || '#999'
}
function getLevelBgColor(level: string) {
  const color = getLevelColor(level)
  return color + '22'
}
function getDocLabel(type: string) {
  return (QUALIFICATION_DOCUMENT_TYPE_LABELS as any)[type] || type
}

function formatDate(d: any) {
  if (!d) return '-'
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function isExpireSoon(d: any) {
  if (!d) return false
  const diff = new Date(d).getTime() - Date.now()
  return diff > 0 && diff <= QUALIFICATION_EXPIRE_WARNING_DAYS * 24 * 60 * 60 * 1000
}
function isExpired(d: any) {
  if (!d) return false
  return new Date(d).getTime() < Date.now()
}

function getRowClassName({ row }: any) {
  if (row.qualificationStatus === 'expire_soon') return 'row-expire-soon'
  if (row.qualificationStatus === 'expired') return 'row-expired'
  return ''
}

async function fetchData() {
  loading.value = true
  try {
    const params: IQualificationListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams,
    }
    if (activeStatusFilter.value && activeStatusFilter.value !== 'timeout') {
      params.qualificationStatus = activeStatusFilter.value as any
    }
    const res: any = await getCustomerQualificationList(params)
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

async function fetchStats() {
  try {
    const res: any = await getCustomerQualificationStats()
    stats.value = res.data
  } catch (e) { /* ignore */ }
}

function handleSearch(params: any) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(k => delete (searchParams as any)[k])
  pagination.page = 1
  fetchData()
}

function handleSelectionChange(rows: any[]) {
  selectedRows.value = rows
  selectedIds.value = rows.map(r => r.id)
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

async function handleApprove(row: ICustomerQualification) {
  currentRow.value = row
  pendingAction.value = 'approve'
  try {
    const res: any = await preCheckCustomerQualification(row.id)
    currentPreCheck.value = res.data
    preCheckDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '前置校验失败')
  }
}

async function handleReject(row: ICustomerQualification) {
  currentRow.value = row
  pendingAction.value = 'reject'
  try {
    const res: any = await preCheckCustomerQualification(row.id)
    currentPreCheck.value = res.data
    preCheckDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error(e.message || '前置校验失败')
  }
}

function confirmPendingAction() {
  preCheckDialogVisible.value = false
  if (pendingAction.value === 'approve') {
    approveForm.qualificationLevel = currentRow.value?.qualificationLevel || QualificationLevel.BASIC
    approveForm.reviewOpinion = ''
    approveDialogVisible.value = true
  } else if (pendingAction.value === 'reject') {
    rejectForm.issueTypes = currentPreCheck.value?.expiredDocuments?.length ? [...currentPreCheck.value.expiredDocuments.map(d => 'expired'), ...currentPreCheck.value.missingDocuments.map(() => 'missing')] : []
    rejectForm.rejectReasons = ''
    rejectForm.reviewOpinion = ''
    rejectDialogVisible.value = true
  }
  pendingAction.value = null
}

async function submitApprove() {
  if (!currentRow.value) return
  submitLoading.value = true
  try {
    await approveCustomerQualification(currentRow.value.id, {
      qualificationLevel: approveForm.qualificationLevel,
      reviewOpinion: approveForm.reviewOpinion,
    })
    ElMessage.success('审核通过成功，客户交易权限已开通')
    approveDialogVisible.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    ElMessage.error(e.message || '审核失败')
  } finally {
    submitLoading.value = false
  }
}

async function submitReject() {
  if (!currentRow.value) return
  if (rejectForm.issueTypes.length === 0) {
    ElMessage.warning('请至少选择一个问题类型')
    return
  }
  if (!rejectForm.reviewOpinion.trim()) {
    ElMessage.warning('请填写审核意见')
    return
  }
  submitLoading.value = true
  try {
    await rejectCustomerQualification(currentRow.value.id, {
      issueTypes: rejectForm.issueTypes,
      rejectReasons: rejectForm.rejectReasons ? rejectForm.rejectReasons.split(/[;；]/).map(s => s.trim()).filter(Boolean) : [],
      reviewOpinion: rejectForm.reviewOpinion,
    })
    ElMessage.success('审核驳回成功，客户交易权限已锁定')
    rejectDialogVisible.value = false
    fetchData()
    fetchStats()
  } catch (e: any) {
    ElMessage.error(e.message || '驳回失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleInitiateRecheck(row: ICustomerQualification) {
  try {
    await ElMessageBox.confirm(`确认对客户"${row.customerName}"发起资质复核？`, '发起复核', { type: 'warning' })
    await initiateRecheckCustomerQualification(row.id)
    ElMessage.success('已发起资质复核')
    fetchData()
    fetchStats()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

function handleBatchOperation() {
  if (selectedIds.value.length === 0) return
  batchDialogVisible.value = true
}

function handleViewTrail(row: ICustomerQualification) {
  currentQualificationId.value = row.id
  trailDialogVisible.value = true
}

async function handleCheckExpireWarning() {
  try {
    const res: any = await checkExpireWarningCustomerQualification()
    ElMessage.success(`已刷新：触发${res.data.warnedCount}条到期提醒，${res.data.expiredCount}条已过期`)
    fetchData()
    fetchStats()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

let statsTimer: any = null

onMounted(() => {
  fetchData()
  fetchStats()
  statsTimer = setInterval(fetchStats, 60000)
})

onUnmounted(() => {
  if (statsTimer) clearInterval(statsTimer)
})
</script>

<style lang="scss" scoped>
.customer-qualification-page {
  padding: 20px;
  .page-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
    .page-title { font-size: 20px; font-weight: 600; margin: 0; color: #2C3E50; }
    .toolbar { display: flex; gap: 10px; }
  }
  .compliance-info-bar {
    display: flex; gap: 30px; padding: 12px 20px; margin-bottom: 16px;
    background: linear-gradient(90deg, rgba(39,174,96,0.08), rgba(52,152,219,0.08));
    border-radius: 8px;
    strong { color: #27AE60; font-size: 16px; }
  }
  .stats-cards {
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; margin-bottom: 20px;
    .stat-card {
      padding: 18px; background: #fff; border-radius: 10px; cursor: pointer;
      border: 2px solid transparent; transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      &:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); border-color: var(--fin-primary, #3498DB); }
      &.active { border-color: var(--fin-primary, #3498DB); background: linear-gradient(135deg, rgba(52,152,219,0.08), rgba(52,152,219,0.02)); }
      &.stat-card--approved .stat-value { color: #27AE60; }
      &.stat-card--rejected .stat-value { color: #C0392B; }
      &.stat-card--expire-soon .stat-value { color: #E67E22; }
      &.stat-card--expired .stat-value { color: #7F8C8D; }
      &.stat-card--revoked .stat-value { color: #8E44AD; }
      .stat-value { font-size: 26px; font-weight: 700; color: var(--fin-primary, #3498DB); margin-bottom: 4px; transition: all 0.3s ease; }
      .stat-label { font-size: 13px; color: #7F8C8D; }
    }
  }
  .status-cell { display: flex; align-items: center; gap: 6px;
    .expire-tag { margin-left: 4px; }
  }
  .level-badge {
    display: inline-block; padding: 2px 10px; border-radius: 10px;
    font-size: 12px; font-weight: 500;
  }
  .review-new { color: #3498DB; font-weight: 500; }
  .review-recheck { color: #16A085; font-weight: 500; }
  .doc-summary { display: flex; align-items: center; gap: 4px; flex-wrap: wrap;
    .doc-chip {
      display: inline-flex; width: 24px; height: 24px; border-radius: 50%;
      align-items: center; justify-content: center; font-size: 11px;
      background: #E8F4FD; color: #3498DB; font-weight: 600;
      transition: transform 0.2s ease;
      &:hover { transform: scale(1.15); }
      &--invalid { background: #FDECEA; color: #C0392B; }
    }
    .doc-more { font-size: 12px; color: #7F8C8D; margin-left: 2px; }
  }
  .date-expire-soon { color: #E67E22; font-weight: 600; }
  .date-expired { color: #C0392B; text-decoration: line-through; }
  .action-btns { display: flex; gap: 4px; flex-wrap: wrap;
    .action-btn {
      transition: all 0.15s ease;
      &--approve:active { transform: translateY(1px); color: #1E8449; }
      &--reject:active { transform: translateY(1px); color: #922B21; }
    }
  }
  .pre-check-content {
    .pre-check-score { margin-bottom: 16px; }
    .check-alert { margin-bottom: 12px; }
    .check-msg { font-size: 13px; line-height: 1.8; }
    .check-warn { font-size: 13px; line-height: 1.8; }
    .check-items {
      display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px;
      .check-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #FAFBFD; border-radius: 6px; }
    }
  }
  .full-width { width: 100%; }
  .expire-pulse {
    animation: pulse-expire 1.5s ease-in-out infinite;
  }
  @keyframes pulse-expire {
    0%, 100% { text-shadow: 0 0 0 rgba(230,126,34,0); }
    50% { text-shadow: 0 0 8px rgba(230,126,34,0.6); }
  }
}
:deep(.el-table__row:nth-child(even) td) {
  background-color: #FAFBFD;
}
:deep(.el-table__row.row-expire-soon td) {
  background-color: rgba(230,126,34,0.06) !important;
}
:deep(.el-table__row.row-expired td) {
  background-color: rgba(192,57,43,0.04) !important;
}
.fade-in-dialog {
  :deep(.el-dialog) {
    animation: fadeIn 0.3s ease-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
}
.status-transition {
  transition: all 0.3s ease;
}
.focus-highlight-input {
  :deep(.el-input__wrapper) {
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
    &.is-focus {
      box-shadow: 0 0 0 2px rgba(52,152,219,0.25);
      border-color: var(--fin-primary, #3498DB);
    }
  }
  :deep(.el-textarea__inner) {
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
    &:focus {
      box-shadow: 0 0 0 2px rgba(52,152,219,0.25);
      border-color: var(--fin-primary, #3498DB);
      outline: none;
    }
  }
}
</style>
