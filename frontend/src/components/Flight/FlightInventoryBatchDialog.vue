<template>
  <el-dialog
    v-model="visible"
    title="批量库存操作"
    width="800px"
    class="flight-inventory-batch-dialog"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <el-icon color="#722ed1"><DataAnalysis /></el-icon>
        <span class="title">批量库存操作</span>
        <span class="count-badge">已选择 {{ selectedCount }} 条库存</span>
      </div>
    </template>

    <div class="batch-content">
      <div class="selected-info">
        <el-alert
          :title="'将对以下范围的库存进行批量操作'"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="info-detail">
            <div class="info-item">
              <span class="label">航班范围：</span>
              <el-tag size="small" type="primary">{{ flightRangeLabel }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">库存类型：</span>
              <el-tag :type="currentTypeTagType">{{ currentTypeLabel }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">操作类型：</span>
              <span class="value" :style="{ color: selectedOperation?.color }">
                <el-icon><component :is="selectedOperation?.icon" /></el-icon>
                {{ selectedOperation?.label }}
              </span>
            </div>
          </div>
          </template>
        </el-alert>
      </div>

      <div class="operation-cards">
        <div
          v-for="(operation, key) in displayOperations"
          :key="key"
          class="operation-card"
          :class="{
            active: selectedOperationType === operation.value,
            disabled: isOperationDisabled(operation)
          }"
          :style="{ '--card-color': operation.color }"
          @click="handleSelectOperation(operation)"
        >
          <div class="card-ripple" v-if="showRipple === operation.value"></div>
          <div class="card-icon">
            <el-icon><component :is="operation.icon" /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-title">{{ operation.label }}</div>
            <div class="card-desc">{{ getOperationDesc(operation.value) }}</div>
          </div>
          <div class="card-check" v-if="selectedOperationType === operation.value">
            <el-icon color="#52c41a"><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>

      <div v-if="selectedOperationType && !isValueOperation" class="value-input-section">
        <el-divider content-position="left">操作参数</el-divider>
        <div class="value-input-wrapper">
          <el-form :model="form" label-width="120px">
            <el-form-item label="操作数量">
              <div class="value-input-group">
                <el-input-number
                  v-model="form.quantity"
                  :min="1"
                  :max="getMaxQuantity()"
                  :step="10"
                  size="large"
                  class="large-input"
                />
                <span class="value-unit">张</span>
              </div>
              <div class="value-preview" v-if="form.quantity > 0">
                <el-icon color="#1890ff"><InfoFilled /></el-icon>
                <span>预计影响：{{ form.quantity }} 张库存</span>
              </div>
            </el-form-item>

            <el-form-item v-if="selectedOperationType === 'supplement'" label="节假日批次">
              <el-switch
                v-model="form.isHolidayBatch"
                active-text="是（需专项权限"
                inactive-text="否"
              />
              <el-tooltip content="节假日高峰库存批量调整需专项权限核验" placement="top">
                <el-icon class="help-icon"><QuestionFilled /></el-icon>
              </el-tooltip>
            </el-form-item>

            <el-form-item label="操作原因">
              <el-input
                v-model="form.reason"
                type="textarea"
                :rows="2"
                placeholder="请输入操作原因（必填）"
                maxlength="500"
                show-word-limit
                style="width: 400px"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-if="selectedOperationType" class="progress-section" v-show="isOperating">
        <el-divider content-position="left">操作进度</el-divider>
        <div class="progress-wrapper">
          <el-progress
            :percentage="progressPercent"
            :status="progressStatus"
            :stroke-width="12"
          />
          <div class="progress-text">
            <span>{{ processedCount }} / {{ selectedCount }} 条</span>
            <span class="progress-detail">成功: {{ successCount }} 失败: {{ failCount }}</span>
          </div>
        </div>
      </div>

      <div v-if="selectedOperationType" class="preview-section">
        <el-divider content-position="left">操作预览</el-divider>
        <div class="preview-cards">
          <div class="preview-card">
            <div class="preview-label">当前总库存</div>
            <div class="preview-value current">{{ totalCurrentStock }} 张</div>
          </div>
          <div class="preview-arrow">
            <el-icon :color="changeDirection === 'increase' ? '#52c41a' : '#ff4d4f'">
              <component :is="changeDirection === 'increase' ? 'Top' : 'Bottom'" />
            </el-icon>
          </div>
          <div class="preview-card">
            <div class="preview-label">预计总库存</div>
            <div class="preview-value target" :class="changeDirection">
              {{ totalTargetStock }} 张
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="isOperating"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        确认执行
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  DataAnalysis,
  CircleCheckFilled,
  InfoFilled,
  QuestionFilled
} from '@element-plus/icons-vue'
import {
  batchLockFlightInventory,
  batchUnlockFlightInventory,
  batchSupplementFlightInventory,
  batchReleaseExpiredReservation
} from '@/api/flight'
import {
  FlightInventoryBatchOperationEnum,
  FlightInventoryTypeEnum
} from '@/utils/enums'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedInventories: {
    type: Array,
    default: () => []
  },
  inventoryType: {
    type: String,
    default: 'fixed'
  },
  hasSpecialPermission: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const selectedOperationType = ref('')
const showRipple = ref('')
const isOperating = ref(false)
const processedCount = ref(0)
const successCount = ref(0)
const failCount = ref(0)

const form = reactive({
  quantity: 10,
  reason: '',
  isHolidayBatch: false
})

const selectedCount = computed(() => props.selectedInventories?.length || 0)

const flightRangeLabel = computed(() => {
  if (!props.selectedInventories?.length === 0) return '无'
  const flightIds = [...new Set(props.selectedInventories.map(i => i.flightId))]
  if (flightIds.length === 1) {
    return props.selectedInventories[0].flightNo || '单航班'
  }
  return `${flightIds.length} 个航班`
})

