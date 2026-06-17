<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量导入行情数据"
    width="960px"
    :close-on-click-modal="!importing"
    @close="handleClose"
  >
    <div class="import-container">
      <div class="template-download-bar">
        <div class="download-tip">
          <el-icon class="tip-icon"><InfoFilled /></el-icon>
          <span>请先下载标准模板，按格式填写数据后再上传导入</span>
        </div>
        <el-button
          type="primary"
          plain
          :icon="Download"
          :loading="downloadingTemplate"
          @click="handleDownloadTemplate"
        >
          下载录入模板
        </el-button>
      </div>

      <div v-if="!importResult" class="upload-section">
        <el-upload
          ref="uploadRef"
          class="upload-dragger"
          drag
          :auto-upload="false"
          :show-file-list="true"
          :limit="1"
          accept=".csv,.xlsx,.xls"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :disabled="importing"
        >
          <div class="upload-inner" :class="{ 'upload-loading': importing }">
            <div v-if="!importing" class="upload-icon-wrapper">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
            </div>
            <div v-else class="upload-loading-ring">
              <el-progress type="circle" :percentage="progress.percent" :width="80" :stroke-width="6" />
            </div>
            <div class="upload-text">
              <p class="upload-title">
                {{ importing ? `导入中... ${progress.percent}%` : '将文件拖到此处，或点击上传' }}
              </p>
              <p v-if="!importing" class="upload-hint">支持 .csv / .xlsx / .xls 格式，单次最多 1000 条</p>
              <p v-if="importing" class="upload-progress-text">
                已处理 {{ progress.current }} / {{ progress.total }} 条
              </p>
            </div>
          </div>
          <template #tip>
            <div class="upload-tip-box">
              <el-tag type="info" size="small" effect="plain">CSV UTF-8 编码推荐</el-tag>
            </div>
          </template>
        </el-upload>

        <div v-if="previewData.length > 0" class="preview-section">
          <div class="preview-header">
            <span class="preview-title">数据预览（前 {{ previewData.length }} 条）</span>
            <el-tag type="primary" size="small">{{ totalRows }} 条记录</el-tag>
          </div>
          <el-table :data="previewData" border size="small" max-height="240" stripe>
            <el-table-column
              v-for="col in previewColumns"
              :key="col"
              :prop="col"
              :label="col"
              :min-width="110"
              show-overflow-tooltip
            />
          </el-table>
        </div>

        <div class="import-actions">
          <el-button
            type="primary"
            size="large"
            :icon="Check"
            :disabled="!selectedFile || importing"
            :loading="importing"
            @click="handleStartImport"
          >
            {{ importing ? '正在导入...' : '开始导入' }}
          </el-button>
        </div>
      </div>

      <div v-if="importResult" class="result-section">
        <div v-if="importResult.summary.success === 0" class="full-error-alert">
          <el-alert
            type="error"
            show-icon
            :closable="false"
            title="全部数据导入失败，请检查文件格式和内容"
            description="所有数据均未通过校验，请修正后重新上传"
          />
        </div>

        <el-row :gutter="16" class="stats-cards">
          <el-col :span="6">
            <div class="stat-card stat-total">
              <div class="stat-label">总数</div>
              <div class="stat-value">{{ importResult.summary.total }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card stat-success">
              <div class="stat-label">成功</div>
              <div class="stat-value">{{ importResult.summary.success }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card stat-failed">
              <div class="stat-label">失败</div>
              <div class="stat-value">{{ importResult.summary.failed }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card stat-duplicate">
              <div class="stat-label">重复</div>
              <div class="stat-value">{{ importResult.summary.duplicates }}</div>
            </div>
          </el-col>
        </el-row>

        <div class="avg-time-bar">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="任务ID">
              <code>{{ importResult.taskId }}</code>
            </el-descriptions-item>
            <el-descriptions-item label="平均耗时">
              {{ avgTimePerRecord }} ms / 条
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-collapse class="detail-collapse">
          <el-collapse-item title="点击查看明细" name="detail">
            <el-tabs v-model="detailTab" type="card">
              <el-tab-pane label="成功数据" name="success" :disabled="importResult.successList.length === 0">
                <el-table
                  v-if="importResult.successList.length > 0"
                  :data="importResult.successList"
                  border
                  size="small"
                  max-height="320"
                >
                  <el-table-column label="序号" type="index" width="60" />
                  <el-table-column
                    v-for="col in successColumns"
                    :key="col"
                    :prop="col"
                    :label="col"
                    :min-width="110"
                    show-overflow-tooltip
                  />
                </el-table>
                <el-empty v-else description="暂无成功数据" />
              </el-tab-pane>

              <el-tab-pane label="错误数据" name="error" :disabled="importResult.errorList.length === 0">
                <el-alert
                  v-if="importResult.summary.success === 0"
                  type="error"
                  :closable="false"
                  show-icon
                  class="error-summary-alert"
                  style="margin-bottom: 12px"
                >
                  <template #title>
                    <span>全部异常：共 {{ importResult.errorList.length }} 条错误数据</span>
                  </template>
                </el-alert>
                <el-table
                  v-if="importResult.errorList.length > 0"
                  :data="importResult.errorList"
                  border
                  size="small"
                  max-height="320"
                  :row-class-name="getErrorRowClass"
                >
                  <el-table-column label="行号" prop="row" width="70" align="center" />
                  <el-table-column label="数据内容" min-width="200" show-overflow-tooltip>
                    <template #default="{ row }">
                      <span class="data-preview-text">{{ formatDataPreview(row.data) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="错误类型" width="110" align="center">
                    <template #default="{ row }">
                      <el-tag v-if="row.type === 'format'" type="danger" size="small" effect="dark">
                        格式错误
                      </el-tag>
                      <el-tag v-else-if="row.type === 'duplicate'" type="warning" size="small" effect="dark">
                        重复
                      </el-tag>
                      <el-tag v-else type="danger" size="small">
                        逻辑错误
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="错误信息" prop="message" min-width="200" show-overflow-tooltip />
                </el-table>
                <el-empty v-else description="暂无错误数据" />
              </el-tab-pane>

              <el-tab-pane label="重复数据" name="duplicate" :disabled="importResult.duplicateList.length === 0">
                <el-table
                  v-if="importResult.duplicateList.length > 0"
                  :data="importResult.duplicateList"
                  border
                  size="small"
                  max-height="320"
                >
                  <el-table-column label="序号" type="index" width="60" />
                  <el-table-column
                    v-for="col in duplicateColumns"
                    :key="col"
                    :prop="col"
                    :label="col"
                    :min-width="110"
                    show-overflow-tooltip
                  />
                </el-table>
                <el-empty v-else description="暂无重复数据" />
              </el-tab-pane>
            </el-tabs>
          </el-collapse-item>
        </el-collapse>

        <div class="result-actions">
          <el-button @click="handleReset">重新上传</el-button>
          <el-button v-if="importResult.summary.success > 0" type="primary" @click="handleConfirmDone">
            确认完成
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type UploadInstance, type UploadFile } from 'element-plus'
import {
  Download,
  UploadFilled,
  Check,
  InfoFilled,
} from '@element-plus/icons-vue'
import * as stockApi from '@/api/stockQuote'
import type { IQuoteImportResult, IImportProgress } from '@/types/api'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [result: IQuoteImportResult]
  refresh: []
}>()

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

const uploadRef = ref<UploadInstance>()
const downloadingTemplate = ref(false)
const importing = ref(false)
const selectedFile = ref<UploadFile | null>(null)
const totalRows = ref(0)
const previewData = ref<any[]>([])
const previewColumns = ref<string[]>([])
const importResult = ref<IQuoteImportResult | null>(null)
const detailTab = ref('error')

const progress = reactive<IImportProgress>({
  taskId: '',
  percent: 0,
  current: 0,
  total: 0,
  status: 'pending',
  message: '',
})

const successColumns = computed(() => {
  if (importResult.value?.successList?.[0]) {
    return Object.keys(importResult.value.successList[0]).slice(0, 8)
  }
  return ['stockCode', 'stockName', 'currentPrice', 'tradeDate']
})

const duplicateColumns = computed(() => {
  if (importResult.value?.duplicateList?.[0]) {
    return Object.keys(importResult.value.duplicateList[0]).slice(0, 8)
  }
  return ['stockCode', 'stockName', 'tradeDate']
})

const avgTimePerRecord = computed(() => {
  if (!importResult.value) return 0
  const { total, elapsedMs } = importResult.value.summary
  if (total === 0) return 0
  return Math.round(elapsedMs / total)
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      handleReset()
    }
  },
)

function handleClose() {
  if (importing.value) return
  dialogVisible.value = false
}

function handleReset() {
  selectedFile.value = null
  totalRows.value = 0
  previewData.value = []
  previewColumns.value = []
  importResult.value = null
  detailTab.value = 'error'
  Object.assign(progress, {
    taskId: '',
    percent: 0,
    current: 0,
    total: 0,
    status: 'pending',
    message: '',
  })
  uploadRef.value?.clearFiles()
}

async function handleDownloadTemplate() {
  downloadingTemplate.value = true
  try {
    const data = await stockApi.downloadTemplate()
    const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date()
    const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`
    link.href = url
    link.download = `行情录入模板_${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (e) {
    console.error('下载模板失败:', e)
    ElMessage.error('模板下载失败')
  } finally {
    downloadingTemplate.value = false
  }
}

function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let curLine: string[] = []
  let curVal = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          curVal += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        curVal += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        curLine.push(curVal)
        curVal = ''
      } else if (ch === '\r') {
        continue
      } else if (ch === '\n') {
        curLine.push(curVal)
        lines.push(curLine)
        curLine = []
        curVal = ''
      } else {
        curVal += ch
      }
    }
  }

  if (curVal.length > 0 || curLine.length > 0) {
    curLine.push(curVal)
    lines.push(curLine)
  }

  return lines.filter((l) => l.length > 0 && l.some((c) => c.trim().length > 0))
}

