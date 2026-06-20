<template>
  <el-dialog
    v-model="visible"
    title="批量履约操作"
    width="800px"
    class="flight-fulfillment-batch-dialog"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <el-icon color="#722ed1"><Files /></el-icon>
        <span>批量履约操作</span>
        <el-tag size="small" type="primary">已选择 {{ selectedCount }} 条</el-tag>
      </div>
    </template>

    <div v-if="!showProgress" class="batch-content">
      <div class="summary-alert">
        <el-alert
          type="info"
          :closable="false"
          show-icon
          title="将对选中的履约订单执行批量操作"
        >
          <template #default>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="label">总选中数</span>
                <el-tag size="small" type="primary">{{ selectedCount }}</el-tag>
              </div>
              <div class="summary-item">
                <span class="label">国内机票</span>
                <el-tag size="small" type="success">{{ domesticCount }}</el-tag>
              </div>
              <div class="summary-item">
                <span class="label">国际机票</span>
                <el-tag size="small" :type="internationalCount > 0 ? 'warning' : 'info'">{{ internationalCount }}</el-tag>
              </div>
              <div class="summary-item" v-if="internationalCount > 0">
                <span class="label" style="color: #fa8c16">
                  <el-icon><WarningFilled /></el-icon>
                  国际机票禁止批量
                </span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <div class="operation-cards">
        <div
          v-for="(operation, key) in operationList"
          :key="key"
          class="operation-card"
          :class="{
            active: selectedOperation === operation.value,
            disabled: isOperationDisabled(operation)
          }"
          :style="{ '--card-color': operation.color }"
          @click="handleSelectOperation(operation)"
        >
          <div class="card-icon">
            <el-icon><component :is="operation.icon" /></el-icon>
          </div>
          <div class="card-title">{{ operation.label }}</div>
          <div class="card-desc">{{ operation.desc }}</div>
          <div class="card-check" v-if="selectedOperation === operation.value">
            <el-icon color="#52c41a"><CircleCheckFilled /></el-icon>
          </div>
        </div>
      </div>

      <div v-if="selectedOperation" class="operation-detail">
        <el-divider content-position="left">操作参数</el-divider>

        <div v-if="selectedOperation === 'issue_ticket'" class="form-section">
          <el-form label-width="120px">
            <el-form-item label="操作说明">
              <span class="form-tip">
                批量完成选中履约订单的出票操作，将对合规国内机票订单逐一出票，国际机票将被自动跳过
              </span>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="selectedOperation === 'handle_flight_change'" class="form-section">
          <el-form label-width="120px">
            <el-form-item label="操作说明">
              <span class="form-tip">
                批量处理航班变动订单，标记为已处理状态
              </span>
            </el-form-item>
          </el-form>
        </div>

        <div v-if="selectedOperation === 'mark_abnormal'" class="form-section">
          <el-form :model="form" label-width="120px">
            <el-form-item label="异常类型" required>
              <el-select v-model="form.abnormalType" placeholder="请选择异常类型" style="width: 240px">
                <el-option
                  v-for="(item, key) in FulfillmentAbnormalTypeEnum"
                  :key="key"
                  :label="item.label"
                  :value="item.value"
                >
                  <span :style="{ color: item.color }">●</span>
                  <span style="margin-left: 6px">{{ item.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="异常原因" required>
              <el-input
                v-model="form.reason"
                type="textarea"
                :rows="2"
                placeholder="请输入异常原因"
                maxlength="500"
                show-word-limit
                style="width: 400px"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div v-if="selectedOperation" class="preview-section">
        <el-divider content-position="left">影响范围预览</el-divider>
        <div class="preview-cards">
          <div class="preview-card">
            <div class="preview-label">待处理</div>
            <div class="preview-value primary">{{ selectedCount }}</div>
          </div>
          <div class="preview-arrow">
            <el-icon color="#52c41a"><Right /></el-icon>
          </div>
          <div class="preview-card success">
            <div class="preview-label">预计处理</div>
            <div class="preview-value">{{ estimatedCount }}</div>
          </div>
          <div class="preview-arrow" v-if="internationalCount > 0">
            <el-icon color="#faad14"><Warning /></el-icon>
          </div>
          <div class="preview-card warning" v-if="internationalCount > 0">
            <div class="preview-label">自动跳过</div>
            <div class="preview-value">{{ internationalCount }}</div>
          </div>
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
          <span class="detail-label">总任务</span>
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

      <div v-if="progressCompleted" class="result-checks">
        <div class="check-tip">
          <el-tag type="success" size="large" effect="light">
            <el-icon><CircleCheckFilled /></el-icon>
            操作完成，点击关闭返回列表
          </el-tag>
        </div>
      </div>
    </div>

    <template #footer>
      <template v-if="!showProgress">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :disabled="!canSubmit"
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
  Tickets,
  Warning,
  WarningFilled,
  CircleCheckFilled,
  Right,
  Check,
  Loading,
  CircleClose
} from '@element-plus/icons-vue'
import {
  FulfillmentBatchOperationEnum,
  FulfillmentAbnormalTypeEnum
} from '@/utils/enums'
import {
  batchIssueFlightFulfillmentTickets,
  batchHandleFlightFulfillmentChanges,
  batchMarkFlightFulfillmentAbnormal
} from '@/api/flight'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedItems: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const selectedOperation = ref('')
const showProgress = ref(false)
const submitting = ref(false)
const progressPercent = ref(0)
const progressSuccess = ref(0)
const progressFailed = ref(0)
const progressCompleted = ref(false)

const form = reactive({
  abnormalType: '',
  reason: ''
})

const selectedCount = computed(() => props.selectedItems.length)

const domesticCount = computed(() => {
  return props.selectedItems.filter(item => !item.isInternational).length
})

const internationalCount = computed(() => {
  return props.selectedItems.filter(item => item.isInternational).length
})

const operationList = computed(() => Object.values(FulfillmentBatchOperationEnum))

const estimatedCount = computed(() => domesticCount.value)

const canSubmit = computed(() => {
  if (!selectedOperation.value) return false
  if (selectedOperation.value === 'mark_abnormal') {
    return form.abnormalType && form.reason
  }
  return true
})

const progressIcon = computed(() => {
  if (!progressCompleted.value) return Loading
  if (progressFailed.value === 0) return Check
  return WarningFilled
})

const progressIconClass = computed({
  'icon-spin': !progressCompleted.value,
  'icon-success': progressCompleted.value && progressFailed.value === 0,
  'icon-warning': progressCompleted.value && progressFailed.value > 0
})

const progressStatus = computed(() => {
  if (!progressCompleted.value) return ''
  if (progressFailed.value === 0) return 'success'
  if (progressSuccess.value === 0) return 'exception'
  return 'warning'
})

const progressTitle = computed(() => {
  if (!progressCompleted.value) return `正在执行${getCurrentOperationLabel()}...`
  return '操作完成'
})

function isOperationDisabled(operation) {
  return false
}

function getCurrentOperationLabel() {
  const op = operationList.value.find(o => o.value === selectedOperation.value)
  return op?.label || '批量操作'
}

function handleSelectOperation(operation) {
  selectedOperation.value = operation.value
}

async function handleSubmit() {
  try {
    await ElMessageBox.confirm(
      `确认对选中的 ${selectedCount.value} 条履约订单执行「${getCurrentOperationLabel()}」操作吗？`,
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
    const ids = props.selectedItems.map(item => item.id)
    let result

    switch (selectedOperation.value) {
      case 'issue_ticket':
        result = await batchIssueFlightFulfillmentTickets(ids, [])
        break
      case 'handle_flight_change':
        result = await batchHandleFlightFulfillmentChanges(ids)
        break
      case 'mark_abnormal':
        result = await batchMarkFlightFulfillmentAbnormal(ids, form.abnormalType, form.reason)
        break
    }

    await simulateProgress(result)

    ElMessage.success(`批量操作完成，成功${result?.success || 0}条，失败${result?.failed || 0}条`)
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
      current += Math.max(1, Math.ceil(total / 20))
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
  resetState()
}

function resetState() {
  selectedOperation.value = ''
  showProgress.value = false
  progressPercent.value = 0
  progressSuccess.value = 0
  progressFailed.value = 0
  progressCompleted.value = false
  form.abnormalType = ''
  form.reason = ''
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    resetState()
  }
})
</script>
