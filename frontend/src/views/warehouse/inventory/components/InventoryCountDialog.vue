<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="库存盘点"
    width="560px"
    :close-on-click-modal="false"
    class="zoom-dialog"
  >
    <div v-if="inventory" class="count-info">
      <el-descriptions :column="2" border size="small">
        <el-descriptions-item label="商品名称">{{ inventory.goods_name }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ inventory.goods_code }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ inventory.batch_no }}</el-descriptions-item>
        <el-descriptions-item label="仓储位置">{{ inventory.warehouse_location }}</el-descriptions-item>
        <el-descriptions-item label="系统库存">{{ formatThousand(inventory.system_quantity) }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag size="small" effect="plain">{{ getCountStatusLabel(inventory.count_status) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" style="margin-top: 16px">
      <el-form-item label="实际盘点数量" prop="actual_quantity">
        <el-input-number v-model="form.actual_quantity" :min="0" :max="999999" style="width: 100%" />
      </el-form-item>
      <el-form-item label="盘点类型" prop="count_type">
        <el-radio-group v-model="form.count_type">
          <el-radio value="partial">部分盘点</el-radio>
          <el-radio value="full">全量盘点</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading" class="ripple-btn">确认盘点</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { executeCount } from '@/api/warehouseInventoryCount'
import { CountStatusMap } from '@/types/business'

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
  actual_quantity: 0,
  count_type: 'partial',
  remark: '',
})

const rules = {
  actual_quantity: [{ required: true, message: '请输入盘点数量', trigger: 'blur' }],
  count_type: [{ required: true, message: '请选择盘点类型', trigger: 'change' }],
}

const formatThousand = (val: number | undefined) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString('zh-CN')
}

const getCountStatusLabel = (status: number) => {
  return (CountStatusMap as any)[status]?.label || '未知'
}

watch(() => props.visible, (val) => {
  if (val && props.inventory) {
    form.actual_quantity = props.inventory.system_quantity || 0
    form.count_type = 'partial'
    form.remark = ''
  }
})

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch { return }

  if (!props.inventory) return

  loading.value = true
  try {
    const res = await executeCount({
      inventory_ids: [props.inventory.id],
      actual_quantities: [form.actual_quantity],
      count_type: form.count_type as 'full' | 'partial',
      remark: form.remark,
    })
    const data = res.data?.data
    if (data?.success) {
      ElMessage.success('盘点执行完成')
      emit('submit', data)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '盘点失败')
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
