<template>
  <div class="payment-batch-toolbar" v-if="visible">
    <div class="toolbar-content">
      <div class="selected-info">
        <el-icon><Check /></el-icon>
        <span>
          已选择 <em>{{ selectedCount }}</em> 条订单
          <span v-if="highEndCount > 0" class="high-end-tip">
            <el-icon class="warn-icon"><Warning /></el-icon>
            含 {{ highEndCount }} 条高端商旅订单
          </span>
        </span>
      </div>
      <div class="toolbar-actions">
        <el-button
          v-if="canRemind"
          type="primary"
          class="btn-with-progress batch-btn-hover"
          :disabled="pendingCount === 0 || remindLoading"
          @click="handleBatchRemind"
        >
          <div v-if="remindLoading" class="progress-bar-inside" :style="{ width: remindProgress + '%' }"></div>
          <el-icon><Bell /></el-icon>
          <span v-if="remindLoading">
            提醒中 ({{ remindProcessed }}/{{ pendingCount }})
          </span>
          <span v-else>
            批量提醒支付 ({{ pendingCount }})
          </span>
        </el-button>

        <el-button
          v-if="canCancelTimeout"
          type="warning"
          class="btn-with-progress batch-btn-hover"
          :disabled="cancelableCount === 0 || cancelLoading"
          @click="handleBatchCancelTimeout"
        >
          <div v-if="cancelLoading" class="progress-bar-inside" :style="{ width: cancelProgress + '%' }"></div>
          <el-icon><Timer /></el-icon>
          <span v-if="cancelLoading">
            取消中 ({{ cancelProcessed }}/{{ cancelableCount }})
          </span>
          <span v-else>
            批量取消超时 ({{ cancelableCount }})
            <el-tooltip v-if="highEndCount > 0" placement="top">
              <template #content>将自动跳过 {{ highEndCount }} 条高端商旅订单</template>
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </el-button>

        <el-button
          v-if="canExemptTimeout"
          type="success"
          class="btn-with-progress batch-btn-hover"
          :disabled="pendingCount === 0 || exemptLoading"
          @click="handleBatchExemptTimeout"
        >
          <div v-if="exemptLoading" class="progress-bar-inside" :style="{ width: exemptProgress + '%' }"></div>
          <el-icon><Ticket /></el-icon>
          <span v-if="exemptLoading">
            豁免中 ({{ exemptProcessed }}/{{ pendingCount }})
          </span>
          <span v-else>批量豁免超时 ({{ pendingCount }})</span>
        </el-button>

        <el-button @click="handleClearSelection">
          <el-icon><Close /></el-icon>
          取消选择
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check, Warning, Bell, Timer, Ticket, Close, QuestionFilled
} from '@element-plus/icons-vue'
import {
  batchRemindPayment,
  batchCancelTimeout,
  batchExemptTimeout
} from '@/api/payment'
import { OrderPriorityEnum } from '@/utils/enums'
import { useUserStore } from '@/store/modules/user'

