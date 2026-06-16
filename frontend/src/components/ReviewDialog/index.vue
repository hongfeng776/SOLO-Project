<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    :width="width"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      :disabled="isPassed"
    >
      <el-form-item label="审核结果" prop="status">
        <el-radio-group v-model="formData.status" :disabled="!!dataId">
          <el-radio :value="2" label="通过">
            <el-icon><CircleCheckFilled style="color: #67c23a" /></el-icon>
            <span>通过</span>
          </el-radio>
          <el-radio :value="3" label="拒绝">
            <el-icon><CircleCloseFilled style="color: #f56c6c" /></el-icon>
            <span>拒绝</span>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="审核备注">
        <div class="audit-meta">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item v-if="dataTitle" label="内容标题">
              {{ dataTitle }}
            </el-descriptions-item>
            <el-descriptions-item v-if="dataAuthor" label="提交人">
              {{ dataAuthor }}
            </el-descriptions-item>
            <el-descriptions-item v-if="dataTime" label="提交时间">
              {{ dataTime }}
            </el-descriptions-item>
            <el-descriptions-item v-if="dataLevel != null" label="审核层级">
              {{ levelMap[dataLevel] || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-form-item>
      <el-form-item
        v-if="formData.status === 3"
        label="拒绝原因"
        prop="rejectReason"
      >
        <el-input
          v-model="formData.rejectReason"
          type="textarea"
          :rows="4"
          placeholder="请输入拒绝原因，该原因将反馈给提交人"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="审核备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="2"
          placeholder="请输入内部审核备注（可选）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="loading"
        :disabled="isPassed"
        @click="handleSubmit"
      >
        {{ isPassed ? '已通过' : '确认提交' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { ReviewLevel } from '@enums/business'

interface Props {
  modelValue: boolean
  dataId?: number | null
  dataTitle?: string
  dataAuthor?: string
  dataTime?: string
  dataLevel?: number
  isPassed?: boolean
  width?: string
  successMessage?: string
}

interface AuditFormData {
  status: number
  rejectReason: string
  remark: string
}

const props = withDefaults(defineProps<Props>(), {
  dataId: null,
  dataTitle: '',
  dataAuthor: '',
  dataTime: '',
  dataLevel: undefined,
  isPassed: false,
  width: '560px',
  successMessage: '审核成功'
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit', data: AuditFormData & { id: number }): void
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const formData = ref<AuditFormData>({
  status: 2,
  rejectReason: '',
  remark: ''
})

const dialogTitle = computed(() => {
  if (props.isPassed) return '审核详情'
  return props.dataLevel ? `${levelMap[props.dataLevel] || ''}审核` : '内容审核'
})

const levelMap: Record<number, string> = {
  [ReviewLevel.LEVEL_1]: '一级',
  [ReviewLevel.LEVEL_2]: '二级',
  [ReviewLevel.LEVEL_3]: '三级'
}

const rules: FormRules = {
  status: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  rejectReason: [
    {
      validator: (_rule, value, callback) => {
        if (formData.value.status === 3 && !value.trim()) {
          callback(new Error('请输入拒绝原因'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      formData.value = { status: 2, rejectReason: '', remark: '' }
    }
  },
  { immediate: true }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  visible.value = false
}

const handleSubmit = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!props.dataId) {
    ElMessage.warning('缺少数据ID')
    return
  }
  loading.value = true
  try {
    emit('submit', { ...formData.value, id: props.dataId })
    ElMessage.success(props.successMessage)
    handleClose()
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.audit-meta {
  width: 100%;
}
</style>
