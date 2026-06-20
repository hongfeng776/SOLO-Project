<template>
  <el-dialog
    v-model="dialogVisible"
    title="资质审核溯源"
    width="600px"
    class="fade-in-dialog"
    @open="handleOpen"
  >
    <div v-loading="loading" class="trail-content">
      <div v-if="logs.length === 0" class="empty-state">
        <el-empty description="暂无审核记录" />
      </div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="(log, idx) in logs"
          :key="log.id || idx"
          :timestamp="formatDate(log.createdAt)"
          :color="getActionColor(log.action)"
          placement="top"
        >
          <div class="timeline-card qual-card">
            <div class="card-header">
              <el-tag :color="getActionColor(log.action)" effect="dark" size="small">
                {{ getActionLabel(log.action) }}
              </el-tag>
              <span class="operator">{{ log.operatorName }}</span>
            </div>
            <div class="card-detail">
              <div v-if="log.detail?.opinion" class="detail-item">
                <span class="detail-label">审核意见：</span>
                <span class="detail-value">{{ log.detail.opinion }}</span>
              </div>
              <div v-if="log.detail?.grantPermissions" class="detail-item">
                <span class="detail-label">授予权限：</span>
                <span class="detail-value">{{ log.detail.grantPermissions.join('、') }}</span>
              </div>
              <div v-if="log.detail?.issueTypes && log.detail.issueTypes.length > 0" class="detail-item">
                <span class="detail-label">问题类型：</span>
                <el-tag
                  v-for="t in log.detail.issueTypes"
                  :key="t" size="small" effect="light"
                  :style="{ borderColor: getIssueTypeColor(t), color: getIssueTypeColor(t) }"
                  style="margin-right: 4px;"
                >{{ getIssueTypeLabel(t) }}</el-tag>
              </div>
              <div v-if="log.detail?.rejectReasons && log.detail.rejectReasons.length > 0" class="detail-item">
                <span class="detail-label">具体原因：</span>
                <span class="detail-value">{{ log.detail.rejectReasons.join('；') }}</span>
              </div>
              <div v-if="log.detail?.message" class="detail-item">
                <span class="detail-label">系统提示：</span>
                <span class="detail-value" :class="log.detail.message.includes('过期') || log.detail.message.includes('关闭') ? 'text-danger' : ''">{{ log.detail.message }}</span>
              </div>
              <div v-if="log.detail?.previousStatus" class="detail-item">
                <span class="detail-label">原状态：</span>
                <span class="detail-value">{{ getStatusLabel(log.detail.previousStatus) }} → {{ getStatusLabel(log.detail.fromStatus || log.detail.opinion ? 'pending' : '') || '待审核' }}</span>
              </div>
            </div>

            <div v-if="log.authenticityCheck" class="authenticity-section">
              <el-tooltip
                effect="dark"
                placement="right"
                :show-after="300"
              >
                <template #content>
                  <div class="auth-tooltip">
                    <div class="auth-title">真实性校验报告</div>
                    <div class="auth-row">综合得分：<strong :class="log.authenticityCheck.passed ? 'text-success' : 'text-danger'">{{ log.authenticityCheck.score }}</strong></div>
                    <div class="auth-row">校验结果：<strong :class="log.authenticityCheck.passed ? 'text-success' : 'text-danger'">{{ log.authenticityCheck.passed ? '通过' : '未通过' }}</strong></div>
                    <div v-if="log.authenticityCheck.issues && log.authenticityCheck.issues.length > 0" class="auth-issues">
                      <div class="auth-issues-title">问题详情：</div>
                      <div v-for="(issue, i) in log.authenticityCheck.issues" :key="i" class="auth-issue">
                        <div>文档：{{ getDocLabel(issue.document) }}</div>
                        <div>规则：{{ issue.rule }}</div>
                        <div>问题：{{ issue.message }}</div>
                        <div class="auth-issue-suggestion">建议：{{ issue.suggestion }}</div>
                      </div>
                    </div>
                  </div>
                </template>
                <el-tag size="small" :type="log.authenticityCheck.passed ? 'success' : 'danger'" effect="plain" class="auth-badge">
                  <el-icon><View /></el-icon>
                  真实性校验 {{ log.authenticityCheck.score }}分
                </el-tag>
              </el-tooltip>
            </div>

            <el-alert
              v-if="log.fakeIntercepted"
              type="error"
              :closable="false"
              show-icon
              class="intercept-alert"
            >
              <template #title>
                <span>造假拦截：{{ log.interceptMessage || '疑似虚假资质，已拦截审核操作' }}</span>
              </template>
            </el-alert>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { View } from '@element-plus/icons-vue'
