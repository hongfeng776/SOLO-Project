<template>
  <div class="fulfillment-batch-toolbar">
    <div class="selected-info">
      <el-icon><Select /></el-icon>
      已选 <b>{{ selectedCount }}</b> 条
    </div>

    <el-divider direction="vertical" />

    <el-button-group v-if="status === 'pending'">
      <el-tooltip content="批量标记为过期作废（适用于超时间票）">
        <el-button type="warning" :icon="Clock" :loading="batchLoading" :disabled="!canBatchExpired" @click="confirmBatch('mark_expired')" v-ripple>
          批量标记过期
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-button-group v-if="status === 'abnormal'">
      <el-tooltip content="批量标记为异常（添加异常标签）">
        <el-button type="danger" plain :icon="WarningFilled" :loading="batchLoading" @click="confirmBatch('mark_abnormal')" v-ripple>
          批量标记异常
        </el-button>
      </el-tooltip>
      <el-tooltip content="批量处理异常，修正状态并关闭异常">
        <el-button type="primary" plain :icon="Tools" :loading="batchLoading" @click="confirmBatch('handle_abnormal')" v-ripple>
          批量处理异常
        </el-button>
      </el-tooltip>
      <el-tooltip content="批量强制作废（谨慎使用）">
        <el-button type="danger" :icon="CircleCloseFilled" :loading="batchLoading" @click="confirmBatch('force_void')" v-ripple>
          批量强制作废
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-tooltip content="批量同步核销数据至订单/库存/台账">
      <el-button :icon="Refresh" :loading="batchLoading" @click="confirmBatch('sync_fulfillment')" v-ripple>
        批量同步数据
      </el-button>
    </el-tooltip>

    <div v-if="progressPct > 0" class="progress-wrap">
      <div class="bar-bg"><div class="bar-inner" :style="{ width: progressPct + '%' }"></div></div>
      <div class="bar-text">
        进度 {{ progressPct }}% · 已处理 {{ processedCount }} / {{ selectedCount }}
        <span v-if="batchFailCount > 0" style="color: #ff4d4f;">，失败 {{ batchFailCount }} 条</span>
      </div>
    </div>

    <el-divider direction="vertical" />

    <el-button :icon="Close" plain @click="clearSelection" v-ripple>清除</el-button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  Select, Clock, WarningFilled, Tools, CircleCloseFilled, Refresh, Close
} from '@element-plus/icons-vue'
import { batchFulfillmentOperation } from '@/api/ticketFulfillment'
import { FulfillBatchOperationEnum } from '@/utils/enums'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedCount: { type: Number, default: 0 },
  status: { type: String, default: 'pending' }
})
const emit = defineEmits(['success', 'refresh'])

const batchLoading = ref(false)
const progressPct = ref(0)
const processedCount = ref(0)
const batchFailCount = ref(0)
let progressTimer = null

const canBatchExpired = computed(() => props.status === 'pending')

const opLabelMap = {
  mark_expired: '批量标记过期',
  mark_abnormal: '批量标记异常',
  handle_abnormal: '批量处理异常',
  sync_fulfillment: '批量同步核销数据',
  force_void: '批量强制作废'
}

const confirmBatch = async (opType) => {
  try {
    const op = FulfillBatchOperationEnum[opType]
    const label = opLabelMap[opType] || opType
    const tip = opType === 'force_void'
      ? `【高危操作】将对 ${props.selectedCount} 条票务执行强制作废，此操作不可撤销！\n确定继续吗？`
      : `确定${label}吗？共 ${props.selectedCount} 条记录。\n${opType.includes('sync') ? '将联动更新订单状态、库存记录、景点入园台账。' : '操作后数据状态将同步变更。'}`

    await ElMessageBox.confirm(tip, label, {
      type: opType === 'force_void' ? 'error' : 'warning',
      confirmButtonText: '确定执行',
      cancelButtonText: '取消',
      customClass: 'ff-batch-confirm'
    })

    startProgress()
    const r = await batchFulfillmentOperation({
      operationType: opType,
      ids: props.selectedIds,
      reason: `${label} - 批量操作`
    })
    stopProgress(true)

    const d = r.data || {}
    if (d.success !== false) {
      ElMessage.success(`${label}完成：成功 ${d.successCount || props.selectedCount} 条，失败 ${d.failCount || 0} 条`)
      emit('success')
    } else {
      ElMessage.error(`操作失败：${d.message || '未知错误'}`)
    }
    emit('refresh')
  } catch (e) {
    stopProgress(false)
    if (e !== 'cancel') {
      ElMessage.error(e.message || '批量操作失败')
    }
  }
}

const startProgress = () => {
  batchLoading.value = true
  progressPct.value = 0
  processedCount.value = 0
  batchFailCount.value = 0
  if (progressTimer) clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    if (progressPct.value < 90) {
      const inc = Math.min(10, Math.random() * 8 + 3)
      progressPct.value = Math.min(90, progressPct.value + inc)
      processedCount.value = Math.floor(props.selectedCount * (progressPct.value / 100))
    }
  }, 250)
}

const stopProgress = (completeSuccess) => {
  if (progressTimer) { clearInterval(progressTimer); progressTimer = null }
  progressPct.value = completeSuccess ? 100 : Math.max(progressPct.value, 55)
  processedCount.value = props.selectedCount
  if (!completeSuccess) batchFailCount.value = 1
  setTimeout(() => {
    batchLoading.value = false
  }, 400)
}

const clearSelection = () => {
  emit('success')
}

watch(() => props.selectedIds, () => {
  progressPct.value = 0
  processedCount.value = 0
  batchFailCount.value = 0
}, { deep: true })
</script>
