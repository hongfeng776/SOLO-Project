<template>
  <el-dialog
    :model-value="modelValue"
    :title="dialogTitle"
    width="800px"
    :close-on-click-modal="false"
    draggable
    @update:model-value="handleVisibleChange"
  >
    <el-alert
      v-if="editWarning"
      :title="editWarning"
      type="warning"
      show-icon
      class="mb-16"
      :closable="false"
    />

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="right"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="活动名称" prop="name">
            <el-input
              v-model="formData.name"
              placeholder="请输入活动名称"
              :disabled="isView || !permissions.canEditBasic"
              @blur="handleFieldValidate('name')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="活动类型" prop="type">
            <el-select
              v-model="formData.type"
              placeholder="请选择活动类型"
              style="width: 100%"
              :disabled="isView || !permissions.canEditBasic"
              @change="handleFieldValidate('type')"
            >
              <el-option label="优惠券" :value="1" />
              <el-option label="满减活动" :value="2" />
              <el-option label="秒杀活动" :value="3" />
              <el-option label="拼团活动" :value="4" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="请选择开始时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              :disabled="isView || !permissions.canEditTime"
              @change="handleFieldValidate('startTime')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="结束时间" prop="endTime">
            <el-date-picker
              v-model="formData.endTime"
              type="datetime"
              placeholder="请选择结束时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              :disabled="isView || !permissions.canEditTime"
              @change="handleFieldValidate('endTime')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="优惠类型" prop="discountType">
            <el-select
              v-model="formData.discountType"
              placeholder="请选择优惠类型"
              style="width: 100%"
              :disabled="isView || !permissions.canEditDiscount"
              @change="handleDiscountTypeChange"
            >
              <el-option label="满减" :value="1" />
              <el-option label="折扣" :value="2" />
              <el-option label="优惠券" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="使用门槛" prop="minAmount">
            <el-input-number
              v-model="formData.minAmount"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
              :disabled="isView || !permissions.canEditDiscount"
              @change="handleFieldValidate('minAmount')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item :label="discountValueLabel" prop="discountValue">
            <el-input-number
              v-model="formData.discountValue"
              :min="0"
              :max="formData.discountType === 2 ? 10 : undefined"
              :precision="formData.discountType === 2 ? 1 : 2"
              :step="formData.discountType === 2 ? 0.1 : 10"
              style="width: 100%"
              :disabled="isView || !permissions.canEditDiscount"
              @change="handleFieldValidate('discountValue')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最高优惠" prop="maxDiscount">
            <el-input-number
              v-model="formData.maxDiscount"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
              :disabled="isView || !permissions.canEditDiscount"
              @change="handleFieldValidate('maxDiscount')"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="发放数量" prop="totalCount">
            <el-input-number
              v-model="formData.totalCount"
              :min="0"
              :precision="0"
              style="width: 100%"
              :disabled="isView || !permissions.canEditBasic"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="每人限领" prop="perUserLimit">
            <el-input-number
              v-model="formData.perUserLimit"
              :min="1"
              :precision="0"
              style="width: 100%"
              :disabled="isView || !permissions.canEditBasic"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="适用类目" prop="categoryIds">
            <el-select
              v-model="categoryIdList"
              multiple
              filterable
              placeholder="请选择适用类目"
              style="width: 100%"
              :disabled="isView || !permissions.canEditCategories"
              @change="handleCategoryChange"
            >
              <el-option label="全品类" :value="0" />
              <el-option label="电子产品" :value="1" />
              <el-option label="服装鞋帽" :value="2" />
              <el-option label="食品饮料" :value="3" />
              <el-option label="家居用品" :value="4" />
              <el-option label="美妆个护" :value="5" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="参与商家" prop="merchantIds">
            <el-select
              v-model="merchantIdList"
              multiple
              filterable
              placeholder="请选择参与商家"
              style="width: 100%"
              :disabled="isView || !permissions.canEditMerchants"
              @change="handleMerchantChange"
            >
              <el-option label="全部商家" :value="0" />
              <el-option label="商家A" :value="1" />
              <el-option label="商家B" :value="2" />
              <el-option label="商家C" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="活动描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="请输入活动描述，超长内容将在列表页悬浮显示完整内容"
          :disabled="isView || !permissions.canEditBasic"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <el-alert
        v-if="validateResult && (validateResult.errors.length > 0 || validateResult.warnings.length > 0)"
        :title="validateResult.errors.length > 0 ? '校验不通过' : '校验提示'"
        :type="validateResult.errors.length > 0 ? 'error' : 'warning'"
        show-icon
        class="mt-16"
      >
        <div v-for="(err, idx) in validateResult.errors" :key="`err-${idx}`" class="validate-item error">
          <el-icon><CircleCloseFilled /></el-icon>
          <span>{{ err.message }}</span>
        </div>
        <div v-for="(warn, idx) in validateResult.warnings" :key="`warn-${idx}`" class="validate-item warning">
          <el-icon><WarningFilled /></el-icon>
          <span>{{ warn.message }}</span>
        </div>
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button
        v-if="!isView"
        type="primary"
        :loading="submitting"
        :disabled="!!(validateResult && validateResult.errors.length > 0)"
        @click="handleSubmit"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { CircleCloseFilled, WarningFilled } from '@element-plus/icons-vue'
