<template>
  <div>
    <transition name="fade">
      <div v-if="centerModal.visible" class="payment-result-modal-wrapper">
        <div class="payment-result-modal">
          <div class="result-content" :class="centerModal.success ? 'result-success' : 'result-fail'">
            <div class="result-icon">
              <el-icon :size="72">
                <CircleCheckFilled v-if="centerModal.success" />
                <CircleCloseFilled v-else />
              </el-icon>
            </div>
            <div class="result-title">
              {{ centerModal.success ? '支付成功' : '支付失败' }}
            </div>
            <div class="result-order-no">
              订单号：{{ centerModal.orderNo || '--' }}
            </div>
            <div v-if="centerModal.success" class="result-amount">
              支付金额：<span class="amount-value">¥{{ formatAmount(centerModal.amount) }}</span>
            </div>
            <div v-else class="result-reason">
              失败原因：<span class="reason-text">{{ getFailReasonLabel(centerModal.failCode) }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="slide-top">
      <div
        v-if="notificationBar.visible"
        class="payment-notification-bar"
        :style="{ background: notificationBar.success ? '#52c41a' : '#ff4d4f' }"
      >
        <div class="notification-content">
          <el-icon :size="20" class="notification-icon">
            <CircleCheckFilled v-if="notificationBar.success" />
            <Warning v-else />
          </el-icon>
          <div class="payment-marquee">
            <div class="payment-marquee-content">
              <span v-for="(msg, idx) in marqueeMessages" :key="idx" class="marquee-item">
                {{ msg }}
                <span class="marquee-separator">◆</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { CircleCheckFilled, CircleCloseFilled, Warning } from '@element-plus/icons-vue'
import { PaymentFailCodeEnum, getEnumLabel } from '@/utils/enums'
import { formatAmount } from '@/utils/payment'
import eventBus from '@/utils/eventBus'

const centerModal = reactive({
  visible: false,
  success: false,
  orderNo: '',
  amount: 0,
  failCode: ''
})

const notificationBar = reactive({
  visible: false,
  success: true
})

const marqueeMessages = ref([])

let centerTimer = null
let notificationTimer = null

const getFailReasonLabel = (code) => {
  if (!code) return '未知原因'
  return getEnumLabel(PaymentFailCodeEnum, code)
}

const showCenterModal = (data) => {
  centerModal.visible = true
  centerModal.success = !!data.success
  centerModal.orderNo = data.orderNo || ''
  centerModal.amount = data.amount || 0
  centerModal.failCode = data.failCode || ''

  if (centerTimer) clearTimeout(centerTimer)
  centerTimer = setTimeout(() => {
    centerModal.visible = false
  }, 3000)
}

const showNotificationBar = (data) => {
  const text = data.success
    ? `【支付成功】订单 ${data.orderNo} 支付 ¥${formatAmount(data.amount)}`
    : `【支付失败】订单 ${data.orderNo}：${getFailReasonLabel(data.failCode)}`

  marqueeMessages.value.push(text)
  if (marqueeMessages.value.length > 10) {
    marqueeMessages.value = marqueeMessages.value.slice(-10)
  }

  notificationBar.success = !!data.success
  notificationBar.visible = true

  if (notificationTimer) clearTimeout(notificationTimer)
  notificationTimer = setTimeout(() => {
    notificationBar.visible = false
  }, 5000)
}

const emitStatusChange = (data) => {
  eventBus.emit('order:payment-status-change', {
    orderId: data.orderId,
    success: !!data.success,
    failCode: data.failCode
  })
}

const handlePaymentResult = (data) => {
  if (!data) return
  showCenterModal(data)
  showNotificationBar(data)
  emitStatusChange(data)
}

onMounted(() => {
  eventBus.on('payment:result', handlePaymentResult)
})

onUnmounted(() => {
  eventBus.off('payment:result', handlePaymentResult)
  if (centerTimer) clearTimeout(centerTimer)
  if (notificationTimer) clearTimeout(notificationTimer)
})
</script>

<style lang="scss" scoped>
.payment-result-modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2999;
  background: rgba(0, 0, 0, 0.3);
}

.result-content {
  min-width: 360px;
  padding: 40px 36px;
  background: #fff;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);

  &.result-success {
    .result-icon {
      color: #52c41a;
    }
    .result-title {
      color: #52c41a;
    }
  }

  &.result-fail {
    .result-icon {
      color: #ff4d4f;
    }
    .result-title {
      color: #ff4d4f;
    }
  }

  .result-icon {
    margin-bottom: 16px;
    line-height: 1;
  }

  .result-title {
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .result-order-no {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
    padding: 8px 16px;
    background: #f5f7fa;
    border-radius: 6px;
    display: inline-block;
  }

  .result-amount {
    font-size: 15px;
    color: #606266;
    margin-top: 8px;

    .amount-value {
      color: #f56c6c;
      font-weight: 600;
      font-size: 20px;
      margin-left: 4px;
    }
  }

  .result-reason {
    font-size: 14px;
    color: #606266;
    margin-top: 8px;

    .reason-text {
      color: #ff4d4f;
      font-weight: 500;
    }
  }
}

.notification-content {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: #fff;
  gap: 12px;

  .notification-icon {
    flex-shrink: 0;
  }

  .payment-marquee {
    flex: 1;
    overflow: hidden;

    .marquee-item {
      font-size: 14px;
      padding: 0 20px;

      .marquee-separator {
        margin-left: 20px;
        opacity: 0.6;
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-top-enter-active,
.slide-top-leave-active {
  transition: all 0.5s ease;
}
.slide-top-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}
.slide-top-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
