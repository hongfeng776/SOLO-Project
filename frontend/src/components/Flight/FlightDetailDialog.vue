<template>
  <el-dialog
    v-model="visible"
    class="flight-detail-dialog"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    @closed="$emit('closed')"
  >
    <template #header>
      <div v-if="flight" class="detail-header">
        <div class="flight-title">
          <el-tag :type="getFlightTypeInfo(flight.flightType).type" size="large" effect="dark">
            {{ getFlightTypeInfo(flight.flightType).label }}
          </el-tag>
          <span class="flight-no">{{ flight.flightNo }}</span>
          <el-tag size="large" :type="getOperationStatusInfo(flight.operationStatus).type">
            {{ getOperationStatusInfo(flight.operationStatus).label }}
            <span v-if="flight.operationStatus === 2 && flight.delayMinutes">
              (延误{{ flight.delayMinutes }}分钟)
            </span>
          </el-tag>
        </div>
        <div>
          <el-tag :type="flight.displayStatus === 1 ? 'success' : 'info'">
            {{ flight.displayStatus === 1 ? '已上架' : '已下架' }}
          </el-tag>
          <el-tag :type="flight.saleStatus === 1 ? 'success' : 'info'" style="margin-left: 8px">
            {{ flight.saleStatus === 1 ? '可售' : '不可售' }}
          </el-tag>
        </div>
      </div>
    </template>

    <div v-loading="loading" v-if="flight">
      <div class="route-display">
        <div class="route-point">
          <div class="airport-code">{{ flight.departureAirportCode }}</div>
          <div class="city-name">{{ flight.departure }}</div>
          <div class="airport-name">{{ flight.departureAirport }}</div>
          <div style="margin-top: 8px; font-weight: 600; color: #303133">
            {{ formatDateTime(flight.departureTime) }}
          </div>
        </div>
        <div class="route-line">
          <span class="duration-label">{{ formatDuration(flight.flightDuration) }}</span>
          <el-icon class="plane-icon"><Promotion /></el-icon>
        </div>
        <div class="route-point">
          <div class="airport-code">{{ flight.arrivalAirportCode }}</div>
          <div class="city-name">{{ flight.arrival }}</div>
          <div class="airport-name">{{ flight.arrivalAirport }}</div>
          <div style="margin-top: 8px; font-weight: 600; color: #303133">
            {{ formatDateTime(flight.arrivalTime) }}
          </div>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <div class="detail-section">
            <div class="section-title">航班信息</div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="item-label">航线编码：</span>
                <span class="item-value">{{ flight.routeCode || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">航空公司：</span>
                <span class="item-value">{{ flight.airline }} ({{ flight.airlineCode || '-' }})</span>
              </div>
              <div class="detail-item">
                <span class="item-label">机型：</span>
                <span class="item-value">{{ flight.aircraftType }} {{ flight.aircraftModel || '' }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">舱位等级：</span>
                <span class="item-value">{{ getCabinClassLabel(flight.cabinClass) }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">价格：</span>
                <span class="item-value" style="color: #ff4d4f; font-weight: 700">¥{{ flight.price }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">飞行里程：</span>
                <span class="item-value">{{ flight.flightDistance || 0 }} 公里</span>
              </div>
              <div class="detail-item">
                <span class="item-label">总座位数：</span>
                <span class="item-value">{{ flight.seatCount || 0 }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">剩余座位：</span>
                <span class="item-value" :class="flight.seats <= 10 ? 'low-stock' : ''">{{ flight.seats || 0 }}</span>
              </div>
            </div>
          </div>

          <div v-if="flight.flightType === 2" class="detail-section">
            <div class="section-title">国际航班信息</div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="item-label">出发国家：</span>
                <span class="item-value">{{ flight.departureCountry || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">到达国家：</span>
                <span class="item-value">{{ flight.arrivalCountry || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">是否需要签证：</span>
                <span class="item-value">{{ flight.visaRequired === 1 ? '是' : '否' }}</span>
              </div>
            </div>
          </div>

          <div v-if="flight.flightType === 3" class="detail-section">
            <div class="section-title">中转航班信息</div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="item-label">中转城市：</span>
                <span class="item-value">{{ flight.transferCity || '-' }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">中转机场：</span>
                <span class="item-value">{{ flight.transferAirport || '-' }} ({{ flight.transferAirportCode || '-' }})</span>
              </div>
              <div class="detail-item">
                <span class="item-label">中转时长：</span>
                <span class="item-value">{{ formatDuration(flight.transferDuration) }}</span>
              </div>
            </div>
          </div>

          <div v-if="flight.flightType === 4" class="detail-section">
            <div class="section-title">包机航班信息</div>
            <div class="detail-grid">
              <div class="detail-item">
                <span class="item-label">包机合同编号：</span>
                <span class="item-value">{{ flight.charterContractNo || '-' }}</span>
              </div>
            </div>
          </div>

          <div v-if="flight.cancelReason || flight.remark || flight.qualificationCode" class="detail-section">
            <div class="section-title">其他信息</div>
            <div class="detail-grid">
              <div class="detail-item" v-if="flight.cancelReason">
                <span class="item-label">取消原因：</span>
                <span class="item-value">{{ flight.cancelReason }}</span>
              </div>
              <div class="detail-item" v-if="flight.qualificationCode">
                <span class="item-label">运营资质：</span>
                <span class="item-value">{{ flight.qualificationCode }}</span>
              </div>
              <div class="detail-item" v-if="flight.qualificationValidUntil">
                <span class="item-label">资质有效期：</span>
                <span class="item-value">{{ formatDate(flight.qualificationValidUntil) }}</span>
              </div>
              <div class="detail-item" v-if="flight.remark">
                <span class="item-label">备注：</span>
                <span class="item-value">{{ flight.remark }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">创建时间：</span>
                <span class="item-value">{{ formatDateTime(flight.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="item-label">最后更新：</span>
                <span class="item-value">{{ formatDateTime(flight.updatedAt) }} ({{ flight.operatorName || '-' }})</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="操作记录" name="trace">
          <FlightTracePanel :flight-id="flight.id" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Promotion } from '@element-plus/icons-vue'
import { getFlight } from '@/api/flight'
import {
  FlightTypeEnum,
  FlightOperationStatusEnum,
  CabinClassEnum
} from '@/utils/enums'
import FlightTracePanel from './FlightTracePanel.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  flightId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'closed'])

const visible = ref(false)
const loading = ref(false)
const flight = ref(null)
const activeTab = ref('basic')

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.flightId) {
    fetchDetail()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const getFlightTypeInfo = (type) => {
  const key = Object.keys(FlightTypeEnum).find(k => FlightTypeEnum[k].value === type)
  return FlightTypeEnum[key] || { label: '未知', type: 'info', color: '#909399' }
}

const getOperationStatusInfo = (status) => {
  const key = Object.keys(FlightOperationStatusEnum).find(k => FlightOperationStatusEnum[k].value === status)
  return FlightOperationStatusEnum[key] || { label: '未知', type: 'info', color: '#909399' }
}

const getCabinClassLabel = (cls) => {
  const key = Object.keys(CabinClassEnum).find(k => CabinClassEnum[k].value === cls)
  return CabinClassEnum[key]?.label || cls || '-'
}

const formatDateTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN')
}

const formatDuration = (minutes) => {
  if (!minutes) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`
}

const fetchDetail = async () => {
  loading.value = true
  try {
    const res = await getFlight(props.flightId)
    flight.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.low-stock {
  color: #ff4d4f;
  font-weight: 700;
}
</style>
