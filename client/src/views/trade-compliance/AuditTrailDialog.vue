<template>
  <FinDialog
    v-model:visible="dialogVisible"
    :title="'审核溯源 - ' + auditNo"
    width="800px"
    :hide-footer="true"
  >
    <div v-loading="loading" class="audit-trail">
      <div v-if="logs.length === 0" class="empty-trail">暂无审核日志</div>

      <el-timeline v-else>
        <el-timeline-item
          v-for="log in logs"
          :key="log.id"
          :timestamp="formatDate(log.createdAt, 'YYYY-MM-DD HH:mm:ss')"
          :color="getActionColor(log.action)"
          placement="top"
        >
          <el-card shadow="hover" class="log-card" :class="{ 'violation-card': log.violationIntercepted }">
            <div class="log-header">
              <span
                class="action-badge"
                :style="{ backgroundColor: getActionColor(log.action) + '18', color: getActionColor(log.action) }"
              >
                {{ getActionLabel(log.action) }}
              </span>
              <span class="operator">{{ log.operatorName || '系统' }}</span>
              <el-tag
                v-if="log.violationIntercepted"
                type="danger"
                effect="dark"
                size="small"
                class="violation-tag"
              >
                已拦截
              </el-tag>
            </div>

            <div v-if="log.detail && Object.keys(log.detail).length > 0" class="log-detail">
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item
                  v-for="(value, key) in getDisplayDetail(log.detail)"
                  :key="key"
                  :label="getDetailLabel(key as string)"
                >
                  {{ formatDetailValue(value) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div v-if="log.consistencyCheck" class="consistency-section">
              <el-tooltip placement="top" :show-after="300">
                <template #content>
                  <div class="consistency-tooltip">
                    <div>一致性评分: {{ log.consistencyCheck.score }}分</div>
                    <div>状态: {{ log.consistencyCheck.passed ? '通过' : '未通过' }}</div>
                    <div v-if="log.consistencyCheck.issues && log.consistencyCheck.issues.length > 0">
                      <div style="margin-top: 4px; font-weight: 600;">问题列表:</div>
                      <div v-for="(issue, idx) in log.consistencyCheck.issues" :key="idx" style="margin-top: 2px;">
                        [{{ issue.severity }}] {{ issue.field }}: {{ issue.message }}
                        <div v-if="issue.suggestion" style="color: #409EFF;">建议: {{ issue.suggestion }}</div>
                      </div>
                    </div>
                  </div>
                </template>
                <div class="consistency-badge" :class="log.consistencyCheck.passed ? 'passed' : 'failed'">
                  <el-icon><CircleCheckFilled v-if="log.consistencyCheck.passed" /><CircleCloseFilled v-else /></el-icon>
                  一致性: {{ log.consistencyCheck.score }}分
                </div>
              </el-tooltip>
            </div>

            <div v-if="log.violationIntercepted && log.violationMessage" class="violation-message">
              <el-alert type="error" :closable="false" :title="log.violationMessage" show-icon />
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { formatDate } from '@/utils/format'
import { AUDIT_LOG_ACTION_LABELS, AUDIT_LOG_ACTION_COLORS } from '@/constants/dictionaries'
import { AuditLogAction } from '@/enums'
import { getTradeComplianceLogs } from '@/api/tradeCompliance'
import type { ITradeComplianceAuditLog } from '@/types/api'

const props = defineProps<{
  visible: boolean
  auditId: number
  auditNo: string
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const logs = ref<ITradeComplianceAuditLog[]>([])

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val && props.auditId) {
    loadLogs()
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

async function loadLogs() {
  loading.value = true
  try {
    const res = await getTradeComplianceLogs(props.auditId)
    if (res.code === 0) {
      logs.value = res.data
    }
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

function getActionLabel(action: string): string {
  return AUDIT_LOG_ACTION_LABELS[action as AuditLogAction] || action
}

function getActionColor(action: string): string {
  return AUDIT_LOG_ACTION_COLORS[action as AuditLogAction] || '#909399'
}

function getDisplayDetail(detail: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {}
  for (const [key, value] of Object.entries(detail)) {
    if (typeof value !== 'object' || value === null) {
      filtered[key] = value
    } else if (Array.isArray(value) && value.length <= 5) {
      filtered[key] = value.join(', ')
    } else {
      filtered[key] = JSON.stringify(value)
    }
  }
  return filtered
}

function getDetailLabel(key: string): string {
  const labels: Record<string, string> = {
    opinion: '审核意见',
    fromStatus: '原状态',
    violationTypes: '违规类型',
    violationReasons: '违规原因',
    category: '风险分类',
    reviewType: '审核方式',
    autoDecision: '自动决策',
    message: '消息',
    attemptedAction: '尝试操作',
  }
  return labels[key] || key
}

function formatDetailValue(value: any): string {
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (value === null || value === undefined) return '-'
  return String(value)
}
</script>

<style lang="scss" scoped>
.audit-trail {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;

  .empty-trail {
    text-align: center;
    color: var(--fin-text-secondary);
    padding: 40px 0;
  }

  .log-card {
    margin-bottom: 4px;

    &.violation-card {
      border-left: 3px solid #D93025;
    }

    .log-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .action-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
      }

      .operator {
        font-size: 12px;
        color: var(--fin-text-secondary);
      }

      .violation-tag {
        margin-left: auto;
      }
    }

    .log-detail {
      margin-bottom: 8px;
    }

    .consistency-section {
      margin-top: 8px;

      .consistency-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 10px;
        border-radius: 10px;
        font-size: 12px;
        cursor: pointer;

        &.passed {
          background: rgba(39, 174, 96, 0.12);
          color: #27AE60;
        }

        &.failed {
          background: rgba(192, 57, 43, 0.12);
          color: #C0392B;
        }
      }
    }

    .violation-message {
      margin-top: 8px;
    }
  }
}

.consistency-tooltip {
  max-width: 350px;
  font-size: 12px;
  line-height: 1.6;
}
</style>
