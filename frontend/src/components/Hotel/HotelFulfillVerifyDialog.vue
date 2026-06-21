<template>
  <el-dialog
    v-model="visible"
    title="入住核验"
    width="680px"
    class="fulfill-verify-dialog"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="fulfillData" class="verify-content">
      <div class="section-title">核验项</div>
      <div class="verify-checks">
        <div v-for="item in checkItems" :key="item.key" class="check-item">
          <el-icon :class="item.valid ? 'icon-pass' : 'icon-fail'">
            <CircleCheckFilled v-if="item.valid" />
            <CircleCloseFilled v-else />
          </el-icon>
          <span>{{ item.label }}</span>
          <span :class="item.valid ? 'check-pass' : 'check-fail'">
            {{ item.valid ? '通过' : '未通过' }}
          </span>
        </div>
      </div>

      <div class="section-title">客人信息</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="姓名">
          <span :class="{ 'abnormal-cell': guestAbnormal.name }">{{ guestInfo.name || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="身份证号">
          <span :class="{ 'abnormal-cell': guestAbnormal.idCard }">{{ guestInfo.idCard || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          <span :class="{ 'abnormal-cell': guestAbnormal.phone }">{{ guestInfo.phone || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="入住人数">
          <span :class="{ 'abnormal-cell': guestAbnormal.guestCount }">{{ guestInfo.guestCount || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <div class="section-title">订单信息</div>
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="入住日期">
          <span :class="{ 'abnormal-cell': orderAbnormal.checkInDate }">{{ orderInfo.checkInDate || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="退房日期">
          <span :class="{ 'abnormal-cell': orderAbnormal.checkOutDate }">{{ orderInfo.checkOutDate || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="房型">
          <span :class="{ 'abnormal-cell': orderAbnormal.roomType }">{{ orderInfo.roomType || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="房号">
          <span :class="{ 'abnormal-cell': orderAbnormal.roomNumber }">{{ orderInfo.roomNumber || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="金额">
          <span :class="{ 'abnormal-cell': orderAbnormal.amount }">{{ orderInfo.amount != null ? `¥${orderInfo.amount}` : '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <el-alert
        v-if="verifyWarnings.length"
        title="核验警告"
        type="warning"
        show-icon
        :closable="false"
        class="verify-alert"
      >
        <ul class="warnings-list">
          <li v-for="(msg, i) in verifyWarnings" :key="i">{{ msg }}</li>
        </ul>
      </el-alert>

      <div class="section-title">核验备注</div>
      <el-input
        v-model="form.remark"
        type="textarea"
        :rows="3"
        placeholder="请输入核验备注信息"
      />

      <template v-if="showCheckout">
        <div class="section-title">退房操作</div>
        <el-checkbox v-model="form.earlyCheckout">提前退房</el-checkbox>
        <el-input
          v-model="form.checkoutReason"
          type="textarea"
          :rows="2"
          placeholder="请输入退房原因"
          style="margin-top: 8px"
        />
      </template>

      <template v-if="showExtend">
        <div class="section-title">续住操作</div>
        <el-input-number
          v-model="form.extendNights"
          :min="1"
          :max="30"
          controls-position="right"
          placeholder="续住晚数"
        />
        <el-input
          v-model="form.extendReason"
          type="textarea"
          :rows="2"
          placeholder="请输入续住原因"
          style="margin-top: 8px"
        />
      </template>
    </div>

    <div v-else class="empty-data">
      <el-empty description="暂无履约数据" />
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        v-if="showVerify"
        type="primary"
        class="verify-btn"
        :loading="submitting"
        @click="handleVerify"
      >
        核验通过
      </el-button>
      <el-button
        v-if="showCheckout"
        type="warning"
        :loading="submitting"
        @click="handleCheckout"
      >
        退房
      </el-button>
      <el-button
        v-if="showExtend"
        type="success"
        :loading="submitting"
        @click="handleExtend"
      >
        续住
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { HotelFulfillmentStatusEnum, HotelFulfillmentVerifyStatusEnum } from '@/utils/enums'
import { verifyHotelFulfillment, checkoutHotelFulfillment, extendHotelFulfillment } from '@/api/hotel'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  fulfillData: { type: Object, default: null }
})
const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const submitting = ref(false)
const verifyWarnings = ref([])

const form = reactive({
  remark: '',
  earlyCheckout: false,
  checkoutReason: '',
  extendNights: 1,
  extendReason: ''
})

const currentStatus = computed(() => props.fulfillData?.status || '')
const verifyStatus = computed(() => props.fulfillData?.verifyStatus || '')

const showVerify = computed(() =>
  verifyStatus.value !== HotelFulfillmentVerifyStatusEnum.verified?.value &&
  currentStatus.value !== HotelFulfillmentStatusEnum.checked_out?.value &&
  currentStatus.value !== HotelFulfillmentStatusEnum.cancelled?.value
)

const showCheckout = computed(() =>
  currentStatus.value === HotelFulfillmentStatusEnum.checked_in?.value
)

const showExtend = computed(() =>
  currentStatus.value === HotelFulfillmentStatusEnum.checked_in?.value
)

const checkItems = computed(() => {
  const d = props.fulfillData?.verifyResult || {}
  return [
    { key: 'idCardValid', label: '身份证核验', valid: !!d.idCardValid },
    { key: 'timelinessValid', label: '时效核验', valid: !!d.timelinessValid },
    { key: 'roomMatchValid', label: '房型匹配', valid: !!d.roomMatchValid },
    { key: 'orderStatusValid', label: '订单状态', valid: !!d.orderStatusValid }
  ]
})

const guestInfo = computed(() => ({
  name: props.fulfillData?.guestName || '',
  idCard: props.fulfillData?.idCard || '',
  phone: props.fulfillData?.phone || '',
  guestCount: props.fulfillData?.guestCount ?? ''
}))

const guestAbnormal = computed(() => props.fulfillData?.abnormalFields || {})

const orderInfo = computed(() => ({
  checkInDate: props.fulfillData?.checkInDate || '',
  checkOutDate: props.fulfillData?.checkOutDate || '',
  roomType: props.fulfillData?.roomType || '',
  roomNumber: props.fulfillData?.roomNumber || '',
  amount: props.fulfillData?.amount ?? null
}))

const orderAbnormal = computed(() => props.fulfillData?.abnormalFields || {})

const runVerify = async () => {
  if (!props.fulfillData?.id) return
  try {
    const res = await verifyHotelFulfillment(props.fulfillData.id, { dryRun: true })
    verifyWarnings.value = res?.data?.warnings || []
  } catch {
    verifyWarnings.value = []
  }
}

const handleSubmit = async (action, payload) => {
  if (submitting.value) return
  submitting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    const id = props.fulfillData.id
    if (action === 'verify') {
      await verifyHotelFulfillment(id, { ...payload, remark: form.remark })
      ElMessage.success('核验通过')
    } else if (action === 'checkout') {
      await checkoutHotelFulfillment(id, { ...payload, remark: form.remark })
      ElMessage.success('退房成功')
    } else if (action === 'extend') {
      await extendHotelFulfillment(id, { ...payload, remark: form.remark })
      ElMessage.success('续住成功')
    }
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleVerify = () => handleSubmit('verify', {})
const handleCheckout = () => {
  const data = { earlyCheckout: form.earlyCheckout }
  if (form.earlyCheckout && !form.checkoutReason.trim()) {
    ElMessage.warning('提前退房请填写原因')
    return
  }
  data.reason = form.checkoutReason
  handleSubmit('checkout', data)
}
const handleExtend = () => {
  if (!form.extendReason.trim()) {
    ElMessage.warning('请填写续住原因')
    return
  }
  handleSubmit('extend', { extendNights: form.extendNights, reason: form.extendReason })
}

const handleClose = () => { visible.value = false }

watch(visible, (v) => {
  if (v) {
    form.remark = ''
    form.earlyCheckout = false
    form.checkoutReason = ''
    form.extendNights = 1
    form.extendReason = ''
    verifyWarnings.value = []
    runVerify()
  }
})
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-fulfillment.scss';

.fulfill-verify-dialog {
  .verify-content {
    max-height: 60vh;
    overflow-y: auto;
  }

  .section-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin: 16px 0 10px;
    padding-left: 8px;
    border-left: 3px solid #1890ff;

    &:first-child {
      margin-top: 0;
    }
  }

  .verify-checks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 4px;

    .check-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 6px;
      background: #f5f7fa;
      font-size: 14px;

      .icon-pass {
        color: #52c41a;
        font-size: 18px;
      }

      .icon-fail {
        color: #ff4d4f;
        font-size: 18px;
      }

      .check-pass {
        margin-left: auto;
        color: #52c41a;
        font-size: 12px;
      }

      .check-fail {
        margin-left: auto;
        color: #ff4d4f;
        font-size: 12px;
      }
    }
  }

  .abnormal-cell {
    color: #ff4d4f;
    font-weight: 700;
  }

  .verify-alert {
    margin-top: 12px;

    .warnings-list {
      margin: 4px 0 0;
      padding-left: 18px;
      color: #d46b08;
      font-size: 13px;
      line-height: 1.8;
    }
  }

  .empty-data {
    padding: 40px 0;
  }

  .verify-btn {
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 4px 16px rgba(24, 144, 255, 0.45);
    }
  }
}
</style>
