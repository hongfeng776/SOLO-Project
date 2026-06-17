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
      <el-form-item label="审核结果" prop="action">
        <el-radio-group v-model="formData.action" :disabled="!!dataId && !fastReview">
          <el-radio :value="1" label="通过">
            <el-icon><CircleCheckFilled style="color: #67c23a" /></el-icon>
            <span>通过</span>
          </el-radio>
          <el-radio :value="2" label="拒绝">
            <el-icon><CircleCloseFilled style="color: #f56c6c" /></el-icon>
            <span>拒绝</span>
          </el-radio>
          <el-radio :value="3" label="暂缓">
            <el-icon><WarningFilled style="color: #e6a23c" /></el-icon>
            <span>暂缓</span>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="内容信息">
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
        v-if="formData.action === 2"
        label="违规类型"
        prop="violationType"
      >
        <el-select
          v-model="formData.violationType"
          placeholder="请选择违规类型"
          style="width: 100%"
        >
          <el-option label="色情低俗" value="sexual" />
          <el-option label="虚假广告" value="false_advertising" />
          <el-option label="侵权抄袭" value="infringement" />
          <el-option label="违法违规" value="illegal" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="formData.action === 2"
        label="拒绝原因"
        prop="reason"
      >
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="4"
          placeholder="请输入拒绝原因，该原因将反馈给提交人"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
      <el-form-item
        v-if="formData.action === 3"
        label="暂缓原因"
        prop="reason"
      >
        <el-input
          v-model="formData.reason"
          type="textarea"
          :rows="4"
          placeholder="请输入暂缓原因"
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
import { CircleCheckFilled, CircleCloseFilled, WarningFilled } from '@element-plus/icons-vue'
import { ReviewLevel, ReviewAction } from '@enums/business'

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
  fastReview?: boolean
  defaultAction?: number
}

interface ReviewFormData {
  action: number
  violationType: string
  reason: string
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
  successMessage: '审核成功',
  fastReview: false,
  defaultAction: ReviewAction.APPROVE
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit', data: ReviewFormData & { id: number }): void
}>()

const visible = ref(false)
const loading = ref(false)
const formRef = ref<FormInstance>()
const formData = ref<ReviewFormData>({
  action: ReviewAction.APPROVE,
  violationType: '',
  reason: '',
  remark: ''
})

const dialogTitle = computed(() => {
  if (props.isPassed) return '审核详情'
  if (props.fastReview) return '快速审核'
  return props.dataLevel ? `${levelMap[props.dataLevel] || ''}审核` : '内容审核'
})

const levelMap: Record<number, string> = {
  [ReviewLevel.LEVEL_1]: '一级',
  [ReviewLevel.LEVEL_2]: '二级',
  [ReviewLevel.LEVEL_3]: '三级'
}

const rules: FormRules = {
  action: [{ required: true, message: '请选择审核结果', trigger: 'change' }],
  violationType: [
    {
      validator: (_rule, value, callback) => {
        if (formData.value.action === ReviewAction.REJECT && !value) {
          callback(new Error('请选择违规类型'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  reason: [
    {
      validator: (_rule, value, callback) => {
        if (
          (formData.value.action === ReviewAction.REJECT || formData.value.action === ReviewAction.POSTPONE) &&
          !value.trim()
        ) {
          callback(new Error(formData.value.action === ReviewAction.REJECT ? '请输入拒绝原因' : '请输入暂缓原因'))
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
      formData.value = {
        action: props.fastReview ? props.defaultAction : ReviewAction.APPROVE,
        violationType: '',
        reason: '',
        remark: ''
      }
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
