<template>
  <div class="page-container">
    <el-card shadow="never" class="mb16">
      <template #header>
        <div class="header-bar">
          <div>
            <h3>经营数据录入</h3>
            <el-tag type="warning" class="ml8" v-if="editMode">编辑模式</el-tag>
            <el-tag type="success" class="ml8" v-else>新建录入</el-tag>
          </div>
          <div class="header-right">
            <el-button @click="goBack">返回列表</el-button>
            <el-button type="warning" @click="handleAutoCalc" :loading="autoCalcLoading" :disabled="!canAutoCalc">
              <el-icon><Refresh /></el-icon>自动计算
            </el-button>
            <el-button type="primary" @click="handleSave" :loading="saving" :disabled="!canSave">保存提交</el-button>
          </div>
        </div>
      </template>

      <el-alert
        type="warning"
        :closable="false"
        show-icon
        title="权限提示：仅支持录入已完成结算的周期数据，录入后数据将进入校验流程"
        class="mb16" />

      <el-alert
        v-if="errors.length > 0"
        type="error"
        :closable="false"
        show-icon
        :title="`校验失败（共 ${errors.length} 项错误）`"
        class="mb16">
        <template #default>
          <ul>
            <li v-for="(e, i) in errors" :key="i">
              <el-tag type="danger" size="small" class="mr6">{{ getFieldLabel(e.field) }}</el-tag>
              {{ e.message }}
            </li>
          </ul>
        </template>
      </el-alert>

      <el-alert
        v-if="warnings.length > 0 && errors.length === 0"
        type="warning"
        :closable="false"
        show-icon
        :title="`合规风险提示（共 ${warnings.length} 项）`"
        class="mb16">
        <template #default>
          <ul>
            <li v-for="(w, i) in warnings" :key="i">
              <el-tag type="warning" size="small" class="mr6">{{ getFieldLabel(w.field) }}</el-tag>
              {{ w.message }}
            </li>
          </ul>
        </template>
      </el-alert>

      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px" label-position="right">
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="商家ID">
              <el-input v-model="formData.merchant_id" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="统计周期类型" prop="stat_period_type" :class="{ 'shake-error': fieldShake.stat_period_type }">
              <el-radio-group v-model="formData.stat_period_type" @change="onPeriodChange">
                <el-radio v-for="p in STAT_PERIOD_OPTIONS" :key="p.value" :label="p.value">{{ p.label }}</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="统计开始日期" prop="stat_start_date" :class="{ 'shake-error': fieldShake.stat_start_date }">
              <el-date-picker
                v-model="formData.stat_start_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择开始日期"
                style="width: 100%"
                @change="onDateChange" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="统计结束日期" prop="stat_end_date" :class="{ 'shake-error': fieldShake.stat_end_date }">
              <el-date-picker
                v-model="formData.stat_end_date"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="选择结束日期"
                style="width: 100%"
                @change="onDateChange" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">核心经营指标</el-divider>
        <el-row :gutter="24">
          <el-col :span="8" v-for="field in editableFields" :key="field.value">
            <el-form-item
              :label="field.label"
              :prop="field.value"
              :class="{ 'shake-error': fieldShake[field.value] }">
              <el-input-number
                v-model="(formData as any)[field.value]"
                :min="0"
                :precision="field.unit === '元' ? 2 : 0"
                :controls="false"
                size="default"
                style="width: 100%"
                :class="{ 'error-input': fieldErrors[field.value] }"
                @blur="() => onFieldBlur(field.value)"
                @change="() => onFieldChange(field.value)" />
              <span class="unit-text ml6">{{ field.unit }}</span>
              <div class="error-text" v-if="fieldErrors[field.value]">{{ fieldErrors[field.value] }}</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">自动计算字段</el-divider>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="客单价 (avg_order_amount)">
              <el-input v-model="computedFields.avg_order_amount" disabled>
                <template #append>元</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="好评率 (positive_review_rate)">
              <el-input v-model="computedFields.positive_review_rate" disabled>
                <template #append>%</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  validateBusinessOrder, validateBusinessSettlement, validateBusinessReview, validateBusinessPeriod,
  validateBusinessAll, autoCalculateBusiness, manualCreateBusiness, getBusinessDetail,
  STAT_PERIOD_OPTIONS, BUSINESS_FIELD_OPTIONS, type BusinessDataItem
} from '@/api/merchantBusiness'

const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const saving = ref(false)
const autoCalcLoading = ref(false)
const editMode = ref(false)
const existingId = ref<number>(0)

const editableFields = computed(() => BUSINESS_FIELD_OPTIONS.filter(f => !['avg_order_amount', 'positive_review_rate'].includes(f.value)))

const FIELD_LABEL_MAP: Record<string, string> = {}
BUSINESS_FIELD_OPTIONS.forEach(f => { FIELD_LABEL_MAP[f.value] = f.label })

