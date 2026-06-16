<script setup lang="ts">
import { computed } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadUserFile, UploadProps } from 'element-plus'

interface Props {
  modelValue?: string
  action?: string
  accept?: string
  limit?: number
  maxSize?: number
  tip?: string
  listType?: 'text' | 'picture' | 'picture-card'
  width?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  action: '/api/v1/upload',
  accept: 'image/*',
  limit: 1,
  maxSize: 5,
  listType: 'picture-card',
  tip: '',
})

interface Emits {
  (e: 'update:modelValue', val: string): void
  (e: 'success', val: any): void
  (e: 'error', val: any): void
}

const emit = defineEmits<Emits>()

const uploadRef = ref()

const fileList = computed<UploadUserFile[]>({
  get: () => {
    if (!props.modelValue) return []
    return [
      {
        name: '文件',
        url: props.modelValue,
        status: 'success',
      },
    ]
  },
  set: () => {},
})

const getAuthToken = () => {
  const userStore = useUserStore()
  return userStore.accessToken
}

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const fileType = file.type
  const isLtMax = file.size / 1024 / 1024 < props.maxSize

  if (props.accept && props.accept !== '*') {
    const acceptTypes = props.accept.split(',').map((t) => t.trim())
    const typeMatch = acceptTypes.some((type) => {
      if (type.includes('*')) {
        const prefix = type.replace('/*', '')
        return fileType.startsWith(prefix)
      }
      return fileType === type
    })
    if (!typeMatch) {
      ElMessage.error(`仅支持上传 ${props.accept} 格式的文件!`)
      return false
    }
  }
  if (!isLtMax) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB!`)
    return false
  }
  return true
}

const handleChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.response) {
    const url = uploadFile.response.data?.url || uploadFile.response.data
    if (url) {
      emit('update:modelValue', url)
    }
  }
}

const handleSuccess: UploadProps['onSuccess'] = (response) => {
  const url = response.data?.url || response.data
  if (url) {
    emit('update:modelValue', url)
  }
  emit('success', response)
  ElMessage.success('上传成功')
}

const handleError: UploadProps['onError'] = (err) => {
  ElMessage.error('上传失败')
  emit('error', err)
}

const handleRemove: UploadProps['onRemove'] = () => {
  emit('update:modelValue', '')
}

const clearFiles = () => {
  uploadRef.value?.clearFiles()
  emit('update:modelValue', '')
}

defineExpose({
  clearFiles,
  uploadRef,
})
</script>

<template>
  <div class="qy-upload">
    <el-upload
      ref="uploadRef"
      :action="action"
      :file-list="fileList"
      :list-type="listType"
      :accept="accept"
      :limit="limit"
      :before-upload="beforeUpload"
      :on-change="handleChange"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-remove="handleRemove"
      :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
      :auto-upload="true"
      :style="{ width, height }"
    >
      <template v-if="listType === 'picture-card'">
        <el-icon><UploadFilled /></el-icon>
        <div style="margin-top: 8px">点击上传</div>
      </template>
      <template v-else>
        <el-button type="primary" :icon="UploadFilled">
          点击上传
        </el-button>
      </template>
    </el-upload>
    <div v-if="tip" class="qy-upload-tip">{{ tip }}</div>
  </div>
</template>

<style lang="scss" scoped>
.qy-upload-tip {
  margin-top: 8px;
  color: $text-secondary;
  font-size: $font-xs;
  line-height: 1.5;
}
</style>
