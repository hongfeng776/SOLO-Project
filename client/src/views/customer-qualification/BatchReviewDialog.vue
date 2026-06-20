<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量资质审核"
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
      <el-alert v-if="preview?.blockReasons && preview.blockReasons.length > 0" type="warning" :closable="false" show-icon>
        <template #title>
          <div>以下 {{ preview.blockReasons.length }} 条记录存在问题，将无法批量通过：</div>
          <div v-for="b in preview.blockReasons.slice(0, 5)" :key="b.id" class="block-item">
            · {{ b.qualificationNo }} - {{ b.customerName }}：{{ b.reason }}
          </div>
          <div v-if="preview.blockReasons.length > 5">...还有 {{ preview.blockReasons.length - 5 }} 条</div>
        </template>
      </el-alert>

      <div class="preview-section">
        <h4>分布预览（共 {{ preview?.totalCount || 0 }} 条）</h4>
        <div class="preview-grid">
          <div class="preview-card">
            <div class="preview-card-title">按客户类型</div>
            <div class="preview-list">
              <div v-for="(count, type) in preview?.byCustomerType" :key="type" class="preview-item">
                <span>{{ type === 'institution' ? '机构客户' : '个人客户' }}</span>
                <strong>{{ count }}</strong>
              </div>
            </div>
          </div>
          <div class="preview-card">
            <div class="preview-card-title">按资质等级</div>
            <div class="preview-list">
              <div v-for="(count, level) in preview?.byQualificationLevel" :key="level" class="preview-item">
                <span>{{ getLevelLabel(level as string) }}</span>
                <strong>{{ count }}</strong>
              </div>
            </div>
          </div>
          <div class="preview-card">
            <div class="preview-card-title">按入网年份</div>
            <div class="preview-list">
              <div v-for="(count, year) in preview?.byRegistrationYear" :key="year" class="preview-item">
                <span>{{ year }}年</span>
                <strong>{{ count }}</strong>
              </div>
            </div>
          </div>
        </div>
        <div class="preview-summary">
          <el-tag type="success" effect="light">可简易通过：{{ preview?.simpleApprovableCount || 0 }}</el-tag>
          <el-tag type="warning" effect="light">存在问题：{{ preview?.blockReasons?.length || 0 }}</el-tag>
        </div>
      </div>

      <el-divider />

      <el-form :model="form" label-width="100px">
        <el-form-item label="批量操作" required>
          <el-radio-group v-model="form.action">
            <el-radio value="approve">批量通过</el-radio>
            <el-radio value="reject">批量驳回</el-radio>
            <el-radio value="initiate_recheck">批量发起复核</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.action === 'approve'" label="资质等级">
          <el-select v-model="form.qualificationLevel" class="full-width">
            <el-option v-for="(label, key) in QUALIFICATION_LEVEL_LABELS" :key="key" :label="label" :value="key" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.action === 'reject'" label="问题类型">
          <el-checkbox-group v-model="form.issueTypes">
            <el-checkbox v-for="(label, key) in QUALIFICATION_ISSUE_TYPE_LABELS" :key="key" :value="key" :label="key">{{ label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item v-if="form.action !== 'initiate_recheck'" label="审核意见">
          <el-input v-model="form.reviewOpinion" type="textarea" :rows="2" class="focus-highlight-input" />
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
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { batchPreviewCustomerQualification, batchOperationCustomerQualification } from '@/api/customerQualification'
import { QualificationLevel } from '@/enums'
import { QUALIFICATION_LEVEL_LABELS, QUALIFICATION_ISSUE_TYPE_LABELS } from '@/constants/dictionaries'
import type { IQualificationBatchPreview } from '@/types/api'

const props = defineProps<{ modelValue: boolean; selectedIds: number[] }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; success: [] }>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

import { computed } from 'vue'

const loading = ref(false)
const submitLoading = ref(false)
const previewLoaded = ref(false)
const preview = ref<IQualificationBatchPreview | null>(null)
const progressPercent = ref(0)
const progressText = ref('加载预览数据...')

const form = reactive({
  action: 'approve' as 'approve' | 'reject' | 'initiate_recheck',
  qualificationLevel: QualificationLevel.STANDARD,
  issueTypes: [] as string[],
  reviewOpinion: '',
})

function getLevelLabel(level: string) {
  return (QUALIFICATION_LEVEL_LABELS as any)[level] || level
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
    const res: any = await batchPreviewCustomerQualification(props.selectedIds)
    preview.value = res.data
    progressPercent.value = 100
    previewLoaded.value = true
    progressText.value = '预览加载完成'
  } catch (e: any) {
    ElMessage.error(e.message || '加载预览失败')
  } finally {
    clearInterval(timer)
    setTimeout(() => { loading.value = false }, 300)
  }
}

async function handleSubmit() {
  if (!preview.value) return
  const blockCount = preview.value.blockReasons?.length || 0
  const totalCount = preview.value.totalCount
  const willProcess = totalCount - (form.action === 'approve' ? blockCount : 0)

  const actionText = form.action === 'approve' ? '批量通过' : form.action === 'reject' ? '批量驳回' : '批量发起复核'

  try {
    await ElMessageBox.confirm(
      `确认对 ${willProcess} 条资质记录执行"${actionText}"操作？${form.action === 'approve' && blockCount > 0 ? `（${blockCount}条存在问题将自动跳过）` : ''}`,
      '二次确认',
      { type: 'warning' },
    )
  } catch (e) { return }

  if (form.action === 'reject' && form.issueTypes.length === 0) {
    ElMessage.warning('请至少选择一个问题类型')
    return
  }

  submitLoading.value = true
  try {
    const payload: any = {
      ids: props.selectedIds,
      action: form.action,
    }
    if (form.action === 'approve') {
      payload.qualificationLevel = form.qualificationLevel
      payload.reviewOpinion = form.reviewOpinion
    } else if (form.action === 'reject') {
      payload.issueTypes = form.issueTypes
      payload.rejectReasons = form.reviewOpinion ? form.reviewOpinion.split(/[;；]/).map(s => s.trim()).filter(Boolean) : []
      payload.reviewOpinion = form.reviewOpinion
    } else {
      payload.reviewOpinion = '批量发起资质复核'
    }
    const res: any = await batchOperationCustomerQualification(payload)
    ElMessage.success(`${actionText}完成：成功${res.data.successCount}条，失败${res.data.total - res.data.successCount}条`)
    dialogVisible.value = false
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '批量操作失败')
  } finally {
    submitLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.loading-mask {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 40px 0; gap: 16px;
  .loading-text { font-size: 14px; color: #7F8C8D; }
}
.preview-section {
  h4 { margin: 0 0 12px; font-size: 14px; color: #2C3E50; }
  .preview-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 12px;
  }
  .preview-card {
    padding: 12px; background: #FAFBFD; border-radius: 8px;
    .preview-card-title { font-size: 12px; color: #7F8C8D; margin-bottom: 8px; }
    .preview-list { display: flex; flex-direction: column; gap: 4px; }
    .preview-item { display: flex; justify-content: space-between; font-size: 13px;
      strong { color: var(--fin-primary, #3498DB); }
    }
  }
  .preview-summary { display: flex; gap: 10px; }
}
.block-item { font-size: 12px; line-height: 1.8; color: #C0392B; }
.full-width { width: 100%; }
</style>
