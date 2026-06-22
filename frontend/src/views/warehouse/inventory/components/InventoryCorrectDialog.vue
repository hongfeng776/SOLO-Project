<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="库存修正"
    width="560px"
    :close-on-click-modal="false"
    class="zoom-dialog"
  >
    <div v-if="inventory" class="correct-info">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="商品名称">{{ inventory.goods_name }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ inventory.batch_no }}</el-descriptions-item>
        <el-descriptions-item label="系统库存">{{ formatThousand(inventory.system_quantity) }}</el-descriptions-item>
        <el-descriptions-item label="实际库存">{{ formatThousand(inventory.actual_quantity) }}</el-descriptions-item>
        <el-descriptions-item label="差异数量">
          <span :style="{ color: inventory.diff_quantity > 0 ? '#67c23a' : inventory.diff_quantity < 0 ? '#f56c6c' : '#909399' }">
            {{ inventory.diff_quantity > 0 ? '+' : '' }}{{ formatThousand(inventory.diff_quantity) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="当前库存类型">
          <el-tag :type="getInventoryTypeTag(inventory.inventory_type)" size="small">
            {{ getInventoryTypeLabel(inventory.inventory_type) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" style="margin-top: 16px">
      <el-form-item label="修正后数量" prop="correct_quantity">
        <el-input-number v-model="form.correct_quantity" :min="0" :max="999999" style="width: 100%" />
      </el-form-item>
      <el-form-item label="库存类型" prop="inventory_type">
        <el-select v-model="form.inventory_type" style="width: 100%">
          <el-option v-for="(v, k) in InventoryTypeMap" :key="k" :label="v.label" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.inventory_type === 2" label="损耗原因" prop="loss_reason">
        <el-input v-model="form.loss_reason" placeholder="请输入损耗原因" />
      </el-form-item>
      <el-form-item v-if="form.inventory_type === 3" label="异常原因" prop="abnormal_reason">
        <el-input v-model="form.abnormal_reason" placeholder="请输入异常原因" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <div class="sync-hint">
      <el-alert title="修正后将联动同步：前台商品库存、商家库存台账、物流备货数据" type="info" :closable="false" show-icon />
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading" class="ripple-btn">确认修正</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { executeCorrection } from '@/api/warehouseInventoryCount'
import { InventoryTypeMap } from '@/types/business'

const props = defineProps<{
  visible: boolean
  inventory: any
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', data: any): void
}>()

const formRef = ref()
const loading = ref(false)

const form = reactive({
  correct_quantity: 0,
  inventory_type: 1,
  loss_reason: '',
  abnormal_reason: '',
  remark: '',
})

const rules = {
  correct_quantity: [{ required: true, message: '请输入修正数量', trigger: 'blur' }],
  inventory_type: [{ required: true, message: '请选择库存类型', trigger: 'change' }],
}

const formatThousand = (val: number | undefined) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString('zh-CN')
}

const getInventoryTypeLabel = (type: number) => (InventoryTypeMap as any)[type]?.label || '未知'
const getInventoryTypeTag = (type: number) => (InventoryTypeMap as any)[type]?.type || 'info'

watch(() => props.visible, (val) => {
  if (val && props.inventory) {
    form.correct_quantity = props.inventory.system_quantity || 0
    form.inventory_type = props.inventory.inventory_type || 1
    form.loss_reason = ''
    form.abnormal_reason = ''
    form.remark = ''
  }
})

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch { return }

  if (!props.inventory) return

  try {
    await ElMessageBox.confirm(
      `确认修正库存数量为 ${form.correct_quantity.toLocaleString('zh-CN')}？修正后将联动同步多方数据`,
      '二次确认',
      { confirmButtonText: '确认修正', cancelButtonText: '取消', type: 'warning' }
    )
  } catch { return }

  loading.value = true
  try {
    const res = await executeCorrection({
      inventory_id: props.inventory.id,
      correct_quantity: form.correct_quantity,
      inventory_type: form.inventory_type,
      loss_reason: form.loss_reason,
      abnormal_reason: form.abnormal_reason,
      remark: form.remark,
    })
    const data = res.data?.data
    if (data?.success) {
      const syncInfo = data.sync_result
      const syncedParts = []
      if (syncInfo?.front_synced) syncedParts.push('前台')
      if (syncInfo?.merchant_synced) syncedParts.push('商家')
      if (syncInfo?.logistics_synced) syncedParts.push('物流')
      ElMessage.success(`修正完成，已同步：${syncedParts.join('、')}`)
      emit('submit', data)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '修正失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.sync-hint {
  margin-top: 12px;
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

.ripple-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease, opacity 0.4s ease;
  opacity: 0;
}

.ripple-btn:active::after {
  width: 200px;
  height: 200px;
  opacity: 1;
  transition: 0s;
}
</style>
