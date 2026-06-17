<template>
  <el-dialog
    v-model="dialogVisible"
    :title="'状态管理 - ' + (orderInfo?.orderNo || '')"
    width="650px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-loading="loading" class="order-status-manager">
      <div v-if="orderInfo" class="status-overview">
        <el-descriptions :column="2" border size="small" class="mb-20">
          <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ orderInfo.amount }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="getPayStatusType(orderInfo.payStatus)" size="small">
              {{ getPayStatusLabel(orderInfo.payStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="履约状态">
            <el-tag :type="getFulfillStatusType(orderInfo.fulfillStatus)" size="small">
              {{ getFulfillStatusLabel(orderInfo.fulfillStatus) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="current-status-section">
          <div class="status-label">当前订单状态：</div>
          <el-tag
            :key="statusAnimationKey"
            class="status-tag status-transition"
            :style="{ background: currentStatusColor, borderColor: currentStatusColor }"
            effect="dark"
            size="large"
          >
            {{ currentStatusLabel }}
          </el-tag>
        </div>

        <el-alert
          v-if="statusTip"
          :type="statusTip.type"
          :title="statusTip.title"
          show-icon
          class="mb-20"
        />
      </div>

      <el-divider content-position="left">状态调整</el-divider>

      <el-form label-width="100px" class="mb-20">
        <el-form-item label="目标状态">
          <el-select
            v-model="targetStatus"
            class="input-glow-focus w-full"
            placeholder="请选择目标状态"
            @change="validateStatusChange"
          >
            <el-option
              v-for="item in availableStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="变更备注" v-if="targetStatus">
          <el-input
            v-model="statusRemark"
            type="textarea"
            :rows="3"
            class="input-glow-focus"
            placeholder="请输入状态变更备注（必填）"
          />
        </el-form-item>

        <el-form-item v-if="targetStatus">
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!statusRemark"
            @click="handleStatusChange"
          >确认变更</el-button>
          <el-button
            v-if="canReset"
            type="warning"
            :loading="resetting"
            @click="handleResetStatus"
          >重置状态</el-button>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">操作日志</el-divider>

      <div class="operation-logs">
        <el-timeline>
          <el-timeline-item
            v-for="(log, idx) in operationLogs"
            :key="idx"
            :timestamp="log.time"
            placement="top"
            :type="log.type"
          >
            <div class="log-item">
              <div class="log-header">
                <span class="log-action">{{ log.action }}</span>
                <span class="log-operator">{{ log.operatorName }} ({{ log.role }})</span>
              </div>
              <div v-if="log.remark" class="log-remark">{{ log.remark }}</div>
              <div v-if="log.changedFields && log.changedFields.length > 0" class="log-fields">
                <span class="field-label">变更字段：</span>
                <span v-for="(field, fIdx) in log.changedFields" :key="fIdx" class="field-tag">
                  {{ field }}
                </span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOrder,
  updateOrderStatus,
  resetOrderStatus
} from '@/api/order'
import {
  OrderStatusEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions,
  getEnumColor
} from '@/utils/enums'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  orderId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const userStore = useUserStore()

const loading = ref(false)
const submitting = ref(false)
const resetting = ref(false)
const orderInfo = ref(null)
const targetStatus = ref(null)
const statusRemark = ref('')
const statusAnimationKey = ref(0)
const operationLogs = ref([])

const PayStatusEnum = {
  UNPAID: { value: 0, label: '未支付', type: 'warning' },
  PAID: { value: 1, label: '已支付', type: 'success' },
  REFUNDING: { value: 2, label: '退款中', type: 'warning' },
  REFUNDED: { value: 3, label: '已退款', type: 'danger' }
}

const FulfillStatusEnum = {
  UNFULFILLED: { value: 0, label: '未履约', type: 'warning' },
  FULFILLING: { value: 1, label: '履约中', type: 'primary' },
  FULFILLED: { value: 2, label: '已履约', type: 'success' },
  CANCELLED: { value: 3, label: '已取消', type: 'info' }
}

const getPayStatusLabel = (value) => {
  const item = Object.values(PayStatusEnum).find(i => i.value === value)
  return item ? item.label : '未知'
}

const getPayStatusType = (value) => {
  const item = Object.values(PayStatusEnum).find(i => i.value === value)
  return item ? item.type : 'info'
}

const getFulfillStatusLabel = (value) => {
  const item = Object.values(FulfillStatusEnum).find(i => i.value === value)
  return item ? item.label : '未知'
}

const getFulfillStatusType = (value) => {
  const item = Object.values(FulfillStatusEnum).find(i => i.value === value)
  return item ? item.type : 'info'
}

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const currentStatusLabel = computed(() => {
  return orderInfo.value ? getEnumLabel(OrderStatusEnum, orderInfo.value.status) : ''
})

const currentStatusColor = computed(() => {
  return orderInfo.value ? getEnumColor(OrderStatusEnum, orderInfo.value.status) : '#909399'
})

const canReset = computed(() => {
  if (!orderInfo.value) return false
  return orderInfo.value.fulfillStatus === FulfillStatusEnum.UNFULFILLED.value
})

const availableStatusOptions = computed(() => {
  if (!orderInfo.value) return []
  const currentStatus = orderInfo.value.status
  const allOptions = getEnumOptions(OrderStatusEnum)
  const allowedTransitions = getAllowedTransitions(currentStatus)
  return allOptions.filter(opt => allowedTransitions.includes(opt.value))
})

const statusTip = computed(() => {
  if (!orderInfo.value) return null
  const { status, payStatus, fulfillStatus } = orderInfo.value

  if (status === OrderStatusEnum.PENDING_PAYMENT.value && payStatus === PayStatusEnum.UNPAID.value) {
    return { type: 'warning', title: '订单待支付，用户可在支付后自动更新状态' }
  }
  if (status === OrderStatusEnum.PAID.value && fulfillStatus === FulfillStatusEnum.UNFULFILLED.value) {
    return { type: 'info', title: '订单已支付，等待商家履约' }
  }
  if (status === OrderStatusEnum.REFUNDING.value) {
    return { type: 'warning', title: '退款处理中，请耐心等待' }
  }
  return null
})

const getAllowedTransitions = (currentStatus) => {
  const transitions = {
    [OrderStatusEnum.PENDING_PAYMENT.value]: [
      OrderStatusEnum.PAID.value,
      OrderStatusEnum.CANCELLED.value
    ],
    [OrderStatusEnum.PAID.value]: [
      OrderStatusEnum.COMPLETED.value,
      OrderStatusEnum.REFUNDING.value,
      OrderStatusEnum.CANCELLED.value
    ],
    [OrderStatusEnum.REFUNDING.value]: [
      OrderStatusEnum.REFUNDED.value,
      OrderStatusEnum.PAID.value
    ],
    [OrderStatusEnum.COMPLETED.value]: [],
    [OrderStatusEnum.CANCELLED.value]: [],
    [OrderStatusEnum.REFUNDED.value]: []
  }
  return transitions[currentStatus] || []
}

const validateStatusChange = async (newStatus) => {
  if (!orderInfo.value) return
  try {
    const res = await updateOrderStatus(props.orderId, {
      status: newStatus,
      validateOnly: true
    })
    if (!res.valid) {
      ElMessage.warning(res.message || '状态变更不合法')
      targetStatus.value = null
    }
  } catch (err) {
    ElMessage.error(err.message || '状态校验失败')
    targetStatus.value = null
  }
}

const handleStatusChange = async () => {
  if (!targetStatus.value || !statusRemark.value.trim()) {
    ElMessage.warning('请选择目标状态并填写变更备注')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认将订单状态变更为「${getEnumLabel(OrderStatusEnum, targetStatus.value)}」吗？`,
      '确认状态变更',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    await updateOrderStatus(props.orderId, {
      status: targetStatus.value,
      remark: statusRemark.value,
      operator: userStore.username
    })
    ElMessage.success('状态变更成功')
    statusAnimationKey.value++
    await loadOrderDetail()
    targetStatus.value = null
    statusRemark.value = ''
    emit('success')
  } catch (err) {
    ElMessage.error(err.message || '状态变更失败')
  } finally {
    submitting.value = false
  }
}

const handleResetStatus = async () => {
  try {
    await ElMessageBox.confirm(
      '确认重置订单状态吗？重置后将恢复为初始待支付状态。',
      '确认重置',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  resetting.value = true
  try {
    await resetOrderStatus(props.orderId)
    ElMessage.success('状态重置成功')
    statusAnimationKey.value++
    await loadOrderDetail()
    emit('success')
  } catch (err) {
    ElMessage.error(err.message || '状态重置失败')
  } finally {
    resetting.value = false
  }
}

const loadOrderDetail = async () => {
  if (!props.orderId) return
  loading.value = true
  try {
    const data = await getOrder(props.orderId)
    orderInfo.value = data
    operationLogs.value = generateMockLogs(data)
  } catch (err) {
    ElMessage.error(err.message || '获取订单详情失败')
  } finally {
    loading.value = false
  }
}

const generateMockLogs = (order) => {
  const logs = [
    {
      time: order.createTime,
      action: '创建订单',
      operatorName: order.buyer || '用户',
      role: '用户',
      type: 'primary',
      remark: '用户下单创建订单',
      changedFields: ['订单状态', '支付状态']
    }
  ]

  if (order.status >= OrderStatusEnum.PAID.value) {
    logs.push({
      time: '2024-01-15 14:35:00',
      action: '支付成功',
      operatorName: '系统',
      role: '系统',
      type: 'success',
      remark: `支付金额 ¥${order.amount}`,
      changedFields: ['支付状态', '订单状态']
    })
  }

  if (order.status === OrderStatusEnum.COMPLETED.value) {
    logs.push({
      time: '2024-01-16 10:00:00',
      action: '确认完成',
      operatorName: '管理员',
      role: '运营人员',
      type: 'success',
      remark: '用户确认服务完成',
      changedFields: ['履约状态', '订单状态']
    })
  }

  if (order.status === OrderStatusEnum.REFUNDING.value || order.status === OrderStatusEnum.REFUNDED.value) {
    logs.push({
      time: '2024-01-15 18:00:00',
      action: '申请退款',
      operatorName: order.buyer || '用户',
      role: '用户',
      type: 'warning',
      remark: '行程变更申请退款',
      changedFields: ['订单状态']
    })
  }

  if (order.status === OrderStatusEnum.REFUNDED.value) {
    logs.push({
      time: '2024-01-16 09:00:00',
      action: '退款完成',
      operatorName: '财务人员',
      role: '财务',
      type: 'danger',
      remark: `退款金额 ¥${order.amount}`,
      changedFields: ['支付状态', '订单状态']
    })
  }

  if (order.status === OrderStatusEnum.CANCELLED.value) {
    logs.push({
      time: '2024-01-15 16:00:00',
      action: '取消订单',
      operatorName: order.buyer || '用户',
      role: '用户',
      type: 'info',
      remark: '用户主动取消订单',
      changedFields: ['订单状态', '履约状态']
    })
  }

  return logs.reverse()
}

const handleClose = () => {
  dialogVisible.value = false
  orderInfo.value = null
  targetStatus.value = null
  statusRemark.value = ''
  operationLogs.value = []
}

watch(() => props.modelValue, (val) => {
  if (val && props.orderId) {
    loadOrderDetail()
  }
})
</script>

<style lang="scss" scoped>
.order-status-manager {
  .status-overview {
    .current-status-section {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 20px;

      .status-label {
        font-size: 14px;
        color: #606266;
        font-weight: 500;
      }

      .status-tag {
        font-size: 16px;
        padding: 8px 20px;
        height: auto;
      }
    }
  }

  .operation-logs {
    max-height: 400px;
    overflow-y: auto;
    padding-right: 10px;

    .log-item {
      .log-header {
        display: flex;
        align-items: center;
        gap: 12px;

        .log-action {
          font-weight: 600;
          color: #303133;
        }

        .log-operator {
          font-size: 12px;
          color: #909399;
        }
      }

      .log-remark {
        margin-top: 4px;
        font-size: 13px;
        color: #606266;
        padding: 6px 10px;
        background: #f5f7fa;
        border-radius: 4px;
      }

      .log-fields {
        margin-top: 8px;
        font-size: 12px;

        .field-label {
          color: #909399;
          margin-right: 8px;
        }

        .field-tag {
          display: inline-block;
          padding: 2px 8px;
          background: #ecf5ff;
          color: #409eff;
          border-radius: 4px;
          margin-right: 6px;
        }
      }
    }
  }
}
</style>
