<template>
  <el-dialog
    v-model="visible"
    title="批量库存管理"
    width="800px"
    class="flight-inventory-batch-dialog"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <el-icon color="#722ed1"><Files /></el-icon>
        <span class="title">批量库存管理</span>
        <span class="count-badge">已选择 {{ selectedCount }} 条库存配置</span>
      </div>
    </template>

    <div v-if="!showProgress" class="batch-content">
      <div class="selected-info">
        <el-alert
          title="将对以下范围的库存配置进行批量操作"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="info-detail">
              <div class="info-item">
                <span class="label">库存数量：</span>
                <el-tag size="small" type="primary">{{ selectedCount }} 条</el-tag>
              </div>
              <div class="info-item">
                <span class="label">库存类型：</span>
                <el-tag :type="selectedOperation?.type || 'info'">{{ selectedOperation?.label || '请选择' }}</el-tag>
              </div>
              <div class="info-item">
                <span class="label">操作类型：</span>
                <span class="value" :style="{ color: selectedOperation?.color }">
                  <el-icon><component :is="selectedOperation?.icon" /></el-icon>
                  {{ selectedOperation?.label || '请选择操作' }}
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
            disabled: operation.disabled
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
            <div class="card-desc">{{ operation.desc }}</div>
          </div>
          <div class="card-check" v-if="selectedOperationType === operation.value">
            <el-icon color="#52c41a"><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>

      <div v-if="selectedOperationType" class="operation-form">
        <el-divider content-position="left">操作参数</el-divider>

        <div v-if="selectedOperationType === 'lock'" class="form-section">
          <el-form :model="form" label-width="120px">
            <el-form-item label="锁定原因" required>
              <el-input
                v-model="form.lockReason"
                type="textarea"
                :rows="2"
                placeholder="请输入锁定原因（必填）"
                maxlength="200"
                show-word-limit
                style="width: 400px"
              />
            </el-form-item>
          </el-form>
        </div>

        <div v-if="selectedOperationType === 'supplement'" class="form-section">
          <el-form :model="form" label-width="120px">
            <el-form-item label="补录数量" required>
              <el-input-number
                v-model="form.supplementQuantity"
                :min="1"
                :max="1000"
                :step="10"
                size="large"
              />
              <span class="form-unit">张</span>
              <div class="form-tip">单条库存最多补录1000张</div>
            </el-form-item>
            <el-form-item label="补录来源">
              <el-input
                v-model="form.supplementSource"
                placeholder="请输入补录来源"
                maxlength="100"
                style="width: 300px"
              />
            </el-form-item>
            <el-form-item label="补录备注">
              <el-input
                v-model="form.supplementRemark"
                type="textarea"
                :rows="2"
                placeholder="请输入补录备注"
                maxlength="500"
                show-word-limit
                style="width: 400px"
              />
            </el-form-item>
          </el-form>
        </div>

        <div v-if="selectedOperationType === 'releaseReserve'" class="form-section">
          <el-alert
            title="确认释放所有选中库存的预留配额吗？"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>释放后，预留库存将转化为可用库存。此操作不可撤销。</p>
            </template>
          </el-alert>
        </div>

        <div v-if="selectedOperationType === 'unlock'" class="form-section">
          <el-alert
            title="确认解锁所有选中的锁定库存吗？"
            type="success"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>解锁后，锁定库存将转化为可用库存，恢复销售。</p>
            </template>
          </el-alert>
        </div>
      </div>

      <div v-if="selectedOperationType" class="preview-section">
        <el-divider content-position="left">操作预览</el-divider>
        <div class="preview-cards">
          <div class="preview-card">
            <div class="preview-label">当前总库存</div>
            <div class="preview-value">{{ currentTotalStock }}</div>
            <div class="preview-unit">张</div>
          </div>
          <div class="preview-arrow">
            <el-icon :color="previewChangeColor">
              <component :is="previewChangeDirection === 'increase' ? 'Right' : 'RefreshRight'" />
            </el-icon>
          </div>
          <div class="preview-card target">
            <div class="preview-label">预计总库存</div>
            <div class="preview-value" :class="previewChangeDirection">{{ previewTotalStock }}</div>
            <div class="preview-unit">张</div>
          </div>
        </div>
        <div class="preview-summary">
          预计变动：<span :class="previewChangeDirection">
            {{ previewChangeDirection === 'increase' ? '+' : '' }}{{ previewChangeAmount }} 张
          </span>
        </div>
      </div>
    </div>

    <div v-else class="progress-section">
      <div class="progress-header">
        <el-icon :class="progressIconClass"><component :is="progressIcon" /></el-icon>
        <span class="progress-title">{{ progressTitle }}</span>
      </div>

      <div class="progress-bar-wrapper">
        <el-progress
          :percentage="progressPercent"
          :status="progressStatus"
          :stroke-width="24"
          :text-inside="true"
        />
      </div>

      <div class="progress-detail">
        <div class="detail-item">
          <span class="detail-label">总任务数</span>
          <span class="detail-value">{{ selectedCount }}</span>
        </div>
        <div class="detail-item success">
          <span class="detail-label">成功</span>
          <span class="detail-value">{{ progressSuccess }}</span>
        </div>
        <div class="detail-item fail">
          <span class="detail-label">失败</span>
          <span class="detail-value">{{ progressFailed }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">进度</span>
          <span class="detail-value">{{ progressPercent }}%</span>
        </div>
      </div>

      <div v-if="progressCompleted" class="progress-result">
        <el-alert
          :title="progressResultTitle"
          :type="progressResultType"
          :closable="false"
          show-icon
        >
          <template #default>
            <p v-if="progressSuccess > 0">成功处理 {{ progressSuccess }} 条库存配置</p>
            <p v-if="progressFailed > 0">失败 {{ progressFailed }} 条，请检查日志详情</p>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <template v-if="!showProgress">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectedOperationType || !canSubmit"
          :loading="submitting"
          @click="handleSubmit"
        >
          确认执行
        </el-button>
      </template>
      <template v-else>
        <el-button v-if="progressCompleted" type="primary" @click="handleClose">
          关闭
        </el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Files,
  Lock,
  Unlock,
  RefreshRight,
  Plus,
  CircleCheckFilled,
  Right,
  Check,
  Loading,
  Warning
} from '@element-plus/icons-vue'
import { InventoryBatchOperationEnum } from '@/utils/enums'
import {
  batchLockFlightInventory,
  batchUnlockFlightInventory,
  batchReleaseFlightReservations,
  batchSupplementFlightInventory
} from '@/api/flight'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedInventories: {
    type: Array,
    default: () => []
  },
  hasSupplementPermission: {
    type: Boolean,
    default: false
  },
  hasHolidayPermission: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const selectedOperationType = ref('')
