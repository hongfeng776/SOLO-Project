<template>
  <el-dialog
    v-model="visible"
    title="批量发布"
    width="720px"
    :close-on-click-modal="false"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="!hasPermission" class="permission-banner">
      <el-icon><WarningFilled /></el-icon>
      <span>您暂无批量发布权限，请提升账号等级</span>
    </div>

    <div v-if="stage === 'input' && hasPermission" class="input-stage">
      <div class="limit-info">
        <el-alert
          :title="`您的账号等级为 ${creatorLevelDisplay}，单次最多可批量发布 ${batchLimit} 条`"
          type="info"
          :closable="false"
          show-icon
        />
      </div>

      <el-tabs v-model="inputMode" class="mode-tabs">
        <el-tab-pane label="文件上传" name="file">
          <el-upload
            ref="uploadRef"
            drag
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".json,.csv,.xlsx"
            :before-upload="handleBeforeUpload"
            :on-exceed="handleExceed"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-icon class="uploader-icon"><UploadFilled /></el-icon>
            <div class="uploader-text">将文件拖到此处，或<em>点击上传</em></div>
            <template #tip>
              <div class="uploader-tip">
                支持 .json / .csv / .xlsx 格式，单个文件不超过 10MB
                <a class="template-link" href="javascript:void(0)" @click="downloadTemplate">下载模板</a>
              </div>
            </template>
          </el-upload>
        </el-tab-pane>
        <el-tab-pane label="手动输入" name="manual">
          <div class="manual-input">
            <el-form label-width="100px">
              <el-form-item label="笔记数量">
                <el-input-number
                  v-model="manualCount"
                  :min="1"
                  :max="batchLimit"
                  :step="1"
                  controls-position="right"
                  style="width: 200px"
                />
                <span class="count-tip">最多 {{ batchLimit }} 条</span>
              </el-form-item>
            </el-form>
            <div v-if="manualCount > 0" class="manual-note-list">
              <div v-for="i in manualCount" :key="i" class="manual-note-item">
                <div class="item-index">第 {{ i }} 条</div>
                <el-input
                  v-model="manualNotes[i - 1].title"
                  placeholder="笔记标题"
                  class="note-input"
                />
                <el-input
                  v-model="manualNotes[i - 1].content"
                  type="textarea"
                  :rows="2"
                  placeholder="笔记内容"
                  class="note-input"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div v-if="errorMessage" class="error-message">
        <el-icon><CircleCloseFilled /></el-icon>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <div v-if="stage === 'processing' && hasPermission" class="processing-stage">
      <div v-if="isLoadingInitial" class="data-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-row"></div>
      </div>
      <template v-else>
        <div class="progress-section">
          <div class="progress-label">
            处理中 {{ processedCount }}/{{ totalCount }} ({{ progressPercent }}%)
          </div>
          <el-progress
            :percentage="progressPercent"
            :stroke-width="20"
            striped
            striped-flow
            :color="progressColor"
          />
        </div>
        <div class="stats-counters">
          <div class="stat-item success">
            <span class="stat-icon">✅</span>
            <span class="stat-label">成功:</span>
            <span class="stat-value">{{ successCount }}</span>
          </div>
          <div class="stat-item fail">
            <span class="stat-icon">❌</span>
            <span class="stat-label">失败:</span>
            <span class="stat-value">{{ failCount }}</span>
          </div>
          <div class="stat-item pending">
            <span class="stat-icon">⏳</span>
            <span class="stat-label">待处理:</span>
            <span class="stat-value">{{ pendingCount }}</span>
          </div>
        </div>
        <div v-if="failResults.length > 0" class="fail-list">
          <div class="fail-list-title">失败项详情</div>
          <div v-for="item in failResults" :key="item.index" class="fail-item">
            <span class="fail-index">第 {{ item.index + 1 }} 条</span>
            <span class="fail-error">{{ item.error }}</span>
          </div>
        </div>
      </template>
    </div>

    <div v-if="stage === 'result' && hasPermission" class="result-stage">
      <div class="summary-cards">
        <el-card class="summary-card total" shadow="hover">
          <div class="card-label">总数</div>
          <div class="card-value">{{ batchResult?.total || 0 }}</div>
        </el-card>
        <el-card class="summary-card success" shadow="hover">
          <div class="card-label">成功</div>
          <div class="card-value">{{ batchResult?.success || 0 }}</div>
        </el-card>
        <el-card class="summary-card fail" shadow="hover">
          <div class="card-label">失败</div>
          <div class="card-value">{{ batchResult?.fail || 0 }}</div>
        </el-card>
      </div>

      <div v-if="failResults.length > 0" class="result-fail-section">
        <div class="section-header">
          <span class="section-title">失败项 ({{ failResults.length }})</span>
          <div class="section-actions">
            <el-button size="small" type="primary" :icon="Refresh" @click="retryAllFailed">
              全部重试
            </el-button>
            <el-button size="small" :icon="Download" @click="downloadFailReport">
              下载失败报告
            </el-button>
          </div>
        </div>
        <div class="fail-items">
          <div v-for="item in failResults" :key="item.index" class="fail-item-row">
            <div class="fail-item-info">
              <span class="fail-item-index">第 {{ item.index + 1 }} 条</span>
              <span class="fail-item-error">{{ item.error }}</span>
            </div>
            <el-button
              link
              type="primary"
              size="small"
              :icon="RefreshRight"
              @click="retrySingleFailed(item.index)"
            >
              重试
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="all-success">
        <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
        <div class="success-text">全部处理成功！</div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">{{ stage === 'result' ? '关闭' : '取消' }}</el-button>
      <el-button
        v-if="stage === 'input'"
        type="primary"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        开始发布
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, type UploadInstance, type UploadProps, type UploadFile } from 'element-plus'
import {
  UploadFilled,
  WarningFilled,
  CircleCloseFilled,
  Download,
  Refresh,
  RefreshRight,
  CircleCheckFilled
} from '@element-plus/icons-vue'
import { batchPublish, getBatchPublishLimit } from '@/api/note-publish'
import { useDownload } from '@/hooks/index'
import type { BatchPublishResult, NotePublishData } from '@/types/business'