const getFieldLabel = (field: string) => FIELD_LABEL_MAP[field] || field

const formData = reactive<any>({
  merchant_id: Number(route.query.merchant_id) || 0,
  stat_period_type: 3,
  stat_start_date: '',
  stat_end_date: '',
  order_count: 0,
  valid_order_count: 0,
  sales_amount: 0,
  valid_sales_amount: 0,
  settled_amount: 0,
  pending_settlement_amount: 0,
  refund_amount: 0,
  new_customer_order_count: 0,
  repeat_order_count: 0,
  positive_review_count: 0,
  negative_review_count: 0,
  total_review_count: 0,
})

const computedFields = reactive({
  avg_order_amount: '0.00',
  positive_review_rate: '0.00',
})

const fieldErrors = ref<Record<string, string>>({})
const fieldShake = ref<Record<string, boolean>>({})
const errors = ref<any[]>([])
const warnings = ref<any[]>([])

const formRules: FormRules = {
  stat_period_type: [{ required: true, message: '请选择统计周期类型', trigger: 'change' }],
  stat_start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  stat_end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
}

const canAutoCalc = computed(() => {
  return !!formData.merchant_id && !!formData.stat_start_date && !!formData.stat_end_date
})

const canSave = computed(() => {
  return !!formData.merchant_id && !!formData.stat_period_type && !!formData.stat_start_date && !!formData.stat_end_date
})

const recalcComputed = () => {
  const orderCount = Number(formData.valid_order_count || formData.order_count) || 0
  const sales = Number(formData.valid_sales_amount || formData.sales_amount) || 0
  computedFields.avg_order_amount = orderCount > 0 ? (sales / orderCount).toFixed(2) : '0.00'

  const total = Number(formData.total_review_count) || 0
  const positive = Number(formData.positive_review_count) || 0
  computedFields.positive_review_rate = total > 0 ? ((positive / total) * 100).toFixed(2) : '0.00'
}

const triggerShake = (field: string) => {
  fieldShake.value[field] = true
  setTimeout(() => { fieldShake.value[field] = false }, 600)
}

const onPeriodChange = () => {
  fillDateRangeByPeriod()
}

const fillDateRangeByPeriod = () => {
  if (!formData.stat_start_date) return
  const start = new Date(formData.stat_start_date)
  let end = new Date(start)
  switch (formData.stat_period_type) {
    case 1:
      end = new Date(start)
      break
    case 2:
      end.setDate(start.getDate() + 6)
      break
    case 3:
      end.setMonth(start.getMonth() + 1)
      end.setDate(end.getDate() - 1)
      break
    case 4:
      end.setMonth(start.getMonth() + 3)
      end.setDate(end.getDate() - 1)
      break
    case 5:
      end.setFullYear(start.getFullYear() + 1)
      end.setDate(end.getDate() - 1)
      break
  }
  formData.stat_end_date = end.toISOString().slice(0, 10)
}

const onDateChange = () => {
  validatePeriodField()
}

const validatePeriodField = async () => {
  if (!formData.merchant_id || !formData.stat_start_date || !formData.stat_end_date) return
  const res = await validateBusinessPeriod({
    merchant_id: formData.merchant_id,
    stat_period_type: formData.stat_period_type,
    stat_start_date: formData.stat_start_date,
    stat_end_date: formData.stat_end_date,
  })
  if (!res.data.data.valid) {
    fieldErrors.value.stat_start_date = res.data.data.message || '周期冲突或无效'
    fieldErrors.value.stat_end_date = res.data.data.message || '周期冲突或无效'
    triggerShake('stat_start_date')
    triggerShake('stat_end_date')
  } else {
    fieldErrors.value.stat_start_date = ''
    fieldErrors.value.stat_end_date = ''
  }
}

const onFieldBlur = async (field: string) => {
  const value = (formData as any)[field]
  if (value === null || value === undefined || value === '') return
  try {
    if (['order_count', 'valid_order_count'].includes(field)) {
      const res = await validateBusinessOrder({
        merchant_id: formData.merchant_id,
        stat_start_date: formData.stat_start_date,
        stat_end_date: formData.stat_end_date,
        order_count: Number(formData.order_count),
      })
      if (!res.data.data.valid) {
        fieldErrors.value[field] = res.data.data.message || '订单数据校验不通过'
        triggerShake(field)
      } else {
        fieldErrors.value[field] = ''
      }
    }
    if (['sales_amount', 'settled_amount', 'pending_settlement_amount', 'valid_sales_amount'].includes(field)) {
      const res = await validateBusinessSettlement({
        merchant_id: formData.merchant_id,
        stat_start_date: formData.stat_start_date,
        stat_end_date: formData.stat_end_date,
        sales_amount: Number(formData.sales_amount),
        settled_amount: Number(formData.settled_amount),
      })
      if (!res.data.data.valid) {
        fieldErrors.value[field] = res.data.data.message || '结算数据校验不通过'
        triggerShake(field)
      } else {
        fieldErrors.value[field] = ''
      }
    }
    if (['positive_review_count', 'negative_review_count', 'total_review_count'].includes(field)) {
      const res = await validateBusinessReview({
        merchant_id: formData.merchant_id,
        stat_start_date: formData.stat_start_date,
        stat_end_date: formData.stat_end_date,
        positive_review_count: Number(formData.positive_review_count),
        total_review_count: Number(formData.total_review_count),
      })
      if (!res.data.data.valid) {
        fieldErrors.value[field] = res.data.data.message || '评价数据校验不通过'
        triggerShake(field)
      } else {
        fieldErrors.value[field] = ''
      }
    }
  } catch {
    // ignore
  }
}

