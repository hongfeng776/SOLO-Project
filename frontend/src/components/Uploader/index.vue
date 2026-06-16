<template>
  <div class="uploader-wrapper">
    <el-upload
      ref="uploadRef"
      :action="uploadAction"
      :headers="uploadHeaders"
      :data="uploadData"
      :name="fieldName"
      :accept="acceptTypes"
      :limit="limit"
      :multiple="multiple"
      :file-list="fileList"
      :show-file-list="showFileList"
      :drag="drag"
      :disabled="disabled"
      :auto-upload="autoUpload"
      list-type="picture-card"
      :before-upload="handleBeforeUpload"
      :on-success="handleSuccess"
      :on-error="handleError"
      :on-remove="handleRemove"
      :on-exceed="handleExceed"
      :on-preview="handlePreview"
      @change="handleChange"
    >
      <template v-if="$slots.default">
        <slot />
      </template>
      <template v-else-if="drag">
        <el-icon class="uploader-icon"><UploadFilled /></el-icon>
        <div class="uploader-text">将文件拖到此处，或<em>点击上传</em></div>
      </template>
      <template v-else>
        <el-icon><Plus /></el-icon>
      </template>
      <template #tip>
        <div v-if="tip" class="uploader-tip">{{ tip }}</div>
      </template>
    </el-upload>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type UploadInstance, type UploadProps, type UploadFile, type UploadUserFile } from 'element-plus'
import { TOKEN_KEY } from '@enums/cache'
import { storage } from '@utils/storage'
import { uploadImage } from '@api/upload'

interface UploaderFile {
  name: string
  url: string
}

interface Props {
  modelValue?: string | UploaderFile | (string | UploaderFile)[]
  action?: string
  fieldName?: string
  acceptTypes?: string
  limit?: number
  multiple?: boolean
  drag?: boolean
  showFileList?: boolean
  disabled?: boolean
  autoUpload?: boolean
  maxSize?: number
  tip?: string
  uploadType?: 'image' | 'file'
  customUpload?: (file: File) => Promise<{ url: string; filename: string }>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  action: '',
  fieldName: 'file',
  acceptTypes: 'image/*',
  limit: 1,
  multiple: false,
  drag: false,
  showFileList: true,
  disabled: false,
  autoUpload: true,
  maxSize: 10,
  tip: '',
  uploadType: 'image',
  customUpload: undefined
})

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | UploaderFile | (string | UploaderFile)[]): void
  (e: 'success', file: UploaderFile, response: unknown): void
  (e: 'error', error: unknown): void
  (e: 'remove', file: UploaderFile): void
}>()

const uploadRef = ref<UploadInstance>()

const fileList = ref<UploadUserFile[]>([])

const uploadAction = computed(() => props.action || (import.meta.env.VITE_API_BASE_URL || '/api') + '/upload/image')

const uploadHeaders = computed(() => {
  const token = storage.get<string>(TOKEN_KEY)
  return token ? { Authorization: `Bearer ${token}` } : {}
})

const uploadData = computed(() => ({}))

watch(
  () => props.modelValue,
  (val) => {
    if (!val) {
      fileList.value = []
      return
    }
    const values = Array.isArray(val) ? val : [val]
    fileList.value = values.map((item, index) => {
      if (typeof item === 'string') {
        return { name: `file-${index}`, url: item, uid: Date.now() + index } as UploadUserFile
      }
      return { name: item.name || `file-${index}`, url: item.url, uid: Date.now() + index } as UploadUserFile
    })
  },
  { immediate: true, deep: true }
)

const emitValue = () => {
  const result = fileList.value
    .map((f) => f.url || (f.response as { url?: string })?.url)
    .filter(Boolean) as string[]

  if (props.multiple) {
    emit('update:modelValue', result)
  } else {
    emit('update:modelValue', result[0] || '')
  }
}

const handleBeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const size = rawFile.size / 1024 / 1024
  if (size > props.maxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB`)
    return false
  }
  return true
}

const handleSuccess: UploadProps['onSuccess'] = (response, uploadFile) => {
  const res = response as { code?: number; data?: { url?: string; filename?: string }; url?: string }
  const url = res.data?.url || res.url
  const filename = res.data?.filename || uploadFile.name
  if (uploadFile) {
    uploadFile.url = url
  }
  emit('success', { name: filename, url: url || '' }, response)
  emitValue()
  ElMessage.success('上传成功')
}

const handleError: UploadProps['onError'] = (error) => {
  console.error('[Uploader] error:', error)
  emit('error', error)
  ElMessage.error('上传失败，请重试')
}

const handleRemove: UploadProps['onRemove'] = (uploadFile) => {
  const url = uploadFile.url || (uploadFile.response as { url?: string })?.url
  emit('remove', { name: uploadFile.name, url: url || '' })
  setTimeout(emitValue, 50)
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`)
}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  if (uploadFile.url) {
    window.open(uploadFile.url, '_blank')
  }
}

const handleChange: UploadProps['onChange'] = (_uploadFile, _uploadFiles) => {
  // handled by specific events
}

const submit = async (): Promise<UploaderFile[]> => {
  const uploadFn = internalCustomUpload.value || props.customUpload
  if (uploadFn) {
    const files = (uploadRef.value as unknown as { uploadFiles: UploadFile[] })?.uploadFiles || []
    const results: UploaderFile[] = []
    for (const f of files) {
      if (f.raw && !f.url) {
        try {
          const res = await uploadFn(f.raw)
          f.url = res.url
          results.push({ name: res.filename, url: res.url })
        } catch (error) {
          throw error
        }
      } else if (f.url) {
        results.push({ name: f.name, url: f.url })
      }
    }
    return results
  }
  return uploadRef.value
    ? ((uploadRef.value as unknown as { uploadFiles: UploadFile[] }).uploadFiles)
        .filter((f: UploadFile) => f.status === 'success' || f.url)
        .map((f: UploadFile) => ({
          name: f.name,
          url: f.url || (f.response as { url?: string })?.url || ''
        }))
    : []
}

const clearFiles = () => {
  uploadRef.value?.clearFiles()
  fileList.value = []
  emitValue()
}

const abort = () => {
  uploadRef.value?.abort()
}

defineExpose({ submit, clearFiles, abort })

const internalCustomUpload = ref<Props['customUpload']>(props.customUpload)

if (props.uploadType === 'image' && !props.customUpload) {
  internalCustomUpload.value = uploadImage as unknown as Props['customUpload']
}
</script>

<style lang="scss" scoped>
.uploader-wrapper {
  width: 100%;
}

.uploader-icon {
  font-size: 28px;
  color: $text-secondary;
}

.uploader-text {
  color: $text-secondary;
  font-size: 14px;
  margin-top: 8px;

  em {
    color: $color-primary;
    font-style: normal;
  }
}

.uploader-tip {
  color: $text-secondary;
  font-size: 12px;
  margin-top: 8px;
  line-height: 1.5;
}
</style>
