<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="v => emit('update:modelValue', v)"
    :title="result?.success ? '✓ 核销成功' : '✗ 核销失败'"
    width="520px"
    class="verify-result-dialog"
    :close-on-click-modal="true"
  >
    <div v-if="result" class="result-card" :class="result.success ? 'success' : 'fail'">
      <div class="big-icon">
        <el-icon>
          <component :is="result.success ? CircleCheckFilled : CircleCloseFilled" />
        </el-icon>
      </div>
      <div class="result-title" :class="result.success ? 'success' : 'fail'">
        {{ result.success ? '核销成功' : '核销失败' }}
      </div>
      <div class="result-subtitle">{{ result.message || '票务校验完成' }}</div>
    </div>

    <div v-if="result" class="verify-detail-box">
      <div class="detail-row">
        <span class="detail-label">票务编码</span>
        <span class="detail-value ticket-code">{{ result.fulfillment?.ticketCode || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">关联订单</span>
        <span class="detail-value">{{ result.fulfillment?.orderId || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">景点</span>
        <span class="detail-value">{{ result.scenicSpotName || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">票种</span>
        <span class="detail-value">{{ result.ticketTypeName || '-' }}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">核销时间</span>
        <span class="detail-value" :class="result.success ? 'success' : ''">
          {{ formatTime(result.fulfillment?.verifiedAt) }}
        </span>
      </div>
      <div class="detail-row" v-if="result.fulfillment?.verifiedByName">
        <span class="detail-label">操作人</span>
        <span class="detail-value">{{ result.fulfillment.verifiedByName }}</span>
      </div>
      <div class="detail-row" v-if="result.fulfillment?.verifyGateway">
        <span class="detail-label">核销闸口</span>
        <span class="detail-value">{{ result.fulfillment.verifyGateway }}</span>
      </div>
      <div class="detail-row" v-if="result.fulfillment?.verifyLocation">
        <span class="detail-label">位置信息</span>
        <span class="detail-value">{{ result.fulfillment.verifyLocation }}</span>
      </div>
      <div class="detail-row" v-if="result.fulfillment?.entryCount !== undefined">
        <span class="detail-label">入园人次</span>
        <span class="detail-value">{{ result.fulfillment.entryCount || 0 }}</span>
      </div>
    </div>

    <div v-if="!result?.success" class="error-list">
      <div v-for="(e, idx) in errorItems" :key="idx" class="error-item" :class="e.type">
        <el-icon class="icon"><component :is="e.type === 'warning' ? WarningFilled : CircleCloseFilled" /></el-icon>
        {{ e.msg }}
      </div>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { CircleCheckFilled, CircleCloseFilled, WarningFilled } from '@element-plus/icons-vue'
import { FulfillVerifyResultEnum, FulfillAbnormalTypeEnum } from '@/utils/enums'

const props = defineProps({
  visible: Boolean,
  result: Object
})
const emit = defineEmits(['update:modelValue'])

const formatTime = (t) => {
  if (!t) return '-'
  const d = new Date(t)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

const errorItems = computed(() => {
  const items = []
  const r = props.result
  if (!r) return items
  const rs = r.verifyResult
  switch (rs) {
    case 'INVALID_QR':
      items.push({ msg: '二维码格式异常：不符合票务编码规范', type: 'error' })
      break
    case 'FAKE_CODE':
      items.push({ msg: '虚假凭证：票据哈希校验失败，疑似伪造', type: 'error' })
      break
    case 'ORDER_INVALID':
      items.push({ msg: '订单状态无效：未支付/已取消', type: 'error' })
      break
    case 'NOT_YET_TIME':
      items.push({ msg: '未到核销时段：请在开场前 5 分钟内核销', type: 'warning' })
      break
    case 'TIMEOUT':
      items.push({ msg: '已超过核销时效：场次已结束', type: 'error' })
      break
    case 'DUPLICATE':
      items.push({ msg: '重复核销：该票务已核销，操作已记录异常', type: 'error' })
      break
    case 'USER_MISMATCH':
      items.push({ msg: '用户信息不匹配：身份证/手机号校验失败', type: 'error' })
      break
    case 'LOCATION_MISMATCH':
      items.push({ msg: '位置异常：距景点超过 3 公里', type: 'error' })
      break
    case 'REFUNDED':
      items.push({ msg: '订单已退票，票务失效', type: 'error' })
      break
    case 'EXPIRED':
      items.push({ msg: '票务已过期作废', type: 'error' })
      break
  }
  if (r.fulfillment?.abnormalReason) {
    items.push({ msg: '异常原因：' + r.fulfillment.abnormalReason, type: 'warning' })
  }
  if (items.length === 0 && !r.success) {
    items.push({ msg: r.message || '未知异常，请联系管理员', type: 'error' })
  }
  return items
})
</script>
