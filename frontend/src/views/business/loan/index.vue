<template>
  <div class="ccb-business-loan">
    <CcbPageHeader
      title="贷款申请受理"
      description="个人消费贷、经营贷、房贷、车贷多业务分支流程"
      icon="CreditCard"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="贷款编号" prop="loan_no">
        <el-input v-model="searchForm.loan_no" placeholder="请输入贷款编号" clearable />
      </el-form-item>
      <el-form-item label="客户号" prop="customer_no">
        <el-input v-model="searchForm.customer_no" placeholder="请输入客户号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customer_name">
        <el-input v-model="searchForm.customer_name" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="证件号码" prop="id_card_no">
        <el-input v-model="searchForm.id_card_no" placeholder="请输入证件号码" clearable />
      </el-form-item>
      <el-form-item label="贷款类型" prop="loan_type">
        <el-select v-model="searchForm.loan_type" placeholder="请选择贷款类型" clearable>
          <el-option v-for="item in LOAN_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in LOAN_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="贷款期限" prop="term">
        <el-select v-model="searchForm.term" placeholder="请选择期限" clearable>
          <el-option v-for="item in LOAN_TERM_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Plus" @click="openCreate" v-permission="'business:loan:create'">
          <span class="ripple-btn">新申请</span>
        </el-button>
        <el-button type="success" :icon="Files" @click="goBatch" v-permission="'business:loan:batch'">批量贷款</el-button>
        <el-button type="info" :icon="Search" @click="goTrace" v-permission="'business:loan:trace'">贷款溯源</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          贷款总数：<el-text type="primary" size="large">{{ total }}</el-text>
        </el-text>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      row-class-name="loan-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="loan_no" label="贷款编号" width="180" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="loan_type_text" label="贷款类型" width="110" />
      <el-table-column prop="purpose_text" label="贷款用途" width="100" />
      <el-table-column prop="amount" label="贷款金额" width="140" align="right">
        <template #default="{ row }">
          <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="term_text" label="期限" width="80" />
      <el-table-column prop="interest_rate" label="年利率(%)" width="100" align="right" />
      <el-table-column prop="monthly_payment" label="月供" width="120" align="right">
        <template #default="{ row }">
          <span v-if="row.monthly_payment">{{ formatThousands(row.monthly_payment) }}</span>
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="is_low_quality" label="资质等级" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.is_low_quality" type="warning" effect="light" size="small">重点关注</el-tag>
          <el-tag v-else type="success" effect="light" size="small">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operator_name" label="经办人" width="100" />
      <el-table-column prop="apply_time" label="申请时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 1"
            type="success" link size="small"
            @click="handlePreApprove(row)"
            v-permission="'business:loan:preapprove'"
          >预审</el-button>
          <el-button
            v-if="row.status === 2 || row.status === 4"
            type="warning" link size="small"
            @click="handleFinalApprove(row)"
            v-permission="'business:loan:finalapprove'"
          >终审</el-button>
          <el-button
            v-if="row.status !== 7 && row.status !== 8"
            type="danger" link size="small"
            @click="handleCancel(row)"
            v-permission="'business:loan:update'"
          >撤销</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showCreate"
      :title="isEditing ? '修改贷款' : '新贷款申请'"
      width="780px"
      class="loan-dialog"
      :close-on-click-modal="false"
      destroy-on-close
      @close="handleDialogClose"
    >
      <div class="loan-precheck-summary" v-if="preCheckResult">
        <el-alert
          v-if="!preCheckResult.passed"
          :title="preCheckResult.block_reason || '前置校验未通过'"
          type="error"
          show-icon
          :closable="false"
        />
        <el-alert
          v-else
          title="前置校验通过"
          type="success"
          show-icon
          :closable="false"
        />
      </div>

      <el-alert
        v-if="preCheckResult && preCheckResult.warnings && preCheckResult.warnings.length > 0"
        :title="preCheckResult.warnings.join('；')"
        type="warning"
        show-icon
        class="mt15"
        :closable="false"
      />

      <el-form
        ref="loanFormRef"
        :model="loanForm"
        :rules="loanRules"
        label-width="120px"
        class="ccb-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户编号" prop="customer_no">
              <el-input
                v-model="loanForm.customer_no"
                placeholder="请输入客户编号"
                :class="{ 'shake-error': fieldErrors.customer_no }"
                @blur="triggerPreCheck"
                @change="handleCustomerNoChange"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件号码" prop="id_card_no">
              <el-input
                v-model="loanForm.id_card_no"
                placeholder="请输入证件号码"
                :class="{ 'shake-error': fieldErrors.id_card_no }"
                @blur="triggerPreCheck"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="贷款类型" prop="loan_type">
              <el-select
                v-model="loanForm.loan_type"
                placeholder="请选择贷款类型"
                :class="{ 'shake-error': fieldErrors.loan_type }"
                @change="handleLoanTypeChange"
                style="width: 100%"
              >
                <el-option v-for="item in LOAN_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="贷款用途" prop="purpose">
              <el-select
                v-model="loanForm.purpose"
                placeholder="请选择贷款用途"
                :class="{ 'shake-error': fieldErrors.purpose }"
                @change="triggerPreCheck"
                style="width: 100%"
              >
                <el-option v-for="item in purposeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="贷款金额" prop="amount">
              <el-input-number
                v-model="loanForm.amount"
                :min="currentTypeConfig?.min_amount || 1000"
                :max="currentTypeConfig?.max_amount || 10000000"
                :step="1000"
                :controls="false"
                :class="{ 'shake-error': fieldErrors.amount }"
                @change="handleAmountChange"
                style="width: 100%"
              />
            </el-form-item>
            <div class="amount-hint" v-if="preCheckResult">
              <span v-if="preCheckResult.suggested_amount" class="hint-item">
                建议额度：{{ formatThousands(preCheckResult.suggested_amount) }}元
              </span>
              <span v-if="preCheckResult.max_loan_amount" class="hint-item">
                最高额度：{{ formatThousands(preCheckResult.max_loan_amount) }}元
              </span>
            </div>
          </el-col>
          <el-col :span="12">
            <el-form-item label="贷款期限" prop="term">
              <el-select
                v-model="loanForm.term"
                placeholder="请选择贷款期限"
                :class="{ 'shake-error': fieldErrors.term }"
                @change="handleTermChange"
                style="width: 100%"
              >
                <el-option
                  v-for="item in availableTermOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="还款方式" prop="repayment_method">
              <el-select
                v-model="loanForm.repayment_method"
                placeholder="请选择还款方式"
                style="width: 100%"
              >
                <el-option
                  v-for="item in availableRepaymentOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="年利率(%)" prop="interest_rate">
              <el-input-number
                v-model="loanForm.interest_rate"
                :min="currentTypeConfig?.interest_rate_min || 3"
                :max="currentTypeConfig?.interest_rate_max || 20"
                :step="0.05"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="loan-preview-card" v-if="loanForm.amount && loanForm.term && loanForm.interest_rate">
          <div class="preview-title">贷款试算结果</div>
          <div class="preview-grid">
            <div class="preview-item">
              <div class="preview-label">月供</div>
              <div class="preview-value">{{ formatThousands(monthlyPayment) }}</div>
            </div>
            <div class="preview-item">
              <div class="preview-label">总利息</div>
              <div class="preview-value">{{ formatThousands(totalInterest) }}</div>
            </div>
            <div class="preview-item">
              <div class="preview-label">还款总额</div>
              <div class="preview-value">{{ formatThousands(totalPayment) }}</div>
            </div>
            <div class="preview-item">
              <div class="preview-label">还款方式</div>
              <div class="preview-value">{{ getRepaymentMethodLabel(loanForm.repayment_method) }}</div>
            </div>
          </div>
        </div>

        <el-form-item label="用途说明" prop="purpose_detail">
          <el-input
            v-model="loanForm.purpose_detail"
            type="textarea"
            :rows="3"
            placeholder="请详细描述贷款用途"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="loanForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreate = false">取消</el-button>
          <el-button type="primary" :loading="submitting" :icon="Loading" @click="handleSubmit">
            {{ submitting ? '提交中...' : '提交申请' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showDetail"
      title="贷款详情"
      width="720px"
      class="loan-detail-dialog"
      destroy-on-close
    >
      <el-descriptions :column="2" border v-if="currentLoan">
        <el-descriptions-item label="贷款编号">{{ currentLoan.loan_no }}</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentLoan.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="贷款类型">{{ currentLoan.loan_type_text }}</el-descriptions-item>
        <el-descriptions-item label="贷款用途">{{ currentLoan.purpose_text }}</el-descriptions-item>
        <el-descriptions-item label="贷款金额">
          <span class="amount-positive">{{ formatThousands(currentLoan.amount) }}元</span>
        </el-descriptions-item>
        <el-descriptions-item label="贷款期限">{{ currentLoan.term_text }}</el-descriptions-item>
        <el-descriptions-item label="年利率">{{ currentLoan.interest_rate }}%</el-descriptions-item>
        <el-descriptions-item label="还款方式">{{ currentLoan.repayment_method_text }}</el-descriptions-item>
        <el-descriptions-item label="月供">
          <span v-if="currentLoan.monthly_payment">{{ formatThousands(currentLoan.monthly_payment) }}元</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="总利息">
          <span v-if="currentLoan.total_interest">{{ formatThousands(currentLoan.total_interest) }}元</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentLoan.status)" effect="light" size="small">
            {{ currentLoan.status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ currentLoan.apply_time }}</el-descriptions-item>
        <el-descriptions-item label="经办人" :span="2">{{ currentLoan.operator_name }}</el-descriptions-item>
        <el-descriptions-item label="用途说明" :span="2">{{ currentLoan.purpose_detail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentLoan.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Files, Search, Loading } from '@element-plus/icons-vue'
import {
  LOAN_TYPE_OPTIONS,
  LOAN_STATUS_OPTIONS,
  LOAN_TERM_OPTIONS,
  REPAYMENT_METHOD_OPTIONS,
  LOAN_PURPOSE_OPTIONS,
  formatThousands,
  type Loan,
  type LoanQueryParams,
  type LoanPreCheckRequest,
  type LoanPreCheckResult,
  type CreateLoanRequest,
  type LoanType as LoanTypeEnum,
  type RepaymentMethod as RepaymentMethodEnum,
  getLoanListApi,
  getLoanConfigApi,
  preCheckLoanApi,
  createLoanApi,
  cancelLoanApi
} from '@api/loan'

const router = useRouter()

const searchForm = reactive({
  keyword: '',
  loan_no: '',
  customer_no: '',
  customer_name: '',
  id_card_no: '',
  loan_type: undefined as LoanTypeEnum | undefined,
  status: undefined as number | undefined,
  term: undefined as number | undefined,
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const loading = ref(false)
const tableData = ref<Loan[]>([])
const total = ref(0)

const showCreate = ref(false)
const showDetail = ref(false)
const submitting = ref(false)
const isEditing = ref(false)
const currentLoan = ref<Loan | null>(null)

const preCheckResult = ref<LoanPreCheckResult | null>(null)
const preChecking = ref(false)
let preCheckTimer: any = null

const loanFormRef = ref<FormInstance>()
const fieldErrors = reactive<Record<string, boolean>>({})

const loanForm = reactive<CreateLoanRequest & { customer_no?: string; id_card_no?: string }>({
  customer_no: '',
  id_card_no: '',
  loan_type: 1,
  amount: 100000,
  term: 12,
  purpose: 'consumption',
  purpose_detail: '',
  repayment_method: 1,
  interest_rate: 5.6,
  remark: ''
})

const loanRules: FormRules = {
  customer_no: [{ required: true, message: '请输入客户编号', trigger: 'blur' }],
  loan_type: [{ required: true, message: '请选择贷款类型', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入贷款金额', trigger: 'blur' },
    { type: 'number', min: 1000, message: '贷款金额不能低于1000元', trigger: 'blur' }
  ],
  term: [{ required: true, message: '请选择贷款期限', trigger: 'change' }],
  purpose: [{ required: true, message: '请选择贷款用途', trigger: 'change' }],
  repayment_method: [{ required: true, message: '请选择还款方式', trigger: 'change' }]
}

const loanConfig = ref<any>(null)

const currentTypeConfig = computed(() => {
  if (!loanConfig.value || !loanForm.loan_type) return null
  return loanConfig.value.type_configs?.[loanForm.loan_type]
})

const purposeOptions = computed(() => {
  if (!currentTypeConfig.value) return LOAN_PURPOSE_OPTIONS
  const validPurposes: Record<number, string[]> = {
    1: ['consumption', 'education', 'travel', 'medical', 'other'],
    2: ['business', 'other'],
    3: ['house', 'other'],
    4: ['car', 'other']
  }
  const validList = validPurposes[loanForm.loan_type] || []
  return LOAN_PURPOSE_OPTIONS.filter(opt => validList.includes(opt.value as string))
})

const availableTermOptions = computed(() => {
  if (!currentTypeConfig.value) return LOAN_TERM_OPTIONS
  return LOAN_TERM_OPTIONS.filter(opt =>
    currentTypeConfig.value.available_terms?.includes(opt.value)
  )
})

const availableRepaymentOptions = computed(() => {
  if (!currentTypeConfig.value) return REPAYMENT_METHOD_OPTIONS
  return REPAYMENT_METHOD_OPTIONS.filter(opt =>
    currentTypeConfig.value.repayment_methods?.includes(opt.value)
  )
})

const monthlyPayment = computed(() => {
  if (!loanForm.amount || !loanForm.term || !loanForm.interest_rate) return 0
  const rate = loanForm.interest_rate / 100 / 12
  const n = loanForm.term
  const p = loanForm.amount
  if (loanForm.repayment_method === 1) {
    const factor = Math.pow(1 + rate, n)
    return p * rate * factor / (factor - 1)
  } else if (loanForm.repayment_method === 2) {
    const principalPerMonth = p / n
    const firstInterest = p * rate
    return principalPerMonth + firstInterest
  } else if (loanForm.repayment_method === 3) {
    return p * rate
  }
  return 0
})

const totalInterest = computed(() => {
  if (!loanForm.amount || !loanForm.term || !loanForm.interest_rate) return 0
  const rate = loanForm.interest_rate / 100 / 12
  const n = loanForm.term
  const p = loanForm.amount
  if (loanForm.repayment_method === 1) {
    return monthlyPayment.value * n - p
  } else if (loanForm.repayment_method === 2) {
    let total = 0
    for (let i = 0; i < n; i++) {
      total += (p - (p / n) * i) * rate
    }
    return total
  } else if (loanForm.repayment_method === 3) {
    return p * rate * n
  } else if (loanForm.repayment_method === 4) {
    return p * (loanForm.interest_rate / 100) * (n / 12)
  }
  return 0
})

const totalPayment = computed(() => {
  return Number(loanForm.amount || 0) + totalInterest.value
})

function fetchList() {
  loading.value = true
  const params: LoanQueryParams = {
    page: pageParams.page,
    pageSize: pageParams.pageSize,
    keyword: searchForm.keyword || undefined,
    loan_no: searchForm.loan_no || undefined,
    customer_no: searchForm.customer_no || undefined,
    customer_name: searchForm.customer_name || undefined,
    id_card_no: searchForm.id_card_no || undefined,
    loan_type: searchForm.loan_type,
    status: searchForm.status as any,
    term: searchForm.term as any,
    start_time: searchForm.timeRange?.[0],
    end_time: searchForm.timeRange?.[1]
  }
  getLoanListApi(params).then(res => {
    tableData.value = res.list
    total.value = res.total
  }).finally(() => {
    loading.value = false
  })
}

function handleSearch() {
  pageParams.page = 1
  fetchList()
}

function handleReset() {
  searchForm.loan_no = ''
  searchForm.customer_no = ''
  searchForm.customer_name = ''
  searchForm.id_card_no = ''
  searchForm.loan_type = undefined
  searchForm.status = undefined
  searchForm.term = undefined
  searchForm.timeRange = []
  pageParams.page = 1
  fetchList()
}

function handlePageChange() {
  fetchList()
}

function handleSelectionChange(selection: Loan[]) {
  console.log('Selection:', selection)
}

function getStatusType(status: number): string {
  const statusMap: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger',
    4: 'warning',
    5: 'success',
    6: 'danger',
    7: 'success',
    8: 'info'
  }
  return statusMap[status] || ''
}

function getStatusLabel(status: number): string {
  const item = LOAN_STATUS_OPTIONS.find(opt => opt.value === status)
  return item?.label || '未知'
}

function getRepaymentMethodLabel(method: number): string {
  const item = REPAYMENT_METHOD_OPTIONS.find(opt => opt.value === method)
  return item?.label || '未知'
}

function openCreate() {
  isEditing.value = false
  resetLoanForm()
  showCreate.value = true
  if (loanConfig.value) {
    initDefaultValues()
  }
}

function resetLoanForm() {
  loanForm.customer_no = ''
  loanForm.id_card_no = ''
  loanForm.loan_type = 1
  loanForm.amount = 100000
  loanForm.term = 12
  loanForm.purpose = 'consumption'
  loanForm.purpose_detail = ''
  loanForm.repayment_method = 1
  loanForm.interest_rate = 5.6
  loanForm.remark = ''
  preCheckResult.value = null
  Object.keys(fieldErrors).forEach(key => {
    fieldErrors[key] = false
  })
}

function initDefaultValues() {
  if (currentTypeConfig.value) {
    loanForm.amount = currentTypeConfig.value.min_amount || 10000
    loanForm.term = currentTypeConfig.value.available_terms?.[0] || 12
    loanForm.interest_rate = currentTypeConfig.value.interest_rate_base || 5.6
    loanForm.repayment_method = currentTypeConfig.value.repayment_methods?.[0] || 1
  }
}

function triggerPreCheck() {
  if (preCheckTimer) clearTimeout(preCheckTimer)
  preCheckTimer = setTimeout(() => {
    doPreCheck()
  }, 500)
}

async function doPreCheck() {
  if (!loanForm.customer_no && !loanForm.id_card_no) return
  if (!loanForm.loan_type || !loanForm.amount) return

  preChecking.value = true
  try {
    const request: LoanPreCheckRequest = {
      customer_no: loanForm.customer_no || undefined,
      id_card_no: loanForm.id_card_no || undefined,
      loan_type: loanForm.loan_type,
      amount: loanForm.amount,
      term: loanForm.term,
      purpose: loanForm.purpose
    }
    const result = await preCheckLoanApi(request)
    preCheckResult.value = result

    fieldErrors.amount = !result.amount_matched
    fieldErrors.purpose = !result.purpose_compliant

    if (!result.amount_matched) {
      triggerShake('amount')
    }
    if (!result.purpose_compliant) {
      triggerShake('purpose')
    }

    if (result.applicable_rate) {
      loanForm.interest_rate = result.applicable_rate
    }
  } catch (e: any) {
    console.error('Pre-check failed:', e)
  } finally {
    preChecking.value = false
  }
}

function triggerShake(field: string) {
  fieldErrors[field] = true
  nextTick(() => {
    setTimeout(() => {
      fieldErrors[field] = false
    }, 400)
  })
}

function handleCustomerNoChange() {
  triggerPreCheck()
}

function handleLoanTypeChange() {
  initDefaultValues()
  triggerPreCheck()
}

function handleAmountChange() {
  triggerPreCheck()
}

function handleTermChange() {
  triggerPreCheck()
}

async function handleSubmit() {
  if (!loanFormRef.value) return

  try {
    await loanFormRef.value.validate()
  } catch (e) {
    return
  }

  if (preCheckResult.value && !preCheckResult.value.passed) {
    ElMessage.error(preCheckResult.value.block_reason || '前置校验未通过，无法提交')
    return
  }

  submitting.value = true
  try {
    await createLoanApi(loanForm as CreateLoanRequest)
    ElMessage.success('贷款申请提交成功')
    showCreate.value = false
    fetchList()
  } catch (e: any) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function handleDialogClose() {
  if (preCheckTimer) clearTimeout(preCheckTimer)
}

function handleDetail(row: Loan) {
  currentLoan.value = row
  showDetail.value = true
}

function handleCancel(row: Loan) {
  ElMessageBox.confirm(
    `确定要撤销贷款申请 ${row.loan_no} 吗？撤销后流程数据将清空。`,
    '撤销确认',
    {
      confirmButtonText: '确定撤销',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      await cancelLoanApi(row.id, '用户主动撤销')
      ElMessage.success('贷款申请已撤销')
      fetchList()
    } catch (e: any) {
      ElMessage.error(e.message || '撤销失败')
    }
  }).catch(() => {})
}

function handlePreApprove(row: Loan) {
  ElMessageBox.confirm(
    `确定要预审通过贷款申请 ${row.loan_no} 吗？`,
    '预审确认',
    {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(async () => {
    try {
      const { preApproveLoanApi } = await import('@api/loan')
      await preApproveLoanApi(row.id, true)
      ElMessage.success('预审通过')
      fetchList()
    } catch (e: any) {
      ElMessage.error(e.message || '预审失败')
    }
  }).catch(() => {})
}

function handleFinalApprove(row: Loan) {
  ElMessageBox.confirm(
    `确定要终审通过贷款申请 ${row.loan_no} 吗？`,
    '终审确认',
    {
      confirmButtonText: '通过',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const { finalApproveLoanApi } = await import('@api/loan')
      await finalApproveLoanApi(row.id, true)
      ElMessage.success('终审通过')
      fetchList()
    } catch (e: any) {
      ElMessage.error(e.message || '终审失败')
    }
  }).catch(() => {})
}

function goBatch() {
  router.push('/business/loan/batch')
}

function goTrace() {
  router.push('/business/loan/trace')
}

async function loadConfig() {
  try {
    loanConfig.value = await getLoanConfigApi()
  } catch (e) {
    console.error('Load config failed:', e)
  }
}

onMounted(() => {
  loadConfig()
  fetchList()
})
</script>

<style lang="scss" scoped>
.ccb-business-loan {
  .amount-positive {
    color: var(--el-color-success);
    font-weight: 600;
  }

  .text-muted {
    color: var(--el-text-color-secondary);
  }

  .mt15 {
    margin-top: 15px;
  }

  .loan-dialog {
    :deep(.el-dialog__body) {
      padding-top: 10px;
    }
  }

  .loan-precheck-summary {
    margin-bottom: 15px;
  }

  .shake-error {
    animation: shake 0.4s ease-in-out;
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }
    :deep(.el-select__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
  }

  .amount-hint {
    display: flex;
    gap: 16px;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    .hint-item {
      color: var(--el-color-primary);
    }
  }

  .loan-preview-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    padding: 20px;
    margin: 10px 0 20px;
    color: #fff;

    .preview-title {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 16px;
      font-weight: 500;
    }

    .preview-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .preview-item {
      text-align: center;

      .preview-label {
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 6px;
      }

      .preview-value {
        font-size: 18px;
        font-weight: 600;
      }
    }
  }

  :deep(.loan-row:hover) {
    transform: scale(1.005);
    transition: transform 0.2s ease;
  }
}
</style>
