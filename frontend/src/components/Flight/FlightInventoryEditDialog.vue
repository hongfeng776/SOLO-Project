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
        <el-icon :color="currentTypeConfig.color"><component :is="currentTypeConfig.icon" /></el-icon>
        <span class="title">{{ title }}</span>
        <div v-if="editId" class="inventory-status-tag" :class="inventoryStatusClass">
          <span class="status-dot"></span>
          {{ inventoryStatusLabel }}
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
      <div class="type-branch-switcher">
        <div
          v-for="(config, key) in InventoryTypeEnum"
          :key="key"
          class="branch-btn"
          :class="{ active: form.inventoryType === config.value, disabled: isEdit }"
          :style="{ '--type-color': config.color }"
          @click="handleTypeChange(config.value)"
        >
          <div class="branch-icon">
            <el-icon><component :is="config.icon" /></el-icon>
          </div>
          <div class="branch-label">{{ config.label }}</div>
          <div class="branch-desc">{{ config.desc }}</div>
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
          <el-form-item label="舱位" prop="cabinClass">
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
          <el-form-item label="总库存数" prop="totalStock">
            <div class="inventory-input-wrapper">
              <el-input-number
                v-model="form.totalStock"
                :min="0"
                :max="currentTypeConfig.maxStock"
                :step="10"
                :controls="true"
                style="width: 100%"
                class="inventory-input"
                :class="{ 'input-error': fieldErrors.totalStock, 'input-success': fieldStatus.totalStock }"
                @focus="handleInputFocus($event, 'totalStock')"
                @blur="handleInputBlur($event, 'totalStock')"
                @change="handleStockInput('totalStock')"
              />
              <span
                v-if="fieldStatus.totalStock"
                class="validate-success-icon"
              >
                <el-icon color="#52c41a"><CircleCheck /></el-icon>
              </span>
            </div>
            <div v-if="fieldErrors.totalStock" class="error-message">{{ fieldErrors.totalStock }}</div>
            <div class="field-hint">范围: 0 - {{ currentTypeConfig.maxStock }} 张</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="可用库存">
            <div class="available-stock-display" :class="availableStockClass">
              <el-icon><component :is="availableStockIcon" /></el-icon>
              <span class="stock-value">{{ availableStock }}</span>
              <span class="stock-unit">张</span>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="已占用" prop="occupiedStock">
            <el-input-number
              v-model="form.occupiedStock"
              :min="0"
              :max="form.totalStock || 0"
              :step="1"
              :disabled="!isEdit"
              style="width: 100%"
              @change="handleStockInput('occupiedStock')"
            />
            <div class="field-desc">已下单未支付</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="已售出" prop="soldStock">
            <el-input-number
              v-model="form.soldStock"
              :min="0"
              :max="form.totalStock || 0"
              :step="1"
              :disabled="!isEdit"
              style="width: 100%"
              @change="handleStockInput('soldStock')"
            />
            <div class="field-desc">已支付已出票</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="已锁定" prop="lockedStock">
            <el-input-number
              v-model="form.lockedStock"
              :min="0"
              :max="form.totalStock || 0"
              :step="1"
              :disabled="!isEdit"
              style="width: 100%"
              @change="handleStockInput('lockedStock')"
            />
            <div class="field-desc">锁定不可售</div>
          </el-form-item>
        </el-col>
      </el-row>

      <div v-if="form.inventoryType === 'reserved'" class="reserved-section">
        <el-divider content-position="left">预留配置</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="预留库存" prop="reservedStock">
              <div class="inventory-input-wrapper">
                <el-input-number
                  v-model="form.reservedStock"
                  :min="0"
                  :max="maxReservedStock"
                  :step="5"
                  style="width: 100%"
                  class="inventory-input"
                  :class="{ 'input-error': fieldErrors.reservedStock }"
                  @change="handleStockInput('reservedStock')"
                />
              </div>
              <div v-if="fieldErrors.reservedStock" class="error-message">{{ fieldErrors.reservedStock }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预留比例" prop="reserveRatio">
              <el-input-number
                v-model="form.reserveRatio"
                :min="0"
                :max="100"
                :step="5"
                :precision="2"
                style="width: 100%"
                @change="handleReserveRatioChange"
              />
              <span class="field-unit">%</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="到期时间" prop="reserveExpireTime">
              <el-date-picker
                v-model="form.reserveExpireTime"
                type="datetime"
                placeholder="请选择预留库存到期时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
              <div class="field-desc">到期后自动释放预留库存</div>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <div v-if="form.inventoryType === 'supplement'" class="supplement-section">
        <el-divider content-position="left">补录信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="补录来源" prop="supplementSource">
              <el-input
                v-model="form.supplementSource"
                placeholder="请输入补录来源"
                maxlength="100"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="补录备注" prop="supplementRemark">
              <el-input
                v-model="form.supplementRemark"
                placeholder="请输入补录备注"
                maxlength="500"
                type="textarea"
                :rows="2"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <el-divider content-position="left">预警设置</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="低库存阈值" prop="lowStockThreshold">
            <el-input-number
              v-model="form.lowStockThreshold"
              :min="0"
              :max="form.totalStock || 100"
              :step="1"
              style="width: 100%"
            />
            <div class="field-desc">低于此值标记为库存紧张</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="售罄阈值" prop="soldOutThreshold">
            <el-input-number
              v-model="form.soldOutThreshold"
              :min="0"
              :max="form.lowStockThreshold || 10"
              :step="1"
              style="width: 100%"
            />
            <div class="field-desc">低于此值标记为即将售罄</div>
          </el-form-item>
        </el-col>
      </el-row>

      <div v-if="isEdit" class="status-display-card">
        <div class="status-title">当前库存状态</div>
        <div class="status-bars">
          <div class="status-bar-item">
            <div class="bar-label">已售占比</div>
            <div class="bar-wrapper">
              <div class="bar-fill sold" :style="{ width: soldRate + '%' }"></div>
            </div>
            <div class="bar-value">{{ soldRate.toFixed(1) }}%</div>
          </div>
          <div class="status-bar-item">
            <div class="bar-label">占用占比</div>
            <div class="bar-wrapper">
              <div class="bar-fill occupied" :style="{ width: occupiedRate + '%' }"></div>
            </div>
            <div class="bar-value">{{ occupiedRate.toFixed(1) }}%</div>
          </div>
          <div class="status-bar-item">
            <div class="bar-label">可用占比</div>
            <div class="bar-wrapper">
              <div class="bar-fill available" :style="{ width: availableRate + '%' }"></div>
            </div>
            <div class="bar-value">{{ availableRate.toFixed(1) }}%</div>
          </div>
        </div>
      </div>

      <el-form-item label="操作备注" prop="remark">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入操作备注（可选）"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '保存修改' : '创建库存' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  TrendCharts,
  Lock,
  Plus,
  Airplane,
  Right,
  Clock,
  CircleCheck,
  Warning,
  Check,
  Close
} from '@element-plus/icons-vue'
import { CabinClassEnum, InventoryTypeEnum, InventoryStatusEnum } from '@/utils/enums'
import {
  getFlightList,
  getFlightInventory,
  createFlightInventory,
  updateFlightInventory,
  validateFlightInventoryField
} from '@/api/flight'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  editId: {
    type: Number,
    default: null
  },
  defaultFlightId: {
    type: Number,
    default: null
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

const formRef = ref(null)
const loading = ref(false)
const submitting = ref(false)
const flightList = ref([])
const fieldErrors = reactive({})
const fieldStatus = reactive({})

const form = reactive({
  flightId: null,
  cabinClass: 'economy',
  inventoryType: 'fixed',
  totalStock: 100,
  occupiedStock: 0,
  soldStock: 0,
  reservedStock: 0,
  lockedStock: 0,
  availableStock: 100,
  reserveRatio: 0,
  reserveExpireTime: '',
  lowStockThreshold: 10,
  soldOutThreshold: 3,
  supplementSource: '',
  supplementRemark: '',
  remark: ''
})

const rules = {
  flightId: [{ required: true, message: '请选择航班', trigger: 'change' }],
  cabinClass: [{ required: true, message: '请选择舱位', trigger: 'change' }],
  totalStock: [{ required: true, message: '请输入总库存数', trigger: 'blur' }],
  reserveExpireTime: [
    { required: form.inventoryType === 'reserved', message: '请选择预留到期时间', trigger: 'change' }
  ]
}

const isEdit = computed(() => !!props.editId)

const title = computed(() => {
  if (isEdit.value) return '编辑库存配置'
  return '创建库存配置'
})

const currentTypeConfig = computed(() => {
  const key = Object.keys(InventoryTypeEnum).find(k => InventoryTypeEnum[k].value === form.inventoryType)
  return InventoryTypeEnum[key] || InventoryTypeEnum.FIXED
})

const selectedFlight = computed(() => {
  if (!form.flightId) return null
  return flightList.value.find(f => f.id === form.flightId)
})

const availableStock = computed(() => {
  const total = form.totalStock || 0
  const occupied = form.occupiedStock || 0
  const sold = form.soldStock || 0
  const reserved = form.reservedStock || 0
  const locked = form.lockedStock || 0
  return Math.max(0, total - occupied - sold - reserved - locked)
})

const maxReservedStock = computed(() => {
  const total = form.totalStock || 0
  const occupied = form.occupiedStock || 0
  const sold = form.soldStock || 0
  const locked = form.lockedStock || 0
  return Math.max(0, total - occupied - sold - locked)
})

const inventoryStatusLabel = computed(() => {
  const status = _getInventoryStatusValue()
  const key = Object.keys(InventoryStatusEnum).find(k => InventoryStatusEnum[k].value === status)
  return InventoryStatusEnum[key]?.label || '库存充足'
})

const inventoryStatusClass = computed(() => {
  const status = _getInventoryStatusValue()
  const key = Object.keys(InventoryStatusEnum).find(k => InventoryStatusEnum[k].value === status)
  return `status-${key?.toLowerCase() || 'sufficient'}`
})

const availableStockClass = computed(() => {
  const status = _getInventoryStatusValue()
  const classMap = {
    1: 'status-sufficient',
    2: 'status-tight',
    3: 'status-almost-sold-out',
    4: 'status-sold-out'
  }
  return classMap[status] || 'status-sufficient'
})

const availableStockIcon = computed(() => {
  const status = _getInventoryStatusValue()
  if (status === 4) return Close
  if (status === 3 || status === 2) return Warning
  return Check
})

const soldRate = computed(() => {
  if (!form.totalStock) return 0
  return (form.soldStock / form.totalStock) * 100
})

const occupiedRate = computed(() => {
  if (!form.totalStock) return 0
  return (form.occupiedStock / form.totalStock) * 100
})

const availableRate = computed(() => {
  if (!form.totalStock) return 0
  return (availableStock.value / form.totalStock) * 100
})

function _getInventoryStatusValue() {
  const available = availableStock.value
  if (available <= 0) return 4
  if (available <= (form.soldOutThreshold || 3)) return 3
  if (available <= (form.lowStockThreshold || 10)) return 2
  return 1
}

function formatDate(time) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function handleTypeChange(type) {
  if (isEdit.value) return
  form.inventoryType = type
  if (type === 'reserved') {
    if (!form.reserveExpireTime) {
      const defaultTime = new Date()
      defaultTime.setDate(defaultTime.getDate() + 7)
      form.reserveExpireTime = defaultTime.toISOString().slice(0, 19).replace('T', ' ')
    }
  }
}

function handleCabinChange() {
  validateField('totalStock')
}

async function handleFlightChange() {
  validateField('totalStock')
}

function handleInputFocus(event, field) {
  fieldStatus[field] = false
  fieldErrors[field] = ''
}

function handleInputBlur(event, field) {
  validateField(field)
}

function handleStockInput(field) {
  validateField(field)
  if (field === 'totalStock' && form.inventoryType === 'reserved') {
    if (form.reserveRatio > 0) {
      form.reservedStock = Math.floor(form.totalStock * (form.reserveRatio / 100))
    }
  }
}

function handleReserveRatioChange() {
  if (form.reserveRatio > 0 && form.totalStock > 0) {
    form.reservedStock = Math.floor(form.totalStock * (form.reserveRatio / 100))
    validateField('reservedStock')
  }
}

async function validateField(field) {
  try {
    const res = await validateFlightInventoryField(field, form[field], {
      inventoryType: form.inventoryType,
      totalStock: form.totalStock,
      cabinClass: form.cabinClass
    })
    if (res.valid) {
      fieldErrors[field] = ''
      fieldStatus[field] = true
    } else {
      fieldErrors[field] = res.errors?.[0]?.message || '输入有误'
      fieldStatus[field] = false
    }
  } catch (e) {
    fieldErrors[field] = e.message || '校验失败'
    fieldStatus[field] = false
  }
}

function loadFlights() {
  getFlightList({ pageNum: 1, pageSize: 100 }).then(res => {
    flightList.value = res.data?.list || res.items || []
  }).catch(() => {
    flightList.value = []
  })
}

async function loadInventoryData() {
  if (!props.editId) return
  loading.value = true
  try {
    const res = await getFlightInventory(props.editId)
    const data = res.data || res
    Object.assign(form, {
      flightId: data.flightId,
      cabinClass: data.cabinClass,
      inventoryType: data.inventoryType,
      totalStock: data.totalStock,
      occupiedStock: data.occupiedStock,
      soldStock: data.soldStock,
      reservedStock: data.reservedStock,
      lockedStock: data.lockedStock,
      availableStock: data.availableStock,
      reserveRatio: data.reserveRatio,
      reserveExpireTime: data.reserveExpireTime,
      lowStockThreshold: data.lowStockThreshold,
      soldOutThreshold: data.soldOutThreshold,
      supplementSource: data.supplementSource,
      supplementRemark: data.supplementRemark
    })
  } catch (e) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function handleSubmit() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return

    const errors = Object.values(fieldErrors).filter(e => e)
    if (errors.length > 0) {
      ElMessage.error('请修正表单中的错误')
      return
    }

    submitting.value = true
    try {
      if (isEdit.value) {
        await updateFlightInventory(props.editId, form)
        ElMessage.success('库存配置更新成功')
      } else {
        await createFlightInventory(form)
        ElMessage.success('库存配置创建成功')
      }
      emit('success')
      visible.value = false
    } catch (e) {
      ElMessage.error(e.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

function handleCancel() {
  visible.value = false
}

function handleClosed() {
  resetForm()
}

function resetForm() {
  Object.assign(form, {
    flightId: props.defaultFlightId || null,
    cabinClass: 'economy',
    inventoryType: props.defaultInventoryType || 'fixed',
    totalStock: 100,
    occupiedStock: 0,
    soldStock: 0,
    reservedStock: 0,
    lockedStock: 0,
    availableStock: 100,
    reserveRatio: 0,
    reserveExpireTime: '',
    lowStockThreshold: 10,
    soldOutThreshold: 3,
    supplementSource: '',
    supplementRemark: '',
    remark: ''
  })
  fieldErrors.totalStock = ''
  fieldErrors.reservedStock = ''
  fieldStatus.totalStock = false
  fieldStatus.reservedStock = false
}

watch(() => props.modelValue, (val) => {
  if (val) {
    loadFlights()
    if (isEdit.value) {
      loadInventoryData()
    } else {
      resetForm()
    }
  }
})

onMounted(() => {
  if (visible.value) {
    loadFlights()
    if (isEdit.value) {
      loadInventoryData()
    }
  }
})
</script>
