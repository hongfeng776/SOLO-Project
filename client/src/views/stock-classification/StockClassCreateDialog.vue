<template>
  <FinDialog
    v-model:visible="visible"
    :title="dialogTitle"
    width="720px"
    :close-on-click-modal="false"
    :class="{ 'dialog-zoom-fade': dialogAnimating }"
    @closed="handleClosed"
    @open="handleOpen"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="class-form"
    >
      <el-divider content-position="left">基础信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="分类名称"
            prop="className"
            :class="{ 'shake-error': shakeFields.includes('className') }"
          >
            <el-input
              v-model="formData.className"
              placeholder="请输入分类名称"
              @blur="handleValidateName"
            >
              <template #suffix>
                <el-icon v-if="nameValidating" class="is-loading"><Loading /></el-icon>
                <el-icon v-else-if="classValidation.nameUnique" style="color: #67C23A"><CircleCheckFilled /></el-icon>
                <el-icon v-else-if="formData.className && !classValidation.nameUnique" style="color: #F56C6C"><CircleCloseFilled /></el-icon>
              </template>
            </el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="分类层级"
            prop="classLevel"
            :class="{ 'shake-error': shakeFields.includes('classLevel') }"
          >
            <el-select
              v-model="formData.classLevel"
              placeholder="请选择分类层级"
              style="width: 100%"
              @change="handleLevelChange"
            >
              <el-option
                v-for="(label, value) in STOCK_CLASS_LEVEL_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="上级分类"
            prop="parentId"
            :class="{ 'shake-error': shakeFields.includes('parentId') }"
          >
            <el-select
              v-model="formData.parentId"
              placeholder="请选择上级分类"
              style="width: 100%"
              :disabled="formData.classLevel === StockClassLevel.BOARD"
              clearable
            >
              <el-option
                v-for="item in parentOptions"
                :key="item.id"
                :label="item.className"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序号" prop="sortOrder">
            <el-input-number
              v-model="formData.sortOrder"
              :min="0"
              :precision="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入描述"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider v-if="formData.classLevel && formData.classLevel !== StockClassLevel.BOARD" content-position="left">行业/风险/市值参数</el-divider>
      <el-row v-if="formData.classLevel === StockClassLevel.INDUSTRY" :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="行业代码"
            prop="industryCode"
            :class="{ 'shake-error': shakeFields.includes('industryCode') }"
          >
            <el-select
              v-model="formData.industryCode"
              placeholder="请选择行业代码"
              style="width: 100%"
            >
              <el-option
                v-for="item in STOCK_CLASS_INDUSTRY_LIST"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="formData.classLevel === StockClassLevel.RISK_LEVEL" :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="风险标签"
            prop="riskTag"
            :class="{ 'shake-error': shakeFields.includes('riskTag') }"
          >
            <el-select
              v-model="formData.riskTag"
              placeholder="请选择风险标签"
              style="width: 100%"
            >
              <el-option
                v-for="item in STOCK_CLASS_RISK_TAG_LIST"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row v-if="formData.classLevel === StockClassLevel.MARKET_CAP" :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="市值区间"
            prop="marketCapRange"
            :class="{ 'shake-error': shakeFields.includes('marketCapRange') }"
          >
            <el-select
              v-model="formData.marketCapRange"
              placeholder="请选择市值区间"
              style="width: 100%"
            >
              <el-option
                v-for="item in STOCK_CLASS_MARKET_CAP_LIST"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">其他信息</el-divider>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item
            label="分类状态"
            prop="classStatus"
            :class="{ 'shake-error': shakeFields.includes('classStatus') }"
          >
            <el-select v-model="formData.classStatus" placeholder="请选择分类状态" style="width: 100%">
              <el-option
                v-for="(label, value) in STOCK_CLASS_STATUS_LABELS"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        {{ submitting ? '提交中...' : '确认提交' }}
      </el-button>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Loading, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockClassApi from '@/api/stockClassification'
import type { IStockClassification, IStockClassValidation, IValidationError } from '@/types/api'
import {
  STOCK_CLASS_LEVEL_LABELS,
  STOCK_CLASS_STATUS_LABELS,
  STOCK_CLASS_INDUSTRY_LIST,
  STOCK_CLASS_RISK_TAG_LIST,
  STOCK_CLASS_MARKET_CAP_LIST,
} from '@/constants/dictionaries'
import { StockClassLevel, StockClassStatus } from '@/enums'

