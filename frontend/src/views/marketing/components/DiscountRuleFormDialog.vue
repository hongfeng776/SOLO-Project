<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑优惠规则' : '新建优惠规则'"
    width="880px"
    :close-on-click-modal="false"
    draggable
    @update:model-value="handleVisibleChange"
  >
    <div class="validation-panel" v-if="validateResult">
      <el-alert
        v-if="!validateResult.passed"
        :title="`校验未通过，共 ${validateResult.errors.length} 项错误`"
        type="error"
        show-icon
        :closable="false"
        class="mb-8"
      />
      <el-alert
        v-else-if="validateResult.warnings && validateResult.warnings.length > 0"
        :title="`校验通过，但存在 ${validateResult.warnings.length} 项提示`"
        type="warning"
        show-icon
        :closable="false"
        class="mb-8"
      />
      <el-alert
        v-else
        title="所有校验项均通过"
        type="success"
        show-icon
        :closable="false"
        class="mb-8"
      />

      <div v-if="validateResult.errors && validateResult.errors.length > 0" class="error-list">
        <div v-for="(err, i) in validateResult.errors" :key="'e'+i" class="err-item err-error">
          <el-icon><CircleCloseFilled /></el-icon>
          <span class="err-field">[{{ err.field }}]</span>
          <span>{{ err.message }}</span>
        </div>
      </div>

      <div v-if="validateResult.warnings && validateResult.warnings.length > 0" class="error-list">
        <div v-for="(w, i) in validateResult.warnings" :key="'w'+i" class="err-item err-warn">
          <el-icon><WarningFilled /></el-icon>
          <span class="err-field">[{{ w.field }}]</span>
          <span>{{ w.message }}</span>
        </div>
      </div>

      <div v-if="validateResult.optimalCombination" class="optimal-panel">
        <el-icon color="#e6a23c"><Medal /></el-icon>
        <span class="optimal-title">最优优惠组合：</span>
        <span class="optimal-desc">{{ validateResult.optimalCombination.description }}</span>
        <el-tag type="danger" effect="dark">
          原价 ¥{{ validateResult.optimalCombination.originalAmount.toFixed(2) }}
          →
          实付 ¥{{ validateResult.optimalCombination.finalAmount.toFixed(2) }}
        </el-tag>
      </div>

      <div v-if="validateResult.budgetHint" class="budget-hint">
        <el-icon><InfoFilled /></el-icon>
        <span>{{ validateResult.budgetHint }}</span>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="right"
    >
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="规则名称" prop="ruleName">
            <el-input
              v-model="formData.ruleName"
              placeholder="请输入规则名称"
              maxlength="50"
              show-word-limit
              @focus="handleFocus($event, 'ruleName')"
              @blur="handleBlur($event, 'ruleName')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="优惠类型" prop="discountType">
            <el-select
              v-model="formData.discountType"
              placeholder="请选择优惠类型"
              style="width: 100%"
              @change="handleDiscountTypeChange"
            >
              <el-option label="满减" :value="1" />
              <el-option label="折扣" :value="2" />
              <el-option label="优惠券" :value="3" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="使用门槛" prop="minAmount">
            <el-input-number
              v-model="formData.minAmount"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
              @focus="handleNumberFocus('minAmount')"
              @blur="handleNumberBlur('minAmount')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item :label="discountValueLabel" prop="discountValue">
            <el-input-number
              v-model="formData.discountValue"
              :min="0"
              :max="formData.discountType === 2 ? 10 : undefined"
              :precision="formData.discountType === 2 ? 1 : 2"
              :step="formData.discountType === 2 ? 0.1 : 10"
              style="width: 100%"
              @focus="handleNumberFocus('discountValue')"
              @blur="handleNumberBlur('discountValue')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" v-if="formData.discountType !== 2">
        <el-col :span="12">
          <el-form-item label="最高优惠" prop="maxDiscountAmount">
            <el-input-number
              v-model="formData.maxDiscountAmount"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
              @focus="handleNumberFocus('maxDiscountAmount')"
              @blur="handleNumberBlur('maxDiscountAmount')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="测试订单金额" prop="testOriginalAmount">
            <el-input-number
              v-model="formData.testOriginalAmount"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 100%"
              placeholder="用于计算最优组合"
              @focus="handleNumberFocus('testOriginalAmount')"
              @blur="handleNumberBlur('testOriginalAmount')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">叠加规则</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="是否可叠加" prop="stackable">
            <el-radio-group v-model="formData.stackable" @change="runValidate">
              <el-radio :value="0">不可叠加</el-radio>
              <el-radio :value="1">可叠加</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最大叠加数" prop="stackLimit">
            <el-input-number
              v-model="formData.stackLimit"
              :min="1"
              :max="10"
              :precision="0"
              style="width: 100%"
              :disabled="formData.stackable === 0"
              @focus="handleNumberFocus('stackLimit')"
              @blur="handleNumberBlur('stackLimit')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="24">
          <el-form-item label="互斥规则ID">
            <el-select
              v-model="formData.excludeRuleIds"
              multiple
              filterable
              placeholder="选择与本规则互斥的其他优惠规则"
              style="width: 100%"
              @change="runValidate"
            >
              <el-option
                v-for="rule in availableRules"
                :key="rule.id"
                :label="rule.ruleName"
                :value="rule.id"
                :disabled="rule.id === currentRuleId"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">用户权限</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="最小用户等级" prop="userLevelMin">
            <el-input-number
              v-model="formData.userLevelMin"
              :min="0"
              :max="9"
              :precision="0"
              style="width: 100%"
              @focus="handleNumberFocus('userLevelMin')"
              @blur="handleNumberBlur('userLevelMin')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="最大用户等级" prop="userLevelMax">
            <el-input-number
              v-model="formData.userLevelMax"
              :min="0"
              :max="9"
              :precision="0"
              style="width: 100%"
              @focus="handleNumberFocus('userLevelMax')"
              @blur="handleNumberBlur('userLevelMax')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">预算与配额</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="预算总额" prop="budgetTotal">
            <el-input-number
              v-model="formData.budgetTotal"
              :min="0"
              :precision="2"
              :step="1000"
              style="width: 100%"
              @focus="handleNumberFocus('budgetTotal')"
              @blur="handleNumberBlur('budgetTotal')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="优惠总额度" prop="quotaTotal">
            <el-input-number
              v-model="formData.quotaTotal"
              :min="0"
              :precision="0"
              :step="100"
              style="width: 100%"
              @focus="handleNumberFocus('quotaTotal')"
              @blur="handleNumberBlur('quotaTotal')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="每人使用上限" prop="quotaPerUser">
            <el-input-number
              v-model="formData.quotaPerUser"
              :min="1"
              :precision="0"
              style="width: 100%"
              @focus="handleNumberFocus('quotaPerUser')"
              @blur="handleNumberBlur('quotaPerUser')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">有效时间</el-divider>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="开始时间" prop="startTime">
            <el-date-picker
              v-model="formData.startTime"
              type="datetime"
              placeholder="请选择开始时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              @change="runValidate"
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
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="排序" prop="sortOrder">
            <el-input-number
              v-model="formData.sortOrder"
              :min="0"
              :precision="0"
              style="width: 100%"
              @focus="handleNumberFocus('sortOrder')"
              @blur="handleNumberBlur('sortOrder')"
              @change="runValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="2"
              maxlength="200"
              show-word-limit
              @focus="handleFocus($event, 'remark')"
              @blur="handleBlur($event, 'remark')"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleVisibleChange(false)">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :disabled="submitting || !!(validateResult && !validateResult.passed)">
        {{ submitting ? '提交中...' : (isEdit ? '保存修改' : '创建规则') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  CircleCloseFilled,
  WarningFilled,
  InfoFilled,
  Medal
} from '@element-plus/icons-vue'
import {
  validateCreateDiscountRule,
  createDiscountRule,
  updateDiscountRule,
  getDiscountRuleDetail,
  getDiscountRuleList
} from '@/api/marketing'
import { DiscountType } from '@/types/business'
import type { DiscountValidateResult, DiscountRuleForm } from '@/types/business'

const props = defineProps<{
  modelValue: boolean
  marketingId: number
  ruleId: number
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'success'): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const validateResult = ref<DiscountValidateResult | null>(null)
const availableRules = ref<any[]>([])
const focusedField = ref<string>('')

const isEdit = computed(() => props.ruleId > 0)

const formData = reactive<DiscountRuleForm & { testOriginalAmount?: number }>({
  id: undefined,
  marketingId: 0,
  ruleName: '',
  discountType: 1,
  minAmount: 0,
  discountValue: 0,
  maxDiscountAmount: undefined,
  stackable: 1,
  stackLimit: 2,
  excludeRuleIds: [],
  userLevelMin: 0,
  userLevelMax: 9,
  applicableCategoryIds: [],
  excludeCategoryIds: [],
  applicableGoodsIds: [],
  excludeGoodsIds: [],
  budgetTotal: 0,
  quotaTotal: 0,
  quotaPerUser: 1,
  startTime: '',
  endTime: '',
  sortOrder: 0,
  remark: '',
  testOriginalAmount: 100
})

const formRules: FormRules = {
  ruleName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  discountType: [{ required: true, message: '请选择优惠类型', trigger: 'change' }],
  minAmount: [{ required: true, message: '请输入使用门槛', trigger: 'change' }],
  discountValue: [{ required: true, message: '请输入优惠值', trigger: 'change' }],
  budgetTotal: [{ required: true, message: '请输入预算总额', trigger: 'change' }],
  quotaTotal: [{ required: true, message: '请输入优惠总额度', trigger: 'change' }],
  quotaPerUser: [{ required: true, message: '请输入每人使用上限', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const discountValueLabel = computed(() => {
  const map: Record<number, string> = {
    [DiscountType.FULL_REDUCTION]: '减免金额',
    [DiscountType.DISCOUNT]: '折扣(0-10)',
    [DiscountType.COUPON]: '优惠券金额'
  }
  return map[formData.discountType] || '优惠值'
})

const currentRuleId = computed(() => props.ruleId)

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
  if (val) {
    initForm()
  } else {
    resetForm()
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  formData.id = undefined
  formData.marketingId = props.marketingId
  formData.ruleName = ''
  formData.discountType = 1
  formData.minAmount = 0
  formData.discountValue = 0
  formData.maxDiscountAmount = undefined
  formData.stackable = 1
  formData.stackLimit = 2
  formData.excludeRuleIds = []
  formData.userLevelMin = 0
  formData.userLevelMax = 9
  formData.applicableCategoryIds = []
  formData.excludeCategoryIds = []
  formData.applicableGoodsIds = []
  formData.excludeGoodsIds = []
  formData.budgetTotal = 0
  formData.quotaTotal = 0
  formData.quotaPerUser = 1
  formData.startTime = ''
  formData.endTime = ''
  formData.sortOrder = 0
  formData.remark = ''
  formData.testOriginalAmount = 100
  validateResult.value = null
  submitting.value = false
}

const initForm = async () => {
  resetForm()
  formData.marketingId = props.marketingId

  if (props.marketingId > 0) {
    const res = await getDiscountRuleList({ marketingId: props.marketingId, pageNum: 1, pageSize: 100 })
    availableRules.value = res.data.list
  }

  if (isEdit.value) {
    const res = await getDiscountRuleDetail(props.ruleId)
    const d = res.data
    formData.id = d.id
    formData.marketingId = d.marketingId
    formData.ruleName = d.ruleName
    formData.discountType = d.discountType
    formData.minAmount = d.minAmount
    formData.discountValue = d.discountValue
    formData.maxDiscountAmount = d.maxDiscountAmount
    formData.stackable = d.stackable
    formData.stackLimit = d.stackLimit
    formData.excludeRuleIds = d.excludeRuleIds ? d.excludeRuleIds.split(',').map(Number).filter((n: number) => !isNaN(n)) : []
    formData.userLevelMin = d.userLevelMin
    formData.userLevelMax = d.userLevelMax
    formData.budgetTotal = d.budgetTotal
    formData.quotaTotal = d.quotaTotal
    formData.quotaPerUser = d.quotaPerUser
    formData.startTime = d.startTime
    formData.endTime = d.endTime
    formData.sortOrder = d.sortOrder
    formData.remark = d.remark || ''
  }

  await runValidate()
}

let validateTimer: any = null
const runValidate = async () => {
  if (validateTimer) clearTimeout(validateTimer)
  validateTimer = setTimeout(async () => {
    if (!formData.marketingId) return
    try {
      const res = await validateCreateDiscountRule({
        ...formData,
        marketingId: formData.marketingId,
        originalAmount: formData.testOriginalAmount
      })
      validateResult.value = res.data
    } catch (err) {
    }
  }, 300)
}

const handleDiscountTypeChange = () => {
  if (formData.discountType === DiscountType.DISCOUNT) {
    if (formData.discountValue <= 0 || formData.discountValue > 10) {
      formData.discountValue = 9
    }
  }
  runValidate()
}

const handleFocus = (e: FocusEvent, field: string) => {
  focusedField.value = field
  const el = (e.target as HTMLElement).closest('.el-input') as HTMLElement
  if (el) {
    el.classList.add('discount-input-focus')
  }
}

const handleBlur = (e: FocusEvent, field: string) => {
  focusedField.value = ''
  const el = (e.target as HTMLElement).closest('.el-input') as HTMLElement
  if (el) {
    el.classList.remove('discount-input-focus')
  }
}

const handleNumberFocus = (field: string) => {
  focusedField.value = field
}

const handleNumberBlur = (field: string) => {
  if (focusedField.value === field) {
    focusedField.value = ''
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    if (validateResult.value && !validateResult.value.passed) {
      ElMessage.error('请先修复校验错误')
      return
    }
    submitting.value = true
    try {
      if (isEdit.value) {
        await updateDiscountRule(props.ruleId, formData)
        ElMessage.success('修改成功，已联动更新相关配置并记录日志')
      } else {
        await createDiscountRule(formData)
        ElMessage.success('创建成功')
      }
      emit('success')
      handleVisibleChange(false)
    } catch (err) {
      ElMessage.error((err as Error).message || '提交失败')
    } finally {
      submitting.value = false
    }
  })
}

watch(() => props.modelValue, (val) => {
  if (val) {
    initForm()
  }
})
</script>

<style lang="scss" scoped>
.validation-panel {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 4px;

  .mb-8 {
    margin-bottom: 8px;
  }
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;

  .err-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    padding: 4px 8px;
    border-radius: 4px;

    .err-field {
      font-weight: 600;
      margin-right: 4px;
    }
  }

  .err-error {
    background: rgba(245, 108, 108, 0.08);
    color: var(--el-color-danger);
  }

  .err-warn {
    background: rgba(230, 162, 60, 0.08);
    color: var(--el-color-warning);
  }
}

.optimal-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-top: 12px;
  background: rgba(103, 194, 58, 0.08);
  border: 1px dashed var(--el-color-success-light-5);
  border-radius: 4px;

  .optimal-title {
    font-weight: 600;
    color: var(--el-color-success);
  }

  .optimal-desc {
    flex: 1;
    color: var(--el-text-color-primary);
  }
}

.budget-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 4px;
  color: var(--el-color-primary);
  font-size: 13px;
}
</style>

<style lang="scss">
.discount-input-focus {
  transform: scale(1.02);
  transition: all 0.25s ease;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  border-radius: 4px;

  .el-input__wrapper {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
    background-color: #ecf5ff !important;
  }
}

.el-input-number.discount-number-focus .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
  background-color: #ecf5ff !important;
}
</style>
