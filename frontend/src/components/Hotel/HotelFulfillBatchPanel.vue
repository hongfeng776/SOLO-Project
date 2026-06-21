<template>
  <div v-if="selectedIds.length > 0" class="batch-toolbar">
    <div class="toolbar-left">
      <span class="selected-count">已选中 {{ selectedIds.length }} 条履约</span>
      <el-tag v-if="exclusiveCount > 0" type="warning" effect="dark" class="suite-warn">
        含 {{ exclusiveCount }} 条套房订单（批量核验将被排除）
      </el-tag>
    </div>
    <div class="toolbar-right">
      <el-button
        v-for="(op, key) in HotelFulfillmentBatchOperationEnum"
        :key="key"
        :type="op.color === '#52c41a' ? 'success' : op.color === '#ff4d4f' ? 'danger' : 'warning'"
        v-ripple
        :disabled="key === 'batch_verify' && exclusiveCount === selectedIds.length"
        @click="openBatch(key, op)"
      >
        <el-icon style="margin-right:4px">
          <component :is="op.icon" />
        </el-icon>
        {{ op.label }}
      </el-button>
      <el-button @click="$emit('clear-selection')">清空选择</el-button>
    </div>

    <div v-if="progressVisible" class="batch-progress-overlay" @click.self>
      <div class="progress-box">
        <template v-if="batchSuccess">
          <div class="batch-check-icon">
            <el-icon :size="56" color="#52c41a"><CircleCheckFilled /></el-icon>
          </div>
          <div class="progress-title" style="text-align:center;color:#52c41a">批量操作完成</div>
          <div class="progress-detail" style="text-align:center">
            <div class="detail-success">成功：{{ progressSuccess }}</div>
            <div v-if="progressFailed > 0" class="detail-failed">失败：{{ progressFailed }}</div>
          </div>
        </template>
        <template v-else>
          <div class="progress-title">批量操作执行中...</div>
          <el-progress
            :percentage="progressPercent"
            :stroke-width="14"
            status-icon
            :status="progressPercent === 100 ? 'success' : ''"
          />
          <div class="progress-value">{{ progressPercent }}%</div>
          <div class="progress-detail">
            <div>执行总数：<b>{{ selectedIds.length }}</b></div>
            <div class="detail-success">成功：<b>{{ progressSuccess }}</b></div>
            <div class="detail-failed">失败：<b>{{ progressFailed }}</b></div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CircleCheckFilled } from '@element-plus/icons-vue'
import { HotelFulfillmentBatchOperationEnum } from '@/utils/enums'
import { batchHotelFulfillmentOperation } from '@/api/hotel'

const props = defineProps({
  selectedIds: { type: Array, default: () => [] },
  selectedRows: { type: Array, default: () => [] }
})
const emit = defineEmits(['success', 'clear-selection'])

const exclusiveCount = computed(() =>
  props.selectedRows.filter(r => r.isSuite).length
)

const progressVisible = ref(false)
const progressPercent = ref(0)
const progressSuccess = ref(0)
const progressFailed = ref(0)
const batchSuccess = ref(false)

const openBatch = (key, op) => {
  if (key === 'batch_verify' && exclusiveCount.value > 0) {
    ElMessageBox.confirm(
      `选中订单中含 ${exclusiveCount.value} 条套房订单，套房订单将被排除在批量核验之外。是否继续？`,
      '套房订单提示',
      {
        confirmButtonText: '继续执行',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      promptReason(key, op)
    }).catch(() => {})
    return
  }
  promptReason(key, op)
}

const promptReason = (key, op) => {
  const typeMap = {
    batch_verify: 'info',
    batch_noshow: 'warning',
    batch_delay: 'warning'
  }
  ElMessageBox.prompt(
    `确认对选中的 ${props.selectedIds.length} 条履约执行「${op.label}」操作`,
    '批量操作确认',
    {
      confirmButtonText: '确认执行',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入操作原因',
      inputValidator: (v) => !!v?.trim() || '请输入操作原因',
      type: typeMap[key] || 'info'
    }
  ).then(async ({ value }) => {
    await confirmBatch(key, value)
  }).catch(() => {})
}

const confirmBatch = async (operation, reason) => {
  progressVisible.value = true
  progressPercent.value = 0
  progressSuccess.value = 0
  progressFailed.value = 0
  batchSuccess.value = false

  const tick = () => {
    if (progressPercent.value < 88) progressPercent.value += Math.floor(Math.random() * 14) + 4
  }
  const timer = setInterval(tick, 320)

  try {
    const params = {
      operation,
      ids: props.selectedIds,
      reason
    }
    const res = await batchHotelFulfillmentOperation(params)
    clearInterval(timer)
    progressPercent.value = 100
    progressSuccess.value = res?.data?.success || 0
    progressFailed.value = res?.data?.failed || 0

    batchSuccess.value = true
    ElMessage.success(`批量操作完成：成功${progressSuccess.value}，失败${progressFailed.value}`)
    setTimeout(() => {
      batchSuccess.value = false
      progressVisible.value = false
      emit('success', res?.data)
      emit('clear-selection')
    }, 1500)
  } catch (e) {
    clearInterval(timer)
    progressPercent.value = 100
    progressFailed.value = props.selectedIds.length
    ElMessage.error(e.message || '批量操作失败')
    setTimeout(() => {
      batchSuccess.value = false
      progressVisible.value = false
    }, 1200)
  }
}
</script>

<script>
import ripple from '@/utils/ripple'
export default { directives: { ripple } }
</script>

<style lang="scss" scoped>
@import '@/styles/hotel-fulfillment.scss';

@keyframes batchCheckPop {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.15);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.batch-check-icon {
  text-align: center;
  margin-bottom: 12px;
  animation: batchCheckPop 0.6s ease-out;
}
</style>
