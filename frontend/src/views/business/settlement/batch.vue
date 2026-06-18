<template>
  <div class="ccb-business-settlement-batch">
    <CcbPageHeader
      title="批量转账"
      description="网点对公批量转账、代发工资业务集中处理"
      icon="Files"
    />

    <el-row :gutter="20" class="mb15">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <span class="card-title">批量统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="8" class="stat-item">
              <div class="stat-label">待处理</div>
              <div class="stat-value text-warning">{{ pendingCount }}</div>
            </el-col>
            <el-col :span="8" class="stat-item">
              <div class="stat-label">待复核</div>
              <div class="stat-value text-danger">{{ reviewCount }}</div>
            </el-col>
            <el-col :span="8" class="stat-item">
              <div class="stat-label">已完成</div>
              <div class="stat-value text-success">{{ successCount }}</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <span class="card-title">金额统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12" class="stat-item">
              <div class="stat-label">批次总金额</div>
              <div class="stat-value text-primary">{{ formatThousands(totalAmount) }}</div>
            </el-col>
            <el-col :span="12" class="stat-item">
              <div class="stat-label">手续费合计</div>
              <div class="stat-value text-success">{{ formatThousands(totalFee) }}</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" v-if="activeBatchProgress" class="mb15">
      <template #header>
        <span class="card-title">批次处理进度</span>
        <el-tag size="small" :type="getBatchStatusTagType(activeBatchProgress.status)">
          {{ getBatchStatusText(activeBatchProgress.status) }}
        </el-tag>
      </template>
      <div class="progress-section">
        <div class="progress-info">
          <span class="progress-batch-no">批次号：{{ activeBatchProgress.batch_no }}</span>
          <span class="progress-detail">
            成功 {{ activeBatchProgress.success_count }} /
            失败 {{ activeBatchProgress.fail_count }} /
            待处理 {{ activeBatchProgress.pending_count }} /
            处理中 {{ activeBatchProgress.processing_count }}
          </span>
        </div>
        <el-progress
          :percentage="activeBatchProgress.progress_percent"
          :status="getProgressStatus(activeBatchProgress.status)"
          :stroke-width="18"
        />
      </div>
    </el-card>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <div class="batch-header">
          <span class="card-title">批量录入</span>
          <div class="header-form">
            <el-form :inline="true" size="small">
              <el-form-item label="批次名称">
                <el-input v-model="batchForm.batch_name" placeholder="请输入批次名称" style="width: 200px" />
              </el-form-item>
              <el-form-item label="批量类型">
                <el-select v-model="batchForm.batch_type" placeholder="请选择类型" style="width: 160px">
                  <el-option
                    v-for="item in BATCH_TYPE_OPTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="转出账号">
                <el-input v-model="batchForm.payer_account_no" placeholder="请输入转出账号" style="width: 200px" />
              </el-form-item>
              <el-button
                type="primary"
                :icon="Plus"
                size="small"
                @click="addRow"
                :disabled="submitting"
              >
                添加一行
              </el-button>
            </el-form>
          </div>
        </div>
      </template>

      <el-table
        :data="batchItems"
        border
        stripe
        row-key="index"
        class="batch-table"
        :row-class-name="getRowClassName"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="收款账号" min-width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.payee_account_no"
              placeholder="请输入收款账号"
              size="small"
              @blur="validateRow(row)"
              :class="{ 'shake-error': row.hasError }"
            />
          </template>
        </el-table-column>
        <el-table-column label="收款户名" min-width="140">
          <template #default="{ row }">
            <el-input
              v-model="row.payee_account_name"
              placeholder="请输入收款户名"
              size="small"
              @blur="validateRow(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="收款开户行" min-width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.payee_bank_name"
              placeholder="请输入开户行"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="收款行号" width="130">
          <template #default="{ row }">
            <el-input
              v-model="row.payee_bank_code"
              placeholder="请输入行号"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="账户类型" width="100">
          <template #default="{ row }">
            <el-select
              v-model="row.payee_account_type"
              placeholder="类型"
              size="small"
              style="width: 100%"
              @change="validateRow(row)"
            >
              <el-option label="对公(P)" value="P" />
              <el-option label="对私(I)" value="I" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="收款所在地" min-width="120">
          <template #default="{ row }">
            <el-input
              v-model="row.payee_location"
              placeholder="所在地"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="金额" width="140">
          <template #default="{ row }">
            <el-input
              v-model.number="row.amount"
              placeholder="输入金额"
              size="small"
              type="number"
              :min="0"
              @input="handleAmountInput(row)"
              @blur="validateRow(row)"
              :class="{ 'shake-error': row.hasError }"
            >
              <template #append>元</template>
            </el-input>
          </template>
        </el-table-column>
        <el-table-column label="用途" width="110">
          <template #default="{ row }">
            <el-select
              v-model="row.purpose"
              placeholder="选择用途"
              size="small"
              style="width: 100%"
              clearable
              @change="validateRow(row)"
            >
              <el-option
                v-for="item in PURPOSE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="附言" min-width="140">
          <template #default="{ row }">
            <el-input
              v-model="row.remark"
              placeholder="请输入附言"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column label="手续费" width="100" align="right">
          <template #default="{ row }">
            <span>{{ formatThousands(row.fee || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.success === true" type="success" effect="light" size="small">成功</el-tag>
            <el-tag v-else-if="row.success === false" type="danger" effect="light" size="small">失败</el-tag>
            <el-tag v-else-if="row.need_review" type="warning" effect="light" size="small">待复核</el-tag>
            <el-tag v-else type="info" effect="light" size="small">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="错误信息" min-width="180">
          <template #default="{ row }">
            <el-text v-if="row.errors && row.errors.length > 0" type="danger" size="small">
              {{ row.errors.join('; ') }}
            </el-text>
            <el-text v-else-if="row.warnings && row.warnings.length > 0" type="warning" size="small">
              {{ row.warnings.join('; ') }}
            </el-text>
            <el-text v-else type="info" size="small">-</el-text>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ row, $index }">
            <el-button
              type="danger"
              link
              size="small"
              @click="removeRow($index)"
              :disabled="submitting"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="batch-actions">
        <div class="actions-left">
          <el-text type="info" size="small">
            注：小额批量（≤{{ formatThousands(BATCH_SMALL_AMOUNT_THRESHOLD) }}元）自动复核；
            大额批量（≥{{ formatThousands(BATCH_LARGE_AMOUNT_THRESHOLD) }}元）需人工复核
          </el-text>
        </div>
        <div class="actions-right">
          <el-button @click="clearAll" :disabled="submitting">清空</el-button>
          <el-button @click="validateAll" :disabled="submitting">预校验</el-button>
          <el-button
            type="primary"
            :loading="submitting"
            @click="handleSubmit"
            :disabled="!canSubmit"
          >
            <i v-if="submitting" class="el-icon-loading"></i>
            {{ submitting ? '提交中...' : '批量提交' }}
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover" v-permission="'business:settlement:review'">
      <template #header>
        <span class="card-title">待复核列表</span>
        <div>
          <el-button
            type="success"
            size="small"
            :icon="Check"
            @click="handleBatchReview('approve')"
            :disabled="reviewSelection.length === 0 || reviewing"
          >
            批量通过
          </el-button>
          <el-button
            type="danger"
            size="small"
            :icon="Close"
            @click="handleBatchReview('reject')"
            :disabled="reviewSelection.length === 0 || reviewing"
          >
            批量驳回
          </el-button>
        </div>
      </template>

      <CcbTable
        v-model:page="reviewPage.page"
        v-model:pageSize="reviewPage.pageSize"
        :loading="reviewLoading"
        :data="reviewData"
        :total="reviewTotal"
        :show-selection="true"
        :show-index="true"
        row-class-name="review-row"
        @selection-change="handleReviewSelectionChange"
        @change="fetchReviewData"
      >
        <el-table-column prop="batch_no" label="批次号" width="180" />
        <el-table-column prop="batch_name" label="批次名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="batch_type_text" label="批量类型" width="130" />
        <el-table-column prop="payer_account_no" label="转出账号" width="180" />
        <el-table-column prop="total_count" label="总笔数" width="90" align="center" />
        <el-table-column prop="total_amount" label="总金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-positive">{{ formatThousands(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status_text" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditStatusTagType(row.audit_status)" effect="light" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator_name" label="经办人" width="100" />
        <el-table-column prop="submit_time" label="提交时间" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="handleSingleReview(row, 'approve')">
              通过
            </el-button>
            <el-button type="danger" link size="small" @click="handleSingleReview(row, 'reject')">
              驳回
            </el-button>
          </template>
        </el-table-column>
      </CcbTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check, Close } from '@element-plus/icons-vue'
import {
  BATCH_TYPE_OPTIONS,
  BATCH_STATUS_OPTIONS,
  AUDIT_STATUS_OPTIONS,
  PURPOSE_OPTIONS,
  BATCH_SMALL_AMOUNT_THRESHOLD,
  BATCH_LARGE_AMOUNT_THRESHOLD,
  TRANSFER_TYPE_OPTIONS,
  TRANSFER_MODE_OPTIONS,
  type BatchType,
  type BatchSettlementItem,
  type BatchSettlementResultItem,
  type BatchSettlementVO,
  type BatchProgressVO,
  type SettlementPreCheckResult,
  type CreateBatchSettlementRequest,
  type TransferType,
  type TransferMode,
  createBatchSettlementApi,
  getBatchListApi,
  reviewBatchApi,
  getBatchProgressApi,
  preCheckSettlementApi,
  formatThousands
} from '@api/settlement'

const submitting = ref(false)
const reviewing = ref(false)

const batchForm = reactive({
  batch_name: '',
  batch_type: 1 as BatchType,
  payer_account_no: ''
})

interface BatchItemRow extends BatchSettlementItem {
  index: number
  fee?: number
  hasError?: boolean
  success?: boolean
  need_review?: boolean
  errors?: string[]
  warnings?: string[]
  pre_check_result?: SettlementPreCheckResult
}

const batchItems = ref<BatchItemRow[]>([])

const reviewLoading = ref(false)
const reviewData = ref<BatchSettlementVO[]>([])
const reviewTotal = ref(0)
const reviewSelection = ref<BatchSettlementVO[]>([])

const reviewPage = reactive({
  page: 1,
  pageSize: 10
})

const activeBatchProgress = ref<BatchProgressVO | null>(null)
let progressTimer: ReturnType<typeof setInterval> | null = null

const pendingCount = computed(() =>
  batchItems.value.filter(i => i.success === undefined && !i.need_review).length
)
const reviewCount = computed(() => reviewData.value.length)
const successCount = computed(() => batchItems.value.filter(i => i.success === true).length)

const totalAmount = computed(() =>
  batchItems.value.reduce((sum, item) => sum + (item.amount || 0), 0)
)
const totalFee = computed(() =>
  batchItems.value.reduce((sum, item) => sum + (item.fee || 0), 0)
)

const canSubmit = computed(() => {
  const hasValidItems = batchItems.value.some(
    i => i.payee_account_no && i.payee_account_name && i.amount > 0 && !i.hasError
  )
  const hasBatchInfo = batchForm.batch_name && batchForm.batch_type && batchForm.payer_account_no
  return hasValidItems && hasBatchInfo && !submitting.value
})

const resolveTransferType = (row: BatchItemRow): TransferType => {
  if (row.payee_account_type === 'P') return 3
  if (row.payee_account_type === 'I') return 4
  return 3
}

const resolveTransferMode = (): TransferMode => {
  return 1
}

const addRow = () => {
  const newIndex = batchItems.value.length
  batchItems.value.push({
    index: newIndex,
    payee_account_no: '',
    payee_account_name: '',
    payee_bank_code: '',
    payee_bank_name: '',
    payee_account_type: 'P',
    payee_location: '',
    amount: 0,
    purpose: '',
    remark: '',
    fee: 0
  })
}

const removeRow = (index: number) => {
  batchItems.value.splice(index, 1)
  batchItems.value.forEach((item, i) => {
    item.index = i
  })
}

const clearAll = () => {
  batchItems.value = []
  activeBatchProgress.value = null
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
}

const handleAmountInput = (row: BatchItemRow) => {
  if (row.amount < 0) {
    row.amount = 0
  }
  row.fee = calculateFee(row)
}

const calculateFee = (row: BatchItemRow): number => {
  if (!row.amount || row.amount <= 0) return 0
  const amount = row.amount
  const transferType = resolveTransferType(row)
  const mode = resolveTransferMode()

  let fee = 0
  if (transferType === 1) {
    fee = amount * 0.0005
    fee = Math.max(fee, 0.5)
    fee = Math.min(fee, 50)
  } else if (transferType === 2) {
    fee = amount * 0.001
    fee = Math.max(fee, 1)
    fee = Math.min(fee, 100)
  } else if (transferType === 3) {
    fee = amount * 0.0005
    fee = Math.max(fee, 1)
    fee = Math.min(fee, 50)
  } else if (transferType === 4) {
    fee = amount * 0.0003
    fee = Math.max(fee, 0.3)
    fee = Math.min(fee, 30)
  }

  if (mode === 2) fee *= 1.5
  if (mode === 3) fee *= 2

  return Math.round(fee * 100) / 100
}

const triggerShake = (row: BatchItemRow) => {
  row.hasError = true
  setTimeout(() => {
    row.hasError = false
  }, 500)
}

const validateRow = async (row: BatchItemRow) => {
  row.errors = []
  row.warnings = []

  if (!row.payee_account_no) {
    row.errors.push('请输入收款账号')
  }
  if (!row.payee_account_name) {
    row.errors.push('请输入收款户名')
  }
  if (!row.amount || row.amount <= 0) {
    row.errors.push('请输入有效的转账金额')
  }

  row.fee = calculateFee(row)

  if (
    batchForm.payer_account_no &&
    row.payee_account_no &&
    row.payee_account_name &&
    row.amount > 0
  ) {
    try {
      const res = await preCheckSettlementApi({
        payer_account_no: batchForm.payer_account_no,
        transfer_type: resolveTransferType(row),
        transfer_mode: resolveTransferMode(),
        payee_account: {
          account_no: row.payee_account_no,
          account_name: row.payee_account_name,
          account_type: row.payee_account_type,
          bank_code: row.payee_bank_code,
          bank_name: row.payee_bank_name,
          location: row.payee_location
        },
        amount: row.amount,
        purpose: row.purpose
      })
      row.pre_check_result = res.data
      row.fee = res.data.fee_calc?.fee || row.fee

      if (!res.data.passed) {
        row.errors.push(res.data.block_reason || '校验未通过')
        if (res.data.block_field === 'payee_account') {
          triggerShake(row)
        }
      }
      if (res.data.warnings && res.data.warnings.length > 0) {
        row.warnings = [...res.data.warnings]
      }
      if (res.data.need_review) {
        row.need_review = true
      }
    } catch (e: any) {
      row.errors.push(e?.message || '校验失败')
      triggerShake(row)
    }
  }
}

const validateAll = async () => {
  let validCount = 0
  for (const item of batchItems.value) {
    await validateRow(item)
    if (!item.errors || item.errors.length === 0) {
      validCount++
    }
  }
  ElMessage.info(`预校验完成：${validCount}/${batchItems.value.length} 条有效`)
}

const getRowClassName = ({ row }: { row: BatchItemRow }) => {
  if (row.success === true) return 'row-success'
  if (row.success === false) return 'row-error'
  if (row.need_review) return 'row-warning'
  return ''
}

const getBatchStatusTagType = (status: number) => {
  const opt = BATCH_STATUS_OPTIONS.find(o => o.value === status)
  return (opt?.type as any) || 'info'
}

const getBatchStatusText = (status: number) => {
  const opt = BATCH_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getAuditStatusTagType = (auditStatus: number) => {
  const opt = AUDIT_STATUS_OPTIONS.find(o => o.value === auditStatus)
  return (opt?.type as any) || 'info'
}

const getProgressStatus = (status: number): '' | 'success' | 'warning' | 'exception' => {
  if (status === 4) return 'success'
  if (status === 6) return 'exception'
  if (status === 3) return 'warning'
  return ''
}

const startProgressPolling = (batchId: string) => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }

  const poll = async () => {
    try {
      const res = await getBatchProgressApi(batchId)
      activeBatchProgress.value = res.data

      if (res.data.status === 4 || res.data.status === 5 || res.data.status === 6) {
        if (progressTimer) {
          clearInterval(progressTimer)
          progressTimer = null
        }
        ElMessage.success(`批次处理完成：成功${res.data.success_count}条，失败${res.data.fail_count}条`)
        fetchReviewData()
      }
    } catch (e) {
      console.error('Failed to poll progress:', e)
    }
  }

  poll()
  progressTimer = setInterval(poll, 3000)
}

const handleSubmit = async () => {
  if (!batchForm.batch_name) {
    ElMessage.warning('请输入批次名称')
    return
  }
  if (!batchForm.batch_type) {
    ElMessage.warning('请选择批量类型')
    return
  }
  if (!batchForm.payer_account_no) {
    ElMessage.warning('请输入转出账号')
    return
  }

  const validItems = batchItems.value.filter(
    i => i.payee_account_no && i.payee_account_name && i.amount > 0 && (!i.errors || i.errors.length === 0)
  )
  if (validItems.length === 0) {
    ElMessage.warning('没有有效的转账记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认提交 ${validItems.length} 条转账记录？小额自动复核，大额将进入复核流程`,
      '确认提交',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const requestData: CreateBatchSettlementRequest = {
      batch_name: batchForm.batch_name,
      batch_type: batchForm.batch_type,
      payer_account_no: batchForm.payer_account_no,
      items: validItems.map(i => ({
        index: i.index,
        payee_account_no: i.payee_account_no,
        payee_account_name: i.payee_account_name,
        payee_bank_code: i.payee_bank_code,
        payee_bank_name: i.payee_bank_name,
        payee_account_type: i.payee_account_type,
        payee_location: i.payee_location,
        amount: i.amount,
        purpose: i.purpose,
        remark: i.remark
      }))
    }

    const res = await createBatchSettlementApi(requestData)

    res.data.details.forEach((d: BatchSettlementResultItem) => {
      const item = batchItems.value[d.index]
      if (item) {
        item.success = d.success
        item.need_review = d.need_review
        if (d.error) item.errors = [d.error]
        if (d.warning) item.warnings = [d.warning]
        if (d.fee !== undefined) item.fee = d.fee
        if (d.pre_check_result) item.pre_check_result = d.pre_check_result
      }
    })

    ElMessage.success(
      `批量提交完成：成功${res.data.success_count}条，失败${res.data.fail_count}条，待复核${res.data.pending_count}条`
    )

    if (res.data.batch_id) {
      startProgressPolling(res.data.batch_id)
    }

    fetchReviewData()
  } catch (e) {
    console.error('Failed to submit batch:', e)
  } finally {
    submitting.value = false
  }
}

const fetchReviewData = async () => {
  reviewLoading.value = true
  try {
    const res = await getBatchListApi({
      page: reviewPage.page,
      pageSize: reviewPage.pageSize,
      audit_status: 0,
      need_review: true
    })
    reviewData.value = res.data.list
    reviewTotal.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch review list:', e)
  } finally {
    reviewLoading.value = false
  }
}

const handleReviewSelectionChange = (val: BatchSettlementVO[]) => {
  reviewSelection.value = val
}

const handleSingleReview = async (row: BatchSettlementVO, operation: 'approve' | 'reject') => {
  try {
    const reason =
      operation === 'reject'
        ? await ElMessageBox.prompt('请输入驳回原因', '驳回', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            inputPattern: /.+/,
            inputErrorMessage: '请输入驳回原因'
          })
        : null

    reviewing.value = true
    await reviewBatchApi({
      batch_id: row.id,
      approved: operation === 'approve',
      review_reason: reason?.value
    })
    ElMessage.success(operation === 'approve' ? '审核通过' : '已驳回')
    fetchReviewData()
  } catch (e) {
    console.error('Failed to review:', e)
  } finally {
    reviewing.value = false
  }
}

const handleBatchReview = async (operation: 'approve' | 'reject') => {
  try {
    const reason =
      operation === 'reject'
        ? await ElMessageBox.prompt('请输入驳回原因', '批量驳回', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            inputPattern: /.+/,
            inputErrorMessage: '请输入驳回原因'
          })
        : null

    await ElMessageBox.confirm(
      `确认${operation === 'approve' ? '通过' : '驳回'}选中的 ${reviewSelection.value.length} 条记录？`,
      '批量审核',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )

    reviewing.value = true
    for (const row of reviewSelection.value) {
      await reviewBatchApi({
        batch_id: row.id,
        approved: operation === 'approve',
        review_reason: reason?.value
      })
    }
    ElMessage.success(`批量审核完成`)
    fetchReviewData()
  } catch (e) {
    console.error('Failed to batch review:', e)
  } finally {
    reviewing.value = false
  }
}

onMounted(() => {
  addRow()
  fetchReviewData()
})

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
    progressTimer = null
  }
})
</script>

<style scoped>
.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-form {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.batch-table :deep(.el-table__row:hover) {
  transform: scale(1.005);
  transition: transform 0.2s ease;
}

.batch-table :deep(.el-table__row.row-success) {
  background-color: #f0f9eb !important;
}

.batch-table :deep(.el-table__row.row-error) {
  background-color: #fef0f0 !important;
}

.batch-table :deep(.el-table__row.row-warning) {
  background-color: #fdf6ec !important;
}

.review-row:hover {
  transform: scale(1.005);
  transition: transform 0.2s ease;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.shake-error :deep(.el-input__wrapper) {
  animation: shake 0.4s ease-in-out;
  border-color: #f56c6c !important;
  box-shadow: 0 0 0 1px #f56c6c inset !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-3px); }
  40%, 80% { transform: translateX(3px); }
}

.stat-card {
  height: 100%;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.card-title {
  font-weight: 600;
}

.mb15 {
  margin-bottom: 15px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.actions-left {
  flex: 1;
}

.actions-right {
  display: flex;
  gap: 10px;
}

.progress-section {
  padding: 10px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-batch-no {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.progress-detail {
  font-size: 13px;
  color: #606266;
}
</style>