import type { Marketing } from '@/types/business'
import {
  createMarketing,
  updateMarketing,
  validateCreateMarketing,
  validateEditMarketing,
  getEditPermissions,
  checkDuplicateConfig
} from '@/api/marketing'
import type { EditPermissions, MarketingValidateResult } from '@/types/business'
import { MarketingStatusMap } from '@/types/business'

interface Props {
  modelValue: boolean
  mode: 'add' | 'edit' | 'view'
  initialData?: Partial<Marketing>
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'add'
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const isDebouncing = ref(false)
const validateResult = ref<MarketingValidateResult | null>(null)
const duplicateCheckResult = ref<any>(null)

const formData = reactive<Partial<Marketing>>({
  name: '',
  type: 1,
  status: 0,
  startTime: '',
  endTime: '',
  discountType: 1,
  discountValue: 0,
  minAmount: 0,
  maxDiscount: 0,
  totalCount: 0,
  usedCount: 0,
  perUserLimit: 1,
  categoryIds: '',
  merchantIds: '',
  description: ''
})

const permissions = reactive<EditPermissions>({
  canEditBasic: true,
  canEditTime: true,
  canEditDiscount: true,
  canEditProducts: true,
  canEditMerchants: true,
  canEditCategories: true,
  canEditStatus: true
})

const categoryIdList = ref<number[]>([])
const merchantIdList = ref<number[]>([])

const isView = computed(() => props.mode === 'view')

const dialogTitle = computed(() => {
  if (props.mode === 'add') return '新增营销活动'
  if (props.mode === 'view') return '查看营销活动'
  return '编辑营销活动'
})

const discountValueLabel = computed(() => {
  if (formData.discountType === 2) return '折扣比例'
  if (formData.discountType === 3) return '优惠券面额'
  return '优惠金额'
})

const editWarning = computed(() => {
  if (props.mode !== 'edit') return ''
  const status = props.initialData?.status as number
  if (status === 1) {
    return '进行中的活动仅可微调非核心规则（活动名称、描述），禁止修改活动时间与核心优惠配置'
  }
  if (status === 2) {
    return '已结束的活动无法编辑'
  }
  if (status === 3) {
    return '已下架的活动无法编辑'
  }
  return ''
})

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 100, message: '活动名称长度在2到100个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择活动类型', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  endTime: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  discountType: [
    { required: true, message: '请选择优惠类型', trigger: 'change' }
  ],
  discountValue: [
    { required: true, message: '请输入优惠值', trigger: 'blur' }
  ],
  minAmount: [
    { required: true, message: '请输入使用门槛', trigger: 'blur' }
  ]
}

let validateTimeout: ReturnType<typeof setTimeout> | null = null

const initFormData = () => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    Object.assign(formData, props.initialData)
    if (formData.categoryIds) {
      categoryIdList.value = formData.categoryIds.split(',').map(Number).filter((n: number) => n > 0)
    }
    if (formData.merchantIds) {
      merchantIdList.value = formData.merchantIds.split(',').map(Number).filter((n: number) => n > 0)
    }
  } else {
    Object.assign(formData, {
      name: '',
      type: 1,
      status: 0,
      startTime: '',
      endTime: '',
      discountType: 1,
      discountValue: 0,
      minAmount: 0,
      maxDiscount: 0,
      totalCount: 0,
      usedCount: 0,
      perUserLimit: 1,
      categoryIds: '',
      merchantIds: '',
      description: ''
    })
    categoryIdList.value = []
    merchantIdList.value = []
  }
  validateResult.value = null
  duplicateCheckResult.value = null
}

