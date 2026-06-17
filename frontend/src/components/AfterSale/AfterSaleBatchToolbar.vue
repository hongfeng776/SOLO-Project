<template>
  <div class="after-sale-batch-toolbar" v-if="visible">
    <div class="toolbar-content">
      <div class="selected-info">
        <el-icon><Check /></el-icon>
        <span>
          已选择 <em>{{ selectedCount }}</em> 条订单
          <span v-if="largeAmountCount > 0" class="refund-large-tag">
            <el-icon class="warn-icon"><Warning /></el-icon>
            含 {{ largeAmountCount }} 条大额退款
          </span>
        </span>
      </div>
      <div class="toolbar-actions">
        <el-button
          type="success"
          class="btn-with-progress batch-btn-hover"
          :disabled="approveableCount === 0 || approveLoading"
          @click="handleBatchApprove"
        >
          <div v-if="approveLoading" class="progress-bar-inside" :style="{ width: approveProgress + '%' }"></div>
          <el-icon><CircleCheckFilled /></el-icon>
          <span v-if="approveLoading">
            审核中 ({{ approveProcessed }}/{{ approveableCount }})
          </span>
          <span v-else>
            批量审核通过 ({{ approveableCount }})
            <el-tooltip v-if="largeAmountCount > 0" placement="top">
              <template #content>将自动跳过 {{ largeAmountCount }} 条大额退款订单</template>
              <el-icon class="tip-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </span>
        </el-button>

        <el-button
          type="danger"
          class="btn-with-progress batch-btn-hover"
          :disabled="pendingCount === 0 || rejectLoading"
          @click="handleBatchReject"
        >
          <div v-if="rejectLoading" class="progress-bar-inside" :style="{ width: rejectProgress + '%' }"></div>
          <el-icon><CircleCloseFilled /></el-icon>
          <span v-if="rejectLoading">
            驳回中 ({{ rejectProcessed }}/{{ pendingCount }})
          </span>
          <span v-else>批量驳回 ({{ pendingCount }})</span>
        </el-button>

        <el-button
          type="warning"
          class="btn-with-progress batch-btn-hover"
          :disabled="pendingCount === 0 || postponeLoading"
          @click="handleBatchPostpone"
        >
          <div v-if="postponeLoading" class="progress-bar-inside" :style="{ width: postponeProgress + '%' }"></div>
          <el-icon><Timer /></el-icon>
          <span v-if="postponeLoading">
            暂缓中 ({{ postponeProcessed }}/{{ pendingCount }})
          </span>
          <span v-else>批量暂缓 ({{ pendingCount }})</span>
        </el-button>

        <el-button @click="handleClearSelection">
          <el-icon><Close /></el-icon>
          取消选择
        </el-button>
      </div>
    </div>
  </div>

  <el-dialog v-model="rejectDialogVisible" title="批量驳回" width="480px" destroy-on-close>
    <el-form :model="rejectForm" :rules="rejectRules" ref="rejectFormRef" label-width="100px">
      <el-form-item label="驳回数量">
        <span>{{ pendingCount }} 条</span>
      </el-form-item>
      <el-form-item label="驳回原因" prop="rejectReason">
        <el-input
          v-model="rejectForm.rejectReason"
          type="textarea"
          :rows="4"
          placeholder="请输入统一驳回原因（必填）"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="rejectDialogVisible = false">取消</el-button>
      <el-button type="danger" :loading="rejectLoading" @click="submitBatchReject">确认驳回</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="postponeDialogVisible" title="批量暂缓" width="480px" destroy-on-close>
    <el-form :model="postponeForm" :rules="postponeRules" ref="postponeFormRef" label-width="100px">
      <el-form-item label="暂缓数量">
        <span>{{ pendingCount }} 条</span>
      </el-form-item>
      <el-form-item label="暂缓备注" prop="remark">
        <el-input
          v-model="postponeForm.remark"
          type="textarea"
          :rows="4"
          placeholder="请输入统一暂缓备注（必填）"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="postponeDialogVisible = false">取消</el-button>
      <el-button type="warning" :loading="postponeLoading" @click="submitBatchPostpone">确认暂缓</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check, Warning, Timer, Close, QuestionFilled,
  CircleCheckFilled, CircleCloseFilled
} from '@element-plus/icons-vue'
import {
  batchApprove,
  batchReject,
  batchPostpone
} from '@/api/afterSale'
import { AfterSaleStatusEnum } from '@/utils/enums'
import { isLargeAmount } from '@/utils/refund'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
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

const emit = defineEmits(['action-success', 'clear-selection'])

const approveLoading = ref(false)
const rejectLoading = ref(false)
const postponeLoading = ref(false)

const approveProcessed = ref(0)
const rejectProcessed = ref(0)
const postponeProcessed = ref(0)

const approveProgress = ref(0)
const rejectProgress = ref(0)
const postponeProgress = ref(0)

const rejectDialogVisible = ref(false)
const postponeDialogVisible = ref(false)
const rejectFormRef = ref(null)
const postponeFormRef = ref(null)

const rejectForm = reactive({
  rejectReason: ''
})

const postponeForm = reactive({
  remark: ''
})

const rejectRules = {
  rejectReason: [
    { required: true, message: '请输入驳回原因', trigger: 'blur' },
    { min: 5, message: '驳回原因至少5个字符', trigger: 'blur' }
  ]
}

const postponeRules = {
  remark: [
    { required: true, message: '请输入暂缓备注', trigger: 'blur' },
    { min: 5, message: '暂缓备注至少5个字符', trigger: 'blur' }
  ]
}

const selectedCount = computed(() => props.selectedRows.length)

