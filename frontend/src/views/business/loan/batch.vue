<template>
  <div class="ccb-batch-loan">
    <CcbPageHeader
      title="批量贷款预审"
      description="批量受理网点贷款预审申请，差异化预审规则"
      icon="Files"
    />

    <el-card class="batch-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>批量贷款申请录入</span>
          <div class="header-actions">
            <el-button :icon="Plus" size="small" @click="addRow">新增一行</el-button>
            <el-button :icon="Delete" size="small" type="danger" plain @click="clearAll">清空全部</el-button>
          </div>
        </div>
      </template>

      <div class="batch-table-wrapper">
        <el-table
          :data="batchList"
          border
          stripe
          size="default"
          row-class-name="batch-row"
          :row-key="row => row.index as number"
          highlight-current-row
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column label="客户编号" width="150">
            <template #default="{ row }">
              <el-input
                v-model="row.customer_no"
                size="small"
                placeholder="请输入客户编号"
                @blur="handleRowChange(row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="证件号码" width="180">
            <template #default="{ row }">
              <el-input
                v-model="row.id_card_no"
                size="small"
                placeholder="请输入证件号码"
                @blur="handleRowChange(row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="贷款类型" width="130">
            <template #default="{ row }">
              <el-select v-model="row.loan_type" size="small" @change="handleRowChange(row)" style="width: 100%">
                <el-option v-for="item in LOAN_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="贷款金额(元)" width="150">
            <template #default="{ row }">
              <el-input-number
                v-model="row.amount"
                :min="1000"
                :max="10000000"
                :step="1000"
                size="small"
                :controls="false"
                @change="handleRowChange(row)"
                style="width: 100%"
              />
            </template>
          </el-table-column>

          <el-table-column label="贷款期限" width="110">
            <template #default="{ row }">
              <el-select v-model="row.term" size="small" @change="handleRowChange(row)" style="width: 100%">
                <el-option v-for="item in LOAN_TERM_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="贷款用途" width="110">
            <template #default="{ row }">
              <el-select v-model="row.purpose" size="small" style="width: 100%">
                <el-option v-for="item in LOAN_PURPOSE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="还款方式" width="130">
            <template #default="{ row }">
              <el-select v-model="row.repayment_method" size="small" style="width: 100%">
                <el-option v-for="item in REPAYMENT_METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="预审状态" width="120">
            <template #default="{ row }">
              <el-tag
                v-if="row._checked"
                :type="row._passed ? 'success' : 'danger'"
                effect="light"
                size="small"
              >
                {{ row._passed ? '通过' : '不通过' }}
              </el-tag>
              <el-tag v-else type="info" effect="plain" size="small">待校验</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="资质标记" width="100">
            <template #default="{ row }">
              <el-tag
                v-if="row._isLowQuality"
                type="warning"
                effect="light"
                size="small"
              >重点复核</el-tag>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>

          <el-table-column label="校验信息" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row._errors && row._errors.length > 0" class="error-list">
                <span v-for="(err, i) in row._errors" :key="i" class="error-item">{{ err }}</span>
              </div>
              <span v-else-if="row._checked" class="text-success">校验通过</span>
              <span v-else class="text-muted">未校验</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ $index }">
              <el-button type="danger" link size="small" @click="removeRow($index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="batch-summary">
        <div class="summary-left">
          <el-statistic title="共录入" :value="batchList.length" suffix="笔" />
          <el-statistic title="校验通过" :value="passedCount" suffix="笔" class="ml20" />
          <el-statistic title="校验失败" :value="failedCount" suffix="笔" class="ml20 error-stat" />
          <el-statistic title="重点复核" :value="lowQualityCount" suffix="笔" class="ml20 warn-stat" />
        </div>
        <div class="summary-right">
          <el-button type="primary" :icon="Check" @click="handleBatchPreCheck" :loading="preChecking">
            批量预校验
          </el-button>
          <el-button type="success" :icon="Upload" @click="handleBatchSubmit" :loading="submitting">
            批量提交预审
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="result-card" shadow="never" v-if="batchResult">
      <template #header>
        <span>批量提交结果</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="成功提交" :value="batchResult.success_count" suffix="笔" value-style="color: var(--el-color-success)">
            <template #suffix>笔</template>
          </el-statistic>
        </el-col>
        <el-col :span="6">
          <el-statistic title="失败" :value="batchResult.fail_count" suffix="笔" value-style="color: var(--el-color-danger)" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="重点复核" :value="batchResult.low_quality_count" suffix="笔" value-style="color: var(--el-color-warning)" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="需风控审核" :value="batchResult.review_count" suffix="笔" value-style="color: var(--el-color-primary)" />
        </el-col>
      </el-row>
    </el-card>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>待预审申请列表</span>
          <el-button type="primary" size="small" :icon="Refresh" @click="loadPendingList">刷新</el-button>
        </div>
      </template>

      <CcbTable
        v-model:page="pageParams.page"
        v-model:pageSize="pageParams.pageSize"
        :loading="listLoading"
        :data="pendingList"
        :total="totalCount"
        :show-selection="true"
        :show-index="true"
        row-class-name="pending-row"
        @selection-change="handleSelectionChange"
        @change="handlePageChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="loan_no" label="贷款编号" width="180" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="loan_type_text" label="贷款类型" width="110" />
        <el-table-column prop="purpose_text" label="用途" width="90" />
        <el-table-column prop="amount" label="贷款金额" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="term_text" label="期限" width="80" />
        <el-table-column prop="interest_rate" label="年利率(%)" width="100" align="right" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_low_quality" label="资质" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.is_low_quality" type="warning" effect="dark" size="small">重点</el-tag>
            <span v-else class="text-muted">正常</span>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="经办人" width="100" />
        <el-table-column prop="apply_time" label="申请时间" width="160" />
      </CcbTable>

      <div class="list-actions" v-if="selectedRows.length > 0">
        <el-text type="info">已选择 <b>{{ selectedRows.length }}</b> 项</el-text>
        <el-button type="success" :icon="Check" @click="handleBatchReview('approve')" :loading="reviewLoading">
          批量预审通过
        </el-button>
        <el-button type="danger" :icon="Close" @click="handleBatchReview('reject')" :loading="reviewLoading">
          批量预审拒绝
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Check, Upload, Refresh, Close, ArrowLeft } from '@element-plus/icons-vue'
import {
  LOAN_TYPE_OPTIONS,
  LOAN_STATUS_OPTIONS,
  LOAN_TERM_OPTIONS,
  REPAYMENT_METHOD_OPTIONS,
  LOAN_PURPOSE_OPTIONS,
  formatThousands,
  type Loan,
  type LoanQueryParams,
  type BatchLoanItem,
  type BatchLoanResult,
  batchPreCheckLoanApi,
  batchLoanApi,
  batchReviewLoanApi,
  getLoanListApi
} from '@api/loan'

