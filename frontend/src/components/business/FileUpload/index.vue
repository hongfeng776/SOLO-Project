<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="600px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div class="file-upload-wrapper">
      <el-upload
        ref="uploadRef"
        :action="uploadUrl"
        :headers="uploadHeaders"
        :data="uploadData"
        :multiple="multiple"
        :limit="limit"
        :file-list="fileList"
        :accept="accept"
        :before-upload="handleBeforeUpload"
        :on-progress="handleProgress"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-remove="handleRemove"
        :on-exceed="handleExceed"
        :before-remove="handleBeforeRemove"
        :auto-upload="autoUpload"
        :drag="drag"
        :list-type="listType"
        :show-file-list="showFileList"
        :disabled="disabled"
        class="upload-component"
      >
        <div v-if="drag" class="upload-drag-content">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <p class="upload-text">将文件拖到此处，或<em>点击上传</em></p>
          <p class="upload-tip" v-if="tip">{{ tip }}</p>
        </div>
        <div v-else>
          <el-button type="primary" :icon="Upload">
            {{ buttonText }}
          </el-button>
        </div>
        <template #tip v-if="!drag && tip">
          <div class="el-upload__tip">{{ tip }}</div>
        </template>
      </el-upload>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="fileList.length === 0">
          确认上传
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Upload, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, type UploadInstance, type UploadProps, type UploadFiles, type UploadFile } from 'element-plus'
import { useUserStore } from '@/stores'
import { IMAGE_MAX_SIZE, VIDEO_MAX_SIZE, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from '@/constants'

interface Props {
  visible?: boolean
  title?: string
  uploadUrl?: string
  multiple?: boolean
  limit?: number
  accept?: string
  fileType?: 'image' | 'video' | 'all'
  autoUpload?: boolean
  drag?: boolean
  listType?: 'text' | 'picture' | 'picture-card'
  showFileList?: boolean
  disabled?: boolean
  tip?: string
  buttonText?: string
  maxSize?: number
  modelValue?: UploadFiles
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '上传文件',
  uploadUrl: '/api/upload',
  multiple: false,
  limit: 1,
  accept: '',
  fileType: 'image',
  autoUpload: false,
  drag: true,
  listType: 'text',
  showFileList: true,
  disabled: false,
  tip: '',
  buttonText: '上传文件',
  maxSize: 0,
  modelValue: () => []
})

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'update:modelValue', files: UploadFiles): void
  (e: 'success', response: any, file: UploadFile): void
  (e: 'error', error: any, file: UploadFile): void
  (e: 'progress', event: any, file: UploadFile): void
  (e: 'remove', file: UploadFile, files: UploadFiles): void
  (e: 'exceed', files: any[], uploadFiles: UploadFiles): void
  (e: 'change', file: UploadFile, files: UploadFiles): void
  (e: 'confirm', files: UploadFiles): void
  (e: 'cancel'): void
}>()

const uploadRef = ref<UploadInstance | null>(null)
const dialogVisible = ref(props.visible)
const fileList = ref<UploadFiles>([...props.modelValue])

const userStore = useUserStore()

watch(() => props.visible, (val) => {
  dialogVisible.value = val
})

watch(() => props.modelValue, (val) => {
  fileList.value = [...val]
})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

const uploadData = computed(() => ({}))

const maxFileSize = computed(() => {
  if (props.maxSize) return props.maxSize
  if (props.fileType === 'image') return IMAGE_MAX_SIZE
  if (props.fileType === 'video') return VIDEO_MAX_SIZE
  return 50 * 1024 * 1024
})

const acceptTypes = computed(() => {
  if (props.accept) return props.accept
  if (props.fileType === 'image') return ALLOWED_IMAGE_TYPES.join(',')
  if (props.fileType === 'video') return ALLOWED_VIDEO_TYPES.join(',')
  return ''
})

const validateFileType = (file: File): boolean => {
  if (!acceptTypes.value) return true
  const types = acceptTypes.value.split(',')
  return types.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    }
    return file.type.match(new RegExp(type.replace('*', '.*')))
  })
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + 'KB'
  return (bytes / (1024 * 1024)).toFixed(2) + 'MB'
}

const handleVisibleChange = (val: boolean) => {
  emit('update:visible', val)
}

const handleBeforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (!validateFileType(file as File)) {
    ElMessage.error(`不支持的文件格式，请上传${props.fileType === 'image' ? '图片' : '视频'}文件`)
    return false
  }

  if (file.size > maxFileSize.value) {
    ElMessage.error(`文件大小不能超过${formatFileSize(maxFileSize.value)}`)
    return false
  }

  return true
}

const handleProgress: UploadProps['onProgress'] = (event, file) => {
  emit('progress', event, file)
}

const handleSuccess: UploadProps['onSuccess'] = (response, file) => {
  if (response.code === 200) {
    emit('success', response.data, file)
  } else {
    ElMessage.error(response.message || '上传失败')
    emit('error', response, file)
  }
}

const handleError: UploadProps['onError'] = (error, file) => {
  ElMessage.error('上传失败')
  emit('error', error, file)
}

const handleRemove: UploadProps['onRemove'] = (file, files) => {
  fileList.value = files
  emit('update:modelValue', files)
  emit('remove', file, files)
}

const handleExceed = (files: any[], uploadFiles: UploadFiles) => {
  ElMessage.warning(`最多只能上传${props.limit}个文件`)
  emit('exceed', files, uploadFiles)
}

const handleBeforeRemove: UploadProps['beforeRemove'] = () => {
  return true
}

const handleConfirm = () => {
  if (props.autoUpload) {
    uploadRef.value?.submit()
  } else {
    emit('confirm', fileList.value)
    dialogVisible.value = false
    emit('update:visible', false)
  }
}

const handleCancel = () => {
  dialogVisible.value = false
  emit('update:visible', false)
  emit('cancel')
}

const submit = () => {
  uploadRef.value?.submit()
}

const clearFiles = () => {
  uploadRef.value?.clearFiles()
}

const abort = (file?: UploadFile) => {
  uploadRef.value?.abort(file)
}

defineExpose({
  submit,
  clearFiles,
  abort,
  uploadRef
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.file-upload-wrapper {
  padding: 10px 0;
}

.upload-component {
  :deep(.el-upload-dragger) {
    padding: 40px;

    &:hover {
      border-color: $primary-color;
    }
  }

  .upload-drag-content {
    text-align: center;

    .upload-icon {
      font-size: 48px;
      color: $primary-color;
      margin-bottom: 16px;
    }

    .upload-text {
      font-size: $font-size-base;
      color: $text-regular;
      margin-bottom: 8px;

      em {
        color: $primary-color;
        font-style: normal;
      }
    }

    .upload-tip {
      font-size: $font-size-extra-small;
      color: $text-secondary;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
