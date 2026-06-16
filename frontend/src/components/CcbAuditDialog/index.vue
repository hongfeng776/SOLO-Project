<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <el-alert
      v-if="businessInfo"
      type="info"
      :closable="false"
      class="ccb-audit-alert"
    >
      <template #title>
        <div class="audit-info">
          <span>业务单号：{{ businessInfo.businessNo || '-' }}</span>
          <span>业务类型：{{ businessInfo.businessTypeName || '-' }}</span>
          <span>金额：¥{{ formatMoney(businessInfo.amount) }}</span>
        </div>
      </template>
    </el-alert>

    <el-descriptions v-if="businessInfo" :column="1" border size="small" class="ccb-audit-desc">
      <el-descriptions-item label="提交人">
        {{ businessInfo.submitterName || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="所属机构">
        {{ businessInfo.submitterOrg || '-' }}
      </el-descriptions-item>
      <el-descriptions-item label="提交时间">
        {{ formatDateTime(businessInfo.submitTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="当前审核级别">
        第 {{ businessInfo.currentLevel }} / {{ businessInfo.totalLevel }} 级
      </el-descriptions-item>
    </el-descriptions>

    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px" class="ccb-audit-form">
      <el-form-item label="审核意见" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="4"
          :placeholder="auditType === 'approve' ? '请输入审核通过意见（非必填）' : '请输入审核驳回原因（必填）'"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="danger" :loading="loading" @click="handleReject">驳回</el-button>
      <el-button type="primary" :loading="loading" @click="handleApprove">通过</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { formatMoney, formatDateTime } from '@utils'

interface BusinessInfo {
  businessNo?: string
  businessTypeName?: string
  amount?: number
  submitterName?: string
  submitterOrg?: string
  submitTime?: string
  currentLevel?: number
  totalLevel?: number
}

interface Props {
  modelValue: boolean
  id?: number
  businessInfo?: BusinessInfo
}

interface Emits {
  (e: 'update:modelValue', val: boolean): void
  (e: 'approve', val: { id: number; remark: string }): void
  (e: 'reject', val: { id: number; remark: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  id: 0
})

const emit = defineEmits<Emits>()

type AuditType = 'approve' | 'reject' | ''

const dialogVisible = ref<boolean>(props.modelValue)
const formRef = ref<FormInstance>()
const loading = ref<boolean>(false)
const auditType = ref<AuditType>('')
const title = ref<string>('业务审核')

const formData = reactive<{ remark: string }>({
  remark: ''
})

const formRules: FormRules = {
  remark: [
    {
      validator: (_rule, value, callback) => {
        if (auditType.value === 'reject' && !value.trim()) {
          callback(new Error('请输入审核驳回原因'))
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
    dialogVisible.value = val
    if (val) {
      formData.remark = ''
      auditType.value = ''
    }
  }
)

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleClosed = (): void => {
  formRef.value?.resetFields()
}

const handleCancel = (): void => {
  dialogVisible.value = false
}

const handleApprove = async (): Promise<void> => {
  auditType.value = 'approve'
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    emit('approve', { id: props.id, remark: formData.remark })
    ElMessage.success('审核通过成功')
    dialogVisible.value = false
  } finally {
    loading.value = false
  }
}

const handleReject = async (): Promise<void> => {
  auditType.value = 'reject'
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    emit('reject', { id: props.id, remark: formData.remark })
    ElMessage.success('审核驳回成功')
    dialogVisible.value = false
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.ccb-audit-alert {
  margin-bottom: 20px;

  .audit-info {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 14px;
  }
}

.ccb-audit-desc {
  margin-bottom: 20px;
}

.ccb-audit-form {
  padding-top: 10px;
}
</style>