const pendingCount = computed(() => {
  return props.selectedRows.filter(
    r => r.status === AfterSaleStatusEnum.PENDING.value
  ).length
})

const largeAmountCount = computed(() => {
  return props.selectedRows.filter(
    r => isLargeAmount(r.applyAmount || r.finalRefund || r.amount)
  ).length
})

const approveableCount = computed(() => {
  return props.selectedRows.filter(
    r => r.status === AfterSaleStatusEnum.PENDING.value &&
      !isLargeAmount(r.applyAmount || r.finalRefund || r.amount)
  ).length
})

const approveableIds = computed(() => {
  return props.selectedRows
    .filter(r =>
      r.status === AfterSaleStatusEnum.PENDING.value &&
      !isLargeAmount(r.applyAmount || r.finalRefund || r.amount)
    )
    .map(r => r.id)
})

const pendingIds = computed(() => {
  return props.selectedRows
    .filter(r => r.status === AfterSaleStatusEnum.PENDING.value)
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

const handleBatchApprove = async () => {
  if (approveableCount.value === 0) {
    if (largeAmountCount.value > 0 && pendingCount.value > 0) {
      ElMessage.warning('大额退款订单不支持批量审核通过，请单独处理')
    } else {
      ElMessage.warning('没有可审核通过的待审核订单')
    }
    return
  }

  const skipMsg = largeAmountCount.value > 0
    ? `\n（将自动跳过 ${largeAmountCount.value} 条大额退款订单）`
    : ''

  try {
    await ElMessageBox.confirm(
      `确认将 ${approveableCount.value} 条售后申请审核通过吗？${skipMsg}`,
      '批量审核通过',
      {
        confirmButtonText: '确认通过',
        cancelButtonText: '暂不处理',
        type: 'success',
        dangerouslyUseHTMLString: true
      }
    )
  } catch {
    return
  }

  approveLoading.value = true
  approveProcessed.value = 0
  approveProgress.value = 0

  try {
    const ids = approveableIds.value
    let intervalId = null
    const promise = new Promise((resolve) => {
      intervalId = simulateProgress(
        approveProcessed,
        approveProgress,
        ids.length,
        () => resolve()
      )
    })

    const apiPromise = batchApprove(ids)
    await Promise.all([promise, apiPromise])

    if (intervalId) clearInterval(intervalId)
    approveProgress.value = 100

    setTimeout(() => {
      ElMessage.success(`成功审核通过 ${ids.length} 条售后申请`)
      emit('action-success', 'approve')
      emit('clear-selection')
      approveLoading.value = false
    }, 300)
  } catch (err) {
    ElMessage.error(err.message || '批量审核失败')
    approveLoading.value = false
  }
}

const handleBatchReject = () => {
  if (pendingCount.value === 0) {
    ElMessage.warning('没有可驳回的待审核订单')
    return
  }
  rejectForm.rejectReason = ''
  rejectDialogVisible.value = true
}

const submitBatchReject = async () => {
  if (!rejectFormRef.value) return
  try {
    await rejectFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单填写')
    return
  }

  rejectLoading.value = true
  rejectProcessed.value = 0
  rejectProgress.value = 0

  try {
    const ids = pendingIds.value
    let intervalId = null
    const promise = new Promise((resolve) => {
      intervalId = simulateProgress(
        rejectProcessed,
        rejectProgress,
        ids.length,
        () => resolve()
      )
    })

    const apiPromise = batchReject(ids, rejectForm.rejectReason)
    await Promise.all([promise, apiPromise])

    if (intervalId) clearInterval(intervalId)
    rejectProgress.value = 100

    setTimeout(() => {
      ElMessage.success(`成功驳回 ${ids.length} 条售后申请`)
      rejectDialogVisible.value = false
      emit('action-success', 'reject')
      emit('clear-selection')
      rejectLoading.value = false
    }, 300)
  } catch (err) {
    ElMessage.error(err.message || '批量驳回失败')
    rejectLoading.value = false
  }
}

const handleBatchPostpone = () => {
  if (pendingCount.value === 0) {
    ElMessage.warning('没有可暂缓的待审核订单')
    return
  }
  postponeForm.remark = ''
  postponeDialogVisible.value = true
}

const submitBatchPostpone = async () => {
  if (!postponeFormRef.value) return
  try {
    await postponeFormRef.value.validate()
  } catch {
    ElMessage.warning('请检查表单填写')
    return
  }

  postponeLoading.value = true
  postponeProcessed.value = 0
  postponeProgress.value = 0

  try {
    const ids = pendingIds.value
    let intervalId = null
    const promise = new Promise((resolve) => {
      intervalId = simulateProgress(
        postponeProcessed,
        postponeProgress,
        ids.length,
        () => resolve()
      )
    })

    const apiPromise = batchPostpone(ids, postponeForm.remark)
    await Promise.all([promise, apiPromise])

    if (intervalId) clearInterval(intervalId)
    postponeProgress.value = 100

    setTimeout(() => {
      ElMessage.success(`成功暂缓 ${ids.length} 条售后申请`)
      postponeDialogVisible.value = false
      emit('action-success', 'postpone')
      emit('clear-selection')
      postponeLoading.value = false
    }, 300)
  } catch (err) {
    ElMessage.error(err.message || '批量暂缓失败')
    postponeLoading.value = false
  }
}

const handleClearSelection = () => {
  emit('clear-selection')
}
</script>

<style lang="scss" scoped>
.after-sale-batch-toolbar {
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

      .refund-large-tag {
        margin-left: 16px;
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

.btn-with-progress {
  position: relative;
  overflow: hidden;

  .progress-bar-inside {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.25);
    transition: width 0.2s ease;
    pointer-events: none;
  }
}

@keyframes pulseWarn {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
