<template>
  <div class="ccb-business-deposit-batch">
    <CcbPageHeader
      title="批量存款"
      description="网点日间集中存款业务批量处理"
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
              <div class="stat-label">预计利息合计</div>
              <div class="stat-value text-success">{{ formatThousands(totalInterest) }}</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">批量录入</span>
        <el-button
          type="primary"
          :icon="Plus"
          size="small"
          @click="addRow"
          :disabled="submitting"
        >
          添加一行
        </el-button>
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
        <el-table-column label="账号" min-width="160">
          <template #default="{ row }">
            <el-input
              v-model="row.account_no"
              placeholder="请输入账号"
              size="small"
              @blur="validateRow(row)"
              :class="{ 'shake-error': row.hasError }"
            />
          </template>
        </el-table-column>
        <el-table-column label="存款类型" width="130">
          <template #default="{ row }">
            <el-select
              v-model="row.deposit_type"
              placeholder="选择类型"
              size="small"
              style="width: 100%"
              @change="handleTypeChange(row)"
            >
              <el-option v-for="item in DEPOSIT_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="存款产品" min-width="180">
          <template #default="{ row }">
            <el-select
              v-model="row.product_id"
              placeholder="选择产品"
              size="small"
              style="width: 100%"
              filterable
              @change="handleProductChange(row)"
            >
              <el-option
                v-for="p in getFilteredProducts(row.deposit_type)"
                :key="p.id"
                :label="p.name"
                :value="p.id"
              >
                <span>{{ p.name }}</span>
                <span style="float: right; color: #8492a6; font-size: 12px">
                  {{ p.interest_rate }}% | {{ formatThousands(p.min_amount) }}起
                </span>
              </el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="存期" width="110">
          <template #default="{ row }">
            <el-select
              v-model="row.term"
              placeholder="选择存期"
              size="small"
              style="width: 100%"
              @change="validateRow(row)"
            >
              <el-option
                v-for="t in getFilteredTerms(row.deposit_type)"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="存款金额" width="150">
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
        <el-table-column label="计息方式" width="110">
          <template #default="{ row }">
            <el-select
              v-model="row.interest_calc_method"
              placeholder="计息方式"
              size="small"
              style="width: 100%"
            >
              <el-option v-for="item in INTEREST_CALC_METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="预计利息" width="130" align="right">
          <template #default="{ row }">
            <span class="amount-positive">{{ formatThousands(calculateRowInterest(row)) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.success === true" type="success" effect="light" size="small">成功</el-tag>
            <el-tag v-else-if="row.success === false" type="danger" effect="light" size="small">失败</el-tag>
            <el-tag v-else-if="row.need_review" type="warning" effect="light" size="small">待复核</el-tag>
            <el-tag v-else type="info" effect="light" size="small">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="错误信息" min-width="200">
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
        <el-table-column label="操作" width="80" align="center">
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
            注：普通员工仅可办理单笔≤{{ formatThousands(BATCH_SMALL_AMOUNT_THRESHOLD) }}元的小额批量存款；
            大额批量存款需管理员复核
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

    <el-card shadow="hover" v-permission="'business:deposit:review'">
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
        <el-table-column prop="deposit_no" label="存款流水号" width="200" />
        <el-table-column prop="account_no" label="账号" width="160" />
        <el-table-column prop="customer_name" label="客户姓名" width="100" />
        <el-table-column prop="deposit_type_text" label="存款类型" width="110" />
        <el-table-column prop="product_name" label="产品名称" width="180" show-overflow-tooltip />
        <el-table-column prop="amount" label="存款金额" width="140" align="right">
          <template #default="{ row }">
            <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="term_text" label="存期" width="80" />
        <el-table-column prop="interest_rate" label="利率(%)" width="90" align="right" />
        <el-table-column prop="review_reason" label="复核原因" width="200" show-overflow-tooltip />
        <el-table-column prop="operator_name" label="经办人" width="100" />
        <el-table-column prop="createdAt" label="提交时间" width="160" />
        <el-table-column label="操作" width="160" fixed="right">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Check, Close } from '@element-plus/icons-vue'
import {
  DEPOSIT_TYPE_OPTIONS,
  DEPOSIT_TERM_OPTIONS,
  DEPOSIT_STATUS_OPTIONS,
  INTEREST_CALC_METHOD_OPTIONS,
  BATCH_SMALL_AMOUNT_THRESHOLD,
  type Deposit,
  type BatchDepositItem,
  type BatchDepositResultItem,
  type DepositProduct,
  getDepositConfigApi,
  getDepositListApi,
  batchDepositApi,
  batchReviewDepositApi,
  preCheckDepositApi,
  formatThousands
} from '@api/deposit'

const submitting = ref(false)
const reviewing = ref(false)
const config = ref<{ products: DepositProduct[] } | null>(null)

const batchItems = ref<(BatchDepositItem & {
  hasError?: boolean
  success?: boolean
  need_review?: boolean
  errors?: string[]
  warnings?: string[]
  pre_check?: any
  index: number
})[]>([])

const reviewLoading = ref(false)
const reviewData = ref<Deposit[]>([])
const reviewTotal = ref(0)
const reviewSelection = ref<Deposit[]>([])

const reviewPage = reactive({
  page: 1,
  pageSize: 10
})

const pendingCount = computed(() => batchItems.value.filter(i => i.success === undefined && !i.need_review).length)
const reviewCount = computed(() => reviewData.value.length)
const successCount = computed(() => batchItems.value.filter(i => i.success === true).length)

const totalAmount = computed(() => batchItems.value.reduce((sum, item) => sum + (item.amount || 0), 0))
const totalInterest = computed(() => batchItems.value.reduce((sum, item) => sum + calculateRowInterest(item), 0))

const canSubmit = computed(() => {
  const hasValidItems = batchItems.value.some(i => i.account_no && i.amount > 0 && !i.hasError)
  return hasValidItems && !submitting.value
})

const loadConfig = async () => {
  try {
    const res = await getDepositConfigApi()
    config.value = res.data
  } catch (e) {
    console.error('Failed to load config:', e)
  }
}

const addRow = () => {
  const newIndex = batchItems.value.length
  batchItems.value.push({
    index: newIndex,
    account_no: '',
    deposit_type: 1,
    product_id: '',
    amount: 0,
    term: 365,
    interest_calc_method: 3,
    remark: ''
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
}

const getFilteredProducts = (depositType: number) => {
  if (!config?.value?.products) return []
  return config.value.products.filter(p => p.deposit_type === depositType && p.status === 1)
}

const getFilteredTerms = (depositType: number) => {
  if (depositType === 2) {
    return DEPOSIT_TERM_OPTIONS.filter(t => t.value >= 365)
  } else if (depositType === 3) {
    return DEPOSIT_TERM_OPTIONS.filter(t => t.value === 0 || t.value >= 30)
  }
  return DEPOSIT_TERM_OPTIONS
}

const handleTypeChange = (row: any) => {
  row.product_id = ''
  if (row.deposit_type === 2) {
    row.term = 365
  } else if (row.deposit_type === 3) {
    row.term = 0
  }
  validateRow(row)
}

const handleProductChange = (row: any) => {
  const product = getFilteredProducts(row.deposit_type).find(p => p.id === row.product_id)
  if (product) {
    row.term = product.term_days
  }
  validateRow(row)
}

const handleAmountInput = (row: any) => {
  if (row.amount < 0) {
    row.amount = 0
  }
  validateRow(row)
}

const triggerShake = (row: any) => {
  row.hasError = true
  setTimeout(() => {
    row.hasError = false
  }, 500)
}

const validateRow = async (row: any) => {
  row.errors = []
  row.warnings = []

  if (!row.account_no) {
    row.errors.push('请输入账号')
  }
  if (!row.amount || row.amount <= 0) {
    row.errors.push('请输入有效的存款金额')
  }
  if (!row.product_id) {
    row.errors.push('请选择存款产品')
  }

  if (row.account_no && row.amount > 0 && row.product_id) {
    try {
      const res = await preCheckDepositApi({
        account_no: row.account_no,
        deposit_type: row.deposit_type,
        product_id: row.product_id,
        amount: row.amount,
        term: row.term
      })
      row.pre_check = res.data
      if (!res.data.passed) {
        row.errors.push(res.data.block_reason || '校验未通过')
        triggerShake(row)
      }
      if (res.data.warnings && res.data.warnings.length > 0) {
        row.warnings = [...res.data.warnings]
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

const calculateRowInterest = (row: any) => {
  if (!row.pre_check?.applicable_rate || !row.amount || !row.term) return 0
  const rate = row.pre_check.applicable_rate / 100
  const term = row.term
  return row.amount * rate * (term / 365)
}

const getRowClassName = ({ row }: { row: any }) => {
  if (row.success === true) return 'row-success'
  if (row.success === false) return 'row-error'
  if (row.need_review) return 'row-warning'
  return ''
}

const handleSubmit = async () => {
  const validItems = batchItems.value.filter(i => i.account_no && i.amount > 0 && (!i.errors || i.errors.length === 0))
  if (validItems.length === 0) {
    ElMessage.warning('没有有效的存款记录')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认提交 ${validItems.length} 条存款记录？大额存款将进入复核流程`,
      '确认提交',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const res = await batchDepositApi({
      items: validItems.map(i => ({
        account_no: i.account_no,
        deposit_type: i.deposit_type,
        product_id: i.product_id,
        amount: i.amount,
        term: i.term,
        interest_calc_method: i.interest_calc_method,
        remark: i.remark
      }))
    })

    res.data.details.forEach((d: BatchDepositResultItem) => {
      const item = batchItems.value[d.index]
      if (item) {
        item.success = d.success
        item.need_review = d.need_review
        item.errors = d.errors || item.errors
        item.warnings = d.warnings || item.warnings
      }
    })

    ElMessage.success(
      `批量提交完成：成功${res.data.success_count}条，失败${res.data.fail_count}条，待复核${res.data.review_count}条`
    )
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
    const res = await getDepositListApi({
      page: reviewPage.page,
      pageSize: reviewPage.pageSize,
      status: 5
    })
    reviewData.value = res.data.list
    reviewTotal.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch review list:', e)
  } finally {
    reviewLoading.value = false
  }
}

const handleReviewSelectionChange = (val: Deposit[]) => {
  reviewSelection.value = val
}

const handleSingleReview = async (row: Deposit, operation: 'approve' | 'reject') => {
  try {
    const reason = operation === 'reject' ? await ElMessageBox.prompt('请输入驳回原因', '驳回', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入驳回原因'
    }) : null

    reviewing.value = true
    await batchReviewDepositApi({
      items: [{
        id: row.id,
        operation,
        reason: reason?.value
      }]
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
    const reason = operation === 'reject' ? await ElMessageBox.prompt('请输入驳回原因', '批量驳回', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '请输入驳回原因'
    }) : null

    await ElMessageBox.confirm(
      `确认${operation === 'approve' ? '通过' : '驳回'}选中的 ${reviewSelection.value.length} 条记录？`,
      '批量审核',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )

    reviewing.value = true
    await batchReviewDepositApi({
      items: reviewSelection.value.map(r => ({
        id: r.id,
        operation,
        reason: reason?.value
      }))
    })
    ElMessage.success(`批量审核完成`)
    fetchReviewData()
  } catch (e) {
    console.error('Failed to batch review:', e)
  } finally {
    reviewing.value = false
  }
}

onMounted(() => {
  loadConfig()
  addRow()
  fetchReviewData()
})
</script>

<style scoped>
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
</style>
