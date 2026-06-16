<script setup lang="ts">
import { computed } from 'vue'
import { CONTENT_AUDIT_STATUS, getEnumOptions } from '@/constants/enums'

interface Props {
  visible: boolean
  title?: string
  batchMode?: boolean
  batchCount?: number
  defaultStatus?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '内容审核',
  batchMode: false,
  batchCount: 0,
  defaultStatus: 2,
})

interface Emits {
  (e: 'update:visible', val: boolean): void
  (e: 'submit', val: { auditStatus: number; auditRemark: string }): void
}

const emit = defineEmits<Emits>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const auditStatusOptions = computed(() =>
  getEnumOptions(CONTENT_AUDIT_STATUS).filter(
    (item) => item.value === 2 || item.value === 3
  )
)

const formRef = ref()
const formData = reactive({
  auditStatus: props.defaultStatus,
  auditRemark: '',
})

const rules = {
  auditRemark: [
    {
      required: computed(() => formData.auditStatus === 3),
      message: '审核驳回时请填写驳回原因',
      trigger: 'blur',
    },
    {
      max: 500,
      message: '审核备注不能超过500字',
      trigger: 'blur',
    },
  ],
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  emit('submit', { ...toRaw(formData) })
  handleClose()
}

const handleClose = () => {
  dialogVisible.value = false
  formData.auditStatus = props.defaultStatus
  formData.auditRemark = ''
  formRef.value?.resetFields()
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      formData.auditStatus = props.defaultStatus
    }
  }
)
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="520px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-alert
      v-if="batchMode"
      :title="`本次将批量审核 ${batchCount} 条内容`"
      type="warning"
      show-icon
      :closable="false"
      class="mb-16"
    />
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="审核结果" prop="auditStatus">
        <el-radio-group v-model="formData.auditStatus">
          <el-radio
            v-for="item in auditStatusOptions"
            :key="item.value"
            :value="item.value"
          >
            <el-tag :type="item.type">{{ item.label }}</el-tag>
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="审核备注" prop="auditRemark">
        <el-input
          v-model="formData.auditRemark"
          type="textarea"
          :rows="4"
          :placeholder="formData.auditStatus === 3 ? '请输入驳回原因（必填）' : '请输入审核备注（选填）'"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确认审核</el-button>
    </template>
  </el-dialog>
</template>
