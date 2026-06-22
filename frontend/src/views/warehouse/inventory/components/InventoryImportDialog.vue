<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="导入盘点数据"
    width="600px"
    :close-on-click-modal="false"
    class="zoom-dialog"
  >
    <el-form label-width="100px">
      <el-form-item label="容错匹配率">
        <el-slider v-model="toleranceRate" :min="0" :max="50" :step="5" :format-tooltip="v => `${v}%`" style="width: 300px" />
        <span style="margin-left: 10px; color: #909399; font-size: 12px">编码部分匹配时自动关联</span>
      </el-form-item>
    </el-form>

    <div class="import-area">
      <el-table :data="importData" border size="small" max-height="320">
        <el-table-column prop="goods_code" label="商品编码" min-width="120">
          <template #default="{ row, $index }">
            <el-input v-model="row.goods_code" size="small" placeholder="编码" />
          </template>
        </el-table-column>
        <el-table-column prop="batch_no" label="批次号" min-width="120">
          <template #default="{ row }">
            <el-input v-model="row.batch_no" size="small" placeholder="批次号" />
          </template>
        </el-table-column>
        <el-table-column prop="warehouse_location" label="仓储位置" min-width="110">
          <template #default="{ row }">
            <el-select v-model="row.warehouse_location" size="small" style="width: 100%">
              <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="actual_quantity" label="实际数量" min-width="100">
          <template #default="{ row }">
            <el-input-number v-model="row.actual_quantity" size="small" :min="0" controls-position="right" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="60" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="importData.splice($index, 1)">删</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-button type="primary" link @click="addRow" style="margin-top: 8px">+ 添加行</el-button>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading" class="ripple-btn">确认导入</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { batchImportCount } from '@/api/warehouseInventoryBatch'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', data: any): void
}>()

const locationOptions = ['A仓-1区', 'A仓-2区', 'B仓-1区', 'B仓-2区', 'C仓-1区']
const loading = ref(false)
const toleranceRate = ref(10)

const importData = ref<Array<{
  goods_code: string
  batch_no: string
  warehouse_location: string
  actual_quantity: number
}>>([])

const addRow = () => {
  importData.value.push({
    goods_code: '',
    batch_no: '',
    warehouse_location: '',
    actual_quantity: 0,
  })
}

watch(() => props.visible, (val) => {
  if (val) {
    importData.value = [{
      goods_code: '',
      batch_no: '',
      warehouse_location: '',
      actual_quantity: 0,
    }]
  }
})

const handleSubmit = async () => {
  const validData = importData.value.filter(r => r.goods_code && r.batch_no && r.warehouse_location)
  if (validData.length === 0) {
    ElMessage.warning('请至少填写一条有效数据')
    return
  }

  loading.value = true
  try {
    const res = await batchImportCount({
      data_list: validData,
      tolerance_rate: toleranceRate.value / 100,
    })
    const data = res.data?.data
    if (data) {
      ElMessage.success(
        `导入完成：成功${data.success}条，失败${data.failed}条` +
        (data.fuzzy_matched > 0 ? `，模糊匹配${data.fuzzy_matched}条` : '')
      )
      emit('submit', data)
    }
  } catch (e: any) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.import-area {
  margin-top: 8px;
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
