<template>
  <el-dialog
    v-model="dialogVisible"
    title="处理异常标记"
    width="480px"
    destroy-on-close
  >
    <el-form :model="formData" label-width="100px">
      <el-form-item label="处理结果">
        <el-radio-group v-model="formData.handled">
          <el-radio :value="1">已处理</el-radio>
          <el-radio :value="2">误报忽略</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="处理备注">
        <el-input
          v-model="formData.handleResult"
          type="textarea"
          :rows="4"
          placeholder="请输入处理备注"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">确认提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { handleAbnormalLog } from '@api/user-account'

interface Props {
  modelValue: boolean
  logId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'handled'])

const dialogVisible = ref(false)
const submitting = ref(false)
const formData = reactive({
  handled: 1,
  handleResult: ''
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    formData.handled = 1
    formData.handleResult = ''
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleSubmit = async () => {
  if (!props.logId || !formData.handleResult.trim()) {
    ElMessage.warning('请填写处理备注')
    return
  }

  submitting.value = true
  try {
    await handleAbnormalLog(props.logId, {
      handled: formData.handled,
      handleResult: formData.handleResult
    })
    ElMessage.success('提交成功')
    emit('handled')
    dialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}
</script>
