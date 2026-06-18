<template>
  <div class="ccb-loan-repayment">
    <CcbPageHeader
      title="贷后还款工作台"
      description="多方式还款管理，批量代扣，数据溯源"
      icon="Wallet"
    />

    <div class="repayment-stats">
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card pending">
            <div class="stat-icon"><el-icon><Clock /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ pendingCount }}</div>
              <div class="stat-label">待还笔数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card overdue">
            <div class="stat-icon"><el-icon><Warning /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ overdueCount }}</div>
              <div class="stat-label">逾期笔数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ formatCurrency(settledAmount, 0) }}</div>
              <div class="stat-label">本月已还(元)</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card alert">
            <div class="stat-icon"><el-icon><Bell /></el-icon></div>
            <div class="stat-content">
              <div class="stat-value">{{ warnCount }}</div>
              <div class="stat-label">预警提醒</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>贷款查询</span>
          <div class="header-actions">
            <el-button type="success" size="small" :icon="Files" @click="goBatch" v-permission="'loan:repayment:batch'">批量代扣</el-button>
            <el-button type="info" size="small" :icon="Search" @click="goTrace" v-permission="'loan:repayment:trace'">还款溯源</el-button>
          </div>
        </div>
      </template>

      <el-form :model="queryForm" inline class="query-form">
        <el-form-item label="贷款编号">
          <el-input
            v-model="queryForm.loan_no"
            placeholder="请输入贷款编号"
            clearable
            style="width: 200px"
            @keyup.enter="queryLoan"
          />
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-input
            v-model="queryForm.customer_name"
            placeholder="请输入客户姓名"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input
            v-model="queryForm.id_card_no"
            placeholder="请输入身份证号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="queryLoan">查询</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="repaymentDetail" class="detail-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon class="title-icon"><CreditCard /></el-icon>
            <span>还款详情 - {{ repaymentDetail.loan_no }}</span>
            <el-tag v-if="repaymentDetail.overdue_days > 0" type="danger" effect="dark" size="small" class="overdue-tag">
              逾期 {{ repaymentDetail.overdue_days }} 天
            </el-tag>
          </div>
          <div class="header-actions">
            <span class="settle-progress">结清进度：{{ repaymentDetail.settlement_progress }}%</span>
          </div>
        </div>
      </template>

      <div class="detail-content">
        <el-row :gutter="24">
          <el-col :span="16">
            <div class="info-section">
              <h4 class="section-title">
                <el-icon><User /></el-icon>
                基本信息
              </h4>
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="客户姓名">{{ repaymentDetail.customer_name }}</el-descriptions-item>
                <el-descriptions-item label="身份证号">{{ repaymentDetail.id_card_no }}</el-descriptions-item>
                <el-descriptions-item label="贷款类型">{{ repaymentDetail.loan_type_text }}</el-descriptions-item>
                <el-descriptions-item label="贷款金额">
                  <span class="amount-text">{{ formatThousands(repaymentDetail.loan_amount) }}</span> 元
                </el-descriptions-item>
                <el-descriptions-item label="贷款期限">{{ repaymentDetail.loan_term_text }}</el-descriptions-item>
                <el-descriptions-item label="年利率">{{ repaymentDetail.interest_rate }}%</el-descriptions-item>
                <el-descriptions-item label="还款方式">{{ repaymentDetail.repayment_method_text }}</el-descriptions-item>
                <el-descriptions-item label="贷款状态">
                  <el-tag :type="repaymentDetail.loan_status === 9 ? 'success' : 'primary'" size="small">
                    {{ repaymentDetail.loan_status_text }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="放款日期">{{ repaymentDetail.disburse_date }}</el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="info-section">
              <h4 class="section-title">
                <el-icon><Money /></el-icon>
                还款信息
              </h4>
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="当前期数">
                  <span class="highlight-text">第 {{ repaymentDetail.current_period }} / {{ repaymentDetail.total_periods }} 期</span>
                </el-descriptions-item>
                <el-descriptions-item label="剩余本金">
                  <span class="amount-text">{{ formatThousands(repaymentDetail.remaining_principal) }}</span> 元
                </el-descriptions-item>
                <el-descriptions-item label="下期还款日">{{ repaymentDetail.next_due_date }}</el-descriptions-item>
                <el-descriptions-item label="下期应还">
                  <span class="amount-text warning">{{ formatThousands(repaymentDetail.next_due_amount) }}</span> 元
                </el-descriptions-item>
                <el-descriptions-item label="累计已还本金">
                  <span class="amount-text">{{ formatThousands(repaymentDetail.total_repaid_principal) }}</span> 元
                </el-descriptions-item>
                <el-descriptions-item label="累计已还利息">
                  <span class="amount-text">{{ formatThousands(repaymentDetail.total_repaid_interest) }}</span> 元
                </el-descriptions-item>
                <el-descriptions-item label="逾期天数" v-if="repaymentDetail.overdue_days > 0">
                  <span class="danger-text">{{ repaymentDetail.overdue_days }} 天</span>
                </el-descriptions-item>
                <el-descriptions-item label="逾期金额" v-if="repaymentDetail.overdue_days > 0">
                  <span class="danger-text">{{ formatThousands(repaymentDetail.overdue_amount) }}</span> 元
                </el-descriptions-item>
                <el-descriptions-item label="征信状态">
                  <el-tag :type="repaymentDetail.credit_report_status === 2 ? 'danger' : 'success'" size="small">
                    {{ repaymentDetail.credit_report_status_text }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="info-section">
              <h4 class="section-title">
                <el-icon><Tickets /></el-icon>
                还款计划（近12期）
              </h4>
              <el-table :data="repaymentDetail.bills" size="small" border stripe>
                <el-table-column prop="period_no" label="期数" width="70" align="center" />
                <el-table-column prop="due_date" label="还款日" width="110" />
                <el-table-column prop="principal" label="本金" width="110" align="right">
                  <template #default="{ row }">{{ formatThousands(row.principal) }}</template>
                </el-table-column>
                <el-table-column prop="interest" label="利息" width="110" align="right">
                  <template #default="{ row }">{{ formatThousands(row.interest) }}</template>
                </el-table-column>
                <el-table-column prop="total_amount" label="应还总额" width="120" align="right">
                  <template #default="{ row }">
                    <span class="amount-text">{{ formatThousands(row.total_amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="status_text" label="状态" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.is_overdue" type="danger" size="small">逾期</el-tag>
                    <el-tag v-else-if="row.status === 2" type="success" size="small">已还</el-tag>
                    <el-tag v-else type="info" size="small">待还</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="repayment-form-card">
              <h4 class="form-title">
                <el-icon><Wallet /></el-icon>
                还款操作
              </h4>

              <div v-if="preCheckResult && !preCheckResult.can_repay" class="precheck-alert">
                <el-alert :title="preCheckResult.block_reason || '无法还款'" type="error" :closable="false" show-icon />
              </div>

              <div v-else-if="preCheckResult && preCheckResult.warnings.length > 0" class="precheck-warn">
                <el-alert
                  v-for="(warning, idx) in preCheckResult.warnings"
                  :key="idx"
                  :title="warning"
                  type="warning"
                  :closable="false"
                  show-icon
                />
              </div>

              <el-form :model="repaymentForm" :rules="repaymentRules" ref="repaymentFormRef" label-width="100px" class="repayment-form">
                <el-form-item label="还款方式" prop="repayment_type">
                  <el-radio-group v-model="repaymentForm.repayment_type" class="full-width">
                    <el-radio-button :value="1">按期还款</el-radio-button>
                    <el-radio-button :value="2">提前还款</el-radio-button>
                    <el-radio-button :value="3" v-if="repaymentDetail.overdue_days > 0">逾期还款</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="还款渠道" prop="repayment_channel">
                  <el-radio-group v-model="repaymentForm.repayment_channel">
                    <el-radio value="active">主动还款</el-radio>
                    <el-radio value="auto_withhold">自动代扣</el-radio>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="还款期数" v-if="repaymentForm.repayment_type === 1 || repaymentForm.repayment_type === 3">
                  <el-select v-model="repaymentForm.period_no" style="width: 100%">
                    <el-option
                      v-for="bill in repaymentDetail.bills.filter(b => b.status === 0 || b.is_overdue)"
                      :key="bill.period_no"
                      :label="`第${bill.period_no}期 - ${bill.due_date}`"
                      :value="bill.period_no"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="还款金额" prop="amount">
                  <div class="amount-input-wrapper" :class="{ focused: inputFocused }">
                    <el-input
                      v-model="amountStr"
                      type="text"
                      placeholder="请输入还款金额"
                      @focus="inputFocused = true"
                      @blur="handleAmountBlur"
                      @input="handleAmountInput"
                      class="amount-input"
                    >
                      <template #suffix>元</template>
                    </el-input>
                  </div>
                </el-form-item>

                <div class="amount-summary">
                  <div class="summary-item">
                    <span class="label">本金：</span>
                    <span class="value">{{ formatThousands(calcAmount.principal) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">利息：</span>
                    <span class="value">{{ formatThousands(calcAmount.interest) }}</span>
                  </div>
                  <div class="summary-item" v-if="calcAmount.penalty > 0">
                    <span class="label">违约金：</span>
                    <span class="value penalty">{{ formatThousands(calcAmount.penalty) }}</span>
                  </div>
                  <div class="summary-item total">
                    <span class="label">合计：</span>
                    <span class="value total-amount">{{ formatThousands(calcAmount.total) }}</span>
                  </div>
                </div>

                <div class="account-info" v-if="repaymentDetail.account_no">
                  <el-descriptions :column="1" size="small" border>
                    <el-descriptions-item label="扣款账户">{{ repaymentDetail.account_no }}</el-descriptions-item>
                    <el-descriptions-item label="账户余额">
                      <span :class="{ 'insufficient': !preCheckResult?.balance_sufficient }">
                        {{ formatThousands(repaymentDetail.account_balance) }} 元
                      </span>
                      <el-tag v-if="!preCheckResult?.balance_sufficient" type="danger" size="small" class="recharge-tag">余额不足</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="代扣协议">
                      <el-tag v-if="repaymentDetail.withhold_agreement_valid" type="success" size="small">有效</el-tag>
                      <el-tag v-else type="danger" size="small">已失效</el-tag>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>

                <el-form-item label="备注">
                  <el-input
                    v-model="repaymentForm.remark"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入备注信息（选填）"
                    maxlength="200"
                    show-word-limit
                  />
                </el-form-item>

                <div class="form-actions">
                  <el-button
                    type="primary"
                    size="large"
                    :loading="submitting"
                    :disabled="!canSubmit"
                    class="submit-btn"
                    @click="submitRepayment"
                  >
                    <el-icon><Check /></el-icon>
                    确认还款
                  </el-button>
                </div>
              </el-form>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-dialog v-model="successDialogVisible" title="还款成功" width="500px" class="success-dialog">
      <div class="success-content">
        <div class="success-icon">
          <el-icon :size="64" color="#67c23a"><CircleCheck /></el-icon>
        </div>
        <h3>还款成功</h3>
        <div class="success-info">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="还款类型">{{ repaymentResult?.repayment_type_text }}</el-descriptions-item>
            <el-descriptions-item label="还款金额">
              <span class="amount-text">{{ formatThousands(repaymentResult?.amount || 0) }}</span> 元
            </el-descriptions-item>
            <el-descriptions-item label="还款时间">{{ repaymentResult?.repayment_time }}</el-descriptions-item>
            <el-descriptions-item label="交易流水号">{{ repaymentResult?.transaction_no }}</el-descriptions-item>
            <el-descriptions-item label="剩余本金">
              {{ formatThousands(repaymentResult?.remaining_principal || 0) }} 元
            </el-descriptions-item>
            <el-descriptions-item label="结清进度">{{ repaymentResult?.settlement_progress }}%</el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-if="repaymentResult?.is_settled" class="settle-tip">
          <el-alert title="恭喜！贷款已全部结清" type="success" :closable="false" show-icon />
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="handleSuccessClose">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Clock,
  Warning,
  CircleCheck,
  Bell,
  Search,
  Refresh,
  Files,
  CreditCard,
  User,
  Money,
  Tickets,
  Wallet,
  Check
} from '@element-plus/icons-vue'
import {
  getRepaymentDetailApi,
  preCheckRepaymentApi,
  doRepaymentApi,
  formatThousands,
  formatCurrency,
  type RepaymentDetailVO,
  type RepaymentPreCheckResult,
  type DoRepaymentResult
} from '@/api/loanRepayment'

const router = useRouter()

const pendingCount = ref(12)
const overdueCount = ref(3)
const settledAmount = ref(1256800)
const warnCount = ref(5)

const queryForm = reactive({
  loan_no: '',
  customer_name: '',
  id_card_no: ''
})

const repaymentDetail = ref<RepaymentDetailVO | null>(null)
const preCheckResult = ref<RepaymentPreCheckResult | null>(null)
const repaymentResult = ref<DoRepaymentResult | null>(null)

const repaymentForm = reactive({
  repayment_type: 1,
  repayment_channel: 'active',
  period_no: 1,
  amount: 0,
  remark: ''
})

const repaymentFormRef = ref()
const amountStr = ref('')
const inputFocused = ref(false)
const submitting = ref(false)
const successDialogVisible = ref(false)

const repaymentRules = {
  repayment_type: [{ required: true, message: '请选择还款方式', trigger: 'change' }],
  repayment_channel: [{ required: true, message: '请选择还款渠道', trigger: 'change' }],
  amount: [{ required: true, message: '请输入还款金额', trigger: 'blur' }]
}

const calcAmount = computed(() => {
  const type = repaymentForm.repayment_type
  const detail = repaymentDetail.value
  const currentBill = detail?.current_bill

  if (!detail || !currentBill) {
    return { principal: 0, interest: 0, penalty: 0, total: 0 }
  }

  let principal = 0
  let interest = 0
  let penalty = 0

  if (type === 1) {
    principal = currentBill.principal
    interest = currentBill.interest
    repaymentForm.period_no = detail.current_period
  } else if (type === 2) {
    const amount = parseFloat(amountStr.value) || 0
    principal = amount > detail.remaining_principal ? detail.remaining_principal : amount
    interest = 0
    penalty = principal * 0.01
  } else if (type === 3) {
    principal = currentBill.principal
    interest = currentBill.interest
    penalty = detail.overdue_amount
  }

  return {
    principal,
    interest,
    penalty,
    total: principal + interest + penalty
  }
})

const canSubmit = computed(() => {
  if (!preCheckResult.value?.can_repay) return false
  if (!repaymentForm.amount || repaymentForm.amount <= 0) return false
  if (repaymentForm.repayment_channel === 'auto_withhold' && !repaymentDetail?.withhold_agreement_valid) return false
  return true
})

watch(() => repaymentForm.repayment_type, (type) => {
  if (type === 2) {
    amountStr.value = ''
    repaymentForm.amount = 0
  } else {
    updateAmountByType()
  }
})

watch(() => repaymentForm.period_no, () => {
  if (repaymentForm.repayment_type !== 2) {
    updateAmountByType()
  }
})

function updateAmountByType() {
  const detail = repaymentDetail.value
  if (!detail) return

  if (repaymentForm.repayment_type === 1) {
    const bill = detail.bills.find(b => b.period_no === detail.current_period)
    if (bill) {
      amountStr.value = bill.total_amount.toString()
      repaymentForm.amount = bill.total_amount
    }
  } else if (repaymentForm.repayment_type === 3) {
    const total = detail.next_due_amount + detail.overdue_amount
    amountStr.value = total.toString()
    repaymentForm.amount = total
  }
}

function handleAmountInput(val: string) {
  const num = parseFloat(val)
  repaymentForm.amount = isNaN(num) ? 0 : num
}

function handleAmountBlur() {
  inputFocused.value = false
  if (repaymentForm.amount > 0) {
    amountStr.value = repaymentForm.amount.toFixed(2)
  }
}

async function queryLoan() {
  if (!queryForm.loan_no && !queryForm.customer_name && !queryForm.id_card_no) {
    ElMessage.warning('请输入查询条件')
    return
  }

  const mockLoanId = '1'
  await loadRepaymentDetail(mockLoanId)
}

function resetQuery() {
  queryForm.loan_no = ''
  queryForm.customer_name = ''
  queryForm.id_card_no = ''
  repaymentDetail.value = null
  preCheckResult.value = null
}

async function loadRepaymentDetail(loanId: string) {
  try {
    const detail = await getRepaymentDetailApi(loanId)
    repaymentDetail.value = detail

    const preCheck = await preCheckRepaymentApi(loanId)
    preCheckResult.value = preCheck

    repaymentForm.period_no = detail.current_period
    updateAmountByType()
  } catch (e: any) {
    ElMessage.error(e.message || '查询失败')
  }
}

async function submitRepayment() {
  if (!canSubmit.value) return

  await repaymentFormRef.value.validate()

  try {
    await ElMessageBox.confirm(
      `确认还款 ${formatThousands(calcAmount.value.total)} 元？`,
      '还款确认',
      {
        confirmButtonText: '确认还款',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const result = await doRepaymentApi({
      loan_id: '1',
      repayment_type: repaymentForm.repayment_type as any,
      repayment_channel: repaymentForm.repayment_channel,
      amount: calcAmount.value.total,
      period_no: repaymentForm.period_no,
      remark: repaymentForm.remark
    })

    repaymentResult.value = result
    successDialogVisible.value = true

    ElMessage.success('还款成功')

    if (result.is_settled) {
      setTimeout(() => {
        ElMessageBox.alert('贷款已全部结清，感谢您的使用！', '结清通知', { type: 'success' })
      }, 500)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '还款失败')
  } finally {
    submitting.value = false
  }
}

function handleSuccessClose() {
  successDialogVisible.value = false
  if (repaymentResult.value?.is_settled) {
    resetQuery()
  } else {
    loadRepaymentDetail('1')
  }
}

function goBatch() {
  router.push('/loan/repayment/batch')
}

function goTrace() {
  router.push('/loan/repayment/trace')
}

onMounted(() => {
})
</script>

<style scoped lang="scss">
.ccb-loan-repayment {
  padding: 16px;

  .repayment-stats {
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid #e4e7ed;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        color: #fff;
        font-size: 24px;
      }

      &.pending .stat-icon {
        background: linear-gradient(135deg, #409eff, #66b1ff);
      }

      &.overdue .stat-icon {
        background: linear-gradient(135deg, #f56c6c, #f78989);
      }

      &.success .stat-icon {
        background: linear-gradient(135deg, #67c23a, #85ce61);
      }

      &.alert .stat-icon {
        background: linear-gradient(135deg, #e6a23c, #ebb563);
      }

      .stat-content {
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 13px;
          color: #909399;
        }
      }
    }
  }

  .search-card {
    margin-bottom: 16px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .query-form {
      margin-bottom: 0;
    }
  }

  .detail-card {
    .card-header {
      .header-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .title-icon {
          color: #409eff;
          font-size: 18px;
        }

        .overdue-tag {
          margin-left: 12px;
          animation: pulse 2s infinite;
        }
      }

      .header-actions {
        .settle-progress {
          font-size: 14px;
          color: #606266;

          &::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #67c23a;
            margin-right: 6px;
          }
        }
      }
    }

    .detail-content {
      .info-section {
        margin-bottom: 24px;

        .section-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 12px 0;
          display: flex;
          align-items: center;
          gap: 6px;

          .el-icon {
            color: #409eff;
          }
        }
      }

      .amount-text {
        font-weight: 600;
        color: #303133;

        &.warning {
          color: #e6a23c;
        }
      }

      .highlight-text {
        font-weight: 600;
        color: #409eff;
      }

      .danger-text {
        font-weight: 600;
        color: #f56c6c;
      }

      .repayment-form-card {
        background: #f5f7fa;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #e4e7ed;

        .form-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 16px 0;
          display: flex;
          align-items: center;
          gap: 8px;

          .el-icon {
            color: #409eff;
          }
        }

        .precheck-alert {
          margin-bottom: 16px;
        }

        .precheck-warn {
          margin-bottom: 16px;

          .el-alert + .el-alert {
            margin-top: 8px;
          }
        }

        .repayment-form {
          .full-width {
            width: 100%;
          }

          .amount-input-wrapper {
            width: 100%;
            transition: all 0.3s ease;

            &.focused {
              transform: scale(1.02);
            }

            .amount-input {
              :deep(.el-input__wrapper) {
                transition: all 0.3s ease;
                box-shadow: 0 0 0 1px #dcdfe6 inset;

                &.is-focus {
                  box-shadow: 0 0 0 2px #409eff inset;
                  background-color: #ecf5ff;
                }
              }
            }
          }

          .amount-summary {
            background: #fff;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 16px;
            border: 1px solid #e4e7ed;

            .summary-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 4px 0;
              font-size: 13px;

              .label {
                color: #606266;
              }

              .value {
                color: #303133;
                font-weight: 500;

                &.penalty {
                  color: #f56c6c;
                }
              }

              &.total {
                border-top: 1px dashed #e4e7ed;
                margin-top: 8px;
                padding-top: 10px;

                .label {
                  font-size: 14px;
                  font-weight: 600;
                }

                .total-amount {
                  font-size: 18px;
                  font-weight: 700;
                  color: #409eff;
                }
              }
            }
          }

          .account-info {
            margin-bottom: 16px;

            .insufficient {
              color: #f56c6c;
              font-weight: 600;
            }

            .recharge-tag {
              margin-left: 8px;
            }
          }

          .form-actions {
            margin-top: 20px;

            .submit-btn {
              width: 100%;
              height: 44px;
              font-size: 16px;

              &::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 0;
                height: 0;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.3);
                transform: translate(-50%, -50%);
                transition: width 0.4s, height 0.4s;
              }

              &:active::before {
                width: 300px;
                height: 300px;
              }
            }
          }
        }
      }
    }
  }

  .success-dialog {
    :deep(.el-dialog__body) {
      padding-top: 20px;
    }

    .success-content {
      text-align: center;

      .success-icon {
        margin-bottom: 16px;
      }

      h3 {
        font-size: 20px;
        color: #303133;
        margin: 0 0 20px 0;
      }

      .success-info {
        text-align: left;
        margin-bottom: 16px;

        .amount-text {
          font-size: 16px;
          font-weight: 700;
          color: #67c23a;
        }
      }

      .settle-tip {
        margin-top: 16px;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
