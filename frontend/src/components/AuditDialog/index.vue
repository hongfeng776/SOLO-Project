<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" label-width="80px">
      <el-form-item label="审核结果">
        <el-radio-group v-model="form.auditStatus">
          <el-radio :value="1">通过</el-radio>
          <el-radio :value="2">拒绝</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="审核备注">
        <el-input
          v-model="form.remark"
          type="textarea"
          :rows="4"
          placeholder="请输入审核备注"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'

interface Props {
  modelValue: boolean
  title?: string
  width?: string
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '审核',
  width: '500px',
  loading: false
})

const emit = defineEmits(['update:modelValue', 'submit', 'close'])

const dialogVisible = ref(props.modelValue)
const form = reactive({
  auditStatus: 1,
  remark: ''
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val) {
    form.auditStatus = 1
    form.remark = ''
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

const handleSubmit = () => {
  emit('submit', { ...form })
}
</script>