const showRipple = ref('')
const submitting = ref(false)
const showProgress = ref(false)
const progressPercent = ref(0)
const progressSuccess = ref(0)
const progressFailed = ref(0)
const progressCompleted = ref(false)

const form = reactive({
  lockReason: '',
  supplementQuantity: 50,
  supplementSource: '',
  supplementRemark: ''
})

const selectedCount = computed(() => props.selectedInventories.length)

const displayOperations = computed(() => {
  const ops = []
  for (const [key, value] of Object.entries(InventoryBatchOperationEnum)) {
    const item = { ...value, key, disabled: false }
    if (value.value === 'supplement' && !props.hasSupplementPermission) {
      item.disabled = true
    }
    if ((value.value === 'lock' || value.value === 'unlock') && !props.hasHolidayPermission) {
      if (props.selectedInventories.some(inv => inv.inventoryType === 'reserved' || inv.inventoryType === 'special')) {
        // 有节假日库存需要特殊权限
      }
    }
    ops.push(item)
  }
  return ops
})

const selectedOperation = computed(() => {
  if (!selectedOperationType.value) return null
  return displayOperations.value.find(op => op.value === selectedOperationType.value)
})

const canSubmit = computed(() => {
  if (!selectedOperationType.value) return false
  if (selectedOperationType.value === 'lock' && !form.lockReason) return false
  if (selectedOperationType.value === 'supplement' && (!form.supplementQuantity || form.supplementQuantity <= 0)) return false
  return true
})

const currentTotalStock = computed(() => {
  return props.selectedInventories.reduce((sum, inv) => sum + (inv.totalStock || 0), 0)
})

const previewChangeDirection = computed(() => {
  const type = selectedOperationType.value
  if (type === 'supplement') return 'increase'
  if (type === 'lock') return 'decrease'
  if (type === 'unlock') return 'increase'
  if (type === 'releaseReserve') return 'increase'
  return 'none'
})

const previewChangeColor = computed(() => {
  return previewChangeDirection.value === 'increase' ? '#52c41a' : '#faad14'
})

const previewChangeAmount = computed(() => {
  const type = selectedOperationType.value
  const count = selectedCount.value

  if (type === 'supplement') {
    return form.supplementQuantity * count
  }
  if (type === 'lock') {
    return props.selectedInventories.reduce((sum, inv) => sum + (inv.availableStock || 0), 0)
  }
  if (type === 'unlock') {
    return props.selectedInventories.reduce((sum, inv) => sum + (inv.lockedStock || 0), 0)
  }
  if (type === 'releaseReserve') {
    return props.selectedInventories.reduce((sum, inv) => sum + (inv.reservedStock || 0), 0)
  }
  return 0
})

