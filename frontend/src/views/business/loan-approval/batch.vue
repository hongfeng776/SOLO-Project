<template>
  <div class="ccb-loan-approval-batch">
    <CcbPageHeader
      title="批量审批"
      description="根据贷款金额、风险等级执行差异化批量审批操作"
      icon="Select"
    />

    <el-row :gutter="16" class="filter-bar">
      <el-col :span="6">
        <div class="filter-card pending" :class="{ active: filterStatus === 'pending' }" @click="setFilterStatus('pending')">
          <el-icon><Clock /></el-icon>
          <span>待审批</span>
          <el-tag type="warning" size="small">{{ counts.pending }}</el-tag>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="filter-card approving" :class="{ active: filterStatus === 'approving' }" @click="setFilterStatus('approving')">
          <el-icon><Loading /></el-icon>
          <span>审批中</span>
          <el-tag type="primary" size="small">{{ counts.approving }}</el-tag>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="filter-card approved" :class="{ active: filterStatus === 'approved' }" @click="setFilterStatus('approved')">
          <el-icon><CircleCheck /></el-icon>
          <span>已通过</span>
          <el-tag type="success" size="small">{{ counts.approved }}</el-tag>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="filter-card rejected" :class="{ active: filterStatus === 'rejected' }" @click="setFilterStatus('rejected')">
          <el-icon><CircleClose /></el-icon>
          <span>已驳回</span>
          <el-tag type="danger" size="small">{{ counts.rejected }}</el-tag>
        </div>
      </el-col>
    </el-row>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>贷款列表</span>
            <el-tag v-if="filterStatus === 'pending'" type="warning" size="small">低风险可批量通过</el-tag>
            <el-tag v-else-if="filterStatus === 'high_risk'" type="danger" size="small">高风险强制单人复核</el-tag>
          </div>
          <div class="header-actions">
            <el-button type="primary" size="small" :icon="Refresh" @click="loadList">刷新</el-button>
            <el-button type="success" size="small" :icon="Check" @click="batchApprove" :disabled="!canBatchApprove">
              批量通过 ({{ selectedBatchCount }})
            </el-button>
            <el-button type="warning" size="small" :icon="Close" @click="batchReject" :disabled="!canBatchApprove">
              批量驳回
            </el-button>
          </div>
        </div>
      </template>

      <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
        <el-form-item label="贷款编号" prop="loan_no">
          <el-input v-model="searchForm.loan_no" placeholder="请输入贷款编号" clearable />
        </el-form-item>
        <el-form-item label="客户姓名" prop="customer_name">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户姓名" clearable />
        </el-form-item>
        <el-form-item label="贷款类型" prop="loan_type">
          <el-select v-model="searchForm.loan_type" placeholder="请选择贷款类型" clearable>
            <el-option v-for="item in LOAN_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额范围" prop="amount_range">
          <el-input v-model="searchForm.min_amount" placeholder="最小金额" style="width: 140px" />
          <span style="margin: 0 5px">-</span>
          <el-input v-model="searchForm.max_amount" placeholder="最大金额" style="width: 140px" />
        </el-form-item>
        <el-form-item label="风险等级" prop="risk_level">
          <el-select v-model="searchForm.risk_level" placeholder="请选择风险等级" clearable>
            <el-option label="低风险(0-1)" :value="1" />
            <el-option label="中风险(2-3)" :value="3" />
            <el-option label="高风险(4-5)" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="仅可批量" prop="only_batchable">
          <el-switch v-model="searchForm.only_batchable" />
        </el-form-item>
        <el-form-item label="仅高风险" prop="is_high_risk">
          <el-switch v-model="searchForm.is_high_risk" />
        </el-form-item>
      </CcbSearchForm>

      <CcbTable
        v-model:page="pageParams.page"
        v-model:pageSize="pageParams.pageSize"
        :loading="loading"
        :data="tableData"
        :total="total"
        :show-selection="filterStatus === 'pending'"
        :show-index="true"
        row-class-name="approval-row"
        @selection-change="handleSelectionChange"
        @change="handlePageChange"
      >
        <el-table-column type="selection" width="50" fixed="left" :selectable="checkSelectable" />
        <el-table-column prop="loan_no" label="贷款编号" width="180" fixed="left" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="loan_type_text" label="贷款类型" width="110" />
        <el-table-column prop="purpose_text" label="用途" width="90" />
        <el-table-column prop="amount" label="贷款金额" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-number">{{ formatThousands(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="term_text" label="期限" width="80" />
        <el-table-column prop="interest_rate" label="利率(%)" width="90" align="right" />
        <el-table-column prop="current_level_text" label="当前审批级" width="110" />
        <el-table-column prop="total_levels" label="总级数" width="80" align="center">
          <template #default="{ row }">
            <el-progress
              :percentage="row.approval_progress"
              :status="row.approval_progress >= 100 ? 'success' : ''"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="risk_level" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag
              v-if="row.is_high_risk"
              type="danger"
              effect="dark"
              size="small"
            >
              高风险 {{ row.risk_level }}级
            </el-tag>
            <el-tag
              v-else-if="row.risk_level >= 2"
              type="warning"
              size="small"
            >
              中风险 {{ row.risk_level }}级
            </el-tag>
            <el-tag v-else type="success" size="small">
              低风险 {{ row.risk_level }}级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status_text" label="审批状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getApprovalStatusType(row.status)"
              size="small"
            >
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="apply_time" label="申请时间" width="160" />
        <el-table-column label="可批量" width="80" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.can_batch_approve" class="can-batch"><Check /></el-icon>
            <el-tooltip v-else :content="row.cannot_approve_reason || '不支持批量'" placement="top">
              <el-icon class="cannot-batch"><Close /></el-icon>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              @click="openDetail(row)"
            >
              查看详情
            </el-button>
            <el-button
              v-if="row.is_high_risk && filterStatus === 'pending'"
              type="danger"
              link
              size="small"
              @click="openSingleReview(row)"
            >
              精细复核
            </el-button>
          </template>
        </el-table-column>
      </CcbTable>
    </el-card>

    <el-dialog
      v-model="showRejectDialog"
      title="批量驳回"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="100px">
        <el-alert
          :title="`将驳回 ${selectedRows.length} 笔贷款审批`"
          type="warning"
          show-icon
          :closable="false"
          class="mb15"
        />
        <el-form-item label="驳回原因" prop="reject_reason">
          <el-select v-model="rejectForm.reject_reason" placeholder="请选择驳回原因" style="width: 100%">
            <el-option
              v-for="item in REJECT_REASON_OPTIONS"
              :key="item.code"
              :label="item.label"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审批意见" prop="approval_opinion">
          <el-input
            v-model="rejectForm.approval_opinion"
            type="textarea"
            :rows="4"
            placeholder="请填写统一的驳回说明，将同步通知各客户端"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="submitting" @click="confirmBatchReject">
          确认驳回
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetailDialog"
      :title="`贷款详情 - ${detailData?.loan_no}`"
      width="1000px"
    >
      <div v-if="detailData" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="贷款编号">{{ detailData.loan_no }}</el-descriptions-item>
          <el-descriptions-item label="客户姓名">{{ detailData.customer_name }}</el-descriptions-item>
          <el-descriptions-item label="贷款类型">{{ detailData.loan_type_text }}</el-descriptions-item>
          <el-descriptions-item label="贷款用途">{{ detailData.purpose_text }}</el-descriptions-item>
          <el-descriptions-item label="贷款金额">
            <span class="text-primary">{{ formatThousands(detailData.amount) }}元</span>
          </el-descriptions-item>
          <el-descriptions-item label="贷款期限">{{ detailData.term_text }}</el-descriptions-item>
          <el-descriptions-item label="年利率">{{ detailData.interest_rate }}%</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag
              :type="detailData.is_high_risk ? 'danger' : detailData.risk_level >= 2 ? 'warning' : 'success'"
              size="small"
            >
              {{ detailData.is_high_risk ? '高风险' : detailData.risk_level >= 2 ? '中风险' : '低风险' }} {{ detailData.risk_level }}级
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预审意见" :span="2">
            {{ detailData.pre_approve_opinion || '无' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="detailData.is_high_risk" class="high-risk-warn">
          <el-alert
            title="高风险贷款强制单人精细复核"
            type="error"
            show-icon
            :closable="false"
          >
            <template #default>
              <p>该笔贷款风险等级较高（{{ detailData.risk_level }}级），不支持批量审批，需要单人精细复核。</p>
              <p>请仔细审查以下内容：</p>
              <ul>
                <li>客户征信报告及历史还款记录</li>
                <li>负债比例及收入证明真实性</li>
                <li>贷款用途合规性及资料完整性</li>
                <li>抵押物评估价值及变现能力</li>
              </ul>
            </template>
          </el-alert>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button
          v-if="detailData?.is_high_risk && filterStatus === 'pending'"
          type="primary"
          @click="goSingleReview"
        >
          去精细复核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Clock, Loading, CircleCheck, CircleClose, Refresh, Check, Close, Select } from '@element-plus/icons-vue'
import { LOAN_TYPE_OPTIONS } from '@api/loan'
import {
  APPROVAL_LEVEL_OPTIONS,
  REJECT_REASON_OPTIONS,
  HIGH_RISK_LEVEL_THRESHOLD,
  SINGLE_LEVEL_APPROVAL_THRESHOLD,
  formatThousands,
  type BatchApprovalItem,
  type BatchApprovalQueryParams,
  type BatchApprovalRequest,
  getPendingApprovalListApi,
  batchApprovalApi
} from '@api/loanApproval'

const router = useRouter()

const loading = ref(false)
const tableData = ref<BatchApprovalItem[]>([])
const total = ref(0)
const selectedRows = ref<BatchApprovalItem[]>([])
const submitting = ref(false)

const counts = reactive({
  pending: 0,
  approving: 0,
  approved: 0,
  rejected: 0
})

const filterStatus = ref('pending')

const searchForm = reactive({
  loan_no: '',
  customer_name: '',
  loan_type: undefined as number | undefined,
  min_amount: '',
  max_amount: '',
  risk_level: undefined as number | undefined,
  is_high_risk: false,
  only_batchable: false
})

const pageParams = reactive({ page: 1, pageSize: 20 })

const showRejectDialog = ref(false)
const rejectFormRef = ref<FormInstance>()
const rejectForm = reactive({
  reject_reason: '',
  approval_opinion: ''
})

const rejectRules: FormRules = {
  reject_reason: [{ required: true, message: '请选择驳回原因', trigger: 'change' }],
  approval_opinion: [{ required: true, message: '请填写驳回说明', trigger: 'blur' }]
}

const showDetailDialog = ref(false)
const detailData = ref<BatchApprovalItem | null>(null)

const selectedBatchCount = computed(() => {
  return selectedRows.value.filter(r => r.can_batch_approve).length
})

const canBatchApprove = computed(() => {
  return filterStatus.value === 'pending' && selectedBatchCount.value > 0
})

function setFilterStatus(status: string) {
  filterStatus.value = status
  pageParams.page = 1
  loadList()
}

function checkSelectable(row: BatchApprovalItem): boolean {
  return row.can_batch_approve && filterStatus.value === 'pending'
}

async function loadList() {
  loading.value = true
  try {
    const params: BatchApprovalQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      loan_no: searchForm.loan_no || undefined,
      customer_name: searchForm.customer_name || undefined,
      loan_type: searchForm.loan_type,
      min_amount: searchForm.min_amount ? Number(searchForm.min_amount) : undefined,
      max_amount: searchForm.max_amount ? Number(searchForm.max_amount) : undefined,
      risk_level: searchForm.risk_level,
      is_high_risk: searchForm.is_high_risk || undefined
    }

    if (filterStatus.value === 'pending') {
      params.approval_status = 1
    } else if (filterStatus.value === 'approving') {
      params.approval_status = 1
    } else if (filterStatus.value === 'approved') {
      params.approval_status = 7
    } else if (filterStatus.value === 'rejected') {
      params.approval_status = 3
    }

    if (searchForm.only_batchable) {
      params.approval_status = 1
    }

    const result = await getPendingApprovalListApi(params)
    tableData.value = result.list
    total.value = result.total

    counts.pending = result.list.filter(r => r.status === 1 && r.can_batch_approve).length
    counts.approving = result.list.filter(r => r.status === 1 && r.total_levels > 1).length
    counts.approved = result.list.filter(r => r.status === 7).length
    counts.rejected = result.list.filter(r => r.status === 3).length
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.loan_no = ''
  searchForm.customer_name = ''
  searchForm.loan_type = undefined
  searchForm.min_amount = ''
  searchForm.max_amount = ''
  searchForm.risk_level = undefined
  searchForm.is_high_risk = false
  searchForm.only_batchable = false
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

function handleSelectionChange(selection: BatchApprovalItem[]) {
  selectedRows.value = selection.filter(r => r.can_batch_approve)
}

function getApprovalStatusType(status: number): string {
  if (status === 7) return 'success'
  if (status === 3) return 'danger'
  if (status === 1) return 'warning'
  return 'info'
}

function openDetail(row: BatchApprovalItem) {
  detailData.value = row
  showDetailDialog.value = true
}

function openSingleReview(row: BatchApprovalItem) {
  router.push({
    path: '/business/loan/approval',
    query: { loan_id: row.loan_id, review: '1' }
  })
}

function goSingleReview() {
  if (detailData.value) {
    showDetailDialog.value = false
    router.push({
      path: '/business/loan/approval',
      query: { loan_id: detailData.value.loan_id, review: '1' }
    })
  }
}

async function batchApprove() {
  if (selectedBatchCount.value === 0) {
    ElMessage.warning('请选择至少一笔可批量审批的贷款')
    return
  }

  const highRiskItems = selectedRows.value.filter(r => r.is_high_risk)
  if (highRiskItems.length > 0) {
    ElMessage.warning(`${highRiskItems.length} 笔为高风险贷款，不支持批量审批，请进行单人精细复核`)
    return
  }

  const largeAmountItems = selectedRows.value.filter(r => r.amount > SINGLE_LEVEL_APPROVAL_THRESHOLD && r.total_levels > 1)
  if (largeAmountItems.length > 0) {
    ElMessage.warning(`${largeAmountItems.length} 笔为大额多级审批贷款，不支持批量操作`)
    return
  }

  ElMessageBox.confirm(
    `确定要批量通过 ${selectedBatchCount.value} 笔贷款审批吗？\n\n建议确认：\n- 均为低风险（<${HIGH_RISK_LEVEL_THRESHOLD}级）\n- 均为小额（≤${(SINGLE_LEVEL_APPROVAL_THRESHOLD / 10000).toFixed(0)}万）\n- 均为单级审批`,
    '批量审批确认',
    {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    submitting.value = true
    try {
      const request: BatchApprovalRequest = {
        items: selectedRows.value
          .filter(r => r.can_batch_approve)
          .map(r => ({
            loan_id: r.loan_id,
            approval_result: 1,
            approval_opinion: '批量审批通过'
          })),
        approval_level: 1
      }

      const result = await batchApprovalApi(request)
      ElMessage.success(`批量审批完成：成功 ${result.success_count} 笔，失败 ${result.fail_count} 笔`)

      if (result.fail_count > 0) {
        const failItems = result.details.filter(d => !d.success)
        ElMessageBox.alert(
          failItems.map(d => `${d.loan_no}: ${d.message}`).join('\n'),
          '审批失败详情',
          { type: 'warning' }
        )
      }

      selectedRows.value = []
      loadList()
    } catch (e: any) {
      ElMessage.error(e.message || '批量审批失败')
    } finally {
      submitting.value = false
    }
  }).catch(() => {})
}

function batchReject() {
  if (selectedBatchCount.value === 0) {
    ElMessage.warning('请选择至少一笔可批量审批的贷款')
    return
  }
  showRejectDialog.value = true
}

async function confirmBatchReject() {
  if (!rejectFormRef.value) return

  try {
    await rejectFormRef.value.validate()
  } catch (e) {
    return
  }

  ElMessageBox.confirm(
    `确定要批量驳回 ${selectedBatchCount.value} 笔贷款审批吗？`,
    '批量驳回确认',
    {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    submitting.value = true
    try {
      const request: BatchApprovalRequest = {
        items: selectedRows.value
          .filter(r => r.can_batch_approve)
          .map(r => ({
            loan_id: r.loan_id,
            approval_result: 2,
            approval_opinion: rejectForm.approval_opinion,
            reject_reason: rejectForm.reject_reason
          })),
        approval_level: 1
      }

      const result = await batchApprovalApi(request)
      ElMessage.success(`批量驳回完成：成功 ${result.success_count} 笔，失败 ${result.fail_count} 笔`)

      showRejectDialog.value = false
      selectedRows.value = []
      loadList()
    } catch (e: any) {
      ElMessage.error(e.message || '批量驳回失败')
    } finally {
      submitting.value = false
    }
  }).catch(() => {})
}

onMounted(() => {
  loadList()
})
</script>

<style lang="scss" scoped>
.ccb-loan-approval-batch {
  .filter-bar {
    margin-bottom: 20px;

    .filter-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      border: 2px solid var(--el-border-color-lighter);
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &.active {
        border-color: var(--el-color-primary);
        background: rgba(64, 158, 255, 0.05);
      }

      .el-icon {
        font-size: 24px;
      }

      span {
        font-size: 16px;
        font-weight: 500;
        flex: 1;
      }

      &.pending .el-icon { color: #e6a23c; }
      &.pending.active { border-color: #e6a23c; background: rgba(230, 162, 60, 0.05); }

      &.approving .el-icon { color: #409eff; }
      &.approving.active { border-color: #409eff; background: rgba(64, 158, 255, 0.05); }

      &.approved .el-icon { color: #67c23a; }
      &.approved.active { border-color: #67c23a; background: rgba(103, 194, 58, 0.05); }

      &.rejected .el-icon { color: #f56c6c; }
      &.rejected.active { border-color: #f56c6c; background: rgba(245, 108, 108, 0.05); }
    }
  }

  .list-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .header-actions {
        display: flex;
        gap: 10px;
      }
    }
  }

  .amount-number {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  .can-batch {
    color: #67c23a;
    font-size: 20px;
  }

  .cannot-batch {
    color: #c0c4cc;
    font-size: 20px;
  }

  .text-primary {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  .detail-content {
    .high-risk-warn {
      margin-top: 20px;

      ul {
        margin: 10px 0 0 0;
        padding-left: 20px;

        li {
          margin-bottom: 4px;
        }
      }
    }
  }

  :deep(.approval-row:hover) {
    transform: scale(1.003);
    transition: transform 0.2s ease;
  }

  .mb15 {
    margin-bottom: 15px;
  }
}
</style>