interface Props {
  modelValue: boolean
  creatorLevel?: number
}

interface Emits {
  (e: 'update:modelValue', val: boolean): void
  (e: 'complete', result: BatchPublishResult): void
}

const props = withDefaults(defineProps<Props>(), {
  creatorLevel: 1
})

const emit = defineEmits<Emits>()

const { downloadByBlob } = useDownload()

const visible = ref(false)
const submitting = ref(false)
const isLoadingInitial = ref(true)
const stage = ref<'input' | 'processing' | 'result'>('input')
const inputMode = ref<'file' | 'manual'>('file')
const errorMessage = ref('')
const batchLimit = ref(0)
const hasPermission = ref(true)

const uploadRef = ref<UploadInstance>()
const uploadedFile = ref<File | null>(null)

const manualCount = ref(0)
const manualNotes = ref<NotePublishData[]>([])

const totalCount = ref(0)
const processedCount = ref(0)
const successCount = ref(0)
const failCount = ref(0)
const pendingCount = ref(0)
const batchResult = ref<BatchPublishResult | null>(null)

const creatorLevelDisplay = computed(() => {
  if (props.creatorLevel >= 5) return '高级'
  if (props.creatorLevel >= 3) return '中级'
  return '初级'
})

const failResults = computed(() => {
  return batchResult.value?.results.filter((r) => !r.success) || []
})

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((processedCount.value / totalCount.value) * 100)
})

const progressColor = computed(() => {
  if (progressPercent.value < 50) return '#e6a23c'
  if (progressPercent.value < 80) return '#409eff'
  return '#67c23a'
})

const canSubmit = computed(() => {
  if (!hasPermission.value) return false
  if (inputMode.value === 'file') {
    return !!uploadedFile.value
  }
  return manualCount.value > 0 && manualNotes.value.every((n) => n.title && n.content)
})

watch(
  () => props.modelValue,
  (val) => {
    visible.value = val
    if (val) {
      resetState()
      loadLimitInfo()
    }
  },
  { immediate: true }
)

watch(visible, (val) => {
  emit('update:modelValue', val)
})

watch(manualCount, (val) => {
  const current = manualNotes.value
  if (val > current.length) {
    for (let i = current.length; i < val; i++) {
      current.push({ title: '', content: '' })
    }
  } else {
    manualNotes.value = current.slice(0, val)
  }
})

const resetState = () => {
  stage.value = 'input'
  inputMode.value = 'file'
  errorMessage.value = ''
  uploadedFile.value = null
  manualCount.value = 0
  manualNotes.value = []
  totalCount.value = 0
  processedCount.value = 0
  successCount.value = 0
  failCount.value = 0
  pendingCount.value = 0
  batchResult.value = null
  uploadRef.value?.clearFiles()
}

const loadLimitInfo = async () => {
  try {
    const res = await getBatchPublishLimit(props.creatorLevel)
    batchLimit.value = res.limit
    hasPermission.value = res.limit > 0
  } catch {
    if (props.creatorLevel <= 2) {
      batchLimit.value = 5
    } else if (props.creatorLevel <= 4) {
      batchLimit.value = 20
    } else {
      batchLimit.value = 50
    }
    hasPermission.value = props.creatorLevel >= 1
  }
}

