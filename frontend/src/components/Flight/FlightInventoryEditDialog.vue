<template>
  <el-dialog
    v-model="visible"
    :title="title"
    width="720px"
    class="flight-inventory-edit-dialog"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <template #header>
      <div class="dialog-header">
        <el-icon color="#1890ff"><Box /></el-icon>
        <span class="title">{{ title }}</span>
        <div v-if="currentInventoryStatus" class="status-tag" :class="'status-' + currentInventoryStatus">
          <span class="status-dot"></span>
          {{ currentInventoryStatusLabel }}
        </div>
      </div>
    </template>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="110px"
      v-loading="loading"
    >
      <div class="inventory-type-tabs">
        <div
          v-for="(config, key) in FlightInventoryTypeEnum"
          :key="key"
          class="inventory-type-tab-item"
          :class="{ active: form.inventoryType === config.value, disabled: isEdit }"
          :style="{ '--inventory-color': config.color }"
          @click="handleInventoryTypeChange(config.value)"
        >
          <el-icon><component :is="config.icon" /></el-icon>
          <span>{{ config.label }}</span>
          <div class="stock-range">0 - {{ config.maxStock }}张</div>
        </div>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="航班" prop="flightId">
            <el-select
              v-model="form.flightId"
              filterable
              placeholder="请选择航班"
              style="width: 100%"
              :disabled="isEdit"
              @change="handleFlightChange"
            >
              <el-option
                v-for="flight in flightList"
                :key="flight.id"
                :label="`${flight.flightNo} - ${flight.departureAirportCode} → ${flight.arrivalAirportCode}`"
                :value="flight.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="舱位类型" prop="cabinClass">
            <el-select
              v-model="form.cabinClass"
              placeholder="请选择舱位"
              style="width: 100%"
              :disabled="isEdit"
              @change="handleCabinChange"
            >
              <el-option
                v-for="(cabin, key) in CabinClassEnum"
                :key="key"
                :label="cabin.label"
                :value="cabin.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div v-if="selectedFlight" class="flight-info-card fade-in">
        <div class="flight-route">
          <el-icon color="#1890ff"><Airplane /></el-icon>
          <span class="flight-no">{{ selectedFlight.flightNo }}</span>
          <div class="route-detail">
            <span class="airport">{{ selectedFlight.departureAirportCode }}</span>
            <el-icon><Right /></el-icon>
            <span class="airport">{{ selectedFlight.arrivalAirportCode }}</span>
          </div>
        </div>
        <div class="flight-time">
          <el-icon color="#909399"><Clock /></el-icon>
          <span>{{ formatDate(selectedFlight.departureTime) }} - {{ formatDate(selectedFlight.arrivalTime) }}</span>
        </div>
      </div>

      <el-divider content-position="left">库存配置</el-divider>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="总库存" prop="totalStock">
            <div class="stock-input-wrapper">
              <el-input
                v-model="form.totalStock"
                type="number"
                placeholder="请输入总库存数量"
                class="stock-input"
                :class="{ 'input-error': fieldErrors.totalStock, 'input-success': fieldStatus.totalStock }"
                @focus="handleInputFocus($event, 'totalStock')"
                @blur="handleInputBlur($event, 'totalStock')"
                @input="handleStockInput('totalStock')"
              />
              <span class="input-unit">张</span>
              <span v-if="fieldStatus.totalStock" class="validate-success-icon">
                <el-icon color="#52c41a"><CircleCheck /></el-icon>
              </span>
            </div>
            <div v-if="fieldErrors.totalStock" class="error-message">{{ fieldErrors.totalStock }}</div>
            <div class="field-hint">范围: 0 - {{ currentTypeConfig.maxStock }}张</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="已售库存">
            <div class="stock-display">
              <span class="sold-value">{{ form.soldStock || 0 }}</span>
              <span class="stock-unit">张</span>
              <el-tag size="small" type="info" style="margin-left: 8px">
                占比 {{ soldRatio }}%
              </el-tag>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="预留库存" prop="reservedStock">
            <div class="stock-input-wrapper">
              <el-input
                v-model.number="form.reservedStock"
                type="number"
                :min="0"
                placeholder="请输入预留库存数量"
                class="stock-input"
                :class="{ 'input-error': fieldErrors.reservedStock }"
                @focus="handleInputFocus($event, 'reservedStock')"
                @blur="handleInputBlur($event, 'reservedStock')"
                @input="handleStockInput('reservedStock')"
              />
              <span class="input-unit">张</span>
            </div>
            <div v-if="fieldErrors.reservedStock" class="error-message">{{ fieldErrors.reservedStock }}</div>
            <div class="field-hint">预留比例不超过总库存50%</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="锁定库存" prop="lockedStock">
            <div class="stock-input-wrapper">
              <el-input
                v-model.number="form.lockedStock"
                type="number"
                :min="0"
                placeholder="请输入锁定库存数量"
                class="stock-input"
                :class="{ 'input-error': fieldErrors.lockedStock }"
                @input="handleStockInput('lockedStock')"
              />
              <span class="input-unit">张</span>
            </div>
            <div v-if="fieldErrors.lockedStock" class="error-message">{{ fieldErrors.lockedStock }}</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="库存预警值" prop="minStockWarning">
            <el-input-number
              v-model="form.minStockWarning"
              :min="0"
              :max="100"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="可售库存">
            <div class="available-stock-display" :class="availableStockStatusClass">
              <span class="available-value">{{ availableStock }}</span>
              <span class="stock-unit">张</span>
              <el-tag
                v-if="availableStockStatus !== 'normal'"
                :type="availableStockStatus === 'warning' ? 'warning' : 'danger'"
                size="small"
                style="margin-left: 8px"
                effect="dark"
              >
                {{ availableStockStatus === 'warning' ? '库存预警' : '已售罄' }}
              </el-tag>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <div v-if="form.inventoryType === 'reserved'" class="reserved-section">
        <el-divider content-position="left">预留库存设置</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="到期时间" prop="reserveExpireTime">
              <el-date-picker
                v-model="form.reserveExpireTime"
                type="datetime"
                placeholder="选择预留到期时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="自动释放">
              <el-switch v-model="form.isAutoRelease" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-form-item label="备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入备注信息"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '保存修改' : '创建库存' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  Airplane,
  Clock,
  Right,
  CircleCheck
} from '@element-plus/icons-vue'
import {
  createFlightInventory,
  updateFlightInventory,
  getFlightInventory,
  validateFlightInventoryField,
  getFlightList
} from '@/api/flight'
import {
  CabinClassEnum,
  FlightInventoryTypeEnum,
  FlightInventoryStatusEnum
} from '@/utils/enums'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  editId: {
    type: [Number, String],
    default: null
  },
  defaultFlightId: {
    type: [Number, String],
    default: null
  },
  defaultCabinClass: {
    type: String,
    default: 'economy'
  },
  defaultInventoryType: {
    type: String,
    default: 'fixed'
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const submitting = ref(false)
const formRef = ref(null)
const flightList = ref([])
const selectedFlight = ref(null)

const form = reactive({
  flightId: null,
  cabinClass: 'economy',
  inventoryType: 'fixed',
  totalStock: 100,
  soldStock: 0,
  reservedStock: 0,
  lockedStock: 0,
  minStockWarning: 10,
  reserveExpireTime: '',
  isAutoRelease: 1,
  remark: ''
})

const fieldErrors = reactive({
  totalStock: '',
  reservedStock: '',
  lockedStock: ''
})

const fieldStatus = reactive({
  totalStock: false,
  reservedStock: false,
  lockedStock: false
})

const isEdit = computed(() => !!props.editId)

const title = computed(() => {
  return isEdit.value ? '编辑库存' : '新增库存'
})

const currentTypeConfig = computed(() => {
  const key = Object.keys(FlightInventoryTypeEnum).find(
    k => FlightInventoryTypeEnum[k].value === form.inventoryType
  )
  return FlightInventoryTypeEnum[key] || FlightInventoryTypeEnum.FIXED
})

const availableStock = computed(() => {
  const total = parseInt(form.totalStock || 0)
  const sold = parseInt(form.soldStock || 0)
  const reserved = parseInt(form.reservedStock || 0)
  const locked = parseInt(form.lockedStock || 0)
  return Math.max(0, total - sold - reserved - locked)
})

const soldRatio = computed(() => {
  const total = parseInt(form.totalStock || 0)
  const sold = parseInt(form.soldStock || 0)
  if (total === 0) return 0
  return ((sold / total) * 100).toFixed(1)
})

const availableStockStatus = computed(() => {
  const available = availableStock.value
  const warning = parseInt(form.minStockWarning || 10)
  if (available <= 0) return 'soldOut'
  if (available <= warning) return 'warning'
  return 'normal'
})

const availableStockStatusClass = computed(() => {
  return `status-${availableStockStatus.value}`
})

const currentInventoryStatus = computed(() => {
  const status = availableStockStatus.value
  if (status === 'soldOut') return 3
  if (status === 'warning') return 2
  return 1
})

const currentInventoryStatusLabel = computed(() => {
  const status = currentInventoryStatus.value
  const key = Object.keys(FlightInventoryStatusEnum).find(
    k => FlightInventoryStatusEnum[k].value === status
  )
  return FlightInventoryStatusEnum[key]?.label || '正常'
})

const rules = {
  flightId: [{ required: true, message: '请选择航班', trigger: 'change' }],
  cabinClass: [{ required: true, message: '请选择舱位类型', trigger: 'change' }],
  totalStock: [
    { required: true, message: '请输入总库存数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '总库存不能为负数', trigger: 'blur' }
  ]
}

const loadFlights = async () => {
  try {
    const res = await getFlightList({ pageSize: 100 })
    flightList.value = res.data?.list || []
  } catch (e) {
    console.error(e)
  }
}

const loadInventoryData = async () => {
  if (!props.editId) return
  loading.value = true
  try {
    const inventory = await getFlightInventory(props.editId)
    if (inventory) {
      Object.assign(form, {
        flightId: inventory.flightId,
        cabinClass: inventory.cabinClass,
        inventoryType: inventory.inventoryType,
        totalStock: inventory.totalStock,
        soldStock: inventory.soldStock,
        reservedStock: inventory.reservedStock,
        lockedStock: inventory.lockedStock,
        minStockWarning: inventory.minStockWarning,
        reserveExpireTime: inventory.reserveExpireTime,
        isAutoRelease: inventory.isAutoRelease,
        remark: inventory.remark
      })
      if (inventory.flight) {
        selectedFlight.value = inventory.flight
      }
    }
  } catch (e) {
    ElMessage.error(e.message || '加载库存数据失败')
  } finally {
    loading.value = false
  }
}

const handleFlightChange = async (flightId) => {
  const flight = flightList.value.find(f => f.id === flightId)
  selectedFlight.value = flight || null
}

const handleCabinChange = () => {
  validateTotalStock()
}

const handleInventoryTypeChange = (type) => {
  if (isEdit.value) return
  form.inventoryType = type
  const config = currentTypeConfig.value
  if (!form.totalStock || form.totalStock > config.maxStock) {
    form.totalStock = config.defaultTotal
  }
}

const handleInputFocus = (e, field) => {
  fieldErrors[field] = ''
}

const handleInputBlur = (e, field) => {
  validateField(field)
}

const handleStockInput = (field) => {
  fieldErrors[field] = ''
  fieldStatus[field] = false
  if (field === 'totalStock') {
    validateTotalStock()
  }
}

const validateField = async (field) => {
  try {
    const res = await validateFlightInventoryField(field, form[field], {
      cabinClass: form.cabinClass,
      inventoryType: form.inventoryType,
      totalStock: form.totalStock
    })
    if (!res.valid) {
      fieldErrors[field] = res.errors?.[0] || '输入无效'
      fieldStatus[field] = false
      return false
    } else {
      fieldStatus[field] = true
      fieldErrors[field] = ''
      return true
    }
  } catch (e) {
    return true
  }
}

const validateTotalStock = async () => {
  if (!form.totalStock) return
  try {
    const res = await validateFlightInventoryField('totalStock', form.totalStock, {
      cabinClass: form.cabinClass,
      inventoryType: form.inventoryType
    })
    if (!res.valid) {
      fieldErrors.totalStock = res.errors?.[0] || '总库存无效'
      fieldStatus.totalStock = false
    } else {
      fieldStatus.totalStock = true
      fieldErrors.totalStock = ''
    }
  } catch (e) {
    // ignore
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateFlightInventory(props.editId, form)
      ElMessage.success('库存更新成功')
    } else {
      await createFlightInventory(form)
      ElMessage.success('库存创建成功')
    }
    emit('success')
    visible.value = false
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const handleClosed = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    flightId: props.defaultFlightId,
    cabinClass: props.defaultCabinClass,
    inventoryType: props.defaultInventoryType,
    totalStock: 100,
    soldStock: 0,
    reservedStock: 0,
    lockedStock: 0,
    minStockWarning: 10,
    reserveExpireTime: '',
    isAutoRelease: 1,
    remark: ''
  })
  Object.keys(fieldErrors).forEach(k => fieldErrors[k] = '')
  Object.keys(fieldStatus).forEach(k => fieldStatus[k] = false)
  selectedFlight.value = null
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    if (flightList.value.length === 0) {
      await loadFlights()
    }
    if (props.defaultFlightId) {
      form.flightId = props.defaultFlightId
      await handleFlightChange(props.defaultFlightId)
    }
    if (isEdit.value) {
      await loadInventoryData()
    }
    nextTick(() => {
      if (formRef.value) {
        formRef.value.clearValidate()
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.flight-inventory-edit-dialog {
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;

    .title {
      flex: 1;
    }

    .status-tag {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      &.status-1 {
        background-color: rgba(82, 196, 26, 0.15);
        color: #52c41a;

        .status-dot {
          background-color: #52c41a;
          box-shadow: 0 0 8px #52c41a;
          animation: statusGlowGreen 2s ease-in-out infinite;
        }
      }

      &.status-2 {
        background-color: rgba(250, 173, 20, 0.15);
        color: #faad14;

        .status-dot {
          background-color: #faad14;
          box-shadow: 0 0 8px #faad14;
          animation: statusGlowYellow 1.5s ease-in-out infinite;
        }
      }

      &.status-3 {
        background-color: rgba(255, 77, 79, 0.15);
        color: #ff4d4f;

        .status-dot {
          background-color: #ff4d4f;
          box-shadow: 0 0 8px #ff4d4f;
          animation: statusGlowRed 1s ease-in-out infinite;
        }
      }
    }
  }

  @keyframes statusGlowGreen {
    0%, 100% { box-shadow: 0 0 4px #52c41a; }
    50% { box-shadow: 0 0 12px #52c41a; }
  }

  @keyframes statusGlowYellow {
    0%, 100% { box-shadow: 0 0 4px #faad14; }
    50% { box-shadow: 0 0 12px #faad14; }
  }

  @keyframes statusGlowRed {
    0%, 100% { box-shadow: 0 0 4px #ff4d4f; }
    50% { box-shadow: 0 0 12px #ff4d4f; }
  }
}
</style>