const loadEditPermissions = async () => {
  if (props.mode === 'edit' && props.initialData?.status !== undefined) {
    const res = await getEditPermissions(props.initialData.status)
    Object.assign(permissions, res.data)
  } else {
    Object.assign(permissions, {
      canEditBasic: true,
      canEditTime: true,
      canEditDiscount: true,
      canEditProducts: true,
      canEditMerchants: true,
      canEditCategories: true,
      canEditStatus: true
    })
  }
}

const handleFieldValidate = async (_field: string) => {
  if (props.mode === 'view') return
  await nextTick()
  if (!formData.name || !formData.startTime || !formData.endTime) return

  if (validateTimeout) {
    clearTimeout(validateTimeout)
  }

  validateTimeout = setTimeout(async () => {
    await performValidation()
    await performDuplicateCheck()
  }, 300)
}

const performValidation = async () => {
  try {
    const submitData = getSubmitData()
    if (props.mode === 'add') {
      const res = await validateCreateMarketing(submitData)
      validateResult.value = res.data
    } else if (props.mode === 'edit' && props.initialData?.id) {
      const res = await validateEditMarketing(props.initialData.id, submitData)
      validateResult.value = res.data
    }

    if (validateResult.value && formRef.value) {
      const fieldsToValidate = new Set<string>()
      validateResult.value.errors.forEach(err => {
        if (err.field) {
          fieldsToValidate.add(err.field)
        }
      })
      if (fieldsToValidate.size > 0) {
        formRef.value.validateField(Array.from(fieldsToValidate)).catch(() => {})
      }
    }
  } catch (err) {
    console.error('Validation error:', err)
  }
}

const performDuplicateCheck = async () => {
  try {
    const submitData = getSubmitData()
    const res = await checkDuplicateConfig({
      type: submitData.type,
      startTime: submitData.startTime,
      endTime: submitData.endTime,
      categoryIds: submitData.categoryIds,
      merchantIds: submitData.merchantIds,
      discountValue: submitData.discountValue,
      excludeId: props.initialData?.id
    })
    duplicateCheckResult.value = res.data
  } catch (err) {
    console.error('Duplicate check error:', err)
  }
}

const handleDiscountTypeChange = () => {
  formData.discountValue = 0
  handleFieldValidate('discountType')
}

const handleCategoryChange = () => {
  formData.categoryIds = categoryIdList.value.join(',')
  handleFieldValidate('categoryIds')
}

const handleMerchantChange = () => {
  formData.merchantIds = merchantIdList.value.join(',')
  handleFieldValidate('merchantIds')
}

const getSubmitData = (): Partial<Marketing> => {
  const data: Partial<Marketing> = {
    ...formData,
    categoryIds: categoryIdList.value.join(','),
    merchantIds: merchantIdList.value.join(',')
  }
  return data
}

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
  if (val) {
    initFormData()
    loadEditPermissions()
    setTimeout(() => formRef.value?.clearValidate(), 0)
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      initFormData()
      loadEditPermissions()
    }
  }
)

watch(
  () => props.initialData,
  () => {
    if (props.modelValue) {
      initFormData()
      loadEditPermissions()
    }
  },
  { deep: true }
)

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formRef.value || isDebouncing.value) return

  if (props.mode === 'edit') {
    const status = props.initialData?.status as number
    if (status === 2 || status === 3) {
      ElMessage.error(MarketingStatusMap[status]?.label + '的活动无法编辑')
      return
    }
  }

  try {
    await formRef.value.validate()

    await performValidation()
    if (validateResult.value && validateResult.value.errors.length > 0) {
      ElMessage.error('请先修正表单中的错误')
      return
    }

    isDebouncing.value = true
    setTimeout(() => {
      isDebouncing.value = false
    }, 300)

    submitting.value = true
    const submitData = getSubmitData()

    if (props.mode === 'add') {
      await createMarketing(submitData)
      ElMessage.success('创建活动成功')
    } else if (props.mode === 'edit' && props.initialData?.id) {
      await updateMarketing(props.initialData.id, submitData)
      ElMessage.success('编辑活动成功，已同步更新前台展示')
    }

    emit('success')
    emit('update:modelValue', false)
  } catch (err) {
    if ((err as { valid?: boolean }).valid === false) return
    ElMessage.error((err as Error).message || '操作失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.validate-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;

  &.error {
    color: var(--el-color-danger);
  }

  &.warning {
    color: var(--el-color-warning);
  }
}

.mb-16 {
  margin-bottom: 16px;
}

.mt-16 {
  margin-top: 16px;
}
</style>
