<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="640px"
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="!canPay" class="payment-blocked">
      <el-alert
        :title="blockReason"
        type="error"
        show-icon
        :closable="false"
      />
    </div>

    <div v-else>
      <div class="payment-order-info mb-20">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ orderInfo?.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ orderInfo?.productName }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="amount-highlight">¥{{ formatAmount(orderInfo?.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付时效">
            <span :class="['countdown-timer', { 'countdown-urgent': countdown.isUrgent }]">
              {{ countdown.text }}
            </span>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-tabs v-model="activeTab" class="payment-tabs" @tab-change="handleTabChange">
        <el-tab-pane :label="PaymentModeEnum.INSTANT.label" :name="PaymentModeEnum.INSTANT.value">
          <div class="payment-tab-content">
            <el-form :model="instantForm" label-width="100px" class="payment-form">
              <el-form-item label="支付渠道" required>
                <el-radio-group v-model="instantForm.channel" :disabled="isSubmitting">
                  <el-radio
                    v-for="channel in availableChannels"
                    :key="channel.value"
                    :value="channel.value"
                    :disabled="!channel.enabled"
                  >
                    <el-icon style="vertical-align: middle; margin-right: 4px;">
                      <component :is="getChannelIcon(channel.value)" />
                    </el-icon>
                    {{ channel.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="支付金额" required :error="amountError">
                <el-input
                  v-model="instantForm.amount"
                  type="number"
                  :disabled="isSubmitting"
                  :max="Number(orderInfo?.amount)"
                  :step="0.01"
                  placeholder="请输入支付金额"
                  @input="handleAmountInput('instant')"
                >
                  <template #append>元</template>
                </el-input>
                <el-icon v-if="isAmountValid('instant')" class="valid-checkmark">
                  <CircleCheckFilled />
                </el-icon>
              </el-form-item>

              <el-form-item label="抵扣项">
                <el-checkbox-group v-model="instantForm.selectedDeductions" :disabled="isSubmitting">
                  <el-checkbox
                    v-for="d in availableDeductions"
                    :key="d.id"
                    :value="d.id"
                  >
                    <span :style="{ color: d.color }">{{ d.name }}</span>
                    <span class="deduction-amount">-¥{{ formatAmount(d.amount) }}</span>
                  </el-checkbox>
                </el-checkbox-group>
                <el-alert
                  v-if="deductionWarning"
                  :title="deductionWarning"
                  type="warning"
                  size="small"
                  show-icon
                  class="mt-10"
                  :closable="false"
                />
              </el-form-item>

              <el-form-item label="手续费">
                <span v-if="instantFees.length > 0">
                  <el-tag v-for="(fee, idx) in instantFees" :key="idx" type="info" size="small" class="mr-5">
                    {{ fee.name }}: ¥{{ formatAmount(fee.amount) }}
                  </el-tag>
                </span>
                <span v-else class="text-muted">暂无手续费</span>
              </el-form-item>

              <el-form-item label="实付金额">
                <span class="actual-amount">¥{{ formatAmount(instantActualAmount) }}</span>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="PaymentModeEnum.INSTALLMENT.label" :name="PaymentModeEnum.INSTALLMENT.value">
          <div class="payment-tab-content">
            <el-form :model="installmentForm" label-width="100px" class="payment-form">
              <el-form-item label="分期期数" required>
                <el-radio-group v-model="installmentForm.periods" :disabled="isSubmitting">
                  <el-radio :value="3">3期</el-radio>
                  <el-radio :value="6">6期</el-radio>
                  <el-radio :value="12">12期</el-radio>
                  <el-radio :value="24">24期</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="支付渠道" required>
                <el-radio-group v-model="installmentForm.channel" :disabled="isSubmitting">
                  <el-radio
                    v-for="channel in installmentChannels"
                    :key="channel.value"
                    :value="channel.value"
                  >
                    <el-icon style="vertical-align: middle; margin-right: 4px;">
                      <component :is="getChannelIcon(channel.value)" />
                    </el-icon>
                    {{ channel.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="每期金额">
                <span class="period-amount">¥{{ formatAmount(perPeriodAmount) }}</span>
                <span class="text-muted">× {{ installmentForm.periods }}期</span>
              </el-form-item>

              <el-form-item label="分期手续费">
                <span class="fee-amount">¥{{ formatAmount(installmentFeeAmount) }}</span>
                <el-tag type="info" size="small" class="ml-10">
                  费率 {{ (installmentFeeRate * 100).toFixed(1) }}%
                </el-tag>
              </el-form-item>

              <el-form-item label="实付总额">
                <span class="actual-amount">¥{{ formatAmount(installmentActualAmount) }}</span>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="PaymentModeEnum.DIFFERENCE.label" :name="PaymentModeEnum.DIFFERENCE.value">
          <div class="payment-tab-content">
            <el-form :model="differenceForm" label-width="100px" class="payment-form">
              <el-form-item label="已付金额">
                <span class="paid-amount">¥{{ formatAmount(paidAmount) }}</span>
              </el-form-item>

              <el-form-item label="剩余金额">
                <span class="remain-amount">¥{{ formatAmount(remainAmount) }}</span>
              </el-form-item>

              <el-form-item label="补差金额" required :error="differenceAmountError">
                <el-input
                  v-model="differenceForm.amount"
                  type="number"
                  :disabled="isSubmitting"
                  :max="Number(remainAmount)"
                  :step="0.01"
                  placeholder="请输入补差金额"
                  @input="handleAmountInput('difference')"
                >
                  <template #append>元</template>
                </el-input>
                <el-icon v-if="isAmountValid('difference')" class="valid-checkmark">
                  <CircleCheckFilled />
                </el-icon>
              </el-form-item>

              <el-form-item label="支付渠道" required>
                <el-radio-group v-model="differenceForm.channel" :disabled="isSubmitting">
                  <el-radio
                    v-for="channel in availableChannels"
                    :key="channel.value"
                    :value="channel.value"
                  >
                    <el-icon style="vertical-align: middle; margin-right: 4px;">
                      <component :is="getChannelIcon(channel.value)" />
                    </el-icon>
                    {{ channel.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="实付金额">
                <span class="actual-amount">¥{{ formatAmount(differenceActualAmount) }}</span>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="handleClose" :disabled="isSubmitting">取消</el-button>
      <el-button
        type="primary"
        class="ripple-btn"
        :disabled="!canSubmit || isSubmitting"
        :loading="isSubmitting"
        @mousedown="handleRipple"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting">支付处理中...</span>
        <span v-else>确认支付</span>
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ChatDotRound, Aim, CreditCard, Money, Wallet, CircleCheckFilled
} from '@element-plus/icons-vue'
import { initiatePayment } from '@/api/payment'
import {
  PaymentModeEnum,
  PaymentChannelEnum,
  OrderPriorityEnum,
  OrderStatusEnum,
  getEnumOptions
} from '@/utils/enums'
import {
  formatAmount,
  getCountdownText,
  validateAmountPrecision,
  calculateActualAmount,
  checkDeductionRatio
} from '@/utils/payment'
import eventBus from '@/utils/eventBus'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  orderInfo: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue', 'success', 'fail'])

const userStore = useUserStore()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const dialogTitle = computed(() => {
  if (!props.orderInfo) return '订单支付'
  return `订单支付 - ${props.orderInfo.orderNo || ''}`
})

const activeTab = ref(PaymentModeEnum.INSTANT.value)
const isSubmitting = ref(false)
const countdown = ref({ text: '--', isUrgent: false, isExpired: false })
const countdownTimer = ref(null)
const rippleEl = ref(null)

const instantForm = reactive({
  channel: '',
  amount: '',
  selectedDeductions: []
})

const installmentForm = reactive({
  periods: 3,
  channel: ''
})

const differenceForm = reactive({
  amount: '',
  channel: ''
})

const allowedChannels = computed(() => {
  const all = Object.values(PaymentChannelEnum)
  return all.map(ch => ({
    ...ch,
    enabled: true
  }))
})

const availableChannels = computed(() => {
  return allowedChannels.value
})

const installmentChannels = computed(() => {
  return allowedChannels.value.filter(ch =>
    [PaymentChannelEnum.ALIPAY.value, PaymentChannelEnum.WECHAT.value, PaymentChannelEnum.CREDIT_CARD.value]
      .includes(ch.value)
  )
})

const availableDeductions = computed(() => {
  return [
    { id: 'd1', type: 'coupon', name: '满1000减100优惠券', amount: 100, color: '#faad14' },
    { id: 'd2', type: 'points', name: '1000积分抵扣', amount: 50, color: '#1890ff' },
    { id: 'd3', type: 'member_discount', name: '金卡会员9折', amount: Number(props.orderInfo?.amount || 0) * 0.1, color: '#722ed1' }
  ]
})

const selectedDeductionList = computed(() => {
  return availableDeductions.value.filter(d => instantForm.selectedDeductions.includes(d.id))
})

const instantFees = computed(() => {
  const amount = Number(instantForm.amount) || 0
  if (amount <= 0) return []
  const channelFeeRate = instantForm.channel === PaymentChannelEnum.CREDIT_CARD.value ? 0.006 : 0.003
  return [
    { name: '渠道手续费', amount: Number((amount * channelFeeRate).toFixed(2)) }
  ]
})

const isHighEnd = computed(() => {
  return props.orderInfo?.priority === OrderPriorityEnum.HIGH_END.value
})

const deductionCheck = computed(() => {
  return checkDeductionRatio(
    instantForm.amount,
    selectedDeductionList.value,
    isHighEnd.value
  )
})

const deductionWarning = computed(() => {
  if (!deductionCheck.value.exceeded) return ''
  const limitType = isHighEnd.value ? '高端商旅订单' : '普通订单'
  return `抵扣比例已达 ${deductionCheck.value.ratio}%，${limitType}最高允许抵扣 ${deductionCheck.value.limit}%`
})

const instantActualAmount = computed(() => {
  return calculateActualAmount(
    instantForm.amount,
    selectedDeductionList.value,
    instantFees.value
  )
})

const installmentFeeRate = computed(() => {
  const periodMap = { 3: 0.023, 6: 0.045, 12: 0.088, 24: 0.17 }
  return periodMap[installmentForm.periods] || 0
})

const installmentFeeAmount = computed(() => {
  const total = Number(props.orderInfo?.amount) || 0
  return Number((total * installmentFeeRate.value).toFixed(2))
})

const perPeriodAmount = computed(() => {
  const total = Number(props.orderInfo?.amount) || 0
  const fee = installmentFeeAmount.value
  return Number(((total + fee) / installmentForm.periods).toFixed(2))
})

const installmentActualAmount = computed(() => {
  const total = Number(props.orderInfo?.amount) || 0
  return Number((total + installmentFeeAmount.value).toFixed(2))
})

const paidAmount = computed(() => {
  return props.orderInfo?.paidAmount || 0
})

const remainAmount = computed(() => {
  const total = Number(props.orderInfo?.amount) || 0
  return Number((total - paidAmount.value).toFixed(2))
})

const differenceActualAmount = computed(() => {
  return Number(differenceForm.amount) || 0
})

const amountError = computed(() => {
  if (!instantForm.amount) return ''
  const result = validateAmountPrecision(instantForm.amount)
  if (!result.valid) return result.message
  if (Number(instantForm.amount) > Number(props.orderInfo?.amount || 0)) {
    return '支付金额不能超过订单金额'
  }
  return ''
})

const differenceAmountError = computed(() => {
  if (!differenceForm.amount) return ''
  const result = validateAmountPrecision(differenceForm.amount)
  if (!result.valid) return result.message
  if (Number(differenceForm.amount) > remainAmount.value) {
    return '补差金额不能超过剩余金额'
  }
  return ''
})

const isUserStatusOk = computed(() => {
  const roles = userStore.roles || []
  return roles.length > 0 && !!userStore.token
})

const canPay = computed(() => {
  if (!props.orderInfo) return false
  if (props.orderInfo.status !== OrderStatusEnum.PENDING_PAYMENT.value) return false
  if (countdown.value.isExpired) return false
  if (!isUserStatusOk.value) return false
  return true
})

const blockReason = computed(() => {
  if (!props.orderInfo) return '订单信息不存在'
  if (props.orderInfo.status !== OrderStatusEnum.PENDING_PAYMENT.value) {
    return `订单状态不允许支付（当前状态：${getEnumLabel(OrderStatusEnum, props.orderInfo.status)}）`
  }
  if (countdown.value.isExpired) return '支付时效已过期，请联系客服申请豁免或重新下单'
  if (!isUserStatusOk.value) return '用户状态异常，请重新登录后再试'
  return ''
})

const canSubmit = computed(() => {
  if (!canPay.value) return false
  if (activeTab.value === PaymentModeEnum.INSTANT.value) {
    return instantForm.channel && !amountError.value && Number(instantForm.amount) > 0
  }
  if (activeTab.value === PaymentModeEnum.INSTALLMENT.value) {
    return installmentForm.channel && installmentForm.periods
  }
  if (activeTab.value === PaymentModeEnum.DIFFERENCE.value) {
    return differenceForm.channel && !differenceAmountError.value && Number(differenceForm.amount) > 0
  }
  return false
})

const getChannelIcon = (value) => {
  const ch = Object.values(PaymentChannelEnum).find(c => c.value === value)
  if (!ch) return Wallet
  const iconMap = {
    ChatDotRound, Aim, CreditCard, Money, Wallet
  }
  return iconMap[ch.icon] || Wallet
}

const isAmountValid = (type) => {
  if (type === 'instant') {
    if (!instantForm.amount) return false
    const r = validateAmountPrecision(instantForm.amount)
    return r.valid && Number(instantForm.amount) <= Number(props.orderInfo?.amount || 0)
  }
  if (type === 'difference') {
    if (!differenceForm.amount) return false
    const r = validateAmountPrecision(differenceForm.amount)
    return r.valid && Number(differenceForm.amount) <= remainAmount.value
  }
  return false
}

const handleAmountInput = (type) => {
  if (type === 'instant') {
    const val = instantForm.amount
    if (val && val.includes('.')) {
      const parts = val.split('.')
      if (parts[1] && parts[1].length > 2) {
        instantForm.amount = parts[0] + '.' + parts[1].slice(0, 2)
      }
    }
  }
  if (type === 'difference') {
    const val = differenceForm.amount
    if (val && val.includes('.')) {
      const parts = val.split('.')
      if (parts[1] && parts[1].length > 2) {
        differenceForm.amount = parts[0] + '.' + parts[1].slice(0, 2)
      }
    }
  }
}

const handleTabChange = () => {
}

const handleRipple = (e) => {
  const target = e.currentTarget
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const size = Math.max(rect.width, rect.height)

  const ripple = document.createElement('span')
  ripple.className = 'ripple-effect'
  ripple.style.width = ripple.style.height = size + 'px'
  ripple.style.left = (x - size / 2) + 'px'
  ripple.style.top = (y - size / 2) + 'px'
  target.appendChild(ripple)

  setTimeout(() => {
    if (ripple.parentNode) {
      ripple.parentNode.removeChild(ripple)
    }
  }, 600)
}

const updateCountdown = () => {
  if (props.orderInfo?.expireTime) {
    countdown.value = getCountdownText(props.orderInfo.expireTime)
  }
}

const startCountdown = () => {
  updateCountdown()
  countdownTimer.value = setInterval(() => {
    updateCountdown()
    if (countdown.value.isExpired && countdownTimer.value) {
      clearInterval(countdownTimer.value)
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

const resetForm = () => {
  activeTab.value = PaymentModeEnum.INSTANT.value
  instantForm.channel = ''
  instantForm.amount = ''
  instantForm.selectedDeductions = []
  installmentForm.periods = 3
  installmentForm.channel = ''
  differenceForm.amount = ''
  differenceForm.channel = ''
}

const buildSubmitData = () => {
  const orderId = props.orderInfo?.id
  if (activeTab.value === PaymentModeEnum.INSTANT.value) {
    return {
      orderId,
      mode: PaymentModeEnum.INSTANT.value,
      channel: instantForm.channel,
      amount: Number(instantForm.amount),
      deductions: selectedDeductionList.value,
      fees: instantFees.value
    }
  }
  if (activeTab.value === PaymentModeEnum.INSTALLMENT.value) {
    return {
      orderId,
      mode: PaymentModeEnum.INSTALLMENT.value,
      channel: installmentForm.channel,
      periods: installmentForm.periods,
      amount: Number(props.orderInfo?.amount),
      feeRate: installmentFeeRate.value,
      feeAmount: installmentFeeAmount.value
    }
  }
  if (activeTab.value === PaymentModeEnum.DIFFERENCE.value) {
    return {
      orderId,
      mode: PaymentModeEnum.DIFFERENCE.value,
      channel: differenceForm.channel,
      amount: Number(differenceForm.amount)
    }
  }
  return { orderId }
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  if (activeTab.value === PaymentModeEnum.INSTANT.value && deductionCheck.value.exceeded) {
    ElMessage.warning(deductionWarning.value)
    return
  }

  isSubmitting.value = true
  try {
    const data = buildSubmitData()
    const result = await initiatePayment(data)

    if (result && result.success) {
      ElMessage.success('支付请求已提交')
      eventBus.emit('payment:result', {
        success: true,
        orderId: props.orderInfo?.id,
        orderNo: props.orderInfo?.orderNo,
        amount: data.amount,
        flowId: result.flowId
      })
      emit('success', result)
      dialogVisible.value = false
    } else {
      const failCode = result?.failCode || 'channel_error'
      eventBus.emit('payment:result', {
        success: false,
        orderId: props.orderInfo?.id,
        orderNo: props.orderInfo?.orderNo,
        amount: data.amount,
        failCode,
        message: result?.message
      })
      emit('fail', result)
      ElMessage.error(result?.message || '支付失败')
    }
  } catch (err) {
    eventBus.emit('payment:result', {
      success: false,
      orderId: props.orderInfo?.id,
      orderNo: props.orderInfo?.orderNo,
      failCode: 'channel_error',
      message: err.message || '支付请求异常'
    })
    emit('fail', err)
    ElMessage.error(err.message || '支付失败')
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  stopCountdown()
  resetForm()
  emit('update:modelValue', false)
}

watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
    if (props.orderInfo?.amount) {
      instantForm.amount = String(props.orderInfo.amount)
    }
    if (remainAmount.value > 0) {
      differenceForm.amount = String(remainAmount.value)
    }
    startCountdown()
  } else {
    stopCountdown()
  }
})

onUnmounted(() => {
  stopCountdown()
})
</script>

<style lang="scss" scoped>
.payment-order-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;

  :deep(.el-descriptions__label) {
    width: 100px;
    color: #606266;
  }

  .amount-highlight {
    color: #f56c6c;
    font-weight: 600;
    font-size: 16px;
  }
}

.payment-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.payment-tab-content {
  padding: 8px 0;
}

.payment-form {
  :deep(.el-form-item__label) {
    color: #606266;
  }

  .deduction-amount {
    margin-left: 8px;
    color: #67c23a;
    font-size: 13px;
  }

  .text-muted {
    color: #909399;
    font-size: 13px;
  }

  .ml-10 {
    margin-left: 10px;
  }

  .mr-5 {
    margin-right: 5px;
  }

  .actual-amount {
    color: #f56c6c;
    font-weight: 600;
    font-size: 18px;
  }

  .period-amount {
    color: #409eff;
    font-weight: 600;
    font-size: 16px;
  }

  .fee-amount {
    color: #e6a23c;
    font-weight: 600;
  }

  .paid-amount {
    color: #67c23a;
    font-weight: 500;
  }

  .remain-amount {
    color: #f56c6c;
    font-weight: 600;
  }
}

.mt-10 {
  margin-top: 10px;
}

.mb-20 {
  margin-bottom: 20px;
}

.payment-blocked {
  padding: 20px;
}
</style>
