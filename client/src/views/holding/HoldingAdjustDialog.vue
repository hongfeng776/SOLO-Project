<template>
  <FinDialog
    v-model:visible="visible"
    title="持仓调整"
    width="600px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div v-if="holding" class="adjust-info">
      <el-descriptions :column="2" border size="small" class="holding-info">
        <el-descriptions-item label="客户">{{ holding.customerName }}</el-descriptions-item>
        <el-descriptions-item label="股票">{{ holding.stockCode }} {{ holding.stockName }}</el-descriptions-item>
        <el-descriptions-item label="当前持仓数量">
          <span class="highlight-number">{{ formatInteger(holding.totalQuantity) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="当前成本价">
          <span class="highlight-number">{{ formatMoney(holding.costPrice) }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px" class="adjust-form">
      <el-form-item label="调整类型" prop="adjustType">
        <el-radio-group v-model="formData.adjustType" @change="handleAdjustTypeChange">
          <el-radio value="quantity">调整数量</el-radio>
          <el-radio value="cost_price">调整成本价</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="formData.adjustType === 'quantity'"
        label="新持仓数量"
        prop="newQuantity"
      >
        <el-input-number
          v-model="formData.newQuantity"
          :min="0"
          :step="100"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item
        v-if="formData.adjustType === 'cost_price'"
        label="新成本价"
        prop="newCostPrice"
      >
        <el-input-number
          v-model="formData.newCostPrice"
          :min="0.01"
          :precision="4"
          :step="0.1"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="调整原因" prop="reason">
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="3"
          placeholder="请输入调整原因"
        />
      </el-form-item>
    </el-form>

    <div v-if="changePreview" class="change-preview">
      <el-alert title="数据变更预览" type="info" :closable="false" show-icon />
      <el-descriptions :column="2" border size="small" class="preview-desc">
        <el-descriptions-item
          v-for="field in changePreview.fields"
          :key="field"
          :label="getFieldLabel(field)"
        >
          <span class="before-value">{{ formatFieldValue(field, changePreview.before[field]) }}</span>
          <el-icon class="arrow-icon"><Right /></el-icon>
          <span class="after-value">{{ formatFieldValue(field, changePreview.after[field]) }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="submitting"
        class="ripple-btn"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '确认调整' }}
      </el-button>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Right } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { formatMoney, formatNumber } from '@/utils/format'
import * as holdingApi from '@/api/holding'
import type { ICustomerHolding } from '@/types/api'

interface Props {
  visible: boolean
  holding: ICustomerHolding | null
}

const props = withDefaults(defineProps<Props>(), {
  holding: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formData = ref({
  holdingId: 0,
  adjustType: 'quantity' as 'quantity' | 'cost_price',
  newQuantity: 0,
  newCostPrice: 0,
  reason: '',
})

const formRules = computed<FormRules>(() => ({
  adjustType: [{ required: true, message: '请选择调整类型', trigger: 'change' }],
  newQuantity: formData.value.adjustType === 'quantity'
    ? [{ required: true, message: '请输入新持仓数量', trigger: 'change' }]
    : [],
  newCostPrice: formData.value.adjustType === 'cost_price'
    ? [{ required: true, message: '请输入新成本价', trigger: 'change' }]
    : [],
  reason: [{ required: true, message: '请输入调整原因', trigger: 'blur' }],
}))

const FIELD_LABEL_MAP: Record<string, string> = {
  total_quantity: '持仓数量',
  available_quantity: '可用数量',
  cost_price: '成本价',
  total_cost: '总成本',
  market_value: '市值',
  floating_profit: '浮动盈亏',
}

const changePreview = computed(() => {
  if (!props.holding) return null
  const h = props.holding
  const fields: string[] = []
  const before: Record<string, any> = {}
  const after: Record<string, any> = {}

  if (formData.value.adjustType === 'quantity' && formData.value.newQuantity !== h.totalQuantity) {
    const diff = formData.value.newQuantity - h.totalQuantity
    fields.push('total_quantity', 'available_quantity')
    before.total_quantity = h.totalQuantity
    after.total_quantity = formData.value.newQuantity
    before.available_quantity = h.availableQuantity
    after.available_quantity = h.availableQuantity + diff
  }

  if (formData.value.adjustType === 'cost_price' && formData.value.newCostPrice !== h.costPrice) {
    fields.push('cost_price', 'total_cost')
    before.cost_price = h.costPrice
    after.cost_price = formData.value.newCostPrice
    before.total_cost = h.totalCost
    after.total_cost = Number((formData.value.newCostPrice * h.totalQuantity).toFixed(2))
  }

  if (fields.length === 0) return null
  return { fields, before, after }
})

function formatInteger(value: number): string {
  return Number(value || 0).toLocaleString()
}

function getFieldLabel(field: string): string {
  return FIELD_LABEL_MAP[field] || field
}

function formatFieldValue(field: string, value: any): string {
  if (value === undefined || value === null) return '-'
  if (field === 'cost_price') return formatMoney(value)
  if (field === 'total_cost' || field === 'market_value' || field === 'floating_profit') return formatMoney(value)
  return Number(value).toLocaleString()
}

function handleAdjustTypeChange() {
  if (props.holding) {
    formData.value.newQuantity = props.holding.totalQuantity
    formData.value.newCostPrice = props.holding.costPrice
  }
}

function handleClosed() {
  formData.value = {
    holdingId: 0,
    adjustType: 'quantity',
    newQuantity: 0,
    newCostPrice: 0,
    reason: '',
  }
  formRef.value?.clearValidate()
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.holding) {
      formData.value = {
        holdingId: props.holding.id,
        adjustType: 'quantity',
        newQuantity: props.holding.totalQuantity,
        newCostPrice: props.holding.costPrice,
        reason: '',
      }
    }
  },
)

async function handleSubmit() {
  if (submitting.value) return

  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  submitting.value = true
  try {
    const res = await holdingApi.adjustHolding({
      holdingId: formData.value.holdingId,
      adjustType: formData.value.adjustType,
      newQuantity: formData.value.adjustType === 'quantity' ? formData.value.newQuantity : undefined,
      newCostPrice: formData.value.adjustType === 'cost_price' ? formData.value.newCostPrice : undefined,
      reason: formData.value.reason,
    })
    if (res.code === 0) {
      ElMessage.success('持仓调整成功')
      emit('success')
      visible.value = false
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.adjust-info {
  margin-bottom: 20px;
}

.adjust-form {
  margin-top: 16px;
}

.change-preview {
  margin-top: 20px;

  .el-alert {
    margin-bottom: 12px;
  }

  .preview-desc {
    .before-value {
      color: #909399;
      text-decoration: line-through;
    }

    .arrow-icon {
      margin: 0 8px;
      color: #409eff;
    }

    .after-value {
      color: #409eff;
      font-weight: 600;
    }
  }
}

.highlight-number {
  color: #409eff;
  font-weight: 600;
  font-family: 'DIN Alternate', 'Helvetica Neue', Arial, sans-serif;
}

.ripple-btn {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.4s ease, height 0.4s ease;
  }

  &:active::after {
    width: 200px;
    height: 200px;
  }
}
</style>
