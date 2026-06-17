<template>
  <el-dialog
    v-model="dialogVisible"
    title="申请售后退款"
    width="640px"
    destroy-on-close
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="!canApply" class="after-sale-blocked">
      <el-alert
        :title="blockedReason"
        type="error"
        show-icon
        :closable="false"
      />
    </div>

    <div v-else>
      <div class="after-sale-order-info mb-20">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="订单号">{{ orderInfo?.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="商品名称">{{ orderInfo?.productName }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">
            <span class="amount-highlight">¥{{ formatAmount(orderInfo?.amount) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付时间">{{ orderInfo?.payTime || '--' }}</el-descriptions-item>
          <el-descriptions-item label="订单状态" :span="2">
            <el-tag :type="getOrderStatusType(orderInfo?.status)">
              {{ getOrderStatusLabel(orderInfo?.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-tabs v-model="activeTab" class="after-sale-tabs">
        <el-tab-pane
          :label="AfterSaleTypeEnum.NOT_FULFILLED.label"
          :name="AfterSaleTypeEnum.NOT_FULFILLED.value"
        >
          <div class="after-sale-tab-content">
            <el-alert
              title="100%可退，无违约金"
              type="success"
              :closable="false"
              show-icon
              class="mb-15"
            >
              <template #icon>
                <el-icon><CircleCheckFilled /></el-icon>
              </template>
            </el-alert>
            <el-form :model="refundForm" label-width="100px" class="after-sale-form">
              <el-form-item label="退款类型">
                <el-radio-group
                  v-model="refundForm.refundType"
                  :disabled="submitting"
                  @change="handleRefundTypeChange"
                >
                  <el-radio value="full">全额退款</el-radio>
                  <el-radio value="partial">部分退款</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="退款金额" required>
                <div class="amount-input-wrapper">
                  <el-input
                    v-model="refundForm.amount"
                    type="number"
                    :class="{ 'refund-input-focus': amountFocused }"
                    :disabled="submitting"
                    :max="maxRefundable"
                    :step="0.01"
                    placeholder="请输入退款金额"
                    @input="handleAmountInput"
                    @focus="amountFocused = true"
                    @blur="amountFocused = false"
                  >
                    <template #append>元</template>
                  </el-input>
                  <div class="amount-tip">
                    <span class="text-muted">最大可退金额：¥{{ formatAmount(maxRefundable) }}</span>
                  </div>
                  <div v-if="amountError" class="refund-error-text">{{ amountError }}</div>
                </div>
              </el-form-item>

              <el-form-item label="违约金">
                <div>
                  <div class="penalty-rule">
                    <el-icon style="vertical-align: middle; margin-right: 4px; color: #e6a23c;">
                      <Wallet />
                    </el-icon>
                    <span>{{ penaltyInfo.ruleLabel }}，收取{{ penaltyInfo.rateLabel }}</span>
                  </div>
                  <div class="penalty-amount">
                    <span class="text-muted">扣除金额：</span>
                    <span class="penalty-value">¥{{ formatAmount(penaltyInfo.penaltyAmount) }}</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="最终退款">
                <div class="final-amount-wrapper">
                  <span class="final-amount">¥{{ formatAmount(finalRefundAmount) }}</span>
                  <span v-if="isLarge" class="refund-large-tag ml-10">大额退款，需admin专项审核</span>
                </div>
              </el-form-item>

              <el-form-item label="退款原因" required>
                <el-input
                  v-model="refundForm.reason"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入退款原因（至少5个字符）"
                  :disabled="submitting"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane
          :label="AfterSaleTypeEnum.PARTIAL_FULFILLED.label"
          :name="AfterSaleTypeEnum.PARTIAL_FULFILLED.value"
        >
          <div class="after-sale-tab-content">
            <el-alert
              title="最高可退70%"
              type="warning"
              :closable="false"
              show-icon
              class="mb-15"
            >
              <template #icon>
                <el-icon><Warning /></el-icon>
              </template>
            </el-alert>
            <el-form :model="refundForm" label-width="100px" class="after-sale-form">
              <el-form-item label="退款类型">
                <el-radio-group
                  v-model="refundForm.refundType"
                  :disabled="submitting"
                  @change="handleRefundTypeChange"
                >
                  <el-radio value="full">全额退款</el-radio>
                  <el-radio value="partial">部分退款</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="退款金额" required>
                <div class="amount-input-wrapper">
                  <el-input
                    v-model="refundForm.amount"
                    type="number"
                    :class="{ 'refund-input-focus': amountFocused }"
                    :disabled="submitting"
                    :max="maxRefundable"
                    :step="0.01"
                    placeholder="请输入退款金额"
                    @input="handleAmountInput"
                    @focus="amountFocused = true"
                    @blur="amountFocused = false"
                  >
                    <template #append>元</template>
                  </el-input>
                  <div class="amount-tip">
                    <span class="text-muted">最大可退金额：¥{{ formatAmount(maxRefundable) }}</span>
                  </div>
                  <div v-if="amountError" class="refund-error-text">{{ amountError }}</div>
                </div>
              </el-form-item>

              <el-form-item label="违约金">
                <div>
                  <div class="penalty-rule">
                    <el-icon style="vertical-align: middle; margin-right: 4px; color: #e6a23c;">
                      <Wallet />
                    </el-icon>
                    <span>{{ penaltyInfo.ruleLabel }}，收取{{ penaltyInfo.rateLabel }}</span>
                  </div>
                  <div class="penalty-amount">
                    <span class="text-muted">扣除金额：</span>
                    <span class="penalty-value">¥{{ formatAmount(penaltyInfo.penaltyAmount) }}</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="最终退款">
                <div class="final-amount-wrapper">
                  <span class="final-amount">¥{{ formatAmount(finalRefundAmount) }}</span>
                  <span v-if="isLarge" class="refund-large-tag ml-10">大额退款，需admin专项审核</span>
                </div>
              </el-form-item>

              <el-form-item label="退款原因" required>
                <el-input
                  v-model="refundForm.reason"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入退款原因（至少5个字符）"
                  :disabled="submitting"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane
          :label="AfterSaleTypeEnum.FULL_FULFILLED.label"
          :name="AfterSaleTypeEnum.FULL_FULFILLED.value"
        >
          <div class="after-sale-tab-content">
            <el-alert
              title="最高可退50%，已使用部分不退"
              type="error"
              :closable="false"
              show-icon
              class="mb-15"
            >
              <template #icon>
                <el-icon><Warning /></el-icon>
              </template>
            </el-alert>
            <el-form :model="refundForm" label-width="100px" class="after-sale-form">
              <el-form-item label="退款类型">
                <el-radio-group
                  v-model="refundForm.refundType"
                  :disabled="submitting"
                  @change="handleRefundTypeChange"
                >
                  <el-radio value="full">全额退款</el-radio>
                  <el-radio value="partial">部分退款</el-radio>
                </el-radio-group>
              </el-form-item>

              <el-form-item label="退款金额" required>
                <div class="amount-input-wrapper">
                  <el-input
                    v-model="refundForm.amount"
                    type="number"
                    :class="{ 'refund-input-focus': amountFocused }"
                    :disabled="submitting"
                    :max="maxRefundable"
                    :step="0.01"
                    placeholder="请输入退款金额"
                    @input="handleAmountInput"
                    @focus="amountFocused = true"
                    @blur="amountFocused = false"
                  >
                    <template #append>元</template>
                  </el-input>
                  <div class="amount-tip">
                    <span class="text-muted">最大可退金额：¥{{ formatAmount(maxRefundable) }}</span>
                  </div>
                  <div v-if="amountError" class="refund-error-text">{{ amountError }}</div>
                </div>
              </el-form-item>

              <el-form-item label="违约金">
                <div>
                  <div class="penalty-rule">
                    <el-icon style="vertical-align: middle; margin-right: 4px; color: #e6a23c;">
                      <Wallet />
                    </el-icon>
                    <span>{{ penaltyInfo.ruleLabel }}，收取{{ penaltyInfo.rateLabel }}</span>
                  </div>
                  <div class="penalty-amount">
                    <span class="text-muted">扣除金额：</span>
                    <span class="penalty-value">¥{{ formatAmount(penaltyInfo.penaltyAmount) }}</span>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="最终退款">
                <div class="final-amount-wrapper">
                  <span class="final-amount">¥{{ formatAmount(finalRefundAmount) }}</span>
                  <span v-if="isLarge" class="refund-large-tag ml-10">大额退款，需admin专项审核</span>
                </div>
              </el-form-item>

              <el-form-item label="退款原因" required>
                <el-input
                  v-model="refundForm.reason"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入退款原因（至少5个字符）"
                  :disabled="submitting"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="handleClose" :disabled="submitting">取消</el-button>
      <el-button
        type="primary"
        class="ripple-btn"
        :class="{ 'refund-disable-btn': submitting }"
        :disabled="!canSubmit || submitting"
        :loading="submitting"
        @mousedown="handleRipple"
        @click="handleSubmit"
      >
        <span v-if="submitting">提交中...</span>
        <span v-else>提交申请</span>
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Wallet, CircleCheckFilled, Warning
} from '@element-plus/icons-vue'
import { applyAfterSale } from '@/api/afterSale'
import {
  AfterSaleTypeEnum,
  OrderStatusEnum,
  getEnumLabel,
  getEnumType
} from '@/utils/enums'
import { formatAmount } from '@/utils/payment'
import {
  validateRefundAmount,
  calculatePenalty,
  getMaxRefundable,
  isLargeAmount
} from '@/utils/refund'

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

const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const activeTab = ref(AfterSaleTypeEnum.NOT_FULFILLED.value)
const submitting = ref(false)
const amountFocused = ref(false)

const refundForm = reactive({
  refundType: 'full',
  amount: '',
  reason: ''
})

const amountError = ref('')

const maxRefundable = computed(() => {
  return getMaxRefundable(activeTab.value, props.orderInfo?.amount, props.orderInfo?.refundAmount)
})

const penaltyInfo = computed(() => {
  return calculatePenalty(props.orderInfo?.payTime, props.orderInfo?.amount)
})

const finalRefundAmount = computed(() => {
  const amount = Number(refundForm.amount) || 0
  const penalty = penaltyInfo.value?.penaltyAmount || 0
  return Number(Math.max(0, (amount - penalty)).toFixed(2))
})

const isLarge = computed(() => {
  return isLargeAmount(finalRefundAmount.value)
})

const canApply = computed(() => {
  if (!props.orderInfo) return false
  const allowStatuses = [
    OrderStatusEnum.PAID.value,
    OrderStatusEnum.COMPLETED.value
  ]
  return allowStatuses.includes(props.orderInfo.status)
})

const blockedReason = computed(() => {
  if (!props.orderInfo) return '订单信息不存在'
  const allowStatuses = [
    OrderStatusEnum.PAID.value,
    OrderStatusEnum.COMPLETED.value
  ]
  if (!allowStatuses.includes(props.orderInfo.status)) {
    return `订单状态不允许申请售后退款（当前状态：${getOrderStatusLabel(props.orderInfo.status)}）`
  }
  return ''
})

const canSubmit = computed(() => {
  if (!canApply.value) return false
  if (amountError.value) return false
  if (!refundForm.amount || Number(refundForm.amount) <= 0) return false
  if (!refundForm.reason || refundForm.reason.trim().length < 5) return false
  return true
})

const getOrderStatusLabel = (val) => getEnumLabel(OrderStatusEnum, val)
const getOrderStatusType = (val) => getEnumType(OrderStatusEnum, val)

const handleAmountInput = () => {
  const val = refundForm.amount
  if (val && String(val).includes('.')) {
    const parts = String(val).split('.')
    if (parts[1] && parts[1].length > 2) {
      refundForm.amount = parts[0] + '.' + parts[1].slice(0, 2)
    }
  }
  const result = validateRefundAmount(
    refundForm.amount,
    maxRefundable.value,
    props.orderInfo?.amount
  )
  amountError.value = result.valid ? '' : result.message
}

const handleRefundTypeChange = (val) => {
  if (val === 'full') {
    refundForm.amount = String(maxRefundable.value)
    handleAmountInput()
  }
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

const handleSubmit = async () => {
  if (!canSubmit.value) return

  handleAmountInput()
  if (amountError.value) {
    ElMessage.warning(amountError.value)
    return
  }

  submitting.value = true
  try {
    const data = {
      orderId: props.orderInfo?.id,
      afterSaleType: activeTab.value,
      refundType: refundForm.refundType,
      applyAmount: Number(refundForm.amount),
      penaltyAmount: penaltyInfo.value.penaltyAmount,
      finalAmount: finalRefundAmount.value,
      reason: refundForm.reason
    }
    const result = await applyAfterSale(data)

    if (result && result.success) {
      ElMessage.success('售后退款申请已提交')
      emit('success', result)
      dialogVisible.value = false
    } else {
      ElMessage.error(result?.message || '提交失败')
    }
  } catch (err) {
    ElMessage.error(err.message || '提交失败')
  } finally {
    setTimeout(() => {
      submitting.value = false
    }, 300)
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const resetForm = () => {
  activeTab.value = AfterSaleTypeEnum.NOT_FULFILLED.value
  refundForm.refundType = 'full'
  refundForm.amount = ''
  refundForm.reason = ''
  amountError.value = ''
}

watch(() => activeTab.value, () => {
  if (refundForm.refundType === 'full') {
    refundForm.amount = String(maxRefundable.value)
  }
  handleAmountInput()
})

watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
    if (props.orderInfo?.amount) {
      refundForm.amount = String(maxRefundable.value)
      handleAmountInput()
    }
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/afterSale.scss';
@import '@/styles/payment.scss';

.after-sale-order-info {
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

.after-sale-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}

.after-sale-tab-content {
  padding: 8px 0;
}

.after-sale-form {
  :deep(.el-form-item__label) {
    color: #606266;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  .amount-input-wrapper {
    width: 100%;

    .amount-tip {
      margin-top: 4px;
    }

    .refund-error-text {
      margin-top: 4px;
    }
  }

  .penalty-rule {
    font-size: 13px;
    color: #606266;
    margin-bottom: 4px;
  }

  .penalty-amount {
    .penalty-value {
      color: #e6a23c;
      font-weight: 600;
    }
  }

  .final-amount-wrapper {
    display: flex;
    align-items: center;

    .final-amount {
      color: #f56c6c;
      font-weight: 600;
      font-size: 18px;
    }
  }

  .text-muted {
    color: #909399;
    font-size: 13px;
  }
}

.ml-10 {
  margin-left: 10px;
}

.mb-15 {
  margin-bottom: 15px;
}

.mb-20 {
  margin-bottom: 20px;
}

.after-sale-blocked {
  padding: 20px;
}
</style>
