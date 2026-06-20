<template>
  <div class="page-container">
    <el-card shadow="never" class="mb16">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" class="mr8"><Money /></el-icon>
            <span>结算申请</span>
          </div>
        </div>
      </template>

      <el-alert
        :title="shopStatusAlert.title"
        :type="shopStatusAlert.type"
        show-icon
        :closable="false"
        class="mb16">
        <template #default>
          <div>{{ shopStatusAlert.desc }}</div>
        </template>
      </el-alert>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-card shadow="hover" class="mb16">
            <template #header>
              <div class="sub-header">
                <el-icon><Wallet /></el-icon>
                <span class="ml8">银行卡信息</span>
                <el-tag
                  class="ml8"
                  :type="getBankVerifyTagType(bankForm.verify_status)">
                  {{ getBankVerifyLabel(bankForm.verify_status) }}
                </el-tag>
              </div>
            </template>
            <el-form :model="bankForm" :rules="bankRules" ref="bankFormRef" label-width="100px">
              <el-form-item label="开户名" prop="account_name">
                <el-input
                  v-model="bankForm.account_name"
                  placeholder="请输入开户名"
                  class="focus-glow"
                  :class="{ 'shake-error': shakeFields.account_name }"
                  :disabled="!formEnabled"
                  @blur="validateField('account_name')" />
              </el-form-item>
              <el-form-item label="银行账号" prop="account_no">
                <el-input
                  v-model="bankForm.account_no"
                  placeholder="请输入银行卡号"
                  class="focus-glow"
                  :class="{ 'shake-error': shakeFields.account_no }"
                  :disabled="!formEnabled"
                  @blur="validateField('account_no')" />
              </el-form-item>
              <el-form-item label="开户银行" prop="bank_name">
                <el-select
                  v-model="bankForm.bank_name"
                  placeholder="请选择开户银行"
                  class="focus-glow w100"
                  :disabled="!formEnabled"
                  @change="validateField('bank_name')">
                  <el-option v-for="b in BANK_OPTIONS" :key="b" :label="b" :value="b" />
                </el-select>
              </el-form-item>
              <el-form-item label="开户支行" prop="bank_branch">
                <el-input
                  v-model="bankForm.bank_branch"
                  placeholder="请输入开户支行"
                  class="focus-glow"
                  :class="{ 'shake-error': shakeFields.bank_branch }"
                  :disabled="!formEnabled"
                  @blur="validateField('bank_branch')" />
              </el-form-item>
            </el-form>
            <el-alert
              v-if="bankForm.verify_status !== 2"
              type="warning"
              show-icon
              :closable="false"
              title="银行卡未完成认证，打款可能失败，请先完成银行账户认证" />
          </el-card>

          <el-card shadow="hover">
            <template #header>
              <div class="sub-header">
                <el-icon><Calendar /></el-icon>
                <span class="ml8">结算周期选择</span>
              </div>
            </template>
            <el-form label-width="100px">
              <el-form-item label="周期类型">
                <el-radio-group v-model="periodForm.period_type" :disabled="!formEnabled" @change="handlePeriodChange">
                  <el-radio v-for="p in SETTLE_PERIOD_OPTIONS" :key="p.value" :value="p.value">{{ p.label }}</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="起止日期">
                <el-date-picker
                  v-model="periodForm.dateRange"
                  type="daterange"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  :disabled="!formEnabled"
                  style="width: 100%"
                  @change="handleDateChange" />
              </el-form-item>
            </el-form>
            <el-alert
              v-if="immatureOrderCount > 0"
              type="warning"
              show-icon
              :closable="false"
              :title="`存在 ${immatureOrderCount} 笔订单未满15天冷静期，将在下一周期结算`" />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="hover" class="mb16" v-loading="calcLoading">
            <template #header>
              <div class="sub-header">
                <el-icon><DataLine /></el-icon>
                <span class="ml8">金额核算</span>
              </div>
            </template>
            <el-descriptions :column="1" border size="default">
              <el-descriptions-item label="订单总额">
                <span class="align-right">¥{{ formatNumber(amountData.base_amount, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="平台手续费 (2%)">
                <span class="align-right primary-text">-¥{{ formatNumber(amountData.platform_fee, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="售后扣减">
                <span class="align-right warning-text">-¥{{ formatNumber(amountData.aftersale_deduct, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="违规罚款">
                <span class="align-right danger-text">-¥{{ formatNumber(amountData.violation_fine, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="其他扣减">
                <span class="align-right info-text">-¥{{ formatNumber(amountData.other_deduct, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="扣减合计">
                <span class="align-right danger-text">-¥{{ formatNumber(amountData.total_deduct, 2) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="实际结算金额">
                <span class="align-right actual-amount-big">¥{{ formatNumber(amountData.actual_amount, 2) }}</span>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <el-card shadow="hover" v-if="unfinishedAftersale.length > 0">
            <template #header>
              <div class="sub-header">
                <el-icon><Warning /></el-icon>
                <span class="ml8 danger-text">未完结售后订单拦截</span>
                <el-tag type="danger" class="ml8">{{ unfinishedAftersale.length }} 笔</el-tag>
              </div>
            </template>
            <el-alert
              type="error"
              show-icon
              :closable="false"
              title="存在未完结售后订单，请处理完成后再提交结算申请">
              <template #default>
                以下订单售后处理完成后方可结算
              </template>
            </el-alert>
            <el-table :data="unfinishedAftersale" border stripe size="small" class="mt12" max-height="220">
              <el-table-column prop="aftersale_no" label="售后单号" width="180" show-overflow-tooltip />
              <el-table-column label="退款金额" width="110" align="right">
                <template #default="{ row }">
                  <span class="danger-text">¥{{ formatNumber(row.amount, 2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="warning">{{ getAftersaleStatus(row.status) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <el-card shadow="hover" class="mt16" v-if="validateErrors.length > 0 || validateWarnings.length > 0">
            <template #header>
              <div class="sub-header">
                <el-icon><CircleCheck /></el-icon>
                <span class="ml8">合规风险提示</span>
                <el-tag v-if="validateErrors.length > 0" type="danger" class="ml8">{{ validateErrors.length }} 项错误</el-tag>
                <el-tag v-if="validateWarnings.length > 0" type="warning" class="ml8">{{ validateWarnings.length }} 项警告</el-tag>
              </div>
            </template>
            <div class="risk-list">
              <div
                v-for="(e, i) in validateErrors"
                :key="'e_' + i"
                class="risk-item danger"
                @click="scrollToField(e.field)">
                <el-icon><CircleClose /></el-icon>
                <span class="ml8">{{ e.message }}</span>
              </div>
              <div
                v-for="(w, i) in validateWarnings"
                :key="'w_' + i"
                class="risk-item warning"
                @click="scrollToField(w.field)">
                <el-icon><WarningFilled /></el-icon>
                <span class="ml8">{{ w.message }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="submit-bar">
        <el-button size="large" @click="goBack">返回</el-button>
        <el-button
          size="large"
          type="primary"
          :disabled="!canSubmit"
          @click="handleSubmit">
          提交结算申请
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Money, Wallet, Calendar, DataLine, Warning, CircleCheck, CircleClose, WarningFilled } from '@element-plus/icons-vue'
import { formatNumber } from '@/utils/common'
import {
  SETTLE_PERIOD_OPTIONS, BANK_VERIFY_OPTIONS,
  validateShopStatus, validateBankCard, validateAftersale, validateOrderAge, validatePeriod, validateSettleAll,
  calcSettleAmount, interceptSettleDuplicate, interceptSettleOver
} from '@/api/merchantSettle'
import type { FormInstance, FormRules } from 'element-plus'

const router = useRouter()
const bankFormRef = ref<FormInstance>()
const calcLoading = ref(false)

const BANK_OPTIONS = [
  '中国工商银行', '中国建设银行', '中国农业银行', '中国银行',
  '招商银行', '交通银行', '中国邮政储蓄银行', '兴业银行',
  '浦发银行', '中信银行', '民生银行', '光大银行',
  '平安银行', '华夏银行', '北京银行', '宁波银行',
]

const shopStatusAlert = computed(() => {
  if (shopInfo.shop_status !== 1) {
    return { type: 'error' as const, title: '店铺状态异常，无法提交结算申请', desc: shopInfo.shop_status_desc || '请先恢复店铺正常运营状态' }
  }
  if (!shopInfo.settlement_permission) {
    return { type: 'warning' as const, title: '无结算权限', desc: '请联系平台管理员开通结算权限后再申请' }
  }
  return { type: 'success' as const, title: '店铺状态正常', desc: shopInfo.shop_name ? `当前店铺：${shopInfo.shop_name}` : '可以提交结算申请' }
})

const formEnabled = computed(() => shopInfo.shop_status === 1 && shopInfo.settlement_permission)

const canSubmit = computed(() => {
  return formEnabled.value
    && validateErrors.value.length === 0
    && unfinishedAftersale.value.length === 0
    && amountData.actual_amount > 0
    && periodForm.dateRange.length === 2
    && bankForm.account_name
    && bankForm.account_no
    && bankForm.bank_name
    && bankForm.bank_branch
})

const shopInfo = reactive({
  merchant_id: 0,
  shop_name: '',
  shop_status: 1,
  shop_status_desc: '',
  settlement_permission: true,
})

const bankForm = reactive({
  account_name: '',
  account_no: '',
  bank_name: '',
  bank_branch: '',
  verify_status: 0,
})

const shakeFields = reactive<Record<string, boolean>>({
  account_name: false,
  account_no: false,
  bank_name: false,
  bank_branch: false,
})

const bankRules: FormRules = {
  account_name: [{ required: true, message: '请输入开户名', trigger: 'blur' }],
  account_no: [
    { required: true, message: '请输入银行卡号', trigger: 'blur' },
    { pattern: /^\d{16,22}$/, message: '银行卡号格式不正确（16-22位数字）', trigger: 'blur' },
  ],
  bank_name: [{ required: true, message: '请选择开户银行', trigger: 'change' }],
  bank_branch: [{ required: true, message: '请输入开户支行', trigger: 'blur' }],
}

const periodForm = reactive({
  period_type: 3,
  dateRange: [] as string[],
})

const amountData = reactive({
  base_amount: 0,
  platform_fee: 0,
  aftersale_deduct: 0,
  violation_fine: 0,
  other_deduct: 0,
  total_deduct: 0,
  actual_amount: 0,
  order_count: 0,
})

const unfinishedAftersale = ref<Array<{ id: number; aftersale_no: string; amount: number; status: number }>>([])
const immatureOrderCount = ref(0)
const validateErrors = ref<Array<{ field: string; message: string }>>([])
const validateWarnings = ref<Array<{ field: string; message: string; level?: string }>>([])

const getBankVerifyLabel = (s: number) => BANK_VERIFY_OPTIONS.find(o => o.value === s)?.label || '未知'
const getBankVerifyTagType = (s: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const o = BANK_VERIFY_OPTIONS.find(x => x.value === s)
  return (o?.type as any) || 'info'
}

const getAftersaleStatus = (s: number) => {
  const map: Record<number, string> = {
    1: '待审核', 2: '处理中', 3: '退款中', 4: '待寄回',
  }
  return map[s] || '处理中'
}

const triggerShake = (field: string) => {
  shakeFields[field] = true
  setTimeout(() => { shakeFields[field] = false }, 500)
}

const scrollToField = (field: string) => {
  if (!field) return
  triggerShake(field)
}

const validateField = async (field: string) => {
  if (field === 'account_no') {
    if (!/^\d{16,22}$/.test(bankForm.account_no)) {
      triggerShake('account_no')
      return
    }
    try {
      const res = await validateBankCard({
        merchant_id: shopInfo.merchant_id,
        bank_account_no: bankForm.account_no,
        bank_name: bankForm.bank_name,
      })
      if (res.data.data.verify_status !== undefined) {
        bankForm.verify_status = res.data.data.verify_status
      }
      if (!res.data.data.valid) {
        triggerShake('account_no')
      }
    } catch {}
  }
  if (field === 'account_name' && !bankForm.account_name.trim()) {
    triggerShake('account_name')
  }
  if (field === 'bank_branch' && !bankForm.bank_branch.trim()) {
    triggerShake('bank_branch')
  }
  runFullValidate()
}

const handlePeriodChange = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()
  const dateToStr = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }

  if (periodForm.period_type === 1) {
    const today = dateToStr(now)
    periodForm.dateRange = [today, today]
  } else if (periodForm.period_type === 2) {
    const weekday = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(day - weekday + 1)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    periodForm.dateRange = [dateToStr(monday), dateToStr(sunday)]
  } else if (periodForm.period_type === 3) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0)
    periodForm.dateRange = [dateToStr(start), dateToStr(end)]
  } else if (periodForm.period_type === 4) {
    const quarter = Math.floor(month / 3)
    const start = new Date(year, quarter * 3, 1)
    const end = new Date(year, quarter * 3 + 3, 0)
    periodForm.dateRange = [dateToStr(start), dateToStr(end)]
  }
  handleDateChange()
}

const handleDateChange = async () => {
  if (periodForm.dateRange.length !== 2) return
  await runChecks()
  await recalcAmount()
}

const runChecks = async () => {
  try {
    const [aftersaleRes, ageRes, periodRes, dupRes] = await Promise.all([
      validateAftersale({
        merchant_id: shopInfo.merchant_id,
        period_start: periodForm.dateRange[0],
        period_end: periodForm.dateRange[1],
      }),
      validateOrderAge({
        merchant_id: shopInfo.merchant_id,
        period_start: periodForm.dateRange[0],
        period_end: periodForm.dateRange[1],
      }),
      validatePeriod({
        merchant_id: shopInfo.merchant_id,
        period_type: periodForm.period_type,
        period_start: periodForm.dateRange[0],
        period_end: periodForm.dateRange[1],
      }),
      interceptSettleDuplicate({
        merchant_id: shopInfo.merchant_id,
        period_start: periodForm.dateRange[0],
        period_end: periodForm.dateRange[1],
      }),
    ])
    unfinishedAftersale.value = aftersaleRes.data.data.unfinished_list || []
    immatureOrderCount.value = ageRes.data.data.immature_count || 0
    if (dupRes.data.data.duplicated) {
      ElMessage.warning(dupRes.data.data.message || '该周期已存在结算申请')
    }
  } catch {}
}

const recalcAmount = async () => {
  if (periodForm.dateRange.length !== 2) return
  calcLoading.value = true
  try {
    const res = await calcSettleAmount({
      merchant_id: shopInfo.merchant_id,
      period_type: periodForm.period_type,
      period_start: periodForm.dateRange[0],
      period_end: periodForm.dateRange[1],
    })
    Object.assign(amountData, res.data.data)
    await interceptSettleOver({
      merchant_id: shopInfo.merchant_id,
      actual_amount: res.data.data.actual_amount,
    })
  } finally {
    calcLoading.value = false
  }
  runFullValidate()
}

const runFullValidate = async () => {
  if (periodForm.dateRange.length !== 2) return
  try {
    const res = await validateSettleAll({
      merchant_id: shopInfo.merchant_id,
      period_type: periodForm.period_type,
      period_start: periodForm.dateRange[0],
      period_end: periodForm.dateRange[1],
      bank_account_name: bankForm.account_name,
      bank_account_no: bankForm.account_no,
      bank_name: bankForm.bank_name,
      bank_branch: bankForm.bank_branch,
    })
    validateErrors.value = res.data.data.errors || []
    validateWarnings.value = res.data.data.warnings || []
  } catch {}
}

const loadShopStatus = async () => {
  try {
    const res = await validateShopStatus({ merchant_id: shopInfo.merchant_id || 1 })
    shopInfo.shop_status = res.data.data.shop_status || 1
    shopInfo.shop_status_desc = res.data.data.message || ''
    shopInfo.shop_name = '示例店铺'
    shopInfo.merchant_id = 1
    if (res.data.data.shop_status !== undefined) {
      shopInfo.settlement_permission = res.data.data.valid
    }
  } catch {
    shopInfo.merchant_id = 1
    shopInfo.shop_name = '示例店铺'
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value) return
  try {
    await ElMessageBox.confirm(
      `确定提交结算申请？\n\n实际结算金额：¥${formatNumber(amountData.actual_amount, 2)}\n结算周期：${periodForm.dateRange[0]} ~ ${periodForm.dateRange[1]}`,
      '提交确认',
      { type: 'warning', confirmButtonText: '确认提交', cancelButtonText: '再想想' }
    )
  } catch {
    return
  }
  ElMessage.success('结算申请提交成功')
  setTimeout(() => router.push('/merchant/settle'), 800)
}

const goBack = () => router.back()

onMounted(async () => {
  await loadShopStatus()
  await nextTick()
  bankForm.account_name = '张三'
  bankForm.account_no = '6222021234567890123'
  bankForm.bank_name = '中国工商银行'
  bankForm.bank_branch = '杭州西湖支行'
  bankForm.verify_status = 2
  handlePeriodChange()
})
</script>

<style scoped lang="scss">
.focus-glow {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper) {
    transition: box-shadow 0.2s ease;
    &:focus, &.is-focus, &.is-focused {
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.25);
    }
  }
}

@keyframes shake-error {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.shake-error {
  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper) {
    animation: shake-error 0.4s ease;
    border-color: var(--el-color-danger) !important;
    box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.2) !important;
  }
}

.page-container { padding: 16px; }
.mb16 { margin-bottom: 16px; }
.mt8 { margin-top: 8px; }
.mt12 { margin-top: 12px; }
.mt16 { margin-top: 16px; }
.ml8 { margin-left: 8px; }
.mr8 { margin-right: 8px; }
.danger-text { color: var(--el-color-danger); font-weight: 600; }
.warning-text { color: var(--el-color-warning); font-weight: 600; }
.primary-text { color: var(--el-color-primary); font-weight: 600; }
.info-text { color: var(--el-color-info); font-weight: 600; }
.w100 { width: 100%; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.header-title { display: flex; align-items: center; font-size: 16px; font-weight: 600; }
.sub-header { display: flex; align-items: center; font-weight: 600; }
.align-right { display: block; text-align: right; font-weight: 600; }
.actual-amount-big {
  display: block; text-align: right; font-weight: 700;
  font-size: 20px; color: var(--el-color-primary);
}
.risk-list {
  .risk-item {
    display: flex; align-items: center; padding: 8px 12px; margin-bottom: 6px;
    border-radius: 6px; cursor: pointer; transition: all 0.2s;
    &:hover { transform: translateX(4px); }
    &.danger {
      background: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
      border: 1px solid var(--el-color-danger-light-5);
    }
    &.warning {
      background: var(--el-color-warning-light-9);
      color: var(--el-color-warning);
      border: 1px solid var(--el-color-warning-light-5);
    }
  }
}
.submit-bar {
  margin-top: 24px; padding: 16px 24px; display: flex; justify-content: flex-end; gap: 12px;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}
</style>