async function handleFileChange(file: UploadFile) {
  selectedFile.value = file
  const raw = file.raw
  if (!raw) return

  try {
    const text = await raw.text()
    const rows = parseCSV(text)
    if (rows.length < 2) {
      ElMessage.warning('文件内容为空或缺少数据行')
      return
    }
    const headers = rows[0].map((h) => h.trim())
    const dataRows = rows.slice(1)
    totalRows.value = dataRows.length
    previewColumns.value = headers.slice(0, 8)
    previewData.value = dataRows.slice(0, 5).map((row) => {
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => {
        obj[h] = row[i] ?? ''
      })
      return obj
    })
  } catch (e) {
    console.error('解析文件失败:', e)
    ElMessage.error('文件解析失败，请检查格式')
  }
}

function handleFileRemove() {
  selectedFile.value = null
  previewData.value = []
  previewColumns.value = []
  totalRows.value = 0
}

function simulateProgress(taskId: string, total: number) {
  progress.taskId = taskId
  progress.total = total
  progress.status = 'processing'
  let current = 0
  const timer = setInterval(() => {
    const step = Math.max(1, Math.floor(total / 20))
    current = Math.min(current + step, total)
    progress.current = current
    progress.percent = Math.round((current / total) * 100)
    if (current >= total) {
      clearInterval(timer)
    }
  }, 150)
  return timer
}

