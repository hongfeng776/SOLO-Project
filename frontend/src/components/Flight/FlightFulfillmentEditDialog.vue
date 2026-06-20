<template>
  <el-dialog
    v-model="visible"
    title="机票订单履约处理"
    width="900px"
    class="flight-fulfillment-edit-dialog"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <el-icon :color="currentStageColor"><Tickets /></el-icon>
        <span>机票订单履约处理</span>
        <el-tag
          size="small"
          :type="getFulfillmentStatusTagType(fulfillmentData?.fulfillmentStatus)"
          effect="light"
        >
          {{ getFulfillmentStatusLabel(fulfillmentData?.fulfillmentStatus) }}
        </el-tag>
      </div>
    </template>

    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>

    <div v-else class="fulfillment-content">
      <div class="stage-switcher">
        <div
          v-for="(stage, key) in stageList"
          :key="key"
          class="stage-card"
          :class="{
            active: activeStage === stage.value,
            disabled: !isStageAccessible(stage.value)
          }"
          :style="{ '--stage-color': stage.color }"
          @click="handleStageChange(stage.value)"
        >
          <div class="stage-icon">
            <el-icon><component :is="stage.icon" /></el-icon>
          </div>
          <div class="stage-label">{{ stage.label }}</div>
          <div class="stage-desc">{{ stage.desc }}</div>
        </div>
      </div>

      <div class="order-summary">
        <div class="summary-title">
          <el-icon><Document /></el-icon>
          订单信息
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">订单编号：</span>
            <span class="value order-no">{{ fulfillmentData?.orderNo || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">航班号：</span>
            <span class="value flight-no">{{ fulfillmentData?.flightNo || '-' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">订单金额：</span>
            <span class="value amount">¥{{ fulfillmentData?.order?.amount || '0.00' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">乘机人数：</span>
            <span class="value">{{ fulfillmentData?.passengerCount || 0 }} 人</span>
          </div>
          <div class="summary-item">
            <span class="label">订单状态：</span>
            <el-tag size="small">
              {{ getOrderStatusLabel(fulfillmentData?.order?.status) }}
            </el-tag>
          </div>
          <div class="summary-item">
            <span class="label">履约分类：</span>
            <el-tag
              size="small"
              :style="{ background: getFulfillmentCategoryColor(fulfillmentData?.fulfillmentCategory) + '20', color: getFulfillmentCategoryColor(fulfillmentData?.fulfillmentCategory) }"
            >
              {{ getFulfillmentCategoryLabel(fulfillmentData?.fulfillmentCategory) }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="validation-alert" v-if="validationErrors.length > 0">
        <el-alert
          type="error"
          :closable="false"
          show-icon
          title="存在以下校验问题，请处理后再推进履约"
        >
          <template #default>
            <ul class="error-list">
              <li v-for="(err, idx) in validationErrors" :key="idx">
                <el-icon><WarningFilled /></el-icon>
                <span class="error-highlight">{{ err }}</span>
              </li>
            </ul>
          </template>
        </el-alert>
      </div>

      <div class="passenger-section" v-if="activeStage === 'pending_ticket'">
        <div class="section-title">
          <el-icon><User /></el-icon>
          乘机人信息
          <el-tag size="small" type="info">需逐一核验</el-tag>
        </div>
        <div class="passenger-table-wrapper">
          <el-table :data="passengerList" class="passenger-table" border stripe>
            <el-table-column label="姓名" width="120">
              <template #default="{ row }">
                <span :class="{ 'error-highlight': !row.name }">{{ row.name || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="证件号" width="220">
              <template #default="{ row }">
                <span :class="{ 'error-highlight': !row.idCard }">{{ row.idCard || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="证件有效期" width="160">
              <template #default="{ row }">
                <el-tag
                  v-if="row.idExpireStatus === 0"
                  size="small"
                  type="danger"
                  effect="dark"
                  class="glow-tag"
                >
                  已过期
                </el-tag>
                <el-tag
                  v-else-if="row.idExpireStatus === 2"
                  size="small"
                  type="warning"
                  effect="dark"
                  class="glow-tag warning"
                >
                  即将过期
                </el-tag>
                <el-tag v-else size="small" type="success">有效</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="联系电话" width="150">
              <template #default="{ row }">
                {{ row.phone || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="舱位" width="100">
              <template #default="{ row }">
                {{ getCabinLabel(row.cabinClass) || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="票号">
              <template #default="{ row }">
                <span class="ticket-number">{{ row.ticketNo || '-' }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <div class="ticket-section" v-if="activeStage === 'pending_ticket'">
        <div class="section-title">
          <el-icon><Tickets /></el-icon>
          出票信息录入
        </div>
        <el-form :model="ticketForm" label-width="120px" class="ticket-form">
          <el-form-item label="PNR编码">
            <el-input v-model="ticketForm.pnrCode" placeholder="请输入6位PNR编码" maxlength="6" style="width: 200px" />
            <span style="margin-left: 8px; color: #909399; font-size: 12px">订座记录编号</span>
          </el-form-item>
          <el-form-item label="票价金额">
            <el-input-number v-model="ticketForm.fareAmount" :precision="2" :min="0" />
            <span style="margin-left: 8px">元</span>
          </el-form-item>
          <el-form-item label="燃油附加费">
            <el-input-number v-model="ticketForm.fuelSurcharge" :precision="2" :min="0" />
            <span style="margin-left: 8px">元</span>
          </el-form-item>
          <el-form-item label="机场建设费">
            <el-input-number v-model="ticketForm.airportTax" :precision="2" :min="0" />
            <span style="margin-left: 8px">元</span>
          </el-form-item>
          <el-form-item label="税费合计">
            <el-input-number v-model="ticketForm.taxAmount" :precision="2" :min="0" />
            <span style="margin-left: 8px">元</span>
          </el-form-item>
        </el-form>
      </div>

      <div class="flight-change-section" v-if="activeStage === 'flight_changed'">
        <div class="section-title">
          <el-icon><WarningFilled /></el-icon>
          航班变动处理
        </div>
        <el-form :model="flightChangeForm" label-width="120px">
          <el-form-item label="变动类型" required>
            <el-select v-model="flightChangeForm.changeType" placeholder="请选择变动类型" style="width: 200px">
              <el-option
                v-for="(item, key) in FlightChangeTypeEnum"
                :key="key"
                :label="item.label"
                :value="item.value"
              >
                <span :style="{ color: item.color }">●</span>
                <span style="margin-left: 6px">{{ item.label }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="变动原因" required>
            <el-input
              v-model="flightChangeForm.reason"
              type="textarea"
              :rows="2"
              placeholder="请输入航班变动原因"
              maxlength="500"
              show-word-limit
              style="width: 400px"
            />
          </el-form-item>
          <el-form-item label="处理方案" required>
            <el-radio-group v-model="flightChangeForm.handlePlan">
              <el-radio
                v-for="(item, key) in FlightChangeHandlePlanEnum"
                :key="key"
                :label="item.value"
              >
                <span :style="{ color: item.color }">{{ item.label }}</span>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="改签航班" v-if="flightChangeForm.handlePlan === 'rebook'">
            <el-input v-model="flightChangeForm.rebookFlightNo" placeholder="请输入改签后的航班号" style="width: 200px" />
          </el-form-item>
        </el-form>
      </div>

      <div class="terminate-section" v-if="activeStage === 'terminated'">
        <div class="section-title">
          <el-icon><Close /></el-icon>
          行程终止
        </div>
        <el-form :model="terminateForm" label-width="120px">
          <el-form-item label="终止原因" required>
            <el-input
              v-model="terminateForm.reason"
              type="textarea"
              :rows="3"
              placeholder="请输入行程终止原因"
              maxlength="500"
              show-word-limit
              style="width: 400px"
            />
          </el-form-item>
        </el-form>
      </div>

      <div class="ticketed-section" v-if="activeStage === 'ticketed'">
        <div class="section-title">
          <el-icon><Check /></el-icon>
          已出票信息
        </div>
        <div class="ticketed-info">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="出票时间">
              {{ formatDateTime(fulfillmentData?.ticketIssuedTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="PNR编码">
              <span class="ticket-number">{{ fulfillmentData?.pnrCode || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="票价金额">
              ¥{{ fulfillmentData?.fareAmount || '0.00' }}
            </el-descriptions-item>
            <el-descriptions-item label="税费合计">
              ¥{{ fulfillmentData?.taxAmount || '0.00' }}
            </el-descriptions-item>
            <el-descriptions-item label="凭证状态">
              <el-tag :type="getVoucherStatusTagType(fulfillmentData?.ticketVoucherStatus)">
                {{ getVoucherStatusLabel(fulfillmentData?.ticketVoucherStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="出票完成">
              <el-icon color="#52c41a"><CircleCheckFilled /></el-icon>
              <span style="margin-left: 4px; color: #52c41a">已完成</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <div class="remark-section" v-if="activeStage === 'pending_ticket'">
        <div class="section-title">
          <el-icon><Edit /></el-icon>
          审核备注
        </div>
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入审核备注（可选）"
          maxlength="500"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <div class="action-buttons">
          <template v-if="activeStage === 'pending_ticket'">
            <el-button
              type="danger"
              class="audit-btn"
              :disabled="submitting"
              @click="handleReject"
            >
              <el-icon><Close /></el-icon>
              审核拒绝
            </el-button>
            <el-button
              type="warning"
              class="audit-btn"
              :disabled="submitting || !canTerminate"
              @click="handleTerminate"
            >
              <el-icon><Close /></el-icon>
              终止行程
            </el-button>
            <el-button
              type="primary"
              class="audit-btn shadow-btn"
              :disabled="submitting || !canPassAudit"
              :loading="submitting"
              @click="handleIssueTicket"
            >
              <el-icon><Check /></el-icon>
              确认出票
            </el-button>
          </template>
          <template v-if="activeStage === 'flight_changed'">
            <el-button
              type="primary"
              class="audit-btn shadow-btn"
              :disabled="submitting || !canHandleFlightChange"
              :loading="submitting"
              @click="handleSubmitFlightChange"
            >
              <el-icon><Check /></el-icon>
              提交处理方案
            </el-button>
          </template>
          <template v-if="activeStage === 'terminated'">
            <el-button
              type="danger"
              class="audit-btn shadow-btn"
              :disabled="submitting || !terminateForm.reason"
              :loading="submitting"
              @click="handleSubmitTerminate"
            >
              <el-icon><Check /></el-icon>
              确认终止
            </el-button>
          </template>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Tickets,
  Loading,
  Document,
  User,
  WarningFilled,
  Check,
  Close,
  Edit,
  CircleCheckFilled,
  Clock,
  Finished
} from '@element-plus/icons-vue'
import {
  OrderStatusEnum,
  CabinClassEnum,
  FulfillmentStageEnum,
  FulfillmentStatusEnum,
  FulfillmentCategoryEnum,
  FulfillmentAbnormalTypeEnum,
  FlightChangeTypeEnum,
  FlightChangeHandlePlanEnum,
  TicketVoucherStatusEnum,
  IdValidStatusEnum
} from '@/utils/enums'
import {
  getFlightFulfillment,
  auditFlightFulfillment,
  issueFlightFulfillmentTicket,
  handleFlightFulfillmentChange,
  terminateFlightFulfillment
} from '@/api/flight'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  fulfillmentId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const submitting = ref(false)
const activeStage = ref('pending_ticket')
const validationErrors = ref([])
const fulfillmentData = ref(null)
const passengerList = ref([])

const form = reactive({
  remark: ''
})

const ticketForm = reactive({
  pnrCode: '',
  fareAmount: 0,
  taxAmount: 0,
  fuelSurcharge: 0,
  airportTax: 0
})

const flightChangeForm = reactive({
  changeType: '',
  reason: '',
  handlePlan: '',
  rebookFlightNo: ''
})

const terminateForm = reactive({
  reason: ''
})

const stageList = computed(() => {
  return Object.values(FulfillmentStageEnum)
})

const currentStageColor = computed(() => {
  const stage = Object.values(FulfillmentStageEnum).find(s => s.value === activeStage.value)
  return stage?.color || '#1890ff'
})

const canPassAudit = computed(() => {
  if (validationErrors.value.length > 0) return false
  if (activeStage.value !== 'pending_ticket') return false
  return true
})

const canTerminate = computed(() => {
  return activeStage.value === 'pending_ticket' || activeStage.value === 'flight_changed'
})

const canHandleFlightChange = computed(() => {
  return flightChangeForm.changeType && flightChangeForm.reason && flightChangeForm.handlePlan
})

function isStageAccessible(stageValue) {
  const order = ['pending_ticket', 'ticketed', 'flight_changed', 'terminated']
  const currentIdx = order.indexOf(fulfillmentData.value?.fulfillmentStage || 'pending_ticket')
  const targetIdx = order.indexOf(stageValue)
  return targetIdx <= currentIdx || stageValue === fulfillmentData.value?.fulfillmentStage
}

function handleStageChange(stageValue) {
  if (!isStageAccessible(stageValue)) {
    ElMessage.warning('此阶段暂不可访问')
    return
  }
  activeStage.value = stageValue
}

function getFulfillmentStatusTagType(status) {
  const key = Object.keys(FulfillmentStatusEnum).find(k => FulfillmentStatusEnum[k].value === status)
  return FulfillmentStatusEnum[key]?.type || 'info'
}

function getFulfillmentStatusLabel(status) {
  const key = Object.keys(FulfillmentStatusEnum).find(k => FulfillmentStatusEnum[k].value === status)
  return FulfillmentStatusEnum[key]?.label || '-'
}

function getFulfillmentCategoryColor(cat) {
  const key = Object.keys(FulfillmentCategoryEnum).find(k => FulfillmentCategoryEnum[k].value === cat)
  return FulfillmentCategoryEnum[key]?.color || '#1890ff'
}

function getFulfillmentCategoryLabel(cat) {
  const key = Object.keys(FulfillmentCategoryEnum).find(k => FulfillmentCategoryEnum[k].value === cat)
  return FulfillmentCategoryEnum[key]?.label || cat
}

function getCabinLabel(cabin) {
  const key = Object.keys(CabinClassEnum).find(k => CabinClassEnum[k].value === cabin)
  return CabinClassEnum[key]?.label || cabin
}

function getOrderStatusLabel(status) {
  const key = Object.keys(OrderStatusEnum).find(k => OrderStatusEnum[k].value === status)
  return OrderStatusEnum[key]?.label || status
}

function getVoucherStatusTagType(status) {
  const key = Object.keys(TicketVoucherStatusEnum).find(k => TicketVoucherStatusEnum[k].value === status)
  return TicketVoucherStatusEnum[key]?.type || 'info'
}

function getVoucherStatusLabel(status) {
  const key = Object.keys(TicketVoucherStatusEnum).find(k => TicketVoucherStatusEnum[k].value === status)
  return TicketVoucherStatusEnum[key]?.label || '-'
}

function formatDateTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function validatePassengers() {
  const errors = []
  for (const p of passengerList.value) {
    if (!p.name) errors.push(`乘机人${p.name || ''}姓名缺失`)
    if (!p.idCard) errors.push(`乘机人${p.name || ''}证件号缺失`)
    if (p.idExpireStatus === 0) errors.push(`乘机人${p.name}证件已过期`)
    if (p.idExpireStatus === 2) errors.push(`乘机人${p.name}证件即将在30天内过期`)
  }
  return errors
}

async function loadFulfillmentData() {
  if (!props.fulfillmentId) return
  loading.value = true
  validationErrors.value = []
  try {
    const res = await getFlightFulfillment(props.fulfillmentId)
    fulfillmentData.value = res.data || res
    activeStage.value = fulfillmentData.value?.fulfillmentStage || 'pending_ticket'

    const passengers = fulfillmentData.value?.passengerInfo
    try {
      const parsed = typeof passengers === 'string' ? JSON.parse(passengers) : passengers
      passengerList.value = parsed || []
    } catch {
      passengerList.value = []
    }

    if (activeStage.value === 'pending_ticket') {
      validationErrors.value = validatePassengers()
    }

    ticketForm.pnrCode = fulfillmentData.value?.pnrCode || ''
    ticketForm.fareAmount = parseFloat(fulfillmentData.value?.fareAmount || 0)
    ticketForm.taxAmount = parseFloat(fulfillmentData.value?.taxAmount || 0)
    ticketForm.fuelSurcharge = parseFloat(fulfillmentData.value?.fuelSurcharge || 0)
    ticketForm.airportTax = parseFloat(fulfillmentData.value?.airportTax || 0)
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function handleIssueTicket() {
  try {
    await ElMessageBox.confirm('确认出票信息无误，完成此订单的出票操作吗？', '确认出票', { type: 'warning' })
  } catch {
    return
  }
  submitting.value = true
  try {
    const ticketNumbers = passengerList.value
      .filter(p => p.ticketNo)
      .map(p => ({ ticketNo: p.ticketNo, passengerName: p.name, cabinClass: p.cabinClass }))

    const ticketParams = {
      ticketNumbers,
      pnrCode: ticketForm.pnrCode,
      fareAmount: ticketForm.fareAmount,
      taxAmount: ticketForm.taxAmount,
      fuelSurcharge: ticketForm.fuelSurcharge,
      airportTax: ticketForm.airportTax
    }

    await issueFlightFulfillmentTicket(props.fulfillmentId, ticketParams)
    ElMessage.success('出票成功')
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '出票失败')
  } finally {
    submitting.value = false
  }
}

async function handleReject() {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入审核拒绝原因',
      '审核拒绝',
      { confirmButtonText: '确认拒绝', cancelButtonText: '取消', inputPlaceholder: '请输入拒绝原因' }
    )
    submitting.value = true
    await auditFlightFulfillment(props.fulfillmentId, 'reject', value)
    ElMessage.success('审核已拒绝')
    emit('success')
    visible.value = false
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleTerminate() {
  try {
    const { value } = await ElMessageBox.prompt(
      '请输入行程终止原因',
      '终止行程',
      { confirmButtonText: '确认终止', cancelButtonText: '取消', inputPlaceholder: '请输入终止原因', type: 'warning' }
    )
    submitting.value = true
    await terminateFlightFulfillment(props.fulfillmentId, value)
    ElMessage.success('行程已终止')
    emit('success')
    visible.value = false
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleSubmitFlightChange() {
  submitting.value = true
  try {
    await handleFlightFulfillmentChange(props.fulfillmentId, {
      changeType: flightChangeForm.changeType,
      reason: flightChangeForm.reason,
      handlePlan: flightChangeForm.handlePlan,
      rebookFlightNo: flightChangeForm.rebookFlightNo
    })
    ElMessage.success('航班变动处理方案已提交')
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

async function handleSubmitTerminate() {
  try {
    await ElMessageBox.confirm('确认终止此订单的履约流程吗？此操作不可撤销。', '确认终止', { type: 'error' })
  } catch {
    return
  }
  submitting.value = true
  try {
    await terminateFlightFulfillment(props.fulfillmentId, terminateForm.reason)
    ElMessage.success('行程已终止')
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  visible.value = false
}

watch(() => props.modelValue, (val) => {
  if (val && props.fulfillmentId) {
    loadFulfillmentData()
  }
})
</script>
