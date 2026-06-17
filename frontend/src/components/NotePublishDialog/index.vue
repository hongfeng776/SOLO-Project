<template>
  <el-dialog
    v-model="visible"
    title="发布笔记"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="!eligibilityResult?.eligible && eligibilityResult?.reasons?.length" class="eligibility-banner">
      <el-alert type="warning" show-icon :closable="false">
        <template #title>
          <div class="banner-title">
            <el-icon><WarningFilled /></el-icon>
            <span>账号暂不符合发布条件</span>
          </div>
        </template>
        <ul class="banner-reasons">
          <li v-for="(reason, idx) in eligibilityResult.reasons" :key="idx">{{ reason }}</li>
        </ul>
      </el-alert>
    </div>

    <el-tabs v-model="formData.noteType" class="note-type-tabs" @tab-change="handleTabChange">
      <el-tab-pane :label="'图文笔记'" :name="NoteType.IMAGE_TEXT" />
      <el-tab-pane :label="'视频笔记'" :name="NoteType.VIDEO" />
    </el-tabs>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="标题" prop="title" class="form-row">
        <div class="field-wrapper">
          <el-input
            v-model="formData.title"
            placeholder="请输入笔记标题"
            maxlength="100"
            show-word-limit
            :class="{ 'field-error': fieldHasError('title') }"
          />
          <el-icon v-if="fieldIsValid('title')" class="valid-icon"><CircleCheckFilled /></el-icon>
        </div>
        <div v-if="fieldErrorMessage('title')" class="error-message">
          <el-icon><CircleCloseFilled /></el-icon>
          <span>{{ fieldErrorMessage('title') }}</span>
        </div>
      </el-form-item>

      <el-form-item label="内容" prop="content" class="form-row">
        <div class="field-wrapper">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="6"
            placeholder="请输入笔记内容"
            maxlength="5000"
            show-word-limit
            :class="{ 'field-error': fieldHasError('content') }"
          />
          <el-icon v-if="fieldIsValid('content')" class="valid-icon"><CircleCheckFilled /></el-icon>
        </div>
        <div v-if="fieldErrorMessage('content')" class="error-message">
          <el-icon><CircleCloseFilled /></el-icon>
          <span>{{ fieldErrorMessage('content') }}</span>
        </div>
      </el-form-item>

      <el-form-item label="封面图" prop="coverImage" class="form-row">
        <Uploader
          v-model="formData.coverImage"
          :limit="1"
          :max-size="5"
          accept-types="image/*"
          tip="建议尺寸 800x800，不超过 5MB"
        />
      </el-form-item>

      <el-form-item v-if="formData.noteType === NoteType.VIDEO" label="视频链接" prop="videoUrl" class="form-row">
        <div class="field-wrapper">
          <el-input
            v-model="formData.videoUrl"
            placeholder="请输入视频 URL"
            :class="{ 'field-error': fieldHasError('videoUrl') }"
          />
          <el-icon v-if="fieldIsValid('videoUrl')" class="valid-icon"><CircleCheckFilled /></el-icon>
        </div>
        <div v-if="fieldErrorMessage('videoUrl')" class="error-message">
          <el-icon><CircleCloseFilled /></el-icon>
          <span>{{ fieldErrorMessage('videoUrl') }}</span>
        </div>
      </el-form-item>

      <el-form-item label="标签" prop="tagIds" class="form-row">
        <el-select
          v-model="formData.tagIds"
          multiple
          filterable
          placeholder="请选择标签，最多 5 个"
          style="width: 100%"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="外部链接" prop="externalLinks" class="form-row">
        <div class="links-wrapper">
          <div v-for="(link, idx) in formData.externalLinks" :key="idx" class="link-row">
            <el-input v-model="formData.externalLinks[idx]" placeholder="https://" style="flex: 1" />
            <el-button :icon="Minus" circle type="danger" @click="removeLink(idx)" />
          </div>
          <el-button v-if="formData.externalLinks.length < 3" :icon="Plus" @click="addLink">
            添加链接
          </el-button>
        </div>
      </el-form-item>
    </el-form>

    <div v-if="showScheduleSection" class="schedule-section">
      <el-divider content-position="left">定时发布</el-divider>
      <el-form label-width="100px">
        <el-form-item label="发布时间" required>
          <div class="field-wrapper">
            <el-date-picker
              v-model="scheduleTime"
              type="datetime"
              placeholder="选择发布时间"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              :disabled-date="disabledScheduleDate"
              :class="{ 'field-error': scheduleError || scheduleConflict }"
            />
            <el-icon v-if="scheduleValid" class="valid-icon"><CircleCheckFilled /></el-icon>
          </div>
          <div v-if="scheduleChecking" class="checking-message">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在检查时间冲突...</span>
          </div>
          <div v-else-if="scheduleError" class="error-message">
            <el-icon><CircleCloseFilled /></el-icon>
            <span>{{ scheduleError }}</span>
          </div>
          <div v-else-if="scheduleConflict && scheduleConflictNotes.length" class="error-message">
            <el-icon><CircleCloseFilled /></el-icon>
            <span>时间冲突：已存在「{{ scheduleConflictNotes[0].title }}」定在 {{ scheduleConflictNotes[0].scheduleTime }}</span>
          </div>
          <div v-else-if="scheduleValid" class="success-message">
            <el-icon><CircleCheckFilled /></el-icon>
            <span>发布时间有效</span>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button :loading="draftLoading" @click="handleSaveDraft">
          保存草稿
        </el-button>
        <el-button
          v-if="showScheduleSection"
          type="warning"
          :loading="scheduleLoading"
          :disabled="!canSchedulePublish"
          @click="handleSchedulePublish"
        >
          确认定时发布
        </el-button>
        <template v-else>
          <el-button
            type="warning"
            :disabled="!canPublish"
            @click="toggleScheduleSection"
          >
            定时发布
          </el-button>
          <el-button
            type="primary"
            :loading="publishLoading"
            :disabled="!canPublish"
            @click="handlePublishNow"
          >
            直接发布
          </el-button>
        </template>
      </div>
    </template>

    <el-dialog
      v-model="duplicateDialogVisible"
      title="检测到相似内容"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="duplicate-warning">
        <el-icon class="warning-icon"><WarningFilled /></el-icon>
        <p>系统检测到以下内容与您的笔记相似度较高，是否仍要继续发布？</p>
      </div>
      <div class="duplicate-list">
        <div v-for="note in similarNotes" :key="note.id" class="duplicate-item">
          <div class="duplicate-header">
            <span class="duplicate-title">{{ note.title }}</span>
            <el-tag type="warning" size="small">{{ (note.similarity * 100).toFixed(1) }}% 相似</el-tag>
          </div>
          <el-tooltip v-if="note.diff.length > 60" :content="note.diff" placement="bottom">
            <div class="duplicate-diff">{{ truncateText(note.diff, 60) }}</div>
          </el-tooltip>
          <div v-else class="duplicate-diff">{{ note.diff }}</div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleDuplicateCancel">取消并编辑</el-button>
        <el-button type="primary" :loading="publishLoading" @click="handleDuplicateConfirm">
          继续发布
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled,
  Plus,
  Minus,
  Loading
} from '@element-plus/icons-vue'
import { NoteType } from '@enums/business'
import type {
  NotePublishData,
  NoteScheduleData,
  ComplianceCheckResult as ComplianceCheckResultType,
  ComplianceViolation,
  SimilarNote,
  PublishEligibilityResult
} from '@/types/business'
import {
  saveDraft,
  submitForPublish,
  schedulePublish
} from '@/api/note-publish'
import {
  checkContentCompliance,
  checkSimilarity,
  checkScheduleConflict
} from '@/api/note-compliance'
import { checkPublishEligibility } from '@/api/user-account'
import { useDebounce } from '@hooks/useCommon'
import Uploader from '@components/Uploader/index.vue'

