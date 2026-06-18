<template>
  <div class="ccb-business-settlement">
    <CcbPageHeader
      title="支付结算"
      description="线下转账结算管控"
      icon="Money"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="结算流水号" prop="settlement_no">
        <el-input v-model="searchForm.settlement_no" placeholder="请输入结算流水号" clearable />
      </el-form-item>
      <el-form-item label="转出账号" prop="payer_account_no">
        <el-input v-model="searchForm.payer_account_no" placeholder="请输入转出账号" clearable />
      </el-form-item>
      <el-form-item label="收款账号" prop="payee_account_no">
        <el-input v-model="searchForm.payee_account_no" placeholder="请输入收款账号" clearable />
      </el-form-item>
      <el-form-item label="收款户名" prop="payee_account_name">
        <el-input v-model="searchForm.payee_account_name" placeholder="请输入收款户名" clearable />
      </el-form-item>
      <el-form-item label="转账类型" prop="transfer_type">
        <el-select v-model="searchForm.transfer_type" placeholder="请选择转账类型" clearable>
          <el-option v-for="item in TRANSFER_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in SETTLEMENT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
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
        <el-button type="primary" :icon="Plus" @click="openCreate" v-permission="'business:settlement:create'">
          <span class="ripple-btn">新转账</span>
        </el-button>
        <el-button type="success" :icon="Files" @click="goBatch" v-permission="'business:settlement:batch'">批量转账</el-button>
        <el-button type="info" :icon="Search" @click="goTrace" v-permission="'business:settlement:trace'">结算溯源</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          结算总数：<el-text type="primary" size="large">{{ total }}</el-text>
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
      row-class-name="settlement-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="settlement_no" label="结算流水号" width="200" />
      <el-table-column prop="payer_account_no" label="转出账号" width="160" />
      <el-table-column prop="payee_account_name" label="收款户名" width="120" />
      <el-table-column prop="payee_account_no" label="收款账号" width="160" />
      <el-table-column prop="transfer_type_text" label="转账类型" width="100" />
      <el-table-column prop="transfer_mode_text" label="转账模式" width="100" />
      <el-table-column prop="amount" label="金额(元)" width="140" align="right">
        <template #default="{ row }">
          <span class="amount-positive">{{ formatThousands(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="fee" label="手续费(元)" width="110" align="right">
        <template #default="{ row }">
          {{ formatThousands(row.fee || 0) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="arrival_time" label="到账时效" width="120" />
      <el-table-column prop="operator_name" label="经办人" width="100" />
      <el-table-column prop="createdAt" label="办理时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1"
            type="warning" link size="small"
            @click="handleCancel(row)"
            v-permission="'business:settlement:cancel'"
          >撤销</el-button>
          <el-button
            v-if="row.status === 1 && row.need_review"
            type="success" link size="small"
            @click="handleReview(row, true)"
            v-permission="'business:settlement:review'"
          >复核通过</el-button>
          <el-button
            v-if="row.status === 1 && row.need_review"
            type="danger" link size="small"
            @click="handleReview(row, false)"
            v-permission="'business:settlement:review'"
          >复核拒绝</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showCreate"
      title="新转账办理"
      width="780px"
      class="settlement-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        v-if="preCheckResult && preCheckResult.passed"
        title="预校验通过，可以提交转账"
        type="success"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && !preCheckResult.passed && preCheckResult.blocked"
        :title="preCheckResult.block_reason || '前置校验未通过'"
        type="error"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && preCheckResult.warnings && preCheckResult.warnings.length > 0 && !preCheckResult.blocked"
        :title="preCheckResult.warnings[0]"
        type="warning"
        show-icon
        class="mb15"
        :closable="false"
      />

      <el-form
        ref="settlementFormRef"
        :model="settlementForm"
        :rules="settlementRules"
        label-width="120px"
        class="ccb-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="转账类型" prop="transfer_type">
              <el-select
                v-model="settlementForm.transfer_type"
                placeholder="请选择转账类型"
                style="width: 100%"
                @change="handleTypeChange"
                :class="{ 'shake-error': shakeError }"
              >
                <el-option
                  v-for="item in TRANSFER_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转账模式" prop="transfer_mode">
              <el-select
                v-model="settlementForm.transfer_mode"
                placeholder="请选择转账模式"
                style="width: 100%"
                @change="handleModeChange"
              >
                <el-option
                  v-for="item in TRANSFER_MODE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="转出账号" prop="payer_account_no">
              <el-input
                v-model="settlementForm.payer_account_no"
                placeholder="请输入转出账号"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
              <div v-if="preCheckResult" class="account-info">
                <el-text :type="preCheckResult.payer_account_valid ? 'success' : 'danger'" size="small">
                  账户状态：{{ preCheckResult.payer_account_status_text }}
                  |
                </el-text>
                <el-text :type="preCheckResult.payer_not_frozen ? 'success' : 'danger'" size="small">
                  冻结状态：{{ preCheckResult.payer_not_frozen ? '正常' : '已冻结' }}
                </el-text>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">收款人信息</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="收款账号" prop="payee_account_no">
              <el-input
                v-model="settlementForm.payee_account_no"
                placeholder="请输入收款账号"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="收款户名" prop="payee_account_name">
              <el-input
                v-model="settlementForm.payee_account_name"
                placeholder="请输入收款户名"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户行" prop="payee_bank_name">
              <el-input
                v-model="settlementForm.payee_bank_name"
                placeholder="请输入开户行名称"
                @blur="runPreCheck"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联行号" prop="payee_bank_code">
              <el-input
                v-model="settlementForm.payee_bank_code"
                placeholder="请输入银行联行号"
                @blur="runPreCheck"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账户类型" prop="payee_account_type">
              <el-select
                v-model="settlementForm.payee_account_type"
                placeholder="请选择账户类型"
                style="width: 100%"
                @change="runPreCheck"
              >
                <el-option label="对公账户" value="public" />
                <el-option label="对私账户" value="private" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所在地" prop="payee_location">
              <el-input
                v-model="settlementForm.payee_location"
                placeholder="请输入开户所在地"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">转账金额</el-divider>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="转账金额" prop="amount">
              <el-input
                v-model.number="settlementForm.amount"
                placeholder="请输入转账金额"
                type="number"
                :min="0"
                @input="handleAmountInput"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              >
                <template #append>元</template>
              </el-input>
              <div v-if="preCheckResult && preCheckResult.limit_check" class="limit-info">
                <el-text type="info" size="small">
                  单笔限额: {{ formatThousands(preCheckResult.limit_check.single_limit) }}
                </el-text>
                <br />
                <el-text type="info" size="small">
                  单日限额: {{ formatThousands(preCheckResult.limit_check.daily_limit) }}
                  | 剩余:
                  <el-text :type="preCheckResult.limit_check.daily_remaining >= settlementForm.amount ? 'success' : 'danger'" size="small">
                    {{ formatThousands(preCheckResult.limit_check.daily_remaining) }}
                  </el-text>
                </el-text>
                <br />
                <el-text type="info" size="small">
                  单月限额: {{ formatThousands(preCheckResult.limit_check.monthly_limit) }}
                  | 剩余:
                  <el-text :type="preCheckResult.limit_check.monthly_remaining >= settlementForm.amount ? 'success' : 'danger'" size="small">
                    {{ formatThousands(preCheckResult.limit_check.monthly_remaining) }}
                  </el-text>
                </el-text>
                <div v-if="preCheckResult.limit_check.limit_error" class="limit-error">
                  <el-text type="danger" size="small">{{ preCheckResult.limit_check.limit_error }}</el-text>
                </div>
              </div>
              <div v-if="preCheckResult" class="balance-info">
                <el-text :type="preCheckResult.balance_sufficient ? 'success' : 'danger'" size="small">
                  可用余额: {{ formatThousands(preCheckResult.payer_available_balance) }} 元
                  ({{ preCheckResult.balance_sufficient ? '余额充足' : '余额不足' }})
                </el-text>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="转账用途" prop="purpose">
              <el-select
                v-model="settlementForm.purpose"
                placeholder="请选择转账用途"
                style="width: 100%"
                @change="runPreCheck"
                clearable
              >
                <el-option
                  v-for="item in PURPOSE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <div v-if="preCheckResult && preCheckResult.public_private_check" class="public-private-info">
                <el-text :type="preCheckResult.public_private_check.allowed ? 'success' : 'danger'" size="small">
                  公私户规则: {{ preCheckResult.public_private_check.allowed ? '允许' : '不允许' }}
                </el-text>
                <div v-if="preCheckResult.public_private_check.rule_error" class="limit-error">
                  <el-text type="danger" size="small">{{ preCheckResult.public_private_check.rule_error }}</el-text>
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="附言">
          <el-input
            v-model="settlementForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入附言信息（选填）"
          />
        </el-form-item>

        <el-divider content-position="left">费用与时效</el-divider>

        <el-row :gutter="20" v-if="preCheckResult">
          <el-col :span="12">
            <el-form-item label="手续费">
              <el-input
                :value="formatThousands(preCheckResult.fee_calc.fee) + ' 元'"
                disabled
              />
              <div class="fee-desc">
                <el-text type="info" size="small">
                  {{ preCheckResult.fee_calc.fee_calc_desc }}
                </el-text>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到账时效">
              <el-input
                :value="preCheckResult.arrival_time"
                disabled
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="preCheckResult">
          <el-col :span="24">
            <el-alert
              v-if="preCheckResult.need_review"
              :title="'需要人工复核：' + (preCheckResult.review_reason || '大额转账需审核')"
              type="warning"
              show-icon
              :closable="false"
            />
            <el-alert
              v-else
              title="本笔转账符合自动结算条件，提交后直接处理"
              type="success"
              show-icon
              :closable="false"
            />
          </el-col>
        </el-row>
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
          {{ submitting ? '提交中...' : '确认提交' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="结算详情" width="680px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="结算流水号">{{ currentDetail.settlement_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDetail.status)" effect="light" size="small">
            {{ getStatusLabel(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="转账类型">{{ currentDetail.transfer_type_text }}</el-descriptions-item>
        <el-descriptions-item label="转账模式">{{ currentDetail.transfer_mode_text }}</el-descriptions-item>
        <el-descriptions-item label="转出账号">{{ currentDetail.payer_account_no }}</el-descriptions-item>
        <el-descriptions-item label="转出户名">{{ currentDetail.payer_account_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收款账号">{{ currentDetail.payee_account_no }}</el-descriptions-item>
        <el-descriptions-item label="收款户名">{{ currentDetail.payee_account_name }}</el-descriptions-item>
        <el-descriptions-item label="收款开户行">{{ currentDetail.payee_bank_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联行号">{{ currentDetail.payee_bank_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="转账金额">
          <span class="amount-positive">{{ formatThousands(currentDetail.amount) }} 元</span>
        </el-descriptions-item>
        <el-descriptions-item label="手续费">{{ formatThousands(currentDetail.fee || 0) }} 元</el-descriptions-item>
        <el-descriptions-item label="到账时效">{{ currentDetail.arrival_time || '-' }}</el-descriptions-item>
        <el-descriptions-item label="转账用途">{{ currentDetail.purpose || '-' }}</el-descriptions-item>
        <el-descriptions-item label="可用余额">{{ formatThousands(currentDetail.original_balance || 0) }} 元</el-descriptions-item>
        <el-descriptions-item label="转账后余额">
          <span class="amount-positive">{{ formatThousands(currentDetail.new_balance || 0) }} 元</span>
        </el-descriptions-item>
        <el-descriptions-item label="是否需要复核">{{ currentDetail.need_review ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="复核原因">{{ currentDetail.review_reason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="经办人">{{ currentDetail.operator_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="办理机构">{{ currentDetail.org_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="办理时间" :span="2">{{ currentDetail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="附言" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="showCancelReason"
      title="撤销原因"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="撤销原因">
          <el-input
            v-model="cancelReason"
            type="textarea"
            :rows="3"
            placeholder="请输入撤销原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCancelReason = false">取消</el-button>
        <el-button type="primary" :disabled="!cancelReason.trim()" @click="confirmCancel">确认撤销</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Files, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  TRANSFER_TYPE_OPTIONS,
  TRANSFER_MODE_OPTIONS,
  SETTLEMENT_STATUS_OPTIONS,
  PURPOSE_OPTIONS,
  type TransferType,
  type TransferMode,
  type SettlementStatus,
  type Settlement,
  type SettlementVO,
  type SettlementQueryParams,
  type SettlementPreCheckResult,
  type CreateSettlementRequest,
  type CancelSettlementRequest,
  type ReviewSettlementRequest,
  type TransferAccountInfo,
  getSettlementConfigApi,
  getSettlementListApi,
  getSettlementDetailApi,
  preCheckSettlementApi,
  createSettlementApi,
  cancelSettlementApi,
  reviewSettlementApi,
  formatThousands
} from '@api/settlement'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const submitDisabled = ref(false)
const shakeError = ref(false)
const showCreate = ref(false)
const showDetail = ref(false)
const showCancelReason = ref(false)
const preCheckResult = ref<SettlementPreCheckResult | null>(null)
const settlementFormRef = ref<FormInstance>()
const currentDetail = ref<SettlementVO | null>(null)
const currentRow = ref<SettlementVO | null>(null)
const cancelReason = ref('')

const tableData = ref<SettlementVO[]>([])
const total = ref(0)
const selection = ref<SettlementVO[]>([])

const searchForm = reactive<SettlementQueryParams & { timeRange?: string[] }>({
  page: 1,
  pageSize: 10,
  settlement_no: '',
  payer_account_no: '',
  payee_account_no: '',
  payee_account_name: '',
  transfer_type: undefined,
  status: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const settlementForm = reactive<CreateSettlementRequest>({
  transfer_type: 1,
  transfer_mode: 1,
  payer_account_no: '',
  payee_account_no: '',
  payee_account_name: '',
  payee_bank_code: '',
  payee_bank_name: '',
  payee_account_type: '',
  payee_location: '',
  amount: 0,
  currency: 'CNY',
  purpose: '',
  remark: ''
})

const settlementRules: FormRules = {
  transfer_type: [{ required: true, message: '请选择转账类型', trigger: 'change' }],
  transfer_mode: [{ required: true, message: '请选择转账模式', trigger: 'change' }],
  payer_account_no: [{ required: true, message: '请输入转出账号', trigger: 'blur' }],
  payee_account_no: [{ required: true, message: '请输入收款账号', trigger: 'blur' }],
  payee_account_name: [{ required: true, message: '请输入收款户名', trigger: 'blur' }],
  amount: [
    { required: true, message: '请输入转账金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '转账金额必须大于0', trigger: 'blur' }
  ]
}

const canSubmit = computed(() => {
  return preCheckResult.value?.passed === true && !submitting.value && !submitDisabled.value
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: SettlementQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    const res = await getSettlementListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch settlement list:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.settlement_no = ''
  searchForm.payer_account_no = ''
  searchForm.payee_account_no = ''
  searchForm.payee_account_name = ''
  searchForm.transfer_type = undefined
  searchForm.status = undefined
  searchForm.timeRange = undefined
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: SettlementVO[]) => {
  selection.value = val
}

const openCreate = () => {
  preCheckResult.value = null
  shakeError.value = false
  settlementForm.transfer_type = 1
  settlementForm.transfer_mode = 1
  settlementForm.payer_account_no = ''
  settlementForm.payee_account_no = ''
  settlementForm.payee_account_name = ''
  settlementForm.payee_bank_code = ''
  settlementForm.payee_bank_name = ''
  settlementForm.payee_account_type = ''
  settlementForm.payee_location = ''
  settlementForm.amount = 0
  settlementForm.purpose = ''
  settlementForm.remark = ''
  showCreate.value = true
}

const handleTypeChange = () => {
  runPreCheck()
}

const handleModeChange = () => {
  runPreCheck()
}

const handleAmountInput = () => {
  if (settlementForm.amount < 0) {
    settlementForm.amount = 0
  }
  runPreCheck()
}

const triggerShake = () => {
  shakeError.value = true
  setTimeout(() => {
    shakeError.value = false
  }, 500)
}

const runPreCheck = async () => {
  if (!settlementForm.payer_account_no || !settlementForm.payee_account_no || !settlementForm.payee_account_name || settlementForm.amount <= 0) {
    preCheckResult.value = null
    return
  }
  try {
    const payeeAccount: TransferAccountInfo = {
      account_no: settlementForm.payee_account_no,
      account_name: settlementForm.payee_account_name,
      account_type: settlementForm.payee_account_type || undefined,
      bank_code: settlementForm.payee_bank_code || undefined,
      bank_name: settlementForm.payee_bank_name || undefined,
      location: settlementForm.payee_location || undefined
    }
    const res = await preCheckSettlementApi({
      payer_account_no: settlementForm.payer_account_no,
      transfer_type: settlementForm.transfer_type as TransferType,
      transfer_mode: settlementForm.transfer_mode as TransferMode,
      payee_account: payeeAccount,
      amount: settlementForm.amount,
      purpose: settlementForm.purpose || undefined
    })
    preCheckResult.value = res.data
    if (!res.data.passed) {
      triggerShake()
      if (res.data.blocked && res.data.block_reason) {
        ElMessage.error(res.data.block_reason)
      }
    }
  } catch (e: any) {
    preCheckResult.value = {
      passed: false,
      blocked: true,
      block_reason: e?.message || '校验失败',
      block_field: undefined,
      warnings: [],
      payer_account_valid: false,
      payer_account_status: 0,
      payer_account_status_text: '未知',
      payer_not_frozen: false,
      payer_available_balance: 0,
      balance_sufficient: false,
      payee_info_valid: false,
      payee_name_matched: false,
      amount_valid: false,
      limit_check: {
        single_limit: 0,
        daily_limit: 0,
        monthly_limit: 0,
        daily_used_amount: 0,
        monthly_used_amount: 0,
        daily_remaining: 0,
        monthly_remaining: 0,
        within_single_limit: false,
        within_daily_limit: false,
        within_monthly_limit: false,
        limit_error: undefined
      },
      public_private_check: {
        is_public_to_private: false,
        is_private_to_public: false,
        is_same_type: false,
        allowed: false,
        purpose_required: false,
        purpose_valid: false
      },
      fee_calc: {
        fee: 0,
        fee_calc_desc: '',
        min_fee: 0,
        max_fee: 0,
        rate: 0
      },
      arrival_time: '',
      need_review: false,
      suggested_audit_level: 0
    }
    triggerShake()
    ElMessage.error(e?.message || '校验失败')
  }
}

const handleSubmit = async () => {
  if (settlementFormRef.value) {
    const valid = await settlementFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  if (!preCheckResult.value?.passed) {
    ElMessage.error('前置校验未通过，无法提交')
    return
  }
  if (preCheckResult.value.blocked) {
    ElMessage.error(preCheckResult.value.block_reason || '存在拦截项，无法提交')
    return
  }

  submitDisabled.value = true
  submitting.value = true

  try {
    const res = await createSettlementApi(settlementForm)
    ElMessageBox.alert(
      `转账提交成功！\n结算流水号：${res.data.settlement_no}`,
      '办理成功',
      {
        confirmButtonText: '确定',
        type: 'success'
      }
    )
    showCreate.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to create settlement:', e)
  } finally {
    submitting.value = false
    setTimeout(() => {
      submitDisabled.value = false
    }, 300)
  }
}

const handleDetail = async (row: SettlementVO) => {
  try {
    const res = await getSettlementDetailApi(row.id)
    currentDetail.value = res.data
    showDetail.value = true
  } catch (e) {
    currentDetail.value = row
    showDetail.value = true
    console.error('Failed to fetch settlement detail:', e)
  }
}

const handleCancel = (row: SettlementVO) => {
  currentRow.value = row
  cancelReason.value = ''
  showCancelReason.value = true
}

const confirmCancel = async () => {
  if (!currentRow.value) return
  try {
    await ElMessageBox.confirm(
      `确认撤销该笔转账？\n撤销后账户数据将恢复，流水号：${currentRow.value.settlement_no}`,
      '确认撤销',
      {
        confirmButtonText: '确认撤销',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    const data: CancelSettlementRequest = {
      settlement_no: currentRow.value.settlement_no,
      cancel_reason: cancelReason.value
    }
    await cancelSettlementApi(data)
    ElMessage.success('转账撤销成功，账户数据已恢复')
    showCancelReason.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to cancel settlement:', e)
  }
}

const handleReview = async (row: SettlementVO, approved: boolean) => {
  try {
    const actionText = approved ? '通过' : '拒绝'
    const { value: reviewReason } = await ElMessageBox.prompt(
      `请输入复核${actionText}原因：`,
      `复核${actionText}`,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入复核原因',
        type: approved ? 'warning' : 'warning'
      }
    )
    const data: ReviewSettlementRequest = {
      settlement_no: row.settlement_no,
      approved,
      audit_level: 1,
      review_reason: reviewReason
    }
    await reviewSettlementApi(data)
    ElMessage.success(`复核${actionText}成功`)
    fetchData()
  } catch (e) {
    console.error('Failed to review settlement:', e)
  }
}

const goBatch = () => {
  router.push('/settlement/batch')
}

const goTrace = () => {
  router.push('/settlement/trace')
}

const getStatusType = (status: SettlementStatus | number) => {
  const opt = SETTLEMENT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getStatusLabel = (status: SettlementStatus | number) => {
  const opt = SETTLEMENT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.settlement-row:hover {
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
  line-height: 1.8;
}

.limit-error {
  margin-top: 4px;
}

.account-info {
  margin-top: 8px;
  line-height: 1.6;
}

.balance-info {
  margin-top: 6px;
}

.public-private-info {
  margin-top: 8px;
}

.fee-desc {
  margin-top: 6px;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.mb15 {
  margin-bottom: 15px;
}

.ccb-form :deep(.el-divider) {
  margin: 12px 0;
}

.ccb-form :deep(.el-divider__text) {
  font-weight: 600;
  color: #303133;
}
</style>