const handleBeforeUpload: UploadProps['beforeUpload'] = (rawFile) => {
  const size = rawFile.size / 1024 / 1024
  if (size > 10) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  const validTypes = ['.json', '.csv', '.xlsx']
  const fileName = rawFile.name.toLowerCase()
  if (!validTypes.some((t) => fileName.endsWith(t))) {
    ElMessage.error('仅支持 .json / .csv / .xlsx 格式文件')
    return false
  }
  return true
}

const handleExceed: UploadProps['onExceed'] = () => {
  ElMessage.warning('只能上传一个文件')
}

const handleFileChange: UploadProps['onChange'] = (uploadFile) => {
  if (uploadFile.raw) {
    uploadedFile.value = uploadFile.raw
    errorMessage.value = ''
  }
}

const handleFileRemove: UploadProps['onRemove'] = () => {
  uploadedFile.value = null
}

const downloadTemplate = () => {
  const template = [
    { title: '示例标题1', content: '示例内容1', noteType: 1 },
    { title: '示例标题2', content: '示例内容2', noteType: 1 }
  ]
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
  downloadByBlob(blob, 'batch-publish-template.json')
}

const parseFileNotes = async (file: File): Promise<NotePublishData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        if (file.name.toLowerCase().endsWith('.json')) {
          const data = JSON.parse(text)
          if (!Array.isArray(data)) {
            reject(new Error('JSON 文件格式错误，应为数组'))
            return
          }
          resolve(
            data.map((item: Record<string, unknown>) => ({
              title: String(item.title || ''),
              content: String(item.content || ''),
              noteType: Number(item.noteType) || 1
            }))
          )
        } else {
          reject(new Error('暂不支持该文件格式解析'))
        }
      } catch (err) {
        reject(new Error('文件解析失败: ' + (err as Error).message))
      }
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

const simulateProgress = (total: number) => {
  totalCount.value = total
  processedCount.value = 0
  successCount.value = 0
  failCount.value = 0
  pendingCount.value = total

  const interval = setInterval(() => {
    if (processedCount.value >= totalCount.value) {
      clearInterval(interval)
      return
    }
    processedCount.value++
    pendingCount.value--
    if (Math.random() > 0.2) {
      successCount.value++
    } else {
      failCount.value++
    }
  }, 200)
}

const handleSubmit = async () => {
  if (!hasPermission.value) {
    errorMessage.value = '您暂无批量发布权限'
    return
  }

  errorMessage.value = ''
  let notes: NotePublishData[] = []

  try {
    if (inputMode.value === 'file') {
      if (!uploadedFile.value) {
        errorMessage.value = '请先上传文件'
        return
      }
      notes = await parseFileNotes(uploadedFile.value)
    } else {
      notes = manualNotes.value.filter((n) => n.title && n.content)
    }
  } catch (err) {
    errorMessage.value = (err as Error).message
    return
  }

  if (notes.length === 0) {
    errorMessage.value = '没有有效的笔记数据'
    return
  }

  if (notes.length > batchLimit.value) {
    errorMessage.value = `最多只能批量发布 ${batchLimit.value} 条，当前 ${notes.length} 条`
    return
  }

  const invalidNotes = notes.filter((n) => !n.title || !n.content)
  if (invalidNotes.length > 0) {
    errorMessage.value = `有 ${invalidNotes.length} 条笔记缺少标题或内容`
    return
  }

  submitting.value = true
  stage.value = 'processing'
  isLoadingInitial.value = true

  simulateProgress(notes.length)

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    isLoadingInitial.value = false

    const result = await batchPublish({ notes })
    batchResult.value = result
    totalCount.value = result.total
    successCount.value = result.success
    failCount.value = result.fail
    processedCount.value = result.total
    pendingCount.value = 0

    stage.value = 'result'
    emit('complete', result)
  } catch (err) {
    errorMessage.value = (err as Error).message || '批量发布失败'
    stage.value = 'input'
  } finally {
    submitting.value = false
  }
}

const retryAllFailed = () => {
  const failedItems = failResults.value
  if (failedItems.length === 0) {
    ElMessage.info('没有需要重试的失败项')
    return
  }
  ElMessage.success(`已发起 ${failedItems.length} 项重试`)
}

const retrySingleFailed = (index: number) => {
  ElMessage.success(`已发起第 ${index + 1} 条重试`)
}

