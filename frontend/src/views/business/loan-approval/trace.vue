<template>
  <div class="ccb-loan-approval-trace">
    <CcbPageHeader
      title="审批溯源"
      description="通过贷款流水号溯源多级审批全流程记录，校验意见一致性，检测违规操作"
      icon="DataAnalysis"
    />

    <el-card class="search-card" shadow="never">
      <el-form :model="queryForm" inline label-width="100px">
        <el-form-item label="贷款编号">
          <el-input v-model="queryForm.loan_no" placeholder="请输入贷款编号" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="贷款ID">
          <el-input v-model="queryForm.loan_id" placeholder="请输入贷款ID" clearable style="width: 240px" />
        </el-form-item>
        <el-form-item label="查询时间段">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="doTrace" :loading="loading">
            溯源查询
          </el-button>
          <el-button :icon="Refresh" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="traceResult" class="trace-content">
      <el-row :gutter="16" class="summary-section">
        <el-col :span="8">
          <div class="summary-card">
            <div class="summary-icon"><el-icon><DocumentCopy /></el-icon></div>
            <div class="summary-info">
              <div class="summary-label">审批总次数</div>
              <div class="summary-value">{{ traceResult.total_approval_count }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="summary-card" :class="traceResult.consistency_check.passed ? 'success' : 'error'">
            <div class="summary-icon">
              <el-icon><CircleCheck v-if="traceResult.consistency_check.passed" /><Warning v-else /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-label">意见一致性校验</div>
              <div class="summary-value">
                {{ traceResult.consistency_check.passed ? '通过' : '不通过' }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="summary-card" :class="!traceResult.violation_check.has_violation ? 'success' : 'error'">
            <div class="summary-icon">
              <el-icon><CircleCheck v-if="!traceResult.violation_check.has_violation" /><CircleClose v-else /></el-icon>
            </div>
            <div class="summary-info">
              <div class="summary-label">违规检测</div>
              <div class="summary-value">
                {{ traceResult.violation_check.has_violation ? '发现异常' : '正常' }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="violation-section">
        <el-col :span="12">
          <el-alert
            v-if="traceResult.consistency_check.inconsistent_items.length > 0"
            title="审批意见不一致"
            type="warning"
            show-icon
            :closable="false"
          >
            <ul class="violation-list">
              <li v-for="(item, i) in traceResult.consistency_check.inconsistent_items" :key="i">
                {{ item }}
              </li>
            </ul>
          </el-alert>
        </el-col>
        <el-col :span="12">
          <el-alert
            v-if="traceResult.violation_check.has_violation"
            title="检测到违规操作"
            type="error"
            show-icon
            :closable="false"
          >
            <ul class="violation-list">
              <li v-for="(item, i) in traceResult.violation_check.unauthorized_approvals" :key="'u' + i">
                <el-tag type="danger" size="small" effect="dark">越权</el-tag>
                {{ item }}
              </li>
              <li v-for="(item, i) in traceResult.violation_check.illegal_approvals" :key="'i' + i">
                <el-tag type="danger" size="small" effect="dark">违规</el-tag>
                {{ item }}
              </li>
              <li v-for="(item, i) in traceResult.violation_check.conflict_approvals" :key="'c' + i">
                <el-tag type="warning" size="small" effect="dark">冲突</el-tag>
                {{ item }}
              </li>
            </ul>
          </el-alert>
        </el-col>
      </el-row>

      <el-card class="flow-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">审批流程记录</span>
            <el-tag size="small" type="info">贷款编号：{{ traceResult.loan_no }}</el-tag>
          </div>
        </template>

        <el-steps
          direction="vertical"
          :active="traceResult.approval_flow_records.filter(f => f.status >= 2).length"
          finish-status="success"
          class="flow-steps"
        >
          <el-step
            v-for="flow in traceResult.approval_flow_records"
            :key="flow.id"
            :title="flow.current_level_text"
            :status="getFlowStatus(flow)"
          >
            <template #description>
              <div class="step-detail">
                <div v-if="flow.approver_name" class="approver-info">
                  <span class="label">审批人：</span>
                  <span class="value">{{ flow.approver_name }}</span>
                  <span class="time">{{ flow.approve_time }}</span>
                </div>
                <div v-else class="approver-info pending">
                  等待审批...
                </div>
                <div v-if="flow.approval_result" class="result-info">
                  <el-tag
                    :type="getResultType(flow.approval_result)"
                    size="small"
                  >
                    {{ getResultLabel(flow.approval_result) }}
                  </el-tag>
                </div>
                <div v-if="flow.approval_opinion" class="opinion-info">
                  <span class="label">意见：</span>
                  <span class="value">{{ flow.approval_opinion }}</span>
                </div>
                <div v-if="flow.reject_reason" class="reject-info">
                  <el-tag type="danger" size="small">驳回原因</el-tag>
                  {{ flow.reject_reason }}
                </div>
              </div>
            </template>
          </el-step>
        </el-steps>
      </el-card>

      <el-card class="log-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="title">操作日志明细</span>
            <div class="header-right">
              <el-tag v-if="traceResult.operation_log_complete" type="success" size="small">
                日志完整
              </el-tag>
              <el-tag v-else type="danger" size="small">
                存在缺失日志
              </el-tag>
              <el-button type="primary" size="small" :icon="View" @click="showAllLogs">
                查看完整日志
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="traceResult.missing_logs.length > 0" class="missing-logs">
          <el-alert
            type="warning"
            show-icon
            :closable="false"
            title="检测到操作日志缺失"
          >
            <p>缺失日志环节：{{ traceResult.missing_logs.join('、') }}</p>
          </el-alert>
        </div>

        <el-timeline class="log-timeline">
          <el-timeline-item
            v-for="log in traceResult.approval_log_records"
            :key="log.id"
            :timestamp="log.operation_time"
            :type="getLogType(log)"
            :hollow="log.conflict_flag === 1"
          >
            <div class="log-card-item" :class="{ 'has-conflict': log.conflict_flag === 1 }">
              <div class="log-header">
                <span class="log-operator">{{ log.operator_name }}</span>
                <el-tag size="small" type="primary">{{ log.approval_level_text }}</el-tag>
                <span class="log-action" :class="getLogActionClass(log)">
                  {{ getLogActionLabel(log) }}
                </span>
                <el-tag
                  v-if="log.unauthorized_flag === 1"
                  type="danger"
                  size="small"
                  effect="dark"
                >
                  越权操作
                </el-tag>
                <el-tag
                  v-if="log.illegal_flag === 1"
                  type="danger"
                  size="small"
                  effect="dark"
                >
                  违规操作
                </el-tag>
                <el-tag
                  v-if="log.conflict_flag === 1"
                  type="warning"
                  size="small"
                  effect="dark"
                >
                  意见冲突
                </el-tag>
              </div>
              <div v-if="log.approval_opinion" class="log-opinion">
                <span class="label">审批意见：</span>
                {{ log.approval_opinion }}
              </div>
              <div v-if="log.reject_reason" class="log-reject">
                <span class="label">驳回原因：</span>
                {{ log.reject_reason }}
              </div>
              <div v-if="log.conflict_reason" class="log-conflict">
                <el-icon><Warning /></el-icon>
                <span>{{ log.conflict_reason }}</span>
              </div>
              <div class="log-meta">
                <span>IP：{{ log.ip_address || '-' }}</span>
                <span>风险等级：{{ log.risk_level_before || '-' }} → {{ log.risk_level_after || '-' }}</span>
                <span>一致性：{{ getConsistencyLabel(log.consistency_check) }}</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <el-empty
      v-else-if="!loading && hasSearched"
      description="请输入贷款编号或ID进行溯源查询"
    >
      <template #image>
        <el-icon :size="80" color="#c0c4cc"><Search /></el-icon>
      </template>
    </el-empty>

    <el-dialog
      v-model="showLogDialog"
      title="完整操作日志详情"
      width="900px"
    >
      <el-table
        v-if="traceResult"
        :data="traceResult.approval_log_records"
        border
        stripe
        size="small"
      >
        <el-table-column prop="approval_level_text" label="审批级" width="100" />
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column prop="operation_type" label="操作类型" width="100" />
        <el-table-column prop="from_status_text" label="原状态" width="100" />
        <el-table-column prop="to_status_text" label="新状态" width="100" />
        <el-table-column prop="approval_result_text" label="审批结果" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.approval_result" :type="getResultType(row.approval_result)" size="small">
              {{ row.approval_result_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approval_opinion" label="审批意见" min-width="150" show-overflow-tooltip />
        <el-table-column prop="reject_reason" label="驳回原因" width="120" show-overflow-tooltip />
        <el-table-column prop="ip_address" label="IP地址" width="120" />
        <el-table-column prop="operation_time" label="操作时间" width="160" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  DocumentCopy,
  CircleCheck,
  CircleClose,
  Warning,
  DataAnalysis,
  View
} from '@element-plus/icons-vue'
import {
  APPROVAL_STATUS_OPTIONS,
  type ApprovalTraceRequest,
  type ApprovalTraceResult,
  type ApprovalFlowVO,
  type ApprovalLogVO,
  traceApprovalApi
} from '@api/loanApproval'

const route = useRoute()

const loading = ref(false)
const hasSearched = ref(false)
const traceResult = ref<ApprovalTraceResult | null>(null)
const showLogDialog = ref(false)

const queryForm = reactive<ApprovalTraceRequest>({
  loan_id: '',
  loan_no: '',
  start_time: '',
  end_time: ''
})

const dateRange = ref<string[]>([])

async function doTrace() {
  if (!queryForm.loan_id && !queryForm.loan_no) {
    ElMessage.warning('请输入贷款编号或贷款ID')
    return
  }

  if (dateRange.value && dateRange.value.length === 2) {
    queryForm.start_time = dateRange.value[0]
    queryForm.end_time = dateRange.value[1]
  }

  loading.value = true
  hasSearched.value = true
  try {
    traceResult.value = await traceApprovalApi(queryForm)

    if (traceResult.value.violation_check.has_violation) {
      ElMessage.warning('检测到违规审批操作，请查看详情')
    }

    if (traceResult.value.consistency_check.inconsistent_items.length > 0) {
      ElMessage.warning('检测到审批意见不一致，请查看详情')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '溯源查询失败')
    traceResult.value = null
  } finally {
    loading.value = false
  }
}

function resetForm() {
  queryForm.loan_id = ''
  queryForm.loan_no = ''
  queryForm.start_time = ''
  queryForm.end_time = ''
  dateRange.value = []
  traceResult.value = null
  hasSearched.value = false
}

function getFlowStatus(flow: ApprovalFlowVO): string {
  if (flow.status === 7) return 'success'
  if (flow.status === 3) return 'error'
  if (flow.is_current_level) return 'process'
  if (flow.status >= 2) return 'success'
  return ''
}

function getResultType(result: number): string {
  if (result === 1) return 'success'
  if (result === 2) return 'danger'
  return 'info'
}

function getResultLabel(result: number): string {
  const item = APPROVAL_STATUS_OPTIONS.find(opt => opt.value === result + 1)
  return item?.label || '未知'
}

function getLogType(log: ApprovalLogVO): string {
  if (log.approval_result === 1) return 'success'
  if (log.approval_result === 2) return 'danger'
  if (log.unauthorized_flag === 1 || log.illegal_flag === 1 || log.conflict_flag === 1) return 'warning'
  return 'primary'
}

function getLogActionLabel(log: ApprovalLogVO): string {
  if (log.approval_result === 1) return '审批通过'
  if (log.approval_result === 2) return '审批驳回'
  return log.operation_type || '操作'
}

function getLogActionClass(log: ApprovalLogVO): string {
  if (log.approval_result === 1) return 'action-pass'
  if (log.approval_result === 2) return 'action-reject'
  return ''
}

function getConsistencyLabel(check?: number): string {
  if (check === 1) return '一致'
  if (check === 0) return '不一致'
  return '-'
}

function showAllLogs() {
  showLogDialog.value = true
}

onMounted(() => {
  if (route.query.loan_id) {
    queryForm.loan_id = route.query.loan_id as string
    doTrace()
  }
  if (route.query.loan_no) {
    queryForm.loan_no = route.query.loan_no as string
  }
})
</script>

<style lang="scss" scoped>
.ccb-loan-approval-trace {
  .search-card {
    margin-bottom: 20px;
  }

  .summary-section {
    margin-bottom: 20px;

    .summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);

      &.success {
        border-color: #67c23a;
        background: rgba(103, 194, 58, 0.05);
      }

      &.error {
        border-color: #f56c6c;
        background: rgba(245, 108, 108, 0.05);
      }

      .summary-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;
      }

      &.success .summary-icon {
        background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
      }

      &.error .summary-icon {
        background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
      }

      .summary-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }

      .summary-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin-top: 4px;

        .success & { color: #67c23a; }
        .error & { color: #f56c6c; }
      }
    }
  }

  .violation-section {
    margin-bottom: 20px;

    .violation-list {
      margin: 10px 0 0 0;
      padding-left: 20px;

      li {
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-weight: 600;
      font-size: 15px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .flow-card {
    margin-bottom: 20px;

    .flow-steps {
      padding: 20px 10px;

      :deep(.el-step__line) {
        top: 24px;
      }

      .step-detail {
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        margin-top: 8px;

        .approver-info {
          margin-bottom: 8px;
          color: var(--el-text-color-secondary);

          &.pending {
            color: #909399;
            font-style: italic;
          }

          .label {
            color: var(--el-text-color-secondary);
          }

          .value {
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .time {
            margin-left: 12px;
            color: #909399;
            font-size: 12px;
          }
        }

        .result-info {
          margin-bottom: 8px;
        }

        .opinion-info,
        .reject-info {
          margin-bottom: 4px;
          font-size: 13px;

          .label {
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .log-card {
    .missing-logs {
      margin-bottom: 20px;
    }

    .log-timeline {
      padding: 10px 0;

      .log-card-item {
        padding: 16px;
        background: #f8f9fa;
        border-radius: 8px;
        border-left: 3px solid var(--el-color-primary);

        &.has-conflict {
          border-left-color: var(--el-color-warning);
          background: rgba(230, 162, 60, 0.05);
        }

        .log-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;

          .log-operator {
            font-weight: 600;
            color: var(--el-text-color-primary);
          }

          .log-action {
            font-weight: 600;
            font-size: 14px;

            &.action-pass { color: #67c23a; }
            &.action-reject { color: #f56c6c; }
          }
        }

        .log-opinion,
        .log-reject {
          font-size: 13px;
          margin-bottom: 6px;
          color: var(--el-text-color-regular);

          .label {
            color: var(--el-text-color-secondary);
          }
        }

        .log-conflict {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(230, 162, 60, 0.1);
          border-radius: 4px;
          color: #e6a23c;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .log-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          color: #909399;
          padding-top: 8px;
          border-top: 1px dashed var(--el-border-color-lighter);
        }
      }
    }
  }
}
</style>