const currentTypeLabel = computed(() => {
  const key = Object.keys(FlightInventoryTypeEnum).find(
    k => FlightInventoryTypeEnum[k].value === props.inventoryType
  )
  return FlightInventoryTypeEnum[key]?.label || '全部类型'
})

const currentTypeTagType = computed(() => {
  return 'primary'
})

const displayOperations = computed(() => {
  return FlightInventoryBatchOperationEnum
})

const selectedOperation = computed(() => {
  const key = Object.keys(FlightInventoryBatchOperationEnum).find(
    k => FlightInventoryBatchOperationEnum[k].value === selectedOperationType.value
  )
  return FlightInventoryBatchOperationEnum[key] || null
})

const isValueOperation = computed(() => {
  return ['lock', 'unlock', 'supplement', 'adjust_total'].includes(selectedOperationType.value)
})

const canSubmit = computed(() => {
  if (!selectedOperationType.value) return false
  if (isValueOperation.value && !form.quantity) return false
  if (!form.reason) return false
  return true
})

const totalCurrentStock = computed(() => {
  return props.selectedInventories?.reduce((sum, item) => sum + parseInt(item.totalStock || 0), 0)
})

const changeDirection = computed(() => {
  if (['lock'].includes(selectedOperationType.value)) return 'decrease'
  if (['unlock', 'release_expired'].includes(selectedOperationType.value)) return 'increase'
  if (['supplement', 'adjust_total'].includes(selectedOperationType.value)) return 'increase'
  return 'unchanged'
})

const totalTargetStock = computed(() => {
  const current = totalCurrentStock.value
  const quantity = form.quantity * selectedCount.value
  if (selectedOperationType.value === 'supplement') {
    return current + quantity
  }
  if (selectedOperationType.value === 'adjust_total') {
    return current + quantity
  }
  return current
})

const progressPercent = computed(() => {
  if (selectedCount.value === 0) return 0
  return Math.round((processedCount.value / selectedCount.value) * 100)
})

const progressStatus = computed(() => {
  if (!isOperating.value) return null
  if (failCount.value > 0) return 'warning'
  return null
})

const isOperationDisabled = (operation) => {
  if (operation.value === 'supplement' && form.isHolidayBatch && !props.hasSpecialPermission) {
    return true
  }
  return false
}

const getOperationDesc = (type) => {
  const descs = {
    lock: '批量锁定选中的库存',
    unlock: '批量解锁选中的锁定库存',
    supplement: '为选中库存批量补录库存',
    release_expired: '批量释放所有过期预留库存',
    adjust_total: '批量调整总库存数量'
  }
  return descs[type] || ''
}

const getMaxQuantity = () => {
  if (selectedOperationType.value === 'lock') {
    const minAvailable = Math.min(
      ...props.selectedInventories.map(i => parseInt(i.availableStock || 0))
    )
    return Math.max(1, minAvailable)
  }
  if (selectedOperationType.value === 'unlock') {
    const minLocked = Math.min(
      ...props.selectedInventories.map(i => parseInt(i.lockedStock || 0))
    )
    return Math.max(1, minLocked)
  }
  return 500
}

const handleSelectOperation = (operation) => {
  if (isOperationDisabled(operation)) {
    ElMessage.warning('您没有权限执行此操作')
    return
  }
  showRipple.value = operation.value
  setTimeout(() => {
    showRipple.value = ''
  }, 600)
  selectedOperationType.value = operation.value
  if (operation.value === 'release_expired') {
    form.quantity = 0
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  try {
    await ElMessageBox.confirm(
      `确定要执行「${selectedOperation.value?.label}」操作吗？`,
      '确认操作',
      { type: 'warning' }
    )
  } catch (e) {
    return
  }

  isOperating.value = true
  processedCount.value = 0
  successCount.value = 0
  failCount.value = 0

  try {
    const ids = props.selectedInventories.map(i => i.id)
    let result

    switch (selectedOperationType.value) {
      case 'lock':
        result = await batchLockFlightInventory(ids, form.quantity)
        break
      case 'unlock':
        result = await batchUnlockFlightInventory(ids, form.quantity)
        break
      case 'supplement':
        result = await batchSupplementFlightInventory(ids, form.quantity, form.isHolidayBatch)
        break
      case 'release_expired':
        result = await batchReleaseExpiredReservation()
        break
      default:
        throw new Error('未知操作类型')
    }

    successCount.value = result?.success || 0
    failCount.value = result?.failed || 0
    processedCount.value = selectedCount.value

    ElMessage.success(`操作完成：成功${successCount.value}条，失败${failCount.value}条`)
    emit('success')
    setTimeout(() => {
      visible.value = false
    }, 1000)
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    setTimeout(() => {
      isOperating.value = false
    }, 500)
  }
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    selectedOperationType.value = ''
    form.quantity = 10
    form.reason = ''
    form.isHolidayBatch = false
    processedCount.value = 0
    successCount.value = 0
    failCount.value = 0
    isOperating.value = false
  }
})
</script>

<style lang="scss" scoped>
.flight-inventory-batch-dialog {
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;

    .title {
      flex: 1;
    }

    .count-badge {
      font-size: 12px;
      font-weight: 400;
      color: #909399;
      background: #f0f0f0;
      padding: 4px 12px;
      border-radius: 12px;
    }
  }

  .help-icon {
    margin-left: 8px;
    color: #909399;
    cursor: help;
  }

  .progress-section {
    .progress-wrapper {
      padding: 0 20px;

      .progress-text {
        display: flex;
        justify-content: space-between;
        margin-top: 8px;
        font-size: 13px;
        color: #606266;

        .progress-detail {
          color: #909399;
        }
      }
    }
  }
}
</style>
