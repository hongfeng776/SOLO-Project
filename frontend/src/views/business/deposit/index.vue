<template>
  <div class="ccb-business-deposit">
    <CcbPageHeader
      title="存款办理"
      description="普通存款、大额存单、智能存款多业务分支流程"
      icon="Wallet"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="存款流水号" prop="deposit_no">
        <el-input v-model="searchForm.deposit_no" placeholder="请输入存款流水号" clearable />
      </el-form-item>
      <el-form-item label="账号" prop="account_no">
        <el-input v-model="searchForm.account_no" placeholder="请输入账号" clearable />
      </el-form-item>
      <el-form-item label="客户号" prop="customer_no">
        <el-input v-model="searchForm.customer_no" placeholder="请输入客户号" clearable />
      </el-form-item>
      <el-form-item label="存款类型" prop="deposit_type">
        <el-select v-model="searchForm.deposit_type" placeholder="请选择存款类型" clearable>
          <el-option v-for="item in DEPOSIT_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in DEPOSIT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="存期" prop="term">
        <el-select v-model="searchForm.term" placeholder="请选择存期" clearable>
          <el-option v-for="item in DEPOSIT_TERM_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="办理时间" prop="timeRange">
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
        <el-button type="primary" :icon="Plus" @click="openCreate" v-permission="'business:deposit:create'">
          <span class="ripple-btn">新存款</span>
        </el-button>
        <el-button type="success" :icon="Files" @click="goBatch" v-permission="'business:deposit:batch'">批量存款</el-button>
        <el-button type="info" :icon="Search" @click="goTrace" v-permission="'business:deposit:trace'">存款溯源</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          存款总数：<el-text type="primary" size="large">{{ total }}</el-text>
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
      row-class-name="deposit-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
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
      <el-table-column prop="interest_amount" label="预计利息" width="120" align="right">
        <template #default="{ row }">
          <span class="amount-positive">{{ formatThousands(row.interest_amount || 0) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="maturity_date" label="到期日" width="110" />
      <el-table-column prop="operator_name" label="经办人" width="100" />
      <el-table-column prop="org_name" label="办理机构" width="120" />
      <el-table-column prop="createdAt" label="办理时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 0"
            type="success" link size="small"
            @click="handleConfirm(row)"
            v-permission="'business:deposit:confirm'"
          >入账</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 5"
            type="warning" link size="small"
            @click="handleCancel(row)"
            v-permission="'business:deposit:update'"
          >撤销</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showCreate"
      :title="isEditing ? '修改存款' : '新存款办理'"
      width="780px"
      class="deposit-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        v-if="preCheckResult && !preCheckResult.passed"
        :title="preCheckResult.block_reason || '前置校验未通过'"
        type="error"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && preCheckResult.warnings && preCheckResult.warnings.length > 0"
        :title="preCheckResult.warnings[0]"
        type="warning"
        show-icon
        class="mb15"
        :closable="false"
      />

      <el-form
        ref="depositFormRef"
        :model="depositForm"
        :rules="depositRules"
        label-width="120px"
        class="ccb-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="存款类型" prop="deposit_type">
              <el-select
                v-model="depositForm.deposit_type"
                placeholder="请选择存款类型"
                style="width: 100%"
                @change="handleTypeChange"
              >
                <el-option
                  v-for="item in DEPOSIT_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存款产品" prop="product_id">
              <el-select
                v-model="depositForm.product_id"
                placeholder="请选择存款产品"
                style="width: 100%"
                @change="handleProductChange"
                filterable
              >
                <el-option
                  v-for="p in filteredProducts"
                  :key="p.id"
                  :label="p.name"
                  :value="p.id"
                >
                  <span>{{ p.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 12px">
                    利率: {{ p.interest_rate }}% | 起存: {{ formatThousands(p.min_amount) }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户账号" prop="account_no">
              <el-input
                v-model="depositForm.account_no"
                placeholder="请输入客户账号"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存期" prop="term">
              <el-select
                v-model="depositForm.term"
                placeholder="请选择存期"
                style="width: 100%"
                @change="runPreCheck"
              >
                <el-option
                  v-for="item in filteredTerms"
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
            <el-form-item label="存款金额" prop="amount">
              <el-input
                v-model.number="depositForm.amount"
                placeholder="请输入存款金额"
                type="number"
                :min="0"
                @input="handleAmountInput"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              >
                <template #append>元</template>
              </el-input>
              <div v-if="preCheckResult" class="limit-info">
                <el-text type="info" size="small">
                  单笔限额: {{ formatThousands(preCheckResult.single_limit) }} |
                  日累计限额: {{ formatThousands(preCheckResult.daily_limit) }}
                </el-text>
                <br />
                <el-text :type="preCheckResult.remaining_daily_limit >= depositForm.amount ? 'success' : 'danger'" size="small">
                  今日剩余可用额度: {{ formatThousands(preCheckResult.remaining_daily_limit) }}
                </el-text>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计息方式" prop="interest_calc_method">
              <el-select
                v-model="depositForm.interest_calc_method"
                placeholder="请选择计息方式"
                style="width: 100%"
              >
                <el-option
                  v-for="item in INTEREST_CALC_METHOD_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row v-if="preCheckResult && preCheckResult.applicable_rate" :gutter="20">
          <el-col :span="12">
            <el-form-item label="适用利率">
              <el-input :value="preCheckResult.applicable_rate + '%'" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计利息">
              <el-input :value="formatThousands(calculateInterest()) + ' 元'" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="depositForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i v-if="submitting" class="el-icon-loading"></i>
          {{ submitting ? '办理中...' : '确认办理' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="存款详情" width="680px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="存款流水号">{{ currentDetail.deposit_no }}</el-descriptions-item>
        <el-descriptions-item label="账号">{{ currentDetail.account_no }}</el-descriptions-item>
        <el-descriptions-item label="客户姓名">{{ currentDetail.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="存款类型">{{ currentDetail.deposit_type_text }}</el-descriptions-item>
        <el-descriptions-item label="产品名称">{{ currentDetail.product_name }}</el-descriptions-item>
        <el-descriptions-item label="存款金额">
          <span class="amount-positive">{{ formatThousands(currentDetail.amount) }} 元</span>
        </el-descriptions-item>
        <el-descriptions-item label="存期">{{ currentDetail.term_text }}</el-descriptions-item>
        <el-descriptions-item label="利率">{{ currentDetail.interest_rate }}%</el-descriptions-item>
        <el-descriptions-item label="预计利息">
          <span class="amount-positive">{{ formatThousands(currentDetail.interest_amount || 0) }} 元</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDetail.status)" effect="light" size="small">
            {{ getStatusLabel(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="起息日">{{ currentDetail.value_date }}</el-descriptions-item>
        <el-descriptions-item label="到期日">{{ currentDetail.maturity_date }}</el-descriptions-item>
        <el-descriptions-item label="原始余额">{{ formatThousands(currentDetail.original_balance || 0) }} 元</el-descriptions-item>
        <el-descriptions-item label="新余额">
          <span class="amount-positive">{{ formatThousands(currentDetail.new_balance || 0) }} 元</span>
        </el-descriptions-item>
        <el-descriptions-item label="经办人">{{ currentDetail.operator_name }}</el-descriptions-item>
        <el-descriptions-item label="办理机构">{{ currentDetail.org_name }}</el-descriptions-item>
        <el-descriptions-item label="办理时间" :span="2">{{ currentDetail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Files, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  DEPOSIT_TYPE_OPTIONS,
  DEPOSIT_STATUS_OPTIONS,
  DEPOSIT_TERM_OPTIONS,
  INTEREST_CALC_METHOD_OPTIONS,
  type Deposit,
  type DepositQueryParams,
  type DepositPreCheckResult,
  type CreateDepositRequest,
  type DepositProduct,
  getDepositConfigApi,
  getDepositListApi,
  preCheckDepositApi,
  createDepositApi,
  cancelDepositApi,
  confirmDepositApi,
  formatThousands
} from '@api/deposit'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const shakeError = ref(false)
const showCreate = ref(false)
const showDetail = ref(false)
const isEditing = ref(false)
const preCheckResult = ref<DepositPreCheckResult | null>(null)
const config = ref<{ products: DepositProduct[] } | null>(null)
const depositFormRef = ref<FormInstance>()
const currentDetail = ref<Deposit | null>(null)

const tableData = ref<Deposit[]>([])
const total = ref(0)
const selection = ref<Deposit[]>([])

const searchForm = reactive<DepositQueryParams>({
  page: 1,
  pageSize: 10,
  deposit_no: '',
  account_no: '',
  customer_no: '',
  deposit_type: undefined,
  status: undefined,
  term: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const depositForm = reactive<CreateDepositRequest>({
  account_no: '',
  deposit_type: 1,
  product_id: '',
  amount: 0,
  term: 365,
  interest_calc_method: 3,
  remark: ''
})

const depositRules: FormRules = {
  deposit_type: [{ required: true, message: '请选择存款类型', trigger: 'change' }],
  product_id: [{ required: true, message: '请选择存款产品', trigger: 'change' }],
  account_no: [{ required: true, message: '请输入客户账号', trigger: 'blur' }],
  amount: [
    { required: true, message: '请输入存款金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '存款金额必须大于0', trigger: 'blur' }
  ],
  term: [{ required: true, message: '请选择存期', trigger: 'change' }]
}

const filteredProducts = computed(() => {
  if (!config?.value?.products) return []
  return config.value.products.filter(p => p.deposit_type === depositForm.deposit_type && p.status === 1)
})

const filteredTerms = computed(() => {
  if (depositForm.deposit_type === 1) {
    return DEPOSIT_TERM_OPTIONS
  } else if (depositForm.deposit_type === 2) {
    return DEPOSIT_TERM_OPTIONS.filter(t => t.value >= 365)
  } else {
    return DEPOSIT_TERM_OPTIONS.filter(t => t.value === 0 || t.value >= 30)
  }
})

const canSubmit = computed(() => {
  return preCheckResult.value?.passed === true && !submitting.value
})

const loadConfig = async () => {
  try {
    const res = await getDepositConfigApi()
    config.value = res.data
  } catch (e) {
    console.error('Failed to load deposit config:', e)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: DepositQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    const res = await getDepositListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch deposit list:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.deposit_no = ''
  searchForm.account_no = ''
  searchForm.customer_no = ''
  searchForm.deposit_type = undefined
  searchForm.status = undefined
  searchForm.term = undefined
  searchForm.timeRange = undefined
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: Deposit[]) => {
  selection.value = val
}

const openCreate = () => {
  isEditing.value = false
  preCheckResult.value = null
  shakeError.value = false
  depositForm.account_no = ''
  depositForm.deposit_type = 1
  depositForm.product_id = ''
  depositForm.amount = 0
  depositForm.term = 365
  depositForm.interest_calc_method = 3
  depositForm.remark = ''
  showCreate.value = true
}

const handleTypeChange = () => {
  depositForm.product_id = ''
  if (depositForm.deposit_type === 2) {
    depositForm.term = 365
  } else if (depositForm.deposit_type === 3) {
    depositForm.term = 0
  }
  runPreCheck()
}

const handleProductChange = () => {
  const product = filteredProducts.value.find(p => p.id === depositForm.product_id)
  if (product) {
    depositForm.term = product.term_days as any
  }
  runPreCheck()
}

const handleAmountInput = () => {
  if (depositForm.amount < 0) {
    depositForm.amount = 0
  }
  runPreCheck()
}

const runPreCheck = async () => {
  if (!depositForm.account_no || !depositForm.amount <= 0) {
    preCheckResult.value = null
    return
  }
  try {
    const res = await preCheckDepositApi({
      account_no: depositForm.account_no,
      deposit_type: depositForm.deposit_type,
      product_id: depositForm.product_id || undefined,
      amount: depositForm.amount,
      term: depositForm.term
    })
    preCheckResult.value = res.data
    if (!res.data.passed) {
      triggerShake()
    }
  } catch (e: any) {
    preCheckResult.value = {
      passed: false,
      account_valid: false,
      not_frozen: false,
      not_lost: false,
      risk_compliant: false,
      within_single_limit: false,
      within_daily_limit: false,
      product_available: false,
      single_limit: 0,
      daily_limit: 0,
      current_daily_amount: 0,
      remaining_daily_limit: 0,
      block_reason: e?.message || '校验失败',
      warnings: []
    }
    triggerShake()
  }
}

const triggerShake = () => {
  shakeError.value = true
  setTimeout(() => {
    shakeError.value = false
  }, 500)
}

const calculateInterest = () => {
  if (!preCheckResult.value?.applicable_rate || !depositForm.amount || !depositForm.term) return 0
  const rate = preCheckResult.value.applicable_rate / 100
  const term = depositForm.term
  return depositForm.amount * rate * (term / 365)
}

const handleSubmit = async () => {
  if (!depositFormRef.value) {
    const valid = await depositFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  if (!preCheckResult.value?.passed) {
    ElMessage.error('前置校验未通过，无法办理')
    return
  }
  submitting.value = true
  try {
    await createDepositApi(depositForm)
    ElMessage.success('存款办理成功')
    showCreate.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to create deposit:', e)
  } finally {
    submitting.value = false
  }
}

const handleDetail = (row: Deposit) => {
  currentDetail.value = row
  showDetail.value = true
}

const handleConfirm = async (row: Deposit) => {
  try {
    await ElMessageBox.confirm('确认入账该笔存款？', '确认入账', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await confirmDepositApi(row.id)
    ElMessage.success('存款入账成功，账户余额已更新')
    fetchData()
  } catch (e) {
    console.error('Failed to confirm deposit:', e)
  }
}

const handleCancel = async (row: Deposit) => {
  try {
    await ElMessageBox.confirm('确认撤销该笔存款？撤销后账户数据将恢复原始状态', '确认撤销', {
      confirmButtonText: '确认撤销',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelDepositApi(row.id)
    ElMessage.success('存款撤销成功，账户数据已恢复')
    fetchData()
  } catch (e) {
    console.error('Failed to cancel deposit:', e)
  }
}

const goBatch = () => {
  router.push('/deposit/batch')
}

const goTrace = () => {
  router.push('/deposit/trace')
}

const getStatusType = (status: number) => {
  const opt = DEPOSIT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getStatusLabel = (status: number) => {
  const opt = DEPOSIT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

onMounted(() => {
  loadConfig()
  fetchData()
})
</script>

<style scoped>
.deposit-row:hover {
  transform: scale(1.01);
  transition: transform 0.2s ease;
  cursor: pointer;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.shake-error {
  animation: shake 0.4s ease-in-out;
  border-color: #f56c6c !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.limit-info {
  margin-top: 8px;
  line-height: 1.6;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.mb15 {
  margin-bottom: 15px;
}
</style>