const downloadFailReport = () => {
  if (!batchResult.value) return
  const failReport = {
    batchNo: batchResult.value.batchNo,
    total: batchResult.value.total,
    success: batchResult.value.success,
    fail: batchResult.value.fail,
    failedItems: failResults.value
  }
  const blob = new Blob([JSON.stringify(failReport, null, 2)], { type: 'application/json' })
  downloadByBlob(blob, `fail-report-${batchResult.value.batchNo}.json`)
}

const handleClose = () => {
  visible.value = false
}

onMounted(() => {
  if (visible.value) {
    loadLimitInfo()
  }
})
</script>

<style lang="scss" scoped>
.permission-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef0f0;
  color: #f56c6c;
  border-radius: 4px;
  margin-bottom: 16px;

  .el-icon {
    font-size: 18px;
  }
}

.input-stage {
  .limit-info {
    margin-bottom: 16px;
  }

  .mode-tabs {
    margin-top: 16px;
  }

  .uploader-icon {
    font-size: 28px;
    color: #909399;
  }

  .uploader-text {
    color: #909399;
    font-size: 14px;
    margin-top: 8px;

    em {
      color: #409eff;
      font-style: normal;
    }
  }

  .uploader-tip {
    color: #909399;
    font-size: 12px;
    margin-top: 8px;
    line-height: 1.5;

    .template-link {
      color: #409eff;
      margin-left: 8px;
    }
  }

  .manual-input {
    padding: 16px 0;

    .count-tip {
      margin-left: 12px;
      color: #909399;
      font-size: 13px;
    }

    .manual-note-list {
      margin-top: 16px;
      max-height: 320px;
      overflow-y: auto;
    }

    .manual-note-item {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-bottom: 12px;

      .item-index {
        font-size: 13px;
        font-weight: 600;
        color: #606266;
        margin-bottom: 8px;
      }

      .note-input {
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }

  .error-message {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #f56c6c;
    font-size: 13px;
    padding: 8px 12px;
    background: #fef0f0;
    border-radius: 4px;
    margin-top: 12px;

    .el-icon {
      font-size: 14px;
    }
  }
}

.processing-stage {
  .progress-section {
    margin-bottom: 20px;

    .progress-label {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
      font-weight: 500;
    }
  }

  .stats-counters {
    display: flex;
    gap: 24px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 4px;
    margin-bottom: 20px;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;

      .stat-icon {
        font-size: 16px;
      }

      .stat-label {
        color: #606266;
      }

      .stat-value {
        font-weight: 600;
        font-size: 16px;
      }

      &.success .stat-value {
        color: #67c23a;
      }

      &.fail .stat-value {
        color: #f56c6c;
      }

      &.pending .stat-value {
        color: #909399;
      }
    }
  }

  .fail-list {
    .fail-list-title {
      font-size: 14px;
      font-weight: 600;
      color: #606266;
      margin-bottom: 12px;
    }

    .fail-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #fef0f0;
      border-radius: 4px;
      margin-bottom: 8px;

      .fail-index {
        font-size: 13px;
        font-weight: 500;
        color: #606266;
        min-width: 60px;
      }

      .fail-error {
        font-size: 13px;
        color: #f56c6c;
        flex: 1;
      }
    }
  }
}

.result-stage {
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .summary-card {
      text-align: center;

      :deep(.el-card__body) {
        padding: 16px;
      }

      .card-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 8px;
      }

      .card-value {
        font-size: 28px;
        font-weight: 700;
      }

      &.total .card-value {
        color: #409eff;
      }

      &.success .card-value {
        color: #67c23a;
      }

      &.fail .card-value {
        color: #f56c6c;
      }
    }
  }

  .result-fail-section {
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: #606266;
      }

      .section-actions {
        display: flex;
        gap: 8px;
      }
    }

    .fail-items {
      max-height: 280px;
      overflow-y: auto;
    }

    .fail-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: #fef0f0;
      border-radius: 4px;
      margin-bottom: 8px;

      .fail-item-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;

        .fail-item-index {
          font-size: 13px;
          font-weight: 500;
          color: #606266;
        }

        .fail-item-error {
          font-size: 13px;
          color: #f56c6c;
        }
      }
    }
  }

  .all-success {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 0;

    .success-icon {
      font-size: 48px;
      color: #67c23a;
      margin-bottom: 16px;
    }

    .success-text {
      font-size: 16px;
      font-weight: 500;
      color: #606266;
    }
  }
}

.data-skeleton {
  .skeleton-row {
    height: 40px;
    background: linear-gradient(90deg, #f0f2f5 25%, #e6e8eb 37%, #f0f2f5 63%);
    background-size: 400% 100%;
    animation: skeleton-loading 1.4s ease infinite;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  @keyframes skeleton-loading {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }
}

.mb-20 {
  margin-bottom: 20px;
}
</style>