interface Props {
  visible: boolean
  editData?: IStockClassification | null
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
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
const shakeFields = ref<string[]>([])
const nameValidating = ref(false)
const dialogAnimating = ref(false)
const parentOptions = ref<IStockClassification[]>([])

const classValidation = reactive<IStockClassValidation>({
  valid: true,
  permissionValid: true,
  permissionMessage: '',
  levelValid: true,
  levelMessage: '',
  nameUnique: true,
  nameMessage: '',
  levelExceeded: false,
})

const defaultFormData = {
  className: '',
  classLevel: '',
  parentId: null as number | null,
  sortOrder: 0,
  description: '',
  classStatus: StockClassStatus.ACTIVE,
  riskTag: '',
  marketCapRange: '',
  industryCode: '',
}

const formData = ref({ ...defaultFormData })

const dialogTitle = computed(() => (props.editData ? '编辑股票分类' : '新建股票分类'))

const formRules = computed<FormRules>(() => ({
  className: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  classLevel: [{ required: true, message: '请选择分类层级', trigger: 'change' }],
  classStatus: [{ required: true, message: '请选择分类状态', trigger: 'change' }],
}))

function triggerShake(fields: string[]) {
  shakeFields.value = fields
  setTimeout(() => {
    shakeFields.value = []
  }, 500)
}

async function validateField(field: string) {
  try {
    await formRef.value?.validateField(field)
  } catch {
    triggerShake([field])
  }
}

function handleOpen() {
  dialogAnimating.value = true
  setTimeout(() => {
    dialogAnimating.value = false
  }, 300)
}

async function handleValidateName() {
  if (!formData.value.className) {
    classValidation.nameUnique = true
    classValidation.valid = true
    return
  }
  nameValidating.value = true
  try {
    const res = await stockClassApi.validateClass(formData.value)
    if (res.code === 0 && res.data) {
      Object.assign(classValidation, res.data)
    } else {
      classValidation.nameUnique = true
      classValidation.valid = true
    }
    if (!classValidation.nameUnique) {
      triggerShake(['className'])
    }
  } catch {
    classValidation.nameUnique = true
    classValidation.valid = true
  } finally {
    nameValidating.value = false
  }
}

async function handleLevelChange() {
  if (formData.value.classLevel === StockClassLevel.BOARD) {
    formData.value.parentId = null
    parentOptions.value = []
  } else {
    await loadParentOptions()
  }
}

async function loadParentOptions() {
  try {
    const levelOrder = [StockClassLevel.BOARD, StockClassLevel.INDUSTRY, StockClassLevel.RISK_LEVEL, StockClassLevel.MARKET_CAP]
    const currentIdx = levelOrder.indexOf(formData.value.classLevel as StockClassLevel)
    if (currentIdx <= 0) return
    const parentLevel = levelOrder[currentIdx - 1]
    const res = await stockClassApi.getList({ classLevel: parentLevel, pageSize: 1000 })
    if (res.code === 0 && res.data) {
      parentOptions.value = res.data.records || []
    }
  } catch {
    parentOptions.value = []
  }
}

async function handleValidateClass(): Promise<boolean> {
  try {
    const res = await stockClassApi.validateClass(formData.value)
    if (res.code === 0 && res.data) {
      Object.assign(classValidation, res.data)
    }
    if (!classValidation.valid) {
      const fields: string[] = []
      if (classValidation.levelExceeded) {
        ElMessage.error('分类层级超限，最多支持四级分类')
        triggerShake(['classLevel'])
        return false
      }
      if (!classValidation.nameUnique) {
        ElMessage.error('分类名称重复')
        fields.push('className')
      }
      if (!classValidation.permissionValid) {
        ElMessage.error(classValidation.permissionMessage || '无操作权限')
      }
      if (!classValidation.levelValid) {
        ElMessage.error(classValidation.levelMessage || '分类层级校验不通过')
        fields.push('classLevel')
      }
      if (fields.length > 0) {
        triggerShake(fields)
      }
      return false
    }
    return true
  } catch {
    ElMessage.error('前置校验失败，请稍后重试')
    return false
  }
}

function handleClosed() {
  formData.value = { ...defaultFormData }
  shakeFields.value = []
  parentOptions.value = []
  Object.assign(classValidation, {
    valid: true,
    permissionValid: true,
    permissionMessage: '',
    levelValid: true,
    levelMessage: '',
    nameUnique: true,
    nameMessage: '',
    levelExceeded: false,
  })
  formRef.value?.clearValidate()
}

watch(
  () => props.visible,
  (val) => {
    if (val && props.editData) {
      formData.value = {
        ...defaultFormData,
        className: props.editData.className,
        classLevel: props.editData.classLevel,
        parentId: props.editData.parentId,
        sortOrder: props.editData.sortOrder,
        description: props.editData.description || '',
        classStatus: props.editData.classStatus,
        riskTag: props.editData.riskTag || '',
        marketCapRange: props.editData.marketCapRange || '',
        industryCode: props.editData.industryCode || '',
      }
      if (props.editData.classLevel && props.editData.classLevel !== StockClassLevel.BOARD) {
        loadParentOptions()
      }
    } else if (val) {
      formData.value = { ...defaultFormData }
    }
  },
)

async function handleSubmit() {
  if (submitting.value) return

  try {
    await formRef.value?.validate()
  } catch (err: any) {
    const fields = Object.keys(err || {})
    triggerShake(fields)
    ElMessage.warning('请检查表单填写是否正确')
    return
  }

  submitting.value = true
  try {
    const classValid = await handleValidateClass()
    if (!classValid) {
      return
    }

    if (props.editData) {
      const res = await stockClassApi.update(props.editData.id, formData.value)
      if (res.code === 0) {
        ElMessage.success('更新成功')
        emit('success')
        visible.value = false
      } else {
        handleSubmitError(res.message)
      }
    } else {
      const res = await stockClassApi.create(formData.value)
      if (res.code === 0) {
        ElMessage.success('创建成功')
        emit('success')
        visible.value = false
      } else {
        handleSubmitError(res.message)
      }
    }
  } catch (err: any) {
    handleSubmitError(err.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

function handleSubmitError(message: string) {
  try {
    const errors: IValidationError[] = JSON.parse(message)
    if (Array.isArray(errors) && errors.length > 0) {
      const fields = errors.map((e) => toCamelCase(e.field))
      triggerShake(fields)
      ElMessage.error(errors[0].message)
    } else {
      ElMessage.error(message)
    }
  } catch {
    ElMessage.error(message)
  }
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}
</script>

<style lang="scss" scoped>
.class-form {
  :deep(.el-form-item.shake-error .el-input__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.shake-error .el-select .el-select__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.shake-error .el-input-number .el-input__wrapper) {
    animation: shake 0.4s;
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }

  :deep(.el-form-item.is-error .el-input__wrapper) {
    box-shadow: 0 0 0 1px #f56c6c inset !important;
  }
}

.dialog-zoom-fade {
  :deep(.el-dialog) {
    animation: zoomFadeIn 0.3s ease-out;
  }
}

@keyframes zoomFadeIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
</style>