async function handleStartImport() {
  if (!selectedFile.value?.raw) return

  importing.value = true
  const formData = new FormData()
  formData.append('file', selectedFile.value.raw)

  const mockTotal = totalRows.value || 100
  const taskId = `IMP_${Date.now()}`
  const progressTimer = simulateProgress(taskId, mockTotal)

  try {
    const res = await stockApi.batchImport(formData)
    clearInterval(progressTimer)
    progress.percent = 100
    progress.current = progress.total
    progress.status = 'success'
    importResult.value = res.data

    if (res.data.summary.success > 0) {
      ElMessage.success(`导入完成：成功 ${res.data.summary.success} 条`)
      emit('refresh')
    } else if (res.data.summary.failed > 0) {
      ElMessage.warning('导入完成，但全部数据校验失败')
    }

    emit('success', res.data)
  } catch (e: any) {
    clearInterval(progressTimer)
    progress.status = 'failed'
    progress.message = e?.message || '导入失败'
    ElMessage.error(progress.message || '导入失败，请稍后重试')
  } finally {
    setTimeout(() => {
      importing.value = false
    }, 300)
  }
}

function getErrorRowClass({ row }: { row: any }): string {
  if (row.type === 'format') return 'row-format-error'
  if (row.type === 'duplicate') return 'row-duplicate-error'
  return 'row-logic-error'
}

