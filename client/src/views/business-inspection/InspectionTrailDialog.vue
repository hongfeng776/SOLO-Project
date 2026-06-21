<template>
  <el-dialog
    v-model="dialogVisible"
    title="巡检溯源"
    width="700px"
    class="fade-in-dialog"
    @open="handleOpen"
  >
    <div v-loading="loading" class="trail-content">
      <div v-if="logs.length === 0" class="empty-state">
        <el-empty description="暂无巡检日志" />
      </div>

      <el-timeline v-else>
        <el-timeline-item
          v-for="(log, idx) in logs"
          :key="log.id || idx"
          :timestamp="formatDate(log.createdAt, 'YYYY-MM-DD HH:mm:ss')"
          :color="getActionColor(log.action)"
          placement="top"
        >
          <div class="trail-card" :class="{ 'intercept-card': isInterceptAction(log.action) }">
            <div class="card-header">
              <span
                class="action-badge"
                :style="{ backgroundColor: getActionColor(log.action) + '18', color: getActionColor(log.action) }"
              >
                {{ getActionLabel(log.action) }}
              </span>
              <span class="operator">{{ log.operatorName || '系统' }}</span>
            </div>

            <div v-if="log.detail && Object.keys(log.detail).length > 0" class="card-detail">
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

            <div v-if="log.coverageCheck" class="check-section">
              <el-tooltip placement="top" :show-after="300">
                <template #content>
                  <div class="check-tooltip">
                    <div class="check-tooltip-title">覆盖完整性校验</div>
                    <div class="check-tooltip-row">评分：<strong>{{ formatNumber(log.coverageCheck.score) }}</strong> 分</div>
                    <div class="check-tooltip-row">结果：<strong :class="log.coverageCheck.passed ? 'text-success' : 'text-danger'">{{ log.coverageCheck.passed ? '通过' : '未通过' }}</strong></div>
                    <div v-if="log.coverageCheck.issues && log.coverageCheck.issues.length > 0" class="check-tooltip-issues">
                      <div class="check-tooltip-issues-title">问题列表：</div>
                      <div v-for="(issue, i) in log.coverageCheck.issues" :key="i" class="check-tooltip-issue">{{ issue }}</div>
                    </div>
                  </div>
                </template>
                <div class="check-badge" :class="log.coverageCheck.passed ? 'passed' : 'failed'">
                  <el-icon><CircleCheckFilled v-if="log.coverageCheck.passed" /><CircleCloseFilled v-else /></el-icon>
                  覆盖率: {{ formatNumber(log.coverageCheck.score) }}分
                </div>
              </el-tooltip>
            </div>

            <div v-if="log.accuracyCheck" class="check-section">
              <el-tooltip placement="top" :show-after="300">
                <template #content>
                  <div class="check-tooltip">
                    <div class="check-tooltip-title">判定准确性校验</div>
                    <div class="check-tooltip-row">评分：<strong>{{ formatNumber(log.accuracyCheck.score) }}</strong> 分</div>
                    <div class="check-tooltip-row">结果：<strong :class="log.accuracyCheck.passed ? 'text-success' : 'text-danger'">{{ log.accuracyCheck.passed ? '通过' : '未通过' }}</strong></div>
                    <div v-if="log.accuracyCheck.issues && log.accuracyCheck.issues.length > 0" class="check-tooltip-issues">
                      <div class="check-tooltip-issues-title">问题列表：</div>
                      <div v-for="(issue, i) in log.accuracyCheck.issues" :key="i" class="check-tooltip-issue">{{ issue }}</div>
                    </div>
                  </div>
                </template>
                <div class="check-badge" :class="log.accuracyCheck.passed ? 'passed' : 'failed'">
                  <el-icon><CircleCheckFilled v-if="log.accuracyCheck.passed" /><CircleCloseFilled v-else /></el-icon>
                  准确率: {{ formatNumber(log.accuracyCheck.score) }}分
                </div>
              </el-tooltip>
            </div>

            <el-alert
              v-if="isInterceptAction(log.action)"
              type="error"
              :closable="false"
              show-icon
              class="intercept-alert"
            >
              <template #title>
                <span>{{ getInterceptTitle(log.action) }}：{{ log.interceptMessage || '检测到异常，已自动拦截' }}</span>
              </template>
            </el-alert>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { getBusinessInspectionLogs } from '@/api/businessInspection'