const router = useRouter()

interface BatchItemWithState extends BatchLoanItem {
  _checked?: boolean
  _passed?: boolean
  _isLowQuality?: boolean
  _errors?: string[]
  _preCheck?: any
}

const batchList = ref<BatchItemWithState[]>([])
const preChecking = ref(false)
const submitting = ref(false)
const batchResult = ref<BatchLoanResult | null>(null)

const pageParams = reactive({ page: 1, pageSize: 10 })
const listLoading = ref(false)
const pendingList = ref<Loan[]>([])
const totalCount = ref(0)
const selectedRows = ref<Loan[]>([])
const reviewLoading = ref(false)

const passedCount = computed(() => batchList.value.filter(r => r._checked && r._passed).length)
const failedCount = computed(() => batchList.value.filter(r => r._checked && !r._passed).length)
const lowQualityCount = computed(() => batchList.value.filter(r => r._isLowQuality).length)

function addRow() {
  batchList.value.push({
    index: Date.now() + Math.random(),
    customer_no: '',
    id_card_no: '',
    loan_type: 1,
    amount: 100000,
    term: 12,
    purpose: 'consumption',
    repayment_method: 1,
    _checked: false
  })
}

function removeRow(index: number) {
  batchList.value.splice(index, 1)
}

function clearAll() {
  ElMessageBox.confirm('确定要清空所有录行吗？', '确认', {
    type: 'warning'
  }).then(() => {
    batchList.value = []
    batchResult.value = null
  }).catch(() => {})
}

function handleRowChange(row: BatchItemWithState) {
  row._checked = false
  row._errors = undefined
  row._isLowQuality = false
}

async function handleBatchPreCheck() {
  if (batchList.value.length === 0) {
    ElMessage.warning('请先录入贷款申请数据')
    return
  }

  const validItems = batchList.value.filter(
    r => (r.customer_no || r.id_card_no) && r.loan_type && r.amount && r.term
  )
  if (validItems.length === 0) {
    ElMessage.warning('请至少填写一条完整的贷款申请信息')
    return
  }

  preChecking.value = true
  try {
    const items = validItems.map((item, idx) => ({
      ...item,
      index: idx
    }))
    const result = await batchPreCheckLoanApi({ items })

    result.details.forEach((detail: any) => {
      const row = validItems[detail.index]
      if (row) {
        row._checked = true
        row._passed = detail.passed
        row._preCheck = detail.pre_check
        row._errors = detail.errors || []
        row._isLowQuality = detail.pre_check?.credit_score
          ? detail.pre_check.credit_score < 60
          : false
      }
    })

    const passed = result.details.filter((d: any) => d.passed).length
    ElMessage.success(`预校验完成：通过 ${passed} 笔，失败 ${result.details.length - passed} 笔`)
  } catch (e: any) {
    ElMessage.error(e.message || '预校验失败')
  } finally {
    preChecking.value = false
  }
}