const onFieldChange = (_field: string) => {
  recalcComputed()
}

const handleAutoCalc = async () => {
  if (!canAutoCalc.value) {
    ElMessage.warning('请先选择商家和日期范围')
    return
  }
  autoCalcLoading.value = true
  try {
    const res = await autoCalculateBusiness({
      merchant_id: formData.merchant_id,
      stat_period_type: formData.stat_period_type,
      stat_start_date: formData.stat_start_date,
      stat_end_date: formData.stat_end_date,
    })
    if (res.data.data.calculated && res.data.data.data) {
      Object.keys(res.data.data.data).forEach(key => {
        if (key in formData) {
          (formData as any)[key] = (res.data.data as any).data[key]
        }
      })
      recalcComputed()
      if (res.data.data.warnings && res.data.data.warnings.length > 0) {
        ElMessage.warning(`自动计算完成，但有 ${res.data.data.warnings.length} 项警告，请检查`)
      } else {
        ElMessage.success('自动计算完成')
      }
    } else {
      ElMessage.info('暂无可自动计算的数据')
    }
  } finally {
    autoCalcLoading.value = false
  }
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  errors.value = []
  warnings.value = []

  const payload: any = { ...formData }
  const validateRes = await validateBusinessAll(payload)
  if (!validateRes.data.data.valid) {
    errors.value = validateRes.data.data.errors || []
    for (const err of errors.value) {
      fieldErrors.value[err.field] = err.message
      triggerShake(err.field)
    }
    ElMessage.error(`表单校验失败，共 ${errors.value.length} 项错误`)
    return
  }
  warnings.value = validateRes.data.data.warnings || []

  if (warnings.value.length > 0) {
    try {
      await ElMessageBox.confirm(
        `检测到 ${warnings.value.length} 项合规风险，是否仍提交？`,
        '合规风险提示',
        { type: 'warning', confirmButtonText: '确认提交', cancelButtonText: '取消' }
      )
    } catch {
      return
    }
  }

  saving.value = true
  try {
    const res = await manualCreateBusiness(payload)
    if (res.data.data.created) {
      ElMessage.success(res.data.data.message || '保存成功')
      setTimeout(() => goBack(), 500)
    } else {
      ElMessage.error(res.data.data.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push('/merchant/business')
}

const loadExisting = async (id: number) => {
  const res = await getBusinessDetail(id)
  const data = res.data.data
  if (data) {
    editMode.value = true
    existingId.value = id
    Object.keys(formData).forEach(key => {
      if (key in data) {
        (formData as any)[key] = (data as any)[key]
      }
    })
    recalcComputed()
  }
}

watch([() => formData.order_count, () => formData.valid_order_count, () => formData.sales_amount, () => formData.valid_sales_amount,
  () => formData.positive_review_count, () => formData.negative_review_count, () => formData.total_review_count], () => {
  recalcComputed()
})

onMounted(() => {
  if (route.query.id) {
    loadExisting(Number(route.query.id))
  }
  if (!formData.merchant_id && route.query.merchant_id) {
    formData.merchant_id = Number(route.query.merchant_id)
  }
})
</script>

<style scoped lang="scss">
.page-container { padding: 16px; }
.mb16 { margin-bottom: 16px; }
.ml6 { margin-left: 6px; }
.ml8 { margin-left: 8px; }
.header-bar { display: flex; align-items: center; justify-content: space-between; h3 { margin: 0; display: inline-block; } }
.header-right { display: flex; gap: 8px; }
.unit-text { color: var(--el-text-color-secondary); font-size: 13px; }
.error-input { :deep(.el-input-number__decrease, .el-input-number__increase, .el-input__wrapper) { border-color: var(--el-color-danger) !important; } }
.shake-error { animation: shake 0.4s ease-in-out 0s 2; }
.error-text { color: var(--el-color-danger); font-size: 12px; line-height: 1.5; margin-top: 4px; }
ul { padding-left: 18px; margin: 6px 0; }
li { line-height: 1.8; }
.mr6 { margin-right: 6px; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-5px); }
  40% { transform: translateX(5px); }
  60% { transform: translateX(-5px); }
  80% { transform: translateX(5px); }
}
</style>