interface Props {
  modelValue: boolean
  editData?: Partial<NotePublishData> | null
}

interface Emits {
  (e: 'update:modelValue', val: boolean): void
  (e: 'success', result: { id: number; status: number; action: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  editData: null
})

const emit = defineEmits<Emits>()

const visible = ref(false)
const formRef = ref<FormInstance>()
const draftLoading = ref(false)
const publishLoading = ref(false)
const scheduleLoading = ref(false)
const duplicateDialogVisible = ref(false)
const showScheduleSection = ref(false)
const scheduleTime = ref('')
const scheduleChecking = ref(false)
const scheduleError = ref('')
const scheduleConflict = ref(false)
const scheduleConflictNotes = ref<Array<{ id: number; title: string; scheduleTime: string }>>([])
const eligibilityResult = ref<PublishEligibilityResult | null>(null)

const formData = reactive<NotePublishData>({
  title: '',
  content: '',
  coverImage: '',
  videoUrl: '',
  noteType: NoteType.IMAGE_TEXT,
  externalLinks: [],
  tagIds: [],
  contentFingerprint: ''
})

const availableTags = ref<Array<{ id: number; name: string }>>([
  { id: 1, name: '生活' },
  { id: 2, name: '美食' },
  { id: 3, name: '旅行' },
  { id: 4, name: '数码' },
  { id: 5, name: '时尚' },
  { id: 6, name: '科技' },
  { id: 7, name: '教育' },
  { id: 8, name: '运动' },
  { id: 9, name: '职场' },
  { id: 10, name: '情感' }
])

const complianceResult = ref<ComplianceCheckResultType | null>(null)
const similarNotes = ref<SimilarNote[]>([])
const pendingPublishAction = ref<null | 'publish' | 'schedule'>(null)

const rules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 10, max: 5000, message: '内容长度在 10 到 5000 个字符', trigger: 'blur' }
  ],
  coverImage: [
    {
      validator: (_rule, _value, callback) => {
        if (!formData.coverImage) {
          callback(new Error('请上传封面图'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  videoUrl: [
    {
      validator: (_rule, value, callback) => {
        if (formData.noteType === NoteType.VIDEO) {
          if (!value) {
            callback(new Error('请输入视频链接'))
          } else if (!/^https?:\/\/.+/.test(value)) {
            callback(new Error('视频链接必须以 http:// 或 https:// 开头'))
          } else {
            callback()
          }
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  tagIds: [
    {
      validator: (_rule, value, callback) => {
        if (!value || value.length === 0) {
          callback(new Error('请至少选择一个标签'))
        } else if (value.length > 5) {
          callback(new Error('最多选择 5 个标签'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  externalLinks: [
    {
      validator: (_rule, value, callback) => {
        if (value && value.length) {
          for (const link of value) {
            if (link && !/^https?:\/\/.+/.test(link)) {
              callback(new Error('外部链接必须以 http:// 或 https:// 开头'))
              return
            }
          }
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

const fieldViolations = computed(() => {
  const map: Record<string, string> = {}
  if (complianceResult.value?.violations) {
    for (const v of complianceResult.value.violations) {
      if (v.field && !map[v.field]) {
        map[v.field] = v.message
      }
    }
  }
  return map
})

const fieldHasError = (field: string): boolean => {
  return !!fieldViolations.value[field]
}

const fieldErrorMessage = (field: string): string => {
  return fieldViolations.value[field] || ''
}

const fieldIsValid = (field: string): boolean => {
  if (!complianceResult.value) return false
  if (!complianceResult.value.passed) return false
  const val = (formData as Record<string, unknown>)[field]
  if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
    return false
  }
  return true
}

const canPublish = computed(() => {
  if (!eligibilityResult.value?.eligible) return false
  if (!formData.title || !formData.content || !formData.coverImage) return false
  if (formData.noteType === NoteType.VIDEO && !formData.videoUrl) return false
  if (!formData.tagIds || formData.tagIds.length === 0) return false
  if (complianceResult.value && !complianceResult.value.passed) return false
  return true
})

const scheduleValid = computed(() => {
  if (!scheduleTime.value) return false
  if (scheduleError.value) return false
  if (scheduleConflict.value) return false
  if (scheduleChecking.value) return false
  return true
})

const canSchedulePublish = computed(() => {
  if (!canPublish.value) return false
  return scheduleValid.value
})

const handleTabChange = () => {
  if (formData.noteType === NoteType.IMAGE_TEXT) {
    formData.videoUrl = ''
  }
}

const addLink = () => {
  if (formData.externalLinks.length < 3) {
    formData.externalLinks.push('')
  }
}

const removeLink = (idx: number) => {
  formData.externalLinks.splice(idx, 1)
}

const disabledScheduleDate = (date: Date) => {
  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() + 5)
  return date < minDate
}

const validateScheduleTime = () => {
  scheduleError.value = ''
  scheduleConflict.value = false
  scheduleConflictNotes.value = []

  if (!scheduleTime.value) {
    scheduleError.value = '请选择发布时间'
    return
  }

  const selected = new Date(scheduleTime.value)
  const now = new Date()
  const diffMinutes = (selected.getTime() - now.getTime()) / 60000

  if (diffMinutes < 5) {
    scheduleError.value = '发布时间必须至少在 5 分钟之后'
    return
  }

  debouncedCheckConflict()
}

const checkScheduleConflictFn = async () => {
  if (!scheduleTime.value) return
  scheduleChecking.value = true
  try {
    const result = await checkScheduleConflict({ scheduleTime: scheduleTime.value })
    scheduleConflict.value = result.hasConflict
    scheduleConflictNotes.value = result.conflictingNotes
  } catch {
    scheduleConflict.value = false
  } finally {
    scheduleChecking.value = false
  }
}

const [debouncedCheckConflict] = useDebounce(checkScheduleConflictFn, 500)

watch(scheduleTime, () => {
  validateScheduleTime()
})

const runComplianceCheck = async () => {
  if (!formData.title && !formData.content) {
    complianceResult.value = null
    return
  }
  try {
    const result = await checkContentCompliance({ ...formData })
    complianceResult.value = result
  } catch {
    complianceResult.value = null
  }
}

const [debouncedComplianceCheck] = useDebounce(runComplianceCheck, 500)

watch(
  () => [formData.title, formData.content],
  () => {
    debouncedComplianceCheck()
  }
)

const truncateText = (text: string, maxLen: number): string => {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

const toggleScheduleSection = () => {
  showScheduleSection.value = !showScheduleSection.value
  if (!showScheduleSection.value) {
    scheduleTime.value = ''
    scheduleError.value = ''
    scheduleConflict.value = false
    scheduleConflictNotes.value = []
  }
}

const initForm = () => {
  if (props.editData) {
    Object.assign(formData, {
      title: props.editData.title || '',
      content: props.editData.content || '',
      coverImage: props.editData.coverImage || '',
      videoUrl: props.editData.videoUrl || '',
      noteType: props.editData.noteType || NoteType.IMAGE_TEXT,
      externalLinks: props.editData.externalLinks || [],
      tagIds: props.editData.tagIds || [],
      contentFingerprint: props.editData.contentFingerprint || ''
    })
  } else {
    formData.title = ''
    formData.content = ''
    formData.coverImage = ''
    formData.videoUrl = ''
    formData.noteType = NoteType.IMAGE_TEXT
    formData.externalLinks = []
    formData.tagIds = []
    formData.contentFingerprint = ''
  }
  showScheduleSection.value = false
  scheduleTime.value = ''
  scheduleError.value = ''
  scheduleConflict.value = false
  scheduleConflictNotes.value = []
  complianceResult.value = null
  duplicateDialogVisible.value = false
  similarNotes.value = []
  pendingPublishAction.value = null
}

const checkEligibility = async () => {
  try {
    eligibilityResult.value = await checkPublishEligibility()
  } catch {
    eligibilityResult.value = {
      eligible: true,
      reasons: [],
      accountStatus: {
        status: 1,
        realNameVerified: 2,
        isBanned: false,
        isFlowLimited: false,
        recentViolations: 0
      }
    }
  }
}

watch(
  () => props.modelValue,
  async (val) => {
    visible.value = val
    if (val) {
      initForm()
      await nextTick()
      await checkEligibility()
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

const handleSaveDraft = async () => {
  if (!formData.title && !formData.content) {
    ElMessage.warning('请至少填写标题或内容')
    return
  }
  draftLoading.value = true
  try {
    const result = await saveDraft({
      title: formData.title,
      content: formData.content,
      coverImage: formData.coverImage,
      videoUrl: formData.videoUrl,
      noteType: formData.noteType,
      externalLinks: formData.externalLinks.filter(Boolean),
      tagIds: formData.tagIds
    })
    ElMessage.success('草稿保存成功')
    emit('success', { id: result.id, status: 0, action: 'draft' })
    handleClose()
  } catch (err) {
    ElMessage.error('草稿保存失败')
    console.error(err)
  } finally {
    draftLoading.value = false
  }
}

const validateForm = async (): Promise<boolean> => {
  if (!formRef.value) return false
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return false

  if (complianceResult.value && !complianceResult.value.passed) {
    ElMessage.warning('内容存在合规问题，请修改后再发布')
    return false
  }

  return true
}

const checkDuplicateBeforePublish = async (action: 'publish' | 'schedule'): Promise<boolean> => {
  pendingPublishAction.value = action
  try {
    const result = await checkSimilarity({
      title: formData.title,
      content: formData.content
    })
    formData.contentFingerprint = result.fingerprint
    if (result.isDuplicate && result.similarNotes.length > 0) {
      similarNotes.value = result.similarNotes
      duplicateDialogVisible.value = true
      return false
    }
    return true
  } catch {
    return true
  }
}

const handlePublishNow = async () => {
  if (!(await validateForm())) return
  publishLoading.value = true
  try {
    const shouldPublish = await checkDuplicateBeforePublish('publish')
    if (!shouldPublish) {
      publishLoading.value = false
      return
    }
    await doPublishNow()
  } catch (err) {
    ElMessage.error('发布失败')
    console.error(err)
  } finally {
    publishLoading.value = false
  }
}

const doPublishNow = async () => {
  const result = await submitForPublish({
    title: formData.title,
    content: formData.content,
    coverImage: formData.coverImage,
    videoUrl: formData.videoUrl,
    noteType: formData.noteType,
    externalLinks: formData.externalLinks.filter(Boolean),
    tagIds: formData.tagIds,
    contentFingerprint: formData.contentFingerprint
  })
  ElMessage.success('发布成功')
  emit('success', { id: result.id, status: result.status, action: 'publish' })
  handleClose()
}

const handleSchedulePublish = async () => {
  if (!(await validateForm())) return
  if (!scheduleValid.value) return
  scheduleLoading.value = true
  try {
    const shouldPublish = await checkDuplicateBeforePublish('schedule')
    if (!shouldPublish) {
      scheduleLoading.value = false
      return
    }
    await doSchedulePublish()
  } catch (err) {
    ElMessage.error('定时发布失败')
    console.error(err)
  } finally {
    scheduleLoading.value = false
  }
}

const doSchedulePublish = async () => {
  const scheduleData: NoteScheduleData = {
    title: formData.title,
    content: formData.content,
    coverImage: formData.coverImage,
    videoUrl: formData.videoUrl,
    noteType: formData.noteType,
    externalLinks: formData.externalLinks.filter(Boolean),
    tagIds: formData.tagIds,
    contentFingerprint: formData.contentFingerprint,
    scheduleTime: scheduleTime.value
  }
  const result = await schedulePublish(scheduleData)
  ElMessage.success(`定时发布成功，将于 ${result.scheduleTime} 发布`)
  emit('success', { id: result.id, status: result.status, action: 'schedule' })
  handleClose()
}

const handleDuplicateCancel = () => {
  duplicateDialogVisible.value = false
  pendingPublishAction.value = null
  publishLoading.value = false
  scheduleLoading.value = false
}

const handleDuplicateConfirm = async () => {
  duplicateDialogVisible.value = false
  if (pendingPublishAction.value === 'publish') {
    publishLoading.value = true
    try {
      await doPublishNow()
    } catch (err) {
      ElMessage.error('发布失败')
      console.error(err)
    } finally {
      publishLoading.value = false
    }
  } else if (pendingPublishAction.value === 'schedule') {
    scheduleLoading.value = true
    try {
      await doSchedulePublish()
    } catch (err) {
      ElMessage.error('定时发布失败')
      console.error(err)
    } finally {
      scheduleLoading.value = false
    }
  }
}

void ElMessageBox
</script>

<style lang="scss" scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.field-error {
  animation: shake 0.4s ease-in-out;
  :deep(.el-input__wrapper), :deep(.el-textarea__inner) {
    box-shadow: 0 0 0 1px #f56c6c inset;
  }
}

.eligibility-banner {
  margin-bottom: 16px;

  .banner-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #e6a23c;
  }

  .banner-reasons {
    margin: 8px 0 0 0;
    padding-left: 20px;
    color: #e6a23c;
    font-size: 13px;

    li {
      line-height: 1.8;
    }
  }
}

.note-type-tabs {
  margin-bottom: 8px;
}

.form-row {
  position: relative;
}

.field-wrapper {
  position: relative;
  width: 100%;
}

.valid-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #67c23a;
  font-size: 16px;
  pointer-events: none;
  z-index: 1;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #f56c6c;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;

  .el-icon {
    font-size: 12px;
  }
}

.success-message {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #67c23a;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;

  .el-icon {
    font-size: 12px;
  }
}

.checking-message {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;

  .el-icon {
    font-size: 12px;
  }
}

.links-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .link-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.schedule-section {
  margin-top: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.duplicate-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  background: #fdf6ec;
  border-radius: 4px;
  margin-bottom: 16px;

  .warning-icon {
    color: #e6a23c;
    font-size: 20px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  p {
    margin: 0;
    color: #e6a23c;
    font-size: 14px;
    line-height: 1.6;
  }
}

.duplicate-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 320px;
  overflow-y: auto;
}

.duplicate-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;

  .duplicate-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .duplicate-title {
    font-weight: 500;
    color: #303133;
    font-size: 14px;
  }

  .duplicate-diff {
    font-size: 12px;
    color: #606266;
    line-height: 1.6;
  }
}
</style>