async function handleBatchSubmit() {
  if (batchList.value.length === 0) {
    ElMessage.warning('请先录入贷款申请数据')
    return
  }

  const validItems = batchList.value.filter(
    r => (r.customer_no || r.id_card_no) && r.loan_type && r.amount && r.term
  )
  if (validItems.length === 0) {
    ElMessage.warning('请至少填写一条完整的贷款申请信息')
    return
  }

  ElMessageBox.confirm(
    `确定要提交 ${validItems.length} 笔贷款预审申请吗？批量操作仅进行预审，不做终审。`,
    '提交确认',
    { type: 'warning' }
  ).then(async () => {
    submitting.value = true
    try {
      const items = validItems.map((item, idx) => ({
        ...item,
        index: idx
      }))
      const result = await batchLoanApi({ items })
      batchResult.value = result

      result.details.forEach((detail) => {
        const row = validItems[detail.index]
        if (row) {
          row._checked = true
          row._passed = detail.success
          row._errors = detail.errors || []
          row._isLowQuality = detail.is_low_quality || false
        }
      })

      ElMessage.success(
        `提交完成：成功 ${result.success_count} 笔，失败 ${result.fail_count} 笔`
      )

      loadPendingList()
    } catch (e: any) {
      ElMessage.error(e.message || '提交失败')
    } finally {
      submitting.value = false
    }
  }).catch(() => {})
}

function loadPendingList() {
  listLoading.value = true
  const params: LoanQueryParams = {
    page: pageParams.page,
    pageSize: pageParams.pageSize,
    status: 1
  }
  getLoanListApi(params).then(res => {
    pendingList.value = res.list
    totalCount.value = res.total
  }).finally(() => {
    listLoading.value = false
  })
}

function handlePageChange() {
  loadPendingList()
}

function handleSelectionChange(selection: Loan[]) {
  selectedRows.value = selection
}

function getStatusType(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'info', 1: 'warning', 2: 'success', 3: 'danger',
    4: 'warning', 5: 'success', 6: 'danger', 7: 'success', 8: 'info'
  }
  return statusMap[status] || ''
}

function getStatusLabel(status: number): string {
  const item = LOAN_STATUS_OPTIONS.find(opt => opt.value === status)
  return item?.label || '未知'
}

async function handleBatchReview(operation: 'approve' | 'reject') {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要操作的记录')
    return
  }

  const actionText = operation === 'approve' ? '通过' : '拒绝'
  ElMessageBox.confirm(
    `确定要批量${actionText}选中的 ${selectedRows.value.length} 笔预审申请吗？`,
    `批量预审${actionText}`,
    { type: operation === 'approve' ? 'success' : 'warning' }
  ).then(async () => {
    reviewLoading.value = true
    try {
      const items = selectedRows.value.map(r => ({
        id: r.id,
        operation,
        reason: operation === 'reject' ? '批量预审拒绝' : undefined
      }))
      await batchReviewLoanApi({ items, review_type: 'pre' })
      ElMessage.success(`批量预审${actionText}成功`)
      loadPendingList()
      selectedRows.value = []
    } catch (e: any) {
      ElMessage.error(e.message || `批量预审${actionText}失败`)
    } finally {
      reviewLoading.value = false
    }
  }).catch(() => {})
}

onMounted(() => {
  for (let i = 0; i < 5; i++) {
    addRow()
  }
  loadPendingList()
})
</script>

<style lang="scss" scoped>
.ccb-batch-loan {
  .batch-card, .result-card, .list-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .batch-table-wrapper {
    margin-bottom: 20px;
    max-height: 420px;
    overflow-y: auto;
  }

  .batch-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);

    .summary-left {
      display: flex;
      align-items: center;

      .ml20 {
        margin-left: 30px;
      }

      .error-stat {
        :deep(.el-statistic__content) {
          color: var(--el-color-danger);
        }
      }

      .warn-stat {
        :deep(.el-statistic__content) {
          color: var(--el-color-warning);
        }
      }
    }

    .summary-right {
      display: flex;
      gap: 10px;
    }
  }

  .error-list {
    .error-item {
      display: block;
      color: var(--el-color-danger);
      font-size: 12px;
      line-height: 1.5;
    }
  }

  .text-success {
    color: var(--el-color-success);
  }

  .text-muted {
    color: var(--el-text-color-secondary);
  }

  .amount-positive {
    color: var(--el-color-success);
    font-weight: 600;
  }

  .list-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px 0;
    margin-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  :deep(.batch-row:hover) {
    transform: scale(1.002);
    transition: transform 0.2s ease;
  }

  :deep(.pending-row:hover) {
    transform: scale(1.005);
    transition: transform 0.2s ease;
  }
}
</style>
