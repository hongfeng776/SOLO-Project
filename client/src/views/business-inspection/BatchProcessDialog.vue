<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量处理巡检问题"
    width="640px"
    class="fade-in-dialog"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <div v-if="loading" class="loading-mask">
      <el-progress type="circle" :percentage="progressPercent" :status="previewLoaded ? 'success' : undefined" />
      <div class="loading-text">{{ progressText }}</div>
    </div>
    <div v-else>
      <el-alert
        v-if="preview?.blockReasons && preview.blockReasons.length > 0"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #title>
          <div>以下 {{ preview.blockReasons.length }} 条问题已处理，将被跳过：</div>
          <div v-for="b in preview.blockReasons.slice(0, 5)" :key="b.id" class="block-item">
            · {{ b.issueNo }}：{{ b.reason }}
          </div>
          <div v-if="preview.blockReasons.length > 5">...还有 {{ preview.blockReasons.length - 5 }} 条</div>
        </template>
      </el-alert>

      <div class="preview-section">
        <h4>分布预览（共 {{ preview?.totalCount || 0 }} 条）</h4>
        <div class="preview-grid">
          <div class="preview-card">
            <div class="preview-card-title">按违规等级</div>
            <div class="preview-list">
              <div v-for="(count, level) in preview?.byViolationLevel" :key="level" class="preview-item">
                <span>{{ getViolationLevelLabel(level as string) }}</span>
                <strong>{{ count }}</strong>
              </div>
            </div>
          </div>
          <div class="preview-card">
            <div class="preview-card-title">按巡检范围</div>
            <div class="preview-list">
              <div v-for="(count, scope) in preview?.byScope" :key="scope" class="preview-item">
                <span>{{ getScopeLabel(scope as string) }}</span>
                <strong>{{ count }}</strong>
              </div>
            </div>
          </div>
          <div class="preview-card">
            <div class="preview-card-title">按问题状态</div>
            <div class="preview-list">
              <div v-for="(count, status) in preview?.byIssueStatus" :key="status" class="preview-item">
                <span>{{ getStatusLabel(status as string) }}</span>
                <strong>{{ count }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-divider />

      <el-form :model="form" label-width="100px">
        <el-form-item label="处理方式" required>
          <el-radio-group v-model="form.action">
            <el-radio v-for="(label, key) in ISSUE_PROCESS_ACTION_LABELS" :key="key" :value="key">
              {{ label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.action === IssueProcessAction.RECTIFY" label="处理说明" required>
          <el-input
            v-model="form.processNote"
            type="textarea"
            :rows="2"
            placeholder="请输入整改说明"
          />
        </el-form-item>
        <el-form-item v-if="form.action === IssueProcessAction.RECTIFY" label="整改证据">
          <el-input
            v-model="form.rectifyEvidence"
            placeholder="选填，可输入整改证据链接或说明"
          />
        </el-form-item>
        <el-form-item v-if="form.action !== IssueProcessAction.RECTIFY" label="处理说明">
          <el-input
            v-model="form.processNote"
            type="textarea"
            :rows="2"
            placeholder="选填，可输入处理说明"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认执行</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { batchPreviewIssues, batchProcessIssues } from '@/api/businessInspection'
import { ViolationLevel, InspectionScope, IssueStatus, IssueProcessAction } from '@/enums'
import {
  VIOLATION_LEVEL_LABELS,
  INSPECTION_SCOPE_LABELS,
  ISSUE_STATUS_LABELS,
  ISSUE_PROCESS_ACTION_LABELS,
} from '@/constants/dictionaries'
import type { IIssueBatchPreview } from '@/types/api'

const props = defineProps<{ modelValue: boolean; selectedIds: number[] }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; success: [] }>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const submitLoading = ref(false)
const previewLoaded = ref(false)
const preview = ref<IIssueBatchPreview | null>(null)
const progressPercent = ref(0)
const progressText = ref('加载预览数据...')

const form = reactive({
  action: IssueProcessAction.RECTIFY as IssueProcessAction,
  processNote: '',
  rectifyEvidence: '',
})

function getViolationLevelLabel(level: string) {
  return (VIOLATION_LEVEL_LABELS as any)[level] || level
}

function getScopeLabel(scope: string) {
  return (INSPECTION_SCOPE_LABELS as any)[scope] || scope
}

function getStatusLabel(status: string) {
  return (ISSUE_STATUS_LABELS as any)[status] || status
}

async function handleOpen() {
  if (props.selectedIds.length === 0) return
  loading.value = true
  previewLoaded.value = false
  progressPercent.value = 0
  progressText.value = '加载预览数据...'

  const timer = setInterval(() => {
    if (progressPercent.value < 80) progressPercent.value += 10
  }, 100)

  try {
    const res = await batchPreviewIssues(props.selectedIds)
    if (res.code === 0) {
      preview.value = res.data
      progressPercent.value = 100
      previewLoaded.value = true
      progressText.value = '预览加载完成'
    }
  } catch (e: any) {
    ElMessage.error(e.message || '加载预览失败')
  } finally {
    clearInterval(timer)
    setTimeout(() => { loading.value = false }, 300)
  }
}

async function handleSubmit() {
  if (!preview.value) return

  if (form.action === IssueProcessAction.RECTIFY && !form.processNote.trim()) {
    ElMessage.warning('整改处理需填写处理说明')
    return
  }

  const actionText = ISSUE_PROCESS_ACTION_LABELS[form.action]
  const blockCount = preview.value.blockReasons?.length || 0

  try {
    await ElMessageBox.confirm(
      `确认对 ${props.selectedIds.length} 条问题执行"${actionText}"操作？${blockCount > 0 ? `（${blockCount}条已处理将自动跳过）` : '此操作不可撤销。'}`,
      '二次确认',
      { type: 'warning' },
    )
  } catch {
    return
  }

  submitLoading.value = true
  try {
    const res = await batchProcessIssues({
      ids: props.selectedIds,
      action: form.action,
      processNote: form.processNote || undefined,
      rectifyEvidence: form.rectifyEvidence || undefined,
    })
    if (res.code === 0) {
      const data = res.data as any
      ElMessage.success(`${actionText}完成：成功${data.successCount}条，失败${data.total - data.successCount}条`)
      dialogVisible.value = false
      emit('success')
    } else {
      ElMessage.error(res.message)
    }
  } catch {
    ElMessage.error('批量处理失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.loading-mask {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  gap: 16px;

  .loading-text {
    font-size: 14px;
    color: #7F8C8D;
  }
}

.preview-section {
  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    color: #2C3E50;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }

  .preview-card {
    padding: 12px;
    background: #FAFBFD;
    border-radius: 8px;

    .preview-card-title {
      font-size: 12px;
      color: #7F8C8D;
      margin-bottom: 8px;
    }

    .preview-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .preview-item {
      display: flex;
      justify-content: space-between;
      font-size: 13px;

      strong {
        color: var(--fin-primary, #3498DB);
      }
    }
  }
}

.block-item {
  font-size: 12px;
  line-height: 1.8;
  color: #C0392B;
}
</style>
