<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="批量调拨"
    width="500px"
    :close-on-click-modal="false"
    class="zoom-dialog"
  >
    <div class="selected-info">
      <el-alert :title="`已选择 ${inventoryIds.length} 条库存记录`" type="info" :closable="false" show-icon />
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="margin-top: 16px">
      <el-form-item label="目标仓储位置" prop="target_location">
        <el-select v-model="form.target_location" style="width: 100%">
          <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
        </el-select>
      </el-form-item>
      <el-form-item label="目标库区" prop="target_zone">
        <el-input v-model="form.target_zone" placeholder="请输入目标库区" />
      </el-form-item>
      <el-form-item label="调拨原因" prop="reason">
        <el-input v-model="form.reason" type="textarea" :rows="2" placeholder="请输入调拨原因" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading" class="ripple-btn">确认调拨</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { batchTransfer } from '@/api/warehouseInventoryBatch'

const props = defineProps<{
  visible: boolean
  inventoryIds: number[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', data: any): void
}>()

const locationOptions = ['A仓-1区', 'A仓-2区', 'B仓-1区', 'B仓-2区', 'C仓-1区']
const formRef = ref()
const loading = ref(false)

const form = reactive({
  target_location: '',
  target_zone: '',
  reason: '',
})

const rules = {
  target_location: [{ required: true, message: '请选择目标仓储位置', trigger: 'change' }],
}

watch(() => props.visible, (val) => {
  if (val) {
    form.target_location = ''
    form.target_zone = ''
    form.reason = ''
  }
})

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch { return }

  loading.value = true
  try {
    const res = await batchTransfer({
      inventory_ids: props.inventoryIds,
      target_location: form.target_location,
      target_zone: form.target_zone,
      reason: form.reason,
    })
    const data = res.data?.data
    if (data) {
      ElMessage.success(`批量调拨完成：成功${data.success}条，失败${data.failed}条`)
      emit('submit', data)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '调拨失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.selected-info {
  margin-bottom: 8px;
}

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