const props = defineProps({
  selectedCount: {
    type: Number,
    default: 0
  },
  selectedIds: {
    type: Array,
    default: () => []
  },
  selectedRows: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['success', 'clear-selection'])

const userStore = useUserStore()

const remindLoading = ref(false)
const cancelLoading = ref(false)
const exemptLoading = ref(false)

const remindProcessed = ref(0)
const cancelProcessed = ref(0)
const exemptProcessed = ref(0)

const remindProgress = ref(0)
const cancelProgress = ref(0)
const exemptProgress = ref(0)

const visible = computed(() => props.selectedCount > 0)

const userRoles = computed(() => userStore.roles || [])

const canRemind = computed(() => {
  return ['operator', 'admin'].some(role => userRoles.value.includes(role))
})

const canCancelTimeout = computed(() => {
  return userRoles.value.includes('admin')
})

const canExemptTimeout = computed(() => {
  return userRoles.value.includes('admin')
})

const highEndCount = computed(() => {
  return props.selectedRows.filter(
    r => r.priority === OrderPriorityEnum.HIGH_END.value
  ).length
})

const pendingCount = computed(() => {
  return props.selectedRows.filter(
    r => r.status === 1
  ).length
})

const cancelableIds = computed(() => {
  return props.selectedRows
    .filter(r =>
      r.status === 1 &&
      r.priority !== OrderPriorityEnum.HIGH_END.value
    )
    .map(r => r.id)
})

const cancelableCount = computed(() => cancelableIds.value.length)

const pendingIds = computed(() => {
  return props.selectedRows
    .filter(r => r.status === 1)
    .map(r => r.id)
})

const simulateProgress = (processedRef, progressRef, total, done) => {
  let current = 0
  const interval = setInterval(() => {
    current++
    processedRef.value = current
    progressRef.value = Math.min((current / total) * 100, 95)
    if (current >= total) {
      clearInterval(interval)
      done()
    }
  }, 200)
  return interval
}

const handleBatchRemind = async () => {
  if (pendingCount.value === 0) {
    ElMessage.warning('所选订单中没有待支付的订单')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认向 ${pendingCount.value} 条待支付订单发送支付提醒吗？`,
      '批量提醒支付',
      {
        confirmButtonText: '确认提醒',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
  } catch {
    return
  }

  remindLoading.value = true
  remindProcessed.value = 0
  remindProgress.value = 0

  try {
    const ids = pendingIds.value
    let intervalId = null
    const promise = new Promise((resolve) => {
      intervalId = simulateProgress(
        remindProcessed,
        remindProgress,
        ids.length,
        () => resolve()
      )
    })

    const apiPromise = batchRemindPayment(ids)
    await Promise.all([promise, apiPromise])

    if (intervalId) clearInterval(intervalId)
    remindProgress.value = 100

    setTimeout(() => {
      ElMessage.success(`成功提醒 ${ids.length} 条订单支付`)
      emit('success', 'remind')
      emit('clear-selection')
      remindLoading.value = false
    }, 300)
  } catch (err) {
    ElMessage.error(err.message || '批量提醒失败')
    remindLoading.value = false
  }
}

const handleBatchCancelTimeout = async () => {
  if (cancelableCount.value === 0) {
    if (highEndCount.value > 0 && pendingCount.value > 0) {
      ElMessage.warning('高端商旅订单不支持批量取消超时，请单独处理')
    } else {
      ElMessage.warning('没有可取消的待支付订单')
    }
    return
  }

  const skipMsg = highEndCount.value > 0
    ? `\n（将自动跳过 ${highEndCount.value} 条高端商旅订单）`
    : ''

  try {
    await ElMessageBox.confirm(
      `确认将 ${cancelableCount.value} 条订单标记为超时取消吗？${skipMsg}`,
      '批量取消超时',
      {
        confirmButtonText: '确认取消',
        cancelButtonText: '暂不取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
    )
  } catch {
    return
  }

  cancelLoading.value = true
  cancelProcessed.value = 0
  cancelProgress.value = 0

  try {
    const ids = cancelableIds.value
    let intervalId = null
    const promise = new Promise((resolve) => {
      intervalId = simulateProgress(
        cancelProcessed,
        cancelProgress,
        ids.length,
        () => resolve()
      )
    })

    const apiPromise = batchCancelTimeout(ids)
    await Promise.all([promise, apiPromise])

    if (intervalId) clearInterval(intervalId)
    cancelProgress.value = 100

    setTimeout(() => {
      ElMessage.success(`成功取消 ${ids.length} 条超时订单`)
      emit('success', 'cancel-timeout')
      emit('clear-selection')
      cancelLoading.value = false
    }, 300)
  } catch (err) {
    ElMessage.error(err.message || '批量取消失败')
    cancelLoading.value = false
  }
}

const handleBatchExemptTimeout = async () => {
  if (pendingCount.value === 0) {
    ElMessage.warning('所选订单中没有待支付的订单')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确认给 ${pendingCount.value} 条待支付订单豁免支付时效吗？`,
      '批量豁免超时',
      {
        confirmButtonText: '确认豁免',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
  } catch {
    return
  }

  exemptLoading.value = true
  exemptProcessed.value = 0
  exemptProgress.value = 0

  try {
    const ids = pendingIds.value
    let intervalId = null
    const promise = new Promise((resolve) => {
      intervalId = simulateProgress(
        exemptProcessed,
        exemptProgress,
        ids.length,
        () => resolve()
      )
    })

    const apiPromise = batchExemptTimeout(ids)
    await Promise.all([promise, apiPromise])

    if (intervalId) clearInterval(intervalId)
    exemptProgress.value = 100

    setTimeout(() => {
      ElMessage.success(`成功豁免 ${ids.length} 条订单支付时效`)
      emit('success', 'exempt-timeout')
      emit('clear-selection')
      exemptLoading.value = false
    }, 300)
  } catch (err) {
    ElMessage.error(err.message || '批量豁免失败')
    exemptLoading.value = false
  }
}

const handleClearSelection = () => {
  emit('clear-selection')
}
</script>

<style lang="scss" scoped>
.payment-batch-toolbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  .toolbar-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;

    .selected-info {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #606266;
      font-size: 14px;

      em {
        color: #409eff;
        font-style: normal;
        font-weight: 600;
        margin: 0 4px;
      }

      .high-end-tip {
        margin-left: 16px;
        color: #ff4d4f;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 4px;

        .warn-icon {
          animation: pulseWarn 1.5s ease-in-out infinite;
        }
      }
    }

    .toolbar-actions {
      display: flex;
      gap: 12px;

      .tip-icon {
        margin-left: 4px;
        font-size: 14px;
        opacity: 0.8;
      }
    }
  }
}

@keyframes pulseWarn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