import { getCustomerQualificationLogs } from '@/api/customerQualification'
import {
  QUALIFICATION_LOG_ACTION_LABELS,
  QUALIFICATION_LOG_ACTION_COLORS,
  QUALIFICATION_ISSUE_TYPE_LABELS,
  QUALIFICATION_ISSUE_TYPE_COLORS,
  QUALIFICATION_STATUS_LABELS,
  QUALIFICATION_DOCUMENT_TYPE_LABELS,
} from '@/constants/dictionaries'
import type { ICustomerQualificationLog } from '@/types/api'

const props = defineProps<{ modelValue: boolean; qualificationId: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const logs = ref<ICustomerQualificationLog[]>([])

function getActionLabel(action: string) { return (QUALIFICATION_LOG_ACTION_LABELS as any)[action] || action }
function getActionColor(action: string) { return (QUALIFICATION_LOG_ACTION_COLORS as any)[action] || '#95A5A6' }
function getIssueTypeLabel(t: string) { return (QUALIFICATION_ISSUE_TYPE_LABELS as any)[t] || t }
function getIssueTypeColor(t: string) { return (QUALIFICATION_ISSUE_TYPE_COLORS as any)[t] || '#95A5A6' }
function getStatusLabel(s: string) { return s ? ((QUALIFICATION_STATUS_LABELS as any)[s] || s) : '' }
function getDocLabel(t: string) { return (QUALIFICATION_DOCUMENT_TYPE_LABELS as any)[t] || t }

function formatDate(d: any) {
  if (!d) return ''
  const date = new Date(d)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

async function handleOpen() {
  if (!props.qualificationId) return
  loading.value = true
  try {
    const res: any = await getCustomerQualificationLogs(props.qualificationId)
    logs.value = res.data || []
  } catch (e) {
    logs.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.trail-content {
  min-height: 300px;
  .timeline-card {
    padding: 14px;
    border-radius: 8px;
    background: #FAFBFD;
    border-left: 3px solid var(--fin-primary, #3498DB);
    transition: all 0.3s ease;
    &:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      background: #fff;
    }
  }
  .card-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
    .operator { font-size: 12px; color: #7F8C8D; }
  }
  .card-detail {
    .detail-item { font-size: 13px; line-height: 1.8;
      .detail-label { color: #7F8C8D; }
      .detail-value { color: #2C3E50; }
    }
  }
  .authenticity-section { margin-top: 10px; }
  .intercept-alert { margin-top: 10px; }
  .text-danger { color: #C0392B; font-weight: 600; }
  .text-success { color: #27AE60; font-weight: 600; }
}
.auth-tooltip {
  max-width: 340px; padding: 4px;
  .auth-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 6px; }
  .auth-row { font-size: 12px; line-height: 1.8; display: flex; justify-content: space-between; gap: 12px; }
  .auth-issues { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2); }
  .auth-issues-title { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
  .auth-issue { font-size: 11px; line-height: 1.6; background: rgba(255,255,255,0.08); padding: 6px 8px; border-radius: 4px; margin-bottom: 4px;
    .auth-issue-suggestion { color: #F39C12; margin-top: 2px; }
  }
}
.qual-card:hover { transform: scale(1.02) translateY(-2px); }
</style>
