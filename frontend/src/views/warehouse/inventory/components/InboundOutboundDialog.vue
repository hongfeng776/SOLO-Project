<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    :title="mode === 'inbound' ? '入库操作' : '出库操作'"
    width="640px"
    :close-on-click-modal="false"
    class="zoom-dialog"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="商品编码" prop="goods_code">
            <el-input v-model="form.goods_code" placeholder="请输入商品编码" :class="{ 'shake-input': errors.goods_code }" @input="clearError('goods_code')" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商品名称" prop="goods_name">
            <el-input v-model="form.goods_name" placeholder="请输入商品名称" :class="{ 'shake-input': errors.goods_name }" @input="clearError('goods_name')" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="商品规格" prop="goods_spec">
            <el-input v-model="form.goods_spec" placeholder="请输入规格" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="批次号" prop="batch_no">
            <el-input v-model="form.batch_no" placeholder="请输入批次号" :class="{ 'shake-input': errors.batch_no }" @input="clearError('batch_no')" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="mode === 'inbound' ? '入库类型' : '出库类型'" prop="type">
            <el-select v-model="form.type" :placeholder="'请选择'" style="width: 100%">
              <el-option v-for="(v, k) in typeOptions" :key="k" :label="v.label" :value="Number(k)" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="数量" prop="quantity">
            <el-input-number v-model="form.quantity" :min="1" :max="999999" style="width: 100%" :class="{ 'shake-input': errors.quantity }" @change="clearError('quantity')" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="仓储位置" prop="warehouse_location">
            <el-select v-model="form.warehouse_location" placeholder="请选择" style="width: 100%">
              <el-option v-for="loc in locationOptions" :key="loc" :label="loc" :value="loc" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="库区" prop="warehouse_zone">
            <el-input v-model="form.warehouse_zone" placeholder="请输入库区" />
          </el-form-item>
        </el-col>
      </el-row>
      <template v-if="mode === 'inbound'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单位成本">
              <el-input-number v-model="form.unit_cost" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产日期">
              <el-date-picker v-model="form.production_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="有效期至">
              <el-date-picker v-model="form.expiry_date" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="货架号">
              <el-input v-model="form.shelf_no" placeholder="请输入货架号" />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
      <template v-if="mode === 'outbound'">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="关联订单号">
              <el-input v-model="form.order_no" placeholder="请输入订单号" />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>

      <div v-if="validationErrors.length > 0" class="validation-errors">
        <div v-for="(err, idx) in validationErrors" :key="idx" class="error-item">
          <el-icon color="#f56c6c" size="14"><CircleCloseFilled /></el-icon>
          <span>{{ err.message }}</span>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading" class="ripple-btn">
        {{ mode === 'inbound' ? '确认入库' : '确认出库' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCloseFilled } from '@element-plus/icons-vue'
import { validateInbound, createInbound, validateOutbound, createOutbound } from '@/api/warehouseStockValidate'
import { InboundTypeMap, OutboundTypeMap } from '@/types/business'

const props = defineProps<{
  visible: boolean
  mode: 'inbound' | 'outbound'
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'submit', data: any): void
}>()

const typeOptions = computed(() => props.mode === 'inbound' ? InboundTypeMap : OutboundTypeMap)
const locationOptions = ['A仓-1区', 'A仓-2区', 'B仓-1区', 'B仓-2区', 'C仓-1区']

const formRef = ref()
const loading = ref(false)
const errors = reactive<Record<string, boolean>>({})
const validationErrors = ref<Array<{ field: string; message: string; severity: string }>>([])

const form = reactive({
  goods_id: 1,
  goods_code: '',
  goods_name: '',
  goods_spec: '',
  batch_no: '',
  type: 1,
  quantity: 1,
  warehouse_location: '',
  warehouse_zone: '',
  shelf_no: '',
  unit_cost: undefined as number | undefined,
  production_date: '',
  expiry_date: '',
  order_no: '',
  remark: '',
})

const rules = {
  goods_code: [{ required: true, message: '请输入商品编码', trigger: 'blur' }],
  goods_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  batch_no: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  warehouse_location: [{ required: true, message: '请选择仓储位置', trigger: 'change' }],
}

const clearError = (field: string) => {
  errors[field] = false
  validationErrors.value = validationErrors.value.filter(e => e.field !== field)
}

watch(() => props.visible, (val) => {
  if (val) {
    Object.assign(form, {
      goods_id: 1, goods_code: '', goods_name: '', goods_spec: '', batch_no: '',
      type: 1, quantity: 1, warehouse_location: '', warehouse_zone: '', shelf_no: '',
      unit_cost: undefined, production_date: '', expiry_date: '', order_no: '', remark: '',
    })
    validationErrors.value = []
    Object.keys(errors).forEach(k => errors[k] = false)
  }
})

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch { return }

  loading.value = true
  try {
    const validateFn = props.mode === 'inbound' ? validateInbound : validateOutbound
    const createFn = props.mode === 'inbound' ? createInbound : createOutbound

    const validateRes = await validateFn({ ...form })
    const validateData = validateRes.data?.data

    if (validateData && !validateData.valid) {
      validationErrors.value = validateData.errors || []
      validateData.errors.forEach((e: any) => { errors[e.field] = true })
      ElMessage.error('校验未通过，请检查错误项')
      loading.value = false
      return
    }

    const res = await createFn({ ...form })
    const data = res.data?.data
    if (data?.success !== false) {
      ElMessage.success(props.mode === 'inbound' ? '入库操作成功' : '出库操作成功')
      emit('submit', data)
    } else {
      if (data?.validation_result?.errors) {
        validationErrors.value = data.validation_result.errors
      }
      ElMessage.error(data?.message || '操作失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.validation-errors {
  padding: 12px;
  margin-top: 12px;
  background: #fef0f0;
  border-radius: 4px;
  border: 1px solid #fbc4c4;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #f56c6c;
}

.shake-input {
  :deep(.el-input__wrapper) {
    border-color: #f56c6c !important;
    animation: shake 0.4s ease;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
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

.zoom-dialog {
  :deep(.el-dialog) {
    animation: zoomIn 0.3s ease;
  }
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
</style>