import { INSPECTION_LOG_ACTION_LABELS, INSPECTION_LOG_ACTION_COLORS } from '@/constants/dictionaries'
import { InspectionLogAction } from '@/enums'
import { formatDate } from '@/utils/format'
import type { IBusinessInspectionLog } from '@/types/api'

const props = defineProps<{ modelValue: boolean; inspectionId: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const loading = ref(false)
const logs = ref<IBusinessInspectionLog[]>([])

function getActionLabel(action: string): string {
  return (INSPECTION_LOG_ACTION_LABELS as any)[action] || action
}

function getActionColor(action: string): string {
  return (INSPECTION_LOG_ACTION_COLORS as any)[action] || '#95A5A6'
}

function isInterceptAction(action: string): boolean {
  return [
    InspectionLogAction.MISS_INTERCEPT,
    InspectionLogAction.FALSE_POSITIVE_INTERCEPT,
    InspectionLogAction.FAKE_RECTIFY_INTERCEPT,
  ].includes(action as InspectionLogAction)
}

function getInterceptTitle(action: string): string {
  const titles: Record<string, string> = {
    [InspectionLogAction.MISS_INTERCEPT]: '漏检拦截',
    [InspectionLogAction.FALSE_POSITIVE_INTERCEPT]: '误检拦截',
    [InspectionLogAction.FAKE_RECTIFY_INTERCEPT]: '虚假整改拦截',
  }
  return titles[action] || '拦截告警'
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
    totalCount: '问题总数',
    successCount: '成功数',
    fromStatus: '原状态',
    canStart: '是否可启动',
    permissionValid: '权限校验',
    cycleValid: '周期校验',
    scopeValid: '范围校验',
    action: '操作类型',
    processNote: '处理说明',
    message: '消息',
  }
  return labels[key] || key
}

function formatDetailValue(value: any): string {
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (value === null || value === undefined) return '-'
  return String(value)
}

function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN')
}

async function handleOpen() {
  if (!props.inspectionId) return
  loading.value = true
  try {
    const res = await getBusinessInspectionLogs(props.inspectionId)
    if (res.code === 0) {
      logs.value = res.data
    }
  } catch {
    logs.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.trail-content {
  min-height: 300px;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;

  .empty-state {
    text-align: center;
    padding: 40px 0;
  }

  .trail-card {
    padding: 14px;
    border-radius: 8px;
    background: #FAFBFD;
    border-left: 3px solid var(--fin-primary, #3498DB);
    transition: all 0.3s ease;

    &:hover {
      transform: scale(1.02) translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      background: #fff;
    }

    &.intercept-card {
      border-left-color: #D93025;
      border: 1px solid rgba(217, 48, 37, 0.3);
      border-left: 3px solid #D93025;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;

      .action-badge {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 500;
      }

      .operator {
        font-size: 12px;
        color: #7F8C8D;
      }
    }

    .card-detail {
      margin-bottom: 8px;
    }

    .check-section {
      margin-top: 8px;

      .check-badge {
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

    .intercept-alert {
      margin-top: 10px;
    }
  }
}

.check-tooltip {
  max-width: 350px;
  font-size: 12px;
  line-height: 1.6;

  .check-tooltip-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 6px;
  }

  .check-tooltip-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    line-height: 1.8;
  }

  .check-tooltip-issues {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
  }

  .check-tooltip-issues-title {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .check-tooltip-issue {
    background: rgba(255, 255, 255, 0.08);
    padding: 4px 8px;
    border-radius: 4px;
    margin-bottom: 4px;
  }
}

.text-danger {
  color: #C0392B;
  font-weight: 600;
}

.text-success {
  color: #27AE60;
  font-weight: 600;
}
</style>
