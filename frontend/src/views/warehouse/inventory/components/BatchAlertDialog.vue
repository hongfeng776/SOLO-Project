<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="批量低库存预警"
    width="440px"
    :close-on-click-modal="false"
    class="zoom-dialog"
  >
    <div class="selected-info">
      <el-alert :title="`已选择 ${inventoryIds.length} 条库存记录`" type="info" :closable="false" show-icon />
    </div>

    <el-form label-width="100px" style="margin-top: 16px">
      <el-form-item label="预警阈值">
        <el-input-number v-model="threshold" :min="1" :max="99999" style="width: 200px" />
        <span style="margin-left: 8px; color: #909399; font-size: 12px">低于此值触发预警</span>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading" class="ripple-btn">确认设置</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { batchLowStockAlert } from '@/api/warehouseInventoryBatch'

const props = defineProps<{
  visible: boolean
  inventoryIds: number[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', data: any): void
}>()

const loading = ref(false)
const threshold = ref(10)

watch(() => props.visible, (val) => {
  if (val) {
    threshold.value = 10
  }
})

const handleSubmit = async () => {
  loading.value = true
  try {
    const res = await batchLowStockAlert({
      inventory_ids: props.inventoryIds,
      threshold: threshold.value,
    })
    const data = res.data?.data
    if (data) {
      ElMessage.success(`预警设置完成：成功${data.success}条，触发预警${data.alert_count}条`)
      emit('submit', data)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '设置失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.zoom-dialog {
  :deep(.el-dialog) {
    animation: zoomIn 0.3s ease;
  }
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-btn:active::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  animation: ripple 0.4s ease;
}

@keyframes ripple {
  from { width: 0; height: 0; opacity: 1; }
  to { width: 200px; height: 200px; opacity: 0; }
}
</style>