function formatDataPreview(data: any): string {
  if (!data) return '--'
  if (typeof data === 'string') return data
  try {
    return JSON.stringify(data)
  } catch {
    return String(data)
  }
}

function handleConfirmDone() {
  dialogVisible.value = false
  handleReset()
}
</script>

<style lang="scss" scoped>
.import-container {
  .template-download-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    background: #ecf5ff;
    border: 1px solid #d9ecff;
    border-radius: 8px;
    margin-bottom: 20px;

    .download-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #409eff;
      font-size: 13px;

      .tip-icon {
        font-size: 18px;
      }
    }
  }

  .upload-section {
    .upload-dragger {
      :deep(.el-upload-dragger) {
        padding: 30px 20px;
        background: #fafbfc;
        border: 2px dashed #dcdfe6;
        border-radius: 12px;
        transition: all 0.3s;

        &:hover {
          border-color: #1A3A5C;
          background: #f0f7ff;
        }
      }

      .upload-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;

        &.upload-loading {
          .upload-text {
            .upload-title {
              color: #1A3A5C;
              font-weight: 600;
            }
          }
        }
      }

      .upload-icon-wrapper {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: linear-gradient(135deg, #e8f3ff 0%, #f0e8ff 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: bounce-soft 2s infinite ease-in-out;
      }

      .upload-icon {
        font-size: 36px;
        color: #1A3A5C;
      }

      .upload-loading-ring {
        width: 80px;
        height: 80px;
      }

      .upload-text {
        text-align: center;

        .upload-title {
          font-size: 15px;
          color: #606266;
          margin: 0 0 6px 0;
          font-weight: 500;
        }

        .upload-hint {
          font-size: 12px;
          color: #909399;
          margin: 0;
        }

        .upload-progress-text {
          font-size: 13px;
          color: #1A3A5C;
          font-weight: 500;
          margin: 4px 0 0 0;
        }
      }
    }

    .upload-tip-box {
      text-align: center;
      margin-top: 8px;
    }
  }

  .preview-section {
    margin-top: 20px;
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background: #fafbfc;

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .preview-title {
        font-size: 13px;
        font-weight: 500;
        color: #606266;
      }
    }
  }

  .import-actions {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }

  .result-section {
    .full-error-alert {
      margin-bottom: 20px;
    }

    .stats-cards {
      margin-bottom: 16px;

      .stat-card {
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        border: 1px solid;

        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        &.stat-total {
          background: #f4f4f5;
          border-color: #e9e9eb;
          .stat-value { color: #606266; }
        }

        &.stat-success {
          background: #f0f9eb;
          border-color: #e1f3d8;
          .stat-value { color: #67c23a; }
        }

        &.stat-failed {
          background: #fef0f0;
          border-color: #fde2e2;
          .stat-value { color: #f56c6c; }
        }

        &.stat-duplicate {
          background: #fdf6ec;
          border-color: #faecd8;
          .stat-value { color: #e6a23c; }
        }
      }
    }

    .avg-time-bar {
      margin-bottom: 16px;

      code {
        background: #f5f7fa;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 12px;
        color: #1A3A5C;
      }
    }

    .detail-collapse {
      margin-bottom: 16px;

      :deep(.el-collapse-item__header) {
        font-weight: 500;
      }
    }

    .error-summary-alert {
      :deep(.el-alert__title) {
        font-weight: 600;
      }
    }

    .data-preview-text {
      font-size: 12px;
      color: #606266;
      font-family: monospace;
    }

    .result-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 16px;
    }
  }
}

:deep(.el-table) {
  .row-format-error {
    background-color: #fef0f0 !important;
    & .el-table__cell { background-color: #fef0f0 !important; }
  }
  .row-duplicate-error {
    background-color: #fdf6ec !important;
    & .el-table__cell { background-color: #fdf6ec !important; }
  }
  .row-logic-error {
    background-color: #fef0f0 !important;
    & .el-table__cell { background-color: #fef0f0 !important; }
  }
}

@keyframes bounce-soft {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
</style>
