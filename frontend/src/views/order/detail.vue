<template>
  <div class="order-detail">
    <el-page-header @back="goBack" content="订单详情">
      <template #extra>
        <transition name="fade" mode="out-in">
          <div :key="orderInfo.status" class="action-buttons">
            <template v-for="btn in actionButtons" :key="btn.key">
              <el-button :type="btn.type" @click="btn.handler">
                <el-icon v-if="btn.icon"><component :is="btn.icon" /></el-icon>
                {{ btn.label }}
              </el-button>
            </template>
          </div>
        </transition>
      </template>
    </el-page-header>

    <el-row :gutter="20" class="content">
      <el-col :span="16">
        <el-card class="info-card" :class="{ 'is-editing': isEditing }">
          <template #header>
            <span class="card-title">订单信息</span>
            <div v-if="isEditing" class="edit-actions">
              <el-button type="primary" size="small" :loading="editSubmitting" @click="handleEditSave">
                保存
              </el-button>
              <el-button size="small" @click="handleEditCancel">取消</el-button>
            </div>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ orderInfo.orderNo }}</el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <StatusTag
                :status="orderInfo.status"
                :status-map="OrderStatusMap"
                :color-map="OrderStatusColorMap"
              />
            </el-descriptions-item>
            <el-descriptions-item label="运力类型">
              <StatusTag
                :status="orderInfo.capacityType"
                :status-map="CapacityTypeMap"
                :color-map="CapacityTypeColorMap"
              />
            </el-descriptions-item>
            <el-descriptions-item label="距离">
              <template v-if="isEditing">
                <el-input-number
                  v-model="editForm.distance"
                  :min="0"
                  :precision="1"
                  :step="0.5"
                  style="width: 100%"
                  @change="handleDistanceChange"
                  @focus="handleFieldFocus('distance')"
                  @blur="handleFieldBlur"
                />
              </template>
              <template v-else>
                {{ orderInfo.distance }} 公里
              </template>
            </el-descriptions-item>
            <el-descriptions-item label="预估时长">
              <template v-if="isEditing">
                <el-input-number
                  v-model="editForm.duration"
                  :min="0"
                  :precision="0"
                  :step="5"
                  style="width: 100%"
                  @focus="handleFieldFocus('duration')"
                  @blur="handleFieldBlur"
                />
              </template>
              <template v-else>
                {{ orderInfo.duration }} 分钟
              </template>
            </el-descriptions-item>
            <el-descriptions-item
              label="预估金额"
              :class="{ 'price-highlight': priceHighlighted }"
            >
              <span class="estimated-price">¥{{ editForm.estimatedPrice || orderInfo.estimatedPrice }}</span>
              <div v-if="isEditing && priceValidateResult" class="price-validate-tip" :class="priceValidateResult.isValid ? 'success' : 'error'">
                <el-icon v-if="priceValidateResult.isValid"><CircleCheck /></el-icon>
                <el-icon v-else><Warning /></el-icon>
                <span>{{ priceValidateResult.isValid ? '费用匹配正常' : `预估费用偏差超过${priceValidateResult.threshold}%，建议核对里程` }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="实际金额">
              <span class="actual-price">¥{{ orderInfo.actualPrice || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDate(orderInfo.createTime) }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <span class="card-title">行程信息</span>
          </template>
          <div class="route-info">
            <div class="route-item">
              <div class="point start">
                <span class="dot"></span>
                <template v-if="isEditing">
                  <el-input
                    v-model="editForm.startAddress"
                    type="textarea"
                    :rows="2"
                    class="edit-address"
                    @focus="handleFieldFocus('startAddress')"
                    @blur="handleFieldBlur"
                  />
                </template>
                <span v-else class="address">{{ orderInfo.startAddress }}</span>
              </div>
            </div>
            <div class="route-line">
              <span class="line"></span>
              <span class="distance">{{ orderInfo.distance }} km</span>
              <span class="line"></span>
            </div>
            <div class="route-item">
              <div class="point end">
                <span class="dot"></span>
                <template v-if="isEditing">
                  <el-input
                    v-model="editForm.endAddress"
                    type="textarea"
                    :rows="2"
                    class="edit-address"
                    @focus="handleFieldFocus('endAddress')"
                    @blur="handleFieldBlur"
                  />
                </template>
                <span v-else class="address">{{ orderInfo.endAddress }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card" ref="timelineCardRef">
          <template #header>
            <span class="card-title">时间轴</span>
          </template>
          <el-timeline>
            <el-timeline-item :timestamp="formatDate(orderInfo.createTime)" placement="top">
              订单创建
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.acceptTime" :timestamp="formatDate(orderInfo.acceptTime)" placement="top">
              司机接单
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.pickupTime" :timestamp="formatDate(orderInfo.pickupTime)" placement="top">
              开始行程
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.completeTime" :timestamp="formatDate(orderInfo.completeTime)" placement="top">
              行程结束
            </el-timeline-item>
            <el-timeline-item v-if="orderInfo.cancelTime" :timestamp="formatDate(orderInfo.cancelTime)" placement="top" type="danger">
              订单取消
              <div v-if="orderInfo.cancelReason" class="cancel-reason">
                取消原因：{{ orderInfo.cancelReason }}
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <el-card class="info-card log-card" ref="logCardRef" :class="{ 'highlight': logHighlighted }">
          <template #header>
            <span class="card-title">订单日志</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="log in statusLogs"
              :key="log.id"
              :timestamp="formatDate(log.createTime)"
              placement="top"
            >
              <div class="log-item">
                <div class="log-status">
                  <StatusTag
                    v-if="log.oldStatus !== null"
                    :status="log.oldStatus"
                    :status-map="OrderStatusMap"
                    :color-map="OrderStatusColorMap"
                  />
                  <el-icon v-if="log.oldStatus !== null" class="arrow"><ArrowRight /></el-icon>
                  <StatusTag
                    :status="log.newStatus"
                    :status-map="OrderStatusMap"
                    :color-map="OrderStatusColorMap"
                  />
                </div>
                <div class="log-info">
                  <span>操作人：{{ log.operatorName || '系统' }}</span>
                  <span v-if="log.operatorType">
                    ({{ log.operatorType === 1 ? '乘客' : log.operatorType === 2 ? '司机' : '系统' }})
                  </span>
                </div>
                <div v-if="log.changeReason" class="log-reason">
                  变更原因：{{ log.changeReason }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-if="statusLogs.length === 0" description="暂无状态变更日志" :image-size="80" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="info-card">
          <template #header>
            <span class="card-title">乘客信息</span>
          </template>
          <div class="user-info">
            <el-avatar :size="60" :src="orderInfo.passengerAvatar">
              {{ orderInfo.passengerName?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ orderInfo.passengerName }}</div>
              <div class="phone">{{ formatPhone(orderInfo.passengerPhone) }}</div>
            </div>
          </div>
        </el-card>

        <el-card class="info-card">
          <template #header>
            <span class="card-title">司机信息</span>
          </template>
          <div v-if="orderInfo.driverName" class="user-info">
            <el-avatar :size="60" :src="orderInfo.driverAvatar">
              {{ orderInfo.driverName?.charAt(0) }}
            </el-avatar>
            <div class="info">
              <div class="name">{{ orderInfo.driverName }}</div>
              <div class="phone">{{ formatPhone(orderInfo.driverPhone) }}</div>
              <div class="vehicle" v-if="orderInfo.vehiclePlate">
                {{ orderInfo.vehiclePlate }}
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无司机" :image-size="80" />
        </el-card>
      </el-col>
    </el-row>

    <TraceDialog v-model="traceDialogVisible" :order-no="orderInfo.orderNo" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  Connection,
  Close,
  Edit,
  Search,
  Warning,
  CircleCheck,
  ArrowRight,
  Money,
  Refresh,
  Document,
  Wallet,
  View
} from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag/index.vue'
import TraceDialog from '@/components/TraceDialog/index.vue'
import { OrderStatusMap, OrderStatusColorMap, OrderStatus } from '@/enums/order'
import { CapacityTypeMap, CapacityTypeColorMap } from '@/enums/capacity'
import { formatDate, formatPhone } from '@/utils/format'
import {
  getOrderDetailApi,
  getEditConditionsApi,
  validatePriceApi,
  updateOrderBaseInfoApi,
  getOrderStatusLogsApi,
  cancelOrderApi,
  completeOrderApi
} from '@/api/order'
import type { Order, PriceValidateResult, StatusLogItem } from '@/types/order'

const route = useRoute()
const router = useRouter()

const orderInfo = reactive<Order>({
  id: 0,
  orderNo: '',
  passengerId: 0,
  passengerName: '',
  passengerPhone: '',
  passengerAvatar: '',
  driverId: null,
  driverName: null,
  driverPhone: null,
  driverAvatar: null,
  vehicleId: null,
  vehiclePlate: null,
  capacityType: 1,
  startAddress: '',
  startLng: 0,
  startLat: 0,
  endAddress: '',
  endLng: 0,
  endLat: 0,
  distance: 0,
  duration: 0,
  estimatedPrice: 0,
  actualPrice: null,
  status: 1,
  payStatus: 0,
  orderSource: 1,
  createTime: '',
  acceptTime: null,
  pickupTime: null,
  completeTime: null,
  cancelTime: null,
  cancelReason: null,
  availableActions: []
})

const statusLogs = ref<StatusLogItem[]>([])
const traceDialogVisible = ref(false)
const isEditing = ref(false)
const editSubmitting = ref(false)
const priceValidateResult = ref<PriceValidateResult | null>(null)
const priceHighlighted = ref(false)
const logHighlighted = ref(false)
const logCardRef = ref()
const timelineCardRef = ref()

const editForm = reactive({
  startAddress: '',
  endAddress: '',
  distance: 0,
  duration: 0,
  estimatedPrice: 0
})

const editRules: FormRules = {
  startAddress: [{ required: true, message: '请输入起点地址', trigger: 'blur' }],
  endAddress: [{ required: true, message: '请输入终点地址', trigger: 'blur' }],
  distance: [{ required: true, message: '请输入里程', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入预计时长', trigger: 'blur' }]
}

const actionButtons = computed(() => {
  const status = orderInfo.status
  const buttons: Array<{ key: string; label: string; type: string; icon?: any; handler: () => void }> = []

  switch (status) {
    case OrderStatus.PENDING:
      buttons.push(
        { key: 'dispatch', label: '派单', type: 'primary', icon: Connection, handler: handleDispatch },
        { key: 'cancel', label: '取消订单', type: 'danger', icon: Close, handler: handleCancel },
        { key: 'edit', label: '编辑订单', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.DISPATCHED:
      buttons.push(
        { key: 'pickup', label: '确认接驾', type: 'success', handler: handlePickup },
        { key: 'reassign', label: '改派司机', type: 'primary', handler: handleReassign },
        { key: 'cancel', label: '取消', type: 'danger', icon: Close, handler: handleCancel },
        { key: 'edit', label: '编辑', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.PICKING_UP:
      buttons.push(
        { key: 'start', label: '开始行程', type: 'success', handler: handleStartTrip },
        { key: 'cancel', label: '取消', type: 'danger', icon: Close, handler: handleCancel },
        { key: 'edit', label: '编辑', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.IN_PROGRESS:
      buttons.push(
        { key: 'complete', label: '完成订单', type: 'success', handler: handleComplete },
        { key: 'edit', label: '编辑', type: 'primary', icon: Edit, handler: handleEdit },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
      break
    case OrderStatus.COMPLETED:
      buttons.push(
        { key: 'settle', label: '财务对账', type: 'primary', icon: Money, handler: handleSettle },
        { key: 'resettle', label: '重新结算', type: 'warning', icon: Refresh, handler: handleResettle },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace },
        { key: 'log', label: '查看日志', type: 'primary', icon: Document, handler: handleViewLog }
      )
      break
    case OrderStatus.CANCELLED:
      buttons.push(
        { key: 'refund', label: '申请退款', type: 'warning', icon: Wallet, handler: handleRefund },
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace },
        { key: 'log', label: '查看日志', type: 'primary', icon: Document, handler: handleViewLog }
      )
      break
    case OrderStatus.EXPIRED:
      buttons.push(
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace },
        { key: 'log', label: '查看日志', type: 'primary', icon: Document, handler: handleViewLog }
      )
      break
    default:
      buttons.push(
        { key: 'trace', label: '溯源', type: 'info', icon: Search, handler: handleTrace }
      )
  }

  return buttons
})

const goBack = () => {
  router.back()
}

const handleDispatch = () => {
  ElMessage.info('派单功能开发中')
}

const handleCancel = () => {
  ElMessageBox.prompt('请输入取消原因', '取消订单', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    inputType: 'textarea'
  }).then(async ({ value }) => {
    try {
      await cancelOrderApi(orderInfo.id, value)
      ElMessage.success('订单已取消')
      loadDetail()
      loadStatusLogs()
    } catch (error: any) {
      ElMessage.error(error.message || '取消失败')
    }
  }).catch(() => {})
}

const handlePickup = () => {
  ElMessage.info('确认接驾功能开发中')
}

const handleReassign = () => {
  ElMessage.info('改派司机功能开发中')
}

const handleStartTrip = () => {
  ElMessage.info('开始行程功能开发中')
}

const handleComplete = async () => {
  try {
    await completeOrderApi(orderInfo.id)
    ElMessage.success('订单已完成')
    loadDetail()
    loadStatusLogs()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleSettle = () => {
  ElMessage.info('财务对账功能开发中')
}

const handleResettle = () => {
  ElMessage.info('重新结算功能开发中')
}

const handleRefund = () => {
  ElMessage.info('申请退款功能开发中')
}

const handleTrace = () => {
  traceDialogVisible.value = true
}

const handleViewLog = async () => {
  if (logCardRef.value) {
    logCardRef.value.$el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    logHighlighted.value = true
    setTimeout(() => {
      logHighlighted.value = false
    }, 2000)
  }
}

const handleEdit = async () => {
  try {
    const res = await getEditConditionsApi(orderInfo.id)
    if (!res.data.canEdit) {
      ElMessageBox.alert(
        `该订单不可编辑，原因：\n${res.data.reasons.join('\n')}`,
        '提示',
        { type: 'warning' }
      )
      return
    }
    editForm.startAddress = orderInfo.startAddress
    editForm.endAddress = orderInfo.endAddress
    editForm.distance = orderInfo.distance
    editForm.duration = orderInfo.duration
    editForm.estimatedPrice = orderInfo.estimatedPrice
    priceValidateResult.value = null
    isEditing.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取编辑条件失败')
  }
}

const handleEditCancel = () => {
  isEditing.value = false
  priceValidateResult.value = null
  priceHighlighted.value = false
}

const handleFieldFocus = (field: string) => {
  if (field === 'distance' || field === 'duration') {
    priceHighlighted.value = true
  }
}

const handleFieldBlur = () => {
  priceHighlighted.value = false
}

const handleDistanceChange = async () => {
  try {
    const res = await validatePriceApi({
      distance: editForm.distance,
      capacityType: orderInfo.capacityType,
      estimatedPrice: editForm.estimatedPrice
    })
    priceValidateResult.value = res.data
  } catch (error) {
    console.error('价格校验失败', error)
  }
}

const handleEditSave = async () => {
  if (!editForm.startAddress || !editForm.endAddress || !editForm.distance || !editForm.duration) {
    ElMessage.warning('请填写完整的编辑信息')
    return
  }

  editSubmitting.value = true
  try {
    const res = await getEditConditionsApi(orderInfo.id)
    if (!res.data.canEdit) {
      ElMessageBox.alert(
        `该订单不可编辑，原因：\n${res.data.reasons.join('\n')}`,
        '提示',
        { type: 'warning' }
      )
      return
    }

    await updateOrderBaseInfoApi(orderInfo.id, {
      startAddress: editForm.startAddress,
      endAddress: editForm.endAddress,
      distance: editForm.distance,
      duration: editForm.duration
    })
    ElMessage.success('编辑成功')
    isEditing.value = false
    loadDetail()
    loadStatusLogs()
  } catch (error: any) {
    ElMessage.error(error.message || '编辑失败')
  } finally {
    editSubmitting.value = false
  }
}

const loadDetail = async () => {
  const id = route.params.id as string
  if (id) {
    try {
      const res = await getOrderDetailApi(Number(id))
      Object.assign(orderInfo, res.data)
    } catch (e: any) {
      ElMessage.error(e.message || '获取订单详情失败')
    }
  }
}

const loadStatusLogs = async () => {
  const id = route.params.id as string
  if (id) {
    try {
      const res = await getOrderStatusLogsApi(Number(id), { page: 1, pageSize: 50 })
      statusLogs.value = res.data.list || []
    } catch (e: any) {
      console.error('获取状态日志失败', e)
    }
  }
}

onMounted(() => {
  loadDetail()
  loadStatusLogs()
})
</script>

<style lang="scss" scoped>
.order-detail {
  .content {
    margin-top: 20px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .info-card {
    margin-bottom: 20px;
    transition: box-shadow 0.3s ease;

    .card-title {
      font-weight: 600;
      font-size: 15px;
    }

    &.is-editing {
      :deep(.el-descriptions__body) {
        .el-descriptions-item__content {
          padding: 8px 10px;
        }
      }
    }

    &.highlight {
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
      animation: pulse 1.5s ease-in-out;
    }
  }

  @keyframes pulse {
    0%, 100% {
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.3);
    }
    50% {
      box-shadow: 0 0 0 6px rgba(64, 158, 255, 0.1);
    }
  }

  .edit-actions {
    float: right;
  }

  .actual-price {
    color: #f56c6c;
    font-weight: bold;
    font-size: 16px;
  }

  .estimated-price {
    color: #f56c6c;
    font-size: 18px;
    font-weight: bold;
  }

  .price-highlight {
    :deep(.el-descriptions-item__content) {
      transition: all 0.3s ease;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.5);
      border-radius: 4px;
      padding: 4px 8px;
      background: rgba(64, 158, 255, 0.05);
    }
  }

  .price-validate-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    margin-top: 4px;

    &.success {
      color: #67c23a;
    }

    &.error {
      color: #f56c6c;
    }
  }

  .route-info {
    padding: 20px 0;

    .route-item {
      .point {
        display: flex;
        align-items: flex-start;
        gap: 10px;

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #67c23a;
          margin-top: 4px;
          flex-shrink: 0;

          &.end {
            background: #f56c6c;
          }
        }

        .address {
          font-size: 14px;
          color: #303133;
          flex: 1;
        }

        .edit-address {
          flex: 1;
        }
      }
    }

    .route-line {
      display: flex;
      align-items: center;
      padding: 10px 0 10px 5px;

      .line {
        flex: 1;
        height: 1px;
        background: #dcdfe6;
      }

      .distance {
        padding: 0 10px;
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .cancel-reason {
    font-size: 12px;
    color: #909399;
    margin-top: 5px;
  }

  .log-item {
    .log-status {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;

      .arrow {
        color: #909399;
        font-size: 12px;
      }
    }

    .log-info {
      font-size: 13px;
      color: #606266;
      margin-bottom: 4px;
    }

    .log-reason {
      font-size: 12px;
      color: #909399;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 10px 0;

    .info {
      .name {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }

      .phone {
        font-size: 13px;
        color: #909399;
        margin-top: 5px;
      }

      .vehicle {
        font-size: 13px;
        color: #409eff;
        margin-top: 5px;
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

.fade-leave-active {
  position: absolute;
}
</style>