const previewTotalStock = computed(() => {
  if (previewChangeDirection.value === 'increase') {
    return currentTotalStock.value + previewChangeAmount.value
  }
  if (previewChangeDirection.value === 'decrease') {
    return currentTotalStock.value - previewChangeAmount.value
  }
  return currentTotalStock.value
})

const progressIcon = computed(() => {
  if (!progressCompleted.value) return Loading
  if (progressFailed.value === 0) return Check
  return Warning
})

const progressIconClass = computed({
  'icon-spin': !progressCompleted.value,
  'icon-success': progressCompleted.value && progressFailed.value === 0,
  'icon-warning': progressCompleted.value && progressFailed.value > 0
})

const progressStatus = computed(() => {
  if (!progressCompleted.value) return ''
  if (progressFailed.value === 0) return 'success'
  return 'exception'
})

const progressTitle = computed(() => {
  if (!progressCompleted.value) return `正在执行${selectedOperation.value?.label || '批量操作'}...`
  return '操作完成'
})

const progressResultTitle = computed(() => {
  if (progressFailed.value === 0) return '批量操作全部成功！'
  if (progressSuccess.value === 0) return '批量操作全部失败'
  return '批量操作部分完成'
})

const progressResultType = computed(() => {
  if (progressFailed.value === 0) return 'success'
  if (progressSuccess.value === 0) return 'error'
  return 'warning'
})

function handleSelectOperation(operation) {
  if (operation.disabled) {
    ElMessage.warning(operation.value === 'supplement' ? '无补录库存权限，请联系管理员' : '无此操作权限')
    return
  }

  showRipple.value = operation.value
  setTimeout(() => {
    showRipple.value = ''
  }, 600)

  selectedOperationType.value = operation.value
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedCount.value} 条库存配置执行「${selectedOperation.value?.label}」操作吗？`,
      '确认操作',
      { type: 'warning', confirmButtonText: '确认执行', cancelButtonText: '取消' }
    )
  } catch {
    return
  }

  submitting.value = true
  showProgress.value = true
  progressPercent.value = 0
  progressSuccess.value = 0
  progressFailed.value = 0
  progressCompleted.value = false

  try {
    const inventoryIds = props.selectedInventories.map(inv => inv.id)

    let result
    switch (selectedOperationType.value) {
      case 'lock':
        result = await batchLockFlightInventory(inventoryIds, form.lockReason)
        break
      case 'unlock':
        result = await batchUnlockFlightInventory(inventoryIds)
        break
      case 'releaseReserve':
        result = await batchReleaseFlightReservations(inventoryIds)
        break
      case 'supplement':
        result = await batchSupplementFlightInventory(
          inventoryIds,
          form.supplementQuantity,
          form.supplementSource,
          form.supplementRemark
        )
        break
    }

    await simulateProgress(result)

    ElMessage.success(`批量操作完成，成功${result?.success || 0}条`)
    emit('success')
  } catch (e) {
    progressFailed.value = selectedCount.value
    progressCompleted.value = true
    progressPercent.value = 100
    ElMessage.error(e.message || '批量操作失败')
  } finally {
    submitting.value = false
  }
}

function simulateProgress(result) {
  return new Promise((resolve) => {
    const total = selectedCount.value
    const success = result?.success || 0
    const failed = result?.failed || 0
    let current = 0

    const interval = setInterval(() => {
      current += Math.ceil(total / 20)
      if (current >= total) {
        current = total
        clearInterval(interval)
        progressSuccess.value = success
        progressFailed.value = failed
        progressCompleted.value = true
        setTimeout(resolve, 300)
      }
      progressPercent.value = Math.round((current / total) * 100)
      progressSuccess.value = Math.floor(success * (current / total))
      progressFailed.value = Math.floor(failed * (current / total))
    }, 50)
  })
}

function handleCancel() {
  visible.value = false
}

function handleClose() {
  visible.value = false
  resetForm()
}

function resetForm() {
  selectedOperationType.value = ''
  showProgress.value = false
  progressPercent.value = 0
  progressSuccess.value = 0
  progressFailed.value = 0
  progressCompleted.value = false
  form.lockReason = ''
  form.supplementQuantity = 50
  form.supplementSource = ''
  form.supplementRemark = ''
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    resetForm()
  }
})
</script>
